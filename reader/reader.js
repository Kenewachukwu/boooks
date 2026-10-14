// booooks reader prototype: a looping painted background, a sound bed, and one handwritten page per screen.
// Vanilla JS on purpose (no build step); the data model (data/book.json) and the CSS carry over to the Next.js reader in PLAN.md.

import { TEMPLATES, googleFontsUrl } from './templates.js';

const CONFIG = {
  registry: 'data/stories.json',
  sample: 'data/book.sample.json',
  maxReveal: 6,                    // seconds: a long page is written faster instead of making the reader wait
};

const $ = id => document.getElementById(id);
const stage = $('stage'), pagesEl = $('pages'), countEl = $('count'), fillEl = $('fill'), soundBtn = $('sound'), liveEl = $('live');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const RULE = '<svg class="rule" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 8 C 38 3, 74 11, 112 6 S 172 3, 198 7"/></svg>';
const rule = () => { const t = document.createElement('template'); t.innerHTML = RULE; return t.content.firstChild; };
const pen = (tag, cls, text) => { const e = h(tag, cls); e.append(h('span', 'ln', text)); return e; }; // an element holding one written line

// ---------- which story, and the template (look) it brings
const query = new URLSearchParams(location.search);
const registry = await fetch(CONFIG.registry).then(r => r.ok ? r.json() : Promise.reject())
  .catch(() => ({ default: 'rejuvenating', stories: [{ id: 'rejuvenating', file: 'data/book.json', template: 'night-field' }] }));
const entry = registry.stories.find(s => s.id === query.get('story')) || registry.stories.find(s => s.id === registry.default) || registry.stories[0];
const template = TEMPLATES[entry.template] || TEMPLATES['night-field'];
{
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(template.vars || {})) root.setProperty(k, v);
  root.setProperty('--sheet-top', template.sheet.top * 100 + '%'); root.setProperty('--sheet-bottom', template.sheet.bottom * 100 + '%');
  $('fonts').href = googleFontsUrl(template);
  stage.dataset.template = entry.template;
}

// ---------- sound: a Web Audio loop with fades (the loop is seamless; an <audio loop> would click at the seam).
// iPhone Safari needs three things that desktop browsers do not: a tap to start, the context resumed inside that tap, and the page
// declared as "playback" audio. Without the last one iOS mutes Web Audio whenever the ring/silent switch is on silent.
const sound = (() => {
  if (!template.sound) { soundBtn.hidden = true; return { wanted: false, state: {}, begin() {}, toggle() {}, hold() {}, release() {} }; }
  let ctx, gain, buf, src, keep, playing = false, starting = false, intent = false, held = false;
  let wanted = store.get('sound') !== 'off';
  const fetchBytes = () => fetch(template.sound).then(r => { if (!r.ok) throw new Error('audio ' + r.status); return r.arrayBuffer(); });
  let pending = fetchBytes().catch(() => null); // downloaded now, so a tap can start the sound at once (it is about 3 MB)
  // the speaker button shows what is really happening, never what we hope will happen
  const paint = () => {
    soundBtn.setAttribute('aria-pressed', String(playing));
    soundBtn.setAttribute('aria-label', playing ? 'Sound on' : 'Sound off. Tap to turn on');
    soundBtn.classList.toggle('invite', wanted && !playing && !starting);
    soundBtn.classList.toggle('loading', starting);
  };
  const fade = (to, secs) => { const t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(to, t + secs); };
  const decode = (c, ab) => new Promise((ok, no) => { const p = c.decodeAudioData(ab, ok, no); if (p && p.catch) p.catch(no); }); // old Safari only has the callback form
  function silentLoop() { // a second of silence as an <audio> element: playing it moves older iOS (before 16.4) to the playback category
    const sr = 8000, n = sr, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    const a = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' }))); a.loop = true; a.setAttribute('playsinline', ''); return a;
  }
  async function start() {
    if (playing || starting) return;
    starting = true; intent = true; wanted = true; store.set('sound', 'on'); paint();
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback'; // iOS 16.4+: ignore the silent switch
      else { keep ??= silentLoop(); keep.play().catch(() => {}); }
      if (!ctx) { // created and resumed synchronously inside the tap; iOS requires that
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) throw new Error('no Web Audio');
        ctx = new AC(); gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
        ctx.onstatechange = () => { // a phone call or another app can interrupt the context; the icon must not lie about it
          if (held) return;
          if (ctx.state !== 'running' && playing) { playing = false; paint(); }
        };
      }
      ctx.resume();
      if (!buf) { const ab = await (pending ?? fetchBytes()); pending = null; buf = await decode(ctx, ab); }
      if (!src) { src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(gain); src.start(); }
      if (!intent) return; // switched off while the file was still loading
      if (ctx.state !== 'running') await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 1500))]);
      playing = ctx.state === 'running';
      if (playing) fade(0.9, 1.6);
    } catch (e) { console.warn('sound could not start', e); playing = false; }
    finally { starting = false; paint(); }
  }
  function stop() {
    intent = false; wanted = false; store.set('sound', 'off'); keep?.pause();
    if (ctx && playing) { fade(0, 0.5); setTimeout(() => { if (!intent && ctx.state === 'running') ctx.suspend(); }, 600); }
    playing = false; paint();
  }
  paint();
  return {
    get wanted() { return wanted; },
    get state() { return { ctx: ctx?.state, playing, starting, wanted, audioSession: navigator.audioSession?.type }; },
    begin() { if (wanted) start(); }, // the Begin button: starts sound unless the reader turned it off before
    toggle() { playing || starting ? stop() : start(); },
    hold() { held = true; if (ctx && ctx.state === 'running') ctx.suspend(); }, // tab hidden
    release() { held = false; if (ctx && intent) ctx.resume().then(() => { playing = ctx.state === 'running'; paint(); }); },
  };
})();
soundBtn.addEventListener('click', () => sound.toggle());

// ---------- loading-style counter: rolling digits plus a progress line
function makeCounter(el, digits, suffix) {
  const cols = [];
  for (let d = 0; d < digits; d++) {
    const odo = h('span', 'odo'), col = h('span', 'col');
    for (let n = 0; n < 10; n++) col.append(h('i', null, String(n)));
    odo.append(col); el.append(odo); cols.push(col);
  }
  el.append(h('span', 'of', suffix));
  return v => { const s = String(v).padStart(digits, '0'); cols.forEach((c, i) => c.style.setProperty('--v', s[i])); };
}

// ---------- page building
const FONT_MIN = template.font.min, FONT_MAX = template.font.max; // body text size as a fraction of the stage width

function plainFlow(p) { // unsplit text: the browser wraps it, and we measure that
  const nodes = [];
  if (p.title && !p.cont) nodes.push(h('h2', 'src title', p.title), rule());
  else if (p.cont && LAYOUT !== 'prose') nodes.push(h('p', 'src note', 'Continued'));
  p.stanzas.forEach((s, si) => {
    const stz = h('div', 'stz'); stz.style.setProperty('--gap', si ? s.gap : 0);
    // verse: every line is its own line. prose: a stanza is a paragraph and its "lines" are sentences that run together.
    (LAYOUT === 'prose' ? [s.lines.join(' ')] : s.lines).forEach((l, li) => { const e = h('p', 'src', l); if (si && !li) e.dataset.pause = s.gap; stz.append(e); });
    nodes.push(stz);
  });
  return nodes;
}

// A poem too long for one screen at the smallest readable size continues on the next screen. Measured against the tightest
// stage (9:16), so every device gets the same pages and the counter means the same thing everywhere.
function paginate(poems) {
  // Verse is measured against the tightest stage (9:16) so every device gets the same pages. Prose has one fixed text size, so it
  // reflows to the real screen like an ebook, and is re-paginated if the screen's shape changes a lot (see the resize handler).
  const W = stage.clientWidth, refH = LAYOUT === 'prose' ? stage.clientHeight : W * (16 / 9), maxH = refH * (1 - template.sheet.top - template.sheet.bottom);
  const probe = h('div', 'sheet measure'), flow = h('div', 'flow'); probe.append(flow); probe.style.fontSize = W * FONT_MIN + 'px'; stage.append(probe);
  // plain text is a quick "no"; a plain "yes" is double-checked on the split lines, which can wrap one line differently
  const fits = pg => {
    flow.replaceChildren(...plainFlow(pg));
    if (flow.offsetHeight > maxH) return false;
    flow.querySelectorAll('.src').forEach(splitLines);
    return flow.offsetHeight <= maxH;
  };
  const out = [];
  for (const p of poems) {
    const items = p.stanzas.flatMap((s, si) => s.lines.map(line => ({ line, si, gap: s.gap })));
    const make = (a, b, first) => {
      const st = [];
      for (const it of items.slice(a, b)) { if (!st.length || st.at(-1).si !== it.si) st.push({ si: it.si, gap: it.gap, lines: [] }); st.at(-1).lines.push(it.line); }
      return { title: p.title, cont: !first, stanzas: st.map(({ gap, lines }) => ({ gap, lines })) };
    };
    if (LAYOUT === 'prose') { // prose: fill each screen, ending at a paragraph break when that wastes little (or at a sentence)
      const out2 = [];
      for (let a = 0; a < items.length;) {
        let lo = a + 1, hi = items.length;
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; fits(make(a, mid, !out2.length)) ? lo = mid : hi = mid - 1; }
        let b = lo;
        if (b < items.length) for (let i = b; i > a + (b - a) * 0.72; i--) if (items[i].si !== items[i - 1].si) { b = i; break; }
        out2.push(make(a, b, !out2.length)); a = b;
      }
      out.push(...out2); continue;
    }
    // verse: cut points are balanced by line count
    const cum = []; items.reduce((t, it) => (cum.push(t += LAYOUT === 'prose' ? it.line.length : 1), t), 0);
    const total = cum.at(-1), indexAt = frac => { const i = cum.findIndex(c => c >= frac * total); return i < 0 ? items.length : i + 1; };
    let chunks;
    for (let n = 1; n <= 16; n++) {
      const size = items.length / n, cuts = [0];
      for (let k = 1; k < n; k++) { // cut at a paragraph or stanza break near the middle if there is one, else mid-paragraph
        const target = indexAt(k / n), lo = cuts.at(-1); let best = target, bd = Math.max(2, Math.round(size * 0.25)) + 1;
        for (let i = lo + 1; i < items.length; i++) if (items[i].si !== items[i - 1].si && Math.abs(i - target) < bd) { best = i; bd = Math.abs(i - target); }
        cuts.push(Math.max(lo + 1, Math.min(items.length - 1, best)));
      }
      cuts.push(items.length);
      chunks = cuts.slice(0, -1).map((a, i) => make(a, cuts[i + 1], i === 0));
      if (chunks.every(fits)) break;
    }
    out.push(...chunks);
  }
  probe.remove();
  return out;
}

// data/book.json is the real book and stays local; the repo ships a small sample so the reader always runs (or add ?sample to the URL)
const wantSample = query.has('sample');
const book = await (wantSample ? Promise.reject() : fetch(entry.file).then(r => r.ok ? r : Promise.reject()))
  .catch(() => fetch(CONFIG.sample)).then(r => r.json());
const LAYOUT = book.layout || template.layout || 'verse';
document.title = `${book.title} · booooks reader`;
await fontsReady(); // pagination measures real text, so the template's fonts have to be in first
const shapeAtPagination = stage.clientHeight / stage.clientWidth;
const pages = paginate(book.pages.filter(p => p.kind === 'poem'));
const TOTAL = pages.length;
const sections = [];   // 0 cover, 1..TOTAL pages, TOTAL+1 end
const LAST = TOTAL + 1;
const setCount = makeCounter(countEl, String(TOTAL).length, `/ ${TOTAL}`);
setCount(0);

function buildPoem(p, i) {
  const sec = h('section', 'page'); sec.dataset.i = i;
  sec.setAttribute('aria-label', `Page ${i} of ${TOTAL}${p.title ? ': ' + p.title : ''}${p.cont ? ' (continued)' : ''}`);
  const sheet = h('div', 'sheet'); sheet.setAttribute('aria-hidden', 'true'); sheet.append(h('div', 'flow'));
  const sr = h('div', 'sr-only');
  if (p.title && !p.cont) sr.append(h('h2', null, p.title));
  for (const s of p.stanzas) { const para = h('p'); para.innerText = s.lines.join(LAYOUT === 'prose' ? ' ' : '\n'); sr.append(para); }
  sec.append(sheet, sr); sec._poem = p; return sec;
}

function buildCover() {
  const sec = h('section', 'page cover'); sec.setAttribute('aria-label', 'Cover');
  const inner = h('div', 'cover-in');
  const begin = h('button', 'btn', 'Begin'); begin.type = 'button';
  const hint = h('p', 'hint'); hint.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  hint.append('Swipe up to turn the page');
  const title = h('h1'); (book.titleLines || [book.title]).forEach(l => title.append(h('span', 'ln', l))); // long titles are set in short lines
  inner.append(pen('p', 'kicker', book.kicker || template.kicker || 'A book of poems'), title, rule(), pen('p', 'by', book.byline || 'by ' + book.author), begin, hint);
  sec.append(inner);
  // Begin starts the sound and nothing else: pages only ever turn when the reader swipes or scrolls
  begin.addEventListener('click', () => { if (!reduceMotion) bgCtl.play(); sound.begin(); sec.classList.add('begun'); });
  return sec;
}

function buildEnd() {
  const sec = h('section', 'page end'); sec.setAttribute('aria-label', 'The end');
  const inner = h('div', 'end-in');
  const again = h('button', 'btn secondary', 'Read again'); again.type = 'button';
  inner.append(pen('p', 'kicker', `${book.title} · ${book.author}`), pen('h2', null, 'The end'), rule(), pen('p', 'by', 'Thank you for reading.'), again);
  const others = registry.stories.filter(s => s.id !== entry.id);
  if (others.length) { const next = h('a', 'btn secondary', 'Read another story'); next.href = '?story=' + others[registry.stories.indexOf(entry) % others.length].id; inner.append(next); }
  if (book.source) { const src = h('a', 'link', 'Read the original on Medium'); src.href = book.source; src.target = '_blank'; src.rel = 'noopener'; inner.append(src); }
  sec.append(inner);
  again.addEventListener('click', () => goTo(0, true));
  return sec;
}

sections.push(buildCover());
pages.forEach((p, k) => sections.push(buildPoem(p, k + 1)));
sections.push(buildEnd());
pagesEl.replaceChildren(...sections);

// ---------- layout: fit each poem to the sky, then split it into the visual lines the browser chose
function splitLines(p) {
  const spans = p.textContent.split(/\s+/).filter(Boolean).map(w => { const s = h('span', null, w + ' '); return s; });
  p.textContent = ''; p.append(...spans);
  const lines = []; let top = null;
  for (const s of spans) { const t = s.offsetTop; if (top === null || Math.abs(t - top) > 2) { lines.push([]); top = t; } lines.at(-1).push(s.textContent); }
  p.textContent = '';
  lines.forEach((ws, k) => p.append(h('span', 'ln' + (k ? ' cont' : ''), ws.join('').trim())));
  p.classList.add('split');
}

function layoutPoem(sec, fMin, fMax) {
  const sheet = sec.firstElementChild, flow = sheet.firstElementChild;
  flow.replaceChildren(...plainFlow(sec._poem));
  const fits = () => flow.offsetHeight <= sheet.clientHeight;
  let size = fMax; sheet.style.fontSize = size + 'px';
  if (!fits()) { let lo = fMin, hi = fMax; for (let i = 0; i < 8; i++) { const mid = (lo + hi) / 2; sheet.style.fontSize = mid + 'px'; fits() ? lo = mid : hi = mid; } size = lo; }
  // the search above measured wrapped paragraphs; confirm on the real split lines and step down if one wrapped differently
  for (let tries = 0; ; tries++) {
    sheet.style.fontSize = size + 'px';
    flow.replaceChildren(...plainFlow(sec._poem));
    flow.querySelectorAll('.src').forEach(splitLines);
    if (fits() || size <= fMin || tries > 12) break;
    size = Math.max(fMin, size * 0.97);
  }
}

function schedule(sec) { // when each line starts and how long its stroke takes; stanza gaps become pauses
  let t = 0.3; const items = [];
  for (const n of sec.querySelectorAll('.ln, .rule')) {
    if (n.classList.contains('rule')) { items.push({ n, d: t }); t += 0.3; continue; }
    if (n.parentElement.firstElementChild === n) t += +(n.parentElement.dataset.pause || 0) * 0.28;
    const w = clamp(n.textContent.length * 0.032, 0.45, 1.25);
    items.push({ n, d: t, w }); t += w * 0.8 + 0.06;
  }
  const k = Math.min(1, CONFIG.maxReveal / t);
  items.forEach(({ n, d, w }, idx) => {
    if (w == null) { n.style.setProperty('--rd', (d * k).toFixed(2) + 's'); return; }
    n.style.setProperty('--d', (d * k).toFixed(2) + 's'); n.style.setProperty('--w', (w * k).toFixed(2) + 's');
    n.style.setProperty('--r', ((((idx * 37 + n.textContent.length * 13) % 11) - 5) * 0.09).toFixed(2) + 'deg'); // each line sits a hair off true
  });
}

let laidOut = { w: 0, h: 0 };
function layoutAll() {
  const W = stage.clientWidth;
  laidOut = { w: W, h: stage.clientHeight };
  for (const sec of sections) { if (sec._poem) layoutPoem(sec, W * FONT_MIN, W * FONT_MAX); schedule(sec); }
}

async function fontsReady() {
  const wait = ms => new Promise(r => setTimeout(r, ms)), link = $('fonts');
  await Promise.race([new Promise(r => { if (link.sheet) r(); else { link.addEventListener('load', r); link.addEventListener('error', r); } }), wait(3000)]);
  await Promise.race([Promise.all([...template.fonts.load.map(f => document.fonts.load(f))]), wait(3000)]);
}

// ---------- navigation, counter and page state
let pageH = pagesEl.clientHeight, cur = 0, stable = 0, resizing = false, settleTimer = 0;
// Touch swipes use the browser's own scroll-snap (smoothest on phones). Wheel, trackpad and keys glide one page with an eased
// curve, so every page turn is the same length and never overshoots. Snapping is off while gliding, or it would fight us.
let glideId = 0, target = 0;
const here = () => glideId ? target : cur;
function stopGlide() { if (glideId) { cancelAnimationFrame(glideId); glideId = 0; pagesEl.style.scrollSnapType = ''; } }
function goTo(i, instant) {
  target = clamp(i, 0, LAST); stopGlide();
  const to = target * pageH, from = pagesEl.scrollTop;
  if (instant || reduceMotion || Math.abs(to - from) < 1) { pagesEl.scrollTo({ top: to, behavior: 'instant' }); return; }
  const dur = clamp(520 + Math.abs(to - from) / pageH * 90, 560, 900), t0 = performance.now();
  const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  pagesEl.style.scrollSnapType = 'none';
  const step = now => {
    const k = clamp((now - t0) / dur, 0, 1);
    pagesEl.scrollTop = from + (to - from) * ease(k);
    if (k < 1) glideId = requestAnimationFrame(step); else stopGlide();
  };
  glideId = requestAnimationFrame(step);
}
pagesEl.addEventListener('touchstart', stopGlide, { passive: true }); // a finger on the glass takes over

let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    if (resizing) return; // the browser re-snaps while the size changes; those scrolls are not the reader's
    const pos = pagesEl.scrollTop / pageH, idx = clamp(Math.round(pos), 0, LAST);
    // fade the two pages in view by their distance from the viewport (direct opacity: no style recalculation of the text inside)
    for (let i = Math.max(0, Math.floor(pos)); i <= Math.min(LAST, Math.ceil(pos)); i++) sections[i].firstElementChild.style.opacity = (1 - Math.min(1, Math.abs(i - pos) * 1.15)).toFixed(3);
    fillEl.style.transform = `scaleX(${clamp(pos / TOTAL, 0, 1).toFixed(4)})`;
    bgCtl.setProgress(clamp(pos / TOTAL, 0, 1)); // an effect background can change as the story is read
    if (idx !== cur) { cur = idx; setCount(Math.min(idx, TOTAL)); stage.classList.toggle('complete', idx >= TOTAL); }
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (!resizing) stable = cur; // only a quiet, un-resized position counts as "where the reader is"
      history.replaceState(null, '', cur ? '#' + cur : location.pathname);
      liveEl.textContent = sections[cur].getAttribute('aria-label');
    }, 350);
  });
}
pagesEl.addEventListener('scroll', onScroll, { passive: true });

// a page's text writes itself when it is mostly on screen, and resets once fully off screen
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.intersectionRatio >= 0.55) e.target.classList.add('on');
    else if (!e.isIntersecting) { e.target.classList.remove('on', 'done'); e.target.querySelectorAll('.written').forEach(l => l.classList.remove('written')); }
  }
}, { root: pagesEl, threshold: [0, 0.55] });
// once a line has been written, drop its mask and animation: static text scrolls smoothest
pagesEl.addEventListener('animationend', e => { if (e.target.classList?.contains('ln')) e.target.classList.add('written'); });

// tap the page to finish writing at once
let down = null;
pagesEl.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
pagesEl.addEventListener('pointerup', e => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.t < 400 && !e.target.closest('button')) sections[cur].classList.add('done');
  down = null;
});

addEventListener('keydown', e => {
  if (e.target.closest?.('button') && e.key === ' ') return;
  const k = e.key; let to;
  if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) to = here() + 1;
  else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) to = here() - 1;
  else if (k === 'Home') to = 0; else if (k === 'End') to = LAST; else return;
  e.preventDefault(); goTo(to);
});

// wheel and trackpad: one deliberate gesture turns exactly one page. A light nudge does nothing, and the long inertial tail of a
// trackpad flick is ignored until a new flick (or a pause) starts.
let wheelLock = false, wheelAcc = 0, wheelT = 0, wheelAbs = 0;
pagesEl.addEventListener('wheel', e => {
  if (e.ctrlKey) return; // pinch-zoom
  e.preventDefault();
  const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * pageH : e.deltaY;
  const now = performance.now(), gap = now - wheelT, abs = Math.abs(dy);
  const fresh = gap > 160 || (abs > wheelAbs * 1.6 + 6 && abs > 30);
  wheelT = now; wheelAbs = abs;
  if (wheelLock) { if (glideId || !fresh) return; wheelLock = false; }
  wheelAcc = fresh ? dy : wheelAcc + dy;
  if (Math.abs(wheelAcc) >= 28) { wheelLock = true; wheelAcc = 0; goTo(here() + Math.sign(dy)); }
}, { passive: false });

// ---------- background (a video, or an image seed run through an effect) and tab visibility
let bgCtl = { play() {}, pause() {}, setProgress() {}, paused: true }; // does nothing until the background has loaded
async function mountBackground(cfg) {
  if (cfg.type === 'fx') {
    const [{ createFx }, { loadSeed }] = await Promise.all([import('./fx/fx.js'), import('./fx/seeds.js')]);
    const canvas = h('canvas', 'bg'); canvas.setAttribute('aria-hidden', 'true');
    const fx = createFx(canvas); fx.setImage(await loadSeed(cfg.seed)); fx.setEffect(cfg.effect, cfg.params);
    let paused = true;
    return {
      el: canvas, get paused() { return paused; },
      play() { paused = false; fx.start(); },
      pause() { paused = true; fx.stop(); fx.draw(3); }, // a still frame
      setProgress(p) { if (cfg.progress) { fx.setProgress(p); if (paused) fx.draw(3); } },
    };
  }
  const v = h('video', 'bg'); v.src = cfg.src; if (cfg.poster) v.poster = cfg.poster;
  v.muted = v.loop = v.playsInline = v.autoplay = true; v.preload = 'auto'; v.setAttribute('aria-hidden', 'true');
  return { el: v, get paused() { return v.paused; }, play() { v.play().catch(() => {}); }, pause() { v.pause(); }, setProgress() {} };
}
mountBackground(template.background).then(ctl => {
  bgCtl = ctl; stage.prepend(ctl.el);
  if (reduceMotion) ctl.pause(); else ctl.play();
}).catch(e => console.warn('background failed to load', e));
document.addEventListener('pointerup', () => { if (bgCtl.paused && !reduceMotion) bgCtl.play(); }, { once: true }); // low-power modes block autoplay until a tap
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { bgCtl.pause(); sound.hold(); } else { if (!reduceMotion) bgCtl.play(); sound.release(); }
});

// ---------- go
layoutAll();
sections.forEach(s => io.observe(s));
const resumeAt = (() => { try { const f = parseFloat(sessionStorage.getItem('resume')); sessionStorage.removeItem('resume'); return f > 0 ? Math.round(f * LAST) : 0; } catch { return 0; } })();
const start = clamp(parseInt(location.hash.slice(1), 10) || resumeAt, 0, LAST);
if (start) { pagesEl.scrollTo({ top: start * pageH, behavior: 'instant' }); }
cur = stable = start; setCount(Math.min(start, TOTAL)); stage.classList.toggle('complete', start >= TOTAL);
stage.classList.add('ready');
onScroll();
pagesEl.focus({ preventScroll: true });

window.reader = { goTo, get cur() { return cur; }, get pageH() { return pageH; }, sound, total: TOTAL }; // handle for tests and the console

// #12 opens poem 12 (also the base for sharing a single page later)
addEventListener('hashchange', () => { const i = clamp(parseInt(location.hash.slice(1), 10) || 0, 0, LAST); if (i !== cur) goTo(i, true); });

// a resize that changes the width (rotation) re-fits the text; the mobile URL bar growing and shrinking only re-aligns
// While the size is changing, the browser re-snaps and scroll events report the wrong page, so `stable` (the page before the
// resize began) is what we return to once the size settles.
let resizeTimer = 0;
new ResizeObserver(() => {
  resizing = true; stopGlide();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizing = false; pageH = pagesEl.clientHeight;
    if (LAYOUT === 'prose' && Math.abs(stage.clientHeight / stage.clientWidth - shapeAtPagination) / shapeAtPagination > 0.06) { // e.g. rotated: reflow into new pages
      try { sessionStorage.setItem('resume', String(stable / LAST)); } catch { /* private mode */ }
      location.reload(); return;
    }
    if (Math.abs(stage.clientWidth - laidOut.w) > 2 || Math.abs(stage.clientHeight - laidOut.h) / laidOut.h > 0.12) { layoutAll(); sections[stable].classList.add('done'); }
    pagesEl.scrollTo({ top: stable * pageH, behavior: 'instant' });
    cur = stable; setCount(Math.min(cur, TOTAL)); stage.classList.toggle('complete', cur >= TOTAL);
    onScroll();
  }, 200);
}).observe(stage);
