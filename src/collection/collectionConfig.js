// ============================================
// COLLEZIONE — parametri di bilanciamento
// Valori provvisori: vanno tarati dopo i primi test.
// ============================================

/** Carte per bustina standard. */
export const PACK_SIZE = 5;

/**
 * Pesi di Lega per slot. Gli slot "comuni" riempiono la bustina,
 * gli slot "rari" chiudono la bustina: almeno una Lega 4, ~10% di Lega 5.
 */
export const COMMON_SLOT_WEIGHTS = { 2: 45, 3: 40, 4: 15 };
export const RARE_SLOT_WEIGHTS = { 4: 90, 5: 10 };

/**
 * Tipi di bustina in vendita nello shop.
 * - `param`: scelta del giocatore che restringe il catalogo ('army' o 'trigger').
 * - `size` / `rareSlots`: carte totali e quante dagli slot rari.
 * - `commonWeights` / `rareWeights`: sostituiscono i pesi predefiniti.
 */
export const PACK_TYPES = {
  mista: {
    id: 'mista', label: 'Bustina mista', price: 100,
    description: "Pesca dall'intero catalogo delle 12 armate.",
  },
  armata: {
    id: 'armata', label: "Bustina d'armata", price: 150, param: 'army',
    description: "Solo carte dell'armata che scegli.",
  },
  potere: {
    id: 'potere', label: 'Bustina del Potere', price: 130, param: 'trigger',
    description: 'Solo carte con il Potere che scegli (Imboscata, Resa dei conti…).',
  },
  reclute: {
    id: 'reclute', label: 'Bustina delle Reclute', price: 50, rareSlots: 0,
    commonWeights: { 2: 55, 3: 45 },
    description: 'Economica: solo carte di Lega 2 e 3.',
  },
  leggendaria: {
    id: 'leggendaria', label: 'Bustina Leggendaria', price: 400,
    rareWeights: { 5: 100 },
    description: 'Una carta di Lega 5 garantita.',
  },
  grande: {
    id: 'grande', label: 'Bustina grande', price: 180, size: 10, rareSlots: 2,
    description: '10 carte, due di Lega 4 o superiore.',
  },
};

/** Offerte: più bustine di un tipo a prezzo diverso, o gratuite una volta al giorno. */
export const OFFERS = {
  cinquina: {
    id: 'cinquina', label: '5 bustine miste', packType: 'mista', count: 5, price: 400,
    description: 'Cinque bustine miste al prezzo di quattro.',
  },
  giornaliera: {
    id: 'giornaliera', label: 'Bustina del giorno', packType: 'mista', count: 1, price: 0, daily: true,
    description: 'Una bustina mista gratuita ogni giorno.',
  },
};

/**
 * Skin: si sbloccano a parte rispetto alla carta.
 * Eldritch e Arcana esistono solo per le carte che hanno quella faccia;
 * il foil può uscire su qualsiasi carta.
 */
export const SKINS = {
  standard: { id: 'standard', label: 'Standard' },
  foil: { id: 'foil', label: 'Foil' },
  eldritch: { id: 'eldritch', label: 'Eldritch' },
  arcana: { id: 'arcana', label: 'Arcana' },
};

/** Probabilità per carta estratta: faccia alternativa (se esiste), altrimenti foil. */
export const SKIN_ODDS = { alt: 0.12, foil: 0.05 };

/** Bustine iniziali (tutte dell'armata scelta) e garanzia di un mazzo valido. */
export const STARTER_PACK_COUNT = 3;

/** Vincoli del mazzo (stessi di deckManager.validateDeck). */
export const DECK_SIZE = 10;
export const DECK_TOTAL_LEAGUE = 30;

/** Polvere ottenuta da un doppione, per Lega. */
export const DUST_FROM_DUPLICATE = { 2: 5, 3: 10, 4: 25, 5: 100 };

/** Polvere necessaria per creare una carta, per Lega. */
export const CRAFT_COST = { 2: 40, 3: 80, 4: 200, 5: 800 };

/** Valuta a fine partita. */
export const MATCH_REWARDS = {
  ai: { win: 30, loss: 10 },
  multiplayer: { win: 40, loss: 15 },
};

/** Valuta per una missione di campagna completata (la run resta indipendente). */
export const CAMPAIGN_MISSION_REWARD = 50;
