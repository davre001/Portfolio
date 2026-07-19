import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
const r = await p.evaluate(() => {
  const out = {};
  const test = (c, prop) => {
    const d = document.createElement('div'); d.className = c; document.body.appendChild(d);
    const v = prop ? getComputedStyle(d)[prop] : (getComputedStyle(d).display + '|' + getComputedStyle(d).paddingTop + '|' + getComputedStyle(d).gap);
    d.remove(); return v;
  };
  out.flex = test('flex');
  out.grid = test('grid');
  out.block = test('block');
  out['gap-4'] = test('gap-4');
  out['pt-8'] = test('pt-8');
  out['mt-4'] = test('mt-4');
  out['w-10'] = test('w-10');
  out['h-10'] = test('h-10');
  out['rounded-full'] = test('rounded-full');
  out['text-4xl'] = test('text-4xl');
  return out;
});
console.log(JSON.stringify(r, null, 2));
await b.close();
