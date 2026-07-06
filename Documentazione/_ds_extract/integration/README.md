# Integrazione animazioni di reveal — Bazelguese/Satze

Due file pronti da copiare nel repo del gioco. Sostituiscono i corrispettivi esistenti.

> I file hanno suffisso `.txt` solo per evitare che vengano compilati qui: **rimuovi il `.txt`** dopo il download.

## File

| Scarica questo | togli `.txt` → | metti nel repo a |
|---|---|---|
| `src/components/gallery/BattlefieldRevealAnimations.jsx.txt` | `.jsx` | `src/components/gallery/BattlefieldRevealAnimations.jsx` |
| `src/data/battlefields.js.txt` | `.js` | `src/data/battlefields.js` |

Nessun'altra modifica necessaria: `BattlefieldGallery.jsx` e il reveal in partita
chiamano già `<BattlefieldReveal imageSrc animationType />` e `getBattlefieldAnimationType(fieldId)`,
firme che restano invariate.

## Cosa cambia

**`BattlefieldRevealAnimations.jsx`**
- Le 6 animazioni storiche sono rifinite (Kethran: flash giallo tenue su tutta l'immagine;
  Corte Rossa: fessura meno intensa; Calibri/HUD: la scansione finisce quando la linea
  raggiunge il fondo; Orizzonte/Orathai/Mounthborn: luce-frontiera nel colore d'armata).
- 4 nuove animazioni, una per le armate prima su `default`:
  - **occhio** — L'Enclave delle Scaglie (pupilla verticale che si dilata, quasi tutto su nero)
  - **sciame** — Ratti della Megera (corrosione che divora il nero dai bordi)
  - **rivolta** — Patto degli Indocili (il velo si frantuma in schegge Voronoi che si disperdono — "mai uniti")
  - **cerchi** — Khemet (anelli concentrici che scorrono in posizione come un puzzle)
- La firma pubblica resta `BattlefieldReveal({ imageSrc, animationType })`.
  L'accento d'armata è ricavato internamente da `ARMY_COLORS` (via `ANIM_TO_THEME` → `getAccent`),
  quindi nessun colore hard-coded.

**`battlefields.js`**
- Aggiunte 4 voci a `BATTLEFIELD_TEMA_TO_ANIMATION` (chiavi = `tema` reale nei dati):
  - `"Enclave delle Scaglie": 'occhio'`  (nota: senza apostrofo "L'", così com'è nei dati dei campi)
  - `"Ratti della Megera": 'sciame'`
  - `"Patto degli Indocili": 'rivolta'`
  - `"Khemet": 'cerchi'`

## Note
- Stili inline (nessuna dipendenza da nuove classi CSS o da `index.css`); funzionano a prescindere da Tailwind.
- Rispettano `prefers-reduced-motion` (fallback: fade rapido).
- Le animazioni usano `clip-path`, SVG `mask` e `transform`: assicurati che il browser target li supporti (tutti i Chromium/Electron recenti ok).
