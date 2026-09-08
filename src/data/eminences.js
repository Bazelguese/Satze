import { CONCORDIA_EMINENCE } from '../campaign/data/concordiaEminence.js';
// ============================================
// EMINENZE — Catalogo dati (rework 2026-09-06)
// Fonte normativa: Documentazione/SATZE_EMINENZE_REWORK_TESTI_CORRETTI_2026-09-06.md
// Override naming: "Ora Vere" → "Ora Verde"
// ============================================
//
// Questo file è dati, non logica. Ogni abilità descrive i propri effetti come sequenza di
// segmenti che referenziano le primitive di `src/game/eminence/eminenceConstants.js`.
// Il motore non deve mai contenere un ramo condizionale su una specifica Eminenza.

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
  // Apex — Il Sole Verde
  // ------------------------------------------------------------------
  apex_sole_verde: {
    id: 'apex_sole_verde',
    army: 'Apex',
    name: 'Il Sole Verde',
    initialPresence: 3,
    implemented: true,

    static: {
      id: 'ora_verde',
      name: 'Cataclisma Verde',
      text: 'All\'inizio del round 5, lo slot aperto viene sostituito dal Meridiano del Sole Verde.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.ROUND_START,
          primitive: P.REPLACE_FIELD,
          target: T.GLOBAL,
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
        text: 'Il tuo Agente schierato ottiene +1 POT. Perdi 2 PV.',
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
        text: 'Il tuo Agente schierato ignora gli effetti del Campo in questo Duello.',
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
        name: 'Ora Verde',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il tuo Agente schierato ottiene Potere: +2 POT, +2 DAN.',
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
  // Patto degli Indocili — Il Grande Semaforo
  // ------------------------------------------------------------------
  patto_grande_semaforo: {
    id: 'patto_grande_semaforo',
    army: 'Patto degli Indocili',
    name: 'Il Grande Semaforo',
    initialPresence: 0,
    implemented: true,

    static: {
      id: 'semaforo_multa_caos',
      name: 'Multa per eccesso di Caos',
      text: 'Se alla fine del Duello sono stati giocati almeno 8 FC, +2 Presenza.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 2,
          repeatable: true,
          condition: { totalFocusPlayed: { min: 8 } },
        },
      ],
    },

    abilities: [
      {
        id: 'semaforo_verde',
        name: 'Verde',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Tutti i trigger seguono le condizioni normali.',
        segments: [],
      },
      {
        id: 'semaforo_giallo',
        name: 'Giallo',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Imboscata e Turbo sono considerati soddisfatti in questo round.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORCE_TRIGGER,
            scope: TRIGGER_SCOPES.GLOBAL,
            triggers: ['imboscata', 'turbo'],
          },
        ],
      },
      {
        id: 'semaforo_rosso',
        name: 'Rosso',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Imboscata e Turbo non possono attivarsi. Intervento e Ultima Chance sono considerati soddisfatti in questo round.',
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
  // Mascarada — L'Organizzatore degli Incontri
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
      name: 'Organizzazione Impeccabile',
      text: 'Gli Agenti vengono scelti e resi noti prima della scelta del Campo.',
      implemented: true,
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
        text: 'Pronostica segretamente l\'esito del Duello: vittoria tua / vittoria avversaria / pareggio. Se il pronostico è corretto, +2 Presenza.',
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
        text: 'In questo Duello, Gloria può essere soddisfatta anche come Vendetta e viceversa; Conquista può essere soddisfatta anche come Ultimo Desiderio e viceversa.',
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
        text: 'In questo Duello, il trigger del tuo Agente schierato è considerato soddisfatto e il suo Potere non può essere bloccato.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORCE_TRIGGER,
            scope: TRIGGER_SCOPES.OWN,
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
  // Kethran — L'Altare della Ricomposizione
  // ------------------------------------------------------------------
  kethran_altare: {
    id: 'kethran_altare',
    army: 'Kethran',
    name: 'L\'Altare della Ricomposizione',
    initialPresence: 2,
    implemented: true,

    static: {
      id: 'kethran_ricomposizione',
      name: 'Ricomposizione',
      text: 'Quando il tuo Agente perde un Duello, diventa un Frammento per il resto dello Scontro. Quando ottieni un Frammento, +1 Presenza.',
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
        {
          timing: EFFECT_TIMINGS.ON_MARK_GAIN,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          repeatable: true,
          condition: { markGained: 'fragment' },
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
        text: 'Perdi 2 PV e ottieni +1 Presenza. Il prossimo Sacrificio richiederà 1 PV in più e fornirà 1 Presenza in più.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.LOSE_HP,
            target: T.SELF,
            amount: 2,
            amountBase: 2,
            amountPerUse: 1,
            escalationKey: 'sacrificio',
            cause: HP_LOSS_CAUSES.EMINENCE_COST,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 1,
            deltaBase: 1,
            deltaPerUse: 1,
            escalationKey: 'sacrificio',
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.ESCALATE_ABILITY,
            escalationKey: 'sacrificio',
            delta: 1,
          },
        ],
      },
      {
        id: 'kethran_elogio',
        name: 'Elogio al trionfo',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il tuo Agente schierato vince il Duello, diventa un Frammento per il resto dello Scontro.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.MARK_CARD,
            target: T.OWN_AGENT,
            mark: 'fragment',
            persistent: true,
            condition: { duelWinnerRelative: 'self' },
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
        text: 'Scegli un Frammento. In questo Duello, il Potere del tuo Agente schierato può attivarsi con il proprio trigger oppure con quello del Frammento. Se viene utilizzato il trigger del Frammento, il Frammento viene consumato.',
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
    ],
  },

  // ------------------------------------------------------------------
  // Mounthborn — La Fame
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
      text: 'All\'inizio dello Scontro scegli un Agente nemico: diventa Preda. Quando viene schierata una Preda, il Bonus del tuo Agente schierato è attivo.',
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
          timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
          primitive: P.SET_ARMY_BONUS_STATE,
          target: T.SELF,
          forcedActive: true,
          condition: { deployedMarks: { has: 'prey' } },
        },
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
        name: 'Gorgoglio terrificante',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          preyCardId: { source: PARAM_SOURCES.ENEMY_UNDEPLOYED },
        },
        text: 'Scegli un Agente nemico non schierato: diventa Preda. Se una Preda viene schierata in questo round, +2 Presenza.',
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
        paramsSchema: {
          preyCardId: { source: PARAM_SOURCES.ENEMY_UNDEPLOYED },
        },
        text: 'Scegli un Agente nemico non schierato e non Preda: diventa Preda per il resto dello Scontro. Se una Preda è schierata in questo round, il Potere e il Bonus del tuo Agente schierato non possono essere bloccati.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MARK_CARD,
            mark: 'prey',
            persistent: true,
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.UNBLOCKABLE_POWER,
            scope: TRIGGER_SCOPES.OWN,
            excludeTriggers: ['conquest', 'lastWish'],
            condition: { deployedMarks: { has: 'prey' } },
          },
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
        text: 'Se perdi il Duello contro una Preda, Cura 3 PV.',
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
  // Khemet — Il Castello dei Sigillatori
  // ------------------------------------------------------------------
  khemet_maledizioni: {
    id: 'khemet_maledizioni',
    army: 'Khemet',
    name: 'Il Castello dei Sigillatori',
    initialPresence: 2,
    implemented: true,

    static: {
      id: 'khemet_rito_overdrive',
      name: 'Cattura-Energia',
      text: 'Quando il tuo Agente attiva Overdrive, +2 Presenza.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 2,
          condition: { ownActivatedTrigger: 'overdrive' },
        },
      ],
    },

    abilities: [
      {
        id: 'khemet_devozione',
        name: 'Devozione al cervello',
        presenceDelta: 2,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il tuo Agente schierato inverte il trigger del suo Potere con quello del suo Bonus.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.SWAP_POWER_BONUS_TRIGGERS,
            scope: TRIGGER_SCOPES.OWN,
          },
        ],
      },
      {
        id: 'khemet_maledizione_va',
        name: 'Maledizione della Fama',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          slot: { source: PARAM_SOURCES.BATTLEFIELD_SLOTS },
        },
        text: 'Scegli uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono −VA pari alla propria Lega.',
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
        name: 'Maledizione del Cosmo',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          slot: { source: PARAM_SOURCES.BATTLEFIELD_SLOTS },
        },
        text: 'Scegli uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono −1 POT, −1 DAN, −1 VA.',
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
  // Orathai — Il Primo Canto
  // ------------------------------------------------------------------
  orathai_primo_canto: {
    id: 'orathai_primo_canto',
    army: 'Orathai',
    name: 'Il Primo Canto',
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'orathai_risonanza',
      name: 'Risonanza',
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
        text: 'Se uno dei due Agenti non soddisfa il requisito di attivazione del suo trigger Potere, +2 Presenza.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 2,
            condition: {
              activationUnsatisfiedCount: { min: 1 },
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
        text: 'Il tuo Agente schierato è immune dagli effetti Blocca. Se il tuo Agente schierato non soddisfa i requisiti del suo trigger Potere, anche l\'Agente avversario non lo soddisferà.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.UNBLOCKABLE_POWER,
            scope: TRIGGER_SCOPES.OWN,
            excludeTriggers: ['conquest', 'lastWish'],
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.MIRROR_UNSATISFIED_POWER,
            scope: TRIGGER_SCOPES.ENEMY,
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
        text: 'Il trigger Potere di entrambi gli Agenti schierati diventa Magnanimo.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.REPLACE_TRIGGER,
            scope: TRIGGER_SCOPES.GLOBAL,
            trigger: 'magnanimous',
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // Corte Rossa — Sanguinaccio, il Registro
  // ------------------------------------------------------------------
  corte_rossa: {
    id: 'corte_rossa',
    army: 'Corte Rossa',
    name: 'Sanguinaccio, il Registro',
    initialPresence: 1,
    implemented: true,
    forbidConsecutiveAbility: true,

    static: {
      id: 'corte_pagare_debiti',
      name: 'Pagare i Debiti',
      text: 'Ogni volta che un giocatore perde uno o più PV per una causa diversa dal normale DAN della sconfitta, +1 Presenza. Si conta l\'evento di perdita, non il numero di PV persi. Non è possibile selezionare la stessa abilità due volte di fila.',
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
        text: 'All\'avversario viene proposto un Affare: «Perdi 2 PV; in questo Duello il tuo Agente riceve 1 FC temporaneo.» Se l\'avversario rifiuta, l\'effetto si risolve come se lo avessi accettato tu.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.PROPOSE_DEAL,
            mode: 'ACCEPT_OR_SELF',
            deal: {
              effects: [
                {
                  primitive: P.LOSE_HP,
                  target: T.SELF,
                  amount: 2,
                  cause: HP_LOSS_CAUSES.EMINENCE_COST,
                },
                {
                  primitive: P.GRANT_TEMPORARY_FOCUS,
                  target: T.OWN_AGENT,
                  amount: 1,
                },
              ],
            },
          },
        ],
      },
      {
        id: 'corte_debito',
        name: 'Debito',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          cardId: { source: PARAM_SOURCES.UNDEPLOYED_AGENTS },
        },
        text: 'Scegli un Agente non schierato. Per il resto dello Scontro, il suo trigger Potere diventa Debito: quando viene schierato, chi lo schiera perde 2 PV; poi il Potere si attiva.',
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
        id: 'corte_salasso',
        name: 'Salasso',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'All\'avversario vengono proposti due Affari e deve sceglierne uno: «Perdi 3 PV; +2 Presenza.» oppure «Perdi 3 Presenza; Cura 2 PV.» Se uno dei due Affari non può essere accettato, viene scelto automaticamente l\'altro.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.PROPOSE_DEAL,
            mode: 'CHOOSE_ONE',
            deals: [
              {
                id: 'hp_for_presence',
                effects: [
                  {
                    primitive: P.LOSE_HP,
                    target: T.SELF,
                    amount: 3,
                    cause: HP_LOSS_CAUSES.EMINENCE_COST,
                  },
                  {
                    primitive: P.CHANGE_PRESENCE,
                    target: T.SELF,
                    delta: 2,
                  },
                ],
              },
              {
                id: 'presence_for_heal',
                minPresence: 3,
                effects: [
                  {
                    primitive: P.CHANGE_PRESENCE,
                    target: T.SELF,
                    delta: -3,
                  },
                  {
                    primitive: P.HEAL_HP,
                    target: T.SELF,
                    amount: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'corte_brutto_affare',
        name: 'Brutto Affare',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          cardId: { source: PARAM_SOURCES.CONFIRMED_AGENTS },
        },
        text: 'Scegli uno dei due Agenti già confermati, tuo o avversario: riceve 2 FC temporanei in questo Duello. Alla fine del Duello registra la sua POT finale. Alla Fine Scontro, il giocatore di quell\'Agente perde PV pari a metà della POT finale registrata, arrotondata per eccesso.',
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
            basis: 'HALF_FINAL_POWER_CEIL',
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // Figli dell'Orizzonte — La Domanda Senza Fine
  // ------------------------------------------------------------------
  figli_domanda_senza_fine: {
    id: 'figli_domanda_senza_fine',
    army: 'Figli dell\'Orizzonte',
    name: 'La Domanda Senza Fine',
    initialPresence: 2,
    implemented: true,

    static: {
      id: 'figli_ancorato',
      name: 'Ancorato',
      text: 'Un Agente è Ancorato se ha investito almeno 6 − Lega effettiva + aumenti cumulativi del requisito. Ai fini di Ancorato contano gli FC reali investiti; gli FC temporanei non contano. Alla fine del Duello, se il tuo Agente era Ancorato, +1 Presenza.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          repeatable: true,
          condition: { ownAnchored: true },
        },
      ],
    },

    abilities: [
      {
        id: 'figli_deriva',
        name: 'Deriva',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Aumenta di 1 il requisito di Ancorato, cumulativamente per il resto dello Scontro, già da questo round.',
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
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il tuo Agente schierato è Ancorato, il suo trigger è considerato soddisfatto.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.FORCE_TRIGGER,
            scope: TRIGGER_SCOPES.OWN,
            condition: { ownAnchored: true },
          },
        ],
      },
      {
        id: 'figli_risposta',
        name: 'Risposta',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'All\'inizio dello Scontro, se il tuo Agente schierato è Ancorato, è anche Immune.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.GRANT_IMMUNE,
            target: T.OWN_AGENT,
            condition: { ownAnchored: true },
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // Ratti della Megera — Bella Malelabbra
  // ------------------------------------------------------------------
  ratti_bella_malelabbra: {
    id: 'ratti_bella_malelabbra',
    army: 'Ratti della Megera',
    name: 'Bella Malelabbra',
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'ratti_male_crescente',
      name: 'Male Crescente',
      text: 'Quando schieri un Agente con la Lega effettiva più bassa tra quelli che ti restano in mano, +1 Presenza. In caso di parità, la condizione è soddisfatta.',
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
        text: 'Blocca il Bonus d\'Armata del tuo Agente schierato in questo Duello; applica Tossina 1 (min 10) all\'avversario.',
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
        id: 'ratti_spezzacuore',
        name: 'Spezzacuore',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Ad inizio Duello, rimuovi Tossina dall\'avversario. Il Bonus del tuo Agente schierato diventa «X Danni diretti» dove X è pari al numero di Tossina rimossa ×2.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.REMOVE_TOXIN,
            target: T.OPPONENT,
            bonusOverrideFactor: 2,
            bonusOverrideEffect: 'directDamage',
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // Enclave delle Scaglie — L'Enclave dell'Ascensione
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
        text: 'Il Bonus d\'Armata del tuo Agente schierato è bloccato in questo Duello.',
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
        text: 'Scegli pubblicamente un tuo Agente non schierato e aumenta oppure diminuisci la sua Lega di 1 per questo round.',
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
        text: 'In questo Duello, Sfida e Sopraffare del tuo Agente sono soddisfatti anche quando le Leghe sono uguali. In caso di parità di VA, vince il tuo lato.',
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
  // Calibri Pesanti — Il Comando dei Quattro Fronti
  // ------------------------------------------------------------------
  calibri_quattro_fronti: {
    id: 'calibri_quattro_fronti',
    army: 'Calibri Pesanti',
    name: 'Il Comando dei Quattro Fronti',
    initialPresence: 2,
    implemented: true,

    static: {
      id: 'calibri_tenere_la_linea',
      name: 'Tenere la Linea',
      text: 'Alla fine del Duello, se il DAN finale dell\'Agente nemico è 2 o meno, +1 Presenza.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          repeatable: true,
          condition: {
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
        text: 'Ottieni 1 FC. Per ogni Duello che hai vinto in questo Scontro, questa abilità costa 1 Presenza aggiuntiva.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.GRANT_POOL_FOCUS,
            target: T.SELF,
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
        text: 'Dopo la risoluzione dei Bonus, registra il DAN del tuo Agente schierato come X. Il suo DAN diventa 0 in questo Duello e l\'avversario subisce Danni diretti pari a X/2, arrotondati per eccesso. Se vinci il Duello, +2 Presenza.',
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
        text: 'Se perdi il Duello, immediatamente dopo la determinazione del vincitore e prima della finestra Conquista, distruggi il Campo corrente. Nessun giocatore lo conquista e nessun effetto Conquista si attiva in questo Duello. Il normale DAN della vittoria e gli effetti non-Conquista proseguono normalmente.',
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
  return EMINENCES[eminenceId] || (eminenceId === CONCORDIA_EMINENCE.id ? CONCORDIA_EMINENCE : null);
}

export function getEminenceForArmy(army) {
  return EMINENCE_BY_ARMY[army] || (army === CONCORDIA_EMINENCE.army ? CONCORDIA_EMINENCE : null);
}

export function getEminenceAbility(eminenceId, abilityId) {
  const eminence = getEminence(eminenceId);
  if (!eminence) return null;
  return eminence.abilities.find((ability) => ability.id === abilityId) || null;
}
