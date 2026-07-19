import { chromium } from 'playwright';

async function findBase() {
  for (const port of [5173, 5174, 5175, 5176]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      const html = await res.text();
      // Only accept a server actually serving THIS app (has our root div + main.tsx)
      if (html.includes('/src/main.tsx')) return `http://127.0.0.1:${port}`;
    } catch {}
  }
  throw new Error('no dev server found');
}

const BASE = process.env.BASE || (await findBase());
console.log('using', BASE);

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

const items = [
  { label: 'OUTERSPACE', path: '/outerspace', title: 'Outerspace' },
  { label: 'AI STUDIO', path: '/ai-studio', title: 'AI Studio' },
  { label: 'TUTORIALS', path: '/tutorials', title: 'Tutorials' },
];

for (const it of items) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.locator('.nav__menu-toggle').click();
  await page.waitForTimeout(1500);
  await page.locator('.sm-panel-itemLabel', { hasText: it.label }).click();
  await page.waitForTimeout(700);
  const path = new URL(page.url()).pathname;
  const heading = await page.locator('.coming-soon__title').innerText().catch(() => '(none)');
  const badge = await page.locator('.coming-soon__badge').innerText().catch(() => '(none)');
  console.log(`click ${it.label}: pathname=${path} (want ${it.path}) | heading="${heading}" | badge="${badge}"`);
  await page.screenshot({ path: `shots/page-${it.path.slice(1)}.png` });

  // Back link returns home
  await page.locator('.coming-soon__back').click();
  await page.waitForTimeout(600);
  const backPath = new URL(page.url()).pathname;
  const heroVisible = await page.locator('.hero').isVisible().catch(() => false);
  console.log(`  back → pathname=${backPath} | heroVisible=${heroVisible}`);
}

// Direct-load a route (dev server serves index for any path) + browser back/forward
await page.goto(BASE + '/tutorials', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
console.log('direct /tutorials heading =', await page.locator('.coming-soon__title').innerText().catch(() => '(none)'));

// Existing project route still works
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const firstTile = page.locator('.htile').first();
await firstTile.click();
await page.waitForTimeout(700);
console.log('project route pathname =', new URL(page.url()).pathname, '| detail visible =', await page.locator('.detail').isVisible().catch(() => false));

console.log('ERRORS=', errors.length ? JSON.stringify(errors, null, 2) : 'none');
await browser.close();
