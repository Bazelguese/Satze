// ============================================
// HOOK: useDragAndDrop
// Gestisce la logica di drag and drop per le carte
// ============================================

import { useCallback, useEffect, useRef } from 'react';

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

  /**
   * Gestisce l'inizio del drag
   */
  const handleDragStart = useCallback((e, agent) => {
    if (gamePhase !== 'selectAgent' || (!isPlayerFirst && !enemyAgent) || playerUsedCards.includes(agent.id)) {
      return;
    }
    e.preventDefault();
    setDraggingCard(agent);
    setDragPosition({ x: e.clientX, y: e.clientY });
  }, [gamePhase, isPlayerFirst, enemyAgent, playerUsedCards, setDraggingCard, setDragPosition]);

  /**
   * Gestisce il movimento durante il drag
   */
  const handleDragMove = useCallback((e) => {
    if (!draggingCard) return;
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    // Check if over drop zone
    if (dropZoneRef.current) {
      const rect = dropZoneRef.current.getBoundingClientRect();
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right && 
                     e.clientY >= rect.top && e.clientY <= rect.bottom;
      setIsOverDropZone(isOver);
    }
  }, [draggingCard, setDragPosition, setIsOverDropZone]);

  /**
   * Gestisce la fine del drag
   * - Drop sulla zona: seleziona
   * - Drop fuori con carta già selezionata trascinata: deseleziona
   */
  const handleDragEnd = useCallback(() => {
    if (!draggingCard) return;
    
    if (isOverDropZone && onAgentSelect) {
      onAgentSelect(draggingCard);
    } else if (selectedAgent?.id === draggingCard?.id && onAgentSelect) {
      onAgentSelect(null);
    }
    
    setDraggingCard(null);
    setIsOverDropZone(false);
  }, [draggingCard, isOverDropZone, selectedAgent, onAgentSelect, setDraggingCard, setIsOverDropZone]);

  // Global mouse listeners for drag
  useEffect(() => {
    if (draggingCard) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [draggingCard, handleDragMove, handleDragEnd]);

  return {
    draggingCard,
    dragPosition,
    isOverDropZone,
    dropZoneRef,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
