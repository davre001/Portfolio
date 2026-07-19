import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
const r = await p.evaluate(() => {
  const found = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules) {
      const sel = rule.selectorText || '';
      if (/pt-8|padding-top|\.right-8|padding/.test(sel)) found.push(sel + ' { ' + (rule.style ? rule.style.cssText.slice(0,60) : '') + ' }');
    }
  }
  return found.slice(0, 30);
});
console.log(JSON.stringify(r, null, 2));
await b.close();
