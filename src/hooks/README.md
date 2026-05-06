# Hooks Personalizzati - SATZE

Questa cartella contiene tutti gli hooks personalizzati utilizzati nel gioco SATZE per gestire lo stato, le animazioni e la logica di gioco.

## 📚 Hooks Disponibili

### `useGameState`
Gestisce tutti gli stati del gioco (fase, mani, HP, FC, carte, ecc.).

**Uso:**
```javascript
const gameState = useGameState();
const { gamePhase, setGamePhase, playerHP, setPlayerHP, ... } = gameState;
```

**Stati gestiti:**
- Fase di gioco (menu, setup, selectField, selectAgent, battle, result, gameOver)
- Mani dei giocatori (playerHand, enemyHand)
- Statistiche (HP, Focus Coin)
- Selezione agenti e focus
- Carte usate e risultati battaglie
- Bonus armata
- Tossina
- UI states (hover, gallery, drag and drop)

---

### `useAnimations`
Gestisce tutti gli stati e le funzioni per le animazioni del duello.

**Uso:**
```javascript
const animations = useAnimations();
const { duelPhase, setDuelPhase, animateFocusCoins, ... } = animations;
```

**Funzionalità:**
- Animazioni focus coin sequenziali
- Glow delle carte durante il duello
- Fasi del duello (0-6)
- Zoom e clash animations
- Animazioni round finale

**Funzioni helper:**
- `animateFocusCoins(playerTotal, enemyTotal, delay)` - Anima i focus coin
- `startDuelAnimation(initialPhase)` - Avvia animazione duello
- `nextDuelPhase()` - Avanza alla fase successiva
- `triggerClashAnimation()` - Avvia animazione clash
- `resetAnimations()` - Reset completo
- `resetDuelAnimations()` - Reset solo duello

---

### `useBattle`
Hook per la logica di battaglia. Gestisce completamente la risoluzione di una battaglia, inclusi effetti campo, poteri carte, bonus armata, calcolo Valore Assalto e danni.

**Uso:**
```javascript
const { resolveBattle } = useBattle(gameState, animations);
```

**Funzionalità:**
- Risoluzione completa della battaglia (~1300 righe di logica)
- Gestione effetti campo (valori, focus, limiti, trigger)
- Applicazione poteri carte e bonus armata
- Calcolo Valore Assalto (VA) con modificatori
- Gestione immunità e blocchi
- Gestione copia poteri/bonus
- Calcolo danni e aggiornamento HP/FC
- Gestione tossina
- Log dettagliati per ogni fase del duello

**Parametri:**
- `gameState` - Stato del gioco da `useGameState`
- `animations` - Stato delle animazioni da `useAnimations`

**Nota:** Questo hook contiene tutta la logica di battaglia estratta dal componente principale, migliorando significativamente la modularità e manutenibilità del codice.

---

### `useAI`
Gestisce la logica dell'IA per selezionare agenti e focus coin.

**Uso:**
```javascript
const ai = useAI(gameState);
const { selectEnemyAgentAndFocus, selectEnemyAgent, calculateEnemyFocus } = ai;
```

**Funzioni:**
- `selectEnemyAgent()` - Seleziona un agente per l'IA (strategia: preferisce POT alta)
- `calculateEnemyFocus(agent)` - Calcola i focus coin da usare (riserva 1 FC per agente rimanente)
- `selectEnemyAgentAndFocus(logSelection)` - Seleziona agente e focus in un'unica chiamata
- `selectEnemyAgentAdvanced(context)` - Strategia avanzata (futuro)

**Strategia IA (varia in base alla difficoltà):**

- **Easy (Senza occhi)**: 
  - Sceglie carte casualmente
  - Usa pochi FC (base * 0.8)
  
- **Medium (Mezzo ubriaco)** - Default:
  - Preferisce carte con POT più alta
  - Sceglie tra le prime 3 carte più potenti (con randomicità)
  - Usa baseFocus = lega * 1.2 con varianza random
  
- **Hard (Sfavorito)**:
  - Sceglie sempre la carta migliore (POT più alta, poi DAN)
  - Usa molti FC (base * 1.5)
  
- **Chaos (Il folle)**:
  - Comportamento completamente imprevedibile
  - 33% peggiore carta, 33% casuale, 34% migliore carta
  - FC: 33% minimo, 33% casuale, 34% massimo

---

### `useDragAndDrop`
Gestisce la logica di drag and drop per le carte.

**Uso:**
```javascript
const dragAndDrop = useDragAndDrop({
  gamePhase,
  isPlayerFirst,
  enemyAgent,
  playerUsedCards,
  onAgentSelect,
  gameState,
});

const { handleDragStart, dropZoneRef, ... } = dragAndDrop;
```

**Funzionalità:**
- Gestione eventi drag (start, move, end)
- Rilevamento drop zone
- Listener globali per mouse

---

### `useGameFlow`
Gestisce il flusso del gioco (start, reset, selezione campi).

**Uso:**
```javascript
const gameFlow = useGameFlow(gameState, animations);
const { startGame, resetToMenu, selectBattlefields } = gameFlow;
```

**Funzioni:**
- `startGame(selectedPlayerArmy, selectedDeckKey, mode, difficulty, allBattlefields)` - Inizia nuova partita
  - Gestisce completamente l'inizializzazione: armate, deck, mani, campi, HP, FC, bonus armata
  - Calcola la lega e determina chi inizia
  - Resetta tutte le animazioni
  - Imposta i log iniziali
  - Parametro `animations` opzionale per reset animazioni
- `resetToMenu()` - Resetta al menu
- `selectBattlefields(mode, allBattlefields)` - Seleziona campi di battaglia
- `shuffleArray(array)` - Mescola un array

---

## 🔄 Come Usare gli Hooks

### Esempio Completo

```javascript
import { useGameState, useAnimations, useDragAndDrop, useGameFlow } from '../src/hooks';

export default function SatzeGame() {
  // Inizializza gli hooks
  const gameState = useGameState();
  const animations = useAnimations();
  const gameFlow = useGameFlow(gameState);
  
  // Estrai gli stati necessari
  const { gamePhase, playerHP, ... } = gameState;
  const { duelPhase, animateFocusCoins, ... } = animations;
  const { startGame, resetToMenu } = gameFlow;
  
  // Usa gli hooks per drag and drop
  const dragAndDrop = useDragAndDrop({
    gamePhase,
    isPlayerFirst: gameState.isPlayerFirst,
    enemyAgent: gameState.enemyAgent,
    playerUsedCards: gameState.playerUsedCards,
    onAgentSelect: (agent) => gameState.setSelectedAgent(agent),
    gameState,
  });
  
  // ... resto del componente
}
```

---

## 🎯 Vantaggi degli Hooks

1. **Modularità**: Logica separata e riutilizzabile
2. **Manutenibilità**: Più facile trovare e modificare codice specifico
3. **Testabilità**: Hooks possono essere testati indipendentemente
4. **Leggibilità**: Componente principale più pulito e facile da capire
5. **Performance**: Possibilità di ottimizzare con `useCallback` e `useMemo`

---

## 📝 Note

- Gli hooks sono stati creati per refactorizzare il componente principale `satze.jsx`
- La logica di battaglia (`resolveBattle`) è ancora nel componente principale ma può essere estratta in futuro
- Tutti gli hooks usano `useCallback` per ottimizzare le performance
- Gli stati sono gestiti centralmente in `useGameState` per facilitare la gestione

---

## 🚀 Prossimi Passi

- [x] Creare hook `useAI` per la logica dell'IA ✅
- [x] Estrarre completamente `resolveBattle` in `useBattle.js` ✅
- [x] Completare integrazione `useGameFlow` - `startGame` completamente nel hook ✅
- [ ] Creare hook `useEffects` per gestire gli effetti delle carte
- [ ] Aggiungere test per gli hooks
- [ ] Documentare meglio le dipendenze tra hooks

## ✅ Integrazione Completata

Gli hooks sono stati integrati nel componente principale `satze.jsx`:
- ✅ `useDragAndDrop` - Sostituisce le funzioni handleDragStart/Move/End
- ✅ `useAI` - Sostituisce la logica di selezione agente IA
- ✅ `useGameState` - Gestisce tutti gli stati
- ✅ `useAnimations` - Gestisce tutte le animazioni
- ✅ `useBattle` - Logica completa di battaglia estratta (~1300 righe)
- ✅ `useGameFlow` - Logica completa di `startGame` estratta, inclusi reset animazioni, log iniziali, calcolo lega
