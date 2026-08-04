// Lore editabile per la schermata "Scegli l'esercito" (DeckSelectCinematic).
// Chiavi mazzo = ARMY_DECKS[armata] (A, B, C…). Gameplay in src/data/.

export const DECK_LORE = {
  "Figli dell'Orizzonte": {
    __glyph: "☄",
    A: {
      code: "O·I", name: "Il Sole Prima della Fine", archetype: "CONQUISTA · AGGRESSIVA",
      flavor: "Il sole di Vaelith muore — e tu colpisci prima che finisca la luce.",
      keywords: ["Conquista","Tempo","Tech"],
      leader: { name: "L'Eco del Primo Sole", title: "L'Eco del Primo Sole", img: null, league: 5, power: 5, damage: 5, ability: "Turbo: +8 VA" },
    },
    B: {
      code: "O·II", name: "La Domanda Senza Fine", archetype: "SUPREMAZIA · CONTROLLO",
      flavor: "La Domanda non chiede vittoria. Chiede che il nemico dubiti.",
      keywords: ["Supremazia","Controllo","Tech"],
      leader: { name: "Sorethal, il Primo Ancorante", title: "il Primo Ancorante", img: null, league: 5, power: 6, damage: 4, ability: "Overdrive: -8 VA nem. (min 6)" },
    },
    C: {
      code: "O·III", name: "Liturgia dell'Ancora", archetype: "CONQUISTA · ADATTIVA",
      flavor: "La mano decide la liturgia: i Leggeri aprono, i Pesanti chiudono.",
      keywords: ["Conquista","Adattivo","Tech"],
      leader: { name: "Richiamante dell'Ordine", title: "Richiamante dell'Ordine", img: null, league: 4, power: 5, damage: 3, ability: "Turbo: 2 Danni dir." },
    },
  },
  "Kethran": {
    __glyph: "☥",
    A: {
      code: "K·I", name: "Il Trono Ferito", archetype: "CONQUISTA · AUTOLESIONE",
      flavor: "Vince un Campo. Si ferisce. Usa la ferita.",
      keywords: ["Conquista","Tempo","Tech"],
      leader: { name: "Crepuscolo, l'Assassino di Soli", title: "l'Assassino di Soli", img: null, league: 5, power: 7, damage: 3, ability: "Conquista: -4 PV (a te)" },
    },
    B: {
      code: "K·II", name: "Processione dei Caduti", archetype: "SUPREMAZIA · REATTIVA",
      flavor: "Ogni caduto paga il successivo. La processione non si ferma.",
      keywords: ["Supremazia","Reattivo","Tech"],
      leader: { name: "Vicario Berakol, Maestro della Ricomposizione", title: "Maestro della Ricomposizione", img: null, league: 5, power: 4, damage: 4, ability: "Vendetta: +2 POT, +2 DAN" },
    },
    C: {
      code: "K·III", name: "La Legge dei Frammenti", archetype: "CONQUISTA · TECNICA",
      flavor: "I frammenti obbediscono a chi sa leggerli.",
      keywords: ["Conquista","Controllo","Tech"],
      leader: { name: "Tagliapietre", title: "Tagliapietre", img: null, league: 4, power: 5, damage: 3, ability: "Vendetta: -3 DAN nem. (min 1)" },
    },
  },
  "Corte Rossa": {
    __glyph: "🜂",
    A: {
      code: "R·I", name: "Debito di Sangue", archetype: "PRESSIONE · CONQUISTA",
      flavor: "Conquista e riscuoti. Il debito non aspetta la copia.",
      keywords: ["Conquista","Tempo","Tech"],
      leader: { name: "Vaelith Sorn, il Primo", title: "il Primo", img: null, league: 5, power: 7, damage: 3, ability: "Conquista: 3 Danni dir." },
    },
    B: {
      code: "R·II", name: "Il Contratto dei Tre Sigilli", archetype: "CONTROLLO · ALLEATO",
      flavor: "Tre sigilli. Bonus, Potere, forza — tutto può essere chiuso.",
      keywords: ["Conquista","Controllo","Tech"],
      leader: { name: "Sigillatore dei Vili Affari", title: "Sigillatore dei Vili Affari", img: null, league: 4, power: 5, damage: 3, ability: "Alleato: Blocca Potere" },
    },
    C: {
      code: "R·III", name: "La Corte Riflessa", archetype: "COPIA · ADATTIVA",
      flavor: "Ciò che l'avversario porta, la Corte lo indossa.",
      keywords: ["Conquista","Adattivo","Tech"],
      leader: { name: "Alira l'Usuraia di Corone", title: "Alira l'Usuraia di Corone", img: null, league: 5, power: 8, damage: 1, ability: "Invasione: Copia DAN" },
    },
  },
  "Calibri Pesanti": {
    __glyph: "⚙",
    A: {
      code: "C·I", name: "La Linea Infrangibile", archetype: "SUPREMAZIA · DIFESA",
      flavor: "La linea non avanza. Resiste — e vince per inerzia.",
      keywords: ["Supremazia","Tempo","Tech"],
      leader: { name: "Titano Corazzato MK-IV", title: "Titano Corazzato MK-IV", img: null, league: 5, power: 5, damage: 6, ability: "Resa dei conti: Immune" },
    },
    B: {
      code: "C·II", name: "Batteria di Saturazione", archetype: "CONQUISTA · OVERDRIVE",
      flavor: "Quando i piani sono cenere, la batteria parla.",
      keywords: ["Conquista","Overdrive","Tech"],
      leader: { name: "Nucleo di Comando Nord", title: "Nucleo di Comando Nord", img: null, league: 4, power: 5, damage: 3, ability: "Overdrive: +2 POT" },
    },
    C: {
      code: "C·III", name: "Protocollo di Ricostruzione", archetype: "CONQUISTA · ADATTIVA",
      flavor: "Due blocchi, una ricostruzione: L2 e L4 si passano il fronte.",
      keywords: ["Conquista","Adattivo","Tech"],
      leader: { name: "Pugno del Fronte Ovest", title: "Pugno del Fronte Ovest", img: null, league: 4, power: 6, damage: 2, ability: "Magnanimo: +1 POT, +1 DAN" },
    },
  },
  "Orathai": {
    __glyph: "🌙",
    A: {
      code: "A·I", name: "Canto della Prima Vittoria", archetype: "CONQUISTA · PROGRESSIVA",
      flavor: "La marea torna. Ogni vittoria la rende più alta.",
      keywords: ["Conquista","Tempo","Tech"],
      leader: { name: "Voce della Fine", title: "Voce della Fine", img: null, league: 5, power: 5, damage: 4, ability: "Gloria: +2 POT" },
    },
    B: {
      code: "A·II", name: "Tempesta Armonica", archetype: "CONQUISTA · TECNICA",
      flavor: "L'armonia è un'altra forma di onda d'urto.",
      keywords: ["Conquista","Overdrive","Economia"],
      leader: { name: "La Tempesta Cava", title: "La Tempesta Cava", img: null, league: 5, power: 6, damage: 2, ability: "Overdrive: +12 VA" },
    },
    C: {
      code: "A·III", name: "Il Bosco Non Muore", archetype: "SUPREMAZIA · SUSTAIN",
      flavor: "Il bosco non muore. Guarisce, assorbe, resta in piedi.",
      keywords: ["Supremazia","Tempo","Tech"],
      leader: { name: "Il Coro", title: "Il Coro", img: null, league: 5, power: 5, damage: 3, ability: "Vendetta: Cura 3" },
    },
  },
  "Mounthborn": {
    __glyph: "◬",
    A: {
      code: "M·I", name: "Il Primo Morso", archetype: "CONQUISTA · AGGRESSIVA",
      flavor: "Il primo morso decide se cacciare o essere cacciati.",
      keywords: ["Conquista","Tempo","Tech"],
      leader: { name: "L'Evoluzione Finale", title: "L'Evoluzione Finale", img: null, league: 5, power: 6, damage: 3, ability: "Turbo: +1 POT, +1 DAN" },
    },
    B: {
      code: "M·II", name: "Il Morso di Ritorno", archetype: "SUPREMAZIA · REATTIVA",
      flavor: "Ciò che ti morde una volta torna più affamato.",
      keywords: ["Supremazia","Reattivo","Tech"],
      leader: { name: "Insetto della Guerra", title: "Insetto della Guerra", img: null, league: 5, power: 5, damage: 3, ability: "Rimonta: +2 POT, +2 DAN" },
    },
    C: {
      code: "M·III", name: "Intelligenza di Sciame", archetype: "CONTROLLO · SCIAME",
      flavor: "Lo sciame non pensa da solo. Pensa insieme.",
      keywords: ["Controllo","Tempo","Tech"],
      leader: { name: "Regina della Colonia", title: "Regina della Colonia", img: null, league: 5, power: 6, damage: 4, ability: "Resa dei conti: Immune" },
    },
  },
  "L'Enclave delle Scaglie": {
    __glyph: "🐉",
    A: {
      code: "E·I", name: "Ascensione del Patriarca", archetype: "CONQUISTA · SNOWBALL",
      flavor: "Ogni terra presa accende un poco di più il Patriarca.",
      keywords: ["Conquista","Snowball","Tech"],
      leader: { name: "Patriarca dell'Enclave", title: "Patriarca dell'Enclave", img: null, league: 5, power: 7, damage: 3, ability: "Invasione: +1 POT, +1 DAN" },
    },
    B: {
      code: "E·II", name: "Il Tesoro Vuole Sangue", archetype: "PRESSIONE · ECONOMIA",
      flavor: "Il tesoro vuole sangue — e paga in Focus chi lo versa.",
      keywords: ["Overdrive","Economia","Tech"],
      leader: { name: "Giallotuono", title: "Giallotuono", img: null, league: 4, power: 5, damage: 4, ability: "Sfida: +3 POT" },
    },
    C: {
      code: "E·III", name: "Il Trono Non Cade", archetype: "SUPREMAZIA · REATTIVA",
      flavor: "Il trono non cade. Chi lo difende, nemmeno.",
      keywords: ["Supremazia","Reattivo","Tech"],
      leader: { name: "Drago Antico Addormentato", title: "Drago Antico Addormentato", img: null, league: 5, power: 6, damage: 4, ability: "Rimonta: Immune" },
    },
  },
  "Ratti della Megera": {
    __glyph: "⚗",
    A: {
      code: "T·I", name: "La Peste che Avanza", archetype: "CONQUISTA · TOSSINA",
      flavor: "La peste avanza: prima il Campo, poi il respiro.",
      keywords: ["Conquista","Debuff","Tech"],
      leader: { name: "Il Quarto Marito", title: "Il Quarto Marito", img: null, league: 5, power: 6, damage: 3, ability: "Magnanimo: Attrizione 1 DAN" },
    },
    B: {
      code: "T·II", name: "Il Morbo che Spegne", archetype: "CONTROLLO · DEBUFF",
      flavor: "Il morbo spegne poteri, bonus, speranze.",
      keywords: ["Controllo","Debuff","Tech"],
      leader: { name: "La Megera Eterna", title: "La Megera Eterna", img: null, league: 5, power: 5, damage: 3, ability: "Blocca Potere" },
    },
    C: {
      code: "T·III", name: "Il Banchetto delle Malelabbra", archetype: "PRESSIONE · COMPOSITIVA",
      flavor: "Al banchetto delle Malelabbra si mangia ciò che resta.",
      keywords: ["Pressione","Tempo","Tech"],
      leader: { name: "Aborto che Cammina", title: "Aborto che Cammina", img: null, league: 4, power: 6, damage: 2, ability: "Opportunista: -2 POT nem. (min 3)" },
    },
  },
  "Patto degli Indocili": {
    __glyph: "◈",
    A: {
      code: "P·I", name: "La Città a Due Livelli", archetype: "MONO · BIPOLARE",
      flavor: "Due livelli, una città: la fascia maggioritaria riceve Rinforzi.",
      keywords: ["Pressione","Tempo","Tech"],
      leader: { name: "Il Multatore del Grande Semaforo", title: "Il Multatore del Grande Semaforo", img: null, league: 4, power: 6, damage: 2, ability: "Opportunista: Blocca Potere" },
    },
    B: {
      code: "P·II", name: "Sciame dell'Ultrastrada", archetype: "IBRIDO · MOUNTHBORN",
      flavor: "L'ultrastrada non ha corsie — solo sciame.",
      keywords: ["Ibrido","Tempo","Tech"],
      leader: { name: "Famelica Bastarda", title: "Famelica Bastarda", img: null, league: 4, power: 4, damage: 4, ability: "Resa dei conti: +1 POT, +1 DAN" },
    },
    C: {
      code: "P·III", name: "Patto col Diavolo", archetype: "IBRIDO · CORTE",
      flavor: "Il diavolo firma. Tu tieni la penna.",
      keywords: ["Controllo","Ibrido","Tech"],
      leader: { name: "Generale Karthessi", title: "Generale Karthessi", img: null, league: 5, power: 5, damage: 4, ability: "Resa dei conti: Copia Potere nem." },
    },
    D: {
      code: "P·IV", name: "Contrabbando delle Corone", archetype: "IBRIDO · ENCLAVE",
      flavor: "Corone di scaglie, contrabbando di Focus.",
      keywords: ["Conquista","Ibrido","Tech"],
      leader: { name: "Piromante della Corte", title: "Piromante della Corte", img: null, league: 4, power: 6, damage: 1, ability: "Conquista: 3 Danni dir." },
    },
    E: {
      code: "P·V", name: "Rivolta della Luna Verde", archetype: "IBRIDO · ORATHAI",
      flavor: "La luna verde non perdona. Guarisce chi resiste.",
      keywords: ["Ibrido","Tempo","Tech"],
      leader: { name: "L'Eco Vivente", title: "L'Eco Vivente", img: null, league: 4, power: 6, damage: 2, ability: "Magnanimo: +2 DAN" },
    },
  },
  "Khemet": {
    __glyph: "𓂀",
    A: {
      code: "X·I", name: "Il Nono Sigillo", archetype: "PICCO · OVERDRIVE",
      flavor: "Il nono sigillo non si apre: si spezza.",
      keywords: ["Overdrive","Tempo","Tech"],
      leader: { name: "Ashigotte, il primo maestro", title: "il primo maestro", img: null, league: 5, power: 6, damage: 3, ability: "Overdrive: Blocca Potere" },
    },
    B: {
      code: "X·II", name: "La Legge dell'Irrazionale", archetype: "CONTROLLO · IRRAZIONALE",
      flavor: "L'irrazionale ha regole. Tu le imponi.",
      keywords: ["Controllo","Tempo","Tech"],
      leader: { name: "Zor-Amun, Naufrago dell'irrazionale", title: "Naufrago dell'irrazionale", img: null, league: 5, power: 7, damage: 2, ability: "Resistenza: Imponi DAN" },
    },
    C: {
      code: "X·III", name: "Il Tributo delle Calamità", archetype: "ECONOMIA · RITUALE",
      flavor: "Le calamità hanno un prezzo. Lo paghi in Focus e PV.",
      keywords: ["Economia","Tempo","Tech"],
      leader: { name: "Maq-Reth, Padrone delle calamità", title: "Padrone delle calamità", img: null, league: 5, power: 5, damage: 4, ability: "Resistenza: +3 FC" },
    },
  },
  "Apex": {
    __glyph: "❄",
    A: {
      code: "Z·I", name: "La Prima Preda", archetype: "CONQUISTA · SNOWBALL",
      flavor: "Prima preda, poi neve — ogni caccia successiva è più pesante.",
      keywords: ["Conquista","Snowball","Tech"],
      leader: { name: "Volontà del Sole Verde", title: "Volontà del Sole Verde", img: null, league: 5, power: 7, damage: 5, ability: "Gloria: Blocca Bonus" },
    },
    B: {
      code: "Z·II", name: "La Loggia Non Arretra", archetype: "CONTROLLO · SUSTAIN",
      flavor: "La Loggia non arretra. Ripara, resiste, riconquista.",
      keywords: ["Conquista","Controllo","Tech"],
      leader: { name: "Terrore Cremisi", title: "Terrore Cremisi", img: null, league: 4, power: 6, damage: 4, ability: "Conquista: -5 PV (a te)" },
    },
    C: {
      code: "Z·III", name: "La Caccia Maggiore", archetype: "PRESSIONE · ADATTIVA",
      flavor: "La caccia maggiore legge il nemico prima di azzannarlo.",
      keywords: ["Pressione","Tempo","Tech"],
      leader: { name: "Bravo, il merita-nome", title: "il merita-nome", img: null, league: 5, power: 6, damage: 4, ability: "Opportunista: +3 FC" },
    },
  },
  "Mascarada": {
    __glyph: "🎭",
    A: {
      code: "M·I", name: "Il Main Event", archetype: "MIDCARD · OPPORTUNISTA",
      flavor: "Dieci maschere L3. Un solo ring. Il pubblico ha già pagato.",
      keywords: ["Opportunista","Imboscata","Tech"],
      leader: { name: "Nobunaga \"Emperor's Order: Guillotine\"", title: "Emperor's Order", img: null, league: 3, power: 3, damage: 3, ability: "Resa dei conti: +9 VA" },
    },
    B: {
      code: "M·II", name: "Curtain Call", archetype: "TITLE · FACE",
      flavor: "Sipario Face: Gloria del cigno e pounce del rinoceronte chiudono lo show.",
      keywords: ["Gloria","Overdrive","Turbo"],
      leader: { name: "Mary \"Swan Punt Kick\"", title: "Swan Punt Kick", img: null, league: 5, power: 5, damage: 3, ability: "Gloria: +12 VA" },
    },
    C: {
      code: "M·III", name: "Heel Turn", archetype: "TITLE · HEEL",
      flavor: "Il pubblico fischia. Ragno e leone riscuotono — Opportunista e Ultimo desiderio.",
      keywords: ["Opportunista","Vendetta","Controllo"],
      leader: { name: "Dandelion \"Kingslayer's Cutter\"", title: "Kingslayer's Cutter", img: null, league: 5, power: 6, damage: 3, ability: "Opportunista: 4 Danni dir." },
    },
  },
};
