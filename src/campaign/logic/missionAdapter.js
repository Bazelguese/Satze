// ============================================
// ADATTATORE MISSIONE → DUELLO → CAMPAGNA
// SPEC_PROTOTIPO_CAMPAGNA_CURSOR §6
//
// La campagna produce una CONFIGURAZIONE, la passa al duello esistente,
// riceve un ESITO. Unico punto di contatto col motore: campaignDuelMod
// { initiativeProfile, winCondition, fields, playerLife, enemyLife }.
// ============================================

import { NASCENTE_ID, assembleNascenteCard } from './nascente.js';
import { poolCardById, nodeById, campaignReducer } from '../state/campaignState.js';

/** Iniziativa primi 2 round per obiettivo missione. */
const INITIATIVE_BY_OBJECTIVE = {
  assalto: 'assault',
  difesa: 'defense',
  dominazione: null,   // regola Lega core
  annientamento: null, // regola Lega core
};

export const OBJECTIVE_LABELS = {
  dominazione: 'Dominazione',
  annientamento: 'Annientamento',
  assalto: 'Assalto',
  difesa: 'Difesa',
};

/**
 * Missione per un nodo: storia (act.missions) o Faglia (template dinamico).
 * @returns {Object|null} missione con { id, node, objective, fields, enemy, title, briefing, boss? }
 */
export function getMissionForNode(act, run, nodeId) {
  const story = (act.missions || []).find((m) => m.node === nodeId);
  if (story) return story;
  const faglia = run.faglie.find((f) => f.nodeId === nodeId);
  if (faglia) {
    const tpl = act.faglie?.missionTemplates?.[faglia.templateIndex];
    if (!tpl) return null;
    return {
      id: `F-${faglia.id}`,
      node: nodeId,
      objective: tpl.objective ?? 'dominazione',
      fields: tpl.fields ?? 3,
      enemy: { army: tpl.army, deck: tpl.deck, life: tpl.life ?? 25 },
      title: tpl.title ?? 'Faglia instabile',
      briefing: tpl.briefing ?? '',
      isFaglia: true,
      fagliaId: faglia.id,
      closesDay: faglia.closesDay,
    };
  }
  return null;
}

/**
 * Risolve il mazzo della run in carte reali: pool + Nascente assemblato al volo.
 * @returns {Array<Object>} carte nel formato di cards.js
 */
export function resolveRunDeckCards(run) {
  return run.deck
    .map((id) =>
      id === NASCENTE_ID ? assembleNascenteCard(run.nascente) : poolCardById(id)
    )
    .filter(Boolean);
}

/**
 * Configurazione di lancio per il duello esistente (startGame di useGameFlow).
 *
 * @param {Object} mission
 * @param {Object} run
 * @param {Object} act
 * @returns {{
 *   playerArmy: string,
 *   playerDeckCards: Array<Object>,
 *   enemyArmy: string,
 *   enemyDeckIds: number[],
 *   difficulty: string,
 *   campaignDuelMod: { initiativeProfile: 'assault'|'defense'|null, winCondition: 'default'|'annihilation_only', fields: number, playerLife: number, enemyLife: number },
 * }}
 */
export function buildDuelConfig(mission, run, act) {
  return {
    playerArmy: act.playerArmy,
    playerDeckCards: resolveRunDeckCards(run),
    enemyArmy: mission.enemy.army,
    enemyDeckIds: [...(mission.enemy.deck || [])],
    difficulty: mission.difficulty ?? (mission.boss ? 'hard' : 'medium'),
    campaignDuelMod: {
      initiativeProfile: INITIATIVE_BY_OBJECTIVE[mission.objective] ?? null,
      winCondition: mission.objective === 'annientamento' ? 'annihilation_only' : 'default',
      fields: mission.fields ?? 5,
      playerLife: 25,
      enemyLife: mission.enemy?.life ?? 25,
    },
  };
}

/**
 * Applica l'esito del duello alla run (nuovo stato).
 * @param {Object} run
 * @param {Object} act
 * @param {Object} mission
 * @param {{winner: 'player'|'enemy'|'draw'}} gameResult
 */
export function applyDuelResult(run, act, mission, gameResult) {
  const winner = gameResult?.winner === 'player' ? 'player' : gameResult?.winner === 'draw' ? 'draw' : 'enemy';
  return campaignReducer(
    run,
    { type: 'APPLY_DUEL_RESULT', missionId: mission.id, nodeId: mission.node, winner },
    act
  );
}

export { nodeById };
