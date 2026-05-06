/**
 * Animazioni d'ingresso campi di battaglia - integrate da satze-animations-v5.jsx
 * Versione semplificata per la galleria (solo reveal immagine, senza overlay/skip)
 */
import React, { useState, useEffect, useMemo, useId } from 'react';
import { ARMY_COLORS } from '../../data';

const Img = ({ src, style = {} }) => (
  <img src={src} className="absolute inset-0 w-full h-full object-cover object-center" style={style} alt="" />
);

const THEME_TO_ARMY = {
  figliOrizzonte: "Figli dell'Orizzonte",
  kethran: 'Kethran',
  corteRossa: 'Corte Rossa',
  calibri: 'Calibri Pesanti',
  orathai: 'Orathai',
  natiBocca: 'Mounthborn',
};

const getAccent = (theme) => {
  const name = THEME_TO_ARMY[theme];
  return name ? (ARMY_COLORS[name]?.accent || '#94a3b8') : '#94a3b8';
};

/** usePhase: passa a phase 1 dopo 30ms per avviare l'animazione */
const usePhase = () => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 30);
    return () => clearTimeout(t);
  }, []);
  return phase;
};

// 1. SWIRL — Figli dell'Orizzonte (spirale: cerchio si espande + immagine ruota e scala)
const SwirlReveal = ({ imageSrc }) => {
  const phase = usePhase();
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0" style={{
        clipPath: phase >= 1 ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)',
        transition: 'clip-path 900ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <Img src={imageSrc} style={{
          transform: phase >= 1 ? 'scale(1) rotate(0deg)' : 'scale(1.5) rotate(-20deg)',
          transition: 'transform 950ms cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
    </div>
  );
};

// 2. FRAMMENTI — Kethran (griglia che converge; immagine piena sopra copre la griglia nera)
const FrammentiReveal = ({ imageSrc }) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 30);
    const t2 = setTimeout(() => setPhase(2), 1050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const COLS = 5, ROWS = 4;
  const pieces = useMemo(() =>
    Array.from({ length: COLS * ROWS }).map((_, i) => ({
      col: i % COLS, row: Math.floor(i / COLS),
      ox: (Math.random() - 0.5) * 300,
      oy: (Math.random() - 0.5) * 200,
      rot: (Math.random() - 0.5) * 25,
      delay: Math.random() * 0.15,
    })), []
  );
  const w = 100 / COLS, h = 100 / ROWS;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      {phase >= 1 && pieces.map((p, i) => {
        const cl = p.col * w, ct = p.row * h;
        return (
          <div key={i} className="absolute inset-0" style={{
            clipPath: `inset(${ct}% ${100 - (p.col + 1) * w}% ${100 - (p.row + 1) * h}% ${cl}%)`,
            transform: `translate(${p.ox}px, ${p.oy}px) rotate(${p.rot}deg)`,
            opacity: 0.7,
            animation: `battlefield-converge 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}s forwards`,
          }}>
            <Img src={imageSrc} />
          </div>
        );
      })}
      {/* Immagine piena sopra: copre la griglia nera tra i pezzi, fade rapido per minimizzare stacco */}
      {phase >= 2 && (
        <div className="absolute inset-0" style={{ opacity: 0, animation: 'battlefield-fade-cover 0.15s ease-out forwards' }}>
          <Img src={imageSrc} />
        </div>
      )}
      <style>{`
        @keyframes battlefield-converge {
          to { transform: translate(0, 0) rotate(0deg); opacity: 1; }
        }
        @keyframes battlefield-fade-cover {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// 3. SIPARIO — Corte Rossa (due metà si aprono dal centro)
const SiparioReveal = ({ imageSrc }) => {
  const phase = usePhase();
  const accent = getAccent('corteRossa');
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <Img src={imageSrc} />
      </div>
      <div className="absolute inset-0 bg-black pointer-events-none" style={{
        clipPath: phase >= 1 ? 'inset(0 100% 0 0)' : 'inset(0 50% 0 0)',
        transition: 'clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 5,
      }} />
      <div className="absolute inset-0 bg-black pointer-events-none" style={{
        clipPath: phase >= 1 ? 'inset(0 0 0 100%)' : 'inset(0 0 0 50%)',
        transition: 'clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 5,
      }} />
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
        width: '2px',
        background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
        boxShadow: `0 0 12px ${accent}60`,
        opacity: phase >= 1 ? 0 : 0.7,
        transition: 'opacity 0.6s 0.2s',
        zIndex: 6,
      }} />
    </div>
  );
};

// 4. HUD — Calibri Pesanti (scansione dall'alto)
const HudReveal = ({ imageSrc }) => {
  const [phase, setPhase] = useState(0);
  const [scanY, setScanY] = useState(0);
  const accent = getAccent('calibri');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 50),
      setTimeout(() => setPhase(2), 800),
    ];
    let start = null;
    let raf;
    const scan = (ts) => {
      if (!start) start = ts;
      setScanY(Math.min((ts - start) / 700 * 100, 100));
      if (ts - start < 700) raf = requestAnimationFrame(scan);
    };
    const scanStart = setTimeout(() => { raf = requestAnimationFrame(scan); }, 100);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(scanStart);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0" style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 200ms' }}>
        <Img src={imageSrc} style={{
          filter: phase >= 2 ? 'brightness(1) saturate(1)' : 'brightness(0.3) saturate(0)',
          transition: 'filter 0.5s',
        }} />
      </div>
      {phase >= 1 && phase < 3 && (
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 ${100 - scanY}% 0)` }}>
          <Img src={imageSrc} />
        </div>
      )}
      {phase >= 1 && phase < 3 && (
        <div className="absolute left-0 right-0 pointer-events-none" style={{
          top: `${scanY}%`, height: '1px',
          background: accent,
          boxShadow: `0 0 8px ${accent}, 0 0 20px ${accent}80`,
          opacity: phase >= 2 ? 0 : 0.9,
          transition: 'opacity 0.3s',
          zIndex: 15,
        }} />
      )}
      {phase >= 1 && phase < 3 && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 12, opacity: phase >= 2 ? 0 : 0.12, transition: 'opacity 0.4s' }}>
          {[20, 40, 60, 80].map(x => (
            <div key={`v${x}`} className="absolute top-0 bottom-0" style={{ left: `${x}%`, width: '1px', background: accent }} />
          ))}
          {[25, 50, 75].map(y => (
            <div key={`h${y}`} className="absolute left-0 right-0" style={{ top: `${y}%`, height: '1px', background: accent }} />
          ))}
        </div>
      )}
    </div>
  );
};

// 5. ONDA — Orathai (cerchio dal basso)
const OndaReveal = ({ imageSrc }) => {
  const phase = usePhase();
  const accent = getAccent('orathai');
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0" style={{
        clipPath: phase >= 1 ? 'circle(150% at 50% 80%)' : 'circle(0% at 50% 80%)',
        transition: 'clip-path 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <Img src={imageSrc} style={{
          transform: phase >= 1 ? 'scale(1)' : 'scale(1.05)',
          transition: 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }} />
      </div>
      <div className="absolute rounded-full pointer-events-none" style={{
        left: '50%', top: '80%',
        transform: 'translate(-50%, -50%)',
        width: phase >= 1 ? '200vmax' : '0px',
        height: phase >= 1 ? '200vmax' : '0px',
        border: `1px solid ${accent}35`,
        transition: 'all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: phase >= 2 ? 0 : 1,
      }} />
    </div>
  );
};

// Per Onda: phase 2 per nascondere l'anello
const OndaRevealWithPhase = ({ imageSrc }) => {
  const [phase, setPhase] = useState(0);
  const accent = getAccent('orathai');
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 30);
    const t2 = setTimeout(() => setPhase(2), 950);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0" style={{
        clipPath: phase >= 1 ? 'circle(150% at 50% 80%)' : 'circle(0% at 50% 80%)',
        transition: 'clip-path 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <Img src={imageSrc} style={{
          transform: phase >= 1 ? 'scale(1)' : 'scale(1.05)',
          transition: 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }} />
      </div>
      <div className="absolute rounded-full pointer-events-none" style={{
        left: '50%', top: '80%',
        transform: 'translate(-50%, -50%)',
        width: phase >= 1 ? '200vmax' : '0px',
        height: phase >= 1 ? '200vmax' : '0px',
        border: `1px solid ${accent}35`,
        transition: 'all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: phase >= 2 ? 0 : 1,
      }} />
    </div>
  );
};

// 6. MORSI — Mounthborn (buchi organici che rivelano)
const MorsiReveal = ({ imageSrc }) => {
  const maskId = useId();
  const [phase, setPhase] = useState(0);
  const bites = useMemo(() =>
    Array.from({ length: 14 }).map(() => ({
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      r: 22 + Math.random() * 20,
      delay: Math.random() * 0.25,
      subs: Array.from({ length: 4 }).map(() => ({
        dx: (Math.random() - 0.5) * 18,
        dy: (Math.random() - 0.5) * 18,
        dr: 12 + Math.random() * 14,
      })),
    })), []
  );
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 30);
    const t2 = setTimeout(() => setPhase(2), 950);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <Img src={imageSrc} />
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity: phase >= 2 ? 0 : 1,
        transition: 'opacity 0.2s',
        zIndex: 5,
      }}>
        <svg width="100%" height="100%" style={{ display: 'block' }}>
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              {bites.map((b, i) => (
                <g key={i}>
                  <circle
                    cx={`${b.x}%`} cy={`${b.y}%`}
                    r={phase >= 1 ? `${b.r}%` : '0%'}
                    fill="black"
                    style={{ transition: `r 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${b.delay}s` }}
                  />
                  {b.subs.map((s, j) => (
                    <circle key={j}
                      cx={`${b.x + s.dx}%`} cy={`${b.y + s.dy}%`}
                      r={phase >= 1 ? `${s.dr}%` : '0%'}
                      fill="black"
                      style={{ transition: `r 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${b.delay + 0.05}s` }}
                    />
                  ))}
                </g>
              ))}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="black" mask={`url(#${maskId})`} />
        </svg>
      </div>
    </div>
  );
};

const REVEAL_MAP = {
  swirl: SwirlReveal,
  frammenti: FrammentiReveal,
  sipario: SiparioReveal,
  hud: HudReveal,
  onda: OndaRevealWithPhase,
  morsi: MorsiReveal,
};

/**
 * Componente principale: mostra l'immagine del campo con l'animazione appropriata
 * @param {string} imageSrc - URL dell'immagine
 * @param {string} animationType - swirl | frammenti | sipario | hud | onda | morsi
 */
export function BattlefieldReveal({ imageSrc, animationType }) {
  const RevealComponent = REVEAL_MAP[animationType];
  if (!RevealComponent) {
    return (
      <div className="absolute inset-0 overflow-hidden animate-battlefield-reveal-default">
        <img src={imageSrc} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
      </div>
    );
  }
  return <RevealComponent imageSrc={imageSrc} />;
}
