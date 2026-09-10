import { FIRST_ACT_VERSION, FIRST_ACT_STAGES, firstActNode, firstActCard, POWER_PACKAGES, FIGLI, NASCENTE, validateFirstActData } from '../data/firstAct.js';
import { ARMY_SETS } from '../../data/cards.js';
import { CONCORDIA_ARMY } from '../data/concordia.js';
import { TRIGGER_NAMES } from '../../data/triggers.js';
import { drawFirstActFields } from '../logic/firstActFields.js';
import { campaignField } from '../data/firstAct.js';
const clone = x => JSON.parse(JSON.stringify(x));
export const isFirstActRun = r => r?.model === 'first-act';
export function shuffled(values, seed, salt) {
  let s = seed >>> 0;
  for (const ch of salt) s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0;
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s); t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    const j = Math.floor(((t ^ t >>> 14) >>> 0) / 4294967296 * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function nascenteCard(run) {
  const n = run.nascente, pkg = POWER_PACKAGES.find(p => p.id === n.packageId);
  let ability = pkg ? { ...pkg.ability } : null;
  // Old E03 evolutions are read as one independent stat, including saved runs/checkpoints.
  const finalStat = n.finalStat || (n.evolution ? (n.evolution === 'damage' ? 'damage' : 'power') : null);
  let power = 2 + n.power + Number(finalStat === 'power');
  const damage = 2 + n.damage + Number(finalStat === 'damage');
  if (n.packageId === 'O1') power += 2;
  const label = ability ? `${TRIGGER_NAMES[ability.trigger] || ability.trigger}: ${effectLabel(ability)}` : 'Nessun Potere';
  return { id: NASCENTE, name: 'Il Nascente', army: FIGLI, power, damage, league: 2 + Number(n.statTaken), ability, description: label, icon: 'sun', campaignOnly: true };
}
function effectLabel(a) {
  const labels = { power: 'POT', damage: 'DAN', assaultValue: 'VA', focusCoin: 'FC', enemyPower: 'POT nemica', enemyDamage: 'DAN nemici', enemyAssault: 'VA nemico' };
  if (labels[a.effect]) return `${a.value > 0 ? '+' : ''}${a.value} ${labels[a.effect]}${a.minPower != null ? ` (min ${a.minPower})` : a.minDamage != null ? ` (min ${a.minDamage})` : a.minAssault != null ? ` (min ${a.minAssault})` : ''}`;
  return ({ blockBonus: 'Blocca Bonus', directDamage: `${a.value} danni diretti`, heal: `Cura ${a.value}`, selfDamage: `−${a.value} PV a te`, powerAndDamage: '+1 POT, +1 DAN', campaignStats: `+${a.value?.power} POT, +${a.value?.damage} DAN` })[a.effect] || a.effect;
}
export const runCard = (r, id) => id === NASCENTE ? nascenteCard(r) : firstActCard(id);
export function migrateFirstActGrowth(r) {
  if (!isFirstActRun(r)) return r;
  let next=r;
  if (r.nascente?.evolution) {
    next={...r,nascente:{...r.nascente,finalStat:r.nascente.finalStat || (r.nascente.evolution==='damage'?'damage':'power'),evolution:null}};
    if (r.active?.snapshot) {
      const card=nascenteCard(next), refresh=c=>c?.id===NASCENTE?{...c,...card}:c;
      const snapshot={...r.active.snapshot};
      for(const key of ['playerHand','playerUsedCards']) if(Array.isArray(snapshot[key])) snapshot[key]=snapshot[key].map(refresh);
      if(snapshot.selectedAgent) snapshot.selectedAgent=refresh(snapshot.selectedAgent);
      next.active={...r.active,snapshot};
    }
  }
  if(r.checkpoints?.length) next={...next,checkpoints:r.checkpoints.map(c=>({...c,state:migrateFirstActGrowth(c.state)}))};
  return next;
}
export const runLeague = (r, ids = r.deck) => ids.reduce((s, id) => s + (runCard(r, id)?.league ?? Infinity), 0);
export const availableFirstActNodes = r => (r.outcome ? [] : FIRST_ACT_STAGES[r.stage] || []).filter(id => !r.branch || id === r.branch).map(firstActNode);
export const mature = (r, c) => r.completed >= c.acquiredAt + 1;
export function createFirstActRun({ seed = Math.floor(Math.random() * 2 ** 31) } = {}) {
  validateFirstActData();
  return { version: 3, designVersion: FIRST_ACT_VERSION, model: 'first-act', actId: 'first-act', stage: 0, completed: 0, slots: 1, seed, deck: [NASCENTE], copies: [], nextCopy: 1, nascente: { packageId: null, power: 0, damage: 0, statTaken: false, finalStat: null, evolution: null }, flags: {}, plans: {}, preparation: null, branch: null, active: null, pendingReward: null, pendingEvent: null, lastResult: null, history: [], checkpoints: [], attempt: 0, outcome: null };
}
export function validateFirstActDeck(r, deck = r.deck) {
  return Array.isArray(deck) && deck.length === r.slots && new Set(deck).size === deck.length && deck.includes(NASCENTE) && deck.every(id => id === NASCENTE || r.copies.some(c => c.cardId === id)) && runLeague(r, deck) <= 30;
}
export function legalArmy(r) {
  const ids = [...new Set(r.copies.map(c => c.cardId))].sort((a, b) => runCard(r, a).league - runCard(r, b).league || a - b);
  const result = [NASCENTE, ...ids.slice(0, r.slots - 1)];
  return validateFirstActDeck(r, result) ? result : null;
}
export function assertFirstActRun(r) {
  if (!isFirstActRun(r) || r.version !== 3 || r.designVersion !== FIRST_ACT_VERSION) throw new Error('Versione del primo atto non riconosciuta.');
  if (!Number.isInteger(r.stage) || r.stage < 0 || r.stage > FIRST_ACT_STAGES.length || !Number.isInteger(r.slots) || r.slots < 1 || r.slots > 10) throw new Error('Progressione non valida.');
  if (!Array.isArray(r.copies) || new Set(r.copies.map(c => c.uid)).size !== r.copies.length || r.copies.some(c => !firstActCard(c.cardId) || !Number.isInteger(c.acquiredAt))) throw new Error('Riserva non valida.');
  if (!validateFirstActDeck(r)) throw new Error('Esercito non valido: identità distinte, Nascente e Lega entro 30.');
  const n = nascenteCard(r);
  if (n.power > 7 || n.damage > 6 || (r.nascente.packageId && !POWER_PACKAGES.some(p => p.id === r.nascente.packageId))) throw new Error('Nascente non valido.');
  if (!Number.isInteger(r.completed) || r.completed<0 || !Number.isInteger(r.seed)) throw new Error('Stato casualità o tappe non valido.');
  if (r.active) {
    const a=r.active;
    if (!firstActNode(a.nodeId) || !Number.isInteger(a.phase) || a.phase<0 || !a.playerSquads?.[a.phase] || !a.enemySquads?.[a.phase]) throw new Error('Tentativo non valido.');
    for (const squads of [a.playerSquads,a.enemySquads]) if (squads.some(s => s.length<1 || s.length>5 || new Set(s).size!==s.length || s.some(id=>!runCard(r,id)))) throw new Error('Mani salvate non valide.');
    if (a.fieldSquads && (a.fieldSquads.length !== a.enemySquads.length || a.fieldSquads.some(ids => ids.length !== firstActNode(a.nodeId).fieldIds.length || new Set(ids).size !== ids.length || ids.some(id => !campaignField(id))))) throw new Error('Campi salvati non validi.');
  }
  if (r.pendingReward && (!firstActNode(r.pendingReward.nodeId)?.roster || !r.pendingReward.offer?.length || r.pendingReward.offer.some(id=>!firstActNode(r.pendingReward.nodeId).roster.includes(id)))) throw new Error('Premio salvato non valido.');
  if (r.pendingEvent && firstActNode(r.pendingEvent.id)?.kind!=='event') throw new Error('Evento salvato non valido.');
  return r;
}
function hand(ids, required, r, salt) {
  if (required.some(id => !ids.includes(id))) throw new Error('Carta garantita assente.');
  return [...required, ...shuffled([...ids].sort((a,b) => a-b).filter(id => !required.includes(id)), r.seed, salt)].slice(0, Math.min(5, ids.length));
}
export function createAttempt(r, node) {
  const player = hand(r.deck, [NASCENTE], r, `${node.id}:hands:player`);
  const enemy = node.squads?.[0] || hand(node.roster, node.required, r, `${node.id}:hands:enemy`);
  const multi = node.squads || (node.kind === 'elite' && node.roster.length === 10 ? [enemy, node.roster.filter(id => !enemy.includes(id))] : null);
  const pSquads = [player];
  if (multi) pSquads.push(r.deck.filter(id => !player.includes(id)).sort((a,b) => a-b));
  const sum = ids => ids.reduce((s,id) => s + runCard(r,id).league, 0);
  const eSquads = multi || [enemy];
  // The opening tutorial must be winnable with equal cards and a full FC commitment.
  const opening = pSquads.map((p,i) => node.openingPlayerFirst ?? (sum(p) === sum(eSquads[i]) ? shuffled([true,false],r.seed,`${node.id}:initiative:${i}`)[0] : sum(p) < sum(eSquads[i])));
  const fieldSquads = eSquads.map((_, phase) => drawFirstActFields(r, node, phase));
  return { id: r.attempt + 1, nodeId: node.id, phase: 0, playerSquads: pSquads, enemySquads: eSquads, fieldSquads, opening, pv: null, snapshot: null };
}
function checkpoint(r) {
  const { checkpoints, ...state } = clone(r);
  return { ...r, checkpoints: [...checkpoints, { completed: r.completed, state }].slice(-4) };
}
function advance(r, nodeId) {
  const next = { ...r, completed: r.completed + 1, stage: r.stage + 1, branch: null, active: null, lastResult: null, pendingReward: null, pendingEvent: null, history: [...r.history, { nodeId, result: 'player' }] };
  if (next.stage === FIRST_ACT_STAGES.length) { next.outcome = 'won'; next.plans = {}; }
  return next;
}
function addCopy(r, cardId) {
  return { ...r, nextCopy: r.nextCopy + 1, copies: [...r.copies, { uid: `c${r.nextCopy}`, cardId, acquiredAt: r.completed + 1 }] };
}
// Preview the very same transaction that Accogli commits, without saving or mutating the run.
export function previewFirstActReward(r, cardId) {
  const next = firstActReducer(r, { type: 'REWARD', cardId });
  return {
    slots: next.slots,
    copies: next.copies.slice(r.copies.length).map((copy, index) => ({
      ...copy,
      reinforcement: index > 0,
      ownedBefore: r.copies.filter(c => c.cardId === copy.cardId).length,
      totalCopies: next.copies.filter(c => c.cardId === copy.cardId).length,
    })),
  };
}
export function transformationPool(r, uid) {
  const copy = r.copies.find(c => c.uid === uid);
  if (!copy || !mature(r, copy) || firstActCard(copy.cardId).army === FIGLI) return [];
  const owned = new Set([NASCENTE, ...r.copies.map(c => c.cardId)]);
  return (ARMY_SETS[FIGLI] || []).filter(c => c.league === firstActCard(copy.cardId).league && !owned.has(c.id)).map(c => c.id).sort((a,b)=>a-b);
}
export function eventChoices(r) {
  const ev = r.pendingEvent;
  if (!ev) return [];
  if (ev.id === 'E06') return ['liberi', 'trattenuti', ...(ev.communion ? ['comunione'] : [])];
  const choices = ['conserva'];
  if (ev.id === 'E02') choices.push('power', 'damage');
  if (!r.nascente.packageId || ev.id === 'E03') choices.push(...POWER_PACKAGES.map(p => p.id));
  if (ev.id === 'E03') choices.push('finalPower', 'finalDamage');
  return choices;
}
export function previewFirstActChoice(r, choice) {
  if (!eventChoices(r).includes(choice)) throw new Error('Risposta non disponibile.');
  let n = { ...r.nascente }, next = { ...r };
  if (r.pendingEvent.id === 'E06') {
    next.preparation = choice === 'liberi' ? { life: 3, focus: 0 } : { life: 0, focus: 2 };
    next.flags = { ...r.flags, [choice === 'liberi' ? 'LIBERI' : choice === 'trattenuti' ? 'TRATTENUTI' : 'COMUNIONE_VALLO']: true, ...(choice === 'comunione' ? { COMUNIONE_VALLO: true } : {}) };
  } else if (choice === 'power' || choice === 'damage') { n[choice]++; n.statTaken = true; }
  else if (choice === 'finalPower' || choice === 'finalDamage') { n.finalStat = choice === 'finalDamage' ? 'damage' : 'power'; n.evolution = null; }
  else if (choice !== 'conserva') { n.packageId = choice; n.evolution = null; }
  next.nascente = n;
  if (!legalArmy(next)) throw new Error('Questa crescita non consente un esercito entro Lega 30.');
  return next;
}
export function firstActReducer(r, action) {
  let next = r;
  switch (action.type) {
    case 'START': {
      const node = availableFirstActNodes(r).find(n => n.id === action.nodeId);
      if (!node || r.active || r.pendingReward || r.pendingEvent || node.kind === 'event' || !validateFirstActDeck(r)) throw new Error('Incontro non disponibile.');
      const base = r.lastResult ? r : checkpoint(r);
      const active = createAttempt(base,node);
      next = { ...base, branch: node.id, active, attempt: active.id, lastResult: null };
      break;
    }
    case 'TEST_WIN': {
      // Explicit test control: use the real outcome/reward path, including node completion.
      if (r.pendingReward || r.pendingEvent || r.outcome) throw new Error('Nessun incontro da risolvere.');
      const started = r.active ? r : firstActReducer(r,{type:'START',nodeId:action.nodeId});
      return firstActReducer(started,{type:'RESULT',attempt:started.active.id,phase:started.active.phase,
        winner:'player',playerHP:Math.max(1,started.active.pv?.player ?? 10),enemyHP:0});
    }
    case 'SNAPSHOT':
      if (!r.active || r.active.id !== action.attempt || r.active.phase !== action.phase) return r;
      next = { ...r, active: { ...r.active, snapshot: clone(action.snapshot) } }; break;
    case 'RESULT': {
      if (!r.active || r.active.id !== action.attempt || r.active.phase !== action.phase) return r;
      const { winner, playerHP, enemyHP } = action;
      if (!['player','enemy','draw'].includes(winner) || !Number.isFinite(playerHP) || !Number.isFinite(enemyHP)) throw new Error('Esito incompleto.');
      const node = firstActNode(r.active.nodeId);
      if (winner === 'player' && playerHP > 0 && enemyHP > 0 && r.active.phase + 1 < r.active.enemySquads.length) {
        next = { ...r, active: { ...r.active, phase: r.active.phase+1, pv: { player: playerHP, enemy: enemyHP }, snapshot: null } }; break;
      }
      if (winner !== 'player') { next = { ...r, active: null, lastResult: winner }; break; }
      const pool = node.roster.filter(id => id !== node.signature);
      const offer = shuffled(pool,r.seed,`${node.id}:reward`).slice(0,['elite','boss'].includes(node.kind) ? 2 : 1);
      next = { ...r, active: null, pendingReward: { nodeId: node.id, offer } }; break;
    }
    case 'REWARD': {
      const pending = r.pendingReward;
      if (!pending || !pending.offer.includes(action.cardId)) throw new Error('Premio non disponibile.');
      const node = firstActNode(pending.nodeId);
      next = addCopy(r,action.cardId);
      next.slots = node.growth || r.slots;
      const owned = () => new Set([NASCENTE,...next.copies.map(c => c.cardId)]);
      if (owned().size < next.slots) {
        const candidates = shuffled(node.roster.filter(id => !owned().has(id)),r.seed,`${node.id}:reinforcement`);
        const id = candidates.find(id => legalArmy(addCopy(next,id)));
        if (id == null) throw new Error('Roster privo di un rinforzo legale.');
        next = addCopy(next,id);
      }
      if (!validateFirstActDeck(next)) next.deck = legalArmy(next);
      if (!next.deck) throw new Error('Nessun esercito legale dopo il premio.');
      if (node.plan) next.plans = { ...next.plans, [node.id.startsWith('I5') ? 'P1' : 'P2']: node.plan };
      next.preparation = null;
      next = advance(next,node.id); break;
    }
    case 'ENTER_EVENT': {
      const node = availableFirstActNodes(r)[0];
      if (!node || node.kind !== 'event' || r.active || r.pendingEvent || r.pendingReward) throw new Error('Evento non disponibile.');
      const groups = {};
      r.copies.filter(c => mature(r,c) && firstActCard(c.cardId).army === CONCORDIA_ARMY).forEach(c => { groups[c.cardId] = (groups[c.cardId] || 0)+1; });
      next = { ...checkpoint(r), pendingEvent: { id: node.id, communion: Object.values(groups).some(n=>n>=2) } }; break;
    }
    case 'CHOICE':
      next = previewFirstActChoice(r, action.choice);
      if (!validateFirstActDeck(next)) throw new Error('Riorganizza l’esercito prima di confermare la crescita.');
      next = advance(next,r.pendingEvent.id); break;
    case 'SET_DECK':
      if (r.active || r.pendingReward || !validateFirstActDeck(r,action.deck)) throw new Error('Esercito non valido o incontro in corso.');
      next = { ...r, deck: [...action.deck] }; break;
    case 'TRANSFORM': {
      if (r.active || r.pendingEvent || r.pendingReward || r.outcome) throw new Error('Concludi prima l’incontro o l’evento.');
      const pool = transformationPool(r,action.uid);
      if (!pool.length) throw new Error('Nessuna trasformazione disponibile.');
      const copy = r.copies.find(c=>c.uid===action.uid);
      const cardId = shuffled(pool,r.seed,`transform:${copy.uid}`)[0];
      const copies = r.copies.map(c => c.uid===copy.uid ? { ...c, cardId } : c);
      next = { ...r, copies, deck: r.deck.map(id => id===copy.cardId && !copies.some(c=>c.cardId===id) ? cardId : id) }; break;
    }
    case 'SKIP':
      if (FIRST_ACT_STAGES[r.stage]?.[0] !== 'F2' || r.active || r.pendingReward) throw new Error('Faglia non saltabile.');
      next = { ...r, stage: r.stage+1, branch:null,lastResult:null }; break;
    case 'ABANDON':
      if (!r.active) return r;
      next = { ...r, active:null,lastResult:'enemy' }; break;
    case 'REWIND': {
      if (r.lastResult !== 'enemy') throw new Error('Riavvolgimento disponibile dopo una sconfitta.');
      const target = r.checkpoints.find(c => c.completed===Math.max(0,r.completed-3));
      if (!target) throw new Error('Checkpoint non disponibile.');
      next = { ...clone(target.state), checkpoints:r.checkpoints.filter(c=>c.completed<target.completed), attempt:r.attempt, lastResult:null }; break;
    }
    default: throw new Error('Azione primo atto non riconosciuta.');
  }
  return assertFirstActRun(next);
}
