# SATZE — Eminenze · regole consolidate e prototipi

Documento di lavoro canonico · aggiornato al **31 agosto 2026**  
Riferimento generale: **SATZE — L'Eminenza**

> Questo file raccoglie le decisioni consolidate emerse durante il design delle Eminenze. Quando una regola qui contraddice una vecchia formulazione di questo stesso file, vale questa versione. I punti ancora incerti sono marcati esplicitamente come **APERTI** o **PROVVISORI**.

---

# 1. Concetto generale

L'**Eminenza** è una categoria fuori dal Deck che rappresenta la più alta manifestazione strutturale, ambientale o istituzionale di un'Armata. Non è semplicemente un Agente di livello superiore: non possiede POT o DAN, non entra in Campo e non partecipa direttamente al confronto.

Formula di design:

> **L'Eminenza è una cosa sotto cui l'Armata combatte.**

Può essere una creatura, un luogo, un rito, un'istituzione, un fenomeno, un oggetto o un ambiente. Non deve necessariamente essere vivente né gerarchicamente superiore agli Agenti.

Esempi di identità già approvate:
- Apex → **Il Sole Verde**.
- Mascarada → **L'Organizzatore degli Incontri**.
- Kethran → **L'Altare della Ricomposizione**.
- Mounthborn → **La Fame**.
- Orathai → **Il Primo Canto**.
- Patto degli Indocili → **Il Grande Semaforo**.
- Figli dell'Orizzonte → **La Domanda Senza Fine**.
- Ratti della Megera → **Bella dalle Malelabbra, l'Erede della Megera**.
- Enclave delle Scaglie → **L'Enclave dell'Ascensione**.
- Calibri Pesanti → **Il Comando dei Quattro Fronti**.

Nomi di categoria scartati: **Comandante, Planeswalker, Apice, Manifestazione, Effigie, Emanazione, Avatar, Auspicio**. “Manifestazione” resta riservato a un trigger della Presenza.

---

# 2. Accesso all'Eminenza

- L'Eminenza è **fuori dal Deck** e non occupa uno slot né punti Lega.
- Un Deck sblocca l'Eminenza di un'Armata se contiene **almeno 5 carte** di quell'Armata nei 10 slot.
- Un Deck 5–5 può sbloccare due Eminenze, ma ne sceglie **una sola** da usare nello Scontro.
- Ogni giocatore ha quindi una sola Eminenza attiva per Scontro.
- Regola standard: ogni Eminenza possiede **1 effetto statico + 3 abilità attive**.
- **Eccezione approvata:** la Corte Rossa possiede **4 abilità attive**.

---

# 3. Presenza

La risorsa delle Eminenze è la **Presenza**.

- È visibile e persiste per tutto lo Scontro.
- Non ha un cap generale dichiarato.
- Arrivare a 0 Presenza non comporta penalità automatica e non impedisce di ricaricarla.
- La Presenza può essere generata dalle abilità dell'Eminenza, dai suoi statici e in futuro da Poteri/Bonus degli Agenti.
- I costi non seguono una curva standard universale: sono parte dell'identità dell'Eminenza.
- Ogni Eminenza deve avere almeno un'opzione non negativa, così da non rimanere senza scelta legale.

## 3.1 Scelta obbligatoria

Non esiste un Pass volontario.

> **Ogni giocatore che può usare la propria Eminenza deve scegliere esattamente una sua abilità attiva a inizio round.**

Se l'Eminenza è bloccata da un effetto, il mancato utilizzo è forzato.

Una capacità a costo negativo è selezionabile solo se il giocatore possiede Presenza sufficiente **al momento della scelta segreta**. Non è possibile scegliere una capacità contando su Presenza che forse verrà generata più tardi nello stesso round.

## 3.2 Costo e segretezza

La capacità viene scelta e bloccata segretamente a inizio round. Il gioco ne verifica subito la legalità, ma la variazione pubblica di Presenza avviene quando quella capacità viene **rivelata** nella propria finestra.

Il costo è quindi pagato al reveal, non alla risoluzione condizionata dell'effetto. Se l'effetto scelto poi non produce risultato, il costo resta comunque speso.

Esempio: Terra Bruciata −4 viene scelta a 4 Presenza. Se i Calibri vincono e quindi la condizione “se perdi” non si verifica, i 4 punti vengono comunque spesi quando l'abilità viene rivelata.

Le abilità che **generano Presenza condizionatamente** la ottengono invece soltanto quando la condizione indicata si verifica. Esempio: Sacrificio Kethran dà +1 solo dopo una sconfitta; non al reveal.

---

# 4. Fase Eminenza e bluff

Principio cardine:

> **Tutte le Eminenze vengono scelte segretamente nello stesso momento, ma vengono rivelate il più tardi possibile senza oltrepassare una scelta che il loro effetto deve legittimamente influenzare.**

La segretezza serve a proteggere le decisioni. Quando una decisione non è più modificabile, l'Eminenza può essere resa pubblica senza distruggere il bluff.

## 4.1 Struttura del round

1. **Scelta segreta Eminenza** — entrambi scelgono e bloccano un'abilità.
2. **Reveal Pre-Campo**, solo per abilità che devono alterare slot/Campi prima della relativa scelta.
3. **Scelta/lock del Campo** secondo le normali regole.
4. **Reveal Pre-Agente**, solo per abilità che devono creare informazione pubblica prima dello schieramento.
5. **Scelta Agenti + investimento FC + conferma definitiva**.
6. **Reveal generale** — tutte le abilità ancora nascoste vengono rivelate simultaneamente.
7. **Risoluzione Eminenze immediata** e armamento degli effetti differiti.
8. Normale pipeline Campo → trigger/Poteri/Bonus → VA → esito → conseguenze.
9. Gli effetti Eminenza differiti si risolvono nel proprio checkpoint.

Il **reveal generale è la prima fase dopo il lock di tutte le decisioni del Duello**, e avviene prima della normale risoluzione degli effetti del Campo.

## 4.2 Precedenza d'effetto

La scelta è simultanea e il reveal della stessa finestra è simultaneo. La risoluzione non lo è:

> **Se due effetti devono risolversi nello stesso checkpoint, risolve prima il giocatore con l'iniziativa, poi l'altro, come per gli effetti degli Agenti.**

Il secondo effetto vede quindi lo stato modificato dal primo.

Una scelta già confermata non viene retroattivamente annullata dall'effetto avversario, salvo testo esplicito.

## 4.3 Reveal anticipati attualmente necessari

### Pre-Campo
- **Khemet −2 / −3:** la Maledizione deve essere applicata a uno slot prima che la scelta del Campo possa reagire ad essa.

### Pre-Agente
- **Mounthborn +0:** la Preda deve essere pubblica prima che l'avversario scelga l'Agente.
- **Enclave −1:** l'Agente e la variazione di Lega devono essere pubblici prima della scelta degli Agenti.
- **Corte Rossa −3 Debito:** il debitore deve essere noto prima dello schieramento.

### Reveal generale
Tutte le altre abilità attualmente progettate possono restare nascoste fino al lock di Campo, Agenti e FC.

## 4.4 Bersagli e parametri

Regola generale:

> Il bersaglio o parametro interno a un'abilità viene scelto **quando l'abilità viene rivelata**, salvo che le informazioni ottenute nel frattempo renderebbero quella scelta impropriamente più forte. In quel caso il parametro viene anch'esso bloccato segretamente a inizio round.

Caso già fissato:
- **Mascarada +0 Scommessa:** insieme all'abilità si sceglie segretamente già a inizio round l'esito pronosticato: vittoria propria / vittoria avversaria / pareggio.

---

# 5. Effetti immediati e differiti

“Attivare l'Eminenza” e “risolverne completamente l'effetto” non sono la stessa cosa.

Un'abilità può:
- risolversi interamente al reveal;
- creare un modificatore che resta valido per il round;
- armare una condizione che si controllerà più tardi;
- avere più segmenti di risoluzione.

Esempio Corte Rossa −4:
1. reveal generale e pagamento −4;
2. scelta dell'Agente e assegnazione di 3 FC temporanei;
3. fine Duello: registrazione della POT finale dell'Agente;
4. Fine Scontro: perdita di PV pari alla POT registrata.

Esempio Calibri Terra Bruciata:
1. scelta e reveal nel round;
2. se i Calibri perdono, l'effetto scatta **immediatamente dopo la determinazione del vincitore e prima della finestra Conquista**;
3. il Campo viene distrutto e nessun effetto Conquista può attivarsi in quel Duello;
4. Ultimo Desiderio e le altre conseguenze non vietate procedono normalmente.

---

# 6. Focus Coin temporanei

Definizione canonica:

> **Un Focus Coin temporaneo viene assegnato a un Agente per il Duello corrente. Si comporta come un normale FC posseduto da quell'Agente, ma non viene speso dal pool del controllore e scompare a fine Duello.**

Valori tecnici distinti:
- `focusInvested` = FC reali scelti e pagati dal pool;
- `temporaryFocus` = FC concessi da effetti;
- `effectiveFocus = focusInvested + temporaryFocus`.

Interazioni:
- **VA:** i temporanei contano.
- **Overdrive:** i temporanei contano.
- **Opportunista:** i temporanei non contano, perché il trigger legge ciò che il nemico ha realmente speso/investito.
- **Accumulo Enclave:** i temporanei non contano.
- **Ancorato Figli:** i temporanei non contano.
- **Riserva minima/limiti di spesa del pool:** i temporanei non contano.
- Effetti del Campo che modificano il contributo degli FC al VA agiscono sull'`effectiveFocus`, quindi includono i temporanei.
- Ogni futuro testo “spendi/investi FC” legge i reali FC investiti, salvo testo contrario.

---

# 7. Trigger Eminenza

Trigger previsti:

| Trigger | Condizione |
|---|---|
| **Manifestazione** | Hai speso Presenza questo round. |
| **Blasfemia** | Il nemico ha speso Presenza questo round. |
| **Fervore** | Hai speso almeno 3 Presenza complessiva durante lo Scontro; una volta raggiunto resta soddisfatto. |
| **Digiuno** | La tua Presenza è 0. |
| **Grazia** | La tua Presenza è almeno la soglia prevista, default 5. |
| **Ascendente** | La tua Presenza è maggiore di quella nemica. |
| **Soggezione** | La tua Presenza è minore di quella nemica. |

Effetti agente previsti:
- `presence`: Presenza propria +X.
- `enemyPresence`: Presenza nemica −X, minimo 0.
- `blockEminenza`: il nemico non può usare l'Eminenza nel round successivo.

`Manifestazione`, `Blasfemia` e il conteggio di `Fervore` vedono la spesa quando il costo dell'abilità viene effettivamente pagato al reveal.

---

# 8. Grammatica di trigger, Power e blocchi

Ordine concettuale consolidato:

1. **Sostituzione del trigger** — determina quale trigger possiede il Potere in quel Duello.
2. **Modifiche normali alla condizione** — soglie, inversioni, scambi, ecc.
3. **Forzatura / divieto del trigger** — “considerato soddisfatto” / “non può attivarsi”.
4. **Disattivazione globale di Potere/Bonus**.
5. **Blocca Potere/Bonus** normale.

Regole:
- “Non può attivarsi” prevale su “considerato soddisfatto” in conflitto diretto.
- Trigger soddisfatto ≠ Potere necessariamente risolto.
- **Mascarada −4** forza il trigger e rende il Potere non bloccabile, ma non supera un effetto globale “Poteri disattivati”.
- “Non può essere bloccato” supera il normale Blocca.
- “Blocca disattivato” e “Poteri disattivati” sono due regole diverse.
- Se più sostituzioni di trigger convivono, una sostituzione temporanea specifica del Duello può sovrascrivere quella persistente per quel Duello; poi la persistente ritorna. Esempio: **Debito** persistente + **Il Circuito** temporaneo → Circuito per quel Duello, poi Debito ritorna.

**APERTA:** formalizzare con test dedicato il caso speculare Grande Semaforo vs Grande Semaforo quando due effetti di colore diversi producono forzature/divieti concorrenti, mantenendo sia la precedenza d'iniziativa sia la priorità semantica “divieto > forzatura”.

---

# 9. Lega effettiva

Regola generale:

> **“Lega” significa sempre Lega effettiva nel momento della verifica. “Lega stampata” indica invece esplicitamente il valore originale della carta.**

Una variazione temporanea di Lega deve quindi influenzare ogni regola in-match che legge genericamente la Lega, tra cui:
- Sfida;
- Sopraffare;
- Alleato;
- Rinforzi;
- Ancorato;
- confronti “Lega più alta/bassa”;
- futuri effetti analoghi.

Non cambia retroattivamente la legalità di costruzione del Deck.

---

# 10. Fine Scontro

Per questo documento:
- **Duello** = confronto del singolo round;
- **Scontro** = l'intera partita di cinque round / fino a condizione terminale.

Pipeline consolidata di chiusura:

1. Il Duello termina completamente secondo le sue conseguenze normali.
2. Si verifica se esiste una condizione che farebbe terminare lo Scontro.
3. Se non esiste, si procede al round successivo.
4. Se esiste, si apre una vera finestra **Fine Scontro**.
5. Gli effetti “Fine Scontro” si risolvono, in ordine d'iniziativa se più effetti concorrenti devono risolversi nello stesso checkpoint.
6. Si completano le conseguenze generate da tali effetti.
7. Solo allora viene determinato il vincitore definitivo.

Un effetto “Fine Scontro” **non fa terminare da solo lo Scontro**: si attiva soltanto quando lo Scontro sta già entrando nella propria chiusura per una normale condizione terminale.

La Corte Rossa −4 può quindi ribaltare il verdetto: la sua riscossione avviene prima della proclamazione definitiva del vincitore e può essere letale.

---

# 11. Eminenze approvate

## 11.1 Apex — Il Sole Verde

**Presenza iniziale:** 3  
**Curva:** +1 / −2 / −4  
**Identità:** forza brutale, sacrificio, disprezzo del terreno e inevitabilità dell'Ora Verde.

### Statico — Cataclisma: Ora Verde
All'inizio del round 5, il Campo viene sostituito da un Campo Apex.

### Attive
- **+1:** il prossimo Agente schierato questo round ottiene +1 POT; il controllore perde 2 PV.
- **−2:** il prossimo Agente ignora tutti gli **effetti del Campo** per questo Duello.
- **−4:** il prossimo Agente ottiene +2 POT e +2 DAN.

### Interazione Khemet
Le Maledizioni Khemet appartengono allo **slot**, non alla carta Campo. Pertanto:
- sostituire il Campo con Ora Verde non rimuove le Maledizioni;
- “ignora gli effetti del Campo” non ignora le Maledizioni Khemet.

---

## 11.2 Mascarada — L'Organizzatore degli Incontri

**Presenza iniziale:** 1  
**Curva:** +0 / −2 / −4

### Statico
Quando dovrebbe essere scelto il Campo, gli Agenti vengono selezionati e resi noti **prima** della scelta del Campo.

### Attive
- **+0 — Scommessa:** a inizio round, insieme alla scelta segreta dell'abilità, pronostica segretamente **vittoria propria / vittoria avversaria / pareggio**. Se il pronostico è corretto, +2 Presenza.
- **−2:** per questo Duello, Gloria può essere soddisfatta anche come Vendetta e viceversa; Conquista può essere soddisfatta anche come Ultimo Desiderio e viceversa. Si aggiunge una condizione alternativa valida, senza cambiare il normale timing dei trigger post-esito.
- **−4:** il trigger del proprio Agente è forzatamente soddisfatto e il suo Potere non può essere bloccato. Non supera una disattivazione globale dei Poteri.

---

## 11.3 Kethran — L'Altare della Ricomposizione

**Presenza iniziale:** **2 PROVVISORIA**  
**Curva:** +1 / −2 / −4

### Statico — Ricomposizione
Quando un proprio Agente perde un Duello, diventa un **Frammento** per il resto dello Scontro.

Un Frammento è uno stato applicato alla carta caduta, non una valuta numerica.

### Regola dei Frammenti
> **Ogni Frammento utilizzato da un'abilità dell'Altare viene consumato.**

Un Frammento con `trigger: null` può fornire il proprio effetto ma non un trigger da sostituire.

### Attive
- **+1 — Sacrificio:** se il proprio Agente perde il Duello di questo round, dopo il Duello ottieni +1 Presenza. La sconfitta genera inoltre normalmente il Frammento tramite lo Statico.
- **−2 — Innesto:** scegli un Frammento. Il Potere dell'Agente corrente/prossimo può soddisfarsi tramite il proprio trigger oppure tramite il trigger del Frammento. Se il trigger del Frammento viene utilizzato, il Frammento è consumato.
- **−4 — Opera Composita:** scegli **uno o due Frammenti**.
  - con **1 Frammento**, puoi sostituire una sola componente: il trigger oppure l'effetto, mantenendo l'altra componente del Potere dell'Agente corrente;
  - con **2 Frammenti**, puoi prendere il trigger da uno e l'effetto dall'altro, creando un Potere completamente composito;
  - ogni Frammento utilizzato viene consumato;
  - statistiche e Lega restano quelle dell'Agente corrente.

---

## 11.4 Mounthborn — La Fame

**Presenza iniziale:** 1  
**Curva:** +0 / −2 / −2

### Statico — Istinto Predatorio
All'inizio dello Scontro, scegli un Agente nemico: diventa **Preda**.

- Dopo che una Preda partecipa a un Duello, perde Preda.
- Gli Agenti con Turbo perdono Preda a fine round.
- Più Prede possono coesistere.

### Attive
- **+0 — Gorgoglio dai Cento Occhi:** reveal Pre-Agente; scegli un Agente nemico non ancora schierato, che diventa Preda. Se una Preda viene schierata in quel round, +2 Presenza.
- **−2 — Frenesia della Fame:** se viene schierata una Preda, il proprio **Bonus d'Armata** è considerato attivo e non può essere bloccato.
- **−2 — Cannibalismo:** se perdi il Duello contro una Preda, Cura 3 PV.

---

## 11.5 Khemet — nome da definire

**Presenza iniziale:** 0  
**Curva:** +0 / −2 / −3  
**Identità:** ritualisti che alimentano l'Eminenza attraverso l'attivazione dei Poteri e maledicono permanentemente gli slot di battaglia.

### Statico
Quando un proprio Agente attiva **Overdrive**, +1 Presenza.

### Attive
- **+0:** se il Potere del proprio Agente si **attiva realmente** e non viene bloccato nel Duello, +1 Presenza. Un trigger soddisfatto ma un Potere globalmente disattivato non genera Presenza.
- **−2:** reveal Pre-Campo; scegli uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono **−VA pari alla propria Lega**.
- **−3:** reveal Pre-Campo; scegli uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono **−1 POT, −1 DAN, −1 VA**.

### Regola delle Maledizioni
Le Maledizioni:
- appartengono allo **slot di battaglia / ambiente**, non alla carta Campo;
- persistono per tutto lo Scontro;
- sono simmetriche e colpiscono entrambi i giocatori;
- possono accumularsi sullo stesso slot;
- restano anche se il Campo nello slot viene sostituito o modificato;
- non vengono ignorate da un effetto che dice soltanto “ignora gli effetti del Campo”.

Implementazione concettuale consigliata: `slot = { field, eminenceModifiers[] }`.

**APERTO:** nome definitivo dell'Eminenza.

---

## 11.6 Orathai — Il Primo Canto

**Presenza iniziale:** 1  
**Curva:** +0 / −2 / −3

### Statico — Risonanza
Se entrambi gli Agenti soddisfano il requisito di attivazione del proprio Potere nello stesso Duello, +1 Presenza.

### Attive
- **+0 — Tacet:** se nessuno dei due Agenti soddisfa il requisito di attivazione del Potere, +2 Presenza.
- **−2 — Contrappunto:** se esattamente uno dei due Agenti dovrebbe attivare il Potere, entrambi vengono considerati soddisfatti.
- **−3 — Silenzio:** se esattamente uno dei due dovrebbe attivare il Potere, nessuno dei due viene considerato soddisfatto.

### Conteggio 0 / 1 / 2
- `trigger: null` conta come **naturalmente soddisfatto**.
- Il Primo Canto legge il requisito di attivazione, non il successivo successo della risoluzione dell'effetto.
- Un Blocca successivo non cambia retroattivamente il conteggio.
- Snapshot per determinare 0/1/2: dopo sostituzioni di trigger e normali modifiche del Campo, ma prima della propria operazione di Contrappunto/Silenzio.

Esempi:
- `null` + trigger soddisfatto = 2;
- `null` + trigger non soddisfatto = 1;
- due `null` = 2;
- due trigger non soddisfatti = 0.

---

## 11.7 Corte Rossa — nome da definire

**Presenza iniziale:** **1 PROVVISORIA**  
**Numero attive:** 4, eccezione approvata.

### Statico
Ogni volta che un giocatore perde uno o più PV per una causa diversa dal normale DAN della sconfitta nel Duello, la Corte ottiene **+1 Presenza**.

Si conta **l'evento di perdita**, non il numero di PV persi.

### Attive
- **+0:** l'avversario perde 2 PV; in questo Duello il suo Agente riceve 1 FC temporaneo. Lo Statico genera normalmente +1 Presenza per l'evento di perdita PV.
- **−2:** perdi 3 PV; in questo Duello il tuo Agente riceve 1 FC temporaneo. Lo Statico genera normalmente +1 Presenza per l'evento di perdita PV.
- **−3 — Debito:** reveal Pre-Agente; scegli un Agente non ancora schierato. Per il resto dello Scontro il trigger del suo Potere diventa:
  > **Debito — Quando viene schierato, il suo controllore perde 2 PV; poi il Potere si attiva.**
  Il pagamento è obbligatorio e può essere letale. Viene sostituito soltanto il trigger: l'effetto del Potere resta quello originale. Una sostituzione temporanea del trigger può prevalere per un singolo Duello; poi Debito ritorna. La perdita di PV alimenta lo Statico.
- **−4 — nome da definire:** al reveal generale scegli uno degli Agenti già confermati; riceve **3 FC temporanei** per questo Duello. Alla fine del Duello registra la **POT finale** di quell'Agente, dopo tutti i modificatori. Alla Fine Scontro il suo controllore perde PV pari alla POT registrata. La perdita può essere letale e viene risolta prima del verdetto definitivo dello Scontro; alimenta inoltre lo Statico prima della chiusura finale.

**APERTI:** nome definitivo dell'Eminenza e nome dell'abilità −4.

---

## 11.8 Patto degli Indocili — Il Grande Semaforo

**Presenza iniziale:** 0  
**Curva:** +1 / +0 / −2

### Attive
- **+1 — Verde:** Imboscata e Turbo sono considerati soddisfatti per questo round; Intervento e Ultima Chance non possono attivarsi.
- **+0 — Giallo:** tutti e quattro seguono le normali condizioni.
- **−2 — Rosso:** Intervento e Ultima Chance sono considerati soddisfatti; Imboscata e Turbo non possono attivarsi.

L'effetto è **globale e simmetrico** per l'intero round.

Il colore può restare nascosto fino al reveal generale, perché a quel punto Agenti e FC sono già locked ma i trigger non sono ancora stati verificati.

**APERTO:** caso speculare tra due Grandi Semafori con colori concorrenti, da formalizzare tramite la regola generale di iniziativa + divieto > forzatura.

---

## 11.9 Figli dell'Orizzonte — La Domanda Senza Fine

**Presenza iniziale:** 1

### Ancorato
Un Agente è **Ancorato** se ha investito almeno:

`6 − Lega effettiva + aumenti cumulativi del requisito`

Soglie base:
- Lega 5 → 1 FC;
- Lega 4 → 2 FC;
- Lega 3 → 3 FC;
- Lega 2 → 4 FC.

Regole:
- conta solo `focusInvested`, non FC temporanei;
- usa la **Lega effettiva** al momento del controllo;
- Ancorato viene determinato **una sola volta per Duello**, dopo la conferma dell'investimento FC e prima dei trigger;
- lo snapshot resta fisso per tutto il Duello;
- modifiche successive a Lega o FC non lo ricalcolano;
- non esiste un cap generale al requisito cumulativo.

### Attive
- **+1:** aumenta di 1 il requisito di Ancorato, cumulativamente per il resto dello Scontro. L'aumento vale **immediatamente già nel round corrente**.
- **+0:** se il proprio Agente non è Ancorato, +1 Presenza. La Presenza viene ottenuta al controllo Ancorato, quindi prima dei trigger e può influenzare trigger Eminenza dello stesso Duello.
- **−4:** se il proprio Agente è Ancorato, il suo trigger viene considerato soddisfatto. Non supera Poteri globalmente disattivati e non rende il Potere non bloccabile.

---

## 11.10 Ratti della Megera — Bella dalle Malelabbra, l'Erede della Megera

**Presenza iniziale:** 1

### Statico — Male Crescente
Quando schieri un Agente con la **Lega effettiva più bassa** tra gli Agenti che ti restano in mano, +1 Presenza.

In caso di parità, tutti gli Agenti legati per la Lega minima sono validi. Se resta in mano una carta con Lega inferiore, una carta di Lega superiore non soddisfa lo Statico.

### Attive
- **+0:** se durante il Duello almeno un Agente subisce una riduzione a POT, DAN o VA, +1 Presenza. È una sola condizione per Duello, non per singolo evento, e può essere soddisfatta da riduzioni su entrambi i giocatori.
- **−2:** blocca il proprio Bonus d'Armata per questo Duello; applica **Tossina 1** all'avversario, minimo 10 PV.
- **−3:** per questo Duello, **Conquista è considerata soddisfatta per il proprio Agente indipendentemente dall'esito**. Mantiene il normale timing post-esito. Vale sia per il Bonus Ratti sia per un eventuale Potere dell'Agente con trigger Conquista.

Non introduce un nuovo sistema di marker oltre a quelli già previsti.

---

## 11.11 Enclave delle Scaglie — L'Enclave dell'Ascensione

**Presenza iniziale:** 1

### Statico — Accumulo
Quando investi almeno **3 FC reali** sul tuo Agente in un Duello, +1 Presenza. Gli FC temporanei non contano.

### Attive
- **+1 — Rinuncia al Privilegio:** il proprio Bonus d'Armata è bloccato per questo Duello. Può convivere con Accumulo se sono stati investiti almeno 3 FC.
- **−1 — Ascesa / Declassamento:** reveal Pre-Agente. Scegli pubblicamente un proprio Agente non ancora schierato e aumenta oppure diminuisci la sua Lega di 1 per questo round. La carta può poi non essere giocata: in tal caso la Presenza è stata spesa e la modifica scade a fine round. La Lega effettiva modificata vale per ogni regola in-match che legge Lega, inclusi Sfida, Sopraffare, Alleato, Rinforzi, Ancorato e futuri confronti analoghi. Alleato/Rinforzi vengono ricalcolati usando la Lega effettiva dell'Agente scelto e le altre carte della mano iniziale. Non cambia la legalità del Deck.
- **−3 — Ascensione:** per questo Duello, Sfida e Sopraffare del proprio Agente sono soddisfatti anche quando le Leghe sono uguali; in caso di parità di VA, il proprio lato vince il Duello.

Identità: gerarchia, privilegio, ricchezza e manipolazione dello status.

---

## 11.12 Calibri Pesanti — Il Comando dei Quattro Fronti

**Presenza iniziale:** 1

### Statico — Tenere la Linea
Quando perdi un Duello e l'Agente nemico ha **2 DAN o meno alla fine del Duello**, +1 Presenza.

### Attive
- **+0 — Guerra d'Attrito:** se perdi il Duello ma subisci **2 o meno danni della sconfitta**, +1 Presenza.
- **−2 — Protocollo di Contenimento:** se perdi il Duello, i trigger **Conquista dell'avversario** non possono attivarsi. Il Campo viene comunque conquistato normalmente; vengono negati i Poteri/Bonus che dipendono da Conquista.
- **−4 — Protocollo Terra Bruciata:** se perdi il Duello, **immediatamente dopo la determinazione del vincitore e prima della finestra Conquista**, distruggi il Campo corrente. Nessun giocatore lo conquista e **nessun effetto Conquista si attiva per questo Duello**. Il normale DAN della vittoria e gli effetti non-Conquista proseguono normalmente.

Il Campo distrutto può essere marcato visivamente come **Distrutto**. Non serve introdurre regole di “non selezionabilità futura” perché un Campo già risolto non viene rigiocato.

---

# 12. Note di bilanciamento Presenza — da playtest

Questa sezione non modifica le regole; registra i punti da osservare nei test.

### Watchlist prioritaria
1. **Ratti:** possibile generazione molto alta tramite Male Crescente + abilità +0 nello stesso round.
2. **Corte Rossa:** forte riciclo della Presenza perché molte sue stesse abilità provocano eventi di perdita PV che alimentano lo Statico.
3. **Calibri:** Statico e Guerra d'Attrito possono sovrapporsi frequentemente sulle sconfitte a basso DAN; possibile ridondanza più che squilibrio puro.
4. **Enclave:** Ascesa/Declassamento −1 può risultare a costo netto 0 nei round in cui Accumulo genera +1 investendo almeno 3 FC; il costo reale viene trasferito sull'economia FC.
5. **Kethran:** rischio opposto, con economia lenta e necessità di perdere/consumare Frammenti per arrivare a Opera Composita.

### Benchmark ritenuti puliti
- **Grande Semaforo:** economia leggibile, Verde costruisce verso Rosso ma modifica realmente la legge del round.
- **Figli dell'Orizzonte:** la generazione di Presenza e l'aumento del requisito Ancorato si controbilanciano internamente.
- **Apex:** economia semplice e leggibile, con partenza alta ma costi netti chiari.

Prossimo test consigliato: per ogni Eminenza simulare almeno tre sequenze complete da 5 round — **conservativa, media, aggressiva** — registrando Presenza entrata/uscita, abilità utilizzate e opportunità reali perse per generarla.

---

# 13. Principi di design da non perdere

- L'Eminenza deve creare una **domanda tattica distinta**, non essere solo un pacchetto di bonus numerici.
- Lo Statico dovrebbe definire la grammatica centrale; le attive dovrebbero sfruttarla o piegarla.
- La Presenza non deve diventare semplicemente un secondo Focus Coin con rapporto di cambio fisso.
- Mani e carte sono già pubbliche: non usare “rivela una carta” come valore.
- Non introdurre pescata carte come economia normale.
- Non rimuovere permanentemente carte non ancora schierate: lo Scontro deve mantenere cinque round giocabili.
- Le abilità allo stesso costo sono accettabili se offrono scelte laterali reali.
- Distinguere sempre **Potere dell'Agente** e **Bonus d'Armata**.
- Conquista e Ultimo Desiderio mantengono la loro finestra post-esito salvo testo esplicito.
- Un trigger “considerato soddisfatto” conserva il normale timing della sua sorgente.
- Gli effetti possono avere target o conseguenze differite, purché il momento di scelta e il momento di risoluzione siano formalizzati.
- I Campi già conquistati/risolti non vengono rigiocati: non progettare effetti partendo dall'ipotesi che un Duello futuro possa avvenire su un Campo già concluso.

---

# 14. Punti ancora aperti

1. Nome definitivo dell'Eminenza **Khemet**.
2. Nome definitivo dell'Eminenza **Corte Rossa**.
3. Nome dell'abilità **Corte Rossa −4**.
4. Conferma tramite playtest della **Presenza iniziale Kethran = 2**.
5. Conferma tramite playtest della **Presenza iniziale Corte Rossa = 1**.
6. Formalizzazione/test del caso **Grande Semaforo vs Grande Semaforo** con colori concorrenti.
7. Playtest comparativo delle 12 economie di Presenza.

---

**Stato:** sistema di design sostanzialmente consolidato; le regole sopra sostituiscono le versioni provvisorie precedenti di questo documento. Valori numerici e alcuni nomi restano soggetti a playtest e rifinitura.