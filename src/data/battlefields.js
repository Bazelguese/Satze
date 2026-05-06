// ============================================
// CAMPI DI BATTAGLIA
// ============================================

// Stili visivi per i campi di battaglia (gradienti/glow per particelle e UI)
export const FIELD_STYLES = {
    values: { gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%)', glow: 'rgba(100, 150, 255, 0.4)', icon: 'sword' },
    limit: { gradient: 'linear-gradient(135deg, #2d1a0d 0%, #4a2a1a 100%)', glow: 'rgba(200, 100, 50, 0.4)', icon: 'block' },
    conditional: { gradient: 'linear-gradient(135deg, #1a2e1a 0%, #2a4a2a 100%)', glow: 'rgba(50, 200, 100, 0.4)', icon: 'target' },
    focus: { gradient: 'linear-gradient(135deg, #2e1a2e 0%, #4a2a4a 100%)', glow: 'rgba(200, 50, 200, 0.4)', icon: 'coin' },
    trigger: { gradient: 'linear-gradient(135deg, #2e2e1a 0%, #4a4a2a 100%)', glow: 'rgba(200, 200, 50, 0.4)', icon: 'lightning' },
    neutral: { gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', glow: 'rgba(150, 150, 150, 0.3)', icon: 'circle' }
  };
  
  // Helper per ottenere lo stile di un campo
  export const getFieldStyle = (category) => {
    return FIELD_STYLES[category] || FIELD_STYLES.values;
  };
  
  // Tutti i campi di battaglia
  // NOTA: Copia qui TUTTI i campi dalla sezione ALL_BATTLEFIELDS del file originale
  // (dalla riga 490 alla riga ~990)
  export const ALL_BATTLEFIELDS = [
    { id: 1, name: "Gran Corno", icon: "wave", effect: "+4 POT a entrambi", category: "values", minTurn: 1, flavour: "Le corna dei giganti caduti si ergono come torri. Chi combatte alla loro ombra sente la loro antica rabbia scorrere nelle vene.", bgImage: './campi_bg/campo-1.png' },
    { id: 2, name: "Terza Luna", icon: "moon", effect: "-1 POT, +1 DAN a entrambi", category: "values", minTurn: 1, flavour: "Quando la terza luna sorge, il velo tra i mondi si assottiglia. La forza svanisce, ma la ferocia cresce.", bgImage: './campi_bg/campo-2.png' },
    { id: 3, name: "Arena degli Gnomi", icon: "sparkle", effect: "Poteri annullati", category: "limit", minTurn: 1, flavour: "\"Qui combattiamo alla vecchia maniera\", dicono gli gnomi. \"Niente trucchi. Solo ferro e sangue.\" — Regolamento dell'Arena, Articolo 1", bgImage: './campi_bg/campo-3.png' },
    { id: 4, name: "Miniera di Lacrime", icon: "crystal", effect: "Vincitore: +2 PV", category: "conditional", minTurn: 2, flavour: "Le lacrime dei prigionieri si sono cristallizzate in gemme curative. Ogni vittoria qui ha un sapore amaro, ma rinvigorisce il corpo.", bgImage: './campi_bg/campo-4.png' },
    { id: 5, name: "Nido dell'Antico", icon: "egg", effect: "-2 DAN a entrambi", category: "values", minTurn: 1, flavour: "Qualcosa dorme nelle profondità. Il suo respiro antico smorza ogni violenza, come se pregasse silenziosamente per la pace.", bgImage: './campi_bg/campo-5.png' },
    { id: 6, name: "Tempio del Monaco Pazzo", icon: "temple", effect: "Bonus annullati", category: "limit", minTurn: 1, flavour: "Il monaco rise per settanta giorni prima di morire. Le sue ultime parole: \"L'unico vero potere è non averne nessuno.\"", bgImage: './campi_bg/campo-6.png' },
    { id: 7, name: "Dimensione Specchiata", icon: "mirror", effect: "POT scambiate tra i giocatori", category: "values", minTurn: 1, flavour: "\"Ho guardato il mio riflesso e lui ha guardato me. Quando mi sono girato, ero io il riflesso.\" — Ultimo diario di Sir Aldric", bgImage: './campi_bg/campo-7.png' },
    { id: 8, name: "Cripta dei Sussurri", icon: "ghost", effect: "Perdente: +1 FC", category: "conditional", minTurn: 1, flavour: "I morti qui non riposano. Sussurrano segreti ai vivi, ma solo a quelli abbastanza umili da ascoltare dopo una sconfitta.", bgImage: './campi_bg/campo-8.png' },
    { id: 9, name: "Porte di Atlantide", icon: "wave", effect: "FC raddoppiati nel calcolo VA", category: "focus", minTurn: 1, flavour: "L'acqua che scorre tra le rovine amplifica ogni pensiero, ogni intenzione. Qui, concentrarsi significa dominare.", bgImage: './campi_bg/campo-9.png' },
    { id: 10, name: "Nido di Spine", icon: "tower", effect: "Vincitore: -5 PV", category: "conditional", minTurn: 1, flavour: "Le spine non distinguono amici da nemici. Vincere qui significa sanguinare. Perdere significa morire.", bgImage: './campi_bg/campo-10.png' },
    { id: 11, name: "Canyon delle Lame", icon: "sword", effect: "Vincitore: +2 DAN extra", category: "conditional", minTurn: 1, flavour: "Il vento ha affilato le rocce per millenni. Ora affilano chi le attraversa. Chi vince qui, vince con violenza.", bgImage: './campi_bg/campo-11.png' },
    { id: 12, name: "Torre d'Avorio", icon: "castle", effect: "Vincitore: +1 FC", category: "conditional", minTurn: 1, flavour: "Gli studiosi che la abitavano sono morti da tempo. Ma la loro conoscenza permea le mura, premiando chi dimostra di meritarla.", bgImage: './campi_bg/campo-12.png' },
    { id: 13, name: "Fossa dei Leoni", icon: "wolf", effect: "+2 DAN a entrambi", category: "values", minTurn: 1, flavour: "I leoni sono morti secoli fa. Ma la loro ferocia è rimasta impressa nelle pietre, e contagia chiunque osi combattere qui.", bgImage: './campi_bg/campo-13.png' },
    { id: 14, name: "Santuario del Silenzio", icon: "block", effect: "Poteri e Bonus annullati", category: "limit", minTurn: 1, flavour: "Nessun suono. Nessuna magia. Nessun vantaggio. Solo due anime nude che si fronteggiano nel vuoto assoluto.", bgImage: './campi_bg/campo-14.png' },
    { id: 15, name: "Nexus Arcano", icon: "copy", effect: "DAN massimo = 4", category: "limit", minTurn: 1, flavour: "L'energia qui fluisce in onde che smorzano la violenza. Nessun colpo può essere veramente devastante.", bgImage: './campi_bg/campo-15.png' },
    { id: 16, name: "Voragine Infinita", icon: "hole", effect: "Entrambi: -3 PV dopo lo scontro", category: "conditional", minTurn: 2, flavour: "Nessuno sa cosa ci sia sul fondo. Chi ci combatte sente il vuoto tirare, tirare, tirare verso il basso.", bgImage: './campi_bg/campo-16.png' },
    { id: 17, name: "Altare del Sacrificio", icon: "temple", effect: "Perdente: 2 Danni dir. extra", category: "conditional", minTurn: 1, flavour: "\"Il sangue del debole nutre il forte\", recita l'iscrizione. Generazioni di perdenti hanno scoperto cosa significa davvero.", bgImage: './campi_bg/campo-17.png' },
    { id: 18, name: "Biblioteca Proibita", icon: "book", effect: "Chi ha meno FC: +5 VA", category: "values", minTurn: 1, flavour: "I libri qui scelgono chi leggerli. Preferiscono menti fresche, non contaminate da troppo sapere.", bgImage: './campi_bg/campo-18.png' },
    // === NUOVI CAMPI - COSMICO (Figli dell'Orizzonte) ===
    { id: 19, name: "Nebulosa dei Ricordi", icon: "galaxy", effect: "+1 POT a entrambi", category: "values", minTurn: 1, flavour: "Qui i pensieri prendono forma. E le forme, a volte, combattono al posto tuo.", bgImage: './campi_bg/campo-19.png' },
    { id: 20, name: "Orlo del Buco Nero", icon: "circle", effect: "POT e DAN invertiti per entrambi", category: "values", minTurn: 1, flavour: "Il tempo si piega. Lo spazio si contorce. Ciò che era forte diventa fragile, e viceversa.", bgImage: './campi_bg/campo-20.png' },
    { id: 21, name: "Cimitero di Stelle", icon: "sparkle", effect: "-2 VA a entrambi", category: "values", minTurn: 1, flavour: "Migliaia di soli morti illuminano ancora questo luogo. La loro luce è un monito: anche gli dei cadono.", bgImage: './campi_bg/campo-21.png' },
    { id: 35, name: "Eclissi Totale", icon: "moon", effect: "-2 POT e -2 DAN a entrambi", category: "values", minTurn: 1, flavour: "Quando la luce muore, tutto si affievolisce. La forza svanisce, la ferocia si spegne. Solo le ombre restano.", bgImage: './campi_bg/campo-35.png' },
    { id: 36, name: "Anomalia Gravitazionale", icon: "vortex", effect: "FC investiti max 3", category: "limit", minTurn: 1, flavour: "Lo spazio qui è compresso. Ogni sforzo oltre il limite viene semplicemente... annullato.", bgImage: './campi_bg/campo-36.png' },
    { id: 37, name: "Corona Solare", icon: "star", effect: "Vincitore: +1 PV", category: "conditional", minTurn: 2, flavour: "Il sole incorona i suoi campioni con un tocco di vita. La luce più pura premia chi la merita.", bgImage: './campi_bg/campo-37.png' },
    // === NUOVI CAMPI - ROVINE (Kethran) ===
    { id: 22, name: "Fondamenta della Torre", icon: "brick", effect: "Gloria e Vendetta sempre attivi", category: "trigger", minTurn: 2, flavour: "Qui iniziò tutto. Qui la superbia degli uomini sfidò il cielo. Le pietre ricordano ancora.", bgImage: './campi_bg/campo-22.png' },
    { id: 23, name: "Ziqqurat Spezzata", icon: "temple", effect: "Perdente: +1 FC", category: "conditional", minTurn: 1, flavour: "Ogni gradino è una promessa infranta. Chi cade qui impara che la discesa può essere una risorsa.", bgImage: './campi_bg/campo-23.png' },
    { id: 24, name: "Biblioteca delle Lingue Perdute", icon: "scroll", effect: "Blocca Potere/Bonus non funzionano", category: "limit", minTurn: 1, flavour: "Le parole qui non possono essere silenziate. Ogni voce trova la sua eco, ogni potere il suo compimento.", bgImage: './campi_bg/campo-24.png' },
    { id: 38, name: "Trono dei Re Caduti", icon: "crown", effect: "Vincitore: 1 Danni dir. a sé", category: "conditional", minTurn: 1, flavour: "Ogni re che ha seduto qui è morto. La corona pesa, e il trono esige il suo tributo di sangue.", bgImage: './campi_bg/campo-38.png' },
    { id: 39, name: "Mura della Sfida", icon: "brick", effect: "Rimonta sempre attiva per entrambi", category: "trigger", minTurn: 2, flavour: "Queste mura hanno visto mille assedi. Chi combatte qui sente l'eco di ogni disperata resistenza.", bgImage: './campi_bg/campo-39.png' },
    // === NUOVI CAMPI - INFERNALE (Corte Rossa) ===
    { id: 25, name: "Sala dei Contratti", icon: "imp", effect: "Vincitore: -2 FC", category: "conditional", minTurn: 1, flavour: "Ogni vittoria ha un prezzo. Qui il prezzo è scritto in anticipo, e non c'è modo di negoziare.", bgImage: './campi_bg/campo-25.png' },
    { id: 26, name: "Trono di Cenere", icon: "flame", effect: "+1 DAN a entrambi", category: "values", minTurn: 1, flavour: "Un tempo sedeva qui un principe. Ora siede solo il ricordo della sua caduta, che brucia ancora.", bgImage: './campi_bg/campo-26.png' },
    { id: 27, name: "Fossa dei Traditori", icon: "hole", effect: "Effetti Copia annullati", category: "limit", minTurn: 1, flavour: "Qui l'imitazione è impossibile. Le ombre rifiutano di riflettere, e ogni anima resta tragicamente sola.", bgImage: './campi_bg/campo-27.png' },
    { id: 40, name: "Tribunale dell'Anima", icon: "scales", effect: "Perdente: -1 FC", category: "conditional", minTurn: 1, flavour: "\"Colpevole\", sentenzia il giudice. La pena è lieve, ma certa. Ogni sconfitta qui costa qualcosa.", bgImage: './campi_bg/campo-40.png' },
    { id: 41, name: "Crocevia dei Patti", icon: "vortex", effect: "Poteri si attivano senza trigger", category: "trigger", minTurn: 1, flavour: "Ogni strada porta a un accordo. Ogni accordo porta potere. Qui, le condizioni sono solo formalità.", bgImage: './campi_bg/campo-41.png' },
    { id: 42, name: "Mercato delle Anime", icon: "skull", effect: "-3 POT a entrambi (min 1)", category: "values", minTurn: 1, flavour: "Il prezzo qui è la forza stessa. Tutti pagano, nessuno è esente. Solo i più deboli non hanno nulla da perdere.", bgImage: './campi_bg/campo-42.png' },
    // === NUOVI CAMPI - MECCANICO (Calibri Pesanti) ===
    { id: 28, name: "Mura EMP", icon: "lightning", effect: "Immune non funziona", category: "limit", minTurn: 1, flavour: "I protocolli di protezione qui sono stati disattivati da tempo. Nessuno è al sicuro.", bgImage: './campi_bg/campo-28.png' },
    { id: 29, name: "Nucleo del Reattore", icon: "warning", effect: "Overdrive si attiva con 4 FC", category: "trigger", minTurn: 1, flavour: "L'energia qui è instabile, amplificata. Basta meno per raggiungere il limite.", bgImage: './campi_bg/campo-29.png' },
    { id: 30, name: "Deposito di Rottami", icon: "copy", effect: "Perdente: +1 FC", category: "conditional", minTurn: 2, flavour: "Ciò che viene scartato qui trova nuova vita. La sconfitta è solo un'altra forma di riciclaggio.", bgImage: './campi_bg/campo-30.png' },
    { id: 43, name: "Firewall Centrale", icon: "insect", effect: "DAN diretti annullati", category: "limit", minTurn: 1, flavour: "Nessun attacco può bypassare le difese qui. Ogni danno deve passare attraverso i canali ufficiali.", bgImage: './campi_bg/campo-43.png' },
    { id: 44, name: "Centrale Energetica", icon: "lightning", effect: "Overdrive: +1 DAN extra", category: "conditional", minTurn: 1, flavour: "I reattori ronzano con potenza infinita. Chi sa sfruttarla colpisce più forte.", bgImage: './campi_bg/campo-44.png' },
    // === NUOVI CAMPI - ARCANO (Orathai) ===
    { id: 31, name: "Convergenza delle Ley", icon: "sparkle", effect: "Magnanimo si attiva sempre per entrambi", category: "trigger", minTurn: 1, flavour: "Le linee di potere si incontrano qui. Chi è in vantaggio sente il peso del destino, chi è in svantaggio ne trae forza.", bgImage: './campi_bg/campo-31.png' },
    { id: 32, name: "Specchio dell'Anima", icon: "mirror", effect: "Annulla modificatori POT e DAN", category: "limit", minTurn: 1, flavour: "Guardarsi allo specchio qui significa vedere ciò che sei veramente. Nulla di più, nulla di meno.", bgImage: './campi_bg/campo-32.png' },
    { id: 45, name: "Cerchio di Evocazione", icon: "star", effect: "Intervento sempre attivo per entrambi", category: "trigger", minTurn: 1, flavour: "Il cerchio chiama chi risponde. Non importa chi è arrivato per primo: qui, tutti intervengono.", bgImage: './campi_bg/campo-45.png' },
    { id: 46, name: "Fonte del Mana", icon: "wave", effect: "+1 FC a entrambi dopo lo scontro", category: "conditional", minTurn: 2, flavour: "L'acqua qui scorre dal cuore del mondo. Chi beve, anche nella sconfitta, trova nuova energia.", bgImage: './campi_bg/campo-46.png' },
    { id: 47, name: "Sanctum dell'Equilibrio", icon: "scales", effect: "-5 VA a Lega più alta", category: "values", minTurn: 1, flavour: "La bilancia qui pesa il prestigio. Chi porta più peso viene trascinato verso il basso.", bgImage: './campi_bg/campo-47.png' },
    // === NUOVI CAMPI - ORGANICO (Mounthborn) ===
    { id: 33, name: "Nido della Regina", icon: "insect", effect: "DAN diretti: +1 danno", category: "values", minTurn: 1, flavour: "L'aria è densa di feromoni. Ogni ferita qui attira lo sciame, e lo sciame non perdona.", bgImage: './campi_bg/campo-33.png' },
    { id: 34, name: "Pianura Divorata", icon: "circle", effect: "Cura 1 PV a entrambi dopo lo scontro", category: "conditional", minTurn: 2, flavour: "Un tempo qui cresceva qualcosa. Ora cresce solo il silenzio, che stranamente guarisce.", bgImage: './campi_bg/campo-34.png' },
    { id: 48, name: "Palude Tossica", icon: "insect", effect: "Entrambi: -1 PV dopo lo scontro", category: "conditional", minTurn: 2, flavour: "L'aria è veleno. L'acqua è veleno. Anche vincere qui significa perdere qualcosa.", bgImage: './campi_bg/campo-48.png' },
    { id: 49, name: "Alveare Abbandonato", icon: "circle", effect: "Imboscata sempre attiva per entrambi", category: "trigger", minTurn: 1, flavour: "Le celle vuote ricordano ancora il ronzio. Chi arriva per primo sente quell'eco trasformarsi in forza.", bgImage: './campi_bg/campo-49.png' },
    { id: 50, name: "Terreno di Caccia", icon: "bone", effect: "+2 DAN a entrambi", category: "values", minTurn: 1, flavour: "La preda qui diventa predatore, e il predatore diventa preda. Tutti mordono più forte.", bgImage: './campi_bg/campo-50.png' },
    // CAMPI NEUTRI (solo per modalità Bare Hands)
    { id: 51, name: "Passo delle Termopili", icon: "sword", effect: "Nessuno", category: "neutral", minTurn: 1, flavour: "Trecento contro un milione. Qui i pochi hanno dimostrato che il numero non è tutto.", bgImage: './campi_bg/campo-51.png' },
    { id: 52, name: "Campi Catalaunici", icon: "dove", effect: "Nessuno", category: "neutral", minTurn: 1, flavour: "Dove Attila fu fermato. Dove il destino del mondo fu deciso.", bgImage: './campi_bg/campo-52.png' },
    { id: 53, name: "Fortezza di Masada", icon: "castle", effect: "Nessuno", category: "neutral", minTurn: 1, flavour: "Meglio morire in piedi che vivere in ginocchio. L'ultima resistenza.", bgImage: './campi_bg/campo-53.png' },
    { id: 54, name: "Ponte di Stamford", icon: "tower", effect: "Nessuno", category: "neutral", minTurn: 1, flavour: "Un solo uomo tenne il ponte contro un esercito. Il suo nome è leggenda.", bgImage: './campi_bg/campo-54.png' },
    { id: 55, name: "Rovine di Cartagine", icon: "flame", effect: "Nessuno", category: "neutral", minTurn: 1, flavour: "Delenda est Carthago. Le rovine ricordano ancora il fuoco.", bgImage: './campi_bg/campo-55.png' }
  ];

  // Tema entrata per animazione immagine campo (per armata/tema)
  export const BATTLEFIELD_ENTRANCE_THEMES = {
    // Kethran - Rovine: frammentato
    kethran: [22, 23, 24, 38, 39],
    // Figli dell'Orizzonte - Cosmico: swirl
    figliOrizzonte: [19, 20, 21, 35, 36, 37],
    // Corte Rossa - Inferno: fiamme
    corteRossa: [25, 26, 27, 40, 41, 42],
    // Calibri Pesanti - Meccanico: scan
    calibri: [28, 29, 30, 43, 44],
    // Orathai - Arcano: magia
    orathai: [31, 32, 45, 46, 47],
    // Mounthborn - Organico: crescita
    natiBocca: [33, 34, 48, 49, 50]
  };

  /** Mappa tema armata -> tipo animazione (da satze-animations-v5) */
  const THEME_TO_ANIMATION = {
    kethran: 'frammenti',
    figliOrizzonte: 'swirl',
    corteRossa: 'sipario',
    calibri: 'hud',
    orathai: 'onda',
    natiBocca: 'morsi',
  };

  export const getBattlefieldEntranceTheme = (fieldId) => {
    for (const [theme, ids] of Object.entries(BATTLEFIELD_ENTRANCE_THEMES)) {
      if (ids.includes(fieldId)) return theme;
    }
    return 'default';
  };

  /** Restituisce il tipo animazione per la galleria: swirl, frammenti, sipario, hud, onda, morsi, o 'default' */
  export const getBattlefieldAnimationType = (fieldId) => {
    const theme = getBattlefieldEntranceTheme(fieldId);
    return theme === 'default' ? 'default' : (THEME_TO_ANIMATION[theme] || 'default');
  };