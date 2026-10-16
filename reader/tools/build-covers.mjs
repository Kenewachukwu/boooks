// node tools/build-covers.mjs [slug ...]
// Turns the paintings in tools/art/ (see fetch-art.mjs) into finished 480x720 book covers (media/covers/<slug>.jpg) and the clean 9:16
// pictures the reader paints behind each sample story (media/photos/<slug>.jpg). The title, author and genre are typeset in headless Chrome
// (tools/cover-page.html), so the covers use the site's own fonts. Needs Google Chrome and puppeteer-core (installed in ../animation).
import fs from 'fs';
import path from 'path';
import http from 'http';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { titleLines } from '../lib/compose.js';

const here = path.dirname(fileURLToPath(import.meta.url)), reader = path.join(here, '..');
const puppeteer = createRequire(path.join(reader, '..', 'animation') + '/')('puppeteer-core');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const lib = JSON.parse(fs.readFileSync(path.join(reader, 'data', 'library.json'), 'utf8'));
const art = JSON.parse(fs.readFileSync(path.join(here, 'cover-art.json'), 'utf8'));
const only = process.argv.slice(2);
const genre = Object.fromEntries(lib.genres.map(g => [g.id, g]));
for (const d of ['covers', 'photos']) fs.mkdirSync(path.join(reader, 'media', d), { recursive: true });

// a tiny static server over reader/ so the page can import the site's own modules
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const f = path.join(reader, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(reader) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
await new Promise(ok => server.once('listening', ok));
const base = 'http://localhost:' + server.address().port; console.log('server', base);

const br = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--ignore-gpu-blocklist'] });
const pg = await br.newPage(); await pg.setViewport({ width: 520, height: 760, deviceScaleFactor: 1 });
pg.on('pageerror', e => console.error('PAGE ERROR', e.message));
console.log('browser up'); pg.on('requestfailed', r => console.log('failed', r.url().slice(0, 90))); pg.on('console', m => console.log('page:', m.text()));
await pg.goto(base + '/tools/cover-page.html', { waitUntil: 'load', timeout: 40000 }); console.log('loaded');
await pg.waitForFunction('window.READY === true', { timeout: 30000 });

for (const b of lib.books) {
  if (only.length && !only.includes(b.slug)) continue;
  const g = genre[b.genre], a = art[b.slug] || {};
  const spec = { title: b.title, titleLines: titleLines(b.title, 9), author: b.author, genre: b.genre, genreName: g.name, color: g.color, fx: a.focus?.[0], fy: a.focus?.[1], style: a.style };
  if (b.source === 'bundle') spec.image = `${base}/tools/art/${b.slug}.jpg`;
  else if (b.slug === 'rejuvenating') spec.image = `${base}/media/night-field.jpg`;
  else spec.draw = 'hot-chocolate';
  await pg.evaluate(s => window.makeCover(s), spec);
  const el = await pg.$('.cv');
  fs.writeFileSync(path.join(reader, 'media', 'covers', b.slug + '.jpg'), await el.screenshot({ type: 'jpeg', quality: 80 }));
  if (b.source === 'bundle') {
    const url = await pg.evaluate(s => window.makePhoto(s), spec);
    fs.writeFileSync(path.join(reader, 'media', 'photos', b.slug + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log('cover', b.slug);
}
await br.close(); server.close();
