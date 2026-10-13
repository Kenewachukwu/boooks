# Reader prototype

The book reading experience: a looping painted background, a sound bed, and one handwritten page per screen. Swipe (or scroll) up and down to turn pages; a rolling counter and a progress line show how far you are. No build step.

```bash
node reader/serve.mjs        # http://localhost:5173, and a Wi-Fi address to open on your phone
```

Open `http://localhost:5173/?sample` to read the small sample book. `#12` opens page 12.

## How it behaves
- **Pages turn only when the reader scrolls.** Touch uses native scroll-snap. Wheel, trackpad and arrow keys turn exactly one page per gesture with an eased glide; a light nudge does nothing.
- **Text writes itself** line by line when a page comes into view (a stanza gap is a pause). Tap the page to finish at once.
- **Long poems continue on a second screen** (labelled "Continued") so text never shrinks below a readable size. Pagination is measured against a 9:16 stage, so every device gets the same pages.
- Sound starts from the Begin button or the speaker button (browsers require a tap). `prefers-reduced-motion` pauses the video and skips the handwriting reveal.

## Content that ships with the repo
- `data/book.json`: the full text of Deborah Datoru's *Rejuvenating*, imported with `tools/build-book.mjs`. **Published with the repo and the live site; it is her work, so keep her agreement on record.** To take it down, delete this file: the reader falls back to `data/book.sample.json`. The text stays in git history, so a full removal needs a history rewrite.
- `media/night-field.mp4` and `media/night-field.jpg`: the 15 s background loop (720x1280) and its poster frame, from `animation/night-field`. It is animated from a reference painting whose licence has not been checked. Reference images and the original source image stay out of git (`animation/.gitignore`).
- `media/night-field.wav`: the sound loop, synthesized by `animation/night-field/score.mjs`.

## Files
- `index.html`, `reader.css`, `reader.js`: the reader.
- `data/book.sample.json`: the page model (`kind`, `title`, `stanzas` of `lines` with `gap`).
- `tools/build-book.mjs`: imports a poetry PDF into that model (titles = bold lines, vertical gaps = stanza breaks, wrapped lines re-joined).
- `serve.mjs`: static server with byte-range support (Safari needs it for video).
