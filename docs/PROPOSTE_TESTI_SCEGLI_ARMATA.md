# Proposte testi — "Scegli la tua armata"

Bozza da approvare. Nessun file del gioco è stato modificato.

I testi si trovano in due file:
- `src/components/menu/cosmic/armyLore.js`: motto, bonus, storia, stile consigliato, note tattiche;
- `src/components/menu/cosmic/deckLore.js`: tag e frase degli eserciti predefiniti.

## Come ho lavorato

- **Meccaniche:** controllate sul codice del gioco. Dove un documento dice altro, ho seguito il codice.
- **Storia:** controllata sui documenti di lore in `Documentazione/` (LORE_*.md, PDF Apex, schede TRE_ESERCITI).
  - Non ho usato `WORLDBUILDING_DESIGN.md` perché è superato: usa i vecchi nomi delle armate.
  - Non ho inventato fatti di lore. Dove ho scritto io una frase senza fonte, è segnato **[mio]**.
- **Vocabolario del glossario ufficiale:**
  - "scontro", non "duello";
  - "turno", non "round";
  - "PV", non "salute" o "vita".
- **Lunghezze:** simili a quelle attuali, perché la banda BONUS sulla schermata ha spazio per circa 2–3 righe.

## Regole verificate nel codice, che valgono per tutte le armate

1. Il Bonus Armata è disponibile se nella **mano iniziale** (5 carte) ci sono **almeno 2 Agenti di quell'armata**. Per il Patto ne basta 1.
2. Il Bonus si applica solo quando **la carta giocata appartiene a quell'armata**.
3. **Chi perde uno scontro sceglie per primo** nello scontro successivo. Questo conta per Imboscata e Intervento.
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
  - Proposta: "Le tue carte. I tuoi sigilli." **[mio]**. Il motto attuale suggerisce che non ci sia bonus.
- **Etichetta bonus**
  - Ora: NESSUNO
  - Proposta: VARIABILE
- **Bonus · quando**
  - Ora: "Nessun bonus armata."
  - Proposta: "Dipende dalla mano: ogni armata con almeno 2 Agenti nella mano iniziale attiva il suo Bonus."
- **Bonus · spiegazione**
  - Proposta: "Il Bonus di un'armata vale quando giochi un suo Agente. Un esercito misto può attivare più Bonus, ma ognuno ha bisogno della sua coppia in mano (al Patto basta un Agente)."
- **Cosa trovi qui / Storia**
  - Proposta:
    > Gli eserciti che hai costruito tu: liste di una sola armata o coalizioni tra armate diverse.
    >
    > Ogni armata porta con sé il suo Bonus, ma solo se nella mano iniziale ci sono almeno 2 suoi Agenti. Più armate mescoli, più spesso resti senza coppie: la forza deve venire anche dalle carte e da come si combinano.
    >
    > Sceglili se ami costruire eserciti, rifinire liste e provare combinazioni che i predefiniti non coprono.
  - Il primo paragrafo sta nella banda senza essere tagliato.
- **Stile consigliato**
  - Proposta: "Costruzione libera. Decidi prima il piano: una sola armata per avere il Bonus quasi sempre, oppure due armate per unire i loro punti di forza, accettando che a volte una coppia manchi."
- **Note tattiche**
  - Proposta: "Contare le coppie conta più di quanto sembri: con due armate da 5 carte, la mano iniziale ha buone probabilità di attivare almeno un Bonus, ma non sempre entrambi. Evita le liste con un po' di tutto."
  - **Da verificare:** la frase sulle probabilità è mia. Se preferisci, la tolgo o la calcolo.

---

## 02 · Figli dell'Orizzonte

**Il problema.** Storia e motto sono fedeli alla lore, salvo un dettaglio. Lo stile descrive solo l'esercito B, mentre l'esercito A, quello con cui si presenta l'armata, è una Conquista aggressiva. Le note sui matchup non hanno fonte.

- **Motto:** invariato. "La Domanda cerca ancora una risposta."
- **Bonus · quando**
  - Ora: "Sempre attivo — nessun trigger richiesto."
  - Proposta: "Nessuna condizione: basta giocare un Agente dei Figli."
- **Bonus · spiegazione**
  - Proposta: "Il Valore Assalto nemico scende di 5, ma mai sotto 6. Puoi vincere spendendo meno Focus Coin, e il nemico deve investirne di più per batterti."
- **Storia:** invariata, con una sola correzione. "molti uccidono senza neppure volerlo" diventa "molti uccidono, spesso senza volerlo". È la formula della fonte (LORE_FIGLI:11).
- **Stile consigliato**
  - Proposta: "Controllo del margine. Il bonus ti lascia vincere con meno Focus Coin: risparmiali per gli scontri che contano. Il Sole Prima della Fine spinge sui primi Campi, La Domanda Senza Fine controlla e cresce dal 3° scontro, Liturgia dell'Ancora si adatta alla mano."
- **Note tattiche**
  - Proposta: "Non spendere troppo nei primi due turni per una partenza spettacolare. Il bonus rende affidabili gli Agenti con Potenza media: sono loro a reggere la partita."
  - Ho tolto i matchup ("contro armate aggressive…", "contro tank lunghi…") perché non hanno fonte.
- **Eserciti:** tag e frasi invariati.
  - **Dubbio:** l'esercito C dice "i Leggeri aprono, i Pesanti chiudono". Nella lore Leggeri e Pesanti sono tipi di creature, non Leghe 2 e 4. Lo lascio a te.

---

## 03 · Kethran

**Il problema.** Il bonus è spiegato male: Rimonta guarda i **PV**, non i territori. La fonte di design (PDF dei tre eserciti) chiede anche di non presentarli come "l'armata del comeback", ma come quella che sceglie una perdita controllata.

- **Motto:** invariato. "Ci hanno spezzati. Non sapevano che i pezzi sanno combattere."
- **Bonus · quando**
  - Ora: "Si attiva in Rimonta — quando sei in svantaggio territoriale."
  - Proposta: "Rimonta: hai meno PV dell'avversario."
- **Bonus · spiegazione**
  - Proposta: "+2 Potenza in questo scontro. Contano i PV, non i Campi: puoi essere avanti nei Campi e sotto nei PV, e il bonus resta attivo."
- **Storia**
  - Proposta:
    > Furono costruttori ossessionati dall'altezza. Keth Vahar, la Spira Ascendente, crebbe per trenta generazioni nutrendosi dei regni vicini, finché una coalizione di nemici e un traditore non la fecero sprofondare intera nelle viscere del mondo. Nel buio i corpi si frantumarono e i frammenti impararono a ricomporsi: ora i Kethran sono collage viventi, più forti perché spezzati.
    >
    > Per loro cadere è ascendere. In battaglia scelgono quale perdita possono permettersi — qualche PV, un Campo, una carta — e la trasformano nella forza dello scontro successivo.
    >
    > Sceglili se ti piace decidere quanto cedere, e quando riscuotere.
  - Fonti: LORE_KETHRAN:31-71, 107-133; PDF Kethran p.1 e p.19.
- **Stile consigliato**
  - Proposta: "Perdita controllata. Cedi qualcosa che puoi permetterti e usalo per vincere gli scontri che decidono. Non serve stare sempre sotto: serve esserlo al momento giusto."
- **Note tattiche**
  - Proposta: "Il bonus si attiva solo quando hai meno PV dell'avversario. Alcuni Agenti si feriscono apposta per accenderlo, ma non esagerare: dal 5° turno vince chi ha più PV."
  - Ho tolto "passivo dormiente": il bonus dei Kethran non è un passivo.
- **Eserciti:** tag invariati.
  - "Processione dei Caduti": la frase "La processione non si ferma." contraddice il PDF ("una sconfitta utile, non una processione incontrollata"). Proposta: "Ogni caduto paga il successivo. Ma ogni caduta va scelta."

---

## 04 · Corte Rossa

**Il problema.**
- La storia parla solo di specchi e imitazione. La lore invece parla di **contratti, debiti e clausole**.
- Lo stile dice che il giocatore può "scegliere matchup", che non è vero.
- La frase dell'esercito B sui tre sigilli è sbagliata.
- Le note promettono che copiare Rimonta o Overdrive sia "devastante", ma il Bonus copiato ha le stesse condizioni dell'originale.

- **Motto**
  - Ora: "Ciò che vedi, lo diventi."
  - Proposta: "Leggi prima di firmare. Poi firma comunque." È il motto della lore (LORE_CORTE_ROSSA:2), accorciato. Se lo vuoi intero, aggiungo "Tutti lo fanno."
- **Bonus · quando**
  - Proposta: "Nessuna condizione propria: copi il Bonus Armata dell'avversario."
- **Bonus · spiegazione**
  - Proposta: "Usi il Bonus nemico come se fosse tuo, con le sue condizioni: se è Rimonta, devi avere tu meno PV. Copiarlo non lo toglie all'avversario."
- **Storia**
  - Proposta:
    > A Sethramis, città neutrale all'incrocio di tutte le rotte, i banchieri scrivevano contratti con clausole nascoste. Poi cominciarono a sognarli come fili da tirare. Vaelith Sorn tirò il primo e strappò la rabbia a un re: da allora la Corte non conquista, riscuote.
    >
    > Le sue armate sono prese in prestito dai vassalli. In battaglia gli Esattori tirano le clausole del nemico, e chi estrae assorbe qualcosa del volto altrui: per questo la Corte combatte con lo stile di chi ha davanti.
    >
    > Sceglili se ti piace usare contro l'avversario ciò che lui stesso ha portato in partita.
  - Fonti: LORE_CORTE_ROSSA:29-71, 95, 171-201; PDF Corte p.1.
- **Stile consigliato**
  - Proposta: "Riscuotere. Copia, blocca o converti in danni il valore dell'avversario. Non contare solo sul Bonus copiato: ogni esercito ha un piano proprio (danni diretti, blocchi, copie di POT, DAN e Potere)."
- **Note tattiche**
  - Proposta: "Impara i Bonus delle altre armate: sono anche i tuoi, condizioni comprese. Contro un Bonus debole la copia rende poco. Per spegnere il Bonus originale servono carte con Blocca Bonus."
- **Eserciti**
  - "Il Contratto dei Tre Sigilli": "Tre sigilli. Bonus, Potere, forza — tutto può essere chiuso." diventa "Tre sigilli: uno rafforza la tua mano, due chiudono il Bonus e il Potere nemici."
  - Tag: vedi la domanda 1 in fondo.

---

## 05 · Calibri Pesanti

**Il problema.**
- La frase dell'esercito A ("La linea non avanza") contraddice sia la lore ("non attaccano. *Avanzano*") sia la storia sullo schermo ("un muro che avanza").
- "Tank puro" è falso per Batteria di Saturazione, che è aggressiva.
- "Macchine forgiate" è la vecchia versione: oggi sono un popolo, i Kyrathi, che si è sostituito il corpo con il metallo.

- **Motto:** invariato. "Acciaio. Inerzia. Sopravvivenza."
  - In alternativa c'è quello della lore: "Avevamo un nome, prima. Non importa più quale."
- **Bonus · quando**
  - Proposta: "Nessuna condizione: basta giocare un Agente dei Calibri."
- **Bonus · spiegazione**
  - Proposta: "Il Danno nemico scende di 2, ma mai sotto 2. Ogni scontro perso ti costa meno PV: hai tempo per rifarti."
- **Storia**
  - Proposta:
    > Erano i Kyrathi, clan di un pianeta duro che conosceva solo la guerra. Le Bombe Nere avvelenarono il loro mondo in una settimana; le navi per fuggire erano pronte, ma non partirono mai. Nelle miniere, i sopravvissuti cominciarono a sostituire la carne con il metallo, finché non rimase un popolo intero di Calibri Pesanti: artiglieria che cammina.
    >
    > Sul campo sono un muro che avanza. Assorbono i colpi, riducono ciò che il nemico può togliere loro e trasformano il tempo guadagnato in superiorità.
    >
    > Sceglili se preferisci stabilità e vittorie per attrito.
  - Fonti: LORE_CALIBRI_PESANTI:29-141, 223-257; CALIBRI_…_CORRETTI:7.
- **Stile consigliato**
  - Proposta: "Assorbire, poi colpire. Il bonus riduce il costo delle sconfitte: non devi difendere ogni Campo. La Linea Infrangibile tiene, la Batteria di Saturazione colpisce in Overdrive, il Protocollo di Ricostruzione si riprende."
- **Note tattiche**
  - Proposta: "Non giocare troppo sulla difensiva: anche un muro deve vincere i suoi Campi. Il -2 DAN pesa contro gli Agenti con tanto Danno; contro chi ha già 2 di Danno o meno non fa nulla."
- **Eserciti**
  - "La Linea Infrangibile": "La linea non avanza. Resiste — e vince per inerzia." diventa "La linea non arretra. Assorbe, e intanto avanza."
  - "Protocollo di Ricostruzione": la frase cita "L2 e L4", che è gergo da design. Proposta: "Due blocchi, una ricostruzione: le carte leggere e quelle pesanti si passano il fronte."

---

## 06 · Orathai

**Il problema.** È l'armata più sbagliata.
- Il bonus si attiva **dal 3° scontro**, non nei confronti equilibrati. Storia, stile e note sono tutti costruiti sull'idea sbagliata della parità.
- Il motto "Aspetta. Poi finisci." contraddice la fonte: gli Orathai *non* sono l'armata che aspetta.

- **Motto**
  - Ora: "Aspetta. Poi finisci."
  - Proposta: "Cantavamo per chiamarci tra le valli. Ora cantiamo, e le valli tremano." È il motto della lore (LORE_ORATHAI:2).
- **Bonus · quando**
  - Ora: "Si attiva in Resa dei Conti — duello equilibrato / pari."
  - Proposta: "Resa dei conti: dal 3° scontro in poi, quando entrambi avete già giocato 2 carte."
- **Bonus · spiegazione**
  - Proposta: "+2 Danno in questo scontro. Da metà partita ogni vittoria toglie più PV: usa i primi due turni per arrivarci in buona posizione."
- **Storia**
  - Proposta:
    > A Vaeth, terra di montagne e foreste avvolte nella nebbia, vedere è un lusso: il suono viaggia. Gli Orathai si chiamavano da una valle all'altra con i fischi, finché non arrivarono invasori che non potevano sentirli. Allora la veggente Veleth insegnò loro le frequenze che feriscono.
    >
    > Ogni canto ruba qualcosa a chi lo intona: memoria, nome, identità. Veleth dimenticò il proprio e divenne l'Oracolo Velato. Ma il canto non si ferma, e ogni colpo degli Orathai fa più male del previsto.
    >
    > Sceglili se ti piace costruire i primi turni e far pesare ogni ferita da metà partita in poi.
  - Fonti: LORE_ORATHAI:29-145, 243-251; ORATHAI_TRE_ESERCITI:11, 405.
  - Ho evitato "creature lignee": vedi la domanda 3.
- **Stile consigliato**
  - Proposta: "Crescita dal 3° scontro. Nei primi due turni prova a conquistare un Campo senza bruciare Focus Coin; dal terzo il +2 Danno rende ogni vittoria più pesante."
- **Note tattiche**
  - Proposta: "Il bonus non chiede parità né svantaggio: conta solo il numero dello scontro. Hai pochi Agenti che producono Focus Coin, quindi dosali. Il Bosco Non Muore punta a finire con più PV, non a portare il nemico a zero."
- **Eserciti**
  - "Canto della Prima Vittoria": "La marea torna. Ogni vittoria la rende più alta." non ha nessuna immagine marina nella lore. Proposta: "Il canto torna. Ogni vittoria lo rende più alto."
  - Tag invariati, corretti secondo la fonte. "SUSTAIN" è inglese: vedi la domanda 1.

---

## 07 · Mounthborn

**Il problema.**
- Il bonus "condizione di agguato soddisfatta" è vago: Imboscata vuol dire **scegliere per primo**, e chi perde uno scontro sceglie per primo nel successivo.
- La storia usa "Nati dalla Bocca" senza dire che è la stessa armata.
- "Il gioco tattico" stona con la lore ("Non hanno strategia… Hanno Fame").
- Lo stile ignora metà dell'armata (Vendetta, Rimonta, Intervento).

- **Motto:** invariato. "Quando li vedi, è troppo tardi."
- **Bonus · quando**
  - Ora: "Si attiva in Imboscata — condizione di agguato soddisfatta."
  - Proposta: "Imboscata: scegli il tuo Agente per primo (succede, per esempio, dopo uno scontro perso)."
- **Bonus · spiegazione**
  - Proposta: "+1 Potenza e +1 Danno in questo scontro. Perdere ti dà l'iniziativa nello scontro dopo: la Colonia si nutre anche delle sconfitte."
- **Storia**
  - Primo paragrafo: comincia con "I Mounthborn, i Nati dalla Bocca: una colonia insettoide…". Il resto è invariato.
  - Secondo paragrafo: invariato.
  - Terzo paragrafo, proposta: "Sceglili se ti piace colpire per primo e trasformare anche le sconfitte in fame per lo scontro dopo."
- **Stile consigliato**
  - Proposta: "Colpire per primo, poi tornare. Il bonus scatta quando scegli per primo. Gli eserciti usano anche Vendetta, Rimonta e Intervento per non dipendere solo dalla prima posizione."
- **Note tattiche**
  - Proposta: "Non cercare di vincere il primo Campo a ogni costo: una sconfitta ti restituisce l'iniziativa. Nessun esercito produce Focus Coin, quindi spendili dove il +1/+1 cambia l'esito."
- **Eserciti**
  - "Il Morso di Ritorno": tag da SUPREMAZIA · REATTIVA a **CONQUISTA · REATTIVA** (MOUNTHBORN_TRE_ESERCITI:36).
  - "Intelligenza di Sciame": tag da CONTROLLO · SCIAME a **CONQUISTA · ADATTIVA** (fonte :37).
  - "Intelligenza di Sciame": "Lo sciame non pensa da solo. Pensa insieme." contraddice la lore, dove pensa la Regina. Proposta: "Lo sciame non pensa. La Regina pensa per tutti."

---

## 08 · L'Enclave delle Scaglie

**Il problema.** La storia è fedele. Una frase però è sbagliata ("più tardi arrivi, più l'accumulo si fa pesante"): il bonus è un rimborso e i Focus Coin sono 18 in tutto. Due tag non corrispondono alla fonte.

- **Motto:** invariato. "Ogni corona rubata ci avvicina al cielo."
- **Bonus · quando**
  - Ora: "Si attiva in Conquista — dopo aver vinto il duello."
  - Proposta: "Conquista: vinci questo scontro."
- **Bonus · spiegazione**
  - Proposta: "+2 Focus Coin. Ogni vittoria rimborsa parte dell'investimento e finanzia lo scontro successivo."
- **Storia**
  - Primo paragrafo: invariato.
  - Secondo paragrafo, proposta: "Ogni vittoria è un saccheggio di significato. Vinci, incassi Focus Coin, reinvesti, stringi: il peso rubato ai vinti ora canta per l'Enclave."
  - Terzo paragrafo, proposta: "Sceglili se vuoi un piano chiaro: vincere, riscuotere, reinvestire nella conquista successiva."
- **Stile consigliato**
  - Proposta: "Investire e riscuotere. Vinci, incassa i +2 Focus Coin e reinvestili nello scontro dopo. Il Trono Non Cade usa lo stesso motore per rimontare."
- **Note tattiche**
  - Proposta: "I +2 Focus Coin sono un rimborso, non un guadagno garantito: non mettere 5 Focus Coin su ogni carta contando sul bonus. Ne hai 18 per tutta la partita."
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
    > Sceglili se ti piace vincere scontri sporchi e lasciare che il veleno consumi i PV dell'avversario turno dopo turno.
  - Fonti: LORE_RATTI:29-231; DIALOGHI_RATTI:11-13.
- **Stile consigliato**
  - Proposta: "Conquiste presto. La Tossina rende di più se la applichi nei primi turni, perché ha più tempo per lavorare. Da sola non chiude: serve vincere i Campi o arrivare al 5° turno con più PV."
- **Note tattiche**
  - Proposta: "La Tossina si spegne quando il nemico arriva a 10 PV: non può finirlo da sola. Non spendere troppo solo per applicarla."
- **Eserciti**
  - "Il Morbo che Spegne": tag da CONTROLLO · DEBUFF a **SUPREMAZIA · CONTROLLO** (RATTI_TRE_ESERCITI:38).
  - "Il Banchetto delle Malelabbra": tag da PRESSIONE · COMPOSITIVA a **CONQUISTA · ADATTIVA** (fonte :39).

---

## 10 · Patto degli Indocili

**Il problema.**
- Il riquadro dice "almeno due Agenti **uguali**" per le altre armate: è sbagliato, sono due Agenti della **stessa armata**.
- Motto e storia ("Mai uniti") vanno contro la lore, il cui tema è proprio la rete e il "non lasciare soli i tuoi".
- Non spiegano che 4 eserciti su 5 mescolano il Patto con altre armate.

- **Motto**
  - Ora: "Mai uniti. Mai sconfitti."
  - Proposta: "Non siamo eroi. Siamo il prezzo che paghi quando la città smette di ascoltare." È il motto della lore (LORE_PATTO:2).
  - Il vecchio motto è anche in `STEAM_PAGINA.md:169`.
- **Bonus · quando**
  - Proposta: "Rinforzi: nella mano iniziale c'erano altre 2 carte della stessa Lega della carta giocata."
- **Bonus · spiegazione**
  - Proposta: "Il nemico perde 1 Potenza e 1 Danno in questo scontro, mai sotto 2. Conta la Lega, non l'armata: anche le carte di altre armate fanno da rinforzo."
- **Riquadro "Diverso dalle altre"**
  - Proposta: "Alle altre armate servono 2 Agenti della stessa armata in mano. Al Patto ne basta 1: il bonus si controlla carta per carta, in base alla Lega."
- **Storia**
  - Proposta:
    > Nei Quartieri Cerniera, cintura industriale di neon sporco e pioggia, ogni traffico passa di lì e paga due volte: allo Stato e alla strada. Per anni i clan si fecero la guerra, finché tre figure non incisero con una torcia, su una saracinesca, il Primo Patto: "oggi non ci spariamo addosso".
    >
    > Si chiamano Indocili perché obbediscono solo quando conviene. La loro fedeltà ha una scadenza, ma la regola resta: non lasciare soli i tuoi. In battaglia arrivano in tanti sul punto giusto, e l'avversario si ritrova più debole di quanto credeva.
    >
    > Sceglili se ti piace costruire la mano per Leghe, combattere accanto ad altre armate e togliere forza al nemico.
  - Fonti: LORE_PATTO:14-86; PATTO_CINQUE_MAZZI:9, 437-439.
- **Stile consigliato**
  - Proposta: "Densità di Lega. Costruisci la mano attorno a una o due Leghe: più carte della stessa Lega hai, più spesso arrivano i Rinforzi. Quattro eserciti su cinque mescolano il Patto con un'altra armata."
- **Note tattiche**
  - Proposta: "Il -1/-1 non fa nulla contro Agenti che hanno già 2 di Potenza e di Danno. Il bonus si applica solo quando giochi una carta del Patto, ma le altre carte della mano contano come rinforzi se hanno la Lega giusta."
- **Eserciti**
  - "La Città a Due Livelli":
    - tag da MONO · BIPOLARE a **MONOARMATA · DUE LEGHE**;
    - frase: oggi è una regola ("la fascia maggioritaria riceve Rinforzi"). Proposta: "Due livelli, una città: chi sta sopra e chi sta sotto si coprono a vicenda." **[mio]**

---

## 11 · Khemet

**Il problema.** I testi trattano Immune come invulnerabilità totale ("nulla li ferma"). In realtà blocca solo le **riduzioni** nemiche a POT, DAN e VA: non ferma Blocca Potere, Blocca Bonus e i danni diretti. Inoltre:
- "fase di power spike" non è la regola: l'Overdrive vuol dire mettere 5+ Focus Coin su quell'Agente;
- "non lasciarla scadere" non ha senso, perché l'Overdrive non si accumula.

- **Motto**
  - Ora: "Quando si attivano, nulla li ferma."
  - Proposta: "Il sigillo decide cosa può toccarci." **[mio]**: per Khemet non c'è un motto nelle fonti.
- **Bonus · quando**
  - Ora: "Si attiva in Overdrive — fase di power spike."
  - Proposta: "Overdrive: metti 5 o più Focus Coin su questo Agente."
- **Bonus · spiegazione**
  - Proposta: "Diventi Immune: in questo scontro le riduzioni nemiche a POT, DAN e VA non hanno effetto. Non ferma Blocca Potere, Blocca Bonus né i danni diretti."
- **Storia**
  - Proposta:
    > Sigillatori, maestri runici, fattucchieri e arconti della non-morte: i Khemet sono una cabala di maghi in armatura gotico-egizia. Nati da una tradizione elementale, dopo il contatto con il loro Giocatore sono arrivati a riscrivere la materia stessa. Non sono una setta in rovina: governano.
    >
    > Per loro ogni scontro è un esperimento rituale. Quando il rito entra in piena risonanza, il sigillo si chiude attorno all'Agente e le forze nemiche non riescono più a ridurlo.
    >
    > Sceglili se ti piace scegliere pochi scontri decisivi e proteggerli da ogni interferenza.
  - Fonti: FRAMEWORK_ARMATA_OVERDRIVE_IMMUNE:16, 164-176; KHEMET_TRE_ESERCITI:15, 923.
- **Stile consigliato**
  - Proposta: "Pochi scontri, protetti. Con 18 Focus Coin puoi permetterti al massimo 3 Overdrive: scegli tu dove. L'immunità protegge il piano, non rende il colpo più forte."
- **Note tattiche**
  - Proposta: "Immune ferma le riduzioni, non i blocchi e non i danni diretti. Non serve solo agli Agenti d'attacco: può proteggere anche un Agente che controlla l'avversario."
- **Eserciti**
  - "Il Nono Sigillo": tag da PICCO · OVERDRIVE a **CONQUISTA · OVERDRIVE**. La fonte dice "Conquista esplosiva".
  - "Il Tributo delle Calamità": "Lo paghi in Focus e PV." è sbagliato, perché l'esercito *produce* Focus e paga in PV. Proposta: "Le calamità hanno un prezzo. Lo paghi in PV, e il Focus torna indietro."

---

## 12 · Apex

**Il problema.**
- Le note citano "Rinforzi", ma nessuna carta Apex ce l'ha: sono carte con Alleato.
- C'è una frase senza verbo ("La Gerarchia della Carne non ereditata").
- La storia non dice chi sono: primati elevati dal loro Giocatore.
- "Proteggi le conquiste" non ha senso: nel codice non ho trovato modi per perdere un Campo già conquistato.

- **Motto**
  - Ora: "Ridevi quando ci scegliesti."
  - Proposta: "Ridevi quando ci scegliesti. Guarda quanto costa ridere adesso." È il verso completo della fonte (APEX_LORE2 p.5).
- **Bonus · quando**
  - Proposta: "Invasione: hai già conquistato almeno 1 Campo."
- **Bonus · spiegazione**
  - Proposta: "+5 Valore Assalto in questo scontro. La soglia è il primo Campo: da lì in poi il bonus è disponibile in ogni scontro."
- **Storia**
  - Proposta:
    > Sulla Crosta Bianca di Khaar il ghiaccio è legge. Gli Apex erano primati impauriti, finché il loro Giocatore, Varkesh, non li scelse tra ciò che gli altri avevano scartato e li elevò.
    >
    > Non conquistano per governare: smontano, scuoiano, riportano il bottino alla Loggia. Nella Gerarchia della Carne il potere non si eredita: comanda chi riempie le ciotole, finché un altro non dimostra di saperlo fare meglio. Ogni Campo preso diventa una nuova base di caccia.
    >
    > Sceglili se ti piace cacciare senza vantaggio finché non prendi il primo territorio, e poi non lasciare respiro.
  - Fonti: APEX_LORE p.1, 12; APEX_LORE2 p.1-6; APEX_TRE_ESERCITI:915.
- **Stile consigliato**
  - Proposta: "Prima preda, poi caccia. Fino alla prima Conquista giochi senza bonus: prendi un Campo il prima possibile, poi spingi con +5 VA."
- **Note tattiche**
  - Proposta: "Il bonus si accende con il primo Campo: non restare a zero. Nella Prima Preda, Dissuasore di turisti (Invasione: Blocca Potere) e Volontà del Sole Verde (Gloria: Blocca Bonus) spengono il Potere e il Bonus nemici quando la caccia è già aperta."
- **Eserciti**
  - "La Loggia Non Arretra": "Ripara, resiste, riconquista." diventa "Ripara, resiste, torna a cacciare."
  - Tag: vedi la domanda 1 ("SNOWBALL", "SUSTAIN").

---

## 13 · Mascarada

**Il problema.** Nel repo **non c'è un documento di lore** della Mascarada: i documenti citano un `ARMATA_MASCARADA_v0.5.md` che non esiste. Per questo correggo solo le meccaniche e il gergo, e lascio la lore com'è.
- "Chiudere con Imboscate" è sbagliato: le Imboscate Mascarada sono carte d'apertura.
- "questo turno" va scritto "in questo scontro".
- "Picchi di midcard" non si capisce.

- **Motto:** invariato. "Il pubblico paga. Tu riscuoti."
- **Bonus · quando**
  - Ora: "Si attiva in Opportunista — il nemico ha speso 5+ Focus Coin questo turno."
  - Proposta: "Opportunista: il nemico ha speso 5 o più Focus Coin in questo scontro."
- **Bonus · spiegazione**
  - Proposta: "+2 Focus Coin. Se il nemico investe tanto per vincere, ti finanzia comunque lo spettacolo successivo."
- **Storia**
  - Primo e secondo paragrafo: invariati.
  - Terzo paragrafo, proposta: "Sceglili se ti piace leggere quanto spende il nemico, incassare Focus Coin e chiudere con Gloria e Vendetta."
- **Stile consigliato**
  - Proposta: "Pedaggio. Metti il nemico davanti a una scelta: perdere lo scontro o vincerlo spendendo tanto, e pagarti. Poi reinvesti i Focus Coin che incassi."
- **Note tattiche**
  - Proposta: "Il bonus dorme se l'avversario risparmia: rendigli costoso ogni scontro. Montgomery (Il Main Event) e Dandelion (Heel Turn) puniscono chi spende 5+ Focus Coin; Mary (Curtain Call) chiude con Gloria."
- **Eserciti:** frasi invariate. Per i tag in inglese ("TECH", "TITLE · FACE", "TITLE · HEEL") vedi la domanda 1.

---

## Domande aperte (servono le tue decisioni)

1. **Cosa devono dire i tag degli eserciti?**
   - Oggi la prima parola mescola condizioni di vittoria (CONQUISTA, SUPREMAZIA) e stili (CONTROLLO, PRESSIONE, PICCO, TITLE, MONO).
   - Io ho allineato alla fonte solo quelli che la contraddicono.
   - Vuoi una regola unica, per esempio "condizione di vittoria · stile" in italiano? In quel caso andrebbero toccati anche SNOWBALL, SUSTAIN, TECH, TITLE · FACE/HEEL, BIPOLARE, COMPOSITIVA.
2. **Kethran:** "armata del comeback", come dice la lore, o "perdita controllata", come dice il documento di design più recente? Ho proposto la seconda.
3. **Orathai:** sono creature di legno, come dicono le carte, o con la pelle segnata, come dice la lore? Ho evitato di sceglierlo.
4. **Mounthborn:** il nome si scrive davvero così, o è "Mouthborn" ("nati dalla bocca")? Nel repo è scritto "Mounthborn" ovunque.
5. **Mascarada:** hai un documento di lore da usare? Nel repo non c'è.
6. **Motti:** dove esiste un motto nella lore, ho proposto quello solo per le armate in cui quello attuale contraddice la lore o la meccanica. Va bene così, o li vuoi tutti dalla lore?

## Fuori dai testi (segnalo, non tocco)

- Il **Patto** ha 5 eserciti e il contatore dice "5", ma la scheda e il Dossier ne mostrano solo 3 (limite nel codice).
- La banda "COSA TROVI QUI" degli Eserciti Personalizzati taglia il testo con "…".
- `Documentazione/GLOSSARIO.md` dice che il Bonus Armata richiede 2+ Agenti "nel Deck", ma il codice guarda la mano iniziale. Inoltre non elenca Apex e Mascarada.
