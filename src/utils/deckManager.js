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
 * Valida un mazzo (controlla che abbia 10 carte e lega <= 30)
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
