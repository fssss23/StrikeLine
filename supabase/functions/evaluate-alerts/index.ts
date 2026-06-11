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
  // Determine cooldown threshold time
  const cooldownMs = (rule.cooldown_minutes || 0) * 60 * 1000
  const cooldownThreshold = new Date(Date.now() - cooldownMs).toISOString()

  const { data: recentEvents, error: recentError } = await supabase
    .from('alert_events')
    .select('id')
    .eq('user_id', rule.user_id)
    .eq('symbol', rule.symbol)
    .eq('level_type', levelType)
    .gte('created_at', cooldownThreshold)
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
  // Insert a log into the alert_events table
  const { error: insertError } = await supabase.from('alert_events').insert({
    user_id: rule.user_id,
    rule_id: rule.id,
    symbol: rule.symbol,
    level_type: levelType,
    trigger_price: actualPrice,
    level_value: levelValue
  })

  if (insertError) {
    console.error('Error inserting alert event:', insertError)
    return
  }

  // Query user_profiles for notification preferences
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('whatsapp_enabled, whatsapp_number')
    .eq('id', rule.user_id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError)
    return
  }

  // 6. WhatsApp Dispatch
  if (profile.whatsapp_enabled && profile.whatsapp_number) {
    const fonnteToken = Deno.env.get('FONNTE_TOKEN')
    if (!fonnteToken) {
      console.error('FONNTE_TOKEN environment variable is missing')
      return
    }

    const formattedText = `⚡ StrikeLine Alert\n${rule.symbol} hit your ${levelType} level\nPrice: PKR ${actualPrice}\nLevel: PKR ${levelValue}`

    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fonnteToken}`,
          'Content-Type': 'application/json' // Specified per user requirements structure
        },
        body: JSON.stringify({
          target: profile.whatsapp_number,
          message: formattedText,
          countryCode: '92'
        })
      })

      const result = await response.json()
      if (!response.ok || !result.status) {
        console.error('Failed to send WhatsApp message via Fonnte:', result)
      } else {
        console.log(`WhatsApp message sent successfully to ${profile.whatsapp_number}`)
      }
    } catch (fetchError) {
      console.error('Error during WhatsApp fetch:', fetchError)
    }
  }
}
