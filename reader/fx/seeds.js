// Seed images drawn in code: original, licence-free stand-ins so every effect works before anyone uploads a photo.
// Real seeds are just images: an upload, a file in media/seeds/, or a stock-photo URL (see loadSeed).

function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// A top-down mug of hot chocolate with a cream heart that has cracked in two. Sugar is spilled across the table.
function hotChocolate(w = 1080, h = 1920) {
  const [c, x] = canvasOf(w, h), r = mulberry(7);
  // table
  let g = x.createRadialGradient(w * 0.5, h * 0.55, 100, w * 0.5, h * 0.55, h * 0.8);
  g.addColorStop(0, '#d49a68'); g.addColorStop(1, '#8a5532'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { // wood grain
    const y = r() * h, x0 = r() * w, len = 120 + r() * 420; x.strokeStyle = r() < 0.5 ? 'rgba(60,30,12,0.07)' : 'rgba(255,230,190,0.05)'; x.lineWidth = 1 + r() * 2.5;
    x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + len, y + (r() - 0.5) * 6); x.stroke();
  }
  const cx = w * 0.5, cy = h * 0.62;
  // spilled sugar (drawn under and around the mug)
  const sugar = () => { for (let i = 0; i < 900; i++) {
    const a = r() * Math.PI * 2, d = 380 + Math.pow(r(), 0.7) * 520, sx = cx + Math.cos(a) * d * 1.15, sy = cy + Math.sin(a) * d * 1.05 - 120 * r(), s = 3 + r() * 6;
    if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
    x.save(); x.translate(sx, sy); x.rotate(r() * 3); x.fillStyle = 'rgba(70,35,15,0.35)'; x.fillRect(-s / 2 + 2, -s / 2 + 3, s, s);
    x.fillStyle = r() < 0.2 ? '#ffffff' : '#fff1da'; x.fillRect(-s / 2, -s / 2, s, s); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(-s / 2, -s / 2, s * 0.4, s * 0.4); x.restore();
  } };
  sugar();
  // mug: shadow, handle, ceramic, inner wall, cocoa
  x.save(); x.shadowColor = 'rgba(40,18,6,0.55)'; x.shadowBlur = 60; x.shadowOffsetX = 30; x.shadowOffsetY = 50;
  x.fillStyle = '#efe0c8'; x.beginPath(); x.arc(cx, cy, 440, 0, 7); x.fill(); x.restore();
  x.strokeStyle = '#ead9bd'; x.lineWidth = 70; x.lineCap = 'round'; x.beginPath(); x.arc(cx + 470, cy, 135, -Math.PI * 0.52, Math.PI * 0.52); x.stroke();
  g = x.createLinearGradient(cx - 440, cy - 440, cx + 440, cy + 440); g.addColorStop(0, '#fff8ea'); g.addColorStop(1, '#dcc7a6');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 440, 0, 7); x.fill();
  g = x.createRadialGradient(cx - 40, cy - 40, 200, cx, cy, 390); g.addColorStop(0, '#cdb48f'); g.addColorStop(1, '#a98d66');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 392, 0, 7); x.fill();
  g = x.createRadialGradient(cx - 30, cy - 50, 20, cx, cy, 350); g.addColorStop(0, '#6a3720'); g.addColorStop(0.7, '#3d1c0e'); g.addColorStop(1, '#25100a');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 350, 0, 7); x.fill();
  x.strokeStyle = 'rgba(255,230,200,0.35)'; x.lineWidth = 8; x.beginPath(); x.arc(cx, cy, 345, Math.PI * 1.05, Math.PI * 1.45); x.stroke(); // the glint on the rim
  // the heart, cracked down the middle and drifting apart
  const heart = () => { x.beginPath(); x.moveTo(0, 150); x.bezierCurveTo(-330, -60, -230, -300, 0, -150); x.bezierCurveTo(230, -300, 330, -60, 0, 150); x.closePath(); };
  for (const side of [-1, 1]) {
    x.save(); x.translate(cx + side * 12, cy - 10 + side * 5); x.rotate(side * 0.035);
    x.beginPath(); x.rect(side < 0 ? -400 : 0, -400, 400, 800); x.clip();
    heart(); x.fillStyle = '#f4e1c6'; x.shadowColor = 'rgba(30,10,4,0.5)'; x.shadowBlur = 14; x.fill(); x.shadowBlur = 0;
    x.strokeStyle = 'rgba(190,140,100,0.55)'; x.lineWidth = 6; for (let k = 1; k < 4; k++) { x.save(); x.scale(1 - k * 0.2, 1 - k * 0.2); heart(); x.stroke(); x.restore(); } // latte ripples
    x.restore();
  }
  x.strokeStyle = '#2e140a'; x.lineWidth = 9; x.lineJoin = 'round'; x.beginPath(); // the crack
  [[0, -160], [-22, -80], [18, -30], [-18, 30], [14, 90], [0, 150]].forEach(([px, py], i) => i ? x.lineTo(cx + px, cy - 10 + py) : x.moveTo(cx + px, cy - 10 + py)); x.stroke();
  for (let i = 0; i < 260; i++) { const a = r() * 7, d = Math.sqrt(r()) * 330; x.fillStyle = `rgba(196,128,60,${0.15 + r() * 0.4})`; x.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + r() * 3, 2 + r() * 3); } // cinnamon
  for (const [mx, my, rot] of [[cx + 190, cy - 210, 0.4], [cx + 250, cy - 140, -0.2], [cx - 250, cy + 190, 0.8]]) { // marshmallows
    x.save(); x.translate(mx, my); x.rotate(rot); x.shadowColor = 'rgba(20,8,2,0.5)'; x.shadowBlur = 12; x.shadowOffsetY = 6; x.fillStyle = '#fff6e6';
    x.beginPath(); x.roundRect(-34, -34, 68, 68, 20); x.fill(); x.restore();
  }
  x.globalAlpha = 0.5; sugar(); x.globalAlpha = 1; // a few grains land on top
  g = x.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,12,4,0.45)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  return c;
}

// Value-noise hills: a height map that works well with the map and newspaper effects.
function terrain(w = 360, h = 640) {
  const [c, x] = canvasOf(w, h), id = x.createImageData(w, h), r = mulberry(21), grid = [];
  for (let i = 0; i < 4096; i++) grid.push(r());
  const hash = (ix, iy) => grid[((ix * 73856093) ^ (iy * 19349663)) >>> 0 & 4095];
  const noise = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return (hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx) * (1 - sy) + (hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx) * sy; };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let v = 0, a = 0.55, f = 2.2; for (let o = 0; o < 5; o++) { v += a * noise(i / w * f * 1.6, j / h * f * 2.6); a *= 0.5; f *= 2; }
    v = Math.min(1, Math.max(0, (v - 0.25) * 1.5)); const k = (j * w + i) * 4; id.data[k] = id.data[k + 1] = id.data[k + 2] = v * 255; id.data[k + 3] = 255;
  }
  x.putImageData(id, 0, 0); return c;
}

// A calm, neutral slate with a few soft shapes: the fallback when a photo is missing or has not loaded, so nothing odd ever shows
// (no sky, no colour cast: the effect and the mood supply the colour).
function plain(w = 540, h = 960) {
  const [c, x] = canvasOf(w, h), r = mulberry(11);
  let g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#767b86'); g.addColorStop(1, '#4b505b'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) {
    const cx = r() * w, cy = r() * h, rad = 160 + r() * 280, a = 0.10 + r() * 0.12, light = r() < 0.5;
    g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, light ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  return c;
}

// A low sun over layered hills.
function dusk(w = 1080, h = 1920) {
  const [c, x] = canvasOf(w, h);
  let g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b1038'); g.addColorStop(0.5, '#a83a5a'); g.addColorStop(0.72, '#ffb15c'); g.addColorStop(1, '#2a1030');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  g = x.createRadialGradient(w * 0.5, h * 0.7, 10, w * 0.5, h * 0.7, 330); g.addColorStop(0, '#fff6d2'); g.addColorStop(0.35, '#ffd27a'); g.addColorStop(1, 'rgba(255,170,80,0)');
  x.fillStyle = g; x.beginPath(); x.arc(w * 0.5, h * 0.7, 330, 0, 7); x.fill();
  const r = mulberry(5);
  for (let layer = 0; layer < 5; layer++) {
    const base = h * (0.68 + layer * 0.07), amp = 60 + layer * 18, ph = r() * 9;
    x.fillStyle = `hsl(${330 - layer * 10}, ${40 - layer * 4}%, ${22 - layer * 3.5}%)`; x.beginPath(); x.moveTo(0, h);
    for (let i = 0; i <= w; i += 12) x.lineTo(i, base + Math.sin(i / 170 + ph) * amp * 0.6 + Math.sin(i / 60 + ph * 2) * amp * 0.25);
    x.lineTo(w, h); x.closePath(); x.fill();
  }
  return c;
}

export const SEEDS = [
  { id: 'hot-chocolate', name: 'Heartbreak in a mug', draw: hotChocolate },
  { id: 'terrain', name: 'Hills (height map)', draw: terrain },
  { id: 'dusk', name: 'Dusk', draw: dusk },
  { id: 'plain', name: 'Plain slate', draw: plain },
];

export function loadImage(url, { crossOrigin = true } = {}) {
  return new Promise((ok, no) => {
    const im = new Image();
    if (crossOrigin) im.crossOrigin = 'anonymous'; // a stock-photo URL only works if its server allows it; otherwise upload the file
    im.onload = () => ok(im); im.onerror = () => no(new Error('Could not load ' + url));
    im.src = url;
  });
}

// A seed is a built-in id ("hot-chocolate"), or a path / URL to an image.
export async function loadSeed(spec) {
  const seed = SEEDS.find(s => s.id === spec);
  return seed ? seed.draw() : loadImage(spec, { crossOrigin: /^https?:/.test(spec) });
}
