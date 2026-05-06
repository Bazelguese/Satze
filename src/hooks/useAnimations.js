// ============================================
// HOOK: useAnimations
// Gestisce tutti gli stati e la logica delle animazioni
// ============================================

import { useState, useCallback } from 'react';

/**
 * Hook per gestire le animazioni del duello e del gioco
 * @returns {Object} Oggetto con tutti gli stati delle animazioni e funzioni helper
 */
export function useAnimations() {
  // Stati per animazione focus coin sequenziali
  const [playerFocusCoinsShown, setPlayerFocusCoinsShown] = useState(0);
  const [enemyFocusCoinsShown, setEnemyFocusCoinsShown] = useState(0);
  const [cardGlowIntensity, setCardGlowIntensity] = useState(0); // 0-1 per intensità glow
  const [playerCardGlow, setPlayerCardGlow] = useState(0);
  const [enemyCardGlow, setEnemyCardGlow] = useState(0);
  
  // Stati per animazione duello
  /** Fasi duello allineate a `DUEL_PHASE_META` (0…6). */
  const [duelPhase, setDuelPhase] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Stato per animazione cambio condizione vittoria (round 5)
  const [showFinalRoundAnimation, setShowFinalRoundAnimation] = useState(false);
  
  // Stato per animazione clash delle carte
  const [showClashAnimation, setShowClashAnimation] = useState(false);
  
  // Stato per animazione colori arcobaleno/diamante
  const [rainbowTime, setRainbowTime] = useState(0);
  
  /**
   * Reset di tutte le animazioni
   */
  const resetAnimations = () => {
    setPlayerFocusCoinsShown(0);
    setEnemyFocusCoinsShown(0);
    setCardGlowIntensity(0);
    setPlayerCardGlow(0);
    setEnemyCardGlow(0);
    setDuelPhase(0);
    setIsZoomed(false);
    setShowFinalRoundAnimation(false);
    setShowClashAnimation(false);
    setRainbowTime(0);
  };
  
  /**
   * Avvia l'animazione dei focus coin sequenziali
   * @param {number} playerTotal - Numero di focus coin del player
   * @param {number} enemyTotal - Numero di focus coin del nemico
   * @param {number} delay - Delay tra ogni focus coin (default: 500ms)
   */
  const animateFocusCoins = (playerTotal, enemyTotal, delay = 500) => {
    const maxTotal = Math.max(playerTotal, enemyTotal);
    
    // Reset
    setPlayerFocusCoinsShown(0);
    setEnemyFocusCoinsShown(0);
    setCardGlowIntensity(0);
    setPlayerCardGlow(0);
    setEnemyCardGlow(0);
    
    // Anima l'apparizione sequenziale
    for (let i = 0; i < maxTotal; i++) {
      setTimeout(() => {
        if (i < playerTotal) {
          setPlayerFocusCoinsShown(prev => prev + 1);
          const playerIntensity = (i + 1) / playerTotal;
          setPlayerCardGlow(playerIntensity);
        }
        if (i < enemyTotal) {
          setEnemyFocusCoinsShown(prev => prev + 1);
          const enemyIntensity = (i + 1) / enemyTotal;
          setEnemyCardGlow(enemyIntensity);
        }
        const intensity = (i + 1) / maxTotal;
        setCardGlowIntensity(intensity);
      }, i * delay);
    }
  };
  
  /**
   * Avvia l'animazione del duello
   * @param {number} initialPhase - Fase iniziale (default: 0)
   */
  const startDuelAnimation = useCallback((initialPhase = 0) => {
    setDuelPhase(initialPhase);
    setIsZoomed(true);
  }, [setDuelPhase, setIsZoomed]);
  
  /**
   * Avanza alla fase successiva del duello
   */
  const nextDuelPhase = useCallback(() => {
    setDuelPhase(prev => prev + 1);
  }, [setDuelPhase]);
  
  /**
   * Avvia l'animazione del clash
   */
  const triggerClashAnimation = useCallback(() => {
    setShowClashAnimation(true);
  }, [setShowClashAnimation]);
  
  /**
   * Avvia l'animazione del round finale
   */
  const triggerFinalRoundAnimation = useCallback(() => {
    setShowFinalRoundAnimation(true);
  }, [setShowFinalRoundAnimation]);
  
  /**
   * Avvia l'animazione dei focus coin con delay personalizzato
   * @param {number} playerTotal - Numero di focus coin del player
   * @param {number} enemyTotal - Numero di focus coin del nemico
   * @param {number} delay - Delay tra ogni focus coin (default: 500ms)
   */
  const animateFocusCoinsWithDelay = useCallback((playerTotal, enemyTotal, delay = 500) => {
    animateFocusCoins(playerTotal, enemyTotal, delay);
  }, [animateFocusCoins]);
  
  /**
   * Reset completo delle animazioni del duello
   */
  const resetDuelAnimations = useCallback(() => {
    setPlayerFocusCoinsShown(0);
    setEnemyFocusCoinsShown(0);
    setCardGlowIntensity(0);
    setPlayerCardGlow(0);
    setEnemyCardGlow(0);
    setDuelPhase(0);
    setIsZoomed(false);
    setShowClashAnimation(false);
    setRainbowTime(0);
  }, [
    setPlayerFocusCoinsShown,
    setEnemyFocusCoinsShown,
    setCardGlowIntensity,
    setPlayerCardGlow,
    setEnemyCardGlow,
    setDuelPhase,
    setIsZoomed,
    setShowClashAnimation,
    setRainbowTime,
  ]);
  
  return {
    // Focus coin animations
    playerFocusCoinsShown,
    setPlayerFocusCoinsShown,
    enemyFocusCoinsShown,
    setEnemyFocusCoinsShown,
    cardGlowIntensity,
    setCardGlowIntensity,
    playerCardGlow,
    setPlayerCardGlow,
    enemyCardGlow,
    setEnemyCardGlow,
    
    // Duel animations
    duelPhase,
    setDuelPhase,
    isZoomed,
    setIsZoomed,
    
    // Special animations
    showFinalRoundAnimation,
    setShowFinalRoundAnimation,
    showClashAnimation,
    setShowClashAnimation,
    rainbowTime,
    setRainbowTime,
    
    // Helper functions
    resetAnimations,
    animateFocusCoins,
    animateFocusCoinsWithDelay,
    startDuelAnimation,
    nextDuelPhase,
    triggerClashAnimation,
    triggerFinalRoundAnimation,
    resetDuelAnimations,
  };
}
