/**
 * Stile della copertina dell'esercito (scelta mazzo + schermata VS).
 * Default = scatola 3D (modello scelto); le altre proposte restano selezionabili dal VS LAB.
 */

const STORAGE_KEY = 'satze_deck_cover_style';

export const DECK_COVER_STYLES = [
  { key: 'ticket', label: 'Ticket', meta: 'Ticket con info boss (vecchia copertina)' },
  { key: 'fullart', label: 'Full-art', meta: 'Leader a tutta altezza' },
  { key: 'box', label: 'Scatola 3D', meta: 'Custodia con dorso' },
  { key: 'tarot', label: 'Tarocco', meta: 'Come le Eminenze' },
];

const VALID = new Set(DECK_COVER_STYLES.map((s) => s.key));

export const DEFAULT_DECK_COVER_STYLE = 'box';

export function getDeckCoverStyle() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return VALID.has(v) ? v : DEFAULT_DECK_COVER_STYLE;
  } catch {
    return DEFAULT_DECK_COVER_STYLE;
  }
}

export function setDeckCoverStyle(style) {
  if (!VALID.has(style)) return;
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    /* storage non disponibile: resta la scelta in memoria del chiamante */
  }
}
