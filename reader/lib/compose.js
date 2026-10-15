// Turns a creator's choices into a full reader template. A published story stores only the choices (template, mode, photo, options),
// never raw CSS, so every story is rendered from templates we control and later improvements to a template reach old stories.
import { modeById } from './modes.js';

// The template gallery: typography and layout character. Colours come from the mode's tone, so text always contrasts with the background.
export const GALLERY = [
  { id: 'poster', name: 'Poster', blurb: 'Big, bold, condensed headlines.', sample: 'Aa', layout: 'prose',
    fonts: { google: 'family=Archivo:wdth,wght@62..100,700..900&family=Archivo+Narrow:wght@400;500&display=swap', load: ['800 40px "Archivo"', '400 40px "Archivo Narrow"', '500 40px "Archivo Narrow"'] },
    vars: { '--font-title': '"Archivo", "Helvetica Neue", Arial, sans-serif', '--font-body': '"Archivo Narrow", "Helvetica Neue", Arial, sans-serif', '--ui': '"Archivo Narrow", "Helvetica Neue", Arial, sans-serif',
      '--body-weight': '500', '--body-lh': '1.34', '--hang': '0em', '--gap-em': '0.55', '--justify': 'flex-start', '--title-weight': '900', '--title-style': 'normal',
      '--title-transform': 'uppercase', '--title-stretch': '68%', '--title-scale': '1.5', '--cover-size': '15.5cqw', '--cover-lh': '0.9', '--by-size': '7cqw', '--end-size': '17cqw' } },
  { id: 'newsprint', name: 'Newsprint', blurb: 'A serif for stories, with typewriter details.', sample: 'Aa', layout: 'prose',
    fonts: { google: 'family=DM+Serif+Display:ital@0;1&family=Newsreader:ital,wght@0,400;0,500;1,400&family=Special+Elite&display=swap', load: ['italic 400 40px "DM Serif Display"', '400 40px "Newsreader"', '500 40px "Newsreader"', '400 40px "Special Elite"'] },
    vars: { '--font-title': '"DM Serif Display", Georgia, serif', '--font-body': '"Newsreader", Georgia, "Times New Roman", serif', '--ui': '"Special Elite", "Courier New", monospace',
      '--body-weight': '450', '--body-lh': '1.42', '--hang': '0em', '--gap-em': '0.5', '--justify': 'flex-start', '--title-weight': '400', '--title-style': 'italic',
      '--cover-size': '13.2cqw', '--cover-lh': '0.98', '--by-size': '6.4cqw', '--end-size': '15cqw' } },
  { id: 'handwritten', name: 'Handwritten', blurb: 'Pen on paper, line by line. Made for poems.', sample: 'Aa', layout: 'verse',
    fonts: { google: 'family=Caveat:wght@500;700&display=swap', load: ['500 40px "Caveat"', '700 40px "Caveat"'] },
    vars: { '--font-title': '"Caveat", cursive', '--font-body': '"Caveat", cursive', '--body-weight': '500', '--body-lh': '1.14', '--hang': '0.9em', '--gap-em': '0.62',
      '--justify': 'center', '--title-weight': '700', '--title-style': 'normal', '--cover-size': '16.5cqw', '--cover-lh': '0.92', '--by-size': '9.2cqw', '--end-size': '17cqw' } },
  { id: 'quiet-serif', name: 'Quiet serif', blurb: 'Calm, elegant, a little old-fashioned.', sample: 'Aa', layout: 'prose',
    fonts: { google: 'family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap', load: ['italic 600 40px "Fraunces"', '600 40px "Fraunces"', '400 40px "Lora"', '500 40px "Lora"'] },
    vars: { '--font-title': '"Fraunces", Georgia, serif', '--font-body': '"Lora", Georgia, serif', '--body-weight': '400', '--body-lh': '1.5', '--hang': '0em', '--gap-em': '0.55', '--justify': 'flex-start',
      '--title-weight': '600', '--title-style': 'italic', '--cover-size': '13cqw', '--cover-lh': '1', '--by-size': '6.2cqw', '--end-size': '15cqw' } },
];
export const templateById = id => GALLERY.find(t => t.id === id) || GALLERY[1];

const PALETTE = {
  dark: (a) => ({ '--ink': '#f6f1e7', '--accent': a, '--text-shadow': '0 1px 18px rgba(0, 0, 0, 0.55)', '--btn-bg': a, '--btn-fg': '#111111', '--btn2-bg': '#f6f1e7', '--btn2-fg': '#111111',
    '--chip-bg': 'rgba(12, 12, 24, 0.55)', '--count-bg': 'rgba(12, 12, 24, 0.0)', '--bar-bg': 'rgba(255, 255, 255, 0.18)', '--bar-fill': a,
    '--scrim': 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0) 24%, rgba(0,0,0,0) 68%, rgba(0,0,0,0.45)), rgba(0,0,0,0.26)', '--stage-bg': '#0b0b14' }),
  light: (a) => ({ '--ink': '#241a14', '--accent': a, '--text-shadow': '0 0 12px rgba(255, 250, 240, 0.9)', '--btn-bg': a, '--btn-fg': '#fffaf0', '--btn2-bg': '#241a14', '--btn2-fg': '#fffaf0',
    '--chip-bg': 'rgba(255, 250, 240, 0.8)', '--count-bg': 'rgba(255, 250, 240, 0.8)', '--bar-bg': 'rgba(36, 26, 20, 0.15)', '--bar-fill': a,
    '--scrim': 'radial-gradient(120% 70% at 50% 45%, rgba(255,250,240,0.55), rgba(255,250,240,0) 70%), rgba(255,250,240,0.12)', '--stage-bg': '#e9dfc9' }),
};

// style = { templateId, modeId, effect?, params?, seed, photo?, animate?, sound? }  ->  a reader template
export function compose(style = {}) {
  const t = templateById(style.templateId), m = modeById(style.modeId);
  const layout = style.layout || t.layout;
  return {
    layout,
    fonts: t.fonts,
    vars: { ...t.vars, ...PALETTE[m.tone](m.accent) },
    sheet: { top: 0.13, bottom: 0.1 },
    font: layout === 'prose' ? { min: 0.054, max: 0.054 } : { min: 0.05, max: 0.1 },
    background: { type: 'fx', effect: style.effect || m.effect, seed: style.seed || m.fallback, fallbackSeed: m.fallback, params: { ...(style.effect && style.effect !== m.effect ? {} : m.params), ...(style.params || {}) }, progress: true },
    sound: style.sound || null,
    animate: style.animate !== false,
    kicker: layout === 'prose' ? 'A short story' : 'A book of poems',
  };
}

// Long titles are set in short lines so they never run off the cover.
export function titleLines(title, max = 13) {
  const words = String(title).trim().split(/\s+/), lines = [];
  for (const w of words) { const last = lines.at(-1); if (last && (last + ' ' + w).length <= max) lines[lines.length - 1] = last + ' ' + w; else lines.push(w); }
  return lines;
}
