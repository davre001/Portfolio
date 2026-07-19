import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
const r = await p.evaluate(() => {
  const out = {};
  const mk = (c) => { const d = document.createElement('div'); d.className = c; document.body.appendChild(d); const s = getComputedStyle(d); const v = { display: s.display, width: s.width, height: s.height, padding: s.paddingTop+'/'+s.paddingRight, margin: s.marginTop, color: s.color, transform: s.textTransform, overflowY: s.overflowY, flexDir: s.flexDirection }; d.remove(); return v; };
  for (const c of ['w-[100vw]','lg:w-[30vw]','min-h-[600px]','flex-col','overflow-y-auto','text-white','uppercase','tracking-tighter','pt-32','pb-12','px-8','pt-8','gap-4','mt-8','sm:w-[50vw]']) out[c] = mk(c);
  return out;
});
console.log(JSON.stringify(r, null, 2));
await b.close();
