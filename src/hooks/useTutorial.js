// ============================================
// HOOK: useTutorial
// Gestisce lo stato e il flusso del tutorial
// ============================================

import { useState, useCallback } from 'react';

const TRACK_KEYS = {
  brief: 'satze_tutorial_completed_brief',
  intro: 'satze_tutorial_completed_intro',
  advanced: 'satze_tutorial_completed_advanced',
};

function readLegacyCompleted() {
  return localStorage.getItem('satze_tutorial_completed') === 'true';
}

/**
 * Hook per gestire il tutorial introduttivo
 * @returns {Object} Stato e funzioni per gestire il tutorial
 */
export function useTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const startTutorial = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setIsCompleted(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  const completeTutorial = useCallback((trackId = 'brief') => {
    setIsActive(false);
    setIsCompleted(true);
    const key = TRACK_KEYS[trackId] || TRACK_KEYS.brief;
    localStorage.setItem(key, 'true');
    if (trackId === 'brief' || readLegacyCompleted()) {
      localStorage.setItem('satze_tutorial_completed', 'true');
    }
  }, []);

  const closeTutorial = useCallback(() => {
    setIsActive(false);
  }, []);

  const wasCompleted = useCallback((trackId = 'brief') => {
    const key = TRACK_KEYS[trackId];
    if (key && localStorage.getItem(key) === 'true') return true;
    if (trackId === 'brief' && readLegacyCompleted()) return true;
    return false;
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
