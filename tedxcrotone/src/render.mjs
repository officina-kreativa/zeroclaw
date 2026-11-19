// Rasterizza SVG/HTML in PNG con Chromium (Playwright).
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/opt/node-tools/node_modules/');
let browser;
export async function getBrowser() {
  if (!browser) { const { chromium } = require('playwright'); browser = await chromium.launch(); }
  return browser;
}
export async function svgToPng(svgPath, pngPath, { scale = 2 } = {}) {
  const b = await getBrowser();
  const svg = fs.readFileSync(svgPath, 'utf8');
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const page = await b.newPage({ viewport: { width: Math.ceil(+m[1]), height: Math.ceil(+m[2]) }, deviceScaleFactor: scale });
  await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: pngPath });
  await page.close();
}
export async function closeBrowser() { if (browser) await browser.close(); browser = null; }
