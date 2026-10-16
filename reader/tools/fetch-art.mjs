// node tools/fetch-art.mjs
// Downloads the public-domain paintings listed in tools/cover-art.json from Wikimedia Commons (1400 px wide) into tools/art/ (git-ignored).
// build-covers.mjs then turns them into book covers and reader backgrounds. Commons asks API users to send a descriptive User-Agent.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const art = JSON.parse(fs.readFileSync(path.join(here, 'cover-art.json'), 'utf8'));
const UA = { 'User-Agent': 'booooks-prototype/0.1 (https://boooks-two.vercel.app; knwachukwu@schulltech.com)' };
fs.mkdirSync(path.join(here, 'art'), { recursive: true });

const titles = Object.values(art).filter(a => a.file).map(a => 'File:' + a.file);
const info = {};
for (let i = 0; i < titles.length; i += 20) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.search = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '1400', titles: titles.slice(i, i + 20).join('|') });
  const d = await (await fetch(u, { headers: UA })).json();
  for (const p of Object.values(d.query.pages)) info[p.title.replace(/^File:/, '').replace(/_/g, ' ')] = p.imageinfo?.[0];
}
for (const [slug, a] of Object.entries(art)) {
  if (!a.file) continue;
  const ii = info[a.file.replace(/_/g, ' ')];
  if (!ii) { console.error('not found:', a.file); continue; }
  a.source = 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(a.file.replace(/ /g, '_'));
  a.license = ii.extmetadata?.LicenseShortName?.value || 'Public domain';
  const dest = path.join(here, 'art', slug + '.jpg');
  if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) continue;
  for (let n = 0; n < 4; n++) {
    const r = await fetch(ii.thumburl || ii.url, { headers: UA });
    if (r.ok) { fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); console.log('saved', slug); break; }
    await new Promise(ok => setTimeout(ok, 1500 * (n + 1)));
  }
}
fs.writeFileSync(path.join(here, 'cover-art.json'), JSON.stringify(art, null, 1));
