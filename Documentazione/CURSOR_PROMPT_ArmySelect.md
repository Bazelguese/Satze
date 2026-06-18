# Integrazione "Scegli la tua Armata" — V3 Cinematica

## ⚠️ NON INTERPRETARE. SOLO COLLEGARE.

Il componente `ArmySelectCinematic.jsx` è la **trasposizione 1:1** del design V3 approvato. Il tuo lavoro è UNICAMENTE collegarlo al routing del gioco. **NON modificare** stili, struttura JSX, classi CSS, animazioni, layout. Se sei tentato di "migliorare" qualcosa, FERMATI.

---

## File già pronti (NON toccarli)

- `src/components/menu/cosmic/ArmySelectCinematic.jsx` — il componente
- `src/components/menu/cosmic/armyLore.js` — testi (lore/style/keywords/stats per ogni armata)

L'unico file che il game designer potrà modificare in futuro è `armyLore.js`.

---

## ISTRUZIONI

### 1. Trova dove viene attualmente renderizzata la schermata "SCEGLI LA TUA ARMATA"

È la griglia 4×3 con 11 card (Eserciti Misti, Figli dell'Orizzonte, Kethran, Corte Rossa, Calibri Pesanti, Orathai, Mounthborn, L'Enclave delle Scaglie, Ratti della Megera, Patto degli Indocili, Khemet) e il bottone "TORNA AL MENU".

Cerca nei sorgenti la stringa `SCEGLI LA TUA ARMATA` o un componente che mappa `Object.keys(ARMY_SETS)` per renderizzare card di selezione armata.

### 2. Sostituisci IL SOLO blocco di rendering della schermata

```jsx
// In cima al file:
import ArmySelectCinematic from './components/menu/cosmic/ArmySelectCinematic';
//          ^ adatta il path relativo alla posizione del file in cui stai integrando

// Dove prima c'era la vecchia griglia/schermata, metti:
<ArmySelectCinematic
  onSelect={(armyName) => {
    // armyName è la stringa nome armata, oppure null per "Eserciti Misti".
    // USA GLI STESSI SETTER che la vecchia schermata stava già usando.
    // Esempio (adatta ai nomi reali del tuo state):
    setSelectedArmy(armyName);
    setCurrentScreen('deckSelect'); // → schermata di scelta dell'esercito
  }}
  onBack={() => setCurrentScreen('mainMenu')}
/>
```

**IMPORTANTE — usa gli stessi setter della vecchia schermata.** Prima di scrivere `setSelectedArmy` / `setCurrentScreen`, leggi la vecchia schermata e copia i setter / le stringhe di routing che usava. NON inventare nuovi nomi di state.

### 3. NON avvolgere il componente in altri layout

`<ArmySelectCinematic>` è **fullscreen self-contained**: ha già `position: fixed; inset: 0; z-index: 1000`. Renderizzalo direttamente al livello del routing, **fuori** da:

- `CosmicScreenLayout`
- `CosmicMenuOverlay`
- Qualsiasi `<div>` con `padding`, `transform`, `filter`, `overflow:auto`, o flex/grid container

Se la metti dentro un wrapper, le card non saranno centrate correttamente. È esattamente il bug che si è verificato nei tentativi precedenti.

### 4. Verifica i font

Devono essere disponibili globalmente: **Cinzel**, **Chakra Petch**, **Share Tech Mono**. Sono già usati nel resto del menu cosmic, quindi dovrebbero esserci. In caso contrario, in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Chakra+Petch:wght@400;500;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

---

## COSA NON DEVI FARE

| ❌ NO | ✅ SÌ |
|------|------|
| Modificare `ArmySelectCinematic.jsx` | Modificare il punto del routing che lo renderizza |
| Spostare gli stili in CSS globali / Tailwind | Lasciare gli stili inline come sono |
| "Adattare" il layout al resto dell'app | Tenerlo fullscreen come progettato |
| Avvolgerlo in `<CosmicScreenLayout>` | Renderizzarlo nudo al livello del routing |
| Cambiare nomi delle classi (`.v3c`, `.v3cc`, `.tkn`, ecc.) | Lasciarli intatti |
| Modificare `ARMY_SETS`, `ARMY_BONUSES`, `ARMY_GIFS`, `ARMY_COLORS`, `ARMY_DECKS`, `useGameFlow`, `useGameState` | Niente — il componente legge da quelli ma non li tocca |
| Aggiungere nuove props o logica di gioco | Solo `onSelect` e `onBack` |
| "Semplificare" o "ottimizzare" gli stili | Niente. Sono volutamente verbosi e specifici. |

---

## Test di accettazione

Apri il gioco e vai alla schermata di scelta armata. Devi vedere:

- [ ] Sigillo runico animato che si apre per ~1.7 secondi (intro)
- [ ] Carosello 3D con 5 card visibili: 2 a sx, 1 grande al centro (520px alta), 2 a dx
- [ ] La card centrale ha l'illustrazione full-bleed dell'armata, sigillo orbitante sopra, holographic conic ring, scan-line orizzontale, frame con corner brackets
- [ ] BG fullscreen con l'illustrazione dell'armata corrente sfocata + parallax leggero al movimento del mouse
- [ ] Pannello sinistro inclinato in 3D con: sub-titolo, nome armata, lore (corsivo), stile di gioco, keyword tag
- [ ] Pannello destro inclinato in 3D con: bonus + carte/eserciti + 4 stat bars (Aggressione/Difesa/Tempo/Difficoltà) + bottone SCHIERA con freccia + tasto ↵
- [ ] Frecce ←/→ ai lati che ruotano il carosello con transizione 3D
- [ ] Ticker in basso con 11 entry "01 Eserciti Misti" / "02 Figli dell'Orizzonte" / ecc., quella attiva colorata
- [ ] Premendo Invio o cliccando SCHIERA: flash colore + iris-out nero + testo "SIGILLO IMPRESSO · {nome}" → poi `onSelect()` viene chiamato

Se anche solo UNA di queste è mancante o diversa, hai modificato qualcosa che non dovevi. Ripristina dal file originale e ricolllega solo `onSelect`/`onBack`.

---

## Modificare i testi

I testi (lore, stile di gioco, keywords, stat) vivono SOLO in `armyLore.js`. È l'unico file che il game designer modifica.
