// The creator platform's server logic as plain functions: each takes { method, url, body, headers, env } and returns
// { status, json | html, headers }. api/*.js wrap them for Vercel and reader/serve.mjs wraps the same ones for local development.
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { MODES, modeById } from '../../reader/lib/modes.js';
import { GALLERY } from '../../reader/lib/compose.js';
import { EFFECTS } from '../../reader/fx/fx.js';
import { SEEDS } from '../../reader/fx/seeds.js';
import { getStore } from './store.js';

// the seeded sample library: books, profiles and genres (also what the front page shows before anyone has published)
export const readLibrary = async () => JSON.parse(await readFile(new URL('../../reader/data/library.json', import.meta.url), 'utf8'));

const RESERVED = new Set(['profile', 'explore', 'genres', 'u', 'me', 'studio', 'api', 'read', 's', 'fx', 'fx-lab', 'lib', 'media', 'data', 'index', 'new', 'admin', 'login', 'about', 'tools']);
const MAX_TEXT_CHARS = 400_000;
const SOUNDS = new Set(['media/night-field.wav']);

export const slugify = t => String(t || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sha = s => createHash('sha256').update(String(s)).digest('hex');
const isHex = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
const originOf = h => `${/localhost|127\.0\.0\.1|192\.168\./.test(h.host || '') ? 'http' : (h['x-forwarded-proto'] || 'https')}://${h.host}`;

// ---- validation: rebuild the bundle from known fields only, so nothing unexpected is ever stored or served
const str = (v, max, name) => { if (typeof v !== 'string' || !v.trim()) throw new Error(`${name} is missing.`); if (v.length > max) throw new Error(`${name} is too long.`); return v; };
const PIXABAY_IMG = /^https:\/\/(pixabay\.com\/get\/[\w.-]+|cdn\.pixabay\.com\/photo\/[\w./-]+)$/;
const PHOTO_PAGE = /^https:\/\/(pixabay\.com|www\.pexels\.com)\//;
const okSeed = s => typeof s === 'string' && (SEEDS.some(x => x.id === s) || /^https:\/\/images\.pexels\.com\//.test(s) || PIXABAY_IMG.test(s) || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(s) || /^\/api\/asset\?path=[\w./-]+$/.test(s));

export function cleanBundle(b) {
  if (!b || b.v !== 1) throw new Error('This story is in a format we do not recognise.');
  const book = b.book || {}, pages = Array.isArray(book.pages) ? book.pages : [];
  const body = pages.find(p => p.kind === 'poem'); if (!body || !Array.isArray(body.stanzas) || !body.stanzas.length) throw new Error('There is no text to publish yet.');
  let chars = 0;
  const stanzas = body.stanzas.slice(0, 5000).map(s => {
    const lines = (Array.isArray(s.lines) ? s.lines : []).map(l => String(l).slice(0, 4000)).filter(l => l.trim());
    chars += lines.reduce((n, l) => n + l.length, 0);
    return { gap: Math.min(3, Math.max(0.4, Number(s.gap) || 1)), lines };
  }).filter(s => s.lines.length);
  if (!stanzas.length) throw new Error('There is no text to publish yet.');
  if (chars > MAX_TEXT_CHARS) throw new Error('This is longer than we can publish for now (about 70,000 words).');
  const layout = book.layout === 'verse' ? 'verse' : 'prose';
  const st = b.style || {};
  if (!GALLERY.some(t => t.id === st.templateId)) throw new Error('Unknown template.');
  if (!MODES.some(m => m.id === st.modeId)) throw new Error('Unknown background mode.');
  const mode = modeById(st.modeId), effect = EFFECTS.some(e => e.id === st.effect) ? st.effect : mode.effect;
  if (!okSeed(st.seed)) throw new Error('That background image cannot be used.');
  const params = {}; for (const [k, v] of Object.entries(st.params || {}).slice(0, 30)) if (/^[a-zA-Z0-9]{1,20}$/.test(k) && (isHex(v) || (typeof v === 'number' && isFinite(v)))) params[k] = v;
  const ph = b.meta?.photo;
  const page = ph && (ph.pageUrl || ph.pexelsUrl || '');
  const photo = ph && PHOTO_PAGE.test(page) ? { id: Number(ph.id) || 0, provider: /pixabay\.com/.test(page) ? 'pixabay' : 'pexels', photographer: String(ph.photographer || '').slice(0, 80), pageUrl: page, url: /pixabay\.com/.test(page) ? '' : String(ph.url || '').slice(0, 300) } : null; // no Pixabay link is kept: the story holds its own copy of the picture
  return {
    v: 1,
    book: {
      title: str(book.title, 140, 'The title'), titleLines: (Array.isArray(book.titleLines) ? book.titleLines : [book.title]).slice(0, 6).map(l => String(l).slice(0, 40)),
      author: str(book.author || 'Anonymous', 80, 'The author name'), byline: 'by ' + String(book.author || 'Anonymous').slice(0, 80),
      kicker: layout === 'prose' ? 'A short story' : 'A book of poems', layout,
      pages: [{ n: 1, kind: 'cover' }, { n: 2, kind: 'poem', title: null, stanzas }],
    },
    style: { templateId: st.templateId, modeId: st.modeId, effect, params, seed: st.seed, animate: st.animate !== false, sound: SOUNDS.has(st.sound) ? st.sound : null, layout },
    meta: { photo },
  };
}

const parseDataUrl = (d, types, max) => {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(d || ''); if (!m || !types.includes(m[1])) throw new Error('That image is not a JPEG, PNG or WebP.');
  const buf = Buffer.from(m[2], 'base64'); if (buf.length > max) throw new Error('That image is too large.'); return { type: m[1], buf };
};

// ---- handlers
export const handlers = {
  // GET /api/photos?mode=<mood>  ->  photos for a mood, from Pixabay (PIXABAY_API_KEY) or else Pexels (PEXELS_API_KEY).
  // Every photo has the same shape whichever library it came from. /api/pexels is the older name for the same thing.
  async photos({ url, env }) {
    const mode = MODES.find(m => m.id === url.searchParams.get('mode'));
    if (!mode) return { status: 400, json: { error: 'Unknown mode.' } };
    const page = Math.min(5, Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1));
    const cache = { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400' }; // Pixabay asks for results to be cached for a day
    if (env.PIXABAY_API_KEY) {
      const ask = async vertical => {
        const q = new URLSearchParams({ key: env.PIXABAY_API_KEY, q: mode.query.slice(0, 100), image_type: 'photo', safesearch: 'true', per_page: '24', page: String(page), min_width: '600', ...(vertical ? { orientation: 'vertical', min_height: '900' } : {}) });
        const r = await fetch('https://pixabay.com/api/?' + q); if (!r.ok) return { fail: r.status, hits: [] }; return r.json();
      };
      let d = await ask(true); if (d.fail) return { status: 502, json: { configured: true, photos: [], error: 'Pixabay did not answer (' + d.fail + ').' } };
      if ((d.hits || []).length < 6) { const more = await ask(false); if (!more.fail) d = { hits: [...(d.hits || []), ...(more.hits || [])] }; } // few tall photos for this mood: let wide ones in too (they are cropped)
      const seen = new Set();
      const photos = (d.hits || []).filter(h => !seen.has(h.id) && seen.add(h.id)).slice(0, 24).map(h => ({ provider: 'pixabay', id: h.id, url: h.largeImageURL, thumb: h.previewURL, photographer: h.user, photographerUrl: `https://pixabay.com/users/${h.user}-${h.user_id}/`, pageUrl: h.pageURL, alt: h.tags || '' }));
      return { headers: cache, json: { configured: true, provider: 'pixabay', photos } };
    }
    if (env.PEXELS_API_KEY) {
      const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(mode.query)}&orientation=portrait&size=large&per_page=18&page=${page}`, { headers: { Authorization: env.PEXELS_API_KEY } });
      if (!r.ok) return { status: 502, json: { configured: true, photos: [], error: 'Pexels did not answer (' + r.status + ').' } };
      const d = await r.json();
      return { headers: { 'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400' }, json: { configured: true, provider: 'pexels', photos: (d.photos || []).map(p => ({
        provider: 'pexels', id: p.id, url: p.src.portrait, thumb: p.src.medium, photographer: p.photographer, photographerUrl: p.photographer_url, pageUrl: p.url, alt: p.alt || '', color: p.avg_color })) } };
    }
    if (env.PEXELS_MOCK) { // development only: one real photo so the whole photo path can be tried without a key
      const u = 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg';
      return { json: { configured: true, mock: true, provider: 'pexels', photos: [{ provider: 'pexels', id: 1103970, url: u + '?auto=compress&cs=tinysrgb&w=1000', thumb: u + '?auto=compress&cs=tinysrgb&w=300', photographer: 'Pexels', pageUrl: 'https://www.pexels.com/photo/1103970/', alt: 'sample' }] } };
    }
    return { json: { configured: false, photos: [] } };
  },
  async pexels(args) { return handlers.photos(args); },

  async publish({ method, body, headers, env }) {
    if (method !== 'POST') return { status: 405, json: { error: 'Use POST.' } };
    const store = getStore(env);
    if (!store) return { status: 503, json: { error: 'Publishing is not switched on for this site yet: it needs a Blob store connected in Vercel.' } };
    let bundle; try { bundle = cleanBundle(body?.bundle); } catch (e) { return { status: 400, json: { error: e.message } }; }
    const key = String(body?.key || ''); if (key.length < 16) return { status: 400, json: { error: 'Missing edit key.' } };
    // pick the link: keep it if it is this creator's own story, otherwise find a free one
    const base = slugify(body?.slug) || slugify(bundle.book.title) || 'story';
    let slug = base, existing = null;
    const sample = new Set((await readLibrary().catch(() => ({ books: [] }))).books.map(b => b.slug)); // a published story may not take a sample story's link
    for (let i = 2; i < 40; i++) {
      if (RESERVED.has(slug) || sample.has(slug)) { slug = `${base}-${i}`; continue; }
      existing = await store.get(slug);
      if (!existing || existing.keyHash === sha(key)) break;
      slug = `${base}-${i}`;
    }
    try {
      if (body.image) { const { type, buf } = parseDataUrl(body.image, ['image/jpeg', 'image/png', 'image/webp'], 1_800_000); bundle.style.seed = await store.putImage(`${slug}-bg-${randomBytes(3).toString('hex')}.${type.split('/')[1]}`, buf, type); }
      else if (PIXABAY_IMG.test(bundle.style.seed)) { // Pixabay does not allow permanent hot-linking, so the story keeps its own copy of the photo
        const r = await fetch(bundle.style.seed, { headers: { 'user-agent': 'booooks/0.1' } }), type = (r.headers.get('content-type') || '').split(';')[0];
        if (!r.ok || !/^image\/(jpeg|png|webp)$/.test(type)) throw new Error('That photo could not be fetched. Please pick another one.');
        const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 4_000_000) throw new Error('That photo is too large. Please pick another one.');
        bundle.style.seed = await store.putImage(`${slug}-bg-${randomBytes(3).toString('hex')}.${type.split('/')[1]}`, buf, type);
      }
      let cardUrl = existing?.cardUrl || null, coverUrl = existing?.coverUrl || null;
      if (body.card) { const { type, buf } = parseDataUrl(body.card, ['image/jpeg'], 400_000); cardUrl = await store.putImage(`${slug}-card-${randomBytes(3).toString('hex')}.jpg`, buf, type); }
      if (body.cover) { const { type, buf } = parseDataUrl(body.cover, ['image/jpeg'], 300_000); coverUrl = await store.putImage(`${slug}-cover-${randomBytes(3).toString('hex')}.jpg`, buf, type); }
      const now = new Date().toISOString(), createdAt = existing?.createdAt || now;
      const genre = (await readLibrary().catch(() => ({ genres: [] }))).genres.some(g => g.id === body.genre) ? body.genre : 'fiction';
      const words = bundle.book.pages[1].stanzas.reduce((n, s) => n + s.lines.reduce((m, l) => m + (l.match(/\S+/g) || []).length, 0), 0);
      const listing = { slug, title: bundle.book.title, author: bundle.book.author, genre, kind: bundle.book.layout, template: bundle.style.templateId, mood: bundle.style.modeId, cover: coverUrl, card: cardUrl,
        minutes: Math.max(1, Math.round(words / 200)), listed: body.listed !== false, createdAt, updatedAt: now };
      await store.put(slug, { slug, keyHash: sha(key), bundle, cardUrl, coverUrl, genre, createdAt, updatedAt: now }, listing);
    } catch (e) { return { status: 400, json: { error: e.message } }; }
    const o = originOf(headers);
    return { json: { ok: true, slug, path: `/s/${slug}`, url: `${o}/s/${slug}`, updated: !!existing } };
  },

  // GET /api/stories  ->  the stories creators have published and chosen to list, newest first (no edit keys, no text)
  async stories({ url, env }) {
    const store = getStore(env); if (!store) return { json: { stories: [], store: false } };
    const limit = Math.min(60, Math.max(1, parseInt(url.searchParams.get('limit'), 10) || 40));
    const rows = (await store.list(limit)).filter(r => r.listed !== false).map(r => ({ slug: r.slug, title: r.title, author: r.author, genre: r.genre, kind: r.kind, template: r.template, mood: r.mood, cover: r.cover || null, card: r.card || null, minutes: r.minutes, createdAt: r.createdAt }));
    return { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' }, json: { stories: rows, store: true } };
  },

  async story({ url, env }) {
    const store = getStore(env); if (!store) return { status: 503, json: { error: 'No store.' } };
    const slug = slugify(url.searchParams.get('slug')); const rec = slug && await store.get(slug);
    if (!rec) return { status: 404, json: { error: 'Not found.' } };
    return { headers: { 'cache-control': 'public, s-maxage=30, stale-while-revalidate=300' }, json: { slug, bundle: rec.bundle, cardUrl: rec.cardUrl, updatedAt: rec.updatedAt } };
  },

  // GET /s/:slug  ->  the reader page with the story embedded and proper link-preview tags.
  // A story is one a creator published (in the store), one of the seeded samples (reader/data/seed), or a built-in registry story.
  async page({ url, env, headers }) {
    const store = getStore(env), slug = slugify(url.searchParams.get('slug'));
    const shell = await readFile(new URL('../../reader/read.html', import.meta.url), 'utf8');
    // the sample stories live in the repo, so they never need the store; a published story is read from it
    let seed = slug ? (await readLibrary()).books.find(b => b.slug === slug) || null : null, rec = !seed && store && slug ? await store.get(slug) : null, bundle = rec?.bundle || null, storyId = null;
    if (seed?.source === 'bundle') bundle = JSON.parse(await readFile(new URL(`../../reader/data/seed/${seed.slug}.json`, import.meta.url), 'utf8'));
    else if (seed) storyId = seed.registryId;
    if (!bundle && !storyId) return { status: 404, headers: { 'cache-control': 'public, s-maxage=10' }, html: shell.replace('</head>', '<meta name="robots" content="noindex"></head>').replace('<title>booooks reader</title>', '<title>Story not found · booooks</title>').replace('</body>', '<p style="position:fixed;inset:0;display:grid;place-items:center;margin:0;background:#090a0b;color:#fff;font:700 28px/1.2 system-ui;text-align:center;z-index:99">This story is not here (yet).<br><a href="/" style="color:#ffc7c6">See all stories</a> · <a href="/studio/" style="color:#ffc7c6">Make one</a></p></body>') };
    const o = originOf(headers), link = `${o}/s/${slug}`;
    const title = bundle?.book.title || seed.title, author = bundle?.book.author || seed.author, kicker = bundle?.book.kicker || (seed?.kind === 'verse' ? 'A book of poems' : 'A short story');
    const desc = `${kicker} by ${author}. Swipe up to read it.`;
    const image = rec?.cardUrl || (seed?.cover ? `${o}/${seed.cover}` : null), wide = !!rec?.cardUrl;
    const tags = [
      `<title>${esc(title)} · ${esc(author)}</title>`, `<meta name="description" content="${esc(desc)}">`, '<base href="/">',
      '<meta property="og:type" content="article">', '<meta property="og:site_name" content="booooks">', `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(desc)}">`, `<meta property="og:url" content="${esc(link)}">`, `<meta name="twitter:card" content="${wide ? 'summary_large_image' : 'summary'}">`,
      ...(image ? [`<meta property="og:image" content="${esc(image)}">`, ...(wide ? ['<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">'] : []), `<meta name="twitter:image" content="${esc(image)}">`] : []),
    ].join('\n');
    const json = v => JSON.stringify(v).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16));
    const data = `<script>${bundle ? `window.__BOOK__ = ${json(bundle)};` : `window.__STORY__ = ${json(storyId)};`}</script>`;
    const titleRe = /<title>[^<]*<\/title>\s*(<meta name="description"[^>]*>)?/, scriptTag = '<script type="module" src="reader.js"></script>';
    if (!titleRe.test(shell) || !shell.includes(scriptTag)) throw new Error('reader/read.html changed: update the /s/<slug> page template in api/_lib/core.js.');
    const html = shell.replace(titleRe, tags + '\n').replace(scriptTag, data + '\n' + scriptTag);
    return { headers: { 'cache-control': 'public, s-maxage=30, stale-while-revalidate=300' }, html };
  },
};

// ---- adapter: a handler becomes a Node (req, res) function (Vercel and the local server both use it)
export function toNode(handler) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      let body = null;
      if (req.method === 'POST' || req.method === 'PUT') {
        body = req.body; // Vercel parses it lazily when asked
        if (body === undefined || body === null) {
          const chunks = []; let n = 0;
          for await (const c of req) { n += c.length; if (n > 4_500_000) { res.statusCode = 413; res.setHeader('content-type', 'application/json'); return res.end('{"error":"That is too large to send."}'); } chunks.push(c); }
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'); } catch { res.statusCode = 400; res.setHeader('content-type', 'application/json'); return res.end('{"error":"Could not read that."}'); }
        } else if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
      }
      const out = await handler({ method: req.method, url, body, headers: req.headers, env: process.env });
      res.statusCode = out.status || 200;
      for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v);
      if (out.json !== undefined) { res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(out.json)); }
      else { res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(out.html ?? ''); }
    } catch (e) {
      console.error(e); res.statusCode = 500; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ error: 'Something went wrong on our side. Please try again.' }));
    }
  };
}
