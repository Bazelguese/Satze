// Solo per i test: Eminenze sintetiche che esercitano meccaniche generiche del motore
// (sorgenti di parametri, gate) senza dipendere da un'abilità reale del catalogo.
// Il catalogo è un oggetto: registrarle qui non tocca EMINENCE_IDS né le liste derivate.

import { EMINENCES } from '../../data/eminences.js';
import {
  CHOICE_PARAMS_TIMING,
  EFFECT_TIMINGS,
  EMINENCE_PRIMITIVES as P,
  PARAM_SOURCES,
  PRIMITIVE_TARGETS as T,
  REVEAL_GATES,
} from './eminenceConstants.js';

export const SYNTHETIC_TARGETS_ID = 'test_bersagli';

/** Eminenza sintetica con bersagli Agente scelti al reveal (non schierati o confermati). */
export function installSyntheticTargetsEminence() {
  EMINENCES[SYNTHETIC_TARGETS_ID] = {
    id: SYNTHETIC_TARGETS_ID,
    army: 'Test',
    name: 'Bersagli di prova',
    initialPresence: 4,
    implemented: true,
    static: { id: 'test_bersagli_statico', name: 'Statico', text: '', implemented: true, segments: [] },
    abilities: [
      {
        id: 'test_non_schierato',
        name: 'Non schierato',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: { cardId: { source: PARAM_SOURCES.UNDEPLOYED_AGENTS } },
        text: 'Scegli un Agente non schierato.',
        segments: [
          { timing: EFFECT_TIMINGS.AFTER_REVEAL, primitive: P.GRANT_TEMPORARY_FOCUS, target: T.CHOSEN, amount: 1 },
        ],
      },
      {
        id: 'test_confermato',
        name: 'Confermato',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: { cardId: { source: PARAM_SOURCES.CONFIRMED_AGENTS } },
        text: 'Scegli uno dei due Agenti confermati.',
        segments: [
          { timing: EFFECT_TIMINGS.AFTER_REVEAL, primitive: P.GRANT_TEMPORARY_FOCUS, target: T.CHOSEN, amount: 1 },
        ],
      },
    ],
  };
  return SYNTHETIC_TARGETS_ID;
}

export const SYNTHETIC_COSTS_ID = 'test_costi';

/** Eminenza sintetica con un costo che cresce nello Scontro (delta persistenti, minimo -4). */
export function installSyntheticCostsEminence() {
  EMINENCES[SYNTHETIC_COSTS_ID] = {
    id: SYNTHETIC_COSTS_ID,
    army: 'Test',
    name: 'Costi di prova',
    initialPresence: 1,
    implemented: true,
    static: { id: 'test_costi_statico', name: 'Statico', text: '', implemented: true, segments: [] },
    abilities: [
      {
        id: 'test_rincaro',
        name: 'Rincaro',
        presenceDelta: 0,
        presenceDeltaMin: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Ottieni 1 FC; ogni uso costa 1 Presenza in più.',
        segments: [
          { timing: EFFECT_TIMINGS.AFTER_REVEAL, primitive: P.GRANT_POOL_FOCUS, target: T.SELF, amount: 1 },
          { timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME, primitive: P.ADJUST_ABILITY_COST, delta: -1, min: -4 },
        ],
      },
      {
        id: 'test_cara',
        name: 'Cara',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Ottieni 2 FC.',
        segments: [
          { timing: EFFECT_TIMINGS.AFTER_REVEAL, primitive: P.GRANT_POOL_FOCUS, target: T.SELF, amount: 2 },
        ],
      },
    ],
  };
  return SYNTHETIC_COSTS_ID;
}
