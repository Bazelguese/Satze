# Satze Design System

**Satze — La Grande Guerra** is a strategic 2-player card game, built in React + Vite + Electron. The UI is in Italian and presents a grim, cosmic-horror/post-war fantasy universe where eight factions ("Armate") fight across procedurally themed battlefields. The visual language is a "HUD Tattico / Cyber" (tactical-cyber HUD) — deep blacks, cyan (`#38bdf8`) as primary accent, amber fire as secondary, faction-specific accent colors, and a Chakra Petch / Cinzel type system.

This design system gives design agents everything needed to produce on-brand Satze interfaces, marketing, slides, and prototypes.

## Sources

- **Codebase** (attached via mount): `Satze/` — React 18 + Vite + Electron, Tailwind CSS. Key files:
  - `Satze/src/theme/hudOratorioPalette.js` — canonical palette + font tokens
  - `Satze/src/campaign/campaignTheme.js` — campaign colors, mission tagging
  - `Satze/src/data/armies.js` — 8 factions, per-army colors, symbols, bonuses
  - `Satze/src/data/cards.js` — card definitions (~120 cards, 15 per faction)
  - `Satze/src/components/menu/SatzeMenuPrototype.jsx` — main menu (sky/battle/particle layers, banner-shaped buttons)
  - `Satze/src/components/menu/MenuScreenLayout.jsx` — shared cosmic layout
  - `Satze/src/components/cards/Card.jsx` — full-art card component
  - `Satze/src/components/LoadingScreen.jsx` — HUD loading screen
  - `Satze/public/icons/` — 8 faction glyphs (AI-generated, brass on transparent bg)
  - `Satze/public/Immagini_bg/*_bg1.png` — faction mood backgrounds
  - `Satze/public/campi_bg/campo-*.png` — 50 battlefield art pieces
  - `Satze/public/card-images/agents/*.png` — 120 character portraits
- **Documentation** (Italian): `Satze/Documentazione/` — lore for each faction, rules (`REGOLE.md`), glossary (`GLOSSARIO.md`), worldbuilding.

## Products

This project is a single product (the game client) with several distinct surfaces:

1. **Menu / meta** — main menu, campaign hub, deck manager, gallery, multiplayer lobby. Full-screen cosmic background (starfield + silhouetted battle + particles + vignette) with banner-shaped buttons.
2. **Duel** — the in-game battle HUD. Battlefield background + two hands + center battlefield panel + stats panels + log panel.
3. **Deck builder** — grid of cards with selection states.
4. **Loading / splash** — tactical HUD with faux-terminal typography.

## Content Fundamentals

**Language.** Italian, everywhere. All UI, flavour text, error messages, logs.

**Voice.** Literary, grim, decisive. Short declarative sentences stacked for rhythm ("Non aspettò la Fusione. Camminò nella Nebula con gli occhi aperti, prima degli altri."). Flavour text is never playful — it's elegiac, fatalistic, often about loss and bargains. Rules text is terse and abbreviated (e.g. `Conquista: +2 FC`, `-5 VA nem. (min 6)`).

**Casing.** Sentence case for body copy, flavour text, card names. UPPERCASE SPACED LETTERING for HUD labels and titles (`SATZE`, `LA GRANDE GUERRA`, `CARICAMENTO`, `v0.1 ALPHA`). Heavy letter-spacing (0.15–0.35em) is signature.

**Pronouns.** The game addresses the player as "tu" (informal you). Flavour text is written in third person, about characters.

**Abbreviations.** The game leans on domain jargon:
- `POT` = Potere (Power)
- `DAN` = Danno (Damage)
- `VA` = Valore Assalto (Assault Value)
- `FC` = Focus Coin
- `PV` = Punti Vita (HP)
- `nem.` = nemico (enemy)
- `dir.` = diretto (direct)
- `L5` = Lega 5 (League / tier)
- Mission tags: `ASS`, `DIF`, `DOM`, `ANN`, `SPC`

**Emoji.** Originally used for army symbols (☄️🏛️🔥⚙️🌙🦠🐉🐀) but **deprecated** — the project migrated to custom PNG glyphs via `<Icon>`. Never use emoji in new design work except as explicit fallback.

**Flavour examples** (from cards.js):
- "La Fusione dissolse i corpi, ma Sorethal rifiutò di svanire."
- "Quando cercò vendetta, i Velessi erano polvere."
- "Il debito viene sempre riscosso. Con l'oro, con il sangue, o con l'anima. La scelta, tecnicamente, è tua."

**Ability descriptions** are shorthand: `Potere: Vendetta: +3 POT`, `Bonus: Copia Bonus nemico`.

## Visual Foundations

**Vibe.** Dark sci-fantasy tactical HUD. Think: Homeworld + Frostpunk + a grim tabletop wargame. Never cute, never pastel, never flat-vector.

**Palette.** Built on deep near-black (`#050608`, `#0a1628`), with cyan (`#38bdf8`) as the dominant accent, amber fire (`#f97316`, `#fbbf24`) as warm counterpoint, and magenta (`#d946ef`) as rare highlight. Each of 8 factions carries its own accent color (purple for Orizzonte, amber for Kethran, red for Corte Rossa, slate for Calibri, teal for Orathai, lime for Mounthborn, orange for Enclave, emerald for Ratti). See `colors_and_type.css`.

**Type.** **Chakra Petch** is the UI workhorse — tactical, slightly squared, wide letter-spacing. **Cinzel** is the display serif used on menu banners (capital Roman elegance). **Share Tech Mono** is the terminal/mono voice (logs, stats). No web-safe Inter/Roboto here.

**Backgrounds.** Never flat. The menu uses layered parallax: (1) nebula gradient + twinkling stars, (2) silhouetted warriors with banners + ember gradients, (3) ash/spark particle canvas, (4) radial vignette. In-game uses per-battlefield painted art with animated reveal clip-paths (radial, fragmented, flames, scan, swirl, magic). Army screens use the faction's mood photo as a blurred underlay.

**Animation.** Everything breathes. Stars twinkle, particles wobble and rise, banners wave, vignette pulses (8s cycle), titles entrance (1.2s), numbers flash on change. Easing is `cubic-bezier(0.4, 0, 0.2, 1)` for buttons, `ease-out` for entrances, `ease-in-out` for ambient loops. Cards animate in from screen edges with blur + scale + rotate (see `cardEnterLeft`/`cardEnterRight`). No bounces — it's military, not cheerful.

**Hover states.** Borders go from `PALETTE.slate` (dim steel) to `PALETTE.gold`/accent color. Glow `drop-shadow` appears (`0 0 12px accent88, 0 0 24px accent44`). Background tint shifts from `accent0c` to `accent18` (6% → 24% alpha). Never scale on hover for buttons — scale is for selection only. Cards DO scale on hover (`scale-105`).

**Press / active.** Buttons use `transform: scale(0.98)` (see `index.css`). Disabled is `opacity: 0.5` + no transform.

**Borders.** Almost always `1.5px solid` in slate (`#334155`) dimming to accent on hover. Dashed variants (`stroke-dasharray: 2,4`) used on banner inner frames. Thick `border-2` on cards for selection state.

**Corners.** Radii are mostly **flat (0)** — tactical/HUD philosophy. Cards use `rounded-xl` (12px). Banner SVGs use angled polygon clips instead of radii. Clipped corners on HUD panels (`clip-path: polygon(12px 0, 100% 0, ...)`).

**Shadows.** Cast shadows are always dark and flat (`0 2px 8px #000`). The dominant visual lift is **colored glow** via `box-shadow: 0 0 20px color40` or `drop-shadow(0 0 12px color88)`. Inner shadows (`inset 0 0 40px rgba(0,0,0,0.45)`) add crushed depth on HUD panels.

**Cards.** `rounded-xl` (12px), `border-2`, gradient background tied to faction color (e.g. `from-purple-900 to-indigo-800`), full-art image centered underneath, gradient overlay for text legibility (`from-black via-black/30 to-transparent`), 2 stat pods absolute-positioned on left/right mid, footer block with Potere + Bonus rows, army color-tinted badge at bottom.

**Transparency / blur.** Heavy use of `bg-black/40`, `bg-black/70` for HUD chrome over painted backgrounds. `backdrop-filter` not common — relies on solid alpha layers instead. `filter: blur()` used on loading transitions and card-enter animations only.

**Imagery color.** Warm painterly — AI-generated in a consistent style (Midjourney prompts live in `PROMPT_MIDJOURNEY.md`). Saturated but dark, heavy shadow, bronze/brass highlights, brown/ash ground. Every army has a mood color tint — warm for Corte Rossa/Kethran/Enclave, cool for Orizzonte/Calibri/Orathai, sickly-green for Mounthborn/Ratti.

**Layout rules.** Menus are designed to a **fixed 1920×1080 canvas**. Game UI is absolutely positioned against that canvas (see `width: '1920px', height: '1080px'` in `Battlefield.jsx`). All menus center their content; no flex-grow webby layouts.

**Protection gradients.** Dark-to-transparent gradients over imagery for text legibility — always applied when overlaying text on battlefield art or faction portraits.

## Iconography

**Faction glyphs.** 8 custom PNGs in `assets/armies/` — AI-rendered brass/bronze metal relief icons on transparent backgrounds. Each is a heraldic symbol keyed to the faction's lore (comet, temple/spire, flame, gear, moon, virus/cell, dragon, rat). Use these, not emoji. Emoji fallbacks exist in `ARMY_SYMBOLS` but are deprecated.

**UI icons.** The codebase defines ~30 inline-SVG icon components in `src/data/icons.jsx` (IconSword, IconFlame, IconCrown, IconSkull, IconGear, IconBook, etc.) — hand-drawn, flat-geometric, stroke-width ~1.5–2, all accepting `size` and `color` props. Stylistically: angular, filled with a single accent color + a small white/opacity-80 highlight. **For this design system, where equivalent UI iconography is needed (menus, buttons), use [Lucide](https://lucide.dev) at stroke-width 1.5 — it closely matches the project's hand-drawn icon weight.** Flag any substitution in the asset subtitle.

**Emoji.** Never in primary UI. If you see any, treat as legacy.

**Unicode.** Arrows (`←`, `→`), bullets, and `✕` close-icons appear inline — these are fine.

## Font substitution note

The project loads Chakra Petch, Cinzel, and Share Tech Mono directly from Google Fonts CDN (see `Satze/index.html`). No local .ttf/.woff files are present in the codebase. `colors_and_type.css` in this design system loads the same Google Fonts CDN URLs so nothing is substituted — but if you want local fonts for offline use, please provide .woff2 files.

## Index

Root files:
- `README.md` — this file
- `SKILL.md` — Agent-Skill compatible entry point
- `colors_and_type.css` — CSS variables for the system
- `assets/` — faction glyphs, background art, card portraits, battlefields
- `preview/` — cards that populate the Design System tab
- `ui_kits/menu/` — React recreation of the main menu + shared layout + cards
- `ui_kits/duel/` — React recreation of the in-game duel HUD

## Files in this design system

```
README.md               — this file
SKILL.md                — Agent-Skill compatible entry point
colors_and_type.css     — CSS variables for the entire system

assets/
  armies/               — 8 faction glyph PNGs (brass relief on transparent)
  army-bg/              — 8 painted faction mood backgrounds
  battlefields/         — sample battlefield art (4 of 50)
  cards/                — sample character portraits (~12 of 120)
  tabellone-bg.png      — game-board background
  glossario-bg.png      — glossary/reference background

preview/                — cards that populate the Design System tab
  logo.html, faction-glyphs.html, imagery-moodboards.html, battlefields.html
  colors-neutrals.html, colors-accents.html, colors-factions.html
  type-display.html, type-ui.html, type-mono-flavor.html
  spacing.html, radii.html, shadows.html
  buttons.html, card-anatomy.html, hud-panel.html, badges-inputs.html

ui_kits/
  menu/                 — main menu, campaign hub, army picker, splash
    index.html          — live interactive walkthrough
    CosmicBackground, SatzeWordmark, BannerButton, ArmyTile,
    MissionCard, LoadingScreen — component JSX files
  duel/                 — in-game battle HUD
    index.html          — live fake-duel
    StatOrb, DuelCard, HudPanel, TurnLog — component JSX files
```

## Caveats

- Not all 120 card portraits were copied — only a representative ~12. Copy more from `Satze/public/card-images/agents/` if you need specific characters.
- Only 4 of 50 battlefields copied — the rest live in `Satze/public/campi_bg/` as `campo-1.png` through `campo-50.png`.
- No .woff2 font files shipped — relies on Google Fonts CDN.
- UI icons in this system reference Lucide as a close match to the codebase's custom SVG style.
