import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
const origin='https://pensatori-irrazionali.com',urls=new Set(),results=[];
function add(s){const u=new URL(s,origin);if(!['pensatori-irrazionali.com','assets.pensatori-irrazionali.com','cms.pensatori-irrazionali.com'].includes(u.hostname))return;if(u.pathname==='/_next/image'){u.searchParams.delete('dpl');u.searchParams.sort();}else u.search='';if(/\.(png|jpg|jpeg|jfif|svg|webp|woff2|js|css|ktx2|wasm|mp4|webm|mp3|wav|vtt)$/.test(u.pathname)||u.pathname==='/_next/image')urls.add(u.href);}
for(const file of await fs.readdir('research'))if(file.endsWith('-assets.json'))for(const a of JSON.parse(await fs.readFile('research/'+file)).assets)add(a.url);
for(let i=0;i<50;i++)if(![8,14,24,34,35].includes(i)){
 add('/static/images/logos/'+i+'.png');add('/_next/image?url='+encodeURIComponent('/static/images/logos/'+i+'.png')+'&w=256&q=75');
}
// The source generates these six texture-frame URLs programmatically.
for(const name of ['angel','angel-girl','footer','hand']){
 if(name!=='hand')add('https://assets.pensatori-irrazionali.com/v1/textures/'+name+'/sequence.ktx2');
 if(name==='hand')for(let i=1;i<=6;i++)add('https://assets.pensatori-irrazionali.com/v1/textures/'+name+'/'+i+'.ktx2');
 add('https://assets.pensatori-irrazionali.com/v1/textures/'+name+'/1.png');
}
const originals='research/originals/assets/site/_next/static/chunks';
for(const file of await fs.readdir(originals)){
 const s=await fs.readFile(path.join(originals,file),'utf8');
 for(const m of s.matchAll(/(?:r|staticAssetUrl\))\("(\/static\/[^"\s]+)"\)/g))add('https://assets.pensatori-irrazionali.com/v1'+m[1]);
}
const health=await fetch('http://127.0.0.1:4173/__health').then(r=>r.json()).catch(()=>({missing:[]}));
for(const s of health.missing){let u=s.replace('/assets/cdn','https://assets.pensatori-irrazionali.com').replace('/assets/cms','https://cms.pensatori-irrazionali.com').replace('/assets/site','');add(u);}
const list=[...urls];
async function get(url){const u=new URL(url);const file=u.pathname==='/_next/image'?'assets/optimized/'+crypto.createHash('sha1').update(url).digest('hex')+'.webp':'assets/'+(u.hostname.startsWith('assets.')?'cdn':u.hostname.startsWith('cms.')?'cms':'site')+decodeURIComponent(u.pathname);
 if(await fs.stat(file).catch(()=>false))return;
 await fs.mkdir(path.dirname(file),{recursive:true});
 const error=await new Promise(resolve=>{let error='';const p=spawn('curl.exe',['-L','--fail','--silent','--show-error','--retry','2','--max-time','180',url,'-o',file],{windowsHide:true});p.stderr.on('data',d=>error+=d);p.on('close',code=>resolve(code?error:null));});
 results.push({url,file,error});if(error)console.log('FAILED',url,error);
}
for(let i=0;i<list.length;i+=8)await Promise.all(list.slice(i,i+8).map(get));
const previous=JSON.parse(await fs.readFile('research/extra-downloads.json','utf8').catch(()=>'[]'));
await fs.writeFile('research/extra-downloads.json',JSON.stringify([...previous,...results],null,2));console.log('Extra assets saved:',results.length,'failures:',results.filter(x=>x.error).length);
