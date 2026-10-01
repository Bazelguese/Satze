import { firstActNode, firstActCard, campaignField } from '../data/firstAct.js';
import { CONCORDIA_ARMY } from '../data/concordia.js';
import { runCard, firstActRunNode, isCaelRun, statusTotal } from '../state/firstActState.js';
import { EMINENCE_FORMAT } from '../../game/eminence/eminenceConstants.js';
export function firstActDuelConfig(run) {
  const a = run.active;
  if (!a) throw new Error('Nessun tentativo attivo.');
  const node = firstActRunNode(run,a.nodeId), phase = a.phase;
  const cael=isCaelRun(run);
  // Legacy attempts retain their original fields until the next START.
  const fieldIds = a.fieldSquads?.[phase] || node.fieldIds;
  const concordia = node.army === CONCORDIA_ARMY;
  const mod = {
    firstAct: true, cael, alwaysPlayerFirst:node.alwaysPlayerFirst===true, duels:[], nodeId: node.id, phase, winRule: node.winRule,
    fields: fieldIds.length, fixedFields: fieldIds.map(id=>({ ...campaignField(id) })), revealRounds: node.revealRounds,
    playerLife: a.pv?.player ?? (node.winRule === 'classic' ? 25 : 10) + (cael ? statusTotal(run,'player','life') : run.preparation?.life || 0),
    enemyLife: a.pv?.enemy ?? node.life + (cael ? statusTotal(run,'enemy','life',{concordia}) : concordia && run.plans.P1 === 'corazze' ? 2 : 0),
    playerFocus: node.focus + (cael ? statusTotal(run,'player','focus') : phase === 0 ? run.preparation?.focus || 0 : 0),
    enemyFocus: node.focus + (cael ? statusTotal(run,'enemy','focus',{concordia}) : concordia && run.plans.P1 === 'riserve' ? 2 : 0),
    plan: !cael && concordia ? run.plans.P2 : null,
    previousBonus: { player: false, enemy: false }, planUsed: false,
    openingPlayerFirst: a.opening[phase],
  };
  return {
    playerArmy: "Figli dell'Orizzonte", playerDeckCards: run.deck.map(id=>runCard(run,id)),
    enemyArmy: node.army, enemyDeckIds: (cael ? a.enemySquads.flat() : node.roster).map(firstActCard), difficulty: node.difficulty,
    campaignDuelMod: mod,
    startOptions: { eminenceFormat: EMINENCE_FORMAT.DISABLED, skipShuffleDeal: true, fixedHands: { playerHand: a.playerSquads[phase].map(id=>runCard(run,id)), enemyHand: a.enemySquads[phase].map(firstActCard) } },
  };
}
export const revealedAt = (rounds, round) => rounds.filter(r => r <= round).length;
export function firstActMatchOutcome({ playerHP, enemyHP, playerFields, enemyFields, exhausted, round, rule, conquestEffect, duelWinner, conquered=true }) {
  if (playerHP <= 0 || enemyHP <= 0) return { winner: playerHP <= 0 && enemyHP <= 0 ? 'draw' : enemyHP <= 0 ? 'player' : 'enemy', reason: 'hp' };
  if(conquered && conquestEffect==='win' && ['player','enemy'].includes(duelWinner))return {winner:duelWinner,reason:'fields'};
  if(rule==='gabbie')return exhausted?{winner:'draw',reason:'draw'}:null;
  if (rule === 'varco') return playerFields || enemyFields ? { winner: playerFields ? 'player' : 'enemy', reason:'fields' } : exhausted ? {winner:'draw',reason:'draw'} : null;
  if (exhausted) {
    const diff = rule === 'territory' ? (playerFields-enemyFields || playerHP-enemyHP) : (playerHP-enemyHP || playerFields-enemyFields);
    const winner=diff > 0 ? 'player' : diff < 0 ? 'enemy' : 'draw';
    if(conquered && conquestEffect==='capture' && winner===duelWinner)return {winner:'draw',reason:'draw'};
    return { winner, reason: rule === 'territory' ? 'fields' : 'hp' };
  }
  // Reduced formats resolve only at hand exhaustion. Classic preserves reclamation.
  if (rule === 'classic' && round < 5 && enemyFields >= 3 && !(conquered && conquestEffect==='capture' && duelWinner==='enemy')) return {winner:'enemy',reason:'fields'};
  if (rule === 'classic' && round < 5 && playerFields >= 3 && !(conquered && conquestEffect==='capture' && duelWinner==='player')) return {winner:'player',reason:'fields',claim:true};
  return null;
}
