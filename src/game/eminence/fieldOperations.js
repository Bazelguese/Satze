// ============================================
// EMINENZE — Operazioni sul tabellone dei Campi
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §12.1
// ============================================
//
// Il bundle si limita a dichiarare *che* il Campo va sostituito; quale carta entri sul
// tabellone dipende dal tabellone stesso, che il risolutore del Duello non conosce. Questo
// modulo è il solo punto in cui le due cose si incontrano, e resta puro: prende il tabellone,
// ne restituisce uno nuovo, e non sa nulla di React.
//
// La selezione avviene per `tema` o per id espliciti, mai per nome di Eminenza: il motore
// riceve un criterio, non un caso particolare.

import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';

/**
 * Slot ancora in gioco. Un Campo già conquistato appartiene al passato dello Scontro: farlo
 * cambiare carta riscriverebbe un round già giocato.
 */
function openSlotIndices(battlefields, conqueredFields) {
  const indices = [];
  for (let i = 0; i < battlefields.length; i += 1) {
    if (!(i in (conqueredFields || {}))) indices.push(i);
  }
  return indices;
}

/**
 * Carte candidate a entrare, secondo il criterio dichiarato dal segmento.
 *
 * `fieldId` fissa la carta ed è la forma da preferire quando il design intende un Campo
 * preciso; `fieldArmy` la lascia al caso dentro un tema. Le carte già presenti sul tabellone
 * sono escluse: due copie dello stesso Campo non sono uno stato previsto.
 */
function candidateFields(operation, battlefields, catalog) {
  const onBoard = new Set(battlefields.map((field) => field?.id));

  if (operation.fieldId != null) {
    const exact = catalog.find((field) => field.id === operation.fieldId);
    return exact && !onBoard.has(exact.id) ? [exact] : [];
  }

  if (operation.fieldArmy) {
    return catalog.filter((field) => field.tema === operation.fieldArmy && !onBoard.has(field.id));
  }

  return [];
}

function pickDistinct(pool, count, rng) {
  const remaining = [...pool];
  const picked = [];

  while (picked.length < count && remaining.length) {
    const index = Math.min(remaining.length - 1, Math.floor(rng() * remaining.length));
    picked.push(remaining.splice(index, 1)[0]);
  }

  return picked;
}

/**
 * Applica al tabellone le operazioni sul Campo accumulate nel bundle.
 *
 * Le operazioni arrivano già ordinate per iniziativa e vengono applicate in quell'ordine, così
 * due sostituzioni concorrenti hanno un esito definito invece che dipendente dall'iterazione.
 *
 * @param {object[]} operations `bundle.fieldOperations`
 * @param {object} options
 * @param {object[]} options.battlefields tabellone corrente
 * @param {Record<number, object>} [options.conqueredFields]
 * @param {object[]} [options.catalog] catalogo completo dei Campi
 * @param {() => number} [options.rng]
 * @returns {{ battlefields: object[], changes: object[], skipped: object[] }} `battlefields` è
 *   lo stesso riferimento in ingresso quando nulla è cambiato, per non forzare render inutili.
 */
export function applyFieldOperations(operations, {
  battlefields,
  conqueredFields = {},
  catalog = ALL_BATTLEFIELDS,
  rng = Math.random,
} = {}) {
  if (!operations?.length || !Array.isArray(battlefields) || !battlefields.length) {
    return { battlefields, changes: [], skipped: [] };
  }

  let next = battlefields;
  const changes = [];
  const skipped = [];

  for (const operation of operations) {
    if (operation.operation !== 'REPLACE') {
      // Fallire rumorosamente: un'operazione ignota che non facesse nulla renderebbe
      // l'Eminenza silenziosamente inerte.
      throw new Error(`Operazione sul Campo senza implementazione: ${operation.operation}`);
    }

    const slots = openSlotIndices(next, conqueredFields);
    if (!slots.length) {
      skipped.push({ ...operation, reason: 'NO_OPEN_SLOT' });
      continue;
    }

    const picks = pickDistinct(candidateFields(operation, next, catalog), slots.length, rng);
    if (!picks.length) {
      skipped.push({ ...operation, reason: 'NO_CANDIDATE_FIELD' });
      continue;
    }

    const updated = [...next];
    picks.forEach((field, i) => {
      const slot = slots[i];
      changes.push({
        slot,
        fromId: updated[slot]?.id ?? null,
        toId: field.id,
        source: operation.source ?? null,
      });
      updated[slot] = field;
    });
    next = updated;
  }

  return { battlefields: next, changes, skipped };
}
