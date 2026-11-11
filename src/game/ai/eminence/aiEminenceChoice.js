// ============================================
// IA: scelta dell'abilità Eminenza e risposte alle Offerte
// ============================================
//
// Sostituisce, per il lato IA, la scelta "prima abilità legale" (autoSelectFirstLegalAbility)
// e la risposta automatica "accetta sempre la prima opzione" (autoResponseForPendingDeal).
//
// Come sceglie:
// - ogni abilità ha un valore in FC, preso dalle stime del documento
//   Documentazione/SATZE_EMINENZE_MATTONI_BASE_v1.md (§10, colonna "Stima") e corretto con lo
//   stato pubblico della partita (PV, Campi, Duelli persi, Frammenti, Prede, Registro…);
// - la Presenza si pianifica sui Duelli che restano: valore dell'abilità adesso + valore atteso
//   dei Duelli successivi con la Presenza che resta (programmazione dinamica, entrata dello
//   Statico stimata dal documento). Così l'IA usa la ricarica quando le serve Presenza per un
//   colpo forte e non accumula Presenza che a fine Scontro non vale nulla;
// - i bersagli (Preda, Agente vietato, Agente da riusare, pronostico) si scelgono con regole
//   semplici sulla forza delle carte.
//
// Informazioni: solo pubbliche. Non legge mai la scelta segreta dell'avversario né i suoi FC.
// La scelta non dipende dalla difficoltà né dalla personalità (decisione del 11/11/2026).

import { getEminence, getEminenceAbility } from '../../../data/eminences.js';
import {
  getLegalAbilityIds,
  isEminenceSubsystemEnabled,
  readDuelRecord,
  resolveAbilityPresenceDelta,
} from '../../eminence/eminenceState.js';
import { mustChooseThisRound, selectEminenceAbility } from '../../eminence/eminenceRound.js';
import {
  pickDefaultSelectionParams,
  resolveParamsSchema,
  schemaTargetsAvailable,
} from '../../eminence/eminenceParamSchema.js';
import { autoResponseForPendingDeal, autoSelectFirstLegalAbility } from '../../eminence/eminenceDuelGate.js';

/** Peso dei Duelli futuri: lo Scontro può finire prima. */
const FUTURE_DISCOUNT = 0.9;
/** Valore di un Potere medio con trigger attivo (documento §2.1). */
const POWER_VALUE = 2.0;
/** Valore di 1 Presenza (documento §1.1). */
const PRESENCE_VALUE = 0.75;
/** Quanto vale tenersi il rifiuto di un'Offerta: dopo un rifiuto la successiva va accettata. */
const REFUSAL_RESERVE = 0.9;
/** Rumore minimo fra abilità quasi equivalenti, per non essere del tutto prevedibile. */
const TIE_NOISE = 0.06;
/** Valore che esclude una scelta (per esempio PV che potrebbero far perdere lo Scontro). */
const FORBIDDEN = -10;
/** Presenza massima considerata nella pianificazione. */
const PRESENCE_CAP = 12;

/**
 * Presenza media per Duello prodotta dallo Statico (documento §10, "Presenza/Scontro" / 5).
 * Corte Rossa: la Presenza per le Offerte accettate è già nel valore delle abilità.
 */
const STATIC_INCOME = {
  apex_sole_verde: 0.6,
  patto_grande_semaforo: 0.7,
  mascarada_organizzatore: 0.5,
  kethran_altare: 0.5,
  mounthborn_fame: 0.5,
  khemet_maledizioni: 0.6,
  orathai_primo_canto: 0.35,
  corte_rossa: 0,
  figli_domanda_senza_fine: 0.6,
  ratti_bella_malelabbra: 0.6,
  enclave_ascensione: 0.6,
  calibri_quattro_fronti: 0.42,
};

/**
 * Le Maledizioni di Khemet colpiscono entrambi gli Agenti dello slot: il loro valore viene dal
 * saperle sfruttare nella scelta di Agente e FC, che l'IA a simulazione non fa (le Eminenze non
 * sono simulate). Per questo l'IA le valuta meno della stima del documento.
 */
const UNEXPLOITED_CURSE = 0.6;

/** Probabilità che un giocatore accetti un'Offerta della Corte quando può rifiutarla. */
const CORTE_ACCEPT_CHANCE = {
  corte_prestito: 0.7,
  corte_rinforzo: 0.75,
  corte_debito: 0.35,
  corte_interessi: 0.1,
};

const OTHER = { player: 'enemy', enemy: 'player' };
const list = (value) => (Array.isArray(value) ? value : []);
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

export function cardStrength(card) {
  return (card?.power || 0) * 1.2 + (card?.damage || 0);
}

function average(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** Valore di 1 PV: 0.5 FC (documento §10.1), di più quando i PV sono pochi. */
function hpUnitValue(hp) {
  return 0.5 * clamp(1 + (8 - hp) / 4, 1, 3);
}

/** PV ancora da pagare alla Fine dello Scontro dal lato (voci del Registro). */
function endMatchDebtsOn(matchState, side) {
  let total = 0;
  let entries = 0;
  for (const holder of ['player', 'enemy']) {
    for (const debt of list(matchState?.[holder]?.persistent?.endMatchDebts)) {
      if (debt?.side !== side) continue;
      entries += 1;
      total += Number(debt.amount) || 0;
    }
  }
  return { total, entries };
}

/**
 * Stato pubblico dal punto di vista di `side`.
 * @param {object} matchState - stato Eminenze dello Scontro
 * @param {'player'|'enemy'} side
 * @param {object} game - stato di gioco con i nomi di useGameState (playerHand, enemyHand, …)
 */
export function buildEminenceDecisionInfo(matchState, side, game = {}) {
  const opp = OTHER[side];
  const hand = (s) => list(game[`${s}Hand`]).filter(Boolean);
  const used = (s) => new Set(list(game[`${s}UsedCards`]));
  const available = (s) => hand(s).filter((card) => !used(s).has(card.id));
  const fields = Object.values(game.conqueredFields || {}).filter(Boolean);
  const fieldsOf = (s) => fields.filter((f) => f.winner === s).length;
  const totalFields = list(game.battlefields).length || 5;
  const isPlayerFirst = game.isPlayerFirst !== false;
  const hp = (s) => Number(game[`${s}HP`]) || 0;
  const ownState = matchState?.[side] || {};
  const oppState = matchState?.[opp] || {};
  const ownCards = available(side);
  return {
    side,
    roundNumber: Number(game.roundNumber) || 1,
    ownHand: hand(side),
    ownCards,
    oppCards: available(opp),
    ownHP: hp(side),
    oppHP: hp(opp),
    ownFields: fieldsOf(side),
    oppFields: fieldsOf(opp),
    majority: Math.floor(totalFields / 2) + 1,
    ownFirst: side === 'player' ? isPlayerFirst : !isPlayerFirst,
    own: ownState,
    opp: oppState,
    ownRecord: readDuelRecord(ownState.persistent),
    oppRecord: readDuelRecord(oppState.persistent),
    ownDebts: endMatchDebtsOn(matchState, side),
    oppDebts: endMatchDebtsOn(matchState, opp),
    // Duelli che restano compreso questo: uno per Agente ancora da usare.
    duelsLeft: clamp(ownCards.length || 1, 1, 5),
  };
}

function shareWithTrigger(cards, triggers) {
  if (!cards.length) return 0;
  return cards.filter((card) => triggers.includes(card?.ability?.trigger)).length / cards.length;
}

/** Costo in valore di una perdita di PV; vieta le perdite che possono chiudere lo Scontro. */
function hpLossValue(info, expectedLoss, worstLoss) {
  const effectiveHp = info.ownHP - info.ownDebts.total;
  if (effectiveHp <= worstLoss) return FORBIDDEN;
  return -expectedLoss * hpUnitValue(effectiveHp - expectedLoss);
}

/** Semaforo: differenza fra la quota di carte proprie e nemiche che il colore accende. */
function semaforoValue(info, colour) {
  const late = info.roundNumber > 2;
  const finalRounds = info.roundNumber >= 5;
  const gains = (first) => {
    if (colour === 'giallo') {
      return [...(first ? [] : ['imboscata']), ...(late ? ['turbo'] : [])];
    }
    return [...(first ? ['intervention'] : []), ...(finalRounds ? [] : ['ultimaChance'])];
  };
  const losses = (first) => (colour === 'rosso' ? [...(first ? ['imboscata'] : []), ...(late ? [] : ['turbo'])] : []);
  const net = (cards, first) => shareWithTrigger(cards, gains(first)) - shareWithTrigger(cards, losses(first));
  return 0.3 + POWER_VALUE * (net(info.ownCards, info.ownFirst) - net(info.oppCards, !info.ownFirst));
}

/** Valore della Corte se l'Offerta è accettata: stima del documento + 1 Presenza. */
function corteOfferValue(info, abilityId) {
  const lastOffer = info.own.persistent?.lastOffer;
  const forced = Boolean(lastOffer && !lastOffer.accepted && lastOffer.round === info.roundNumber - 1);
  const chance = forced ? 1 : CORTE_ACCEPT_CHANCE[abilityId] ?? 0.5;
  const entries = info.oppDebts.entries;
  const ifAccepted = {
    corte_prestito: -0.55,
    corte_rinforzo: 0.35,
    corte_debito: 0.85,
    corte_interessi: entries ? 0.75 + 0.7 * Math.min(entries, 3) : 0,
  }[abilityId] ?? 0;
  return chance * (ifAccepted + PRESENCE_VALUE);
}

function terraBruciataValue(info) {
  if (info.oppFields >= info.majority - 1) return 3.5;
  if (info.oppFields >= info.majority - 2) return 1.8;
  return 0.9;
}

/**
 * Valore in FC di un'abilità in questo Duello.
 * @param {string} abilityId
 * @param {object} info - da buildEminenceDecisionInfo
 * @param {{ duelsLeft: number, spent: number }} extra - Duelli rimasti; Presenza spesa
 */
export function abilityValue(abilityId, info, { duelsLeft = info.duelsLeft, spent = 0 } = {}) {
  const strongestOpp = Math.max(0, ...info.oppCards.map(cardStrength));
  const avgOpp = average(info.oppCards.map(cardStrength)) || 1;
  const avgOwn = average(info.ownCards.map(cardStrength)) || 1;
  const fragments = list(info.own.persistent?.fragmentCardIds).length;
  switch (abilityId) {
    // Apex
    case 'apex_cielo_smeraldino': return info.oppHP <= 4 ? -0.7 : -0.35;
    case 'apex_disprezzo': return 1.2;
    case 'apex_preghiera_ululata': return info.own.persistent?.armyBonusOverride ? 0 : 0.5 * duelsLeft;
    // Patto degli Indocili
    case 'semaforo_verde': return 0.5;
    case 'semaforo_giallo': return semaforoValue(info, 'giallo');
    case 'semaforo_rosso': return semaforoValue(info, 'rosso');
    // Mascarada
    case 'mascarada_vendere_il_colpo': return -1.0;
    case 'mascarada_scommessa': return 0.6;
    case 'mascarada_maschere':
      return 0.8 * (0.5 + shareWithTrigger(info.ownCards, ['glory', 'vendetta', 'conquest', 'lastWish']));
    // Dura finché l'IA non vince un Duello: circa 1.8 con tre o più Duelli davanti.
    case 'mascarada_ego': return info.own.persistent?.armyBonusOverride ? 0 : 0.6 * Math.min(duelsLeft, 3);
    // Kethran
    case 'kethran_sacrificio': return hpLossValue(info, 2, 2);
    case 'kethran_elogio': return 0.5;
    case 'kethran_innesto': return fragments >= 1 ? 1.2 : 0;
    case 'kethran_opera_composita': return fragments >= 2 ? 2.25 : 0;
    // Mounthborn
    case 'mounthborn_fame_ricarica': {
      const prey = new Set(list(info.own.persistent?.preyCardIds));
      const preyLeft = info.oppCards.some((card) => prey.has(card.id));
      return hpLossValue(info, 2 * (preyLeft ? 0.7 : 1), 2);
    }
    case 'mounthborn_gorgoglio': return 1.0;
    case 'mounthborn_frenesia': return 0.85;
    case 'mounthborn_caccia': return 2.5;
    // Khemet
    case 'khemet_devozione': return 0.15;
    case 'khemet_maledizione_va': return 0.8 * UNEXPLOITED_CURSE;
    case 'khemet_maledizione_stat': return 1.1 * UNEXPLOITED_CURSE;
    case 'khemet_maledizione_inversa': return 2.0 * UNEXPLOITED_CURSE;
    // Orathai
    case 'orathai_prezzo_del_canto': return hpLossValue(info, 1.1, 2);
    case 'orathai_contrappunto': return 0.75;
    case 'orathai_eco': return 1.1;
    case 'orathai_silenzio':
      if (info.ownHP > info.oppHP) return 2.0;
      return info.ownHP === info.oppHP ? 0.5 : -0.5;
    // Corte Rossa
    case 'corte_prestito':
    case 'corte_rinforzo':
    case 'corte_debito':
    case 'corte_interessi':
      return corteOfferValue(info, abilityId);
    // Figli dell'Orizzonte
    case 'figli_deriva': return -0.5;
    case 'figli_condensazione': return 0.5;
    case 'figli_domanda_si_diffonde': {
      const derive = Math.max(0, Number(info.own.persistent?.anchoredThresholdDelta) || 0);
      return [0.4, 0.75, 1.1, 1.4][Math.min(3, derive)];
    }
    // Risposta vale solo se l'Agente è Ancorato: l'IA non lo pianifica, circa metà delle volte.
    case 'figli_risposta': return 1.35;
    // Ratti della Megera
    case 'ratti_corteggiamento': return -0.75;
    case 'ratti_seduzione':
      return info.oppCards.length <= 1 ? 0 : 0.75 * clamp(strongestOpp / avgOpp, 0.8, 1.4);
    case 'ratti_vendetta': {
      const defeated = info.ownHand.filter((card) => list(info.own.persistent?.defeatedCardIds).includes(card.id));
      if (!defeated.length) return 0;
      return 2.0 * clamp(Math.max(...defeated.map(cardStrength)) / avgOwn, 0.5, 1.4);
    }
    // Enclave
    case 'enclave_rinuncia': return -0.84;
    case 'enclave_ascesa': return 0.3;
    case 'enclave_furto_reliquie': {
      const oppPresence = Number(info.opp.presence) || 0;
      return oppPresence >= 2 ? 1.35 : oppPresence === 1 ? 0.9 : 0.45;
    }
    case 'enclave_ascensione': return PRESENCE_VALUE * spent;
    // Calibri Pesanti
    case 'calibri_fermo_macchine': return -1.1;
    case 'calibri_guerra_attrito': return 0.9 * (info.ownRecord.won < info.oppRecord.won ? 2 : 1);
    case 'calibri_logoramento': return 0.85 * info.ownRecord.lost;
    case 'calibri_terra_bruciata': return terraBruciataValue(info);
    default: {
      // Abilità non catalogata qui (nuova o di campagna): valore pari al budget del suo costo.
      const ability = getEminenceAbility(info.own.eminenceId, abilityId);
      return -(ability?.presenceDelta || 0) * PRESENCE_VALUE * 0.8;
    }
  }
}

/**
 * Valore atteso dei Duelli futuri con una certa Presenza (programmazione dinamica).
 * Usa i valori di adesso anche per i Duelli futuri: è un'approssimazione voluta.
 */
function createFuturePlanner(info, abilities, persistent) {
  const income = STATIC_INCOME[info.own.eminenceId] ?? 0.5;
  const base = Math.floor(income);
  const frac = income - base;
  const memo = new Map();

  function plan(presence, duels) {
    if (duels <= 0) return 0;
    const p = clamp(presence, 0, PRESENCE_CAP);
    const key = `${p}:${duels}`;
    if (memo.has(key)) return memo.get(key);
    let best = FUTURE_DISCOUNT * expectNext(p, duels - 1);
    for (const ability of abilities) {
      const delta = resolveAbilityPresenceDelta(ability, persistent, p);
      if (delta < 0 && p < Math.abs(delta)) continue;
      const value = abilityValue(ability.id, info, { duelsLeft: duels, spent: Math.max(0, -delta) });
      const q = value + FUTURE_DISCOUNT * expectNext(p + delta, duels - 1);
      if (q > best) best = q;
    }
    memo.set(key, best);
    return best;
  }

  function expectNext(presence, duels) {
    const next = presence + base;
    return (1 - frac) * plan(next, duels) + frac * plan(next + 1, duels);
  }

  return { plan, expectNext };
}

function cardsById(cards) {
  return new Map(list(cards).filter(Boolean).map((card) => [card.id, card]));
}

function strongest(ids, byId) {
  return [...ids].sort((a, b) => cardStrength(byId.get(b)) - cardStrength(byId.get(a)))[0];
}

function weakest(ids, byId) {
  return [...ids].sort((a, b) => cardStrength(byId.get(a)) - cardStrength(byId.get(b)))[0];
}

/** Pronostico della Scommessa: vittoria propria se le carte rimaste sono almeno pari. */
function predictDuel(info) {
  const own = average(info.ownCards.map(cardStrength));
  const opp = average(info.oppCards.map(cardStrength));
  return own >= opp * 0.95 ? 'VITTORIA_PROPRIA' : 'VITTORIA_AVVERSARIA';
}

/**
 * Bersagli di un'abilità. Parte dai valori predefiniti e corregge quelli per cui c'è una
 * regola chiara; gli altri restano predefiniti.
 */
export function chooseAbilityParams(ability, resolved, info) {
  const params = { ...(pickDefaultSelectionParams(resolved) || {}) };
  const oppById = cardsById(info.oppCards);
  const ownById = cardsById(info.ownHand);
  const ids = (key) => list(resolved?.[key]);
  switch (ability.id) {
    case 'mounthborn_gorgoglio':
      // Preda la carta più forte: il Bonus si accende proprio contro di lei.
      if (ids('preyCardId').length) params.preyCardId = strongest(ids('preyCardId'), oppById);
      break;
    case 'mounthborn_caccia':
      // L'avversario deve schierare la sua carta più debole: Duello favorevole e Preda.
      if (ids('preyCardId').length) params.preyCardId = weakest(ids('preyCardId'), oppById);
      break;
    case 'ratti_seduzione':
      if (ids('cardId').length) params.cardId = strongest(ids('cardId'), oppById);
      break;
    case 'ratti_vendetta':
      if (ids('cardId').length) params.cardId = strongest(ids('cardId'), ownById);
      break;
    case 'kethran_innesto':
      // Sostituire il Bonus tiene il Potere dell'Agente: in media perde meno (Bonus ≈ 0.25 FC).
      if (ids('fragmentCardId').length) params.fragmentCardId = strongest(ids('fragmentCardId'), ownById);
      if (ids('graftInto').includes('bonus')) params.graftInto = 'bonus';
      break;
    case 'mascarada_scommessa':
      if (ids('pronostico').length) params.pronostico = predictDuel(info);
      break;
    default:
      break;
  }
  return Object.keys(params).length ? params : null;
}

/**
 * Classifica le abilità legali del lato per questo Duello.
 * @returns {Array<{ abilityId, value, future, q, params }>} dalla migliore
 */
export function rankAiEminenceAbilities(matchState, side, { game = {}, paramContext = null, rng = Math.random } = {}) {
  const state = matchState?.[side];
  const eminence = getEminence(state?.eminenceId);
  if (!eminence) return [];
  const info = buildEminenceDecisionInfo(matchState, side, game);
  const presence = state.selectionCheckpointPresence ?? state.presence ?? 0;
  const legal = getLegalAbilityIds(state.eminenceId, presence, state.persistent, {
    lastSelectedAbilityId: state.lastSelectedAbilityId,
  });
  const sideContext = paramContextForSide(side, paramContext);
  const playable = [];
  for (const abilityId of legal) {
    const ability = getEminenceAbility(state.eminenceId, abilityId);
    if (!ability) continue;
    const resolved = resolveParamsSchema(ability.paramsSchema, state.persistent, sideContext);
    if (ability.paramsSchema && !schemaTargetsAvailable(resolved, ability.paramsSchema)) continue;
    playable.push({ ability, resolved });
  }
  // Per i Duelli futuri: tutte le abilità del catalogo con bersagli oggi disponibili.
  const futureAbilities = eminence.abilities.filter((ability) => {
    if (!ability.paramsSchema) return true;
    const resolved = resolveParamsSchema(ability.paramsSchema, state.persistent, sideContext);
    return schemaTargetsAvailable(resolved, ability.paramsSchema);
  });
  const planner = createFuturePlanner(info, futureAbilities, state.persistent);

  return playable
    .map(({ ability, resolved }) => {
      const delta = resolveAbilityPresenceDelta(ability, state.persistent, presence);
      const value = abilityValue(ability.id, info, { spent: Math.max(0, -delta) });
      const future = FUTURE_DISCOUNT * planner.expectNext(presence + delta, info.duelsLeft - 1);
      return {
        abilityId: ability.id,
        value,
        future,
        q: value + future + TIE_NOISE * rng(),
        params: chooseAbilityParams(ability, resolved, info),
      };
    })
    .sort((a, b) => b.q - a.q);
}

/** Come paramContextForSide di eminenceDuelGate: il contesto arriva dal punto di vista giocatore. */
function paramContextForSide(side, paramContext) {
  if (!paramContext || side === 'player') return paramContext;
  return {
    ...paramContext,
    ownUndeployedCardIds: paramContext.enemyUndeployedCardIds || [],
    enemyUndeployedCardIds: paramContext.ownUndeployedCardIds || [],
  };
}

/**
 * Sigilla la scelta dell'IA per questo round. Se non trova una scelta valida ripiega sulla
 * prima abilità legale, così il round non resta mai bloccato.
 *
 * @param {object} matchState
 * @param {'player'|'enemy'} side
 * @param {{ game?: object, paramContext?: object, rng?: () => number }} [options]
 *   paramContext dal punto di vista del giocatore, come per autoSelectFirstLegalAbility.
 */
export function chooseAiEminenceSelection(matchState, side, options = {}) {
  if (!isEminenceSubsystemEnabled(matchState)) return matchState;
  if (!mustChooseThisRound(matchState, side)) return matchState;
  if (matchState[side]?.selectedAbilityId) return matchState;

  const ranking = rankAiEminenceAbilities(matchState, side, options);
  for (const entry of ranking) {
    const attempt = selectEminenceAbility(matchState, side, entry.abilityId, entry.params);
    if (attempt.ok) return attempt.matchState;
  }
  return autoSelectFirstLegalAbility(matchState, side, { paramContext: options.paramContext ?? null });
}

/**
 * Preda iniziale (Istinto Predatorio): carte nemiche dalla più forte, così
 * autoCommitEminenceSetup prende la prima.
 * @param {number[]} undeployedIds
 * @param {object[]} cards - mano dell'avversario
 */
export function orderSetupPreyCandidates(undeployedIds, cards) {
  const byId = cardsById(cards);
  return [...list(undeployedIds)].sort((a, b) => cardStrength(byId.get(b)) - cardStrength(byId.get(a)));
}

// ------------------------------------------------------------------
// Risposte dell'IA alle Offerte
// ------------------------------------------------------------------

/** Costo in valore di PV da pagare a Fine Scontro (Registro). */
function endDebtValue(info, amount) {
  const left = info.ownHP - info.ownDebts.total - amount;
  if (left <= 0) return -FORBIDDEN;
  return amount * hpUnitValue(left);
}

/**
 * Valore netto, per chi riceve l'Offerta, dell'accettare: effetto − PV a Fine Scontro − la
 * Presenza che la Corte guadagna.
 * @returns {{ net: number, choice: string|null }}
 */
export function evaluateCorteOffer(abilityId, info, choices = null) {
  switch (abilityId) {
    case 'corte_prestito':
      // 2 FC temporanei in questo Duello.
      return { net: 1.2 - endDebtValue(info, 2) - PRESENCE_VALUE, choice: null };
    case 'corte_rinforzo': {
      const power = 0.75;
      const damage = info.oppHP <= 6 ? 1.0 : 0.5;
      const choice = power >= damage ? 'power' : 'damage';
      const usable = list(choices).length ? (list(choices).includes(choice) ? choice : list(choices)[0]) : choice;
      return { net: Math.max(power, damage) - endDebtValue(info, 1) - PRESENCE_VALUE, choice: usable };
    }
    case 'corte_debito':
      return { net: -0.85 - (info.ownHP - info.ownDebts.total <= 4 ? 1 : 0) - PRESENCE_VALUE, choice: null };
    case 'corte_interessi':
      return { net: -endDebtValue(info, 2 * info.ownDebts.entries) - PRESENCE_VALUE, choice: null };
    default:
      return { net: 0, choice: list(choices)[0] ?? null };
  }
}

/**
 * Corteggiamento: l'IA sceglie se scegliere per prima o per seconda l'Agente.
 *
 * Misurato l'11/11/2026 (464 partite IA Normale contro IA Normale, Classico senza Eminenze,
 * stessa partita giocata nei due modi da un turno a caso fra 1 e 4):
 * - turni 1-2: per seconda vince il 12% di partite in più (±7.7);
 * - turni 3-4: nessuna differenza netta (−4.5% ±5.8), leggera tendenza a favore della prima.
 */
export function chooseCourtshipPosition(info) {
  return info.roundNumber <= 2 ? 'second' : 'first';
}

/**
 * Risposta dell'IA a un Affare (`pendingDeals`), al posto di autoResponseForPendingDeal.
 * @param {object} pendingDeal
 * @param {object} matchState
 * @param {object} [game] - stato di gioco (nomi di useGameState)
 */
export function chooseAiDealResponse(pendingDeal, matchState, game = {}) {
  if (!pendingDeal) return {};
  if (pendingDeal.mode !== 'OFFER') return autoResponseForPendingDeal(pendingDeal, matchState);
  const info = buildEminenceDecisionInfo(matchState, pendingDeal.recipientSide, game);
  const choices = list(pendingDeal.choices);

  if (pendingDeal.kind === 'CHOICE' && choices.includes('first') && choices.includes('second')) {
    return { dealAccepted: true, dealChoice: chooseCourtshipPosition(info) };
  }

  const { net, choice } = evaluateCorteOffer(pendingDeal.source, info, choices);
  const dealChoice = choices.length ? (choices.includes(choice) ? choice : choices[0]) : null;
  if (pendingDeal.mustAccept || net >= -REFUSAL_RESERVE) {
    return { dealAccepted: true, dealChoice };
  }
  return { dealAccepted: false };
}
