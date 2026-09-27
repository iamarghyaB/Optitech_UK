import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';

const ROOT=process.cwd(), ORIGIN='https://pensatori-irrazionali.com';
const allowed=new Set(['pensatori-irrazionali.com','assets.pensatori-irrazionali.com','cms.pensatori-irrazionali.com']);
const manifest=JSON.parse(await fs.readFile('research/downloads.json','utf8').catch(()=>'{}'));
const queued=new Set(), queue=[], pages=new Set(), failures=[];
const extensions=/\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|svg|gif|ico|mp4|webm|mp3|wav|ogg|ktx2|wasm|vtt|glb|gltf|json)$/i;
function key(url){let u=new URL(url,ORIGIN);if(u.pathname!=='/_next/image')u.search='';else {u.searchParams.delete('dpl');u.searchParams.sort();}u.hash='';return u.href;}
function local(url){const u=new URL(url,ORIGIN);if(u.pathname==='/_next/image')return 'assets/optimized/'+crypto.createHash('sha1').update(key(url)).digest('hex')+'.webp';return 'assets/'+(u.hostname.startsWith('assets.')?'cdn':u.hostname.startsWith('cms.')?'cms':'site')+decodeURIComponent(u.pathname);}
function add(url,type='asset'){
  try {url=key(url);const u=new URL(url);if(!allowed.has(u.hostname)||queued.has(url))return;
  if(type==='asset'&&!extensions.test(u.pathname)&&!u.pathname.endsWith('.jfif')&&u.pathname!=='/_next/image')return;
  queued.add(url);queue.push({url,type});if(type==='page')pages.add(u.pathname);}catch{}
}
function scan(text,base=ORIGIN){
  const s=text.replace(/\\"/g,'"').replace(/&amp;/g,'&').replace(/\\u0026/g,'&');
  for(const m of s.matchAll(/https:\/\/(?:assets\.|cms\.)?pensatori-irrazionali\.com\/[^\s"'<>\\`)\]}]+/g))add(m[0]);
  for(const m of s.matchAll(/(?:\/(?:_next\/static|static|basis)\/[^\s"'<>\\`)\]}?]+|\/_next\/image\?[^\s"'<>\\]+|\/favicon[^\s"'<>\\]+)/g))add(new URL(m[0],base).href);
  for(const m of s.matchAll(/["'](static\/chunks\/[^"']+\.(?:js|css))["']/g))add(ORIGIN+'/_next/'+m[1]);
  for(const m of s.matchAll(/(?:href|url)=["'](\/(?!_next|static|basis)[a-zA-Z0-9\/-]*)["']/g))add(ORIGIN+m[1],'page');
  for(const m of s.matchAll(/url\(["']?(\.\.\/[^)'"?]+)/g))add(new URL(m[1],base).href);
}
async function curl(url,file,headers=[]){
  await fs.mkdir(path.dirname(file),{recursive:true});
  return new Promise((resolve,reject)=>{const p=spawn('curl.exe',['-L','--fail','--silent','--show-error','--retry','2','--max-time','180',...headers.flatMap(h=>['-H',h]),url,'-o',file],{windowsHide:true});let err='';p.stderr.on('data',d=>err+=d);p.on('close',c=>c?reject(new Error(err.trim())):resolve());});
}
async function processItem({url,type}){
 const u=new URL(url);const file=type==='page'?'research/pages/'+(u.pathname==='/'?'home':u.pathname.slice(1).replaceAll('/','__'))+'.html':local(url);
 try {
   let exists=await fs.stat(file).then(s=>s.size>0).catch(()=>false);
   if(!exists)await curl(url,file);
   const stat=await fs.stat(file); manifest[url]={file,bytes:stat.size,type};
   if(type==='page'||/\.(js|css)$/.test(u.pathname)){
    const text=await fs.readFile(file,'utf8');scan(text,url);
    if(type==='page'){
      const rsc=file.replace(/\.html$/,'.rsc');
      if(!await fs.stat(rsc).catch(()=>false))await curl(url,rsc,['RSC: 1']);
      scan(await fs.readFile(rsc,'utf8'),url);
    }
   }
 }catch(e){failures.push({url,error:e.message});console.log('FAILED',url,e.message);}
}
await fs.mkdir('research/pages',{recursive:true});
await fs.copyFile('research/reference.html','research/pages/home.html');
add(ORIGIN,'page');
const inv=JSON.parse(await fs.readFile('research/home-assets.json','utf8'));
for(const a of inv.assets)add(a.url);
let done=0;
while(queue.length){const batch=queue.splice(0,10);await Promise.all(batch.map(processItem));done+=batch.length;if(done%50<10)console.log('Downloaded/scanned',done,'pending',queue.length,'pages',pages.size);await fs.writeFile('research/downloads.json',JSON.stringify(manifest,null,2));}
await fs.writeFile('research/download-failures.json',JSON.stringify(failures,null,2));
console.log('Finished',Object.keys(manifest).length,'files;',pages.size,'pages;',failures.length,'failures');
