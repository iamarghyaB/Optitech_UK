import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { legacyProjectSlugs } from '../content/projects.mjs';

const root = process.cwd();
const mime = {
  '.html':'text/html; charset=utf-8', '.rsc':'text/x-component',
  '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.woff2':'font/woff2', '.woff':'font/woff',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.jfif':'image/jpeg',
  '.webp':'image/webp', '.avif':'image/avif', '.svg':'image/svg+xml',
  '.ico':'image/x-icon', '.mp4':'video/mp4', '.webm':'video/webm',
  '.mp3':'audio/mpeg', '.wav':'audio/wav', '.ktx2':'image/ktx2',
  '.wasm':'application/wasm', '.vtt':'text/vtt',
};
const misses = new Set();
const staticAssets = process.env.VERCEL === '1'
  ? JSON.parse(fs.readFileSync(path.join(root, 'reference-assets.json'), 'utf8')) : null;

function assetKey(url) {
  const u = new URL(url, 'https://pensatori-irrazionali.com');
  u.searchParams.delete('dpl');
  u.searchParams.sort();
  return u.href;
}
function resolveImage(u) {
  let source = u.searchParams.get('url') || '';
  // Portfolio covers and screenshots are local; the archived renderer still
  // requests them through its existing responsive Next image loader.
  if (source.startsWith('/assets/portfolio/')) {
    const full = source.slice(1).split('?')[0];
    const width = Number(u.searchParams.get('w'));
    const size = [256, 640, 1280].find(value => value >= width);
    if (width > 0 && size && !full.includes('/responsive/')) {
      const variant = full.replace(/\/([^/]+)\.webp$/, `/responsive/$1-${size}.webp`);
      if (staticAssets ? Object.hasOwn(staticAssets, variant) : fs.existsSync(path.join(root, variant))) return variant;
    }
    return full;
  }
  source = source.replace('/assets/cms','https://cms.pensatori-irrazionali.com')
    .replace('/assets/cdn','https://assets.pensatori-irrazionali.com');
  const original = new URL('/_next/image','https://pensatori-irrazionali.com');
  original.searchParams.set('url',source);
  original.searchParams.set('w',u.searchParams.get('w')||'1920');
  original.searchParams.set('q',u.searchParams.get('q')||'75');
  const exact = 'assets/optimized/'+crypto.createHash('sha1').update(assetKey(original.href)).digest('hex')+'.webp';
  if (staticAssets ? Object.hasOwn(staticAssets, exact) : fs.existsSync(path.join(root, exact))) return exact;
  const p = new URL(source,'https://pensatori-irrazionali.com');
  return 'assets/'+(p.hostname.startsWith('cms.')?'cms':p.hostname.startsWith('assets.')?'cdn':'site')+decodeURIComponent(p.pathname);
}

export async function serveReference(request, overridePath) {
  try {
    const u = new URL(request.url);
    let route = overridePath || decodeURIComponent(u.pathname);
    if (legacyProjectSlugs.some(slug => route === `/work/${slug}`)) return new Response(null, { status: 308, headers: { Location: '/work' } });
    const routes = JSON.parse(fs.readFileSync(path.join(root, 'routes.json'),'utf8'));
    if (route === '/__health') return Response.json({pages:Object.keys(routes).length, missing:[...misses]});
    if (route === '/index.html') route = '/';
    let file;
    const headers = new Headers({'Cache-Control':'no-store','Accept-Ranges':'bytes'});
    if (Object.hasOwn(routes, route)) {
      file = request.headers.get('rsc') === '1' ? routes[route].rsc : routes[route].html;
      headers.set('Vary','RSC, Next-Router-State-Tree, Next-Router-Prefetch');
    } else if (route === '/_next/image') file = resolveImage(u);
    else if (route.startsWith('/assets/')) file = route.slice(1);
    else file = 'assets/site'+route;
    // Media belongs on the static CDN, outside server function bundles.
    if (staticAssets && file.startsWith('assets/')) {
      if (!Object.hasOwn(staticAssets, file)) {
        misses.add(u.pathname + u.search);
        return new Response('Local asset not found', { status: 404 });
      }
      return new Response(null, { status: 307, headers: { Location: '/' + file.split('/').map(encodeURIComponent).join('/') } });
    }
    let abs, boundary;
    if (file === 'index.html') abs = path.join(root, 'index.html');
    else if (file.startsWith('pages/')) {
      boundary = path.join(root, 'pages');
      abs = path.join(root, 'pages', file.slice(6));
    } else if (file.startsWith('assets/')) {
      boundary = path.join(root, 'assets');
      abs = path.join(root, 'assets', file.slice(7));
    } else return new Response('Forbidden',{status:403});
    if (boundary && !abs.startsWith(boundary+path.sep)) return new Response('Forbidden',{status:403});
    let stat;
    try { stat = fs.statSync(abs); } catch {}
    if (!stat?.isFile()) {
      misses.add(u.pathname+u.search);
      return new Response('Local asset not found',{status:404});
    }
    const size = stat.size;
    const fd = fs.openSync(abs,'r');
    const head = Buffer.alloc(Math.min(size,160));
    try { fs.readSync(fd,head,0,head.length,0); } finally { fs.closeSync(fd); }
    if (head.toString().startsWith('version https://git-lfs.github.com/spec/v1')) {
      return new Response('Git LFS media is not restored. Run git lfs pull or npm run assets:restore.',{status:503});
    }
    let type = mime[path.extname(abs)] || 'application/octet-stream';
    if (file.startsWith('assets/optimized/')) type = head[0]===255?'image/jpeg':head[0]===137?'image/png':head.subarray(0,4).toString()==='RIFF'?'image/webp':'image/avif';
    headers.set('Content-Type',type);
    if (staticAssets && (file.endsWith('.html') || file.endsWith('.rsc'))) {
      const body = Buffer.from(fs.readFileSync(abs, 'utf8').replaceAll('/_next/image', '/api/reference-image'));
      headers.set('Content-Length', String(body.length));
      return new Response(request.method === 'HEAD' ? null : body, { headers });
    }
    let status=200, start=0, end=size-1;
    const range=request.headers.get('range');
    if (range) {
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1]&&!match[2])) return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
      if (!match[1]) start=Math.max(0,size-Number(match[2]));
      else { start=Number(match[1]); if(match[2]) end=Math.min(Number(match[2]),size-1); }
      if(start>=size || end<start) return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
      status=206;
      headers.set('Content-Range','bytes '+start+'-'+end+'/'+size);
    }
    headers.set('Content-Length',String(Math.max(0,end-start+1)));
    if(request.method==='HEAD' || size===0) return new Response(null,{status,headers});
    // Closing a page can cancel a video response while a disk read is pending.
    // Guard that boundary so cancelled streams never enqueue into a closed controller.
    const handle = await fs.promises.open(abs, 'r');
    let position = start, cancelled = false, fileClosed = false;
    const close = async () => { if (!fileClosed) { fileClosed = true; await handle.close(); } };
    const body = new ReadableStream({
      async pull(controller) {
        try {
          const buffer = Buffer.alloc(Math.min(65536, end - position + 1));
          const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
          if (cancelled) return;
          if (bytesRead) { position += bytesRead; controller.enqueue(buffer.subarray(0, bytesRead)); }
          if (!bytesRead || position > end) { controller.close(); await close(); }
        } catch (error) { if (!cancelled) controller.error(error); await close(); }
      },
      async cancel() { cancelled = true; await close(); },
    });
    return new Response(body,{status,headers});
  } catch (error) {
    console.error('Reference route:',error.message);
    return new Response('Local preview error',{status:500});
  }
}
