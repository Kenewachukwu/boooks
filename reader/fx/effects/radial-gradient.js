// Radial gradient: a glowing palette radiating from a point that drifts slowly. The image bends the rings and shows through
// as texture, so the same gradient looks different on every photo.
export default {
  id: 'radial-gradient',
  name: 'Radial gradient',
  params: [
    { id: 'cx', label: 'Centre x', min: 0, max: 1, step: 0.01, value: 0.5 },
    { id: 'cy', label: 'Centre y', min: 0, max: 1, step: 0.01, value: 0.62 },
    { id: 'radius', label: 'Radius', min: 0.3, max: 1.6, step: 0.02, value: 0.85 },
    { id: 'warp', label: 'Image bends the rings', min: 0, max: 0.8, step: 0.02, value: 0.28 },
    { id: 'photo', label: 'Image shows through', min: 0, max: 1, step: 0.02, value: 0.45 },
    { id: 'rings', label: 'Banded rings (0 = smooth)', min: 0, max: 24, step: 1, value: 0 },
    { id: 'drift', label: 'Drift', min: 0, max: 1, step: 0.02, value: 0.5 },
    { id: 'c1', label: 'Centre colour', type: 'color', value: '#ffcf6b' },
    { id: 'c2', label: 'Middle colour', type: 'color', value: '#e0245e' },
    { id: 'c3', label: 'Edge colour', type: 'color', value: '#2a0f2e' },
  ],
  frag: `
vec3 effect(vec2 uv){
  float asp = uRes.x / uRes.y;
  vec2 c = vec2(u_cx, u_cy) + 0.05 * u_drift * vec2(sin(uT * 0.42), cos(uT * 0.33));
  vec3 im = img(uv);
  float L = lum(im);
  vec2 d = (uv - c) * vec2(asp, 1.0);
  float r = length(d) / u_radius + (L - 0.5) * u_warp;
  if (u_rings > 0.5) r = mix(r, floor(r * u_rings) / u_rings, 0.55);              // visible bands
  r += 0.012 * sin(r * 40.0 - uT * 0.9) * u_drift;                                // a slow breathing ripple
  vec3 col = mix(u_c1, u_c2, smoothstep(0.0, 0.55, r));
  col = mix(col, u_c3, smoothstep(0.42, 1.1, r));
  col = mix(col, col * (0.55 + 0.95 * im), u_photo);                              // the photo multiplied in
  col += u_c1 * 0.28 * exp(-r * r * 7.0) * (0.75 + 0.25 * sin(uT * 1.1));        // glow at the centre
  col += (h21(gl_FragCoord.xy + fract(uT) * 77.0) - 0.5) * 0.04;
  return col;
}`,
};
