// ============================================
// EMINENZE — Innesto del bundle nella pipeline del Duello
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §7, §10.2
// ============================================
//
// `duelResolve` passa `checkTrigger` per iniezione a tutti i sotto-moduli. È il punto in cui
// l'overlay entra in gioco senza che nessuno di quei moduli sappia delle Eminenze: qui si
// costruisce un `checkTrigger` che rispetta le regole depositate, altrove resta quello puro.

import { checkTrigger as baseCheckTrigger } from '../triggerLogic.js';
import { resolveTriggerState, snapshotXorActivation } from './triggerRulesOverlay.js';
import { SIDES } from './eminenceConstants.js';

/** Vero se l'overlay contiene almeno una regola capace di cambiare un esito. */
export function hasActiveTriggerRules(rules) {
  if (!rules) return false;
  return (
    rules.forceSatisfied.length > 0
    || rules.forceForbidden.length > 0
    || rules.aliases.length > 0
    || rules.unblockable.length > 0
    || Object.keys(rules.replacementsByCardId).length > 0
    || Object.keys(rules.persistentReplacementsByCardId).length > 0
    || (rules.xorSync && rules.xorSync.length > 0)
    || (rules.equalLeagueSatisfies && rules.equalLeagueSatisfies.length > 0)
  );
}

/**
 * `checkTrigger` consapevole dell'overlay, con la stessa firma di quello puro.
 *
 * Il lato si legge da `context.duelSide`, non dall'identità dell'oggetto: la pipeline crea
 * copie dei contesti per la fase post-Duello, e con il confronto per riferimento i trigger
 * post-battaglia dell'avversario finirebbero valutati come propri.
 *
 * Senza regole attive restituisce la funzione originale, così una partita senza Eminenze
 * percorre esattamente il codice di prima.
 */
export function bindCheckTriggerToOverlay(triggerRules, checkTrigger = baseCheckTrigger, trace = null) {
  if (!hasActiveTriggerRules(triggerRules)) return checkTrigger;

  return function checkTriggerWithOverlay(trigger, context) {
    const resolved = resolveTriggerState({
      originalTrigger: trigger,
      context,
      card: context?.card ?? null,
      side: context?.duelSide === SIDES.ENEMY ? SIDES.ENEMY : SIDES.PLAYER,
      triggerRules,
      checkTrigger,
    });
    if (trace?.aliasUsedBySide && resolved.aliasUsed) {
      const side = context?.duelSide === SIDES.ENEMY ? SIDES.ENEMY : SIDES.PLAYER;
      trace.aliasUsedBySide[side] = true;
    }
    return resolved.satisfied;
  };
}

/**
 * Applica un overlay di Potere depositato dal bundle: trigger e/o effetto temporanei
 * per il Duello corrente, senza mutare la carta nel mazzo.
 */
export function readCardLeagueDelta(leagueByCardId, cardId) {
  if (!leagueByCardId || cardId == null) return 0;
  const raw = leagueByCardId[cardId] ?? leagueByCardId[String(cardId)];
  return Number(raw) || 0;
}

export function collectRoundLeagueByCardId(matchState) {
  const merged = {};
  for (const side of [SIDES.PLAYER, SIDES.ENEMY]) {
    const map = matchState?.[side]?.round?.temporaryLeagueByCardId;
    if (!map) continue;
    for (const [key, delta] of Object.entries(map)) {
      const id = Number(key);
      const slot = Number.isNaN(id) ? key : id;
      merged[slot] = (merged[slot] || 0) + (Number(delta) || 0);
    }
  }
  return merged;
}

export function applyLeagueOverlay(agent, bundle, side) {
  if (!agent) return agent;
  const cardDelta = readCardLeagueDelta(bundle?.leagueByCardId, agent.id);
  const sideDelta = bundle?.statDeltas?.[side]?.league || 0;
  const delta = cardDelta + sideDelta;
  if (!delta) return agent;
  return { ...agent, league: (agent.league || 0) + delta };
}

export function readVaTieWinnerSide(bundle) {
  const sides = [...new Set(bundle?.vaTieWinnerSides || [])];
  if (sides.length === 1) return sides[0];
  return null;
}

export function effectiveCardLeague(card, leagueByCardId = null) {
  if (!card) return null;
  return (card.league || 0) + readCardLeagueDelta(leagueByCardId, card.id);
}

/** Vero se l'Agente schierato ha la Lega effettiva minima tra sé e ciò che resta in mano. */
export function isLowestEffectiveLeague(deployedAgent, remainingHand = [], leagueByCardId = null) {
  if (!deployedAgent) return false;
  const byId = new Map();
  for (const card of [deployedAgent, ...(remainingHand || [])]) {
    if (card?.id == null) continue;
    byId.set(card.id, card);
  }
  if (!byId.size) return false;
  let min = Infinity;
  byId.forEach((card) => {
    const league = effectiveCardLeague(card, leagueByCardId);
    if (league < min) min = league;
  });
  return effectiveCardLeague(deployedAgent, leagueByCardId) === min;
}

function stackToxin(current, application) {
  const value = Math.max(0, application?.value || 0);
  const minHealth = application?.minHealth ?? 0;
  if (!current) {
    return { value, minHealth, source: application?.source ?? null };
  }
  return {
    value: (current.value || 0) + 1,
    minHealth: Math.min(current.minHealth ?? minHealth, minHealth),
    source: application?.source ?? current.source ?? null,
  };
}

/** Applica le Tossine del bundle sul lato vittima. `side` nel bundle è chi la subisce. */
export function applyToxinApplications(bundle, { playerToxin = null, enemyToxin = null, toxinDisabled = false } = {}) {
  if (toxinDisabled || !bundle?.toxinApplications?.length) {
    return { playerToxin, enemyToxin };
  }
  let player = playerToxin;
  let enemy = enemyToxin;
  for (const application of bundle.toxinApplications) {
    if (application.side === SIDES.PLAYER) player = stackToxin(player, application);
    if (application.side === SIDES.ENEMY) enemy = stackToxin(enemy, application);
  }
  return { playerToxin: player, enemyToxin: enemy };
}

const DEPLOY_STAT_KEYS = [
  ['pPower', 'playerPower'],
  ['ePower', 'enemyPower'],
  ['pDamage', 'playerDamage'],
  ['eDamage', 'enemyDamage'],
  ['pAssaultMod', 'playerAssaultMod'],
  ['eAssaultMod', 'enemyAssaultMod'],
];

export function snapshotHasStatReduction(deployStats, after) {
  if (!deployStats || !after) return false;
  return DEPLOY_STAT_KEYS.some(([afterKey, deployKey]) => {
    const before = deployStats[deployKey] ?? 0;
    const next = after[afterKey] ?? 0;
    return next < before;
  });
}

/** Potere concesso per questo Duello: non sostituisce quello stampato sulla carta. */
export function applyGrantedPower(agent, bundle, side) {
  const granted = bundle?.grantedPowers?.[side];
  if (!agent || !granted) return agent;
  return { ...agent, grantedAbility: granted };
}

export function applyAbilityOverlay(agent, bundle) {
  if (!agent) return agent;
  const overlay = bundle?.abilityOverlays?.[agent.id];
  if (!overlay) return agent;

  const ability = { ...(agent.ability || {}) };
  for (const [key, value] of Object.entries(overlay)) {
    ability[key] = value;
  }
  return { ...agent, ability };
}

/**
 * Delta di statistica che il bundle impone al lato indicato, normalizzati.
 * Il bundle può arrivare da uno stato serializzato, quindi non si assume la forma completa.
 */
export function readStatDeltas(bundle, side) {
  const deltas = bundle?.statDeltas?.[side];
  return {
    power: deltas?.power || 0,
    damage: deltas?.damage || 0,
    assaultValue: deltas?.assaultValue || 0,
    league: deltas?.league || 0,
  };
}

/** FC temporanei concessi al lato in questo Duello. */
export function readTemporaryFocus(bundle, side) {
  return Math.max(0, bundle?.temporaryFocus?.[side] || 0);
}

/** Vero se il bundle chiede a quel lato di ignorare il Campo. */
export function ignoresField(bundle, side) {
  return Boolean(bundle?.ignoreFieldSides?.includes(side));
}

/** Esito del Potere per i checkpoint post-Duello (Rito, Devozione). */
export function powerResolutionFromDuel({ battleResult, playerAgent, enemyAgent } = {}) {
  const playerResolved = Boolean(battleResult?.playerAbilityTriggered) && !battleResult?.playerAbilityBlocked;
  const enemyResolved = Boolean(battleResult?.enemyAbilityTriggered) && !battleResult?.enemyAbilityBlocked;
  return {
    powerResolvedBySide: {
      [SIDES.PLAYER]: playerResolved,
      [SIDES.ENEMY]: enemyResolved,
    },
    activatedTriggerBySide: {
      [SIDES.PLAYER]: playerResolved ? (playerAgent?.ability?.trigger ?? null) : null,
      [SIDES.ENEMY]: enemyResolved ? (enemyAgent?.ability?.trigger ?? null) : null,
    },
  };
}

/** Requisito di attivazione soddisfatto (force/forbid inclusi; il Blocca non conta). */
export function readActivationSatisfied(agent, context, side, triggerRules) {
  return resolveTriggerState({
    originalTrigger: agent?.ability?.trigger ?? null,
    context,
    card: agent,
    side,
    triggerRules,
  }).satisfied;
}

export { snapshotXorActivation };
export function readHpDelta(bundle, side) {
  return (bundle?.hpDeltas || [])
    .filter((entry) => entry.side === side)
    .reduce((total, entry) => total + (entry.amount || 0), 0);
}

/**
 * Toglie dal bundle i delta PV già riscossi (HUD), così il Duello non li ribatte.
 */
export function consumeHpDeltas(bundle, bySide = {}) {
  if (!bundle) return bundle;
  const rest = {
    [SIDES.PLAYER]: bySide[SIDES.PLAYER] || bySide.player || 0,
    [SIDES.ENEMY]: bySide[SIDES.ENEMY] || bySide.enemy || 0,
  };
  if (!rest[SIDES.PLAYER] && !rest[SIDES.ENEMY]) return bundle;
  const hpDeltas = [];
  for (const entry of bundle.hpDeltas || []) {
    const leftover = rest[entry.side] || 0;
    if (!leftover || !entry.amount || Math.sign(entry.amount) !== Math.sign(leftover)) {
      hpDeltas.push(entry);
      continue;
    }
    if (Math.abs(leftover) >= Math.abs(entry.amount)) {
      rest[entry.side] = leftover - entry.amount;
      continue;
    }
    hpDeltas.push({ ...entry, amount: entry.amount - leftover });
    rest[entry.side] = 0;
  }
  return { ...bundle, hpDeltas };
}

/** Applica overlay sul Bonus d'Armata: forzato, soppresso, non bloccabile. */
export function applyArmyBonusOverlay({ hasBonus, armyBonus, bonusBlocked = false, sideState = null } = {}) {
  const overlay = sideState || {};
  let nextHas = hasBonus;
  let nextBonus = armyBonus;
  let nextBlocked = bonusBlocked;
  if (overlay.suppressed) nextHas = false;
  if (overlay.forcedActive) {
    nextHas = true;
    if (nextBonus) nextBonus = { ...nextBonus, trigger: null };
  }
  if (overlay.unblockable) nextBlocked = false;
  return { hasBonus: nextHas, armyBonus: nextBonus, bonusBlocked: nextBlocked };
}

const CONVERT_STAT_KEYS = {
  damage: { [SIDES.PLAYER]: 'pDamage', [SIDES.ENEMY]: 'eDamage' },
  power: { [SIDES.PLAYER]: 'pPower', [SIDES.ENEMY]: 'ePower' },
  assaultValue: { [SIDES.PLAYER]: 'pAssaultMod', [SIDES.ENEMY]: 'eAssaultMod' },
};

const CONVERT_HP_KEYS = {
  [SIDES.PLAYER]: 'pHPCurrent',
  [SIDES.ENEMY]: 'eHPCurrent',
};

function roundConverted(value, mode) {
  if (mode === 'floor') return Math.floor(value);
  if (mode === 'round') return Math.round(value);
  return Math.ceil(value);
}

/**
 * Applica le conversioni di statistica dopo i Bonus d'Armata.
 * Registrate al reveal, risolte qui perché X è il DAN post-bonus.
 */
export function applyStatConverts(state, bundle, { directDamageDisabled = false, battleLog = null } = {}) {
  const converts = bundle?.statConverts || [];
  if (!converts.length || !state) return { applied: [] };

  const applied = [];
  for (const conv of converts) {
    const statKey = CONVERT_STAT_KEYS[conv.stat]?.[conv.side];
    if (!statKey) continue;

    const x = Math.max(0, state[statKey] ?? 0);
    const converted = Math.max(0, roundConverted(x * (conv.factor ?? 0.5), conv.round));
    if (conv.zeroStat !== false) state[statKey] = 0;

    if (conv.dest === 'DIRECT_DAMAGE' && !directDamageDisabled && converted > 0) {
      const victim = conv.side === SIDES.PLAYER ? SIDES.ENEMY : SIDES.PLAYER;
      const hpKey = CONVERT_HP_KEYS[victim];
      const before = state[hpKey] ?? 0;
      state[hpKey] = Math.max(0, before - converted);
      battleLog?.push?.(`Conversione: ${x} DAN → 0, ${converted} Danni diretti`);
    } else if (conv.zeroStat !== false) {
      battleLog?.push?.(`Conversione: ${x} DAN → 0`);
    }

    applied.push({
      side: conv.side,
      stat: conv.stat,
      x,
      converted,
      dest: conv.dest,
      source: conv.source ?? null,
    });
  }
  return { applied };
}

/**
 * Override Conquista armati al reveal: si valutano dopo il vincitore e prima
 * della finestra Conquista.
 */
export function resolveConquestOverride(bundle, winner) {
  const overrides = bundle?.conquestOverrides || [];
  let destroyField = false;
  let suppressConquest = false;
  for (const override of overrides) {
    const ownerLost = override.when === 'LOSS'
      && winner
      && winner !== 'draw'
      && winner !== override.ownerSide;
    const ownerWon = override.when === 'WIN' && winner === override.ownerSide;
    if (override.when === 'ALWAYS' || ownerLost || ownerWon) {
      if (override.destroyField) destroyField = true;
      if (override.suppressConquest) suppressConquest = true;
    }
  }
  return { destroyField, suppressConquest };
}
