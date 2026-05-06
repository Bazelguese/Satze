# 🚀 Istruzioni Rapide - SATZE

## Primi Passi

### 1. Installa Node.js
Se non ce l'hai già, scarica e installa Node.js da: https://nodejs.org/
(Installa la versione LTS)

### 2. Installa le Dipendenze
Apri il terminale nella cartella del progetto e esegui:
```bash
npm install
```

### 3. Avvia il Gioco
```bash
npm run dev
```

Il gioco si aprirà automaticamente nel browser su `http://localhost:5173`

## 📝 Comandi Disponibili

- `npm run dev` - Avvia il server di sviluppo (per testare)
- `npm run build` - Crea una versione ottimizzata per la produzione
- `npm run preview` - Anteprima della build di produzione

## 🎮 Come Giocare

1. Il gioco si caricherà automaticamente nel browser
2. Segui le istruzioni a schermo per iniziare una partita
3. Puoi giocare contro l'IA

## 🛠️ Modificare il Gioco

Il codice principale si trova in:
- `Codice/satze.jsx` - Componente principale del gioco

I dati del gioco (carte, armate, etc.) si trovano in:
- `src/data/` - Dati delle carte, armate, campi di battaglia
- `src/game/` - Logica di gioco (battaglie, trigger, etc.)

## ⚠️ Problemi Comuni

**Errore "npm: command not found"**
- Installa Node.js da https://nodejs.org/

**Errore durante `npm install`**
- Assicurati di essere nella cartella corretta del progetto
- Prova a cancellare `node_modules` e `package-lock.json` e riprova

**Il gioco non si apre nel browser**
- Controlla che la porta 5173 non sia già in uso
- Vite ti dirà su quale porta è disponibile

## 📚 Documentazione Completa

Vedi `README.md` per informazioni più dettagliate.
