// Swipe card deck: a fanned stack of covers. The front card drags off in the direction you swipe, then tucks in behind the stack, so the
// deck loops. Each card behind the front one sits 14px right and 12px down, tilts 3.5 degrees and shrinks by 0.05. Tap a card to open it.
import { reduced, clamp, openStory } from '../motion.js';

export function createDeck(root, items, { offsetX = 14, offsetY = 12, rotateStep = 3.5, scaleStep = 0.05, visible = 4, onChange } = {}) {
  const n = items.length; let order = items.map((_, i) => i), busy = false, dragging = null;
  const cards = items.map((b, i) => {
    const c = document.createElement('div'); c.className = 'deck-card'; c.dataset.i = i; c.setAttribute('role', 'group'); c.setAttribute('aria-roledescription', 'slide'); c.setAttribute('aria-label', `${b.title} by ${b.author}`);
    const img = new Image(); img.src = b.cover; img.alt = `Cover of ${b.title}`; img.draggable = false; img.decoding = 'async';
    const cap = document.createElement('div'); cap.className = 'deck-cap';
    const g = document.createElement('span'); g.className = 'label'; g.textContent = `${b.genreName} · ${b.minutes} min`;
    const t = document.createElement('strong'); t.textContent = b.title; cap.append(g, t);
    c.append(img, cap); root.append(c); return c;
  });

  const poseOf = d => `translate3d(${d * offsetX}px, ${d * offsetY}px, 0) rotate(${d * rotateStep}deg) scale(${1 - d * scaleStep})`;
  function place(instantFor = -1) {
    order.forEach((idx, d) => {
      const c = cards[idx], hide = d >= visible;
      if (idx === instantFor) { c.style.transition = 'none'; }
      c.style.zIndex = n - d; c.style.transform = poseOf(Math.min(d, visible)); c.style.opacity = hide ? 0 : 1; c.style.pointerEvents = d === 0 ? 'auto' : 'none';
      c.classList.toggle('is-front', d === 0); c.setAttribute('aria-hidden', String(d !== 0)); c.tabIndex = d === 0 ? 0 : -1;
      if (idx === instantFor) { void c.offsetWidth; c.style.transition = ''; }
    });
    onChange?.(order[0], n);
  }

  // send the front card away in a direction (-1 left, 1 right), then tuck it at the back
  function fling(dir, fromX = 0, fromY = 0, rot = 0) {
    if (busy || n < 2) return; busy = true;
    const c = cards[order[0]];
    const done = () => { order.push(order.shift()); c.style.transform = ''; place(order[n - 1]); busy = false; };
    if (reduced) { c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).onfinish = done; return; }
    const w = Math.max(innerWidth, 600);
    c.style.transition = 'none';
    const a = c.animate([{ transform: `translate3d(${fromX}px, ${fromY}px, 0) rotate(${rot}deg)` }, { transform: `translate3d(${dir * w * 0.75}px, ${fromY + 40}px, 0) rotate(${dir * 26}deg)`, opacity: 0.2 }], { duration: 340, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' });
    a.onfinish = () => { a.cancel(); c.style.transition = ''; done(); };
  }
  function settle(c) { // not far enough: spring back
    c.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; c.style.transform = poseOf(0); setTimeout(() => { c.style.transition = ''; }, 520);
  }

  root.addEventListener('pointerdown', e => {
    const c = e.target.closest('.deck-card'); if (!c || !c.classList.contains('is-front') || busy) return;
    dragging = { c, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0, t: performance.now(), vx: 0, moved: 0, lastX: e.clientX, lastT: performance.now() };
    c.setPointerCapture(e.pointerId); c.style.transition = 'none';
  });
  root.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== dragging.id) return; const d = dragging;
    d.x = e.clientX - d.x0; d.y = (e.clientY - d.y0) * 0.35; d.moved = Math.max(d.moved, Math.abs(d.x) + Math.abs(e.clientY - d.y0));
    const now = performance.now(); d.vx = (e.clientX - d.lastX) / Math.max(1, now - d.lastT); d.lastX = e.clientX; d.lastT = now;
    d.c.style.transform = `translate3d(${d.x}px, ${d.y}px, 0) rotate(${clamp(d.x * 0.06, -22, 22)}deg)`;
  });
  const end = e => {
    if (!dragging || e.pointerId !== dragging.id) return; const d = dragging; dragging = null;
    if (d.moved < 7) { d.c.style.transition = ''; d.c.style.transform = poseOf(0); const b = items[+d.c.dataset.i]; openStory(b.href, d.c, b.cover); return; }
    const far = Math.abs(d.x) > 90 || Math.abs(d.vx) > 0.55;
    if (far && n > 1) fling(d.x === 0 ? 1 : Math.sign(d.x || d.vx), d.x, d.y, clamp(d.x * 0.06, -22, 22)); else settle(d.c);
  };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); fling(1); } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); fling(-1); }
    else if (e.key === 'Enter' && e.target.classList?.contains('is-front')) { const b = items[+e.target.dataset.i]; openStory(b.href, e.target, b.cover); }
  });
  place();
  return { next: () => fling(1), prev: () => fling(-1), get front() { return order[0]; } };
}
