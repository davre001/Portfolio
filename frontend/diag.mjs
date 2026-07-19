import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = 'http://127.0.0.1:5173/';
const browsers = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
let exe;
for (const b of browsers) if (fs.existsSync(b)) { exe = b; break; }
if (!exe) { console.error('no browser'); process.exit(1); }

const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[console.${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack || ''}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()} :: ${r.failure()?.errorText}`));

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
} catch (e) {
  logs.push(`[goto error] ${e.message}`);
}
await page.waitForTimeout(1500);

const rootHtml = await page.evaluate(() => {
  const r = document.getElementById('root');
  return r ? r.innerHTML.slice(0, 500) : 'NO #root';
});
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));

console.log('==== CONSOLE / ERRORS ====');
console.log(logs.join('\n') || '(none)');
console.log('\n==== #root innerHTML (first 500) ====');
console.log(rootHtml);
console.log('\n==== body text (first 300) ====');
console.log(JSON.stringify(bodyText));

await browser.close();
