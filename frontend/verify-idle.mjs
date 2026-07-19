import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:5174/';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);

await page.locator('.nav__menu-toggle').click();
await page.waitForTimeout(1600);

const tw = await page.locator('.mprev__type-text').evaluate((el) => ({
  scrollWidth: el.scrollWidth,
  cssVar: getComputedStyle(el).getPropertyValue('--tw'),
  text: el.textContent,
}));
console.log('typewriter measure =', JSON.stringify(tw));
console.log('idle data-scene =', await page.locator('.mprev').getAttribute('data-scene'));

// Capture the idle screen across the typewriter cycle
for (let i = 0; i < 4; i++) {
  await page.screenshot({ path: `shots/idle-t${i}.png` });
  await page.waitForTimeout(1500);
}

console.log('ERRORS=', errors.length ? JSON.stringify(errors, null, 2) : 'none');
await browser.close();
