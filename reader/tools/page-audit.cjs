// Layout audit for the front page, profiles and studio. For each page at five screen sizes it reports: sideways scrolling of the whole page,
// text that sticks out past the screen edge (outside rows that are meant to scroll), text clipped inside its own box, console errors and failed
// requests. Optional screenshots go to a folder.
//   node reader/serve.mjs &                      (the dev server)
//   node reader/tools/page-audit.cjs [shots-dir]
// Expect: "pages with problems: 0". Needs Google Chrome (CHROME_PATH) and puppeteer-core from animation/node_modules.
const { createRequire } = require('module'); const path = require('path'); const fs = require('fs');
const puppeteer = createRequire(path.resolve(__dirname, '../../animation/') + '/')('puppeteer-core');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE || 'http://localhost:5173';
const SHOTS = process.argv[2];
const PAGES = process.env.PAGES ? process.env.PAGES.split(',') : ['/', '/@amara.writes', '/@deborah.datoru', '/@nobody.here', '/studio/'];
const VIEWPORTS = process.env.VPS ? process.env.VPS.split(',').map(v => v.split('x').map(Number)) : [[320, 568], [390, 844], [768, 1024], [1280, 720], [1440, 900]];

(async () => {
  const br = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const results = []; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  for (const url of PAGES) for (const [w, h] of VIEWPORTS) {
    const pg = await br.newPage(); const problems = [];
    await pg.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    pg.on('pageerror', e => problems.push({ kind: 'script error', text: e.message.slice(0, 120) }));
    pg.on('requestfailed', r => /ERR_ABORTED/.test((r.failure() && r.failure().errorText) || '') || problems.push({ kind: 'request failed (' + (r.failure() && r.failure().errorText) + ')', text: r.url().slice(0, 100) }));
    pg.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url()) && !(url === '/@nobody.here' && /profile/.test(r.url()))) problems.push({ kind: 'http ' + r.status(), text: r.url().slice(0, 100) }); });
    await pg.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
    await pg.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 2200));
    // scroll through once so every reveal has run, then back to the top
    const total = await pg.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += h * 0.8) { await pg.evaluate(y => window.scrollTo(0, y), y); await new Promise(r => setTimeout(r, 120)); }
    await pg.evaluate(() => window.scrollTo(0, 0)); await new Promise(r => setTimeout(r, 500));
    const found = await pg.evaluate(() => {
      const out = [], W = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > W + 1) out.push({ kind: 'page scrolls sideways', text: `${document.documentElement.scrollWidth} > ${W}` });
      const scrollers = [...document.querySelectorAll('.vh, .rail, .filters, .tabs, .marquee, .photos, .mine-row, canvas, .stack-card .phone, .create-pin, .book, .fan, .deck, .deck-card, .helix-open, .field, .bookbox')];
      const inScroller = el => scrollers.some(s => s.contains(el));
      for (const el of document.querySelectorAll('h1, h2, h3, p, a, button, strong, label, .card-t, .card-g, .label, .eyebrow, .lead, li')) {
        if (inScroller(el) || !el.offsetParent) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
        if (!el.textContent.trim()) continue;
        const r = el.getBoundingClientRect(); if (!r.width) continue;
        if (r.right > W + 1.5 || r.left < -1.5) out.push({ kind: 'sticks out past the screen edge', text: (el.textContent || '').trim().slice(0, 50), by: Math.round(Math.max(r.right - W, -r.left)) });
        if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden') && cs.display !== 'inline' && el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== 'ellipsis') out.push({ kind: 'text clipped in its box', text: (el.textContent || '').trim().slice(0, 50), by: el.scrollWidth - el.clientWidth });
      }
      return out;
    });
    if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, `${url.replace(/[^a-z0-9]+/gi, '_') || 'home'}_${w}.png`) });
    results.push({ url, viewport: `${w}x${h}`, problems: [...problems, ...found] });
    await pg.close();
  }
  await br.close();
  const bad = results.filter(r => r.problems.length);
  console.log(`runs: ${results.length}, pages with problems: ${bad.length}`);
  for (const r of bad) { console.log(`\n${r.url} @ ${r.viewport}`); for (const p of r.problems.slice(0, 8)) console.log('  -', p.kind, p.by ?? '', JSON.stringify(p.text)); }
})().catch(e => { console.error(e); process.exit(1); });
