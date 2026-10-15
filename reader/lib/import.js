// From whatever a creator has (typed text, .txt, .md, .docx, .pdf) to the reader's book model.
// The author's words are never changed: this only decides where paragraphs, lines and sentences begin and end.
//
// Plain text convention used everywhere: a blank line starts a new paragraph (or stanza); a single line break is a line of verse,
// or just a wrapped line in prose.
import { titleLines } from './compose.js';

const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
const MAMMOTH = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';

// light cleanup for markdown files: heading marks and emphasis markers go, the words stay
const stripMarkdown = t => t.replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/(\*\*|__)(.+?)\1/g, '$2').replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?=[^\w*]|$)/g, '$1$2');

const sentences = para => para.split(/(?<=[.!?…]["”’)]*)\s+(?=["“‘'(]?[A-Z])/).map(s => s.trim()).filter(Boolean);

// poems have short lines and several lines per block; stories have long lines
export function detectLayout(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return 'prose';
  const lens = lines.map(l => l.length).sort((a, b) => a - b), median = lens[Math.floor(lens.length / 2)];
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim()).length || 1;
  return median < 48 && lines.length / blocks >= 2 ? 'verse' : 'prose';
}

export function parseText(raw, layout) {
  const text = stripMarkdown(raw.replace(/\r\n?/g, '\n')).replace(/[ \t]+$/gm, '').trim();
  const stanzas = [];
  // split on blank lines but remember how many there were: two or more is a longer silence in verse
  const re = /\n([ \t]*\n)+/g; let last = 0, m, gap = 1;
  const push = (block, g) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean); if (!lines.length) return;
    if (layout === 'prose') stanzas.push({ gap: 1, lines: sentences(lines.join(' ')) });
    else stanzas.push({ gap: g, lines });
  };
  while ((m = re.exec(text))) { push(text.slice(last, m.index), gap); gap = Math.min(3, (m[0].match(/\n/g).length) - 1); last = m.index + m[0].length; }
  push(text.slice(last), gap);
  return stanzas;
}

export function buildBook({ title, author, text, layout }) {
  const lay = layout || detectLayout(text), stanzas = parseText(text, lay);
  const words = stanzas.flatMap(s => s.lines).join(' ').split(/\s+/).filter(Boolean).length;
  return {
    book: {
      title: title || 'Untitled', titleLines: titleLines(title || 'Untitled'), author: author || 'Anonymous', byline: 'by ' + (author || 'Anonymous'),
      kicker: lay === 'prose' ? 'A short story' : 'A book of poems', layout: lay,
      pages: [{ n: 1, kind: 'cover' }, { n: 2, kind: 'poem', title: null, stanzas }],
    },
    stats: { words, minutes: Math.max(1, Math.round(words / 200)), layout: lay },
  };
}

// ---- files
const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Could not load ' + src)); document.head.append(s); });

async function readPdf(file) {
  const pdfjs = await import(PDFJS + 'pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.mjs';
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const items = (await (await doc.getPage(n)).getTextContent()).items.filter(i => i.str && i.str.trim() !== '' || i.str === ' ');
    // group text pieces into lines by their baseline first, then order each line left to right (an apostrophe or accent can sit a hair
    // higher than the letters around it, so sorting by height alone would move it to the front of the line)
    const pieces = items.map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: Math.abs(i.transform[3]) || i.height || 10 })).sort((a, b) => b.y - a.y);
    const grouped = [];
    for (const it of pieces) { const g = grouped.find(l => Math.abs(l.y - it.y) < Math.max(it.h, l.h) * 0.5); if (g) g.items.push(it); else grouped.push({ y: it.y, h: it.h, items: [it] }); }
    const lines = grouped.map(g => {
      g.items.sort((a, b) => a.x - b.x); let text = '', right = -Infinity;
      for (const it of g.items) { if (text && it.x - right > it.h * 0.2 && !text.endsWith(' ') && !it.s.startsWith(' ')) text += ' '; text += it.s; right = Math.max(right, it.x + it.w); }
      return { s: text, x: g.items[0].x, y: g.y, right, h: g.h };
    });
    pages.push(lines.map(l => ({ ...l, s: l.s.replace(/\s+/g, ' ').trim() })).filter(l => l.s));
  }
  const all = pages.flat();
  if (!all.length) throw new Error('This PDF has no selectable text (it may be scanned images).');
  const maxRight = Math.max(...all.map(l => l.right)), minX = Math.min(...all.map(l => l.x));
  const gaps = []; pages.forEach(p => p.forEach((l, i) => { if (i) gaps.push(p[i - 1].y - l.y); }));
  const pitch = gaps.sort((a, b) => a - b)[Math.floor(gaps.length * 0.3)] || 14;
  const out = [];
  pages.forEach(p => {
    p.forEach((l, i) => {
      const prev = i ? p[i - 1] : null;
      if (!prev) { // first line of a page: it continues the last sentence only if it starts in lower case, else a new block begins
        if (out.length && /^[a-z]/.test(l.s) && out.at(-1) !== '') { out[out.length - 1] += ' ' + l.s; return; }
        if (out.length) out.push('');
        out.push(l.s); return;
      }
      const blanks = Math.round((prev.y - l.y) / pitch) - 1;
      const wrapped = blanks === 0 && prev.right > maxRight - (maxRight - minX) * 0.1 && /^[a-z]/.test(l.s);   // the PDF wrapped this line at the margin
      const indented = blanks === 0 && l.x > minX + l.h * 1.2 && /[.!?”"’)]$/.test(prev.s);                   // a new paragraph starts indented
      if (wrapped) { out[out.length - 1] += ' ' + l.s; return; }
      for (let k = 0; k < Math.min(3, blanks) + (indented ? 1 : 0); k++) out.push('');
      out.push(l.s);
    });
  });
  return out.join('\n').replace(/\n{4,}/g, '\n\n\n');
}

async function readDocx(file) {
  if (!window.mammoth) await loadScript(MAMMOTH);
  return (await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
}

export async function readFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return { text: await readPdf(file), kind: 'PDF' };
  if (name.endsWith('.docx')) return { text: await readDocx(file), kind: 'Word document' };
  if (name.endsWith('.doc')) throw new Error('Old .doc files cannot be read. Save it as .docx or PDF and try again.');
  if (/\.(txt|md|markdown|text)$/.test(name) || file.type.startsWith('text/')) return { text: await file.text(), kind: 'text file' };
  throw new Error('Use a PDF, Word (.docx), text or markdown file, or paste your text.');
}
