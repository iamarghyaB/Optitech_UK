import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const base = process.env.BASE_URL || 'http://127.0.0.1:4181';
const routes = JSON.parse(await fs.readFile('routes.json','utf8'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
let checks = 0;
for (const [route, files] of Object.entries(routes)) {
  if (route === '/contact') {
    const contact = await fetch(base + route, { redirect: 'manual' });
    assert.equal(contact.status, 308);
    assert.match(contact.headers.get('location'), /\/contact\/quote$/);
    checks++;
    continue;
  }
  for (const [kind, file] of Object.entries(files)) {
    const response = await fetch(base+route,{headers:kind==='rsc'?{RSC:'1'}:{}});
    assert.equal(response.status,200,route+' '+kind);
    assert.match(response.headers.get('content-type'),kind==='rsc'?/text\/x-component/:/text\/html/);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(digest(bytes),digest(process.env.VERCEL === '1' ? Buffer.from((await fs.readFile(file, 'utf8')).replaceAll('/_next/image', '/api/reference-image')) : await fs.readFile(file)),route+' '+kind+' must remain byte-identical');
    checks++;
  }
}
const video = '/assets/cdn/v1/static/videos/flagsCycles.mp4';
const original = await fs.readFile(video.slice(1));
for (const [range,status,start,end] of [
  ['bytes=0-15',206,0,15],
  ['bytes=-16',206,original.length-16,original.length-1],
  ['bytes='+original.length+'-',416,0,0],
]) {
  const response=await fetch(base+video,{headers:{Range:range}});
  assert.equal(response.status,status);
  if(status===206) assert.deepEqual(Buffer.from(await response.arrayBuffer()),original.subarray(start,end+1));
  checks++;
}
const head=await fetch(base+video,{method:'HEAD'});
assert.equal(Number(head.headers.get('content-length')),original.length);
assert.equal((await head.arrayBuffer()).byteLength,0);
checks++;
const rejected=await fetch(base+'/contact',{method:'POST',body:'test'});
assert.equal(rejected.status,405);
checks++;
const result={date:new Date().toISOString(),checks,pages:Object.keys(routes).length,
  exactHtmlAndRsc:true,videoByteRanges:true,postBlocked:true};
await fs.writeFile('verification/next-results.json',JSON.stringify(result,null,2));
console.log(result);
