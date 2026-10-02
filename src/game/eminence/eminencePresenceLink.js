// Avviso → Presenza (solo presentazione): quanto un avviso sposta il contatore Presenza
// della carta, e come si muove il numero a schermo quando arrivano le scintille.

/** Variazione di Presenza che l'avviso porta sul contatore, o 0. */
export function presenceNoticeDelta(notice) {
  if (!notice || notice.kind === 'setup' || notice.outcome === 'miss') return 0;
  const d = Number(notice.presenceDelta);
  return Number.isFinite(d) ? d : 0;
}

/**
 * Valore a schermo dopo l'arrivo di un avviso: si muove di `delta` verso il valore vero,
 * senza superarlo (se lo stato non contiene ancora la variazione, il numero resta).
 */
export function stepPresenceToward(shown, live, delta) {
  if (shown == null) return live;
  if (delta > 0) return live <= shown ? shown : Math.min(live, shown + delta);
  if (delta < 0) return live >= shown ? shown : Math.max(live, shown + delta);
  return shown;
}
