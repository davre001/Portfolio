import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:4317/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/home.png' });
try {
  await page.locator('.nav__boxes').hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/nav-menu.png' });
} catch (e) { console.log('hover failed', e.message); }
const fonts = await page.evaluate(() => {
  const h = document.querySelector('h1, h2, h3, .about__title');
  const nav = document.querySelector('.nav__btn, .nav__menu-item');
  const cs = (el) => el ? getComputedStyle(el).fontFamily : 'NONE';
  return { heading: cs(h), nav: cs(nav) };
});
console.log('FONTS', JSON.stringify(fonts));
await browser.close();
