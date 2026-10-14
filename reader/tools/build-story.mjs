// node tools/build-story.mjs <paragraphs.txt> --title "..." --author "..." [--title-lines "A|B|C"] [--source <url>] [--out data/<id>.json]
// Turns plain prose into the reader's page model. Paragraphs are separated by a blank line; a single line break inside a paragraph
// is kept as a soft break (a small gap, not a full paragraph gap). The author's wording and spelling are never changed.
// Each paragraph is stored as sentences ("lines" of a stanza) so a long story can continue across screens at a sentence boundary.
import fs from 'fs';

const args = process.argv.slice(2);
const file = args.shift();
const opt = name => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : undefined; };
if (!file || !opt('title') || !opt('author')) { console.error('usage: node tools/build-story.mjs <paragraphs.txt> --title "..." --author "..." [--title-lines "A|B|C"] [--source <url>] [--out <file>]'); process.exit(1); }

const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim();
// a sentence ends at . ! ? or an ellipsis (plus any closing quote) and is followed by a capital letter or an opening quote
const sentences = para => para.split(/(?<=[.!?…]["”’)]*)\s+(?=["“‘'(]?[A-Z])/).map(s => s.trim()).filter(Boolean);

const stanzas = [];
for (const block of text.split(/\n\s*\n/)) {
  block.split('\n').map(l => l.trim()).filter(Boolean).forEach((soft, i) => stanzas.push({ gap: i === 0 ? 1 : 0.4, lines: sentences(soft) }));
}

const out = {
  title: opt('title'),
  ...(opt('title-lines') ? { titleLines: opt('title-lines').split('|') } : {}),
  author: opt('author'),
  byline: 'by ' + opt('author'),
  kicker: 'A short story',
  layout: 'prose',
  ...(opt('source') ? { source: opt('source') } : {}),
  pages: [{ n: 1, kind: 'cover' }, { n: 2, kind: 'poem', title: null, stanzas }],
};
const dest = opt('out') || 'data/story.json';
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 1));
const words = stanzas.flatMap(s => s.lines).join(' ').split(/\s+/).length;
console.log(`${dest}: ${stanzas.length} paragraphs, ${stanzas.reduce((n, s) => n + s.lines.length, 0)} sentences, ${words} words`);
