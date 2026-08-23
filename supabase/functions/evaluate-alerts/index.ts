// evaluate-alerts — the alert engine. Loads enabled alert_rules, reads the
// latest TWO fresh price ticks per symbol, and dispatches WhatsApp/push the
// moment a level is *crossed* — i.e. the price moves from one side of the
// level (± a fixed 1% buffer) to the other between consecutive ticks.
//
// Edge-triggered, not level-triggered: a price that merely *sits* below
// support (or above resistance) no longer re-fires every cooldown. This is the
// fix for the 09:15 open burst + the ~4h repeats — on the first tick of the
// session there is no prior fresh tick, so nothing crosses and nothing fires.
//
// Buffer (1%) and cooldown (90 min) are FIXED product-wide here; the old
// per-user / per-rule buffer_pct & cooldown_minutes columns are ignored.
//
// Normally chained by scrape-psx on fresh data, but it also self-guards so it
// is safe to schedule directly: it will NOT fire when the market is closed or
// when the latest tick is stale. Pass ?force=true to bypass both guards for
// manual testing.
//
// Global controls live in the `app_settings` table (managed from the admin
// panel via the admin-api function): `alerts_paused` halts everything and
// `whatsapp_enabled` is a global WhatsApp kill switch. All reads of the new
// admin tables/columns are defensive, so this deploys safely before the
// admin-setup.sql migration is run.
//
// Channels: WhatsApp (Fonnte), web push (send-push/FCM), email (Resend).
// Every channel is independently optional — a missing secret disables that
// channel and is logged once, never throwing.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// A tick older than this is considered stale and never triggers an alert.
// Active (watched/alerted) symbols tick every minute during market hours, so
// 15 minutes is comfortably fresh while still catching a scraper stall. It also
// gates the *previous* tick used for crossing detection: after a gap (overnight
// or a scraper stall) there is no fresh prior tick, so no false crossing fires.
const FRESH_MINUTES = 15

// Fixed alert behaviour (previously per-user/per-rule, now product-wide).
// BUFFER_PCT: an alert fires when the price comes within 1% of the level.
// COOLDOWN_MINUTES: the same user+symbol+level can't re-alert within 90 min
// (a debounce against the price wiggling right across the threshold).
const BUFFER_PCT = 1
const COOLDOWN_MINUTES = 90

function pktNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
}

// PSX hours (PKT): Mon–Thu 09:15–15:30; Friday trades two sessions around the
// Jumma break, 09:15–12:00 and 14:30–16:30. A small tail mirrors scrape-psx so
// the closing tick is still evaluated. Keep this in sync with scrape-psx.
function isMarketOpen(): boolean {
  const pkt = pktNow()
  const day = pkt.getDay()
  if (day === 0 || day === 6) return false
  const mins = pkt.getHours() * 60 + pkt.getMinutes()
  const open = 9 * 60 + 15
  if (day === 5) {
    return (mins >= open && mins <= 12 * 60 + 5) ||
           (mins >= 14 * 60 + 30 && mins <= 16 * 60 + 35)
  }
  return mins >= open && mins <= 15 * 60 + 35
}

Deno.serve(async (req) => {
  try {
    const force = new URL(req.url).searchParams.get('force') === 'true'

    // GUARD 1 — market hours. This is the fix for after-hours alert spam:
    // without it, every cooldown lapse re-fires the frozen closing price.
    if (!force && !isMarketOpen()) {
      return new Response(
        JSON.stringify({ status: 'skipped', reason: 'market_closed' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 1. Initialization
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Global controls (defensive — defaults keep alerts flowing if the
    // app_settings table doesn't exist yet)
    let alertsPaused = false
    let whatsappGloballyEnabled = true
    try {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['alerts_paused', 'whatsapp_enabled'])
      for (const s of settings || []) {
        if (s.key === 'alerts_paused') alertsPaused = s.value === true
        if (s.key === 'whatsapp_enabled') whatsappGloballyEnabled = s.value !== false
      }
    } catch (_err) {
      // table missing — keep defaults
    }

    // GUARD 2 — global pause kill switch (admin panel)
    if (alertsPaused && !force) {
      return new Response(
        JSON.stringify({ status: 'skipped', reason: 'alerts_paused' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Restricted users get no alerts at all (defensive: column may not exist yet)
    const restrictedUsers = new Set<string>()
    try {
      const { data: restricted } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('restricted', true)
      for (const r of restricted || []) restrictedUsers.add(r.id)
    } catch (_err) {
      // column missing — treat nobody as restricted
    }

    // 2. Data Fetching
    // Query all rows from alert_rules where at least one level is enabled
    const { data: alertRulesRaw, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .or('support_enabled.eq.true,resistance_enabled.eq.true,breakout_enabled.eq.true')

    if (rulesError) throw rulesError

    // Drop rules belonging to restricted users
    const alertRules = (alertRulesRaw || []).filter(r => !restrictedUsers.has(r.user_id))

    if (alertRules.length === 0) {
      return new Response(JSON.stringify({ status: 'ok', message: 'No active rules' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Extract unique symbols to query their latest prices
    const symbols = [...new Set(alertRules.map(r => r.symbol))]

    // GUARD 3 — tick freshness. Only consider ticks scraped recently so a stale
    // (e.g. closing) price can never trigger an alert even if this function is
    // somehow invoked off-hours.
    const freshThreshold = new Date(Date.now() - FRESH_MINUTES * 60 * 1000).toISOString()

    // Query the latest fresh price_ticks per symbol (order desc, first-wins)
    const { data: priceTicks, error: ticksError } = await supabase
      .from('price_ticks')
      .select('*')
      .in('symbol', symbols)
      .gte('scraped_at', force ? '1970-01-01' : freshThreshold)
      .order('scraped_at', { ascending: false })

    if (ticksError) throw ticksError

    // Keep the latest TWO fresh ticks per symbol (ordered desc → [current, previous]).
    // Crossing detection needs the prior price; one tick alone never fires.
    const ticksBySymbol = new Map<string, any[]>()
    for (const tick of priceTicks || []) {
      const arr = ticksBySymbol.get(tick.symbol)
      if (arr) {
        if (arr.length < 2) arr.push(tick)
      } else {
        ticksBySymbol.set(tick.symbol, [tick])
      }
    }

    const processPromises = []

    // 3. Evaluation Logic — edge-triggered (crossing). TWO tiers per level:
    //   • 'hit'      — price crosses the EXACT level. Always fires, even inside
    //                  the cooldown: the real event must never be swallowed by a
    //                  buffer/approach alert that fired moments earlier.
    //   • 'approach' — price crosses into the 1% buffer band around the level.
    //                  A softer heads-up, gated by the 90-min cooldown.
    // When a single tick clears both (price jumps straight past the level), only
    // the 'hit' fires.
    for (const rule of alertRules) {
      const ticks = ticksBySymbol.get(rule.symbol)
      // Need two fresh ticks to know the price actually *crossed* (vs. opening
      // the session already on the wrong side — the old 09:15 burst).
      if (!ticks || ticks.length < 2) continue

      const curr = ticks[0].last_price
      const prev = ticks[1].last_price
      if (curr == null || prev == null) continue

      // Support: price falling toward the level from above
      if (rule.support_enabled && rule.support_level) {
        const exact = rule.support_level
        const band = exact * (1 + BUFFER_PCT / 100)
        if (prev > exact && curr <= exact) {
          processPromises.push(processAlert(supabase, rule, 'support', 'hit', curr, exact, whatsappGloballyEnabled))
        } else if (prev > band && curr <= band) {
          processPromises.push(processAlert(supabase, rule, 'support', 'approach', curr, exact, whatsappGloballyEnabled))
        }
      }

      // Resistance: price rising toward the level from below
      if (rule.resistance_enabled && rule.resistance_level) {
        const exact = rule.resistance_level
        const band = exact * (1 - BUFFER_PCT / 100)
        if (prev < exact && curr >= exact) {
          processPromises.push(processAlert(supabase, rule, 'resistance', 'hit', curr, exact, whatsappGloballyEnabled))
        } else if (prev < band && curr >= band) {
          processPromises.push(processAlert(supabase, rule, 'resistance', 'approach', curr, exact, whatsappGloballyEnabled))
        }
      }

      // Breakout: price rising through the breakout level from below
      if (rule.breakout_enabled && rule.breakout_level) {
        const exact = rule.breakout_level
        const band = exact * (1 - BUFFER_PCT / 100)
        if (prev < exact && curr >= exact) {
          processPromises.push(processAlert(supabase, rule, 'breakout', 'hit', curr, exact, whatsappGloballyEnabled))
        } else if (prev < band && curr >= band) {
          processPromises.push(processAlert(supabase, rule, 'breakout', 'approach', curr, exact, whatsappGloballyEnabled))
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

// ---------------------------------------------------------------------------
// Email dispatch via Resend.
//
// Requires the RESEND_API_KEY secret. The sender is RESEND_FROM, which falls
// back to Resend's shared sandbox address — that sandbox can ONLY deliver to
// the address that owns the Resend account, so until a real domain is verified
// this channel works for the owner and is rejected for everyone else. That
// rejection is logged explicitly rather than swallowed as a generic failure.
//
// The recipient address lives in auth.users, not user_profiles, so it needs a
// service-role admin lookup — only done when the user actually enabled email.
// ---------------------------------------------------------------------------
const RESEND_SANDBOX_FROM = 'StrikeLine <onboarding@resend.dev>'

function alertEmailHtml(
  symbol: string, action: string, levelType: string,
  actualPrice: number, levelValue: number
): string {
  // Solid pairs, not 8-digit hex with alpha — alpha hex is unreliable in
  // Outlook and several mobile mail clients.
  const tone = levelType === 'support' ? '#16A34A'
    : levelType === 'resistance' ? '#DC2626' : '#D97706'
  const toneBg = levelType === 'support' ? '#F0FDF4'
    : levelType === 'resistance' ? '#FEF2F2' : '#FFFBEB'

  // Inline styles only — email clients strip <style> blocks and class rules.
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#F8F9FB;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid #E4E7ED;border-radius:16px;overflow:hidden;">
    <div style="background:#0D2F55;padding:20px 24px;">
      <span style="color:#FFFFFF;font-size:17px;font-weight:700;letter-spacing:-0.02em;">StrikeLine</span>
      <span style="color:#94A3B8;font-size:12px;margin-left:8px;">PSX price alerts</span>
    </div>
    <div style="padding:24px;">
      <div style="display:inline-block;padding:3px 10px;border-radius:999px;background:${toneBg};color:${tone};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${levelType}</div>
      <h1 style="margin:14px 0 6px;font-size:20px;font-weight:700;color:#0F172A;letter-spacing:-0.02em;">${symbol} ${action}</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:18px;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-top:1px solid #EDF0F5;color:#64748B;font-size:13px;">Current price</td>
          <td style="padding:10px 0;border-top:1px solid #EDF0F5;color:#0F172A;font-size:15px;font-weight:700;text-align:right;">PKR ${actualPrice}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #EDF0F5;color:#64748B;font-size:13px;">Your ${levelType} level</td>
          <td style="padding:10px 0;border-top:1px solid #EDF0F5;color:#0F172A;font-size:15px;font-weight:700;text-align:right;">PKR ${levelValue}</td>
        </tr>
      </table>
      <a href="https://strike-line.vercel.app/" style="display:block;margin-top:22px;padding:13px;background:#2563EB;color:#FFFFFF;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;text-align:center;">Open StrikeLine</a>
      <p style="margin:18px 0 0;color:#94A3B8;font-size:11px;line-height:1.6;">
        You're receiving this because email alerts are on for your StrikeLine account.
        Turn them off any time in Settings &rsaquo; Notification Channels.
      </p>
    </div>
  </div>
</body></html>`
}

async function sendAlertEmail(
  supabase: ReturnType<typeof createClient>,
  userId: string, symbol: string, action: string, levelType: string,
  actualPrice: number, levelValue: number
): Promise<'sent' | 'failed' | 'skipped'> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.log('Email skipped: RESEND_API_KEY is not set')
    return 'skipped'
  }

  // Everything below is inside one try/catch on purpose: this runs in the live
  // alert path, and email is the least important channel. A throw here (a DNS
  // blip on the admin lookup, Resend unreachable) must never take down the
  // WhatsApp/push dispatch that already happened for this same alert.
  try {
    const { data: authUser, error: lookupError } = await supabase.auth.admin.getUserById(userId)
    const to = authUser?.user?.email
    if (lookupError || !to) {
      console.error('Email skipped: could not resolve address for user', userId, lookupError?.message)
      return 'skipped'
    }

    const from = Deno.env.get('RESEND_FROM') ?? RESEND_SANDBOX_FROM
    const subject = `${symbol} ${action} — PKR ${actualPrice}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: alertEmailHtml(symbol, action, levelType, actualPrice, levelValue),
        text: `StrikeLine

${symbol} ${action}
Current price: PKR ${actualPrice}
Your ${levelType} level: PKR ${levelValue}

https://strike-line.vercel.app/`
      })
    })

    if (res.ok) {
      console.log(`Email sent to ${to} for ${symbol}`)
      return 'sent'
    }

    const detail = await res.text()
    // The single most likely failure while no domain is verified — make it
    // unmistakable in the logs instead of "email failed: 403".
    if (res.status === 403 && detail.includes('testing emails')) {
      console.error(
        `Email REJECTED for ${to}: the Resend sandbox sender (${from}) can only ` +
        `deliver to the Resend account owner. Verify a domain and set the ` +
        `RESEND_FROM secret to enable email for all users.`
      )
    } else {
      console.error(`Resend rejected the email (${res.status}):`, detail)
    }
    return 'failed'
  } catch (err) {
    console.error('Error calling Resend:', err)
    return 'failed'
  }
}

async function processAlert(
  supabase: any,
  rule: any,
  levelType: string,
  kind: 'hit' | 'approach',
  actualPrice: number,
  levelValue: number,
  whatsappGloballyEnabled: boolean
) {
  // 4. Cooldown Check — fixed 90-min debounce (alert_events uses triggered_at).
  // Applies to BOTH tiers, but kind-aware so the buffer never suppresses the
  // real hit:
  //   • a 'hit' is blocked ONLY by a recent *hit* — this stops the price
  //     oscillating right around the exact level (the 70.00 / 69.92 wiggle) from
  //     re-spamming, while still letting a hit through after a mere approach.
  //   • an 'approach' is blocked by ANY recent event for the level.
  // Past rows carry no explicit kind, so reconstruct it from actual_price vs
  // level_value (a hit landed on/through the level; an approach stopped short).
  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000
  const cooldownThreshold = new Date(Date.now() - cooldownMs).toISOString()

  const { data: recentEvents, error: recentError } = await supabase
    .from('alert_events')
    .select('actual_price, level_value')
    .eq('user_id', rule.user_id)
    .eq('symbol', rule.symbol)
    .eq('level_type', levelType)
    .gte('triggered_at', cooldownThreshold)

  if (recentError) {
    console.error('Error checking cooldown:', recentError)
    return
  }

  const wasHit = (ev: any) =>
    levelType === 'support'
      ? ev.actual_price <= ev.level_value   // fell onto/below support
      : ev.actual_price >= ev.level_value   // rose onto/above resistance/breakout

  const blocked = (recentEvents || []).some(ev => (kind === 'hit' ? wasHit(ev) : true))
  if (blocked) return

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
    .select('whatsapp_enabled, whatsapp_number, push_enabled, fcm_token, email_alerts_enabled')
    .eq('id', rule.user_id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError)
    pushStatus = 'failed'
  } else if (profile.whatsapp_enabled && profile.whatsapp_number && whatsappGloballyEnabled) {
    // 6. WhatsApp Dispatch via Fonnte (skipped entirely when the admin global
    // WhatsApp kill switch is off)
    const fonnteToken = Deno.env.get('FONNTE_TOKEN')
    if (!fonnteToken) {
      console.error('FONNTE_TOKEN environment variable is missing')
      pushStatus = 'failed'
    } else {
      const action = kind === 'hit' ? `hit your ${levelType} level` : `is approaching your ${levelType} level`
      const formattedText = `⚡ StrikeLine Alert\n${rule.symbol} ${action}\nPrice: PKR ${actualPrice}\nLevel: PKR ${levelValue}`

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
          title: `⚡ ${rule.symbol} ${kind === 'hit' ? `hit your ${levelType} level` : `is approaching your ${levelType} level`}`,
          body: `Price: PKR ${actualPrice} · Level: PKR ${levelValue}`,
          data: { symbol: rule.symbol, level_type: levelType, kind }
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

  // Email via Resend; skipped silently when the user has email alerts off or
  // RESEND_API_KEY isn't set. A 'skipped' result never counts as a failure.
  if (profile && profile.email_alerts_enabled) {
    const emailAction = kind === 'hit'
      ? `hit your ${levelType} level`
      : `is approaching your ${levelType} level`
    const emailOutcome = await sendAlertEmail(
      supabase, rule.user_id, rule.symbol, emailAction, levelType, actualPrice, levelValue
    )
    if (emailOutcome !== 'skipped') outcomes.push(emailOutcome)
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
