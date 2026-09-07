// ============================================
// GAME MODES - Definizione delle modalità di gioco
// ============================================

import { EMINENCE_FORMAT } from '../game/eminence/eminenceConstants.js';

/**
 * Formati di partita locale (scelta pre-difficoltà).
 * Combinano modalità Campo + stato del sottosistema Eminenza.
 */
export const MATCH_FORMATS = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Eminenze e Campi attivi',
    mode: 'classic',
    eminenceFormat: EMINENCE_FORMAT.REQUIRED,
  },
  noEminence: {
    id: 'noEminence',
    name: 'No Eminenza',
    description: 'Campi attivi, senza Eminenze',
    mode: 'classic',
    eminenceFormat: EMINENCE_FORMAT.DISABLED,
  },
  bareHands: {
    id: 'bareHands',
    name: 'Mani nude',
    description: 'Niente Eminenze né effetti Campo',
    mode: 'bareHands',
    eminenceFormat: EMINENCE_FORMAT.DISABLED,
  },
};

export function getMatchFormat(formatId) {
  return MATCH_FORMATS[formatId] || MATCH_FORMATS.standard;
}

/** Deriva il formato UI dalla modalità già scelta nel menu (es. Bare Hands). */
export function matchFormatIdFromMode(modeId) {
  if (modeId === 'bareHands') return MATCH_FORMATS.bareHands.id;
  return MATCH_FORMATS.standard.id;
}

/**
 * Configurazione delle modalità di gioco disponibili
 */
export const GAME_MODES = {
  classic: {
    id: 'classic',
    name: 'Classica',
    description: 'Modalità standard con effetti campo attivi',
    icon: '⚔️',
    enabled: true,
    config: {
      battlefieldEffects: true,
      maxRounds: 5,
      initialHP: 25,
      initialFocus: 18,
    },
  },
  bareHands: {
    id: 'bareHands',
    name: 'Bare Hands',
    description: 'Tutti i campi sono neutri, senza effetti speciali',
    icon: '🤜',
    enabled: true,
    config: {
      battlefieldEffects: false,
      maxRounds: 5,
      initialHP: 25,
      initialFocus: 18,
    },
  },
  roguelike: {
    id: 'roguelike',
    name: 'Roguelike',
    description: 'Sopravvivi il più a lungo possibile in una serie di battaglie casuali',
    icon: '🎲',
    enabled: true,
    config: {
      battlefieldEffects: true,
      maxRounds: 5,
      initialHP: 25,
      initialFocus: 18,
      permadeath: true,
      progressiveDifficulty: true,
    },
  },
  campaign: {
    id: 'campaign',
    name: 'Campagna',
    description: 'Affronta una serie di livelli con storia e progressione',
    icon: '📖',
    enabled: true,
    config: {
      battlefieldEffects: true,
      maxRounds: 5,
      initialHP: 25,
      initialFocus: 18,
      storyMode: true,
    },
  },
  multiplayer: {
    id: 'multiplayer',
    name: 'Multiplayer Online',
    description: 'Gioca contro un amico online in tempo reale',
    icon: '🌐',
    enabled: true,
    config: {
      battlefieldEffects: true,
      maxRounds: 5,
      initialHP: 25,
      initialFocus: 18,
      aiEnabled: false,
      requiresNetwork: true,
    },
  },
  // Esempio di modalità custom futura
  speedRun: {
    id: 'speedRun',
    name: 'Speed Run',
    description: 'Vinci in meno turni possibili',
    icon: '⚡',
    enabled: false, // Disabilitata per ora
    config: {
      battlefieldEffects: true,
      maxRounds: 3, // Meno round
      initialHP: 20,
      initialFocus: 15,
    },
  },
};

/**
 * Ottiene una modalità di gioco per ID
 */
export function getGameMode(modeId) {
  return GAME_MODES[modeId] || GAME_MODES.classic;
}

/**
 * Ottiene tutte le modalità abilitate
 */
export function getEnabledGameModes() {
  return Object.values(GAME_MODES).filter(mode => mode.enabled);
}
