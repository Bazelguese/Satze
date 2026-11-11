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
