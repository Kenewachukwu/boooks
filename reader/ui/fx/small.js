// Small effects for the front page: letters that lift near the cursor (Rising Ink), card tilt, the pile-up scroll stack and the turning book.
import { reduced, finePointer, clamp, easeInOut } from '../motion.js';

// ---- Rising Ink: letters near the pointer lift a little and brighten. Fine pointers only; touch gets the still headline.
export function risingInk(root, { radius = 170, lift = 0.075 } = {}) {
  if (!finePointer || reduced) return () => {};
  const letters = [];
  for (const w of root.querySelectorAll('.w')) {
    const text = w.textContent; w.textContent = '';
    for (const c of text) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c; w.append(s); letters.push({ el: s, x: 0, y: 0 }); }
  }
  let pt = null, raf = 0;
  const measure = () => { for (const l of letters) { const r = l.el.getBoundingClientRect(); l.x = r.left + r.width / 2 + scrollX; l.y = r.top + r.height / 2 + scrollY; } };
  const paint = () => {
    raf = 0;
    for (const l of letters) {
      const d = pt ? Math.hypot(pt.x - l.x, pt.y - l.y) : 1e9, k = Math.pow(clamp(1 - d / radius, 0, 1), 2);
      l.el.style.transform = k > 0.01 ? `translate3d(0, ${(-lift * k).toFixed(3)}em, 0) scale(${(1 + 0.07 * k).toFixed(3)})` : '';
    }
  };
  const onMove = e => { pt = { x: e.pageX, y: e.pageY }; if (!raf) raf = requestAnimationFrame(paint); };
  const onLeave = () => { pt = null; if (!raf) raf = requestAnimationFrame(paint); };
  addEventListener('pointermove', onMove, { passive: true }); document.addEventListener('pointerleave', onLeave);
  const ro = new ResizeObserver(measure); ro.observe(root); measure(); document.fonts?.ready.then(measure);
  return () => { removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); ro.disconnect(); };
}

// ---- Depth card: a gentle tilt and a moving highlight under the pointer
export function tiltCards(container) {
  if (!finePointer || reduced) return;
  container.addEventListener('pointermove', e => {
    const card = e.target.closest?.('.card'); if (!card || !container.contains(card)) return;
    const cover = card.querySelector('.card-cover'); if (!cover) return; const r = cover.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    cover.style.setProperty('--ry', ((px - 0.5) * 12).toFixed(2) + 'deg'); cover.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
    cover.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); cover.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  }, { passive: true });
  container.addEventListener('pointerout', e => {
    const card = e.target.closest?.('.card'); if (!card || card.contains(e.relatedTarget)) return;
    const cover = card.querySelector('.card-cover'); if (cover) { cover.style.setProperty('--rx', '0deg'); cover.style.setProperty('--ry', '0deg'); }
  }, { passive: true });
}

// ---- Scroll stack: each card sticks, and the ones already covered shrink a little and darken
export function scrollStack(stack) {
  const cards = [...stack.children]; if (reduced || cards.length < 2) return;
  cards.forEach((c, i) => c.style.setProperty('--k', i));
  let ticking = false;
  const update = () => {
    ticking = false; const vh = innerHeight, nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
    const prog = cards.map((c, i) => { const stuck = nav + 20 + i * 16; return i === 0 ? 1 : clamp(1 - (c.getBoundingClientRect().top - stuck) / (vh * 0.62), 0, 1); });
    cards.forEach((c, i) => { let cover = 0; for (let j = i + 1; j < cards.length; j++) cover += prog[j]; c.style.transform = `scale(${(1 - 0.045 * cover).toFixed(4)})`; c.style.setProperty('--dim', Math.min(0.7, cover * 0.34).toFixed(3)); });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); update();
}

// ---- the turning book: the section is tall, and how far you have scrolled through it decides how many pages have turned
export function turningBook(section, book) {
  const leaves = [...book.querySelectorAll('.leaf')], N = leaves.length, turns = N - 1;
  if (reduced) { leaves.forEach((l, k) => { l.style.setProperty('--a', k < turns ? 1 : 0); }); book.style.setProperty('--open', 1); return; }
  let ticking = false;
  const update = () => {
    ticking = false; const r = section.getBoundingClientRect(), run = r.height - innerHeight;
    const p = clamp(-r.top / Math.max(1, run), 0, 1), t = clamp((p - 0.1) / 0.78, 0, 1) * turns;
    leaves.forEach((l, k) => {
      const a = easeInOut(clamp(t - k, 0, 1));
      l.style.setProperty('--a', a.toFixed(4)); l.style.setProperty('--z', ((a > 0.5 ? k : N - k) * 0.8).toFixed(1) + 'px');
    });
    book.style.setProperty('--open', easeInOut(clamp(t, 0, 1)).toFixed(4));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); update();
  // a click on the book turns it too (keyboard and touch users who do not scroll through it)
  book.parentElement.addEventListener('click', () => { const r = section.getBoundingClientRect(), run = r.height - innerHeight, now = clamp(-r.top / run, 0, 1); const target = section.offsetTop + (Math.min(1, now + 0.26)) * run; scrollTo({ top: target, behavior: 'smooth' }); });
}
