# TEDxCrotone — «Nuova umanità». Proposta di tema

Proposta in PDF (16:9) con identità visiva generata da codice.

- `content/content.json` — tutti i testi. Si modifica qui, senza toccare il codice.
- `src/keyvisual.mjs`, `src/tavole.mjs`, `src/mockups.mjs` — visual in SVG (Natural Earth via world-atlas, d3-geo, d3-contour; seed in `src/core.mjs`).
- `src/template.mjs`, `src/style.css` — impaginazione delle pagine.
- `out/TEDxCrotone-Nuova-umanita-proposta.pdf` — il documento.
- `out/visuals/` — ogni visual in SVG e PNG. `out/directions/` — le tre direzioni iniziali del key visual.

## Rigenerare

```bash
npm install
node src/build.mjs          # visual + PDF + PNG di controllo in out/pagine
node src/build.mjs --no-png # più veloce: salta i PNG dei visual
```

Servono Chromium con Playwright e `pdftoppm`; `python3` con Pillow è facoltativo (alleggerisce i PNG).
La build segnala i testi che escono dai margini.
