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
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'ora_verde',
      name: 'Cataclisma Verde',
      text: 'All\'inizio del round 5, lo slot aperto subisce Terraformare: Arena del Violento Gaudio. Quando il tuo Bonus d\'Armata si attiva, +1 Presenza.',
      implemented: true,
      segments: [
        {
          timing: EFFECT_TIMINGS.ROUND_START,
          primitive: P.REPLACE_FIELD,
          target: T.GLOBAL,
          fieldId: 122,
          condition: { roundNumber: 5 },
        },
        {
          timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          condition: { ownBonusActivated: true },
        },
      ],
    },

    abilities: [
      {
        id: 'apex_cielo_smeraldino',
        name: 'Cielo Smeraldino',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello il tuo Agente schierato ha −1 DAN.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MODIFY_STAT,
            target: T.OWN_AGENT,
            stat: 'damage',
            delta: -1,
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
        id: 'apex_preghiera_ululata',
        name: 'Preghiera Ululata',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Per il resto dello Scontro, il tuo Bonus d\'Armata diventa «Invasione: Attrizione 3 VA».',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.REPLACE_ABILITY,
            target: T.OWN_AGENT,
            slot: 'bonus',
            persistent: true,
            ability: { trigger: 'invasione', effect: 'attrition', value: 3, stat: 'assaultValue' },
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
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se in questo Duello un Agente attiva un Potere o un Bonus con trigger Turbo o Intervento, +1 Presenza (una sola volta per Duello).',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 1,
            condition: { activatedTriggers: { any: ['turbo', 'intervention'] } },
          },
        ],
      },
      {
        id: 'semaforo_giallo',
        name: 'Giallo',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Imboscata e Turbo sono considerati soddisfatti in questo round, per entrambi i giocatori.',
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
        text: 'Imboscata e Turbo non possono attivarsi. Intervento e Ultima Chance sono considerati soddisfatti in questo round, per entrambi i giocatori.',
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
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'kethran_ricomposizione',
      name: 'Ricomposizione',
      text: 'Quando il tuo Agente perde un Duello, diventa un Frammento per il resto dello Scontro. Quando ottieni un Frammento, +1 Presenza. I Frammenti non vengono consumati.',
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
        text: 'Perdi 2 PV.',
        segments: [
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
          fragmentCardId: { source: PARAM_SOURCES.OWN_FRAGMENTS },
          graftInto: ['power', 'bonus'],
        },
        text: 'Selezionabile solo se hai almeno 1 Frammento. Scegli un tuo Frammento: in questo Duello il suo Potere, con il suo trigger e il suo effetto, sostituisce a tua scelta il Potere oppure il Bonus del tuo Agente schierato. Se sostituisce il Bonus, è trattato come Bonus.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.TRANSPLANT_POWER,
            target: T.OWN_AGENT,
            sourceParam: 'fragmentCardId',
            slotParam: 'graftInto',
          },
        ],
      },
      {
        id: 'kethran_opera_composita',
        name: 'Opera Composita',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          fragmentCardId: { source: PARAM_SOURCES.OWN_FRAGMENTS, min: 2, max: 2 },
        },
        text: 'Selezionabile solo se hai almeno 2 Frammenti. Scegli due tuoi Frammenti: in questo Duello il Potere del tuo Agente schierato è sostituito da un Potere composto dal trigger di uno e dall\'effetto dell\'altro.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.COMPOSE_ABILITY,
            target: T.OWN_AGENT,
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
      text: 'All\'inizio dello Scontro scegli un Agente nemico: diventa Preda. Quando l\'avversario schiera una Preda, +1 Presenza e il Bonus del tuo Agente schierato è considerato attivo. Una Preda smette di esserlo dopo aver combattuto.',
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
          primitive: P.CHANGE_PRESENCE,
          target: T.SELF,
          delta: 1,
          condition: { enemyMarks: { has: 'prey' } },
        },
        {
          timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
          primitive: P.SET_ARMY_BONUS_STATE,
          target: T.SELF,
          forcedActive: true,
          condition: { enemyMarks: { has: 'prey' } },
        },
        {
          timing: EFFECT_TIMINGS.POST_BATTLE,
          primitive: P.MARK_CARD,
          mark: 'prey',
          consume: true,
          persistent: true,
          target: T.ENEMY_AGENT,
        },
      ],
    },

    abilities: [
      {
        id: 'mounthborn_fame_ricarica',
        name: 'Fame',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Alla fine del Duello, se non hai sconfitto una Preda, perdi 2 PV.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.LOSE_HP,
            target: T.SELF,
            amount: 2,
            cause: HP_LOSS_CAUSES.EMINENCE_COST,
            condition: { duelWinnerRelative: { not: 'self' } },
          },
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.LOSE_HP,
            target: T.SELF,
            amount: 2,
            cause: HP_LOSS_CAUSES.EMINENCE_COST,
            condition: { duelWinnerRelative: 'self', enemyMarks: { not: { has: 'prey' } } },
          },
        ],
      },
      {
        id: 'mounthborn_gorgoglio',
        name: 'Gorgoglio terrificante',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          preyCardId: { source: PARAM_SOURCES.ENEMY_UNDEPLOYED },
        },
        text: 'Scegli un Agente nemico non schierato: diventa Preda.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MARK_CARD,
            mark: 'prey',
            persistent: true,
          },
        ],
      },
      {
        id: 'mounthborn_frenesia',
        name: 'Frenesia della Fame',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello, il Potere del tuo Agente diventa «Imboscata: +1 POT, +1 DAN». Se l\'Agente nemico è una Preda, recuperi la Presenza spesa per questa abilità.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.REPLACE_ABILITY,
            target: T.OWN_AGENT,
            slot: 'power',
            ability: { trigger: 'imboscata', effect: 'powerAndDamage', value: 1 },
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 2,
            condition: { enemyMarks: { has: 'prey' } },
          },
        ],
      },
      {
        id: 'mounthborn_caccia',
        name: 'Caccia',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          preyCardId: { source: PARAM_SOURCES.ENEMY_UNDEPLOYED },
        },
        text: 'Scegli un Agente nemico non schierato: diventa Preda e l\'avversario deve schierarlo in questo Duello.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MARK_CARD,
            mark: 'prey',
            persistent: true,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.CONSTRAIN_DEPLOY,
            target: T.OPPONENT,
            mode: 'FORCE',
            cardParam: 'preyCardId',
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  // Khemet — Il Castello degli Arcanisti Nefasti
  // ------------------------------------------------------------------
  khemet_maledizioni: {
    id: 'khemet_maledizioni',
    army: 'Khemet',
    name: 'Il Castello degli Arcanisti Nefasti',
    initialPresence: 1,
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
        presenceDelta: 0,
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
        presenceDelta: -1,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          slot: { source: PARAM_SOURCES.BATTLEFIELD_SLOTS },
        },
        text: 'Scegli uno slot: gli Agenti che combatteranno lì subiscono −VA pari alla propria Lega.',
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
        presenceDelta: -2,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          slot: { source: PARAM_SOURCES.BATTLEFIELD_SLOTS },
        },
        text: 'Scegli uno slot: gli Agenti che combatteranno lì subiscono −1 POT, −1 DAN, −1 VA.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.APPLY_SLOT_MODIFIER,
            persistent: true,
            deltas: { power: -1, damage: -1, assaultValue: -1 },
          },
        ],
      },
      {
        id: 'khemet_maledizione_inversa',
        name: 'Maledizione Inversa',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          slot: { source: PARAM_SOURCES.BATTLEFIELD_SLOTS },
        },
        text: 'Scegli uno slot: nel Duello combattuto lì, tutti i modificatori di POT, DAN e VA si invertono, per entrambi gli Agenti. I + diventano −, i − diventano +, e i minimi non si applicano.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.APPLY_SLOT_MODIFIER,
            persistent: true,
            invertModifiers: true,
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
        id: 'orathai_prezzo_del_canto',
        name: 'Il Prezzo del Canto',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello, per ogni Potere che si attiva, tuo o nemico, perdi 1 PV.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.LOSE_HP,
            target: T.SELF,
            amount: 1,
            cause: HP_LOSS_CAUSES.EMINENCE_COST,
            condition: { ownPowerResolved: true },
          },
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.LOSE_HP,
            target: T.SELF,
            amount: 1,
            cause: HP_LOSS_CAUSES.EMINENCE_COST,
            condition: { enemyPowerResolved: true },
          },
        ],
      },
      {
        id: 'orathai_contrappunto',
        name: 'Contrappunto',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il trigger Potere del tuo Agente non è soddisfatto, non lo è nemmeno quello dell\'Agente nemico.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.MIRROR_UNSATISFIED_POWER,
            scope: TRIGGER_SCOPES.ENEMY,
            excludeTriggers: ['conquest', 'lastWish'],
          },
        ],
      },
      {
        id: 'orathai_eco',
        name: 'Eco',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello, se il Potere dell\'Agente nemico si attiva, si attiva anche per il tuo Agente.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.ECHO_POWER,
            target: T.OWN_AGENT,
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
    initialPresence: 0,
    implemented: true,

    static: {
      id: 'corte_registro',
      name: 'Il Registro',
      text: 'Ogni abilità della Corte è un\'Offerta all\'avversario. L\'Offerta viene rivelata all\'inizio del round, subito dopo la scelta delle Eminenze e prima di ogni altra decisione, e l\'avversario la accetta o la rifiuta. Se ha rifiutato l\'Offerta del round precedente, deve accettare. Quando l\'avversario accetta un\'Offerta, +1 Presenza. I PV che l\'avversario deve pagare alla Fine dello Scontro sono scritti nel suo Registro, una voce per ogni Offerta, e si pagano prima di determinare il vincitore.',
      implemented: true,
      // Le regole dell'Offerta vivono nei segmenti PROPOSE_DEAL di ciascuna attiva.
      segments: [],
    },

    abilities: [
      {
        id: 'corte_prestito',
        name: 'Prestito',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Offerta: «Il tuo Agente riceve 2 FC temporanei in questo Duello; alla Fine dello Scontro perdi 2 PV.»',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.PROPOSE_DEAL,
            mode: 'OFFER',
            ownerPresenceOnAccept: 1,
            onAccept: [
              {
                primitive: P.REGISTER_END_MATCH_DEBT,
                target: T.SELF,
                amount: 2,
                basis: 'FIXED',
                dueAt: 'END_MATCH',
              },
            ],
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.GRANT_TEMPORARY_FOCUS,
            target: T.ENEMY_AGENT,
            amount: 2,
            condition: { dealAccepted: true },
          },
        ],
      },
      {
        id: 'corte_rinforzo',
        name: 'Rinforzo',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Offerta: «Il tuo Agente ottiene +2 DAN oppure +1 POT in questo Duello, a tua scelta; alla Fine dello Scontro perdi 1 PV.»',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.PROPOSE_DEAL,
            mode: 'OFFER',
            choices: ['damage', 'power'],
            choiceLabels: { damage: '+2 DAN', power: '+1 POT' },
            ownerPresenceOnAccept: 1,
            onAccept: [
              {
                primitive: P.REGISTER_END_MATCH_DEBT,
                target: T.SELF,
                amount: 1,
                basis: 'FIXED',
                dueAt: 'END_MATCH',
              },
            ],
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.MODIFY_STAT,
            target: T.ENEMY_AGENT,
            stat: 'damage',
            delta: 2,
            condition: { dealAccepted: true, dealChoice: 'damage' },
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.MODIFY_STAT,
            target: T.ENEMY_AGENT,
            stat: 'power',
            delta: 1,
            condition: { dealAccepted: true, dealChoice: 'power' },
          },
        ],
      },
      {
        id: 'corte_debito',
        name: 'Debito',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Offerta: «Il trigger Potere del tuo Agente diventa Debito 2 in questo Duello.»',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.PROPOSE_DEAL,
            mode: 'OFFER',
            ownerPresenceOnAccept: 1,
            onAccept: [],
          },
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.REPLACE_TRIGGER,
            target: T.ENEMY_AGENT,
            trigger: 'debt',
            debtAmount: 2,
            condition: { dealAccepted: true },
          },
        ],
      },
      {
        id: 'corte_interessi',
        name: 'Interessi',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Offerta: «Gli interessi maturano: ogni voce del tuo Registro aumenta di 2 PV.»',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.PROPOSE_DEAL,
            mode: 'OFFER',
            ownerPresenceOnAccept: 1,
            onAccept: [
              {
                primitive: P.ESCALATE_END_MATCH_DEBTS,
                target: T.SELF,
                delta: 2,
              },
            ],
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
    initialPresence: 1,
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
        id: 'figli_condensazione',
        name: 'Condensazione',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il tuo Agente schierato è Ancorato, riceve 1 FC temporaneo in questo Duello. Gli FC temporanei non contano per Ancorato.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.GRANT_TEMPORARY_FOCUS,
            target: T.OWN_AGENT,
            amount: 1,
            condition: { ownAnchored: true },
          },
        ],
      },
      {
        id: 'figli_domanda_si_diffonde',
        name: 'La Domanda si diffonde',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello, il Potere dell\'Agente nemico si attiva solo se è Ancorato. Per l\'Agente nemico vale il tuo requisito di Ancorato, aumenti di Deriva compresi.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.BLOCK_POWER,
            target: T.ENEMY_AGENT,
            condition: { enemyAnchoredByOwnRule: false },
          },
        ],
      },
      {
        id: 'figli_risposta',
        name: 'Risposta',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il tuo Agente schierato è Ancorato, è Immune e il suo trigger Potere è considerato soddisfatto.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.GRANT_IMMUNE,
            target: T.OWN_AGENT,
            condition: { ownAnchored: true },
          },
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
      text: 'Quando schieri un Agente con la Lega effettiva più bassa tra quelli che non hai ancora usato, +1 Presenza. In caso di parità, la condizione è soddisfatta.',
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
        id: 'ratti_corteggiamento',
        name: 'Corteggiamento',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'In questo Duello l\'avversario sceglie se essere il primo o il secondo a scegliere l\'Agente.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.PROPOSE_DEAL,
            mode: 'OFFER',
            kind: 'CHOICE',
            mustAccept: true,
            choices: ['first', 'second'],
            choiceLabels: { first: 'Primo', second: 'Secondo' },
            onChoice: {
              first: [{ primitive: P.SET_ROUND_INITIATIVE, target: T.SELF }],
              second: [{ primitive: P.SET_ROUND_INITIATIVE, target: T.OPPONENT }],
            },
          },
        ],
      },
      {
        id: 'ratti_seduzione',
        name: 'Seduzione',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        paramsSchema: {
          cardId: { source: PARAM_SOURCES.ENEMY_UNDEPLOYED },
        },
        text: 'Scegli un Agente dell\'avversario non ancora utilizzato: se non è l\'unico disponibile, non può usarlo in questo Duello.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.CONSTRAIN_DEPLOY,
            target: T.OPPONENT,
            mode: 'BAN',
            cardParam: 'cardId',
          },
        ],
      },
      {
        id: 'ratti_vendetta',
        name: 'Vendetta oltre la Morte',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_SELECTION,
        paramsSchema: {
          cardId: { source: PARAM_SOURCES.OWN_DEFEATED },
        },
        // La scelta resta sigillata fino allo schieramento, ma l'Agente torna subito
        // disponibile per chi l'ha scelta.
        deployGrant: { mode: 'REVIVE', cardParam: 'cardId' },
        text: 'Si rivela quando schieri l\'Agente. Scegli un tuo Agente che è stato sconfitto: in questo Duello puoi usarlo di nuovo.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.CONSTRAIN_DEPLOY,
            target: T.SELF,
            mode: 'REVIVE',
            cardParam: 'cardId',
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
        id: 'enclave_furto_reliquie',
        name: 'Furto di Reliquie',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se vinci il Duello, l\'avversario perde 2 Presenza e tu ne ottieni 1.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.OPPONENT,
            delta: -2,
            condition: { duelWinnerRelative: 'self' },
          },
          {
            timing: EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
            primitive: P.CHANGE_PRESENCE,
            target: T.SELF,
            delta: 1,
            condition: { duelWinnerRelative: 'self' },
          },
        ],
      },
      {
        id: 'enclave_ascensione',
        name: 'Ascensione',
        presenceDelta: -3,
        spendAllPresence: true,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Selezionabile solo con almeno 3 Presenza. Spendi tutta la tua Presenza: il tuo Agente ottiene +1 POT per ogni Presenza spesa.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.MODIFY_STAT,
            target: T.OWN_AGENT,
            stat: 'power',
            delta: 1,
            scaleBy: 'presenceSpent',
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
    initialPresence: 1,
    implemented: true,

    static: {
      id: 'calibri_tenere_la_linea',
      name: 'Tenere la Linea',
      text: 'Quando perdi un Duello, se il DAN nemico ti ha tolto 2 PV o meno, +1 Presenza.',
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
        id: 'calibri_fermo_macchine',
        name: 'Fermo Macchine',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il Potere del tuo Agente non si attiva in questo Duello.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.BLOCK_POWER,
            target: T.OWN_AGENT,
          },
        ],
      },
      {
        id: 'calibri_guerra_attrito',
        name: 'Guerra d\'Attrito',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Ottieni 1 FC. Se hai vinto meno Duelli dell\'avversario, ottieni invece 2 FC.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.GRANT_POOL_FOCUS,
            target: T.SELF,
            amount: 1,
            condition: { ownDuelsWonLead: { min: 0 } },
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.GRANT_POOL_FOCUS,
            target: T.SELF,
            amount: 2,
            condition: { ownDuelsWonLead: { max: -1 } },
          },
        ],
      },
      {
        id: 'calibri_logoramento',
        name: 'Logoramento',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il tuo Agente ottiene +3 VA per ogni Duello che hai perso in questo Scontro.',
        segments: [
          {
            timing: EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
            primitive: P.MODIFY_STAT,
            target: T.OWN_AGENT,
            stat: 'assaultValue',
            delta: 3,
            scaleBy: 'duelsLost',
          },
        ],
      },
      {
        id: 'calibri_terra_bruciata',
        name: 'Protocollo Terra Bruciata',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se perdi il Duello, il Campo corrente viene distrutto: nessun giocatore lo conquista e nessun effetto Conquista si attiva. Il DAN della vittoria viene inflitto normalmente. Un Campo distrutto non conta per nessuno ai fini della vittoria territoriale.',
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
