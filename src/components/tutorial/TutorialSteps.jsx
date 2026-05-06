// ============================================
// PASSI DEL TUTORIAL — Percorsi multipli
// ============================================

import { CardReworkP4 } from '../cards';
import { IntroGuidedGameplay, AdvancedGuidedGameplay } from './TutorialGuidedGameplay';

// Carta di esempio
const exampleAgent = {
  id: 101,
  name: "Zarkon, il Mangia Nebule",
  league: 5,
  power: 6,
  damage: 4,
  icon: "🌌",
  army: "Figli dell'Orizzonte",
  ability: { trigger: null, effect: "enemyAssault", value: -8 },
  description: "Potere: -8 VA nem.",
  flavour: "\"Interi sistemi stellari scompaiono quando lui apre la bocca.\""
};

const battlePlayerAgent = {
  id: 104,
  name: "Stella Errante",
  league: 3,
  power: 3,
  damage: 3,
  icon: "💫",
  army: "Figli dell'Orizzonte",
  ability: { trigger: "imboscata", effect: "focusCoin", value: 2 },
  description: "Potere: Imboscata: +2 FC",
  flavour: ""
};

const battleEnemyAgent = {
  id: 205,
  name: "Sacerdote del Caos",
  league: 3,
  power: 3,
  damage: 3,
  icon: "🔥",
  army: "Kethran",
  ability: { trigger: "imboscata", effect: "enemyAssault", value: -4 },
  description: "Potere: Imboscata: -4 VA nem.",
  flavour: ""
};

const BRIEF_TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Benvenuto in SATZE',
    content: (
      <div className="space-y-4">
        <p className="text-lg">
          SATZE è un gioco di carte strategico: scegli <strong>Agenti</strong>, investi <strong>Focus Coin</strong> e conquista i <strong>campi di battaglia</strong>.
        </p>
        <p className="text-slate-400">
          In pochi passi scoprirai come funziona. Puoi saltare in qualsiasi momento.
        </p>
      </div>
    ),
  },
  {
    id: 'essentials',
    title: 'Le Basi',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-[#110b20]/80 rounded-lg p-4 border border-fuchsia-500/25">
            <h4 className="font-bold text-fuchsia-300 mb-1">🎴 Agenti</h4>
            <p className="text-sm text-slate-300">Carte da combattimento con <strong>POT</strong> (Potenza), <strong>DAN</strong> (Danno), <strong>Lega</strong> e un <strong>Potere</strong> speciale.</p>
          </div>
          <div className="bg-[#110b20]/80 rounded-lg p-4 border border-fuchsia-500/25">
            <h4 className="font-bold text-fuchsia-300 mb-1">💰 Focus Coin (FC)</h4>
            <p className="text-sm text-slate-300">Hai <strong>18 FC</strong> per tutta la partita. Li usi per potenziare gli Agenti durante gli scontri.</p>
          </div>
          <div className="bg-[#110b20]/80 rounded-lg p-4 border border-fuchsia-500/25">
            <h4 className="font-bold text-fuchsia-300 mb-1">❤️ Punti Vita (PV)</h4>
            <p className="text-sm text-slate-300">Inizi con <strong>25 PV</strong>. A 0 PV perdi la partita.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'card',
    title: 'La Carta Agente',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-300">
          Ogni Agente ha: <strong className="text-yellow-400">POT</strong> e <strong className="text-purple-400">DAN</strong> in fascia ai lati del nome, <strong className="text-sky-400">Lega</strong> accanto all’armata in basso, <strong className="text-blue-400">Potere</strong> e <strong className="text-green-400">bonus armata</strong> nel pannello testo (trigger: Imboscata, Gloria, Rimonta…).
        </p>
        <div className="flex justify-center py-4">
          <CardReworkP4 agent={exampleAgent} />
        </div>
        <p className="text-xs text-slate-400 text-center">
          Consulta il <strong>Glossario</strong> (📖) in partita per tutti i termini.
        </p>
      </div>
    ),
  },
  {
    id: 'victory',
    title: 'Come Vincere',
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <strong className="text-green-400">Turni 1-4</strong> — Conquista <strong>3 campi</strong>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <strong className="text-yellow-400">Turno 5+</strong> — Chi ha <strong>più PV</strong> vince
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💀</span>
            <div>
              <strong className="text-red-400">Sempre</strong> — Ridurre l'avversario a <strong>0 PV</strong>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'assault',
    title: 'Valore Assalto (VA)',
    content: (
      <div className="space-y-4">
        <p className="text-sm">Chi vince lo scontro? Chi ha <strong>VA</strong> più alto:</p>
        <div className="bg-[#110b20]/80 p-4 rounded-lg border border-fuchsia-500/35 text-center">
          <p className="font-mono text-lg text-fuchsia-200">
            VA = POT × FC + Modificatori
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Esempio: Agente POT 5, investi 3 FC → VA base = 15. I poteri e i bonus armata aggiungono o tolgono modificatori.
        </p>
      </div>
    ),
  },
  {
    id: 'turn',
    title: 'Un Turno in 4 Passi',
    content: (
      <div className="space-y-4">
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><strong>Scegli il campo</strong> — Dove combattere</li>
          <li><strong>Scegli l'Agente</strong> — Trascina una carta dalla mano</li>
          <li><strong>Investi FC</strong> — Più FC = più VA (ma sono limitati!)</li>
          <li><strong>Risultato</strong> — Vince chi ha VA più alto, infligge DAN e conquista il campo</li>
        </ol>
        <p className="text-xs text-slate-400">
          💡 I campi di battaglia hanno effetti speciali: leggi sempre prima di giocare!
        </p>
      </div>
    ),
  },
  {
    id: 'battle',
    title: 'Esempio di Scontro',
    content: (
      <div className="space-y-4">
        <p className="text-sm">Tu: 3 FC → VA = 3×3 = <strong className="text-green-400">9</strong>. IA: 2 FC → VA = 3×2 = <strong className="text-red-400">6</strong>.</p>
        <div className="flex justify-center gap-6 py-4">
          <div className="flex flex-col items-center gap-2">
            <CardReworkP4 agent={battlePlayerAgent} />
            <span className="text-xs text-fuchsia-300">3 FC → VA 9</span>
          </div>
          <span className="text-2xl font-bold text-slate-500 self-center">VS</span>
          <div className="flex flex-col items-center gap-2">
            <CardReworkP4 agent={battleEnemyAgent} />
            <span className="text-xs text-red-400">2 FC → VA 6</span>
          </div>
        </div>
        <p className="text-sm text-green-400 text-center">
          Vinci tu! Infliggi 3 danni e conquisti il campo.
        </p>
      </div>
    ),
  },
  {
    id: 'ready',
    title: 'Pronto!',
    content: (
      <div className="space-y-4 text-center">
        <p className="text-lg">Ora conosci le basi di SATZE.</p>
        <p className="text-sm text-slate-400">
          Gestisci i FC, leggi poteri e trigger, considera gli effetti dei campi. Buona fortuna, Comandante! ⚔️
        </p>
      </div>
    ),
  },
];

const INTRO_TUTORIAL_STEPS = [
  {
    id: 'intro-start',
    title: 'Introduzione: Obiettivo e Ritmo',
    content: (
      <div className="space-y-4">
        <p className="text-lg">
          In questo percorso impari a prendere decisioni solide nei primi round.
        </p>
        <p className="text-slate-400">
          Focus: scelta campo, uso FC, lettura rapida di POT/DAN e trigger.
        </p>
      </div>
    ),
  },
  {
    id: 'intro-flow',
    title: 'Flusso Essenziale del Turno',
    content: (
      <div className="space-y-4">
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><strong>Campo</strong>: valuta effetto e rischio.</li>
          <li><strong>Agente</strong>: scegli la carta con miglior impatto reale.</li>
          <li><strong>FC</strong>: investi solo quanto serve a superare la soglia.</li>
          <li><strong>Esito</strong>: aggiorna subito il piano per il round successivo.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'intro-guided-setup',
    title: 'Gameplay Guidato (Interattivo)',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-300">
          Simulazione guidata: scegli FC, conferma e osserva se la linea e efficiente o overcommit.
        </p>
        <IntroGuidedGameplay />
      </div>
    ),
  },
  {
    id: 'intro-close',
    title: 'Fine Tutorial Introduttivo',
    content: (
      <div className="space-y-4 text-center">
        <p className="text-lg">Ora hai un piano base affidabile.</p>
        <p className="text-sm text-slate-400">
          Prossimo passo: tutorial avanzato per leggere timing, bluff FC e gestione round 5.
        </p>
      </div>
    ),
  },
];

const ADVANCED_TUTORIAL_STEPS = [
  {
    id: 'adv-start',
    title: 'Avanzato: Macro-Decisioni',
    content: (
      <div className="space-y-4">
        <p className="text-lg">
          Qui lavori su trade FC, timing trigger e chiusura partita.
        </p>
        <p className="text-slate-400">
          Focus: giocare per vantaggio cumulativo, non per singolo round spettacolare.
        </p>
      </div>
    ),
  },
  {
    id: 'adv-timing',
    title: 'Timing: Pre vs Post Duello',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-300">
          Trigger <strong>pre-duello</strong> impattano direttamente il VA dello scontro corrente.
        </p>
        <p className="text-sm text-slate-300">
          Trigger <strong>post-duello</strong> (`conquest`, `lastWish`) cambiano risorse/stato per il futuro, non il duello appena chiuso.
        </p>
      </div>
    ),
  },
  {
    id: 'adv-guided-open',
    title: 'Gameplay Guidato (Interattivo)',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-300">
          Esercizio tecnico: prendi due decisioni e ricevi valutazione meccanica immediata.
        </p>
        <AdvancedGuidedGameplay />
      </div>
    ),
  },
  {
    id: 'adv-end',
    title: 'Fine Tutorial Avanzato',
    content: (
      <div className="space-y-4 text-center">
        <p className="text-lg">Hai completato il percorso avanzato.</p>
        <p className="text-sm text-slate-400">
          Applica queste letture in playtest: migliorerai decisioni e bilanciamento delle carte.
        </p>
      </div>
    ),
  },
];

export const TUTORIAL_STEPS_BY_MODE = {
  brief: BRIEF_TUTORIAL_STEPS,
  intro: INTRO_TUTORIAL_STEPS,
  advanced: ADVANCED_TUTORIAL_STEPS,
};

export const TUTORIAL_TRACKS = [
  {
    id: 'brief',
    title: 'Tutorial Breve',
    description: 'Panoramica rapida delle regole base.',
    duration: '3-5 min',
  },
  {
    id: 'intro',
    title: 'Tutorial Introduttivo',
    description: 'Partita reale guidata: fondamentali con mosse validate.',
    duration: '6-8 min',
  },
  {
    id: 'advanced',
    title: 'Tutorial Avanzato',
    description: 'Partita reale guidata: timing e trade FC con validazione.',
    duration: '10-12 min',
  },
];

export const TUTORIAL_STEPS_DEFAULT_MODE = 'brief';
export const TUTORIAL_STEPS = BRIEF_TUTORIAL_STEPS;
