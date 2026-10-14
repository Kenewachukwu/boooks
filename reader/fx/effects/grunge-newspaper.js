// Grunge newspaper: the image becomes a halftone print on old newsprint: dot screen, ink bleed, a spot colour printed slightly off
// register, faint type columns, stains, folds and burnt edges. Reading progress burns the edges further.
export default {
  id: 'grunge-newspaper',
  name: 'Grunge newspaper',
  params: [
    { id: 'dot', label: 'Halftone dot size', min: 3, max: 16, step: 0.5, value: 6 },
    { id: 'contrast', label: 'Contrast', min: 0.5, max: 2, step: 0.05, value: 1.15 },
    { id: 'lift', label: 'Lighten (keeps text readable)', min: -0.3, max: 0.6, step: 0.02, value: 0.18 },
    { id: 'grit', label: 'Ink bleed', min: 0, max: 2, step: 0.05, value: 1 },
    { id: 'grunge', label: 'Stains and folds', min: 0, max: 1, step: 0.02, value: 0.55 },
    { id: 'burn', label: 'Burnt edges (grows as you read)', min: 0, max: 1, step: 0.02, value: 0.5 },
    { id: 'spotAmt', label: 'Spot colour', min: 0, max: 1, step: 0.02, value: 0.4 },
    { id: 'paper', label: 'Paper', type: 'color', value: '#eadfc6' },
    { id: 'ink', label: 'Ink', type: 'color', value: '#2b1812' },
    { id: 'spot', label: 'Spot colour', type: 'color', value: '#d93a63' },
  ],
  frag: `
vec3 effect(vec2 uv){
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float px = uRes.y / 1100.0;                       // pixel scale so the print looks the same at any canvas size

  // ink bleed: the printed image wobbles by a hair
  vec2 j = (vec2(vn(p * 260.0), vn(p * 260.0 + 9.0)) - 0.5) * 0.0028 * u_grit;
  vec3 im = img(uv + j);
  float L = clamp((lum(im) - 0.5) * u_contrast + 0.5 + u_lift, 0.0, 1.0);

  // halftone screen at 45 degrees
  float cell = max(3.0, u_dot * px);
  vec2 g = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / cell;
  float rad = sqrt(1.0 - L) * 0.66;
  float dotm = smoothstep(rad, rad - 0.14, length(fract(g) - 0.5));
  dotm *= 0.86 + 0.14 * vn(gl_FragCoord.xy * 0.35);   // dots are never quite solid

  // paper: fibres, mottling, faint type columns
  float fibre = vn(vec2(p.x * 380.0, p.y * 9.0)) * 0.5 + vn(vec2(p.x * 9.0, p.y * 380.0)) * 0.5;
  float mottle = fbm(p * 14.0);
  vec3 paper = u_paper * (0.93 + 0.10 * mottle + 0.05 * fibre);
  float rowId = floor(uv.y * 118.0);
  float colMask = step(0.05, fract(p.x * 3.4)) * step(0.0, 1.0 - fract(p.x * 3.4) - 0.02);
  float words = step(0.44, vn(vec2(p.x * 46.0, rowId * 1.7)));
  float lineBand = 1.0 - step(0.46, fract(uv.y * 118.0));
  paper *= 1.0 - 0.10 * colMask * words * lineBand * (0.4 + 0.6 * u_grunge);

  // stains and folds
  float stain = smoothstep(0.52, 0.86, fbm(p * 2.4 + 3.0));
  paper = mix(paper, paper * vec3(0.78, 0.62, 0.42), stain * u_grunge * 0.75);
  float fold1 = abs(uv.y - 0.5 + 0.006 * vn(p * 5.0));
  float fold2 = abs(uv.x - 0.5 + 0.006 * vn(p * 5.0 + 4.0));
  float crease = smoothstep(0.004, 0.0, fold1) * 0.35 + smoothstep(0.004, 0.0, fold2) * 0.25;
  float sheen = smoothstep(0.03, 0.0, abs(fold1 - 0.008)) * 0.12;
  paper = paper * (1.0 - crease * u_grunge) + sheen * u_grunge;

  // ink, then a spot colour printed a few pixels off register where the photo is saturated
  vec3 col = mix(paper, u_ink, dotm * 0.92);
  float spotMask = smoothstep(0.30, 0.68, sat(img(uv + vec2(0.004, -0.003))));
  col *= mix(vec3(1.0), mix(vec3(1.0), u_spot, 0.9), spotMask * u_spotAmt);

  // dust and specks
  float speck = step(0.9985, h21(floor(gl_FragCoord.xy / max(1.0, px))));
  col = mix(col, u_ink, speck * 0.5 * u_grunge);

  // burnt edges, spreading with reading progress
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float b = u_burn * (0.2 + 0.65 * uProg);
  float burn = smoothstep(0.0, 1.0, (1.0 - smoothstep(0.0, 0.28, edge)) * b * 2.1 + (fbm(p * 6.0 + 1.3) - 0.5) * 0.7 * b);
  col = mix(col, vec3(0.16, 0.07, 0.03), clamp(burn, 0.0, 1.0) * 0.9);
  col += vec3(0.6, 0.18, 0.02) * smoothstep(0.55, 0.9, burn) * (1.0 - smoothstep(0.9, 1.0, burn)) * 0.35 * (0.8 + 0.2 * sin(uT * 2.0 + p.x * 9.0)); // a faint ember line

  // film-grain shimmer so it is alive but calm
  col += (h21(gl_FragCoord.xy + fract(uT * 0.5) * 83.0) - 0.5) * 0.035;
  return col;
}`,
};
