import { chromium } from 'playwright';
const b = await chromium.launch();

// --- Mobile: tap toggles card, no anchor jump ---
const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await m.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await m.waitForTimeout(3000);
const cardVisible = () => m.evaluate(() => {
  const c = document.querySelector('.nav__about-card');
  const s = getComputedStyle(c);
  return { opacity: s.opacity, events: s.pointerEvents };
});
console.log('mobile before tap:', JSON.stringify(await cardVisible()), 'scrollY:', await m.evaluate(() => window.scrollY));
await m.locator('.nav__about > a').tap();
await m.waitForTimeout(500);
const afterTap = await cardVisible();
const scrollY = await m.evaluate(() => window.scrollY);
const hash = await m.evaluate(() => location.hash);
console.log('mobile after tap:', JSON.stringify(afterTap), 'scrollY:', scrollY, 'hash:', JSON.stringify(hash));
console.log(afterTap.opacity === '1' ? 'CARD SHOWN ✓' : 'CARD NOT SHOWN ✗', scrollY === 0 && hash === '' ? 'NO JUMP ✓' : 'PAGE JUMPED ✗');
await m.screenshot({ path: 'shots/about-mobile.png' });
// tap outside → closes (empty header space between About and the logo, not a link)
await m.touchscreen.tap(110, 30);
await m.waitForTimeout(500);
const afterOutside = await cardVisible();
console.log('after outside tap:', JSON.stringify(afterOutside), afterOutside.opacity === '0' ? 'CLOSES ✓' : 'STUCK OPEN ✗');
// tap About again → opens, second tap on About → closes
await m.locator('.nav__about > a').tap();
await m.waitForTimeout(600);
const o1 = parseFloat((await cardVisible()).opacity);
await m.locator('.nav__about > a').tap();
await m.waitForTimeout(600);
const o2 = parseFloat((await cardVisible()).opacity);
console.log('toggle open/close:', o1, '->', o2, o1 > 0.9 && o2 < 0.1 ? 'TOGGLE WORKS ✓' : 'TOGGLE BROKEN ✗');
await m.close();

// --- Desktop: hover still reveals, click still anchors to #about ---
const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await d.waitForTimeout(3000);
await d.locator('.nav__about > a').hover();
await d.waitForTimeout(900);
const hov = await d.evaluate(() => getComputedStyle(document.querySelector('.nav__about-card')).opacity);
console.log('desktop hover opacity:', hov, hov === '1' ? 'HOVER WORKS ✓' : 'HOVER BROKEN ✗');
await d.locator('.nav__about > a').click();
await d.waitForTimeout(800);
const dHash = await d.evaluate(() => location.hash);
const dScroll = await d.evaluate(() => window.scrollY);
console.log('desktop click hash:', dHash, 'scrollY:', dScroll, dHash === '#about' ? 'ANCHOR NAV KEPT ✓' : 'ANCHOR BROKEN ✗');
await d.close();
await b.close();
