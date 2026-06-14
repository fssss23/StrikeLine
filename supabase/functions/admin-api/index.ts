// admin-api — privileged backend for the StrikeLine admin panel.
//
// Auth: the caller's own JWT (Authorization header). The function verifies the
// caller and checks user_profiles.is_admin via the service role; non-admins get
// 403. Everything runs with the service role so it can read auth.users emails
// (never exposed to clients) and write app_settings (RLS-locked).
//
// Actions (POST JSON { action, ... }):
//   overview       → stats, scraper health, global settings
//   list_users     → every user with email, channels, counts, flags
//   set_user_flag  → { user_id, field: 'restricted'|'is_admin', value: bool }
//   set_setting    → { key: 'whatsapp_enabled'|'alerts_paused', value: bool }
//   recent_events  → last 50 alert_events with user email
//
// Deploy: supabase functions deploy admin-api

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function pktNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
}

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // --- AuthN: who is calling? ---
    const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(bearer)
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    // --- AuthZ: are they an admin? ---
    const { data: callerProfile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!callerProfile?.is_admin) return json({ error: 'Forbidden' }, 403)

    const { action, ...params } = await req.json().catch(() => ({}))

    switch (action) {
      case 'overview':      return json(await overview(supabase))
      case 'list_users':    return json(await listUsers(supabase))
      case 'recent_events': return json(await recentEvents(supabase))
      case 'set_user_flag': return json(await setUserFlag(supabase, user.id, params))
      case 'set_setting':   return json(await setSetting(supabase, params))
      default:              return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    console.error('admin-api error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})

async function getSettings(supabase: any): Promise<Record<string, boolean>> {
  const { data } = await supabase.from('app_settings').select('key, value')
  const out: Record<string, boolean> = { whatsapp_enabled: true, alerts_paused: false }
  for (const s of data || []) out[s.key] = s.value === true
  return out
}

async function overview(supabase: any) {
  const count = async (table: string, build?: (q: any) => any) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (build) q = build(q)
    const { count: c } = await q
    return c || 0
  }

  // Start of today in PKT, expressed as a real UTC instant
  const p = pktNow()
  const startOfTodayUtc = new Date(
    Date.now() - (p.getHours() * 60 + p.getMinutes()) * 60000 - p.getSeconds() * 1000 - p.getMilliseconds()
  ).toISOString()

  const [
    totalUsers, admins, restricted, activeRules,
    watchlistItems, eventsToday, sentToday, failedToday,
  ] = await Promise.all([
    count('user_profiles'),
    count('user_profiles', q => q.eq('is_admin', true)),
    count('user_profiles', q => q.eq('restricted', true)),
    count('alert_rules', q => q.or('support_enabled.eq.true,resistance_enabled.eq.true,breakout_enabled.eq.true')),
    count('watchlist_items'),
    count('alert_events', q => q.gte('triggered_at', startOfTodayUtc)),
    count('alert_events', q => q.gte('triggered_at', startOfTodayUtc).eq('push_status', 'sent')),
    count('alert_events', q => q.gte('triggered_at', startOfTodayUtc).eq('push_status', 'failed')),
  ])

  // Scraper health: newest tick + how many ticks shared that scrape timestamp
  const { data: lastTick } = await supabase
    .from('price_ticks')
    .select('scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const lastScrapedAt = lastTick?.scraped_at ?? null
  const ticksLastRun = lastScrapedAt ? await count('price_ticks', q => q.eq('scraped_at', lastScrapedAt)) : 0

  return {
    settings: await getSettings(supabase),
    stats: {
      totalUsers, admins, restricted, activeRules,
      watchlistItems, eventsToday, sentToday, failedToday,
    },
    scraper: {
      lastScrapedAt,
      ticksLastRun,
      marketOpen: isMarketOpen(),
      serverPkt: pktNow().toISOString(),
    },
  }
}

async function listUsers(supabase: any) {
  // Emails + auth metadata (service role only)
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (authErr) throw authErr
  const authUsers = authData?.users || []

  const [{ data: profiles }, { data: watchRows }, { data: ruleRows }, { data: eventRows }] = await Promise.all([
    supabase.from('user_profiles').select('*'),
    supabase.from('watchlist_items').select('user_id'),
    supabase.from('alert_rules').select('user_id, support_enabled, resistance_enabled, breakout_enabled'),
    supabase.from('alert_events').select('user_id, symbol, push_status, triggered_at').order('triggered_at', { ascending: false }),
  ])

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

  const watchCount = new Map<string, number>()
  for (const w of watchRows || []) watchCount.set(w.user_id, (watchCount.get(w.user_id) || 0) + 1)

  const ruleCount = new Map<string, number>()
  for (const r of ruleRows || []) {
    const enabled = (r.support_enabled ? 1 : 0) + (r.resistance_enabled ? 1 : 0) + (r.breakout_enabled ? 1 : 0)
    ruleCount.set(r.user_id, (ruleCount.get(r.user_id) || 0) + enabled)
  }

  const lastEvent = new Map<string, any>()
  for (const e of eventRows || []) {
    if (!lastEvent.has(e.user_id)) lastEvent.set(e.user_id, e) // first = newest (already sorted desc)
  }

  return {
    users: authUsers.map((au: any) => {
      const prof: any = profileMap.get(au.id) || {}
      const last = lastEvent.get(au.id)
      return {
        id: au.id,
        email: au.email,
        created_at: au.created_at,
        last_sign_in_at: au.last_sign_in_at,
        display_name: prof.display_name ?? null,
        is_admin: prof.is_admin ?? false,
        restricted: prof.restricted ?? false,
        push_enabled: prof.push_enabled ?? false,
        whatsapp_enabled: prof.whatsapp_enabled ?? false,
        whatsapp_number: prof.whatsapp_number ?? null,
        email_alerts_enabled: prof.email_alerts_enabled ?? false,
        has_device: !!prof.fcm_token,
        cooldown_minutes: prof.cooldown_minutes ?? null,
        watchlist_count: watchCount.get(au.id) || 0,
        active_levels: ruleCount.get(au.id) || 0,
        last_alert: last ? { symbol: last.symbol, status: last.push_status, at: last.triggered_at } : null,
      }
    }),
  }
}

async function setUserFlag(supabase: any, callerId: string, params: any) {
  const { user_id, field, value } = params
  if (!['restricted', 'is_admin'].includes(field)) return { error: 'Invalid field' }
  if (typeof value !== 'boolean' || !user_id) return { error: 'Invalid payload' }
  // Guard against locking yourself out
  if (user_id === callerId) return { error: 'You cannot change your own admin/restriction status' }

  const { error } = await supabase.from('user_profiles').update({ [field]: value }).eq('id', user_id)
  if (error) return { error: error.message }
  return { ok: true, user_id, field, value }
}

async function setSetting(supabase: any, params: any) {
  const { key, value } = params
  if (!['whatsapp_enabled', 'alerts_paused'].includes(key)) return { error: 'Invalid setting key' }
  if (typeof value !== 'boolean') return { error: 'Setting value must be boolean' }

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) return { error: error.message }
  return { ok: true, key, value }
}

async function recentEvents(supabase: any) {
  const { data: events } = await supabase
    .from('alert_events')
    .select('id, user_id, symbol, level_type, level_value, actual_price, push_status, triggered_at')
    .order('triggered_at', { ascending: false })
    .limit(50)

  // Map user_id → email (cheap enough at current scale)
  const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const emailMap = new Map((authData?.users || []).map((u: any) => [u.id, u.email]))

  return {
    events: (events || []).map((e: any) => ({ ...e, email: emailMap.get(e.user_id) ?? '—' })),
  }
}
