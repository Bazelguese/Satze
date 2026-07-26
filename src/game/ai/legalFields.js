/**
 * Indici Campo legali (rivelati e non conquistati).
 * @param {object} context
 * @returns {number[]}
 */
export function getLegalFieldIndexes(context) {
  const battlefields = context.battlefields || [];
  const conquered = context.conqueredFields || {};
  const revealed =
    context.revealedFields == null ? battlefields.length : Number(context.revealedFields);

  const indexes = [];
  for (let i = 0; i < battlefields.length; i += 1) {
    if (i in conquered) continue;
    if (i >= revealed) continue;
    indexes.push(i);
  }
  return indexes;
}
