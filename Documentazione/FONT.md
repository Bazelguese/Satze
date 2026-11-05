# Font di Satze — raccolta e dove si usano

Ricognizione del codice al 2 novembre 2026. Copre `src/`, `Codice/`, `index.html`, `public/fonts/`, `tailwind.config.js` e la mappa della campagna in `prototipi/campagna-cael/`.

## In breve

L'app React usa **tre famiglie**. La mappa della campagna (pagina a parte, aperta in un riquadro) ne aggiunge altre cinque: vedi §3. Il resto è un ripiego di sistema oppure compare solo nei laboratori di sviluppo.

| Famiglia | Ruolo | Pesi caricati | Token / costanti |
|---|---|---|---|
| **Chakra Petch** | UI principale: testi, bottoni, pannelli, HUD del duello, popup | 300, 400, 500, 600, 700 | `--font-ui`, `HUD_ORATORIO_FONT_UI`, `CAMPAIGN_FONTS.ui`, Tailwind `font-ui` |
| **Cinzel** | Titoli display: voci del menu principale, nomi su scatole dei mazzi, nomi delle Eminenze negli annunci, campagna | 400–900 (variabile) | `--font-display`, `HUD_ORATORIO_FONT_DISPLAY`, Tailwind `font-display` |
| **Share Tech Mono** | Numeri, etichette tecniche, contatori, codici | 400 | `--font-mono`, `CAMPAIGN_FONTS.mono`, Tailwind `font-techmono` |

## 1. Come vengono caricati

- **`public/fonts/fonts.css`**: `@font-face` self-hosted (sottoinsiemi latin e latin-ext) per Chakra Petch, Cinzel e Share Tech Mono. Generato da `scripts/selfhost-fonts.mjs`, da non modificare a mano.
- **`index.html`**: collega `fonts/fonts.css` e fa il preload di `ChakraPetch-400-latin.woff2` e `Cinzel-400-900-latin.woff2`.
- **`src/theme/hudOratorioPalette.js`**: `injectSatzeUiFonts()` adesso è vuota e resta solo per compatibilità. `src/campaign/campaignTheme.js` → `injectCampaignFonts()` la richiama.

Font presenti in `public/fonts/` ma caricati a parte, solo nei laboratori:

| File | Famiglia registrata | Caricato da | Uso |
|---|---|---|---|
| `Lora-600.woff2` | `SatzeArcanaLora` (Lora Semibold) | `src/components/cardFaceLab/arcanaLiveText.js` (con `new FontFace`) | Testi live delle facce carta **Arcana** (`ArcanaTextOverlay.jsx`, canvas) |
| `alfa-display.otf`, `alfa-body.otf` | `AlfaDisplay`, `AlfaBody` | `src/components/cardFaceLab/alfaCardRenderer.js` (con `new FontFace`), percorsi in `cardFaceLabData.js` | Rendering delle facce carta Alfa nel Card Face Lab |

## 2. Dove si usa ciascun font

### Chakra Petch (UI)

È il font di base di quasi tutte le schermate:

- **Duello**: `Codice/satze.jsx` (pannelli, popup, tramite `HUD_ORATORIO_FONT_UI`), `src/index.css` (HUD, callout, contatori), `src/index-graphics-prova.css`, `src/components/ui/` (`LogPanel`, `StatsPanel`, `FocusCoinSelector`), `src/components/battle/` (`DuelStepFx`, `DuelClashAuroraSequence`, `ClaimVictoryPopup`).
- **Carte**: `src/components/cards/CardReworkP4.jsx` e `CardReworkP4AsHtml.jsx` (costante locale `GAME_CARD_UI_FONT`).
- **Eminenza**: `src/components/eminence/EminenzaZone.jsx` (costante locale `EM_UI_FONT`), `eminenceUi.js`, `src/styles/satze-eminenza.css`, `src/styles/em-announce-vetro.css`.
- **Menu cosmic**: `src/components/menu/` (`SatzeMenuPrototype`, `MenuScreenLayout`, `OptionsScreen`, `cosmic/*`: `DifficultySelectPopup`, `DeckSelectCinematic`, `ArmySelectCinematic`, `CosmicScreenLayout`, `CosmicArmyCard`, `slabHandoff`), galleria (`menu/gallery/*`), `src/components/cosmic/*`.
- **Campagna**: `src/components/campaign/` (Atto 1: `MissionPanel`, `EvolutionPanel`, `StartingArmySelection`, `RewardScreen`, `Rift`, `HudBar`, `MapNode`, `Edge`, `CampaignMapShell`, `EventModal`; `CampaignSaveSlots`), `src/styles/campaign/*`.
- **VS e scritte cinematiche del duello** (dal 5 novembre 2026, grassetto corsivo maiuscolo): `src/components/versus/duelVersusScreen.css` (TU/IA, alleati del 2v2, Eminenza, armata, lettere "VS") e `src/components/versus/VersusRoulette.jsx` (sorteggio); `src/styles/satze-duello-cosmo.css` (Round 5, Vittoria, Sconfitta).
- **Altro**: `Glossary.jsx`, `LoadingScreen.jsx`, schermata di caricamento iniziale in `index.html` (`#loading-initial`), `ErrorBoundary.jsx`, `FpsCounter.jsx`, tutorial, lobby multiplayer, dialoghi (`src/dialogue/satzeDialogue.*`), copertine mazzo (`deckCover.css`).

### Cinzel (display)

Riservato ai titoli grandi e scenici:

- **Menu cosmic**: stendardi e voci in `SatzeMenuPrototype.jsx` (Cinzel 900, maiuscolo), `CosmicBannerButton.jsx`, `CosmicScreenLayout.jsx`, `CosmicArmyCard.jsx`, `CosmicDeckCarousel.jsx`, `DeckSelectCinematic.jsx`, `DeckConfirmTransition.jsx`, `MenuScreenLayout.jsx`, `MenuCard.jsx`; `src/components/cosmic/DeckSelectCosmic.jsx` e `DeckPreviewCosmic.jsx`.
- **Vecchia animazione del Round 5**: `src/styles/satze-duello-animazioni.css` (classi `.r5`, `.win`, `.lose`). Oggi serve solo a preparare gli stili all'avvio (`WarmupStage.jsx`, `DuelLoadingOverlay.jsx`) e il giocatore non la vede: le scritte vere del Round 5, della Vittoria e della Sconfitta sono in Chakra Petch (vedi sopra).
- **Schermata VS**: solo il titolo sulla scatola del mazzo (`deckCover.css`), uguale alla scatola delle altre schermate.
- **Campagna**: `src/styles/campaign/campaign-scene.css`, `first-act.css`, `colors_and_type.css` e i componenti Atto 1 (`EventModal`, `RewardScreen`, `HudBar`, `EvolutionPanel`, `MissionPanel`, `StartingArmySelection`, `MapNode`, `Rift`).
- **Altro**: `src/components/cards/CardTagBadges.jsx`, `src/components/tutorial/Tutorial.jsx`, `src/components/layout/ToolPageShell.jsx` (titoli delle pagine strumento), `src/components/deckCover/deckCover.css`, `src/components/shuffle/ShuffleStylePreview.jsx`, `src/styles/satze-eminenza.css`, `src/styles/em-announce-vetro.css`.

### Share Tech Mono (mono)

Per numeri ed etichette "da terminale":

- **Duello**: contatori Focus Coin, tag dei callout dei passi, chip temporanee (`src/index.css`, classi `satze-focus-*` e `satze-step-callout__*`), `src/components/ui/FocusCoinSelector.jsx`, `src/components/battle/DuelClashAuroraSequence.jsx`, `Codice/satze.jsx`.
- **Menu e popup**: numerazione `01/02/03` e descrizioni delle chip in `DifficultySelectPopup.jsx`, poi `DeckSelectCinematic`, `ArmySelectCinematic`, `CosmicDeckCarousel`, `CosmicArmyCard`, `CosmicScreenLayout`, `OptionsScreen`, `MenuScreenLayout`, galleria (`GalleryPersonaShell`, `CardGallery`, `GalleryTabSwitcher`).
- **Campagna**: quasi tutti i componenti Atto 1 (`EvolutionPanel`, `HudBar`, `StartingArmySelection`, `RewardScreen`, `EventModal`, `MapNode`, `Rift`, `MissionPanel`, `Edge`, `CampaignMapShell`), `CampaignSaveSlots`, `CampaignAtto1Hub`.
- **Altro**: carte (`Card.jsx`, `CardPrototype.jsx`), `Glossary.jsx`, tutorial (`TutorialSteps`, `TutorialSelector`), `MultiplayerLobby.jsx`, `deckCover.css`, `duelVersusScreen.css`, `src/dialogue/satzeDialogue.js`.

## 3. Mappa della campagna (`prototipi/campagna-cael/`)

Dopo "Inizia il cammino" il gioco apre `prototipi/campagna-cael/index.html` dentro un riquadro (`src/components/campaign/CampaignPrototypeFrame.jsx`). È una pagina HTML separata, con i suoi font:

| Famiglia | Ruolo nella pagina | Come arriva |
|---|---|---|
| **Anton** | Titoli (`--f-disp`, `--f-display`): "Fino ai piedi di Cael", nomi delle tappe | Google Fonts (`index.html:4`) |
| **Barlow Condensed** | Testo (`--f-body`) | Google Fonts |
| **Archivo Black** | Scritte di forte impatto | Google Fonts |
| **Bodoni Moda** (corsivo 900) | Titoli scenici | Google Fonts |
| **Arcana** | Testi delle carte | `prototipi/campagna-cael/fonts/Arcana-Roman-Bold.woff` (`@font-face` in `index.html:720`) |
| Cinzel, Chakra Petch | Dettagli | Google Fonts (non usa le copie self-hosted del gioco) |

## 4. Font che compaiono solo nei laboratori di sviluppo

Non arrivano al giocatore in partita.

| Famiglia | Dove | Come arriva |
|---|---|---|
| Rajdhani, Barlow Condensed, Cormorant Garamond, EB Garamond, Libre Baskerville, Crimson Pro | `src/components/styleLab/` (`StyleLabPage.jsx`, `styleLab.css`, `styleLabShellStyles.js`) | `<link>` a Google Fonts in `StyleLabPage.jsx` |
| Lora (Semibold) | `src/components/cardFaceLab/ArcanaTextOverlay.jsx`, `arcanaLiveText.js` | `public/fonts/Lora-600.woff2` |
| AlfaDisplay / AlfaBody | `src/components/cardFaceLab/alfaCardRenderer.js`, `cardFaceLabData.js` | `public/fonts/alfa-*.otf` |

Le facce Arcana possono però apparire anche fuori dal lab, se una faccia alternativa viene scelta in galleria (`AltArtCardFace.jsx` → `ArcanaCardFace.jsx`). In quel caso entra in gioco anche Lora.

## 5. Ripieghi di sistema (non caricati)

- `body` in `index.html` e `src/index.css`: pila di sistema (`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', …`). Si vede solo dove un componente non imposta un font.
- `src/styles/satze-eminenza.css:636` (`.em-announce-text`): `'Segoe UI', 'Iowan Old Style', Georgia, serif`. È l'unico testo di gioco che non usa una delle tre famiglie.
- `Georgia, serif` e `'Times New Roman', serif` compaiono solo come ripiego dietro Cinzel.

## 6. Incongruenze notate (non corrette)

1. **Google Fonts ancora importato**: `src/styles/campaign/colors_and_type.css:10` fa `@import` da `fonts.googleapis.com`, anche se gli stessi font sono già self-hosted. Il file è importato da `CampaignSaveSlots.jsx:17`, che `Codice/satze.jsx` carica all'avvio: le richieste a Google partono a ogni avvio del gioco, non solo in campagna (verificato: 5 richieste prima di aprire qualsiasi schermata). Anche la mappa della campagna (§3) scarica tutti i suoi font da Google. Senza rete i testi ripiegano sui font di sistema.
2. **Costanti duplicate**: `GAME_CARD_UI_FONT` (`CardReworkP4.jsx:31`, `CardReworkP4AsHtml.jsx:10`), `EM_UI_FONT` (`EminenzaZone.jsx:48`) e `CAMPAIGN_FONTS.ui` (`src/campaign/campaignTheme.js:27`) hanno lo stesso valore di `HUD_ORATORIO_FONT_UI`, ma sono ridichiarate a mano invece di essere importate.
3. **Pile di ripiego diverse per lo stesso font**: Chakra Petch compare come `'Chakra Petch', sans-serif`, `'Chakra Petch', 'Segoe UI', sans-serif`, `'Chakra Petch', system-ui, sans-serif` e altre varianti. Cinzel compare con Georgia oppure con Times New Roman. In pratica non cambia nulla finché il font si carica.
4. **Due fonti per gli stessi token**: `--font-ui`, `--font-display` e `--font-mono` sono definiti sia in `src/styles/cosmic-tokens.css:68-70` sia in `src/styles/campaign/colors_and_type.css:81-83`. Oggi i valori coincidono.
5. **`.em-announce-text`** (`src/styles/satze-eminenza.css:636`, testo dell'annuncio dell'Eminenza durante il duello) usa `'Segoe UI', 'Iowan Old Style', Georgia, serif`: su Windows esce in Segoe UI, mentre tutto il resto dell'annuncio è in Chakra Petch e Cinzel. La pelle "Vetro" (`src/styles/em-announce-vetro.css`) non cambia il font.
