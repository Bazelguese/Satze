import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { queryFlightAnchor } from './eminenceMarkCinematic.js';
import { EFFECT_FX_KINDS } from './eminenceEffectFx.js';
import { createEffectRun, EFFECT_FX_DURATION_MS } from './effectFxEngine.js';

const ANCHOR_TRIES = 24;
/** Oltre questa densità di pixel il canvas a tutto schermo costa più di quanto renda. */
const MAX_PIXEL_RATIO = 1.5;

const LAYER_STYLE = { position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' };

function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Dove parte e dove arriva l'effetto, in pixel di finestra. */
export function measureEffectFx(plan) {
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
    return { x1, y1, x2: x, y2: b.top + size * 0.15, tw: size, th: size };
  }
  return {
    x1, y1,
    x2: b.left + b.width / 2,
    y2: b.top + b.height / 2,
    tw: Math.max(60, b.width),
    th: Math.max(40, b.height),
  };
}

/**
 * Effetti d'attivazione delle Eminenze: un canvas a tutta finestra, disegnato solo mentre
 * c'è un effetto in corso. `play(plans)` accetta i piani di `planEffectFx`; `layer` va reso
 * una volta nella scena. Le ancore possono comparire qualche fotogramma dopo l'avviso:
 * si riprova per poco, poi si rinuncia.
 */
export function useEminenceEffectFx({ zIndex = 400 } = {}) {
  const canvasRef = useRef(null);
  const runsRef = useRef([]);
  const rafRef = useRef(0);
  const retryRef = useRef(new Set());
  const seedRef = useRef(1);

  const frame = useCallback(() => {
    rafRef.current = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1);
    const w = Math.round(window.innerWidth * ratio);
    const h = Math.round(window.innerHeight * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const now = performance.now();
    runsRef.current = runsRef.current.filter((entry) => now - entry.t0 < EFFECT_FX_DURATION_MS);
    runsRef.current.forEach((entry) => entry.run.draw(ctx, now - entry.t0));
    if (runsRef.current.length) rafRef.current = window.requestAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    window.cancelAnimationFrame(rafRef.current);
    retryRef.current.forEach((id) => window.cancelAnimationFrame(id));
    retryRef.current.clear();
    runsRef.current = [];
  }, []);

  const play = useCallback((plans) => {
    if (reducedMotion() || typeof window === 'undefined') return;
    (Array.isArray(plans) ? plans : []).forEach((plan) => {
      let tries = 0;
      const attempt = () => {
        const g = measureEffectFx(plan);
        if (!g) {
          tries += 1;
          if (tries < ANCHOR_TRIES) {
            const id = window.requestAnimationFrame(() => { retryRef.current.delete(id); attempt(); });
            retryRef.current.add(id);
          }
          return;
        }
        seedRef.current += 1;
        runsRef.current.push({
          t0: performance.now(),
          run: createEffectRun({ theme: plan.theme, kind: plan.kind, accent: plan.accent, lamp: plan.lamp, seed: seedRef.current, g }),
        });
        if (!rafRef.current) rafRef.current = window.requestAnimationFrame(frame);
      };
      attempt();
    });
  }, [frame]);

  const layer = typeof document !== 'undefined'
    ? createPortal(<canvas ref={canvasRef} className="em-efx-canvas" style={{ ...LAYER_STYLE, zIndex }} aria-hidden />, document.body)
    : null;

  return { play, layer };
}
