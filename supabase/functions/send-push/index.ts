// send-push — dispatches web push via Firebase Cloud Messaging (HTTP v1 API).
//
// Callers:
//   1. evaluate-alerts (service role): { user_id, title, body, data? }
//   2. Logged-in client (user JWT, "Send test notification" button): { test: true, symbol? }
//
// Secrets required:
//   FIREBASE_SERVICE_ACCOUNT — the full Firebase service-account JSON, e.g.
//   supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)"
//
// Deploy: supabase functions deploy send-push

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// Google OAuth access token for the FCM scope, cached across warm invocations
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token

  const key = await importPKCS8(sa.private_key, 'RS256')
  const now = Math.floor(Date.now() / 1000)
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`OAuth token exchange failed: ${JSON.stringify(data)}`)

  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!serviceAccountRaw) {
      return json({ sent: false, skipped: true, reason: 'FIREBASE_SERVICE_ACCOUNT secret not set' })
    }
    const serviceAccount = JSON.parse(serviceAccountRaw)

    const body = await req.json().catch(() => ({}))
    const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')

    // Resolve the target user: service-role callers name a user_id;
    // everyone else may only send a test push to themselves.
    let userId: string
    let title: string
    let messageBody: string

    if (bearer === serviceKey && body.user_id) {
      userId = body.user_id
      title = body.title ?? 'StrikeLine Alert'
      messageBody = body.body ?? ''
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser(bearer)
      if (userError || !user) return json({ error: 'Unauthorized' }, 401)
      if (!body.test) return json({ error: 'Only test sends are allowed for user tokens' }, 403)
      userId = user.id
      title = '⚡ StrikeLine Test Notification'
      messageBody = body.symbol
        ? `Push alerts for ${body.symbol} are working. You're all set.`
        : `Push notifications are working. You're all set.`
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('fcm_token, push_enabled')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return json({ sent: false, skipped: true, reason: 'profile not found' })
    }
    if (!profile.push_enabled || !profile.fcm_token) {
      return json({ sent: false, skipped: true, reason: 'push disabled or no device token' })
    }

    const accessToken = await getAccessToken(serviceAccount)
    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: profile.fcm_token,
            notification: { title, body: messageBody },
            data: body.data ?? {},
            webpush: {
              fcm_options: { link: 'https://strike-line.vercel.app/history' },
            },
          },
        }),
      }
    )

    const fcmResult = await fcmRes.json()
    if (!fcmRes.ok) {
      // Stale/uninstalled device tokens come back as UNREGISTERED — clear them
      // so future runs skip instead of failing
      const errCode = fcmResult?.error?.details?.find(
        (d: any) => d['@type']?.includes('FcmError')
      )?.errorCode ?? fcmResult?.error?.status
      if (errCode === 'UNREGISTERED' || errCode === 'NOT_FOUND') {
        await supabase.from('user_profiles').update({ fcm_token: null }).eq('id', userId)
        return json({ sent: false, skipped: true, reason: 'device token expired — re-enable push' })
      }
      console.error('FCM send failed:', JSON.stringify(fcmResult))
      return json({ sent: false, reason: 'FCM rejected the message' })
    }

    return json({ sent: true })
  } catch (err) {
    console.error('send-push error:', err)
    return json({ sent: false, reason: (err as Error).message }, 500)
  }
})
