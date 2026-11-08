// ============================================
// CONTENUTI DEL SERVER DI PLAYTEST
// Testi, canali e tag: modificali qui e rilancia `npm run setup`.
// Lo script aggiorna i canali esistenti invece di duplicarli.
// ============================================

/** Le 12 armate giocabili (da src/data/cards.js → ARMY_SETS). */
export const ARMATE = [
  "Figli dell'Orizzonte",
  'Kethran',
  'Corte Rossa',
  'Calibri Pesanti',
  'Orathai',
  'Mounthborn',
  "L'Enclave delle Scaglie",
  'Ratti della Megera',
  'Patto degli Indocili',
  'Khemet',
  'Apex',
  'Mascarada',
];

/** Discord accetta nomi di tag lunghi al massimo 20 caratteri. */
const TAG_ARMATA = {
  "L'Enclave delle Scaglie": 'Enclave Scaglie',
};

export const RUOLI = {
  dev: { nome: 'Dev Satze', colore: 0xe0457b },
  playtester: { nome: 'Playtester', colore: 0x8b5cf6 },
};

/**
 * Testi dei messaggi. `cfg` è config.json: versione, link al download e al sondaggio.
 * Ogni voce di un array è un messaggio Discord separato (massimo 2000 caratteri).
 * `<#nome-canale>` diventa un link cliccabile al canale con quel nome (lo sostituisce lo script).
 */
export function messaggi(cfg) {
  const v = cfg.versione;
  const download = cfg.linkDownload?.trim()
    ? cfg.linkDownload.trim()
    : '_(link in arrivo: ve lo segnalo appena è caricato)_';
  const sondaggio = cfg.linkSondaggio?.trim()
    ? `📝 **Sondaggio anonimo:** ${cfg.linkSondaggio.trim()}\nCi vogliono 5-10 minuti e non chiede né nome né email: siate sinceri, anche brutalmente. È l'unico posto dove non so chi ha scritto cosa.`
    : `📝 **Sondaggio anonimo:** arriva verso la fine del ciclo di test, ve lo segnalo qui.`;

  return {
    benvenuto: [
      `# Benvenuti nel playtest di SATZE ⚔️

Grazie di essere qui. SATZE è il mio gioco di carte strategico e voi siete i primi a metterci le mani sopra fuori da casa mia. Quello che mi serve è semplice: **giocate come vi viene e ditemi cosa non va**. Bug, regole poco chiare, carte rotte, momenti noiosi, cose che vi sono piaciute: tutto è utile.

## Cosa c'è in questa build (v${v})
- **Partita locale contro l'IA**, in tre modalità:
  - **Duello** 1 contro 1, con tre formati: *Standard* (Eminenze e Campi attivi), *No Eminenza* (solo Campi) e *Mani nude* (niente Eminenze né effetti dei Campi)
  - **2v2** ad abbinamenti segreti
  - **Re della collina**: tutti contro tutti, a 3 o 4 giocatori
- **Multiplayer online** 1 contro 1 (beta): uno crea la stanza e manda il codice di 6 caratteri all'altro
- **Gestione eserciti** per costruirvi i mazzi, **Tutorial** (3 percorsi) e **Galleria** (carte, Eminenze, Campi)
- **12 armate**: ${ARMATE.join(', ')}

⭐ **Le Eminenze sono la novità grossa** e quella su cui mi serve più aiuto. Le trovate nel Duello in formato *Standard* (2v2 e Re della collina si giocano senza). Ditemi se si capisce cosa fanno, se sono divertenti e se qualcuna vi sembra troppo forte o inutile.

🔒 **La Campagna** la vedete nel menu ma **non fa parte di questo test**: è un assaggio di quello che arriverà. Dateci pure un'occhiata, ma non serve segnalarmi niente su quella.`,

      `## Dove scrivere cosa
- <#download>: l'installer e come installarlo
- <#annunci>: nuove build e cosa è cambiato (ve lo segnalo io)
- <#bug>: **un post per ogni bug**, con il modello che trovate lì
- <#bilanciamento>: carte, armate o Eminenze troppo forti o troppo deboli
- <#idee>: suggerimenti e tutto quello che non è un bug
- <#cerco-partita>: per organizzarvi su multiplayer e partite insieme
- <#chiacchiere>: tutto il resto

## 🔢 La versione conta
In basso a sinistra nel menu principale c'è la versione del gioco (ad esempio *v${v} · BUILD …*). **Mettetela in ogni segnalazione**: così so se un bug è già stato sistemato.

## Due regole
1. **L'exe resta nel gruppo**: per favore non giratelo e non pubblicate niente in giro senza chiedermelo.
2. **Siate sinceri.** Un "questa cosa non mi è piaciuta" mi serve più di dieci complimenti. Se qualcosa non vi va di dirlo qui, c'è il sondaggio anonimo.

Buon divertimento! 🃏`,
    ],

    download: [
      `# 📥 Download · SATZE Playtest v${v}

**Installer per Windows (64 bit):** ${download}

## Come installarlo
1. Scaricate **SATZE-Playtest-Setup-${v}.exe** e apritelo.
2. Windows probabilmente mostrerà **"Windows ha protetto il PC"**: è normale, l'exe non è firmato perché è una build di test. Cliccate su **Ulteriori informazioni** e poi su **Esegui comunque**.
3. Scegliete la cartella di installazione e completate. Vi troverete il collegamento **SATZE Playtest** sul desktop.
4. Avviate il gioco e controllate in basso a sinistra nel menu che la versione sia **v${v}**.

## Aggiornamenti
Quando esce una nuova build la trovate qui e in <#annunci>: scaricate il nuovo installer e installatelo sopra il vecchio.

## Problemi?
Se l'installazione non va o il gioco non parte, aprite un post in <#bug> con il tag **crash** e scrivete cosa vedete (uno screenshot aiuta tantissimo). Se il vostro antivirus blocca l'exe, ditemelo.`,
    ],

    annunci: [
      `# 🚀 Playtest 1 · v${v}

Si parte! In questo primo giro il test è **libero**: giocate quello che vi incuriosisce, quanto vi va.

Se non sapete da dove cominciare:
- fate il **Tutorial** e ditemi se dopo vi è chiaro come si gioca
- provate un **Duello Standard** per vedere le **Eminenze** in azione
- provate almeno una partita **2v2** o **Re della collina**
- sfidate qualcuno del gruppo in **Multiplayer** (organizzatevi in <#cerco-partita>)

L'installer e le istruzioni sono in <#download>.`,
      // Messaggio a parte: rilanciando lo script con il link compilato si aggiorna da solo.
      sondaggio,
    ],
  };
}

/** Linee guida dei forum (Discord le mostra in cima al canale; massimo 4096 caratteri). */
export function lineeGuida(cfg) {
  return {
    bug: `Un post per ogni bug, con un titolo breve (es. "Crash quando gioco Eminenza X nel 2v2"). Prima di aprirne uno nuovo date un'occhiata: se il bug c'è già mettete 👍 e aggiungete i vostri dettagli lì.

Copiate questo modello nel post:

**Versione:** (in basso a sinistra nel menu, es. v${cfg.versione})
**Modalità:** Duello / 2v2 / Re della collina / Multiplayer / Tutorial / altro
**Formato:** Standard / No Eminenza / Mani nude
**Armate in gioco:**
**Cosa è successo:**
**Cosa vi aspettavate:**
**Come riprodurlo (se lo sapete):**
**Screenshot o video:**

Scegliete uno o più tag. Il tag ✅ risolto lo metto io quando è sistemato.`,

    bilanciamento: `Qui va tutto quello che vi sembra troppo forte, troppo debole, inutile o frustrante: carte, armate, Eminenze, Campi.

Per aiutarmi davvero scrivete:
- **cosa** (nome della carta, dell'Eminenza o dell'armata)
- **in che partita** (modalità, formato, armate in gioco)
- **perché** vi sembra sbilanciato: cosa è successo in partita, quante volte

Mettete il tag dell'armata (o 🌟 Eminenze) così le discussioni restano in ordine.`,

    idee: `Suggerimenti, desideri, "sarebbe bello se…": tutto quello che non è un bug né un problema di bilanciamento. Un post per idea, così si può commentare e votare con 👍.`,
  };
}

/**
 * Struttura del server. Le categorie hanno il prefisso SATZE per non confondersi
 * con quelle che hai già nel server.
 *
 * accesso:
 *  - 'lettura'   → i playtester leggono e reagiscono, scrivi solo tu
 *  - 'feedback'  → i playtester aprono post e rispondono
 *  - 'libero'    → i playtester scrivono e parlano
 *  - 'privato'   → solo tu
 */
export const STRUTTURA = [
  {
    categoria: '📌 SATZE · INFO',
    accesso: 'lettura',
    canali: [
      { nome: 'benvenuto', tipo: 'testo', descrizione: 'Leggi qui prima di tutto: cosa testare e dove scrivere.', messaggi: 'benvenuto' },
      { nome: 'annunci', tipo: 'testo', descrizione: 'Nuove build, note di patch e sondaggio.', messaggi: 'annunci' },
      { nome: 'download', tipo: 'testo', descrizione: 'Installer della build attuale e istruzioni.', messaggi: 'download' },
    ],
  },
  {
    categoria: '🐞 SATZE · FEEDBACK',
    accesso: 'feedback',
    canali: [
      {
        nome: 'bug',
        tipo: 'forum',
        lineeGuida: 'bug',
        reazione: '👍',
        tag: [
          { nome: 'crash', emoji: '💥' },
          { nome: 'regole / effetti', emoji: '📜' },
          { nome: 'IA', emoji: '🤖' },
          { nome: 'Eminenze', emoji: '🌟' },
          { nome: 'multiplayer', emoji: '🌐' },
          { nome: 'grafica / UI', emoji: '🎨' },
          { nome: 'audio', emoji: '🔊' },
          { nome: 'installazione', emoji: '📥' },
          { nome: 'risolto', emoji: '✅', soloDev: true },
        ],
      },
      {
        nome: 'bilanciamento',
        tipo: 'forum',
        lineeGuida: 'bilanciamento',
        reazione: '👍',
        // Discord permette al massimo 20 tag per forum: 12 armate + 4 = 16.
        tag: [...ARMATE.map((nome) => ({ nome: TAG_ARMATA[nome] ?? nome })), { nome: 'Eminenze', emoji: '🌟' }, { nome: 'Campi', emoji: '🗺️' }, { nome: 'IA', emoji: '🤖' }, { nome: 'regole', emoji: '📜' }],
      },
      {
        nome: 'idee',
        tipo: 'forum',
        lineeGuida: 'idee',
        reazione: '👍',
        tag: [
          { nome: 'gameplay', emoji: '🃏' },
          { nome: 'interfaccia', emoji: '🖱️' },
          { nome: 'modalità', emoji: '🎲' },
          { nome: 'altro', emoji: '💡' },
          { nome: 'in programma', emoji: '📌', soloDev: true },
        ],
      },
    ],
  },
  {
    categoria: '💬 SATZE · COMMUNITY',
    accesso: 'libero',
    canali: [
      { nome: 'chiacchiere', tipo: 'testo', descrizione: 'Tutto il resto.' },
      { nome: 'cerco-partita', tipo: 'testo', descrizione: 'Organizzatevi per il multiplayer: chi crea la stanza manda qui il codice.' },
      { nome: 'Partita 1', tipo: 'vocale' },
      { nome: 'Partita 2', tipo: 'vocale' },
    ],
  },
  {
    categoria: '🔒 SATZE · DEV',
    accesso: 'privato',
    canali: [
      { nome: 'note-dev', tipo: 'testo', descrizione: 'Solo per te: appunti, priorità, cosa sistemare.' },
    ],
  },
];
