import { firstActNode, firstActCard, campaignField } from '../data/firstAct.js';
import { CONCORDIA_ARMY } from '../data/concordia.js';
import { runCard } from '../state/firstActState.js';
import { EMINENCE_FORMAT } from '../../game/eminence/eminenceConstants.js';
export function firstActDuelConfig(run) {
  const a = run.active;
  if (!a) throw new Error('Nessun tentativo attivo.');
  const node = firstActNode(a.nodeId), phase = a.phase;
  const concordia = node.army === CONCORDIA_ARMY;
  const mod = {
    firstAct: true, nodeId: node.id, phase, winRule: node.winRule,
    fields: node.fieldIds.length, fixedFields: node.fieldIds.map(id=>({ ...campaignField(id) })), revealRounds: node.revealRounds,
    playerLife: a.pv?.player ?? (node.winRule === 'classic' ? 25 : 10) + (run.preparation?.life || 0),
    enemyLife: a.pv?.enemy ?? node.life + (concordia && run.plans.P1 === 'corazze' ? 2 : 0),
    playerFocus: node.focus + (phase === 0 ? run.preparation?.focus || 0 : 0),
    enemyFocus: node.focus + (concordia && run.plans.P1 === 'riserve' ? 2 : 0),
    plan: concordia ? run.plans.P2 : null,
    previousBonus: { player: false, enemy: false }, planUsed: false,
    openingPlayerFirst: a.opening[phase],
  };
  return {
    playerArmy: "Figli dell'Orizzonte", playerDeckCards: run.deck.map(id=>runCard(run,id)),
    enemyArmy: node.army, enemyDeckIds: node.roster.map(firstActCard), difficulty: node.difficulty,
    campaignDuelMod: mod,
    startOptions: { eminenceFormat: EMINENCE_FORMAT.DISABLED, skipShuffleDeal: true, fixedHands: { playerHand: a.playerSquads[phase].map(id=>runCard(run,id)), enemyHand: a.enemySquads[phase].map(firstActCard) } },
  };
}
export const revealedAt = (rounds, round) => rounds.filter(r => r <= round).length;
export function firstActMatchOutcome({ playerHP, enemyHP, playerFields, enemyFields, exhausted, round, rule }) {
  if (playerHP <= 0 || enemyHP <= 0) return { winner: playerHP <= 0 && enemyHP <= 0 ? 'draw' : enemyHP <= 0 ? 'player' : 'enemy', reason: 'hp' };
  if (rule === 'varco') return playerFields || enemyFields ? { winner: playerFields ? 'player' : 'enemy', reason:'fields' } : exhausted ? {winner:'draw',reason:'draw'} : null;
  if (exhausted) {
    const diff = rule === 'territory' ? (playerFields-enemyFields || playerHP-enemyHP) : (playerHP-enemyHP || playerFields-enemyFields);
    return { winner: diff > 0 ? 'player' : diff < 0 ? 'enemy' : 'draw', reason: rule === 'territory' ? 'fields' : 'hp' };
  }
  // Reduced formats resolve only at hand exhaustion. Classic preserves reclamation.
  if (rule === 'classic' && round < 5 && enemyFields >= 3) return {winner:'enemy',reason:'fields'};
  if (rule === 'classic' && round < 5 && playerFields >= 3) return {winner:'player',reason:'fields',claim:true};
  return null;
}
