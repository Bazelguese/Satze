import {
  REVEAL_GATES,
  CHOICE_PARAMS_TIMING,
  EFFECT_TIMINGS as E,
  EMINENCE_PRIMITIVES as P,
  PRIMITIVE_TARGETS as T,
  TRIGGER_SCOPES,
} from '../../game/eminence/eminenceConstants.js';
import { CONCORDIA_ARMY, CONCORDIA_EMINENCE_ID } from './concordia.js';
const stat = (target, name, delta, minimum) => ({
  timing: E.AFTER_REVEAL,
  primitive: P.MODIFY_STAT,
  target,
  stat: name,
  delta,
  ...(minimum == null ? {} : { minimum }),
});
const ability = (id, name, presenceDelta, text, segments) => ({
  id,
  name,
  presenceDelta,
  text,
  segments,
  revealGate: REVEAL_GATES.GENERAL,
  choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
});
export const CONCORDIA_EMINENCE = {
  id: CONCORDIA_EMINENCE_ID,
  army: CONCORDIA_ARMY,
  name: 'Le Campane del Vallo',
  initialPresence: 1,
  implemented: true,
  campaignOnly: true,
  static: {
    id: 'concordia_richiamo',
    name: 'Rispondere al richiamo',
    implemented: true,
    text: 'A fine round, +1 Presenza se hai scelto il tuo Agente per secondo. Forzare Intervento non cambia questa condizione.',
    segments: [
      {
        timing: E.END_ROUND,
        primitive: P.CHANGE_PRESENCE,
        target: T.SELF,
        delta: 1,
        condition: { ownSelectedSecond: true },
      },
    ],
  },
  abilities: [
    ability(
      'concordia_porte',
      'Serrate le porte',
      1,
      'Il tuo Agente: -1 POT (min 1). Agente nemico: -1 DAN (min 1), per questo Duello.',
      [stat(T.OWN_AGENT, 'power', -1, 1), stat(T.ENEMY_AGENT, 'damage', -1, 1)],
    ),
    ability(
      'concordia_seconda',
      'Alla seconda campana',
      -2,
      'Intervento e Resistenza sono soddisfatti per il tuo Potere e Bonus in questo Duello. I blocchi e i divieti restano validi.',
      [
        {
          timing: E.BEFORE_TRIGGER_CHECK,
          primitive: P.FORCE_TRIGGER,
          scope: TRIGGER_SCOPES.OWN,
          triggers: ['intervention', 'resistenza'],
        },
      ],
    ),
    ability(
      'concordia_sortita',
      'Sortita del Vallo',
      -4,
      'Il tuo Agente ottiene +2 POT e +2 DAN in questo Duello.',
      [stat(T.OWN_AGENT, 'power', 2), stat(T.OWN_AGENT, 'damage', 2)],
    ),
  ],
};
