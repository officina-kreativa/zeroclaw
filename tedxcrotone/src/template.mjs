// Template delle pagine: prende i testi da content.json e i visual dal generatore. Nessun testo qui dentro.
import { C, svgDoc, stripGrain } from './core.mjs';
import { kvCerchi, kvCentro, kvSud } from './keyvisual.mjs';
import { tavola } from './tavole.mjs';

const e = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const br = (t) => e(t).replace(/\n/g, '<br>');
const inl = (a, style = '') => stripGrain(svgDoc({ w: a.w, h: a.h, body: a.body, attrs: `style="${style}"` }));
const art = (body, w, h, style = '') => inl({ w, h, body }, style);

export function pages(c, A) {
  const m = c.meta;
  let pn = 0;
  const page = (cls, section, inner, { chrome = true } = {}) => {
    pn++;
    const hd = chrome ? `<div class="hd"><span class="ev">${e(m.evento)} <span class="muted" style="font-weight:400">· ${e(m.titolo)}</span></span><span>${e(section)}</span></div><div class="ft"><span>${e(m.documento)}</span><span>${String(pn).padStart(2, '0')}</span></div>` : '';
    return `<section class="page ${cls}">${inner}${hd}</section>`;
  };
  const out = [];

  // 1 — Copertina
  out.push(page('dark cover', '', `
    <div class="full">${art(kvCerchi({ w: 1920, h: 1080, cx: 1420, cy: 520, R: 800, u: 1.7, grainOn: false }), 1920, 1080)}</div>
    <div class="top"><span class="ev">${e(m.evento)}</span><span class="logo-slot">${e(m.logo)}</span></div>
    <h1 class="display title">${br(m.titolo.replace(' ', '\n'))}</h1>
    <div class="serif payoff">${e(m.payoff)}</div>
    <div class="meta cap"><span>${e(m.documento)}</span><span>${e(m.destinatari)}</span><span>${e(m.data)} · ${e(m.sede)}</span></div>`, { chrome: false }));

  // 2 — L'idea
  const I = c.idea;
  out.push(page('idea', I.sezione, `<div class="body">
    <div class="lead"><div class="kicker">${e(I.sezione)}</div><h2 class="display h1">${br(I.titolo)}</h2><p class="serif">${e(I.intro)}</p></div>
    <div class="discs">${I.centri.voci.map((v, i) => `<div>${art(kvCerchi({ w: 400, h: 400, R: 190, u: 1, dark: false, labels: false, grainOn: false, stepKm: 420, center: [v.lon, v.lat], dot: i === 2 ? 'red' : 'hollow', guides: false }) + `<circle cx="200" cy="200" r="190" fill="none" stroke="${C.black}" stroke-width="0.8"/>`, 400, 400)}<div class="cap">Centro: <b>${e(v.nome)}</b></div></div>`).join('')}</div>
    <div class="note cap">${e(I.centri.nota)}</div>
    <div class="cols">${I.blocchi.map((b) => `<div><h3 class="display h3">${e(b.titolo)}</h3><p>${e(b.testo)}</p></div>`).join('')}</div>
  </div>`));

  // 3 — Le quattro mappe (serie)
  const M = c.mappe;
  out.push(page('dark maps', M.sezione, `<div class="body">
    <div class="kicker">${e(M.sezione)}</div>
    <div class="headrow"><h2 class="display h2">${br(M.titolo)}</h2><p>${e(M.nota)}</p></div>
    <div class="grid">${M.voci.map((v) => `<div>${inl(A[`tavola-${v.n}-${v.id}`])}<div class="serif q">${e(v.domanda)}</div></div>`).join('')}</div>
    <div class="close"><span class="cap">Ogni sessione si chiude con</span><span class="serif">${e(m.chiusuraSessione)}</span></div>
  </div>`));

  // 4–7 — Una pagina per mappa
  for (const v of M.voci) {
    out.push(page('split', `Sessione ${v.n} / 04`, `
      <div class="art">${art(tavola(v.id, { w: 960, h: 1080, R: 400, u: 1.7, grainOn: false }), 960, 1080)}</div>
      <div class="txt"><div class="kicker n">Sessione ${v.n}</div><h2 class="display">${br(v.titoloBreve)}</h2>
        <div class="serif q">${e(v.domanda)}</div>
        <dl><dt>Temi</dt><dd>${e(v.temi)}</dd><dt>La tavola</dt><dd>${e(v.tavola)}</dd><dt>Voci</dt><dd>${e(v.voci)}</dd></dl>
        <div class="end"><span class="cap" style="display:block;margin-bottom:8px">In chiusura</span><span class="serif">${e(m.chiusuraSessione)}</span></div>
      </div>`));
  }

  // 8 — Manifesto
  const P = c.manifesto.paragrafi;
  out.push(page('manifesto', c.manifesto.sezione, `<div class="body">
    <div class="side"><div class="kicker">${e(m.titolo)}</div><h2 class="display">${e(c.manifesto.titolo)}</h2>
      ${art(tavola('umano', { w: 420, h: 420, R: 196, u: 0.9, dark: false, grainOn: false }), 420, 420)}</div>
    <div class="text serif">${P.map((p, i) => `<p${i === P.length - 1 ? ' class="last"' : ''}>${e(p)}</p>`).join('')}</div>
  </div>`));

  // 9 — Identità: key visual
  const K = c.identita.kv;
  out.push(page('dark idkv', c.identita.sezione, `
    <div class="art">${art(kvCerchi({ w: 1080, h: 1080, cx: 560, cy: 540, R: 760, u: 1.6, grainOn: false }), 1080, 1080)}</div>
    <div class="txt"><div class="kicker">${e(c.identita.sezione)}</div><h2 class="display">${br(K.titolo)}</h2><p>${e(K.testo)}</p>
      <ul>${K.punti.map((p) => `<li>${e(p)}</li>`).join('')}</ul></div>
    <div class="vars">
      <div>${art(kvCerchi({ w: 400, h: 300, R: 250, u: 0.9, dark: false, labels: false, grainOn: false }), 400, 300)}<div class="cap">${e(K.varianti[0])}</div></div>
      <div>${art(kvCentro({ w: 400, h: 300, R: 135, u: 0.7, dark: false, labels: false, grainOn: false }), 400, 300)}<div class="cap">${e(K.varianti[1])}</div></div>
      <div>${art(kvSud({ w: 400, h: 300, R: 200, u: 0.7, labels: false, grainOn: false }), 400, 300)}<div class="cap">${e(K.varianti[2])}</div></div>
    </div>`));

  // 10 — Identità: sistema
  const S = c.identita.sistema;
  const light = (hex) => ['#F3EFE6'].includes(hex.toUpperCase());
  out.push(page('sys', c.identita.sezione, `<div class="body">
    <div class="kicker">${e(c.identita.sezione)}</div><h2 class="display title">${e(S.titolo)}</h2>
    <div class="colors">${S.colori.map((k) => `<div class="sw" style="background:${k.hex};color:${light(k.hex) ? C.black : C.paper}"><b>${e(k.nome)}</b><span>${e(k.hex)}</span><span>${e(k.uso)}</span></div>`).join('')}</div>
    <div class="types">${S.caratteri.map((k) => `<div class="row"><div><div class="cap">${e(k.ruolo)}</div><div class="small" style="margin-top:6px">${e(k.nome)}</div></div><div class="spec ${k.classe}">${e(k.prova)}</div></div>`).join('')}</div>
    <div class="grid-demo"><div class="cap">Griglia a 12 colonne · margini 104 / 96 · formato 16:9</div><div class="cols12">${'<i></i>'.repeat(12)}</div></div>
    <div class="rules">${S.regole.map((r) => `<div><h3 class="display">${e(r.titolo)}</h3><p>${e(r.testo)}</p></div>`).join('')}</div>
    <div class="tone"><h3 class="display">${e(S.tono.titolo)}</h3><p>${e(S.tono.testo)}</p>
      <div class="yn"><div><div class="cap" style="margin-bottom:10px">Sì</div>${S.tono.si.map((t) => `<p>${e(t)}</p>`).join('')}</div><div class="no"><div class="cap" style="margin-bottom:10px">No</div>${S.tono.no.map((t) => `<p>${e(t)}</p>`).join('')}</div></div></div>
  </div>`));

  // 11–15 — Applicazioni
  const Ap = c.applicazioni;
  const head = (x) => `<div class="kicker">${e(Ap.sezione)}</div><div class="headrow"><h2 class="display">${e(x.titolo)}</h2><p>${e(x.nota)}</p></div>`;
  out.push(page('app wall', Ap.sezione, `<div class="body">${head(Ap.manifesti)}
    <div class="stage">${['manifesto-nero', 'manifesto-carta'].map((k) => `<div class="shadow">${inl(A[k], 'width:520px;height:728px')}</div>`).join('')}</div></div>`));
  out.push(page('app wall', Ap.sezione, `<div class="body">${head(Ap.social)}
    <div class="stage" style="gap:44px;align-items:flex-end;bottom:10px">
      <div class="item"><div class="shadow">${inl(A['social-post'], 'width:470px;height:470px')}</div><div class="cap">Post 1080 × 1080</div></div>
      <div class="item"><div class="shadow">${inl(A['social-storia'], 'width:400px;height:711px')}</div><div class="cap">Storia 1080 × 1920</div></div>
      <div class="item"><div class="shadow">${inl(A['social-copertina'], 'width:750px;height:393px')}</div><div class="cap">Copertina evento 1920 × 1005</div></div>
    </div></div>`));
  out.push(page('dark app', Ap.sezione, `<div class="body">${head(Ap.palco)}
    <div class="stage" style="top:138px">${inl(A['fondale-palco'], 'width:1330px;height:748px;border:1px solid #2a2a2b')}</div></div>`));
  out.push(page('app wall', Ap.sezione, `<div class="body">${head(Ap.badge)}
    <div class="stage" style="gap:110px;top:120px">${['badge-speaker', 'pass-staff'].map((k) => `<div style="filter:drop-shadow(0 22px 26px rgba(0,0,0,.3))">${inl(A[k], 'width:500px;height:750px')}</div>`).join('')}</div></div>`));
  out.push(page('dark app', Ap.sezione, `<div class="body">${head(Ap.slide)}
    <div class="slides">${c.mappe.voci.map((v) => inl(A[`slide-${v.n}-${v.id}`], 'width:640px;height:360px')).join('')}</div></div>`));

  // 16 — Speaker
  const Sp = c.speaker;
  const idOf = (mappa) => c.mappe.voci.find((v) => v.titolo === mappa)?.id;
  out.push(page('spk', Sp.sezione, `<div class="body">
    <div class="kicker">${e(Sp.sezione)}</div><h2 class="display title">${e(Sp.titolo)}</h2><div class="note">${e(Sp.nota)}</div>
    <div class="cards">${Sp.voci.map((v, i) => `<div class="card"><div class="ph">${art(tavola(idOf(v.mappa), { w: 330, h: 150, cx: i === 1 ? 20 : 165, cy: i === 1 ? 150 : 75, R: 200, u: 0.8, grainOn: false }), 330, 150)}</div>
        <div class="cap">${e(v.mappa)}</div><h3 class="display">${e(v.nome)}</h3><p>${e(v.bio)}</p>
        <div class="talk"><div class="cap">Talk · proposta nostra</div><div class="serif">${e(v.talk)}</div>${v.extra ? `<p class="muted" style="margin-top:6px">${e(v.extra)}</p>` : ''}</div></div>`).join('')}
      <div class="card open"><div class="ph"></div><div class="cap">${e(Sp.daCoprire.mappa)}</div><h3 class="display">${e(Sp.daCoprire.etichetta)}</h3><p>${e(Sp.daCoprire.testo)}</p>
        <div class="talk"><div class="cap">Perché</div><div class="serif">${e(Sp.daCoprire.nota)}</div></div></div>
    </div></div>`));

  // 17 — Decisioni
  const D = c.decisioni;
  out.push(page('dark dec', D.sezione, `<div class="body">
    <div class="kicker">${e(D.sezione)}</div><h2 class="display title">${e(D.titolo)}</h2>
    <div class="list">${D.voci.map((v, i) => `<div class="row"><div class="n">0${i + 1}</div><div><h3 class="display">${e(v.titolo)}</h3><p>${e(v.testo)}</p></div><div class="box"></div></div>`).join('')}<div style="border-top:1px solid #3a3a3b"></div></div>
    <div class="att"><h3 class="display">${e(D.attenzioni.titolo)}</h3>${D.attenzioni.voci.map((t) => `<p>${e(t)}</p>`).join('')}</div>
    <div class="end"><div class="cap" style="margin-bottom:10px">${e(m.data)} · ${e(m.sede)}</div><div class="serif">${e(m.domanda)}</div></div>
  </div>`));

  return out;
}
