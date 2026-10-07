// ============================================
// COLLEZIONE — parametri di bilanciamento
// Valori provvisori: vanno tarati dopo i primi test.
// ============================================

/** Carte per bustina. */
export const PACK_SIZE = 5;

/**
 * Pesi di Lega per slot. Gli slot "comuni" riempiono la bustina,
 * l'ultimo slot è sempre "raro": almeno una Lega 4, ~10% di Lega 5.
 */
export const COMMON_SLOT_WEIGHTS = { 2: 45, 3: 40, 4: 15 };
export const RARE_SLOT_WEIGHTS = { 4: 90, 5: 10 };

/** Tipi di bustina in vendita nello shop. */
export const PACK_TYPES = {
  /** Pesca dall'intero catalogo. */
  mista: { id: 'mista', label: 'Bustina mista', price: 100, perArmy: false },
  /** Pesca da una sola armata, scelta dal giocatore. */
  armata: { id: 'armata', label: "Bustina d'armata", price: 150, perArmy: true },
};

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
