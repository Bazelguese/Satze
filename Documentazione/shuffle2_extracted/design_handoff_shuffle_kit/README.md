# Satze — Shuffle Kit

A drop-in toolkit for **card shuffle + deal** animations in *Satze — La Grande Guerra*.
One framework-agnostic engine drives nine distinct shuffle techniques; a plain-React
component shows how to wire it to the official `sashNameHud` card.

Live demo (all nine, side by side): `../shuffle_animations/Shuffle Showcase.html`.

## The nine shuffles

| key            | name              | motion |
|----------------|-------------------|--------|
| `overhandCut`  | Sfilata & Taglio  | packets pulled off the top → quick in-place remix → cut → deal |
| `riffle`       | Riffle a Ponte    | split L/R, interleave to centre, square up |
| `pile`         | Mucchietti        | deal round-robin into piles, gather |
| `wash`         | Lavaggio          | scatter flat, re-scatter, gather |
| `vortex`       | Vortice           | cards orbit an elliptical ring that rotates on itself |
| `crossCut`     | Tagli Incrociati  | deck splits into 3 packets that hop over and swap (running cut) |
| `lattice`      | Reticolo          | laid out as a grid; cells reshuffle twice; re-square |
| `alternate`    | Una Sì Una No     | little deck shuffles, then deals every other card (rest discarded) |
| `fountain`     | Fontana           | cards jet upward in a fan and fall back |

Every shuffle ends by squaring the deck into a fresh random order, then dealing
`handCount` cards face-up to a fanned hand while the rest pile to one side.

## Files

- `shuffleKit.js` — the engine. No dependencies, no DOM assumptions. ES module.
- `ShuffleDeal.jsx` — plain-React reference component (porting aid).
- `README.md` — this file.

## Design tokens (Satze)

The card visuals use the Satze design system directly:
`--bg-night #0e0e0f` · `--accent-slate #34343a` · `--fg1 #ece9e2` ·
fonts Chakra Petch (UI) / Share Tech Mono (numbers). Faction colours come from
`ARMY_COLORS` (`src/data/armies.js`).

---

## How it works

The engine is **render-agnostic**: it never touches the DOM. It computes, over
time, the target transform of each card and hands it to a `setCard(id, patch)`
callback you provide. The actual tween is a **CSS transition** on your card
wrapper — the engine only moves the target; the browser animates the rest.

A card transform is: `{ x, y, rot, scale, z, flipped }`
(x/y in stage-local px, rot in deg, z is `zIndex`, flipped toggles the 3D face).

> **Required:** the card wrapper element must carry `CARD_TRANSITION`
> (exported) on `left`, `top`, `transform`. Without it the cards teleport.

## Quick start — React

```jsx
import ShuffleDeal from './ShuffleDeal.jsx';

const deck = [
  { name: "Veggente dell'Alba", pot: 7, dan: 5, army: "Figli dell'Orizzonte", armyColor: '#a78bfa', img: '/card-images/101.png' },
  // …10 cards
];

<ShuffleDeal kind="overhandCut" cards={deck} handCount={5} logoSrc="/logo-satze.png" />
```

Props: `kind`, `cards` (any length — the math isn't hardcoded to 10/5),
`handCount`, `geometry`, `timeScale` (1 = default, <1 faster, >1 slower),
`autoPlay`, `showReplayButton`, `logoSrc`.

Each `card`: `{ name, pot, dan, army, armyColor, img }`.

## Quick start — any framework / plain DOM

```js
import { ShuffleController, initialDeck, DEFAULT_GEOMETRY } from './shuffleKit.js';

// 1. seed your render from the resting deck
const deck = initialDeck(10, DEFAULT_GEOMETRY); // [{id,x,y,rot,scale,z,flipped}, …]

// 2. build a controller that writes transforms wherever you render
const ctl = new ShuffleController({
  setCard: (id, patch) => applyToYourElement(id, patch), // update left/top/transform/zIndex
  deckSize: 10, handCount: 5, timeScale: 1,
});

// 3. play (returns { order, duration }); onDone fires when the deal settles
ctl.play('riffle', { onDone: () => showReplay() });

// 4. always cancel on unmount / before replay
ctl.cancel();
```

`ShuffleController.play(kind, { onDone, order })` resets the deck, runs the
chosen choreography, then the shared deal. Pass a fixed `order` (array of card
indices) for a deterministic deal; omit it for a fresh Fisher–Yates shuffle.

## Geometry

Pass a `geometry` object (defaults in `DEFAULT_GEOMETRY`). All values are px in
your stage's local coordinate space — scale the outer stage element to fit.

| field | default | meaning |
|-------|---------|---------|
| `stageW` / `stageH` | 680 / 500 | stage canvas size (used by wash/pile bounds) |
| `cardW` / `cardH` | 116 / 166 | card size (ratio matches the 230×330 game card) |
| `deck` | `{x:340,y:208}` | resting deck position |
| `remain` | `{x:116,y:208}` | where undealt cards pile after the deal |
| `handY` | 402 | baseline y of the dealt hand fan |
| `fanSpread`/`fanArch`/`fanRot` | 560/40/56 | shuffle fan arc |
| `handSpread`/`handArch`/`handRot` | 460/24/44 | dealt-hand arc |
| `dealScale` | 1.0 | scale of dealt cards |

## Timing

All delays are multiplied by `timeScale`. The individual beats (packet cadence,
scramble spacing, deal stagger) live inside each choreography in `shuffleKit.js`
and are commented — tune there for per-shuffle feel. The move duration itself is
the CSS `CARD_TRANSITION` (0.58s) — change it in one place to speed/soften every
move globally.

## Porting into the game

`ShuffleDeal.jsx` re-implements the `sashNameHud` face inline for a
self-contained reference. In the real client, **render your existing
`CardReworkP4`** for the front face and reuse the engine unchanged — only the
`setCard` wiring and the card element (with `CARD_TRANSITION`) are required. The
back face uses `src/assets/logo-satze.png`, grayscale + 1.4 brightness at 58%
width on a `linear-gradient(160deg,#17171a,#0b0b0c 70%)` fill.

Replace the sample deck with the player's real 10-card deck
(`src/data/cards.js` / `src/data/armies.js`).

## Accessibility

Gate autoplay behind `prefers-reduced-motion` in the host if needed: pass
`autoPlay={false}` and render the already-dealt end state, or set a small
`timeScale` and skip the shuffle by calling `play` with a pre-set `order` then
`cancel()` at the deal — the kit leaves that policy to the host.
