// node reader/serve.mjs [port]
// The local stand-in for the Vercel site: static files with byte-range support (Safari needs it for video), the same /api functions,
// and the /s/<slug> story pages (stories you publish here are saved under .data/ and never leave this machine).
// It also prints the network address so the reader can be opened on a phone on the same Wi-Fi.
// Secrets for local runs go in .env.local at the repo root (PIXABAY_API_KEY=... or PEXELS_API_KEY=...). PEXELS_MOCK=1 returns one sample photo without a key.
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { handlers, toNode } from '../api/_lib/core.js';
import { localAssetPath } from '../api/_lib/store.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = +process.argv[2] || 5173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp4': 'video/mp4', '.wav': 'audio/wav', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

try { // .env.local at the repo root: KEY=value lines
  for (const line of fs.readFileSync(path.join(root, '..', '.env.local'), 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env.local: fine */ }

const api = { '/api/photos': toNode(handlers.photos), '/api/pexels': toNode(handlers.pexels), '/api/publish': toNode(handlers.publish), '/api/unpublish': toNode(handlers.unpublish), '/api/story': toNode(handlers.story), '/api/stories': toNode(handlers.stories) };
const page = toNode(handlers.page);

function sendFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const head = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (!m) { res.writeHead(200, { ...head, 'Content-Length': st.size }); return fs.createReadStream(file).pipe(res); }
    let s = m[1] ? +m[1] : 0, e = m[2] ? +m[2] : st.size - 1;
    if (!m[1] && m[2]) { s = st.size - +m[2]; e = st.size - 1; }
    e = Math.min(e, st.size - 1);
    res.writeHead(206, { ...head, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Content-Length': e - s + 1 });
    fs.createReadStream(file, { start: s, end: e }).pipe(res);
  });
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const pathname = decodeURIComponent(u.pathname);
  if (api[pathname]) return api[pathname](req, res);
  if (pathname === '/api/asset') { // images uploaded by creators while developing locally
    const rel = u.searchParams.get('path') || '';
    if (!/^images\/[\w.-]+$/.test(rel)) { res.writeHead(400); return res.end('bad path'); }
    return sendFile(req, res, localAssetPath(rel));
  }
  // the same short URLs vercel.json rewrites on the live site
  if (pathname === '/read') return sendFile(req, res, path.join(root, 'read.html'));
  if (/^\/@[\w.-]+\/?$/.test(pathname)) return sendFile(req, res, path.join(root, 'profile.html'));
  if (pathname === '/studio') { res.writeHead(301, { Location: '/studio/' + u.search }); return res.end(); }
  const s = /^\/s\/([^/]+)\/?$/.exec(pathname);
  if (s) { req.url = '/api/page?slug=' + encodeURIComponent(s[1]); return page(req, res); }
  let rel = pathname; if (rel.endsWith('/')) rel += 'index.html'; if (rel === '') rel = '/index.html';
  const file = path.join(root, rel);
  if (!file.startsWith(root + path.sep) || file.includes(path.sep + 'tools' + path.sep)) { res.writeHead(403); return res.end('forbidden'); }
  sendFile(req, res, file);
}).listen(port, '0.0.0.0', () => {
  console.log(`booooks on http://localhost:${port}   (reader: /read, studio: /studio/)`);
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log(`on your phone (same Wi-Fi): http://${a.address}:${port}`);
});
