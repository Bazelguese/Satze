# Sondaggio anonimo del playtest

`crea-sondaggio.gs` crea nel tuo Google Drive un Google Form già completo (26 domande in 5 sezioni) che **non raccoglie email**.

## Come crearlo (5 minuti)

1. Vai su [script.google.com](https://script.google.com) con il tuo account Google e clicca **Nuovo progetto**.
2. Cancella il codice di esempio, incolla **tutto** il contenuto di `crea-sondaggio.gs` e salva (icona del dischetto).
3. In alto, nel menu a tendina delle funzioni, scegli **creaSondaggio** e premi **Esegui**.
4. La prima volta Google chiede l'autorizzazione: **Rivedi autorizzazioni** → scegli il tuo account. Se compare "Google non ha verificato questa app", clicca **Avanzate** → **Vai a … (non sicuro)**: lo script l'hai scritto tu e può solo creare moduli nel tuo Drive.
5. In basso, nel **Registro di esecuzione**, trovi tre link:
   - **Link da dare ai playtester** (e la sua versione corta)
   - **Per modificarlo e vedere le risposte**: tienilo per te

## ⚠️ Controlla due cose prima di condividerlo

Non sono riuscito a verificare sulla documentazione Google le impostazioni più recenti, quindi controllale a mano nell'editor del modulo:

1. **Impostazioni → Risposte → Raccogli indirizzi email: "Non raccogliere"**. Se trovi anche "Limita a 1 risposta", lascialo **spento**: richiede l'accesso con Google.
2. Il modulo deve essere **pubblicato**. Se in alto vedi un pulsante **Pubblica**, cliccalo; se c'è scritto "Pubblicato" sei a posto. Per sicurezza apri il link dei playtester in una finestra in incognito: se vedi le domande senza fare l'accesso, funziona.

## Dopo

- Metti il link in `tools/playtest-discord/config.json` (`"linkSondaggio"`) e rilancia `npm run setup`: il messaggio in #annunci si aggiorna da solo.
- Le risposte le trovi nella scheda **Risposte** del modulo; da lì puoi anche aprirle in un Foglio Google.
- **Per il ciclo successivo** cambia `VERSIONE` in cima allo script e rilancialo: crea un modulo nuovo, così le risposte dei due cicli restano separate e le puoi confrontare.

## Anonimato

Il modulo non chiede né nome né email. Con una decina di persone però alcune combinazioni di risposte (ad esempio armata preferita + esperienza) potrebbero far capire chi ha scritto: se vuoi più anonimato puoi togliere quelle domande dall'editor.
