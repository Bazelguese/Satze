// ============================================
// EMINENZE — Costanti e vocabolario delle primitive
// Fonte normativa: Documentazione/SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md
// ============================================

/**
 * Gate semantici di reveal (spec §3.2).
 * Non sono fasi cronologiche fisse: sono barriere poste prima di una decisione.
 */
export const REVEAL_GATES = {
  PRE_FIELD: 'PRE_FIELD',
  PRE_AGENT: 'PRE_AGENT',
  GENERAL: 'GENERAL',
};

export const ALL_REVEAL_GATES = [
  REVEAL_GATES.PRE_FIELD,
  REVEAL_GATES.PRE_AGENT,
  REVEAL_GATES.GENERAL,
];

/**
 * Ordini di attraversamento dei gate.
 * L'ordine reale dipende dall'ordine delle decisioni dello Scontro, non dal gate in sé:
 * lo Statico di Mascarada rende pubblici gli Agenti prima del Campo (spec §3.4).
 */
export const GATE_SEQUENCES = {
  FIELD_FIRST: [REVEAL_GATES.PRE_FIELD, REVEAL_GATES.PRE_AGENT, REVEAL_GATES.GENERAL],
  AGENTS_FIRST: [REVEAL_GATES.PRE_AGENT, REVEAL_GATES.PRE_FIELD, REVEAL_GATES.GENERAL],
};

/** Momento in cui i parametri/bersagli di un'abilità vengono fissati (spec §3.6). */
export const CHOICE_PARAMS_TIMING = {
  AT_SELECTION: 'AT_SELECTION',
  AT_REVEAL: 'AT_REVEAL',
};

/**
 * Checkpoint di risoluzione dei segmenti (spec §3.7).
 * `revealGate` ed `effectTiming` sono due cose diverse: Calibri -4 si rivela al GENERAL
 * ma opera a BEFORE_CONQUEST.
 */
export const EFFECT_TIMINGS = {
  AFTER_REVEAL: 'AFTER_REVEAL',
  BEFORE_FIELD_RESOLUTION: 'BEFORE_FIELD_RESOLUTION',
  BEFORE_TRIGGER_CHECK: 'BEFORE_TRIGGER_CHECK',
  BEFORE_POWER_RESOLUTION: 'BEFORE_POWER_RESOLUTION',
  AFTER_DUEL_OUTCOME: 'AFTER_DUEL_OUTCOME',
  BEFORE_CONQUEST: 'BEFORE_CONQUEST',
  POST_BATTLE: 'POST_BATTLE',
  END_ROUND: 'END_ROUND',
  END_MATCH: 'END_MATCH',
};

export const EFFECT_TIMING_ORDER = [
  EFFECT_TIMINGS.AFTER_REVEAL,
  EFFECT_TIMINGS.BEFORE_FIELD_RESOLUTION,
  EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK,
  EFFECT_TIMINGS.BEFORE_POWER_RESOLUTION,
  EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
  EFFECT_TIMINGS.BEFORE_CONQUEST,
  EFFECT_TIMINGS.POST_BATTLE,
  EFFECT_TIMINGS.END_ROUND,
  EFFECT_TIMINGS.END_MATCH,
];

/** Stato del formato rispetto al sottosistema Eminenza (spec §1.2). */
export const EMINENCE_FORMAT = {
  REQUIRED: 'required',
  DISABLED: 'disabled',
};

/** Numero minimo di carte di un'Armata perché la sua Eminenza sia eleggibile (spec §1.2). */
export const EMINENCE_ELIGIBILITY_THRESHOLD = 5;

/**
 * Vocabolario delle primitive del motore.
 *
 * Regola architetturale: il motore conosce soltanto queste primitive. Una singola Eminenza
 * non deve mai comparire come ramo condizionale nel motore; è una configurazione costruita
 * sopra questo vocabolario.
 */
export const EMINENCE_PRIMITIVES = {
  CHANGE_PRESENCE: 'CHANGE_PRESENCE',
  MODIFY_STAT: 'MODIFY_STAT',
  LOSE_HP: 'LOSE_HP',
  HEAL_HP: 'HEAL_HP',
  IGNORE_FIELD: 'IGNORE_FIELD',
  FORCE_TRIGGER: 'FORCE_TRIGGER',
  FORBID_TRIGGER: 'FORBID_TRIGGER',
  REPLACE_TRIGGER: 'REPLACE_TRIGGER',
  ALIAS_TRIGGER: 'ALIAS_TRIGGER',
  UNBLOCKABLE_POWER: 'UNBLOCKABLE_POWER',
  SUPPRESS_CONQUEST: 'SUPPRESS_CONQUEST',
  GRANT_TEMPORARY_FOCUS: 'GRANT_TEMPORARY_FOCUS',
  MODIFY_LEAGUE: 'MODIFY_LEAGUE',
  SET_ARMY_BONUS_STATE: 'SET_ARMY_BONUS_STATE',
  APPLY_SLOT_MODIFIER: 'APPLY_SLOT_MODIFIER',
  REPLACE_FIELD: 'REPLACE_FIELD',
  DESTROY_FIELD: 'DESTROY_FIELD',
  APPLY_TOXIN: 'APPLY_TOXIN',
  MARK_CARD: 'MARK_CARD',
  REGISTER_END_MATCH_DEBT: 'REGISTER_END_MATCH_DEBT',
  BLOCK_EMINENCE: 'BLOCK_EMINENCE',
};

/** Bersagli ammessi dalle primitive. */
export const PRIMITIVE_TARGETS = {
  SELF: 'SELF',
  OPPONENT: 'OPPONENT',
  OWN_AGENT: 'OWN_AGENT',
  ENEMY_AGENT: 'ENEMY_AGENT',
  BOTH: 'BOTH',
  GLOBAL: 'GLOBAL',
  CHOSEN: 'CHOSEN',
};

/** Ambito di applicazione delle primitive che agiscono sui trigger. */
export const TRIGGER_SCOPES = {
  OWN: 'OWN',
  ENEMY: 'ENEMY',
  GLOBAL: 'GLOBAL',
};

/** Cause di perdita PV distinguibili (spec §10.1). */
export const HP_LOSS_CAUSES = {
  DUEL_DEFEAT_DAMAGE: 'DUEL_DEFEAT_DAMAGE',
  DIRECT_DAMAGE: 'DIRECT_DAMAGE',
  SELF_DAMAGE: 'SELF_DAMAGE',
  TOXIN: 'TOXIN',
  EMINENCE_COST: 'EMINENCE_COST',
  DEBT: 'DEBT',
  END_MATCH_DEBT: 'END_MATCH_DEBT',
  OTHER: 'OTHER',
};

/** Lati del duello, usati come chiavi stabili nello stato. */
export const SIDES = {
  PLAYER: 'player',
  ENEMY: 'enemy',
};

export const OPPOSITE_SIDE = {
  [SIDES.PLAYER]: SIDES.ENEMY,
  [SIDES.ENEMY]: SIDES.PLAYER,
};
