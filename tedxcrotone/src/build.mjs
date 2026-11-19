// Build completa: visual (SVG+PNG) -> HTML -> PDF -> PNG di controllo.  Uso: node src/build.mjs [--no-png]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, svgDoc, C } from './core.mjs';
import { kvCerchi, kvCentro, kvSud } from './keyvisual.mjs';
import { tavola } from './tavole.mjs';
import * as M from './mockups.mjs';
import { pages } from './template.mjs';
import { getBrowser, svgToPng, closeBrowser } from './render.mjs';

const c = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/content.json'), 'utf8'));
const OUT = path.join(ROOT, 'out'), VIS = path.join(OUT, 'visuals'), PG = path.join(OUT, 'pagine');
for (const d of [VIS, PG]) fs.mkdirSync(d, { recursive: true });
const skipPng = process.argv.includes('--no-png');

// 1. Visual
const A = {
  'key-visual': { w: 1920, h: 1080, body: kvCerchi({ w: 1920, h: 1080, R: 780, u: 1.7 }) },
  'key-visual-quadrato': { w: 1600, h: 1600, body: kvCerchi({ w: 1600, h: 1600, R: 1160, u: 2 }) },
  'key-visual-carta': { w: 1920, h: 1080, body: kvCerchi({ w: 1920, h: 1080, R: 780, u: 1.7, dark: false }) },
  'variante-il-centro': { w: 1920, h: 1080, body: kvCentro({ w: 1920, h: 1080, R: 480, u: 1.7 }) },
  'variante-sud-in-alto': { w: 1920, h: 1080, body: kvSud({ w: 1920, h: 1080, u: 1.7 }) },
};
c.mappe.voci.forEach((v) => {
  A[`tavola-${v.n}-${v.id}`] = { w: 900, h: 1200, body: tavola(v.id, { w: 900, h: 1200, cy: 540, R: 370, u: 1.5, frame: { n: v.n, titolo: v.titolo, evento: c.meta.evento, tema: c.meta.titolo } }) };
});
Object.assign(A, {
  'manifesto-nero': M.manifestoNero(c), 'manifesto-carta': M.manifestoCarta(c),
  'social-post': M.socialPost(c), 'social-storia': M.socialStoria(c), 'social-copertina': M.socialCopertina(c),
  'fondale-palco': M.fondale(c), 'badge-speaker': M.badge(c, 'speaker'), 'pass-staff': M.badge(c, 'staff'),
});
c.mappe.voci.forEach((v) => { A[`slide-${v.n}-${v.id}`] = M.slideSessione(c, v); });

for (const [name, a] of Object.entries(A)) {
  const p = path.join(VIS, `${name}.svg`);
  fs.writeFileSync(p, svgDoc({ ...a, standalone: true }));
  if (!skipPng) await svgToPng(p, p.replace('.svg', '.png'), { scale: a.w * a.h > 1.5e6 ? 1 : 2 });
}
if (!skipPng) {
  try { execFileSync('python3', [path.join(ROOT, 'src/quantize.py'), ...Object.keys(A).map((n) => path.join(VIS, `${n}.png`))]); }
  catch { console.log('nota: PNG non compressi (serve python3 con Pillow)'); }
}
console.log(`visual: ${Object.keys(A).length} SVG${skipPng ? '' : ' + PNG'}`);

// 2. Grana di pagina (tile PNG, una volta)
const b = await getBrowser();
for (const [k, v] of [['dark', 1], ['light', 0]]) {
  const p = path.join(OUT, `grain-${k}.png`);
  if (fs.existsSync(p)) continue;
  const pg = await b.newPage({ viewport: { width: 512, height: 512 } });
  await pg.setContent(`<body style="margin:0;background:transparent"><svg width="512" height="512"><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="57" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ${v} 0 0 0 0 ${v} 0 0 0 0 ${v} 0 0 0 -1.6 ${v ? 0.96 : 1.0}"/></filter><rect width="512" height="512" filter="url(#g)" opacity="0.45"/></svg></body>`);
  await pg.screenshot({ path: p, omitBackground: true });
  await pg.close();
}

// 3. HTML + PDF
const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${c.meta.evento} — ${c.meta.titolo}</title><style>${fs.readFileSync(path.join(ROOT, 'src/style.css'), 'utf8')}</style></head><body>${pages(c, A).join('\n')}</body></html>`;
const htmlPath = path.join(OUT, 'proposta.html');
fs.writeFileSync(htmlPath, html);
const pdfPath = path.join(OUT, 'TEDxCrotone-Nuova-umanita-proposta.pdf');
const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('file://' + htmlPath);
await page.evaluate(() => document.fonts.ready);
// controllo automatico: testo che esce dalla pagina o dai propri contenitori
const issues = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.page').forEach((pg, i) => {
    const pr = pg.getBoundingClientRect();
    pg.querySelectorAll('h1,h2,h3,p,dd,dt,li,.cap,.serif,.kicker,.sw').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      if (r.left < pr.left + 40 || r.right > pr.right - 40 || r.top < pr.top + 30 || r.bottom > pr.bottom - 30) out.push(`p${i + 1} fuori margine: ${el.textContent.slice(0, 40)}`);
      if (el.scrollWidth > el.clientWidth + 2) out.push(`p${i + 1} testo largo: ${el.textContent.slice(0, 40)}`);
    });
  });
  return out;
});
await page.pdf({ path: pdfPath, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
await page.close();
await closeBrowser();
console.log('pdf:', (fs.statSync(pdfPath).size / 1e6).toFixed(1) + ' MB');
console.log(issues.length ? 'ATTENZIONE:\n' + issues.join('\n') : 'controllo margini: ok');

// 4. PNG di controllo dal PDF
for (const f of fs.readdirSync(PG)) fs.unlinkSync(path.join(PG, f));
execFileSync('pdftoppm', ['-png', '-r', '72', pdfPath, path.join(PG, 'pagina')]);
console.log('pagine:', fs.readdirSync(PG).length);
