import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { loadEnvFile } from 'node:process'
import { createClient } from '@supabase/supabase-js'

const emailIndex = process.argv.indexOf('--email')
const email = emailIndex >= 0 ? process.argv[emailIndex + 1] : ''
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: node scripts/bootstrap-owner.mjs --email YOUR_EMAIL')
if (existsSync('.cbc-admin-credentials.local')) throw new Error('An owner credential file already exists; do not overwrite it.')
loadEnvFile('.env.local')
const { token } = JSON.parse(readFileSync('.cbc-bootstrap.local','utf8'))
const password = randomBytes(24).toString('base64url') + 'Aa1!'
// Retain the password before the request, so a lost response cannot lose access.
writeFileSync('.cbc-admin-credentials.local', JSON.stringify({ email, password, username: 'ijaz', status: 'pending' }, null, 2), { mode: 0o600, flag: 'wx' })
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const response = await fetch(`${url}/functions/v1/cbc-member-admin`, { method:'POST', headers:{ apikey:key, 'Content-Type':'application/json', 'x-cbc-setup-token':token }, body:JSON.stringify({ action:'bootstrap-owner',email,password }) })
const result = await response.json()
if (!response.ok) throw new Error(result.error || 'Account creation failed')
const sb = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
const { data, error } = await sb.auth.signInWithPassword({email,password})
if (error) throw error
const profile = await sb.from('member_profiles').select('username,role,player_id').eq('user_id',data.user.id).single()
if (profile.error || profile.data?.role !== 'scorekeeper') throw new Error('Owner role verification failed')
await sb.auth.signOut({scope:'local'})
writeFileSync('.cbc-admin-credentials.local', JSON.stringify({ email,password,username:profile.data.username,userId:data.user.id,status:'verified' },null,2),{mode:0o600})
console.log('Administrator created and sign-in verified. Credentials are in .cbc-admin-credentials.local (not committed).')
