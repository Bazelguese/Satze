// ============================================
// EMINENZE — Stati che durano
// ============================================
//
// Certi effetti non finiscono col Duello: un debito da pagare a fine Scontro, la soglia di
// Ancorato che sale, il Bonus d'Armata sostituito, l'Eminenza bloccata. L'avviso li dice una
// volta; questa lista serve a tenerli scritti accanto alla targa di chi li subisce.
//
// Funzione pura sullo stato delle Eminenze: legge solo lo stato pubblico, per campo.

import { getEminence, getEminenceAbility } from '../../data/eminences.js';

const signed = (n) => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;

function abilityOf(matchState, side, abilityId) {
  const eminenceId = matchState?.[side]?.eminenceId;
  return eminenceId && typeof abilityId === 'string' ? getEminenceAbility(eminenceId, abilityId) : null;
}

/**
 * @param {object|null} matchState stato Eminenze della partita
 * @returns {{ player: Array, enemy: Array }} stati del lato che li subisce:
 *   { key, kind: 'debt'|'anchored'|'bonus'|'blocked', label, word, army, text }
 *   `army` è l'Armata dell'Eminenza che ha lasciato lo stato (per il colore).
 */
export function buildLastingStates(matchState) {
  const out = { player: [], enemy: [] };
  if (!matchState) return out;
  const armyOf = (side) => getEminence(matchState[side]?.eminenceId)?.army || null;

  // Debiti: registrati sul lato che li tiene, pagati da `debt.side`
  const debts = { player: {}, enemy: {} };
  for (const holder of ['player', 'enemy']) {
    for (const debt of matchState[holder]?.persistent?.endMatchDebts || []) {
      const victim = debt.side || holder;
      if (!out[victim]) continue;
      const owner = debt.ownerSide ?? holder;
      const due = debt.dueAt === 'END_MATCH' ? 'match' : 'duel';
      const slot = debts[victim][due] || (debts[victim][due] = { amount: 0, pending: false, owner, sources: [] });
      if (debt.amount == null) slot.pending = true; else slot.amount += debt.amount;
      const name = abilityOf(matchState, owner, debt.source)?.name;
      if (name && !slot.sources.includes(name)) slot.sources.push(name);
    }
  }

  for (const side of ['player', 'enemy']) {
    const state = matchState[side];
    if (!state?.eminenceId) continue;

    for (const due of ['match', 'duel']) {
      const slot = debts[side][due];
      if (!slot || (!slot.amount && !slot.pending)) continue;
      const amount = slot.amount ? `−${slot.amount} PV` : 'PV da stabilire';
      out[side].push({
        key: `${side}:debt:${due}`,
        kind: 'debt',
        label: 'Debito',
        word: `${amount}${slot.amount && slot.pending ? ' +' : ''} · ${due === 'match' ? 'a fine Scontro' : 'a fine Duello'}`,
        army: armyOf(slot.owner),
        text: slot.sources.length ? `Da: ${slot.sources.join(', ')}` : '',
      });
    }

    const drift = state.persistent?.anchoredThresholdDelta || 0;
    if (drift) {
      out[side].push({
        key: `${side}:anchored`,
        kind: 'anchored',
        label: 'Ancorato',
        word: `soglia ${signed(drift)} FC`,
        army: armyOf(side),
        text: `Per essere Ancorato servono 6 − Lega ${signed(drift)} FC investiti.`,
      });
    }

    const override = state.persistent?.armyBonusOverride;
    if (override) {
      const source = abilityOf(matchState, side, override.source);
      out[side].push({
        key: `${side}:bonus`,
        kind: 'bonus',
        label: "Bonus d'Armata",
        word: override.until === 'OWN_WIN' ? 'sostituito · fino a una vittoria' : 'sostituito · per tutto lo Scontro',
        army: armyOf(side),
        text: source ? `${source.name}: ${source.text}` : '',
      });
    }

    if (state.blockedThisRound || state.blockedNextRound) {
      out[side].push({
        key: `${side}:blocked`,
        kind: 'blocked',
        label: 'Eminenza',
        word: state.blockedThisRound ? 'bloccata · questo round' : 'bloccata · prossimo round',
        army: armyOf(side === 'player' ? 'enemy' : 'player'),
        text: '',
      });
    }
  }
  return out;
}
