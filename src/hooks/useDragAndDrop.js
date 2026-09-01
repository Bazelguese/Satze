// ============================================
// HOOK: useDragAndDrop
// Gestisce la logica di drag and drop per le carte
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { setSatzeCursorProps } from '../components/cursor/satzeCursorState';

/** Carta floating ufficiale (GameCard) */
const FLOAT_HALF_W = 115;
const FLOAT_HALF_H = 165;

const EASE_OUT = (x) => 1 - Math.pow(1 - x, 3);

function computeDragVisual(mouseX, mouseY, origin) {
  const elapsed = performance.now() - origin.t0;
  const att = Math.min(1, elapsed / 520);
  const ease = EASE_OUT(att);
  // attrazione lieve verso il cursore (la carta resta quasi al punto di presa)
  const tira = 0.16 * ease;
  const fl = Math.sin(elapsed / 380) * 3.2 * ease;
  const cx = mouseX + origin.dcx * (1 - tira);
  const cy = mouseY + origin.dcy * (1 - tira) + fl;
  return {
    left: cx - origin.halfW,
    top: cy - origin.halfH,
    cx,
    cy,
    rot: fl * 0.45 - 2,
    w: origin.halfW * 2,
    h: origin.halfH * 2,
  };
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
  const dragOriginRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  /** Nodo della carta fantasma: aggiornato via DOM, non via state. */
  const dragGhostRef = useRef(null);
  /** Posizione iniziale, usata solo per il primo paint del portal. */
  const [dragVisual, setDragVisual] = useState(null);

  // Il flutter gira a 60fps: passare per setState farebbe riconciliare l'intero
  // duello a ogni frame. Scriviamo direttamente sullo stile del nodo.
  const refreshVisual = useCallback(() => {
    const origin = dragOriginRef.current;
    const node = dragGhostRef.current;
    if (!origin || !node) return;
    const v = computeDragVisual(mouseRef.current.x, mouseRef.current.y, origin);
    node.style.left = `${v.left}px`;
    node.style.top = `${v.top}px`;
    node.style.transform = `rotate(${v.rot}deg)`;
    // Il cursore custom vive fuori da SatzeGame: aggiornarlo qui non costa un
    // re-render del duello.
    setSatzeCursorProps({ dragCard: { cx: v.cx, cy: v.cy } });
  }, []);

  /**
   * Gestisce l'inizio del drag
   */
  const handleDragStart = useCallback((e, agent) => {
    if (gamePhase !== 'selectAgent' || (!isPlayerFirst && !enemyAgent) || playerUsedCards.includes(agent.id)) {
      return;
    }
    e.preventDefault();
    const el = e.currentTarget || e.target?.closest?.('[data-drag]');
    const r = el?.getBoundingClientRect?.();
    if (!r) return;

    const cardCx = r.left + r.width / 2;
    const cardCy = r.top + r.height / 2;
    mouseRef.current = { x: e.clientX, y: e.clientY };
    dragOriginRef.current = {
      t0: performance.now(),
      // offset del centro carta rispetto al cursore al momento della presa
      dcx: cardCx - e.clientX,
      dcy: cardCy - e.clientY,
      halfW: FLOAT_HALF_W,
      halfH: FLOAT_HALF_H,
    };
    setDraggingCard(agent);
    setDragPosition({ x: e.clientX, y: e.clientY });
    setDragVisual(computeDragVisual(e.clientX, e.clientY, dragOriginRef.current));
  }, [gamePhase, isPlayerFirst, enemyAgent, playerUsedCards, setDraggingCard, setDragPosition]);

  /**
   * Gestisce il movimento durante il drag
   */
  // La posizione grezza del cursore non viene renderizzata da nessuno: tenerla in
  // uno state globale costava un re-render dell'intero duello a ogni mousemove.
  const handleDragMove = useCallback((e) => {
    if (!draggingCard) return;
    mouseRef.current = { x: e.clientX, y: e.clientY };
    refreshVisual();

    if (dropZoneRef.current) {
      const rect = dropZoneRef.current.getBoundingClientRect();
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;
      setIsOverDropZone((prev) => (prev === isOver ? prev : isOver));
    }
  }, [draggingCard, setIsOverDropZone, refreshVisual]);

  /**
   * Gestisce la fine del drag
   * - Drop sulla zona: seleziona
   * - Drop fuori con carta già selezionata trascinata: deseleziona
   */
  const handleDragEnd = useCallback(() => {
    if (!draggingCard) return;

    if (isOverDropZone && onAgentSelect) {
      onAgentSelect(draggingCard, 'drop');
    } else if (selectedAgent?.id === draggingCard?.id && onAgentSelect) {
      onAgentSelect(null);
    }

    dragOriginRef.current = null;
    dragGhostRef.current = null;
    setDragVisual(null);
    setDraggingCard(null);
    setIsOverDropZone(false);
  }, [draggingCard, isOverDropZone, selectedAgent, onAgentSelect, setDraggingCard, setIsOverDropZone]);

  // Listener globali + rAF per flutter/attrazione anche a mouse fermo
  useEffect(() => {
    if (!draggingCard) return undefined;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    let raf = 0;
    const tick = () => {
      refreshVisual();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      cancelAnimationFrame(raf);
    };
  }, [draggingCard, handleDragMove, handleDragEnd, refreshVisual]);

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
