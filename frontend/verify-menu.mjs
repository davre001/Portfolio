import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Nav layout sanity
const brand = await page.locator('.nav__brand').first().boundingBox();
const about = await page.locator('.nav__about').first().boundingBox();
const menuBtn = await page.locator('.nav__menu-toggle').first().boundingBox();
console.log('brand.x=', Math.round(brand?.x ?? -1), 'about.x=', Math.round(about?.x ?? -1), 'menu.x=', Math.round(menuBtn?.x ?? -1));

await page.screenshot({ path: 'shots/menu-closed.png' });

// Open the staggered menu
await page.locator('.nav__menu-toggle').click();
await page.waitForTimeout(1600); // let the staggered entrance finish

const panelVisible = await page.locator('.staggered-menu-panel').isVisible();
const labels = await page.locator('.sm-panel-itemLabel').allInnerTexts();
const transform = await page.locator('.staggered-menu-panel').evaluate((el) => getComputedStyle(el).transform);
console.log('panelVisible=', panelVisible);
console.log('labels=', JSON.stringify(labels));
console.log('panelTransform=', transform);

await page.screenshot({ path: 'shots/menu-open.png' });

// Close via the X
await page.locator('.sm-close').click();
await page.waitForTimeout(900);
const panelAfterClose = await page.locator('.staggered-menu-panel').evaluate((el) => getComputedStyle(el).transform);
console.log('panelTransformAfterClose=', panelAfterClose);

console.log('ERRORS=', errors.length ? JSON.stringify(errors, null, 2) : 'none');
await browser.close();
