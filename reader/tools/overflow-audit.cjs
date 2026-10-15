// Overflow audit for the reader. Loads it in preview mode for every template x awkward story (long title and name, unbreakable words and links,
// long verse lines, 40 paragraphs) x four screen sizes, and reports any text that runs past a page edge, below the page, or out of its box.
// Run it after any change to text, templates or layout:
//   node reader/serve.mjs &            (the dev server)
//   node reader/tools/overflow-audit.cjs out.json [A,B,C]     (optional: only story cases whose id starts with these letters)
// Expect: "runs with problems: 0". It needs Google Chrome (set CHROME_PATH) and puppeteer-core from animation/node_modules.
const { createRequire } = require('module'); const path = require('path');
const puppeteer = createRequire(path.resolve(__dirname, '../../animation/') + '/')('puppeteer-core'); // installed in animation/
const R = path.resolve(__dirname, '..') + '/';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE || 'http://localhost:5173';
const OUT = process.argv[2], ONLY = process.argv[3] ? process.argv[3].split(',') : null;

const prose = n => Array.from({ length: n }, (_, i) => `Paragraph ${i + 1} walks slowly across the page, the way a long afternoon does when nothing needs doing. It has a few sentences, some of them short. Others run on, gathering clauses, until the reader forgets where they began and has to come back.`).join('\n\n');
const longWords = 'The word Pneumonoultramicroscopicsilicovolcanoconiosis is real, and so is Supercalifragilisticexpialidocious-and-then-some-more-letters.\n\nA link: https://example.com/this/is/a/very/long/link/that/has/no/spaces/at/all/and/keeps/going/forever.html and an email someone.with.a.very.long.address@a-surprisingly-long-domain-name.example.org ends it.';
const manyLines = Array.from({ length: 30 }, (_, i) => `Short line number ${i + 1}`).join('\n').replace(/(\n.*?){5}\n/g, m => m + '\n');
const longLine = 'This single line of verse is far longer than any phone screen could hold in one go, so it must wrap, gracefully, and stay inside the page\nAnd a second, shorter line\n\nA new stanza begins here with another quite long line that goes on and on and on until the margin is reached again';
const CASES = [
  { id: 'A-normal', layout: 'prose', title: 'The Night Shift', author: 'Test Writer', text: prose(3) },
  { id: 'B-long-title-and-name', layout: 'prose', title: 'The Extraordinarily Long Title of a Remarkably Unfinished Manuscript About Everything', author: 'Alexandria Montgomery-Winthrop the Third of Somewhere Far Away', text: prose(3) },
  { id: 'C-long-words', layout: 'prose', title: 'Incomprehensibilities', author: 'Bartholomew', text: longWords },
  { id: 'D-verse-many-lines', layout: 'verse', title: 'Short Lines', author: 'Poet', text: manyLines },
  { id: 'E-verse-long-line', layout: 'verse', title: 'Long Lines', author: 'Poet', text: longLine },
  { id: 'F-long-prose', layout: 'prose', title: 'A Very Long Story', author: 'Novelist', text: prose(40) },
].filter(c => !ONLY || ONLY.some(o => c.id.startsWith(o)));
const TEMPLATES = ['poster', 'newsprint', 'handwritten', 'quiet-serif'];
const VIEWPORTS = [[320, 568], [390, 844], [768, 1024], [1280, 720]];

(async () => {
  const { buildBook } = await import(R + 'lib/import.js'); const { titleLines } = await import(R + 'lib/compose.js');
  const br = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const jobs = []; for (const c of CASES) for (const t of TEMPLATES) for (const v of VIEWPORTS) jobs.push({ c, t, v });
  const results = []; let next = 0;
  async function worker() {
    const pg = await br.newPage();
    while (next < jobs.length) {
      const { c, t, v } = jobs[next++];
      const { book } = buildBook({ title: c.title, author: c.author, text: c.text, layout: c.layout });
      book.titleLines = titleLines(c.title);
      const bundle = { v: 1, book, style: { templateId: t, modeId: 'ocean-calm', effect: 'soft-photo', params: {}, seed: 'plain', layout: book.layout, animate: false }, meta: {} };
      await pg.setViewport({ width: v[0], height: v[1], deviceScaleFactor: 1 });
      await pg.evaluateOnNewDocument(b => { localStorage.setItem('booooks.preview', b); }, JSON.stringify(bundle));
      await pg.goto(BASE + '/?preview=1&x=' + Math.random(), { waitUntil: 'load' });
      await pg.waitForFunction("window.reader && document.getElementById('stage').classList.contains('ready')", { timeout: 40000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 350));
      const found = await pg.evaluate(() => {
        const out = [], stage = document.getElementById('stage'); stage.classList.add('no-anim');
        document.querySelectorAll('.page').forEach((page, pi) => {
          const P = page.getBoundingClientRect(), label = page.classList.contains('cover') ? 'cover' : page.classList.contains('end') ? 'end' : 'page ' + pi;
          const sheet = page.querySelector('.sheet');
          if (sheet) { const f = sheet.firstElementChild; if (f.offsetHeight > sheet.clientHeight + 1) out.push({ page: label, kind: 'text taller than its area', by: f.offsetHeight - sheet.clientHeight }); }
          page.querySelectorAll('.ln, .btn, .link, .hint, .rule, .note').forEach(el => {
            const r = el.getBoundingClientRect(), W = P.width, H = P.height;
            const side = Math.max(r.right - P.left - (W - 4), 4 - (r.left - P.left));
            const bottom = r.bottom - P.top - (H - 4);
            if (el.classList.contains('ln') && el.scrollWidth > el.clientWidth + 1) out.push({ page: label, kind: 'line wider than its box', by: el.scrollWidth - el.clientWidth, text: el.textContent.slice(0, 40) });
            else if (side > 0) out.push({ page: label, kind: 'past the page edge', by: Math.round(side), text: (el.textContent || el.className.baseVal || el.tagName).toString().slice(0, 40) });
            if (bottom > 0) out.push({ page: label, kind: 'past the page bottom', by: Math.round(bottom), text: (el.textContent || '').slice(0, 40) });
          });
        });
        return { found: out, pages: document.querySelectorAll('.page').length, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((x, i, a) => a.indexOf(x) === i) };
      }).catch(e => ({ found: [{ kind: 'audit error', by: 0, text: e.message }], pages: 0, fonts: [] }));
      results.push({ case: c.id, template: t, viewport: v.join('x'), pages: found.pages, fonts: found.fonts, found: found.found });
    }
    await pg.close();
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  require('fs').writeFileSync(OUT, JSON.stringify(results, null, 1));
  const bad = results.filter(r => r.found.length);
  console.log(`runs: ${results.length}, runs with problems: ${bad.length}`);
  const byKind = {}; bad.forEach(r => r.found.forEach(f => { const k = `${r.template} | ${f.kind}`; byKind[k] = (byKind[k] || 0) + 1; }));
  console.log(byKind);
  await br.close();
})().catch(e => { console.error(e); process.exit(1); });
