import puppeteer from 'puppeteer-core'; import { pathToFileURL } from 'url';
const br = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] });
const pg = await br.newPage(); pg.on('pageerror', e => { console.error(e.message); process.exit(1) });
await pg.goto(pathToFileURL('piece.html').href + '?render=1&nograin'); await pg.waitForFunction('window.READY===true');
const r = await pg.evaluate(() => {
  const px = f => { render(f); return X.getImageData(0, 0, W, H).data };
  const d = (a, b) => { let s = 0, n = 0; for (let i = 0; i < a.length; i += 4 * 7) { s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n++ } return +(s / n / 3).toFixed(3) };
  const f0 = px(0), f1 = px(1), f449 = px(449), f450 = px(450), f225 = px(225);
  return { wrap_0_vs_450: d(f0, f450), step_449_to_450: d(f449, f450), step_0_to_1: d(f0, f1), half_0_vs_225: d(f0, f225) };
});
console.log(r); await br.close();
