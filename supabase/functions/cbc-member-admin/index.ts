import { createClient } from 'npm:@supabase/supabase-js@2.110.0'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-cbc-setup-token', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'POST required' })
  if (Number(req.headers.get('content-length') || 0) > 10000) return reply(413, { error: 'Request too large' })
  try {
    const raw = await req.text()
    if (raw.length > 10000) return reply(413, { error: 'Request too large' })
    let input
    try { input = JSON.parse(raw) } catch { return reply(400, { error: 'Invalid request' }) }
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })
    const setupToken = req.headers.get('x-cbc-setup-token')
    const bootstrap = input.action === 'bootstrap-owner'
    if (!bootstrap) {
      const jwt = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
      if (!jwt) return reply(401, { error: 'Sign in required' })
      const { data: { user }, error } = await sb.auth.getUser(jwt)
      if (error || !user) return reply(401, { error: 'Invalid session' })
      const { data: profile } = await sb.from('member_profiles').select('role').eq('user_id', user.id).maybeSingle()
      if (profile?.role !== 'scorekeeper') return reply(403, { error: 'Club administrator access required' })
    } else {
      if (!setupToken || setupToken.length !== 64) return reply(401, { error: 'Setup authorization required' })
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(setupToken))
      const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
      const { data: setup } = await sb.from('cbc_admin_setup').select('id').eq('id','initial-owner').eq('token_hash',hash).is('consumed_at',null).gt('expires_at',new Date().toISOString()).maybeSingle()
      if (!setup) return reply(403, { error: 'Setup link is invalid, expired, or already used' })
      const { count } = await sb.from('member_profiles').select('user_id', { count: 'exact', head: true }).eq('role','scorekeeper')
      if (count !== 0) return reply(409, { error: 'An administrator is already configured' })
    }
    if (input.action === 'list-members') {
      const { data, error } = await sb.from('member_profiles').select('user_id,username,player_id,role').order('username')
      if (error) return reply(500, { error: 'Cannot load members' })
      return reply(200, { members: data })
    }
    if (!['bootstrap-owner','create-member','reset-password'].includes(input.action)) return reply(400, { error: 'Unknown action' })
    if (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) return reply(400, { error: 'Use a password of 12–128 characters' })
    if (input.action === 'reset-password') {
      const { data: target } = await sb.from('member_profiles').select('user_id').eq('user_id', input.userId).maybeSingle()
      if (!target) return reply(404, { error: 'Club member not found' })
      const { error } = await sb.auth.admin.updateUserById(target.user_id, { password: input.password })
      return error ? reply(400, { error: 'Could not reset password' }) : reply(200, { ok: true })
    }
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const username = bootstrap ? 'ijaz' : input.username
    const playerId = bootstrap ? 'p15' : input.playerId
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reply(400, { error: 'Enter a valid email' })
    if (typeof username !== 'string' || !/^[a-z0-9_-]{2,32}$/.test(username) || !/^p[0-9]{1,20}$/.test(playerId)) return reply(400, { error: 'Choose a valid club username and player' })
    if (bootstrap) {
      // Atomic one-time claim: concurrent setup requests cannot create two owners.
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(setupToken!))
      const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
      const { data, error } = await sb.from('cbc_admin_setup').update({ consumed_at: new Date().toISOString() }).eq('id','initial-owner').eq('token_hash',hash).is('consumed_at',null).gt('expires_at',new Date().toISOString()).select('id').single()
      if (error || !data) return reply(409, { error: 'Setup was already claimed' })
    }
    const { data, error } = await sb.auth.admin.createUser({ email, password: input.password, email_confirm: true })
    if (error || !data.user) return reply(400, { error: 'Could not create account. The email may already be registered.' })
    const { error: profileError } = await sb.from('member_profiles').insert({ user_id: data.user.id, username, player_id: playerId, role: bootstrap ? 'scorekeeper' : 'member' })
    if (profileError) {
      await sb.auth.admin.deleteUser(data.user.id)
      return reply(409, { error: 'This player or username already has an account.' })
    }
    return reply(200, { ok: true, userId: data.user.id, username })
  } catch { return reply(500, { error: 'Member administration is temporarily unavailable' }) }
})
