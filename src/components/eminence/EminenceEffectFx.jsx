import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { queryFlightAnchor } from './eminenceMarkCinematic.js';
import { EFFECT_FX_KINDS } from './eminenceEffectFx.js';
import { createEffectRun, EFFECT_FX_DURATION_MS } from './effectFxEngine.js';
import { createAbilityScene } from './abilityScenes.js';

const ANCHOR_TRIES = 24;
/** Oltre questa densità di pixel il canvas a tutto schermo costa più di quanto renda. */
const MAX_PIXEL_RATIO = 1.5;

const LAYER_STYLE = { position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' };

function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Riquadro che racchiude più elementi (le carte di una mano). */
function unionRect(els) {
  const rects = [...els].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0);
  if (!rects.length) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

/** Riquadro del bersaglio: le ancore dei voli, più la mano e il contatore FC di un lato. */
function targetRect(to) {
  if (!to || typeof document === 'undefined') return null;
  if (to.type === 'hand') return unionRect(document.querySelectorAll(`[data-hand-side="${to.side}"]`));
  const el = to.type === 'fc' ? document.querySelector(`[data-em-fc="${to.side}"]`) : queryFlightAnchor(to);
  const rect = el?.getBoundingClientRect();
  return rect?.width ? rect : null;
}

/** Dove parte e dove arriva l'effetto, in pixel di finestra. */
export function measureEffectFx(plan) {
  const fromEl = plan.fromEl || queryFlightAnchor(plan.from) || queryFlightAnchor({ type: 'card', side: plan.from?.side });
  if (!fromEl) return null;
  const a = fromEl.getBoundingClientRect();
  const aura = plan.kind === EFFECT_FX_KINDS.AURA;
  const b = aura
    ? a
    : (plan.toEl?.getBoundingClientRect() || targetRect(plan.to) || targetRect(plan.fallback));
  if (!a.width || !b?.width) return null;
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

const other = (side) => (side === 'enemy' ? 'player' : 'enemy');

/**
 * Geometria di una scena dedicata, in unità di scena (1600 di larghezza): i riquadri veri
 * del tavolo per ruolo. Quello che non è in vista (Agente non ancora schierato, lista dei
 * Campi nascosta nel Duello) ripiega su una posizione attorno al portale.
 * @param {{ side: string, plateSide?: string, handSide?: string, cardId?: number|string, slotIndex?: number }} spec
 * @returns {null|{ g: object, k: number, left: number, top: number }}
 */
export function measureAbilityScene(spec) {
  const scene = typeof document !== 'undefined' ? document.querySelector('.satze-scene') : null;
  const sr = scene?.getBoundingClientRect();
  if (!sr?.width) return null;
  const k = sr.width / 1600;
  const box = (el) => {
    const r = el?.getBoundingClientRect();
    return r?.width > 2 ? [(r.left - sr.left) / k, (r.top - sr.top) / k, r.width / k, r.height / k] : null;
  };
  const h = sr.height / k;
  const portal = box([...scene.querySelectorAll('.satze-bf-portal')].find((el) => el.getBoundingClientRect().width > 4));
  const port = portal ? [portal[0] + portal[2] / 2, portal[1] + portal[3] / 2] : [800, h * 0.458];
  const agent = (side) => {
    const zone = scene.querySelector(`[data-field-agent="${side}"]`);
    return box(scene.querySelector(`[data-duel-card="${side}"]`) || zone?.querySelector('.place-card') || zone)
      || [port[0] + (side === 'player' ? 121 : -313), port[1] - 89, 192, 281];
  };
  const plate = box(scene.querySelector(`.satze-stats-panel--${spec.plateSide || spec.side}`))
    || (spec.side === 'player' ? [1430, h - 55, 155, 42] : [15, 15, 155, 42]);
  const annBox = box(document.querySelector(`[data-em-announce="${spec.side}"]`));
  const hand = [...scene.querySelectorAll(`[data-hand-side="${spec.handSide || other(spec.side)}"]`)].map(box).filter(Boolean);
  const own = agent(spec.side);
  return {
    k,
    left: sr.left,
    top: sr.top,
    g: {
      h,
      pad: 600,
      own,
      foe: agent(other(spec.side)),
      port,
      // nel Duello la lista dei Campi non c'è: la riga ripiega sul portale, che porta il nome del Campo
      slot: box(spec.slotIndex == null ? null : scene.querySelector(`[data-field-slot="${spec.slotIndex}"]`)) || [port[0] - 150, port[1] - 22, 300, 44],
      plate,
      ann: annBox ? [annBox[0] + annBox[2] / 2, annBox[1] + annBox[3] / 2] : [plate[0] + plate[2] / 2, plate[1] + plate[3] / 2],
      hand,
      card: box(spec.cardId == null ? null : scene.querySelector(`[data-hand-agent="${spec.cardId}"]`)) || hand[Math.floor(hand.length / 2)] || own,
    },
  };
}

/**
 * Effetti d'attivazione delle Eminenze: un canvas a tutta finestra, disegnato solo mentre
 * c'è un effetto in corso. `play(plans)` accetta i piani di `planEffectFx`, `playScene(id, spec)`
 * avvia la scena dedicata di un'abilità maggiore; `layer` va reso
 * una volta nella scena. Le ancore possono comparire qualche fotogramma dopo l'avviso:
 * si riprova per poco, poi si rinuncia.
 */
export function useEminenceEffectFx({ zIndex = 400 } = {}) {
  const canvasRef = useRef(null);
  const runsRef = useRef([]);
  const rafRef = useRef(0);
  const retryRef = useRef(new Set());
  const seedRef = useRef(1);
  const sceneTimerRef = useRef(0);

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
    runsRef.current = runsRef.current.filter((entry) => now - entry.t0 < (entry.duration || EFFECT_FX_DURATION_MS));
    runsRef.current.forEach((entry) => {
      if (!entry.xf) { entry.run.draw(ctx, now - entry.t0); return; }
      // scena dedicata: disegnata in unità di scena, agganciata al riquadro del tavolo
      ctx.save();
      ctx.setTransform(ratio * entry.xf.k, 0, 0, ratio * entry.xf.k, entry.xf.left * ratio, entry.xf.top * ratio);
      entry.run.draw(ctx, now - entry.t0);
      ctx.restore();
    });
    if (runsRef.current.length) rafRef.current = window.requestAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    window.cancelAnimationFrame(rafRef.current);
    retryRef.current.forEach((id) => window.cancelAnimationFrame(id));
    retryRef.current.clear();
    window.clearTimeout(sceneTimerRef.current);
    document.querySelector('.satze-scene')?.classList.remove('em-scene-play');
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
          } else if (plan.kind !== EFFECT_FX_KINDS.AURA) {
            // il bersaglio non è in vista (Agente non ancora schierato, mano nascosta):
            // l'abilità si vede comunque, sull'avviso
            play([{ ...plan, kind: EFFECT_FX_KINDS.AURA, to: null, fallback: null }]);
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

  /** Scena dedicata di un'abilità maggiore (abilityScenes.js): una alla volta. */
  const playScene = useCallback((id, spec = {}) => {
    if (reducedMotion() || typeof window === 'undefined') return false;
    const measured = measureAbilityScene(spec);
    if (!measured) return false;
    seedRef.current += 1;
    const run = createAbilityScene(id, { g: measured.g, data: spec.data || {}, seed: seedRef.current });
    if (!run) return false;
    runsRef.current = runsRef.current.filter((entry) => !entry.xf);
    runsRef.current.push({ t0: performance.now(), duration: run.duration, run, xf: { k: measured.k, left: measured.left, top: measured.top } });
    // durante la scena il tavolo torna in vista (l'avviso lo terrebbe velato): ci pensa la scena a scurirlo
    const table = document.querySelector('.satze-scene');
    table?.classList.add('em-scene-play');
    window.clearTimeout(sceneTimerRef.current);
    sceneTimerRef.current = window.setTimeout(() => table?.classList.remove('em-scene-play'), run.duration + 120);
    if (!rafRef.current) rafRef.current = window.requestAnimationFrame(frame);
    return true;
  }, [frame]);

  const layer = typeof document !== 'undefined'
    ? createPortal(<canvas ref={canvasRef} className="em-efx-canvas" style={{ ...LAYER_STYLE, zIndex }} aria-hidden />, document.body)
    : null;

  return { play, playScene, layer };
}
