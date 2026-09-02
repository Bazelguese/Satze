// ============================================
// EMINENZE — Condizioni dichiarative dei segmenti
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §3.7, §12
// ============================================
//
// Uno Statico è sempre attivo ma quasi mai incondizionato: l'Ora Verde scatta al round 5,
// il Rito solo quando è scattato Overdrive, Tenere la Linea solo su una sconfitta a basso DAN.
// Senza un modo dichiarativo di esprimere "quando", ognuna di queste diventerebbe un ramo
// col nome della propria Eminenza dentro il motore — esattamente ciò che il vincolo
// architetturale vieta.
//
// Il vocabolario è volutamente piccolo. Se una condizione non è esprimibile qui, manca un
// termine e va aggiunto in forma generica, non aggirato nel chiamante.

/**
 * Chiavi ammesse in `segment.condition`. Ogni chiave deve essere fornita dal checkpoint
 * che valuta il segmento (`createConditionContext` + extra del gate).
 * Un typo qui non viene catturato a runtime: il segmento semplicemente non scatta.
 */
export const CONDITION_KEYS = Object.freeze([
  'roundNumber',
  'duelWinnerRelative',
  'aliasUsed',
  'enemyAgentTrigger',
  'deployedMarks',
  'ownMarks',
  'enemyMarks',
  'ownActivatedTrigger',
  'ownPowerResolved',
  'hpLossCause',
  'ownAnchored',
  'winner',
]);

/**
 * Forme ammesse per il valore atteso di una chiave:
 *
 * - primitiva          → uguaglianza stretta            `{ roundNumber: 5 }`
 * - array              → appartenenza                   `{ winner: ['player', 'draw'] }`
 * - `{ min, max }`     → intervallo numerico inclusivo  `{ roundNumber: { min: 3 } }`
 * - `{ not }`          → negazione della forma interna  `{ winner: { not: 'draw' } }`
 * - `{ param, map }`   → valore scelto dal giocatore    `{ duelWinnerRelative: { param: 'pronostico', map: { … } } }`
 *
 * `{ param, map }` confronta il termine del checkpoint con il parametro fissato alla
 * selezione (o al reveal), opzionalmente tradotto. Un parametro assente non è un errore:
 * la condizione fallisce, come una scommessa senza pronostico.
 */
function matchesValue(expected, actual, context = {}) {
  if (Array.isArray(expected)) {
    return expected.includes(actual);
  }

  if (expected && typeof expected === 'object') {
    if ('param' in expected) {
      const raw = context?.params?.[expected.param];
      const mapped = expected.map ? expected.map[raw] : raw;
      return mapped === actual;
    }

    if ('not' in expected) return !matchesValue(expected.not, actual, context);

    if ('has' in expected) {
      return Array.isArray(actual) && actual.includes(expected.has);
    }

    if ('min' in expected || 'max' in expected) {
      if (typeof actual !== 'number' || Number.isNaN(actual)) return false;
      if ('min' in expected && actual < expected.min) return false;
      if ('max' in expected && actual > expected.max) return false;
      return true;
    }

    throw new Error(`Forma di condizione non riconosciuta: ${JSON.stringify(expected)}`);
  }

  return expected === actual;
}

/**
 * Verifica una condizione dichiarativa contro il contesto del checkpoint corrente.
 *
 * Una chiave assente dal contesto è un errore, non un fallimento silenzioso: significa che
 * il segmento è stato valutato a un checkpoint che non conosce ancora quel dato, e restituire
 * `false` renderebbe l'Eminenza inerte senza spiegare perché.
 *
 * @param {object|null} condition
 * @param {object} context termini noti al checkpoint corrente
 * @returns {boolean}
 */
export function matchesCondition(condition, context = {}) {
  if (!condition) return true;

  for (const [key, expected] of Object.entries(condition)) {
    if (!(key in context)) {
      throw new Error(`Condizione su un termine non disponibile a questo checkpoint: ${key}`);
    }
    if (!matchesValue(expected, context[key], context)) return false;
  }

  return true;
}

/** Termini sempre disponibili, qualunque sia il checkpoint. */
export function createConditionContext(matchState, extra = {}) {
  return {
    roundNumber: matchState?.roundNumber ?? null,
    ...extra,
  };
}
