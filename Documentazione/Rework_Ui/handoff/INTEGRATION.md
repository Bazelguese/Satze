# Cosmic UI — Integration Guide

This handoff bundles a production-ready React port of the new **Cosmic** look (logo viola/magenta, persona-style menu, sweep transitions) for the **Satze** codebase. The HTML prototypes from the design project have been **converted into proper ES modules** that import `react` normally — drop them in, wire one route, ship.

## TL;DR

```bash
# from your repo root (the existing Satze/ project)
cp -R handoff/src/components/cosmic   src/components/cosmic
cp    handoff/src/styles/cosmic-tokens.css src/styles/cosmic-tokens.css
cp -R handoff/public/assets/*         public/assets/
```

Then:

1. Add Google Fonts (`Cinzel`, `Chakra Petch`, `Share Tech Mono`) to `index.html`.
2. Import `cosmic-tokens.css` once in your root entry (e.g. `src/main.jsx`).
3. Render `<CosmicFlow/>` wherever you want the new menu/builder/select stack to live.

That's it.

---

## What's in the bundle

```
handoff/
├── INTEGRATION.md                       ← you are here
├── src/
│   ├── components/cosmic/
│   │   ├── CosmicFlow.jsx               ← orchestrator (menu ↔ builder ↔ select + sweep)
│   │   ├── MenuV5PersonaCosmic.jsx      ← main menu (V5 Persona w/ cosmic palette + real logo)
│   │   ├── DeckBuilderCosmic.jsx        ← deck construction screen
│   │   ├── DeckSelectCosmic.jsx         ← pre-duel deck picker (carousel)
│   │   └── cosmic-transitions.css       ← sweep keyframes + scene helpers
│   └── styles/
│       └── cosmic-tokens.css            ← color/type/spacing/shadow CSS variables
└── public/
    └── assets/
        ├── logo-satze-cosmic.png        ← new logo (viola/magenta)
        └── cards/                       ← sample card art used by demo data
            ├── 101.png … 601.png
```

All component files use **standard ES module syntax** (`import React, { useState } from 'react'`) — no Babel-standalone, no `window.X` globals.

---

## Step-by-step integration

### 1. Copy files into your repo

The handoff mirrors a Vite/CRA project layout (`src/components`, `src/styles`, `public/assets`). If your structure differs, adjust paths accordingly.

```bash
# Components → live next to your existing components
cp -R handoff/src/components/cosmic   src/components/cosmic

# Tokens → wherever your global CSS lives
cp handoff/src/styles/cosmic-tokens.css src/styles/cosmic-tokens.css

# Static assets → public/ so they're served at /assets/...
mkdir -p public/assets/cards
cp handoff/public/assets/logo-satze-cosmic.png public/assets/
cp handoff/public/assets/cards/*.png           public/assets/cards/
```

> **Note on asset paths.** All component code references `/assets/...` (absolute, served from `public/`). If you'd rather import images through the bundler, swap the `<img src="/assets/...">` lines for `import logo from '../../assets/logo-satze-cosmic.png'`.

### 2. Add the Google Fonts

Edit `index.html` and add this `<link>` inside `<head>` (above the existing stylesheet links):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Cinzel:wght@400;500;600;700;800;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

> The fonts are also imported via `@import` at the top of `cosmic-tokens.css` — having them in `index.html` is faster and avoids the FOIT.

### 3. Import the tokens once at app root

In `src/main.jsx` (or `src/index.jsx` / `src/App.jsx` — wherever you bootstrap):

```js
import './styles/cosmic-tokens.css';
```

### 4. Mount `<CosmicFlow/>`

The simplest possible wiring — replace your current menu mount with:

```jsx
import CosmicFlow from './components/cosmic/CosmicFlow.jsx';

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <CosmicFlow/>
    </div>
  );
}
```

`CosmicFlow` fills its parent absolutely and manages its own scenes. It needs a positioned container with `inset: 0` (or fixed dimensions).

### 5. Wire it into Satze's existing routing

The current `Satze/src/App.jsx` (or equivalent) routes between `SatzeMenuPrototype`, `Battlefield`, `DeckBuilder`, etc. To swap in the cosmic surfaces while keeping the legacy ones reachable behind a flag:

```jsx
const USE_COSMIC = true; // flip to false to fall back to old menu

function App() {
  // ... existing screen state
  if (USE_COSMIC && screen === 'menu') {
    return <CosmicFlow onExit={(target) => setScreen(target)} />;
    //                  ^ optional: extend CosmicFlow to emit when leaving its 3-scene loop
  }
  // … original switch/case for menu / battle / deck-builder / etc
}
```

Right now `CosmicFlow` only handles the menu ↔ builder ↔ select triangle. If you click `PARTITA LOCALE` and reach the deck-select, the “SCHIERA MAZZO ›” button is currently a **no-op** — that's where you hand off to your existing `Battlefield`. Add a prop:

```jsx
// CosmicFlow.jsx — add an `onLaunchDuel` prop you call from DeckSelectCosmic's confirm button
<CosmicFlow onLaunchDuel={() => setScreen('battle')} />
```

(See **Hooking up real actions** below for the exact spots.)

---

## Hooking up real actions

The components ship with **demo data hardcoded** so they render standalone. You'll want to replace each with your real game state.

### `MenuV5PersonaCosmic.jsx`
- The `items` array (lines ~16–24) is the menu list. Each entry's click is intercepted by `MenuShell` in `CosmicFlow.jsx` based on its **label text**.
- To run real actions on click, change `MenuShell` to receive callbacks instead of label-string-matching, or pass `onClick` props down through the items array.

### `DeckBuilderCosmic.jsx`
- `cards` (line ~28) — replace with your full card pool from `Satze/src/data/cards.js` / `ARMY_DECKS`.
- `deck` (line ~40) — replace with the player's current deck state.
- `tab` / `legaFilter` / `sort` — already wired via `useState`. Plug them into your real filtering logic.
- The "+ / −" button on each `CardRow` is currently dumb. Wire it to your add/remove deck handlers.

### `DeckSelectCosmic.jsx`
- `decks` (line ~12) — replace with the player's saved decks from your store.
- The carousel (`active` / `setActive`) is already responsive to clicks/arrows/dots.
- The big "SCHIERA MAZZO ›" button is the **launch duel** action. Add an `onLaunch` prop to the component and call it from the button's `onClick`.

### `CosmicFlow.jsx`
- Currently self-contained. To bridge to outside routing, add `onExit` / `onLaunchDuel` props and call them where appropriate (e.g. when leaving the cosmic stack, or when the deck-select confirms).

---

## Design tokens reference

`cosmic-tokens.css` exposes everything as CSS custom properties. Cosmic-specific values are not yet in the tokens file (they're inline in the component code) — the most-used ones are:

| Token              | Hex        | Used for                         |
| ------------------ | ---------- | -------------------------------- |
| `--cosmic-bg`      | `#06030a`  | base background                  |
| `--cosmic-accent`  | `#c026d3`  | magenta primary (logo, accents)  |
| `--cosmic-heat`    | `#ec4899`  | pink heat (hover, callouts)      |
| `--cosmic-violet`  | `#a78bfa`  | secondary actions, muted         |
| `--cosmic-deep`    | `#581c87`  | gradient depth                   |

If you want them as real tokens, add this block to the bottom of `cosmic-tokens.css`:

```css
:root {
  --cosmic-bg:     #06030a;
  --cosmic-accent: #c026d3;
  --cosmic-heat:   #ec4899;
  --cosmic-violet: #a78bfa;
  --cosmic-deep:   #581c87;
}
```

…then refactor the inline `'#c026d3'` constants in the JSX to `var(--cosmic-accent)`. (Optional — the inline form is faster to ship.)

---

## Gotchas

1. **Asset paths are absolute (`/assets/...`).** They only work if the files live in `public/assets/...`. If you import via Vite/Webpack instead, change the `<img src="…">` lines accordingly.
2. **Components position themselves absolutely.** Always wrap in a positioned container (`position: relative` or `fixed`, with `inset: 0` or explicit dimensions). Inside a normal flow `<div>` they'll collapse.
3. **The transition CSS is global.** `cosmic-transitions.css` is imported by `CosmicFlow.jsx` and adds keyframes (`scene-enter`, `sweep-cover`, etc.) to the page. Names are scoped enough not to collide with the existing Satze CSS, but if you have a `.scene` class elsewhere, rename one side.
4. **Italian copy is hardcoded.** All labels, taglines, and footer marquees are in Italian by design (matches your existing UI). If you eventually i18n, the strings live inline in each component file.
5. **The menu's click-routing is by label-text-match.** Brittle if you rename items. The cleaner long-term refactor is to give each menu item an `onClick` prop in the `items` array and remove `MenuShell`'s `addEventListener` hack — easy 10-minute change.

---

## Verifying it works

After integration, you should see:

- ✅ The menu loads with the magenta SATZE logo top-left and 7 chevron buttons sliding in from the right.
- ✅ Hovering a menu item slides it left ~36px and lights it up in its accent color.
- ✅ Clicking `PARTITA LOCALE` triggers a magenta diagonal sweep + flash, then lands on the deck-select carousel.
- ✅ From there, the bottom-left side menu offers `MODIFICA` (→ builder) or `MENU PRINCIPALE` (→ menu).
- ✅ The footer marquee scrolls right-to-left on each scene.

If the fonts are wrong, check step 2. If the assets don't load, check step 1. If the layout is collapsed, check Gotcha #2.

---

## What's NOT in this handoff

- The **duel/battlefield** screen is still your existing `Battlefield.jsx` — the cosmic redesign for it is in the design project but not yet ported.
- The **card layouts** (V2 Obelisco sash with rune halo) are designed in `explorations/card-layouts.html` but not yet a component — port them when you're ready to redesign the actual `<Card/>`.
- Sound, persistent state, save slots — none of that is touched. The cosmic surfaces are pure UI.

Ping back when you want round 2 (duel HUD + card component port).
