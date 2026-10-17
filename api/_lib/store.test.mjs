// node api/_lib/store.test.mjs
// Checks the Blob store's read and write paths against an in-memory stand-in for Vercel Blob (no network, no token):
// reads never call list(), the address is learned when the guess is wrong, and a writer always sees the newest index.
import assert from 'node:assert/strict';
import { blobStore } from './store.js';

class BlobNotFoundError extends Error {}
const REAL = 'https://realstore1.public.blob.vercel-storage.com/';

function fakeStore() {
  const files = new Map(), calls = { list: 0, head: 0, put: 0, fetch: 0 }, edge = new Map(); // edge: a stale cache of what was first fetched
  const sdk = async () => ({
    BlobNotFoundError,
    async put(path, body, opts) { calls.put++; files.set(path, { body: String(body), at: Date.now() + calls.put }); return { url: REAL + path, pathname: path, opts }; },
    async head(path) { calls.head++; const f = files.get(path); if (!f) throw new BlobNotFoundError('not found'); return { url: REAL + path, uploadedAt: new Date(f.at) }; },
    async list() { calls.list++; return { blobs: [] }; },
    async del(urls) { calls.del = (calls.del || []).concat(urls); for (const u of [].concat(urls)) files.delete(new URL(u).pathname.slice(1)); },
  });
  globalThis.fetch = async url => {
    calls.fetch++; const u = new URL(url); if (u.origin + '/' !== REAL) throw new Error('getaddrinfo ENOTFOUND');
    const path = u.pathname.slice(1), f = files.get(path); if (!f) return { ok: false, status: 404 };
    if (!u.search) { if (!edge.has(path)) edge.set(path, f.body); return { ok: true, status: 200, json: async () => JSON.parse(edge.get(path)) }; } // cached copy
    return { ok: true, status: 200, json: async () => JSON.parse(f.body) };                                                                              // versioned: fresh
  };
  return { sdk, calls, files };
}
const meta = (slug, t) => ({ slug, title: slug, createdAt: new Date(t).toISOString() });

// 1. a wrong guess at the address is recovered from, and reads never list
{
  const { sdk, calls } = fakeStore();
  const st = blobStore({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_WRONGID_secret' }, sdk);
  assert.equal(await st.get('nope'), null);
  await st.put('a', { slug: 'a', bundle: { x: 1 } }, meta('a', 1000));
  assert.deepEqual((await st.get('a')).bundle, { x: 1 });
  assert.equal(calls.list, 0, 'a read must not list');
}
// 2. a correct guess needs no store call at all
{
  const { sdk, calls } = fakeStore();
  const st = blobStore({ BLOB_STORE_ID: 'store_realstore1' }, sdk);
  await st.put('a', { slug: 'a' }, meta('a', 1000)); const head0 = calls.head;
  await st.get('a'); await st.get('a');
  assert.equal(calls.head, head0, 'a confirmed address is read directly');
  assert.equal(calls.list, 0);
}
// 3. the index keeps the newest first, replaces a story that is published again, and a second writer does not lose the first one's entry
{
 const { sdk, calls, files } = fakeStore();
  const st = blobStore({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_realstore1_secret' }, sdk);
  await st.put('a', { slug: 'a' }, meta('a', 1000));
  await st.list();                                     // this caches the index at the edge, as a visitor would
  await st.put('b', { slug: 'b' }, meta('b', 2000));   // the writer must read the newest index, not the cached one
  await st.put('a', { slug: 'a', v: 2 }, meta('a', 1000));
  const rows = JSON.parse(files.get('index.json').body); // what is stored (a reader may still see the cached copy for up to a minute)
  assert.deepEqual(rows.map(r => r.slug), ['b', 'a']);
  assert.equal((await st.list(1)).length, 1);
  assert.equal(calls.list, 0);
}
// 4. a story that does not exist is simply null, with the address confirmed
{
  const { sdk } = fakeStore();
  const st = blobStore({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_realstore1_secret' }, sdk);
  await st.put('a', { slug: 'a' }, meta('a', 1));
  assert.equal(await st.get('missing'), null);
}
// 5. asking again for something that is not there does not touch the store again; publishing it clears that
{
  const { sdk, calls, files } = fakeStore();
  const st = blobStore({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_realstore1_secret' }, sdk);
  assert.equal(await st.get('ghost'), null); const before = calls.head + calls.fetch;
  assert.equal(await st.get('ghost'), null); assert.equal(await st.get('ghost'), null);
  assert.equal(calls.head + calls.fetch, before, 'a repeat miss is remembered');
  await st.put('ghost', { slug: 'ghost', bundle: 1 }, meta('ghost', 5));
  assert.equal((await st.get('ghost')).bundle, 1, 'once published it is found');
  assert.ok(files.has('index.json'));
}
// 6. taking a story down removes its file, its listing and only its own pictures
{
  const { sdk, calls, files } = fakeStore();
  const st = blobStore({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_realstore1_secret' }, sdk);
  await st.put('keep', { slug: 'keep' }, meta('keep', 1)); await st.put('gone', { slug: 'gone' }, meta('gone', 2));
  await st.remove('gone', { cardUrl: REAL + 'images/gone-card-1.jpg', coverUrl: REAL + 'images/keep-cover-9.jpg', bundle: { style: { seed: REAL + 'images/gone-bg-2.jpeg' } } });
  assert.ok(calls.del.includes(REAL + 'stories/gone.json') && calls.del.includes(REAL + 'images/gone-card-1.jpg') && calls.del.includes(REAL + 'images/gone-bg-2.jpeg'));
  assert.ok(!calls.del.includes(REAL + 'images/keep-cover-9.jpg'), 'another story\'s picture is never deleted');
  assert.deepEqual(JSON.parse(files.get('index.json').body).map(m => m.slug), ['keep']);
  assert.equal(await st.get('gone'), null);
}
console.log('store tests passed');
