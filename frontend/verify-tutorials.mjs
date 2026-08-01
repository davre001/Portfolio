import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
await p.goto('http://127.0.0.1:5173/tutorials', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);

console.log('font loaded:', await p.evaluate(() => document.fonts.check("100px 'Roboto Flex'")));
console.log('resolved family:', await p.$eval('.text-pressure-title', el => getComputedStyle(el).fontFamily));
console.log('headline text:', JSON.stringify(await p.$eval('.text-pressure-title', el => el.textContent)));

// move cursor to the left of the headline, let the easing settle, sample axes
const read = () => p.$$eval('.text-pressure-title span', ns => ns.map(n => n.style.fontVariationSettings));
await p.mouse.move(380, 300);
await p.waitForTimeout(1200);
const left = await read();
await p.mouse.move(900, 300);
await p.waitForTimeout(1200);
const right = await read();
console.log('axes @left  :', left.slice(0, 3));
console.log('axes @right :', right.slice(0, 3));
console.log('axes changed:', JSON.stringify(left) !== JSON.stringify(right));

// does the injected flex rule leak onto Tailwind .flex elements?
console.log('stray global .flex rule:', await p.evaluate(() => {
  const d = document.createElement('div');
  d.className = 'flex';
  document.body.appendChild(d);
  const jc = getComputedStyle(d).justifyContent;
  d.remove();
  return jc;
}));

await p.mouse.move(640, 300);
await p.waitForTimeout(900);
await p.screenshot({ path: 'shots/tut-glass.png', timeout: 15000, caret: 'hide' }).then(() => console.log('shot ok')).catch(e => console.log('shot fail', e.message));
await p.setViewportSize({ width: 420, height: 880 });
await p.waitForTimeout(900);
await p.screenshot({ path: 'shots/tut-glass-mobile.png', timeout: 15000 }).catch(() => {});
console.log('errors:', errs.slice(0, 6));
await b.close();
