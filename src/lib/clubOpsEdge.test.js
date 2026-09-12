// @vitest-environment node
import {readFileSync} from 'node:fs'
import ts from 'typescript'
import {it,expect,vi} from 'vitest'
import {rotateCourts} from './courtRotation.js'
const source=readFileSync('supabase/functions/cbc-club-ops/index.ts','utf8').replace(/^import[^\n]+\n/gm,'')
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
function setup(valid=true,role='member'){
 const rpc=vi.fn(async()=>({data:{status:'confirmed'},error:null}));let handler
 const db={auth:{getUser:async()=>({data:{user:valid?{id:'verified-user'}:null},error:null})},rpc,from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>({data:{role,player_id:'p1'}})};return q}}
 new Function('createClient','rotateCourts','webpush','Deno',compiled)(()=>db,rotateCourts,{}, {env:{get:()=>''},serve:f=>handler=f})
 return {rpc,handler}
}
const req=body=>new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer token'},body:JSON.stringify(body)})
it('rejects unauthenticated club operations',async()=>{const {handler,rpc}=setup(false);expect((await handler(req({action:'book'}))).status).toBe(401);expect(rpc).not.toHaveBeenCalled()})
it('denies member changes to session settings',async()=>{const {handler,rpc}=setup();expect((await handler(req({action:'configure'}))).status).toBe(403);expect(rpc).not.toHaveBeenCalled()})
it('derives the booking actor from the verified session',async()=>{const {handler,rpc}=setup();expect((await handler(req({action:'book',actor:'forged-admin',date:'2099-01-01',going:true}))).status).toBe(200);expect(rpc).toHaveBeenCalledWith('cbc_book_session',{actor:'verified-user',session_day:'2099-01-01',wants_place:true})})
it('rejects arbitrary push destinations',async()=>{const {handler}=setup();expect((await handler(req({action:'subscribe',subscription:{endpoint:'https://127.0.0.1/secret',keys:{}}}))).status).toBe(400)})
