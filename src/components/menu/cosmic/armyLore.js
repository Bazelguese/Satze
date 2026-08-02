// ============================================
// LORE & STILE delle Armate per la schermata di selezione
// ============================================
// Questo è l'UNICO file che il game designer deve modificare per
// cambiare i testi della schermata "Scegli la tua armata".
// I dati di gameplay (carte, bonus, colori) restano in /data/.
//
// Campi usati dall'UI:
//   glyph, motto, synopsis          → colonna sinistra
//   bonusLabel, bonusWhen, bonusExplain, bonusHighlight, style, tips → colonna destra
//   bonusHighlight (opzionale)      → callout che evidenzia eccezioni di attivazione
// ============================================

export const ARMY_LORE = {
  "Figli dell'Orizzonte": {
    glyph: '☄',
    bonusLabel: 'PASSIVO',
    motto: 'Ancorati al cielo. Disarma prima di colpire.',
    synopsis:
      "Vegliano sui confini del cielo, ancorati alla Domanda che li tiene interi. Non cercano la gloria del colpo decisivo: la loro presenza basta a dissuadere l'attacco, a comprimere lo spazio in cui il nemico può muoversi.\n\nOgni Figlio è un filo teso tra la Nebula e il campo. Quando quel filo si tende, l'aggressione avversaria si spegne prima ancora di nascere. Combattono con dubbio, ritmo e Focus — non con la furia frontale.\n\nSceglili se vuoi dettare il tempo della partita: rallentare l'assalto nemico, accumulare risorse e chiudere quando il campo è già piegato a tuo favore.",
    bonusWhen: 'Sempre attivo — nessun trigger richiesto.',
    bonusExplain:
      'Il Valore Assalto del nemico scende di 5 su ogni duello, senza mai scendere sotto 6. È un freno permanente sulla pressione offensiva avversaria.',
    style:
      'Controllo a distanza. Riduci la pressione nemica fin dal primo duello, gestisci il ritmo con Focus Coin e privilegia interventi sul VA rispetto agli scambi aperti.',
    tips:
      'Non inseguire burst precoci. Vinci scambi medi, accumula FC e usa il VA ridotto per rendere costosi gli attacchi nemici. Contro armate aggressive il passivo vale oro; contro tank lunghi, punta a risorse e late game.',
  },
  "Kethran": {
    glyph: '☥',
    bonusLabel: 'RIMONTA',
    motto: 'Dalla cenere, più forti.',
    synopsis:
      "Risorgono dalle ceneri delle proprie sconfitte. Ogni ferita è un'opportunità, ogni territorio perduto un motivo per colpire più duro. I Kethran non temono di restare indietro: è proprio lì, sul bordo del baratro, che la loro fede si fa potenza.\n\nLa rimonta non è un piano B — è la loro teologia di guerra. Accettano scambi asimmetrici, lasciano che il nemico si esponga, poi tornano con una forza che i round iniziali non lasciavano prevedere.\n\nSceglili se ami i comeback: partite che sembrano perse fino al momento in cui il campo si ribalta.",
    bonusWhen: 'Si attiva in Rimonta — quando sei in svantaggio territoriale.',
    bonusExplain:
      'Guadagni +2 Potenza sul duello corrente. Il picco arriva proprio quando sei dietro: trasforma i round di recupero in duelli a tuo favore.',
    style:
      'Comeback. Accetta scambi precoci se servono a sopravvivere, tieni risorse per i round in cui sei dietro e forza duelli chiave mentre il bonus Rimonta è attivo.',
    tips:
      'Non spendere tutto in vantaggio. Conserva agenti forti per la fase in cui il bonus scatta. Se resti sempre avanti, il passivo resta dormiente: a volte conviene “cadere” per poi risalire più duri.',
  },
  "Corte Rossa": {
    glyph: '🜂',
    bonusLabel: 'COPIA',
    motto: 'Ciò che vedi, lo diventi.',
    synopsis:
      "Imitano i loro nemici. Ciò che vedono, lo diventano. La Corte Rossa non ha un volto proprio: si specchia nell'armata avversaria e ne ruba il vantaggio, trasformando ogni bonus nemico in un'arma a doppio taglio.\n\nChi li affronta combatte contro se stesso. Non portano un piano fisso sul campo — portano uno specchio. Più l'avversario è definito dal proprio bonus, più la Corte lo smonta dall'interno.\n\nSceglili se ami l'adattamento e i matchup psicologici: ogni partita è un puzzle diverso.",
    bonusWhen: 'Sempre attivo — copia il bonus armata nemico.',
    bonusExplain:
      'Ricevi lo stesso bonus dell\'armata avversaria e lo usi contro di lei. Non hai un effetto fisso: il tuo potere dipende da chi hai di fronte.',
    style:
      'Adattamento. Scegli matchup in cui il bonus avversario è forte: più è potente il loro sigillo, più guadagni tu. Cambia piano di gioco a seconda di cosa copi.',
    tips:
      'Impara i bonus delle altre armate: sono anche i tuoi. Contro passivi deboli la Corte soffre; contro trigger potenti (Overdrive, Conquista, Rimonta) diventa devastante. Pilota flessibile, non ripetitivo.',
  },
  "Calibri Pesanti": {
    glyph: '⚙',
    bonusLabel: 'PASSIVO',
    motto: 'Acciaio. Inerzia. Sopravvivenza.',
    synopsis:
      "Macchine forgiate per resistere. Acciaio, pistoni e disciplina: niente penetra facilmente il loro scudo. I Calibri Pesanti non inseguono raffiche spettacolari — assorbono, assorbono ancora, e lasciano che il nemico si spezzi contro la loro inerzia.\n\nSul campo sono un muro che avanza. Ogni duello è un calcolo di mitigazione: meno danno subito, più round per stringere la morsa. Non hanno fretta. Hanno tonnellate.\n\nSceglili se preferisci stabilità, scambi favorevoli e vittorie per attrito.",
    bonusWhen: 'Sempre attivo — nessun trigger richiesto.',
    bonusExplain:
      'Il Danno del nemico scende di 2 su ogni duello, senza mai scendere sotto 2. Riduce in modo permanente la letalità degli scambi avversari.',
    style:
      'Tank puro. Mitiga i colpi, privilegia scambi favorevoli e vinci per attrito più che per burst. Il tempo gioca a tuo favore se tieni il danno sotto controllo.',
    tips:
      'Non inseguire KO rapidi. Stabilizza la vita, forza duelli dove il -2 DAN decide, e accumula vantaggio lento. Contro armate tossina/attrito lunghe serve chiudere prima che il tempo li avvantaggi.',
  },
  "Orathai": {
    glyph: '🌙',
    bonusLabel: 'RESA DEI CONTI',
    motto: 'Aspetta. Poi finisci.',
    synopsis:
      "Aspettano il momento giusto sotto la luce lunare. Non dissipano energia nei primi scambi: osservano, accumulano, e quando arriva la Resa dei Conti colpiscono con precisione chirurgica.\n\nQuando attaccano davvero, è già troppo tardi per reagire. Gli Orathai vivono di pazienza e di parità — cercano il confronto equilibrato per trasformarlo in un'esecuzione.\n\nSceglili se ami il late game, i duelli calcolati e il burst che arriva solo quando conta.",
    bonusWhen: 'Si attiva in Resa dei Conti — duello equilibrato / pari.',
    bonusExplain:
      'Guadagni +2 Danno sul duello corrente. Il bonus premia i confronti in cui le forze sono vicine: trasforma la parità in un colpo decisivo.',
    style:
      'Burst tardivo. Cerca parità nei confronti chiave e esplodi con +DAN nelle fasi finali. Non forzare sbilanciamenti inutili nei round medi.',
    tips:
      'Prepara agenti che possano pareggiare o avvicinare il confronto. Evita duelli troppo sbilanciati se ti serve il trigger. Chiudi la partita nei round in cui il +2 DAN è disponibile e letale.',
  },
  "Mounthborn": {
    glyph: '◬',
    bonusLabel: 'IMBOSCATA',
    motto: 'Quando li vedi, è troppo tardi.',
    synopsis:
      "Si muovono nelle ombre della foresta. Passi silenziosi, agguati preparati: quando li vedi, è troppo tardi. I Mounthborn non annunciano l'assalto — lo consumano in un istante, mescolando potenza e ferocia nel momento in cui l'imboscata scatta.\n\nNon sono un muro né un controllo: sono una lama che appare dove non la aspetti. Costruiscono la condizione, poi la sfruttano senza pietà.\n\nSceglili se ami il gioco tattico, i setup e i duelli che si decidono in un colpo solo.",
    bonusWhen: 'Si attiva in Imboscata — condizione di agguato soddisfatta.',
    bonusExplain:
      'Guadagni +1 Potenza e +1 Danno sul duello corrente. Un doppio boost che ribalta scambi altrimenti pari o leggermente sfavorevoli.',
    style:
      'Attacco a sorpresa. Costruisci condizioni di imboscata e spingi duelli in cui il doppio bonus POT+DAN decide lo scontro. Tempo il setup, non sprecare il trigger.',
    tips:
      'Il valore sta nel timing: un\'imboscata sprecata è un round perso. Conserva agenti forti per quando il trigger è attivo. Contro controllo passivo, forza aperture rapide prima che ti soffochino.',
  },
  "L'Enclave delle Scaglie": {
    glyph: '🐉',
    bonusLabel: 'CONQUISTA',
    motto: 'Ogni terra conquistata rinforza il trono.',
    synopsis:
      "Antichi guardiani del territorio. Ogni terra conquistata li rinforza, ogni vittoria deposita scaglie di potere sul loro trono. L'Enclave non corre: avanza, marca il suolo, e trasforma ogni conquista in risorse per la successiva.\n\nIl loro snowball è territoriale e economico. Vinci, guadagni Focus Coin, reinvesti, stringi. Più tardi arrivi nel match, più il vantaggio si fa pesante.\n\nSceglili se vuoi un piano chiaro: vincere scambi, accumulare FC, chiudere con superiorità di risorse.",
    bonusWhen: 'Si attiva in Conquista — dopo aver vinto il duello.',
    bonusExplain:
      'Guadagni +2 Focus Coin. Ogni vittoria di duello finanzia il round successivo: più conquisti, più puoi spendere.',
    style:
      'Snowball territoriale. Vinci scambi medi, accumula FC dalle conquiste e riinvestili per chiudere. Evita gambit rischiosi che bruciano conquiste inutilmente.',
    tips:
      'Priorità: conquistare spesso, anche con vittorie “pulite” a basso rischio. Spendi FC nei round dove consolidano il vantaggio. Contro rimonta/comeback, non regalare aperture late se sei avanti.',
  },
  "Ratti della Megera": {
    glyph: '⚗',
    bonusLabel: 'CONQUISTA',
    motto: 'Corrompere. Consumare. Aspettare.',
    synopsis:
      "Avvelenano l'aria, l'acqua, la mente. Non cercano il colpo unico: corrodono, consumano, vincono per attrito. I Ratti della Megera lasciano che il tempo lavori per loro — ogni conquista è un'altra goccia di tossina nel sistema nemico.\n\nSono subdoli e pazienti. Preferiscono partite lunghe, dove la salute avversaria si sfilaccia e ogni vittoria lascia un marchio permanente.\n\nSceglili se ami l'attrito, la tossina e i piani che maturi round dopo round.",
    bonusWhen: 'Si attiva in Conquista — dopo aver vinto il duello.',
    bonusExplain:
      'Applica Tossina 1 al nemico, ma solo se ha almeno 10 di salute. Non è un burst: è un veleno che si accumula nelle partite lunghe.',
    style:
      'Tossina e attrito. Preferisci partite lunghe, accumula conquiste e lascia che la tossina eroda il vantaggio avversario. Non forzare chiusure premature se il veleno sta lavorando.',
    tips:
      'Controlla la soglia salute: sotto 10 la tossina non parte. Vinci spesso, non necessariamente forte. Contro armate che chiudono presto, serve accelerare o sabotare il loro piano prima che ti soffochino.',
  },
  "Patto degli Indocili": {
    glyph: '◈',
    bonusLabel: 'RINFORZI',
    motto: 'Mai uniti. Mai sconfitti.',
    synopsis:
      "Mai uniti, mai sconfitti. Il Patto non è un esercito ordinato: è una coalizione di rifiuto, di voci che indeboliscono chiunque si opponga. La debolezza altrui è la loro forza — quando arrivano i rinforzi, il nemico si ritrova più fragile di quanto immaginasse.\n\nNon dominano con un colpo proprio: tolgono potenza e danno all'avversario, aprendo buchi dove prima c'era solidità.\n\nSceglili se ami sopprimere, debuffare e vincere duelli che l'avversario credeva sicuri.",
    bonusHighlight:
      'Unica eccezione: le altre armate guardano l’armata (almeno due Agenti uguali in mano). Il Patto guarda la Lega: servono tre carte della stessa Lega, compresa quella giocata.',
    bonusWhen:
      'Rinforzi — tre carte della stessa Lega in mano iniziale, compresa la carta giocata.',
    bonusExplain:
      'Il nemico perde 1 Potenza e 1 Danno sul duello corrente, senza scendere sotto 2 su ciascuna stat. Si valuta per-carta: solo se quella giocata ha i rinforzi in Lega.',
    style:
      'Debuff doppio. Costruisci concentrazioni di Lega e sopprimi POT/DAN nemici nei duelli in cui serve aprire un vantaggio.',
    tips:
      'Il valore sta nella costruzione a cluster di Lega. Contro passivi già mitigatori, punta ai duelli in cui quel −1/−1 decide.',
  },
  "Khemet": {
    glyph: '𓂀',
    bonusLabel: 'OVERDRIVE',
    motto: 'Quando si attivano, nulla li ferma.',
    synopsis:
      "Tecnologia oltre il visibile. Circuiti, protocolli e un impulso che ignora le regole del campo. Quando i Khemet entrano in Overdrive, nulla li ferma: immuni, inarrestabili, una punta di lancia che spezza qualsiasi piano avversario nel momento cruciale.\n\nNon sono un esercito di resistenza passiva — sono un power spike. Conservano, caricano, poi attraversano il duello come se gli effetti nemici non esistessero.\n\nSceglili se ami i round decisivi, l'immunità e le chiusure brutali.",
    bonusWhen: 'Si attiva in Overdrive — fase di power spike.',
    bonusExplain:
      'Diventi Immune per quel duello: ignori effetti nemici rilevanti. È una finestra in cui puoi forzare scontri altrimenti impossibili.',
    style:
      'Power spike. Conserva e forza l\'Overdrive nei round decisivi. Non sprecare l\'immunità su scambi irrilevanti: usala per rubare territori o chiudere la partita.',
    tips:
      'Tutto ruota attorno a quando scatta l\'Overdrive. Prepara il campo, poi spendi la finestra immune sul duello che decide. Contro controllo/passivi, l\'immunità spezza il loro piano; non lasciarla scadere inutilizzata.',
  },
  "Apex": {
    glyph: '❄',
    bonusLabel: 'INVASIONE',
    motto: 'Ridevi quando ci scegliesti.',
    synopsis:
      "Predatori bianchi della Crosta Bianca. Gli Apex non conquistano per governare: smontano, scuoiano, riportano il bottino alla Loggia. La Gerarchia della Carne non ereditata — chi riempie le ciotole comanda, finché un altro non dimostra di essere più capace.\n\nQuando invadono i campi, il loro assalto si fa più pesante: +5 VA sul duello corrente. Non sono un muro né un rito: sono una caccia che avanza.\n\nSceglili se ami conquistare territorio, sfruttare l'Invasione e chiudere le prede con imboscate e gloria.",
    bonusWhen: 'Si attiva in Invasione — hai conquistato almeno 1 campo.',
    bonusExplain:
      'Ricevi +5 Valore d\'Assalto sul duello corrente. Un picco di pressione che premia chi ha già preso territorio e vuole spezzare lo scambio successivo.',
    style:
      'Caccia e territorio. Conquista campi per attivare l\'Invasione, poi forza duelli dove +5 VA decide. Combina Gloria, Imboscata e Rinforzi per mantenere lo slancio.',
    tips:
      'Il bonus vive sull\'Invasione: non restare a zero campi. Contro armate che riprendono territorio, proteggi le conquiste. Usa Dissuasore di turisti e Volontà del Sole Verde per spegnere poteri/bonus quando la caccia è già aperta.',
  },
};

// Entry sintetica per "Eserciti Personalizzati" (multi-armata)
export const MIXED_ARMIES_LORE = {
  glyph: '⚔',
  bonusLabel: 'NESSUNO',
  motto: 'Nessun sigillo. Solo scelte.',
  synopsis:
    "Coalizioni eterodosse di carte da armate diverse. Versatili, imprevedibili, difficili da pilotare: qui non c'è un sigillo unico a proteggerti, solo la tua capacità di unire poteri che non dovevano stare insieme.\n\nGli eserciti personalizzati offrono sinergie ibride e matchup creativi, ma rinunciano al bonus di fazione. Ogni lista è un esperimento — e ogni errore costa di più, perché non hai una rete di sicurezza meccanica.\n\nSceglili se conosci già le armate, ami costruire deck e vuoi massima flessibilità a costo di un piano più fragile.",
  bonusWhen: 'Nessun bonus armata.',
  bonusExplain:
    'Gli eserciti personalizzati non ricevono il passivo o il trigger di una singola fazione. Tutto il valore deve venire dalle carte e dalle sinergie che costruisci tu.',
  style:
    'Massima flessibilità. Compensa l\'assenza di bonus con sinergie di carte, cover dei matchup e scelte di esercito precise. Richiede esperienza.',
  tips:
    'Non improvvisare: definisci un piano (controllo, burst, attrito) anche senza bonus. Evita liste “un po\' di tutto”. Contro armate con passivi forti, serve un vantaggio di carte chiaro sin dallo schieramento.',
};
