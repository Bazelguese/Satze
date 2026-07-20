// ============================================
// GLOSSARIO SATZE - Dati per la ricerca
// ============================================

export const GLOSSARY_TERMS = [
  // Concetti Base
  { term: 'Potenza', abbr: 'POT', category: 'concetti', desc: "Moltiplicata per i FC per calcolare il Valore Assalto", detail: "La Potenza è la base del calcolo del VA. Formula: VA = POT × FC + modificatori. Più è alta la POT, più l'Agente è potente quando investi FC. Si trova al centro della carta." },
  { term: 'Danno', abbr: 'DAN', category: 'concetti', desc: "PV inflitti all'avversario se vinci lo scontro", detail: "Quando vinci uno scontro con un Agente, infliggi al nemico un numero di danni pari al DAN di quell'Agente (più eventuali modificatori). Il DAN si trova accanto alla POT sulla carta." },
  { term: 'Focus Coin', abbr: 'FC', category: 'concetti', desc: "Risorse spese per potenziare l'Agente (18 totali, minimo 1 per scontro)", detail: "Hai 18 FC per tutta la partita. Ogni scontro richiede almeno 1 FC investito. Più FC investi, più alto sarà il tuo VA, ma attenzione: non si recuperano! Gestiscili con cura." },
  { term: 'Valore Assalto', abbr: 'VA', category: 'concetti', desc: "POT × FC + modificatori. Chi ha VA più alto vince. (Min: POT corrente)", detail: "Il VA determina chi vince lo scontro. Formula: VA = POT × FC + modificatori (da poteri, bonus armata, effetti dei campi). In parità di VA vince chi ha Lega più bassa, poi POT più bassa. Il VA non può mai essere inferiore alla POT corrente dell'Agente in quello scontro." },
  { term: 'Punti Vita', abbr: 'PV', category: 'concetti', desc: "Vita del giocatore (25 iniziali)", detail: "Inizi con 25 PV. Ogni volta che perdi uno scontro, subisci danni pari al DAN dell'Agente avversario. A 0 PV perdi la partita immediatamente (condizione Annientamento)." },
  { term: 'Lega', abbr: null, category: 'concetti', desc: "Valore 2-5 che indica la potenza generale della carta", detail: "La Lega (in alto a destra sulla carta) entra nella somma delle 5 carte in mano per decidere chi inizia il turno 1 (più bassa inizia; parità casuale). In parità di VA, vince chi ha Lega più bassa." },
  { term: 'Esercito', abbr: null, category: 'concetti', desc: "10 carte con somma Lega massima di 30 punti", detail: "Il tuo esercito ha 10 Agenti. La somma delle Leghe di tutte le carte non può superare 30. All'inizio peschi 5 carte casuali da quell'esercito: quella è la tua mano per la partita." },
  { term: 'Bonus Armata', abbr: null, category: 'concetti', desc: "Effetto attivo con 2+ Agenti della stessa armata nella mano iniziale", detail: "Se tra le 5 carte iniziali ne hai almeno 2 della stessa armata, il Bonus Armata resta attivo per tutta la partita (contano anche le carte di quella mano già giocate/scartate). Si applica quando il suo trigger è soddisfatto, come i poteri." },
  { term: 'Campo di Battaglia', abbr: null, category: 'concetti', desc: "Terreno conteso. Chi vince lo scontro lo conquista", detail: "Ogni campo ha un effetto speciale che modifica le regole dello scontro (es. modifica POT/DAN, limita FC, disabilita poteri). Leggi sempre l'effetto prima di scegliere l'Agente. Conquistare 3 campi (turni 1-4) fa vincere la partita." },
  { term: 'Agente', abbr: null, category: 'concetti', desc: "Carta da combattimento con POT, DAN, Lega e Potere", detail: "L'Agente è la tua unità da combattimento. Ha POT e DAN al centro, Lega in alto a destra, e un Potere in basso che si attiva quando il suo trigger è soddisfatto. Ogni Agente appartiene a un'armata." },

  // Condizioni di Vittoria
  { term: 'Conquista territoriale', abbr: null, category: 'vittoria', desc: "Vince chi conquista 3 terreni (turni 1-4)", detail: "Nei turni 1-4, vinci la partita conquistando 3 campi di battaglia. Questa condizione si sostituisce con la Supremazia dal turno 5 in poi." },
  { term: 'Supremazia', abbr: null, category: 'vittoria', desc: "Vince chi ha più PV a fine turno (dal turno 5+)", detail: "Dal turno 5 in poi, la Conquista territoriale non vale più. Vince chi ha più Punti Vita a fine turno. Se i PV sono pari, la partita continua." },
  { term: 'Annientamento', abbr: null, category: 'vittoria', desc: "Chi arriva a 0 PV perde immediatamente", detail: "Questa condizione è sempre attiva. Non appena un giocatore scende a 0 PV, perde la partita subito, indipendentemente da conquiste o supremazia." },
  { term: 'Reclamazione', abbr: null, category: 'vittoria', desc: "Al round 3 o 4, chi conquista 3 campi può reclamare la vittoria o continuare", detail: "Se conquisti 3 campi di battaglia al round 3 o 4, puoi scegliere: reclamare la vittoria subito (e vincere) oppure continuare a giocare. Continuare ti permette di accumulare più campi o PV, ma rischi di perdere se l'avversario rimonta. La scelta spetta al giocatore che ha vinto in quel momento." },

  // Trigger
  { term: 'Imboscata', abbr: null, category: 'trigger', desc: "Sei il primo a scegliere", detail: "Il potere o bonus con trigger Imboscata si attiva quando sei tu a giocare per primo in quello scontro. Di norma va per primo chi ha somma Lega in mano più bassa; in parità è casuale." },
  { term: 'Intervento', abbr: null, category: 'trigger', desc: "Sei il secondo a scegliere", detail: "Si attiva quando giochi per secondo (l'avversario ha scelto per primo). Di norma il primo è chi ha somma Lega in mano più bassa; in parità è casuale." },
  { term: 'Gloria', abbr: null, category: 'trigger', desc: "Hai vinto lo scontro precedente", detail: "Si attiva se nello scontro del turno precedente hai vinto tu. Utile per mantenere lo slancio dopo una vittoria." },
  { term: 'Vendetta', abbr: null, category: 'trigger', desc: "Hai perso lo scontro precedente", detail: "Si attiva se hai perso lo scontro del turno precedente. Permette di rimontare dopo una sconfitta." },
  { term: 'Overdrive', abbr: null, category: 'trigger', desc: "Spendi 5+ FC", detail: "Si attiva quando investi 5 o più Focus Coin in quello scontro. Richiede un investimento pesante ma può dare effetti potenti." },
  { term: 'Resa dei conti', abbr: null, category: 'trigger', desc: "Dopo 2 duelli completati per entrambi", detail: "Si attiva solo quando tu e l'avversario avete già sostenuto almeno due scontri ciascuno (in pratica dal terzo duello in poi)." },
  { term: 'Rimonta', abbr: null, category: 'trigger', desc: "Hai meno PV dell'avversario", detail: "Si attiva quando sei in svantaggio di Punti Vita. Ideale per le situazioni in cui stai perdendo e hai bisogno di un colpo di grazia." },
  { term: 'Magnanimo', abbr: null, category: 'trigger', desc: "Hai più PV dell'avversario", detail: "Si attiva quando sei in vantaggio di PV. Premiato chi sta dominando la partita." },
  { term: 'Ultimo Desiderio', abbr: null, category: 'trigger', desc: "Perdi questo scontro", detail: "Si attiva quando perdi proprio quello scontro. Un effetto 'da morto' che può comunque dare un vantaggio o un colpo finale." },
  { term: 'Conquista', abbr: null, category: 'trigger', desc: "Vinci questo scontro", detail: "Si attiva quando vinci quello scontro. Tipicamente dà bonus come FC extra o effetti speciali." },
  { term: 'Opportunista', abbr: null, category: 'trigger', desc: "Il nemico ha speso 5+ FC questo turno", detail: "Si attiva quando l'avversario ha investito 5 o più Focus Coin nello scontro corrente. Punisce chi scommette forte." },
  { term: 'Sfida', abbr: null, category: 'trigger', desc: "La tua Lega è inferiore a quella nemica", detail: "Si attiva quando l'Agente che stai giocando ha Lega più bassa di quello dell'avversario. Premiato chi gioca carte 'sotto costo'." },
  { term: 'Sopraffare', abbr: null, category: 'trigger', desc: "La tua Lega è superiore a quella nemica", detail: "Si attiva quando la tua Lega è più alta di quella dell'avversario. Premiato chi domina con carte potenti." },
  { term: 'Invasione', abbr: null, category: 'trigger', desc: "Hai conquistato 1+ campi", detail: "Si attiva quando hai già conquistato almeno un campo di battaglia in questa partita. Premiato chi sta avanzando." },
  { term: 'Resistenza', abbr: null, category: 'trigger', desc: "Il nemico ha conquistato 1+ campi", detail: "Si attiva quando l'avversario ha conquistato almeno un campo. Premiato chi deve rimontare." },
  { term: 'Turbo', abbr: null, category: 'trigger', desc: "Turno 1 o 2", detail: "Si attiva nei primi due turni. Effetti pensati per l'apertura di partita." },
  { term: 'Ultima Chance', abbr: null, category: 'trigger', desc: "Turno 5+", detail: "Si attiva dal turno 5 in poi. Effetti pensati per la fase finale, quando conta la Supremazia (PV)." },
  { term: 'Rinforzi', abbr: null, category: 'trigger', desc: "1 altra carta della stessa Lega della carta giocata in mano iniziale", detail: "Si attiva se, tra le 5 carte della tua mano iniziale, c'era almeno 1 altra carta (oltre a quella che stai giocando) con la stessa Lega dell'Agente in questo scontro. Contano anche le carte di quella mano già giocate. Usato dal bonus armata del Patto degli Indocili." },

  // Effetti Buff
  { term: '+X POT', abbr: null, category: 'effetti', desc: "Aumenta la tua Potenza di X", detail: "Aggiunge X alla tua POT prima del calcolo del VA. Esempio: +2 POT con POT 5 e 3 FC → VA considera POT 7." },
  { term: '+X DAN', abbr: null, category: 'effetti', desc: "Aumenta il tuo Danno di X", detail: "Aumenta il danno che infliggi se vinci. Esempio: DAN 3 + +2 DAN = infliggi 5 danni quando vinci." },
  { term: '+X VA', abbr: null, category: 'effetti', desc: "Bonus diretto al Valore Assalto", detail: "Aggiunge X direttamente al tuo VA finale, dopo il calcolo POT × FC. Molto potente perché bypassa la formula base." },
  { term: '+X FC', abbr: null, category: 'effetti', desc: "Guadagni X Focus Coin", detail: "Recuperi X Focus Coin. Raro e prezioso: i FC normalmente non si recuperano! Usa con saggezza." },
  { term: 'Cura X', abbr: null, category: 'effetti', desc: "Recuperi X Punti Vita", detail: "Aggiungi X ai tuoi PV. Può salvarti quando sei in svantaggio o quando l'avversario ti ha ridotto." },

  // Effetti Scaling (buff condizionali)
  { term: 'Escalation X [STAT]', abbr: null, category: 'effetti', desc: "+X alla statistica (POT/DAN) per ogni campo che hai conquistato", detail: "Aumenta la tua POT o DAN di X per ogni campo di battaglia che hai conquistato in questa partita. Più campi controlli, più diventi potente. Esempio: Escalation 2 POT con 2 campi conquistati → +4 POT." },
  { term: 'Attrizione X [STAT]', abbr: null, category: 'effetti', desc: "+X alla statistica (POT/DAN) per ogni carta che hai già giocato", detail: "Aumenta la tua POT o DAN di X per ogni carta che hai già giocato in questa partita (solo carte tue, non quelle del nemico). Più giochi, più diventi forte. Si attiva gradualmente durante la partita." },

  // Effetti Debuff
  { term: '-X POT nem.', abbr: null, category: 'effetti', desc: "Riduce la Potenza nemica di X (min Y opzionale)", detail: "Riduce la POT dell'Agente avversario di X. Se c'è (min Y), non può scendere sotto Y. Esempio: -3 POT nem. (min 1) contro POT 5 → nemico ha POT 2." },
  { term: '-X DAN nem.', abbr: null, category: 'effetti', desc: "Riduce il Danno nemico di X (min Y opzionale)", detail: "Riduce il DAN che l'avversario infligge se vince. Con (min Y) non scende sotto Y. Più effetti si sommano con il minimo meno restrittivo." },
  { term: '-X VA nem.', abbr: null, category: 'effetti', desc: "Malus al Valore Assalto nemico (min Y opzionale)", detail: "Toglie X dal VA dell'avversario. Molto efficace per far perdere scontri che sembravano vinti. Con (min Y) il VA nemico non scende sotto quel valore." },
  { term: 'X Danni dir.', abbr: null, category: 'effetti', desc: "Infliggi X danni diretti ai PV nemici", detail: "Infliggi X danni ai PV dell'avversario indipendentemente dall'esito dello scontro. Non dipende da chi vince." },
  { term: '-X PV (a te)', abbr: null, category: 'effetti', desc: "Infliggi X danni ai tuoi PV", detail: "Un effetto a costo: perdi X PV. Di solito in cambio di un beneficio maggiore (es. un potere molto forte)." },
  { term: '(min Y)', abbr: null, category: 'effetti', desc: "Non può ridurre la statistica sotto il valore Y", detail: "Quando un effetto di riduzione ha (min Y), la statistica bersaglio non può scendere sotto Y. Esempio: -4 DAN nem. (min 2) contro DAN 5 → risultato 1; contro DAN 2 → nessun effetto." },

  // Effetti Copia
  { term: 'Copia POT', abbr: null, category: 'effetti', desc: "La tua POT diventa uguale alla POT nemica", detail: "La tua Potenza viene sostituita con quella dell'Agente avversario. Utile contro avversari con POT alta." },
  { term: 'Copia DAN', abbr: null, category: 'effetti', desc: "Il tuo DAN diventa uguale al DAN nemico", detail: "Il tuo Danno diventa uguale a quello dell'avversario. Può essere utile se l'avversario ha DAN molto alto." },
  { term: 'Copia Potere', abbr: null, category: 'effetti', desc: "Usi il Potere dell'agente nemico", detail: "Per quello scontro, il tuo Potere è quello dell'Agente avversario. Potente contro nemici con abilità forti." },
  { term: 'Copia Bonus', abbr: null, category: 'effetti', desc: "Usi il Bonus Armata nemico", detail: "Usi il Bonus Armata dell'avversario invece del tuo (se ne ha uno attivo). Raro ma devastante." },

  // Effetti Controllo
  { term: 'Blocca Potere', abbr: null, category: 'effetti', desc: "Annulla il Potere dell'agente nemico", detail: "Il Potere dell'Agente avversario non si attiva. Molto forte contro nemici che dipendono dal loro potere." },
  { term: 'Blocca Bonus', abbr: null, category: 'effetti', desc: "Annulla il Bonus Armata nemico", detail: "Il Bonus Armata dell'avversario non si attiva. Utile quando l'avversario ha un bonus potente." },
  { term: 'Immune', abbr: null, category: 'effetti', desc: "Ignora le riduzioni statistiche (-POT, -DAN, -VA)", detail: "Le riduzioni a POT, DAN e VA non ti colpiscono. Non protegge da Blocca Potere e Blocca Bonus, né da danni diretti (X Danni dir.)." },
  { term: 'Inversione', abbr: null, category: 'effetti', desc: "I modificatori esterni sono invertiti: buff → debuff, debuff → buff", detail: "Gli effetti nemici e dei campi di battaglia che ti colpiscono si invertono: un -2 POT nem. diventa +2 POT per te, un +1 DAN da un campo diventa -1 DAN. Non protegge da Blocca Potere e Blocca Bonus." },
  { term: 'Tossina X (min Y)', abbr: null, category: 'effetti', desc: "Danno passivo a fine turno finché avversario > Y PV", detail: "Quando Tossina viene attivata, l'avversario subisce X danni a fine di ogni turno successivo. Continua finché l'avversario non scende a Y PV o meno. Se riattivata mentre è già attiva, il valore aumenta di +1. Esempio: bonus Ratti — Tossina 1 (min 10) → 1 danno a fine turno finché l'avversario ha più di 10 PV." },

  // Tag Agenti — panoramica
  {
    term: 'Tag Agente',
    abbr: 'Sistema',
    category: 'tag',
    desc: 'Etichette che ti aiutano a capire subito che carta hai in mano',
    detail: "Su ogni Agente trovi piccole etichette: quanto è forte fisicamente, se preferisce vincere o fare danno, in che momento brilla, cosa fa il potere e che ruolo ha nel tuo mazzo. Non cambiano le regole: servono solo a leggere la carta più in fretta, in galleria e nel deck builder.",
  },

  // Tag — Corpo
  {
    term: 'Esile',
    abbr: 'Corpo',
    category: 'tag',
    desc: 'Corpo debole per la sua Lega: POT e DAN sommati restano bassi',
    detail: "Per la sua Lega, questa carta ha poche statistiche sulle spalle. Di solito compensa con un potere molto utile. Va giocata per l'effetto, non per dominare lo scontro a muso duro.",
  },
  {
    term: 'Solido',
    abbr: 'Corpo',
    category: 'tag',
    desc: 'Corpo nella media: statistiche giuste per la sua Lega',
    detail: "Né sopra né sotto le aspettative. Carta onesta: quello che vedi in POT e DAN è quello che ottieni, senza sorprese.",
  },
  {
    term: 'Imponente',
    abbr: 'Corpo',
    category: 'tag',
    desc: 'Corpo sopra la media: POT e DAN sommati sono alti per la Lega',
    detail: "Ha muscoli in più rispetto alle carte simili. Spesso ha poco o nessun potere: la forza sta tutta nelle statistiche. Alcune carte leggendarie uniscono corpo enorme e potere forte.",
  },

  // Tag — Equilibrio
  {
    term: 'Equilibrato',
    abbr: 'Equilibrio',
    category: 'tag',
    desc: 'POT e DAN simili: né troppo aggressiva né troppo difensiva',
    detail: "Vince scontri decenti e, quando vince, fa un danno discreto. Carta duttile, adatta quando non sai ancora che partita ti aspetta.",
  },
  {
    term: 'Sbilanciato',
    abbr: 'Equilibrio',
    category: 'tag',
    desc: 'POT e DAN molto distanti: punta tutto su una delle due',
    detail: "O vince spesso ma fa poco male, oppure perde spesso ma quando colpisce fa molto male. Non è un difetto: è una scelta di design. Leggi quale stat domina e giocala di conseguenza.",
  },

  // Tag — Stat assolute (POT)
  {
    term: 'POT Bassa',
    abbr: 'Potenza',
    category: 'tag',
    desc: 'Potenza molto bassa: fatica a vincere gli scontri da sola',
    detail: "Senza aiuti dal potere, dagli FC o da effetti che potenziano la carta, perderà la maggior parte dei duelli. Ha senso se il valore arriva dal danno, dai danni diretti o da altri effetti.",
  },
  {
    term: 'POT Media',
    abbr: 'Potenza',
    category: 'tag',
    desc: 'Potenza nella media: competitiva se investi abbastanza FC',
    detail: "Con un buon numero di Focus Coin può reggere il confronto. Carta equilibrata, né dominante né in difficoltà.",
  },
  {
    term: 'POT Alta',
    abbr: 'Potenza',
    category: 'tag',
    desc: 'Potenza alta: vince spesso gli scontri anche senza spendere troppi FC',
    detail: "Forte nel duello diretto. Utile quando vuoi essere sicuro di conquistare il campo o infliggere il colpo senza svuotare le risorse.",
  },
  {
    term: 'POT Devastante',
    abbr: 'Potenza',
    category: 'tag',
    desc: 'Potenza eccezionale: domina quasi ogni scontro, carta rara',
    detail: "Difficile da battere in faccia. L'avversario dovrà debuffarti, bloccarti o investire molto per contrastarti.",
  },

  // Tag — Stat assolute (DAN)
  {
    term: 'DAN Basso',
    abbr: 'Danno',
    category: 'tag',
    desc: 'Danno basso: anche vincendo, toglie pochi PV al nemico',
    detail: "Conquista campi ma non spaventa sui punti vita. Il valore sta spesso nel potere — FC extra, danni diretti, controllo — più che nel danno da vittoria.",
  },
  {
    term: 'DAN Medio',
    abbr: 'Danno',
    category: 'tag',
    desc: 'Danno nella media: ogni vittoria fa sentire il colpo',
    detail: "Un buon compromesso. Non chiude da sola la partita, ma ogni scontro vinto conta.",
  },
  {
    term: 'DAN Alto',
    abbr: 'Danno',
    category: 'tag',
    desc: 'Danno alto: ogni vittoria fa molto male al nemico',
    detail: "Carta aggressiva. Poche vittorie bastano per mettere sotto pressione i PV avversari. Tipica delle carte che chiudono la partita.",
  },
  {
    term: 'DAN Letale',
    abbr: 'Danno',
    category: 'tag',
    desc: 'Danno devastante: ogni vittoria è un colpo quasi decisivo, raro',
    detail: "Quando vince, il nemico perde tantissimi PV. Carta per punire errori avversari o chiudere rapidamente.",
  },

  // Tag — Postura
  {
    term: 'First Strike',
    abbr: 'Postura',
    category: 'tag',
    desc: 'Brilla quando giochi per primo nello scontro',
    detail: "Il potere si attiva con Imboscata. Punta a prendere l'iniziativa e pressare subito, senza aspettare la mossa nemica.",
  },
  {
    term: 'Counter',
    abbr: 'Postura',
    category: 'tag',
    desc: 'Brilla quando giochi per secondo e vedi prima la carta nemica',
    detail: "Il potere si attiva con Intervento. Carta reattiva: rispondi a ciò che ha giocato l'avversario, debuffi o punisci la sua scelta.",
  },
  {
    term: 'Momentum',
    abbr: 'Postura',
    category: 'tag',
    desc: 'Brilla quando sei in vantaggio — scontri vinti, più PV, più campi',
    detail: "Pensata per chi sta dominando la partita. Più sei avanti, più ha senso giocarla per allargare il divario.",
  },
  {
    term: 'Comeback',
    abbr: 'Postura',
    category: 'tag',
    desc: 'Brilla quando sei in svantaggio — sconfitte, meno PV, nemico avanti',
    detail: "Carta da rimonta. Utile quando stai perdendo e hai bisogno di recuperare terreno o resistere al push avversario.",
  },
  {
    term: 'All-in',
    abbr: 'Postura',
    category: 'tag',
    desc: 'Chiede un investimento pesante di FC in un solo turno',
    detail: "Il potere si attiva con Overdrive. Giocala quando vuoi puntare tutto su quello scontro e non ti tiri indietro sulla spesa.",
  },
  {
    term: 'Punisher',
    abbr: 'Postura',
    category: 'tag',
    desc: 'Punisce il nemico se ha speso troppi FC in un turno',
    detail: "Contro-carta agli Overdrive avversari. Forte quando l'altro va all-in e tu lo fai pagare caro.",
  },
  {
    term: 'Steady',
    abbr: 'Postura',
    category: 'tag',
    desc: 'Potere sempre attivo: nessuna condizione da rispettare',
    detail: "Ogni volta che la giochi, il potere funziona. Affidabile e prevedibile: non devi aspettare il momento giusto.",
  },
  {
    term: 'Late Game',
    abbr: 'Postura',
    category: 'tag',
    desc: 'Si accende nelle fasi centrali o finali della partita',
    detail: "Il potere si attiva con Resa dei conti o Ultima Chance. Non è una carta da turni iniziali: lasciala per quando la partita si fa seria.",
  },
  {
    term: 'Early Rush',
    abbr: 'Postura',
    category: 'tag',
    desc: "Forte all'inizio, poi resta solo il corpo della carta",
    detail: "Il potere si attiva con Turbo, nei primi due turni. Apri aggressivo; dopo conta soprattutto POT e DAN senza l'effetto.",
  },

  // Tag — Funzione
  {
    term: 'Buffer',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Potenzia te stesso — più POT, DAN o VA',
    detail: "Il potere rende la tua carta più forte nello scontro. Giocala quando vuoi vincere il duello o spingere in vantaggio.",
  },
  {
    term: 'Debuffer',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Indebolisce la carta nemica',
    detail: "Riduce POT, DAN o VA avversari per farti vincere lo scontro o limitare i danni che subirai. Carta tattica contro avversari forti.",
  },
  {
    term: 'Closer',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Fa danno ai PV nemici anche senza vincere lo scontro',
    detail: "Danni diretti o effetti come la Tossina: il valore non dipende solo da chi vince il duello. Utile per finire partite o erodere PV a prescindere.",
  },
  {
    term: 'Tank',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Protegge o cura: riduce il danno che subisci',
    detail: "Immunità, cure o riduzione del danno nemico. Come ruolo nel mazzo: carta scelta per resistere, non per uccidere.",
  },
  {
    term: 'Controller',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Neutralizza poteri o bonus nemici',
    detail: "Blocca Potere o Blocca Bonus. Spezza le combo avversarie e toglie il vantaggio a chi dipende dalle abilità.",
  },
  {
    term: 'Mimic',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Copia statistiche o poteri del nemico',
    detail: "Rubare POT, DAN o il potere avversario. Forte contro carte migliori delle tue: li eguagli o usi la loro arma.",
  },
  {
    term: 'Engine',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Genera risorse o valore che cresce nel tempo',
    detail: "Come effetto: guadagni FC o accumuli vantaggio turno dopo turno. Come ruolo nel mazzo: alimenta le altre carte senza dover vincere da sola.",
  },
  {
    term: 'Scaler',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Diventa più forte man mano che la partita avanza',
    detail: "Cresce con i campi conquistati o con le carte già giocate. Più aspetti (nelle giuste condizioni), più paga.",
  },
  {
    term: 'Converter',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Trasforma i malus nemici in bonus per te',
    detail: "Effetto Inversione: ciò che ti debuffava diventa un aiuto. Non protegge da Blocca Potere o Blocca Bonus.",
  },
  {
    term: 'Kamikaze',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Si danneggia per ottenere un vantaggio',
    detail: "Perde PV per attivare un potere forte o condizioni come Ultimo Desiderio. Gioco rischioso: paghi caro, ma può valerne la pena.",
  },
  {
    term: 'Vanilla',
    abbr: 'Funzione',
    category: 'tag',
    desc: 'Nessun potere: solo le statistiche sulla carta',
    detail: "Niente trigger, niente effetti. Tutta la forza è in POT, DAN e Lega. Semplice e trasparente.",
  },

  // Tag — Ruolo (strategia nel deck)
  {
    term: 'Boss',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'La carta più importante del mazzo, intorno a cui costruisci',
    detail: "Di solito Lega alta e molto potente. È quella che vuoi vedere quando la partita si decide.",
  },
  {
    term: 'Finisher',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'Carta per chiudere la partita e mettere KO il nemico',
    detail: "Danno altissimo o effetti che erodono i PV in fretta. La giochi quando vuoi finirla, non solo conquistare un campo.",
  },
  {
    term: 'Pillar',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'Cuore della strategia: lavora col bonus armata',
    detail: "È la carta che vuoi giocare ogni partita. Trigger ed effetto vanno d'accordo col bonus della tua armata.",
  },
  {
    term: 'Ace',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'Piano B: forte anche fuori dal piano principale',
    detail: "Non segue perfettamente il bonus armata, ma ti salva quando il piano abituale non funziona.",
  },
  {
    term: 'Bomb',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'Carta a rischio: o fa un disastro, o delude',
    detail: "Se il trigger scatta, può cambiare la partita. Se no, fa poco. Alta emozione, bassa costanza.",
  },
  {
    term: 'Anchor',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'Affidabile: non ti delude mai troppo',
    detail: "Potere facile da attivare o sempre attivo. La carta sicura quando non vuoi sorprese.",
  },
  {
    term: 'Flex',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'Si adatta a molte situazioni, senza essere la migliore in nessuna',
    detail: "Versatile: la giochi quando non sai cosa aspettarti. Buona ovunque, eccellente da nessuna parte.",
  },
  {
    term: 'Tech',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'Risposta a un nemico o situazione precisa',
    detail: "La metti nel mazzo per un motivo specifico — es. bloccare un potere, contrastare un armata. Forte nel matchup giusto, debole negli altri.",
  },
  {
    term: 'Sacrifice',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'Può perdere lo scontro di proposito per generare valore',
    detail: "Auto-danno o Ultimo Desiderio come piano principale. Accetti la sconfitta per danni diretti, FC o effetti che arrivano dopo.",
  },
  {
    term: 'Filler',
    abbr: 'Ruolo',
    category: 'tag',
    desc: 'Riempie il mazzo: corpo ok, niente di speciale',
    detail: "La decima carta quando le altre nove sono già buone. Fa il suo lavoro senza ruolo strategico particolare.",
  },
];

export const GLOSSARY_CATEGORIES = {
  concetti: { label: 'Concetti Base', icon: '⚔️', color: 'amber' },
  vittoria: { label: 'Condizioni di Vittoria', icon: '🏆', color: 'green' },
  trigger: { label: 'Trigger', icon: '🎯', color: 'cyan' },
  effetti: { label: 'Effetti', icon: '⚡', color: 'purple' },
  tag: { label: 'Tag Agenti', icon: '🏷️', color: 'rose' },
};
