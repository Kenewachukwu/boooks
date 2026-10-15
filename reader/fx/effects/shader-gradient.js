// Shader gradient: a lit, flowing three-colour surface, in the spirit of ShaderGradient (ruucm/shadergradient, MIT): colours, speed,
// density, frequency, amplitude and strength drive a moving height field that is shaded like a glossy sheet. Written from scratch as
// a plain WebGL fragment shader (the original needs React and Three.js). With "Image shows through" up, a photo is blended in.
export default {
  id: 'shader-gradient',
  name: 'Shader gradient',
  params: [
    { id: 'speed', label: 'Speed', min: 0, max: 2, step: 0.05, value: 0.6 },
    { id: 'density', label: 'Density (zoom)', min: 0.4, max: 3, step: 0.05, value: 1.2 },
    { id: 'frequency', label: 'Frequency', min: 0.5, max: 4, step: 0.05, value: 1.4 },
    { id: 'amplitude', label: 'Amplitude', min: 0, max: 3, step: 0.05, value: 1.2 },
    { id: 'strength', label: 'Strength (shine)', min: 0, max: 3, step: 0.05, value: 1.3 },
    { id: 'ripple', label: 'Waves to ripples', min: 0, max: 1, step: 0.02, value: 0.25 },
    { id: 'brightness', label: 'Brightness', min: 0.5, max: 1.6, step: 0.02, value: 1.0 },
    { id: 'grain', label: 'Grain', min: 0, max: 0.15, step: 0.005, value: 0.05 },
    { id: 'photo', label: 'Image shows through', min: 0, max: 1, step: 0.02, value: 0 },
    { id: 'c1', label: 'Colour 1', type: 'color', value: '#1a0b3a' },
    { id: 'c2', label: 'Colour 2', type: 'color', value: '#e0245e' },
    { id: 'c3', label: 'Colour 3', type: 'color', value: '#ffb27a' },
  ],
  frag: `
float heightAt(vec2 p, float t){
  vec2 q = p * u_frequency;
  float h = fbm(q + vec2(t, -t * 0.7));
  h += 0.5 * fbm(q * 2.1 - vec2(t * 0.8, t * 0.3)) * (0.4 + u_ripple);
  h += 0.25 * fbm(q * 4.3 + t) * u_ripple;
  return h;
}
vec3 effect(vec2 uv){
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * u_density * 2.0;
  float t = uT * u_speed * 0.22;
  float h = heightAt(p, t);
  vec2 e = vec2(0.012, 0.0);
  float hx = heightAt(p + e.xy, t) - heightAt(p - e.xy, t);
  float hy = heightAt(p + e.yx, t) - heightAt(p - e.yx, t);
  vec3 n = normalize(vec3(-hx * u_strength * u_amplitude * 4.0, -hy * u_strength * u_amplitude * 4.0, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.6, 0.75)), V = vec3(0.0, 0.0, 1.0);
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), V), 0.0, 1.0), 26.0);
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0);
  float k = smoothstep(0.25, 0.85, h * 0.8 + 0.2 * length(p) * 0.3);
  vec3 base = mix(mix(u_c1, u_c2, smoothstep(0.1, 0.6, k)), u_c3, smoothstep(0.55, 1.0, k));
  vec3 col = base * (0.5 + 0.75 * diff) * u_brightness + spec * 0.22 * u_strength + u_c3 * rim * 0.12;
  vec3 im = img(uv + n.xy * 0.03);
  col = mix(col, col * (0.4 + 1.2 * im), u_photo);
  col += (h21(gl_FragCoord.xy + fract(uT) * 71.0) - 0.5) * u_grain;
  return col;
}`,
};
