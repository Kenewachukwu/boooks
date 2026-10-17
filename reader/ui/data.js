// The front page's data: the sample library (data/library.json, always there) plus whatever creators have published (/api/stories).
// If the API is unreachable or no store is connected the page simply shows the samples.
const j = url => fetch(url).then(r => (r.ok ? r.json() : Promise.reject(new Error(url + ' ' + r.status))));

export const MINE_KEY = 'booooks.mine'; // stories published from this browser: [{ slug, title, author, at }]
export const readMine = () => { try { const v = JSON.parse(localStorage.getItem(MINE_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };

export const KEY_KEY = 'booooks.studio.key'; // the edit key the studio made for this browser
export const forgetMine = slug => { try { localStorage.setItem(MINE_KEY, JSON.stringify(readMine().filter(m => m.slug !== slug))); } catch { /* private mode */ } };
// take one of your stories down; only the browser that published it can. Throws a sentence the person can read.
export async function unpublish(slug) {
  let key = ''; try { key = localStorage.getItem(KEY_KEY) || ''; } catch { /* private mode */ }
  const r = await fetch('/api/unpublish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug, key }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok && r.status !== 404) throw new Error(j.error || 'Could not take it down. Please try again.');
  forgetMine(slug); return true; // a 404 means it is already gone
}

export async function loadLibrary() {
  const [lib, live] = await Promise.all([j('/data/library.json'), j('/api/stories').catch(() => ({ stories: [] }))]);
  const genres = lib.genres, gById = Object.fromEntries(genres.map(g => [g.id, g]));
  const profiles = lib.profiles, pByHandle = Object.fromEntries(profiles.map(p => [p.handle, p]));
  const norm = b => { const g = gById[b.genre] || gById.fiction; return { ...b, genreName: g.name, color: g.color, href: '/s/' + b.slug }; };

  const samples = lib.books.map(b => norm({ ...b, cover: '/' + b.cover, sample: true }));
  const published = (live.stories || []).filter(s => !lib.books.some(b => b.slug === s.slug)).map(s => norm({
    slug: s.slug, title: s.title, author: s.author, handle: null, genre: s.genre, kind: s.kind, minutes: s.minutes || 1, cover: s.cover || s.card || '', createdAt: s.createdAt, live: true, wide: !s.cover }));
  // creators' stories first (they are the newest), then the samples; a cover that is missing never reaches the page
  const books = [...published, ...samples].filter(b => b.cover);
  for (const g of genres) g.count = books.filter(b => b.genre === g.id).length;
  const writers = new Set(books.map(b => b.handle || b.author)).size;
  return { genres, gById, profiles, pByHandle, books, published, samples, writers };
}

export const byGenre = (books, id) => (id === 'all' ? books : books.filter(b => b.genre === id));
export const booksOf = (books, handle) => books.filter(b => b.handle === handle);
export const initials = name => String(name).split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
