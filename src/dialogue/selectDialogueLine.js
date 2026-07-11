import { DIALOGHI_CORTE } from './dialoghiCorte.js';
import { DIALOGHI_RATTI } from './dialoghiRatti.js';
import { armyNameToDialogueKey } from './armyDialogueMap.js';

/** @typedef {{ t: string, r?: string, once?: boolean, fx?: string }} DialogueRow */

export const DIALOGUE_ARMY_DATA = {
  corte: DIALOGHI_CORTE,
  ratti: DIALOGHI_RATTI,
};

/** Solo righe presenti in dialoghi-*.js — niente fallback generici. */
export function armyUsesWrittenDialogueOnly(armyKey) {
  return Boolean(DIALOGUE_ARMY_DATA[armyKey]);
}

export const STAT_NEMICO_BANDS = {
  colosso: { label: 'Colosso', threshold: 'POT ≥ 6' },
  fragile: { label: 'Fragile', threshold: 'POT ≤ 2' },
  spinato: { label: 'Spinato', threshold: 'DAN ≥ 5' },
};

/**
 * @param {string} eventKey — es. `entrata`, `statNemico.colosso`, `reattivo.Kethran`
 * @param {Record<string, unknown>|null|undefined} cardDialogues
 */
export function getDialoguePool(cardDialogues, eventKey) {
  if (!cardDialogues || !eventKey) return [];

  if (eventKey.startsWith('statNemico.')) {
    const band = eventKey.slice('statNemico.'.length);
    return cardDialogues.statNemico?.[band] ?? [];
  }
  if (eventKey.startsWith('reattivo.')) {
    const army = eventKey.slice('reattivo.'.length);
    return cardDialogues.reattivo?.[army] ?? [];
  }
  return cardDialogues[eventKey] ?? [];
}

/**
 * @param {DialogueRow[]} pool
 * @param {string|null|undefined} lastText
 */
export function pickDialogueLine(pool, lastText, loreSeenKey, loreSeenSet) {
  if (!pool?.length) return null;
  let candidates = pool.filter((row) => {
    if (row.once && loreSeenKey && loreSeenSet?.has(loreSeenKey)) return false;
    return true;
  });
  if (!candidates.length) return null;
  if (lastText && candidates.length > 1) {
    const filtered = candidates.filter((row) => row.t !== lastText);
    if (filtered.length) candidates = filtered;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * @param {number|string} cardId
 * @param {string} armyKey — es. `corte`
 */
export function getCardDialogues(cardId, armyKey = 'corte') {
  const data = DIALOGUE_ARMY_DATA[armyKey];
  return data?.[String(cardId)] ?? data?.[Number(cardId)] ?? null;
}

export function armyHasDialogueData(armyKey) {
  const data = DIALOGUE_ARMY_DATA[armyKey];
  return Boolean(data && Object.keys(data).length > 0);
}

export function countDialogueCards(armyKey) {
  const data = DIALOGUE_ARMY_DATA[armyKey];
  return data ? Object.keys(data).length : 0;
}

/**
 * @param {{ id: number, name: string, army?: string, league?: number, power?: number, damage?: number }} card
 * @param {string} eventKey
 * @param {{ lastText?: string|null, armyKey?: string, x?: string|number, y?: string|number, side?: string, loreSeenKey?: string, loreSeen?: Set<string> }} [opts]
 */
export function resolveDialogueSayOptions(card, eventKey, opts = {}) {
  const armyKey = opts.armyKey || armyNameToDialogueKey(card.army) || 'corte';
  const cardKey = `${armyKey}:${card.id}`;
  const pool = getDialoguePool(getCardDialogues(card.id, armyKey), eventKey);
  const row = pickDialogueLine(pool, opts.lastText, opts.loreSeenKey ?? cardKey, opts.loreSeen);
  if (!row) return null;

  if (row.once && opts.loreSeen) {
    opts.loreSeen.add(opts.loreSeenKey ?? cardKey);
  }

  return {
    army: armyKey,
    name: card.name,
    text: row.t,
    x: opts.x ?? '50%',
    y: opts.y ?? 250,
    side: opts.side ?? 'above',
    meta: { register: row.r, once: row.once, eventKey, rowFx: row.fx, cardKey },
  };
}
