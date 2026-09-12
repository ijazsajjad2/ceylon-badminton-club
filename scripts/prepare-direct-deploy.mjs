import {readFileSync,readdirSync,writeFileSync} from 'node:fs'
import {gzipSync} from 'node:zlib'
const files={};function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())walk(path);else if(!/\.test\./.test(path))files[path]=readFileSync(path,'utf8')}}walk('src')
for(const p of ['package.json','package-lock.json','vite.config.js','tsconfig.json','index.html','public/sw.js'])files[p]=readFileSync(p,'utf8')
const bundle=gzipSync(JSON.stringify(files)).toString('base64')
const build=`import {writeFileSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
const response=await fetch('https://codeload.github.com/ijazsajjad2/ceylon-badminton-club/tar.gz/35f27784400ead8df0283140011bbcbd7678e66b');
if(!response.ok)throw new Error('Pinned source download failed');
writeFileSync('base.tar.gz',Buffer.from(await response.arrayBuffer()));mkdirSync('app',{recursive:true});
execFileSync('tar',['-xzf','base.tar.gz','--strip-components=1','-C','app']);
const files=JSON.parse(gunzipSync(Buffer.from(readFileSync('overlay.b64','utf8'),'base64')));
for(const [path,data] of Object.entries(files)){const target=resolve('app',path);if(!target.startsWith(resolve('app')+'/'))throw new Error('Invalid path');mkdirSync(dirname(target),{recursive:true});writeFileSync(target,data)}
rmSync('app/src/data/credentials.js',{force:true});
execFileSync('npm',['ci'],{cwd:'app',stdio:'inherit'});execFileSync('npm',['run','build'],{cwd:'app',stdio:'inherit'});
`
const payload=[{file:'package.json',data:JSON.stringify({private:true,type:'module'})},{file:'vercel.json',data:JSON.stringify({framework:null,buildCommand:'node build.mjs',outputDirectory:'app/dist',installCommand:'echo Using pinned source build'})},{file:'build.mjs',data:build},{file:'overlay.b64',data:bundle}]
writeFileSync('.cbc-deploy.local',JSON.stringify(payload));console.log(JSON.stringify({files:Object.keys(files).length,payloadBytes:JSON.stringify(payload).length}))
