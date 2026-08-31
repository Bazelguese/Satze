// ============================================
// EMINENZE — Focus Coin investiti, temporanei ed effettivi
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §6
// ============================================
//
// Definizione canonica: un Focus Coin temporaneo viene assegnato a un Agente per il Duello
// corrente, si comporta come un normale FC posseduto dall'Agente, ma non viene speso dal pool
// del controllore e scompare a fine Duello.

/** Letture possibili di un valore FC. Ogni chiamante deve dichiarare quale sta facendo. */
export const FOCUS_READINGS = {
  VA: 'VA',
  OVERDRIVE: 'OVERDRIVE',
  OPPORTUNISTA: 'OPPORTUNISTA',
  ACCUMULO: 'ACCUMULO',
  ANCORATO: 'ANCORATO',
  LEGAL_SPEND_POOL: 'LEGAL_SPEND_POOL',
  FIELD_FC_CONTRIBUTION: 'FIELD_FC_CONTRIBUTION',
  SPEND_OR_INVEST_TEXT: 'SPEND_OR_INVEST_TEXT',
};

/**
 * Tabella canonica delle interazioni (§6). Tenerla come dato, e non sparsa nei call site,
 * è ciò che rende verificabile "gli FC temporanei contano qui ma non lì".
 */
export const FOCUS_READING_USES_TEMPORARY = {
  [FOCUS_READINGS.VA]: true,
  [FOCUS_READINGS.OVERDRIVE]: true,
  [FOCUS_READINGS.OPPORTUNISTA]: false,
  [FOCUS_READINGS.ACCUMULO]: false,
  [FOCUS_READINGS.ANCORATO]: false,
  [FOCUS_READINGS.LEGAL_SPEND_POOL]: false,
  [FOCUS_READINGS.FIELD_FC_CONTRIBUTION]: true,
  [FOCUS_READINGS.SPEND_OR_INVEST_TEXT]: false,
};

/**
 * @param {number} invested FC realmente investiti dal pool del controllore
 * @param {number} temporary FC concessi da un effetto per il solo Duello corrente
 */
export function createFocus(invested = 0, temporary = 0) {
  const safeInvested = Math.max(0, invested || 0);
  const safeTemporary = Math.max(0, temporary || 0);
  return {
    invested: safeInvested,
    temporary: safeTemporary,
    effective: safeInvested + safeTemporary,
  };
}

export function grantTemporaryFocus(focus, amount) {
  return createFocus(focus.invested, focus.temporary + Math.max(0, amount || 0));
}

/** Gli FC temporanei scompaiono a fine Duello; gli investiti restano il dato di verità. */
export function clearTemporaryFocus(focus) {
  return createFocus(focus.invested, 0);
}

/**
 * Valore da usare per una determinata lettura.
 * @param {object} focus
 * @param {string} reading una chiave di FOCUS_READINGS
 */
export function readFocus(focus, reading) {
  if (!focus) return 0;
  const usesTemporary = FOCUS_READING_USES_TEMPORARY[reading];
  if (usesTemporary === undefined) {
    throw new Error(`Lettura FC non dichiarata: ${reading}`);
  }
  return usesTemporary ? focus.effective : focus.invested;
}

/**
 * Campi FC da iniettare nel TriggerContext di un lato.
 *
 * Il campo storico `focusCoins` resta il valore **investito**, come documentato oggi in
 * `triggerLogic.js`: i chiamanti che non conoscono gli FC temporanei continuano a leggere
 * ciò che hanno sempre letto.
 */
export function buildFocusContextFields(ownFocus, enemyFocus) {
  const own = ownFocus || createFocus(0, 0);
  const enemy = enemyFocus || createFocus(0, 0);

  return {
    focusCoins: own.invested,
    enemyFocusCoins: enemy.invested,

    focusInvested: own.invested,
    enemyFocusInvested: enemy.invested,
    temporaryFocus: own.temporary,
    enemyTemporaryFocus: enemy.temporary,
    effectiveFocus: own.effective,
    enemyEffectiveFocus: enemy.effective,
  };
}
