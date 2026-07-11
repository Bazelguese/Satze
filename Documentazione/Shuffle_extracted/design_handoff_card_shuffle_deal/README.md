# Handoff: Mischia e Distribuzione Carte (Card Shuffle & Deal animation)

## Overview
A self-contained animation sequence for **Satze — La Grande Guerra**: a deck of 10 cards
fans out, shuffles (2 randomized scramble passes), restacks, then deals 5 cards face-up
to the player's hand with a 3D flip reveal. Ends with a "Rigioca" (Replay) button.

Intended use: menu/deck-select transition, loading beat, or a duel-intro flourish.

## About the design files
The files in this bundle are **design references**, built as an HTML/JS prototype
(`CardShuffleDeal.source.html`) inside the Satze design system tool. They are not meant
to be shipped as-is. `CardShuffleDeal.reference.jsx` is a plain React translation of the
exact same logic/markup/timing, provided to make porting into the real codebase
(`Bazelguese/Satze`, React + Vite + Electron) straightforward — recreate it using the
project's existing component patterns (it already fits the codebase's plain-React,
inline/`style`-driven card components like `CardReworkP4`).

## Fidelity
**High-fidelity.** Exact colors, typography, spacing, timing and easing are final and
should be implemented pixel/frame-accurate.

## Screen / view
**Name:** Card Shuffle & Deal
**Purpose:** Show the player's 10-card deck being shuffled and 5 cards being dealt to
them, face-up, in a fanned hand.
**Canvas:** fixed 1000×600 stage, centered in a full-bleed `100vw × 100vh` container.
Background: `var(--bg-night)` (`#0e0e0f`), plain — no cosmic gradient/grain (this
sequence is meant to sit on a neutral surface, e.g. inside a modal or loading screen).

### Card anatomy (150×214px, ratio matches the real 230×330 game card)
- **Back face:** `linear-gradient(160deg, #17171a, #0b0b0c 70%)` fill, `1.5px solid
  var(--accent-slate)` (`#34343a`) border, `10px` border-radius, `var(--sh-drop)`
  shadow. Satze wordmark (`src/assets/logo-satze.png`) centered, 58% width, grayscale +
  1.4 brightness, 85% opacity.
- **Front face** (revealed on deal): faction art image full-bleed
  (`object-fit: cover`), a top-to-bottom/bottom-to-top dark gradient overlay for
  legibility, then:
  - **Sash** (34px tall, 6px from top): background = faction color at 80% alpha
    (`{armyColor}cc`). Contains: POT pod (left, 26px circle, black bg, `#fde047`
    border/text), card name (center, 8.5px uppercase bold white), DAN pod (right, 26px
    circle, black bg, `#c084fc` border/text). Font: `var(--font-mono)` for the numbers.
  - **Army bar** (16px tall, pinned to bottom): solid faction color, army name centered,
    6.5px uppercase bold white.
  - Outer border: `2px solid rgba(255,255,255,.28)`, plus a 1px faction-color ring at
    40% alpha (`box-shadow: 0 0 0 1px {armyColor}66`).
- **Flip:** the back/front are two absolutely-positioned faces with
  `backface-visibility: hidden` inside a `transform-style: preserve-3d` wrapper; the
  wrapper rotates `rotateY(0deg → 180deg)` over **0.6s** `cubic-bezier(.4,0,.2,1)`. The
  stage container has `perspective: 1600px`.

## Interactions & behavior — animation timeline
All position/rotation moves use `transition: left/top/transform 0.7s
cubic-bezier(.4,0,.2,1)`. Times below are elapsed ms from mount / replay-click.

1. **t=0** — 10 cards stacked at the deck position (`x:330, y:300`), each offset
   `+0.6px x / +1.4px y` per index for a paper-thickness look, tiny alternating
   rotation (`(i-4.5)*0.8deg`).
2. **t=500ms** — **Fan out**: all 10 cards animate into an arc (`fanSlot`, see Design
   Tokens) — evenly spread across 620px of width, arched -36px at the peak, rotated
   -28°→+28° across the fan.
3. **t=1350ms & t=1970ms** — **2 scramble rounds**: the 10 cards are reassigned to
   random fan slots (Fisher–Yates shuffle) and animate to their new slot, 620ms apart.
   This reads as the "shuffle." The resulting slot order becomes the final deck order.
4. **t≈2590ms** — **Restack**: all 10 cards animate back to the stacked deck position,
   now ordered per the shuffle result (z-index/offset follow the new order).
5. **t≈3490ms onward** — **Deal**: the top 5 cards (per shuffle order) animate one at a
   time, staggered **300ms** apart, from the deck to 5 fan-arranged hand slots
   (`handSlot`, spread 480px wide, centered at `y:522`, arched -22px, rotated
   -22°→+22°), scaling to **1.06×**, and flipping face-up (`flipped: true`) in sync.
   The remaining 5 undealt cards simultaneously animate to a small stack at the
   "remaining pile" position (`x:150, y:300`, left of the dealt hand).
6. **~750ms after the last card lands** — the **"Rigioca"** button fades in (bottom
   center, 36px from bottom). Clicking it clears all pending timers and replays the
   entire sequence from a fresh shuffle (`Math.random`-seeded, so the outcome differs
   each time).

### Replay button
`ds-btn`-style: `var(--font-ui)` 600/12px, `letter-spacing: 0.15em`, uppercase,
`var(--fg1)` text, `rgba(245,243,236,0.06)` background, `1.5px solid
var(--accent-slate)` border, `11px 26px` padding. Hover: border → `var(--accent-light)`,
background → `rgba(245,243,236,0.14)`, `box-shadow: var(--glow-light)`.

## State management
- `cards`: array of 10 card objects, each `{ id, name, pot, dan, army, armyColor, img,
  x, y, rot, scale, z, flipped }` — the live animated transform state per card.
- `showReplay`: boolean, gates the replay button.
- Timers: an array of pending `setTimeout` ids, cleared on replay/unmount so double-play
  doesn't stack.
- Sequence logic (`play()`): resets state, then schedules the fan-out → 2 scrambles →
  restack → deal steps via `setTimeout`, computing a fresh random shuffle order each
  run.

## Design tokens used
From the Satze design system (`colors_and_type.css`):
- `--bg-night: #0e0e0f` (stage background)
- `--accent-slate: #34343a` (card back border, button border)
- `--accent-light: #f5f3ec` (hover accent / glow)
- `--fg1: #ece9e2` (button text)
- `--sh-drop: 0 4px 16px rgba(0,0,0,0.9)`
- `--glow-light: 0 0 12px rgba(245,243,236,0.5), 0 0 26px rgba(245,243,236,0.22)`
- `--font-ui: 'Chakra Petch', system-ui, sans-serif`
- `--font-mono: 'Share Tech Mono', 'Courier New', monospace`

Faction colors (fixed per card, from `ARMY_COLORS`):
- Figli dell'Orizzonte `#a78bfa` · Kethran `#fbbf24` · Corte Rossa `#f43f5e` ·
  Calibri Pesanti `#94a3b8`

Card data used in this demo (name / POT / DAN / faction / art file):
1. Veggente dell'Alba — 7 / 5 — Figli dell'Orizzonte — `101.png`
2. Custode Astrale — 5 / 6 — Figli dell'Orizzonte — `102.png`
3. Ombra Cometa — 6 / 4 — Figli dell'Orizzonte — `111.png`
4. Sacerdote del Tempio — 8 / 3 — Kethran — `201.png`
5. Guardiano d'Ambra — 4 / 7 — Kethran — `202.png`
6. Araldo Dorato — 6 / 6 — Kethran — `211.png`
7. Lama Scarlatta — 9 / 2 — Corte Rossa — `301.png`
8. Boia della Corte — 5 / 8 — Corte Rossa — `311.png`
9. Fante Corazzato — 4 / 9 — Calibri Pesanti — `401.png`
10. Colosso d'Acciaio — 7 / 5 — Calibri Pesanti — `411.png`

Replace this sample data with the player's real deck (`src/data/cards.js` /
`src/data/armies.js`) in the real implementation — any 10-card deck / 5-card deal works
with the same layout math (`fanSlot(i, n)` / `handSlot(i, n)` take `n` as the deck/hand
size, so it isn't hardcoded to 10 or 5).

## Assets
- `assets/logo-satze.png` — Satze wordmark, used on the card back.
- `assets/cards/101.png` … `411.png` — 10 sample faction character portraits (from the
  design system's card art subset). Swap for the real per-card art in production.

## Files
- `CardShuffleDeal.source.html` — the original design-tool source (template + logic),
  for exact reference on structure/values.
- `CardShuffleDeal.reference.jsx` — plain React translation of the same component,
  meant purely as a porting aid (function names/shape mirror the source 1:1).
