// ============================================
// EMINENZE — Proiezione per l'IA e per l'hash dello stato pubblico
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §4.1, §10.4
// ============================================
//
// L'IA conosce la propria scelta segreta e non conosce quella avversaria. Le uniche
// deduzioni legittime sull'avversario sono quelle derivabili dallo stato pubblico:
// la Presenza al checkpoint di selezione e i gate già superati.

import { SIDES, OPPOSITE_SIDE } from './eminenceConstants.js';
import {
  isEminenceSubsystemEnabled,
  selectPublicEminenceState,
  selectPrivateEminenceSelection,
} from './eminenceState.js';
import { getSealedAbilityHypotheses } from './eminenceRound.js';

/** Vista neutra usata quando il formato non prevede Eminenze. */
export function createDisabledEminenceView() {
  return { enabled: false, gateProgress: null, ai: null, player: null };
}

/**
 * Costruisce la vista Eminenza dell'IA.
 *
 * @param {object} eminenceMatchState stato completo, con parti segrete
 * @param {object} options
 * @param {'player'|'enemy'} [options.aiSide] lato controllato dall'IA
 */
export function buildEminenceAIView(eminenceMatchState, { aiSide = SIDES.ENEMY } = {}) {
  if (!isEminenceSubsystemEnabled(eminenceMatchState)) return createDisabledEminenceView();

  const humanSide = OPPOSITE_SIDE[aiSide];
  const gateProgress = eminenceMatchState.gateProgress || null;

  const aiPublic = selectPublicEminenceState(eminenceMatchState[aiSide]);
  const humanPublic = selectPublicEminenceState(eminenceMatchState[humanSide]);

  return {
    enabled: true,
    gateProgress: gateProgress
      ? { sequenceName: gateProgress.sequenceName, completedGates: [...gateProgress.completedGates] }
      : null,

    // L'IA legge la propria scelta segreta: è sua.
    ai: aiPublic
      ? { ...aiPublic, private: selectPrivateEminenceSelection(eminenceMatchState[aiSide]) }
      : null,

    // Dell'avversario legge solo il pubblico, più l'insieme delle ipotesi ancora compatibili.
    player: humanPublic
      ? { ...humanPublic, hypotheses: getSealedAbilityHypotheses(humanPublic, gateProgress) }
      : null,
  };
}

/**
 * Ricostruisce la vista a partire da una vista già sanitizzata, senza reintrodurre segreti.
 * Serve nella ricerca in profondità, dove lo stato viene rigenerato più volte.
 */
export function cloneEminenceView(view) {
  if (!view?.enabled) return createDisabledEminenceView();
  return {
    enabled: true,
    gateProgress: view.gateProgress
      ? { ...view.gateProgress, completedGates: [...view.gateProgress.completedGates] }
      : null,
    ai: view.ai ? { ...view.ai, private: view.ai.private ? { ...view.ai.private } : null } : null,
    player: view.player ? { ...view.player, hypotheses: [...(view.player.hypotheses || [])] } : null,
  };
}

/**
 * Porzione Eminenza dell'hash dello stato pubblico.
 *
 * Include ciò che è pubblico e distingue davvero due stati: Eminenze in gioco, Presenza,
 * gate superati, capacità già rivelate. Esclude la scelta segreta, perché due stati che
 * differiscono solo per essa sono indistinguibili dal punto di vista pubblico e devono
 * condividere la stessa voce di transposition table.
 */
export function buildEminenceHashParts(view) {
  if (!view?.enabled) return 'e0';

  const side = (entry) => {
    if (!entry) return '-';
    return [
      entry.eminenceId ?? '',
      entry.presence ?? 0,
      entry.totalPresenceSpent ?? 0,
      entry.presenceSpentThisRound ?? 0,
      entry.selectionCheckpointPresence ?? 0,
      entry.revealedAbilityId ?? '',
      entry.blockedThisRound ? 1 : 0,
    ].join(':');
  };

  return [
    'e1',
    view.gateProgress?.sequenceName ?? '',
    (view.gateProgress?.completedGates || []).join('+'),
    side(view.ai),
    side(view.player),
  ].join('|');
}

/**
 * Cerca fughe di informazione nella vista destinata all'IA.
 * Usato in validazione, con la stessa logica di `validateAIInformationSet`.
 *
 * @returns {string[]} elenco dei problemi rilevati
 */
export function findEminenceViewLeaks(view) {
  if (!view?.enabled) return [];

  const issues = [];

  if (view.player && 'private' in view.player) {
    issues.push('vista Eminenza: la selezione segreta avversaria è esposta');
  }
  if (view.player?.selectedAbilityId || view.player?.selectedParams) {
    issues.push('vista Eminenza: campi di selezione avversaria presenti');
  }
  if (view.player?.hypotheses && view.player.hypotheses.length === 0 && view.player.eminenceId) {
    issues.push('vista Eminenza: insieme delle ipotesi vuoto su un\'Eminenza attiva');
  }

  return issues;
}
