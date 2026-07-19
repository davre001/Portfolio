import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR: '+String(e)));
await p.goto('http://127.0.0.1:5173/tutorials', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
console.log('title:', JSON.stringify(await p.textContent('.tutorials__title').catch(()=>'ERR')));
console.log('tagline:', JSON.stringify(await p.textContent('.tutorials__tagline').catch(()=>'ERR')));
console.log('eyebrow dot present:', await p.$('.tutorials__eyebrow-dot')?'YES(bad)':'no');
const hot = await p.$eval('.tutorials__title-hot', el => {
  const s = getComputedStyle(el);
  return { fontStyle: s.fontStyle, fontFamily: s.fontFamily.slice(0,30), text: el.textContent };
}).catch(e=>String(e));
console.log('cooking span:', JSON.stringify(hot));
const size = await p.$eval('.tutorials__title', el => getComputedStyle(el).fontSize).catch(()=>'ERR');
console.log('title font-size:', size);
// screenshot via CDP to avoid font-wait hang
const buf = await p.screenshot({ path: 'shots/tut-coming.png', timeout: 12000, caret: 'hide' }).then(()=>'ok').catch(e=>'shot-fail: '+e.message);
console.log('screenshot:', buf);
console.log('errors:', errs.slice(0,6));
await b.close();
