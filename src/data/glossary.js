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
  { term: 'Tossina X (min Y)', abbr: null, category: 'effetti', desc: "Danno passivo a fine turno finché avversario > Y PV", detail: "Quando Tossina viene attivata, l'avversario subisce X danni a fine di ogni turno successivo. Continua finché l'avversario non scende a Y PV o meno. Se riattivata mentre è già attiva, il valore aumenta di +1. Esempio: Tossina 2 (min 4) → avversario subisce 2 danni a fine turno finché ha più di 4 PV." },
];

export const GLOSSARY_CATEGORIES = {
  concetti: { label: 'Concetti Base', icon: '⚔️', color: 'amber' },
  vittoria: { label: 'Condizioni di Vittoria', icon: '🏆', color: 'green' },
  trigger: { label: 'Trigger', icon: '🎯', color: 'cyan' },
  effetti: { label: 'Effetti', icon: '⚡', color: 'purple' },
};
