import fs from 'node:fs/promises';
import { universe, universePhotos } from '../content/universe.mjs';

const images = JSON.parse(await fs.readFile('content/universe-images.json', 'utf8'));
const items = universePhotos.map(photo => {
  const image = images.find(record => record.slug === photo.slug);
  if (!image) throw new Error(`Missing Universe image: ${photo.slug}`);
  return {
    _id: `optitech-universe-${photo.slug}`, title: photo.title,
    image: { _type: 'image', alt: photo.alt, asset: {
      _type: 'reference', _ref: `image-payload-universe-${photo.slug}-${image.width}x${image.height}-webp`,
      url: image.url, width: image.width, height: image.height,
      payloadSizes: image.sizes,
    } },
    link: { type: 'none' },
  };
});

function tree(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    const result = value.map(tree);
    if (value[0] === '$' && value[1] === 'title') result[3].children = universe.title;
    if (value[0] === '$' && value[1] === 'main' && value[3]?.className === 'fixed inset-0 bg-[#0a0a0a] text-white') {
      result[3].children = result[3].children.filter(child => child?.[3]?.id !== 'universe-description' && child?.[3]?.id !== 'universe-photo-descriptions');
      result[3].children[0][3].children = universe.heading;
      result[3].children.push(['$', 'p', null, { id: 'universe-description', className: 'sr-only', children: universe.description }]);
      result[3].children.push(['$', 'ul', null, { id: 'universe-photo-descriptions', className: 'sr-only', 'aria-label': 'Universe photographs', children: universePhotos.map(photo => ['$', 'li', photo.slug, { children: photo.alt }]) }]);
      result[3]['aria-describedby'] = 'universe-description';
    }
    return result;
  }
  const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, tree(item)]));
  if (Array.isArray(value.items) && value.items.some(item => item?.image || item?.video)) result.items = items;
  if (value.name === 'description' || value.name === 'twitter:description' || value.property === 'og:description') result.content = universe.description;
  if (value.name === 'twitter:title' || value.property === 'og:title') result.content = universe.title;
  return result;
}

// Flight text records contain byte lengths and must never be split as JSON.
function records(source) {
  return source.split('\n').map(line => {
    const colon = line.indexOf(':');
    if (colon < 0) return line;
    try { return line.slice(0, colon + 1) + JSON.stringify(tree(JSON.parse(line.slice(colon + 1)))); }
    catch { return line; }
  }).join('\n');
}
function flight(source) {
  const bytes = Buffer.from(source), latin = bytes.toString('latin1');
  const pattern = /(?:^|\n)([0-9a-f]+):T([0-9a-f]+),/g;
  let output = '', last = 0, match;
  while ((match = pattern.exec(latin))) {
    const start = match.index + (match[0].startsWith('\n') ? 1 : 0);
    const from = match.index + match[0].length, to = from + parseInt(match[2], 16);
    output += records(bytes.subarray(last, start).toString()) + bytes.subarray(start, to).toString();
    last = to; pattern.lastIndex = to;
  }
  return output + records(bytes.subarray(last).toString());
}
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let html = await fs.readFile('pages/universe.html', 'utf8');
html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (tag, body) => {
  if (!body.includes('__next_f')) return tag;
  return tag.replace(/\.push\((\[1,[\s\S]*\])\);?<\/script>$/, (_, json) => {
    const record = JSON.parse(json); record[1] = flight(record[1]);
    return '.push(' + JSON.stringify(record).replaceAll('<', '\\u003c') + ');</script>';
  });
});
html = html.replace(/<title>[^<]*<\/title>/, `<title>${escape(universe.title)}</title>`)
  .replace(/(<meta (?:name="(?:description|twitter:description)"|property="og:description") content=")[^"]*/g, '$1' + escape(universe.description))
  .replace(/(<meta (?:name="twitter:title"|property="og:title") content=")[^"]*/g, '$1' + escape(universe.title))
  .replace(/(<main\b[^>]*>)<h1 class="sr-only">[^<]*<\/h1>/, `$1<h1 class="sr-only">${escape(universe.heading)}</h1>`)
  .replace(/<p id="universe-description"[^>]*>[\s\S]*?<\/p>|<ul id="universe-photo-descriptions"[^>]*>[\s\S]*?<\/ul>/g, '')
  .replace('<main class="fixed inset-0 bg-[#0a0a0a] text-white">', '<main class="fixed inset-0 bg-[#0a0a0a] text-white" aria-describedby="universe-description">')
  .replace('</main>', `<p id="universe-description" class="sr-only">${escape(universe.description)}</p><ul id="universe-photo-descriptions" class="sr-only" aria-label="Universe photographs">${universePhotos.map(photo => `<li>${escape(photo.alt)}</li>`).join('')}</ul></main>`);
await fs.writeFile('pages/universe.html', html);
await fs.writeFile('pages/universe.rsc', flight(await fs.readFile('pages/universe.rsc', 'utf8')));
// The existing header reads media queries before hydration. On Universe mobile,
// that differed from the archived server markup. Defer only this route's first
// media-query read; subsequent responsiveness and transitions remain unchanged.
const headerPath = 'assets/site/_next/static/chunks/08-om41l.yg-h.js';
const header = await fs.readFile(headerPath, 'utf8');
await fs.writeFile(headerPath, header.replaceAll(
  'typeof location!=="undefined"&&location.pathname.startsWith("/work")?',
  'typeof location!=="undefined"&&(location.pathname.startsWith("/work")||location.pathname==="/universe")?',
));
console.log(`Universe: ${items.length} unique photographs; existing WebGL gallery and styles preserved.`);
