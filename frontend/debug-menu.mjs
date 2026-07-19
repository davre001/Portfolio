import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.locator('.nav__menu-toggle').click();
await page.waitForTimeout(1600);
const info = await page.evaluate(() => {
  const panel = document.querySelector('.staggered-menu-panel');
  const root = getComputedStyle(document.documentElement).getPropertyValue('--spacing');
  const rules = [];
  for (const sheet of document.styleSheets) {
    let r;
    try { r = sheet.cssRules; } catch { continue; }
    for (const rule of r) {
      if (rule.selectorText && /pt-32|padding-top/.test(rule.selectorText)) {
        rules.push(rule.cssText.slice(0, 120));
      }
    }
  }
  // Does .pt-32 match any rule at all?
  const dummy = document.createElement('div');
  dummy.className = 'pt-32';
  document.body.appendChild(dummy);
  const dummyPad = getComputedStyle(dummy).paddingTop;
  dummy.remove();
  return { spacingVar: root, pt32rules: rules, dummyPt32: dummyPad, panelPadTop: getComputedStyle(panel).paddingTop };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
