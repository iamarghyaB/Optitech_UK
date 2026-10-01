import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { agency, capabilities, replacements } from '../content/agency-content.mjs';
const require = createRequire(import.meta.url);
const acorn = require('next/dist/compiled/acorn/acorn.js');
const sharp = require('sharp');
const map = new Map(Object.entries(replacements));
const add = (a,b) => { if(typeof a==='string' && a.trim()) map.set(a.trim(),b); };
const decode = s => s.replace(/&(?:amp|quot|apos|lt|gt|#x[0-9a-f]+|#\d+);/gi,e=>({ '&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'}[e] ?? String.fromCodePoint(e.startsWith('&#x')?parseInt(e.slice(3),16):parseInt(e.slice(2)))));
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const platforms = agency.platforms;
const svg = label => `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="450" viewBox="0 0 1000 450"><title>${escape(label)}</title><text x="500" y="260" text-anchor="middle" font-family="Arial,sans-serif" font-size="${label.length>18?54:90}" font-weight="600" fill="#222">${escape(label)}</text></svg>`;
await fs.mkdir('assets/local/platforms',{recursive:true});
for(let i=0;i<=50;i++)await fs.writeFile(`assets/local/platforms/${i}.svg`,svg(platforms[i%platforms.length]));
const originalHome=await fs.readFile('research/pages/home.html','utf8');
const originalLogo=originalHome.match(/<svg\b[^>]*viewBox="0 0 356 266"[^>]*>([\s\S]*?)<\/svg>/)?.[1]||'';
const brandPaths=[...originalLogo.matchAll(/<path\b[^>]*>[\s\S]*?<\/path>/g)].slice(0,3).map(m=>m[0]).join('');
await fs.writeFile('assets/local/optitech.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 356 266"><title>Optitech</title>'+brandPaths+'<text x="178" y="242" text-anchor="middle" font-family="Georgia,serif" font-size="60" font-weight="700" fill="currentColor">OPTITECH</text></svg>');
const socialImage='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f5f5f5"/><text x="80" y="180" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="#303030">Optitech</text><text x="80" y="300" font-family="Arial,sans-serif" font-size="46" fill="#303030">Digital systems built to grow your business.</text><text x="80" y="390" font-family="Arial,sans-serif" font-size="30" fill="#303030">Web Development · SEO · Paid Media · Automation</text><text x="80" y="510" font-family="Arial,sans-serif" font-size="26" fill="#303030">Supporting businesses across London and the UK</text></svg>';
await sharp(Buffer.from(socialImage)).png().toFile('assets/local/optitech-og.png');
const seen=new Set(), clientNames=new Map(); let clientIndex=0, projectIndex=0, insightIndex=0;
const demoTitles=['Website Demo','Store Demo','Landing Page Demo','Growth Demo','CRM Demo','Local SEO Demo','Platform Demo','Search Demo','Campaign Demo','Booking Demo','Automation Demo'];
function richText(value, replacement){
 if(typeof value==='string'){add(value,replacement);return;}
 if(!value||typeof value!=='object')return;
 if(value._type==='span' && typeof value.text==='string')add(value.text,replacement);
 for(const v of Object.values(value))if(typeof v==='object')richText(v,replacement);
}
function logo(value,i){
 if(!value||typeof value!=='object')return;
 if(typeof value.url==='string'&&value.url)add(value.url,`/assets/local/platforms/${i%50+1}.svg`);
 for(const v of Object.values(value))if(typeof v==='object')logo(v,i);
}
function collect(x){
 if(!x||typeof x!=='object')return;
 if(x._type==='project'&&!seen.has('project'+x._id)){
  seen.add('project'+x._id);const i=projectIndex++, title=demoTitles[i%demoTitles.length];
  add(x.title,title); add(x.company,'Design reference');
  if(x.projectOrigin?.subbrand)add(x.projectOrigin.subbrand,'Demo reference');
  richText(x.description,'Demo design reference. Existing third-party imagery is retained to demonstrate the interface and motion; it is not an Optitech client commission. We plan websites, visibility and lead follow-up around UK business goals.');
  richText(x.galleryDescription,'Reference media only. No client relationship or performance result is claimed. A live project would include an agreed brief, delivery scope and measured outcomes.');
  richText(x.collage,'Visual reference · demo content');richText(x.stories,'Visual reference · demo content');
  logo(x.logo,i);
  if(x.projectInfo?.director)add(x.projectInfo.director,'Reference media');
 }
 if(x._type==='client'&&!seen.has('client'+x._id)){
  seen.add('client'+x._id);const i=clientIndex++, label=capabilities[i%capabilities.length];
  const chosen=i>=65?['Reporting: Organic Traffic','Reporting: Keyword Visibility','Reporting: Leads & Conversions','Reporting: Campaigns & Cost per Lead','Reporting: Website Performance','Reporting: Completed Work & Next Priorities'][(i-65)%6]:i>=55?agency.faqs[(i-55)%10][0]:i>=48?agency.pricing[i-48]:i>=42?'How we work: '+agency.process[i-42]:label;
  clientNames.set(x.name,chosen);
  add(x.name,chosen);add(x.title,'UK Digital Solutions');
  const faq=agency.faqs.find(([q])=>q===label);
  const answer=agency.faqs.find(([q])=>q===chosen)?.[1];
  richText(x.description,answer ?? `${chosen}. We agree the scope around your business goals, connect the right tools and provide clear communication throughout delivery. Visuals are design references, not client examples. Ask for a tailored proposal.`);
  logo(x.logo,i);
 }
 if(x.tag&&x.date&&typeof x.description==='string'){
  const service=['WEB DEVELOPMENT','SEO & LOCAL SEO','GOOGLE ADS','META ADS','E-COMMERCE','CRM & AUTOMATION','AI SOLUTIONS'][Number(x._id)%7];
  add(x.title,service);add(x.tag,'Service');add(x.description,agency.positioning);add(x.link,'/contact');if(typeof x.image==='string')add(x.image,'/assets/local/platforms/1.svg');
 }
 if(x._id && !x._type && x.title && x.link && (x.image||x.video) && !x.date && !seen.has('insight'+x._id)){
  seen.add('insight'+x._id);add(x.title,'Design reference '+(++insightIndex)+' · Demo media');
  if(x.link.externalUrl && x.link.externalUrl!=='$undefined')add(x.link.externalUrl,'/contact');
 }
 for(const v of Object.values(x))collect(v);
}
// Read only unmodified CMS snapshots to build a deterministic translation map.
for(const file of await fs.readdir('research/pages'))if(file.endsWith('.rsc')){
 for(const line of (await fs.readFile('research/pages/'+file,'utf8')).split('\n')){
  try{collect(JSON.parse(line.slice(line.indexOf(':')+1)));}catch{}
 }
}
for(let i=2018;i<=2025;i++)add('Since '+i,['Discover','Strategy','Design','Build','Launch','Grow','Report','Optimise'][i-2018]);
// Shared short strings can also occur inside CMS credits. Agency copy wins.
for(const [a,b] of Object.entries(replacements))add(a,b);
add('Pensatori Irrazionali',agency.name);
for(const [a,b] of [['Mayweather','Website Demo'],['Neymar Jr.','Store Demo'],['Vodafone','Landing Page Demo'],['FaZe Clan','Growth Demo'],['FaZe x Lyrical Lemonade','Growth Demo'],['Cadillac','CRM Demo'],['SOHub','Platform Demo'],['Tsioulka','Search Demo'],['Wanderers','Local SEO Demo'],['David Beckham','Automation Demo'],['Uber','Booking Demo'],['Nicki Minaj','Campaign Demo']])add(a,b);
for(const [a,b] of [['Branding','SEO'],['Websites','Web Development'],['Gaming','Automation'],['Production','Media']])add(`LEARN MORE ABOUT ${a} — LET'S WORK —`,`LEARN MORE ABOUT ${b} — LET'S WORK —`);
add('Video Production','Paid Media');add('Production','Media');add('More News','More Services');
add('UI / UX','AI Tools');add('Corporate','Demo reference');add('Contact us','Book a Free Strategy Call');
add('IS NOT','FOR');add('to live forever','your digital growth');add('it is','ready');add('THAT WILL','digital systems');
const firstLetters={'T':'O','H':'N','E I':'E T','D':'E','E':'A','A':'M'};
const lastLetters={'S':'C','M':'N','E':'N','THI':'ECT','N':'E','G':'D'};
function letters(x,dict){if(typeof x==='string')return dict[x]??x;if(Array.isArray(x))return x.map(v=>letters(v,dict));if(x&&typeof x==='object'){const o={...x};for(const k of ['children','letter'])if(k in o)o[k]=letters(o[k],dict);return o;}return x;}
for(const [old,next] of [...map])if(old.startsWith('https://cms.pensatori-irrazionali.com'))add(old.replace('https://cms.pensatori-irrazionali.com','/assets/cms'),next);
function translate(s){
 const trimmed=s.trim();
 if(activeRoute==='/clients'&&clientNames.has(trimmed))return s.replace(trimmed,clientNames.get(trimmed));
 if(map.has(trimmed))return s.slice(0,s.indexOf(trimmed))+map.get(trimmed)+s.slice(s.indexOf(trimmed)+trimmed.length);
 if(/^mailto:/.test(s))return '/contact';
 if(/^https?:\/\/(?:www\.)?(?:linkedin\.com|instagram\.com|twitter\.com|x\.com|aeva\.(?:com|ae)|maps\.app\.goo\.gl)/.test(s))return '/contact';
 if(s==='https://pensatori-irrazionali.com')return agency.url;
 if(s==='https://pensatori-irrazionali.com/ogImage.png')return agency.url+'/assets/local/optitech-og.png';
 if(/^(?:\/assets|\/static|https?:\/\/assets|https?:\/\/cms|image-|file-|payload-|[A-Za-z0-9_]+\.[a-z0-9]+$)/.test(s))return s;
 return s.replaceAll('Pensatori Irrazionali','Optitech').replaceAll('PENSATORI IRRAZIONALI','OPTITECH').replaceAll('pensatori-irrazionali.com','optitech-uk.vercel.app')
 .replaceAll('hello@optitech-uk.vercel.app','the contact form').replaceAll('jobs@optitech-uk.vercel.app','the contact form')
 .replaceAll('project inquiry','project enquiry').replaceAll('career inquiry','career enquiry').replaceAll('inquiries','enquiries').replaceAll('organizational','organisational').replaceAll('unauthorized','unauthorised');
}
let activeRoute='/';
const projectLabels={'floyd-mayweather':'Website Demo','neymar-jr':'Store Demo','vodafone-cash':'Landing Page Demo','faze-x-lyrical-lemonade':'Growth Demo','cadillac':'CRM Demo','sohub-website':'Platform Demo','tsioulka':'Search Demo','wanderworlds':'Local SEO Demo','david-beckham':'Automation Demo','get-moving':'Booking Demo','anaconda':'Campaign Demo'};
function pageTitle(route){return (route==='/'?'Web Development & Digital Marketing Agency UK':route==='/clients'?'Digital Solutions for UK Businesses':route==='/universe'?'Design References & Digital Insights':route==='/contact'?'Plan Your Digital Growth':route==='/work'?'Selected Demo Work':route.includes('policy')?route.includes('privacy')?'Privacy Policy':'Cookie Policy':projectLabels[route.split('/').at(-1)]||'Demo Design Reference')+' | Optitech';}
function pageDescription(route){return route==='/'?agency.description:route==='/contact'?'Discuss your UK business website, SEO, paid media or automation project with Optitech. Start with a clear brief and tailored proposal.':route==='/clients'?'Explore web development, e-commerce, search marketing, CRM and automation solutions for UK businesses, with starting prices and common questions.':route==='/universe'?'Explore visual design references for digital experiences. Retained media is reference material, not a claim of Optitech client work.':route==='/work'?'Browse labelled demo design references for website interfaces and motion. No client relationship or performance result is claimed.':route.includes('policy')?'Read the '+(route.includes('privacy')?'privacy':'cookie')+' information for the Optitech website and its current contact and browser preferences.':'View a labelled demo design reference with retained interface, media and motion. This is not an Optitech client commission.';}
function tree(x){
 if(typeof x==='string')return translate(x);
 if(Array.isArray(x)){
  const out=x.map(tree);
  if(x[0]==='$' && x[1]==='title' && out[3])out[3].children=pageTitle(activeRoute);
  if(x[0]==='$' && x[1]==='h1' && x[3]?.className==='sr-only' && out[3] && activeRoute==='/')out[3].children=agency.headline;
  if(x[0]==='$' && /^line line-[13] /.test(x[3]?.className||''))out[3].children=letters(out[3].children,x[3].className.includes('line-1')?firstLetters:lastLetters);
  return out;
 }
 if(x&&typeof x==='object'){
  const out={};for(const [k,v] of Object.entries(x))out[k]=['className','style','d','id','_ref','_key','current','filename'].includes(k)?v:tree(v);
  if(x.name==='description'||x.name==='twitter:description'||x.property==='og:description')out.content=pageDescription(activeRoute);
  if(x.name==='twitter:title'||x.property==='og:title')out.content=pageTitle(activeRoute);
  if(x['aria-label']==='Primary')out['data-lenis-prevent']='true';
 if(x['@type']==='Organization'){
   delete out.address;delete out.email;delete out.telephone;delete out.sameAs;
   out.name='Optitech';out.url=agency.url;out.description=agency.description;out.areaServed='United Kingdom';out.logo=agency.url+'/assets/local/optitech.svg';
  }
  return out;
 }return x;
}
function records(s){
 return s.split('\n').map(l=>{const p=l.indexOf(':');if(p<0)return l;const value=l.slice(p+1);try{return l.slice(0,p+1)+JSON.stringify(tree(JSON.parse(value)));}catch{return l;}}).join('\n');
}
function flight(s){
 const b=Buffer.from(s), latin=b.toString('latin1'), re=/(?:^|\n)([0-9a-f]+):T([0-9a-f]+),/g;
 let out='',last=0,m;while((m=re.exec(latin))){const start=m.index+(m[0][0]==='\n'?1:0),from=m.index+m[0].length,to=from+parseInt(m[2],16);
  out+=records(b.subarray(last,start).toString());const v=translate(b.subarray(from,to).toString());out+=m[1]+':T'+Buffer.byteLength(v).toString(16)+','+v;last=to;re.lastIndex=to;
 }return out+records(b.subarray(last).toString());
}
function html(s,route){
 const scripts=[];
 s=s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,tag=>`<!--OPTITECH_SCRIPT_${scripts.push(tag)-1}-->`);
 s=s.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g,(tag,js)=>{
  if(js.includes('__next_f'))tag=tag.replace(/\.push\((\[1,[\s\S]*\])\);?<\/script>$/,(_,json)=>{const d=JSON.parse(json);d[1]=flight(d[1]);return '.push('+JSON.stringify(d).replaceAll('<','\\u003c')+');</script>';});
  else if(tag.includes('application/ld+json')){try{tag=tag.replace(js,JSON.stringify(tree(JSON.parse(js))));}catch{}}
  const i=scripts.push(tag)-1;return `<!--OPTITECH_SCRIPT_${i}-->`;
 });
 s=s.split(/(<[^>]*>)/g).map(part=>{
  if(part[0]!=='<')return escape(translate(decode(part)));
  return part.replace(/\b(href|src|srcSet|alt|content|aria-label)="([^"]*)"/g,(_,attr,value)=>{
   let v=translate(decode(value));
   if(attr==='src'||attr==='srcSet'){
    const urls=[...v.matchAll(/\/_next\/image\?url=([^& ,]+)/g)];
    const replacement=urls.length?translate(decodeURIComponent(urls[0][1])):null;
    if(replacement?.startsWith('/assets/local/platforms/'))v=replacement+(attr==='srcSet'?' 1x':'');
   }
   return `${attr}="${escape(v)}"`;
  });
 }).join('');
 s=s.replace(/<!--OPTITECH_SCRIPT_(\d+)-->/g,(_,i)=>scripts[i]);
 s=s.replace(/<title>[^<]*<\/title>/,`<title>${pageTitle(route)}</title>`);
 s=s.replace(/(<meta (?:name="(?:description|twitter:description)"|property="og:description") content=")[^"]*/g,'$1'+escape(pageDescription(route)));
 s=s.replace(/(<meta (?:name="twitter:title"|property="og:title") content=")[^"]*/g,'$1'+escape(pageTitle(route)));
 if(route==='/')s=s.replace(/(<h1 class="sr-only">)[^<]*(<\/h1>)/,`$1${agency.headline}$2`);
 s=s.replace(/<html lang="en"/,'<html lang="en-GB"');
 s=s.replace('<nav aria-label="Primary"', '<nav data-lenis-prevent="true" aria-label="Primary"');
 s=s.replace(/(<div class="line line-([13]) [^>]+>)([\s\S]*?)(?=<div class="line line-2 |<img alt="" loading="lazy" width="550")/g,(all,open,line,inside)=>open+inside.replace(/>([^<>]+)</g,(tag,text)=>'>'+((line==='1'?firstLetters:lastLetters)[text]??text)+'<').replace(/(<\/span>)(E I|A|THI|G)(?=<)/g,(_,close,text)=>close+((line==='1'?firstLetters:lastLetters)[text]??text)));
 s=s.replace(/(<svg\b[^>]*viewBox="0 0 356 266"[^>]*>)([\s\S]*?)(<\/svg>)/g,(_,open,inside,close)=>open+[...inside.matchAll(/<path\b[^>]*>[\s\S]*?<\/path>/g)].slice(0,3).map(m=>m[0]).join('')+'<text x="178" y="242" text-anchor="middle" font-family="Georgia,serif" font-size="60" font-weight="700" fill="currentColor">OPTITECH</text>'+close);
 return s;
}
const routes=JSON.parse(await fs.readFile('routes.json','utf8'));
for(const [route,files] of Object.entries(routes)){
 activeRoute=route;
 await fs.writeFile(files.html,html(await fs.readFile(files.html,'utf8'),route));
 await fs.writeFile(files.rsc,flight(await fs.readFile(files.rsc,'utf8')));
}
let changed=0;
for(const file of await fs.readdir('assets/site/_next/static/chunks'))if(file.endsWith('.js')){
 if(!['0.0ku6myxt_27.js','04rtv_jfzwvzy.js','068fq8h1ymnjo.js','08-om41l.yg-h.js','0fm1kie0c60_p.js','0ndy1i9m_~.sw.js','0oo84nz.jrles.js','0xhnisy4i1o1s.js','0zb9pymy317.5.js'].includes(file))continue;
 const target=path.join('assets/site/_next/static/chunks',file);let s=await fs.readFile(target,'utf8'), edits=[];
 const tokens=acorn.tokenizer(s,{ecmaVersion:'latest',sourceType:'module'});for(;;){const t=tokens.getToken();if(t.type.label==='eof')break;if(t.type.label==='string'){const v=translate(t.value);if(v!==t.value)edits.push([t.start,t.end,JSON.stringify(v)]);}}
 for(const [from,to,value] of edits.reverse())s=s.slice(0,from)+value+s.slice(to);
 if(file==='04rtv_jfzwvzy.js')s=s.replace('children:"Optitech"','children:'+JSON.stringify(agency.headline));
 if(file==='068fq8h1ymnjo.js'){
  function patchLetters(part,dict){let edits=[];for(const t of acorn.tokenizer(part,{ecmaVersion:'latest'}))if(t.type.label==='string'&&dict[t.value])edits.push([t.start,t.end,JSON.stringify(dict[t.value])]);for(const[a,b,v]of edits.reverse())part=part.slice(0,a)+v+part.slice(b);return part;}
  const start=s.indexOf('src:"/static/images/quoteAngel2.png"'),end=s.indexOf('x[4]===',start);
  if(start>=0&&end>start)s=s.slice(0,start)+patchLetters(s.slice(start,end),firstLetters)+s.slice(end);
  const from=s.indexOf('x[8]===',start),to=s.indexOf('x[12]===',from);
  if(from>=0&&to>from)s=s.slice(0,from)+patchLetters(s.slice(from,to),lastLetters)+s.slice(to);
 }
 // Let the menu scroll natively while the background smooth scroll is locked.
 if(file==='08-om41l.yg-h.js')s=s.replace('\"aria-label\":\"Primary\",className:', '\"aria-label\":\"Primary\",\"data-lenis-prevent\":\"true\",className:');
 // The existing randomised logo animation keeps its geometry and timing.
 s=s.replaceAll('/static/images/logos/${e}.png','/assets/local/platforms/${e}.svg');
 // Clipboard data is a contact URL, never an invented business email.
 s=s.replace('clipboard.writeText("Book a Free Strategy Call")','clipboard.writeText("'+agency.url+'/contact")');
 acorn.parse(s,{ecmaVersion:'latest',sourceType:'module'});
 if(edits.length||s.includes('/assets/local/platforms/${e}.svg')){await fs.writeFile(target,s);changed++;}
}
await fs.writeFile('content/generated-copy-map.json',JSON.stringify(Object.fromEntries(map),null,2));
console.log(`Optitech content: ${Object.keys(routes).length} routes, ${changed} client bundles; animation and stylesheet code preserved.`);
// Replace only the vector wordmark's lettering; keep the original emblem.
const logoFile='assets/site/_next/static/chunks/0.q~j-7_ps6pq.js';
let logoCode=await fs.readFile(logoFile,'utf8');const ast=acorn.parse(logoCode,{ecmaVersion:'latest',sourceType:'module'});
let logoEdit;
function visit(n){
 if(!n||typeof n!=='object')return;
 if(n.type==='ObjectExpression' && n.properties.some(p=>p.key?.name==='viewBox'&&p.value?.value==='0 0 356 266')){
  const c=n.properties.find(p=>p.key?.name==='children').value;
  logoEdit=[c.start,c.end,'['+c.elements.slice(0,3).map(e=>logoCode.slice(e.start,e.end)).join(',')+',(0,H.jsx)("text",{x:"178",y:"242",textAnchor:"middle",fontFamily:"Georgia,serif",fontSize:"60",fontWeight:"700",fill:"currentColor",children:"OPTITECH"})]'];
 }
 for(const v of Object.values(n))if(v&&typeof v==='object'){if(Array.isArray(v))v.forEach(visit);else visit(v);}
}
visit(ast);if(logoEdit){const[a,b,v]=logoEdit;logoCode=logoCode.slice(0,a)+v+logoCode.slice(b);acorn.parse(logoCode,{ecmaVersion:'latest',sourceType:'module'});await fs.writeFile(logoFile,logoCode);}
