import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // 1. Initialization
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Data Fetching
    // Query all rows from alert_rules where at least one level is enabled
    const { data: alertRules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .or('support_enabled.eq.true,resistance_enabled.eq.true,breakout_enabled.eq.true')

    if (rulesError) throw rulesError
    if (!alertRules || alertRules.length === 0) {
      return new Response(JSON.stringify({ status: 'ok', message: 'No active rules' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Extract unique symbols to query their latest prices
    const symbols = [...new Set(alertRules.map(r => r.symbol))]

    // Query the single latest price_ticks entry for each symbol
    // Order by scraped_at descending, then manually take the first one per symbol
    const { data: priceTicks, error: ticksError } = await supabase
      .from('price_ticks')
      .select('*')
      .in('symbol', symbols)
      .order('scraped_at', { ascending: false })

    if (ticksError) throw ticksError

    const latestPriceMap = new Map()
    for (const tick of priceTicks || []) {
      if (!latestPriceMap.has(tick.symbol)) {
        latestPriceMap.set(tick.symbol, tick)
      }
    }

    const processPromises = []

    // 3. Evaluation Logic
    for (const rule of alertRules) {
      const priceTick = latestPriceMap.get(rule.symbol)
      if (!priceTick) continue

      const actualPrice = priceTick.last_price
      const bufferPct = rule.buffer_pct || 0

      // Support: Trigger if actual_price <= level * (1 + buffer_pct / 100)
      if (rule.support_enabled && rule.support_level) {
        if (actualPrice <= rule.support_level * (1 + bufferPct / 100)) {
          processPromises.push(processAlert(supabase, rule, 'support', actualPrice, rule.support_level))
        }
      }

      // Resistance/Breakout: Trigger if actual_price >= level * (1 - buffer_pct / 100)
      if (rule.resistance_enabled && rule.resistance_level) {
        if (actualPrice >= rule.resistance_level * (1 - bufferPct / 100)) {
          processPromises.push(processAlert(supabase, rule, 'resistance', actualPrice, rule.resistance_level))
        }
      }

      if (rule.breakout_enabled && rule.breakout_level) {
        if (actualPrice >= rule.breakout_level * (1 - bufferPct / 100)) {
          processPromises.push(processAlert(supabase, rule, 'breakout', actualPrice, rule.breakout_level))
        }
      }
    }

    // Wait for all evaluations and notifications to complete
    await Promise.allSettled(processPromises)

    return new Response(JSON.stringify({ status: 'ok', processed: processPromises.length }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function processAlert(
  supabase: any,
  rule: any,
  levelType: string,
  actualPrice: number,
  levelValue: number
) {
  // 4. Cooldown Check
  // alert_events uses triggered_at (not created_at)
  const cooldownMs = (rule.cooldown_minutes || 0) * 60 * 1000
  const cooldownThreshold = new Date(Date.now() - cooldownMs).toISOString()

  const { data: recentEvents, error: recentError } = await supabase
    .from('alert_events')
    .select('id')
    .eq('user_id', rule.user_id)
    .eq('symbol', rule.symbol)
    .eq('level_type', levelType)
    .gte('triggered_at', cooldownThreshold)
    .limit(1)

  if (recentError) {
    console.error('Error checking cooldown:', recentError)
    return
  }

  // Skip if a recent event exists within the cooldown period
  if (recentEvents && recentEvents.length > 0) {
    return
  }

  // 5. Execution
  // Insert a log into alert_events — schema columns are
  // (user_id, symbol, level_type, level_value, actual_price, push_status, triggered_at)
  const { data: insertedEvent, error: insertError } = await supabase
    .from('alert_events')
    .insert({
      user_id: rule.user_id,
      symbol: rule.symbol,
      level_type: levelType,
      level_value: levelValue,
      actual_price: actualPrice,
      push_status: 'pending',
      triggered_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Error inserting alert event:', insertError)
    return
  }

  let pushStatus = 'skipped'
  // Outcome per attempted channel; 'skipped' means a channel wasn't enabled
  const outcomes: string[] = []

  // Query user_profiles for notification preferences
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('whatsapp_enabled, whatsapp_number, push_enabled, fcm_token')
    .eq('id', rule.user_id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError)
    pushStatus = 'failed'
  } else if (profile.whatsapp_enabled && profile.whatsapp_number) {
    // 6. WhatsApp Dispatch via Fonnte
    const fonnteToken = Deno.env.get('FONNTE_TOKEN')
    if (!fonnteToken) {
      console.error('FONNTE_TOKEN environment variable is missing')
      pushStatus = 'failed'
    } else {
      const formattedText = `⚡ StrikeLine Alert\n${rule.symbol} hit your ${levelType} level\nPrice: PKR ${actualPrice}\nLevel: PKR ${levelValue}`

      try {
        // Fonnte expects the raw token in Authorization (no "Bearer" prefix)
        // and a form-encoded body
        const body = new URLSearchParams({
          target: profile.whatsapp_number,
          message: formattedText,
          countryCode: '92'
        })

        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { 'Authorization': fonnteToken },
          body
        })

        const result = await response.json()
        if (!response.ok || result.status === false) {
          console.error('Failed to send WhatsApp message via Fonnte:', result)
          outcomes.push('failed')
        } else {
          console.log(`WhatsApp message sent successfully to ${profile.whatsapp_number}`)
          outcomes.push('sent')
        }
      } catch (fetchError) {
        console.error('Error during WhatsApp fetch:', fetchError)
        outcomes.push('failed')
      }
    }
  }

  // Web push via the send-push function (FCM); skipped silently when the user
  // has push disabled, no device token, or FIREBASE_SERVICE_ACCOUNT isn't set
  if (profile && profile.push_enabled && profile.fcm_token) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: rule.user_id,
          title: `⚡ ${rule.symbol} hit your ${levelType} level`,
          body: `Price: PKR ${actualPrice} · Level: PKR ${levelValue}`,
          data: { symbol: rule.symbol, level_type: levelType }
        })
      })
      const pushResult = await pushRes.json()
      if (pushResult.sent) {
        outcomes.push('sent')
      } else if (!pushResult.skipped) {
        console.error('Push dispatch failed:', pushResult.reason)
        outcomes.push('failed')
      }
    } catch (pushError) {
      console.error('Error invoking send-push:', pushError)
      outcomes.push('failed')
    }
  }

  // Final status: sent if any channel delivered, failed if all attempts failed,
  // skipped when no channel was enabled at all
  if (outcomes.includes('sent')) pushStatus = 'sent'
  else if (outcomes.includes('failed')) pushStatus = 'failed'

  // Record the final dispatch outcome on the event row
  const { error: statusError } = await supabase
    .from('alert_events')
    .update({ push_status: pushStatus })
    .eq('id', insertedEvent.id)

  if (statusError) {
    console.error('Error updating push_status:', statusError)
  }
}
