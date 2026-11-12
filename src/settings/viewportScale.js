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

/**
 * Stile del canvas logico 1920×1080 dentro uno slot già di misura `width * scale`.
 * `zoom` entra nel layout: il testo è rasterizzato alla taglia finale.
 * `transform: scale()` dipinge e poi ricampiona, e con una scala non intera
 * (quasi sempre, specie con la scala di Windows) le scritte escono sfocate.
 * `contain: paint` tiene i `position: fixed` dentro il canvas, come faceva il transform.
 */
export function viewportScaledCanvasStyle(width, height, scale) {
  return {
    width,
    height,
    zoom: scale,
    contain: 'paint',
    overflow: 'hidden',
  };
}
