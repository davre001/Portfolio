import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5176/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.locator('.nav__menu-toggle').click();
await page.waitForTimeout(1800);
await page.screenshot({ path: 'shots/menu-final.png' });
// mid-slide shot to see the red trails
await browser.close();
console.log('captured shots/menu-final.png');
