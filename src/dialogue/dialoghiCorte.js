/* ============================================================
   Satze · DIALOGHI — Pilota: CORTE ROSSA (20 carte)
   Chiave = card.id (da cards.js) -> evento -> righe.

   Riga: { t: testo, r: registro, once?: bool, fx?: override-effetto }
   Registri (r): "carattere" | "comico" | "lore" | "reattivo" | "stat"
   Markup nel testo t:
     *parola*     -> effetto FIRMA armata (Corte = shake)
     {fx:parola}  -> override, es. {glitch:copiare} {flicker:clausola}
   Eventi:
     entrata         (l'avversario sta decidendo — riempi l'attesa)
     vince / perde   (post-reveal, esito scontro)
     triggerAttivato (quando scatta il Potere della carta)
     statNemico.{colosso|fragile|spinato}  (al reveal; stat nemiche = pubbliche)
     reattivo.{Armata}                     (accoppiamenti firma)
     lore            (once:true — non si ripete nella partita)
     morte           (Fase 7, scarto dell'Agente)

   Soglie stat nemiche: colosso POT>=6 · fragile POT<=2 · spinato DAN>=5
   FIRMA effetto armata: 'shake' (da SatzeDialogue.ARMY.corte.fx)
   ============================================================ */

export const DIALOGHI_CORTE = {

  // ---------- L5 ----------
  301: { // Vaelith Sorn, il Primo — Conquista: 3 Danni dir.
    entrata: [
      { t: "Sedevo al centro dei tavoli. Ora siedo al centro di *tutto*.", r: "carattere" },
      { t: "Il prezzo, lo vedi. Ne è valsa la pena? Non chiederlo a me.", r: "carattere" },
      { t: "Io ero il primo. Voi siete solo l'ultima firma.", r: "carattere" }
    ],
    vince: [
      { t: "Ho vinto? Avevo già vinto. Da secoli.", r: "carattere" },
      { t: "Tutto torna al centro. Come sempre.", r: "carattere" }
    ],
    perde: [ { t: "Curioso. Non accadeva da... molto.", r: "carattere" } ],
    triggerAttivato: [ { t: "Sto vincendo. Quindi *prendo* anche di più.", r: "carattere" } ],
    statNemico: {
      colosso: [ { t: "Grande. Anche i grandi hanno firmato, alla fine.", r: "stat" } ]
    },
    reattivo: {
      "Figli dell'Orizzonte": [ { t: "Non avete più un corpo da mettere in pegno. Che spreco.", r: "reattivo" } ]
    },
    lore: [ { t: "Prima che Sethramis fosse città, io ero già al tavolo.", r: "lore", once: true } ],
    morte: [ { t: "Torno al centro. Il centro resta.", r: "carattere" } ]
  },

  311: { // Generale Karthessi — Resa dei conti: Copia Potere nem.
    entrata: [
      { t: "Non ricordo il mio nome. Ricordo la *firma*.", r: "carattere" },
      { t: "Combatto per la Corte. Come tu farai.", r: "carattere" }
    ],
    vince: [ { t: "Il tuo potere ti stava stretto. *Lo indosso io*.", r: "carattere" } ],
    perde: [ { t: "Ho perso. Di nuovo. Come col mio popolo.", r: "carattere" } ],
    triggerAttivato: [ { t: "Dal terzo conto in poi, ciò che sai fare lo faccio io.", r: "carattere" } ],
    statNemico: {
      fragile: [ { t: "Non c'è niente da {glitch:copiare}, qui.", r: "stat" } ],
      colosso: [ { t: "*Finalmente.* Qualcosa che valga la pena rubare.", r: "stat" } ]
    },
    lore: [ { t: "Fui il migliore del mio popolo. Ho firmato. Non chiedermi altro.", r: "lore", once: true } ],
    morte: [ { t: "Torno a... a dove? ...non ricordo.", r: "carattere" } ]
  },

  316: { // Airam, la Confortatrice — Sempre: Inversione
    entrata: [
      { t: "Sshh. Lascia che ti *conforti*.", r: "carattere" },
      { t: "L'ultimo desiderio è già scritto. Il tuo.", r: "carattere" },
      { t: "Sono qui per chiudere il conto. Con dolcezza.", r: "carattere" }
    ],
    vince: [ { t: "Ecco. Non fa più male, vero?", r: "carattere" } ],
    perde: [ { t: "Anche il conforto, a volte, va rimandato.", r: "carattere" } ],
    triggerAttivato: [ { t: "Quello che ti hanno dato? Te lo {flicker:restituisco}. Al contrario.", r: "carattere" } ],
    statNemico: {
      spinato: [ { t: "Tanta rabbia. Lascia che te la {flicker:rovesci} addosso.", r: "stat" } ]
    },
    lore: [ { t: "Non do conforto per pietà. È l'ultimo servizio che un debitore rende.", r: "lore", once: true } ],
    morte: [ { t: "Riposa. Tornerò a confortare qualcun altro.", r: "carattere" } ]
  },

  // ---------- L4 ----------
  302: { // L'Estrattrice — Intervento: Copia Potere
    entrata: [
      { t: "Vengo di persona. È un privilegio.", r: "carattere" },
      { t: "Il terrore è parte del pagamento.", r: "carattere" },
      { t: "Firmerai. Tutti firmano, quando arrivo io.", r: "carattere" }
    ],
    vince: [ { t: "Il tuo potere? *Estratto.* Come tutto il resto.", r: "carattere" } ],
    perde: [ { t: "Tornerò. Con la ricevuta.", r: "comico" } ],
    triggerAttivato: [ { t: "Rispondo per seconda. Rispondo *con la tua stessa arma*.", r: "carattere" } ],
    statNemico: {
      colosso: [ { t: "Più grande è il debito, più dolce la riscossione.", r: "stat" } ]
    },
    morte: [ { t: "Il debito... resta aperto...", r: "carattere" } ]
  },

  303: { // Esattore Infernale — Opportunista: -4 POT nem. (min 3)
    entrata: [
      { t: "Oro, sangue o anima. La scelta, tecnicamente, è tua.", r: "comico" },
      { t: "Il debito viene sempre riscosso.", r: "carattere" },
      { t: "Sono qui per il saldo.", r: "carattere" }
    ],
    vince: [ { t: "Pagato. Con gli interessi.", r: "carattere" } ],
    perde: [ { t: "Un pagamento posticipato. Non cancellato.", r: "carattere" } ],
    triggerAttivato: [ { t: "Il momento giusto per riscuotere è *adesso*.", r: "carattere" } ],
    statNemico: {
      colosso: [ { t: "Che POT. Che debito enorme. Lo riduco subito.", r: "stat" } ]
    },
    morte: [ { t: "Segnate il mio nome... tra i crediti.", r: "carattere" } ]
  },

  312: { // Artigiano Velithari — Vendetta: 2 Danni dir.
    entrata: [
      { t: "Forgiavo per il mio popolo. Ora forgio per la Corte.", r: "carattere" },
      { t: "Le mie mani non sono più mie. Ma tagliano ancora.", r: "carattere" }
    ],
    vince: [ { t: "Un'altra lama. Un altro pezzo di me che se ne va.", r: "carattere" } ],
    perde: [ { t: "Anche l'acciaio migliore, a volte, cede.", r: "carattere" } ],
    triggerAttivato: [ { t: "Ho perso, prima. Adesso *ricambio*.", r: "carattere" } ],
    lore: [ { t: "Ogni arma che creo uccide un po' di ciò che ero.", r: "lore", once: true } ],
    morte: [ { t: "Le mani... finalmente ferme.", r: "carattere" } ]
  },

  317: { // Banditore di Schiavi — Intervento: Blocca Potere
    entrata: [
      { t: "Non mi interessa a chi. Mi interessa a *quanto*.", r: "carattere" },
      { t: "Il prezzo è sempre equo. Per me.", r: "comico" },
      { t: "Aggiudicato. E tu non hai nemmeno fatto un'offerta.", r: "comico" }
    ],
    vince: [ { t: "Venduto. Il prossimo lotto sei tu.", r: "carattere" } ],
    perde: [ { t: "Ritiro il lotto. Per ora.", r: "carattere" } ],
    triggerAttivato: [ { t: "Il tuo potere non è in vendita. È già *tolto*.", r: "carattere" } ],
    morte: [ { t: "L'asta... è chiusa.", r: "carattere" } ]
  },

  318: { // Fratello del Banditore di Schiavi — Resa dei conti: 2 Danni dir.
    entrata: [
      { t: "Le parole di mio fratello non sono bastate.", r: "carattere" },
      { t: "Nessuno sa il mio nome. Non serve.", r: "carattere" }
    ],
    vince: [ { t: "Il debito è saldato. Con me si salda sempre.", r: "carattere" } ],
    perde: [ { t: "Ripasso. I conti non si dimenticano.", r: "carattere" } ],
    triggerAttivato: [ { t: "Dal terzo conto, parlo io. E io non *tratto*.", r: "carattere" } ],
    morte: [ { t: "...dite a mio fratello che ho finito.", r: "carattere" } ]
  },

  // ---------- L3 ----------
  304: { // Tentatore d'Anime — Blocca Potere (Sempre)
    entrata: [
      { t: "Ti offro ciò che desideri di più.", r: "carattere" },
      { t: "Il prezzo? Solo ciò che ami di più.", r: "carattere" },
      { t: "Sembra uno scambio equo. *Sembra sempre* uno scambio equo.", r: "comico" }
    ],
    vince: [ { t: "Firmato. Non leggere le clausole: non cambierebbe nulla.", r: "comico" } ],
    perde: [ { t: "Rifiutato? Torno con un'offerta migliore.", r: "carattere" } ],
    triggerAttivato: [ { t: "Il tuo potere? Messo a tacere. Come da contratto.", r: "carattere" } ],
    morte: [ { t: "L'offerta... scade...", r: "carattere" } ]
  },

  305: { // Avvocato del Diavolo — Imboscata: Copia POT
    entrata: [
      { t: "Legalmente, la tua anima non ti è mai appartenuta.", r: "comico" },
      { t: "Vedi, c'è questa {flicker:clausola}...", r: "carattere" },
      { t: "Ho letto il contratto. Tu no. Peccato.", r: "comico" }
    ],
    vince: [ { t: "Comma 7, sottosezione C. Avevo *ragione io*.", r: "comico" } ],
    perde: [ { t: "Faccio... appello.", r: "comico" } ],
    triggerAttivato: [ { t: "Anticipo. E anticipando, la tua POT diventa {flicker:mia}.", r: "carattere" } ],
    statNemico: {
      colosso: [ { t: "Bella POT. C'è una clausola che la rende mia.", r: "stat" } ]
    },
    morte: [ { t: "Obiezione... respinta...", r: "comico" } ]
  },

  306: { // Giudice Corrotto — Resa dei conti: Blocca Bonus
    entrata: [
      { t: "Il verdetto è già scritto: *colpevole*.", r: "carattere" },
      { t: "La sentenza dipende da quanto puoi pagare.", r: "carattere" },
      { t: "La giustizia è cieca. Io no.", r: "comico" }
    ],
    vince: [ { t: "Colpevole. Come sempre.", r: "carattere" } ],
    perde: [ { t: "Mi... ricuso.", r: "comico" } ],
    triggerAttivato: [ { t: "Dal terzo conto, la tua armata perde ogni {flicker:diritto}.", r: "carattere" } ],
    morte: [ { t: "La corte... si aggiorna.", r: "carattere" } ]
  },

  313: { // Dammeri Spezzato — Intervento: -3 POT nem. (min 2)
    entrata: [
      { t: "Ero l'ultimo a resistere. Ho firmato ieri.", r: "carattere" },
      { t: "Guardami. È ciò che ti aspetta.", r: "carattere" },
      { t: "La speranza muore dove passo io.", r: "carattere" }
    ],
    vince: [ { t: "Anche tu. Prima o poi. Anche tu.", r: "carattere" } ],
    perde: [ { t: "Ancora... un giorno di resistenza.", r: "carattere" } ],
    triggerAttivato: [ { t: "Rispondo. E la tua forza si {flicker:spezza} come la mia.", r: "carattere" } ],
    morte: [ { t: "Finalmente... libero.", r: "carattere" } ]
  },

  314: { // Debitore Trasformato — Vendetta: +2 POT
    entrata: [
      { t: "Ho firmato per rabbia. Sono rimasto per rabbia.", r: "carattere" },
      { t: "Non c'è più niente in me. Solo *rabbia*.", r: "carattere" }
    ],
    vince: [ { t: "La rabbia non si ferma. *Mai*.", r: "carattere" } ],
    perde: [ { t: "Questo... mi rende solo più furioso.", r: "carattere" } ],
    triggerAttivato: [ { t: "Mi hai fatto perdere. La rabbia *cresce*.", r: "carattere" } ],
    morte: [ { t: "La rabbia... resta... senza di me.", r: "carattere" } ]
  },

  319: { // Investigatore Demoniaco — Vendetta: Copia Potere
    entrata: [
      { t: "Indago solo per confermare le tue colpe.", r: "carattere" },
      { t: "Non trovo prove? Le {flicker:creo}.", r: "comico" },
      { t: "Sei già colpevole. Manca solo la firma.", r: "carattere" }
    ],
    vince: [ { t: "Caso chiuso. Colpevole, ovviamente.", r: "carattere" } ],
    perde: [ { t: "Il caso... resta aperto.", r: "carattere" } ],
    triggerAttivato: [ { t: "Ho perso un round? Ti studio. E divento *te*.", r: "carattere" } ],
    morte: [ { t: "Le prove... mi sopravvivranno.", r: "carattere" } ]
  },

  // ---------- L2 ----------
  307: { // Archivista degli Obblighi — Intervento: -2 DAN nem. (min 2)
    entrata: [
      { t: "So cosa devi. Anche se l'hai dimenticato.", r: "carattere" },
      { t: "*Specialmente* se l'hai dimenticato.", r: "comico" }
    ],
    vince: [ { t: "Registrato. Archiviato. Riscosso.", r: "carattere" } ],
    perde: [ { t: "Nota a margine: riprovare.", r: "comico" } ],
    triggerAttivato: [ { t: "Rispondo, e taglio il tuo danno. Sta tutto scritto.", r: "carattere" } ],
    morte: [ { t: "L'archivio... resta.", r: "carattere" } ]
  },

  308: { // Messaggero Burlone — Imboscata: +2 POT
    entrata: [
      { t: "Ho notizie! Cattive per te, divertenti per me.", r: "comico" },
      { t: "Il mio sorriso è l'ultima cosa che vedrai.", r: "carattere" }
    ],
    vince: [ { t: "Ah! Te l'avevo *detto* che erano cattive notizie.", r: "comico" } ],
    perde: [ { t: "Ops. Questa non me l'aspettavo.", r: "comico" } ],
    triggerAttivato: [ { t: "Arrivo prima io! *Sorpresa!*", r: "comico" } ],
    morte: [ { t: "L'ultima... battuta...", r: "comico" } ]
  },

  309: { // Ombra del Creditore — Imboscata: -2 POT nem. (min 2)
    entrata: [
      { t: "Dove va il padrone, seguo io.", r: "carattere" },
      { t: "Non sono un servo. Sono un *promemoria*.", r: "carattere" },
      { t: "Vedi la mia ombra? Un debito sta per essere riscosso.", r: "carattere" }
    ],
    vince: [ { t: "Il creditore ringrazia.", r: "carattere" } ],
    perde: [ { t: "L'ombra si ritira. Per ora.", r: "carattere" } ],
    triggerAttivato: [ { t: "Colpisco per primo, dall'ombra. La tua forza cala.", r: "carattere" } ],
    morte: [ { t: "Torno... nell'ombra del padrone.", r: "carattere" } ]
  },

  310: { // Anima Dannata — Sfida: +1 POT, +1 DAN
    entrata: [
      { t: "Una volta ero un eroe.", r: "carattere" },
      { t: "Poi ho scoperto il prezzo della vittoria.", r: "carattere" }
    ],
    vince: [ { t: "Vinco ancora. Ma non è più una gioia.", r: "carattere" } ],
    perde: [ { t: "La dannazione... continua.", r: "carattere" } ],
    triggerAttivato: [ { t: "Mi sfidi? Ho già pagato tutto. Non ho più niente da perdere.", r: "carattere" } ],
    lore: [ { t: "Sono ciò che resta quando gli eroi leggono il contratto fino in fondo.", r: "lore", once: true } ],
    morte: [ { t: "Finalmente... la fine.", r: "carattere" } ]
  },

  315: { // Larva della Corte — Intervento: +2 POT
    entrata: [
      { t: "Ho firmato ieri. O oggi? *Ho fame*, comunque.", r: "comico" },
      { t: "Piccola? Aspetta di vedermi mangiare.", r: "carattere" },
      { t: "Un contratto tira l'altro.", r: "carattere" }
    ],
    vince: [ { t: "*Cresco!*", r: "comico" } ],
    perde: [ { t: "Non... non era abbastanza. Fame, ancora.", r: "carattere" } ],
    triggerAttivato: [ { t: "Arrivo seconda. Ma mangio *prima*.", r: "comico" } ],
    statNemico: {
      colosso: [ { t: "Così *grosso*... così tanto da mangiare.", r: "stat" } ],
      fragile: [ { t: "Sei piccolo come me. Ma io ho più fame.", r: "stat" } ]
    },
    lore: [ { t: "Ogni demone della Corte è iniziato così. Fame con le gambe.", r: "lore", once: true } ],
    morte: [ { t: "Non ancora... Esattore... non ancora...", r: "carattere" } ]
  },

  320: { // Messaggero Nefasto — Intervento: 2 Danni dir.
    entrata: [
      { t: "Quando mi vedi arrivare, è già troppo tardi.", r: "carattere" },
      { t: "Da adesso, sarà una pessima esistenza.", r: "carattere" }
    ],
    vince: [ { t: "Te l'avevo detto. Troppo tardi.", r: "carattere" } ],
    perde: [ { t: "Rimando la cattiva notizia.", r: "comico" } ],
    triggerAttivato: [ { t: "Rispondo per secondo. E il danno arriva comunque.", r: "carattere" } ],
    morte: [ { t: "L'ultimo... messaggio...", r: "carattere" } ]
  }

};

export default DIALOGHI_CORTE;
