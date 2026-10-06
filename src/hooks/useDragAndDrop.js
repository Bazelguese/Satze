// ============================================
// HOOK: useDragAndDrop
// Gestisce la logica di drag and drop per le carte
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { setSatzeCursorProps } from '../components/cursor/satzeCursorState';

/** Carta floating ufficiale (GameCard) in px CSS non scalati */
const CARD_W = 230;
const CARD_H = 330;
/** Spostamento (px schermo) oltre il quale una pressione diventa trascinamento: sotto resta un click. */
const DRAG_THRESHOLD = 6;
/** Crescita dalla misura in mano alla carta sollevata (ms) */
const LIFT_MS = 170;
/** Scala della carta sollevata rispetto a quella in campo */
const LIFT_SCALE = 1.06;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const EASE_OUT = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Avvicina `v` a `target` con costante di tempo indipendente dai fps. */
const approach = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));

/** Scala della scena 1920×1080 sullo schermo (GameViewport la ridimensiona). */
function sceneScaleOf(el) {
  const scene = el?.closest?.('.satze-scene') || document.querySelector('.satze-scene');
  if (!scene || !scene.offsetWidth) return 1;
  return scene.getBoundingClientRect().width / scene.offsetWidth || 1;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

/**
 * Hook per gestire il drag and drop delle carte
 * @param {Object} options - Opzioni per il drag and drop
 * @param {string} options.gamePhase - Fase corrente del gioco
 * @param {boolean} options.isPlayerFirst - Se il giocatore è il primo
 * @param {Object|null} options.enemyAgent - Agente nemico selezionato
 * @param {Array} options.playerUsedCards - Carte usate dal giocatore
 * @param {Function} options.onAgentSelect - Callback quando un agente viene selezionato
 * @param {Object} options.gameState - Stato del gioco da useGameState
 * @param {{ current: any }} [options.handoffRef] - Riceve la posa della carta al rilascio
 *   ({ via:'drop', cx, cy, rot, scale }) o l'ultima pressione su una carta ({ via:'press', agentId, rect }),
 *   per far partire l'ingresso in campo da lì.
 * @param {Function} [options.onReturnToHand] - Rilascio fuori dallo slot: ({ agent, from }) per il volo di ritorno
 * @returns {Object} Oggetto con funzioni e stati per drag and drop
 */
export function useDragAndDrop({
  gamePhase,
  isPlayerFirst,
  enemyAgent,
  playerUsedCards,
  onAgentSelect,
  selectedAgent,
  gameState,
  handoffRef,
  onReturnToHand,
}) {
  const {
    draggingCard,
    setDraggingCard,
    dragPosition,
    setDragPosition,
    isOverDropZone,
    setIsOverDropZone,
  } = gameState;

  const dropZoneRef = useRef(null);
  /** Pressione in corso: { agent, x0, y0, rect, pointerId, active, ... } */
  const pressRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  /** Nodo della carta fantasma: aggiornato via DOM, non via state. */
  const dragGhostRef = useRef(null);
  /** Ultima posa disegnata del fantasma (centro, rotazione, scala in px schermo). */
  const poseRef = useRef(null);
  const overRef = useRef(false);
  /** Posizione iniziale, usata solo per il primo paint del portal. */
  const [dragVisual, setDragVisual] = useState(null);

  // valori sempre aggiornati per i listener globali
  const latestRef = useRef({});
  latestRef.current = { onAgentSelect, selectedAgent, handoffRef, onReturnToHand, setIsOverDropZone };

  /** Calcola e scrive la posa del fantasma: crescita, inerzia, aggancio magnetico allo slot. */
  const stepVisual = useCallback((now) => {
    const press = pressRef.current;
    if (!press?.active) return null;
    const dt = Math.min(0.05, Math.max(0.001, (now - (press.lastT ?? now)) / 1000));
    press.lastT = now;
    const { x, y } = mouseRef.current;

    // velocità levigata del cursore (px/s)
    const vxRaw = (x - press.lastX) / dt;
    const vyRaw = (y - press.lastY) / dt;
    press.lastX = x;
    press.lastY = y;
    press.vx = approach(press.vx, vxRaw, 14, dt);
    press.vy = approach(press.vy, vyRaw, 14, dt);

    // slot: prossimità (bagliore) e aggancio magnetico
    const zone = dropZoneRef.current;
    let snapTarget = 0;
    let zc = null;
    if (zone) {
      const r = zone.getBoundingClientRect();
      zc = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const d = Math.hypot(x - zc.x, y - zc.y);
      const snapR = Math.max(r.width, r.height) * 0.75;
      const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      const over = inside || d < snapR;
      snapTarget = over ? 1 : 0;
      const prox = 1 - smoothstep(snapR * 0.6, snapR * 3.4, d);
      zone.style.setProperty('--prox', prox.toFixed(3));
      if (over !== overRef.current) {
        overRef.current = over;
        latestRef.current.setIsOverDropZone(over);
      }
    }
    press.snap = approach(press.snap, snapTarget, 16, dt);
    const snap = EASE_OUT(press.snap);

    // presa: dalla misura in mano alla carta sollevata
    const lift = EASE_OUT((now - press.t0) / LIFT_MS);
    const liftScale = press.sceneScale * LIFT_SCALE;
    const freeScale = press.startScale + (liftScale - press.startScale) * lift;
    // la carta resta al punto di presa e scivola piano verso il cursore
    const pull = 0.18 * lift;
    const freeCx = x + press.dcx * (1 - pull);
    const freeCy = y + press.dcy * (1 - pull);

    // inerzia: si inclina nel verso del moto, con un filo di molla
    const leanTarget = clamp(press.vx * 0.016, -16, 16);
    press.rot = approach(press.rot, leanTarget, 10, dt);
    const tiltY = clamp(press.vx * 0.012, -18, 18) * (1 - snap);
    const tiltX = clamp(-press.vy * 0.01, -14, 14) * (1 - snap);

    const cx = zc ? freeCx + (zc.x - freeCx) * snap * 0.9 : freeCx;
    const cy = zc ? freeCy + (zc.y - freeCy) * snap * 0.9 : freeCy;
    const rot = press.rot * (1 - snap);
    const scale = freeScale + (press.sceneScale - freeScale) * snap;
    const pose = { cx, cy, rot, tiltX, tiltY, scale, lift };
    poseRef.current = pose;

    const node = dragGhostRef.current;
    if (node) {
      node.style.transform =
        `translate3d(${(cx - CARD_W / 2).toFixed(1)}px, ${(cy - CARD_H / 2).toFixed(1)}px, 0) ` +
        `perspective(900px) rotateZ(${rot.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      node.style.setProperty('--lift', (lift * (1 - snap * 0.7)).toFixed(3));
    }
    // Il cursore custom vive fuori da SatzeGame: aggiornarlo qui non costa un re-render del duello.
    setSatzeCursorProps({ dragCard: { cx, cy } });
    return pose;
  }, []);

  const activate = useCallback((e) => {
    const press = pressRef.current;
    if (!press || press.active) return;
    const { rect } = press;
    const sceneScale = sceneScaleOf(dropZoneRef.current || press.el);
    Object.assign(press, {
      active: true,
      t0: performance.now(),
      lastT: performance.now(),
      lastX: e.clientX,
      lastY: e.clientY,
      vx: 0,
      vy: 0,
      rot: -2,
      snap: 0,
      sceneScale,
      // la carta parte dalla misura che ha in mano
      startScale: rect.width / CARD_W,
      dcx: rect.left + rect.width / 2 - press.x0,
      dcy: rect.top + rect.height / 2 - press.y0,
    });
    mouseRef.current = { x: e.clientX, y: e.clientY };
    setDraggingCard(press.agent);
    setDragPosition({ x: e.clientX, y: e.clientY });
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setDragVisual({
      transform: `translate3d(${cx - CARD_W / 2}px, ${cy - CARD_H / 2}px, 0) scale(${press.startScale})`,
      cx,
      cy,
    });
  }, [setDraggingCard, setDragPosition]);

  const finish = useCallback((cancelled) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press) return;
    window.removeEventListener('pointermove', press.onMove);
    window.removeEventListener('pointerup', press.onUp);
    window.removeEventListener('pointercancel', press.onCancel);
    cancelAnimationFrame(press.raf);
    if (!press.active) return; // era un click: ci pensa onClick

    const { onAgentSelect: select, selectedAgent: selected, handoffRef: hRef, onReturnToHand: back } = latestRef.current;
    const pose = poseRef.current;
    const over = overRef.current && !cancelled;
    if (over && select) {
      if (hRef && pose) hRef.current = { via: 'drop', agentId: press.agent.id, ...pose, t: performance.now() };
      select(press.agent, 'drop');
    } else {
      if (selected?.id === press.agent?.id && select) select(null);
      if (back && pose && !prefersReducedMotion()) back({ agent: press.agent, from: pose });
    }
    const zone = dropZoneRef.current;
    zone?.style.removeProperty('--prox');
    poseRef.current = null;
    overRef.current = false;
    dragGhostRef.current = null;
    setDragVisual(null);
    setDraggingCard(null);
    latestRef.current.setIsOverDropZone(false);
    setSatzeCursorProps({ dragCard: null });
  }, [setDraggingCard]);

  /**
   * Pressione su una carta (pointerdown: mouse, touch, penna).
   * Il trascinamento parte solo oltre DRAG_THRESHOLD px: sotto resta un click.
   */
  const handleDragStart = useCallback((e, agent) => {
    if (gamePhase !== 'selectAgent' || (!isPlayerFirst && !enemyAgent) || playerUsedCards.includes(agent.id)) {
      return;
    }
    if (e.button != null && e.button !== 0) return;
    const el = e.currentTarget || e.target?.closest?.('[data-drag]');
    const rect = el?.getBoundingClientRect?.();
    if (!rect) return;
    e.preventDefault?.();
    if (pressRef.current) finish(true);

    if (handoffRef) {
      handoffRef.current = { via: 'press', agentId: agent.id, rect, t: performance.now() };
    }
    const press = {
      agent,
      el,
      rect,
      x0: e.clientX,
      y0: e.clientY,
      pointerId: e.pointerId,
      active: false,
      raf: 0,
    };
    press.onMove = (ev) => {
      if (press.pointerId != null && ev.pointerId != null && ev.pointerId !== press.pointerId) return;
      mouseRef.current = { x: ev.clientX, y: ev.clientY };
      if (!press.active) {
        if (Math.hypot(ev.clientX - press.x0, ev.clientY - press.y0) < DRAG_THRESHOLD) return;
        activate(ev);
        const tick = (now) => {
          if (pressRef.current !== press) return;
          stepVisual(now);
          press.raf = requestAnimationFrame(tick);
        };
        press.raf = requestAnimationFrame(tick);
      }
    };
    press.onUp = (ev) => {
      if (press.pointerId != null && ev.pointerId != null && ev.pointerId !== press.pointerId) return;
      if (press.active) stepVisual(performance.now());
      finish(false);
    };
    press.onCancel = () => finish(true);
    pressRef.current = press;
    window.addEventListener('pointermove', press.onMove);
    window.addEventListener('pointerup', press.onUp);
    window.addEventListener('pointercancel', press.onCancel);
  }, [gamePhase, isPlayerFirst, enemyAgent, playerUsedCards, handoffRef, activate, stepVisual, finish]);

  // smontaggio o cambio fase a metà trascinamento: annulla senza selezionare
  useEffect(() => () => {
    if (pressRef.current) finish(true);
  }, [finish]);
  useEffect(() => {
    if (gamePhase !== 'selectAgent' && pressRef.current) finish(true);
  }, [gamePhase, finish]);

  /** Compatibilità: il movimento ora è gestito dai listener pointer interni. */
  const handleDragMove = useCallback((e) => {
    pressRef.current?.onMove?.(e);
  }, []);
  const handleDragEnd = useCallback(() => {
    finish(false);
  }, [finish]);

  return {
    draggingCard,
    dragPosition,
    dragVisual,
    dragGhostRef,
    isOverDropZone,
    dropZoneRef,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
