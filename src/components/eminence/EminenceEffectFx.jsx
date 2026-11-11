import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { queryFlightAnchor } from './eminenceMarkCinematic.js';
import { EFFECT_FX_KINDS } from './eminenceEffectFx.js';
import '../../styles/em-effetti.css';

/** Vita di un effetto nel DOM: volo + impatto + margine. */
export const EFFECT_FX_LIFE_MS = 2100;
const MOTES = 9;
const ANCHOR_TRIES = 24;

function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Scarti fissi (niente Math.random: stesso effetto, stesso disegno). */
function jitter(i, span) {
  const v = Math.sin((i + 1) * 12.9898) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * span;
}

function measure(plan) {
  const fromEl = plan.fromEl || queryFlightAnchor(plan.from) || queryFlightAnchor({ type: 'card', side: plan.from?.side });
  if (!fromEl) return null;
  const a = fromEl.getBoundingClientRect();
  const aura = plan.kind === EFFECT_FX_KINDS.AURA;
  const toEl = aura ? fromEl : (plan.toEl || queryFlightAnchor(plan.to));
  if (!toEl) return null;
  const b = toEl.getBoundingClientRect();
  if (!a.width || !b.width) return null;
  const x1 = a.left + a.width / 2;
  const y1 = a.top + a.height / 2;
  if (aura) {
    // Senza bersaglio il motivo si posa sull'angolo esterno dell'avviso (quello lontano
    // dalla carta), a cavallo del bordo: al centro coprirebbe il testo.
    const size = Math.min(150, Math.max(84, b.height * 0.62));
    const x = plan.from?.side === 'player' ? b.left + size * 0.2 : b.right - size * 0.2;
    return { x1, y1, x2: x, y2: b.top + size * 0.15, tw: size, th: size, ang: 0 };
  }
  const x2 = b.left + b.width / 2;
  const y2 = b.top + b.height / 2;
  return {
    x1, y1, x2, y2,
    tw: Math.max(84, b.width),
    th: Math.max(84, b.height),
    ang: Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI),
  };
}

function EffectFx({ fx }) {
  const { plan, g } = fx;
  const aura = plan.kind === EFFECT_FX_KINDS.AURA;
  const style = {
    '--acc': plan.accent,
    '--x1': `${g.x1}px`, '--y1': `${g.y1}px`,
    '--x2': `${g.x2}px`, '--y2': `${g.y2}px`,
    '--dx': `${g.x2 - g.x1}px`, '--dy': `${g.y2 - g.y1}px`,
    '--tw': `${g.tw}px`, '--th': `${g.th}px`,
    '--ang': `${g.ang}deg`,
  };
  if (plan.lamp) style['--lamp'] = plan.lamp;
  return (
    <div className={`em-efx em-efx--${plan.theme} em-efx--${plan.kind}`} style={style} aria-hidden>
      {!aura && Array.from({ length: MOTES }, (_, i) => (
        <i
          key={i}
          className="em-efx-mote"
          style={{ '--i': i, '--jx': `${jitter(i, g.tw * 0.5)}px`, '--jy': `${jitter(i + 31, g.th * 0.5)}px` }}
        >
          <b />
        </i>
      ))}
      <span className="em-efx-hit"><i /><i /><i /><i /></span>
    </div>
  );
}

/**
 * Effetti d'attivazione delle Eminenze.
 * `play(plans)` accetta i piani di `planEffectFx`; `layer` va reso una volta nella scena.
 * Le ancore possono comparire qualche fotogramma dopo l'avviso: si riprova per poco, poi si rinuncia.
 */
export function useEminenceEffectFx() {
  const [effects, setEffects] = useState([]);
  const timersRef = useRef(new Set());
  const seqRef = useRef(0);

  useEffect(() => () => {
    timersRef.current.forEach((t) => { window.clearTimeout(t); window.cancelAnimationFrame(t); });
    timersRef.current.clear();
  }, []);

  const play = useCallback((plans) => {
    if (reducedMotion() || typeof window === 'undefined') return;
    (Array.isArray(plans) ? plans : []).forEach((plan) => {
      let tries = 0;
      const attempt = () => {
        const g = measure(plan);
        if (!g) {
          tries += 1;
          if (tries < ANCHOR_TRIES) {
            const raf = window.requestAnimationFrame(() => { timersRef.current.delete(raf); attempt(); });
            timersRef.current.add(raf);
          }
          return;
        }
        seqRef.current += 1;
        const id = seqRef.current;
        setEffects((prev) => [...prev, { id, plan, g }]);
        const t = window.setTimeout(() => {
          timersRef.current.delete(t);
          setEffects((prev) => prev.filter((fx) => fx.id !== id));
        }, EFFECT_FX_LIFE_MS);
        timersRef.current.add(t);
      };
      attempt();
    });
  }, []);

  const layer = effects.length && typeof document !== 'undefined'
    ? createPortal(effects.map((fx) => <EffectFx key={fx.id} fx={fx} />), document.body)
    : null;

  return { play, layer };
}
