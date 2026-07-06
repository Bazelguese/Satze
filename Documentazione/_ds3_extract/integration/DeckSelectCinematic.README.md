# Integrazione — Scelta Esercito (DeckSelectCinematic)

Schermata **"Scegli l'esercito"** (scelta mazzo) in stile P5/cinematic, gemella di
`ArmySelectCinematic`. Da mostrare **dopo** la scelta armata.

> I file hanno suffisso `.txt` solo per non essere compilati qui: **togli il `.txt`** dopo il download.

## File

| Scarica | togli `.txt` → | metti nel repo a |
|---|---|---|
| `src/components/menu/cosmic/DeckSelectCinematic.jsx.txt` | `.jsx` | `src/components/menu/cosmic/DeckSelectCinematic.jsx` |
| `src/components/menu/cosmic/deckLore.js.txt` | `.js` | `src/components/menu/cosmic/deckLore.js` |

Nessuna modifica ai tuoi `data/armies.js` / `data/cards.js` — legge solo le forme già
esistenti (`ARMY_COLORS[army].accent`, `ARMY_BONUSES[army]`, `ARMY_GIFS[army]`, `ARMY_DECKS`).

## Cosa legge (logica invariata)

- `ARMY_DECKS` (`data/cards.js`) → eserciti per armata + conteggio carte
- `ARMY_COLORS` / `ARMY_BONUSES` / `ARMY_GIFS` (`data/armies.js`) → accent, bonus, sfondo
- `deckLore.js` → **unico file editabile**: nome/archetipo/flavor/keyword/stats/leader per mazzo

## Integrazione

```jsx
import DeckSelectCinematic from './components/menu/cosmic/DeckSelectCinematic';

{screen === 'deckSelect' && (
  <DeckSelectCinematic
    armyName={selectedArmy}          // stringa nome armata, oppure null = Eserciti Misti
    onSelectDeck={(deckKey) => {
      // deckKey è la chiave di ARMY_DECKS[armata] (es. "kethran-aggro").
      // Per i misti (armyName null) ha forma "<armySlug>::<key>".
      setSelectedDeck(deckKey);
      setScreen('duel');             // o il prossimo step
    }}
    onBack={() => setScreen('armySelect')}
  />
)}
```

Renderla a livello di routing (è `position: fixed; inset: 0; z-index: 1000`), **non** dentro
`CosmicScreenLayout` o altri wrapper.

## Comportamento

- Carosello 3D cinematico: i mazzi **scorrono** tra le posizioni (la carta attiva è grande e
  ricca di effetti; quelle laterali sono semplici, ruotate e sfocate).
- Scala fino a **N mazzi** (testato ~20): wrap circolare, frecce ‹ ›, e pager che diventa
  compatto (`X/Y` + barra) oltre 12 mazzi.
- Solo la carta attiva mostra le animazioni (rune fluttuanti, scintille, scan, holo, sigillo,
  burst all'attivazione, stat con sweep).

## Controlli

- **← / →** scorre · **click su carta laterale** la centra · **click sui pallini/pager** salto diretto
- **Invio** o **SCHIERA** → conferma e chiama `onSelectDeck`
- **Esc** → `onBack`

## Testi

Apri `deckLore.js` e modifica `name`, `archetype` (`"RUOLO · TRIGGER"`), `flavor`, `keywords`,
`stats { pot, dan, vaImpact, fc }`, `leader { name, title, img, league, power, damage, ability }`.
`leader.img` può puntare a un ritratto in `public/` (es. `/Immagini/leader_x.png`); se `null`,
usa il glifo d'armata come fallback. `__glyph` imposta il glifo di fallback per l'intera armata.

> Le chiavi mazzo in `deckLore.js` **devono combaciare** con quelle di `ARMY_DECKS`
> (nel codebase compatto sono `<slug>-aggro` / `<slug>-controllo`). Aggiungine quante ne servono
> per armata: la UI scala da sola.

## Note tecniche

- Nessuna dipendenza npm nuova. Stili inline scoped `.dsk-` (nessuna collisione con Tailwind).
- Font: Cinzel, Chakra Petch, Share Tech Mono (già usati da `ArmySelectCinematic`).
- Rispetta `prefers-reduced-motion` (anima quasi nulla in quel caso).
- Fallback grazioso se `ARMY_DECKS[armata]` è vuoto ("Nessun esercito disponibile").
