// ============================================
// GLOSSARIO SATZE - Dati per la ricerca
// ============================================

export const GLOSSARY_TERMS = [
  // Concetti Base
  { term: 'Potenza', abbr: 'POT', category: 'concetti', desc: "Moltiplicata per i FC per calcolare il Valore Assalto", detail: "La Potenza è la base del calcolo del VA. Formula: VA = POT × FC + modificatori. Più è alta la POT, più l'Agente è potente quando investi FC. Si trova nel cerchio a un lato del nome." },
  { term: 'Danno', abbr: 'DAN', category: 'concetti', desc: "PV inflitti all'avversario se vinci lo scontro", detail: "Quando vinci uno scontro con un Agente, infliggi al nemico un numero di danni pari al DAN di quell'Agente (più eventuali modificatori). Il DAN si trova nel cerchio all'altro lato del nome. Solo il vincitore infligge DAN: chi perde non ne infligge." },
  { term: 'Focus Coin', abbr: 'FC', category: 'concetti', desc: "Risorse spese per potenziare l'Agente (18 totali, minimo 1 per scontro)", detail: "Hai 18 FC per tutta la partita. Ogni scontro richiede almeno 1 FC investito. Più FC investi, più alto sarà il tuo VA, ma attenzione: non si recuperano! Gestiscili con cura." },
  { term: 'Valore Assalto', abbr: 'VA', category: 'concetti', desc: "POT × FC + modificatori. Chi ha VA più alto vince. (Min: POT corrente)", detail: "Il VA determina chi vince lo scontro. Formula: VA = POT × FC + modificatori (da poteri, bonus armata, effetti dei campi). In parità di VA vince chi ha Lega più bassa, poi POT finale più bassa, poi chi ha giocato per secondo: lo scontro non finisce mai pari. Il VA non può mai essere inferiore alla POT corrente dell'Agente in quello scontro (salvo un (min) esplicito di un effetto -VA)." },
  { term: 'Punti Vita', abbr: 'PV', category: 'concetti', desc: "Vita del giocatore (25 iniziali)", detail: "Inizi con 25 PV. Ogni volta che perdi uno scontro, subisci danni pari al DAN dell'Agente avversario. Le cure non superano 25. Chi è a 0 PV a fine round perde la partita (condizione Annientamento)." },
  { term: 'Lega', abbr: null, category: 'concetti', desc: "Valore 2-5 che indica la potenza generale della carta", detail: "La Lega (L2–L5, nella barra dell'armata in basso sulla carta) entra nella somma delle 5 carte in mano per decidere chi inizia il turno 1 (più bassa inizia; parità casuale). In parità di VA, vince chi ha Lega più bassa." },
  { term: 'Esercito', abbr: null, category: 'concetti', desc: "10 carte con somma Lega esattamente 30", detail: "Il tuo esercito ha 10 Agenti, ognuno al massimo una volta (si possono mescolare armate). La somma delle Leghe deve essere esattamente 30. All'inizio peschi 5 carte casuali da quell'esercito: quella è la tua mano per la partita." },
  { term: 'Bonus Armata', abbr: null, category: 'concetti', desc: "Effetto attivo con 2+ Agenti della stessa armata nella mano iniziale", detail: "Se tra le 5 carte iniziali ne hai almeno 2 della stessa armata, il Bonus Armata resta attivo per tutta la partita (contano anche le carte di quella mano già giocate). Vale solo quando giochi un Agente di quell'armata, se il suo trigger è soddisfatto, e si risolve dopo i Poteri. Eccezione: per il Patto degli Indocili basta 1 carta, ma il suo Bonus ha trigger Rinforzi." },
  { term: 'Campo di Battaglia', abbr: null, category: 'concetti', desc: "Terreno conteso. Chi vince lo scontro lo conquista", detail: "Ogni campo ha un effetto speciale che modifica le regole dello scontro (es. modifica POT/DAN, limita FC, disabilita poteri). Leggi sempre l'effetto prima di scegliere l'Agente. Conquistare 3 campi (turni 1-4) fa vincere la partita." },
  { term: 'Agente', abbr: null, category: 'concetti', desc: "Carta da combattimento con POT, DAN, Lega e Potere", detail: "L'Agente è la tua unità da combattimento. Ha POT e DAN nei cerchi ai lati del nome, la Lega nella barra dell'armata in basso, un Potere (★) che si attiva quando il suo trigger è soddisfatto e il Bonus della sua armata (✠). Ogni Agente appartiene a un'armata." },

  // Condizioni di Vittoria
  { term: 'Conquista territoriale', abbr: null, category: 'vittoria', desc: "Vince chi conquista 3 terreni (turni 1-4)", detail: "Nei turni 1-4, vinci la partita conquistando 3 campi di battaglia. Questa condizione si sostituisce con la Supremazia dal turno 5 in poi." },
  { term: 'Supremazia', abbr: null, category: 'vittoria', desc: "Al turno 5 vince chi ha più PV", detail: "Al turno 5 la Conquista territoriale non vale più. Finite le carte vince chi ha più Punti Vita; a parità di PV vince chi ha più campi conquistati; altrimenti è pareggio." },
  { term: 'Annientamento', abbr: null, category: 'vittoria', desc: "Chi è a 0 PV a fine round perde", detail: "Questa condizione è sempre attiva. Il controllo si fa a fine round, dopo la Tossina: chi è a 0 PV perde la partita, indipendentemente da conquiste o supremazia." },
  { term: 'Reclamazione', abbr: null, category: 'vittoria', desc: "Al round 3 o 4, chi conquista 3 campi può reclamare la vittoria o continuare", detail: "Se conquisti 3 campi di battaglia al round 3 o 4, puoi scegliere: reclamare la vittoria subito (e vincere) oppure continuare a giocare. Se continui, la partita prosegue normalmente e rischi che l'avversario rimonti. La scelta spetta al giocatore che ha i 3 campi; se è l'IA ad arrivarci, vince subito." },

  // Trigger
  { term: 'Imboscata', abbr: null, category: 'trigger', desc: "Sei il primo a scegliere", detail: "Il potere o bonus con trigger Imboscata si attiva quando hai l'iniziativa, cioè giochi per primo in quello scontro. Al turno 1 ha l'iniziativa chi ha la somma di Lega in mano più bassa (in parità è casuale); poi l'iniziativa si alterna ogni turno." },
  { term: 'Intervento', abbr: null, category: 'trigger', desc: "Sei il secondo a scegliere", detail: "Si attiva quando giochi per secondo (l'avversario ha scelto per primo). Al turno 1 gioca per primo chi ha la somma di Lega in mano più bassa (in parità è casuale); poi l'iniziativa si alterna ogni turno." },
  { term: 'Gloria', abbr: null, category: 'trigger', desc: "Hai vinto lo scontro precedente", detail: "Si attiva se nello scontro del turno precedente hai vinto tu. Utile per mantenere lo slancio dopo una vittoria." },
  { term: 'Vendetta', abbr: null, category: 'trigger', desc: "Hai perso lo scontro precedente", detail: "Si attiva se hai perso lo scontro del turno precedente. Permette di rimontare dopo una sconfitta." },
  { term: 'Overdrive', abbr: null, category: 'trigger', desc: "Spendi 5+ FC", detail: "Si attiva quando hai 5 o più Focus Coin sull'Agente in quello scontro, contando anche i FC temporanei. Da solo non fa nulla: serve un effetto che lo usi. Nucleo del Reattore abbassa la soglia a 4; Grande Arena di Ilesca disattiva gli effetti Overdrive." },
  { term: 'Resa dei conti', abbr: null, category: 'trigger', desc: "Dopo 2 duelli completati per entrambi", detail: "Si attiva solo quando tu e l'avversario avete già sostenuto almeno due scontri ciascuno (in pratica dal terzo duello in poi)." },
  { term: 'Rimonta', abbr: null, category: 'trigger', desc: "Hai meno PV dell'avversario", detail: "Si attiva quando sei in svantaggio di Punti Vita. Ideale per le situazioni in cui stai perdendo e hai bisogno di un colpo di grazia." },
  { term: 'Magnanimo', abbr: null, category: 'trigger', desc: "Hai più PV dell'avversario", detail: "Si attiva quando sei in vantaggio di PV. Premiato chi sta dominando la partita." },
  { term: 'Ultimo Desiderio', abbr: null, category: 'trigger', desc: "Perdi questo scontro", detail: "Si attiva quando perdi proprio quello scontro. Si risolve dopo il calcolo del VA, quindi non cambia l'esito: è un effetto 'da morto' che può comunque dare un vantaggio o un colpo finale." },
  { term: 'Conquista', abbr: null, category: 'trigger', desc: "Vinci questo scontro", detail: "Si attiva quando vinci quello scontro. Si risolve dopo il calcolo del VA (non cambia l'esito) e prima del danno. Tipicamente dà bonus come FC extra o effetti speciali." },
  { term: 'Opportunista', abbr: null, category: 'trigger', desc: "Il nemico ha speso 5+ FC questo turno", detail: "Si attiva quando l'avversario ha investito 5 o più Focus Coin reali nello scontro corrente (i FC temporanei non contano). Punisce chi scommette forte." },
  { term: 'Sfida', abbr: null, category: 'trigger', desc: "La tua Lega è inferiore a quella nemica", detail: "Si attiva quando l'Agente che stai giocando ha Lega più bassa di quello dell'avversario. Premiato chi gioca carte 'sotto costo'." },
  { term: 'Sopraffare', abbr: null, category: 'trigger', desc: "La tua Lega è superiore a quella nemica", detail: "Si attiva quando la tua Lega è più alta di quella dell'avversario. Premiato chi domina con carte potenti." },
  { term: 'Invasione', abbr: null, category: 'trigger', desc: "Hai conquistato 1+ campi", detail: "Si attiva quando hai già conquistato almeno un campo di battaglia in questa partita. Premiato chi sta avanzando." },
  { term: 'Resistenza', abbr: null, category: 'trigger', desc: "Il nemico ha conquistato 1+ campi", detail: "Si attiva quando l'avversario ha conquistato almeno un campo. Premiato chi deve rimontare." },
  { term: 'Turbo', abbr: null, category: 'trigger', desc: "Turno 1 o 2", detail: "Si attiva nei primi due turni. Effetti pensati per l'apertura di partita." },
  { term: 'Ultima Chance', abbr: null, category: 'trigger', desc: "Turno 5+", detail: "Si attiva dal turno 5 in poi. Effetti pensati per la fase finale, quando conta la Supremazia (PV)." },
  { term: 'Sempre', abbr: null, category: 'trigger', desc: "Nessuna condizione: il Potere è sempre attivo", detail: "Un Potere senza trigger (o con 'Sempre:') si attiva in ogni scontro, salvo che venga bloccato o disattivato." },
  { term: 'Alleato', abbr: null, category: 'trigger', desc: "1 altra carta della stessa Lega della carta giocata in mano iniziale", detail: "Si attiva se, tra le 5 carte della tua mano iniziale, c'era almeno 1 altra carta (oltre a quella che stai giocando) con la stessa Lega dell'Agente in questo scontro. Contano anche le carte di quella mano già giocate." },
  { term: 'Rinforzi', abbr: null, category: 'trigger', desc: "2 altre carte della stessa Lega della carta giocata in mano iniziale", detail: "Si attiva se, tra le 5 carte della tua mano iniziale, c'erano almeno 2 altre carte (oltre a quella che stai giocando) con la stessa Lega dell'Agente in questo scontro. Contano anche le carte di quella mano già giocate. Usato dal bonus armata del Patto degli Indocili." },

  // Effetti Buff
  { term: '+X POT', abbr: null, category: 'effetti', desc: "Aumenta la tua Potenza di X", detail: "Aggiunge X alla tua POT prima del calcolo del VA. Esempio: +2 POT con POT 5 e 3 FC → VA considera POT 7." },
  { term: '+X DAN', abbr: null, category: 'effetti', desc: "Aumenta il tuo Danno di X", detail: "Aumenta il danno che infliggi se vinci. Esempio: DAN 3 + +2 DAN = infliggi 5 danni quando vinci." },
  { term: '+X VA', abbr: null, category: 'effetti', desc: "Bonus diretto al Valore Assalto", detail: "Aggiunge X direttamente al tuo VA finale, dopo il calcolo POT × FC. Molto potente perché bypassa la formula base." },
  { term: '+X FC', abbr: null, category: 'effetti', desc: "Guadagni X Focus Coin", detail: "Recuperi X Focus Coin. Raro e prezioso: i FC normalmente non si recuperano! Usa con saggezza." },
  { term: 'Cura X', abbr: null, category: 'effetti', desc: "Recuperi X Punti Vita (massimo 25)", detail: "Aggiungi X ai tuoi PV, mai oltre 25. La cura avviene prima del danno dello scontro. Può salvarti quando sei in svantaggio." },

  // Effetti Scaling (buff condizionali)
  { term: 'Escalation X [STAT]', abbr: null, category: 'effetti', desc: "+X alla statistica (POT, DAN o entrambe) per ogni campo che hai conquistato", detail: "Aumenta la tua POT, il tuo DAN o entrambi di X per ogni campo che avevi conquistato all'inizio dello scontro. Più campi controlli, più diventi potente. Esempio: Escalation 2 POT con 2 campi conquistati → +4 POT." },
  { term: 'Attrizione X [STAT]', abbr: null, category: 'effetti', desc: "+X alla statistica per ogni carta che hai già giocato", detail: "Aumenta di X la statistica indicata (POT, DAN, POT e DAN, Danni diretti o VA) per ogni carta che hai già giocato in questa partita, esclusa quella attuale (solo carte tue). Al turno 1 vale 0: più giochi, più diventi forte." },

  // Effetti Debuff
  { term: '-X POT nem.', abbr: null, category: 'effetti', desc: "Riduce la Potenza nemica di X (min Y opzionale)", detail: "Riduce la POT dell'Agente avversario di X. Se c'è (min Y), non può scendere sotto Y; senza (min) non scende sotto 1. Esempio: -3 POT nem. (min 1) contro POT 5 → nemico ha POT 2." },
  { term: '-X DAN nem.', abbr: null, category: 'effetti', desc: "Riduce il Danno nemico di X (min Y opzionale)", detail: "Riduce il DAN che l'avversario infligge se vince. Con (min Y) non scende sotto Y; senza (min) non scende sotto 0. Più riduzioni si applicano una alla volta, ognuna con il proprio minimo." },
  { term: '-X VA nem.', abbr: null, category: 'effetti', desc: "Malus al Valore Assalto nemico (min Y opzionale)", detail: "Toglie X dal VA dell'avversario. Con (min Y): se il VA nemico è già sotto Y l'effetto non fa nulla, altrimenti Y diventa il nuovo minimo del VA nemico (al posto della POT). Con più minimi vale il più basso." },
  { term: 'X Danni dir.', abbr: null, category: 'effetti', desc: "Infliggi X danni diretti ai PV nemici", detail: "Infliggi X danni ai PV dell'avversario indipendentemente dall'esito dello scontro. Non dipende da chi vince." },
  { term: '-X PV (a te)', abbr: null, category: 'effetti', desc: "Infliggi X danni ai tuoi PV", detail: "Un effetto a costo: perdi X PV. Di solito in cambio di un beneficio maggiore (es. un potere molto forte)." },
  { term: '(min Y)', abbr: null, category: 'effetti', desc: "Non può ridurre la statistica sotto il valore Y", detail: "Quando un effetto di riduzione ha (min Y), la statistica bersaglio non può scendere sotto Y. Esempio: -4 DAN nem. (min 2) contro DAN 5 → risultato 2; contro DAN 2 → nessun effetto." },

  // Effetti Copia
  { term: 'Copia POT', abbr: null, category: 'effetti', desc: "La tua POT diventa uguale alla POT nemica", detail: "La tua Potenza viene sostituita con quella dell'Agente avversario. Utile contro avversari con POT alta." },
  { term: 'Copia DAN', abbr: null, category: 'effetti', desc: "Il tuo DAN diventa uguale al DAN nemico", detail: "Il tuo Danno diventa uguale a quello dell'avversario. Può essere utile se l'avversario ha DAN molto alto." },
  { term: 'Copia Potere', abbr: null, category: 'effetti', desc: "Usi il Potere dell'agente nemico", detail: "Per quello scontro esegui il Potere dell'Agente avversario come se fosse tuo, solo se il suo trigger è soddisfatto dal tuo lato. Copiare un altro Copia Potere non ha effetto." },
  { term: 'Copia Bonus', abbr: null, category: 'effetti', desc: "Usi il Bonus Armata nemico", detail: "Usi il Bonus Armata dell'avversario (se attivo per lui). Se è un Potere, sostituisce il testo del Potere; se è il Bonus armata (Corte Rossa), sostituisce lo slot Bonus." },

  { term: 'Imponi POT', abbr: null, category: 'effetti', desc: "La POT nemica diventa uguale alla tua", detail: "La Potenza dell'Agente avversario diventa uguale alla tua in quel momento. Conta l'ordine di iniziativa; un Agente Immune non la subisce." },
  { term: 'Imponi DAN', abbr: null, category: 'effetti', desc: "Il DAN nemico diventa uguale al tuo", detail: "Il Danno dell'Agente avversario diventa uguale al tuo in quel momento. Conta l'ordine di iniziativa; un Agente Immune non lo subisce." },

  // Effetti Controllo
  { term: 'Blocca Potere', abbr: null, category: 'effetti', desc: "Annulla il Potere dell'agente nemico", detail: "Il Potere dell'Agente avversario non si attiva. Si applica prima di tutti gli altri Poteri; due Blocca Potere opposti si applicano entrambi. Se il Potere bloccato concedeva Immune, l'Immune non vale." },
  { term: 'Blocca Bonus', abbr: null, category: 'effetti', desc: "Annulla il Bonus Armata nemico", detail: "Il Bonus Armata dell'avversario non si attiva in questo scontro. Se il Bonus bloccato concedeva Immune (Khemet), l'Immune non vale." },
  { term: 'Immune', abbr: null, category: 'effetti', desc: "Ignora riduzioni, Imponi e malus dei campi", detail: "Le riduzioni nemiche a POT, DAN e VA, gli Imponi e i malus dei campi non ti colpiscono. Non protegge da Blocca Potere e Blocca Bonus, né da Danni diretti o Tossina. Se il Potere o il Bonus che concede Immune è bloccato o disattivato, l'Immune non vale. Mura EMP disattiva Immune." },
  { term: 'Inversione', abbr: null, category: 'effetti', desc: "I modificatori esterni sono invertiti: buff → debuff, debuff → buff", detail: "Gli effetti nemici e dei campi di battaglia che ti colpiscono si invertono: un -2 POT nem. diventa +2 POT per te, un +1 DAN da un campo diventa -1 DAN. Si attiva prima degli altri Poteri. Non agisce su Imponi, Copia, Danni diretti e Tossina, e non protegge da Blocca Potere e Blocca Bonus." },
  { term: 'Tossina X (min Y)', abbr: null, category: 'effetti', desc: "Danno passivo a fine turno finché avversario > Y PV", detail: "Quando Tossina viene attivata, l'avversario subisce X danni alla fine di ogni turno, a partire da quello in cui viene attivata. Continua finché l'avversario non scende a Y PV o meno. Se riattivata mentre è già attiva, il valore aumenta di +1. Esempio: bonus Ratti — Tossina 1 (min 10) → 1 danno a fine turno finché l'avversario ha più di 10 PV." },

  // Archetipi — Sistema v3.3
  {
    term: 'Sistema Archetipi',
    abbr: 'Sistema',
    category: 'archetipi',
    desc: 'Archetipo obbligatorio, più secondario, rapporto col Focus e Scalante se rilevanti',
    detail: "Ogni Agente ha un Archetipo (cosa contribuisce al piano). Può avere un Archetipo secondario, un Rapporto col Focus (come reagisce ai FC) e il flag Scalante. Non cambiano le regole: aiutano a leggere la carta. Il trigger resta stampato nel Potere e filtrabile a parte. Lega, POT e DAN restano numeri.",
  },

  // Archetipi
  {
    term: 'Campione',
    abbr: 'Archetipo',
    category: 'archetipi',
    desc: 'Vince lo scontro corrente potenziando o preservando la propria efficacia',
    detail: "Contributo principale: far vincere il duello. Effetti tipici: +POT, +VA, Copia POT, Immune, Attrizione/Escalation su POT o VA. Domanda: come vinco questo scontro?",
  },
  {
    term: 'Assaltatore',
    abbr: 'Archetipo',
    category: 'archetipi',
    desc: 'Trasforma la vittoria in una conseguenza più pesante sui PV',
    detail: "Contributo principale: far male quando vinci. Effetti tipici: +DAN, +POT e DAN, Copia DAN, Attrizione/Escalation su DAN. Domanda: quanto male farà la mia vittoria?",
  },
  {
    term: 'Soffocatore',
    abbr: 'Archetipo',
    category: 'archetipi',
    desc: "Riduce la capacità numerica dell'avversario di vincere lo scontro",
    detail: "Manipola i numeri nemici, non i Poteri. Effetti tipici: -POT nem., -VA nem., -POT e DAN nem., Imponi POT. Domanda: come indebolisco l'assalto nemico?",
  },
  {
    term: 'Sabotatore',
    abbr: 'Archetipo',
    category: 'archetipi',
    desc: 'Interviene sul livello delle abilità: mai sui valori numerici',
    detail: "Blocca o copia Poteri e Bonus Armata, oppure attiva Inversione. Non riduce POT/DAN/VA. Domanda: come disattivo o manipolo i Poteri nemici?",
  },
  {
    term: 'Carnefice',
    abbr: 'Archetipo',
    category: 'archetipi',
    desc: 'Sottrae PV senza dipendere interamente dal DAN dello scontro',
    detail: "Pressione sui PV parallela al duello. Effetti tipici: Danni diretti, Tossina, Attrizione su danni diretti. Domanda: come tolgo PV oltre al DAN normale?",
  },
  {
    term: 'Guardiano',
    abbr: 'Archetipo',
    category: 'archetipi',
    desc: 'Protegge i PV o riduce le conseguenze della sconfitta',
    detail: "Mitiga perdite o recupera vita. Effetti tipici: Cura, -DAN nem., Imponi DAN. Domanda: come limito o recupero le perdite?",
  },
  {
    term: 'Catalizzatore',
    abbr: 'Archetipo',
    category: 'archetipi',
    desc: 'Genera o recupera risorse che alimentano le giocate successive',
    detail: "Nel pool attuale: +FC. Non vince lo scontro da solo, ma finanzia quelli dopo. Domanda: come alimento le giocate successive?",
  },
  {
    term: 'Colosso',
    abbr: 'Archetipo',
    category: 'archetipi',
    desc: 'Il Potere è un costo puro: il beneficio è il corpo della carta',
    detail: "Solo quando il Potere è un costo senza altro beneficio (es. -PV a te). Se beneficio e costo fossero insieme, la carta si classifica sul beneficio. Domanda: quale minaccia autonoma posso schierare?",
  },
  {
    term: 'Archetipo secondario',
    abbr: 'Flag',
    category: 'archetipi',
    desc: 'Secondo lavoro della carta, non dichiarato dal Potere o nascosto nel corpo',
    detail: "Compare in circa 1 carta su 5. Due origini: effetto a doppia componente (+POT e DAN, -POT e DAN nem.) oppure statistiche molto sopra la mediana della propria Lega in una dimensione che l'archetipo primario non copre. Si scrive dopo una barra: es. Campione / Assaltatore.",
  },

  // Rapporto col Focus
  {
    term: 'Rapporto col Focus',
    abbr: 'Asse',
    category: 'archetipi',
    desc: 'Come reagisce il Potere ai Focus Coin investiti, e da chi',
    detail: "Quattro classi: Vorace (scala coi tuoi FC), Predatore (scala coi FC nemici), Indifferente (i FC non cambiano il rendimento), Prodigo (+FC). Sulla carta il badge compare solo su Campione, Assaltatore e Soffocatore, dove varia davvero.",
  },
  {
    term: 'Vorace',
    abbr: 'Focus',
    category: 'archetipi',
    desc: 'Il rendimento cresce con i FC che investi tu',
    detail: "Tipico di +POT, +POT e DAN, Copia POT. Con 1 FC vale poco; con 5 FC moltiplica. Vuoi finanziarla per farla esprimere.",
  },
  {
    term: 'Predatore',
    abbr: 'Focus',
    category: 'archetipi',
    desc: "Il rendimento cresce con i FC che investe l'avversario",
    detail: "Tipico di -POT nem., -POT e DAN nem., Imponi POT. Punisce chi punta alto e ti consente di puntare meno. Il rendimento lo decide l'avversario, non tu.",
  },
  {
    term: 'Indifferente',
    abbr: 'Focus',
    category: 'archetipi',
    desc: 'Il rendimento non cambia in base ai FC di nessuno',
    detail: "Classe di riposo: +VA, -VA, +DAN, cure, danni diretti, blocchi, Immune, ecc. Dice solo che i Focus non c'entrano; il resto lo dicono Archetipo e testo del Potere.",
  },
  {
    term: 'Prodigo',
    abbr: 'Focus',
    category: 'archetipi',
    desc: 'Genera o restituisce Focus Coin',
    detail: "Corrisponde a +FC. Sulla carta non si mostra come badge separato: ripete la definizione di Catalizzatore. Resta filtrabile nel deck builder.",
  },
  {
    term: 'Scalante',
    abbr: 'Flag',
    category: 'archetipi',
    desc: 'Aumenta il proprio valore con il progresso della partita',
    detail: "Attrizione (carte già giocate) o Escalation (campi conquistati). Al turno 1 l'effetto vale zero e conta solo il corpo. Non affollare il mazzo di carte che competono tutte per i turni tardi.",
  },
];

export const GLOSSARY_CATEGORIES = {
  concetti: { label: 'Concetti Base', icon: '⚔️', color: 'amber' },
  vittoria: { label: 'Condizioni di Vittoria', icon: '🏆', color: 'green' },
  trigger: { label: 'Trigger', icon: '🎯', color: 'cyan' },
  effetti: { label: 'Effetti', icon: '⚡', color: 'purple' },
  archetipi: { label: 'Archetipi e Focus', icon: '🏷️', color: 'rose' },
};
