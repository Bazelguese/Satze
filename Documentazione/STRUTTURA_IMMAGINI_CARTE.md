# Progetto: nuova struttura immagini carte

Obiettivo: eliminare il file `src/data/images.js` da ~178 MB (base64 inline) mantenendo la stessa API verso il resto del codice, così che il bundle JS resti piccolo e il caricamento del gioco sia veloce.

---

## 1. Situazione attuale

- **`src/data/images.js`**: esporta `CARD_IMAGES`, `AGENT_IMAGES` (oggetti chiave → stringa base64 WebP) e `getCardImageUrl(cardType, agentId)`.
- **Chiavi**:
  - `CARD_IMAGES`: tipi generici (`cosmic_hero`, `cosmic_mage`, `babel_king`, …).
  - `AGENT_IMAGES`: ID numerici agente (`101`, `102`, … `815`) mappati da `carte/Immagini/ID.png`.
- **Utilizzi**:
  - `CardImage.jsx`: `CARD_IMAGES[type]`, `AGENT_IMAGES[agentId]`.
  - `cardUtils.js`: `AGENT_IMAGES[agent.id]` per sapere se esiste un’immagine specifica.
  - `SatzeDeckBuilderPrototype.jsx`, `DeckSummaryCropTool.jsx`: `getCardImageUrl(type, agentId)`.
  - `src/data/index.js`: re-export di tutto da `./images`.
- **Script**: `scripts/update-card-images.js` legge PNG da `carte/Immagini/`, converte in base64 e scrive in `images.js` (solo la sezione AGENT_IMAGES).

Il problema è che tutto il contenuto base64 viene incluso nel modulo JS, con parsing e trasferimento molto pesanti.

---

## 2. Principio della nuova struttura

- Le **immagini restano file su disco** (PNG/WebP).
- Il **modulo immagini** espone solo **mappe chiave → path/URL** (stringhe corte) e `getCardImageUrl` che risolve su quei path.
- Stessa API pubblica: stessi nomi di export e stessa firma di `getCardImageUrl`, così non serve cambiare i componenti che li usano (a parte eventuali adattamenti minimi se si passa da data URL a URL).

---

## 3. Struttura directory proposta

```
Satze/
├── public/
│   └── card-images/
│       ├── types/                    # CARD_IMAGES (fallback per tipo)
│       │   ├── cosmic_hero.webp
│       │   ├── cosmic_mage.webp
│       │   ├── cosmic_spirit.webp
│       │   ├── babel_king.webp
│       │   └── ... (uno per chiave in CARD_IMAGES)
│       └── agents/                   # AGENT_IMAGES (una per agente)
│           ├── 101.webp
│           ├── 102.webp
│           └── ... (101–115, 201–215, … 801–815)
├── src/
│   └── data/
│       ├── images.js                 # NUOVO: solo path, ~pochi KB
│       └── ...
├── carte/
│   └── Immagini/                     # Fonte attuale (opzionale da mantenere)
│       ├── 101.png
│       └── ...
└── scripts/
    ├── update-card-images.js         # da adattare (vedi sotto)
    └── extract-images-to-public.js   # NUOVO: una tantum base64 → file
```

- **`public/`**: in Vite/Electron i file in `public` sono serviti per path assoluti (es. `/card-images/agents/101.webp`). Nessun impatto sul bundle.
- **`card-images/types/`**: una cartella per le chiavi di `CARD_IMAGES` (tipi generici).
- **`card-images/agents/`**: una cartella per gli ID numerici di `AGENT_IMAGES`; naming `ID.webp` (o `ID.png` se preferisci restare in PNG) per allinearsi allo script esistente e a `carte/Immagini`.

Alternativa: tenere una sola cartella `public/card-images/` con convenzione `types/<key>.webp` e `agents/<id>.webp` (come sopra, solo senza sottocartelle se non vuoi).

---

## 4. Nuovo modulo `src/data/images.js`

Il file deve essere piccolo e contenere solo:

- **Base URL**: per dev (Vite) e build (Electron con `base: './'`) usare path assoluti da root app, es. `/card-images/` in dev e `./card-images/` in build. Vite gestisce `base`; in Electron i file in `public` finiscono in `dist` quindi `./card-images/...` funziona.

- **Mappe path** (non base64):
  - `CARD_IMAGE_PATHS`: `{ cosmic_hero: '/card-images/types/cosmic_hero.webp', ... }`.
  - `AGENT_IMAGE_PATHS`: `{ '101': '/card-images/agents/101.webp', ... }` (chiavi stringa numeriche per compatibilità con `agent.id`).

- **Stessa API pubblica** (per non toccare i consumer):
  - `CARD_IMAGES = CARD_IMAGE_PATHS` (o comunque `CARD_IMAGES[key]` = URL string).
  - `AGENT_IMAGES = AGENT_IMAGE_PATHS` (stesso discorso).
  - `getCardImageUrl(cardType, agentId)`:
    - se `agentId` e `AGENT_IMAGES[agentId]` esistono → ritorna `AGENT_IMAGES[agentId]` (path/URL);
    - altrimenti ritorna `CARD_IMAGES[cardType] || null`.

- **Resolve URL a runtime**: con `base: './'` (Electron) le stringhe possono essere `./card-images/types/...` e `./card-images/agents/...`. Se in qualche contesto servisse URL assoluto, si può usare `new URL(path, import.meta.url)` solo per i path relativi al modulo, oppure un helper che prepende `window.location.origin` in dev; per `<img src={url}>` di solito path relativi alla root dell’app bastano.

Esempio scheletro (le mappe vanno generate o copiate dalla lista attuale di chiavi):

```js
// src/data/images.js - Solo path, nessun base64

const BASE = import.meta.env.BASE_URL || '/';  // '/' in dev, './' in build Electron

export const CARD_IMAGE_PATHS = {
  cosmic_hero: `${BASE}card-images/types/cosmic_hero.webp`,
  cosmic_mage: `${BASE}card-images/types/cosmic_mage.webp`,
  // ... tutte le chiavi attuali di CARD_IMAGES
};

export const AGENT_IMAGE_PATHS = {
  '101': `${BASE}card-images/agents/101.webp`,
  '102': `${BASE}card-images/agents/102.webp`,
  // ... tutti gli ID (generabili da script)
};

// API invariata per i componenti
export const CARD_IMAGES = CARD_IMAGE_PATHS;
export const AGENT_IMAGES = AGENT_IMAGE_PATHS;

export function getCardImageUrl(cardType, agentId = null) {
  if (agentId != null && AGENT_IMAGE_PATHS[String(agentId)]) {
    return AGENT_IMAGE_PATHS[String(agentId)];
  }
  return CARD_IMAGE_PATHS[cardType] || null;
}
```

- `cardUtils.js` continua a usare `AGENT_IMAGES[agent.id]` (valore sarà una stringa URL invece che base64); va bene per truthy check e per `<img src={...}>`.
- `CardImage.jsx` idem: `imageUrl` diventa un URL invece di data URL, nessun cambiamento di logica.

---

## 5. Generazione delle mappe e dei file

- **Elenco chiavi**: le chiavi di `CARD_IMAGES` e `AGENT_IMAGES` sono note (da codice e da `update-card-images.js`: 101–115, 201–215, …). Si può:
  - estrarle dal vecchio `images.js` con uno script una tantum, oppure
  - definire liste esplicite in uno script (es. `scripts/image-manifest.js`) e generare `CARD_IMAGE_PATHS` / `AGENT_IMAGE_PATHS` in build o a mano.

- **Script una tantum `extract-images-to-public.js`** (da eseguire una volta):
  - Legge l’attuale `src/data/images.js` (o una copia).
  - Per ogni entry in `CARD_IMAGES`: estrae il base64, decodifica, scrive `public/card-images/types/<key>.webp`.
  - Per ogni entry in `AGENT_IMAGES`: idem → `public/card-images/agents/<id>.webp`.
  - Poi si sostituisce il contenuto di `src/data/images.js` con il modulo “solo path” sopra (generando le mappe da chiavi/id usati).

- **Script `update-card-images.js` (adattato)**:
  - Invece di scrivere base64 in `images.js`, deve:
    - leggere i PNG (o WebP) da `carte/Immagini/`,
    - copiarli (o convertirli) in `public/card-images/agents/<id>.webp`,
    - aggiornare solo la lista degli ID in `src/data/images.js` se serve (es. se aggiungi nuove carte), senza toccare dati binari nel JS.
  - La mappa `AGENT_IMAGE_PATHS` può essere generata dinamicamente (es. range 101–115, 201–215, …) così un solo script tiene in sync ID e file.

---

## 6. Cosa non si tocca (come da richiesta)

- **Preload**: nessuna modifica a `preloadAllAssets` o alla lista in `getAssetUrls()`.
- **Tempo minimo di loading**: nessuna modifica a `MIN_LOADING_DISPLAY_MS` o alla logica di “ready” in `App.jsx`.

Eventualmente in un secondo momento si potrà:
- aggiungere gli URL di `card-images` al preload se si vogliono precaricare le carte,
- oppure lasciare che le immagini si carichino on-demand quando compaiono in mano/campo.

---

## 7. Vantaggi

- **Bundle**: `src/data/images.js` passa da ~178 MB a pochi KB; il parsing e il download del JS si riducono drasticamente.
- **Caricamento**: il gioco diventa utilizzabile molto prima; le immagini vengono caricate come risorse normali (o in preload futuro).
- **Cache**: il browser (e Electron) può cachare i file immagine per path.
- **Pipeline**: aggiornare una carta = sostituire un file in `public/card-images/` e, se serve, aggiornare la lista ID nello script; niente riscrittura di un file JS gigante.
- **Compatibilità**: stessi export e stessa `getCardImageUrl`, quindi modifiche minime (o nulle) in `CardImage.jsx`, `cardUtils.js`, deck builder, crop tool e `src/data/index.js`.

---

## 8. Passi di implementazione suggeriti

1. **Creare la struttura**  
   `public/card-images/types/` e `public/card-images/agents/`.

2. **Script `extract-images-to-public.js`**  
   Legge il vecchio `images.js`, estrae base64 per `CARD_IMAGES` e `AGENT_IMAGES`, scrive i file in `public/card-images/`. Opzionale: generare un `image-manifest.json` (lista chiavi e id) per generare le mappe.

3. **Sostituire `src/data/images.js`**  
   Con il modulo “solo path” che espone `CARD_IMAGES`, `AGENT_IMAGES` e `getCardImageUrl` come sopra. Le mappe possono essere generate dallo script (lettura chiavi dal vecchio file) o da un manifest.

4. **Verificare**  
   Avviare il gioco (dev e build Electron), controllare che tutte le carte e gli agenti mostrino l’immagine (path corretti e base URL corretta per Electron).

5. **Adattare `update-card-images.js`**  
   Da “scrivi base64 in images.js” a “copia/converti file in public/card-images/agents/ e aggiorna eventuale lista ID nel modulo immagini”.

6. **Rimuovere** (opzionale) il vecchio backup di `images.js` con base64, dopo aver verificato che tutto funziona.

---

## 9. Implementazione completata

- **Cartelle**: `public/card-images/types/` e `public/card-images/agents/` create.
- **Script `scripts/extract-images-to-public.js`**: legge un file `images.js` (o backup) con base64, estrae le immagini e le scrive in `public/card-images/`. Per estrarre dal backup:  
  `node scripts/extract-images-to-public.js src/data/images.js.backup`
- **`src/data/images.js`**: sostituito con la versione solo path; stesso export (`CARD_IMAGES`, `AGENT_IMAGES`, `getCardImageUrl`). Il vecchio file è stato rinominato in `src/data/images.js.backup`.
- **Script `scripts/update-card-images.js`**: non modifica più `images.js`; copia i file da `carte/Immagini/` in `public/card-images/agents/` (destinazione sempre `ID.png`).

Dopo l’estrazione, il build è molto più veloce e il bundle non include più le immagini inline.
