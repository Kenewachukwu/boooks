// Story cards shared by the front page and profiles. A card is a link to /s/<slug>; a normal click lifts its cover into the reader.
import { openStory } from './motion.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export function card(b, { feature = false } = {}) {
  const a = el('a', 'card' + (feature ? ' feature' : '')); a.href = b.href; a.dataset.slug = b.slug; a.style.setProperty('--gc', b.color);
  const cover = el('span', 'card-cover'), img = new Image(); img.src = b.cover; img.alt = `Cover of ${b.title}`; img.loading = 'lazy'; img.decoding = 'async'; img.width = 480; img.height = 720; cover.append(img);
  if (b.live) cover.append(el('span', 'card-new', 'New'));
  const meta = el('span', 'card-meta'); meta.append(el('span', 'card-g', `${b.genreName} · ${b.minutes} min`), el('span', 'card-t', b.title), el('span', 'card-a', b.author));
  a.append(cover, meta); return a;
}

// clicking a card lifts its cover and opens the reader (a click with a modifier key still opens a new tab)
export function wireCardOpen() {
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a.card'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const cover = a.querySelector('.card-cover'), img = a.querySelector('img'); if (!cover || !img) return;
    e.preventDefault(); openStory(a.href, cover, img.currentSrc || img.src);
  });
}
