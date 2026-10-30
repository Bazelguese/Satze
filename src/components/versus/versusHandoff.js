// ============================================================
// versusHandoff.js — dalla scelta esercito al VS senza stacchi
// ============================================================
// Premendo INIZIA si segna dov'era la scatola 3D dell'esercito scelto;
// il VS, se trova il passaggio appena armato, la fa volare da lì al suo
// posto invece di farla entrare da fuori schermo.
// ============================================================

const MAX_AGE_MS = 3000;

let pending = null;

/** rect: getBoundingClientRect() della scatola nella scelta esercito. */
export function armVersusHandoff(rect) {
  pending = rect ? { rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, at: Date.now() } : null;
}

/** Legge il passaggio senza consumarlo (sicuro con i doppi render di StrictMode). */
export function peekVersusHandoff() {
  return pending && Date.now() - pending.at <= MAX_AGE_MS ? pending : null;
}

export function clearVersusHandoff() {
  pending = null;
}
