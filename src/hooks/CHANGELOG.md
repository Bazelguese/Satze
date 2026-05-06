# Changelog - Hooks Personalizzati

## [1.3.0] - Completata Integrazione useGameFlow

### Completato
- **`useGameFlow.js`**: Completata l'integrazione di `startGame`
  - Logica completa di inizializzazione partita
  - Gestione difficoltà IA (`setAiDifficulty`)
  - Calcolo lega e determinazione primo giocatore (`setIsPlayerFirst`)
  - Log iniziali con informazioni partita
  - Reset animazioni (se `animations` passato come parametro)
  - Gestione modalità Bare Hands (campi rivelati)

### Modificato
- **`useGameFlow.js`**: 
  - Ora accetta `animations` come parametro opzionale
  - `startGame` ora accetta `difficulty` come parametro
  - Aggiunti `setAiDifficulty`, `setIsPlayerFirst`, `setLogs` alle dipendenze
  - Importato `DIFFICULTY_NAMES` da `../utils`
  - Logica completa di inizializzazione centralizzata

- **Componente principale (`satze.jsx`)**:
  - Rimossa funzione `startGame` locale (~100 righe)
  - Rimossa definizione locale di `countArmies`
  - Rimossa definizione locale di `selectBattlefields` e `shuffleArray`
  - Ora usa `gameFlow.startGame()` da `useGameFlow(gameState, animations)`
  - Componente più pulito e modulare

### Migliorato
- Modularità: logica di inizializzazione completamente separata
- Manutenibilità: più facile trovare e modificare codice di inizializzazione
- Componente principale: ~100 righe in meno
- Coerenza: tutta la logica di inizializzazione in un unico posto
- Nessun errore di linting

---

## [1.2.0] - Estratta Logica Battaglia Completa

### Completato
- **`useBattle.js`**: Estratta completamente la funzione `resolveBattle` (~1300 righe)
  - Logica completa di risoluzione battaglia
  - Gestione effetti campo, poteri carte, bonus armata
  - Calcolo Valore Assalto (VA) con modificatori
  - Gestione immunità, blocchi, copia poteri/bonus
  - Calcolo danni e aggiornamento HP/FC
  - Gestione tossina
  - Log dettagliati per ogni fase del duello

### Modificato
- **`useBattle.js`**: 
  - Ora accetta sia `gameState` che `animations` come parametri
  - Importa `checkTrigger` da `../game/triggerLogic`
  - Importa `ARMY_BONUSES` e `TRIGGER_NAMES` da `../data`
  - Funzione `resolveBattle` completamente implementata con `useCallback`

- **Componente principale (`satze.jsx`)**:
  - Rimossa funzione `resolveBattle` locale (~1300 righe)
  - Rimossa definizione locale di `checkTrigger`
  - Ora usa `resolveBattle` da `useBattle(gameState, animations)`
  - Importato `checkTrigger` da `../src/game/triggerLogic`

### Migliorato
- Modularità: logica di battaglia completamente separata
- Manutenibilità: più facile trovare e modificare codice specifico
- Componente principale: ~1300 righe in meno, molto più leggibile
- Nessun errore di linting

---

## [1.1.0] - Sistema Difficoltà IA

### Aggiunto
- **Sistema di difficoltà IA** con 4 livelli:
  - `easy` (Senza occhi) - Facile, strategia casuale
  - `medium` (Mezzo ubriaco) - Medio, strategia bilanciata (default)
  - `hard` (Sfavorito) - Difficile, strategia ottimizzata
  - `chaos` (Il folle) - Stile bizzarro, completamente imprevedibile

- **Costanti per difficoltà IA** (`src/utils/aiConstants.js`):
  - `AI_DIFFICULTIES` - Configurazioni complete
  - `DIFFICULTY_NAMES` - Nomi per i log
  - `getAllDifficulties()` - Helper per ottenere tutte le difficoltà
  - `getDifficultyConfig()` - Helper per ottenere una configurazione

- **Schermata selezione difficoltà** nel componente principale
- **Stati aggiuntivi in `useGameState`**:
  - `selectedDeckKey` - Deck selezionato
  - `aiDifficulty` - Difficoltà IA selezionata

### Modificato
- **`useAI.js`**: 
  - Aggiunta logica per diverse difficoltà
  - Strategie diverse per selezione agente e focus coin
  - Supporto per 4 livelli di difficoltà

- **`useGameState.js`**:
  - Aggiunti stati `selectedDeckKey` e `aiDifficulty`

- **Componente principale**:
  - Aggiunta schermata `selectDifficulty`
  - Uso delle costanti invece di valori hardcoded
  - `startGame` ora accetta parametro `difficulty`

### Migliorato
- Codice più pulito usando costanti centralizzate
- Documentazione aggiornata in `README.md`
- Nessun errore di linting

---

## [1.0.0] - Hooks Iniziali

### Aggiunto
- `useGameState` - Gestione stati del gioco
- `useAnimations` - Gestione animazioni
- `useBattle` - Placeholder per logica battaglia
- `useDragAndDrop` - Gestione drag and drop
- `useGameFlow` - Gestione flusso gioco
- `useAI` - Logica IA base

### Integrato
- Tutti gli hooks nel componente principale
- Sostituzione funzioni esistenti con hooks
