import {readFileSync} from 'node:fs'
const url='https://bxlfkdroglotfueigczh.supabase.co/functions/v1/cbc-club-ops'
for(const action of ['book','dispatch-push']){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});console.log(action+' unauthorized status: '+r.status);if(r.status!==401)throw new Error('Expected authentication rejection')}
const keys=JSON.parse(readFileSync('.cbc-push.local','utf8'))
const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-cbc-job-key':keys.jobKey},body:JSON.stringify({action:'dispatch-push'})});const data=await r.json();console.log(JSON.stringify({jobStatus:r.status,result:data}));if(!r.ok)throw new Error('Push job failed')
