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

## What is not in git, and why
| File | Why | How to get it |
|---|---|---|
| `data/book.json` | Full text of Deborah Datoru's *Rejuvenating*. Not published without her consent. | `cd reader && node tools/build-book.mjs "<book>.pdf"` (needs poppler's `pdftohtml`) |
| `media/night-field.mp4`, `media/night-field.jpg` | Animated from a reference painting whose licence is not known. | Render from `animation/night-field` (needs `source.webp`), then `ffmpeg -i field_silent.mp4 -vf scale=720:1280 -c:v libx264 -crf 25 -an media/night-field.mp4` and take frame 0 as the jpg |

Without them the reader still runs: sample text on a plain navy background, with the sound.

## Files
- `index.html`, `reader.css`, `reader.js`: the reader.
- `data/book.sample.json`: the page model (`kind`, `title`, `stanzas` of `lines` with `gap`).
- `tools/build-book.mjs`: imports a poetry PDF into that model (titles = bold lines, vertical gaps = stanza breaks, wrapped lines re-joined).
- `serve.mjs`: static server with byte-range support (Safari needs it for video).
- `media/night-field.wav`: the 15 s sound loop, synthesized by `animation/night-field/score.mjs`.
