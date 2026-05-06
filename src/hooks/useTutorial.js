// ============================================
// HOOK: useTutorial
// Gestisce lo stato e il flusso del tutorial
// ============================================

import { useState, useCallback } from 'react';

/**
 * Hook per gestire il tutorial introduttivo
 * @returns {Object} Stato e funzioni per gestire il tutorial
 */
export function useTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  /**
   * Avvia il tutorial
   */
  const startTutorial = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setIsCompleted(false);
  }, []);

  /**
   * Avanza al passo successivo
   */
  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  /**
   * Torna al passo precedente
   */
  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Salta al passo specificato
   */
  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  /**
   * Completa e chiude il tutorial
   */
  const completeTutorial = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    // Salva nel localStorage che il tutorial è stato completato
    localStorage.setItem('satze_tutorial_completed', 'true');
  }, []);

  /**
   * Chiude il tutorial senza completarlo
   */
  const closeTutorial = useCallback(() => {
    setIsActive(false);
  }, []);

  /**
   * Verifica se il tutorial è stato già completato
   */
  const wasCompleted = useCallback(() => {
    return localStorage.getItem('satze_tutorial_completed') === 'true';
  }, []);

  return {
    isActive,
    currentStep,
    isCompleted,
    startTutorial,
    nextStep,
    previousStep,
    goToStep,
    completeTutorial,
    closeTutorial,
    wasCompleted,
  };
}
