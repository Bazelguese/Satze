// Posizioni mano sul campo di battaglia (1920×1080) — unica fonte di verità per Hand e shuffle.

import { getDuelAgentCardCenter } from './duelClashLayout';

export const BATTLEFIELD_VIEWPORT = { width: 1920, height: 1080 };

/** Stesse dimensioni di HandCard (w-36 h-52). */
export const HAND_CARD_W = 144;
export const HAND_CARD_H = 208;

export const HAND_ZONE_SIZE = { width: 1071, height: 459 };

/** Posizioni carte IA — angolo alto-sinistra (left/top nel triangolo). */
export const IA_CARD_POSITIONS = [
  { left: 667, top: 30 },
  { left: 507, top: 60 },
  { left: 347, top: 90 },
  { left: 187, top: 120 },
  { left: 27, top: 150 },
];

/**
 * Id degli Agenti IA non schierati, da sinistra a destra come in tavolo.
 * L'indice 0 della mano è il più vicino al centro, quindi l'ordine array è l'inverso.
 */
export function enemyHandIdsLeftToRight(hand = [], usedCardIds = []) {
  const used = new Set(usedCardIds);
  return (hand || [])
    .map((card, index) => ({
      id: card?.id,
      left: IA_CARD_POSITIONS[index]?.left ?? index,
    }))
    .filter((entry) => entry.id != null && !used.has(entry.id))
    .sort((a, b) => a.left - b.left)
    .map((entry) => entry.id);
}

/** Posizioni carte giocatore — angolo basso-destra (right/bottom nel triangolo). */
export const PLAYER_CARD_POSITIONS = [
  { right: 667, bottom: 30 },
  { right: 507, bottom: 60 },
  { right: 347, bottom: 90 },
  { right: 187, bottom: 120 },
  { right: 27, bottom: 150 },
];

function enemyZoneOrigin() {
  return { x: 0, y: 0 };
}

function playerZoneOrigin() {
  return {
    x: BATTLEFIELD_VIEWPORT.width - HAND_ZONE_SIZE.width,
    y: BATTLEFIELD_VIEWPORT.height - HAND_ZONE_SIZE.height,
  };
}

/** Centro carta IA in coordinate viewport. */
export function getEnemyHandCardCenter(handIndex) {
  const p = IA_CARD_POSITIONS[handIndex];
  if (!p) return { x: 0, y: 0, rot: 0 };
  const { x: ox, y: oy } = enemyZoneOrigin();
  return {
    x: ox + p.left + HAND_CARD_W / 2,
    y: oy + p.top + HAND_CARD_H / 2,
    rot: 0,
  };
}

/** Centro carta giocatore in coordinate viewport. */
export function getPlayerHandCardCenter(handIndex) {
  const p = PLAYER_CARD_POSITIONS[handIndex];
  if (!p) return { x: 0, y: 0, rot: 0 };
  const { x: ox, y: oy } = playerZoneOrigin();
  const left = HAND_ZONE_SIZE.width - p.right - HAND_CARD_W;
  const top = HAND_ZONE_SIZE.height - p.bottom - HAND_CARD_H;
  return {
    x: ox + left + HAND_CARD_W / 2,
    y: oy + top + HAND_CARD_H / 2,
    rot: 0,
  };
}

/** Asse diagonale della mano (stessa inclinazione delle carte in triangolo). */
export function getHandAxis(side) {
  const h0 = side === 'enemy' ? getEnemyHandCardCenter(0) : getPlayerHandCardCenter(0);
  const h4 = side === 'enemy' ? getEnemyHandCardCenter(4) : getPlayerHandCardCenter(4);
  const angleRad = Math.atan2(h4.y - h0.y, h4.x - h0.x);
  return {
    angleDeg: (angleRad * 180) / Math.PI,
    ux: Math.cos(angleRad),
    uy: Math.sin(angleRad),
  };
}

/** Offset impilamento carte lungo l'asse del mazzo. */
export function deckStackOffsetAlongAxis(index, deckSize, axisRotDeg) {
  const rad = (axisRotDeg * Math.PI) / 180;
  const mid = (deckSize - 1) / 2;
  const d = index - mid;
  const along = 1.35;
  const perp = 0.4;
  return {
    x: Math.cos(rad) * d * along - Math.sin(rad) * d * perp * 0.25,
    y: Math.sin(rad) * d * along + Math.cos(rad) * d * perp * 0.25,
    rot: axisRotDeg + d * 0.35,
  };
}

/** Origine mazzo: inclinata sull'asse della mano; shift verticale speculare verso il centro campo. */
const DECK_ALONG_HAND_T = 0.58;
/** Giocatore ↑ (negativo), nemico ↓ (positivo) — simmetrico rispetto al centro verticale. */
const DECK_SHIFT_TOWARD_CENTER = 80;

function getDeckCenterAlongHandAxis(side) {
  const h0 = side === 'enemy' ? getEnemyHandCardCenter(0) : getPlayerHandCardCenter(0);
  const agent = getDuelAgentCardCenter(
    side,
    BATTLEFIELD_VIEWPORT.width,
    BATTLEFIELD_VIEWPORT.height,
    false
  );
  const axis = getHandAxis(side);
  const verticalShift = side === 'player' ? -DECK_SHIFT_TOWARD_CENTER : DECK_SHIFT_TOWARD_CENTER;
  return {
    x: agent.x + (h0.x - agent.x) * DECK_ALONG_HAND_T,
    y: agent.y + (h0.y - agent.y) * DECK_ALONG_HAND_T + verticalShift,
    rot: axis.angleDeg,
  };
}

/** Slot ventaglio — ventaglio più ampio per rendere lo shuffle leggibile sul campo. */
const FAN_SPREAD = 400;
const FAN_ARCH = 34;
const FAN_ROT_SPREAD = 16;

export function getEnemyFanSlot(index, count = 10) {
  const deck = getEnemyDeckCenter();
  const axis = getHandAxis('enemy');
  const t = count === 1 ? 0.5 : index / (count - 1);
  const along = (t - 0.5) * FAN_SPREAD;
  return {
    x: deck.x + axis.ux * along,
    y: deck.y + axis.uy * along - Math.sin(t * Math.PI) * FAN_ARCH,
    rot: deck.rot + (t - 0.5) * FAN_ROT_SPREAD,
  };
}

export function getPlayerFanSlot(index, count = 10) {
  const deck = getPlayerDeckCenter();
  const axis = getHandAxis('player');
  const t = count === 1 ? 0.5 : index / (count - 1);
  const along = (t - 0.5) * FAN_SPREAD;
  return {
    x: deck.x + axis.ux * along,
    y: deck.y + axis.uy * along + Math.sin(t * Math.PI) * FAN_ARCH,
    rot: deck.rot + (t - 0.5) * FAN_ROT_SPREAD,
  };
}

export function getEnemyAgentDeckCenter() {
  return getDeckCenterAlongHandAxis('enemy');
}

export function getPlayerAgentDeckCenter() {
  return getDeckCenterAlongHandAxis('player');
}

export function getEnemyDeckCenter() {
  return getEnemyAgentDeckCenter();
}

export function getPlayerDeckCenter() {
  return getPlayerAgentDeckCenter();
}

/** Quanto oltrepassare il bordo per uscire completamente dallo schermo. */
const DECK_EXIT_TRAVEL = 780;

/**
 * Punto di uscita del mazzetto residuo: continua oltre l'angolo estremo della mano.
 * @param {'player'|'enemy'} side
 */
export function getDeckExitTarget(side) {
  const deck = getDeckCenterAlongHandAxis(side);
  const h4 = side === 'enemy' ? getEnemyHandCardCenter(4) : getPlayerHandCardCenter(4);
  const dx = h4.x - deck.x;
  const dy = h4.y - deck.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tilt = side === 'player' ? 10 : -10;
  return {
    x: deck.x + ux * DECK_EXIT_TRAVEL,
    y: deck.y + uy * DECK_EXIT_TRAVEL,
    rot: deck.rot + tilt,
  };
}

/** Carte non distribuite — stesso asse, poi escono verso la mano. */
function getRemainCenterAlongHandAxis(side) {
  const deck = getDeckCenterAlongHandAxis(side);
  const axis = getHandAxis(side);
  const offset = 72;
  return {
    x: deck.x - axis.uy * offset,
    y: deck.y + axis.ux * offset,
    rot: deck.rot,
  };
}

export function getEnemyRemainCenter() {
  return getRemainCenterAlongHandAxis('enemy');
}

export function getPlayerRemainCenter() {
  return getRemainCenterAlongHandAxis('player');
}
