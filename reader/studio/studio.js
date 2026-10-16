// The creator studio: write (or upload) a book, pick a look, publish a link. Everything a reader will see is previewed live in a frame
// by the real reader, so what the creator sees is what is published.
import { MODES, modeById, photoCredit, PHOTO_SOURCES } from '../lib/modes.js';
import { GALLERY, templateById, compose, titleLines } from '../lib/compose.js';
import { buildBook, readFile } from '../lib/import.js';
import { EFFECTS, createFx } from '../fx/fx.js';
import { loadSeed } from '../fx/seeds.js';
import { MINE_KEY, readMine } from '../ui/data.js';

const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
const DRAFT = 'booooks.studio.draft', PREVIEW = 'booooks.preview', KEY = 'booooks.studio.key';
const FALLBACKS = ['terrain', 'dusk', 'hot-chocolate'];
const DEMO = 'This is where your story will appear.\n\nEvery line you write is set like a poster, one screen at a time, and written onto the page as your reader swipes.\n\nType or paste your own text on the left, and watch this change.';
const slugify = t => String(t || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '');
const editKey = () => { let k = store.get(KEY); if (!k) { k = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join(''); store.set(KEY, k); } return k; };

const S = { step: 1, title: '', author: '', text: '', layout: 'auto', templateId: 'newsprint', modeId: 'dark-abstract', effect: null, photos: [], photoIndex: -1, fbIndex: 0,
  customImage: null, animate: true, sound: false, slug: '', slugTouched: false, published: null, photosOn: null, provider: 'pixabay', genre: 'fiction', listed: true };
try { Object.assign(S, JSON.parse(store.get(DRAFT) || '{}'), { photos: [], photoIndex: -1, customImage: null, step: 1, published: null, photosOn: null }); } catch { /* a fresh start */ }

// ---------- what the creator has chosen, as a story bundle (the same shape the server stores)
const derived = () => buildBook({ title: S.title, author: S.author, text: S.text.trim() ? S.text : DEMO, layout: S.layout === 'auto' ? undefined : S.layout });
const currentPhoto = () => (S.customImage ? null : S.photos[S.photoIndex] || null);
function seedNow() { // your own image, else the chosen photo, else a built-in background for the mood
  if (S.customImage) return S.customImage;
  const ph = currentPhoto(); if (ph) return ph.url;
  return S.fbIndex ? FALLBACKS[S.fbIndex % FALLBACKS.length] : modeById(S.modeId).fallback;
}
function bundle() {
  const { book, stats } = derived(), ph = currentPhoto(), mode = modeById(S.modeId), title = S.title || 'Your title';
  return { stats, b: { v: 1, book: { ...book, title, titleLines: titleLines(title), author: S.author || 'Your name', byline: 'by ' + (S.author || 'Your name') },
    style: { templateId: S.templateId, modeId: S.modeId, effect: S.effect || mode.effect, params: {}, layout: book.layout, seed: seedNow(), animate: S.animate, sound: S.sound ? 'media/night-field.wav' : null },
    meta: { photo: ph ? { id: ph.id, provider: ph.provider || S.provider, photographer: ph.photographer, pageUrl: ph.pageUrl || ph.pexelsUrl, url: ph.url } : null } } };
}

// ---------- saving and the live preview
let saveT = 0, previewT = 0;
const saved = $('saved');
function saveDraft() {
  clearTimeout(saveT); saved.textContent = 'Saving…';
  saveT = setTimeout(() => { const { title, author, text, layout, templateId, modeId, effect, animate, sound, slug, slugTouched, fbIndex, genre, listed } = S; store.set(DRAFT, JSON.stringify({ title, author, text, layout, templateId, modeId, effect, animate, sound, slug, slugTouched, fbIndex, genre, listed })); saved.textContent = 'Draft saved'; }, 400);
}
// The preview is the real reader in a frame. A change loads the new version in a second frame behind the first and swaps them when the
// reader reports it is ready, on the page the creator was looking at. Nothing is previewed while the chosen photo is still being found,
// so a stand-in image never flashes up first.
let frameSeq = 0, shownSeq = 0;
function preview(delay = 350) { clearTimeout(previewT); previewT = setTimeout(renderPreview, delay); }
function renderPreview() {
  if (S.loadingPhoto) return;
  const seq = ++frameSeq, frames = $('frames'), phone = $('phone');
  store.set(PREVIEW, JSON.stringify(bundle().b));
  const shown = frames.querySelector('iframe.on'); let page = 0; try { page = shown?.contentWindow?.reader?.cur || 0; } catch { /* still loading */ }
  const next = document.createElement('iframe'); next.title = 'Live preview of your story'; next._seq = seq;
  next.src = `/read?preview=1&t=${Date.now()}${page ? '#' + page : ''}`;
  phone.classList.add('busy'); frames.append(next);
  let done = false;
  const reveal = () => {
    if (done) return; done = true; removeEventListener('message', onMsg);
    if (seq < shownSeq) { next.remove(); return; }   // a newer version is already showing
    shownSeq = seq; next.classList.add('on'); phone.classList.remove('empty');
    // once this one has faded in, drop everything older. A newer frame that is still loading is never touched.
    setTimeout(() => { frames.querySelectorAll('iframe').forEach(f => { if (f._seq < seq) f.remove(); }); if (!frames.querySelector('iframe:not(.on)')) phone.classList.remove('busy'); }, 450);
  };
  const onMsg = e => { if (e.source === next.contentWindow && e.data?.type === 'booooks-ready') reveal(); };
  addEventListener('message', onMsg);
  setTimeout(reveal, 8000); // never wait forever
}
const changed = (delay) => { saveDraft(); preview(delay); };

// run a change inside a view transition where the browser has them; always run it, and never let a skipped transition throw
function swap(run, back) {
  if (!document.startViewTransition || reduced) { run(); return; }
  document.documentElement.classList.toggle('back', !!back);
  const cls = document.documentElement.classList; cls.add('vt-step');
  try { const t = document.startViewTransition(run); t.ready.catch(() => {}); t.updateCallbackDone.catch(() => {}); t.finished.catch(() => {}).finally(() => cls.remove('vt-step')); } catch { cls.remove('vt-step'); run(); }
}

// ---------- steps, with page transitions
const stepEls = [1, 2, 3].map(n => $('step' + n));
function paintSteps() {
  stepEls.forEach((el, i) => { el.hidden = S.step !== i + 1 || !!document.body.dataset.live; });
  document.querySelectorAll('#stepNav .pill').forEach(p => { const n = +p.dataset.go; if (n === S.step) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current'); p.classList.toggle('done', n < S.step); });
  if (S.step === 3) paintGlance();
}
function go(n) {
  if (n === S.step && !document.body.dataset.live) return;
  const back = n < S.step; const run = () => { delete document.body.dataset.live; $('live').hidden = true; $('hero').hidden = false; S.step = n; paintSteps(); window.scrollTo({ top: Math.max(0, $('flow').offsetTop - 96), behavior: 'instant' }); };
  swap(run, back);
}
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { const n = +g.dataset.go; if (n > S.step && !validateStep1()) return; go(n); } });

function validateStep1() {
  const note = $('stats');
  if (!S.title.trim()) { note.textContent = 'Give it a title first.'; $('title').focus(); return false; }
  if (S.text.trim().length < 20) { note.textContent = 'Add some text first: type it, paste it, or upload a file.'; $('text').focus(); return false; }
  return true;
}
$('to2').addEventListener('click', () => { if (validateStep1()) go(2); });
$('to3').addEventListener('click', () => go(3));

// ---------- step 1: write
$('title').value = S.title; $('author').value = S.author; $('text').value = S.text;
document.querySelector(`input[name="layout"][value="${S.layout}"]`)?.click();
function paintStats() {
  if (!S.text.trim()) { $('stats').textContent = ''; return; }
  const { stats } = derived();
  $('stats').textContent = `${stats.words.toLocaleString()} words · about ${stats.minutes} min read · set as ${stats.layout === 'prose' ? 'a story' : 'poems'}`;
}
$('title').addEventListener('input', e => { S.title = e.target.value; if (!S.slugTouched) { S.slug = slugify(S.title); } changed(600); });
$('author').addEventListener('input', e => { S.author = e.target.value; changed(600); });
$('text').addEventListener('input', e => { S.text = e.target.value; paintStats(); changed(900); });
document.querySelectorAll('input[name="layout"]').forEach(r => r.addEventListener('change', () => { S.layout = r.value; paintStats(); changed(200); }));

async function useTextFile(file) {
  const note = $('fileNote'); note.textContent = `Reading ${file.name}…`;
  try {
    const { text, kind } = await readFile(file);
    if (!text.trim()) throw new Error('We could not find any text in that file.');
    S.text = text.trim(); $('text').value = S.text;
    if (!S.title.trim()) { S.title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim(); $('title').value = S.title; S.slug = slugify(S.title); }
    paintStats(); note.textContent = `Imported from your ${kind}. Have a read and fix anything that looks off.`; changed(300);
  } catch (e) { note.textContent = e.message; }
}
$('pick').addEventListener('click', () => { const f = $('file'); try { f.showPicker ? f.showPicker() : f.click(); } catch { f.click(); } });
$('file').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) useTextFile(f); });
const drop = $('drop');
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); drop.classList.add('over'); } }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, () => drop.classList.remove('over')));
drop.addEventListener('drop', e => { const f = e.dataTransfer?.files?.[0]; if (f) { e.preventDefault(); useTextFile(f); } });

// ---------- step 2: template, mood, photo, advanced
for (const t of GALLERY) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?' + t.fonts.google; document.head.append(l); }
function radio(container, items, current, render, onPick) {
  container.replaceChildren(...items.map(it => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(it.id === current)); render(b, it); b.addEventListener('click', () => onPick(it.id)); return b; }));
}
function paintGallery() {
  radio($('gallery'), GALLERY, S.templateId, (b, t) => {
    b.className = 'tpl'; const v = t.vars;
    const aa = document.createElement('span'), name = document.createElement('b'), blurb = document.createElement('small');
    aa.className = 'aa'; aa.textContent = t.sample; aa.style.fontFamily = v['--font-title']; aa.style.fontWeight = v['--title-weight']; aa.style.fontStyle = v['--title-style'];
    if (v['--title-transform']) aa.style.textTransform = v['--title-transform'];
    name.textContent = t.name; blurb.textContent = t.blurb; b.append(aa, name, blurb);
  }, id => { S.templateId = id; paintGallery(); changed(150); });
}
function paintModes() {
  radio($('modes'), MODES, S.modeId, (b, m) => { b.className = 'chip'; b.textContent = `${m.emoji} ${m.name}`; }, id => pickMode(id));
}
function paintEffects() {
  const mode = modeById(S.modeId);
  radio($('effects'), [{ id: '', name: 'Match the mood' }, ...EFFECTS], S.effect || '', (b, e) => { b.className = 'chip'; b.textContent = e.name; }, id => { S.effect = id || null; paintEffects(); changed(150); });
  $('effects').title = `This mood uses: ${EFFECTS.find(e => e.id === mode.effect)?.name}`;
}
function paintPhotos() {
  const box = $('photos');
  box.replaceChildren(...S.photos.map((p, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(!S.customImage && i === S.photoIndex)); b.style.backgroundImage = `url("${p.thumb}")`; b.setAttribute('aria-label', `Photo by ${p.photographer}`);
    b.addEventListener('click', () => { S.photoIndex = i; S.customImage = null; paintPhotos(); paintImgNote(); changed(150); }); return b; }));
  const ph = currentPhoto();
  const src = PHOTO_SOURCES[S.provider] || PHOTO_SOURCES.pixabay, cr = $('creditLink'); if (cr) { cr.textContent = src.name; cr.href = src.url; }
  $('photoNote').textContent = S.customImage ? 'Using your own image.' : ph ? photoCredit({ ...ph, provider: ph.provider || S.provider }).text : S.photosOn === false ? 'Photos switch on once a photo key is added. For now you get a built-in background.' : '';
}
let photoToken = 0;
async function loadPhotos() {
  const token = ++photoToken, id = S.modeId; $('photoNote').textContent = 'Finding a photo…';
  S.loadingPhoto = true; if (!$('frames').querySelector('iframe.on')) $('phoneNote').textContent = 'Finding a photo…';
  try {
    const r = await fetch(`/api/photos?mode=${encodeURIComponent(id)}`), j = await r.json();
    if (token !== photoToken) return;
    S.photosOn = !!j.configured; if (j.provider) S.provider = j.provider; S.photos = j.photos || []; S.photoIndex = S.photos.length ? Math.floor(Math.random() * S.photos.length) : -1;
  } catch { if (token !== photoToken) return; S.photosOn = false; S.photos = []; S.photoIndex = -1; }
  S.loadingPhoto = false; $('phoneNote').textContent = 'Your story appears here';
  paintPhotos(); changed(60);
}
function pickMode(id) { S.modeId = id; S.effect = null; S.fbIndex = 0; paintModes(); paintEffects(); loadPhotos(); }
$('shuffle').addEventListener('click', () => {
  S.customImage = null;
  if (S.photos.length > 1) { let i; do { i = Math.floor(Math.random() * S.photos.length); } while (i === S.photoIndex); S.photoIndex = i; }
  else S.fbIndex = (S.fbIndex + 1) % FALLBACKS.length;
  paintPhotos(); paintImgNote(); changed(100);
});

// your own image: downscaled in the browser, sent once when publishing
const imgNote = () => $('imgNote');
function paintImgNote() { imgNote().textContent = S.customImage ? 'Your image is in use.' : ''; $('clearImg').hidden = !S.customImage; }
async function useImage(file) {
  imgNote().textContent = 'Reading your image…';
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file)); const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    S.customImage = c.toDataURL('image/jpeg', 0.86); paintPhotos(); paintImgNote(); changed(100);
  } catch { imgNote().textContent = /hei[cf]/i.test(file.type + file.name) ? 'This browser cannot open HEIC photos. Export a JPEG or PNG and try again.' : 'That file could not be read as an image.'; }
}
$('pickImg').addEventListener('click', () => { const f = $('imgFile'); try { f.showPicker ? f.showPicker() : f.click(); } catch { f.click(); } });
$('imgFile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) useImage(f); });
$('clearImg').addEventListener('click', () => { S.customImage = null; paintPhotos(); paintImgNote(); changed(100); });
$('animate').checked = S.animate; $('sound').checked = S.sound;
$('animate').addEventListener('change', e => { S.animate = e.target.checked; changed(100); });
$('sound').addEventListener('change', e => { S.sound = e.target.checked; changed(100); });

// ---------- step 3: publish
$('linkPrefix').textContent = `${location.host}/s/`;
function paintGlance() {
  const { stats } = derived(), t = templateById(S.templateId), m = modeById(S.modeId);
  const rows = [['📖', `${S.title || 'Untitled'} · by ${S.author || 'you'}`], ['🕑', `${stats.words.toLocaleString()} words, about ${stats.minutes} min read`], ['🎨', `${t.name} template`], ['🖼️', `${m.name} mood${S.customImage ? ', your own image' : ''}`], ['✨', S.animate ? 'Text animates in as it is read' : 'Text appears without animation']];
  $('glance').replaceChildren(...rows.map(([e, s]) => { const li = document.createElement('li'); li.innerHTML = `<span>${e}</span><span></span>`; li.lastChild.textContent = s; return li; }));
  if (!S.slugTouched) S.slug = slugify(S.title); $('slug').value = S.slug;
}
fetch('/data/library.json').then(r => r.json()).then(lib => {
  const box = $('genreChips'); if (!box) return;
  box.replaceChildren(...lib.genres.map(g => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = g.name; b.dataset.id = g.id; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(g.id === S.genre)); b.style.setProperty('--gc', g.color); return b; }));
  box.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; S.genre = b.dataset.id; box.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-checked', String(c === b))); saveDraft(); });
}).catch(() => {});
$('listed').checked = S.listed; $('listed').addEventListener('change', e => { S.listed = e.target.checked; saveDraft(); });
$('slug').addEventListener('input', e => { S.slugTouched = true; S.slug = slugify(e.target.value); e.target.value = S.slug; saveDraft(); });

async function renderCard(b, seedOverride) {
  const W = 1200, H = 630, t = compose(b.style), v = t.vars;
  const host = document.createElement('div'); host.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;height:${H}px`;
  const cv = document.createElement('canvas'); cv.style.cssText = 'display:block;width:100%;height:100%'; host.append(cv); document.body.append(host);
  try {
    const fx = createFx(cv, { maxRows: 3000 });
    let img; try { img = await loadSeed(seedOverride || b.style.seed); } catch { img = await loadSeed(modeById(b.style.modeId).fallback); }
    fx.setImage(img); fx.setEffect(t.background.effect, t.background.params); fx.setProgress(0.3); fx.draw(3);
    const out = document.createElement('canvas'); out.width = W; out.height = H; const x = out.getContext('2d');
    x.drawImage(cv, 0, 0, W, H);
    const dark = modeById(b.style.modeId).tone === 'dark';
    const g = x.createLinearGradient(0, 0, W * 0.85, 0); g.addColorStop(0, dark ? 'rgba(0,0,0,0.6)' : 'rgba(255,250,240,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    await Promise.all(t.fonts.load.map(f => document.fonts.load(f).catch(() => {})));
    const up = v['--title-transform'] === 'uppercase', lines = b.book.titleLines || [b.book.title], font = s => `${v['--title-style']} ${v['--title-weight']} ${s}px ${v['--font-title']}`;
    let size = 124; for (; size > 56; size -= 4) { x.font = font(size); if (Math.max(...lines.map(l => x.measureText(up ? l.toUpperCase() : l).width)) <= 800) break; }
    const lh = size * 0.98, top = (H - lines.length * lh) / 2; let y = top + size * 0.82;
    x.shadowColor = dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,250,240,0.9)'; x.shadowBlur = 18; x.textBaseline = 'alphabetic';
    x.font = `400 24px ${v['--ui'] || v['--font-body']}`; x.fillStyle = v['--ink']; x.fillText(b.book.kicker.toUpperCase().split('').join(' '), 82, top - 18);
    x.font = font(size); x.fillStyle = v['--accent']; for (const l of lines) { x.fillText(up ? l.toUpperCase() : l, 80, y); y += lh; }
    x.font = `500 38px ${v['--font-body']}`; x.fillStyle = v['--ink']; x.fillText(b.book.byline, 82, y + 14);
    let q = 0.86, url = out.toDataURL('image/jpeg', q); while (url.length > 480000 && q > 0.5) { q -= 0.1; url = out.toDataURL('image/jpeg', q); }
    return url;
  } finally { host.remove(); }
}

// the portrait cover shown in the feed and on the front page: the picture with its effect, then the title and name
async function renderCover(b, seedOverride) {
  const W = 480, H = 720, t = compose(b.style), v = t.vars;
  const host = document.createElement('div'); host.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;height:${H}px`;
  const cv = document.createElement('canvas'); cv.style.cssText = 'display:block;width:100%;height:100%'; host.append(cv); document.body.append(host);
  try {
    const fx = createFx(cv, { maxRows: 3000 });
    let img; try { img = await loadSeed(seedOverride || b.style.seed); } catch { img = await loadSeed(modeById(b.style.modeId).fallback); }
    fx.setImage(img); fx.setEffect(t.background.effect, t.background.params); fx.setProgress(0.3); fx.draw(3);
    const out = document.createElement('canvas'); out.width = W; out.height = H; const x = out.getContext('2d'); x.drawImage(cv, 0, 0, W, H);
    const g = x.createLinearGradient(0, H * 0.3, 0, H); g.addColorStop(0, 'rgba(5,5,6,0)'); g.addColorStop(1, 'rgba(5,5,6,0.9)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    await Promise.all(t.fonts.load.map(f => document.fonts.load(f).catch(() => {})));
    const up = v['--title-transform'] === 'uppercase', lines = b.book.titleLines || [b.book.title], font = s => `${v['--title-style']} ${v['--title-weight']} ${s}px ${v['--font-title']}`;
    let size = 76; for (; size > 30; size -= 2) { x.font = font(size); if (Math.max(...lines.map(l => x.measureText(up ? l.toUpperCase() : l).width)) <= W - 70 && lines.length * size * 0.98 < H * 0.42) break; }
    const lh = size * 0.98; let y = H - 78 - (lines.length - 1) * lh; x.textBaseline = 'alphabetic'; x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 14;
    x.font = font(size); x.fillStyle = '#ffffff'; for (const l of lines) { x.fillText(up ? l.toUpperCase() : l, 34, y); y += lh; }
    x.shadowBlur = 0; x.fillStyle = v['--accent']; x.fillRect(34, y - lh + size * 0.28, 44, 4);
    x.font = `500 15px ${v['--ui'] || v['--font-body']}`; x.fillStyle = '#e8e4ec'; x.fillText(b.book.author.toUpperCase().split('').join(String.fromCharCode(8202)), 34, H - 30);
    let q = 0.82, url = out.toDataURL('image/jpeg', q); while (url.length > 240000 && q > 0.45) { q -= 0.1; url = out.toDataURL('image/jpeg', q); }
    return url;
  } finally { host.remove(); }
}

async function publish() {
  const err = $('error'), btn = $('publish'); err.hidden = true;
  if (!validateStep1()) { go(1); return; }
  btn.disabled = true; btn.textContent = 'Publishing…';
  try {
    const { b } = bundle();
    const image = S.customImage; if (image) b.style.seed = 'dusk';
    const [card, cover] = await Promise.all([renderCard(b, image || undefined), renderCover(b, image || undefined).catch(() => undefined)]);
    const r = await fetch('/api/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ bundle: b, key: editKey(), slug: S.slug || undefined, card, cover, genre: S.genre, listed: S.listed, image: image || undefined }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Could not publish. Please try again.');
    S.published = j; if (j.slug) { S.slug = j.slug; S.slugTouched = true; saveDraft(); }
    try { const mine = readMine().filter(m => m.slug !== j.slug); mine.unshift({ slug: j.slug, title: S.title, author: S.author, at: Date.now() }); localStorage.setItem(MINE_KEY, JSON.stringify(mine.slice(0, 12))); } catch { /* private mode */ }
    showLive(j, card, b);
  } catch (e) { err.textContent = e.message; err.hidden = false; }
  finally { btn.disabled = false; btn.textContent = 'Publish ✨'; }
}
$('publish').addEventListener('click', publish);

function showLive(j, card, b) {
  const { stats } = derived(), t = templateById(S.templateId), m = modeById(S.modeId);
  const run = () => {
    document.body.dataset.live = '1'; stepEls.forEach(el => { el.hidden = true; }); $('hero').hidden = true; $('live').hidden = false;
    $('liveBy').textContent = `by ${S.author || 'you'}`; $('liveTitle').textContent = S.title;
    $('liveTags').replaceChildren(...[['t-green', `${stats.layout === 'prose' ? '📖 Story' : '✍️ Poems'}`], ['t-violet', `🎨 ${t.name}`], ['t-black', `${m.emoji} ${m.name}`], ['t-olive', `🕑 ${stats.minutes} min`]].map(([c, s]) => { const e = document.createElement('span'); e.className = 'tag ' + c; e.textContent = s; return e; }));
    $('liveCard').src = card;
    const a = $('liveLink'); a.href = j.url; a.textContent = j.url.replace(/^https?:\/\//, ''); $('open').href = j.url;
    $('share').hidden = !navigator.share; $('feedLink').hidden = !S.listed;
    $('liveNote').textContent = j.updated ? 'Updated. The same link now shows your latest version.' : (S.slug && j.slug !== S.slug ? `That link was taken, so we used /s/${j.slug}.` : 'Your story is live. Anyone with this link can read it.');
    $('liveGlance').replaceChildren(...[['🕑', `About ${stats.minutes} min to read, ${stats.words.toLocaleString()} words`], ['🎨', `${t.name} template, ${m.name.toLowerCase()} mood`], ['✨', S.animate ? 'Animated text (readers can turn it off)' : 'Animation off by default'], ['📱', 'Made for phones: swipe up to read']].map(([e, s]) => { const li = document.createElement('li'); li.innerHTML = `<span>${e}</span><span></span>`; li.lastChild.textContent = s; return li; }));
    const first = derived().book.pages[1].stanzas.slice(0, 2).map(s => s.lines.join(S.layout === 'verse' ? '\n' : ' ')).join('\n\n');
    $('taste').textContent = first.length > 520 ? first.slice(0, 520).replace(/\s+\S*$/, '') + '…' : first; $('taste').style.whiteSpace = 'pre-line';
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  swap(run, false);
}
$('copy').addEventListener('click', async e => { const url = $('liveLink').href; try { await navigator.clipboard.writeText(url); e.target.textContent = 'Copied ✓'; } catch { e.target.textContent = 'Press Cmd/Ctrl+C'; const r = document.createRange(); r.selectNodeContents($('liveLink')); getSelection().removeAllRanges(); getSelection().addRange(r); } setTimeout(() => { e.target.textContent = 'Copy link'; }, 1800); });
$('share').addEventListener('click', () => navigator.share({ title: S.title, text: `${S.title} by ${S.author}`, url: $('liveLink').href }).catch(() => {}));
$('edit').addEventListener('click', () => go(1));
$('another').addEventListener('click', () => { if (!confirm('Start a new book? Your published link stays live.')) return; Object.assign(S, { title: '', author: '', text: '', slug: '', slugTouched: false, published: null, customImage: null }); store.set(DRAFT, '{}'); $('title').value = ''; $('author').value = ''; $('text').value = ''; paintStats(); go(1); preview(100); });

// ---------- mobile preview sheet
const pb = $('previewBtn');
pb.addEventListener('click', () => { const on = !document.body.classList.contains('show-preview'); document.body.classList.toggle('show-preview', on); pb.setAttribute('aria-pressed', String(on)); pb.textContent = on ? 'Close' : 'Preview'; });
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('show-preview')) pb.click(); });

// ---------- start
paintGallery(); paintModes(); paintEffects(); paintSteps(); paintStats(); paintImgNote();
loadPhotos(); // the first preview is drawn as soon as the photo is chosen
