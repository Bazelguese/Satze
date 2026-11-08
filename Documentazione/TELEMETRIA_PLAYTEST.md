# Telemetria del playtest

A fine partita la build di playtest invia i dati della partita al canale privato **#dati-partite** del Discord del playtest (visibile solo a Davide), tramite un webhook.

## Quando è attiva
Solo se valgono tutte e tre le condizioni:
- build pubblica (`VITE_SATZE_PUBLIC_BUILD=true` in `.env.public`);
- `VITE_SATZE_TELEMETRY_URL` impostato in `.env.public` con l'indirizzo del webhook;
- il gioco gira nell'app desktop (Electron). Il browser non invia niente.

⚠️ Il repository è pubblico: l'indirizzo del webhook va **solo** in `.env.public`, mai nel codice. Se finisce in giro, rigeneralo da Discord (Impostazioni canale → Integrazioni → Webhook) e aggiorna `.env.public`.

## Cosa fa
- **Primo avvio:** chiede il nome al giocatore (`NomeGiocatoreModal`). Non si può disattivare: è una scelta del playtest.
- **Durante la partita:** registra ogni round (`Codice/satze.jsx`, in `proceedToNextRound`).
- **A fine partita:** costruisce il record (`src/telemetry/recordPartita.js`) e lo mette in coda (`localStorage`, chiave `satze_telemetria_coda`).
- **Invio:** il processo principale di Electron spedisce la coda (`satze:telemetry:send` in `electron/main.cjs`). Se la connessione manca, i record restano in coda e partono all'avvio successivo o alla partita successiva.
- **Partite escluse:** tutorial guidati, campagna, partite di prova. Le partite abbandonate non vengono inviate.

## Cosa arriva su Discord
Un messaggio per partita, composto da:
- una riga di riepilogo, ad esempio: `**Luca** · Duello Standard · Kethran vs Apex · 🏆 Vittoria (Campi) · 4 round · 12 min · v0.1.0`;
- in allegato il file `P-….json` con tutti i dati.

## Schema del JSON (versione 1)
**Campi comuni**
- `schema`, `versione`, `dataBuild`
- `idPartita`, `idInstallazione` (codice casuale per PC)
- `inviataIl`, `inizio`, `fine`, `durataSecondi`
- `modalita`: `duello` | `multiplayer` | `2v2` | `reDellaCollina`
- `formato`: `standard` | `noEminenza` | `maniNude`
- `difficolta`, `esito` (`vittoria` | `sconfitta` | `pareggio`), `motivo`, `roundGiocati`
- `giocatore`: `{ nome, armata, esercito, carteEsercito?, mano[], eminenza, pvFinali, campi }`
- `avversari[]`: stessa forma di `giocatore`, più `tipo` (`IA` | `umano`) e `nome`

**Ogni carta** è `{ id, nome, armata, lega }`.

**Round del Duello**
- `n`, `campo { id, nome, slot }`, `primo` (`tu` | `avversario`)
- `tu` e `avversario`, ciascuno con:
  - `agente`;
  - `fc`, `fcTemporanei`;
  - `va`, `pot`, `dan`;
  - `potere` e `bonus`: `attivo` | `non attivo` | `bloccato`;
  - `eminenza { abilita, presenzaDopo, presenzaSpesa }`, solo in formato Standard.
- `vincitore`, `danno`, `campoDistrutto`, `perfect`, `pvDopo { tu, avversario }`

**2v2**
- In più: `compagno`, `compagnoIA`.
- Per ogni round: `apre`, `disposizione`, `fc` per posto, `fronti[]` e `pvDopo`.
- Ogni fronte: `campo`, `primo`, `lati { [posto]: lato }`, `vincitore`, `danno`.

**Re della collina**
- Per ogni contesa: `campo`, `ordine`, `fc` per posto, `scontri[]` e `conquista`.
- Ogni scontro ha la stessa forma di un fronte, più `eliminati`.

## Verifica dopo una nuova build
Gioca una partita breve con l'installer, poi controlla che in #dati-partite arrivi il messaggio con il file allegato.
