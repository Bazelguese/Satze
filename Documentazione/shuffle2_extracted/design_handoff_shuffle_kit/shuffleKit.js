/* ============================================================================
 * Satze — Shuffle Kit (core engine)
 * ----------------------------------------------------------------------------
 * Framework-agnostic choreography engine for card shuffle + deal animations.
 * No dependencies, no DOM assumptions. The engine only computes WHERE each card
 * should be at each moment and calls back a `setCard(id, transform)` you supply;
 * the visual tween is produced by a CSS transition on your card element
 * (see CARD_TRANSITION). Works with React, Vue, plain DOM, canvas, etc.
 *
 * Included shuffles (keys): overhandCut · riffle · pile · wash · fan
 *
 * Quick start:
 *   import { ShuffleController, initialDeck, DEFAULT_GEOMETRY } from './shuffleKit.js';
 *   const ctl = new ShuffleController({ setCard, deckSize: 10, handCount: 5 });
 *   // seed your render with initialDeck(10, DEFAULT_GEOMETRY)
 *   ctl.play('overhandCut', { onDone: () => showReplay() });
 *   // later: ctl.cancel();
 * ========================================================================== */

/* ---------- Geometry (all px, in your stage's local coordinate space) ------- */
export const DEFAULT_GEOMETRY = {
  stageW: 680, stageH: 500,
  cardW: 116, cardH: 166,
  deck:   { x: 340, y: 208 },  // resting deck (stack) position
  remain: { x: 116, y: 208 },  // where undealt cards pile up after the deal
  handY: 402,                  // baseline y of the dealt hand fan
  fanSpread: 560, fanArch: 40, fanRot: 56,     // "fan out" arc (shuffle spread)
  handSpread: 460, handArch: 24, handRot: 44,  // dealt-hand arc
  dealScale: 1.0,              // scale applied to dealt cards
};

/* Required CSS transition on the card WRAPPER element (the one you position).
 * The engine sets discrete targets; this makes the moves animate. */
export const CARD_TRANSITION =
  'left .58s cubic-bezier(.4,0,.2,1), top .58s cubic-bezier(.4,0,.2,1), transform .58s cubic-bezier(.4,0,.2,1)';

/* ---------- Small utilities ------------------------------------------------- */
export function range(n) { return Array.from({ length: n }, (_, i) => i); }
export function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function rnd(min, max) { return min + Math.random() * (max - min); }

/* ---------- Layout math ----------------------------------------------------- */
export function fanSlot(i, n, g) {
  const t = n === 1 ? 0.5 : i / (n - 1);
  return { x: g.deck.x + (t - 0.5) * g.fanSpread, y: g.deck.y - Math.sin(t * Math.PI) * g.fanArch, rot: (t - 0.5) * g.fanRot };
}
export function handSlot(i, n, g) {
  const t = n === 1 ? 0.5 : i / (n - 1);
  return { x: g.deck.x + (t - 0.5) * g.handSpread, y: g.handY - Math.sin(t * Math.PI) * g.handArch, rot: (t - 0.5) * g.handRot };
}

/* Initial resting deck — feed these transforms into your first render. */
export function initialDeck(n, g = DEFAULT_GEOMETRY) {
  return range(n).map(i => ({
    id: i,
    x: g.deck.x + i * 0.5, y: g.deck.y + i * 1.3, rot: (i - (n - 1) / 2) * 0.7,
    scale: 1, z: n - i, flipped: false,
  }));
}

/* ---------- Shuffle metadata (labels for UI) -------------------------------- */
export const SHUFFLE_META = [
  { key: 'overhandCut', title: 'Sfilata & Taglio', sub: 'OVERHAND · CUT', desc: 'Pacchetti sfilati dall\u2019alto, rimescolati sul posto, poi il taglio.' },
  { key: 'riffle',      title: 'Riffle a Ponte',   sub: 'RIFFLE',   desc: 'Due metà si intrecciano e si squadrano a ponte.' },
  { key: 'pile',        title: 'Mucchietti',       sub: 'PILE',     desc: 'Distribuito a mucchi, poi ricomposto in mazzo.' },
  { key: 'wash',        title: 'Lavaggio',         sub: 'WASH',     desc: 'Carte sparse sul tavolo e rimescolate a mano.' },
  { key: 'vortex',      title: 'Vortice',          sub: 'VORTEX',   desc: 'Le carte orbitano in un anello e si riavvolgono.' },
  { key: 'crossCut',    title: 'Tagli Incrociati', sub: 'RUNNING CUT', desc: 'Si spezza in pacchetti che si scavalcano e si scambiano.' },
  { key: 'lattice',     title: 'Reticolo',         sub: 'LATTICE',  desc: 'A griglia: le celle si rimescolano due volte.' },
  { key: 'alternate',   title: 'Una Sì Una No',    sub: 'ALTERNATE', desc: 'Il mazzetto si mischia, poi distribuisce a carte alterne (self-deal).' },
  { key: 'fountain',    title: 'Fontana',          sub: 'FOUNTAIN', desc: 'Le carte si alzano a getto e ricadono al posto.' },
];

/* ---------- Choreographies -------------------------------------------------
 * Each is (ctx) => endTimeMs, where the deck is squared into ctx.order by the
 * returned time. ctx exposes: after, setCard, restack, order, N, g.
 * `order` is the fresh random deal order; a choreography performs its flavour
 * motion then calls ctx.restack(order, t) to converge. The controller runs the
 * shared deal after the returned time. ------------------------------------- */

function makePackets(N) {
  const sizes = [2, 3, 2, 1, 2];
  const out = []; let i = 0, s = 0;
  while (i < N) { const n = Math.min(sizes[s++ % sizes.length], N - i); out.push(range(N).slice(i, i + n)); i += n; }
  return out;
}

// 1. Sfilata → rimischiamento sul posto → taglio.
function overhandCut(ctx) {
  const { after, setCard, restack, order, N, g } = ctx;
  const SX = g.deck.x + 96, RX = g.deck.x - 96, MID = (SX + RX) / 2;
  const half = Math.ceil(N / 2);

  after(200, () => { for (let i = 0; i < N; i++) setCard(i, { x: SX, y: g.deck.y + i * 1.3, rot: 4, z: N - i }); });

  // Sfilata: irregular packets pulled off the top, laid on the receiving pile.
  const packets = makePackets(N);
  let landed = 0, t = 720;
  packets.forEach(pk => {
    const start = landed, tp = t;
    after(tp, () => pk.forEach((id, k) => setCard(id, { x: MID + 8, y: g.deck.y - 52 + k * 1.4, rot: -9, z: 90 + start + k })));
    after(tp + 250, () => pk.forEach((id, k) => setCard(id, { x: RX, y: g.deck.y + (start + k) * 1.3, rot: -3, z: 60 + start + k })));
    landed += pk.length; t += 440;
  });
  const tOver = t + 160;

  // Rimischiamento sul posto: quick in-place jitter, then re-square.
  const beats = 3;
  for (let b = 0; b < beats; b++) {
    after(tOver + b * 165, () => { for (let i = 0; i < N; i++) setCard(i, { x: RX + rnd(-22, 22), y: g.deck.y + rnd(-16, 16), rot: rnd(-12, 12), z: 40 + ((i * 7 + b * 3) % N) }); });
  }
  const tSettle = tOver + beats * 165 + 30;
  after(tSettle, () => { for (let i = 0; i < N; i++) setCard(i, { x: RX, y: g.deck.y + i * 1.3, rot: -2, z: N - i }); });
  const tCut = tSettle + 380;

  // Taglio: lift the top half aside, drop it beneath.
  const topHalf = range(N).slice(half);
  after(tCut, () => topHalf.forEach((id, k) => setCard(id, { x: RX + 176, y: g.deck.y - 8 + k * 1.3, rot: 2, z: 80 + k })));
  after(tCut + 620, () => topHalf.forEach((id, k) => setCard(id, { x: RX, y: g.deck.y + 8 + k * 1.3, rot: -1, z: k })));
  const tR = tCut + 1200;
  restack(order, tR);
  return tR + 650;
}

// 2. Riffle a ponte — split L/R, interleave to centre, square up.
function riffle(ctx) {
  const { after, setCard, restack, order, N, g } = ctx;
  const half = Math.ceil(N / 2);
  after(360, () => {
    for (let i = 0; i < N; i++) {
      const left = i < half;
      setCard(i, { x: g.deck.x + (left ? -104 : 104), y: g.deck.y - 4 + (left ? i : i - half) * 1.3, rot: left ? -4 : 4, z: 20 + i });
    }
  });
  // interleave: alternate one card from each half toward the centre
  const seq = [];
  for (let k = 0; k < N; k++) { if (k < half) seq.push(k); if (half + k < N) seq.push(half + k); }
  seq.forEach((id, j) => after(1140 + j * 78, () => setCard(id, { x: g.deck.x, y: g.deck.y - 2, rot: 0, z: 40 + j })));
  const tR = 1140 + N * 78 + 260;
  restack(order, tR);
  return tR + 650;
}

// 3. Mucchietti — deal round-robin into piles, then gather.
function pile(ctx) {
  const { after, setCard, restack, order, N, g } = ctx;
  const piles = 4;
  const px = range(piles).map(p => g.stageW * (p + 1) / (piles + 1));
  const layers = new Array(piles).fill(0);
  for (let i = 0; i < N; i++) {
    const p = i % piles, layer = layers[p]++;
    after(360 + i * 120, () => setCard(i, { x: px[p], y: g.deck.y - 8 + layer * 2.4, rot: rnd(-3, 3), z: 20 + i }));
  }
  const tR = 360 + N * 120 + 400;
  restack(order, tR);
  return tR + 700;
}

// 4. Lavaggio — scatter flat, re-scatter (mix), gather.
function wash(ctx) {
  const { after, setCard, restack, order, N, g } = ctx;
  const xMin = g.cardW * 0.9, xMax = g.stageW - g.cardW * 0.9;
  const yMin = g.cardH * 0.55, yMax = g.stageH - g.cardH * 0.7;
  for (let i = 0; i < N; i++) after(340 + i * 42, () => setCard(i, { x: rnd(xMin, xMax), y: rnd(yMin, yMax), rot: rnd(-70, 70), z: 20 + i }));
  for (let i = 0; i < N; i++) after(1180 + i * 34, () => setCard(i, { x: rnd(xMin, xMax), y: rnd(yMin, yMax), rot: rnd(-70, 70), z: 30 + i }));
  const tR = 1920;
  restack(order, tR);
  return tR + 650;
}

// 5. Vortice — rotating ring: each turn the cards swap positions (visible mix).
function vortex(ctx) {
  const { after, setCard, restack, order, N, g } = ctx;
  const CX = g.deck.x, CY = g.deck.y + 16, R = 152, RY = 108;
  const ringAt = (perm, base) => perm.forEach((cardId, slot) => {
    const a = base + slot / N * Math.PI * 2;
    setCard(cardId, { x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * RY, rot: a * 180 / Math.PI + 90, z: 20 + slot });
  });
  let perm = range(N);
  after(340, () => ringAt(perm, 0));
  let t = 1000, base = 0;
  for (let r = 0; r < 3; r++) { perm = shuffleArr(perm); base += Math.PI * 0.7; const p = perm.slice(), b = base; after(t, () => ringAt(p, b)); t += 540; }
  const tR = t + 120;
  restack(order, tR);
  return tR + 650;
}

// 6. Tagli Incrociati — running/triple cut: the deck splits into 3 packets that
//    hop over one another and swap places, as blocks.
function crossCut(ctx) {
  const { after, setCard, restack, order, g } = ctx;
  const CY = g.deck.y - 24;
  const packs = [[0, 1, 2], [3, 4, 5, 6], [7, 8, 9]];
  const slotX = [g.deck.x - 150, g.deck.x, g.deck.x + 150];
  const layAll = perm => perm.forEach((packIdx, slot) => packs[packIdx].forEach((id, k) => setCard(id, { x: slotX[slot], y: CY + k * 1.3, rot: 0, z: 20 + slot * 10 + k })));
  after(340, () => layAll([0, 1, 2]));
  let perm = [0, 1, 2], t = 1040;
  const swaps = [[0, 2], [1, 2], [0, 1], [0, 2]];
  swaps.forEach(([a, b]) => {
    const pa = perm[a], pb = perm[b];
    const np = perm.slice(); np[a] = pb; np[b] = pa; perm = np;
    const cap = np.slice();
    after(t, () => {
      packs[pb].forEach((id, k) => setCard(id, { x: slotX[a], y: CY - 26 + k * 1.3, rot: -9, z: 70 + k }));  // hops over
      packs[pa].forEach((id, k) => setCard(id, { x: slotX[b], y: CY + 22 + k * 1.3, rot: 9, z: 40 + k }));   // passes under
    });
    after(t + 320, () => layAll(cap));
    t += 600;
  });
  const tR = t + 100;
  restack(order, tR);
  return tR + 650;
}

// 7. Reticolo — grid; the cells reshuffle twice, then re-square.
function lattice(ctx) {
  const { after, setCard, restack, order, N, g } = ctx;
  const cols = 5, gx = g.stageW / (cols + 1), gy0 = g.deck.y - 44;
  const cell = idx => ({ x: gx * ((idx % cols) + 1), y: gy0 + Math.floor(idx / cols) * 98 });
  const layout = (perm, jr) => perm.forEach((cardId, slot) => { const p = cell(slot); setCard(cardId, { x: p.x, y: p.y, rot: jr ? rnd(-5, 5) : 0, z: 20 + slot }); });
  after(340, () => layout(range(N), false));
  after(1120, () => layout(shuffleArr(range(N)), true));
  after(1700, () => layout(shuffleArr(range(N)), true));
  const tR = 2320;
  restack(order, tR);
  return tR + 650;
}

// 8. Una Sì Una No — the little deck shuffles (mini riffle), then deals every
//    other card: even positions to the hand (face up), odd ones to a discard pile.
//    Self-dealing: sets `alternate.selfDeal = true` so the controller skips the
//    shared deal. ctx.H is the hand size.
function alternate(ctx) {
  const { after, setCard, restack, order, g, H } = ctx;
  const CX = g.deck.x, CY = g.deck.y;
  after(300, () => {
    for (let i = 0; i < 5; i++) setCard(i, { x: CX - 62, y: CY - 4 + i * 1.3, rot: -5, z: 20 + i });
    for (let i = 5; i < 10; i++) setCard(i, { x: CX + 62, y: CY - 4 + (i - 5) * 1.3, rot: 5, z: 20 + i });
  });
  const seq = [0, 5, 1, 6, 2, 7, 3, 8, 4, 9];
  seq.forEach((id, j) => after(760 + j * 52, () => setCard(id, { x: CX, y: CY - 2, rot: 0, z: 40 + j })));
  const tShuf = 760 + 10 * 52 + 160;
  restack(order, tShuf);
  const DISC = { x: g.stageW - 96, y: g.deck.y + 120 };
  let kept = 0, disc = 0, t = tShuf + 640;
  for (let pos = 0; pos < order.length; pos++) {
    const id = order[pos];
    if (pos % 2 === 0) {
      const kk = kept++;
      after(t, () => { const s = handSlot(kk, H, g); setCard(id, { x: s.x, y: s.y, rot: s.rot, z: 60 + pos, flipped: true, scale: g.dealScale }); });
    } else {
      const dd = disc++;
      after(t, () => setCard(id, { x: DISC.x + dd * 0.6, y: DISC.y + dd * 1.4, rot: (dd - 2) * 7, z: 30 + dd, flipped: false }));
    }
    t += 250;
  }
  return t + 500;
}
alternate.selfDeal = true;

// 9. Fontana — cards jet upward; mid-air they swap columns, then fall back.
function fountain(ctx) {
  const { after, setCard, restack, order, N, g } = ctx;
  const CX = g.deck.x, topY = g.deck.y - 124;
  const jetAt = perm => perm.forEach((cardId, slot) => { const t = slot / (N - 1); setCard(cardId, { x: CX + (t - 0.5) * 224, y: topY - Math.sin(t * Math.PI) * 42, rot: (t - 0.5) * 52, z: 40 + slot }); });
  for (let i = 0; i < N; i++) { const t = i / (N - 1); after(340 + i * 70, () => setCard(i, { x: CX + (t - 0.5) * 224, y: topY - Math.sin(t * Math.PI) * 42, rot: (t - 0.5) * 52, z: 40 + i })); }
  after(1180, () => jetAt(shuffleArr(range(N))));   // mid-air swap
  after(1620, () => jetAt(shuffleArr(range(N))));
  for (let i = 0; i < N; i++) after(2080 + i * 52, () => setCard(i, { x: CX + rnd(-6, 6), y: g.deck.y + rnd(-4, 4) + i * 1.2, rot: rnd(-6, 6), z: 20 + i }));
  const tR = 2760;
  restack(order, tR);
  return tR + 650;
}

export const SHUFFLES = { overhandCut, riffle, pile, wash, vortex, crossCut, lattice, alternate, fountain };

/* ---------- Controller -----------------------------------------------------
 * Owns timers, runs a shuffle then the shared restack+deal, and reports done.
 * You supply setCard(id, patch); patch is a partial transform
 * { x, y, rot, scale, z, flipped }. ---------------------------------------- */
export class ShuffleController {
  constructor({ setCard, geometry = DEFAULT_GEOMETRY, deckSize = 10, handCount = 5, timeScale = 1 } = {}) {
    this.setCardRaw = setCard;
    this.g = geometry;
    this.N = deckSize;
    this.H = handCount;
    this.timeScale = timeScale;
    this.timers = [];
  }

  after(ms, fn) { this.timers.push(setTimeout(fn, ms * this.timeScale)); }
  setCard(id, patch) { this.setCardRaw(id, patch); }

  cancel() { this.timers.forEach(clearTimeout); this.timers = []; }

  restack(order, t) {
    const { g, N } = this;
    this.after(t, () => order.forEach((id, pos) => this.setCard(id, {
      x: g.deck.x + pos * 0.5, y: g.deck.y + pos * 1.3, rot: (pos - (N - 1) / 2) * 0.7, scale: 1, z: N - pos, flipped: false,
    })));
  }

  deal(order, t) {
    const { g, H, N } = this;
    for (let k = 0; k < H; k++) {
      const id = order[k];
      this.after(t + k * 260, () => { const s = handSlot(k, H, g); this.setCard(id, { x: s.x, y: s.y, rot: s.rot, z: 60 + k, flipped: true, scale: g.dealScale }); });
    }
    this.after(t + 140, () => order.slice(H).forEach((id, pos) => this.setCard(id, {
      x: g.remain.x + pos * 0.5, y: g.remain.y + pos * 1.3, rot: (pos - (N - H) / 2) * 1.1, z: 5 - pos,
    })));
    return t + H * 260 + 780;
  }

  /* Reset to deck, run `kind`, then deal. Returns { order, duration }. */
  play(kind, { onDone, order } = {}) {
    this.cancel();
    const chor = SHUFFLES[kind];
    if (!chor) throw new Error('Unknown shuffle: ' + kind);
    // reset deck to resting stack immediately
    initialDeck(this.N, this.g).forEach(c => this.setCard(c.id, c));
    const ord = order || shuffleArr(range(this.N));
    const ctx = { after: this.after.bind(this), setCard: this.setCard.bind(this), restack: this.restack.bind(this), order: ord, N: this.N, H: this.H, g: this.g };
    const tEnd = chor(ctx);
    const dealEnd = chor.selfDeal ? tEnd : this.deal(ord, tEnd + 280);
    if (onDone) this.after(dealEnd, onDone);
    return { order: ord, duration: dealEnd };
  }
}
