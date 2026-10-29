// ============================================
// COLLEZIONE — generazione delle bustine
// Funzioni pure: il generatore casuale `rng` (() => [0,1)) è sempre passato
// da fuori, così le estrazioni sono riproducibili nei test e, in futuro,
// eseguibili sul server.
//
// `skinCatalog` (Map id → 'eldritch' | 'arcana') elenca le carte che hanno
// una faccia alternativa: lo costruisce chi chiama dai dati delle facce.
// ============================================

import { ARMY_SETS } from '../data/cards.js';
import { shuffleArraySeeded } from '../utils/seededRandom.js';
import {
  PACK_SIZE,
  PACK_TYPES,
  COMMON_SLOT_WEIGHTS,
  RARE_SLOT_WEIGHTS,
  SKIN_ODDS,
  STARTER_PACK_COUNT,
  DECK_SIZE,
  DECK_TOTAL_LEAGUE,
} from './collectionConfig.js';

/**
 * Carte (con `army`) del catalogo, filtrate per armata e/o Potere.
 * @param {{ army?: string|null, trigger?: string|null }|string|null} filter
 */
export function cardPool(filter = null) {
  const { army = null, trigger = null } = typeof filter === 'string' ? { army: filter } : (filter || {});
  const armies = army ? [army] : Object.keys(ARMY_SETS);
  return armies.flatMap((a) => {
    const set = ARMY_SETS[a];
    if (!set) throw new Error(`Armata sconosciuta: ${a}`);
    return set
      .filter((card) => !trigger || card.ability?.trigger === trigger)
      .map((card) => ({ ...card, army: card.army || a }));
  });
}

/** Poteri (trigger) presenti nel catalogo, con il numero di carte. */
export function availableTriggers() {
  const counts = new Map();
  for (const card of cardPool()) {
    const t = card.ability?.trigger;
    if (t) counts.set(t, (counts.get(t) || 0) + 1);
  }
  return [...counts.entries()].map(([trigger, count]) => ({ trigger, count })).sort((a, b) => b.count - a.count);
}

/** Estrae una Lega secondo i pesi. */
export function rollLeague(weights, rng) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [league, w] of entries) {
    roll -= w;
    if (roll < 0) return Number(league);
  }
  return Number(entries[entries.length - 1][0]);
}

/**
 * Sceglie una carta della Lega indicata non ancora presente in `taken`.
 * Se la Lega non è disponibile (es. Patto degli Indocili non ha Lega 5)
 * scende alla Lega inferiore più vicina, poi sale.
 */
function pickCard(pool, league, taken, rng) {
  const leagues = [...new Set(pool.map((c) => c.league))].sort((a, b) => a - b);
  const order = [
    ...leagues.filter((l) => l <= league).reverse(),
    ...leagues.filter((l) => l > league),
  ];
  for (const l of order) {
    const options = pool.filter((c) => c.league === l && !taken.has(c.id));
    if (options.length) return options[Math.floor(rng() * options.length)];
  }
  return null;
}

/** Skin con cui esce una carta: faccia alternativa se esiste, poi foil. */
export function rollSkin(card, rng, skinCatalog = new Map()) {
  const alt = skinCatalog.get(card.id);
  if (alt && rng() < SKIN_ODDS.alt) return alt;
  if (rng() < SKIN_ODDS.foil) return 'foil';
  return 'standard';
}

/**
 * Genera una bustina: carte distinte, gli ultimi slot dalla tabella rara.
 * @param {string} type - chiave di PACK_TYPES
 * @param {{ army?: string, trigger?: string }} params
 * @param {() => number} rng
 * @param {Map<number,string>} [skinCatalog]
 * @returns {Array<Object>} carte con `skin`
 */
export function generatePack(type, params = {}, rng, skinCatalog = new Map()) {
  const def = PACK_TYPES[type];
  if (!def) throw new Error(`Tipo di bustina sconosciuto: ${type}`);
  const size = def.size ?? PACK_SIZE;
  const rareSlots = def.rareSlots ?? 1;
  const common = def.commonWeights ?? COMMON_SLOT_WEIGHTS;
  const rare = def.rareWeights ?? RARE_SLOT_WEIGHTS;
  const pool = cardPool({
    army: def.param === 'army' ? params.army : null,
    trigger: def.param === 'trigger' ? params.trigger : null,
  });
  if (!pool.length) throw new Error('Nessuna carta disponibile per questa bustina');

  const taken = new Set();
  const cards = [];
  for (let slot = 0; slot < size; slot++) {
    const weights = slot >= size - rareSlots ? rare : common;
    const card = pickCard(pool, rollLeague(weights, rng), taken, rng);
    if (!card) break;
    taken.add(card.id);
    cards.push({ ...card, skin: rollSkin(card, rng, skinCatalog) });
  }
  return cards;
}

/**
 * Trova DECK_SIZE carte distinte di `pool` con Lega totale DECK_TOTAL_LEAGUE.
 * Ricerca in profondità su un ordine mescolato: risultato casuale ma garantito
 * se una combinazione esiste.
 */
export function findValidDeck(pool, rng) {
  const shuffled = shuffleArraySeeded(pool, rng);
  const chosen = [];
  const search = (start, remainingLeague) => {
    if (chosen.length === DECK_SIZE) return remainingLeague === 0;
    for (let i = start; i < shuffled.length; i++) {
      const card = shuffled[i];
      if (card.league > remainingLeague) continue;
      chosen.push(card);
      if (search(i + 1, remainingLeague - card.league)) return true;
      chosen.pop();
    }
    return false;
  };
  return search(0, DECK_TOTAL_LEAGUE) ? [...chosen] : null;
}

/**
 * Bustine iniziali dell'armata scelta: tutte carte distinte e, insieme,
 * contengono almeno un mazzo valido (DECK_SIZE carte, Lega DECK_TOTAL_LEAGUE).
 * Le carte iniziali escono sempre con la faccia standard.
 * @returns {Array<Array<Object>>} STARTER_PACK_COUNT bustine
 */
export function generateStarterPacks(army, rng) {
  const pool = cardPool(army);
  const core = findValidDeck(pool, rng);
  if (!core) throw new Error(`Nessun mazzo valido possibile per ${army}`);

  const taken = new Set(core.map((c) => c.id));
  const extras = [];
  const total = STARTER_PACK_COUNT * PACK_SIZE;
  while (core.length + extras.length < total) {
    const card = pickCard(pool, rollLeague(COMMON_SLOT_WEIGHTS, rng), taken, rng);
    if (!card) break;
    taken.add(card.id);
    extras.push(card);
  }

  const all = shuffleArraySeeded([...core, ...extras], rng).map((c) => ({ ...c, skin: 'standard' }));
  const packs = [];
  for (let i = 0; i < STARTER_PACK_COUNT; i++) {
    packs.push(all.slice(i * PACK_SIZE, (i + 1) * PACK_SIZE).sort((a, b) => a.league - b.league));
  }
  return packs;
}
