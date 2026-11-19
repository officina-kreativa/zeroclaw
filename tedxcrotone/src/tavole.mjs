// Le quattro tavole della serie. Stessa struttura: disco centrato su Crotone, ghiera, un solo punto rosso.
import { geoPath, geoDistance } from 'd3-geo';
import { contours } from 'd3-contour';
import { C, CROTONE, SEED, f, land, borders, azimuthal, landMask, noise2, rng, grain, grainRect, label, T } from './core.mjs';
import { ticks } from './keyvisual.mjs';

let uid = 0;
const tone = (dark) => ({ bg: dark ? C.black : C.paper, ink: dark ? C.paper : C.black, soft: C.graphite });

const CITIES = [
  ['Londra', -0.13, 51.5, 3], ['Parigi', 2.35, 48.86, 2], ['Francoforte', 8.68, 50.11, 2], ['Milano', 9.19, 45.46, 2], ['Madrid', -3.7, 40.42, 1],
  ['Istanbul', 28.98, 41.01, 2], ['Mosca', 37.62, 55.75, 2], ['Il Cairo', 31.24, 30.04, 1], ['Lagos', 3.38, 6.52, 2], ['Nairobi', 36.82, -1.29, 1],
  ['Johannesburg', 28.05, -26.2, 2], ['Dubai', 55.27, 25.2, 3], ['Riad', 46.68, 24.71, 2], ['Mumbai', 72.88, 19.08, 3], ['Delhi', 77.21, 28.61, 2],
  ['Bangalore', 77.59, 12.97, 2], ['Singapore', 103.82, 1.35, 3], ['Giacarta', 106.85, -6.21, 1], ['Hong Kong', 114.17, 22.32, 3], ['Shanghai', 121.47, 31.23, 3],
  ['Pechino', 116.4, 39.9, 2], ['Seul', 126.98, 37.57, 2], ['Tokyo', 139.69, 35.69, 3], ['New York', -74.0, 40.71, 3], ['Toronto', -79.38, 43.65, 1],
  ['Chicago', -87.63, 41.88, 2], ['San Francisco', -122.42, 37.77, 3], ['Città del Messico', -99.13, 19.43, 1], ['San Paolo', -46.63, -23.55, 2], ['Buenos Aires', -58.38, -34.6, 1],
  ['Bogotà', -74.07, 4.71, 1], ['Casablanca', -7.59, 33.57, 1], ['Tunisi', 10.18, 36.8, 1], ['Atene', 23.73, 37.98, 1], ['Varsavia', 21.01, 52.23, 1],
  ['Stoccolma', 18.07, 59.33, 1], ['Tel Aviv', 34.78, 32.08, 1], ['Addis Abeba', 38.75, 9.03, 1], ['Karachi', 67.0, 24.86, 1], ['Bangkok', 100.5, 13.76, 1], ['Sydney', 151.21, -33.87, 2],
];

function potere({ cx, cy, R, t, u }) {
  const mk = (dLon, dLat, roll) => geoPath(azimuthal({ cx, cy, R, kmMax: 2600, clipKm: 7000, center: [CROTONE[0] + dLon, CROTONE[1] + dLat], roll })).digits(1);
  const p0 = mk(0, 0, 0), p1 = mk(1.7, -0.9, 2.2), p2 = mk(-2.3, 1.3, -3.4);
  const L = land('50m'), B = borders('50m');
  let s = '';
  s += `<path d="${p2(L)}" fill="none" stroke="${t.soft}" stroke-width="${0.45 * u}" stroke-dasharray="${0.5 * u} ${2.4 * u}" stroke-linecap="round"/>`;
  s += `<path d="${p2(B)}" fill="none" stroke="${t.soft}" stroke-width="${0.6 * u}" stroke-dasharray="${0.5 * u} ${2.4 * u}" stroke-linecap="round"/>`;
  s += `<path d="${p1(L)}" fill="none" stroke="${t.ink}" stroke-width="${0.4 * u}" opacity="0.55"/>`;
  s += `<path d="${p1(B)}" fill="none" stroke="${t.ink}" stroke-width="${0.7 * u}" stroke-dasharray="${5 * u} ${3 * u}" opacity="0.8"/>`;
  s += `<path d="${p0(L)}" fill="${t.ink}" fill-opacity="0.07" stroke="${t.ink}" stroke-width="${0.6 * u}" stroke-linejoin="round"/>`;
  s += `<path d="${p0(B)}" fill="none" stroke="${t.ink}" stroke-width="${1.05 * u}"/>`;
  return s;
}

function ricchezza({ cx, cy, R, t, u, seed }) {
  const proj = azimuthal({ cx, cy, R, kmMax: 12500, clipKm: 12500 });
  const path = geoPath(proj).digits(1), r = rng(seed + 2);
  const line = (a, b) => path({ type: 'LineString', coordinates: [a, b] }) || '';
  let s = `<path d="${path(land('110m'))}" fill="${t.ink}" fill-opacity="0.07" stroke="${t.ink}" stroke-width="${0.3 * u}" stroke-opacity="0.5"/>`;
  let rad = '';
  for (const c of CITIES) rad += line(CROTONE, [c[1], c[2]]);
  s += `<path d="${rad}" fill="none" stroke="${t.soft}" stroke-width="${0.35 * u}"/>`;
  const arcs = [];
  CITIES.forEach((a, i) => {
    if (a[3] === 3) CITIES.forEach((b, j) => { if (j > i && b[3] === 3) arcs.push([a, b, 0.9 + r() * 1.5]); });
    else {
      const near = CITIES.filter((b) => b[3] > a[3] || (a[3] === 2 && b[3] === 3))
        .map((b) => [b, geoDistance([a[1], a[2]], [b[1], b[2]])]).sort((x, y) => x[1] - y[1]).slice(0, 2);
      near.forEach(([b]) => arcs.push([a, b, a[3] === 2 ? 0.7 + r() * 0.7 : 0.35 + r() * 0.3]));
    }
  });
  arcs.sort((a, b) => a[2] - b[2]);
  for (const [a, b, wd] of arcs) s += `<path d="${line([a[1], a[2]], [b[1], b[2]])}" fill="none" stroke="${t.ink}" stroke-width="${f(wd * u, 2)}" stroke-linecap="round" opacity="${wd > 0.9 ? 0.88 : 0.7}"/>`;
  for (const c of CITIES) {
    const p = proj([c[1], c[2]]);
    if (geoDistance(CROTONE, [c[1], c[2]]) * 6371 < 12400) s += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f((1.2 + c[3] * 1.1) * u)}" fill="${t.bg}" stroke="${t.ink}" stroke-width="${0.9 * u}"/>`;
  }
  return s;
}

function intelligenza({ cx, cy, R, t, u, seed }) {
  const proj = azimuthal({ cx, cy, R, clipKm: 20000 });
  const isLand = landMask(), n1 = noise2(seed + 3), n2 = noise2(seed + 4);
  const warp = (x, y) => {
    const d = Math.hypot(x - cx, y - cy) / R, A = R * 0.085 * Math.pow(d, 1.5), q = 1.5 / R;
    return [x + A * n1(x * q, y * q), y + A * n2(x * q + 7, y * q - 3)];
  };
  const rings = 40, step = R / rings;
  let grid = '', dotsL = '', dotsS = '';
  for (let k = 1; k <= rings; k++) {
    const r = k * step;
    for (let i = 0; i <= 240; i++) { const a = (i / 240) * 2 * Math.PI, p = warp(cx + Math.cos(a) * r, cy + Math.sin(a) * r); grid += `${i ? 'L' : 'M'}${f(p[0])},${f(p[1])}`; }
    const n = Math.max(6, Math.round((2 * Math.PI * r) / (step * 1.0) / 6) * 6);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, p = warp(x, y), ll = proj.invert([x, y]);
      if (ll && isLand(ll[0], ll[1])) dotsL += `M${f(p[0] - 1.7 * u)},${f(p[1])}a${1.7 * u},${1.7 * u} 0 1 0 ${3.4 * u},0a${1.7 * u},${1.7 * u} 0 1 0 ${-3.4 * u},0`;
      else dotsS += `M${f(p[0] - 0.5 * u)},${f(p[1])}a${0.5 * u},${0.5 * u} 0 1 0 ${1.0 * u},0a${0.5 * u},${0.5 * u} 0 1 0 ${-1.0 * u},0`;
    }
  }
  for (let j = 0; j < 48; j++) {
    const a = (j / 48) * 2 * Math.PI;
    for (let i = 0; i <= 80; i++) { const r = (i / 80) * R, p = warp(cx + Math.cos(a) * r, cy + Math.sin(a) * r); grid += `${i ? 'L' : 'M'}${f(p[0])},${f(p[1])}`; }
  }
  return `<path d="${grid}" fill="none" stroke="${t.soft}" stroke-width="${0.3 * u}" opacity="0.6"/><path d="${dotsS}" fill="${t.soft}"/><path d="${dotsL}" fill="${t.ink}"/>`;
}

function umano({ cx, cy, R, t, u, seed }) {
  const cell = 4, pad = 4, x0 = cx - R, y0 = cy - R, g = Math.ceil((2 * R) / cell) + pad * 2;
  const n = noise2(seed + 5), vals = new Float64Array(g * g), gap = R / 34, r = rng(seed + 6);
  for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) {
    const x = x0 + (i - pad) * cell, y = y0 + (j - pad) * cell, dx = x - cx, dy = y - cy, d = Math.hypot(dx * 0.92, dy * 1.06);
    const k = Math.min(1, d / R), amp = gap * (0.6 + 6.5 * k * k);
    vals[j * g + i] = d + amp * (n(x / (R * 0.75), y / (R * 0.75)) + 0.35 * n(x / (R * 0.2) + 5, y / (R * 0.2)) + 0.5 * Math.sin(Math.atan2(dy, dx) * 3 + 1.1) * k);
  }
  const th = []; for (let v = gap; v < R * 1.5; v += gap) th.push(v);
  const cp = geoPath();
  let s = `<g transform="translate(${f(x0 - pad * cell)},${f(y0 - pad * cell)}) scale(${cell})" fill="none" stroke="${t.ink}" stroke-linecap="round">`;
  contours().size([g, g]).thresholds(th)(vals).forEach((c, i) => {
    const d = cp(c); if (!d) return;
    const w = (i % 6 === 5 ? 1.25 : 0.4 + r() * 0.5) * u;
    const dash = r() < 0.55 ? ` stroke-dasharray="${f(20 + r() * 60)} ${f(0.6 + r() * 1.6)} ${f(8 + r() * 30)} ${f(0.5 + r())}"` : '';
    s += `<path d="${d.replace(/(\.\d\d)\d+/g, '$1')}" stroke-width="${f(w / cell, 3)}"${dash}/>`;
  });
  return s + '</g>';
}

const KIND = { potere, ricchezza, intelligenza, umano };
export const TAVOLE = ['potere', 'ricchezza', 'intelligenza', 'umano'];

// frame: { n: '01', titolo: 'La mappa del potere', evento: 'TEDxCrotone', tema: 'Nuova umanità' } oppure null
export function tavola(kind, { w, h, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42, dark = true, u = 1, seed = SEED, frame = null, grainOn = true, bg = true }) {
  const t = tone(dark), id = `t${uid++}`;
  let s = `<defs>${grain(id, dark, w, h)}<clipPath id="c${id}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>`;
  if (bg) s += `<rect width="${w}" height="${h}" fill="${t.bg}"/>`;
  s += `<g clip-path="url(#c${id})">${KIND[kind]({ cx, cy, R, t, u, seed })}</g>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${t.ink}" stroke-width="${0.8 * u}"/>`;
  s += ticks(cx, cy, R + 5 * u, t.ink, 2, 4 * u);
  s += `<circle cx="${cx}" cy="${cy}" r="${f(R * 0.03)}" fill="${t.bg}"/><circle cx="${cx}" cy="${cy}" r="${f(R * 0.02)}" fill="${C.red}"/>`;
  if (frame) {
    const m = w * 0.07;
    s += label(m, m, `TAV. ${frame.n} / 04`, { size: 11 * u, fill: t.ink, weight: 600 });
    s += label(w - m, m, `${frame.evento.toUpperCase()} · ${frame.tema.toUpperCase()}`, { size: 11 * u, fill: t.soft, anchor: 'end' });
    s += `<path d="M${m},${h - m - 50 * u}H${w - m}" stroke="${t.ink}" stroke-width="${0.6 * u}"/>`;
    s += T(m, h - m - 8 * u, frame.titolo, { font: 'display', size: 26 * u, fill: t.ink, upper: true, ls: -0.01 });
    s += label(m, m + 18 * u, '39.08° N  17.12° E', { size: 10 * u, fill: t.soft });
  }
  if (grainOn) s += grainRect(id, w, h, dark);
  return s;
}
