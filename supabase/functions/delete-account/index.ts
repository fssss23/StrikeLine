// delete-account — permanently deletes the calling user's data AND auth account.
// The client can only delete data rows (RLS); removing the auth.users row
// requires the service role, hence this function.
//
// Auth: the caller's own JWT (Authorization header). A user can only delete
// themselves. No secrets needed beyond the auto-injected service role key.
//
// Deploy: supabase functions deploy delete-account

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(bearer)
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    // Delete the user's data first so nothing is orphaned if auth deletion fails
    const tables = ['alert_events', 'alert_rules', 'watchlist_items', 'user_profiles']
    for (const table of tables) {
      const column = table === 'user_profiles' ? 'id' : 'user_id'
      const { error } = await supabase.from(table).delete().eq(column, user.id)
      if (error) {
        console.error(`Failed to delete ${table} rows:`, error.message)
        return json({ error: `Failed to delete ${table}` }, 500)
      }
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError.message)
      return json({ error: 'Data deleted, but account removal failed' }, 500)
    }

    return json({ deleted: true })
  } catch (err) {
    console.error('delete-account error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
