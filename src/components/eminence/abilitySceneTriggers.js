// Quando parte la scena dedicata di un'abilità maggiore (abilityScenes.js) e con quali cifre.
// Funzioni pure: leggono avvisi, risultato del Duello e stato delle Eminenze, non il DOM.

import { getEminenceAbility } from '../../data/eminences.js';
import { hasAbilityScene } from './abilityScenes.js';

const other = (side) => (side === 'enemy' ? 'player' : 'enemy');
const SIDES = ['player', 'enemy'];

/** Lato la cui Eminenza ha rivelato l'abilità in questo round, o null. */
function revealedBy(matchState, abilityId) {
  return SIDES.find((side) => matchState?.[side]?.revealedAbilityId === abilityId) || null;
}

/**
 * Scena da avviare insieme a un avviso, o null.
 * L'id dell'avviso porta lato e abilità: `reveal:lato:abilità:…`, `effect:lato:abilità:…`, `static:lato:statico:round`.
 * @param {object} notice
 * @param {{ matchState?: object, agentPowerBySide?: object, currentFieldIndex?: number|null }} ctx
 * @returns {null|{ id: string, side: string, handSide?: string, cardId?: any, slotIndex?: number|null, data?: object }}
 */
export function sceneForNotice(notice, { matchState = null, agentPowerBySide = null, currentFieldIndex = null } = {}) {
  const [kind, side, id] = String(notice?.id || '').split(':');
  if (!SIDES.includes(side) || !hasAbilityScene(id)) return null;
  const state = matchState?.[side];
  const params = state?.selectedParams || {};
  switch (id) {
    case 'enclave_ascensione': {
      if (kind !== 'reveal') return null;
      const spent = Number(state?.presenceSpentThisRound) || Math.abs(Number(notice.presenceDelta) || 0);
      return spent > 0 ? { id, side, data: { spent, basePower: agentPowerBySide?.[side] ?? null } } : null;
    }
    case 'figli_risposta':
      // solo quando la condizione è avverata: l'Agente è Ancorato
      return kind === 'effect' && notice.outcome === 'hit' ? { id, side } : null;
    case 'mounthborn_caccia':
      return kind === 'reveal' && params.preyCardId != null ? { id, side, handSide: other(side), cardId: params.preyCardId } : null;
    case 'ratti_vendetta':
      return kind === 'reveal' && params.cardId != null ? { id, side, handSide: side, cardId: params.cardId } : null;
    case 'ora_verde':
      return kind === 'static' && notice.roundNumber === 5 ? { id, side, slotIndex: currentFieldIndex, data: {} } : null;
    default:
      // Terra Bruciata e Maledizione Inversa partono dal risultato del Duello, Interessi dal Registro
      return null;
  }
}

/**
 * Scene legate al Duello appena risolto.
 * @returns {{ start: Array, end: Array }} `start` all'avvio della risoluzione, `end` a Duello deciso
 */
export function scenesForDuelResult(battleResult, matchState = null) {
  const out = { start: [], end: [] };
  if (!battleResult) return out;
  const slotIndex = battleResult.fieldIndex ?? null;
  const inversions = (battleResult.statInversions || []).filter((entry) => SIDES.includes(entry?.side));
  if (inversions.length) {
    const side = SIDES.find((s) => matchState?.[s]?.eminenceId === 'khemet_maledizioni') || 'player';
    const of = (who) => inversions.filter((entry) => entry.side === who).map(({ stat, from, to }) => ({ stat, from, to }));
    out.start.push({ id: 'khemet_maledizione_inversa', side, slotIndex, data: { own: of(side), foe: of(other(side)) } });
  }
  if (battleResult.fieldDestroyed) {
    const loser = battleResult.winner === 'player' ? 'enemy' : 'player';
    out.end.push({ id: 'calibri_terra_bruciata', side: revealedBy(matchState, 'calibri_terra_bruciata') || loser, slotIndex });
  }
  return out;
}

/**
 * Interessi: tutte le voci del Registro di un lato sono cresciute insieme.
 * Confronta lo stato delle Eminenze prima e dopo; null se non è successo.
 */
export function sceneForDebtEscalation(prev, next) {
  for (const holder of SIDES) {
    const before = prev?.[holder]?.persistent?.endMatchDebts || [];
    const after = next?.[holder]?.persistent?.endMatchDebts || [];
    if (!after.length || after.length !== before.length) continue;
    const grown = after.every((debt, i) => typeof debt.amount === 'number' && typeof before[i].amount === 'number'
      && debt.amount > before[i].amount && debt.source === before[i].source);
    if (!grown) continue;
    const owner = after[0].ownerSide ?? holder;
    const entries = after.map((debt, i) => ({
      name: getEminenceAbility(next?.[owner]?.eminenceId, debt.source)?.name || 'Debito',
      from: before[i].amount,
      to: debt.amount,
    }));
    return {
      id: 'corte_interessi',
      side: owner,
      plateSide: after[0].side || holder,
      data: {
        entries,
        totalBefore: entries.reduce((sum, entry) => sum + entry.from, 0),
        totalAfter: entries.reduce((sum, entry) => sum + entry.to, 0),
      },
    };
  }
  return null;
}
