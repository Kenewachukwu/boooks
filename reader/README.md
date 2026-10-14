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

## Stories and templates
Each story is a JSON file (`data/*.json`) listed in `data/stories.json`, and names a **template** in `templates.js`: its fonts, colours, text geometry, background and sound. `reader.css` holds the defaults (the night-field look); a template overrides them with CSS variables.

| URL | Story | Template |
|---|---|---|
| `/` | *Rejuvenating*, Deborah Datoru (verse) | `night-field`: Caveat handwriting, gold on night blue, painted video loop |
| `/?story=heart-break-and-hot-chocolate` | *Heart Break and Hot Chocolate*, the.introverted_she (prose) | `hot-chocolate`: DM Serif Display, Newsreader and Special Elite on grunge newsprint, effect background |

- **Verse** keeps every line and stanza break, and is paginated the same on every device. **Prose** runs sentences into paragraphs, uses one text size, and reflows to the real screen like an ebook (it re-paginates if the screen's shape changes a lot, for example on rotation).
- Import prose with `node tools/build-story.mjs <paragraphs.txt> --title "..." --author "..." --source <url> --out data/<id>.json`. The author's wording and spelling are never changed.
- A new look is one new entry in `templates.js`. A new story is one JSON file and one line in `stories.json`.

## Effects library (`fx/`)
Image effects drawn live by WebGL: give one any image and it draws the result, animated.
- `fx/effects/*.js`: **grunge newspaper** (halftone print, stains, folds, burnt edges that grow as the story is read), **wobbly map** (contour lines that wobble), **radial gradient**, **flowing gradient**. Each file declares its own settings (sliders and colours), so the editor builds its controls from them.
- `fx/fx.js`: `createFx(canvas)`, then `setImage`, `setEffect(id, params)`, `start`, `setProgress`, `snapshot`.
- `fx/seeds.js`: code-drawn stand-in images so every effect works with no files: a cracked heart in a mug, hills, dusk. A real seed is any image: an upload, a file under `media/seeds/`, or a URL whose server allows other pages to use it.
- **`fx-lab.html`** is the minor editor: pick or upload an image, choose an effect, tune it, save a PNG or copy the settings (`{ type: "fx", effect, seed, params }`, exactly what a template's `background` takes).
- Stock photos (Pexels, Pinterest) are not wired in: both need an API key and a small server to call them, and Pinterest images need their licence checked. Until then, save the photo and upload it.

## Files
- `index.html`, `reader.css`, `reader.js`, `templates.js`: the reader.
- `fx-lab.html`, `fx-lab.js`, `fx/`: the effects library and its editor.
- `data/book.sample.json`: the page model (`kind`, `title`, `stanzas` of `lines` with `gap`).
- `tools/build-story.mjs`: imports prose. `tools/build-book.mjs`: imports a poetry PDF into that model (titles = bold lines, vertical gaps = stanza breaks, wrapped lines re-joined).
- `serve.mjs`: static server with byte-range support (Safari needs it for video).
