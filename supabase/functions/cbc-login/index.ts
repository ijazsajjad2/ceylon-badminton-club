import { createClient } from 'npm:@supabase/supabase-js@2.110.0'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
const denied = () => reply(401, { error: 'Sign-in failed. Check your login name and password.' })
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'POST required' })
  try {
    const raw = await req.text()
    if (raw.length > 2000) return reply(413, { error: 'Request too large' })
    let input
    try { input = JSON.parse(raw) } catch { return denied() }
    const username = typeof input.username === 'string' ? input.username.trim().toLowerCase() : ''
    if (!/^[a-z0-9_-]{2,32}$/.test(username) || typeof input.password !== 'string' || input.password.length > 128 || !input.password.length) return denied()
    const options = { auth: { persistSession: false, autoRefreshToken: false } }
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, options)
    const { data: profile, error: lookupError } = await admin.from('member_profiles').select('user_id').eq('username', username).maybeSingle()
    if (lookupError) return reply(503, { error: 'Sign-in is temporarily unavailable.' })
    const account = profile ? await admin.auth.admin.getUserById(profile.user_id) : null
    // Supabase Auth verifies passwords and applies its token-endpoint rate limits.
    // Unknown names also take the password-auth path; no email lookup is exposed.
    const auth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, options)
    const { data, error } = await auth.auth.signInWithPassword({ email: account?.data?.user?.email || 'unknown@cbc.invalid', password: input.password })
    if (error || !profile || !data.session || data.user?.id !== profile.user_id) return denied()
    return reply(200, { access_token: data.session.access_token, refresh_token: data.session.refresh_token })
  } catch { return reply(503, { error: 'Sign-in is temporarily unavailable.' }) }
})
