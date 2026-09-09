import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {routes,getMetadata,SITE_URL} from '../src/seo.js';
const titles=new Set();
for (const route of routes) {
 const html=await fs.readFile(route==='/'?'dist/index.html':`dist${route}.html`,'utf8');
 const meta=getMetadata(route);
 assert.ok(html.includes(`<title>${meta.title}</title>`),`title: ${route}`);
 assert.ok(html.includes(`rel="canonical" href="${meta.canonical}"`),`canonical: ${route}`);
 assert.ok(html.includes('<h1'),`pre-rendered heading: ${route}`);
 assert.ok(html.includes('google-adsense-account'),`verification: ${route}`);
 assert.ok(!html.includes('adsbygoogle.js'),`no premature ad loading: ${route}`);
 assert.ok(html.includes('application/ld+json'),`schema: ${route}`);
 assert.ok(!titles.has(meta.title),`unique title: ${route}`);titles.add(meta.title);
 for(const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){
  const href=match[1];
  if(href==='/'||routes.includes(href))continue;
  await fs.access('dist'+href).catch(()=>{throw Error(`Broken local asset/link ${href} on ${route}`)});
 }
}
const sitemap=await fs.readFile('dist/sitemap.xml','utf8');
for(const route of routes)assert.ok(sitemap.includes(`<loc>${SITE_URL}${route}</loc>`));
assert.match(await fs.readFile('dist/ads.txt','utf8'),/^google\.com, pub-8822390092931181, DIRECT, f08c47fec0942fa0\s*$/);
assert.ok((await fs.readFile('dist/404.html','utf8')).includes('noindex, follow'));
const files=await fs.readdir('dist');
for(const name of ['package.json','package-lock.json','vercel.json','vite.config.js','finops-planner-update-v10.zip','finops-planner-adsense-logic-logo-ready-v2.zip'])assert.ok(!files.includes(name),`private build file leaked: ${name}`);
const config=JSON.parse(await fs.readFile('vercel.json','utf8'));
assert.equal(config.cleanUrls,true);assert.equal(config.rewrites,undefined);
for(const redirect of config.redirects)assert.ok(routes.includes(redirect.destination));
console.log(`Verified ${routes.length} rendered routes, canonical URLs, local links/assets, schema, sitemap, ads.txt, redirects and 404.`);
