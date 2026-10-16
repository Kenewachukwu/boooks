// node tools/build-library.mjs
// Builds the sample library the front page shows: data/library.json (genres, profiles, books) and one reader bundle per sample story in
// data/seed/<slug>.json (the same {v:1, book, style, meta} shape the studio publishes). Content lives in tools/seed-content.mjs; the
// painting behind each cover is listed in tools/cover-art.json. The two real stories come from data/stories.json.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GENRES, PROFILES, BOOKS } from './seed-content.mjs';
import { modeById } from '../lib/modes.js';
import { titleLines } from '../lib/compose.js';

const here = path.dirname(fileURLToPath(import.meta.url)), data = path.join(here, '..', 'data');
const art = JSON.parse(fs.readFileSync(path.join(here, 'cover-art.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(data, 'stories.json'), 'utf8'));
fs.mkdirSync(path.join(data, 'seed'), { recursive: true });

// a sentence ends at . ! ? or an ellipsis (plus any closing quote) and is followed by a capital letter or an opening quote
const sentences = para => para.split(/(?<=[.!?…]["”’)]*)(?<!\b(?:Mr|Mrs|Ms|Dr|St|Prof)\.)\s+(?=["“‘'(]?[A-Z])/).map(s => s.trim()).filter(Boolean);
const words = t => (t.match(/\S+/g) || []).length;
const byHandle = Object.fromEntries(PROFILES.map(p => [p.handle, p]));

function stanzasOf(text, kind) {
  const blocks = text.trim().replace(/\r\n/g, '\n').split(/\n\s*\n/);
  if (kind === 'verse') return blocks.map(b => ({ gap: 1, lines: b.split('\n').map(l => l.trim()).filter(Boolean) }));
  return blocks.map(b => ({ gap: 1, lines: sentences(b.replace(/\n/g, ' ')) }));
}

const books = [];
for (const b of BOOKS) {
  if (!byHandle[b.handle]) throw new Error('unknown profile ' + b.handle);
  if (!GENRES.some(g => g.id === b.genre)) throw new Error('unknown genre ' + b.genre);
  const a = art[b.slug]; if (!a) throw new Error('no cover art for ' + b.slug);
  const author = byHandle[b.handle].name, mode = modeById(b.mood), n = words(b.text);
  const bundle = {
    v: 1,
    book: { title: b.title, titleLines: titleLines(b.title), author, byline: 'by ' + author, kicker: b.kind === 'prose' ? 'A short story' : 'A book of poems', layout: b.kind,
      pages: [{ n: 1, kind: 'cover' }, { n: 2, kind: 'poem', title: null, stanzas: stanzasOf(b.text, b.kind) }] },
    style: { templateId: b.template, modeId: b.mood, effect: mode.effect, params: b.photo ? { photo: b.photo } : {}, seed: `/media/photos/${b.slug}.jpg`, animate: true, sound: null, layout: b.kind },
    meta: { photo: null },
  };
  fs.writeFileSync(path.join(data, 'seed', b.slug + '.json'), JSON.stringify(bundle));
  books.push({ slug: b.slug, title: b.title, handle: b.handle, author, genre: b.genre, kind: b.kind, minutes: Math.max(1, Math.round(n / 200)), words: n, blurb: b.blurb,
    template: b.template, mood: b.mood, cover: `media/covers/${b.slug}.jpg`, photo: `media/photos/${b.slug}.jpg`, source: 'bundle', date: b.date,
    art: { artist: a.artist, source: a.source || '', license: a.license || 'Public domain' } });
}

// the two real stories, shown with their real authors (no invented profile text)
const real = [
  { id: 'rejuvenating', handle: 'deborah.datoru', genre: 'poetry', kind: 'verse', minutes: 14, blurb: 'A book of poems about starting again, set over a looping painted night.', date: '2026-08-01', cover: 'media/covers/rejuvenating.jpg', mood: 'night-field' },
  { id: 'heart-break-and-hot-chocolate', handle: 'the.introverted_she', genre: 'love-heartbreak', kind: 'prose', minutes: 6, blurb: 'A short story where a cracked heart floats in a mug of hot chocolate.', date: '2026-10-12', cover: 'media/covers/heart-break-and-hot-chocolate.jpg', mood: 'hot-chocolate' },
];
const realProfiles = [];
for (const r of real) {
  const e = registry.stories.find(s => s.id === r.id); if (!e) throw new Error('missing registry story ' + r.id);
  realProfiles.push({ handle: r.handle, name: e.author, bio: `Author of ${e.title}.`, city: '', real: true });
  books.push({ slug: r.id, title: e.title, handle: r.handle, author: e.author, genre: r.genre, kind: r.kind, minutes: r.minutes, blurb: r.blurb, template: e.template, mood: r.mood,
    cover: r.cover, source: 'registry', registryId: r.id, date: r.date });
}

books.sort((a, b) => b.date.localeCompare(a.date));
const lib = { v: 1, genres: GENRES, profiles: [...realProfiles, ...PROFILES], books };
fs.writeFileSync(path.join(data, 'library.json'), JSON.stringify(lib, null, 1));
console.log(`library: ${books.length} books, ${lib.profiles.length} profiles, ${GENRES.length} genres`);
