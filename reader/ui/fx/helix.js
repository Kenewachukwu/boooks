// Helix: book covers spiral out from a dense core, growing as they go (a logarithmic spiral drawn on a 2D canvas).
// Modelled on the behaviour of a spiral photo gallery: one arm, ~18 covers a turn, a dense core, covers that grow with distance, a cleared
// centre so the headline stays readable, drag to turn it like a dial, hover to pause and lift, click to bring a cover upright.
import { reduced, clamp, easeOut, fitCanvas, whenVisible, onTabVisibility, loadCover, roundRect, drawFit, openStory } from '../motion.js';

const TAU = Math.PI * 2;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function createHelix({ canvas, items, copy, opts = {} }) {
  const o = { perTurn: 18, pitch: 7, centerDensity: 1.3, cardSize: 0.31, roundness: 0.1, tilt: 0.42, speed: 0.35, turns: 2.7, direction: 1, ...opts };
  const stage = canvas.parentElement, N = items.length, hop = (() => { let s = 7; while (gcd(s, N) !== 1) s++; return s; })();
  const bitmaps = new Array(N).fill(null);
  items.forEach((it, i) => loadCover(it.cover).then(b => { bitmaps[i] = b; }));

  let W = 0, H = 0, ctx, cx = 0, cy = 0, rIn = 1, rOut = 1, table = [], M = 1, hole = null;
  let phase = reduced ? 0 : -3, vel = 0, curSpeed = 0, intro = reduced ? 1 : 0, running = false, raf = 0, last = 0, openScroll = 0;
  let hoverN = null, dragging = null, openN = null, openAmt = 0; const lift = new Map(); // lift: how far each cover is raised by the pointer, 0 to 1
  const b = Math.tan(o.pitch * Math.PI / 180);
  const S0 = TAU / o.perTurn;

  // ---- geometry: build the table that maps "slots along the spiral" to an angle, so density can change with radius
  function layout() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas, 2));
    cx = W * 0.5; cy = H * 0.5;
    rOut = Math.hypot(W, H) * 0.56;
    const Theta = TAU * o.turns; rIn = rOut * Math.exp(-b * Theta);
    const rMid = Math.sqrt(rIn * rOut), K = 1400; table = new Float32Array(K + 1);
    let s = 0, prev = 1 / (S0 * Math.pow(rIn / rMid, o.centerDensity - 1));
    for (let i = 1; i <= K; i++) {
      const th = Theta * i / K, r = rIn * Math.exp(b * th), inv = 1 / (S0 * Math.pow(r / rMid, o.centerDensity - 1));
      s += (prev + inv) / 2 * (Theta / K); prev = inv; table[i] = s;
    }
    const Mi = Math.max(8, Math.floor(s)); const k = Mi / s; for (let i = 1; i <= K; i++) table[i] *= k; M = Mi;
    // the cleared area is the box around the headline, the line under it and the buttons (not the padded container)
    const r0 = canvas.getBoundingClientRect(), rs = [...(copy?.children || [])].map(k => k.getBoundingClientRect()).filter(k => k.width);
    if (rs.length) { const l = Math.min(...rs.map(k => k.left)), t = Math.min(...rs.map(k => k.top)), rr = Math.max(...rs.map(k => k.right)), b = Math.max(...rs.map(k => k.bottom)); hole = { x: (l + rr) / 2 - r0.left, y: (t + b) / 2 - r0.top, hw: (rr - l) / 2 + 8, hh: (b - t) / 2 + 8 }; }
    else hole = { x: cx, y: cy, hw: W * 0.2, hh: H * 0.15 };
  }
  const theta = u => { // slot position along the spiral -> angle, by bisection on the table
    const K = table.length - 1; let lo = 0, hi = K;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (table[m] <= u) lo = m; else hi = m; }
    const f = (u - table[lo]) / Math.max(1e-6, table[hi] - table[lo]); return TAU * o.turns * (lo + f) / K;
  };

  // ---- one frame of positions
  let cards = [];
  function place() {
    cards.length = 0;
    const n0 = Math.ceil(-phase), n1 = Math.floor(M - phase - 1e-6);
    for (let n = n0; n <= n1; n++) {
      const u = n + phase; if (u < 0 || u >= M) continue;
      const th = theta(u), r = rIn * Math.exp(b * th), phi = -o.direction * th - Math.PI / 4;
      const x = cx + Math.cos(phi) * r, y = cy + Math.sin(phi) * r, w = o.cardSize * r, h = w * 1.5;
      // fade across the inner part of the spiral and wherever a card would sit behind the headline
      const dx = Math.max(0, Math.abs(x - hole.x) - hole.hw), dy = Math.max(0, Math.abs(y - hole.y) - hole.hh), dist = Math.hypot(dx, dy);
      const inside = Math.abs(x - hole.x) < hole.hw && Math.abs(y - hole.y) < hole.hh;
      const clear = inside ? 0.16 : 0.16 + 0.84 * smooth(0, Math.max(60, h * 0.7), dist); // ghosted behind the headline (the scrim keeps it readable), full strength beyond
      const grow = smooth(0.4, 6, u) * smooth(0, 3, M - u);
      const alpha = Math.min(clear, grow) * intro;
      if (x < -h || x > W + h || y < -h || y > H + h || alpha < 0.01) continue;
      cards.push({ n, x, y, w, h, r, phi, alpha, rot: Math.sin(phi) * o.tilt, item: ((n * hop) % N + N) % N });
    }
    cards.sort((a, c) => a.r - c.r);
  }

  // ---- drawing
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const c of cards) {
      const hv = lift.get(c.n) || 0, op = c.n === openN ? 1 - openAmt : 1, dim = openN !== null ? 1 - openAmt * 0.78 : 1;
      const a = c.alpha * (c.n === openN ? op : dim); if (a < 0.01) continue;
      const s = 1 + hv * 0.1, w = c.w * s, h = c.h * s, rad = Math.max(2, w * o.roundness);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(c.x, c.y - hv * c.w * 0.06); ctx.rotate(c.rot + hv * -c.rot * 0.6);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(ctx, -w / 2 - w * 0.015, -h / 2 + w * 0.045, w * 1.03, h * 1.01, rad); ctx.fill(); // a cheap soft shadow
      roundRect(ctx, -w / 2, -h / 2, w, h, rad); ctx.clip();
      const bm = bitmaps[c.item]; if (bm) drawFit(ctx, bm, -w / 2, -h / 2, w, h); else { ctx.fillStyle = '#1b1b1f'; ctx.fillRect(-w / 2, -h / 2, w, h); }
      if (hv < 0.05) { ctx.fillStyle = `rgba(0,0,0,${0.08 * (1 - hv)})`; ctx.fillRect(-w / 2, -h / 2, w, h); } // resting covers sit back a little
      ctx.restore();
    }
    if (kbFocus && cards.length && canvas.matches(':focus-visible')) { // keyboard focus ring
      const c = focusCard(); if (c) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.strokeStyle = '#ffc7c6'; ctx.lineWidth = 3; roundRect(ctx, -c.w / 2 - 4, -c.h / 2 - 4, c.w + 8, c.h + 8, c.w * o.roundness + 4); ctx.stroke(); ctx.restore(); }
    }
  }

  // ---- hit testing, hover, the open cover
  const toLocal = (c, px, py) => { const dx = px - c.x, dy = py - c.y, cs = Math.cos(-c.rot), sn = Math.sin(-c.rot); return [dx * cs - dy * sn, dx * sn + dy * cs]; };
  function cardAt(px, py) {
    for (let i = cards.length - 1; i >= 0; i--) {
      const c = cards[i]; if (c.alpha < 0.6) continue;
      const [lx, ly] = toLocal(c, px, py); if (Math.abs(lx) <= c.w / 2 && Math.abs(ly) <= c.h / 2) return c;
    }
    return null;
  }
  let kbFocus = false;
  function focusCard() { // the card that arrow keys and Enter act on: the clearest one nearest the right-hand side of the clearing
    const tx = hole.x + hole.hw + (W - hole.x - hole.hw) * 0.45, ty = cy; let best = null, bd = 1e9;
    for (const c of cards) { if (c.alpha < 0.8) continue; const d = Math.hypot(c.x - tx, c.y - ty) - c.w * 0.3; if (d < bd) { bd = d; best = c; } }
    return best;
  }

  const frame = document.createElement('div'); frame.className = 'helix-open'; frame.hidden = true;
  frame.innerHTML = '<button class="helix-open-scrim" type="button" aria-label="Close"></button><figure class="helix-open-card"><img alt=""><figcaption><span class="label"></span><strong class="serif"></strong><span class="by"></span><a class="btn">Read it</a></figcaption></figure>';
  stage.append(frame);
  const fCard = frame.querySelector('figure'), fImg = frame.querySelector('img'), fLabel = frame.querySelector('.label'), fTitle = frame.querySelector('strong'), fBy = frame.querySelector('.by'), fBtn = frame.querySelector('.btn');
  let openItem = null;

  function openCard(c) {
    if (openN !== null) return; openScroll = scrollY; const it = items[c.item]; openItem = it; openN = c.n;
    fImg.src = it.cover; fImg.alt = `Cover of ${it.title}`; fLabel.textContent = it.genreName || ''; fTitle.textContent = it.title; fBy.textContent = 'by ' + it.author; fBtn.href = '/s/' + it.slug;
    fBtn.onclick = e => { e.preventDefault(); openStory(fBtn.href, fImg, it.cover); };
    frame.hidden = false;
    const r = canvas.getBoundingClientRect(), tw = fCard.getBoundingClientRect();
    const fx = r.left + c.x - (tw.left + tw.width / 2), fy = r.top + c.y - (tw.top + tw.height / 2), sc = c.w / tw.width;
    frame.classList.add('on');
    if (reduced) { openAmt = 1; return; }
    fCard.animate([{ transform: `translate3d(${fx}px, ${fy}px, 0) scale(${sc}) rotate(${c.rot}rad)`, opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' });
    frame.querySelector('figcaption').animate([{ opacity: 0, transform: 'translate3d(0,14px,0)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' });
    const t0 = performance.now(); const tick = t => { openAmt = easeOut(clamp((t - t0) / 420, 0, 1)); if (openAmt < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    fBtn.focus({ preventScroll: true });
  }
  function closeCard() {
    if (openN === null) return; const n = openN;
    const finish = () => { frame.hidden = true; frame.classList.remove('on'); openN = null; openAmt = 0; canvas.focus({ preventScroll: true }); };
    if (reduced) return finish();
    const c = cards.find(k => k.n === n); const r = canvas.getBoundingClientRect(), tw = fCard.getBoundingClientRect();
    const to = c ? `translate3d(${r.left + c.x - (tw.left + tw.width / 2)}px, ${r.top + c.y - (tw.top + tw.height / 2)}px, 0) scale(${c.w / tw.width}) rotate(${c.rot}rad)` : 'scale(0.9)';
    const a = fCard.animate([{ transform: 'none', opacity: 1 }, { transform: to, opacity: 0.2 }], { duration: 380, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'both' });
    const t0 = performance.now(); const tick = t => { openAmt = 1 - easeOut(clamp((t - t0) / 380, 0, 1)); if (openAmt > 0) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    a.onfinish = () => { fCard.getAnimations().forEach(x => x.cancel()); finish(); };
  }
  frame.querySelector('.helix-open-scrim').addEventListener('click', closeCard);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });
  addEventListener('scroll', () => { if (openN !== null && Math.abs(scrollY - openScroll) > 60) closeCard(); }, { passive: true });

  // ---- pointer: hover pauses and lifts, drag turns the dial, tap opens
  const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const angleOf = (px, py) => Math.atan2(py - cy, px - cx);
  canvas.addEventListener('pointerdown', e => {
    if (openN !== null) return; const [px, py] = local(e);
    dragging = { id: e.pointerId, a: angleOf(px, py), x0: px, y0: py, moved: 0, t: performance.now(), lastPhase: phase, touch: e.pointerType !== 'mouse' };
    canvas.setPointerCapture(e.pointerId); vel = 0;
  });
  canvas.addEventListener('pointermove', e => {
    const [px, py] = local(e);
    if (dragging && dragging.id === e.pointerId) {
      const a = angleOf(px, py); let d = a - dragging.a; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
      dragging.a = a; dragging.moved += Math.abs(d) * Math.hypot(px - cx, py - cy);
      const step = (o.direction * -d) / S0; // turning the pointer counter-clockwise carries covers outward along the spiral
      phase += step; vel = step / Math.max(0.008, (performance.now() - dragging.t) / 1000); dragging.t = performance.now(); return;
    }
    if (e.pointerType === 'mouse') { const c = cardAt(px, py); hoverN = c ? c.n : null; canvas.style.cursor = c ? 'pointer' : 'grab'; }
  });
  const end = e => {
    if (!dragging || dragging.id !== e.pointerId) return; const [px, py] = local(e);
    const tap = dragging.moved < 14 && Math.hypot(px - dragging.x0, py - dragging.y0) < 10; dragging = null; vel = clamp(vel, -9, 9);
    if (tap) { const c = cardAt(px, py); if (c) openCard(c); }
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', e => { if (dragging?.id === e.pointerId) dragging = null; });
  canvas.addEventListener('pointerleave', () => { if (!dragging) hoverN = null; });
  canvas.addEventListener('wheel', e => { // sideways swipes and shift+wheel turn it; a plain vertical wheel keeps scrolling the page
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0); if (!dx) return;
    e.preventDefault(); vel = clamp(vel + Math.sign(dx) * 2.4, -9, 9);
  }, { passive: false });
  canvas.addEventListener('focus', () => { kbFocus = true; }); canvas.addEventListener('blur', () => { kbFocus = false; });
  canvas.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); vel = 3.2; }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); vel = -3.2; }
    else if (e.key === 'Enter' || e.key === ' ') { const c = focusCard(); if (c) { e.preventDefault(); openCard(c); } }
  });

  // ---- the loop
  function tick(t) {
    raf = requestAnimationFrame(tick); const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    if (!reduced && intro < 1) { intro = Math.min(1, intro + dt / 1.6); phase += (1 - easeOut(intro)) * 9 * dt; } // flows in from the core
    const want = reduced || hoverN !== null || dragging || openN !== null ? 0 : o.speed;
    curSpeed += (want - curSpeed) * Math.min(1, dt * 5);
    if (!dragging) { phase += (curSpeed + vel) * dt; vel *= Math.exp(-dt * 3.2); if (Math.abs(vel) < 0.01) vel = 0; }
    place();
    const k = Math.min(1, dt * 12), live = new Set(); for (const c of cards) { live.add(c.n); const v = lift.get(c.n) || 0, t = c.n === hoverN ? 1 : 0; if (v || t) lift.set(c.n, Math.abs(t - v) < 0.01 ? t : v + (t - v) * k); }
    for (const n of lift.keys()) if (!live.has(n) || lift.get(n) === 0) lift.delete(n);
    draw();
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  layout(); place(); draw();
  new ResizeObserver(() => { layout(); place(); draw(); }).observe(canvas);
  let vis = true, tab = true; const sync = () => (vis && tab ? start() : stop());
  const offVis = whenVisible(canvas, v => { vis = v; sync(); }, '40px'), offTab = onTabVisibility(v => { tab = v; sync(); });
  const redrawWhenCoversLoad = setInterval(() => { if (bitmaps.every(Boolean)) clearInterval(redrawWhenCoversLoad); place(); draw(); }, 400);

  return { step: n => { vel = Math.sign(n) * 3.4; }, open: i => { const c = cards.find(k => k.item === i); if (c) openCard(c); }, close: closeCard, relayout: () => { layout(); place(); draw(); },
    destroy() { stop(); offVis(); offTab(); clearInterval(redrawWhenCoversLoad); frame.remove(); } };
}
