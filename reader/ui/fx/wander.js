// Wander: an endless field of covers you drift through. Covers hang in a grid of world-space cells (positions come from a hash, so the field is
// the same every time and never ends), are scaled by perspective and faded by fog. Drag to move, wheel to go deeper, click one to fly to it.
import { reduced, clamp, lerp, easeInOut, fitCanvas, onTabVisibility, loadCover, roundRect, drawFit, openStory } from '../motion.js';

const hash = (a, b, c, d) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647 + d * 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

export function createWander({ canvas, books, onFocus, opts = {} }) {
  const o = { cell: 110, density: 5, size: 17, range: 2, fogNear: 120, fogFar: 360, friction: 0.9, drift: 7, focalK: 0.95, autoZoom: reduced ? 0 : 0.16, ...opts };
  let W = 0, H = 0, ctx, running = false, raf = 0, last = 0;
  const cam = { x: 0, y: 0, z: 0 }, vel = { x: 0, y: 0, z: 0 }, mouse = { x: 0, y: 0 };
  let drag = null, flying = null, focused = null, planes = [];
  const bm = new Array(books.length).fill(null);
  books.forEach((b, i) => loadCover(b.cover).then(x => { bm[i] = x; }));

  function layout() { ({ ctx, w: W, h: H } = fitCanvas(canvas, 2)); }
  const focal = () => Math.min(W, H) * o.focalK + W * 0.1;

  function gather() {
    planes.length = 0; const C = o.cell, f = focal();
    const k0 = Math.floor(cam.z / C), k1 = Math.floor((cam.z + o.fogFar) / C), cx = Math.floor(cam.x / C), cy = Math.floor(cam.y / C);
    for (let k = k0; k <= k1; k++) for (let j = cy - o.range; j <= cy + o.range; j++) for (let i = cx - o.range; i <= cx + o.range; i++) for (let n = 0; n < o.density; n++) {
      const wx = (i + hash(i, j, k, n * 3 + 1)) * C, wy = (j + hash(i, j, k, n * 3 + 2)) * C, wz = (k + hash(i, j, k, n * 3 + 3)) * C;
      const d = wz - cam.z; if (d < 7 || d > o.fogFar) continue;
      const s = f / d, sx = W / 2 + (wx - cam.x) * s, sy = H / 2 + (wy - cam.y) * s, w = o.size * s, h = w * 1.5;
      if (sx + w < 0 || sx - w > W || sy + h < 0 || sy - h > H) continue;
      const idx = Math.floor(hash(i, j, k, n + 91) * books.length);
      const fog = 1 - clamp((d - o.fogNear) / (o.fogFar - o.fogNear), 0, 1), near = clamp((d - 7) / 12, 0, 1);
      planes.push({ d, sx, sy, w, h, a: Math.min(fog, near), idx, wx, wy, wz });
    }
    planes.sort((a, b) => b.d - a.d);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    for (const p of planes) {
      if (p.a < 0.02) continue; const im = bm[p.idx], rad = Math.max(2, p.w * 0.06);
      ctx.save(); ctx.globalAlpha = p.a * (focused && focused.idx !== p.idx ? 0.35 : 1); ctx.translate(p.sx, p.sy);
      roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, rad); ctx.clip();
      if (im) drawFit(ctx, im, -p.w / 2, -p.h / 2, p.w, p.h); else { ctx.fillStyle = '#17171a'; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      ctx.restore();
    }
    if (canvas.matches(':focus-visible')) { ctx.strokeStyle = '#ffc7c6'; ctx.lineWidth = 3; ctx.strokeRect(3, 3, W - 6, H - 6); }
  }

  function tick(t) {
    raf = requestAnimationFrame(tick); const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t; const k = dt * 60;
    if (flying) { // a click flies the camera to a cover and stops in front of it
      flying.t = Math.min(1, flying.t + dt / 0.9); const e = easeInOut(flying.t);
      cam.x = lerp(flying.from.x, flying.to.x, e); cam.y = lerp(flying.from.y, flying.to.y, e); cam.z = lerp(flying.from.z, flying.to.z, e); if (flying.t >= 1) flying = null;
    } else if (!focused) {
      cam.x += vel.x * k; cam.y += vel.y * k; cam.z += (vel.z + o.autoZoom) * k;
      const fr = Math.pow(o.friction, k); vel.x *= fr; vel.y *= fr; vel.z *= fr;
      cam.x += (mouse.x * o.drift - 0) * 0.002 * k; cam.y += (mouse.y * o.drift) * 0.002 * k; // a little parallax toward the pointer
    }
    gather(); draw();
  }
  const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const local = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const planeAt = p => { for (let i = planes.length - 1; i >= 0; i--) { const q = planes[i]; if (q.a > 0.35 && Math.abs(p.x - q.sx) <= q.w / 2 && Math.abs(p.y - q.sy) <= q.h / 2) return q; } return null; };

  function release() { if (!focused) return; focused = null; onFocus?.(null); }
  function focusOn(q) {
    focused = q; const dist = 26; flying = { t: 0, from: { ...cam }, to: { x: q.wx, y: q.wy, z: q.wz - dist } }; vel.x = vel.y = vel.z = 0;
    onFocus?.(books[q.idx]);
  }
  canvas.addEventListener('pointerdown', e => { const p = local(e); drag = { id: e.pointerId, x: p.x, y: p.y, moved: 0, t: performance.now() }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    const p = local(e); mouse.x = (p.x / W - 0.5) * 2; mouse.y = (p.y / H - 0.5) * 2;
    if (drag && drag.id === e.pointerId && !focused) {
      const dx = p.x - drag.x, dy = p.y - drag.y; drag.x = p.x; drag.y = p.y; drag.moved += Math.abs(dx) + Math.abs(dy);
      const s = 90 / focal(); cam.x -= dx * s * 1.1; cam.y -= dy * s * 1.1; vel.x = -dx * s * 0.35; vel.y = -dy * s * 0.35;
    }
    if (!drag) canvas.style.cursor = planeAt(p) ? 'pointer' : 'grab';
  });
  canvas.addEventListener('pointerup', e => {
    if (!drag || drag.id !== e.pointerId) return; const p = local(e), tap = drag.moved < 8; drag = null;
    if (tap) { const q = planeAt(p); if (q && (!focused || focused.idx !== q.idx)) focusOn(q); else release(); }
  });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (focused) { release(); return; } vel.z = clamp(vel.z + e.deltaY * -0.0, -3, 3) + clamp(e.deltaY * 0.012, -2.5, 2.5); }, { passive: false });
  canvas.addEventListener('keydown', e => {
    const s = 1.4; if (e.key === 'ArrowLeft') vel.x -= s; else if (e.key === 'ArrowRight') vel.x += s; else if (e.key === 'ArrowUp') vel.y -= s; else if (e.key === 'ArrowDown') vel.y += s;
    else if (e.key === '+' || e.key === '=') vel.z += 1.2; else if (e.key === '-') vel.z -= 1.2; else if (e.key === 'Escape') release(); else return; e.preventDefault();
  });

  layout(); const ro = new ResizeObserver(layout); ro.observe(canvas);
  let tab = true, want = false; const sync = () => (want && tab ? start() : stop()); const offTab = onTabVisibility(v => { tab = v; sync(); });
  return { run(on) { want = on; sync(); }, release, openFocused() { if (focused) { const b = books[focused.idx]; openStory(b.href, null, b.cover); } }, destroy() { stop(); ro.disconnect(); offTab(); } };
}
