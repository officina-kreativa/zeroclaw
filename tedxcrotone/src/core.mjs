// Nucleo condiviso: palette, seed, dati cartografici, maschera terra/mare, grana, wrapper SVG.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { geoPath, geoEquirectangular, geoAzimuthalEquidistant } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { createNoise2D } from 'simplex-noise';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const C = { black: '#0B0B0C', paper: '#F3EFE6', red: '#E62B1E', graphite: '#8A867C' };
export const CROTONE = [17.12, 39.08]; // lon, lat
export const SEED = 1710;
export const KM = 1 / 6371; // km -> radianti

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const noise2 = (seed) => createNoise2D(rng(seed));
export const f = (n, d = 1) => +n.toFixed(d);

const topo = (name) => require(`world-atlas/${name}.json`);
const cache = {};
export function land(res = '50m') {
  return (cache['l' + res] ??= feature(topo(`land-${res}`), topo(`land-${res}`).objects.land));
}
export function borders(res = '50m') {
  const t = topo(`countries-${res}`);
  return (cache['b' + res] ??= mesh(t, t.objects.countries, (a, b) => a !== b));
}
export function countries(res = '110m') {
  const t = topo(`countries-${res}`);
  return (cache['c' + res] ??= feature(t, t.objects.countries));
}

// Proiezione azimutale equidistante centrata su Crotone.
// R = raggio in px corrispondente a kmMax (20015 km = antipodo).
export function azimuthal({ cx, cy, R, kmMax = 20015, center = CROTONE, roll = 0, clipKm = null }) {
  const scale = R / (kmMax * KM);
  const p = geoAzimuthalEquidistant()
    .rotate([-center[0], -center[1], roll])
    .scale(scale)
    .translate([cx, cy])
    .precision(0.2);
  const clip = clipKm ?? Math.min(kmMax * 1.6, 20015 - 20);
  p.clipAngle(Math.min(179.9, (clip * KM * 180) / Math.PI));
  p.kmToPx = (km) => km * KM * scale;
  return p;
}

// Maschera raster terra/mare in equirettangolare (scanline pari-dispari sui poligoni Natural Earth).
export function landMask(w = 3600) {
  if (cache['m' + w]) return cache['m' + w];
  const h = w / 2;
  const proj = geoEquirectangular().scale(w / (2 * Math.PI)).translate([w / 2, h / 2]);
  const polys = []; let cur = null;
  const ctx = {
    beginPath() {}, moveTo(x, y) { cur = [[x, y]]; polys.push(cur); },
    lineTo(x, y) { cur.push([x, y]); }, closePath() {}, arc() {},
  };
  geoPath(proj, ctx)(land('50m'));
  const rows = Array.from({ length: h }, () => []);
  for (const p of polys) {
    for (let i = 0; i < p.length; i++) {
      const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length];
      if (y1 === y2) continue;
      const ya = Math.min(y1, y2), yb = Math.max(y1, y2);
      for (let r = Math.max(0, Math.ceil(ya - 0.5)); r <= Math.min(h - 1, Math.floor(yb - 0.5)); r++) {
        const yy = r + 0.5;
        if (yy >= ya && yy < yb) rows[r].push(x1 + ((yy - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
  }
  const data = new Uint8Array(w * h);
  rows.forEach((xs, r) => {
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.max(0, Math.ceil(xs[i] - 0.5)); x <= Math.min(w - 1, Math.floor(xs[i + 1] - 0.5)); x++) data[r * w + x] = 1;
    }
  });
  const isLand = (lon, lat) => {
    const x = Math.floor(((lon + 180) / 360) * w), y = Math.floor(((90 - lat) / 180) * h);
    return data[Math.min(h - 1, Math.max(0, y)) * w + ((x % w) + w) % w] === 1;
  };
  return (cache['m' + w] = isLand);
}

// Grana carta: rumore frattale a bassa opacità.
export function grain(id, dark, w, h, strength = 1) {
  const a = (dark ? 0.16 : 0.2) * strength;
  const v = dark ? 1 : 0;
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${SEED % 97}" result="n"/>
<feColorMatrix in="n" type="matrix" values="0 0 0 0 ${v}  0 0 0 0 ${v}  0 0 0 0 ${v}  0 0 0 ${-1.6 * 1} ${0.8 + a}"/>
</filter>`;
}
export const grainRect = (id, w, h, dark) =>
  `<rect class="grain" width="${w}" height="${h}" filter="url(#${id})" opacity="${dark ? 0.2 : 0.22}" style="pointer-events:none"/>`;

let fontCss = null;
export function embeddedFonts() {
  if (fontCss) return fontCss;
  const b64 = (p) => fs.readFileSync(require.resolve(p)).toString('base64');
  const face = (fam, w, style, p) =>
    `@font-face{font-family:'${fam}';font-weight:${w};font-style:${style};src:url(data:font/woff2;base64,${b64(p)}) format('woff2');}`;
  fontCss = [
    face('Archivo Black', 400, 'normal', '@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2'),
    face('Instrument Serif', 400, 'italic', '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2'),
    face('Instrument Serif', 400, 'normal', '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2'),
    face('Inter', 400, 'normal', '@fontsource/inter/files/inter-latin-400-normal.woff2'),
    face('Inter', 500, 'normal', '@fontsource/inter/files/inter-latin-500-normal.woff2'),
    face('Inter', 600, 'normal', '@fontsource/inter/files/inter-latin-600-normal.woff2'),
  ].join('\n');
  return fontCss;
}

// Wrapper: standalone=true incorpora i caratteri (file SVG autonomi).
export function svgDoc({ w, h, body, standalone = false, attrs = '' }) {
  const style = standalone ? `<style>${embeddedFonts()}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${standalone ? `width="${w}" height="${h}"` : ''} ${attrs}>${style}${body}</svg>`;
}

export const label = (x, y, t, { size = 9, fill = C.graphite, anchor = 'start', ls = 0.14, weight = 500, rot = 0, halo = null } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="Inter,sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="${ls}em" fill="${fill}" text-anchor="${anchor}"${rot ? ` transform="rotate(${rot} ${f(x)} ${f(y)})"` : ''}${halo ? ` stroke="${halo}" stroke-width="${size * 0.5}" paint-order="stroke" stroke-linejoin="round"` : ''}>${t}</text>`;

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FONTS = { display: "font-family=\"'Archivo Black',sans-serif\"", serif: "font-family=\"'Instrument Serif',serif\" font-style=\"italic\"", sans: 'font-family="Inter,sans-serif"' };
// Testo SVG multilinea (\n = a capo).
export function T(x, y, text, { font = 'sans', size = 16, fill = C.paper, anchor = 'start', ls = 0, lh = 1.12, weight = 400, upper = false, opacity = 1 } = {}) {
  const lines = String(upper ? text.toUpperCase() : text).split('\n');
  return `<text x="${f(x)}" y="${f(y)}" ${FONTS[font]} font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}em"${opacity < 1 ? ` opacity="${opacity}"` : ''}>${lines.map((l, i) => `<tspan x="${f(x)}" dy="${i ? f(size * lh) : 0}">${esc(l)}</tspan>`).join('')}</text>`;
}
export const stripGrain = (svg) => svg.replace(/<rect class="grain"[^>]*\/>/g, '');
