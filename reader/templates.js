// A template is a story's look: fonts, colours, text geometry, background and sound. data/stories.json says which template a story uses,
// so a new look is one new entry here (and, for an effect background, one image seed). reader.css holds the defaults; `vars` overrides them.

export const TEMPLATES = {
  // Rejuvenating: handwritten verse in chalk cream and gold, over the painted night field.
  'night-field': {
    layout: 'verse',
    fonts: { google: 'family=Caveat:wght@500;700', load: ['500 40px "Caveat"', '700 40px "Caveat"'] },
    vars: {},
    sheet: { top: 0.13, bottom: 0.26 },   // the writing area, as fractions of the screen; the bottom quarter is left to the field
    font: { min: 0.052, max: 0.118 },     // text size as a fraction of the screen width (fitted per page between these)
    background: { type: 'video', src: 'media/night-field.mp4', poster: 'media/night-field.jpg' },
    sound: 'media/night-field.wav',
    kicker: 'A book of poems',
  },

  // Heart Break and Hot Chocolate: prose in a serif on grunge newsprint, with typewriter details. The background is an image seed
  // run through the grunge-newspaper effect, and the paper burns a little more as the story is read.
  'hot-chocolate': {
    layout: 'prose',
    fonts: {
      google: 'family=DM+Serif+Display:ital@0;1&family=Newsreader:ital,wght@0,400;0,500;1,400&family=Special+Elite',
      load: ['400 40px "DM Serif Display"', 'italic 400 40px "DM Serif Display"', '400 40px "Newsreader"', '500 40px "Newsreader"', '400 40px "Special Elite"'],
    },
    vars: {
      '--ink': '#2b1812', '--accent': '#b3123f',
      '--font-body': '"Newsreader", Georgia, "Times New Roman", serif',
      '--font-title': '"DM Serif Display", Georgia, serif',
      '--ui': '"Special Elite", "Courier New", monospace',
      '--body-weight': '450', '--body-lh': '1.42', '--hang': '0em', '--gap-em': '0.5', '--justify': 'flex-start',
      '--title-weight': '400', '--title-style': 'italic', '--cover-size': '13.2cqw', '--cover-lh': '0.98', '--by-size': '6.4cqw', '--end-size': '15cqw',
      '--btn-bg': '#b3123f', '--btn-fg': '#fff6ea', '--btn2-bg': '#2b1812',
      '--chip-bg': 'rgba(255, 246, 234, 0.78)', '--count-bg': 'rgba(255, 246, 234, 0.78)', '--bar-bg': 'rgba(43, 24, 18, 0.15)', '--bar-fill': '#b3123f',
      '--text-shadow': '0 0 10px rgba(236, 224, 198, 0.9)',
      '--scrim': 'radial-gradient(120% 70% at 50% 45%, rgba(236, 224, 198, 0.55), rgba(236, 224, 198, 0) 70%)',
      '--stage-bg': '#d9c9a8',
    },
    sheet: { top: 0.13, bottom: 0.1 },
    font: { min: 0.054, max: 0.054 },     // prose keeps one size on every page
    background: {
      type: 'fx', effect: 'grunge-newspaper', seed: 'hot-chocolate', progress: true,
      params: { dot: 7, lift: 0.5, contrast: 0.95, grunge: 0.6, burn: 0.6, spotAmt: 0.4 },
    },
    sound: 'media/night-field.wav',
    kicker: 'A short story',
  },
};

export const googleFontsUrl = t => 'https://fonts.googleapis.com/css2?' + t.fonts.google + '&display=swap';
