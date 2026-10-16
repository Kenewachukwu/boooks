# Reader prototype

The book reading experience: a looping painted background, a sound bed, and one handwritten page per screen. Swipe (or scroll) up and down to turn pages; a rolling counter and a progress line show how far you are. No build step.

```bash
node reader/serve.mjs        # http://localhost:5173, and a Wi-Fi address to open on your phone
```

`/` is the front page (a spiral of covers, the feed, genre reels, writers, and a page-turning book that explains making your own). The reader itself is at `/read`: `/read?sample` opens the small sample book, and `#12` opens page 12. Every story, sample or published, also has its own link, `/s/<slug>`. Old links such as `/?story=rejuvenating` are forwarded to `/read?story=rejuvenating`.

## How it behaves
- **Pages turn only when the reader scrolls.** Touch uses native scroll-snap. Wheel, trackpad and arrow keys turn exactly one page per gesture with an eased glide; a light nudge does nothing.
- **Text writes itself** line by line when a page comes into view (a stanza gap is a pause). Tap the page to finish at once.
- **Long poems continue on a second screen** (labelled "Continued") so text never shrinks below a readable size. Pagination is measured against a 9:16 stage, so every device gets the same pages.
- Sound starts from the Begin button or the speaker button (browsers require a tap). `prefers-reduced-motion` pauses the video and skips the handwriting reveal.

## Content that ships with the repo
- `data/book.json`: the full text of Deborah Datoru's *Rejuvenating*, imported with `tools/build-book.mjs`. **Published with the repo and the live site; it is her work, so keep her agreement on record.** To take it down, delete this file: the reader falls back to `data/book.sample.json`. The text stays in git history, so a full removal needs a history rewrite.
- `media/night-field.mp4` and `media/night-field.jpg`: the 15 s background loop (720x1280) and its poster frame, from `animation/night-field`. It is animated from a reference painting whose licence has not been checked. Reference images and the original source image stay out of git (`animation/.gitignore`).
- `media/night-field.wav`: the sound loop, synthesized by `animation/night-field/score.mjs`.

## Creator studio (`/studio/`)
A three-step flow for a creator: **write** (type, paste, or upload a PDF, Word, text or markdown file), **pick a look** (a template, a background mood, optional advanced choices), **publish** (a link). A live preview runs the real reader in a frame, so what you see is what is published.

- **Import** (`lib/import.js`): detects poems or story, rebuilds paragraphs from a PDF's layout, never changes the author's words.
- **Moods** (`lib/modes.js`): each mood searches Pixabay (or Pexels) for matching photos and puts an effect on one. Advanced: use your own image, change the effect, switch the text animation and the ambient sound.
- **Publishing**: `POST /api/publish` stores the story and a 1200x630 share card, and returns `/s/<slug>`. The same browser can update its own story (an edit key kept in localStorage; only a hash is stored). Link previews in chat apps show the title and card.
- **Text animation** can be off by default (creator) and is switchable by each reader from the sparkle button; the reader's choice is remembered.
- The look is liquid-glass accents on flat Aardvark-style colour blocks, in MD Nichrome (see `fonts/README.md`).

### Checking that nothing spills
`node reader/tools/overflow-audit.cjs out.json` loads the reader with awkward stories (long titles and names, unbreakable links, long verse lines, 40 paragraphs) in every template at four screen sizes and reports any text that leaves its page. It should say `runs with problems: 0`; run it after any change to text, templates or layout.

### Running it locally
`node reader/serve.mjs` serves the site and the same API. Published stories are saved under `.data/` (not committed). For a sample photo without a key, put `PEXELS_MOCK=1` in `.env.local` at the repo root; for real photos put `PIXABAY_API_KEY=...` (or `PEXELS_API_KEY=...`) there. The studio asks `/api/photos`, which uses Pixabay when its key is set, else Pexels.

### Switching it on at Vercel
1. **Photos**: Project Settings, Environment Variables, add `PIXABAY_API_KEY` (a free key from pixabay.com/api/docs) or `PEXELS_API_KEY`. Pixabay does not allow permanent hot-linking, so when a story is published the server saves its own copy of the chosen photo to the Blob store; the credit line ("Photo by … on Pixabay") stays on the last page.
2. **Publishing**: Project, Storage, Create a **Blob** store and connect it to this project (this adds `BLOB_READ_WRITE_TOKEN`). Without it, `/api/publish` answers that publishing is not set up yet.
3. Redeploy. Published stories live at `/s/<slug>`; the rewrite is in `vercel.json`.
- No sign-in yet: anyone can publish. Add accounts and rate limits (Turnstile) before opening it widely.

## Stories and templates
Each story is a JSON file (`data/*.json`) listed in `data/stories.json`, and names a **template** in `templates.js`: its fonts, colours, text geometry, background and sound. `reader.css` holds the defaults (the night-field look); a template overrides them with CSS variables.

| URL | Story | Template |
|---|---|---|
| `/s/rejuvenating` (or `/read`) | *Rejuvenating*, Deborah Datoru (verse) | `night-field`: Caveat handwriting, gold on night blue, painted video loop |
| `/s/heart-break-and-hot-chocolate` (or `/read?story=heart-break-and-hot-chocolate`) | *Heart Break and Hot Chocolate*, the.introverted_she (prose) | `hot-chocolate`: DM Serif Display, Newsreader and Special Elite on grunge newsprint, effect background |

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
- `read.html`, `reader.css`, `reader.js`, `templates.js`: the reader. `index.html` is the front page and `profile.html` a writer's page (`/@handle`).
- `ui/`: the dark front-page system. `tokens.css` (palette, type, buttons), `motion.css`/`motion.js` (reveals, the cover that flies into the reader), `landing.*`, `profile.*`, `cards.*`, `data.js` (loads the library and `/api/stories`), and `ui/fx/` with the canvas effects: `helix.js` (the hero spiral), `reels.js` (genre rows), `wander.js` (the field of covers), `deck.js` (the swipe deck), `small.js` (rising ink, card tilt, scroll stack, the turning book). They are written from the documented behaviour of React Bits Pro components; no code is copied.
- `data/library.json`, `data/seed/*.json`, `media/covers`, `media/photos`: the sample library (12 made-up writers, 24 short stories, the two real stories). Rebuild with `node tools/fetch-art.mjs && node tools/build-library.mjs && node tools/build-covers.mjs`. Cover art is public-domain paintings from Wikimedia Commons, listed in `tools/cover-art.json`.
- `tools/page-audit.cjs`: layout audit for the front page, profiles and studio (expect 0 problems). `tools/overflow-audit.cjs` is the same for the reader.
- `fx-lab.html`, `fx-lab.js`, `fx/`: the effects library and its editor.
- `data/book.sample.json`: the page model (`kind`, `title`, `stanzas` of `lines` with `gap`).
- `tools/build-story.mjs`: imports prose. `tools/build-book.mjs`: imports a poetry PDF into that model (titles = bold lines, vertical gaps = stanza breaks, wrapped lines re-joined).
- `serve.mjs`: static server with byte-range support (Safari needs it for video).
