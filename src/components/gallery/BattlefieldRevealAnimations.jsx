/**
 * Satze — Animazioni d'ingresso campi di battaglia (reveal)
 * 10 reveal, una per armata: 6 storiche rifinite + 4 nuove (occhio, sciame, rivolta, cerchi).
 * L'accento è ricavato dall'armata via ARMY_COLORS — nessun colore hard-coded.
 *
 * <BattlefieldReveal imageSrc animationType />
 *   animationType arriva da getBattlefieldAnimationType(fieldId) (vedi src/data/battlefields.js).
 */
import React, { useState, useEffect, useMemo, useId } from 'react';
import { ARMY_COLORS } from '../../data';
import { resolvePublicAssetUrl } from '../../utils/preloadAssets';

// chiave tema interna → nome armata in ARMY_COLORS
const THEME_TO_ARMY = {
  figliOrizzonte: "Figli dell'Orizzonte",
  kethran: 'Kethran',
  corteRossa: 'Corte Rossa',
  calibri: 'Calibri Pesanti',
  orathai: 'Orathai',
  natiBocca: 'Mounthborn',
  enclave: "L'Enclave delle Scaglie",
  ratti: 'Ratti della Megera',
  indocili: 'Patto degli Indocili',
  khemet: 'Khemet',
};

// tipo animazione → chiave tema (per ricavare l'accento dell'armata)
const ANIM_TO_THEME = {
  swirl: 'figliOrizzonte', frammenti: 'kethran', sipario: 'corteRossa', hud: 'calibri',
  onda: 'orathai', morsi: 'natiBocca', occhio: 'enclave', sciame: 'ratti',
  rivolta: 'indocili', cerchi: 'khemet',
};

const getAccent = (theme) => {
  const name = THEME_TO_ARMY[theme];
  return name ? (ARMY_COLORS[name]?.accent || '#94a3b8') : '#94a3b8';
};

const EASE_OUT  = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_STD  = 'cubic-bezier(0.4, 0, 0.2, 1)';
const EASE_BACK = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const fill = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' };

const Img = ({ src, style = {} }) => (
  <img src={src} alt="" style={{ ...fill, objectFit: 'cover', objectPosition: 'center', ...style }} />
);

/** usePhases([t1,t2,...]) → indice fase 0..N che avanza ai timeout (ms) indicati. */
const usePhases = (steps) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = steps.map((ms, i) => setTimeout(() => setPhase(i + 1), ms));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return phase;
};

/* ─────────── 1. SWIRL — Figli dell'Orizzonte ─────────── */
const SwirlReveal = ({ imageSrc, accent, f }) => {
  const on = usePhases([30]) >= 1;
  const D = Math.round(1100 * f);
  return (
    <div style={{ ...fill, overflow: 'hidden' }}>
      <div style={{ ...fill, background: '#000' }} />
      <div style={{ ...fill, clipPath: on ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)', transition: `clip-path ${D}ms ${EASE_OUT}` }}>
        <Img src={imageSrc} style={{ transform: on ? 'scale(1) rotate(0deg)' : 'scale(1.5) rotate(-22deg)', transition: `transform ${Math.round(D * 1.05)}ms ${EASE_OUT}` }} />
      </div>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: on ? '200vmax' : '0px', height: on ? '200vmax' : '0px', borderRadius: '50%', border: `2px solid ${accent}`, boxShadow: `0 0 26px ${accent}, inset 0 0 26px ${accent}`, opacity: on ? 0 : 0.9, transition: `all ${D}ms ${EASE_OUT}`, pointerEvents: 'none', mixBlendMode: 'screen' }} />
    </div>
  );
};

/* ─────────── 2. FRAMMENTI — Kethran ─────────── */
const FrammentiReveal = ({ imageSrc, accent, f }) => {
  const p = usePhases([30, Math.round(1150 * f)]);
  const COLS = 5, ROWS = 4;
  const pieces = useMemo(() => Array.from({ length: COLS * ROWS }).map((_, i) => ({
    col: i % COLS, row: Math.floor(i / COLS),
    ox: (Math.random() - 0.5) * 320, oy: (Math.random() - 0.5) * 220,
    rot: (Math.random() - 0.5) * 28, delay: Math.random() * 0.18,
  })), []);
  const w = 100 / COLS, h = 100 / ROWS;
  const conv = Math.round(820 * f);
  return (
    <div style={{ ...fill, overflow: 'hidden' }}>
      <div style={{ ...fill, background: '#000' }} />
      {p >= 1 && pieces.map((pc, i) => (
        <div key={i} style={{ ...fill, clipPath: `inset(${pc.row * h}% ${100 - (pc.col + 1) * w}% ${100 - (pc.row + 1) * h}% ${pc.col * w}%)`, transform: `translate(${pc.ox}px, ${pc.oy}px) rotate(${pc.rot}deg)`, opacity: 0.7, animation: `bf-converge ${conv}ms ${EASE_OUT} ${pc.delay}s forwards` }}>
          <Img src={imageSrc} />
        </div>
      ))}
      {p >= 2 && <div style={{ ...fill, opacity: 0, animation: `bf-fade ${Math.round(160 * f)}ms ease-out forwards` }}><Img src={imageSrc} /></div>}
      {p >= 2 && <div style={{ ...fill, background: accent, mixBlendMode: 'screen', opacity: 0, animation: `bf-flash ${Math.round(520 * f)}ms ease-out forwards`, pointerEvents: 'none' }} />}
      <style>{`@keyframes bf-converge{to{transform:translate(0,0) rotate(0deg);opacity:1}}@keyframes bf-fade{to{opacity:1}}@keyframes bf-flash{0%{opacity:0}30%{opacity:.16}100%{opacity:0}}`}</style>
    </div>
  );
};

/* ─────────── 3. SIPARIO — Corte Rossa ─────────── */
const SiparioReveal = ({ imageSrc, accent, f }) => {
  const on = usePhases([30]) >= 1;
  const D = Math.round(920 * f);
  return (
    <div style={{ ...fill, overflow: 'hidden' }}>
      <div style={fill}><Img src={imageSrc} style={{ transform: on ? 'scale(1)' : 'scale(1.08)', transition: `transform ${Math.round(D * 1.5)}ms ${EASE_OUT}` }} /></div>
      <div style={{ ...fill, background: '#000', clipPath: on ? 'inset(0 100% 0 0)' : 'inset(0 50% 0 0)', transition: `clip-path ${D}ms ${EASE_STD}`, zIndex: 5 }} />
      <div style={{ ...fill, background: '#000', clipPath: on ? 'inset(0 0 0 100%)' : 'inset(0 0 0 50%)', transition: `clip-path ${D}ms ${EASE_STD}`, zIndex: 5 }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '2px', background: `linear-gradient(to bottom, transparent, ${accent}aa, transparent)`, boxShadow: `0 0 8px ${accent}66, 0 0 16px ${accent}33`, opacity: on ? 0 : 0.5, transition: `opacity ${Math.round(D * 0.7)}ms ${Math.round(D * 0.25)}ms`, zIndex: 6, pointerEvents: 'none' }} />
    </div>
  );
};

/* ─────────── 4. HUD — Calibri Pesanti ─────────── */
const HudReveal = ({ imageSrc, accent, f }) => {
  const [phase, setPhase] = useState(0);
  // Scan via transizioni CSS lineari (clip-path e top) invece di rAF+setState
  const [scanOn, setScanOn] = useState(false);
  const dur = Math.round(1700 * f);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 50),
      setTimeout(() => setScanOn(true), 100),
      setTimeout(() => setPhase(2), dur),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const scanning = phase >= 1 && phase < 2;
  return (
    <div style={{ ...fill, overflow: 'hidden' }}>
      <div style={{ ...fill, background: '#000' }} />
      <div style={{ ...fill, opacity: phase >= 1 ? 1 : 0, transition: 'opacity 200ms' }}>
        <Img src={imageSrc} style={{ filter: phase >= 2 ? 'brightness(1) saturate(1)' : 'brightness(0.32) saturate(0)', transition: `filter ${Math.round(520 * f)}ms` }} />
      </div>
      {scanning && <div style={{ ...fill, clipPath: scanOn ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)', transition: `clip-path ${dur}ms linear` }}><Img src={imageSrc} /></div>}
      {scanning && <div style={{ position: 'absolute', left: 0, right: 0, top: scanOn ? '100%' : '0%', height: '2px', background: accent, boxShadow: `0 0 10px ${accent}, 0 0 26px ${accent}80`, opacity: 0.95, zIndex: 15, pointerEvents: 'none', transition: `top ${dur}ms linear` }} />}
      <div style={{ ...fill, zIndex: 12, opacity: phase >= 2 ? 0 : 0.12, transition: 'opacity 400ms', pointerEvents: 'none' }}>
        {[20, 40, 60, 80].map((x) => <div key={'v' + x} style={{ position: 'absolute', top: 0, bottom: 0, left: `${x}%`, width: '1px', background: accent }} />)}
        {[25, 50, 75].map((y) => <div key={'h' + y} style={{ position: 'absolute', left: 0, right: 0, top: `${y}%`, height: '1px', background: accent }} />)}
      </div>
    </div>
  );
};

/* ─────────── 5. ONDA — Orathai ─────────── */
const OndaReveal = ({ imageSrc, accent, f }) => {
  const p = usePhases([30, Math.round(1000 * f)]);
  const on = p >= 1;
  const D = Math.round(1000 * f);
  return (
    <div style={{ ...fill, overflow: 'hidden' }}>
      <div style={{ ...fill, background: '#000' }} />
      <div style={{ ...fill, clipPath: on ? 'circle(150% at 50% 80%)' : 'circle(0% at 50% 80%)', transition: `clip-path ${D}ms ${EASE_BACK}` }}>
        <Img src={imageSrc} style={{ transform: on ? 'scale(1)' : 'scale(1.06)', transition: `transform ${D}ms ${EASE_BACK}` }} />
      </div>
      <div style={{ position: 'absolute', left: '50%', top: '80%', transform: 'translate(-50%,-50%)', width: on ? '200vmax' : '0px', height: on ? '200vmax' : '0px', borderRadius: '50%', border: `2px solid ${accent}55`, boxShadow: `0 0 30px ${accent}55`, transition: `all ${D}ms ${EASE_BACK}`, opacity: p >= 2 ? 0 : 1, pointerEvents: 'none' }} />
    </div>
  );
};

/* ─────────── 6. MORSI — Mounthborn ─────────── */
const MorsiReveal = ({ imageSrc, accent, f }) => {
  const id = useId();
  const p = usePhases([30, Math.round(1100 * f)]);
  const bites = useMemo(() => Array.from({ length: 14 }).map(() => ({
    x: 5 + Math.random() * 90, y: 5 + Math.random() * 90, r: 22 + Math.random() * 20, delay: Math.random() * 0.25,
    subs: Array.from({ length: 4 }).map(() => ({ dx: (Math.random() - 0.5) * 18, dy: (Math.random() - 0.5) * 18, dr: 12 + Math.random() * 14 })),
  })), []);
  const grow = Math.round(700 * f);
  return (
    <div style={{ ...fill, overflow: 'hidden' }}>
      <div style={fill}><Img src={imageSrc} /></div>
      <div style={{ ...fill, pointerEvents: 'none', opacity: p >= 2 ? 0 : 1, transition: 'opacity 200ms', zIndex: 5 }}>
        <svg width="100%" height="100%" style={{ display: 'block' }}>
          <defs><mask id={id}>
            <rect width="100%" height="100%" fill="white" />
            {bites.map((b, i) => (
              <g key={i}>
                <circle cx={`${b.x}%`} cy={`${b.y}%`} r={p >= 1 ? `${b.r}%` : '0%'} fill="black" style={{ transition: `r ${grow}ms ${EASE_OUT} ${b.delay * f}s` }} />
                {b.subs.map((s, j) => <circle key={j} cx={`${b.x + s.dx}%`} cy={`${b.y + s.dy}%`} r={p >= 1 ? `${s.dr}%` : '0%'} fill="black" style={{ transition: `r ${grow}ms ${EASE_OUT} ${(b.delay + 0.05) * f}s` }} />)}
              </g>
            ))}
          </mask></defs>
          <rect width="100%" height="100%" fill="black" mask={`url(#${id})`} />
        </svg>
      </div>
      <div style={{ ...fill, background: `radial-gradient(circle at 50% 50%, transparent 45%, ${accent}1c 80%)`, mixBlendMode: 'screen', opacity: p >= 2 ? 0 : 0.7, transition: 'opacity 500ms', pointerEvents: 'none' }} />
    </div>
  );
};

/* ═══════════ NUOVE ═══════════ */

/* 7. OCCHIO — L'Enclave delle Scaglie (pupilla verticale; quasi tutto su nero, ombra palpebrale monocroma) */
const OcchioReveal = ({ imageSrc, accent, f }) => {
  const p = usePhases([40, Math.round(520 * f)]);
  const eye = (rx, ry) => `ellipse(${rx} ${ry} at 50% 50%)`;
  const Dslit = Math.round(420 * f);
  const Dopen = Math.round(1650 * f);
  const dur = p >= 2 ? Dopen : Dslit;
  const ease = p >= 2 ? EASE_STD : EASE_OUT;
  const imgClip = p >= 2 ? eye('150%', '150%') : p >= 1 ? eye('2.4%', '66%') : eye('0%', '0%');
  return (
    <div style={{ ...fill, overflow: 'hidden', background: '#000' }}>
      <div style={{ ...fill, clipPath: imgClip, transition: `clip-path ${dur}ms ${ease}` }}>
        <Img src={imageSrc} style={{ transform: p >= 2 ? 'scale(1)' : 'scale(1.16)', transition: `transform ${Math.round(Dopen * 1.15)}ms ${EASE_OUT}` }} />
        <div style={{ ...fill, background: 'radial-gradient(ellipse 60% 120% at 50% 50%, transparent 48%, rgba(0,0,0,0.92) 100%)', opacity: p >= 2 ? 0 : 1, transition: `opacity ${Math.round(Dopen * 0.85)}ms ${EASE_STD}`, pointerEvents: 'none' }} />
      </div>
      <div style={{ ...fill, background: 'linear-gradient(to bottom, #000 0%, transparent 14%, transparent 86%, #000 100%)', clipPath: imgClip, transition: `clip-path ${dur}ms ${ease}`, opacity: p >= 2 ? 0 : 0.9, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '13%', bottom: '13%', left: '50%', width: '2px', transform: 'translateX(-50%)', background: `linear-gradient(to bottom, transparent, ${accent}cc, transparent)`, boxShadow: `0 0 9px ${accent}77`, opacity: p >= 2 ? 0 : (p >= 1 ? 0.5 : 0), transition: `opacity ${Math.round(Dopen * 0.45)}ms ${EASE_STD}`, pointerEvents: 'none' }} />
    </div>
  );
};

/* 8. SCIAME — Ratti della Megera (corrosione che divora il nero dai bordi) */
const SciameReveal = ({ imageSrc, accent, f }) => {
  const id = useId();
  const p = usePhases([30, Math.round(1250 * f)]);
  const blobs = useMemo(() => Array.from({ length: 80 }).map(() => {
    const x = Math.random() * 100, y = Math.random() * 100;
    const edgeDist = Math.min(x, 100 - x, y, 100 - y);
    return { x, y, rr: 6 + Math.random() * 10, delay: (edgeDist / 50) * 0.75 };
  }), []);
  const grow = Math.round(720 * f);
  return (
    <div style={{ ...fill, overflow: 'hidden' }}>
      <div style={fill}><Img src={imageSrc} /></div>
      <div style={{ ...fill, pointerEvents: 'none', opacity: p >= 2 ? 0 : 1, transition: 'opacity 220ms', zIndex: 5 }}>
        <svg width="100%" height="100%" style={{ display: 'block' }}>
          <defs><mask id={id}>
            <rect width="100%" height="100%" fill="white" />
            {blobs.map((b, i) => <circle key={i} cx={`${b.x}%`} cy={`${b.y}%`} r={p >= 1 ? `${b.rr}%` : '0%'} fill="black" style={{ transition: `r ${grow}ms ${EASE_OUT} ${b.delay * f}s` }} />)}
          </mask></defs>
          <rect width="100%" height="100%" fill="black" mask={`url(#${id})`} />
        </svg>
      </div>
      <div style={{ ...fill, background: `radial-gradient(circle at 50% 50%, transparent 28%, ${accent}26 78%)`, mixBlendMode: 'screen', opacity: p >= 2 ? 0 : 0.85, transition: `opacity ${Math.round(640 * f)}ms`, pointerEvents: 'none' }} />
    </div>
  );
};

/* 9. RIVOLTA — Patto degli Indocili (il velo si frantuma in schegge Voronoi irregolari che si disperdono: "mai uniti") */
const RivoltaReveal = ({ imageSrc, accent, f }) => {
  const on = usePhases([30]) >= 1;
  const cells = useMemo(() => {
    const N = 28;
    const sites = Array.from({ length: N }).map(() => [Math.random() * 100, Math.random() * 100]);
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
    const clipHalf = (poly, i, j) => {
      const d = [j[0] - i[0], j[1] - i[1]];
      const c = dot(j, j) - dot(i, i);
      const fval = (p) => 2 * dot(p, d) - c;
      const out = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k], b = poly[(k + 1) % poly.length];
        const fa = fval(a), fb = fval(b);
        if (fa <= 0) out.push(a);
        if ((fa <= 0) !== (fb <= 0)) {
          const t = fa / (fa - fb);
          out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
        }
      }
      return out;
    };
    const cellsArr = [];
    for (let i = 0; i < N; i++) {
      let poly = [[0, 0], [100, 0], [100, 100], [0, 100]];
      for (let j = 0; j < N && poly.length; j++) { if (j !== i) poly = clipHalf(poly, sites[i], sites[j]); }
      if (poly.length < 3) continue;
      let cx = 0, cy = 0;
      poly.forEach((p) => { cx += p[0]; cy += p[1]; });
      cx /= poly.length; cy /= poly.length;
      const dx = cx - 50, dy = cy - 50, len = Math.hypot(dx, dy) || 1;
      const dist = 120 + Math.random() * 210;
      cellsArr.push({
        clip: 'polygon(' + poly.map((p) => `${p[0].toFixed(1)}% ${p[1].toFixed(1)}%`).join(', ') + ')',
        cx, cy,
        tx: (dx / len) * dist + (Math.random() - 0.5) * 70,
        ty: (dy / len) * dist + (Math.random() - 0.5) * 70,
        rot: (Math.random() - 0.5) * 90,
        delay: Math.random() * 0.4,
      });
    }
    return cellsArr;
  }, []);
  const D = Math.round(1000 * f);
  return (
    <div style={{ ...fill, overflow: 'hidden' }}>
      <div style={fill}><Img src={imageSrc} style={{ transform: on ? 'scale(1)' : 'scale(1.05)', transition: `transform ${Math.round(1500 * f)}ms ${EASE_OUT}` }} /></div>
      {cells.map((c, i) => (
        <div key={i} style={{
          ...fill,
          background: 'linear-gradient(135deg, #181818, #050505)',
          clipPath: c.clip,
          transformOrigin: `${c.cx}% ${c.cy}%`,
          filter: `drop-shadow(0 0 2px ${accent}40)`,
          transform: on ? `translate(${c.tx}px, ${c.ty}px) rotate(${c.rot}deg)` : 'none',
          opacity: on ? 0 : 1,
          transition: `transform ${D}ms ${EASE_STD} ${c.delay}s, opacity ${Math.round(D * 0.7)}ms ${EASE_STD} ${(c.delay + 0.05).toFixed(2)}s`,
        }} />
      ))}
      <div style={{ ...fill, background: `radial-gradient(circle at 50% 50%, ${accent}, transparent 62%)`, mixBlendMode: 'screen', opacity: 0, animation: `bf-revolt ${Math.round(560 * f)}ms ease-out forwards`, pointerEvents: 'none' }} />
      <style>{`@keyframes bf-revolt{0%{opacity:0}22%{opacity:.32}100%{opacity:0}}`}</style>
    </div>
  );
};

/* 10. CERCHI — Khemet (anelli concentrici che scorrono in posizione come un puzzle) */
const CerchiReveal = ({ imageSrc, accent, f }) => {
  const ref = React.useRef(null);
  const [size, setSize] = useState(null);
  React.useLayoutEffect(() => {
    if (ref.current) { const r = ref.current.getBoundingClientRect(); setSize({ w: r.width, h: r.height }); }
  }, []);
  const on = usePhases([40]) >= 1;
  const N = 7;
  const rings = useMemo(() => Array.from({ length: N }).map((_, i) => ({
    i, offset: (i % 2 === 0 ? 1 : -1) * (45 + Math.random() * 80), delay: i * 0.07 + Math.random() * 0.03,
  })), []);
  const D = Math.round(980 * f);
  const maxR = size ? Math.hypot(size.w / 2, size.h / 2) : 0;
  const step = maxR / N;
  return (
    <div ref={ref} style={{ ...fill, overflow: 'hidden', background: '#000' }}>
      {size && rings.map((r) => {
        const inner = r.i * step, outer = (r.i + 1) * step + 0.6;
        const mask = `radial-gradient(circle at 50% 50%, transparent ${inner}px, #000 ${inner}px, #000 ${outer}px, transparent ${outer}px)`;
        return (
          <div key={r.i} style={{ ...fill, WebkitMaskImage: mask, maskImage: mask, transform: on ? 'translateX(0)' : `translateX(${r.offset}px)`, opacity: on ? 1 : 0.92, transition: `transform ${D}ms ${EASE_OUT} ${r.delay}s, opacity ${Math.round(D * 0.5)}ms linear ${r.delay}s` }}>
            <Img src={imageSrc} />
          </div>
        );
      })}
      <div style={{ ...fill, background: `radial-gradient(circle at 50% 50%, ${accent}1a, transparent 62%)`, mixBlendMode: 'screen', opacity: on ? 0 : 0.55, transition: `opacity ${D}ms`, pointerEvents: 'none' }} />
    </div>
  );
};

/* ─────────── default ─────────── */
const DefaultReveal = ({ imageSrc }) => {
  const on = usePhases([30]) >= 1;
  return (
    <div style={{ ...fill, overflow: 'hidden' }}>
      <Img src={imageSrc} style={{ opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(1.08)', transition: 'opacity 900ms ease-out, transform 1200ms cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  );
};

const REVEAL_MAP = {
  swirl: SwirlReveal, frammenti: FrammentiReveal, sipario: SiparioReveal, hud: HudReveal,
  onda: OndaReveal, morsi: MorsiReveal, occhio: OcchioReveal, sciame: SciameReveal,
  rivolta: RivoltaReveal, cerchi: CerchiReveal,
};

/**
 * Mostra l'immagine del campo con l'animazione d'ingresso appropriata.
 * @param {string} imageSrc  URL dell'immagine del campo (field.bgImage)
 * @param {'swirl'|'frammenti'|'sipario'|'hud'|'onda'|'morsi'|'occhio'|'sciame'|'rivolta'|'cerchi'|'default'} animationType
 */
export function BattlefieldReveal({ imageSrc, animationType }) {
  const resolvedSrc = useMemo(
    () => (imageSrc ? resolvePublicAssetUrl(imageSrc) || imageSrc : imageSrc),
    [imageSrc]
  );
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Comp = (!reduce && REVEAL_MAP[animationType]) || DefaultReveal;
  const accent = getAccent(ANIM_TO_THEME[animationType]);
  const f = reduce ? 0.5 : 1;
  return <Comp imageSrc={resolvedSrc} accent={accent} f={f} />;
}
