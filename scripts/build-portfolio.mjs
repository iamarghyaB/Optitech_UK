import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import sharp from 'sharp';
import { projects, portfolioAttribution, legacyProjectSlugs } from '../content/projects.mjs';
import { createPortfolioSections } from '../components/portfolio/sections.mjs';
import { patchFactory, patchFunction, elementBounds, serverModules, parse } from './portfolio-archive.mjs';

const workChunk = 'assets/site/_next/static/chunks/0mev8.m5ulcaj.js';
const detailChunk = 'assets/site/_next/static/chunks/0fm1kie0c60_p.js';
const attribution = `(0,t.jsx)("p",{className:"portfolio-attribution",children:${JSON.stringify(portfolioAttribution)}})`;
let workCode = await fs.readFile(workChunk, 'utf8');
workCode = patchFactory(workCode, 647267, code => {
  if (!code.includes('portfolio-attribution')) code = code.replace('children:[el,ef,ep]', `children:[el,ef,${attribution},ep]`);
  // Card categories occupy the existing company label; animation handlers and
  // cloned slides remain unchanged. Only the middle copy enters the tab order.
  code = code.replace('children:[b.title," ",g]', 'children:[b.title," ",g," ↗"]');
  code = code.replace('alt:b.title,width:1920', 'alt:b.mainImage.alt??b.title,width:1920');
  code = code.replace('width:1920,height:1080,priority:!0,className:"w-full h-full object-cover select-none"', 'width:1920,height:1080,sizes:"(min-width: 1280px) 17vw, 100vw",priority:!0,className:"w-full h-full object-cover select-none"');
  code = code.replace('alt:e.title,width:1920', 'alt:e.mainImage.alt??e.title,width:1920');
  const mobileLogo = '(0,t.jsx)(o.default,{src:(0,l.urlForImage)(e.logo)?.url()??"",alt:e.title,width:200,height:200,className:"w-12 h-8 object-contain object-top-right"})';
  code = code.replace(mobileLogo, '(0,t.jsxs)("span",{className:"text-[#5E5E5E] text-sm text-right work-mobile-category",children:[e.category.title," ↗"]})');
  code = code.replace('type:"button",onClick:()=>{eG(r)}', 'type:"button","aria-label":e.title+" — "+e.category.title,onClick:()=>{eG(r)}');
  return code;
});
// The archive has three copies of ProjectItem, loaded by different routes.
// Apply the same optional-logo handling to each to avoid hydration differences.
function projectItem(code) {
  code = code.replace(/([\w$])=\(0,([a-z])\.jsx\)\(([a-z])\.default,\{src:([a-zA-Z]),alt:([a-zA-Z])\.title,width:200/, '$1=$5.logo&&(0,$2.jsx)($3.default,{src:$4,alt:$5.title,width:200');
  code = code.replace(/alt:([a-zA-Z])\.title,width:1920/g, 'alt:$1.mainImage.alt??$1.title,width:1920');
  code = code.replace(/autoStart:!1,text:([a-zA-Z])\.title/, 'autoStart:!1,wrap:!!$1.portfolio,text:$1.title');
  return code;
}
workCode = patchFactory(workCode, 783284, projectItem);
await fs.writeFile(workChunk, workCode);
for (const file of ['0py7j~n6omce9.js', '0xhnisy4i1o1s.js']) {
  const path = `assets/site/_next/static/chunks/${file}`;
  await fs.writeFile(path, patchFactory(await fs.readFile(path, 'utf8'), 783284, projectItem));
}

let detailCode = await fs.readFile(detailChunk, 'utf8');
detailCode = patchFactory(detailCode, 707444, code => {
  const sections = `var portfolioSections=(${createPortfolioSections.toString()})(l);`;
  // Regenerate only the embedded content renderer on subsequent builds.
  if (code.includes('var portfolioSections=')) {
    const at = code.indexOf('var portfolioSections='), end = code.indexOf(';function c(', at);
    assert(end > at, 'Embedded portfolio renderer boundary');
    code = code.slice(0, at) + sections + code.slice(end + 1);
  } else code = code.replace('function c(', sections + 'function c(');
  code = patchFunction(code, 'c', fn => fn.replaceAll(',deliveryPartner:h.portfolio?"Makezaa":null', '').replace('BY PENSATORI IRRAZIONALI', 'BY MAKEZAA').replace('children:[t,r,d]', 'children:[t,r,h.portfolio?portfolioSections.summary(h.portfolio):null,d]').replace('hideNumber:!0,title:n,number:1', 'hideNumber:!0,title:n,number:1,deliveryPartner:h.portfolio?"Makezaa":null'));
  code = patchFunction(code, 'N', fn => fn.includes('portfolioSections.overview') ? fn : fn.replace('{', '{if(e.projectData?.portfolio)return portfolioSections.overview(e.projectData.portfolio);'));
  code = patchFunction(code, 'tP', fn => fn.includes('portfolioSections.details') ? fn : fn.replace('{', '{if(e.projectData?.portfolio)return portfolioSections.details(e.projectData.portfolio,e.projectData.nextProject);'));
  code = patchFunction(code, 'tS', fn => fn.includes('portfolio&&!') ? fn : fn.replace('{', '{if(e.projectData?.portfolio&&!e.projectData.frames?.length)return null;'));
  code = patchFunction(code, 'tC', fn => fn.replaceAll('sizes:"(max-width: 767px) 100vw, 50vw",', '').replace('alt:"",width:g.width', 'alt:h.alt??"",width:g.width').replace('className:"w-full h-full object-cover"', 'sizes:"(max-width: 767px) 100vw, 50vw",className:"w-full h-full object-cover"'));
  code = patchFunction(code, 'tk', fn => fn.replace('children:[r,s]', 'children:[u.portfolio?(0,l.jsx)("h2",{className:"flex items-center gap-2 text-[#707070] text-sm mb-4",children:"Project Screenshots"}):null,r,u.portfolio?null:s]'));
  code = code.replace('className:"work-page relative overflow-x-clip w-screen"', 'className:"work-page relative overflow-x-clip w-screen portfolio-detail"');
  code = code.replace('children:[n,i,s,a,u,d,m,f]', 'children:[n,i,s,a,x.portfolio?m:u,d,x.portfolio?u:m,x.portfolio?portfolioSections.closing(x.portfolio,x.nextProject):null,f]');
  return code;
});
await fs.writeFile(detailChunk, detailCode);
const marqueeChunk = 'assets/site/_next/static/chunks/0oo84nz.jrles.js';
let marqueeCode = await fs.readFile(marqueeChunk, 'utf8');
marqueeCode = patchFactory(marqueeCode, 794479, code => code.includes('e.deliveryPartner?') ? code : code.replace(/(?:e\.serviceDirectory\?"By Optitech":)+"By Optitech · Demo reference"/, 'e.deliveryPartner?"By "+e.deliveryPartner:e.serviceDirectory?"By Optitech":"By Optitech · Demo reference"'));
await fs.writeFile(marqueeChunk, marqueeCode);
const navChunk = 'assets/site/_next/static/chunks/08-om41l.yg-h.js';
let navCode = await fs.readFile(navChunk, 'utf8');
// The existing mobile sound control has a pre-existing hydration mismatch.
// Keep its first render consistent with SSR on portfolio routes; its mounted
// state still uses the same media queries and responsive behaviour.
for (const [variable, query] of [['R', '(max-width: 767px)'], ['B', '(pointer: coarse)']]) {
  navCode = navCode.replace(`${variable}=(0,A.useMediaQuery)(${JSON.stringify(query)},Z.startsWith("/work")?{initializeWithValue:!1}:void 0)`, `${variable}=(0,A.useMediaQuery)(${JSON.stringify(query)})`);
}
for (const [variable, query] of [['CW', '(max-width: 768px)'], ['CV', '(max-width: 1280px)']]) {
  navCode = navCode.replace(`${variable}=(0,A.useMediaQuery)(${JSON.stringify(query)})`, `${variable}=(0,A.useMediaQuery)(${JSON.stringify(query)},typeof location!=="undefined"&&location.pathname.startsWith("/work")?{initializeWithValue:!1}:void 0)`);
}
parse(navCode);
await fs.writeFile(navChunk, navCode);

async function cmsImage(image, key) {
  const { width, height } = await sharp(image.src.slice(1)).metadata();
  assert(width && height, `Missing image dimensions for ${image.src}`);
  return { _type: 'image', _key: key, alt: image.alt, asset: { _type: 'reference', _ref: `image-payload-${key}-${width}x${height}-webp`, url: image.src, width, height } };
}
await fs.mkdir('assets/portfolio/responsive', { recursive: true });
for (const src of new Set(projects.flatMap(p => [p.cover, ...p.gallery]).map(image => image.src))) {
  const name = src.split('/').at(-1).replace('.webp', '');
  for (const width of [256, 640, 1280]) {
    const dest = `assets/portfolio/responsive/${name}-${width}.webp`;
    try { await fs.access(dest); } catch { await sharp(src.slice(1)).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(dest); }
  }
}
const cms = await Promise.all(projects.map(async p => ({
  _id: p.id, _type: 'project', title: p.title, company: p.category,
  slug: { _type: 'slug', current: p.slug }, category: { title: p.detailCategory, slug: { current: p.id } },
  projectOrigin: { subbrand: 'Makezaa' },
  mainImage: await cmsImage(p.cover, `${p.id}-cover`), logo: null, brandColor: '#f5f5f5',
  description: [], collage: { items: [] }, stories: [], frames: [],
  gallery: await Promise.all(p.gallery.map((img, i) => cmsImage(img, `${p.id}-${i}`))),
  galleryDescription: [], portfolio: p,
})));
cms.forEach((p, i) => { const next = cms[(i + 1) % cms.length]; p.nextProject = { title: next.title, slug: next.slug }; });
assert.equal(new Set(cms.map(p => p.slug.current)).size, projects.length);

const modules = await serverModules();
function render(component, props) { return renderToString(React.createElement(component, props)); }
const listing = `<main class="relative z-10 w-full xl:w-fit"><h1 class="sr-only">Work</h1>${render(modules(647267).default, { projects: cms })}</main>`;
const origin = 'https://optitech-uk.vercel.app';
const escape = s => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function rewriteFlight(source, project, next) {
  if (project) source = source.replaceAll('floyd-mayweather', project.slug.current);
  return source.replace(/(^|\n)([\da-f]+):([^\n]*)/g, (record, newline, id, value) => {
    if (!value.startsWith('[') && !value.startsWith('{')) return record;
    let model; try { model = JSON.parse(value); } catch { return record; }
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node) && node[0] === '$') {
        const props = node[3];
        if (node[1] === '$L24' && props?.projects) { props.projects = cms; return; }
        if (node[1] === '$L25' && props?.project) { props.project = project; props.nextProject = next; return; }
        if (node[1] === 'title') props.children = project ? `${project.title} | Optitech Work` : 'Work | Optitech';
        if (node[1] === 'meta' && props) {
          if (props.name === 'description' || props.property === 'og:description' || props.name === 'twitter:description') props.content = project ? project.portfolio.summary : portfolioAttribution;
          if (props.property === 'og:title' || props.name === 'twitter:title') props.content = project ? `${project.title} | Optitech Work` : 'Work | Optitech';
          if (props.property === 'og:url') props.content = origin + (project ? `/work/${project.slug.current}` : '/work');
          if (props.name === 'robots') props.content = 'index, follow';
        }
        if (node[1] === 'link' && props?.rel === 'canonical') props.href = origin + (project ? `/work/${project.slug.current}` : '/work');
      }
      for (const value of Object.values(node)) if (value && typeof value === 'object') walk(value);
    }
    walk(model);
    return `${newline}${id}:${JSON.stringify(model)}`;
  });
}
function document(template, body, project, next) {
  const start = template.indexOf('<main'), end = template.indexOf('</main>', start) + 7;
  assert(start >= 0 && end > start, 'Archive template main element');
  let doc = template.slice(0, start) + body + template.slice(end);
  doc = doc.replace(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g, (_, value) => `self.__next_f.push([1,${JSON.stringify(rewriteFlight(JSON.parse(value), project, next))}])`);
  const title = project ? `${project.title} | Optitech Work` : 'Work | Optitech';
  const description = project ? project.portfolio.summary : portfolioAttribution;
  const canonical = origin + (project ? `/work/${project.slug.current}` : '/work');
  doc = doc.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escape(description)}"/>`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/?>/, '<meta name="robots" content="index, follow"/>')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}"/>`);
  for (const property of ['og:title', 'twitter:title']) doc = doc.replace(new RegExp(`<meta (?:property|name)="${property}" content="[^"]*"\\s*\\/?>`), `<meta ${property.startsWith('twitter:') ? 'name' : 'property'}="${property}" content="${escape(title)}"/>`);
  for (const property of ['og:description', 'twitter:description']) doc = doc.replace(new RegExp(`<meta (?:property|name)="${property}" content="[^"]*"\\s*\\/?>`), `<meta ${property.startsWith('twitter:') ? 'name' : 'property'}="${property}" content="${escape(description)}"/>`);
  doc = doc.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonical}"/>`);
  // Remove unrelated demo media preloads and social covers inherited from the template.
  doc = doc.replace(/<link rel="preload" as="image"[^>]*>/g, '');
  // The archive originally adds a second noindex tag for the reference copy.
  // Keep exactly one robots directive on the genuine portfolio pages.
  doc = doc.replace(/<meta name="robots"[^>]*>/g, '').replace('</head>', '<meta name="robots" content="index, follow"/></head>');
  if (!doc.includes('href="/assets/local/portfolio.css"')) doc = doc.replace('</head>', '<link rel="stylesheet" href="/assets/local/portfolio.css"/></head>');
  if (project) doc = doc.replaceAll('floyd-mayweather', project.slug.current);
  return doc;
}
const [workHtml, workRsc, detailHtml, detailRsc] = await Promise.all(['work.html', 'work.rsc', 'detail.html', 'detail.rsc'].map(file => fs.readFile(`research/portfolio/${file}`, 'utf8')));
await fs.writeFile('pages/work.html', document(workHtml, listing));
await fs.writeFile('pages/work.rsc', rewriteFlight(workRsc));
const routes = JSON.parse(await fs.readFile('routes.json', 'utf8'));
for (const slug of legacyProjectSlugs) delete routes[`/work/${slug}`];
for (const [i, project] of cms.entries()) {
  const next = cms[(i + 1) % cms.length], prefix = `pages/work__${project.slug.current}`;
  const body = render(modules(707444).default, { project, nextProject: next });
  await fs.writeFile(prefix + '.html', document(detailHtml, body, project, next));
  await fs.writeFile(prefix + '.rsc', rewriteFlight(detailRsc, project, next));
  routes[`/work/${project.slug.current}`] = { html: prefix + '.html', rsc: prefix + '.rsc' };
}
await fs.writeFile('routes.json', JSON.stringify(routes, null, 2) + '\n');
parse(workCode); parse(detailCode); parse(marqueeCode);
console.log(`Portfolio: ${projects.length} unique projects; original carousel, gallery and next-project animation retained.`);
