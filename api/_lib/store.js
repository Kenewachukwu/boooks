// Where published stories live. On Vercel: a Blob store (enabled by connecting one to the project, which sets BLOB_READ_WRITE_TOKEN).
// On a developer's machine: plain files under .data/ (never committed, never served by the static site).
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const localDir = fileURLToPath(new URL('../../.data/', import.meta.url));

function localStore() {
  const file = slug => `${localDir}stories/${slug}.json`;
  return {
    kind: 'local',
    async get(slug) { try { return JSON.parse(await readFile(file(slug), 'utf8')); } catch { return null; } },
    async put(slug, rec) { await mkdir(`${localDir}stories`, { recursive: true }); await writeFile(file(slug), JSON.stringify(rec)); },
    async putImage(name, buf) { await mkdir(`${localDir}images`, { recursive: true }); await writeFile(`${localDir}images/${name}`, buf); return `/api/asset?path=images/${name}`; },
  };
}

function blobStore() {
  const sdk = () => import('@vercel/blob');
  return {
    kind: 'blob',
    async get(slug) {
      const { list } = await sdk(), path = `stories/${slug}.json`;
      const { blobs } = await list({ prefix: path, limit: 5 });
      const hit = blobs.find(b => b.pathname === path); if (!hit) return null;
      const r = await fetch(hit.url + '?v=' + new Date(hit.uploadedAt).getTime()); return r.ok ? r.json() : null; // the timestamp keeps an edited story from being served stale
    },
    async put(slug, rec) {
      const { put } = await sdk();
      await put(`stories/${slug}.json`, JSON.stringify(rec), { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
    },
    async putImage(name, buf, type) {
      const { put } = await sdk();
      return (await put(`images/${name}`, buf, { access: 'public', contentType: type, addRandomSuffix: false, allowOverwrite: true })).url;
    },
  };
}

// no Blob token on Vercel means publishing is not set up: say so rather than pretending to save
export function getStore(env) {
  if (env.BLOB_READ_WRITE_TOKEN) return blobStore();
  if (env.VERCEL) return null;
  return localStore();
}
export const localAssetPath = rel => `${localDir}${rel}`;
