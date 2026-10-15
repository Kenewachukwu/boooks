---
name: story-backgrounds
description: How to make, choose and tune the backgrounds and images behind booooks stories (Pexels photos, WebGL effects, shader gradients) and the glass-style UI around them. Use when adding or changing a background mode, an effect, a template look, or the studio/reader surfaces, or when a story's text is hard to read over its background.
---

# Story backgrounds and images

A story's look is **template** (type and layout) + **mood** (background) + optional overrides. Everything is drawn live by WebGL from an image, so any photo can become any effect.

## The pipeline
1. A **mode** (`reader/lib/modes.js`) names a mood, a Pexels search query, a tone (`dark` or `light`), an accent colour, a default effect and its settings, and a built-in fallback seed.
2. The studio asks `/api/pexels?mode=<id>`. The server holds the key and only ever searches a mode's own query. No key means `configured: false` and the studio falls back to the built-in seed.
3. The photo (a `seed`) goes through an **effect** (`reader/fx/effects/*.js`) on a canvas behind the text. `compose()` (`reader/lib/compose.js`) turns the choices into colours that contrast with the tone.
4. A published story stores only the choices, never CSS. The server rebuilds nothing; the reader composes the template from our own definitions.

## Writing an effect
- One file in `fx/effects/`, registered in `fx/fx.js`. It exports `{ id, name, params, frag }`.
- `params`: `{ id, label, min, max, step, value }` for sliders, `{ id, label, type: 'color', value: '#rrggbb' }` for colours. Each becomes `u_<id>` (float or vec3).
- `frag` implements `vec3 effect(vec2 uv)` (uv is 0..1, y down). Available: `img(uv)` (the photo, cover-fitted), `fbm`, `vn`, `h21`, `lum`, `sat`, `uT` (seconds), `uProg` (reading progress 0..1), `uRes`.
- Budget: steady 60 fps on a mid phone. Keep to a few `fbm` calls and 9 or fewer image taps. The runner lowers resolution on slow devices.
- Test in `fx-lab.html` with an upload, a code-drawn seed and a Pexels URL before shipping.

## Shader-gradient style (after ruucm/shadergradient, MIT; written from scratch, no React or Three.js)
Three colours, a moving height field, lit like a glossy sheet. The knobs that matter: speed, density (zoom), frequency, amplitude, strength (shine), a waves-to-ripples blend, brightness, grain. Use it for photo-free moods (neon night); blend a photo in with `photo` for texture.

## Legibility (the rule that decides everything)
- Dark tone means light text; light tone means dark text. Never mix. The tone comes from the mode, not the photo.
- Effects that are busy (halftone, contours) need their "lighten" or "photo" setting raised so text sits on a quiet surface. Check a page of real prose, not the cover.
- The scrim in `compose.js` is the last line of defence; do not remove it to make a photo look better.

## Nothing flashes, nothing spills (found the hard way)
- **No flash on load.** The page paints a neutral colour until the template is known, the background starts loading immediately (in parallel with the text, not after it), and the whole stage fades in only when the first frame is drawn. Never ship a default look that belongs to one template (a blue gradient once flashed on every other story). A missing photo falls back to the calm `plain` seed, never to a coloured one.
- **The preview never shows a stand-in.** The studio waits until the chosen photo is known, loads each new version in a second frame, and swaps when the reader reports `booooks-ready`, on the same page. Overlapping loads must never remove a newer frame.
- **Text never leaves the page.** Cover and end text shrink to the width and height; a word is an unbreakable unit and a word over 18 characters is cut into breakable fragments; wide uppercase headlines are condensed. After any change to text, templates or layout, run `node reader/tools/overflow-audit.cjs out.json` and expect 0 problems.

## Liquid-glass surfaces (the studio and its floating bits)
Blur and saturate what is behind (`backdrop-filter: blur(18px) saturate(1.8)`), a translucent white gradient, a 1px bright border, an inner top highlight. Use it sparingly: the top bar, the phone frame, the link row. Flat colour blocks carry the rest of the UI. Keep a solid fallback where `backdrop-filter` is missing. References: the liquid-glass topic on GitHub (iyinchao/liquid-glass-studio for WebGL refraction, PallavAg/liquid-glass-web-react for SVG displacement).

## Pexels rules
- The API key lives only on the server (`PEXELS_API_KEY`). Never ship it to the browser.
- Credit the photographer and link to Pexels wherever a photo is shown (the reader's last page does this from `meta.photo`).
- Pexels image files allow cross-origin use, so they work as WebGL textures. A photo that fails to load falls back to a built-in seed; never leave the page bare.

## Checklist for a new mode or effect
1. Looks right on a short story and a long one (progress effects like burnt edges grow with reading).
2. Dark and light palettes both stay readable on a real page of text.
3. Works with no Pexels key (fallback seed) and with a custom upload.
4. The studio preview, the published page and the 1200x630 share card all look right.
