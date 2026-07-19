import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
const r = await p.evaluate(() => {
  const out = {};
  for (const c of ['pt-4','pt-8','pt-16','pt-32','pt-40','pb-12','p-8','px-8']) {
    const d = document.createElement('div'); d.className = c; document.body.appendChild(d);
    const s = getComputedStyle(d);
    out[c] = s.paddingTop + ' / ' + s.paddingRight + ' / ' + s.paddingBottom;
    d.remove();
  }
  return out;
});
console.log(JSON.stringify(r, null, 2));
await b.close();
