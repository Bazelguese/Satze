# Integrazione — Galleria dei Campi (GalleryCinematic)

Schermata **"Galleria"** (consultazione campi di battaglia) in stile cinematic,
gemella di `ArmySelectCinematic` / `DeckSelectCinematic` — stesso HUD, stessa
tipografia — ma senza fasi di conferma: è pura consultazione.

> I file hanno suffisso `.txt` solo per non essere compilati qui: **togli il `.txt`** dopo il download.

## File

| Scarica | togli `.txt` → | metti nel repo a |
|---|---|---|
| `src/components/menu/gallery/GalleryCinematic.jsx.txt` | `.jsx` | `src/components/menu/gallery/GalleryCinematic.jsx` |
| `src/components/menu/gallery/galleryDemoFields.js.txt` | `.js` | `src/components/menu/gallery/galleryDemoFields.js` *(temporaneo — vedi sotto)* |
| `src/components/gallery/BattlefieldRevealAnimations.jsx.txt` | `.jsx` | `src/components/gallery/BattlefieldRevealAnimations.jsx` *(salta se già presente dal pacchetto reveal-animations)* |

## ⚠️ Dati stub — passo obbligatorio prima di integrare

`galleryDemoFields.js` è un **campione di 10 voci** (un campo per tema d'armata),
**non** i tuoi 83 campi reali (`src/data/battlefields.js`, invariato). Prima di
mettere in produzione, apri `GalleryCinematic.jsx` e sostituisci `buildFields()`
con un adapter sui tuoi dati veri:

```js
import { ALL_BATTLEFIELDS, getBattlefieldAnimationType } from '../../../data/battlefields.js';
import { ARMY_COLORS } from '../../../data/armies.js';
import { ARMY_LORE } from '../cosmic/armyLore.js';

function buildFields() {
  return ALL_BATTLEFIELDS.map((f, i) => ({
    id: i + 1,
    army: f.tema,
    accent: (ARMY_COLORS[f.tema] || {}).accent || '#94a3b8',
    glyph: (ARMY_LORE[f.tema] || {}).glyph || '◈',
    anim: getBattlefieldAnimationType(f.id),
    img: f.bgImage,          // il tuo path reale (public/campi_bg/...)
    category: f.category,    // se il tuo schema ha una categoria d'effetto
    catLabel: ...,           // mappa alla tua etichetta reale
    catDesc: ...,            // mappa alla tua rules-text reale
  }));
}
```

Una volta scritto l'adapter, cancella `galleryDemoFields.js` — non serve più.

## Integrazione

```jsx
import GalleryCinematic from './components/menu/gallery/GalleryCinematic';

{screen === 'gallery' && (
  <GalleryCinematic onBack={() => setScreen('menu')} />
)}
```

Renderla a livello di routing (è `position: fixed; inset: 0; z-index: 1000`), **non** dentro
`CosmicScreenLayout` o altri wrapper.

## Comportamento

- Viewer centrale con l'animazione reveal reale del campo selezionato (10 reveal —
  `BattlefieldReveal`, condiviso col reveal in partita).
- Ticker in basso con tutti i campi mostrati: click per saltare, replay automatico.
- Pulsante **↻ RIGIOCA** per ripetere l'animazione senza cambiare campo.
- Nessuna fase di conferma: è consultazione, non una scelta.

## Controlli

- **← / →** sfoglia · **click su un chip del ticker** salta diretto · **R** rigioca
- **Esc** → `onBack`

## Note tecniche

- Nessuna dipendenza npm nuova. Stili inline scoped `.glc-`.
- Font: Cinzel, Chakra Petch, Share Tech Mono (già usati dalle altre schermate cinematic).
- Rispetta `prefers-reduced-motion` (il reveal usa il fallback rapido di `BattlefieldReveal`).
