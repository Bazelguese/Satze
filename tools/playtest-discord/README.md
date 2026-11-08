# Server Discord del playtest

Questo script allestisce sul tuo server Discord tutto lo spazio del playtest: ruoli, categorie, canali, forum con i tag e i messaggi di benvenuto, download e annunci.

- **Non tocca niente di quello che c'è già.** Crea solo categorie con il prefisso `SATZE ·` e lavora solo lì dentro.
- **I canali del playtest li vede solo chi ha il ruolo Playtester** (e tu). Gli altri membri del server non si accorgono di niente.
- **Puoi rilanciarlo quante volte vuoi**: aggiorna testi e impostazioni senza duplicare niente. È così che pubblichi il link del sondaggio o una nuova versione.

## Cosa crea

```
📌 SATZE · INFO          (i playtester leggono, scrivi solo tu)
   # benvenuto           cosa testare, dove scrivere, regole
   # annunci             nuove build, sondaggio
   # download            installer e istruzioni
🐞 SATZE · FEEDBACK      (i playtester aprono post e rispondono)
   🗂 bug                forum, con modello di segnalazione e tag
   🗂 bilanciamento      forum, un tag per armata + Eminenze, Campi, IA, regole
   🗂 idee               forum
💬 SATZE · COMMUNITY     (tutti scrivono e parlano)
   # chiacchiere
   # cerco-partita
   🔊 Partita 1, Partita 2
🔒 SATZE · DEV           (solo tu)
   # note-dev
```

Ruoli: **Dev Satze** e **Playtester**. I tag ✅ *risolto* (bug) e 📌 *in programma* (idee) li può mettere solo chi gestisce i thread, cioè tu.

I testi sono in `contenuti.mjs`: modificali lì e rilancia lo script.

---

## Passo 1 · Crea il bot (una volta sola, 5 minuti)

Il bot serve solo per lanciare lo script: alla fine lo togli dal server.

1. Vai su <https://discord.com/developers/applications> e clicca **New Application**. Chiamala ad esempio `SATZE Setup` e accetta i termini.
2. Nella pagina **General Information** copia l'**Application ID**: ti serve al punto 4.
3. Vai nella sezione **Bot**, clicca **Reset Token** e copia il token. **Non condividerlo con nessuno**: chi ce l'ha controlla il bot. Non serve attivare nessun "Privileged Gateway Intent".
4. Apri questo link nel browser, sostituendo `APPLICATION_ID` con il numero del punto 2:

   ```
   https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&scope=bot&permissions=8
   ```

   Scegli il tuo server e autorizza. `permissions=8` significa Amministratore: serve per creare ruoli e canali con i permessi giusti. Per questo alla fine il bot va tolto.

> Ho scritto questi passaggi senza poter aprire il portale Discord: se qualche nome di menu è un po' diverso, il senso è quello.

## Passo 2 · Prendi gli ID

In Discord: **Impostazioni utente → Avanzate → Modalità sviluppatore** (attivala). Poi:

- tasto destro sull'icona del server → **Copia ID server**
- *(facoltativo)* tasto destro sul tuo nome → **Copia ID utente**, per darti il ruolo Dev
- *(facoltativo)* lo stesso per ogni playtester, per dargli subito il ruolo Playtester

## Passo 3 · Configura e lancia

Ti serve [Node.js](https://nodejs.org) 18 o più recente (lo hai già, lo usi per il gioco). Dalla cartella `tools/playtest-discord`:

```bash
npm install
```

Copia `config.example.json` in `config.json` (su Windows: `copy config.example.json config.json`) e compilalo:

| Campo | Cosa mettere |
|---|---|
| `token` | il token del Passo 1 |
| `idServer` | l'ID del server |
| `versione` | la versione della build, es. `"0.1.0"` (la vedi in basso a sinistra nel menu del gioco) |
| `linkDownload` | il link Google Drive all'installer (vuoto = "in arrivo") |
| `linkSondaggio` | il link del Google Form (vuoto = "arriva a fine ciclo") |
| `idDev` | il tuo ID utente (facoltativo) |
| `idPlaytester` | gli ID dei playtester, es. `["123…", "456…"]` (facoltativo) |

`config.json` contiene il token ed è già escluso da git: **non committarlo**.

Prima controlla che sia tutto a posto, senza toccare Discord:

```bash
npm run anteprima
```

Poi allestisci il server:

```bash
npm run setup
```

Se qualcosa si interrompe a metà, rilancialo: riprende senza duplicare.

## Passo 4 · Togli il bot

Sul server: tasto destro sul bot nella lista membri → **Espelli**. Quando ti serve di nuovo (nuova versione, link del sondaggio) lo reinviti con lo stesso link del Passo 1 e rilanci `npm run setup`.

---

## Link Google Drive per l'installer

1. Carica `SATZE-Playtest-Setup-0.1.0.exe` (lo trovi in `release/playtest` dopo `npm run electron:public:setup`).
2. Tasto destro → **Condividi** → **Accesso generale: Chiunque abbia il link** → copia il link.
3. Mettilo in `linkDownload` e rilancia `npm run setup`.

Se il file è grande, Google Drive al download mostra l'avviso "impossibile eseguire la scansione antivirus": è normale, basta cliccare **Scarica comunque**. Conviene scriverlo anche ai playtester se succede.

## Aggiungere i playtester senza ID

Puoi anche farlo a mano: invita gli amici nel server, poi **Impostazioni server → Membri** (oppure tasto destro sul nome) → **Ruoli** → **Playtester**.

## Se i forum non si possono creare

Se Discord rifiuta i canali forum, lo script crea al loro posto canali di testo normali con le stesse istruzioni e te lo segnala alla fine.

## Test

```bash
npm test
```

I test usano un server Discord finto: controllano la logica (niente duplicati, link tra canali, permessi, fallback) senza collegarsi a Discord.
