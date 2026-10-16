// Reels: one tilted, gently arched row of covers per genre, gliding on their own. Rows are muted until the pointer's spotlight passes over
// them (the row in focus is always in colour). Drag, arrow keys or the genre tabs move between genres; a sideways push sends a row gliding.
import { reduced, finePointer, clamp, lerp, fitCanvas, whenVisible, onTabVisibility, loadCover, roundRect, drawFit, openStory } from '../motion.js';

const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function createReels({ canvas, rows, onFocus, tilt = 7, arch = 52, spot = 210 }) {
  let W = 0, H = 0, ctx, rowStep = 140, ch = 120, cw = 80, gap = 16, running = false, raf = 0, last = 0;
  const n = rows.length;
  let focus = 0, target = 0, lastIdx = -1, mouse = null, drag = null, hits = [];
  const off = rows.map((_, i) => i * 140), push = rows.map(() => 0), strips = [];
  const covers = new Map(); // slug -> { color, gray }
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);

  // load each cover once, and build a muted copy of it
  for (const r of rows) for (const b of r.books) if (!covers.has(b.slug)) {
    covers.set(b.slug, null);
    loadCover(b.cover).then(bm => {
      if (!bm) return;
      const g = document.createElement('canvas'); g.width = Math.max(1, Math.round(bm.width / 2)); g.height = Math.max(1, Math.round(bm.height / 2));
      const x = g.getContext('2d'); x.drawImage(bm, 0, 0, g.width, g.height);
      x.globalCompositeOperation = 'saturation'; x.fillStyle = '#808080'; x.fillRect(0, 0, g.width, g.height);
      x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(5,5,6,0.45)'; x.fillRect(0, 0, g.width, g.height);
      covers.set(b.slug, { color: bm, gray: g });
    });
  }

  function layout() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas, 2));
    rowStep = clamp(H * 0.2, 112, 168); ch = rowStep * 0.9; cw = ch * (2 / 3); gap = 16;
    strips.length = 0;
    rows.forEach(r => {
      const cells = [{ type: 'name', w: cw * 1.5 }];
      for (const b of r.books) { cells.push({ type: 'book', b, w: cw }); cells.push({ type: 'quote', b, w: cw * 1.4 }); }
      cells.push({ type: 'stat', w: cw * 1.1 });
      let x = 0; for (const c of cells) { c.x = x; x += c.w + gap; }
      strips.push({ cells, len: x });
    });
  }

  const wrapText = (x, text, maxW, maxLines) => {
    const words = String(text).split(/\s+/), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines.slice(0, maxLines);
  };

  function drawCell(c, row, y, amt, sc) {
    const h = ch, w = c.w;
    if (c.type === 'book') {
      const cv = covers.get(c.b.slug), rad = 10;
      ctx.save(); roundRect(ctx, c.x, y - h / 2, w, h, rad); ctx.clip();
      if (!cv) { ctx.fillStyle = '#17171a'; ctx.fillRect(c.x, y - h / 2, w, h); }
      else { drawFit(ctx, cv.gray, c.x, y - h / 2, w, h); if (amt > 0.01) { ctx.globalAlpha *= amt; drawFit(ctx, cv.color, c.x, y - h / 2, w, h); } }
      ctx.restore();
    } else if (c.type === 'name') {
      ctx.save(); roundRect(ctx, c.x, y - h / 2, w, h, 10); ctx.fillStyle = row.color; ctx.globalAlpha *= 0.55 + 0.45 * amt; ctx.fill(); ctx.globalAlpha = Math.max(ctx.globalAlpha, 0.9);
      ctx.fillStyle = '#050506'; ctx.textBaseline = 'alphabetic';
      ctx.font = `900 ${Math.round(h * 0.16)}px Archivo, Arial Narrow, sans-serif`; const lines = wrapText(ctx, row.name.toUpperCase(), w - 24, 3);
      lines.forEach((l, i) => ctx.fillText(l, c.x + 12, y - h / 2 + 22 + h * 0.17 * (i + 1) - h * 0.1));
      ctx.font = `500 ${Math.round(h * 0.075)}px "Roboto Mono", monospace`; ctx.fillText(`${row.books.length} STORIES`, c.x + 12, y + h / 2 - 14);
      ctx.restore();
    } else if (c.type === 'quote') {
      ctx.save(); roundRect(ctx, c.x, y - h / 2, w, h, 10); ctx.fillStyle = '#0e0e11'; ctx.fill(); ctx.strokeStyle = row.color; ctx.globalAlpha *= 0.4 + 0.6 * amt; ctx.lineWidth = 1.2; ctx.stroke(); ctx.clip();
      ctx.fillStyle = '#f6f3ee'; ctx.font = `300 italic ${Math.round(h * 0.105)}px Fraunces, Georgia, serif`;
      wrapText(ctx, '“' + c.b.blurb + '”', w - 26, 7).forEach((l, i) => ctx.fillText(l, c.x + 13, y - h / 2 + 30 + i * h * 0.125));
      ctx.fillStyle = row.color; ctx.font = `500 ${Math.round(h * 0.062)}px "Roboto Mono", monospace`; ctx.fillText(c.b.title.toUpperCase().slice(0, 22), c.x + 13, y + h / 2 - 14);
      ctx.restore();
    } else {
      ctx.save(); roundRect(ctx, c.x, y - h / 2, w, h, 10); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#a9a7ae'; ctx.font = `500 ${Math.round(h * 0.075)}px "Roboto Mono", monospace`; ctx.textAlign = 'center';
      const mins = row.books.reduce((s, b) => s + (b.minutes || 1), 0); ctx.fillText(`${mins} MIN OF`, c.x + w / 2, y - 6); ctx.fillText('READING', c.x + w / 2, y + 12); ctx.restore();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H); hits = [];
    ctx.save(); ctx.translate(W / 2, H * 0.47); ctx.rotate(-tilt * Math.PI / 180);
    const rad = tilt * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad), half = W * 0.75;
    for (let i = 0; i < n; i++) {
      const d = i - focus, ad = Math.abs(d); if (ad > 3.3) continue;
      const sc = 1 - Math.min(0.3, ad * 0.1), a = clamp(1 - ad * 0.3, 0, 1) * (ad > 2.6 ? clamp(1 - (ad - 2.6) / 0.7, 0, 1) : 1);
      const strip = strips[i], y = d * rowStep * 0.96 * (1 - 0.04 * ad);
      const base = ((off[i] % strip.len) + strip.len) % strip.len;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(0, y); ctx.scale(sc, sc);
      const infocus = clamp(1 - ad * 1.6, 0, 1);
      for (let rep = -2; rep < 6; rep++) for (const c of strip.cells) {
        const x = c.x + rep * strip.len - base - strip.len; // world x of the cell's left edge inside the row
        if (x > half / sc || x + c.w < -half / sc) continue;
        const cx = x + c.w / 2, archY = arch * Math.pow(cx * sc / (W * 0.5), 2) * 0.6 - arch * 0.3;
        // where is the cell on screen? (for the spotlight)
        const m = ctx.getTransform(), dp = dpr(), px = (m.a * cx + m.c * archY + m.e) / dp, py = (m.b * cx + m.d * archY + m.f) / dp;
        let amt = infocus * 0.95; if (mouse) amt = Math.max(amt, smooth(1, 0, Math.hypot(px - mouse.x, py - mouse.y) / spot));
        const cell = { ...c, x }; drawCell(cell, rows[i], archY, amt, sc);
        if ((c.type === 'book' || c.type === 'quote') && a > 0.5) hits.push({ b: c.b, x: px, y: py, w: c.w * sc, h: ch * sc, row: i });
      }
      ctx.restore();
    }
    ctx.restore(); drawHint();
  }
  function drawHint() { /* the focus ring for keyboard users */
    if (canvas.matches(':focus-visible')) { ctx.save(); ctx.strokeStyle = '#ffc7c6'; ctx.lineWidth = 3; ctx.strokeRect(3, 3, W - 6, H - 6); ctx.restore(); }
  }

  function tick(t) {
    raf = requestAnimationFrame(tick); const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    focus += (target - focus) * Math.min(1, dt * 7); if (Math.abs(target - focus) < 0.002) focus = target;
    for (let i = 0; i < n; i++) { const auto = reduced ? 0 : (i % 2 ? -1 : 1) * (22 + (i % 3) * 7); off[i] += (auto * (drag ? 0.2 : 1) + push[i]) * dt; push[i] *= Math.exp(-dt * 2.6); if (Math.abs(push[i]) < 0.5) push[i] = 0; }
    const idx = clamp(Math.round(target), 0, n - 1); if (idx !== lastIdx) { lastIdx = idx; onFocus?.(idx); }
    draw();
  }
  const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  // ---- input
  const local = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const hitAt = (px, py) => { const rad = tilt * Math.PI / 180, cx = W / 2, cy = H * 0.47; for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; const dx = px - h.x, dy = py - h.y; const lx = dx * Math.cos(-rad) - dy * Math.sin(-rad), ly = dx * Math.sin(-rad) + dy * Math.cos(-rad); if (Math.abs(lx) <= h.w / 2 && Math.abs(ly) <= h.h / 2) return h; } void cx; void cy; return null; };
  canvas.addEventListener('pointerdown', e => { const p = local(e); drag = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: 0, touch: e.pointerType !== 'mouse', t: performance.now() }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    const p = local(e); if (e.pointerType === 'mouse') mouse = p;
    if (drag && drag.id === e.pointerId) {
      const dx = p.x - drag.x, dy = p.y - drag.y; drag.x = p.x; drag.y = p.y; drag.moved += Math.abs(dx) + Math.abs(dy);
      const row = clamp(Math.round(target), 0, n - 1); off[row] -= dx; push[row] = clamp(-dx / Math.max(0.008, (performance.now() - drag.t) / 1000) * 0.6, -900, 900); drag.t = performance.now();
      if (!drag.touch) target = clamp(target - dy / rowStep, 0, n - 1);
    }
    canvas.style.cursor = !drag && hitAt(p.x, p.y) ? 'pointer' : '';
  });
  const release = e => {
    if (!drag || drag.id !== e.pointerId) return; const p = local(e), tap = drag.moved < 8; drag = null;
    if (!drag && !tap) target = clamp(Math.round(target), 0, n - 1);
    if (tap) { const h = hitAt(p.x, p.y); if (h) { const r = canvas.getBoundingClientRect(), tmp = document.createElement('div'); Object.assign(tmp.style, { position: 'fixed', left: r.left + h.x - h.w / 2 + 'px', top: r.top + h.y - h.h / 2 + 'px', width: h.w + 'px', height: h.h + 'px' }); document.body.append(tmp); openStory(h.b.href, tmp, h.b.cover); } else { const row = clamp(Math.round(target), 0, n - 1); void row; } }
  };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('pointerleave', () => { mouse = null; });
  canvas.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); push[clamp(Math.round(target), 0, n - 1)] += e.deltaX * 3; } }, { passive: false });
  canvas.addEventListener('keydown', e => {
    const row = clamp(Math.round(target), 0, n - 1);
    if (e.key === 'ArrowDown') { e.preventDefault(); target = clamp(row + 1, 0, n - 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); target = clamp(row - 1, 0, n - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); push[row] -= 520; } else if (e.key === 'ArrowLeft') { e.preventDefault(); push[row] += 520; }
  });

  layout(); const ro = new ResizeObserver(() => { layout(); }); ro.observe(canvas);
  let vis = true, tab = true; const sync = () => (vis && tab ? start() : stop());
  const offVis = whenVisible(canvas, v => { vis = v; sync(); }), offTab = onTabVisibility(v => { tab = v; sync(); });
  return { setFocus: i => { target = clamp(i, 0, n - 1); }, get focusIndex() { return Math.round(target); }, destroy() { stop(); ro.disconnect(); offVis(); offTab(); } };
}
