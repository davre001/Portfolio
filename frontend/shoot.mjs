import { chromium } from 'playwright';

const URL = process.env.URL || 'http://127.0.0.1:4599/';
const OUT = process.env.OUT || 'shots';

const browsers = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const fs = await import('node:fs');
fs.mkdirSync(OUT, { recursive: true });

let exe;
for (const b of browsers) if (fs.existsSync(b)) { exe = b; break; }
if (!exe) { console.error('no browser'); process.exit(1); }

const browser = await chromium.launch({
  executablePath: exe,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(2000);

// Default (no pointer interaction) desktop
await page.screenshot({ path: `${OUT}/desktop-hero.png` });

// Move pointer into hero to trigger the spotlight
const cdp = await ctx.newCDPSession(page);
async function move(x, y) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await page.waitForTimeout(450);
}
await move(640, 360);
await move(520, 300);
await page.screenshot({ path: `${OUT}/desktop-spotlight.png` });

// Scroll to work section
await page.evaluate(() => document.getElementById('work')?.scrollIntoView());
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/desktop-work.png` });

await page.evaluate(() => document.getElementById('capabilities')?.scrollIntoView());
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/desktop-caps.png` });

await page.evaluate(() => document.getElementById('contact')?.scrollIntoView());
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/desktop-contact.png` });

// Full page
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/desktop-full.png`, fullPage: true });

// Mobile viewport
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const m = await mctx.newPage();
await m.goto(URL, { waitUntil: 'load' });
await m.waitForTimeout(2000);
await m.screenshot({ path: `${OUT}/mobile-hero.png` });
await m.evaluate(() => document.getElementById('work')?.scrollIntoView());
await m.waitForTimeout(800);
await m.screenshot({ path: `${OUT}/mobile-work.png` });

await browser.close();
console.log('done');
