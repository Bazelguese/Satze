// ============================================
// ROGUELIKE MODE - Generazione procedurale
// ============================================

import { ARMY_SETS, ARMY_DECKS, ALL_BATTLEFIELDS } from '../data';
import { selectBattlefields } from '../game/fieldLogic';

/**
 * Genera un avversario casuale per la modalità roguelike
 * La difficoltà aumenta con il livello raggiunto
 */
export function generateRoguelikeEnemy(level) {
  const armyNames = Object.keys(ARMY_SETS);
  const randomArmy = armyNames[Math.floor(Math.random() * armyNames.length)];
  
  // Scegli un deck casuale per quell'armata
  const deckKeys = Object.keys(ARMY_DECKS[randomArmy] || {});
  const randomDeckKey = deckKeys[Math.floor(Math.random() * deckKeys.length)] || deckKeys[0] || 'A';
  
  // La difficoltà aumenta ogni 3 livelli
  const difficultyLevel = Math.min(Math.floor(level / 3), 3);
  const difficulties = ['easy', 'medium', 'hard', 'chaos'];
  const difficulty = difficulties[difficultyLevel];
  
  return {
    army: randomArmy,
    deck: randomDeckKey,
    difficulty,
    level,
  };
}

/**
 * Genera campi di battaglia casuali per roguelike
 */
export function generateRoguelikeBattlefields(_level) {
  return selectBattlefields('classic', ALL_BATTLEFIELDS);
}

/**
 * Calcola le ricompense per un livello completato
 */
export function calculateRoguelikeRewards(level, healthRemaining) {
  return {
    level: level,
    coins: 10 + (level * 2), // Focus Coin bonus per il prossimo livello
    healthBonus: Math.max(0, Math.floor(healthRemaining * 0.2)), // Bonus HP basato su HP rimanenti
  };
}

/**
 * Salva il progresso roguelike
 */
export function saveRoguelikeProgress(level, rewards) {
  const bestLevel = parseInt(localStorage.getItem('satze_roguelike_best_level') || '0');
  if (level > bestLevel) {
    localStorage.setItem('satze_roguelike_best_level', level.toString());
  }
  
  const progress = {
    currentLevel: level,
    bestLevel: Math.max(level, bestLevel),
    rewards,
    timestamp: new Date().toISOString(),
  };
  
  localStorage.setItem('satze_roguelike_progress', JSON.stringify(progress));
  return progress;
}

/**
 * Carica il progresso roguelike
 */
export function loadRoguelikeProgress() {
  try {
    const stored = localStorage.getItem('satze_roguelike_progress');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Errore nel caricare il progresso roguelike:', error);
  }
  
  return {
    currentLevel: 1,
    bestLevel: parseInt(localStorage.getItem('satze_roguelike_best_level') || '0'),
    rewards: null,
    timestamp: null,
  };
}

/**
 * Resetta il progresso roguelike (nuova run)
 */
export function resetRoguelikeProgress() {
  localStorage.removeItem('satze_roguelike_progress');
  return {
    currentLevel: 1,
    bestLevel: parseInt(localStorage.getItem('satze_roguelike_best_level') || '0'),
    rewards: null,
    timestamp: null,
  };
}
