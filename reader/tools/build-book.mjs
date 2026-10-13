// node tools/build-book.mjs "<book>.pdf"  ->  data/book.json
// Imports a poetry PDF into the reader's page model. Needs poppler's `pdftohtml` on PATH.
// Titles = bold lines. Vertical gaps between lines become stanza breaks (gap = blank lines).
// Lines the PDF wrapped at the right margin are joined back, so only authored breaks remain.
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const pdf = process.argv[2];
if (!pdf) { console.error('usage: node tools/build-book.mjs <book.pdf>'); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'book-'));
execFileSync('pdftohtml', ['-xml', '-i', '-q', '-nodrm', pdf, path.join(tmp, 'book')]);
const xml = fs.readFileSync(path.join(tmp, 'book.xml'), 'utf8');

const decode = s => s.replace(/<\/?b>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).trim();

// 1. read every text line with its position
const pages = xml.split(/<page /).slice(1).map(p => {
  const lines = [];
  for (const m of p.matchAll(/<text top="(\d+)" left="(\d+)" width="(\d+)" height="(\d+)" font="\d+">(.*?)<\/text>/g)) {
    const text = decode(m[5]);
    if (text) lines.push({ top: +m[1], width: +m[3], bold: /^<b>/.test(m[5]), text });
  }
  return lines;
});

// 2. typical line pitch and the widest line (a line near it is likely wrapped)
const pitches = [];
for (const ls of pages) for (let i = 1; i < ls.length; i++) pitches.push(ls[i].top - ls[i - 1].top);
const pitch = pitches.sort((a, b) => a - b)[Math.floor(pitches.length * 0.3)] || 47;
const maxWidth = Math.max(...pages.flat().filter(l => !l.bold).map(l => l.width));

const out = { title: 'Rejuvenating', author: 'Deborah Datoru', pages: [] };
pages.forEach((ls, idx) => {
  const n = idx + 1;
  if (!ls.length) return;
  if (n === 1) { out.pages.push({ n, kind: 'cover' }); return; }
  let title = null;
  if (ls[0].bold) title = ls.shift().text;
  const stanzas = [];
  let prev = null, cur = null;
  for (const l of ls) {
    const blank = prev ? Math.round((l.top - prev.top) / pitch) - 1 : 0;
    const wrapped = prev && blank === 0 && prev.width > maxWidth * 0.86 && /^[a-z]/.test(l.text);
    if (wrapped) cur.lines[cur.lines.length - 1] += ' ' + l.text;
    else if (!cur || blank > 0) { cur = { gap: Math.min(3, Math.max(1, blank)), lines: [l.text] }; stanzas.push(cur); }
    else cur.lines.push(l.text);
    prev = l;
  }
  out.pages.push({ n, kind: 'poem', title, stanzas });
});

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/book.json', JSON.stringify(out, null, 1));
const poems = out.pages.filter(p => p.kind === 'poem');
console.log(`pages in pdf: ${pages.length}, written: ${out.pages.length}, with titles: ${poems.filter(p => p.title).length}, line pitch ${pitch}, max width ${maxWidth}`);
