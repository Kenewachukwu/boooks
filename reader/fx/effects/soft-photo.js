// Soft photo: the plain photograph, handled gently: a slow drifting zoom, a colour grade, an optional soft focus so text sits
// comfortably on top, a vignette and a little grain. The safest choice for any photo.
export default {
  id: 'soft-photo',
  name: 'Soft photo',
  params: [
    { id: 'zoom', label: 'Slow zoom', min: 0, max: 0.25, step: 0.01, value: 0.08 },
    { id: 'speed', label: 'Drift speed', min: 0, max: 2, step: 0.05, value: 0.5 },
    { id: 'soften', label: 'Soft focus', min: 0, max: 1, step: 0.02, value: 0.45 },
    { id: 'contrast', label: 'Contrast', min: 0.6, max: 1.6, step: 0.02, value: 1.05 },
    { id: 'saturation', label: 'Colour', min: 0, max: 1.6, step: 0.02, value: 0.95 },
    { id: 'tintAmt', label: 'Tint amount', min: 0, max: 0.6, step: 0.02, value: 0.18 },
    { id: 'vignette', label: 'Vignette', min: 0, max: 1, step: 0.02, value: 0.45 },
    { id: 'tint', label: 'Tint', type: 'color', value: '#2a1a3a' },
  ],
  frag: `
vec3 effect(vec2 uv){
  float t = uT * u_speed * 0.05;
  float z = 1.0 - u_zoom * (0.5 + 0.5 * sin(t));                          // breathing zoom
  vec2 c = vec2(0.5 + 0.02 * sin(t * 0.7), 0.5 + 0.02 * cos(t * 0.9));
  vec2 p = (uv - c) * z + c;
  float r = 0.004 + 0.012 * u_soften;                                      // soft focus: a small ring of taps
  vec3 col = img(p) * 0.28;
  col += img(p + vec2(r, 0.0)) * 0.18 + img(p - vec2(r, 0.0)) * 0.18;
  col += img(p + vec2(0.0, r)) * 0.18 + img(p - vec2(0.0, r)) * 0.18;
  col = mix(img(p), col, u_soften);
  float L = lum(col);
  col = mix(vec3(L), col, u_saturation);
  col = (col - 0.5) * u_contrast + 0.5;
  col = mix(col, col * (0.6 + 0.8 * u_tint), u_tintAmt * 2.0);
  col *= 1.0 - u_vignette * 0.55 * pow(length(uv - 0.5) * 1.3, 2.0);
  col += (h21(gl_FragCoord.xy + fract(uT) * 53.0) - 0.5) * 0.035;
  return col;
}`,
};
