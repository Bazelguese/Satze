/** Layout condiviso fasi 3→4: pannelli duello in Codice/satze.jsx + DuelClashAuroraSequence. */

export const DUEL_CLASH_START_OFFSET_PX = 64;

export const DUEL_PANEL_LAYOUT = {
  width: 240,
  height: 400,
  padding: 20,
  cardWidth: 230,
  cardHeight: 330,
  zoomScale: 1.05,
};

/** Centro carta rispetto al viewport: carta in cima al pannello (padding + h carta), pannello centrato verticalmente. */
export function getDuelAgentCenterYOffset(isZoomed) {
  const { height, padding, cardHeight, zoomScale } = DUEL_PANEL_LAYOUT;
  const fromPanelCenter = padding - height / 2 + cardHeight / 2;
  return isZoomed ? fromPanelCenter * zoomScale : fromPanelCenter;
}

export function getDuelAgentCenterY(isZoomed) {
  const offset = getDuelAgentCenterYOffset(isZoomed);
  return offset === 0 ? '50%' : `calc(50% + ${offset}px)`;
}

/** Ancoraggio orizzontale fase 4 (allineato alla fase 3); offset clash in pX/eX. */
export function getPlayerClashAnchorX(isZoomed) {
  return `calc(50% + ${isZoomed ? 330 : 260}px)`;
}

export function getEnemyClashAnchorX(isZoomed) {
  return `calc(50% - ${isZoomed ? 330 : 260}px)`;
}

export const DUEL_AGENT_PANEL_OFFSET_X = {
  enemy: { normal: -380, zoomed: -450 },
  player: { normal: 140, zoomed: 210 },
};

/**
 * Centro carta agente nel viewport (stesso punto di GameCard in selectAgent).
 * @param {'enemy'|'player'} side
 * @param {number} [viewportWidth]
 * @param {number} [viewportHeight]
 * @param {boolean} [isZoomed]
 */
export function getDuelAgentCardCenter(
  side,
  viewportWidth = 1920,
  viewportHeight = 1080,
  isZoomed = false
) {
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;
  const tx = DUEL_AGENT_PANEL_OFFSET_X[side][isZoomed ? 'zoomed' : 'normal'];
  const x = cx + tx + DUEL_PANEL_LAYOUT.width / 2;
  const y = cy + getDuelAgentCenterYOffset(isZoomed);
  return { x, y, rot: 0 };
}

export function getDuelAgentBaseScale(isZoomed) {
  return isZoomed ? DUEL_PANEL_LAYOUT.zoomScale : 1;
}

export function getScaledClashStartOffset(isZoomed) {
  return DUEL_CLASH_START_OFFSET_PX * getDuelAgentBaseScale(isZoomed);
}
