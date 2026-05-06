---
name: satze-design
description: Use this skill to generate well-branded interfaces and assets for Satze (a dark sci-fantasy 2-player tactical card game — "La Grande Guerra"), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

**Key files to consult:**
- `README.md` — Brand overview, content fundamentals, visual foundations, iconography notes
- `colors_and_type.css` — CSS variables for colors (neutrals, accents, 8 faction colors, campaign chroma), type scale, spacing, radii, shadow system, semantic classes
- `assets/armies/` — 8 faction glyphs (Orizzonte, Kethran, Corte Rossa, Calibri Pesanti, Orathai, Mounthborn, Enclave, Ratti)
- `assets/army-bg/` — 8 painted mood backgrounds (one per faction)
- `assets/battlefields/` — sample battlefield art
- `assets/cards/` — sample character portraits (120 exist in the original codebase)
- `ui_kits/menu/` — React recreation of the main menu surface (banner buttons, cosmic background, loading screen, army picker, mission cards)
- `ui_kits/duel/` — React recreation of the duel HUD (cards, stat orbs, HUD panels, turn log)

**Non-negotiables:**
- Language is **Italian**. Copy in Italian. Technical jargon (POT, DAN, VA, FC, PV) stays abbreviated.
- Type: **Cinzel** (display banners), **Chakra Petch** (UI), **Share Tech Mono** (logs/stats). Heavy letter-spacing (0.15–0.35em). ALL CAPS for titles and HUD labels.
- Dark-first. Near-black backgrounds. Colored glow for lift, never flat drop-shadow alone.
- Flat-first radii (0–8px); card component is the exception (rounded-xl / 12px).
- Never use emoji in primary UI. Use the 8 brass faction glyph PNGs.
- Voice is literary, grim, short declarative sentences. Never cute, never pastel.
