/* ============================================================
   Satze · DIALOGHI — Ratti della Megera (20 carte)
   Sincronizzato con Documentazione/DIALOGHI_RATTI_DELLA_MEGERA.md
   Chiave = card.id (801–820) -> evento -> righe.
   Timing: phase 0 entrata · phase 1 constatazione>trigger preVa ·
           phase ≥2 trigger Opportunista · phase 5 esito (+ postVa in perde)
   ============================================================ */

export const DIALOGHI_RATTI = {

  801: { // La Megera Eterna — Blocca Potere
    entrata: [
      { t: 'Sono il *sale* della terra.', r: 'carattere' },
    ],
    vince: [
      { t: 'Come sempre, per *sempre*.', r: 'carattere' },
    ],
    perde: [
      { t: 'Il mio odio vivrà *oltre* me.', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Pensavi di essere *speciale*, eh?', r: 'carattere' },
    ],
    reattivo: {
      'Ratti della Megera': [
        { t: '*COME OSI VOLTARMI LE SPALLE!*', r: 'constatazione' },
      ],
    },
    statNemico: {
      senzaTossina: [
        { t: 'Sarò la tua prima *volta*.', r: 'constatazione' },
      ],
    },
    lore: [
      { t: 'Non lancia maledizioni. È la maledizione.', r: 'lore', once: true },
    ],
  },

  802: { // Dott. Rancido — Intervento: −10 VA
    entrata: [
      { t: 'So cosa ti *farebbe bene*...', r: 'carattere' },
    ],
    vince: [
      { t: 'Esperimento fallito, *cavia* morta.', r: 'carattere' },
    ],
    perde: [
      { t: 'Sono stato abbandonato, sia dall\'amore che dalla *scienza*.', r: 'carattere' },
    ],
    statNemico: {
      potAlta: [
        { t: 'Tutta quella forza sarà *vana*.', r: 'constatazione' },
      ],
    },
  },

  803: { // Strega del Crepuscolo — Gloria: −3 POT
    entrata: [
      { t: 'Fa\' pure. Goditi il tuo *momento*.', r: 'carattere' },
    ],
    vince: [
      { t: 'Lei ha sussurrato al mio orecchio, non al *tuo*.', r: 'carattere' },
    ],
    perde: [
      { t: 'Il sole sorge ancora. Per *ora*.', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Pensavi che la notte avrebbe portato *consiglio*?', r: 'carattere' },
    ],
    reattivo: {
      Khemet: [
        { t: 'La vostra magia... voglio saperne di *più*.', r: 'constatazione' },
      ],
    },
  },

  804: { // Untore Silenzioso — Opportunista: Tossina (trigger phase ≥2)
    entrata: [
      { t: '...', r: 'carattere' },
    ],
    vince: [
      { t: '...', r: 'carattere' },
    ],
    perde: [
      { t: '...', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Smetterai di parlare anche *tu*.', r: 'carattere' },
    ],
  },

  805: { // Grillo Parlante — Intervento: −3 POT
    entrata: [
      { t: '*Pss*...', r: 'carattere' },
    ],
    vince: [
      { t: 'Ci rivediamo *ancora*.', r: 'carattere' },
    ],
    perde: [
      { t: 'Sogni d\'oro, ci vedremo *lì*.', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Hai mai smesso di credere nel *libero arbitrio*?', r: 'carattere' },
    ],
    statNemico: {
      fragile: [
        { t: 'Che *spreco*.', r: 'constatazione' },
      ],
    },
  },

  806: { // L'Innumerevole — Ultima Chance: Tossina
    entrata: [
      { t: '...', r: 'carattere' },
    ],
    vinceConTrigger: [
      { t: '...E ORA SARÀ TUTTA PER *ME*!', r: 'carattere' },
    ],
    vinceSenzaTrigger: [
      { t: '...n-non me lo *aspettavo*.', r: 'carattere' },
    ],
    perdeConTrigger: [
      { t: '...dovevo stare *zitto*.', r: 'carattere' },
    ],
    perdeSenzaTrigger: [
      { t: '...', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: '...sono rimasto solo *io*...', r: 'carattere' },
    ],
  },

  807: { // Spia della Megera — Imboscata: −6 VA
    entrata: [
      { t: 'Cosa *fai*?', r: 'carattere' },
    ],
    vince: [
      { t: 'Spero abbia goduto nel vederti *fallire*.', r: 'carattere' },
    ],
    perde: [
      { t: 'N-no! Non g-*guardare*!', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: '*Sorpresa*.', r: 'carattere' },
    ],
    statNemico: {
      colosso: [
        { t: 'Pensi di essere *furbo*?', r: 'constatazione' },
      ],
      spinato: [
        { t: 'Pensi di essere *furbo*?', r: 'constatazione' },
      ],
    },
  },

  808: { // Rigattiere Ossuto — Ultimo Desiderio (trigger fuso in perde, phase 5)
    entrata: [
      { t: 'Puoi darmi un *metacarpo*?', r: 'carattere' },
    ],
    vince: [
      { t: 'Il ponte è cedevole *ultimamente*.', r: 'carattere' },
    ],
    perdeConTrigger: [
      { t: 'Te ne *pentirai*!', r: 'carattere' },
    ],
    perdeSenzaTrigger: [
      { t: 'I-il suo ponte... ha bisogno di m-*me*.', r: 'carattere' },
    ],
    statNemico: {
      league5: [
        { t: 'S-se non vuoi fa lo *stesso*.', r: 'constatazione' },
      ],
    },
  },

  809: { // Omuncolo — Resa dei conti: −2 POT
    entrata: [
      { t: 'Guardami *strisciare*.', r: 'carattere' },
    ],
    vince: [
      { t: 'Devo ancora *crescere*.', r: 'carattere' },
    ],
    perde: [
      { t: 'Non so ancora... *volare*.', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Cresco. Tu *no*.', r: 'carattere' },
    ],
    statNemico: {
      potAlta: [
        { t: 'Non ti serve tutta questa *forza*.', r: 'constatazione' },
      ],
    },
  },

  810: { // Ratto Moribondo — Opportunista (trigger phase ≥2)
    entrata: [
      { t: 'Shh, sta *dormendo*.', r: 'carattere' },
    ],
    vince: [
      { t: 'Muori *silenziosamente*.', r: 'carattere' },
    ],
    perde: [
      { t: '*NON LA SVEGLIARE*', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: '*HO DETTO SILENZIOOOOOO*', r: 'carattere' },
    ],
  },

  811: { // Flagello della Colonia — Resa dei conti: −4 POT
    entrata: [
      { t: 'Cosa resta, quando ho preso *tutto*?', r: 'carattere' },
      { t: 'Dove l\'avete *nascosta*?', r: 'carattere' },
    ],
    vince: [
      { t: 'Meglio di una cena a *Candleburg*.', r: 'carattere' },
    ],
    perde: [
      { t: 'Tornerò e farà più *male*.', r: 'carattere' },
      { t: 'La colonia non conta i suoi *ratti*.', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: '*Fame*…', r: 'carattere' },
    ],
    statNemico: {
      potMedia: [
        { t: 'Resisti… sarà più *divertente*.', r: 'constatazione' },
      ],
    },
  },

  812: { // Sciamano dei Miasmi — Imboscata: −3 DAN
    entrata: [
      { t: 'Inspira a pieni polmoni l\'odore dell\'*amore*.', r: 'carattere' },
    ],
    vince: [
      { t: 'Nessuna vittoria è tale senza di *lei*...', r: 'carattere' },
    ],
    perde: [
      { t: 'I miei fiori... i miei funghi... i miei *ricordi*...', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: '...ti ho già riempito i *polmoni*.', r: 'carattere' },
    ],
    statNemico: {
      spinato: [
        { t: '*Minaccioso*...', r: 'constatazione' },
      ],
    },
  },

  813: { // Ser Rathreus — Rimonta: +3 POT
    entrata: [
      { t: 'La mia spada ha sempre *sete*.', r: 'carattere' },
    ],
    vince: [
      { t: 'Un altro sacco di *carne*.', r: 'carattere' },
    ],
    perde: [
      { t: '...', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Più affondo, più mi rialzo. Per *lei*.', r: 'carattere' },
    ],
    statNemico: {
      potAlta: [
        { t: 'Un altro trofeo in *arrivo*.', r: 'constatazione' },
      ],
    },
  },

  814: { // Divoratore di Speranza — Ultimo Desiderio (trigger fuso in perde)
    entrata: [
      { t: 'Uccidimi. Ti *prego*.', r: 'carattere' },
    ],
    vince: [
      { t: 'Non dovevo vincere io. Che *imbarazzo*.', r: 'carattere' },
    ],
    perdeConTrigger: [
      { t: 'Ecco... il mio ultimo respiro. *Tienilo*.', r: 'carattere' },
      { t: 'Mi hai ucciso. Ora sei tu a *portarmi*.', r: 'carattere' },
    ],
    statNemico: {
      potAlta: [
        { t: 'Tanta speranza da *divorare*.', r: 'constatazione' },
      ],
    },
  },

  815: { // Il Gondoliere — Intervento: Blocca Bonus
    entrata: [
      { t: 'Solo una *moneta*, dai.', r: 'carattere' },
    ],
    vince: [
      { t: 'Non sarai solo, non *temere*.', r: 'carattere' },
    ],
    perde: [
      { t: 'No, non puoi *vederla*!', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Quello lascialo *lì*.', r: 'carattere' },
    ],
  },

  816: { // L'Orfano — Intervento: Copia Bonus
    entrata: [
      { t: 'Sei tu la *mamma*?', r: 'carattere' },
      { t: '*Giochiamo*?', r: 'carattere' },
    ],
    vince: [
      { t: 'Adesso mi vuoi *bene*?', r: 'carattere' },
    ],
    perde: [
      { t: '...non te ne *andare*.', r: 'carattere' },
      { t: '*Mamma*?', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Anch\'io voglio essere così. Come *te*.', r: 'carattere' },
    ],
    reattivo: {
      'Ratti della Megera': [
        { t: 'Anche tu aspetti la *mamma*?', r: 'constatazione' },
      ],
    },
  },

  817: { // Aborto che Cammina — Opportunista (trigger phase ≥2)
    entrata: [
      { t: 'Ho freddo. Da *sempre*.', r: 'carattere' },
    ],
    vinceConTrigger: [
      { t: 'Mmmmh... *tiepido*.', r: 'carattere' },
    ],
    vinceSenzaTrigger: [
      { t: 'Ancora freddo. *Perché*?', r: 'carattere' },
    ],
    perde: [
      { t: 'Torno... dov\'ero *prima*.', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Reagite tutti nella stessa *maniera*.', r: 'carattere' },
    ],
    statNemico: {
      potAlta: [
        { t: 'Tu sei caldo, *dentro*?', r: 'constatazione' },
      ],
    },
  },

  818: { // Mangiamore — Vendetta: +2 POT
    entrata: [
      { t: '...tu... non sei come *loro*...', r: 'carattere' },
    ],
    vince: [
      { t: '...infatti non hai il loro *sapore*.', r: 'carattere' },
    ],
    vinceConTrigger: [
      { t: 'IL DOLORE NON È *ABBASTANZA*.', r: 'carattere' },
    ],
    perde: [
      { t: '...infatti non ho *vinto*.', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: '*PERCHÉ È SUCCESSO?*', r: 'carattere' },
    ],
  },

  819: { // Lettrice di Radici — Ultima Chance: −13 VA
    entrata: [
      { t: 'Muori, e ciba il *terreno*.', r: 'carattere' },
    ],
    vince: [
      { t: 'La terra reclama il suo *pasto*...', r: 'carattere' },
    ],
    perde: [
      { t: 'Torno... alla *terra*...', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: 'Assisti al miracolo delle *radici*.', r: 'carattere' },
    ],
  },

  820: { // Yata, lo Scalpo Alato — Turbo: +5 VA
    entrata: [
      { t: 'Dove? *DOVE*?', r: 'carattere' },
    ],
    vince: [
      { t: 'Do-*ve*?', r: 'carattere' },
    ],
    perde: [
      { t: 'Non *qui*...', r: 'carattere' },
    ],
    triggerAttivato: [
      { t: '*DOVE? DOVE?!*', r: 'carattere' },
    ],
    statNemico: {
      turbo: [
        { t: '*PRIMA IO*!', r: 'constatazione' },
      ],
    },
  },

};

/** Carte Opportunista: trigger dialogue in duelPhase ≥ 2. */
export const RATTI_OPPORTUNISTA_CARD_IDS = new Set([804, 810, 817]);

/** Trigger postVa: niente riga trigger autonoma; fuse in perde (phase 5). */
export const RATTI_POST_VA_TRIGGERS = new Set(['lastWish']);

export default DIALOGHI_RATTI;
