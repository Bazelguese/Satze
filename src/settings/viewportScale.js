/**
 * Scala del canvas logico nella finestra.
 * Sempre contain (frame intero visibile). La scala UI (>100%) è densità
 * nei menù (`zoom` / `--satze-ui-scale`), non un cover sul viewport.
 *
 * @param {number} vw
 * @param {number} vh
 * @param {number} gameW
 * @param {number} gameH
 * @param {number} [_uiScale] ignorato — tenuto per firma stabile
 */
export function computeViewportScale(vw, vh, gameW, gameH, _uiScale) {
  return Math.min(vw / gameW, vh / gameH);
}
