import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

const BASE = process.env.BASE || 'http://127.0.0.1:5174/';
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Open the staggered menu
await page.locator('.nav__menu-toggle').click();
await page.waitForTimeout(1600);

const monitorPresent = await page.locator('.mprev__frame').count();
console.log('monitor present =', monitorPresent);

// Idle channel
await page.waitForTimeout(400);
const idleScene = await page.locator('.mprev').getAttribute('data-scene');
console.log('idle data-scene =', idleScene);
await page.screenshot({ path: 'shots/preview-idle.png' });

// Hover each item and capture the scene
const items = [
  { label: 'OUTERSPACE', file: 'preview-space.png', scene: 'space' },
  { label: 'AI STUDIO', file: 'preview-ai.png', scene: 'ai' },
  { label: 'TUTORIALS', file: 'preview-tutorials.png', scene: 'tutorials' },
];

for (const it of items) {
  await page.locator('.sm-panel-itemLabel', { hasText: it.label }).hover();
  await page.waitForTimeout(900); // let the crossfade + animation settle
  const scene = await page.locator('.mprev').getAttribute('data-scene');
  const caption = await page.locator('.mprev__caption').innerText();
  const chan = await page.locator('.mprev__chan').innerText();
  const tc = await page.locator('.mprev__tc').innerText();
  // arrow opacity on the hovered item's row
  const arrowOpacity = await page
    .locator('a.group', { has: page.locator('.sm-panel-itemLabel', { hasText: it.label }) })
    .locator('.sm-arrow')
    .evaluate((el) => getComputedStyle(el).opacity);
  console.log(`${it.label}: data-scene=${scene} (want ${it.scene}) | chan="${chan}" | caption="${caption}" | tc=${tc} | arrowOpacity=${arrowOpacity}`);
  await page.screenshot({ path: 'shots/' + it.file });
}

// Move away → back to idle
await page.locator('.staggered-menu-panel').hover({ position: { x: 20, y: 20 } });
await page.waitForTimeout(700);
console.log('after-leave data-scene =', await page.locator('.mprev').getAttribute('data-scene'));

console.log('ERRORS=', errors.length ? JSON.stringify(errors, null, 2) : 'none');
await browser.close();
