import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd(),port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.rsc':'text/x-component','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.ico':'image/x-icon','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.wav':'audio/wav','.ktx2':'image/ktx2','.wasm':'application/wasm','.vtt':'text/vtt'};
mime['.jfif']='image/jpeg';
const misses=new Set();
function assetKey(url){const u=new URL(url,'https://pensatori-irrazionali.com');u.searchParams.delete('dpl');u.searchParams.sort();return u.href;}
function resolveImage(u){
 let source=u.searchParams.get('url')||'';
 source=source.replace('/assets/cms','https://cms.pensatori-irrazionali.com').replace('/assets/cdn','https://assets.pensatori-irrazionali.com');
 const original=new URL('/_next/image','https://pensatori-irrazionali.com');
 original.searchParams.set('url',source);original.searchParams.set('w',u.searchParams.get('w')||'1920');original.searchParams.set('q',u.searchParams.get('q')||'75');
 const exact='assets/optimized/'+crypto.createHash('sha1').update(assetKey(original.href)).digest('hex')+'.webp';
 if(fs.existsSync(exact))return exact;
 const p=new URL(source,'https://pensatori-irrazionali.com');
 return 'assets/'+(p.hostname.startsWith('cms.')?'cms':p.hostname.startsWith('assets.')?'cdn':'site')+decodeURIComponent(p.pathname);
}
const server=http.createServer((req,res)=>{
 try{
 const u=new URL(req.url,'http://localhost');let route=decodeURIComponent(u.pathname),file;
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end('Local reference: external submissions are disabled.');}
 const routes=JSON.parse(fs.readFileSync('routes.json','utf8'));
 if(route==='/__health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({pages:Object.keys(routes).length,missing:[...misses]}));}
 if(route==='/index.html')route='/';
 if(routes[route]){file=req.headers.rsc==='1'?routes[route].rsc:routes[route].html;res.setHeader('Cache-Control','no-store');if(req.headers.rsc==='1')res.setHeader('Vary','RSC, Next-Router-State-Tree, Next-Router-Prefetch');}
 else if(route==='/_next/image')file=resolveImage(u);
 else if(route.startsWith('/assets/'))file=route.slice(1);
 else file='assets/site'+route;
 const abs=path.resolve(root,file);
 if(!abs.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 if(!fs.existsSync(abs)||!fs.statSync(abs).isFile()){
  misses.add(req.url);console.log('MISSING',req.url);res.writeHead(404);return res.end('Local asset not found');
 }
 const size=fs.statSync(abs).size;
 let type=mime[path.extname(abs)]||'application/octet-stream';
 // Optimized endpoint caches may be JPEG/PNG despite a stable .webp cache suffix.
 if(file.startsWith('assets/optimized/')){const fd=fs.openSync(abs,'r'),head=Buffer.alloc(12);fs.readSync(fd,head,0,12,0);fs.closeSync(fd);type=head[0]===255?'image/jpeg':head[0]===137?'image/png':head.subarray(0,4).toString()==='RIFF'?'image/webp':'image/avif';}
 res.setHeader('Content-Type',type);res.setHeader('Accept-Ranges','bytes');
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
 if(range){const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):size-1,size-1);if(start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});if(req.method==='HEAD')return res.end();return fs.createReadStream(abs,{start,end}).pipe(res);}
 res.setHeader('Content-Length',size);if(req.method==='HEAD')return res.end();fs.createReadStream(abs).pipe(res);
 }catch(e){console.error(e.message);res.writeHead(500);res.end('Local preview error');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local reference running at http://127.0.0.1:${port}`));
