// ============================================
// CONTENUTI DEL SERVER DI PLAYTEST
// Testi, canali e tag: modificali qui e rilancia `npm run setup`.
// Lo script aggiorna i canali esistenti invece di duplicarli.
// ============================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { guida } from './guida.mjs';

/**
 * Il manuale del gioco in PDF (lo stesso libretto che si sfoglia dal menu Manuale).
 * Pubblicato come post fissato in cima a #guida. Il limite di Discord per i file dei bot è 10 MiB.
 */
export const MANUALE_PDF = {
  percorso: fileURLToPath(new URL('../../public/manuale/SATZE-Manuale.pdf', import.meta.url)),
  nome: 'SATZE-Manuale.pdf',
  tipo: 'application/pdf',
};

/** Impronta breve del file: se il PDF cambia, cambia il testo del post e lo script ricarica il file. */
function impronta(percorso) {
  if (!existsSync(percorso)) return 'mancante';
  return createHash('sha256').update(readFileSync(percorso)).digest('hex').slice(0, 8);
}

function postManuale() {
  return {
    titolo: '📄 Manuale in PDF',
    fissato: true,
    allegato: MANUALE_PDF,
    messaggi: [
      `# Manuale di istruzioni · PDF
Il libretto del gioco, lo stesso che si sfoglia dal menu **Manuale**: regole, carta Agente, turno e scontro, Campi, trigger ed effetti, Eminenze, le dodici armate, modalità, comandi. Il file è allegato qui sotto.

## Note per il playtest
- **Campagna** 🚧: nel manuale è descritta come modalità giocabile, ma per questo test è **in bozza** e non fa parte del playtest.
- **Eminenze** 🧪: meccanica secondaria **in test e non bilanciata**: valori e testi possono cambiare.
- **Torneo**, **personalità dell'IA** e **multiplayer online** (anche 2v2 e Re della collina): il manuale non li descrive ancora, vedi i post 13, 16 e 17.
- Se il manuale e questa guida non coincidono, **vale la guida**: segnalalo in <#bug> con il tag **regole / effetti**.

-# File: ${MANUALE_PDF.nome} · ${impronta(MANUALE_PDF.percorso)}`,
    ],
  };
}

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

export const RUOLI = {
  dev: { nome: 'Dev Satze', colore: 0xe0457b },
  playtester: { nome: 'Playtester', colore: 0x8b5cf6 },
};

/**
 * Messaggi tecnici nei canali di testo. `cfg` è config.json.
 * I messaggi di presentazione, gli annunci e i link li scrive Davide a mano: lo script non li tocca.
 * Ogni voce di un array è un messaggio Discord separato (massimo 2000 caratteri).
 * `<#nome-canale>` diventa un link cliccabile al canale con quel nome (lo sostituisce lo script).
 */
export function messaggi(cfg) {
  const v = cfg.versione;
  return {
    // Bozza di Claude, da rivedere: è il primo messaggio che vede chi entra nel server.
    ingresso: [
      `# Benvenuto nel playtest di SATZE 🃏
SATZE è un gioco di carte strategico ancora in sviluppo: in questo server lo proviamo insieme prima che sia finito.

**Per entrare nel playtest clicca la reazione 🎮 qui sotto.** Entro qualche secondo ricevi il ruolo **Playtester** e si aprono gli altri canali:
- <#benvenuto> per iniziare;
- <#download> per scaricare il gioco;
- <#guida> per le regole;
- <#bug> e <#idee> per le segnalazioni.

Se togli la reazione, il ruolo viene tolto e i canali si richiudono.`,
    ],
    download: [
      `## Installazione · SATZE Playtest v${v}

**Requisiti**
- Windows 10 o 11, 64 bit
- Connessione a internet: necessaria per il Multiplayer

**File:** \`SATZE-Playtest-Setup-${v}.exe\` (installer, in italiano)

**Installazione**
1. Avvia \`SATZE-Playtest-Setup-${v}.exe\`.
2. Avviso **"Windows ha protetto il PC"** (SmartScreen): l'installer non è firmato digitalmente. **Ulteriori informazioni** → **Esegui comunque**.
3. Scegli la cartella di installazione e conferma. Vengono creati i collegamenti **SATZE Playtest** sul desktop e nel menu Start.
4. Se Google Drive mostra *"impossibile eseguire la scansione antivirus"*: **Scarica comunque** (Drive non analizza i file oltre una certa dimensione).

**Verifica della versione**
In basso a sinistra nel menu principale: \`PLAYTEST · SATZE · LA GRANDE GUERRA · v${v} · BUILD <data>\`. Indica la versione in ogni segnalazione in <#bug>.

**Aggiornamento a una nuova build**
1. Avvia il nuovo installer.
2. Al messaggio *"SATZE Playtest è già installato"* scegli **Sì** (= aggiorna). **No** disinstalla, **Annulla** esce.
3. Mazzi e impostazioni restano: l'aggiornamento svuota solo la cache grafica.

**Dati di gioco**
Al primo avvio il gioco chiede un nome. A fine partita invia automaticamente a Davide i dati della partita: nome, modalità e formato, armate, carte giocate, FC investiti, Campi, esito e durata. Servono per bilanciare il gioco; non vengono raccolti altri dati dal PC.

**Manuale**
Il libretto di istruzioni in PDF è nel post fissato in cima a <#guida>; in gioco si sfoglia dal menu **Manuale**.

**Disinstallazione**
Impostazioni di Windows → App → **SATZE Playtest** → Disinstalla.

**Problemi di installazione o di avvio**
Post in <#bug> con il tag **installazione** o **crash**: versione di Windows, messaggio di errore, screenshot.`,
    ],
  };
}

/** Post dei forum di sola lettura (oggi solo la guida del gioco). */
export function post(cfg) {
  return { guida: [postManuale(), ...guida(cfg)] };
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

    guida: `Regolamento e riferimento tecnico di SATZE v${cfg.versione}, un post per argomento. Sola lettura: domande e dubbi sulle regole vanno in #chiacchiere, errori nella guida in #bug con il tag regole / effetti.`,

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
 *  - 'ingresso'  → tutti leggono, nessuno scrive né aggiunge reazioni nuove (si clicca quella del bot)
 */
export const STRUTTURA = [
  {
    // L'unica categoria visibile a chi entra: la reazione dà il ruolo Playtester
    // (la assegna il bot che gira sul server multiplayer, vedi server/discordRuoli.mjs).
    categoria: '👋 SATZE · INGRESSO',
    accesso: 'ingresso',
    inCima: true,
    canali: [
      { nome: 'inizia-qui', tipo: 'testo', descrizione: 'Clicca 🎮 sotto il messaggio per entrare nel playtest.', messaggi: 'ingresso', reazioneBot: '🎮' },
    ],
  },
  {
    categoria: '📌 SATZE · INFO',
    accesso: 'lettura',
    canali: [
      { nome: 'benvenuto', tipo: 'testo', descrizione: 'Leggi qui prima di tutto: cosa testare e dove scrivere.' },
      { nome: 'annunci', tipo: 'testo', descrizione: 'Nuove build, note di patch e sondaggio.' },
      { nome: 'download', tipo: 'testo', descrizione: 'Installer della build attuale e istruzioni.', messaggi: 'download' },
      { nome: 'guida', tipo: 'forum', lineeGuida: 'guida', post: 'guida', ordinaPerCreazione: true },
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
      // #bilanciamento: tolto da Davide il 2026-11-08 (cancellato a mano).
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
      { nome: 'dati-partite', tipo: 'testo', descrizione: 'Dati di gioco inviati automaticamente dal gioco a fine partita (uno per partita). Solo per Davide.' },
    ],
  },
];
