// The effects lab: a minor editor for the effects library. Choose an image, choose an effect, tune it, save a PNG or copy the settings.
import { createFx, EFFECTS, effectById, defaultsOf } from './fx/fx.js';
import { SEEDS, loadSeed, loadImage } from './fx/seeds.js';

const $ = id => document.getElementById(id);
const msg = (text, ok) => { const m = $('msg'); m.textContent = text || ''; m.classList.toggle('ok', !!ok); };
let fx;
try { fx = createFx($('cv')); } catch (e) { msg('This browser cannot run WebGL, so the lab cannot draw.'); throw e; }

const state = { seed: SEEDS[0].id, effect: EFFECTS[0].id };

function chips(container, items, current, onPick) {
  container.replaceChildren(...items.map(it => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = it.name; b.setAttribute('aria-pressed', String(it.id === current));
    b.addEventListener('click', () => onPick(it.id)); return b;
  }));
}
const paintSeeds = () => chips($('seeds'), SEEDS, state.seed, id => pickSeed(id));
const paintEffects = () => chips($('effects'), EFFECTS, state.effect, id => pickEffect(id));

async function pickSeed(spec, label) {
  msg('');
  try { fx.setImage(await loadSeed(spec)); state.seed = label ? 'upload:' + label : spec; paintSeeds(); }
  catch (e) { msg(e.message); }
}

function pickEffect(id) {
  fx.setEffect(id); state.effect = id; paintEffects(); buildControls(); showJson();
}

function buildControls() {
  const effect = effectById(state.effect), values = fx.values;
  $('controls').replaceChildren(...effect.params.map(p => {
    const wrap = document.createElement('div'); wrap.className = 'ctl';
    const label = document.createElement('label'); label.textContent = p.label; label.htmlFor = 'p_' + p.id;
    const input = document.createElement('input'); input.id = 'p_' + p.id;
    const out = document.createElement('output');
    if (p.type === 'color') { input.type = 'color'; input.value = values[p.id]; out.textContent = values[p.id]; }
    else { input.type = 'range'; input.min = p.min; input.max = p.max; input.step = p.step; input.value = values[p.id]; out.textContent = values[p.id]; }
    input.addEventListener('input', () => { fx.setParam(p.id, input.value); out.textContent = input.value; showJson(); });
    wrap.append(label, out, input); return wrap;
  }));
}

const settings = () => ({ type: 'fx', effect: state.effect, seed: state.seed, params: fx.values });
const showJson = () => { const pre = $('json'); pre.hidden = false; pre.textContent = JSON.stringify(settings(), null, 2); };

// ---- using a file from any route: the picker, drag and drop, or paste
const MAX_SIDE = 2048; // phone photos are huge; the effects do not need more, and some GPUs cannot take a bigger texture
async function decode(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* older browsers: try without options, then an <img> */ }
  try { return await createImageBitmap(file); } catch { /* fall through */ }
  const url = URL.createObjectURL(file);
  try { return await loadImage(url, { crossOrigin: false }); } finally { URL.revokeObjectURL(url); }
}
async function useFile(file) {
  if (!file) return;
  const heic = /hei[cf]/i.test(file.type + ' ' + file.name);
  msg(`Reading ${file.name}…`);
  try {
    const src = await decode(file);
    const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight, k = Math.min(1, MAX_SIDE / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); src.close?.();
    fx.setImage(c); state.seed = 'upload:' + file.name; paintSeeds(); showJson();
    msg(`Using ${file.name} (${w}×${h}${k < 1 ? `, reduced to ${c.width}×${c.height}` : ''}).`, true);
  } catch {
    msg(heic ? 'This browser cannot open HEIC photos. Export it as a JPEG or PNG and try again.'
             : `Could not read ${file.name || 'that file'}${file.type ? ' (' + file.type + ')' : ''} as an image. Try a PNG, JPEG or WebP.`);
  }
}
$('pick').addEventListener('click', () => { const f = $('file'); try { f.showPicker ? f.showPicker() : f.click(); } catch { f.click(); } });
$('file').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; useFile(f); });
const imageIn = list => [...(list || [])].find(f => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|bmp|heic|heif)$/i.test(f.name));
let dragDepth = 0;
addEventListener('dragenter', e => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { dragDepth++; document.body.classList.add('drop'); } });
addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; document.body.classList.remove('drop'); } });
addEventListener('dragover', e => e.preventDefault());
addEventListener('drop', e => { e.preventDefault(); dragDepth = 0; document.body.classList.remove('drop'); useFile(imageIn(e.dataTransfer?.files)); });
addEventListener('paste', e => { const f = imageIn(e.clipboardData?.files); if (f) { e.preventDefault(); useFile(f); } });
$('load').addEventListener('click', async () => {
  const url = $('url').value.trim(); if (!url) return;
  msg('Loading…');
  try { fx.setImage(await loadImage(url)); state.seed = url; paintSeeds(); showJson(); msg(''); }
  catch { msg('That address could not be used. Many sites do not let other pages use their images: save the image and upload it instead.'); }
});
$('reset').addEventListener('click', () => { fx.setEffect(state.effect); buildControls(); showJson(); });
$('motion').addEventListener('click', e => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.textContent = on ? 'Motion on' : 'Motion off';
  on ? fx.start() : fx.stop();
});
$('png').addEventListener('click', () => {
  const a = document.createElement('a'); a.href = fx.snapshot(1080, 1920); a.download = `${state.effect}.png`; a.click();
});
$('copy').addEventListener('click', async () => {
  showJson();
  try { await navigator.clipboard.writeText(JSON.stringify(settings(), null, 2)); msg('Settings copied.'); } catch { msg('Copy is blocked here; the settings are shown below.'); }
});

await pickSeed(state.seed);
paintSeeds(); pickEffect(state.effect);
fx.start();
