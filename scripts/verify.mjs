import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const routes=JSON.parse(await fs.readFile('routes.json','utf8'));
const urls=new Set(),failures=[];let checks=0;
// Check the complete saved asset inventory, independently of which pages have
// been visited since the preview server started.
const downloads=JSON.parse(await fs.readFile('research/downloads.json','utf8'));
for(const asset of Object.values(downloads))if(asset.type==='asset')urls.add('/'+asset.file);
const extras=JSON.parse(await fs.readFile('research/extra-downloads.json','utf8'));
for(const asset of extras)if(!asset.error)urls.add('/'+asset.file);
for(const [route,files] of Object.entries(routes)){
 urls.add(route);
 const h=await fs.readFile(files.html,'utf8');
 for(const m of h.matchAll(/(?:src|poster|href)="([^"<>]+)"/g)){
  const s=m[1].replaceAll('&amp;','&');
  if(s.startsWith('/')&&(s.startsWith('/assets/')||s.startsWith('/_next/')||s.startsWith('/basis/')||s.startsWith('/static/')||s.includes('favicon')))urls.add(s);
 }
 const r=await fetch(base+route,{headers:{RSC:'1'}});checks++;
 if(!r.ok||!r.headers.get('content-type')?.includes('text/x-component'))failures.push({route,test:'RSC',status:r.status});
 await r.arrayBuffer();
}
const health=await fetch(base+'/__health').then(r=>r.json());for(const u of health.missing)urls.add(u);
const list=[...urls];
for(let i=0;i<list.length;i+=20)await Promise.all(list.slice(i,i+20).map(async url=>{
 const r=await fetch(base+url,{method:'HEAD'});checks++;if(!r.ok)failures.push({url,status:r.status});
}));
const video='/assets/cdn/v1/static/videos/flagsCycles.mp4';
const r=await fetch(base+video,{headers:{Range:'bytes=0-15'}});const b=await r.arrayBuffer();checks++;
if(r.status!==206||b.byteLength!==16)failures.push({test:'Video byte ranges',status:r.status,bytes:b.byteLength});
const layouts={};
for(const kind of ['desktop','mobile']){
 const {reference,local}=JSON.parse(await fs.readFile('verification/'+kind+'-layout.json'));
 layouts[kind]={viewport:[local.width,local.height],sectionGeometryMatches:JSON.stringify(reference.sections)===JSON.stringify(local.sections),heroTypographyMatches:JSON.stringify(reference.heroText)===JSON.stringify(local.heroText)};
 if(!layouts[kind].sectionGeometryMatches||!layouts[kind].heroTypographyMatches)failures.push({test:kind+' layout comparison'});
}
const result={date:new Date().toISOString(),pages:Object.keys(routes).length,checks,layouts,failures};
await fs.writeFile('verification/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
process.exitCode=failures.length?1:0;
