// ============================================
// DECK MANAGER - Gestione mazzi personalizzati
// ============================================

const STORAGE_KEY = 'satze_custom_decks';

/**
 * Carica tutti i mazzi salvati dal localStorage
 */
export function loadCustomDecks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error('Errore nel caricare i mazzi:', error);
    return {};
  }
}

/**
 * Salva un mazzo personalizzato
 * @param {string} deckId - ID univoco del mazzo
 * @param {Object} deckData - Dati del mazzo { name, description, army, cards }
 */
export function saveCustomDeck(deckId, deckData) {
  try {
    const decks = loadCustomDecks();
    decks[deckId] = {
      ...deckData,
      id: deckId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    return true;
  } catch (error) {
    console.error('Errore nel salvare il mazzo:', error);
    return false;
  }
}

/**
 * Elimina un mazzo personalizzato
 */
export function deleteCustomDeck(deckId) {
  try {
    const decks = loadCustomDecks();
    delete decks[deckId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    return true;
  } catch (error) {
    console.error('Errore nell\'eliminare il mazzo:', error);
    return false;
  }
}

/**
 * Carica un mazzo specifico
 */
export function loadCustomDeck(deckId) {
  const decks = loadCustomDecks();
  return decks[deckId] || null;
}

/**
 * Valida un mazzo (10 carte e lega esattamente 30)
 */
export function validateDeck(cards, armyCards) {
  if (cards.length !== 10) {
    return { valid: false, error: "L'esercito deve contenere esattamente 10 carte" };
  }

  const totalLeague = cards.reduce((sum, cardId) => {
    const card = armyCards.find(c => c.id === cardId);
    return sum + (card?.league || 0);
  }, 0);

  if (totalLeague > 30) {
    return { valid: false, error: `Lega totale troppo alta: ${totalLeague}/30` };
  }

  if (totalLeague < 30) {
    return { valid: false, error: `Lega insufficiente: ${totalLeague}/30 (servono 30 punti)` };
  }

  return { valid: true, totalLeague };
}

/**
 * Genera un ID univoco per un nuovo mazzo
 */
export function generateDeckId() {
  return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verifica se un mazzo è misto (carte da 2+ armate)
 * @param {Object} deck - { cards: number[] }
 * @param {Object} armySets - { armyName: card[] }
 */
export function isMixedDeck(deck, armySets) {
  if (!deck?.cards?.length) return false;
  const armies = new Set();
  for (const cardId of deck.cards) {
    for (const [army, cards] of Object.entries(armySets)) {
      if (cards.some(c => c.id === cardId)) {
        armies.add(army);
        break;
      }
    }
  }
  return armies.size >= 2;
}

/**
 * Risolve le carte di un mazzo cercando in tutte le armate
 * @param {Object} deck - { cards: number[] }
 * @param {Object} armySets - { armyName: card[] }
 */
export function resolveDeckCards(deck, armySets) {
  if (!deck?.cards) return [];
  const armyNames = Object.keys(armySets);
  return deck.cards.map(cardId => {
    for (const army of armyNames) {
      const card = armySets[army].find(c => c.id === cardId);
      if (card) return { ...card, army: card.army || army };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Converte un colore hex in { r, g, b }
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Converte RGB in hex
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Calcola il colore accent per una mano/deck.
 * Se la mano ha una sola armata → colore di quell'armata.
 * Se la mano ha più armate → fusione pesata dei colori (per numero di carte).
 * @param {Array} hand - Array di carte con proprietà army
 * @param {Object} armyColors - { armyName: { accent: string } }
 * @param {string} fallback - Colore di fallback se mano vuota
 */
export function getHandAccentColor(hand, armyColors, fallback = '#94a3b8') {
  if (!hand?.length || !armyColors) return fallback;
  const counts = {};
  for (const card of hand) {
    const army = card?.army;
    if (army) counts[army] = (counts[army] || 0) + 1;
  }
  const armies = Object.keys(counts);
  if (armies.length === 0) return fallback;
  if (armies.length === 1) {
    const accent = armyColors[armies[0]]?.accent;
    return accent || fallback;
  }
  // Fusione pesata: media RGB per numero di carte
  let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;
  for (const army of armies) {
    const accent = armyColors[army]?.accent;
    if (!accent) continue;
    const rgb = hexToRgb(accent);
    if (!rgb) continue;
    const w = counts[army];
    totalR += rgb.r * w;
    totalG += rgb.g * w;
    totalB += rgb.b * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return fallback;
  return rgbToHex(totalR / totalWeight, totalG / totalWeight, totalB / totalWeight);
}

/**
 * Estrae le armate distinte di un mazzo/esercito, ordinate per numero di carte.
 * @param {Array} cards - Carte con proprietà army
 * @param {{ fallbackArmy?: string, maxArmies?: number }} [options]
 */
export function getDeckArmies(cards, { fallbackArmy = null, maxArmies = 2 } = {}) {
  const counts = {};
  for (const card of cards || []) {
    const army = card?.army;
    if (army) counts[army] = (counts[army] || 0) + 1;
  }
  if (Object.keys(counts).length === 0 && fallbackArmy) {
    return [fallbackArmy];
  }
  return Object.keys(counts)
    .sort((a, b) => (counts[b] - counts[a]) || a.localeCompare(b, 'it'))
    .slice(0, maxArmies);
}

/**
 * Accent e armate per UI (lista eserciti, ticket cinematic, duello).
 * Mono-armata → accent puro; misto → fusione pesata come in duello.
 */
export function getDeckVisualMeta(deckCards, {
  fallbackArmy = null,
  armyColors = {},
  fallbackAccent = '#94a3b8',
} = {}) {
  const armies = getDeckArmies(deckCards, { fallbackArmy });
  const isMixed = armies.length >= 2;
  const accent = isMixed
    ? getHandAccentColor(deckCards, armyColors, fallbackAccent)
    : (armyColors[armies[0]]?.accent || fallbackAccent);
  return { armies, accent, isMixed };
}

export function buildDeckVisualIdentity(deckCards, {
  fallbackArmy = null,
  armyColors = {},
  fallbackAccent = '#94a3b8',
} = {}) {
  const meta = getDeckVisualMeta(deckCards, { fallbackArmy, armyColors, fallbackAccent });
  return {
    armies: meta.armies,
    accent: meta.accent,
    isMixed: meta.isMixed,
    deckCards: Array.isArray(deckCards) ? deckCards : [],
  };
}

/**
 * Arricchisce lo setup shuffle con accent e armate derivati dal mazzo completo (10 carte).
 * Durante shuffleDeal le mani sono vuote: serve per triangoli zona, dorsi e HUD.
 */
export function attachShuffleDealVisuals(setup, armyColors, { fallbackAccent = '#94a3b8' } = {}) {
  if (!setup) return setup;
  const playerDeckVisual = buildDeckVisualIdentity(setup.playerSet, {
    fallbackArmy: setup.playerSet?.[0]?.army ?? setup.playerArmy,
    armyColors,
    fallbackAccent,
  });
  const enemyDeckVisual = buildDeckVisualIdentity(setup.enemySet, {
    fallbackArmy: setup.enemySet?.[0]?.army ?? setup.enemyArmy,
    armyColors,
    fallbackAccent,
  });
  return {
    ...setup,
    playerDeckVisual,
    enemyDeckVisual,
    playerDeckArmies: playerDeckVisual.armies,
    enemyDeckArmies: enemyDeckVisual.armies,
    playerAccent: playerDeckVisual.accent,
    enemyAccent: enemyDeckVisual.accent,
    playerIsMixed: playerDeckVisual.isMixed,
    enemyIsMixed: enemyDeckVisual.isMixed,
  };
}
