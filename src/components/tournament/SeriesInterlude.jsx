// ============================================================
// SeriesInterlude.jsx — cartello tra una partita e l'altra di una serie
// ============================================================
// Nel torneo la serie si gioca tutta sullo stesso tavolo: finita una
// partita le mani escono di scena, questo cartello dice che partita
// comincia e quali carte arrivano, poi parte la nuova distribuzione.
// I movimenti del tavolo stanno in src/styles/satze-torneo-tavolo.css.
// ============================================================

const RULE_TEXT = {
  draw: '5 carte a caso',
  remainder: 'Le 5 carte rimaste fuori dalla partita 1',
  reshuffle: 'Spareggio · esercito rimischiato, 5 carte a caso',
};

export function SeriesInterlude({ roundName, gameNumber, rule, score, stage, accent }) {
  return (
    <div className={`sil${stage === 'leaving' ? ' is-leaving' : ''}`} style={{ '--accent': accent || '#a288fb' }} role="status" aria-live="polite">
      <div className="sil-plate">
        <span className="sil-eye">{(roundName || '').toUpperCase()} · SERIE {score}</span>
        <span className="sil-title">PARTITA {gameNumber}</span>
        <span className="sil-rule">{RULE_TEXT[rule] || ''}</span>
      </div>
      <style>{`
        .sil {
          --ink: #f5f3eb; --void: #050507;
          position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; pointer-events: none;
          font-family: 'Chakra Petch', sans-serif;
        }
        .sil-plate {
          display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 22px 64px 26px 48px;
          background: var(--ink); color: var(--void);
          transform: skewX(-14deg) rotate(-2deg); box-shadow: 12px 12px 0 var(--accent);
          animation: sil-in .42s cubic-bezier(.2,1.2,.4,1) both;
        }
        .sil-plate > * { transform: skewX(14deg); }
        .sil-eye { background: var(--void); color: var(--ink); font-weight: 700; font-size: 15px; letter-spacing: 0.22em; padding: 3px 14px; }
        .sil-title { font-weight: 700; font-style: italic; font-size: 110px; line-height: 0.95; letter-spacing: -0.02em; }
        .sil-rule { font-weight: 700; font-size: 24px; text-transform: uppercase; letter-spacing: 0.02em; }
        @keyframes sil-in { from { opacity: 0; transform: skewX(-22deg) rotate(-2deg) translateX(-180px); } }
        .sil.is-leaving .sil-plate { animation: sil-out .34s cubic-bezier(.6,0,.9,.4) forwards; }
        @keyframes sil-out { to { opacity: 0; transform: skewX(-22deg) rotate(-2deg) translateX(220px); } }

        @media (prefers-reduced-motion: reduce) {
          .sil-plate, .sil.is-leaving .sil-plate { animation: none; }
        }
      `}</style>
    </div>
  );
}
