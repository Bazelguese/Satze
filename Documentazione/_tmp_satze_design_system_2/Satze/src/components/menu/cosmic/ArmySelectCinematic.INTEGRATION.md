# ArmySelectCinematic — Guida all'integrazione

Sostituisce la schermata **"Scegli la tua armata"** con la versione cinematic
basata su `explorations/Scegli la tua Armata · V3.html`.

## Cosa contiene

- `ArmySelectCinematic.jsx` — il componente. Stili scoped tramite prefisso `.asc-`.
- `armyLore.js` — **unico file da modificare** per i testi (lore, stile, keywords, stats).

## Cosa NON tocca (logica)

Legge dai data layer reali e non li altera:

- `ARMY_SETS` → conteggio carte
- `ARMY_DECKS` → conteggio eserciti
- `ARMY_BONUSES` → bonus mostrato
- `ARMY_COLORS` → accent color per armata
- `ARMY_ICONS` → ritratto in card
- `ARMY_GIFS` → background scenografico

## Come integrarlo

### 1. Importa il componente

```jsx
import ArmySelectCinematic from './components/menu/cosmic/ArmySelectCinematic';
```

### 2. Renderizza al posto della schermata attuale

```jsx
{screen === 'armySelect' && (
  <ArmySelectCinematic
    onSelect={(armyName) => {
      // armyName è il nome dell'armata scelta, oppure null per "Eserciti Misti"
      setSelectedArmy(armyName);          // tuo state esistente
      setScreen('deckSelect');            // o qualunque sia il prossimo step
    }}
    onBack={() => setScreen('mainMenu')}
  />
)}
```

### 3. Modificare i testi

Apri `armyLore.js` e modifica i campi `lore`, `style`, `keywords`, `stats`.
Non serve toccare il componente.

## Controlli utente

- **← / →** scorre tra le armate
- **Click su carta laterale** → centra quell'armata
- **Click su ticker (numerato in basso)** → salto diretto
- **Invio** o click su "SCHIERA" → conferma e chiama `onSelect`
- **Esc** → chiama `onBack`

## Asset richiesti (già presenti nel progetto)

- Font Google: Cinzel, Chakra Petch, Share Tech Mono
- `public/Immagini_bg/<armata>_bg1.png`
- Icone in `src/data/icons.jsx` → `ARMY_ICONS`

Nessuna nuova dipendenza npm.

## Note tecniche

- Z-index 1000 sul container (`.asc`) — sta sopra il resto.
- `position: fixed; inset: 0` — occupa l'intero viewport.
- Tutti gli stili sono in un `<style>` inline scoped con prefisso `.asc-`,
  quindi non c'è rischio di collisioni con Tailwind o altri CSS globali.
