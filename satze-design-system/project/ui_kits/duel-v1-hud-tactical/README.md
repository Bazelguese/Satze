# Satze Duel — UI Kit

Interactive recreation of the in-game duel HUD. Card layout derived from `Satze/src/components/cards/Card.jsx`; battlefield layout inferred from `Battlefield.jsx` (1920×1080 absolute canvas).

**Surfaces covered:**
- Duel screen: battlefield background, two hands, center stat readout, turn log

**Components:**
- `DuelCard.jsx` — full-art card (L5 · VA / DAN · Potere / Bonus / Army badge)
- `StatOrb.jsx` — the circular stat pods used on card corners and HUD
- `HudPanel.jsx` — clipped-corner tactical panel
- `TurnLog.jsx` — combat log with monospace lines
- `Hand.jsx` — fanned row of cards
- `BattlefieldStage.jsx` — background + overlay scaffold

Open `index.html` for a live fake-duel: click a card in your hand → see stats update → END TURN.
