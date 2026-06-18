# 📦 Cosmic — DeckSelect "DUELLO IMMINENTE"

Layout pre-duello completo: header con `· DUELLO IMMINENTE ·` e avversario, carosello 3D mazzi (centrale ingrandito + frecce + dots), pannello dettagli a destra (POT/DAN/CARTE/WIN-RATE, curva lega, trigger, ANTEPRIMA/MODIFICA), pulsante `SCHIERA MAZZO ›`, footer marquee animato. Stile cosmic identico al builder.

## CONTENUTO
- `DeckSelectCosmic.jsx` — componente con **props reali** (no più dati demo)
- `cosmic-tokens.css` — token CSS (probabilmente già presente in `Satze/src/styles/cosmic-tokens.css`)

---

## 🎯 ISTRUZIONI PER CURSOR

### Step 1 — Copia file
```
delivery/cosmic-deckselect/DeckSelectCosmic.jsx  →  Satze/src/components/cosmic/DeckSelectCosmic.jsx
```
Il file `cosmic-tokens.css` è **già presente** in `Satze/src/styles/cosmic-tokens.css` — non sovrascriverlo. Se mancano i keyframes `pulse-glow` e `data-marquee`, aggiungili in coda:

```css
@keyframes pulse-glow { 0%,100% { filter: drop-shadow(0 0 8px currentColor) } 50% { filter: drop-shadow(0 0 18px currentColor) } }
@keyframes data-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
```

### Step 2 — Import in `Satze/Codice/satze.jsx`
Aggiungi accanto agli altri import cosmic (riga ~32):
```jsx
import DeckSelectCosmic from '../src/components/cosmic/DeckSelectCosmic.jsx';
```

### Step 3 — Sostituisci il blocco `gamePhase === 'selectDeck'`

Trova il blocco a **riga ~1955** di `Satze/Codice/satze.jsx`:
```jsx
if (gamePhase === 'selectDeck' && selectedArmy) {
  const isMixedMode = selectedArmy === MIXED_DECKS_OPTION;
  const colors = isMixedMode ? { accent: MIXED_DECKS_COLOR } : ARMY_COLORS[selectedArmy];
  const customDecks = loadCustomDecks();
  // ... ~370 righe di logica ...
}
```

**NON cancellare la logica di calcolo `deckOptions`** (serve per `predefinedDecks`, `customDecksForArmy`, `figliCampaignDeckOk`, `campaignHubDeckOnly`). 

Aggiungi **prima del `return` finale** (cioè prima di `if (useMenuCosmic) {`) una mappatura `deckOptions → cosmicDecks` e un nuovo branch:

```jsx
// === COSMIC DECK SELECT (DUELLO IMMINENTE) ===
const useCosmicDeckSelect = true; // toggle se vuoi mantenere fallback

if (useCosmicDeckSelect && deckOptions.length > 0 && !campaignHubDeckOnly) {
  // Mappa deckOptions → formato richiesto da DeckSelectCosmic
  const cosmicDecks = deckOptions.map((opt, i) => {
    // recupera il vero deck per stats
    let deckCards = [];
    let totalLeague = 0;
    let cardsCount = 0;
    let leadImg = '';

    if (opt.key === 'campaign_figli') {
      cardsCount = campDeckIds.length;
      totalLeague = totalLeagueForCampaignDeck(campDeckIds, "Figli dell'Orizzonte");
    } else if (opt.key.startsWith('custom_')) {
      const id = opt.key.replace('custom_', '');
      const deck = customDecks[id];
      deckCards = isMixedMode ? resolveDeckCards(deck, ARMY_SETS) : ARMY_SETS[selectedArmy].filter(c => deck.cards.includes(c.id));
      totalLeague = deckCards.reduce((s, c) => s + c.league, 0);
      cardsCount = deck.cards.length;
      leadImg = deckCards[0]?.image || '';
    } else {
      const deck = predefinedDecks[opt.key];
      deckCards = ARMY_SETS[selectedArmy].filter(c => deck.cards.includes(c.id));
      totalLeague = deckCards.reduce((s, c) => s + c.league, 0);
      cardsCount = deckCards.length;
      leadImg = deckCards.sort((a,b) => b.league - a.league)[0]?.image || '';
    }

    const potAvg = deckCards.length ? deckCards.reduce((s, c) => s + (c.power || 0), 0) / deckCards.length : 0;
    const danAvg = deckCards.length ? deckCards.reduce((s, c) => s + (c.damage || 0), 0) / deckCards.length : 0;

    // Curva lega: bucket 1-5+
    const curve = [0, 0, 0, 0, 0];
    deckCards.forEach(c => {
      const idx = Math.min(Math.max((c.league || 1) - 1, 0), 4);
      curve[idx]++;
    });

    const warning =
      cardsCount < 3 ? `${3 - cardsCount} carte mancanti` :
      totalLeague > 30 ? `Lega ${totalLeague}/30 superata` :
      null;

    return {
      id: opt.key,
      name: opt.name,
      fac: (opt.armyLabel || selectedArmy || '').toUpperCase(),
      sigil: '◈',
      cards: cardsCount,
      lega: totalLeague,
      pot: Number(potAvg.toFixed(1)),
      dan: Number(danAvg.toFixed(1)),
      win: 0, // se hai win-rate da statistiche, popolalo qui
      lead: leadImg,
      curve,
      warning,
      _opt: opt, // riferimento originale per il callback
    };
  });

  // Avversario: per ora placeholder, popolare con dati reali se disponibili
  const opponent = campaignLevel ? {
    name: campaignLevel.enemyName || 'AVVERSARIO',
    faction: campaignLevel.enemyArmy || '',
    level: campaignLevel.level || '—',
    sigil: 'X',
  } : { name: 'IA', faction: 'AVVERSARIO', level: '—', sigil: 'X' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#06030a' }}>
      <DeckSelectCosmic
        decks={cosmicDecks}
        opponent={opponent}
        mapName={campaignLevel?.mapName || 'PIANE DEL DEBITO'}
        mode={selectedMode === 'campaign' ? 'CAMPAGNA' : selectedMode === 'multiplayer' ? 'MULTIPLAYER' : 'DUELLO 1v1'}
        onBack={() => { setSelectedArmy(null); setGamePhase('selectArmy'); }}
        onSelectDeck={(deck) => deck._opt.onSelect()}
        onEditDeck={(deck) => {
          if (deck.id.startsWith('custom_')) {
            setEditingDeckId(deck.id.replace('custom_', ''));
            setDeckManagerSource('selectDeck');
            setDeckManagerView('edit');
            setShowDeckManager(true);
          }
        }}
        // onPreviewDeck={(deck) => { /* opzionale */ }}
      />
    </div>
  );
}
```

Lascia il blocco `if (useMenuCosmic) { ... }` e il fallback originale come **fallback** (verranno usati se `useCosmicDeckSelect = false`).

### Step 4 — Verifica
1. `npm run dev` (o lo script che usi)
2. Menu → GIOCA VS IA → seleziona un'armata → dovresti vedere il nuovo schermo "DUELLO IMMINENTE"
3. Frecce ‹ › / dots / click sulle card laterali per cambiare mazzo
4. `← INDIETRO` torna a selectArmy
5. `SCHIERA MAZZO ›` chiama `goAfterDeckSelection()` (selectDifficulty o selectField)
6. `✎ MODIFICA` apre il DeckManager in modalità edit (solo per custom)

---

## 📋 FORMA DATI ATTESA DA `DeckSelectCosmic`

```ts
type Deck = {
  id: string;
  name: string;
  fac: string;        // fazione, es. "KETHRAN"
  sigil: string;      // glifo es. "◈"
  cards: number;      // numero carte
  lega: number;       // lega totale
  pot: number;        // potenza media
  dan: number;        // danno medio
  win: number;        // win-rate %
  lead: string;       // url immagine carta leader
  curve?: number[];   // 5 valori (lega 1..5+)
  triggers?: { n: string; v: number; c?: string }[]; // max 4
  warning?: string | null;
  favorite?: boolean;
  _opt?: any;         // ref originale per callback
};

type Opponent = { name: string; faction: string; level?: string|number; sigil?: string };
```

## ⚠️ VINCOLI
- NON toccare la logica di `selectedArmy`/`selectedDeckKey`/flow `selectArmy → selectDeck → selectDifficulty → selectField → battle`
- Il pulsante `SCHIERA MAZZO ›` è **disabilitato** se `cur.warning` è popolato
- Tieni il fallback `useMenuCosmic` come piano B

## 📐 NOTE STILE
Il componente include già: bg radial + halftone + giant text "SCHIERA", corner brackets magenta, footer marquee animato, animazione `pulse-glow` sul badge "● SELEZIONATO". Richiede i keyframes `pulse-glow` e `data-marquee` (Step 1).
