// Wobbly map: the image's light and dark become elevation, drawn as hand-inked contour lines on tinted land and sea.
// The whole map wobbles slowly, like a drawing seen through warm air.
export default {
  id: 'wobbly-map',
  name: 'Wobbly map',
  params: [
    { id: 'levels', label: 'Contour lines', min: 6, max: 40, step: 1, value: 18 },
    { id: 'wobble', label: 'Wobble', min: 0, max: 2, step: 0.05, value: 1 },
    { id: 'line', label: 'Line weight', min: 0.05, max: 0.5, step: 0.01, value: 0.2 },
    { id: 'photo', label: 'Keep the photo', min: 0, max: 1, step: 0.02, value: 0.22 },
    { id: 'speed', label: 'Wobble speed', min: 0, max: 2, step: 0.05, value: 0.6 },
    { id: 'sea', label: 'Sea', type: 'color', value: '#b7d3cf' },
    { id: 'land', label: 'Land', type: 'color', value: '#ead9a6' },
    { id: 'peak', label: 'Peaks', type: 'color', value: '#c88a5b' },
    { id: 'inkc', label: 'Ink', type: 'color', value: '#4a2f1f' },
  ],
  frag: `
float elevation(vec2 uv){
  // a soft blur of the image's brightness, so contours follow shapes and not noise
  float e = 0.0, r = 0.006;
  e += lum(img(uv)) * 0.28;
  e += lum(img(uv + vec2(r, 0.0))) * 0.18 + lum(img(uv - vec2(r, 0.0))) * 0.18;
  e += lum(img(uv + vec2(0.0, r))) * 0.18 + lum(img(uv - vec2(0.0, r))) * 0.18;
  return e;
}
vec3 effect(vec2 uv){
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = uT * u_speed;
  // wobble: the sampling position drifts like a hand-drawn line
  vec2 w = vec2(fbm(p * 3.2 + vec2(t * 0.15, 0.0)), fbm(p * 3.2 + vec2(5.0, t * 0.12))) - 0.5;
  vec2 q = uv + w * u_wobble * 0.055;
  float e = clamp(elevation(q), 0.0, 1.0);
  e = clamp((e - 0.5) * 1.35 + 0.5 + 0.06 * (fbm(p * 1.6) - 0.5), 0.0, 1.0);   // a little invented terrain so flat photos still read as land

  float x = e * u_levels;
  float f = fract(x), band = floor(x);
  float edge = min(f, 1.0 - f);
  float index = step(0.5, fract(band / 5.0));                                    // every fifth line is an index contour
  float width = u_line * (0.5 + 0.5 * index);
  float line = 1.0 - smoothstep(width * 0.5, width * 0.5 + 0.07, edge);

  vec3 fill = mix(u_sea, u_land, smoothstep(0.22, 0.46, e));
  fill = mix(fill, u_peak, smoothstep(0.62, 0.92, e));
  fill = mix(fill, img(q), u_photo);
  fill *= 0.96 + 0.08 * vn(gl_FragCoord.xy * 0.45);                              // paper tooth
  vec3 col = mix(fill, u_inkc, line * (0.55 + 0.35 * index));

  // a coastline shadow where land meets sea, drawn by a slightly shaky hand
  float coast = smoothstep(0.012, 0.0, abs(e - 0.34 - 0.01 * vn(p * 40.0)));
  col = mix(col, u_inkc, coast * 0.55);
  col *= 1.0 - 0.22 * pow(length(uv - 0.5) * 1.25, 2.0);
  return col;
}`,
};
