// node score.mjs  ->  score.wav  (48 kHz stereo, 15 s, seamless loop). Night field: pad, wind, three soft chimes on the glow peaks.
import fs from 'fs';
const SR = 48000, DUR = 15, N = SR * DUR, XF = Math.floor(SR * 0.8);
const TAU = Math.PI * 2;
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
const q15 = f => Math.round(f * DUR) / DUR; // snap to whole cycles per loop
const L = new Float32Array(N), R = new Float32Array(N), SL = new Float32Array(N), SR_ = new Float32Array(N); // dry L/R and reverb send L/R
const NOTE = { D2: 73.42, A2: 110, F3: 174.61, D3: 146.83, C4: 261.63, A3: 220, D5: 587.33, F5: 698.46, A5: 880, C6: 1046.5, D6: 1174.66, E5: 659.25 };
const hz = n => { const f = NOTE[n]; if (!f) throw new Error('unknown note ' + n); return f };

// ---- pad: detuned sines on a D minor bed, slow swell (5 s cycles)
for (const [note, amp, pan] of [['D2', .20, 0], ['A2', .13, -.2], ['F3', .1, .2], ['D3', .09, 0], ['A3', .06, -.3], ['C4', .04, .3]]) {
  const f0 = q15(hz(note));
  for (const det of [-0.2, 0, 0.2]) {
    const f = q15(f0 + det * 1.5);
    for (let i = 0; i < N; i++) {
      const t = i / SR, lfo = .6 + .4 * Math.sin(TAU * 3 * t / DUR + f0 * .01);
      const v = Math.sin(TAU * f * t) * amp * lfo / 3;
      L[i] += v * (1 - Math.max(0, pan)); R[i] += v * (1 + Math.min(0, pan));
      SL[i] += v * .25; SR_[i] += v * .25;
    }
  }
}

// ---- looped noise helper: generate N+XF samples, crossfade tail into head
function loopNoise(gen) {
  const buf = new Float32Array(N + XF); for (let i = 0; i < buf.length; i++) buf[i] = gen(i);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) out[i] = i < XF ? buf[i] * (i / XF) + buf[N + i] * (1 - i / XF) : buf[i];
  return out;
}
// state-variable filter, gliding cutoff
function svf(inp, cutFn, q, mode, seed) {
  const out = new Float32Array(inp.length); let low = 0, band = 0;
  for (let i = 0; i < inp.length; i++) {
    const f = 2 * Math.sin(Math.PI * Math.min(.45, cutFn(i / SR) / SR));
    low += f * band; const high = inp[i] - low - q * band; band += f * high;
    out[i] = mode === 'low' ? low : mode === 'band' ? band : high;
  }
  return out;
}

// ---- wind: low noise, cutoff and level follow the grass gusts (3 per loop)
{
  const r = rng(201), r2 = rng(202);
  const wn = x => svf(x, t => 260 + 340 * (.5 + .5 * Math.sin(TAU * 3 * t / DUR - .6)), .55, 'band');
  const a = wn(new Float32Array(N + XF).map(() => r() * 2 - 1)), b = wn(new Float32Array(N + XF).map(() => r2() * 2 - 1));
  const oL = loopNoise(i => a[i]), oR = loopNoise(i => b[i]);
  for (let i = 0; i < N; i++) { const t = i / SR, g = .18 + .22 * (.5 + .5 * Math.sin(TAU * 3 * t / DUR - .6)); L[i] += oL[i] * g * 1.8; R[i] += oR[i] * g * 1.8; SL[i] += oL[i] * g * .2; SR_[i] += oR[i] * g * .2; }
}

// ---- chimes: very soft, sparse high bell tones (whole-loop positions, wrap the seam)
function chime(tStart, note, amp, pan) {
  const f = hz(note), len = Math.floor(SR * 3), i0 = Math.floor(tStart * SR);
  for (let k = 0; k < len; k++) {
    const t = k / SR, env = Math.exp(-t * 1.6) * (1 - Math.exp(-t * 300));
    const v = (Math.sin(TAU * f * t) + .3 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 5)) * env * amp, idx = (i0 + k) % N;
    L[idx] += v * (1 - Math.max(0, pan)); R[idx] += v * (1 + Math.min(0, pan)); SL[idx] += v; SR_[idx] += v;
  }
}
for (const [t, nt, p] of [[2.5, 'D6', -.3], [7.5, 'A5', .3], [12.5, 'F5', 0]]) chime(t, nt, .07, p); // on the peaks of the head glow

// ---- reverb on the send (run the loop twice and keep the second pass so it wraps cleanly)
function reverb(src, delays, fb) {
  const twice = new Float32Array(N * 2); twice.set(src, 0); twice.set(src, N);
  const out = new Float32Array(N * 2);
  for (const d of delays) { const buf = new Float32Array(d); let p = 0, lp = 0; for (let i = 0; i < twice.length; i++) { const y = buf[p]; lp += .35 * (y - lp); buf[p] = twice[i] + lp * fb; p = (p + 1) % d; out[i] += y / delays.length * 2.5 } }
  return out.subarray(N);
}
const rvL = reverb(SL, [1557, 1617, 1491, 1422, 1277, 1356], .84), rvR = reverb(SR_, [1580, 1640, 1514, 1445, 1300, 1379], .84);
for (let i = 0; i < N; i++) { L[i] += rvL[i] * 1.1; R[i] += rvR[i] * 1.1; }

// ---- master: soft clip, peak normalise, guards
let peak = 0;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.2); R[i] = Math.tanh(R[i] * 1.2); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
if (!(peak > .01) || !isFinite(peak)) throw new Error('silent or NaN mix, peak=' + peak);
const g = .5 / peak; // about -6 dBFS
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) { pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * g * 32767))), i * 4); pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * g * 32767))), i * 4 + 2); }
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVEfmt ', 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
fs.writeFileSync('score.wav', Buffer.concat([hdr, pcm]));
console.log('score.wav written, peak before norm', peak.toFixed(3));
