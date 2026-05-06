# SATZE - Gioco di Carte Strategico

Gioco di carte strategico per 2 giocatori sviluppato in React.

## 🚀 Installazione

1. Installa le dipendenze:
```bash
npm install
```

## 🎮 Come Giocare

### Avviare il gioco in modalità sviluppo:
```bash
npm run dev
```

Il gioco sarà disponibile su `http://localhost:5173`

### Creare una build per produzione:
```bash
npm run build
```

I file compilati saranno nella cartella `dist/`

### Anteprima della build:
```bash
npm run preview
```

## 📁 Struttura del Progetto

```
Satze/
├── Codice/
│   └── satze.jsx  # Componente principale del gioco
├── src/
│   ├── data/                          # Dati del gioco (carte, armate, etc.)
│   ├── game/                          # Logica di gioco
│   ├── utils/                         # Utility varie
│   ├── main.jsx                       # Entry point React
│   └── index.css                      # Stili globali
├── Documentazione/                    # Regolamento e documentazione
├── package.json                       # Configurazione npm
├── vite.config.js                     # Configurazione Vite
└── index.html                         # HTML principale
```

## 🎯 Caratteristiche

- Gioco di carte strategico per 2 giocatori
- 6 armate diverse con stili di gioco unici
- Sistema di battaglia con Focus Coin e Valore Assalto
- Campi di battaglia con effetti speciali
- Sistema di trigger e abilità complesso

## 📚 Documentazione

Consulta la cartella `Documentazione/` per:
- `REGOLE.md` - Regolamento completo
- `GLOSSARIO.md` - Terminologia del gioco
- `DECK.md` - Informazioni sui mazzi

## 🛠️ Tecnologie Utilizzate

- **React 18** - Framework UI
- **Vite** - Build tool e dev server
- **JavaScript/JSX** - Linguaggio di programmazione

## 📝 Note

Questo progetto è un prototipo giocabile. Il codice principale si trova in `Codice/satze.jsx`.
