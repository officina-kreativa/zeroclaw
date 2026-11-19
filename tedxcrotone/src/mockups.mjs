// Applicazioni: manifesti, social, fondale, badge, slide. Ogni funzione restituisce { w, h, body }.
import { C, f, T, label, grain, grainRect } from './core.mjs';
import { kvCerchi } from './keyvisual.mjs';
import { tavola } from './tavole.mjs';

let uid = 0;
const nest = (body, w, h, x = 0, y = 0, W = w, H = h) => `<svg x="${x}" y="${y}" width="${W}" height="${H}" viewBox="0 0 ${w} ${h}" overflow="hidden">${body}</svg>`;

// Segnaposto del logo: solo un riquadro tratteggiato, nessun logo ridisegnato.
export function logoSlot(x, y, w, h, txt, ink) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${ink}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>` +
    label(x + w / 2, y + h / 2 + h * 0.07, txt.toUpperCase(), { size: Math.min(h * 0.2, w * 0.055), fill: ink, anchor: 'middle', ls: 0.12 });
}

export function manifestoNero(c) {
  const w = 1000, h = 1400, m = 70;
  const D = defs(true, w, h);
  let s = kvCerchi({ w, h, cx: 500, cy: 560, R: 640, u: 1.6, labels: false, grainOn: false });
  s += T(m, m + 22, c.meta.evento, { size: 30, weight: 600, fill: C.paper });
  s += logoSlot(w - m - 250, m - 12, 250, 62, c.meta.logo, C.paper);
  s += T(m, 1130, c.meta.titolo.replace(' ', '\n'), { font: 'display', size: 132, upper: true, lh: 0.94, ls: -0.02 });
  s += T(m + 4, 1318, c.meta.payoff, { font: 'serif', size: 58 });
  s += label(w - m, 1318, `${c.meta.data} · ${c.meta.sede}`.toUpperCase(), { size: 15, fill: C.graphite, anchor: 'end' });
  s += grainRect0(w, h, true);
  return { w, h, body: D + s };
}

export function manifestoCarta(c) {
  const w = 1000, h = 1400, m = 70;
  const D = defs(false, w, h);
  let s = kvCerchi({ w, h, cx: 640, cy: 1000, R: 700, u: 1.6, dark: false, labels: false, grainOn: false, guides: false });
  s += T(m, m + 22, c.meta.evento, { size: 30, weight: 600, fill: C.black });
  s += logoSlot(w - m - 250, m - 12, 250, 62, c.meta.logo, C.black);
  s += T(m - 4, 300, c.applicazioni.manifesti.frase, { font: 'serif', size: 146, fill: C.black, lh: 0.96, ls: -0.01 });
  s += `<rect x="0" y="1240" width="${w}" height="160" fill="${C.paper}"/><path d="M${m},1240H${w - m}" stroke="${C.black}" stroke-width="1"/>`;
  s += T(m, 1318, c.meta.titolo, { font: 'display', size: 54, fill: C.black, upper: true, ls: -0.01 });
  s += T(w - m, 1318, c.meta.payoff, { font: 'serif', size: 40, fill: C.black, anchor: 'end' });
  s += label(m, 1356, `${c.meta.data} · ${c.meta.sede}`.toUpperCase(), { size: 15, fill: C.graphite });
  s += grainRect0(w, h, false);
  return { w, h, body: D + s };
}

let gid = '';
function defs(dark, w, h) { gid = `m${uid++}`; return `<defs>${grain(gid, dark, w, h)}</defs>`; }
function grainRect0(w, h, dark) { return grainRect(gid, w, h, dark); }

export function socialPost(c) {
  const w = 1080, h = 1080, m = 72;
  const D = defs(true, w, h);
  let s = kvCerchi({ w, h, cx: 800, cy: 860, R: 640, u: 1.6, labels: false, grainOn: false });
  s += T(m, 210, c.applicazioni.social.post, { font: 'serif', size: 132, lh: 0.98 });
  s += T(m, h - m, c.meta.evento, { size: 28, weight: 600 });
  s += grainRect0(w, h, true);
  return { w, h, body: D + s };
}

export function socialStoria(c) {
  const w = 1080, h = 1920, m = 84;
  const D = defs(false, w, h);
  let s = kvCerchi({ w, h, cx: 540, cy: 1370, R: 900, u: 1.8, dark: false, labels: false, grainOn: false });
  s += T(m, 300, c.applicazioni.social.storia, { font: 'serif', size: 124, fill: C.black, lh: 1.0 });
  s += T(m, 150, c.meta.evento, { size: 30, weight: 600, fill: C.black });
  s += label(w - m, 150, c.meta.titolo.toUpperCase(), { size: 17, fill: C.black, anchor: 'end' });
  s += grainRect0(w, h, false);
  return { w, h, body: D + s };
}

export function socialCopertina(c) {
  const w = 1920, h = 1005, m = 90;
  const D = defs(true, w, h);
  let s = kvCerchi({ w, h, cx: 1400, cy: 500, R: 800, u: 1.8, labels: false, grainOn: false });
  s += T(m, 330, c.applicazioni.social.copertina, { font: 'serif', size: 104, lh: 1.02 });
  s += T(m, 140, c.meta.evento, { size: 30, weight: 600 });
  s += T(m, h - m - 46, c.meta.titolo, { font: 'display', size: 60, upper: true, ls: -0.01 });
  s += label(m, h - m, `${c.meta.data} · ${c.meta.sede}`.toUpperCase(), { size: 16, fill: C.graphite });
  s += grainRect0(w, h, true);
  return { w, h, body: D + s };
}

export function fondale(c) {
  const w = 1920, h = 1080;
  const D = defs(true, w, h);
  const bx = 150, by = 70, bw = 1620, bh = 660, floorY = 760;
  let s = `<rect width="${w}" height="${h}" fill="#050505"/>`;
  // quinte e americana
  s += `<rect x="0" y="0" width="${w}" height="${floorY}" fill="#070708"/>`;
  s += nest(kvCerchi({ w: bw, h: bh, cx: bw / 2, cy: bh / 2 - 6, R: 520, u: 1.7, labels: false, grainOn: false, dot: 'none' }), bw, bh, bx, by);
  s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#2a2a2b" stroke-width="2"/>`;
  s += T(bx + 70, by + bh - 150, c.meta.titolo.replace(' ', '\n'), { font: 'display', size: 76, upper: true, lh: 0.95, ls: -0.02 });
  s += T(bx + 72, by + bh - 42, c.meta.payoff, { font: 'serif', size: 36 });
  s += T(bx + bw - 70, by + 100, c.meta.evento, { size: 34, weight: 600, anchor: 'end' });
  s += logoSlot(bx + bw - 70 - 280, by + 124, 280, 70, c.meta.logo, C.paper);
  // pavimento in prospettiva
  s += `<polygon points="0,${floorY} ${w},${floorY} ${w},${h} 0,${h}" fill="#121213"/>`;
  s += `<path d="M0,${floorY}H${w}" stroke="#2a2a2b" stroke-width="2"/>`;
  for (let i = -8; i <= 8; i++) s += `<path d="M${960 + i * 120},${floorY}L${960 + i * 330},${h}" stroke="#1d1d1e" stroke-width="1.5"/>`;
  // tappeto rosso circolare: l'unico rosso
  s += `<ellipse cx="960" cy="915" rx="330" ry="78" fill="#000" opacity="0.35" transform="translate(0,8)"/>`;
  s += `<ellipse cx="960" cy="915" rx="330" ry="78" fill="${C.red}"/>`;
  // sagoma di riferimento (scala umana, figura astratta)
  s += `<g fill="#1c1c1d"><ellipse cx="960" cy="918" rx="46" ry="9" fill="#000" opacity="0.35"/><circle cx="960" cy="668" r="21"/><path d="M928,720 Q928,696 960,696 Q992,696 992,720 L986,820 L978,916 L962,916 L960,836 L958,916 L942,916 L934,820 Z"/></g>`;
  // platea
  s += `<g fill="#020202">`;
  for (let i = 0; i < 17; i++) { const x = 60 + i * 112 + (i % 2) * 14, y = 1062 + (i % 3) * 8; s += `<circle cx="${x}" cy="${y - 44}" r="27"/><ellipse cx="${x}" cy="${y + 20}" rx="52" ry="42"/>`; }
  s += `</g>`;
  s += grainRect0(w, h, true);
  return { w, h, body: D + s };
}

export function badge(c, kind) {
  const dark = kind === 'staff', w = 600, h = 900, by = 120, bw = 520, bh = 760, bx = 40;
  const ink = dark ? C.paper : C.black, bg = dark ? C.black : C.paper, a = c.applicazioni.badge;
  let s = `<path d="M${w / 2 - 34},${by + 44}L${w / 2 - 150},-40M${w / 2 + 34},${by + 44}L${w / 2 + 150},-40" stroke="${C.graphite}" stroke-width="20" stroke-linecap="butt"/>`;
  s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="22" fill="${bg}" stroke="${dark ? '#2a2a2b' : '#d9d3c4'}" stroke-width="1.5"/>`;
  s += `<clipPath id="bc${kind}"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="22"/></clipPath>`;
  s += `<g clip-path="url(#bc${kind})">${nest(kvCerchi({ w: bw, h: 420, cx: 380, cy: 210, R: 420, u: 1.2, dark, labels: false, grainOn: false, guides: false }), bw, 420, bx, by + 70)}</g>`;
  s += `<rect x="${w / 2 - 46}" y="${by + 30}" width="92" height="18" rx="9" fill="${dark ? '#2a2a2b' : '#cfc8b8'}"/>`;
  s += T(bx + 36, by + 96, c.meta.evento, { size: 22, weight: 600, fill: ink });
  s += `<rect x="${bx}" y="${by + 490}" width="${bw}" height="${bh - 490 - 22}" fill="${bg}"/>`;
  s += label(bx + 36, by + 536, (dark ? a.staff : a.speaker).toUpperCase(), { size: 17, fill: ink, weight: 600, ls: 0.3 });
  s += T(bx + 34, by + 606, a.nome.replace(' ', '\n'), { font: 'display', size: 54, fill: ink, upper: true, lh: 0.98, ls: -0.01 });
  s += T(bx + 36, by + 706, dark ? a.ruoloStaff : c.mappe.voci[2].titolo, { size: 19, fill: C.graphite, weight: 500 });
  s += T(bx + 36, by + bh - 26, dark ? c.meta.payoff : c.meta.domanda, { font: 'serif', size: 23, fill: ink });
  return { w, h, body: s };
}

export function slideSessione(c, v) {
  const w = 1920, h = 1080, m = 104;
  const D = defs(true, w, h);
  let s = `<rect width="${w}" height="${h}" fill="${C.black}"/>`;
  s += tavola(v.id, { w, h, cx: 1450, cy: 540, R: 380, u: 1.7, grainOn: false, bg: false });
  s += label(m, m + 14, `SESSIONE ${v.n} / 04`, { size: 20, fill: C.paper, weight: 600 });
  s += label(w - m, m + 14, `${c.meta.evento.toUpperCase()} · ${c.meta.titolo.toUpperCase()}`, { size: 16, fill: C.graphite, anchor: 'end' });
  s += T(m - 3, 480, v.titoloBreve, { font: 'display', size: 76, upper: true, lh: 0.95, ls: -0.02 });
  s += T(m, 680, v.domanda.replace(', ', ',\n'), { font: 'serif', size: 62, lh: 1.05 });
  s += `<path d="M${m},${h - m - 44}H${m + 500}" stroke="${C.graphite}" stroke-width="1"/>`;
  s += label(m, h - m, c.meta.domanda.toUpperCase(), { size: 16, fill: C.graphite });
  s += grainRect0(w, h, true);
  return { w, h, body: D + s };
}
