// Where published stories live. On Vercel: a Blob store (enabled by connecting one to the project, which sets BLOB_READ_WRITE_TOKEN).
// On a developer's machine: plain files under .data/ (never committed, never served by the static site).
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const localDir = fileURLToPath(new URL('../../.data/', import.meta.url));

function localStore() {
  const file = slug => `${localDir}stories/${slug}.json`;
  return {
    kind: 'local',
    async get(slug) { try { return JSON.parse(await readFile(file(slug), 'utf8')); } catch { return null; } },
    async put(slug, rec, meta) {
      await mkdir(`${localDir}stories`, { recursive: true }); await writeFile(file(slug), JSON.stringify(rec));
      if (meta) { await mkdir(`${localDir}meta`, { recursive: true }); await writeFile(`${localDir}meta/${slug}.json`, JSON.stringify(meta)); }
    },
    async list(limit = 60) { // the listing records (title, author, genre, cover...), newest first
      let names = []; try { names = await readdir(`${localDir}meta`); } catch { return []; }
      const all = await Promise.all(names.filter(n => n.endsWith('.json')).map(async n => { try { return JSON.parse(await readFile(`${localDir}meta/${n}`, 'utf8')); } catch { return null; } }));
      return all.filter(Boolean).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, limit);
    },
    async putImage(name, buf) { await mkdir(`${localDir}images`, { recursive: true }); await writeFile(`${localDir}images/${name}`, buf); return `/api/asset?path=images/${name}`; },
  };
}

// ---- Vercel Blob. Reads cost almost nothing: a story or the front-page index is fetched straight from its public address, and a cache hit is free.
// (Looking a blob up with list() is an "advanced operation", the scarce kind on the free plan, so it is never used on a read.)
// The address is the store's own host plus the file's path; the host is worked out from the store id and confirmed the first time a real blob answers.
const INDEX = 'index.json', INDEX_MAX = 300;
let learnedBase = null;                                                // set once a real blob from this store has been seen
const missing = new Map();                                             // path -> until when we know it is not there (per running instance), so a bot hitting random links costs nothing twice
const learn = url => { try { learnedBase = new URL(url).origin + '/'; } catch { /* keep what we had */ } };
const expectedBase = env => {
  const id = String(env.BLOB_STORE_ID || '').replace(/^store_/, '') || (/^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(env.BLOB_READ_WRITE_TOKEN || '') || [])[1];
  return id ? `https://${id.toLowerCase()}.public.blob.vercel-storage.com/` : null;
};

export function blobStore(env = process.env, sdk = () => import('@vercel/blob')) {
  const lib = () => sdk();
  const isMissing = (e, mod) => e instanceof mod.BlobNotFoundError || /not.?found/i.test(e?.message || '');

  // read a JSON file. Normal reads go to the public address (cached at the edge, so repeat reads are free).
  // fresh: true asks the store for the newest version first, which a writer needs so it never builds on a stale copy.
  async function readJson(path, opts = {}) {
    if (!opts.fresh && (missing.get(path) || 0) > Date.now()) return null;
    const v = await readJsonNow(path, opts);
    if (v === null && !opts.fresh) missing.set(path, Date.now() + 30_000);
    return v;
  }
  async function readJsonNow(path, { fresh = false } = {}) {
    const mod = await lib();
    const viaStore = async () => {
      try { const h = await mod.head(path); learn(h.url); const r = await fetch(h.url + (fresh ? '?v=' + new Date(h.uploadedAt).getTime() : '')); return r.ok ? await r.json() : null; }
      catch (e) { if (isMissing(e, mod)) return null; throw e; }
    };
    if (fresh) return viaStore();
    const base = learnedBase || expectedBase(env);
    if (base) {
      try { const r = await fetch(base + path); if (r.ok) { learnedBase = base; return await r.json(); } if (r.status === 404 && learnedBase) return null; } catch { /* fall through to the store */ }
    }
    return viaStore(); // the expected address was not confirmed: ask the store once, which also teaches us the real address
  }
  const writeJson = async (path, value, maxAge) => { missing.delete(path); const { put } = await lib(); const r = await put(path, JSON.stringify(value), { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: maxAge }); learn(r.url); return r; };

  return {
    kind: 'blob',
    get: slug => readJson(`stories/${slug}.json`),
    async put(slug, rec, meta) {
      await writeJson(`stories/${slug}.json`, rec, 60);
      if (!meta) return;
      // the front page reads one small index file instead of listing the store; the newest stories sit at the top
      const index = (await readJson(INDEX, { fresh: true })) || [];
      const next = [meta, ...index.filter(m => m.slug !== meta.slug)].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, INDEX_MAX);
      await writeJson(INDEX, next, 60);
    },
    async list(limit = 60) { return ((await readJson(INDEX)) || []).slice(0, limit); },
    async putImage(name, buf, type) { const { put } = await lib(); const r = await put(`images/${name}`, buf, { access: 'public', contentType: type, addRandomSuffix: false, allowOverwrite: true }); learn(r.url); return r.url; },
  };
}

// no Blob token on Vercel means publishing is not set up: say so rather than pretending to save
export function getStore(env) {
  if (env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID) return blobStore(env); // a token, or the store id that goes with Vercel's automatic (OIDC) sign-in
  if (env.VERCEL) return null;
  return localStore();
}
export const localAssetPath = rel => `${localDir}${rel}`;
