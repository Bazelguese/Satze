/**
 * Schermata di caricamento — stile Persona (lastra diagonale, retino,
 * barra a tacche inclinate, "CARICAMENTO" in basso a destra).
 *
 * Gira sia a tutta finestra (avvio, fuori da GameViewport) sia dentro il
 * canvas 1920×1080 scalato (ingresso costruzione esercito): le misure usano
 * unità del contenitore (cqw / cqh / cqmin), non vw/vh.
 */
import React from 'react';
import {
  MENU_ACCENTS,
  HUD_ORATORIO_FONT_UI,
  BRAND_LOGO_SRC,
  BRAND_LOGO_WIDTH,
  BRAND_LOGO_HEIGHT,
} from '../theme/hudOratorioPalette';

const TICKS = 40;
const LOADING_WORD = 'CARICAMENTO';

export function LoadingScreen({ progress = 0, detail = null }) {
  const p = Math.min(100, Math.max(0, progress));
  const label = p >= 100 ? 'Pronto' : (detail || 'Caricamento risorse');
  const filled = Math.round((p / 100) * TICKS);

  return (
    <div
      className="sls"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
    >
      <div className="sls-stage">
        <div className="sls-bg" aria-hidden="true">
          <div className="sls-slab" />
          <div className="sls-slab-edge" />
          <div className="sls-halftone" />
          <div className="sls-stripes" />
        </div>

        <div className="sls-center">
          <div className="satze-brand-logo-wrap sls-logo">
            <div className="satze-brand-logo-pulse">
              <div className="satze-brand-logo-glare-host">
                <img
                  src={BRAND_LOGO_SRC}
                  alt="SATZE"
                  width={BRAND_LOGO_WIDTH}
                  height={BRAND_LOGO_HEIGHT}
                  decoding="async"
                  fetchpriority="high"
                  className="satze-brand-logo"
                />
                <div
                  className="satze-brand-logo-glare-layer"
                  aria-hidden
                  style={{
                    WebkitMaskImage: `url(${BRAND_LOGO_SRC})`,
                    maskImage: `url(${BRAND_LOGO_SRC})`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="sls-tagline"><span>LA GRANDE GUERRA</span></div>

          <div className="sls-bar">
            <div className="sls-ticks" aria-hidden="true">
              {Array.from({ length: TICKS }, (_, i) => (
                <span key={i} className={i < filled ? 'on' : ''} />
              ))}
            </div>
            <div className="sls-pct">
              {Math.round(p)}<small>%</small>
            </div>
          </div>
          <div className="sls-detail"><span>{label}</span></div>
        </div>

        <div className="sls-now" aria-hidden="true">
          <span className="sls-now-burst" />
          <span className="sls-now-word">
            {LOADING_WORD.split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.07}s` }}>{ch}</span>
            ))}
          </span>
        </div>
      </div>

      <style>{`
        .sls {
          position: fixed; inset: 0; z-index: 99999;
          container-type: size;
          background: ${MENU_ACCENTS.void};
          color: ${MENU_ACCENTS.text};
          font-family: ${HUD_ORATORIO_FONT_UI};
          overflow: hidden;
        }
        .sls * { box-sizing: border-box; }
        .sls-stage { position: absolute; inset: 0; }

        /* Fondo */
        .sls-bg { position: absolute; inset: 0; pointer-events: none; }
        .sls-slab {
          position: absolute; top: -20%; bottom: -20%; right: -12%; width: 46%;
          background: linear-gradient(160deg, ${MENU_ACCENTS.magenta} 0%, #6d28d9 100%);
          transform: skewX(-14deg);
          animation: sls-slab-in .6s cubic-bezier(.2,.9,.2,1) both;
        }
        .sls-slab-edge {
          position: absolute; top: -20%; bottom: -20%; right: 34%; width: 1.2cqw;
          background: ${MENU_ACCENTS.text};
          transform: skewX(-14deg);
          animation: sls-slab-in .6s .05s cubic-bezier(.2,.9,.2,1) both;
        }
        @keyframes sls-slab-in { from { transform: skewX(-14deg) translateX(120%); } }
        .sls-halftone {
          position: absolute; inset: 0; opacity: 0.35;
          background-image: radial-gradient(circle, ${MENU_ACCENTS.void} 1.6px, transparent 2.1px);
          background-size: 12px 12px;
          -webkit-mask-image: linear-gradient(110deg, transparent 55%, #000 80%);
          mask-image: linear-gradient(110deg, transparent 55%, #000 80%);
        }
        .sls-stripes {
          position: absolute; inset: -10%; opacity: 0.06;
          background-image: repeating-linear-gradient(-77deg, #fff 0 2px, transparent 2px 46px);
          animation: sls-stripes 6s linear infinite;
        }
        @keyframes sls-stripes { to { transform: translateX(-47px); } }

        /* Centro: logo, motto, barra */
        .sls-center {
          position: absolute; left: 36%; top: 47%;
          width: min(56cqw, 860px);
          transform: translate(-50%, -50%) rotate(-3deg);
          display: flex; flex-direction: column; align-items: center;
          gap: clamp(8px, 1.6cqh, 18px);
        }
        .sls-logo { margin: 0 auto; }
        .sls-logo img {
          display: block; margin: 0 auto;
          width: min(48cqw, 640px); height: auto;
          max-height: clamp(110px, 36cqh, 340px);
          object-fit: contain;
          filter: drop-shadow(0 0 30px rgba(192, 38, 211, 0.35));
        }
        .sls-tagline {
          background: ${MENU_ACCENTS.text}; color: ${MENU_ACCENTS.void};
          font-weight: 700; font-size: clamp(11px, 1.5cqh, 16px); letter-spacing: 0.4em;
          padding: 4px 18px 4px 22px;
          transform: skewX(-14deg);
          box-shadow: 5px 5px 0 ${MENU_ACCENTS.magenta};
        }
        .sls-tagline > span { display: inline-block; transform: skewX(14deg); }

        .sls-bar {
          margin-top: clamp(10px, 2.4cqh, 28px);
          width: 100%;
          display: flex; align-items: flex-end; gap: clamp(10px, 1.4cqw, 22px);
        }
        .sls-ticks {
          flex: 1; display: grid; grid-template-columns: repeat(${TICKS}, minmax(0, 1fr));
          gap: clamp(2px, 0.25cqw, 4px); height: clamp(14px, 2.4cqh, 26px);
        }
        .sls-ticks > span {
          background: rgba(245, 243, 235, 0.12);
          transform: skewX(-20deg);
          transition: background .2s;
        }
        .sls-ticks > span:nth-child(5n) { background: rgba(245, 243, 235, 0.2); }
        .sls-ticks > span.on { background: ${MENU_ACCENTS.text}; }
        .sls-ticks > span.on:nth-child(5n) { background: ${MENU_ACCENTS.hotPink}; }
        .sls-pct {
          flex: none; min-width: 2.3em; text-align: left;
          font-weight: 700; font-style: italic; line-height: 0.85;
          font-size: clamp(30px, 6cqh, 64px);
          font-variant-numeric: tabular-nums;
          text-shadow: 4px 4px 0 ${MENU_ACCENTS.magenta};
        }
        .sls-pct small { font-size: 0.45em; margin-left: 2px; }
        .sls-detail {
          align-self: flex-start;
          background: ${MENU_ACCENTS.void}; color: ${MENU_ACCENTS.text};
          box-shadow: inset 0 0 0 2px ${MENU_ACCENTS.text};
          font-weight: 700; font-size: clamp(11px, 1.5cqh, 16px); letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 5px 16px;
          transform: skewX(-14deg);
        }
        .sls-detail > span { display: inline-block; transform: skewX(14deg); }

        /* "CARICAMENTO" in basso a destra, con stella che gira */
        .sls-now {
          position: absolute; right: clamp(20px, 3cqw, 56px); bottom: clamp(18px, 4cqh, 48px);
          display: flex; align-items: center; gap: clamp(8px, 1cqw, 16px);
          transform: rotate(-6deg);
        }
        .sls-now-burst {
          width: clamp(34px, 6cqh, 64px); height: clamp(34px, 6cqh, 64px);
          background: ${MENU_ACCENTS.void};
          clip-path: polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%);
          animation: sls-spin 2.4s linear infinite;
        }
        @keyframes sls-spin { to { transform: rotate(360deg); } }
        .sls-now-word {
          display: inline-flex;
          font-weight: 700; font-style: italic; letter-spacing: 0.02em;
          font-size: clamp(22px, 4.6cqh, 50px);
          color: ${MENU_ACCENTS.void};
          text-shadow: 3px 3px 0 ${MENU_ACCENTS.text};
        }
        .sls-now-word > span { display: inline-block; animation: sls-hop 1.2s ease-in-out infinite; }
        @keyframes sls-hop { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-22%); } }

        @media (prefers-reduced-motion: reduce) {
          .sls *, .sls *::before, .sls *::after { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
