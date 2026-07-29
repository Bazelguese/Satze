/**
 * Layout Arena Contesa — 4 seat con carte reali.
 * Deriva da battlefieldHandLayout (stesso passo diagonale / stesse dimensioni carta).
 */
import {
  HAND_CARD_W,
  HAND_CARD_H,
  IA_CARD_POSITIONS,
  PLAYER_CARD_POSITIONS,
} from './battlefieldHandLayout';

export const ARENA_VIEWPORT = { width: 1920, height: 1080 };

/** Scala mani laterali / tavolo FFA (le due di produzione restano riferimento). */
export const ARENA_SEAT_SCALE = {
  'top-left': 0.72,
  'top-right': 0.72,
  'bottom-left': 0.72,
  'bottom-right': 0.8,
};

/** Zone più basse: liberano la fascia centrale (log/anteprima/pool). */
const ZONE = { width: 780, height: 330 };

/** Specchio orizzontale delle posizioni IA → angolo alto-destra. */
export const ARENA_TOP_RIGHT_POSITIONS = IA_CARD_POSITIONS.map((p) => ({
  right: p.left,
  top: p.top,
}));

/** Specchio orizzontale delle posizioni player → angolo basso-sinistra. */
export const ARENA_BOTTOM_LEFT_POSITIONS = PLAYER_CARD_POSITIONS.map((p) => ({
  left: p.right,
  bottom: p.bottom,
}));

export const ARENA_SEAT_ZONES = {
  'top-left': {
    corner: 'top-left',
    zone: { top: 0, left: 0, width: ZONE.width, height: ZONE.height },
    positions: IA_CARD_POSITIONS.map((p) => ({
      left: Math.round(p.left * (ZONE.width / 1071)),
      top: Math.round(p.top * (ZONE.height / 459)),
    })),
    clipPath: 'polygon(0 0, 100% 0, 0 100%)',
    labelAnchor: { top: 10, left: 14 },
    reserveAnchor: { top: 188, left: 18 },
  },
  'top-right': {
    corner: 'top-right',
    zone: { top: 0, right: 0, width: ZONE.width, height: ZONE.height },
    positions: ARENA_TOP_RIGHT_POSITIONS.map((p) => ({
      right: Math.round(p.right * (ZONE.width / 1071)),
      top: Math.round(p.top * (ZONE.height / 459)),
    })),
    clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
    labelAnchor: { top: 10, right: 14 },
    reserveAnchor: { top: 188, right: 18 },
  },
  'bottom-left': {
    corner: 'bottom-left',
    zone: { bottom: 0, left: 0, width: ZONE.width, height: ZONE.height },
    positions: ARENA_BOTTOM_LEFT_POSITIONS.map((p) => ({
      left: Math.round(p.left * (ZONE.width / 1071)),
      bottom: Math.round(p.bottom * (ZONE.height / 459)),
    })),
    clipPath: 'polygon(0 0, 0 100%, 100% 100%)',
    labelAnchor: { bottom: 10, left: 14 },
    reserveAnchor: { bottom: 188, left: 18 },
  },
  'bottom-right': {
    corner: 'bottom-right',
    zone: { bottom: 0, right: 0, width: ZONE.width, height: ZONE.height },
    positions: PLAYER_CARD_POSITIONS.map((p) => ({
      right: Math.round(p.right * (ZONE.width / 1071)),
      bottom: Math.round(p.bottom * (ZONE.height / 459)),
    })),
    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
    labelAnchor: { bottom: 10, right: 14 },
    reserveAnchor: { bottom: 188, right: 18 },
  },
};

/** Seat A locale in basso-destra; ordine circolare A→B→C→D. */
export const ARENA_SEAT_CORNERS = {
  A: 'bottom-right',
  B: 'top-left',
  C: 'top-right',
  D: 'bottom-left',
};

export { HAND_CARD_W, HAND_CARD_H };
