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
      text: 'All\'inizio del round 5, il Campo viene sostituito da un Campo Apex.',
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
        text: 'Il prossimo Agente schierato questo round ottiene +1 POT; il controllore perde 2 PV.',
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
        text: 'Il prossimo Agente ignora tutti gli effetti del Campo per questo Duello.',
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
        text: 'Il prossimo Agente ottiene +2 POT e +2 DAN.',
        segments: [
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MODIFY_STAT,
            target: T.OWN_AGENT,
            stat: 'power',
            delta: 2,
          },
          {
            timing: EFFECT_TIMINGS.AFTER_REVEAL,
            primitive: P.MODIFY_STAT,
            target: T.OWN_AGENT,
            stat: 'damage',
            delta: 2,
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
        text: 'Verde: Imboscata e Turbo sono considerati soddisfatti per questo round; Intervento e Ultima Chance non possono attivarsi.',
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
        text: 'Giallo: tutti e quattro i trigger seguono le normali condizioni.',
        segments: [],
      },
      {
        id: 'semaforo_rosso',
        name: 'Rosso',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Rosso: Intervento e Ultima Chance sono considerati soddisfatti; Imboscata e Turbo non possono attivarsi.',
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
    implemented: false,
    reordersGateSequence: 'AGENTS_FIRST',

    static: {
      id: 'mascarada_ordine_incontri',
      name: 'Ordine degli Incontri',
      text: 'Gli Agenti vengono selezionati e resi noti prima della scelta del Campo.',
      implemented: false,
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
        text: 'Scommessa: pronostica segretamente l\'esito. Se il pronostico è corretto, +2 Presenza.',
        segments: null,
      },
      {
        id: 'mascarada_maschere',
        name: 'Maschere Invertite',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Gloria può essere soddisfatta anche come Vendetta e viceversa; Conquista anche come Ultimo Desiderio e viceversa.',
        segments: null,
      },
      {
        id: 'mascarada_incontro_truccato',
        name: 'Incontro Truccato',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Il trigger del proprio Agente è forzatamente soddisfatto e il suo Potere non può essere bloccato.',
        segments: null,
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
    implemented: false,

    static: {
      id: 'kethran_ricomposizione',
      name: 'Ricomposizione',
      text: 'Quando un proprio Agente perde un Duello, diventa un Frammento per il resto dello Scontro.',
      implemented: false,
      segments: null,
    },

    abilities: [
      {
        id: 'kethran_sacrificio',
        name: 'Sacrificio',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Sacrificio: se il proprio Agente perde il Duello di questo round, dopo il Duello +1 Presenza.',
        segments: null,
      },
      {
        id: 'kethran_innesto',
        name: 'Innesto',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Innesto: scegli un Frammento; il Potere può soddisfarsi tramite il proprio trigger o quello del Frammento.',
        segments: null,
      },
      {
        id: 'kethran_opera_composita',
        name: 'Opera Composita',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Opera Composita: scegli uno o due Frammenti per comporre trigger ed effetto.',
        segments: null,
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
    implemented: false,

    static: {
      id: 'mounthborn_istinto_predatorio',
      name: 'Istinto Predatorio',
      text: 'All\'inizio dello Scontro scegli un Agente nemico: diventa Preda. La scelta è di setup ed è pubblica dopo il lock.',
      implemented: false,
      setupChoice: true,
      segments: null,
    },

    abilities: [
      {
        id: 'mounthborn_gorgoglio',
        name: 'Gorgoglio dai Cento Occhi',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Gorgoglio dai Cento Occhi: scegli un Agente nemico non ancora schierato, che diventa Preda. Se una Preda viene schierata in quel round, +2 Presenza.',
        segments: null,
      },
      {
        id: 'mounthborn_frenesia',
        name: 'Frenesia della Fame',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Frenesia della Fame: se viene schierata una Preda, il proprio Bonus d\'Armata è considerato attivo e non può essere bloccato.',
        segments: null,
      },
      {
        id: 'mounthborn_cannibalismo',
        name: 'Cannibalismo',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Cannibalismo: se perdi il Duello contro una Preda, Cura 3 PV.',
        segments: null,
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.5 Khemet — nome da definire
  // Tutte e tre le attive sono PRE_FIELD per igiene informativa (spec §3.2).
  // ------------------------------------------------------------------
  khemet_maledizioni: {
    id: 'khemet_maledizioni',
    army: 'Khemet',
    name: 'Khemet — nome da definire',
    nameProvisional: true,
    initialPresence: 2,
    implemented: false,

    static: {
      id: 'khemet_rito_overdrive',
      name: 'Rito',
      text: 'Quando un proprio Agente attiva Overdrive, +1 Presenza.',
      implemented: false,
      segments: null,
    },

    abilities: [
      {
        id: 'khemet_devozione',
        name: 'Devozione',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il Potere del proprio Agente si attiva realmente e non viene bloccato nel Duello, +1 Presenza.',
        segments: null,
      },
      {
        id: 'khemet_maledizione_va',
        name: 'Maledizione dello Slot',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Scegli uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono −VA pari alla propria Lega.',
        segments: null,
      },
      {
        id: 'khemet_maledizione_stat',
        name: 'Maledizione Totale',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.PRE_FIELD,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Scegli uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono −1 POT, −1 DAN, −1 VA.',
        segments: null,
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
    implemented: false,

    static: {
      id: 'orathai_risonanza',
      name: 'Risonanza',
      text: 'Se entrambi gli Agenti soddisfano il requisito di attivazione del proprio Potere nello stesso Duello, +1 Presenza.',
      implemented: false,
      segments: null,
    },

    abilities: [
      {
        id: 'orathai_tacet',
        name: 'Tacet',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Tacet: se nessuno dei due Agenti soddisfa il requisito di attivazione, +2 Presenza.',
        segments: null,
      },
      {
        id: 'orathai_contrappunto',
        name: 'Contrappunto',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Contrappunto: se esattamente uno dei due dovrebbe attivare il Potere, entrambi vengono considerati soddisfatti.',
        segments: null,
      },
      {
        id: 'orathai_silenzio',
        name: 'Silenzio',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Silenzio: se esattamente uno dei due dovrebbe attivare il Potere, nessuno dei due viene considerato soddisfatto.',
        segments: null,
      },
    ],
  },

  // ------------------------------------------------------------------
  // §12.7 Corte Rossa — nome da definire (eccezione approvata: 4 attive)
  // ------------------------------------------------------------------
  corte_rossa: {
    id: 'corte_rossa',
    army: 'Corte Rossa',
    name: 'Corte Rossa — nome da definire',
    nameProvisional: true,
    initialPresence: 1,
    initialPresenceProvisional: true,
    implemented: false,

    static: {
      id: 'corte_rossa_emorragia',
      name: 'Statico della Corte',
      text: 'Ogni volta che un giocatore perde PV per una causa diversa dal normale DAN della sconfitta, +1 Presenza. Si conta l\'evento, non i PV.',
      implemented: false,
      segments: null,
    },

    abilities: [
      {
        id: 'corte_offerta',
        name: 'Offerta',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'L\'avversario perde 2 PV; in questo Duello il suo Agente riceve 1 FC temporaneo.',
        segments: null,
      },
      {
        id: 'corte_salasso',
        name: 'Salasso',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Perdi 3 PV; in questo Duello il tuo Agente riceve 1 FC temporaneo.',
        segments: null,
      },
      {
        id: 'corte_debito',
        name: 'Debito',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Debito: scegli un Agente non ancora schierato. Per il resto dello Scontro il trigger del suo Potere diventa Debito.',
        segments: null,
      },
      {
        id: 'corte_credito_finale',
        name: 'Credito Finale',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        nameProvisional: true,
        text: 'Scegli uno dei due Agenti confermati, proprio o avversario: riceve 3 FC temporanei. Alla Fine Scontro il suo controllore perde PV pari alla POT finale registrata.',
        segments: null,
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
    implemented: false,

    static: {
      id: 'figli_ancorato',
      name: 'Ancorato',
      text: 'Un Agente è Ancorato se ha investito almeno 6 − Lega effettiva + aumenti cumulativi del requisito.',
      implemented: false,
      segments: null,
    },

    abilities: [
      {
        id: 'figli_deriva',
        name: 'Deriva',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Aumenta di 1 il requisito di Ancorato, cumulativamente per il resto dello Scontro, già da questo round.',
        segments: null,
      },
      {
        id: 'figli_leggerezza',
        name: 'Leggerezza',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il proprio Agente non è Ancorato, +1 Presenza al controllo Ancorato.',
        segments: null,
      },
      {
        id: 'figli_risposta',
        name: 'Risposta',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se il proprio Agente è Ancorato, il suo trigger viene considerato soddisfatto.',
        segments: null,
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
    implemented: false,

    static: {
      id: 'ratti_male_crescente',
      name: 'Male Crescente',
      text: 'Quando schieri un Agente con la Lega effettiva più bassa tra quelli che ti restano in mano, +1 Presenza.',
      implemented: false,
      segments: null,
    },

    abilities: [
      {
        id: 'ratti_sussurro',
        name: 'Sussurro',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Se durante il Duello almeno un Agente subisce una riduzione a POT, DAN o VA, +1 Presenza.',
        segments: null,
      },
      {
        id: 'ratti_veleno',
        name: 'Veleno',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Blocca il proprio Bonus d\'Armata per questo Duello; applica Tossina 1 all\'avversario, minimo 10 PV.',
        segments: null,
      },
      {
        id: 'ratti_conquista_forzata',
        name: 'Conquista Forzata',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Conquista è considerata soddisfatta per il proprio Agente indipendentemente dall\'esito.',
        segments: null,
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
    implemented: false,

    static: {
      id: 'enclave_accumulo',
      name: 'Accumulo',
      text: 'Quando investi almeno 3 FC reali sul tuo Agente in un Duello, +1 Presenza. Gli FC temporanei non contano.',
      implemented: false,
      segments: null,
    },

    abilities: [
      {
        id: 'enclave_rinuncia',
        name: 'Rinuncia al Privilegio',
        presenceDelta: 1,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Rinuncia al Privilegio: il proprio Bonus d\'Armata è bloccato per questo Duello.',
        segments: null,
      },
      {
        id: 'enclave_ascesa',
        name: 'Ascesa / Declassamento',
        presenceDelta: -1,
        revealGate: REVEAL_GATES.PRE_AGENT,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Ascesa / Declassamento: scegli pubblicamente un proprio Agente non ancora schierato e modifica la sua Lega di ±1 per questo round.',
        segments: null,
      },
      {
        id: 'enclave_ascensione',
        name: 'Ascensione',
        presenceDelta: -3,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Ascensione: Sfida e Sopraffare del proprio Agente sono soddisfatti anche a Leghe uguali; in caso di parità di VA vince il proprio lato.',
        segments: null,
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
    implemented: false,

    static: {
      id: 'calibri_tenere_la_linea',
      name: 'Tenere la Linea',
      text: 'Quando perdi un Duello e l\'Agente nemico ha 2 DAN o meno alla fine del Duello, +1 Presenza.',
      implemented: false,
      segments: null,
    },

    abilities: [
      {
        id: 'calibri_guerra_attrito',
        name: 'Guerra d\'Attrito',
        presenceDelta: 0,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Guerra d\'Attrito: se perdi il Duello ma subisci 2 o meno danni della sconfitta, +1 Presenza.',
        segments: null,
      },
      {
        id: 'calibri_contenimento',
        name: 'Protocollo di Contenimento',
        presenceDelta: -2,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Protocollo di Contenimento: se perdi il Duello, i trigger Conquista dell\'avversario non possono attivarsi.',
        segments: null,
      },
      {
        id: 'calibri_terra_bruciata',
        name: 'Protocollo Terra Bruciata',
        presenceDelta: -4,
        revealGate: REVEAL_GATES.GENERAL,
        choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
        text: 'Protocollo Terra Bruciata: se perdi il Duello, distruggi il Campo corrente dopo la determinazione del vincitore e prima della finestra Conquista.',
        segments: null,
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
