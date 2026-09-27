const fs = require('fs');
const html = fs.readFileSync('research/reference.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)/g)].map(m=>m[1]);
const urls = new Set();
const decoded = html.replace(/\\"/g,'"').replace(/&amp;/g,'&');
for (const m of decoded.matchAll(/(?:https:\/\/[^\s"'<>\\]+|\/(?:_next\/static|static|basis)\/[^\s"'<>\\]+)/g)) urls.add(m[0]);
fs.writeFileSync('research/source-urls.json', JSON.stringify([...urls],null,2));
console.log('Discovered', urls.size, 'URLs');
console.log([...urls].filter(u=>!u.includes('_next/image')).join('\n'));
