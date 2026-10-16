// Background "modes": how a creator picks a look without thinking about images or shaders. A mode names the kind of photo to pull from
// the photo library (Pixabay, or Pexels), which effect to put on it, and whether the page is dark or light (so the text colours always contrast).
// Shared by the studio, the reader and the server (the server only ever searches the photo library for a mode's own query).

export const MODES = [
  { id: 'dark-abstract', name: 'Dark abstract', emoji: '🌑', query: 'dark abstract background', tone: 'dark', accent: '#ff5fa2', effect: 'flowing-gradient',
    params: { photo: 0.5, speed: 0.7, c1: '#0b0618', c2: '#5b1fa8', c3: '#e0245e', c4: '#ffb27a' }, fallback: 'plain' },
  { id: 'soft-pastel', name: 'Soft pastel', emoji: '🍑', query: 'pastel gradient abstract', tone: 'light', accent: '#c2255c', effect: 'radial-gradient',
    params: { c1: '#fff1d6', c2: '#ffb3c7', c3: '#c9b8ff', photo: 0.35, radius: 0.95, warp: 0.2 }, fallback: 'plain' },
  { id: 'warm-paper', name: 'Warm paper', emoji: '📰', query: 'old paper texture vintage', tone: 'light', accent: '#b3123f', effect: 'grunge-newspaper',
    params: { dot: 7, lift: 0.5, contrast: 0.95, grunge: 0.6, burn: 0.55, spotAmt: 0.4 }, fallback: 'plain' },
  { id: 'ocean-calm', name: 'Ocean calm', emoji: '🌊', query: 'calm ocean blue water', tone: 'dark', accent: '#7fe7ff', effect: 'soft-photo',
    params: { tint: '#06283d', tintAmt: 0.3, soften: 0.55 }, fallback: 'plain' },
  { id: 'neon-night', name: 'Neon night', emoji: '🌃', query: 'neon lights night city', tone: 'dark', accent: '#39f0ff', effect: 'shader-gradient',
    params: { c1: '#12062e', c2: '#ff2bd6', c3: '#00e5ff', photo: 0.35, strength: 1.6 }, fallback: 'plain' },
  { id: 'forest-mist', name: 'Forest mist', emoji: '🌲', query: 'misty forest', tone: 'dark', accent: '#b6ff8a', effect: 'soft-photo',
    params: { tint: '#0e2a1a', tintAmt: 0.3, soften: 0.6 }, fallback: 'plain' },
  { id: 'golden-hour', name: 'Golden hour', emoji: '🌅', query: 'golden hour sunset sky', tone: 'dark', accent: '#ffd24a', effect: 'radial-gradient',
    params: { c1: '#ffd36b', c2: '#e2551f', c3: '#2a0f2e', photo: 0.5, radius: 0.9 }, fallback: 'plain' },
  { id: 'mono-grain', name: 'Mono grain', emoji: '🎞️', query: 'black and white texture', tone: 'light', accent: '#1d1d1d', effect: 'wobbly-map',
    params: { sea: '#dcdcd6', land: '#efefe9', peak: '#bdbdb5', inkc: '#4a4a46', photo: 0.3, levels: 12, line: 0.1 }, fallback: 'terrain' },
];

export const modeById = id => MODES.find(m => m.id === id) || MODES[0];

// Pixabay and Pexels both appreciate a credit with a link back; the reader shows it on the last page, the studio next to the picker.
export const PHOTO_SOURCES = { pixabay: { name: 'Pixabay', url: 'https://pixabay.com' }, pexels: { name: 'Pexels', url: 'https://www.pexels.com' } };
export const photoCredit = photo => { if (!photo) return null; const src = PHOTO_SOURCES[photo.provider] || PHOTO_SOURCES.pexels; return { text: `Photo by ${photo.photographer} on ${src.name}`, url: photo.pageUrl || photo.pexelsUrl || src.url }; };
export const pexelsCredit = photoCredit; // older name
