// Key visual: tre direzioni. Ogni funzione restituisce il corpo SVG per un formato w×h qualsiasi.
import { geoPath, geoGraticule10, geoCircle } from 'd3-geo';
import { contours } from 'd3-contour';
import { C, CROTONE, SEED, KM, f, land, borders, azimuthal, landMask, noise2, grain, grainRect, label } from './core.mjs';

let uid = 0;
const tone = (dark) => ({ bg: dark ? C.black : C.paper, ink: dark ? C.paper : C.black, soft: C.graphite });

function ticks(cx, cy, R, ink, step = 2, len = 5) {
  let d = '';
  for (let a = 0; a < 360; a += step) {
    const l = a % 30 === 0 ? len * 2.4 : a % 10 === 0 ? len * 1.5 : len;
    const s = Math.sin((a * Math.PI) / 180), c = -Math.cos((a * Math.PI) / 180);
    d += `M${f(cx + s * R)},${f(cy + c * R)}L${f(cx + s * (R + l))},${f(cy + c * (R + l))}`;
  }
  return `<path d="${d}" stroke="${ink}" stroke-width="0.5" fill="none" opacity="0.7"/>`;
}

// A — IL CENTRO: planisfero azimutale equidistante, cerchi di distanza, punto rosso.
export function kvCentro({ w, h, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42, dark = false, labels = true, grainOn = true, u = 1 }) {
  const t = tone(dark), id = `g${uid++}`;
  const proj = azimuthal({ cx, cy, R, clipKm: 19990 });
  const path = geoPath(proj).digits(1);
  let s = `<defs>${grain(id, dark, w, h)}<clipPath id="c${id}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>`;
  s += `<rect width="${w}" height="${h}" fill="${t.bg}"/>`;
  s += `<g clip-path="url(#c${id})">`;
  s += `<path d="${path(geoGraticule10())}" fill="none" stroke="${t.soft}" stroke-width="${0.35 * u}" opacity="0.55"/>`;
  s += `<path d="${path(land('50m'))}" fill="${t.ink}" fill-opacity="${dark ? 0.12 : 0.08}" stroke="${t.ink}" stroke-width="${0.55 * u}" stroke-linejoin="round"/>`;
  s += `</g>`;
  for (let km = 2000; km <= 20000; km += 2000) {
    const r = proj.kmToPx(km), major = km % 10000 === 0;
    s += `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="none" stroke="${t.ink}" stroke-width="${(major ? 0.6 : 0.5) * u}" ${major ? '' : `stroke-dasharray="${0.6 * u} ${2.6 * u}" stroke-linecap="round"`}/>`;
    if (labels && km <= 18000) {
      const a = (128 * Math.PI) / 180;
      s += label(cx + Math.cos(a) * r, cy + Math.sin(a) * r + 2.5 * u, `${(km / 1000) | 0} 000`, { size: 6.5 * u, fill: t.ink, anchor: 'middle', halo: t.bg, ls: 0.1 });
    }
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${t.ink}" stroke-width="${0.9 * u}"/>`;
  s += ticks(cx, cy, R + 4 * u, t.ink, 2, 4 * u);
  s += `<circle cx="${cx}" cy="${cy}" r="${f(R * 0.016)}" fill="${C.red}"/>`;
  if (labels) {
    s += `<path d="M${cx + R * 0.03},${cy}H${cx + R * 0.1}" stroke="${t.ink}" stroke-width="${0.5 * u}"/>`;
    s += label(cx + R * 0.11, cy + 3 * u, 'CROTONE', { size: 8.5 * u, fill: t.ink, weight: 600, halo: t.bg });
    s += label(cx + R * 0.11, cy + 14 * u, '39.08° N  17.12° E', { size: 7 * u, fill: t.soft, halo: t.bg });
  }
  if (grainOn) s += grainRect(id, w, h, dark);
  return s;
}

// B — SUD IN ALTO: Mediterraneo capovolto, isolinee che si deformano attorno al punto.
export function kvSud({ w, h, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.5, kmMax = 1900, dark = true, labels = true, grainOn = true, u = 1, seed = SEED }) {
  const t = tone(dark), id = `g${uid++}`;
  const proj = azimuthal({ cx, cy, R, kmMax, roll: 180, clipKm: 9000 });
  const path = geoPath(proj).digits(1);
  // campo: distanza dal punto + rumore che cresce allontanandosi
  const cell = 5, pad = 6, gw = Math.ceil(w / cell) + pad * 2, gh = Math.ceil(h / cell) + pad * 2;
  const n = noise2(seed), vals = new Float64Array(gw * gh);
  const gap = R * 0.052;
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const x = (i - pad) * cell, y = (j - pad) * cell, d = Math.hypot(x - cx, y - cy);
    const k = Math.min(1, Math.max(0, (d - R * 0.08) / (R * 0.9)));
    const amp = gap * 5.5 * k * k * (3 - 2 * k);
    const nn = n(x / (R * 0.55), y / (R * 0.55)) + 0.45 * n(x / (R * 0.22) + 9, y / (R * 0.22) - 4);
    vals[j * gw + i] = d + amp * nn;
  }
  const max = Math.hypot(w, h);
  const th = []; for (let v = gap; v < max; v += gap) th.push(v);
  const cs = contours().size([gw, gh]).thresholds(th)(vals);
  const cpath = geoPath();
  let s = `<defs>${grain(id, dark, w, h)}</defs><rect width="${w}" height="${h}" fill="${t.bg}"/>`;
  s += `<g transform="translate(${-pad * cell},${-pad * cell}) scale(${cell})" fill="none" stroke="${t.ink}" stroke-width="${(0.55 * u) / cell}" opacity="${dark ? 0.6 : 0.7}">`;
  cs.forEach((c, i) => { const dd = cpath(c); if (!dd) return; s += `<path d="${dd.replace(/(\.\d\d)\d+/g, '$1')}"${i % 5 === 4 ? ` stroke-width="${(1.1 * u) / cell}"` : ''}/>`; });
  s += `</g>`;
  s += `<path d="${path(land('50m'))}" fill="${dark ? '#1B1B1C' : '#E7E1D3'}" stroke="${t.ink}" stroke-width="${0.9 * u}" stroke-linejoin="round"/>`;
  s += `<path d="${path(borders('50m'))}" fill="none" stroke="${t.soft}" stroke-width="${0.5 * u}" stroke-dasharray="${1.5 * u} ${2.5 * u}" opacity="0.8"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${f(R * 0.022)}" fill="${C.red}"/>`;
  if (labels) {
    s += label(cx - R * 0.045, cy + R * 0.012, 'CROTONE', { size: 8.5 * u, fill: t.ink, weight: 600, anchor: 'end' });
    const pt = (lon, lat, txt, size = 8) => { const p = proj([lon, lat]); return p ? label(p[0], p[1], txt, { size: size * u, fill: t.soft, anchor: 'middle', ls: 0.5 }) : ''; };
    s += pt(18, 27.5, 'AFRICA', 9) + pt(14, 48.3, 'EUROPA', 9) + pt(36, 39, 'ASIA', 9);
    s += label(w - 28 * u, 34 * u, 'S ↑', { size: 9 * u, fill: t.ink, anchor: 'end', weight: 600 });
  }
  if (grainOn) s += grainRect(id, w, h, dark);
  return s;
}

// C — CERCHI: il mondo disegnato soltanto dai cerchi di distanza da Crotone.
export { ticks };
export function kvCerchi({ w, h, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.44, dark = true, labels = true, grainOn = true, u = 1, stepKm = 250, center = CROTONE, roll = 0, dot = 'red', guides = true, bg = true }) {
  const t = tone(dark), id = `g${uid++}`;
  const proj = azimuthal({ cx, cy, R, clipKm: 20000, center, roll });
  const isLand = landMask();
  let d = '';
  const gapPx = proj.kmToPx(stepKm);
  for (let km = stepKm; km < 19900; km += stepKm) {
    const r = proj.kmToPx(km), n = Math.max(48, Math.ceil((2 * Math.PI * r) / 0.7));
    const on = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI, ll = proj.invert([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      on[i] = ll && isLand(ll[0], ll[1]) ? 1 : 0;
    }
    let start = on.indexOf(0);
    if (start < 0) { d += `M${f(cx + r)},${f(cy)}A${f(r)},${f(r)} 0 1 1 ${f(cx - r)},${f(cy)}A${f(r)},${f(r)} 0 1 1 ${f(cx + r)},${f(cy)}`; continue; }
    let i = 0;
    while (i < n) {
      const k = (start + i) % n;
      if (!on[k]) { i++; continue; }
      let len = 0; while (i + len < n && on[(start + i + len) % n]) len++;
      const a0 = (k / n) * 2 * Math.PI, a1 = ((k + len) / n) * 2 * Math.PI;
      d += `M${f(cx + Math.cos(a0) * r, 2)},${f(cy + Math.sin(a0) * r, 2)}A${f(r, 2)},${f(r, 2)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f(cx + Math.cos(a1) * r, 2)},${f(cy + Math.sin(a1) * r, 2)}`;
      i += len;
    }
  }
  let s = `<defs>${grain(id, dark, w, h)}</defs>` + (bg ? `<rect width="${w}" height="${h}" fill="${t.bg}"/>` : '');
  for (let km = 5000; guides && km <= 20000; km += 5000) {
    const r = proj.kmToPx(km);
    s += `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="none" stroke="${t.soft}" stroke-width="${0.4 * u}" opacity="0.6"/>`;
    if (labels && km >= 10000 && km < 20000) s += label(cx, cy - r - 4 * u, `${km / 1000} 000 km`, { size: 7 * u, fill: t.soft, anchor: 'middle', halo: t.bg });
  }
  s += `<path d="${d}" fill="none" stroke="${t.ink}" stroke-width="${f(gapPx * 0.36, 2)}" stroke-linecap="butt"/>`;
  if (dot === 'red') s += `<circle cx="${cx}" cy="${cy}" r="${f(R * 0.02)}" fill="${C.red}"/>`;
  else if (dot === 'hollow') s += `<circle cx="${cx}" cy="${cy}" r="${f(R * 0.02)}" fill="${t.bg}" stroke="${t.ink}" stroke-width="${1.2 * u}"/>`;
  if (labels) s += label(cx + R * 0.035, cy + 3 * u, 'CROTONE', { size: 8.5 * u, fill: t.ink, weight: 600, halo: t.bg });
  if (grainOn) s += grainRect(id, w, h, dark);
  return s;
}

export const KV = { centro: kvCentro, sud: kvSud, cerchi: kvCerchi };
