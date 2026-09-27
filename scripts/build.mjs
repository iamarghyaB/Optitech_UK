import fs from 'node:fs/promises';
import path from 'node:path';

// Keep the reference's Tailwind utilities and animation bundles. Only asset
// locations change; durations, easings, shaders and responsive rules do not.
export function localize(s){
 return s.replaceAll('https://static.cloudflareinsights.com/beacon.min.js','/assets/local/analytics-disabled.js')
 .replaceAll('https://assets.pensatori-irrazionali.com','/assets/cdn')
 .replaceAll('https://cms.pensatori-irrazionali.com','/assets/cms')
 .replaceAll('https%3A%2F%2Fassets.pensatori-irrazionali.com','%2Fassets%2Fcdn')
 .replaceAll('https%3A%2F%2Fcms.pensatori-irrazionali.com','%2Fassets%2Fcms')
 .replaceAll('/_next/static/','/assets/site/_next/static/')
 .replaceAll('let t="/_next/"','let t="/assets/site/_next/"');
}
// React Flight uses byte-counted text records. Update the byte counts after
// relinking URLs, otherwise long CSS/content records cannot hydrate correctly.
export function localizeFlight(s){
 const b=Buffer.from(s);const latin=b.toString('latin1');const re=/(?:^|\n)([0-9a-f]+):T([0-9a-f]+),/g;
 let out='',last=0,m;
 while((m=re.exec(latin))){
  const start=m.index+(m[0].startsWith('\n')?1:0),from=m.index+m[0].length,to=from+parseInt(m[2],16);
  out+=localize(b.subarray(last,start).toString());const value=localize(b.subarray(from,to).toString());
  out+=m[1]+':T'+Buffer.byteLength(value).toString(16)+','+value;last=to;re.lastIndex=to;
 }
 return out+localize(b.subarray(last).toString());
}
await fs.mkdir('pages',{recursive:true});await fs.mkdir('assets/local',{recursive:true});
const routes={};
for(const file of await fs.readdir('research/pages')){
 if(!file.endsWith('.html'))continue;
 const route=file==='home.html'?'/':'/'+file.slice(0,-5).replaceAll('__','/');
 let html=await fs.readFile('research/pages/'+file,'utf8'),flight='';
 html=html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g,(tag,js)=>{
  if(!js.includes('__next_f'))return tag;
  const match=js.match(/\.push\((\[[\s\S]*\])\)\s*;?$/);
  if(!match)return tag;
  const data=JSON.parse(match[1]);if(data[0]===1)flight+=data[1];return '';
 });
 html=localize(html);
 html=html.replace(/<script[^>]*src="https:\/\/static\.cloudflareinsights\.com[^>]*>[\s\S]*?<\/script>/g,'')
 .replace(/<link[^>]*href="https:\/\/static\.cloudflareinsights\.com[^>]*>/g,'');
 // Script and preload links point directly to the project's assets folder.
 html=html.replace(/((?:src|href)=["'])\/_next\/static\//g,'$1/assets/site/_next/static/');
 html=html.replace('</head>','<meta name="robots" content="noindex,nofollow"><script src="/assets/local/reference-mode.js"></script></head>');
 const serialized=JSON.stringify(localizeFlight(flight)).replaceAll('<','\\u003c');
 html=html.replace('</body>',`<script>(self.__next_f=self.__next_f||[]).push([0]);self.__next_f.push([1,${serialized}]);</script></body>`);
 const out=route==='/'?'index.html':'pages/'+file;
 await fs.writeFile(out,html);routes[route]={html:out,rsc:'pages/'+file.replace('.html','.rsc')};
 const rsc=await fs.readFile('research/pages/'+file.replace('.html','.rsc'),'utf8').catch(()=>'');
 if(rsc)await fs.writeFile(routes[route].rsc,localizeFlight(rsc));
}
// Retain pristine copies so this build is repeatable.
async function patchAssets(dir){
 for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await patchAssets(p);else if(/\.(js|css)$/.test(p)){
  const original=path.join('research/originals',p);
  await fs.mkdir(path.dirname(original),{recursive:true});
  let text=await fs.readFile(original,'utf8').catch(()=>null);
  if(text===null){text=await fs.readFile(p,'utf8');await fs.writeFile(original,text);}
  await fs.writeFile(p,localize(text));
 }}
}
await patchAssets('assets/site');
await fs.writeFile('routes.json',JSON.stringify(routes,null,2));
console.log('Built',Object.keys(routes).length,'local HTML pages.');
