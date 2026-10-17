// A writer's page: their books as a swipe deck, and the full list underneath.
import { reveal, autoHideNav, openStory } from './motion.js';
import { card, wireCardOpen } from './cards.js';
import { loadLibrary, booksOf, initials } from './data.js';
import { createDeck } from './fx/deck.js';

const $ = id => document.getElementById(id);
const root = document.documentElement;
const handle = decodeURIComponent((location.pathname.match(/^\/@([^/]+)/) || [])[1] || new URLSearchParams(location.search).get('handle') || '');
wireCardOpen(); autoHideNav($('nav'));

const fontsReady = Promise.race([
  Promise.all([document.fonts.load('900 80px "Archivo"'), document.fonts.load('300 40px "Fraunces"')]),
  new Promise(r => setTimeout(r, 1200)),
]).finally(() => root.classList.remove('fonts-wait'));

(async () => {
  let lib; try { lib = await loadLibrary(); } catch { lib = null; }
  const p = lib?.pByHandle[handle];
  if (!p) { $('prof').hidden = true; $('missing').hidden = false; document.title = 'Writer not found · booooks'; await fontsReady; reveal(); return; }
  const books = booksOf(lib.books, handle).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  document.title = `${p.name} · booooks`;
  document.querySelector('meta[name="description"]').content = `${p.name} on booooks: ${books.length} ${books.length === 1 ? 'story' : 'stories'}. ${p.bio}`;
  $('nameText').textContent = p.name; $('handle').textContent = '@' + p.handle; $('bio').textContent = p.bio;
  const AV = ['#ffc7c6', '#847dff', '#00b3dd', '#dd90d8', '#ffd24a', '#62f0c2', '#ff7a59', '#90b8f0', '#c6ff5e'];
  const h = Math.abs([...p.handle].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
  const av = $('avatar'); av.textContent = initials(p.name); av.style.setProperty('--a1', AV[h % AV.length]); av.style.setProperty('--a2', AV[(h >> 3) % AV.length]);
  const mins = books.reduce((n, b) => n + b.minutes, 0), genres = [...new Set(books.map(b => b.genreName))];
  $('meta').replaceChildren(...[`${books.length} ${books.length === 1 ? 'story' : 'stories'}`, `${mins} min of reading`, genres.join(' · '), p.city].filter(Boolean).map(t => { const s = document.createElement('span'); s.textContent = t; return s; }));
  $('readLatest').href = books[0].href;
  $('readLatest').addEventListener('click', e => { e.preventDefault(); openStory(books[0].href, document.querySelector('.deck-card.is-front') || $('deck'), books[0].cover); });
  $('share').addEventListener('click', async () => { const url = location.href; try { if (navigator.share) { await navigator.share({ title: p.name + ' on booooks', url }); return; } await navigator.clipboard.writeText(url); $('share').textContent = 'Copied'; } catch { prompt('Copy this link', url); } setTimeout(() => { $('share').textContent = 'Copy profile link'; }, 1600); });

  // the deck
  const deck = createDeck($('deck'), books, { onChange: (front, n) => { $('deckCount').textContent = `${front + 1} / ${n}`; } });
  $('prev').addEventListener('click', () => deck.prev()); $('next').addEventListener('click', () => deck.next());
  if (books.length < 2) $('prev').hidden = $('next').hidden = true;

  // the full list
  if (books.length > 1) { $('all').hidden = false; $('grid').append(...books.map(b => card(b))); }

  await fontsReady; reveal();
})();
