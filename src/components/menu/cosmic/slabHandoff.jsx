// ============================================================
// slabHandoff.jsx — passaggio "a taglio" tra Scelta armata e Scelta esercito
// ============================================================
// La scelta armata chiude coprendo lo schermo con la lastra inclinata e ci
// scrive sopra il nome dell'armata; la scelta esercito, se trova il passaggio
// appena armato, parte con la stessa lastra e lo stesso titolo a schermo
// pieno e li fa scorrere via nello stesso verso. Niente schermo vuoto in mezzo.
// ============================================================

import React from 'react';

const MAX_AGE_MS = 2000;

/** Colore pieno della lastra: identico alla fine dell'una e all'inizio dell'altra. */
export const HANDOFF_BG = '#09080d';

let pending = null;

/** Da chiamare un attimo prima di cambiare schermata, a lastra chiusa. */
export function armSlabHandoff(color, name) {
  pending = { color, name, at: Date.now() };
}

/** Legge il passaggio senza consumarlo (sicuro con i doppi render di StrictMode). */
export function peekSlabHandoff() {
  if (!pending || Date.now() - pending.at > MAX_AGE_MS) return null;
  return pending;
}

export function clearSlabHandoff() {
  pending = null;
}

/**
 * Titolo scritto sulla lastra chiusa. `mode="in"` entra (fine scelta armata),
 * `mode="out"` parte già fermo e scivola via con la lastra (inizio scelta esercito).
 */
export function SlabHandoffTitle({ name, color, mode }) {
  return (
    <div className={`sho-title sho-title--${mode}`} style={{ '--hc': color }} aria-hidden="true">
      <span className="k">FASE II · ARRUOLAMENTO</span>
      <b className={name && name.length > 18 ? 'long' : ''}>{name}</b>
      <style>{`
        .sho-title {
          position: absolute; left: 50%; top: 50%; z-index: 10000; pointer-events: none;
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          transform: translate(-50%, -50%) rotate(-3deg);
          font-family: 'Chakra Petch', sans-serif; color: #f5f3eb; text-align: center; white-space: nowrap;
        }
        .sho-title .k {
          background: var(--hc); color: #050507; font-weight: 700; font-size: 16px; letter-spacing: 0.3em;
          padding: 3px 16px; transform: skewX(-14deg);
        }
        .sho-title b {
          font-weight: 700; font-style: italic; font-size: 96px; line-height: 0.95; text-transform: uppercase;
          letter-spacing: -0.015em; text-shadow: 6px 6px 0 var(--hc), 12px 12px 0 #050507;
        }
        .sho-title b.long { font-size: 74px; }
        .sho-title--in { animation: sho-in .32s cubic-bezier(.22,1,.36,1) .3s both; }
        @keyframes sho-in { from { opacity: 0; transform: translate(calc(-50% + 140px), -50%) rotate(-3deg); } }
        .sho-title--out { animation: sho-out .5s cubic-bezier(.7,0,.25,1) .08s forwards; }
        @keyframes sho-out { to { opacity: 0; transform: translate(calc(-50% - 700px), -50%) rotate(-3deg); } }
      `}</style>
    </div>
  );
}
