// booooks effects library: give it any image (an upload, a stock photo, a procedural seed) and an effect, and it draws the result
// live with WebGL. Each effect is one file in ./effects that declares its own settings, so an editor can build its controls from them.
//
//   const fx = createFx(canvas);
//   fx.setImage(imgOrCanvas);
//   fx.setEffect('grunge-newspaper', { dot: 8 });   // unspecified settings use the effect's defaults
//   fx.start();                                     // animates; fx.draw(t) renders one still frame at t seconds
//   fx.setProgress(0.4);                            // 0..1, for effects that change as a story is read

import grungeNewspaper from './effects/grunge-newspaper.js';
import wobblyMap from './effects/wobbly-map.js';
import radialGradient from './effects/radial-gradient.js';
import flowingGradient from './effects/flowing-gradient.js';
import shaderGradient from './effects/shader-gradient.js';
import softPhoto from './effects/soft-photo.js';

export const EFFECTS = [grungeNewspaper, wobblyMap, radialGradient, flowingGradient, shaderGradient, softPhoto];
export const effectById = id => EFFECTS.find(e => e.id === id);
export const defaultsOf = effect => Object.fromEntries(effect.params.map(p => [p.id, p.value]));

const VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

// Shared GLSL every effect can use: noise, the image (cover-fitted to the canvas) and the standard uniforms.
const PRELUDE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;   // the image
uniform vec2 uRes;        // canvas size in pixels
uniform vec2 uImg;        // image size in pixels
uniform float uT;         // seconds
uniform float uProg;      // 0..1 reading progress

float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p){ return vec2(h21(p), h21(p + 19.19)); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.7); a *= 0.5; }
  return s;
}
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float sat(vec3 c){ return max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b)); }
// uv runs 0..1 with y down. The image is scaled to cover the canvas, like CSS object-fit: cover.
vec3 img(vec2 uv){
  float a = uRes.x / uRes.y, b = uImg.x / uImg.y;
  vec2 s = a > b ? vec2(1.0, b / a) : vec2(a / b, 1.0);
  return texture2D(uTex, clamp((uv - 0.5) * s + 0.5, 0.0, 1.0)).rgb;
}
vec3 effect(vec2 uv);
void main(){
  vec2 uv = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  gl_FragColor = vec4(clamp(effect(uv), 0.0, 1.0), 1.0);
}
`;

const hexToRgb = hex => { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

export function createFx(canvas, { maxRows = 1100 } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL is not available');

  let tex = null, imgSize = [1, 1], effect = null, values = {}, progress = 0, quality = 1;
  let running = false, raf = 0, t0 = performance.now(), last = 0, slow = 0, frames = 0;
  const programs = new Map();

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one big triangle covers the screen

  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  function programFor(e) {
    if (programs.has(e.id)) return programs.get(e.id);
    const decl = e.params.map(p => p.type === 'color' ? `uniform vec3 u_${p.id};` : `uniform float u_${p.id};`).join('\n');
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, PRELUDE + decl + '\n' + e.frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    const loc = n => gl.getUniformLocation(prog, n);
    const entry = { prog, a: gl.getAttribLocation(prog, 'a'), uTex: loc('uTex'), uRes: loc('uRes'), uImg: loc('uImg'), uT: loc('uT'), uProg: loc('uProg'), params: Object.fromEntries(e.params.map(p => [p.id, loc('u_' + p.id)])) };
    programs.set(e.id, entry);
    return entry;
  }

  function size() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = r.width * dpr * quality, h = r.height * dpr * quality;
    const cap = Math.min(1, maxRows / Math.max(h, 1)); w = Math.max(2, Math.round(w * cap)); h = Math.max(2, Math.round(h * cap));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }

  function draw(seconds) { size(); paint(seconds); }
  function paint(seconds) {
    if (!effect || !tex) return;
    const p = programFor(effect);
    gl.useProgram(p.prog);
    gl.enableVertexAttribArray(p.a); gl.vertexAttribPointer(p.a, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(p.uTex, 0);
    gl.uniform2f(p.uRes, canvas.width, canvas.height); gl.uniform2f(p.uImg, imgSize[0], imgSize[1]);
    gl.uniform1f(p.uT, seconds); gl.uniform1f(p.uProg, progress);
    for (const def of effect.params) {
      const v = values[def.id];
      if (def.type === 'color') gl.uniform3fv(p.params[def.id], hexToRgb(v)); else gl.uniform1f(p.params[def.id], +v);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    draw((now - t0) / 1000);
    // a slow device renders fewer pixels instead of stuttering
    if (last) slow = Math.max(0, slow + (now - last > 34 ? 1 : -1));
    last = now;
    if (++frames > 45 && slow > 30 && quality > 0.5) { quality = Math.max(0.5, quality * 0.8); slow = 0; frames = 0; }
  }

  new ResizeObserver(() => { if (!running) draw((performance.now() - t0) / 1000); }).observe(canvas);

  return {
    canvas,
    setImage(source) {
      const w = source.naturalWidth || source.videoWidth || source.width, h = source.naturalHeight || source.videoHeight || source.height;
      if (!tex) tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); // no mipmaps: works for any image size on WebGL1
      imgSize = [w, h];
      if (!running) draw((performance.now() - t0) / 1000);
    },
    setEffect(id, overrides = {}) {
      const e = effectById(id); if (!e) throw new Error('Unknown effect ' + id);
      effect = e; values = { ...defaultsOf(e), ...overrides }; programFor(e);
      if (!running) draw((performance.now() - t0) / 1000);
    },
    setParam(id, v) { values[id] = v; if (!running) draw((performance.now() - t0) / 1000); },
    get effect() { return effect; },
    get values() { return { ...values }; },
    setProgress(p) { progress = Math.min(1, Math.max(0, p)); },
    draw,
    start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    // a full-size still as a PNG data URL: renders at the requested size, then restores the preview size
    snapshot(width = 1080, height = 1920) {
      const keep = [canvas.width, canvas.height], r = canvas.getBoundingClientRect();
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px'; // keep the on-screen size while the buffer changes
      canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height);
      paint((performance.now() - t0) / 1000);
      const url = canvas.toDataURL('image/png');
      canvas.style.width = ''; canvas.style.height = '';
      canvas.width = keep[0]; canvas.height = keep[1]; gl.viewport(0, 0, keep[0], keep[1]);
      return url;
    },
  };
}
