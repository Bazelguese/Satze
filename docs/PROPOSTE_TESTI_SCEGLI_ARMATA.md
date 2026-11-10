# Proposte testi — "Scegli la tua armata"

Bozza da approvare. Nessun file del gioco è stato modificato.

I testi si trovano in due file:
- `src/components/menu/cosmic/armyLore.js`: motto, bonus, storia, stile consigliato, note tattiche;
- `src/components/menu/cosmic/deckLore.js`: tag e frase degli eserciti predefiniti.

## Come ho lavorato

- **Meccaniche:** controllate sul codice che fa girare la partita. Dove un documento dice altro, ho seguito il codice.
- **Storia:** controllata sui documenti di lore in `Documentazione/` (LORE_*.md, PDF Apex, schede TRE_ESERCITI).
  - Non ho usato `WORLDBUILDING_DESIGN.md` perché è superato: usa i vecchi nomi delle armate.
  - Non ho inventato fatti di lore. Dove ho scritto io una frase senza fonte, è segnato **[mio]**.
- **Linguaggio:**
  - Solo parole che il gioco mostra già: Agente, Potenza, Danno, Valore Assalto, Focus Coin, PV, Lega, Campo, scontro, turno.
  - Niente etichette inventate e niente gergo da design (burst, tank, snowball, matchup, setup…).
  - **Agenti**, mai "carte".
  - "Scontro" e non "duello", "turno" e non "round", "PV" e non "salute".
- **Lunghezze:** simili a quelle attuali, perché la banda BONUS sulla schermata ha spazio per circa 2–3 righe.

## Regole verificate nel codice, che valgono per tutte le armate

1. Il Bonus Armata è disponibile se nella **mano iniziale** (5 Agenti) ci sono **almeno 2 Agenti di quell'armata**. Per il Patto ne basta 1.
2. Il Bonus si applica solo quando **l'Agente giocato appartiene a quell'armata**.
3. **Chi sceglie per primo:**
   - il primo turno lo inizia chi ha la mano con la **Lega totale più bassa** (a parità si decide a caso);
   - poi si **alterna a ogni turno**.
   - Questo conta per Imboscata e Intervento.
4. Una partita dura al massimo circa 5 turni:
   - turni 1–4: vince chi conquista 3 Campi;
   - dal turno 5: vince chi ha più PV;
   - sempre: chi arriva a 0 PV perde.

> Nella scheda ho tolto le diciture "Sempre attivo", perché anche i bonus senza condizione richiedono la coppia in mano.

---

## 01 · Eserciti Personalizzati

**Il problema.** Oggi dice "Nessun bonus armata", ma è falso. Gli eserciti personalizzati attivano i Bonus come tutti gli altri: anche due Bonus diversi, se nella mano ci sono le coppie giuste. Inoltre la banda "COSA TROVI QUI" taglia il testo dopo circa 150 caratteri.

- **Motto**
  - Ora: "Nessun sigillo. Solo scelte."
  - Proposta: "I tuoi Agenti. Le tue regole." **[mio]**. Il motto attuale fa pensare che non ci sia bonus.
- **Etichetta bonus**
  - Ora: NESSUNO
  - Proposta: VARIABILE
- **Bonus · quando**
  - Ora: "Nessun bonus armata."
  - Proposta: "Dipende dalla mano: ogni armata con almeno 2 Agenti nella mano iniziale attiva il suo Bonus."
- **Bonus · spiegazione**
  - Proposta: "Il Bonus di un'armata vale quando giochi un suo Agente. Un esercito con più armate può attivare più Bonus, ma ognuna ha bisogno di 2 Agenti in mano (al Patto ne basta 1)."
- **Cosa trovi qui / Storia**
  - Proposta:
    > Gli eserciti che hai costruito tu: con Agenti di una sola armata o di armate diverse.
    >
    > Ogni armata porta con sé il suo Bonus, ma solo se nella mano iniziale ci sono almeno 2 suoi Agenti. Più armate mescoli, più spesso ti manca la coppia: la forza deve venire anche dagli Agenti stessi e da come si aiutano tra loro.
    >
    > Sceglili se ti piace costruire i tuoi eserciti e provare combinazioni che quelli predefiniti non hanno.
  - Il primo paragrafo sta nella banda senza essere tagliato.
- **Stile consigliato**
  - Proposta: "Con una sola armata il Bonus si attiva quasi sempre. Con due armate unisci i loro punti di forza, ma a volte una delle due resta senza coppia in mano."
- **Note tattiche**
  - Proposta: "Prima di costruire, decidi come vuoi vincere: conquistando 3 Campi o arrivando al 5° turno con più PV. Un esercito con un po' di tutto di solito non fa bene nessuna delle due cose."
  - Ho tolto la frase sulle probabilità della proposta precedente: non era calcolata.

---

## 02 · Figli dell'Orizzonte

**Il problema.** Storia e motto sono fedeli alla lore, salvo un dettaglio. Lo stile descrive solo uno dei tre eserciti, e le note sugli avversari non hanno fonte.

- **Motto:** invariato. "La Domanda cerca ancora una risposta."
- **Bonus · quando**
  - Ora: "Sempre attivo — nessun trigger richiesto."
  - Proposta: "Nessuna condizione: vale ogni volta che giochi un Agente dei Figli."
- **Bonus · spiegazione**
  - Proposta: "Il Valore Assalto del nemico scende di 5, ma mai sotto 6. Così vinci gli scontri spendendo meno Focus Coin."
- **Storia:** invariata, con una sola correzione. "molti uccidono senza neppure volerlo" diventa "molti uccidono, spesso senza volerlo". È la formula della fonte (LORE_FIGLI:11).
- **Stile consigliato**
  - Proposta: "Il bonus ti fa risparmiare Focus Coin in ogni scontro: tienili da parte e spendili negli scontri che decidono la partita."
- **Note tattiche**
  - Proposta: "Non spendere troppo nei primi due turni. Grazie al bonus anche gli Agenti con Potenza media vincono i loro scontri: sono loro a reggere la partita."
  - Ho tolto le frasi sugli avversari ("contro armate aggressive…") perché non hanno fonte.
- **Eserciti:** tag e frasi invariati.
  - **Dubbio:** l'esercito C dice "i Leggeri aprono, i Pesanti chiudono". Nella lore Leggeri e Pesanti sono tipi di creature, non Leghe 2 e 4. Lo lascio a te.

---

## 03 · Kethran

**Il problema.** Il bonus è spiegato male: Rimonta guarda i **PV**, non i territori. Il documento di design chiede anche di non presentarli come quelli che "aspettano di perdere": il loro gioco è scegliere quanto cedere.

- **Motto:** invariato. "Ci hanno spezzati. Non sapevano che i pezzi sanno combattere."
- **Bonus · quando**
  - Ora: "Si attiva in Rimonta — quando sei in svantaggio territoriale."
  - Proposta: "Rimonta: hai meno PV dell'avversario."
- **Bonus · spiegazione**
  - Proposta: "L'Agente guadagna +2 Potenza in questo scontro. Contano i PV, non i Campi: puoi essere avanti nei Campi e avere comunque il bonus."
- **Storia**
  - Proposta:
    > Furono costruttori ossessionati dall'altezza. Keth Vahar, la Spira Ascendente, crebbe per trenta generazioni nutrendosi dei regni vicini, finché una coalizione di nemici e un traditore non la fecero sprofondare intera nelle viscere del mondo. Nel buio i corpi si frantumarono e i frammenti impararono a ricomporsi: ora i Kethran sono collage viventi, più forti perché spezzati.
    >
    > Per loro cadere è ascendere. In battaglia sanno cosa possono permettersi di perdere — qualche PV, un Campo, un Agente — e lo trasformano nella forza dello scontro successivo.
    >
    > Sceglili se ti piace decidere quanto cedere, e quando colpire.
  - Fonti: LORE_KETHRAN:31-71, 107-133; PDF Kethran p.1 e p.19.
- **Stile consigliato**
  - Proposta: "Ai Kethran conviene perdere qualche PV, purché sia una scelta: quando hai meno PV dell'avversario, i tuoi Agenti diventano più forti."
- **Note tattiche**
  - Proposta: "Alcuni Agenti Kethran ti fanno perdere PV apposta per attivare il bonus. Non esagerare: dal 5° turno vince chi ha più PV."
- **Eserciti:** tag invariati.
  - "Processione dei Caduti": la frase "La processione non si ferma." contraddice il documento di design ("una sconfitta utile, non una processione incontrollata"). Proposta: "Ogni caduto paga il successivo. Ma ogni caduta va scelta."

---

## 04 · Corte Rossa

**Il problema.**
- La storia parla solo di specchi e imitazione. La lore invece parla di **contratti, debiti e clausole**.
- Lo stile dice che il giocatore può scegliere contro chi giocare, che non è vero.
- La frase dell'esercito B sui tre sigilli è sbagliata.
- Le note promettono che copiare Rimonta o Overdrive sia "devastante", ma il Bonus copiato ha le stesse condizioni dell'originale.

- **Motto**
  - Ora: "Ciò che vedi, lo diventi."
  - Proposta: "Leggi prima di firmare. Poi firma comunque." È il motto della lore (LORE_CORTE_ROSSA:2), accorciato. Se lo vuoi intero, aggiungo "Tutti lo fanno."
- **Bonus · quando**
  - Proposta: "Nessuna condizione propria: copi il Bonus Armata dell'avversario."
- **Bonus · spiegazione**
  - Proposta: "Usi il Bonus del nemico come se fosse tuo, con le sue condizioni: se è Rimonta, devi avere tu meno PV. Copiarlo non lo toglie al nemico."
- **Storia**
  - Proposta:
    > A Sethramis, città neutrale all'incrocio di tutte le rotte, i banchieri scrivevano contratti con clausole nascoste. Poi cominciarono a sognarli come fili da tirare. Vaelith Sorn tirò il primo e strappò la rabbia a un re: da allora la Corte non conquista, riscuote.
    >
    > Le sue armate sono prese in prestito dai vassalli. In battaglia gli Esattori tirano le clausole del nemico, e chi estrae assorbe qualcosa del volto altrui: per questo la Corte combatte con lo stile di chi ha davanti.
    >
    > Sceglili se ti piace usare contro l'avversario la sua stessa forza.
  - Fonti: LORE_CORTE_ROSSA:29-71, 95, 171-201; PDF Corte p.1.
- **Stile consigliato**
  - Proposta: "Il tuo bonus vale quanto quello del nemico: a volte è forte, a volte quasi niente. Per questo ogni esercito della Corte ha anche Agenti che funzionano da soli: danni diretti, blocchi, copie di Potenza, Danno e Potere."
- **Note tattiche**
  - Proposta: "Impara i Bonus delle altre armate: sono anche i tuoi, con le stesse condizioni. Se vuoi togliere il Bonus al nemico, ti servono Agenti con Blocca Bonus."
- **Eserciti**
  - "Il Contratto dei Tre Sigilli": "Tre sigilli. Bonus, Potere, forza — tutto può essere chiuso." diventa "Tre sigilli: uno ti rafforza, due chiudono il Bonus e il Potere del nemico."
  - Tag: vedi la domanda 1 in fondo.

---

## 05 · Calibri Pesanti

**Il problema.**
- La frase dell'esercito A ("La linea non avanza") contraddice sia la lore ("non attaccano. *Avanzano*") sia la storia sullo schermo ("un muro che avanza").
- "Tank puro" è falso per Batteria di Saturazione, che è un esercito d'attacco.
- "Macchine forgiate" è la vecchia versione: oggi sono un popolo, i Kyrathi, che si è sostituito il corpo con il metallo.

- **Motto:** invariato. "Acciaio. Inerzia. Sopravvivenza."
  - In alternativa c'è quello della lore: "Avevamo un nome, prima. Non importa più quale."
- **Bonus · quando**
  - Proposta: "Nessuna condizione: vale ogni volta che giochi un Agente dei Calibri."
- **Bonus · spiegazione**
  - Proposta: "Il Danno del nemico scende di 2, ma mai sotto 2. Quando perdi uno scontro, perdi meno PV."
- **Storia**
  - Proposta:
    > Erano i Kyrathi, clan di un pianeta duro che conosceva solo la guerra. Le Bombe Nere avvelenarono il loro mondo in una settimana; le navi per fuggire erano pronte, ma non partirono mai. Nelle miniere, i sopravvissuti cominciarono a sostituire la carne con il metallo, finché non rimase un popolo intero di Calibri Pesanti: artiglieria che cammina.
    >
    > Sul campo sono un muro che avanza. Incassano i colpi, fanno pagare cara ogni vittoria al nemico e intanto vanno avanti.
    >
    > Sceglili se ti piace resistere a lungo e vincere un passo alla volta.
  - Fonti: LORE_CALIBRI_PESANTI:29-141, 223-257; CALIBRI_…_CORRETTI:7.
- **Stile consigliato**
  - Proposta: "Il bonus rende meno pesante ogni scontro perso: non devi difendere tutti i Campi. Usa il tempo che guadagni per vincere gli scontri che contano."
- **Note tattiche**
  - Proposta: "Non giocare solo in difesa: anche i Calibri devono vincere i loro Campi. Il bonus pesa di più contro gli Agenti con tanto Danno; contro chi ha già 2 di Danno o meno non fa nulla."
- **Eserciti**
  - "La Linea Infrangibile": "La linea non avanza. Resiste — e vince per inerzia." diventa "La linea non arretra. Incassa, e intanto avanza."
  - "Protocollo di Ricostruzione": la frase cita "L2 e L4", che è gergo da design. Proposta: "Due blocchi, una ricostruzione: gli Agenti leggeri e quelli pesanti si passano il fronte."

---

## 06 · Orathai

**Il problema.** È l'armata più sbagliata.
- Il bonus si attiva **dal 3° scontro**, non quando le forze sono pari. Storia, stile e note sono tutti costruiti sull'idea sbagliata della parità.
- Il motto "Aspetta. Poi finisci." contraddice la fonte: gli Orathai *non* sono l'armata che aspetta.

- **Motto**
  - Ora: "Aspetta. Poi finisci."
  - Proposta: "Cantavamo per chiamarci tra le valli. Ora cantiamo, e le valli tremano." È il motto della lore (LORE_ORATHAI:2).
- **Bonus · quando**
  - Ora: "Si attiva in Resa dei Conti — duello equilibrato / pari."
  - Proposta: "Resa dei conti: dal 3° scontro in poi."
- **Bonus · spiegazione**
  - Proposta: "L'Agente guadagna +2 Danno in questo scontro. Dal 3° scontro in poi, ogni vittoria degli Orathai toglie più PV al nemico."
- **Storia**
  - Proposta:
    > A Vaeth, terra di montagne e foreste avvolte nella nebbia, vedere è un lusso: il suono viaggia. Gli Orathai si chiamavano da una valle all'altra con i fischi, finché non arrivarono invasori che non potevano sentirli. Allora la veggente Veleth insegnò loro le frequenze che feriscono.
    >
    > Ogni canto ruba qualcosa a chi lo intona: memoria, nome, identità. Veleth dimenticò il proprio e divenne l'Oracolo Velato. Ma il canto non si ferma, e ogni colpo degli Orathai fa più male del previsto.
    >
    > Sceglili se ti piace preparare i primi turni e colpire forte da metà partita in poi.
  - Fonti: LORE_ORATHAI:29-145, 243-251; ORATHAI_TRE_ESERCITI:11, 405.
  - Ho evitato "creature lignee": vedi la domanda 3.
- **Stile consigliato**
  - Proposta: "Nei primi due turni prova a prendere un Campo senza spendere troppi Focus Coin. Dal 3° scontro il bonus si accende e ogni vittoria fa più male."
- **Note tattiche**
  - Proposta: "Il bonus dipende solo dal numero dello scontro, non da chi è in vantaggio. Pochi Agenti Orathai ti danno Focus Coin: non sprecarli all'inizio."
- **Eserciti**
  - "Canto della Prima Vittoria": "La marea torna. Ogni vittoria la rende più alta." non ha nessuna immagine marina nella lore. Proposta: "Il canto torna. Ogni vittoria lo rende più alto."
  - Tag invariati, corretti secondo la fonte. "SUSTAIN" è inglese: vedi la domanda 1.

---

## 07 · Mounthborn

**Il problema.**
- Il bonus "condizione di agguato soddisfatta" è vago: Imboscata vuol dire **scegliere per primo**. Chi sceglie per primo si alterna a ogni turno, quindi il bonus scatta circa uno scontro su due.
- La storia usa "Nati dalla Bocca" senza dire che è la stessa armata.
- "Il gioco tattico" stona con la lore ("Non hanno strategia… Hanno Fame").
- Stile e note parlano solo degli scontri in cui scegli per primo, e non dicono cosa fare negli altri.

- **Motto:** invariato. "Quando li vedi, è troppo tardi."
- **Bonus · quando**
  - Ora: "Si attiva in Imboscata — condizione di agguato soddisfatta."
  - Proposta: "Imboscata: scegli il tuo Agente per primo."
- **Bonus · spiegazione**
  - Proposta: "L'Agente guadagna +1 Potenza e +1 Danno in questo scontro. Chi sceglie per primo cambia a ogni turno, quindi il bonus scatta circa uno scontro su due."
- **Storia**
  - Primo paragrafo: comincia con "I Mounthborn, i Nati dalla Bocca: una colonia insettoide…". Il resto è invariato.
  - Secondo paragrafo: invariato.
  - Terzo paragrafo, proposta: "Sceglili se ti piace colpire per primo, quando il nemico non ha ancora scelto il suo Agente."
- **Stile consigliato**
  - Proposta: "Nei turni in cui scegli per primo, gioca gli Agenti Mounthborn che vuoi potenziare. Negli altri turni usa Agenti che funzionano anche scegliendo per secondo."
- **Note tattiche**
  - Proposta: "Il primo turno lo inizia chi ha la mano con la Lega totale più bassa: una mano leggera ti dà il bonus subito."
- **Eserciti**
  - "Il Morso di Ritorno": tag da SUPREMAZIA · REATTIVA a **CONQUISTA · REATTIVA** (MOUNTHBORN_TRE_ESERCITI:36).
  - "Intelligenza di Sciame": tag da CONTROLLO · SCIAME a **CONQUISTA · ADATTIVA** (fonte :37).
  - "Intelligenza di Sciame": "Lo sciame non pensa da solo. Pensa insieme." contraddice la lore, dove pensa la Regina. Proposta: "Lo sciame non pensa. La Regina pensa per tutti."

---

## 08 · L'Enclave delle Scaglie

**Il problema.** La storia è fedele. Una frase però è sbagliata ("più tardi arrivi, più l'accumulo si fa pesante"): il bonus restituisce Focus Coin, non li fa crescere senza limiti. Due tag non corrispondono alla fonte.

- **Motto:** invariato. "Ogni corona rubata ci avvicina al cielo."
- **Bonus · quando**
  - Ora: "Si attiva in Conquista — dopo aver vinto il duello."
  - Proposta: "Conquista: vinci questo scontro."
- **Bonus · spiegazione**
  - Proposta: "Guadagni +2 Focus Coin. Ogni vittoria ti restituisce parte di quello che hai speso e ti aiuta a pagare lo scontro dopo."
- **Storia**
  - Primo paragrafo: invariato.
  - Secondo paragrafo, proposta: "Ogni vittoria è un saccheggio. Vinci, incassi, spendi di nuovo: il peso rubato ai vinti ora canta per l'Enclave."
  - Terzo paragrafo, proposta: "Sceglili se ti piace un piano semplice: vincere, incassare, vincere ancora."
- **Stile consigliato**
  - Proposta: "Vinci uno scontro, incassa i 2 Focus Coin e usali in quello dopo. Più vittorie metti in fila, più Focus Coin hai da spendere."
- **Note tattiche**
  - Proposta: "Non mettere 5 Focus Coin su ogni Agente contando sul bonus: ti restituisce 2 Focus Coin solo se vinci."
- **Eserciti**
  - "Il Tesoro Vuole Sangue": tag da PRESSIONE · ECONOMIA a **CONQUISTA · ECONOMICA** (ENCLAVE_TRE_ESERCITI:35).
  - "Il Trono Non Cade": tag da SUPREMAZIA · REATTIVA a **CONQUISTA · REATTIVA** (fonte :36; la fonte stessa usa anche "Conquista di rimonta").
  - **Dubbio di lore, lo lascio a te:** "Ascensione del Patriarca" dice "Ogni terra presa…", ma la lore dice "L'Enclave non combatte per territorio. Combatte per *peso*". Inoltre il Patriarca compare solo nel vecchio worldbuilding.

---

## 09 · Ratti della Megera

**Il problema.**
- La Tossina è descritta male. Si spegne quando il nemico arriva a 10 PV e cresce di 1 a ogni nuova Conquista.
- Il piano "partite lunghe, aspettare" contraddice la fonte: la Tossina vale di più se applicata presto e non chiude la partita da sola.
- La storia manca del cuore della lore: la Megera, il Marchio, l'amore malato.

- **Motto**
  - Ora: "Corrompere. Consumare. Aspettare."
  - Proposta: "Non lancia maledizioni. È la maledizione." È il motto della lore (LORE_RATTI:2).
- **Bonus · quando**
  - Proposta: "Conquista: vinci questo scontro."
- **Bonus · spiegazione**
  - Proposta: "Il nemico prende Tossina 1: perde 1 PV a fine di ogni turno, finché ha più di 10 PV. Ogni nuova Conquista la aumenta di 1."
- **Storia**
  - Proposta:
    > Esiliata dal suo mondo, la Megera trovò seguaci tra i reietti di Aethoria: diede loro cibo, riparo e un affetto falso. Poi il Marchio, un livido verdognolo a forma di labbra, che lega a lei con un amore totale. Dieci marchiati bastarono a incendiare una teocrazia intera.
    >
    > Gli eroi la uccisero e la bruciarono, ma la Megera non se n'è andata: è diventata una volontà che vive nel veleno. "Ratti" era un insulto; i corrotti l'hanno fatto loro.
    >
    > Sceglili se ti piace avvelenare il nemico e guardarlo perdere PV turno dopo turno.
  - Fonti: LORE_RATTI:29-231; DIALOGHI_RATTI:11-13.
- **Stile consigliato**
  - Proposta: "Cerca di vincere presto: prima applichi la Tossina, più turni ha per togliere PV. Da sola però non basta a vincere: devi anche prendere i Campi o arrivare al 5° turno con più PV."
- **Note tattiche**
  - Proposta: "La Tossina si ferma quando il nemico arriva a 10 PV: non può finirlo da sola. Non spendere troppi Focus Coin solo per applicarla."
- **Eserciti**
  - "Il Morbo che Spegne": tag da CONTROLLO · DEBUFF a **SUPREMAZIA · CONTROLLO** (RATTI_TRE_ESERCITI:38).
  - "Il Banchetto delle Malelabbra": tag da PRESSIONE · COMPOSITIVA a **CONQUISTA · ADATTIVA** (fonte :39).

---

## 10 · Patto degli Indocili

**Il problema.**
- Il riquadro dice "almeno due Agenti **uguali**" per le altre armate: è sbagliato, sono due Agenti della **stessa armata**.
- Motto e storia ("Mai uniti") vanno contro la lore, il cui tema è proprio il gruppo e il "non lasciare soli i tuoi".
- Non spiegano che 4 eserciti su 5 mescolano il Patto con altre armate.

- **Motto**
  - Ora: "Mai uniti. Mai sconfitti."
  - Proposta: "Non siamo eroi. Siamo il prezzo che paghi quando la città smette di ascoltare." È il motto della lore (LORE_PATTO:2).
  - Il vecchio motto è anche in `STEAM_PAGINA.md:169`.
- **Bonus · quando**
  - Proposta: "Rinforzi: nella mano iniziale c'erano altri 2 Agenti della stessa Lega di quello giocato."
- **Bonus · spiegazione**
  - Proposta: "Il nemico perde 1 Potenza e 1 Danno in questo scontro, ma mai sotto 2. Conta la Lega, non l'armata: anche gli Agenti di altre armate fanno da rinforzo."
- **Riquadro "Diverso dalle altre"**
  - Proposta: "Alle altre armate servono 2 Agenti della stessa armata in mano. Al Patto ne basta 1: per ogni Agente del Patto che giochi, conta quanti Agenti della stessa Lega avevi in mano."
- **Storia**
  - Proposta:
    > Nei Quartieri Cerniera, cintura industriale di neon sporco e pioggia, ogni traffico passa di lì e paga due volte: allo Stato e alla strada. Per anni i clan si fecero la guerra, finché tre figure non incisero con una torcia, su una saracinesca, il Primo Patto: "oggi non ci spariamo addosso".
    >
    > Si chiamano Indocili perché obbediscono solo quando conviene. La loro fedeltà ha una scadenza, ma la regola resta: non lasciare soli i tuoi. In battaglia arrivano in tanti nel punto giusto, e il nemico si ritrova più debole di quanto credeva.
    >
    > Sceglili se ti piace combattere in gruppo, anche accanto ad altre armate, e indebolire il nemico.
  - Fonti: LORE_PATTO:14-86; PATTO_CINQUE_MAZZI:9, 437-439.
- **Stile consigliato**
  - Proposta: "Riempi l'esercito di Agenti della stessa Lega: più ne hai in mano, più spesso arrivano i Rinforzi. Quattro eserciti del Patto su cinque usano anche Agenti di un'altra armata."
- **Note tattiche**
  - Proposta: "Il bonus non abbassa mai la Potenza o il Danno del nemico sotto 2: contro Agenti deboli fa poco. Si attiva solo quando giochi un Agente del Patto, ma gli altri Agenti in mano contano come rinforzi se hanno la Lega giusta."
- **Eserciti**
  - "La Città a Due Livelli":
    - tag da MONO · BIPOLARE a **UNA ARMATA · DUE LEGHE**;
    - frase: oggi è una regola ("la fascia maggioritaria riceve Rinforzi"). Proposta: "Due livelli, una città: chi sta sopra e chi sta sotto si coprono a vicenda." **[mio]**

---

## 11 · Khemet

**Il problema.** I testi trattano Immune come invulnerabilità totale ("nulla li ferma"). In realtà blocca solo i **malus** del nemico a Potenza, Danno e Valore Assalto: non ferma Blocca Potere, Blocca Bonus e i danni diretti. Inoltre:
- "fase di power spike" non è la regola: Overdrive vuol dire mettere 5 o più Focus Coin su quell'Agente;
- "non lasciarla scadere" non ha senso, perché l'Overdrive non si accumula.

- **Motto**
  - Ora: "Quando si attivano, nulla li ferma."
  - Proposta: "Il sigillo decide cosa può toccarci." **[mio]**: per Khemet non c'è un motto nelle fonti.
- **Bonus · quando**
  - Ora: "Si attiva in Overdrive — fase di power spike."
  - Proposta: "Overdrive: metti 5 o più Focus Coin su questo Agente."
- **Bonus · spiegazione**
  - Proposta: "L'Agente diventa Immune: in questo scontro il nemico non può abbassargli Potenza, Danno o Valore Assalto. Non lo protegge da Blocca Potere, Blocca Bonus e danni diretti."
- **Storia**
  - Proposta:
    > Sigillatori, maestri runici, fattucchieri e arconti della non-morte: i Khemet sono una cabala di maghi in armatura gotico-egizia. Nati da una tradizione elementale, dopo il contatto con il loro Giocatore sono arrivati a riscrivere la materia stessa. Non sono una setta in rovina: governano.
    >
    > Per loro ogni scontro è un rito. Quando il rito è completo, il sigillo si chiude attorno all'Agente e il nemico non riesce più a indebolirlo.
    >
    > Sceglili se ti piace scegliere pochi scontri importanti e vincerli senza che il nemico possa ostacolarti.
  - Fonti: FRAMEWORK_ARMATA_OVERDRIVE_IMMUNE:16, 164-176; KHEMET_TRE_ESERCITI:15, 923.
- **Stile consigliato**
  - Proposta: "Non puoi andare in Overdrive ogni turno: di solito i Focus Coin bastano per 3 volte. Scegli tu gli scontri da proteggere. Il bonus non rende l'Agente più forte: impedisce al nemico di indebolirlo."
- **Note tattiche**
  - Proposta: "Contro Blocca Potere, Blocca Bonus e danni diretti l'Overdrive non ti protegge. Non serve solo agli Agenti d'attacco: puoi usarlo anche per proteggere un Agente che indebolisce il nemico."
- **Eserciti**
  - "Il Nono Sigillo": tag da PICCO · OVERDRIVE a **CONQUISTA · OVERDRIVE**. La fonte dice "Conquista esplosiva".
  - "Il Tributo delle Calamità": "Lo paghi in Focus e PV." è sbagliato, perché l'esercito *guadagna* Focus Coin e paga in PV. Proposta: "Le calamità hanno un prezzo. Lo paghi in PV, e i Focus Coin tornano indietro."

---

## 12 · Apex

**Il problema.**
- Le note citano "Rinforzi", ma nessun Agente Apex ce l'ha: hanno Alleato.
- C'è una frase senza verbo ("La Gerarchia della Carne non ereditata").
- La storia non dice chi sono: primati elevati dal loro Giocatore.
- "Proteggi le conquiste" non ha senso: nel codice non ho trovato modi per perdere un Campo già conquistato.

- **Motto**
  - Ora: "Ridevi quando ci scegliesti."
  - Proposta: "Ridevi quando ci scegliesti. Guarda quanto costa ridere adesso." È il verso completo della fonte (APEX_LORE2 p.5).
- **Bonus · quando**
  - Proposta: "Invasione: hai già conquistato almeno 1 Campo."
- **Bonus · spiegazione**
  - Proposta: "L'Agente guadagna +5 Valore Assalto in questo scontro. Basta il primo Campo: da lì in poi il bonus vale per il resto della partita."
- **Storia**
  - Proposta:
    > Sulla Crosta Bianca di Khaar il ghiaccio è legge. Gli Apex erano primati impauriti, finché il loro Giocatore, Varkesh, non li scelse tra ciò che gli altri avevano scartato e li elevò.
    >
    > Non conquistano per governare: smontano, scuoiano, riportano il bottino alla Loggia. Nella Gerarchia della Carne il potere non si eredita: comanda chi riempie le ciotole, finché un altro non dimostra di saperlo fare meglio. Ogni Campo preso diventa una nuova base di caccia.
    >
    > Sceglili se ti piace partire in svantaggio e, dal primo Campo conquistato, non lasciare più respiro al nemico.
  - Fonti: APEX_LORE p.1, 12; APEX_LORE2 p.1-6; APEX_TRE_ESERCITI:915.
- **Stile consigliato**
  - Proposta: "Finché non conquisti un Campo giochi senza bonus. Prendine uno il prima possibile: da lì in poi ogni Agente Apex ha +5 Valore Assalto."
- **Note tattiche**
  - Proposta: "Nell'esercito La Prima Preda, Dissuasore di turisti e Volontà del Sole Verde spengono il Potere e il Bonus del nemico: il primo dopo che hai conquistato un Campo, il secondo dopo che hai vinto lo scontro precedente."
- **Eserciti**
  - "La Loggia Non Arretra": "Ripara, resiste, riconquista." diventa "Ripara, resiste, torna a cacciare."
  - Tag: vedi la domanda 1 ("SNOWBALL", "SUSTAIN").

---

## 13 · Mascarada

**Il problema.** Nel repo **non c'è un documento di lore** della Mascarada: i documenti citano un `ARMATA_MASCARADA_v0.5.md` che non esiste. Per questo correggo solo le meccaniche e il gergo, e lascio la lore com'è.
- "Chiudere con Imboscate" è sbagliato: gli Agenti Mascarada con Imboscata servono a inizio partita.
- "questo turno" va scritto "in questo scontro".
- "Picchi di midcard" non si capisce.

- **Motto:** invariato. "Il pubblico paga. Tu riscuoti."
- **Bonus · quando**
  - Ora: "Si attiva in Opportunista — il nemico ha speso 5+ Focus Coin questo turno."
  - Proposta: "Opportunista: il nemico ha speso 5 o più Focus Coin in questo scontro."
- **Bonus · spiegazione**
  - Proposta: "Guadagni +2 Focus Coin. Se il nemico spende tanto per batterti, ti paga comunque lo scontro dopo."
- **Storia**
  - Primo e secondo paragrafo: invariati.
  - Terzo paragrafo, proposta: "Sceglili se ti piace far spendere il nemico e incassare tu."
- **Stile consigliato**
  - Proposta: "Metti il nemico davanti a una scelta: perdere lo scontro, oppure vincerlo spendendo tanto e regalarti 2 Focus Coin. Poi usa quei Focus Coin negli scontri dopo."
- **Note tattiche**
  - Proposta: "Se il nemico spende poco, il bonus non si attiva: rendigli costoso ogni scontro. Montgomery (Il Main Event) e Dandelion (Heel Turn) colpiscono chi spende 5 o più Focus Coin; Mary (Curtain Call) dà il meglio dopo uno scontro vinto."
- **Eserciti:** frasi invariate. Per i tag in inglese ("TECH", "TITLE · FACE", "TITLE · HEEL") vedi la domanda 1.

---

## Domande aperte (servono le tue decisioni)

1. **Cosa devono dire i tag degli eserciti?**
   - Oggi la prima parola mescola condizioni di vittoria (CONQUISTA, SUPREMAZIA) e stili (CONTROLLO, PRESSIONE, PICCO, TITLE, MONO).
   - Io ho allineato alla fonte solo quelli che la contraddicono.
   - Vuoi una regola unica, per esempio "condizione di vittoria · stile" in italiano? In quel caso andrebbero toccati anche SNOWBALL, SUSTAIN, TECH, TITLE · FACE/HEEL, BIPOLARE, COMPOSITIVA.
2. **Kethran:** "armata del comeback", come dice la lore, o "decidono quanto cedere", come dice il documento di design più recente? Ho proposto la seconda.
3. **Orathai:** sono creature di legno, come dicono gli Agenti, o con la pelle segnata, come dice la lore? Ho evitato di sceglierlo.
4. **Mounthborn:** il nome si scrive davvero così, o è "Mouthborn" ("nati dalla bocca")? Nel repo è scritto "Mounthborn" ovunque.
5. **Mascarada:** hai un documento di lore da usare? Nel repo non c'è.
6. **Motti:** dove esiste un motto nella lore, ho proposto quello solo per le armate in cui quello attuale contraddice la lore o il gioco. Va bene così, o li vuoi tutti dalla lore?

## Fuori dai testi (segnalo, non tocco)

- Il **Patto** ha 5 eserciti e il contatore dice "5", ma la scheda e il Dossier ne mostrano solo 3 (limite nel codice).
- La banda "COSA TROVI QUI" degli Eserciti Personalizzati taglia il testo con "…".
- `Documentazione/GLOSSARIO.md` dice che il Bonus Armata richiede 2+ Agenti "nel Deck", ma il codice guarda la mano iniziale. Inoltre non elenca Apex e Mascarada.
- L'IA, quando prevede lo scontro successivo, usa la regola sbagliata "chi perde sceglie per primo" (`src/game/ai/projectPostDuelState.js`). Anche due documenti di design la riportano (`MOUNTHBORN_TRE_ESERCITI.md`, `RATTI_DELLA_MEGERA_TRE_ESERCITI.md`).
