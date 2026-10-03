// @vitest-environment node
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { it, expect, vi } from 'vitest'
const source=readFileSync(new URL('../../supabase/functions/cbc-login/index.ts',import.meta.url),'utf8').replace(/^\uFEFF/,'').replace(/^import[^\n]+\n/,'')
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
function setup({known=true,valid=true}={}){
 const signInWithPassword=vi.fn(async()=>({data:valid?{user:{id:'member-id'},session:{access_token:'access',refresh_token:'refresh'}}:{},error:valid?null:new Error('invalid')}))
 const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:known?{user_id:'member-id'}:null})}
 const admin={from:()=>query,auth:{admin:{getUserById:async()=>({data:{user:{email:'private@example.invalid'}}})}}}
 let handler
 let calls=0
 new Function('createClient','Deno',compiled)(()=>calls++===0?admin:{auth:{signInWithPassword}},{env:{get:()=> 'test'},serve:fn=>{handler=fn}})
 return {handler,signInWithPassword}
}
const request=body=>new Request('https://example.invalid/',{method:'POST',body:JSON.stringify(body)})
it('returns session tokens only after the password authenticates the mapped account',async()=>{
 const {handler}=setup()
 const response=await handler(request({username:' IRESH ',password:'valid-password'}))
 expect(response.status).toBe(200)
 expect(await response.json()).toEqual({access_token:'access',refresh_token:'refresh'})
})
it('uses the same failure for unknown names and incorrect passwords without disclosing emails',async()=>{
 const unknown=setup({known:false,valid:false}),wrong=setup({valid:false})
 const a=await unknown.handler(request({username:'unknown',password:'bad'})),b=await wrong.handler(request({username:'ijaz',password:'bad'}))
 expect(a.status).toBe(401);expect(b.status).toBe(401)
 expect(await a.json()).toEqual(await b.json())
 expect(unknown.signInWithPassword).toHaveBeenCalled()
})
it('rejects malformed names before querying authentication',async()=>{
 const {handler,signInWithPassword}=setup()
 expect((await handler(request({username:'../admin',password:'bad'}))).status).toBe(401)
 expect(signInWithPassword).not.toHaveBeenCalled()
})
