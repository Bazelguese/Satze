// ============================================================
// SpectatorHud.jsx — fascia da telecronaca per le partite tra IA
// ============================================================
// Compare solo quando si guarda una serie del torneo: chi gioca, a che
// punto è la serie, una riga di commento che segue il duello, la bilancia
// dei PV e i comandi dello spettatore (AUTO, salta alla fine).
// Solo trasformazioni e opacità: non pesa sul tavolo.
// ============================================================

import { playUiClick } from '../../audio/soundBus';

function Pips({ wins, color }) {
  return (
    <span className="sph-pips" aria-hidden="true">
      {[0, 1].map((i) => <i key={i} className={i < wins ? 'on' : ''} style={{ '--c': color }} />)}
    </span>
  );
}

export function SpectatorHud({ roundName, gameNumber, names, colors, series, hp, line, over, auto, onToggleAuto, onSkip }) {
  const total = Math.max(1, (hp.a || 0) + (hp.b || 0));
  const share = Math.round(((hp.a || 0) / total) * 100);
  return (
    <div className="sph" style={{ '--ca': colors.a || '#a288fb', '--cb': colors.b || '#f5f3eb' }}>
      <div className="sph-plate">
        <div className="sph-row">
          <span className="sph-live"><i />SPETTATORE</span>
          <span className="sph-where">{roundName.toUpperCase()} · PARTITA {gameNumber}</span>
          {!over ? (
            <span className="sph-ctl">
              <button type="button" className={auto ? 'on' : ''} aria-pressed={auto} onClick={() => { playUiClick(); onToggleAuto(); }}>
                <span>AUTO {auto ? 'SÌ' : 'NO'}</span>
              </button>
              <button type="button" onClick={() => { playUiClick(); onSkip(); }}>
                <span>FINE PARTITA ▸▸</span>
              </button>
            </span>
          ) : null}
        </div>
        <div className="sph-row sph-vs">
          <b className="a">{names.a}</b>
          <Pips wins={series.a} color="var(--ca)" />
          <em>{series.a}–{series.b}</em>
          <Pips wins={series.b} color="var(--cb)" />
          <b className="b">{names.b}</b>
        </div>
        <div className="sph-row">
          <span className="sph-line" key={line}>{line}</span>
        </div>
        {/* bilancia dei PV: la quota di chi sta a sinistra */}
        <div className="sph-bal" aria-hidden="true"><i style={{ transform: `scaleX(${share / 100})` }} /></div>
      </div>
      <style>{`
        .sph {
          --ink: #f5f3eb; --void: #050507;
          /* in basso tra Glossario e mano: libero sia sul tavolo sia nella fascia nera del duello */
          position: fixed; left: 452px; bottom: 14px; z-index: 60; width: 604px;
          font-family: 'Chakra Petch', sans-serif; color: var(--ink); pointer-events: none;
          animation: sph-in .5s cubic-bezier(.2,1.2,.4,1) both;
        }
        @keyframes sph-in { from { opacity: 0; transform: translateY(60px) skewX(-8deg); } }
        .sph * { box-sizing: border-box; }
        .sph-plate {
          position: relative; display: flex; flex-direction: column; gap: 5px; padding: 8px 26px 12px 24px;
          background: rgba(5,5,7,0.9); transform: skewX(-14deg);
          box-shadow: 5px 5px 0 var(--ca), -5px -5px 0 var(--cb);
        }
        .sph-row { display: flex; align-items: center; gap: 14px; min-width: 0; transform: skewX(14deg); }
        .sph-live {
          flex: none; display: inline-flex; align-items: center; gap: 7px; background: var(--ink); color: var(--void);
          font-weight: 700; font-size: 12px; letter-spacing: 0.2em; padding: 2px 10px;
        }
        .sph-live i { width: 8px; height: 8px; border-radius: 50%; background: #e11d48; animation: sph-blink 1.4s steps(2, jump-none) infinite; }
        @keyframes sph-blink { 50% { opacity: 0.2; } }
        .sph-where { flex: none; font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: rgba(245,243,235,0.7); }
        .sph-vs { gap: 9px; }
        .sph-vs b { flex: 1 1 0; min-width: 0; font-weight: 700; font-style: italic; font-size: 16px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sph-vs b.a { color: var(--ca); text-align: right; }
        .sph-vs b.b { color: var(--cb); }
        .sph-vs em { flex: none; font-style: italic; font-weight: 700; font-size: 20px; white-space: nowrap; }
        .sph-pips { display: inline-flex; gap: 3px; }
        .sph-pips i { width: 9px; height: 13px; transform: skewX(-14deg); box-shadow: inset 0 0 0 1.5px var(--c); }
        .sph-pips i.on { background: var(--c); }
        .sph-line {
          flex: 1; min-width: 0; font-weight: 600; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          animation: sph-line .35s cubic-bezier(.2,.9,.3,1) both;
        }
        @keyframes sph-line { from { opacity: 0; transform: translateX(-18px); } }
        .sph-ctl { flex: none; margin-left: auto; display: flex; gap: 8px; pointer-events: auto; }
        .sph-ctl button {
          height: 26px; padding: 0 12px; border: 0; cursor: pointer; background: var(--void); color: rgba(245,243,235,0.75);
          font: 700 12px/1 'Chakra Petch', sans-serif; letter-spacing: 0.14em; white-space: nowrap;
          transform: skewX(-14deg); box-shadow: inset 0 0 0 2px rgba(245,243,235,0.3); transition: color .15s, box-shadow .15s, background .15s;
        }
        .sph-ctl button > span { display: inline-block; transform: skewX(14deg); }
        .sph-ctl button:hover, .sph-ctl button:focus-visible { color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
        .sph-ctl button.on { background: var(--ink); color: var(--void); box-shadow: none; }
        .sph-bal { position: absolute; left: 0; right: 0; bottom: 0; height: 5px; background: var(--cb); overflow: hidden; }
        .sph-bal i { display: block; width: 100%; height: 100%; background: var(--ca); transform-origin: left center; transition: transform .7s cubic-bezier(.2,.9,.3,1); }
        @media (prefers-reduced-motion: reduce) { .sph, .sph-line, .sph-live i { animation: none; } .sph-bal i { transition: none; } }
      `}</style>
    </div>
  );
}
