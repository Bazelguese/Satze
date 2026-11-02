// ============================================================
// ClaimVictoryPopup.jsx — Reclamazione della vittoria (round 3–4)
// ============================================================
// Stesso linguaggio del popup "Imposta la partita"
// (menu/cosmic/DifficultySelectPopup): lastra scura inclinata con
// ombra piena nel colore d'accento, etichetta obliqua, titolo grande in
// corsivo, piede chiaro con le azioni.
//  - ClaimVictoryPopup: il giocatore sceglie se reclamare o continuare.
//  - OpponentClaimPendingPopup: (PvP) si aspetta la scelta dell'avversario.
// Va renderizzato dentro il canvas di gioco (1920×1080).
// ============================================================

import { playUiClick } from '../../audio/soundBus';
import { MENU_ACCENTS } from '../../theme/hudOratorioPalette';

export function ClaimVictoryPopup({
  fields = 3,
  accentColor = MENU_ACCENTS.magenta,
  onClaim,
  onContinue,
}) {
  return (
    <div className="mcl" style={{ '--accent': accentColor }}>
      <div className="mcl-card" role="dialog" aria-modal="true" aria-label="Reclamare la vittoria">
        <div className="mcl-sheet">
          <header className="mcl-head">
            <span className="mcl-eye">VITTORIA A PORTATA</span>
            <h2>Hai conquistato {fields} campi!</h2>
          </header>
          <p className="mcl-body">
            Puoi reclamare la vittoria ora o continuare a giocare per accumulare più punti.
          </p>
          <footer className="mcl-foot">
            <button
              type="button"
              className="mcl-alt"
              onClick={() => { playUiClick(); onContinue?.(); }}
            >
              <span>CONTINUA A GIOCARE</span>
            </button>
            <button
              type="button"
              className="mcl-go"
              onClick={() => { playUiClick(); onClaim?.(); }}
            >
              <span>RECLAMA VITTORIA</span>
            </button>
          </footer>
        </div>
      </div>
      <ClaimPopupStyles />
    </div>
  );
}

export function OpponentClaimPendingPopup({
  opponentName,
  accentColor = MENU_ACCENTS.magenta,
}) {
  return (
    <div className="mcl" style={{ '--accent': accentColor }}>
      <div className="mcl-card" role="dialog" aria-modal="true" aria-label="In attesa dell'avversario">
        <div className="mcl-sheet">
          <header className="mcl-head">
            <span className="mcl-eye">IN ATTESA</span>
            <h2>{opponentName || "L'avversario"} ha conquistato 3 campi</h2>
          </header>
          <p className="mcl-body">
            Può reclamare la vittoria o continuare la partita.
          </p>
          <footer className="mcl-foot">
            <div className="mcl-wait">
              <span className="lbl">ATTENDI</span>
              <span className="hint">In attesa della sua scelta<span className="mcl-dots" aria-hidden>…</span></span>
            </div>
          </footer>
        </div>
      </div>
      <ClaimPopupStyles />
    </div>
  );
}

function ClaimPopupStyles() {
  return (
    <style>{`
      .mcl {
        --ink: #f5f3eb; --void: #050507; --dim: rgba(245,243,235,0.72);
        position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; pointer-events: auto;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent) 1.4px, transparent 1.8px) 0 0 / 11px 11px,
          rgba(5,5,7,0.84);
        font-family: 'Chakra Petch', sans-serif; color: var(--ink);
        animation: mcl-fade .2s ease both;
      }
      @keyframes mcl-fade { from { opacity: 0; } }
      .mcl * { box-sizing: border-box; }
      .mcl-card {
        width: 1040px; transform: rotate(-1.2deg);
        filter: drop-shadow(16px 16px 0 var(--accent));
        animation: mcl-in .34s cubic-bezier(.2,1.2,.4,1) both;
      }
      @keyframes mcl-in { from { opacity: 0; transform: rotate(-1.2deg) translateY(60px) skewX(-6deg); } }
      .mcl-sheet {
        position: relative; display: flex; flex-direction: column; background: var(--void);
        clip-path: polygon(0 0, 100% 0, calc(100% - 34px) 100%, 0 100%);
      }
      .mcl-sheet::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: var(--accent); }

      .mcl-head { position: relative; padding: 30px 72px 6px 52px; }
      .mcl-eye {
        position: absolute; left: 50px; top: 18px; background: var(--accent); color: var(--void);
        font-weight: 700; font-size: 14px; letter-spacing: 0.28em; padding: 3px 14px; transform: skewX(-14deg);
      }
      .mcl-head h2 {
        margin: 26px 0 0; font-weight: 700; font-style: italic; font-size: 64px; line-height: 0.98; letter-spacing: -0.02em;
        text-shadow: 6px 6px 0 var(--accent); text-transform: uppercase;
      }
      .mcl-body {
        margin: 0; padding: 18px 92px 30px 52px;
        font-weight: 600; font-size: 22px; line-height: 1.35; color: var(--dim);
      }

      .mcl-foot {
        display: flex; align-items: center; justify-content: flex-end; gap: 26px; padding: 22px 76px 20px 52px;
        background: var(--ink); color: var(--void);
        clip-path: polygon(0 16px, 100% 0, 100% 100%, 0 100%);
      }
      .mcl-alt, .mcl-go {
        display: inline-flex; align-items: center; border: 0; cursor: pointer; margin-top: 8px;
        transform: skewX(-14deg); transition: transform .15s, box-shadow .15s, background .15s, color .15s;
      }
      .mcl-alt > *, .mcl-go > * { transform: skewX(14deg); }
      .mcl-alt {
        height: 58px; padding: 0 28px; background: transparent; color: var(--void);
        font: italic 700 24px/1 'Chakra Petch', sans-serif; letter-spacing: 0.04em;
        box-shadow: inset 0 0 0 3px var(--void);
      }
      .mcl-alt:hover, .mcl-alt:focus-visible { background: var(--void); color: var(--ink); box-shadow: 5px 5px 0 var(--accent); }
      .mcl-go {
        height: 66px; padding: 0 36px; background: var(--accent); color: var(--void);
        font: italic 700 36px/1 'Chakra Petch', sans-serif; letter-spacing: 0.02em;
        box-shadow: 7px 7px 0 var(--void);
      }
      .mcl-go:hover, .mcl-go:focus-visible { transform: skewX(-14deg) translate(-3px,-3px) rotate(-1deg); box-shadow: 11px 11px 0 var(--void); }

      .mcl-wait { flex: 1; min-width: 0; display: flex; align-items: center; gap: 16px; padding-top: 10px; }
      .mcl-wait .lbl {
        flex: none; background: var(--void); color: var(--ink); font-weight: 700; font-size: 14px; letter-spacing: 0.14em;
        padding: 4px 14px; transform: skewX(-14deg); box-shadow: 4px 4px 0 var(--accent);
      }
      .mcl-wait .hint { font-weight: 600; font-size: 20px; }
      .mcl-dots { display: inline-block; animation: mcl-blink 1.2s ease-in-out infinite; }
      @keyframes mcl-blink { 50% { opacity: .25; } }

      @media (prefers-reduced-motion: reduce) {
        .mcl, .mcl-card, .mcl-dots { animation: none; }
      }
    `}</style>
  );
}
