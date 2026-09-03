// ============================================
// EMINENZE — Catalogo dati
// Fonte normativa: Documentazione/SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §12
// ============================================
//
// Questo file è dati, non logica. Ogni abilità descrive i propri effetti come sequenza di
// segmenti che referenziano le primitive di `src/game/eminence/eminenceConstants.js`.
// Il motore non deve mai contenere un ramo condizionale su una specifica Eminenza.
//
// `implemented: false` indica un'Eminenza già canonizzata nel design ma non ancora dotata
// di segmenti eseguibili. Resta comunque presente qui perché eleggibilità, gate, curva di
// Presenza e vincoli informativi sono verificabili — e testati — fin da subito.

import {
  REVEAL_GATES,
  CHOICE_PARAMS_TIMING,
  EFFECT_TIMINGS,
  EMINENCE_PRIMITIVES as P,
  PRIMITIVE_TARGETS as T,
  TRIGGER_SCOPES,
  HP_LOSS_CAUSES,
  PARAM_SOURCES,
} from '../game/eminence/eminenceConstants.js';

export const EMINENCES = {
  // ------------------------------------------------------------------
  // §12.1 Apex — Il Sole Verde
  // ------------------------------------------------------------------
  apex_sole_verde: {
    id: 'apex_sole_verde',
    army: 'Apex',
    name: 'Il Sole Verde',
    initialPresence: 3,
    implemented: true,

    static: {
      id: 'ora_verde',
      name: 'Cataclisma: Ora Verde',
      text: 'All\'inizio del round 5, lo slot aperto viene sostituito da un Campo Apex.',
      implemented: true,
      segments: [
        {
          // ROUND_START e non AFTER_REVEAL: la sostituzione cambia le premesse della scelta
          // del Campo, quindi deve essere pubblica prima che quella scelta avvenga.
          timing: EFFECT_TIMINGS.ROUND_START,
          primitive: P.REPLACE_FIELD,
          target: T.GLOBAL,
          // Il Meridiano è l'Ora Verde stessa: fissarlo evita di tirare a sorte fra sei Campi
          // molto diversi — uno dei quali cambia la condizione di vittoria — nel round decisivo.
          // Per la lettura indeterminata basta sostituire questa riga con `fieldArmy: 'Apex'`.
          fieldId: 89,
          condition: { roundNumber: 5 },
        },
      ],
    },

    abilities: [
      {
        id: 'apex_furia',
        name: 'Furia',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il prossimo Agente del proprietario ottiene +1 POT. Il proprietario perde 2 PV.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MODIFY_STAT,
            target: T.OWN_AGENT,
            stat: 'power',
            delta: 1,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.LOSE_HP,
            target: T.SELF,
            amount: 2,
            cause: HP_LOSS_CAUSES.EMINENCE_COST,
          },
        ],
      },
      {
        id: 'apex_disprezzo',
        name: 'Disprezzo',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il prossimo Agente del proprietario ignora gli effetti del Campo in questo Duello.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.IGNORE_FIELD,
            target: T.OWN_AGENT,
          },
        ],
      },
      {
        id: 'apex_cataclisma',
        name: 'Cataclisma',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il prossimo Agente del proprietario ottiene Potere: +2 POT, +2 DAN.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.GRANT_POWER,
            target: T.OWN_AGENT,
            trigger: null,
            effects: [
              { effect: 'power', value: 2 },
              { effect: 'damage', value: 2 },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.8 Patto degli Indocili — Il Grande Semaforo
  // ------------------------------------------------------------------
  patto_grande_semaforo: {
    id: 'patto_grande_semaforo',
    army: 'Patto degli Indocili',
    name: 'Il Grande Semaforo',
    initialPresence: 0,
    implemented: true,

    static: null,

    abilities: [
      {
        id: 'semaforo_verde',
        name: 'Verde',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Imboscata e Turbo sono considerati soddisfatti in questo round. Intervento e Ultima Chance non possono attivarsi.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORCE_TRIGGER,
            scope: TRIGGER_SCOPES.GLOBAL,
            triggers: ['imboscata', 'turbo'],
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORBID_TRIGGER,
            scope: TRIGGER_SCOPES.GLOBAL,
            triggers: ['intervention', 'ultimaChance'],
          },
        ],
      },
      {
        id: 'semaforo_giallo',
        name: 'Giallo',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Tutti i trigger seguono le condizioni normali.',
        segments: [],
      },
      {
        id: 'semaforo_rosso',
        name: 'Rosso',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Intervento e Ultima Chance sono considerati soddisfatti in questo round. Imboscata e Turbo non possono attivarsi.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORCE_TRIGGER,
            scope: TRIGGER_SCOPES.GLOBAL,
            triggers: ['intervention', 'ultimaChance'],
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORBID_TRIGGER,
            scope: TRIGGER_SCOPES.GLOBAL,
            triggers: ['imboscata', 'turbo'],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.2 Mascarada — L'Organizzatore degli Incontri
  // ------------------------------------------------------------------
  mascarada_organizzatore: {
    id: 'mascarada_organizzatore',
    army: 'Mascarada',
    name: 'L\'Organizzatore degli Incontri',
    initialPresence: 1,
    implemented: true,
    reordersGateSequence: 'AGENTS_FIRST',

    static: {
      id: 'mascarada_ordine_incontri',
      name: 'Ordine degli Incontri',
      text: 'Gli Agenti vengono scelti e resi noti prima della scelta del Campo.',
      implemented: true,
      // Il riordino vive su `reordersGateSequence`: lo Statico non deposita segmenti.
      segments: [],
    },

    abilities: [
      {
        id: 'mascarada_scommessa',
        name: 'Scommessa',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_SELECTION,
        paramsSchema: { pronostico: ['VITTORIA_PROPRIA', 'VITTORIA_AVVERSARIA', 'PAREGGIO'] },
        text: 'Il proprietario pronostica segretamente l\'esito del Duello. Se il pronostico è corretto, +2 Presenza.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 2,
            condition: {
              duelWinnerRelative: {
                param: 'pronostico',
                map: {
                  VITTORIA_PROPRIA: 'self',
                  VITTORIA_AVVERSARIA: 'opponent',
                  PAREGGIO: 'draw',
                },
              },
            },
          },
        ],
      },
      {
        id: 'mascarada_maschere',
        name: 'Maschere Invertite',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello, Gloria può essere soddisfatta anche come Vendetta e viceversa; Conquista anche come Ultimo Desiderio e viceversa.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.ALIAS_TRIGGER,
            scope: TRIGGER_SCOPES.GLOBAL,
            map: {
              glory: ['vendetta'],
              vendetta: ['glory'],
              conquest: ['lastWish'],
              lastWish: ['conquest'],
            },
          },
        ],
      },
      {
        id: 'mascarada_incontro_truccato',
        name: 'Incontro Truccato',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello, il trigger del proprio Agente è considerato soddisfatto e il suo Potere non può essere bloccato.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORCE_TRIGGER,
            scope: TRIGGER_SCOPES.OWN,
            // Senza `triggers` la voce vale per ogni trigger del proprio Agente; i post-Duello
            // restano esclusi perché non sono il Potere schierato.
            excludeTriggers: ['conquest', 'lastWish'],
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.UNBLOCKABLE_POWER,
            scope: TRIGGER_SCOPES.OWN,
            excludeTriggers: ['conquest', 'lastWish'],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.3 Kethran — L'Altare della Ricomposizione
  // ------------------------------------------------------------------
  kethran_altare: {
    id: 'kethran_altare',
    army: 'Kethran',
    name: 'L\'Altare della Ricomposizione',
    initialPresence: 2,
    initialPresenceProvisional: true,
    implemented: true,

    static: {
      id: 'kethran_ricomposizione',
      name: 'Ricomposizione',
      text: 'Quando il proprio Agente perde un Duello, diventa Frammento per il resto dello Scontro.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.MARK_CARD,
          target: T.OWN_AGENT,
          mark: 'fragment',
          persistent: true,
          condition: { duelWinnerRelative: 'opponent' },
        },
      ],
    },

    abilities: [
      {
        id: 'kethran_sacrificio',
        name: 'Sacrificio',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il proprio Agente perde il Duello, +1 Presenza.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 1,
            condition: { duelWinnerRelative: 'opponent' },
          },
        ],
      },
      {
        id: 'kethran_innesto',
        name: 'Innesto',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          fragmentCardId: { source: PARAM_SOURCES.OWN_FRAGMENTS, requireTrigger: true },
        },
        text: 'Il proprietario sceglie un Frammento: in questo Duello il Potere del proprio Agente può attivarsi con il trigger proprio o con quello del Frammento.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.ALIAS_TRIGGER,
            scope: TRIGGER_SCOPES.OWN,
            aliasParam: 'fragmentTrigger',
          },
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.MARK_CARD,
            mark: 'fragment',
            consume: true,
            persistent: true,
            condition: { aliasUsed: true },
          },
        ],
      },
      {
        id: 'kethran_opera_composita',
        name: 'Opera Composita',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il proprietario sceglie uno o due Frammenti: in questo Duello sostituiscono trigger, effetto o entrambi del proprio Agente.',
        paramsSchema: {
          fragmentCardId: { source: PARAM_SOURCES.OWN_FRAGMENTS, max: 2 },
          composeComponent: ['TRIGGER', 'EFFECT'],
        },
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.COMPOSE_ABILITY,
            target: T.OWN_AGENT,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.MARK_CARD,
            mark: 'fragment',
            consume: true,
            persistent: true,
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.4 Mounthborn — La Fame
  // ------------------------------------------------------------------
  mounthborn_fame: {
    id: 'mounthborn_fame',
    army: 'Mounthborn',
    name: 'La Fame',
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'mounthborn_istinto_predatorio',
      name: 'Istinto Predatorio',
      text: 'All\'inizio dello Scontro, il proprietario sceglie un Agente nemico: diventa Preda per il resto dello Scontro.',
      implemented: true,
      setupChoice: true,
      setupParamsSchema: {
        preyCardId: { source: PARAM_SOURCES.ENEMY_UNDEPLOYED },
      },
      setupSegments: [
        {
          primitive: P.MARK_CARD,
          mark: 'prey',
          persistent: true,
        },
      ],
      segments: [
        {
          timing: EFFECT_TIMINGS.POST_BATTLE,
          primitive: P.MARK_CARD,
          mark: 'prey',
          consume: true,
          persistent: true,
          target: T.ENEMY_AGENT,
          condition: { enemyAgentTrigger: { not: 'turbo' } },
        },
        {
          timing: EFFECT_TIMINGS.END_ROUND,
          primitive: P.MARK_CARD,
          mark: 'prey',
          consume: true,
          persistent: true,
          target: T.ENEMY_AGENT,
          condition: { enemyAgentTrigger: 'turbo' },
        },
      ],
    },

    abilities: [
      {
        id: 'mounthborn_gorgoglio',
        name: 'Gorgoglio dai Cento Occhi',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          preyCardId: { source: PARAM_SOURCES.ENEMY_UNDEPLOYED },
        },
        text: 'Il proprietario sceglie un Agente nemico non schierato: diventa Preda per il resto dello Scontro. Se una Preda è schierata in questo round, +2 Presenza.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MARK_CARD,
            mark: 'prey',
            persistent: true,
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 2,
            condition: { deployedMarks: { has: 'prey' } },
          },
        ],
      },
      {
        id: 'mounthborn_frenesia',
        name: 'Frenesia della Fame',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se una Preda è schierata, in questo Duello il Bonus d\'Armata del proprietario è considerato attivo e non può essere bloccato.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.SET_ARMY_BONUS_STATE,
            target: T.SELF,
            forcedActive: true,
            unblockable: true,
            condition: { deployedMarks: { has: 'prey' } },
          },
        ],
      },
      {
        id: 'mounthborn_cannibalismo',
        name: 'Cannibalismo',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il proprio Agente perde il Duello contro una Preda, il proprietario Cura 3 PV.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.HEAL_HP,
            target: T.SELF,
            amount: 3,
            condition: { duelWinnerRelative: 'opponent', enemyMarks: { has: 'prey' } },
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.5 Khemet — Il Castello dei Sigillatori
  // Tutte e tre le attive sono PRE_FIELD per igiene informativa (spec §3.2).
  // ------------------------------------------------------------------
  khemet_maledizioni: {
    id: 'khemet_maledizioni',
    army: 'Khemet',
    name: 'Il Castello dei Sigillatori',
    initialPresence: 2,
    implemented: true,

    static: {
      id: 'khemet_rito_overdrive',
      name: 'Risonanza del Nono Sigillo',
      text: 'Quando il proprio Agente attiva Overdrive, +1 Presenza.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          condition: { ownActivatedTrigger: 'overdrive' },
        },
      ],
    },

    abilities: [
      {
        id: 'khemet_devozione',
        name: 'Convalida',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il Potere del proprio Agente si attiva realmente e non viene bloccato, +1 Presenza.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 1,
            condition: { ownPowerResolved: true },
          },
        ],
      },
      {
        id: 'khemet_maledizione_va',
        name: 'Sigillo della Misura',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          slot: { source: PARAM_SOURCES.BATTLEFIELD_SLOTS },
        },
        text: 'Il proprietario sceglie uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono −VA pari alla propria Lega.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.APPLY_SLOT_MODIFIER,
            persistent: true,
            leagueScaled: true,
          },
        ],
      },
      {
        id: 'khemet_maledizione_stat',
        name: 'Sigillo dell\'Imposizione',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          slot: { source: PARAM_SOURCES.BATTLEFIELD_SLOTS },
        },
        text: 'Il proprietario sceglie uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono −1 POT, −1 DAN, −1 VA.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.APPLY_SLOT_MODIFIER,
            persistent: true,
            deltas: { power: -1, damage: -1, assaultValue: -1 },
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.6 Orathai — Il Primo Canto
  // ------------------------------------------------------------------
  orathai_primo_canto: {
    id: 'orathai_primo_canto',
    army: 'Orathai',
    name: 'Il Primo Canto',
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'orathai_risonanza',
      name: 'Consonanza',
      text: 'Se entrambi gli Agenti soddisfano il requisito di attivazione del proprio Potere nello stesso Duello, +1 Presenza.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          repeatable: true,
          condition: {
            ownActivationSatisfied: true,
            enemyActivationSatisfied: true,
          },
        },
      ],
    },

    abilities: [
      {
        id: 'orathai_tacet',
        name: 'Tacet',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        announceAtReveal: false,
        text: 'Se nessuno dei due Agenti soddisfa il requisito di attivazione, +2 Presenza.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 2,
            condition: {
              ownActivationSatisfied: false,
              enemyActivationSatisfied: false,
            },
          },
        ],
      },
      {
        id: 'orathai_contrappunto',
        name: 'Contrappunto',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se esattamente uno dei due dovrebbe attivare il Potere, entrambi vengono considerati soddisfatti.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.SYNC_TRIGGERS_ON_XOR,
            mode: 'FORCE_BOTH',
            excludeTriggers: ['conquest', 'lastWish'],
          },
        ],
      },
      {
        id: 'orathai_silenzio',
        name: 'Silenzio',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se esattamente uno dei due dovrebbe attivare il Potere, nessuno dei due viene considerato soddisfatto.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.SYNC_TRIGGERS_ON_XOR,
            mode: 'FORBID_BOTH',
            excludeTriggers: ['conquest', 'lastWish'],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.7 Corte Rossa — Sanguinaccio, il Registro (eccezione approvata: 4 attive)
  // ------------------------------------------------------------------
  corte_rossa: {
    id: 'corte_rossa',
    army: 'Corte Rossa',
    name: 'Sanguinaccio, il Registro',
    initialPresence: 1,
    initialPresenceProvisional: true,
    implemented: true,

    static: {
      id: 'corte_pagare_debiti',
      name: 'Pagare i Debiti',
      text: 'Ogni volta che un giocatore perde PV per una causa diversa dal DAN della sconfitta, +1 Presenza. Si conta l\'evento, non i PV.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.ON_HP_LOSS,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          repeatable: true,
          condition: { hpLossCause: { not: HP_LOSS_CAUSES.DUEL_DEFEAT_DAMAGE } },
        },
      ],
    },

    abilities: [
      {
        id: 'corte_accordo',
        name: 'Accordo Unilaterale',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'L\'avversario perde 2 PV; in questo Duello l\'Agente nemico riceve 1 FC temporaneo.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.LOSE_HP,
            target: T.OPPONENT,
            amount: 2,
            cause: HP_LOSS_CAUSES.EMINENCE_COST,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.GRANT_TEMPORARY_FOCUS,
            target: T.ENEMY_AGENT,
            amount: 1,
          },
        ],
      },
      {
        id: 'corte_salasso',
        name: 'Salasso',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il proprietario perde 3 PV; in questo Duello il proprio Agente riceve 1 FC temporaneo.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.LOSE_HP,
            target: T.SELF,
            amount: 3,
            cause: HP_LOSS_CAUSES.EMINENCE_COST,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.GRANT_TEMPORARY_FOCUS,
            target: T.OWN_AGENT,
            amount: 1,
          },
        ],
      },
      {
        id: 'corte_clausola',
        name: 'Clausola Capestro',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          cardId: { source: PARAM_SOURCES.UNDEPLOYED_AGENTS },
        },
        text: 'Il proprietario sceglie un Agente non ancora schierato, di entrambi i lati. Per il resto dello Scontro il trigger del suo Potere diventa Debito: quando viene schierato, il giocatore che lo controlla perde 2 PV; poi il Potere si attiva.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.REPLACE_TRIGGER,
            persistent: true,
            trigger: 'debt',
          },
        ],
      },
      {
        id: 'corte_debito_eterno',
        name: 'Debito Eterno',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          cardId: { source: PARAM_SOURCES.CONFIRMED_AGENTS },
        },
        text: 'Il proprietario sceglie uno dei due Agenti confermati: in questo Duello riceve 2 FC temporanei. Alla Fine Scontro il giocatore che lo controlla perde PV pari alla POT finale registrata.',
        announceAtReveal: false,
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.GRANT_TEMPORARY_FOCUS,
            target: T.CHOSEN,
            amount: 2,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.REGISTER_END_MATCH_DEBT,
            basis: 'FINAL_POWER',
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.9 Figli dell'Orizzonte — La Domanda Senza Fine
  // ------------------------------------------------------------------
  figli_domanda_senza_fine: {
    id: 'figli_domanda_senza_fine',
    army: 'Figli dell\'Orizzonte',
    name: 'La Domanda Senza Fine',
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'figli_ancorato',
      name: 'Ancorato',
      text: 'Un Agente è Ancorato se ha investito almeno 6 − Lega effettiva + aumenti del requisito.',
      implemented: true,
      segments: [],
    },

    abilities: [
      {
        id: 'figli_deriva',
        name: 'Deriva',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il requisito di Ancorato aumenta di 1, per il resto dello Scontro, già da questo round.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MODIFY_ANCHORED_THRESHOLD,
            target: T.SELF,
            delta: 1,
          },
        ],
      },
      {
        id: 'figli_leggerezza',
        name: 'Leggerezza',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il proprio Agente non è Ancorato, +1 Presenza.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 1,
            condition: { ownAnchored: false },
          },
        ],
      },
      {
        id: 'figli_risposta',
        name: 'Risposta',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello, se il proprio Agente è Ancorato, il suo trigger è considerato soddisfatto.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORCE_TRIGGER,
            scope: TRIGGER_SCOPES.OWN,
            condition: { ownAnchored: true },
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.10 Ratti della Megera — Bella dalle Malelabbra
  // ------------------------------------------------------------------
  ratti_bella_malelabbra: {
    id: 'ratti_bella_malelabbra',
    army: 'Ratti della Megera',
    name: 'Bella dalle Malelabbra, l\'Erede della Megera',
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'ratti_male_crescente',
      name: 'Male Crescente',
      text: 'Quando schieri un Agente con la Lega effettiva più bassa tra quelli che ti restano in mano, +1 Presenza.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          condition: { ownDeployedIsLowestLeague: true },
        },
      ],
    },

    abilities: [
      {
        id: 'ratti_sussurro',
        name: 'Sussurro',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        announceAtReveal: false,
        text: 'Se durante il Duello almeno un Agente subisce una riduzione a POT, DAN o VA, +1 Presenza.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 1,
            condition: { statReductionOccurred: true },
          },
        ],
      },
      {
        id: 'ratti_veleno',
        name: 'Veleno',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Blocca il proprio Bonus d\'Armata per questo Duello; applica Tossina 1 (min 10) all\'avversario.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.SET_ARMY_BONUS_STATE,
            target: T.SELF,
            suppressed: true,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.APPLY_TOXIN,
            target: T.OPPONENT,
            value: 1,
            minHealth: 10,
          },
        ],
      },
      {
        id: 'ratti_conquista_forzata',
        name: 'Conquista Forzata',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello, Conquista è considerata soddisfatta per il proprio Agente indipendentemente dall\'esito.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORCE_TRIGGER,
            scope: TRIGGER_SCOPES.OWN,
            triggers: ['conquest'],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.11 Enclave delle Scaglie — L'Enclave dell'Ascensione
  // ------------------------------------------------------------------
  enclave_ascensione: {
    id: 'enclave_ascensione',
    army: 'L\'Enclave delle Scaglie',
    name: 'L\'Enclave dell\'Ascensione',
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'enclave_accumulo',
      name: 'Accumulo',
      text: 'Quando investi almeno 3 FC reali sul tuo Agente in un Duello, +1 Presenza. Gli FC temporanei non contano.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          repeatable: true,
          condition: { ownFocusInvested: { min: 3 } },
        },
      ],
    },

    abilities: [
      {
        id: 'enclave_rinuncia',
        name: 'Rinuncia al Privilegio',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il proprio Bonus d\'Armata è bloccato per questo Duello.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.SET_ARMY_BONUS_STATE,
            target: T.SELF,
            suppressed: true,
          },
        ],
      },
      {
        id: 'enclave_ascesa',
        name: 'Ascesa / Declassamento',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Scegli un proprio Agente non ancora schierato: la sua Lega cambia di +1 o −1 per questo round. Se non lo schieri, la modifica scade a fine round.',
        paramsSchema: {
          cardId: { source: PARAM_SOURCES.OWN_UNDEPLOYED },
          leagueDelta: [1, -1],
        },
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MODIFY_LEAGUE,
            target: T.CHOSEN,
            persistOnCard: true,
          },
        ],
      },
      {
        id: 'enclave_ascensione',
        name: 'Ascensione',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Sfida e Sopraffare del proprio Agente sono soddisfatti anche a Leghe uguali; in caso di parità di VA vince il proprio lato.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.SATISFY_TRIGGER_ON_EQUAL_LEAGUE,
            scope: TRIGGER_SCOPES.OWN,
            triggers: ['sfida', 'sopraffare'],
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.ARM_VA_TIE_WIN,
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.12 Calibri Pesanti — Il Comando dei Quattro Fronti
  // ------------------------------------------------------------------
  calibri_quattro_fronti: {
    id: 'calibri_quattro_fronti',
    army: 'Calibri Pesanti',
    name: 'Il Comando dei Quattro Fronti',
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'calibri_tenere_la_linea',
      name: 'Tenere la Linea',
      text: 'Quando perdi un Duello e l\'Agente nemico termina con 2 DAN o meno, +1 Presenza.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          repeatable: true,
          condition: {
            duelWinnerRelative: 'opponent',
            enemyFinalDamage: { max: 2 },
          },
        },
      ],
    },

    abilities: [
      {
        id: 'calibri_guerra_attrito',
        name: 'Guerra d\'Attrito',
        presenceDelta: 0,
        presenceDeltaMin: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Ottieni 1 FC. Ogni Duello che vinci aumenta di 1 il costo in Presenza di questa abilità per il resto dello Scontro (0 → 1 → 2 → 3 → 4).',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.GRANT_TEMPORARY_FOCUS,
            target: T.OWN_AGENT,
            amount: 1,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.ADJUST_ABILITY_COST,
            delta: -1,
            min: -4,
            condition: { duelWinnerRelative: 'self' },
          },
        ],
      },
      {
        id: 'calibri_contenimento',
        name: 'Protocollo di Contenimento',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Dopo i Bonus d\'Armata, registra il DAN del tuo Agente come X: il suo DAN diventa 0 e infliggi metà di X in Danni diretti, arrotondata per eccesso. Se vinci il Duello, +2 Presenza.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.CONVERT_STAT,
            target: T.OWN_AGENT,
            stat: 'damage',
            factor: 0.5,
            round: 'ceil',
            dest: 'DIRECT_DAMAGE',
            zeroStat: true,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 2,
            condition: { duelWinnerRelative: 'self' },
          },
        ],
      },
      {
        id: 'calibri_terra_bruciata',
        name: 'Protocollo Terra Bruciata',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se perdi, dopo il vincitore e prima di Conquista distruggi il Campo: nessuno lo conquista e nessun effetto Conquista si attiva. Il DAN della vittoria si risolve normalmente.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.ARM_CONQUEST_OVERRIDE,
            when: 'LOSS',
            destroyField: true,
            suppressConquest: true,
          },
        ],
      },
    ],
  },
};

/** Elenco stabile degli id, utile per iterazioni deterministiche e test. */
export const EMINENCE_IDS = Object.keys(EMINENCES);

/** Ordine canonico delle Armate (allineato a armies.js / galleria Agenti). */
export const EMINENCE_ARMY_ORDER = [
  "Figli dell'Orizzonte",
  'Kethran',
  'Corte Rossa',
  'Calibri Pesanti',
  'Orathai',
  'Mounthborn',
  "L'Enclave delle Scaglie",
  'Ratti della Megera',
  'Patto degli Indocili',
  'Khemet',
  'Apex',
  'Mascarada',
];

/** Eminenze con segmenti eseguibili: l'unico insieme giocabile nella fase corrente. */
export const IMPLEMENTED_EMINENCE_IDS = EMINENCE_IDS.filter((id) => EMINENCES[id].implemented);

/** Indice Armata → Eminenza. Una sola Eminenza per Armata. */
export const EMINENCE_BY_ARMY = EMINENCE_IDS.reduce((acc, id) => {
  acc[EMINENCES[id].army] = EMINENCES[id];
  return acc;
}, {});

/** Id Eminenza nell'ordine delle Armate (galleria, deckbuilding UI). */
export const EMINENCE_IDS_BY_ARMY_ORDER = EMINENCE_ARMY_ORDER.map(
  (army) => EMINENCE_BY_ARMY[army].id,
);

export function getEminence(eminenceId) {
  return EMINENCES[eminenceId] || null;
}

export function getEminenceForArmy(army) {
  return EMINENCE_BY_ARMY[army] || null;
}

export function getEminenceAbility(eminenceId, abilityId) {
  const eminence = EMINENCES[eminenceId];
  if (!eminence) return null;
  return eminence.abilities.find((ability) => ability.id === abilityId) || null;
}
