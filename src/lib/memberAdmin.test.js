// @vitest-environment node
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { it, expect, vi } from 'vitest'
const source = readFileSync(new URL('../../supabase/functions/cbc-member-admin/index.ts', import.meta.url),'utf8').replace(/^\uFEFF/,'').replace(/^import[^\n]+\n/,'')
const compiled = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
function setup(role = 'member', validUser = true) {
  const createUser = vi.fn(async () => ({ data: { user: { id:'new-member' } }, error:null }))
  const insert = vi.fn(async () => ({error:null}))
  const client = { auth: { getUser: async () => ({data:{user:validUser ? {id:'signed-in'} : null},error:validUser ? null : new Error('invalid')}),admin:{createUser} }, from: () => { const query = { select:()=>query,eq:()=>query,maybeSingle:async()=>({data:{role}}),insert };return query } }
  let handler
  const runtime = {env:{get:()=> 'test'},serve:(callback)=>{handler=callback}}
  new Function('createClient','Deno',compiled)(()=>client,runtime)
  return { handler,createUser,insert }
}
const request = (body,token = 'valid') => new Request('https://example.invalid/',{method:'POST',headers:{'Content-Type':'application/json',...(token ? {Authorization:`Bearer ${token}`} : {})},body:JSON.stringify(body)})
it('denies unauthenticated member administration',async()=>{
  const {handler,createUser}=setup()
  expect((await handler(request({action:'create-member'},null))).status).toBe(401)
  expect(createUser).not.toHaveBeenCalled()
})
it('denies member accounts even with a valid session',async()=>{
  const {handler,createUser}=setup('member')
  expect((await handler(request({action:'create-member'}))).status).toBe(403)
  expect(createUser).not.toHaveBeenCalled()
})
it('requires a verified session rather than trusting the bearer value',async()=>{
  const {handler}=setup('scorekeeper',false)
  expect((await handler(request({action:'list-members'}))).status).toBe(401)
})
it('creates only ordinary members even if a caller requests a scorekeeper role',async()=>{
  const {handler,insert}=setup('scorekeeper')
  const response=await handler(request({action:'create-member',email:'member@example.invalid',username:'member',playerId:'p1',password:'test-password-1234',role:'scorekeeper'}))
  expect(response.status).toBe(200)
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({role:'member',player_id:'p1'}))
})
