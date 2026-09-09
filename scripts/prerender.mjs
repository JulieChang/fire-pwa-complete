import fs from 'node:fs/promises';
import path from 'node:path';
import { render } from '../.prerender/entry-server.js';
import { routes, getMetadata, structuredData, SITE_URL, UPDATED_AT } from '../src/seo.js';
const template = await fs.readFile('dist/index.html', 'utf8');
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
for (const route of [...routes, '/404']) {
  const meta = getMetadata(route);
  let html = template
    .replace(/<title>.*?<\/title>/s, `<title>${escape(meta.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(meta.description)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, meta.noindex ? '' : `<link rel="canonical" href="${escape(meta.canonical)}" />`)
    .replace(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow'}" />`);
  for (const [key, value] of Object.entries({title:meta.title, description:meta.description, url:meta.canonical, type:meta.article ? 'article' : 'website'})) {
    html = html.replace(new RegExp(`<meta property="og:${key}"[^>]*>`), `<meta property="og:${key}" content="${escape(value)}" />`);
  }
  const schema = structuredData(meta);
  html = html.replace('</head>', `${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>` : ''}\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${render(route)}</div>`);
  const file = route === '/' ? 'dist/index.html' : route === '/404' ? 'dist/404.html' : `dist${route}.html`;
  await fs.mkdir(path.dirname(file), {recursive:true});
  await fs.writeFile(file, html);
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `<url><loc>${SITE_URL}${route}</loc><lastmod>${UPDATED_AT}</lastmod></url>`).join('\n')}\n</urlset>\n`;
await fs.writeFile('dist/sitemap.xml', sitemap);
console.log(`Prerendered ${routes.length} public pages and a 404 page.`);
