# Guida al playtest con gli amici

Come organizzare il playtest di SATZE: preparare una build, gestire il gruppo Discord e raccogliere i feedback.

- Server Discord: `tools/playtest-discord/README.md`
- Sondaggio anonimo: `tools/playtest-sondaggio/README.md`

## Come funziona

Il test procede a **cicli** di una o due settimane:

1. **Esce la build**: annuncio in #annunci con cosa è cambiato.
2. **I playtester giocano** liberamente e segnalano bug e problemi nei forum.
3. **A fine ciclo** mandi il sondaggio anonimo.
4. **Chiudi il ciclo**: sistemi i bug più importanti, alzi la versione ed esce la build successiva.

## Prima di ogni build: checklist

1. **Controlla `.env.public`.** Nel repo questo file **non c'è**: deve esistere sul tuo PC, nella radice del progetto, con dentro:

   ```
   VITE_SATZE_PUBLIC_BUILD=true
   VITE_SATZE_TELEMETRY_URL=<indirizzo del webhook di #dati-partite>
   ```

   La seconda riga attiva l'invio dei dati di gioco (vedi `TELEMETRIA_PLAYTEST.md`). Il repository è pubblico: questo file non va mai committato.

   Senza questo file `npm run build:public` produce una build **di sviluppo**: con gli Strumenti dev, lo Storico playtest e il multiplayer puntato su `127.0.0.1`.
2. **Alza la versione** in `package.json`:
   - `0.1.0 → 0.1.1` se ci sono solo correzioni
   - `0.1.0 → 0.2.0` se ci sono novità
3. **Crea l'installer**: `npm run electron:public:setup` → `release/playtest/SATZE-Playtest-Setup-<versione>.exe`.
4. **Installalo tu per primo** e guarda in basso a sinistra nel menu. Deve esserci scritto `PLAYTEST · SATZE · LA GRANDE GUERRA · v<versione> · BUILD <data>`. Se invece leggi `ALPHA · NON DISTRIBUIRE`, manca `.env.public` (punto 1).
5. **Carica l'exe su Google Drive**, con il link aperto a chiunque lo abbia.
6. **Aggiorna Discord**: in `tools/playtest-discord/config.json` cambia `versione` e `linkDownload`, poi lancia `npm run setup` (reinvita il bot se l'hai tolto).
7. **Scrivi le note di patch** in #annunci, menzionando @Playtester: cosa è cambiato e su cosa concentrarsi.

## Durante il ciclo

- **Rispondi a ogni post**, anche solo con 👀 ("visto"). Chi segnala e non riceve risposta smette di segnalare.
- Quando sistemi un bug, metti il tag ✅ **risolto** e scrivi nel post in quale versione è sistemato.
- Le idee che vuoi fare davvero le segni con 📌 **in programma**.
- Usa #note-dev per le priorità del prossimo ciclo.
- Non promettere modifiche sul momento: ringrazia e prendi nota.

## Fine ciclo: il sondaggio

1. Crea il modulo con `tools/playtest-sondaggio` (uno nuovo per ogni ciclo, cambiando `VERSIONE` nello script).
2. Metti il link in `linkSondaggio` e lancia `npm run setup`: il messaggio in #annunci si aggiorna.
3. Menziona @Playtester in #annunci per avvisarli.
4. Lascia 3-4 giorni per rispondere, poi leggi le risposte prima di decidere le priorità.

## Cosa c'è nella build 0.1.1

- Partita locale contro l'IA:
  - **Duello**, nei formati Standard (con le Eminenze), No Eminenza e Mani nude
  - **2v2** ad abbinamenti segreti
  - **Re della collina** a 3-4 giocatori
- **Multiplayer online** (beta), sul server `wss://satze-ws.fly.dev`: Duello in tutti i formati, 2v2 e Re della collina fino a 4 persone (i posti vuoti li gioca l'IA)
- Gestione eserciti, Tutorial, Galleria
- La **Campagna** resta visibile nel menu come anteprima, ma **non fa parte del test**.
- Focus del test: le **Eminenze**, che ci sono solo nel Duello Standard.

Prima di distribuire la build, controlla che il server del multiplayer sia acceso (`fly status`).

Se è cambiato `server/index.mjs` (ad esempio le stanze fino a 4 posti), ripubblica il server dalla **cartella principale del repository**, quella che contiene `fly.toml`, con `fly deploy`. Le stanze 1 contro 1 restano compatibili con le build già distribuite.
