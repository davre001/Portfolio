import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:4317/';
const out1 = 'C:\\Users\\USER\\AppData\\Local\\Temp\\nav-default.png';
const out2 = 'C:\\Users\\USER\\AppData\\Local\\Temp\\nav-hover.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(URL, { waitUntil: 'networkidle' });

// default
await page.screenshot({ path: out1 });

const card = page.locator('.nav__menu-card');
const before = await card.evaluate((el) => {
  const s = getComputedStyle(el);
  return { opacity: s.opacity, pointerEvents: s.pointerEvents, visibility: s.visibility };
});

// hover the dots
await page.locator('.nav__boxes').hover();
await page.waitForTimeout(400);
await page.screenshot({ path: out2 });

const after = await card.evaluate((el) => {
  const s = getComputedStyle(el);
  const items = [...el.querySelectorAll('.nav__menu-item')].map((i) => ({
    text: i.textContent.trim(),
    bg: getComputedStyle(i).backgroundColor,
  }));
  // last item should have no bottom border; others should
  const borders = [...el.querySelectorAll('.nav__menu-item')].map(
    (i) => getComputedStyle(i).borderBottomWidth
  );
  return { opacity: s.opacity, pointerEvents: s.pointerEvents, items, borders };
});

console.log('BEFORE hover:', JSON.stringify(before));
console.log('AFTER  hover:', JSON.stringify(after, null, 2));

await browser.close();
