import { STARTER_DECK } from '../data/controlledCampaign.js';
import {
  assertCampaignDefinition,
  cloneDefinition,
  allMissions,
} from '../logic/campaignDefinition.js';
import {
  createNascente,
  acquire,
  upgradeStats,
  upgradeEffect,
  NASCENTE_ID,
} from '../logic/nascente.js';
import {
  validateDeck,
  validateDeckStructure,
  poolCardById,
} from './campaignState.js';
export const isControlledRun = (run) => run?.model === 'controlled';
export const currentAct = (run) => run.definition.acts[run.actIndex];
export const currentStage = (run) => currentAct(run)?.stages[run.stageIndex];
export const findRunMission = (run, id) =>
  allMissions(run.definition).find((m) => m.id === id);
export function createControlledRun(
  definition,
  { imprint = 'turbo', seed = Math.floor(Math.random() * 2 ** 31) } = {},
) {
  assertCampaignDefinition(definition);
  if (!['turbo', 'imboscata', 'vendetta'].includes(imprint))
    throw new Error('Impronta iniziale non valida.');
  const effect = {
    turbo: 'power',
    imboscata: 'directDamage',
    vendetta: 'focusCoin',
  }[imprint];
  const run = {
    version: 2,
    model: 'controlled',
    definition: cloneDefinition(definition),
    actId: definition.acts[0].id,
    actIndex: 0,
    stageIndex: 0,
    nascente: acquire(
      createNascente({ power: 3, damage: 2 }),
      imprint,
      effect,
      1,
    ),
    deck: [...STARTER_DECK],
    warehouse: [],
    history: [],
    pendingEvents: [],
    eventsSeen: [],
    currentNode: null,
    attempt: 0,
    activeAttempt: null,
    outcome: null,
    seed,
    savedAt: null,
  };
  assertControlledRun(run);
  return run;
}
export function assertControlledRun(run) {
  assertCampaignDefinition(run.definition);
  if (
    run.version !== 2 ||
    !Number.isInteger(run.actIndex) ||
    run.actIndex < 0 ||
    run.actIndex > 2 ||
    !Number.isInteger(run.stageIndex) ||
    run.stageIndex < 0 ||
    run.stageIndex > 5 ||
    run.actId !== currentAct(run).id
  )
    throw new Error('Progressione campagna non valida.');
  const check = validateDeckStructure(run.deck, run.nascente);
  if (!check.ok || run.deck.length !== 10)
    throw new Error(
      'Il mazzo richiede il Nascente e altre nove carte distinte.',
    );
  const n = run.nascente;
  if (
    !n ||
    !Number.isFinite(n.power) ||
    !Number.isFinite(n.damage) ||
    n.power < 1 ||
    n.power > 7 ||
    n.damage < 1 ||
    n.damage > 6 ||
    !['turbo', 'imboscata', 'vendetta'].includes(n.trigger) ||
    !['power', 'directDamage', 'focusCoin'].includes(n.effect) ||
    !Number.isInteger(n.value) ||
    n.value < 1 ||
    n.value > 4
  )
    throw new Error('Nascente non valido.');
  if (
    !Array.isArray(run.warehouse) ||
    run.warehouse.some((id) => !poolCardById(id)) ||
    new Set([...run.deck, ...run.warehouse]).size !==
      run.deck.length + run.warehouse.length
  )
    throw new Error('Riserva non valida.');
  if (
    !Array.isArray(run.history) ||
    !Array.isArray(run.pendingEvents) ||
    !Array.isArray(run.eventsSeen) ||
    new Set(run.pendingEvents).size !== run.pendingEvents.length ||
    run.pendingEvents.some(
      (id) => !run.definition.events.some((e) => e.id === id),
    )
  )
    throw new Error('Eventi salvati non validi.');
  if (
    run.currentNode &&
    !currentStage(run).alternatives.some((m) => m.id === run.currentNode)
  )
    throw new Error('Incontro attivo non valido.');
  if (run.outcome !== null && run.outcome !== 'won')
    throw new Error('Esito campagna non valido.');
}
export function previewControlledReward(run, choice) {
  const next = { ...run };
  if (choice.reward === 'power' || choice.reward === 'damage')
    next.nascente = upgradeStats(run.nascente, { [choice.reward]: 1 });
  if (choice.reward === 'imprint')
    next.nascente = upgradeEffect(run.nascente, 1);
  if (
    choice.reward === 'card' &&
    ![...run.deck, ...run.warehouse].includes(choice.cardId)
  )
    next.warehouse = [...run.warehouse, choice.cardId];
  return next;
}
export function controlledCampaignReducer(run, action) {
  let next = run;
  if (action.type === 'START_MISSION') {
    if (run.outcome || run.pendingEvents.length || run.currentNode)
      throw new Error('Concludi prima l’evento o l’incontro in corso.');
    if (!currentStage(run).alternatives.some((m) => m.id === action.nodeId))
      throw new Error('Incontro non disponibile.');
    const check = validateDeck(run.deck, run.nascente);
    if (!check.ok) throw new Error(check.errors.join('; '));
    next = {
      ...run,
      currentNode: action.nodeId,
      attempt: run.attempt + 1,
      activeAttempt: run.attempt + 1,
    };
  } else if (action.type === 'APPLY_DUEL_RESULT') {
    // Ignore stale/duplicate callbacks, including callbacks replayed after a reload.
    if (
      action.attempt !== run.activeAttempt ||
      !run.currentNode ||
      action.nodeId !== run.currentNode
    )
      return run;
    if (!['player', 'enemy', 'draw'].includes(action.winner))
      throw new Error('Esito duello non valido.');
    next = {
      ...run,
      currentNode: null,
      activeAttempt: null,
      history: [
        ...run.history,
        {
          missionId: action.nodeId,
          result: action.winner,
          attempt: action.attempt,
        },
      ],
    };
    if (action.winner === 'player') {
      const events = run.definition.events
        .filter(
          (e) =>
            e.missionId === action.nodeId && !run.eventsSeen.includes(e.id),
        )
        .map((e) => e.id);
      next.pendingEvents = events;
      next.eventsSeen = [...run.eventsSeen, ...events];
      if (run.stageIndex < 5) next.stageIndex++;
      else if (run.actIndex < 2) {
        next.actIndex++;
        next.stageIndex = 0;
        next.actId = run.definition.acts[next.actIndex].id;
      } else next.outcome = 'won';
    }
  } else if (action.type === 'APPLY_EVENT_CHOICE') {
    if (run.pendingEvents[0] !== action.eventId)
      throw new Error('Evento non disponibile: segui l’ordine delle scelte.');
    const event = run.definition.events.find((e) => e.id === action.eventId);
    const choice =
      Number.isInteger(action.choiceIndex) && event.choices[action.choiceIndex];
    if (!choice) throw new Error('Scelta non valida.');
    next = {
      ...previewControlledReward(run, choice),
      pendingEvents: run.pendingEvents.slice(1),
    };
  } else if (action.type === 'SET_DECK') {
    if (run.currentNode)
      throw new Error('Non puoi cambiare mazzo durante un incontro.');
    const owned = new Set([...run.deck, ...run.warehouse]);
    if (
      !Array.isArray(action.deck) ||
      action.deck.length !== 10 ||
      !validateDeck(action.deck, run.nascente).ok ||
      action.deck.some((id) => !owned.has(id))
    )
      throw new Error(
        'Scegli dieci carte possedute, Nascente incluso, entro Lega 30.',
      );
    if (
      action.deck.filter(
        (id) =>
          id === NASCENTE_ID ||
          poolCardById(id)?.army === run.definition.playerArmy,
      ).length < 5
    )
      throw new Error(
        'Servono almeno cinque Figli dell’Orizzonte per l’Eminenza.',
      );
    next = {
      ...run,
      deck: [...action.deck],
      warehouse: [...owned].filter((id) => !action.deck.includes(id)),
    };
  } else if (action.type === 'ABANDON_ATTEMPT')
    next = { ...run, currentNode: null, activeAttempt: null };
  else throw new Error('Azione campagna non riconosciuta.');
  assertControlledRun(next);
  return next;
}
