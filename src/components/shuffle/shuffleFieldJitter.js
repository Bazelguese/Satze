/** Offset casuali attorno alla posizione mazzo iniziale (solo origine shuffle). */

const DECK_JITTER = { x: 52, y: 40 };

/** Scarto: giocatore ↑→, nemico ↓← (speculare rispetto al mazzo jitterato). */
const REMAIN_BIAS = {
  player: { x: 78, y: -56 },
  enemy: { x: -78, y: 56 },
};

function rndSigned(max) {
  return (Math.random() * 2 - 1) * max;
}

/** Nuovi offset per una singola animazione shuffle (solo origine mazzo). */
export function rollShuffleFieldJitter() {
  return {
    deck: { x: rndSigned(DECK_JITTER.x), y: rndSigned(DECK_JITTER.y) },
  };
}

function baseDeck(layout) {
  return layout?.deckPos ?? layout?.deck ?? { x: 0, y: 0 };
}

/** Origine mazzo per shuffle / impilamento iniziale. */
export function resolveDeckOrigin(layout) {
  const base = baseDeck(layout);
  const j = layout?.shuffleJitter?.deck;
  if (!j) return { ...base };
  return { x: base.x + j.x, y: base.y + j.y };
}

function remainBiasForSide(layout) {
  return REMAIN_BIAS[layout?.side === 'enemy' ? 'enemy' : 'player'];
}

/** Punto dove atterra il mazzetto scartato (sempre un po' su-destra / speculare). */
export function resolveRemainAnchor(layout) {
  const deck = resolveDeckOrigin(layout);
  const bias = remainBiasForSide(layout);
  return { x: deck.x + bias.x, y: deck.y + bias.y };
}

/** Pila scarto visibile per shuffle "Una Sì Una No". */
export function resolveAlternateDiscardAnchor(layout) {
  return resolveRemainAnchor(layout);
}

export function withShuffleJitter(layout, jitter = rollShuffleFieldJitter()) {
  return { ...layout, shuffleJitter: jitter };
}
