// booooks motion helpers shared by the front page and profiles: scroll reveals, a stagger index, visibility gating for canvases,
// and the cover that flies from a card into the reader.
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = t => 1 - Math.pow(1 - t, 4);
export const easeInOut = t => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

document.documentElement.classList.add('js');

// number the children of every .stagger group so CSS can delay them 45ms apiece
export function numberStaggers(root = document) {
  for (const g of root.querySelectorAll('.stagger')) [...g.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 14)));
}

// add .in to [data-reveal], .stagger and .lines elements when they are about a fifth in view (once)
let revealIO;
export function reveal(root = document) {
  numberStaggers(root);
  const targets = [...root.querySelectorAll('[data-reveal]:not(.in), .stagger:not(.in), .lines:not(.in)')];
  if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('in')); return; }
  revealIO ||= new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(t => revealIO.observe(t));
}

// run cb(true/false) as an element enters and leaves the screen (canvases stop drawing off screen)
export function whenVisible(el, cb, margin = '120px') {
  let on = null;
  const io = new IntersectionObserver(es => { const v = es[es.length - 1].isIntersecting; if (v !== on) { on = v; cb(v); } }, { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}
// true while the tab is showing
export const onTabVisibility = cb => { const f = () => cb(!document.hidden); document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f); };

// fit a canvas to its box at up to 2x pixel density; returns { ctx, w, h, dpr }; call again on resize
export function fitCanvas(canvas, maxDpr = 2) {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}

// decode a cover once; returns an ImageBitmap where supported (cheap to draw), else the <img>
const bitmaps = new Map();
export function loadCover(src) {
  if (bitmaps.has(src)) return bitmaps.get(src);
  const p = new Promise(ok => {
    const im = new Image(); im.decoding = 'async';
    im.onload = async () => { try { ok(await createImageBitmap(im)); } catch { ok(im); } };
    im.onerror = () => ok(null); im.src = src;
  });
  bitmaps.set(src, p); return p;
}

// draw an image into a box like object-fit: cover (covers are 2:3, but a published story's picture may be any shape)
export function drawFit(ctx, im, x, y, w, h) {
  const sw = im.width, sh = im.height; if (!sw || !sh) return;
  const ar = w / h; let cw = sw, ch = sh;
  if (sw / sh > ar) cw = sh * ar; else ch = sw / ar;
  ctx.drawImage(im, (sw - cw) / 2, (sh - ch) / 2, cw, ch, x, y, w, h);
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---- opening a story: the cover lifts out of its card, grows to the size of the reader's screen, and the reader takes over.
// The reader is a 9:16 stage (full screen on a phone, a phone-shaped column on a desktop), so that is where the cover lands.
export function openStory(href, fromEl, coverSrc) {
  const go = () => { try { if (coverSrc) sessionStorage.setItem('booooks.fly', JSON.stringify({ src: (u => (u.origin === location.origin ? u.pathname + u.search : u.href))(new URL(coverSrc, location.href)), t: Date.now() })); } catch { /* private mode */ } location.href = href; };
  if (reduced || !fromEl || !coverSrc || !fromEl.getBoundingClientRect) return go();
  const a = fromEl.getBoundingClientRect(); if (!a.width) return go();
  const vw = innerWidth, vh = innerHeight, phone = vw < 600;
  const th = phone ? vh : Math.min(vh, 960), tw = phone ? vw : Math.min(vw, th * 9 / 16);
  const tx = (vw - tw) / 2, ty = (vh - th) / 2;
  const veil = document.createElement('div'); veil.className = 'veil';
  const fly = document.createElement('div'); fly.className = 'fly'; fly.style.width = tw + 'px'; fly.style.height = th + 'px';
  fly.style.borderRadius = '0';
  const img = new Image(); img.src = coverSrc; img.alt = ''; fly.append(img);
  document.body.append(veil, fly);
  // start: the card's rectangle. The stage is taller and narrower than a card, so scale to the card's width and clip the extra height.
  const s = a.width / tw, cropY = Math.max(0, (th - a.height / s) / 2), rad = 16 / s;
  const from = { transform: `translate3d(${a.left}px, ${a.top}px, 0) scale(${s})`, clipPath: `inset(${cropY}px 0 ${cropY}px 0 round ${rad}px)` };
  const to = { transform: `translate3d(${tx}px, ${ty}px, 0) scale(1)`, clipPath: `inset(0px 0 0px 0 round ${phone ? 0 : 22}px)` };
  fly.style.transform = from.transform; fly.style.clipPath = from.clipPath;
  fromEl.style.visibility = 'hidden';
  veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' });
  const anim = fly.animate([from, to], { duration: 480, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' });
  let done = false; const finish = () => { if (!done) { done = true; go(); } };
  anim.onfinish = finish; setTimeout(finish, 800);
  // if the reader is restored from the back/forward cache, put the card back
  addEventListener('pageshow', e => { if (e.persisted) { veil.remove(); fly.remove(); fromEl.style.visibility = ''; done = false; } }, { once: true });
}

// ---- count a number up when it scrolls into view
export function countUp(el, to, ms = 900) {
  if (reduced) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = t => { const k = clamp((t - t0) / ms, 0, 1); el.textContent = Math.round(to * easeOut(k)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// ---- the bar hides on the way down and returns on the way up
export function autoHideNav(nav) {
  let last = scrollY, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { const y = scrollY; nav.classList.toggle('is-hidden', y > last + 6 && y > 240); if (y < last - 6 || y < 120) nav.classList.remove('is-hidden'); last = y; ticking = false; });
  }, { passive: true });
}
