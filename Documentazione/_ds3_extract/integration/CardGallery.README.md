# Integrazione — Galleria degli Agenti (CardGallery)

Schermata **"Galleria delle carte"** (indice sfogliabile, non un carosello) — mostra
le carte nel layout ufficiale **sashNameHud** (`CardReworkP4`), con filtro per armata
e lightbox al click. È pura consultazione, nessuna fase di conferma.

> I file hanno suffisso `.txt` solo per non essere compilati qui: **togli il `.txt`** dopo il download.

## File

| Scarica | togli `.txt` → | metti nel repo a |
|---|---|---|
| `src/components/menu/gallery/CardGallery.jsx.txt` | `.jsx` | `src/components/menu/gallery/CardGallery.jsx` |
| `src/components/menu/gallery/cardGalleryDemoData.js.txt` | `.js` | `src/components/menu/gallery/cardGalleryDemoData.js` *(temporaneo — vedi sotto)* |

## ⚠️ Dati stub — passo obbligatorio prima di integrare

`cardGalleryDemoData.js` contiene **12 carte con nome/POT/DAN inventati** — un
campione per collaudare il layout, non le tue ~120 carte reali (`src/data/cards.js`,
invariato). Prima di mettere in produzione, apri `CardGallery.jsx` e sostituisci
`buildCards()` con un adapter sui tuoi dati veri:

```js
import { ARMY_SETS } from '../../../data/cards.js'; // o dove vivono le tue carte reali

function buildCards() {
  return Object.values(ARMY_SETS).flat().map((c) => ({
    id: c.id,
    army: c.army,
    accent: (ARMY_COLORS[c.army] || {}).accent || '#94a3b8',
    glyph: (ARMY_LORE[c.army] || {}).glyph || '◈',
    name: c.name,             // il tuo nome carta reale
    pot: c.pot,                // il tuo POT reale
    dan: c.dan,                // il tuo DAN reale
    ability: c.ability,        // la tua abilità reale (★ POTERE)
    bonus: ARMY_BONUSES[c.army] || '—',
    img: c.img,                 // il tuo path reale (public/card-images/...)
    league: c.league ?? 1,
  }));
}
```

Una volta scritto l'adapter, cancella `cardGalleryDemoData.js` — non serve più.

## Integrazione

```jsx
import CardGallery from './components/menu/gallery/CardGallery';

{screen === 'cardGallery' && (
  <CardGallery onBack={() => setScreen('menu')} />
)}
```

Renderla a livello di routing (è `position: fixed; inset: 0; z-index: 1000`), **non** dentro
`CosmicScreenLayout` o altri wrapper.

## Comportamento

- Filtri per armata in alto (TUTTE + una chip per armata) — click per restringere la griglia.
- Griglia di carte in miniatura, layout `sashNameHud` (fascia rune, cerchi POT/DAN, barra armata).
- Click su una carta → lightbox ingrandita con abilità (★ POTERE) e bonus d'armata reale (✠ BONUS).

## Controlli

- **click chip armata** filtra · **click carta** apre il lightbox · **click fuori / ✕** chiude

## Note tecniche

- Nessuna dipendenza npm nuova. Stili inline scoped `.cgl-`.
- Font: Cinzel, Chakra Petch, Share Tech Mono. Layout carta identico a `CardReworkP4` (sashNameHud).
- Scala a qualsiasi numero di carte (griglia responsive, non un carosello a lista fissa).
