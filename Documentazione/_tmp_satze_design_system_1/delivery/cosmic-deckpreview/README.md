# 📦 Cosmic — DeckPreview "Anteprima Mazzo"

Schermata standard 1920×1080 per visualizzare un mazzo (10 carte) prima della scelta o modifica.

## CONTENUTO
- `DeckPreviewCosmic.jsx` — componente React con props reali
- `cosmic-tokens.css` — già presente in `Satze/src/styles/cosmic-tokens.css` (non sovrascrivere)

## LAYOUT (1920×1080)
- **Header** (110px): bottone INDIETRO, sigillo armata + nome mazzo + fazione + carte/lega, mini-stats (LEGA / POT MED / DAN MED)
- **Main**: griglia **5×2** carte (220×320 ciascuna) con badge ordinale **01-10** + side-panel destra (420px) con dettagli carta selezionata (portrait, POT/DAN grandi, POT/BON, flavor)
- **Click su carta** → highlight (ring magenta + scale-up + badge HEAT) + side-panel aggiornato
- **Footer** (90px): legenda + `✎ MODIFICA` + `SCHIERA MAZZO ›`
- Background nebula + halftone + giant text "ARMATA" + corner brackets

---

## 🎯 INTEGRAZIONE in Satze

### Step 1 — Copia file
```
delivery/cosmic-deckpreview/DeckPreviewCosmic.jsx
  →  Satze/src/components/cosmic/DeckPreviewCosmic.jsx
```

### Step 2 — Import in `Satze/Codice/satze.jsx` (riga ~32)
```jsx
import DeckPreviewCosmic from '../src/components/cosmic/DeckPreviewCosmic.jsx';
```

### Step 3 — Aggiungi una nuova `gamePhase === 'previewDeck'`

Aggiungi prima del blocco `gamePhase === 'selectDifficulty'` (~riga 2434):

```jsx
if (gamePhase === 'previewDeck' && previewDeckData) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#06030a' }}>
      <DeckPreviewCosmic
        deck={previewDeckData}
        onBack={() => { setPreviewDeckData(null); setGamePhase('selectDeck'); }}
        onEdit={(d) => {
          setPreviewDeckData(null);
          if (d.id && d.id.startsWith('custom_')) {
            setEditingDeckId(d.id.replace('custom_', ''));
            setDeckManagerSource('selectDeck');
            setDeckManagerView('edit');
            setShowDeckManager(true);
            setGamePhase('deckManager');
          }
        }}
        onConfirm={(d) => {
          setPreviewDeckData(null);
          setSelectedDeckKey(d.id);
          setGamePhase(selectedMode === 'multiplayer' ? 'onlineDeckReady' : 'selectDifficulty');
        }}
      />
    </div>
  );
}
```

Aggiungi `previewDeckData` allo state globale (vicino a `selectedDeckKey`):
```jsx
const [previewDeckData, setPreviewDeckData] = useState(null);
```

### Step 4 — Aggancia il pulsante "👁 ANTEPRIMA" del DeckSelectCosmic
Dove istanziavi `DeckSelectCosmic`, aggiungi `onPreviewDeck`:

```jsx
<DeckSelectCosmic
  // ... props esistenti ...
  onPreviewDeck={(deck) => {
    // costruisci il payload completo
    setPreviewDeckData(buildDeckPreviewPayload(deck._opt));
    setGamePhase('previewDeck');
  }}
/>
```

Helper:
```jsx
function buildDeckPreviewPayload(opt) {
  // recupera carte reali dal mazzo selezionato
  let deckCards = [];
  if (opt.key.startsWith('custom_')) {
    const id = opt.key.replace('custom_', '');
    const deck = loadCustomDecks()[id];
    deckCards = isMixedDeck(deck, ARMY_SETS)
      ? resolveDeckCards(deck, ARMY_SETS)
      : ARMY_SETS[selectedArmy].filter(c => deck.cards.includes(c.id));
  } else if (opt.key === 'campaign_figli') {
    deckCards = ARMY_SETS["Figli dell'Orizzonte"].filter(c => campDeckIds.includes(c.id));
  } else {
    const deck = ARMY_DECKS[selectedArmy][opt.key];
    deckCards = ARMY_SETS[selectedArmy].filter(c => deck.cards.includes(c.id));
  }

  return {
    id: opt.key,
    name: opt.name,
    army: selectedArmy,
    sigil: ARMY_SIGILS?.[selectedArmy] || '◈',
    accentColor: ARMY_COLORS[selectedArmy]?.accent || '#fbbf24',
    cards: deckCards.map(c => ({
      id: c.id,
      name: c.name,
      lega: c.league,
      pot: c.power,
      dan: c.damage,
      power: c.powerEffect || '—',
      bonus: c.bonusEffect || '—',
      portrait: c.id, // o c.image
      flavor: c.flavor || '',
    })),
  };
}
```

---

## 📋 FORMA DATI ATTESA

```ts
type Card = {
  id: string|number;
  name: string;
  lega: number;
  pot: number;
  dan: number;
  power: string;       // testo abilità POT
  bonus: string;       // testo abilità BON
  portrait?: string;   // id immagine (img cercata in ../assets/cards/{portrait}.png)
  flavor?: string;
};

type Deck = {
  name: string;
  army: string;
  sigil?: string;       // glifo armata (◈ ✧ ⊕ ◇ ⛰ ...)
  accentColor?: string; // hex armata
  cards: Card[];        // 1..10
};
```

## ⚠️ NOTE
- Il path immagini carte (`../assets/cards/{portrait}.png`) è relativo al componente; modifica in base alla struttura `Satze/public/card-images/`
- La griglia è fissa 5×2 (max 10 carte). Se il mazzo ne ha meno, i posti restano vuoti.
- Click su carta = highlight + side-panel; non c'è altro stato persistente
- Side-panel è sempre visibile (con messaggio "SELEZIONA UNA CARTA" se non c'è selezione iniziale)
