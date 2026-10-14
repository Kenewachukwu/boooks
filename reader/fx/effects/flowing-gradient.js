// Flowing gradient: four colours poured into slow liquid currents. The photo is refracted through the flow, so it shimmers
// and bends like something seen under moving water.
export default {
  id: 'flowing-gradient',
  name: 'Flowing gradient',
  params: [
    { id: 'speed', label: 'Flow speed', min: 0, max: 2, step: 0.05, value: 0.8 },
    { id: 'scale', label: 'Size of currents', min: 0.5, max: 4, step: 0.05, value: 1.6 },
    { id: 'refract', label: 'Bend the photo', min: 0, max: 2, step: 0.05, value: 1 },
    { id: 'photo', label: 'Image shows through', min: 0, max: 1, step: 0.02, value: 0.4 },
    { id: 'c1', label: 'Colour 1', type: 'color', value: '#2a0f2e' },
    { id: 'c2', label: 'Colour 2', type: 'color', value: '#e0245e' },
    { id: 'c3', label: 'Colour 3', type: 'color', value: '#ff9a3c' },
    { id: 'c4', label: 'Colour 4', type: 'color', value: '#ffe9c2' },
  ],
  frag: `
vec3 effect(vec2 uv){
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = uT * u_speed * 0.15;
  vec2 q = p * u_scale;
  vec2 w1 = vec2(fbm(q + vec2(t, 0.0)), fbm(q + vec2(3.2, 1.7) - t));
  vec2 w2 = vec2(fbm(q + 3.0 * w1 + vec2(1.7, 9.2) + t * 0.7), fbm(q + 3.0 * w1 + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(q + 3.0 * w2);
  vec3 col = mix(u_c1, u_c2, clamp(f * 1.7, 0.0, 1.0));
  col = mix(col, u_c3, clamp(length(w1) * 0.95, 0.0, 1.0));
  col = mix(col, u_c4, clamp(w2.x * w2.y * 2.4, 0.0, 1.0));
  vec3 im = img(uv + (w2 - 0.5) * u_refract * 0.14);                               // the photo, seen through the current
  col = mix(col, col * (0.5 + 1.1 * im), u_photo);
  col += (h21(gl_FragCoord.xy + fract(uT) * 61.0) - 0.5) * 0.035;
  return col;
}`,
};
