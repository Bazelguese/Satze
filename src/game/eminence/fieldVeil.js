// ============================================
// EMINENZE — Velo sul Campo per un singolo lato
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §12.1
// ============================================
//
// «Il prossimo Agente ignora tutti gli effetti del Campo» ha una portata precisa: l'Agente
// non subisce ciò che il Campo fa **a lui**, ma continua a giocare la partita di tutti.
// Restano quindi in vigore le regole che decidono **chi vince** — condizione di vittoria
// alternativa e tie-break — perché un Duello ha un solo vincitore e un Agente non può
// ignorare per conto proprio la regola che lo determina.
//
// Implementazione: invece di condizionare le cinquanta diramazioni per id del setup Campo —
// invasivo e facile da sbagliare a ogni Campo nuovo — si lascia che il Campo agisca su tutti
// e si ripristinano subito dopo le sole grandezze del lato velato. Il criterio diventa così
// «di chi è questo numero», che è verificabile guardando il nome della variabile, invece di
// «questo id fa una cosa per-Agente», che andrebbe rideciso Campo per Campo.

import { SIDES } from './eminenceConstants.js';

/**
 * Grandezze del Duello che appartengono a un lato solo.
 *
 * Il Campo le scrive in fase di setup e negli effetti tardivi; ripristinarle equivale a non
 * aver mai applicato al lato velato la parte per-Agente del Campo.
 */
const SIDE_KEYS = {
  [SIDES.PLAYER]: [
    'pPower',
    'pDamage',
    'pAssaultMod',
    'pFocusUsed',
    'pImmune',
    'pAbilityBlocked',
    'pBonusBlocked',
  ],
  [SIDES.ENEMY]: [
    'ePower',
    'eDamage',
    'eAssaultMod',
    'eFocusUsed',
    'eImmune',
    'eAbilityBlocked',
    'eBonusBlocked',
  ],
};

/** Modificatori di Campo neutri: nessun trigger reso sempre attivo, nessuno scambio. */
const NEUTRAL_FIELD_MODIFIERS = { triggersIgnored: false, overdriveThreshold: 5 };

/** Lati che questo round ignorano gli effetti del Campo. */
export function readVeiledSides(bundle) {
  return bundle?.ignoreFieldSides?.length ? [...bundle.ignoreFieldSides] : [];
}

export function isSideVeiled(veiledSides, side) {
  return Boolean(veiledSides?.includes(side));
}

/**
 * Fotografa le grandezze dei lati velati prima che il Campo le tocchi.
 * @returns {object|null} `null` quando non c'è nulla da velare, così il chiamante può saltare
 *   il ripristino senza rami aggiuntivi.
 */
export function captureVeil(duel, veiledSides) {
  if (!veiledSides?.length) return null;

  const snapshot = {};
  for (const side of veiledSides) {
    for (const key of SIDE_KEYS[side] || []) snapshot[key] = duel[key];
  }
  return snapshot;
}

/** Riporta le grandezze velate al valore che avevano prima dell'intervento del Campo. */
export function restoreVeil(duel, snapshot) {
  if (!snapshot) return duel;
  Object.assign(duel, snapshot);
  return duel;
}

/**
 * Sostituisce i modificatori di Campo nel contesto di un lato velato.
 *
 * Il motore dei trigger legge `context.fieldModifiers` per sapere se il Campo rende un
 * trigger sempre attivo, ne scambia due o alza la soglia di Overdrive. Sono tutti effetti
 * che agiscono sull'Agente, quindi per il lato velato il contesto deve risultare come su un
 * Campo neutro. Va chiamata **dopo** il setup, che è ciò che li installa.
 */
export function veilContextModifiers(veiledSides, playerContext, enemyContext) {
  if (isSideVeiled(veiledSides, SIDES.PLAYER)) {
    playerContext.fieldModifiers = { ...NEUTRAL_FIELD_MODIFIERS };
  }
  if (isSideVeiled(veiledSides, SIDES.ENEMY)) {
    enemyContext.fieldModifiers = { ...NEUTRAL_FIELD_MODIFIERS };
  }
}

/**
 * Regole di conteggio FC nel VA, per lato.
 *
 * Dimezzamento e tetto sono modi in cui il Campo legge l'Agente, non regole che stabiliscono
 * chi vince: il lato velato conta i propri FC per intero.
 */
export function buildFocusForVa(fieldFlags, veiledSides) {
  return (focus, side) => {
    if (isSideVeiled(veiledSides, side)) return focus;

    let counted = fieldFlags.focusHalvedInVa ? Math.ceil(focus / 2) : focus;
    if (fieldFlags.maxFocusCountedInVa != null) {
      counted = Math.min(counted, fieldFlags.maxFocusCountedInVa);
    }
    return counted;
  };
}
