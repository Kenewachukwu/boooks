// booooks front page: loads the library, builds each section, and starts the effects.
import { reduced, clamp, reveal, openStory, countUp, autoHideNav } from './motion.js';
import { loadLibrary, byGenre, booksOf, initials, readMine } from './data.js';
import { createHelix } from './fx/helix.js';
import { createReels } from './fx/reels.js';
import { createWander } from './fx/wander.js';
import { risingInk, tiltCards, scrollStack, turningBook } from './fx/small.js';

const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const root = document.documentElement;

// ---- big type waits for its fonts (but never longer than ~2s), so nothing flashes in a fallback face
const fontsReady = Promise.race([
  Promise.all([document.fonts.load('900 80px "Archivo"'), document.fonts.load('300 40px "Fraunces"'), document.fonts.load('500 12px "Roboto Mono"')]),
  new Promise(r => setTimeout(r, 1200)),
]).finally(() => root.classList.remove('fonts-wait'));

// ---- cards
function card(b, { feature = false } = {}) {
  const a = el('a', 'card' + (feature ? ' feature' : '')); a.href = b.href; a.dataset.slug = b.slug; a.style.setProperty('--gc', b.color);
  const cover = el('span', 'card-cover'), img = new Image(); img.src = b.cover; img.alt = `Cover of ${b.title}`; img.loading = 'lazy'; img.decoding = 'async'; img.width = 480; img.height = 720; cover.append(img);
  if (b.live) cover.append(el('span', 'card-new', 'New'));
  const meta = el('span', 'card-meta'); meta.append(el('span', 'card-g', `${b.genreName} · ${b.minutes} min`), el('span', 'card-t', b.title), el('span', 'card-a', b.author));
  a.append(cover, meta); return a;
}
// clicking a card lifts its cover and opens the reader (a normal click with a modifier key still opens a new tab)
document.addEventListener('click', e => {
  const a = e.target.closest?.('a.card'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  const cover = a.querySelector('.card-cover'), img = a.querySelector('img'); if (!cover || !img) return;
  e.preventDefault(); openStory(a.href, cover, img.currentSrc || img.src);
});

(async function main() {
  let lib;
  try { lib = await loadLibrary(); } catch (e) { console.error(e); $('feedLead').textContent = 'The library could not be loaded. Please refresh.'; root.classList.remove('fonts-wait'); reveal(); return; }
  const { genres, gById, profiles, books } = lib;

  // ---- hero count + spiral
  const heroCount = $('heroCount'); heroCount.textContent = `${books.length} stories · ${lib.writers} writers`;
  const helixBooks = books.filter(b => b.cover);
  const helix = createHelix({ canvas: $('helix'), items: helixBooks, copy: $('heroCopy') });
  $('helixList').append(...helixBooks.map(b => { const li = el('li'), a = el('a', null, `${b.title} by ${b.author}`); a.href = b.href; li.append(a); return li; }));
  risingInk($('h1'));

  // ---- fresh rail: newest first
  const fresh = [...books].sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date))).slice(0, 12);
  $('rail').append(...fresh.map(b => { const c = card(b); c.setAttribute('role', 'listitem'); return c; }));

  // ---- marquee of genre names
  const words = genres.map(g => g.name); $('marquee').append(...[...words, ...words, ...words, ...words].map(w => el('span', null, w)));

  // ---- feed with filters
  const filters = $('filters'), grid = $('grid'); let current = 'all';
  const pills = [{ id: 'all', name: 'All', count: books.length }, ...genres.filter(g => g.count).map(g => ({ id: g.id, name: g.name, count: g.count }))];
  for (const p of pills) { const b = el('button', 'pill', p.name); b.type = 'button'; b.dataset.id = p.id; b.setAttribute('aria-pressed', String(p.id === 'all')); b.append(el('small', null, String(p.count))); filters.append(b); }
  function renderGrid(animate) {
    const list = byGenre(books, current), before = new Map([...grid.children].map(c => [c.dataset.slug, c.getBoundingClientRect()]));
    const feature = i => list.length >= 9 && (i === 0 || i === 8 || i === 17);
    grid.replaceChildren(...(list.length ? list.map((b, i) => card(b, { feature: feature(i) })) : [el('p', 'empty', 'No stories here yet. Be the first to publish one.')]));
    if (!animate || reduced) return;
    let k = 0;
    for (const c of grid.children) {
      const r0 = before.get(c.dataset.slug), r1 = c.getBoundingClientRect(); if (!c.dataset.slug) continue;
      if (r0) { const dx = r0.left - r1.left, dy = r0.top - r1.top; if (Math.abs(dx) + Math.abs(dy) > 1) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 560, easing: EASE }); }
      else c.animate([{ opacity: 0, transform: 'translateY(18px) scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: Math.min(k, 9) * 40, easing: EASE, fill: 'backwards' });
      k++;
    }
  }
  function setFilter(id, animate = true) {
    current = id; for (const b of filters.children) b.setAttribute('aria-pressed', String(b.dataset.id === id));
    renderGrid(animate); $('feedLead').textContent = id === 'all' ? 'Every card opens a story you can read in a few minutes.' : `${gById[id].blurb} ${byGenre(books, id).length} to read.`;
  }
  filters.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setFilter(b.dataset.id); });
  renderGrid(false); tiltCards(grid); tiltCards($('rail'));

  // ---- stories published from this device
  const mine = readMine().filter(m => m && m.slug);
  if (mine.length) {
    $('mine').hidden = false;
    for (const m of mine.slice(0, 6)) {
      const row = el('div', 'mine-item'), t = el('div'); t.append(el('b', null, m.title || m.slug), el('span', 'card-a', 'by ' + (m.author || 'you')));
      const open = el('a', 'btn btn--sm', 'Open'); open.href = '/s/' + m.slug;
      const copy = el('button', 'btn btn--sm btn--ghost', 'Copy link'); copy.type = 'button';
      copy.addEventListener('click', async () => { const url = location.origin + '/s/' + m.slug; try { await navigator.clipboard.writeText(url); copy.textContent = 'Copied'; } catch { prompt('Copy your link', url); } setTimeout(() => { copy.textContent = 'Copy link'; }, 1600); });
      row.append(t, open, copy); $('mineRow').append(row);
    }
  }

  // ---- genre reels
  const rows = genres.filter(g => g.count).map(g => ({ id: g.id, name: g.name, color: g.color, books: byGenre(books, g.id) }));
  const tabs = $('genreTabs'), nameEl = $('reelsName'), meta = $('reelsMeta'), go = $('reelsGo'), reelsBox = $('reelsBox');
  rows.forEach((r, i) => { const b = el('button', 'pill', r.name); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false'); b.dataset.i = i; b.append(el('small', null, String(i + 1).padStart(2, '0'))); tabs.append(b); });
  let reelsInView = false;
  const reels = createReels({ canvas: $('reels'), rows, onFocus: i => {
    const r = rows[i]; [...tabs.children].forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    const t = tabs.children[i]; if (t) tabs.scrollTo({ left: t.offsetLeft - tabs.clientWidth / 2 + t.clientWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
    nameEl.style.setProperty('--gc', r.color); nameEl.textContent = ''; const s = el('span', null, r.name); nameEl.append(s);
    if (!reduced) s.animate([{ opacity: 0, transform: 'translate3d(0, 30px, 0)' }, { opacity: 1, transform: 'none' }], { duration: 560, easing: EASE });
    meta.textContent = `${r.books.length} stories · ${r.books.reduce((n, b) => n + b.minutes, 0)} min`; go.dataset.id = r.id; $('genAccent').style.color = r.color;
    if (reelsInView) root.style.setProperty('--accent', r.color);
  } });
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) reels.setFocus(+b.dataset.i); });
  go.addEventListener('click', e => { e.preventDefault(); setFilter(go.dataset.id, false); $('feed').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); });

  // ---- wander field (starts only when entered)
  const field = $('field'), fieldIntro = $('fieldIntro'), fieldOpen = $('fieldOpen'); let wander = null, ph = null, focusUi = null;
  const closeFocusUi = () => { focusUi?.remove(); focusUi = null; };
  function enterField(e) {
    if (!wander) wander = createWander({ canvas: $('fieldCanvas'), books: helixBooks, onFocus: b => {
      closeFocusUi(); if (!b) return;
      focusUi = el('div', 'field-focus'); const t = el('strong', null, b.title), by = el('span', 'label', b.author), go2 = el('a', 'btn btn--sm', 'Read it'); go2.href = b.href;
      go2.addEventListener('click', ev => { ev.preventDefault(); wander.openFocused(); }); focusUi.append(t, by, go2); field.append(focusUi);
    } });
    ph = el('div'); ph.style.height = field.offsetHeight + 'px'; field.before(ph);
    const r = e?.currentTarget?.getBoundingClientRect?.() || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    field.classList.add('is-on'); fieldOpen.hidden = false; document.body.classList.add('noscroll'); $('fieldCanvas').focus({ preventScroll: true });
    if (!reduced) field.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${x}px ${y}px)` }], { duration: 760, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
    requestAnimationFrame(() => wander.run(true));
  }
  function leaveField() {
    if (!field.classList.contains('is-on')) return; closeFocusUi(); wander.release();
    const finish = () => { field.classList.remove('is-on'); fieldOpen.hidden = true; document.body.classList.remove('noscroll'); wander.run(false); ph?.remove(); ph = null; $('fieldEnter').focus({ preventScroll: true }); };
    if (reduced) return finish();
    field.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.04)' }], { duration: 360, easing: EASE }).onfinish = finish;
  }
  $('fieldEnter').addEventListener('click', enterField); $('fieldExit').addEventListener('click', leaveField);
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (focusUi) wander.release(); else leaveField(); } });

  // ---- writers
  const AV = ['#ffc7c6', '#847dff', '#00b3dd', '#dd90d8', '#ffd24a', '#62f0c2', '#ff7a59', '#90b8f0', '#c6ff5e'];
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
  const people = profiles.map(p => ({ p, mine: booksOf(books, p.handle) })).filter(x => x.mine.length);
  for (const { p, mine: bs } of people) {
    const li = el('li'), a = el('a', 'person'); a.href = '/@' + p.handle;
    const fan = el('span', 'fan'); bs.slice(0, 3).forEach((b, j) => { const im = new Image(); im.src = b.cover; im.alt = ''; im.loading = 'lazy'; im.style.setProperty('--j', j); fan.append(im); });
    const av = el('span', 'avatar', initials(p.name)); const h = Math.abs(hash(p.handle)); av.style.setProperty('--a1', AV[h % AV.length]); av.style.setProperty('--a2', AV[(h >> 3) % AV.length]);
    a.append(fan, av, el('strong', null, p.name), el('span', 'h', '@' + p.handle), el('p', null, p.bio), el('span', 'cnt', `${bs.length} ${bs.length === 1 ? 'story' : 'stories'}`));
    li.append(a); $('people').append(li);
  }

  // ---- motion
  scrollStack($('stack')); turningBook($('create'), $('book')); autoHideNav($('nav'));
  const accents = { top: '#e10600', fresh: '#ffc7c6', what: '#847dff', feed: '#e10600', genres: null, field: '#00b3dd', creators: '#dd90d8', create: '#00b3dd' };
  const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) {
    const id = e.target.id; reelsInView = id === 'genres';
    const c = id === 'genres' ? rows[reels.focusIndex]?.color : accents[id]; if (c) root.style.setProperty('--accent', c);
  } }, { threshold: 0.35 });
  for (const id of Object.keys(accents)) { const s = $(id) || document.querySelector('.' + id); if (s) io.observe(s); }
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const spy = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id)); }, { rootMargin: '-45% 0px -50% 0px' });
  for (const a of navLinks) { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); }

  await fontsReady; reveal();
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); heroCount.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 900, fill: 'backwards' }); } }).observe(heroCount);
  void countUp; void clamp;
})();
