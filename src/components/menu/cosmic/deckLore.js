// Lore editabile per la schermata "Scegli l'esercito" (DeckSelectCinematic).
// Chiavi mazzo = ARMY_DECKS[armata] (A, B, C). Gameplay in src/data/.

export const DECK_LORE = {
  "Figli dell'Orizzonte": {
    __glyph: '☄',
    A: {
      code: 'O·I', name: 'Ancora del Primo', archetype: 'CONTROLLO · RITMO',
      flavor: 'Sorethal rifiutò di svanire. Tu rifiuti di affrettare.',
      keywords: ['Controllo', 'VA−', 'Tempo'],
      leader: { name: 'Sorethal, il Primo Ancorante', title: 'Il Primo Ancorante', img: null, league: 5, power: 6, damage: 4, ability: '−8 VA nem. (min 6)' },
    },
    B: {
      code: 'O·II', name: 'Sole in Frantumi', archetype: 'TURBO · MOMENTUM',
      flavor: 'Il sole di Vaelith morì, ma il suo ultimo respiro brucia ancora.',
      keywords: ['Aggro', 'Momentum', 'VA+'],
      leader: { name: "L'Eco del Primo Sole", title: 'Eco del Sole Morto', img: null, league: 5, power: 5, damage: 6, ability: 'Turbo: +8 VA' },
    },
    C: {
      code: 'O·III', name: 'Ultima Orbita', archetype: 'LATE · RIBALTONE',
      flavor: 'Vega regge i primi turni e ribalta nei round finali.',
      keywords: ['Late', 'Ultima Chance', 'Swing'],
      leader: { name: 'Vega, il Sofferente', title: 'Il Sofferente', img: null, league: 5, power: 4, damage: 5, ability: 'Ultima Chance: +4 POT' },
    },
  },
  Kethran: {
    __glyph: '☥',
    A: {
      code: 'K·I', name: 'Ascesa del Conquistatore', archetype: 'AGGRO · MAGNANIMO',
      flavor: '"Un re porta il suo popolo." Ora lo porta letteralmente.',
      keywords: ['Aggro', 'POT+', 'Pressione'],
      leader: { name: 'Ur-Nammu il Conquistatore', title: 'Il Conquistatore', img: null, league: 5, power: 6, damage: 5, ability: 'Magnanimo: +2 POT' },
    },
    B: {
      code: 'K·II', name: 'Corona di Rovina', archetype: 'MID/LATE · VENDETTA',
      flavor: 'Quando cercò vendetta, i Velessi erano già polvere.',
      keywords: ['Comeback', 'DAN+', 'Tenuta'],
      leader: { name: 'Nimrod, il Primo Re', title: 'Il Primo Re', img: null, league: 5, power: 7, damage: 3, ability: 'Resa dei conti: +2 DAN' },
    },
    C: {
      code: 'K·III', name: 'Notte del Crepuscolo', archetype: 'VARIANZA · SPIKE',
      flavor: 'Picchi forti con un costo PV controllato.',
      keywords: ['Burst', 'Rischio', 'Spike'],
      leader: { name: 'Crepuscolo', title: 'La Notte del Crepuscolo', img: null, league: 5, power: 5, damage: 5, ability: 'Overdrive ad alto impatto' },
    },
  },
  'Corte Rossa': {
    __glyph: '🜂',
    A: {
      code: 'R·I', name: 'Debito di Sangue', archetype: 'PRESSIONE · CONQUISTA',
      flavor: '"La scelta, tecnicamente, è tua."',
      keywords: ['Pressione', 'Dir.', 'Negazione'],
      leader: { name: 'Vaelith Sorn, il Primo', title: 'Il Primo', img: null, league: 5, power: 7, damage: 3, ability: 'Conquista: 3 Danni dir.' },
    },
    B: {
      code: 'R·II', name: 'Specchio Infernale', archetype: 'REATTIVO · MIRROR',
      flavor: 'Era il più grande guerriero. Poi firmò.',
      keywords: ['Copia', 'Adattivo', 'Lettura'],
      leader: { name: 'Generale Karthessi', title: 'Generale Firmata', img: null, league: 5, power: 5, damage: 4, ability: 'Resa dei conti: Copia Potere' },
    },
    C: {
      code: 'R·III', name: 'Patto del Silenzio', archetype: 'INVERSION · CONTROL',
      flavor: 'Forte nei matchup pieni di modificatori.',
      keywords: ['Inversion', 'Control', 'Tech'],
      leader: { name: 'Airam', title: 'Patto del Silenzio', img: null, league: 5, power: 5, damage: 5, ability: 'Inversione modificatori' },
    },
  },
  'Calibri Pesanti': {
    __glyph: '⚙',
    A: {
      code: 'C·I', name: 'Muraglia MK-IV', archetype: 'TANK · CONTROL',
      flavor: 'Il quarto modello imparò dagli errori dei primi tre.',
      keywords: ['Tank', 'DAN−', 'Sustain'],
      leader: { name: 'Titano Corazzato MK-IV', title: 'Titano MK-IV', img: null, league: 5, power: 6, damage: 6, ability: 'Riduzione danni' },
    },
    B: {
      code: 'C·II', name: 'Dottrina Cenere', archetype: 'OVERDRIVE · BURST',
      flavor: 'Quando i piani sono cenere — come Kyrath — lui si sveglia.',
      keywords: ['Burst', 'Dir.', 'Spike'],
      leader: { name: 'Protocollo Cenere', title: 'Protocollo Cenere', img: null, league: 5, power: 4, damage: 4, ability: 'Sopraffare: 4 Danni dir.' },
    },
    C: {
      code: 'C·III', name: 'Sala Operatoria', archetype: 'RECOVERY · RIMONTA',
      flavor: 'Curva robusta e sustain in rimonta.',
      keywords: ['Recovery', 'Sustain', 'Mid'],
      leader: { name: 'Il Chirurgo', title: 'Sala Operatoria', img: null, league: 5, power: 5, damage: 4, ability: 'Recupero graduale' },
    },
  },
  Orathai: {
    __glyph: '🌙',
    A: {
      code: 'A·I', name: 'Canto di Gloria', archetype: 'MIDRANGE · PROGRESSIVO',
      flavor: 'La marea torna sempre. È già troppo tardi per scappare.',
      keywords: ['Midrange', 'DAN+', 'Tempo'],
      leader: { name: 'Voce della Fine', title: 'Voce della Fine', img: null, league: 5, power: 5, damage: 5, ability: 'Gloria: +3 DAN' },
    },
    B: {
      code: 'A·II', name: 'Tempesta Armonica', archetype: 'OVERDRIVE · BURST',
      flavor: "L'armonia è solo un'altra forma di onda d'urto.",
      keywords: ['Burst', 'DAN+', 'Spike'],
      leader: { name: 'Tempesta Cava', title: 'La Tempesta Cava', img: null, league: 5, power: 5, damage: 6, ability: 'Overdrive: +4 DAN' },
    },
    C: {
      code: 'A·III', name: 'Rituale del Coro', archetype: 'DEFENSIVO · LATE',
      flavor: 'Il coro non canta per vincere — canta per resistere.',
      keywords: ['Difesa', 'Catena', 'Late'],
      leader: { name: 'Il Coro', title: 'Rituale del Coro', img: null, league: 5, power: 4, damage: 5, ability: 'Catena di cura' },
    },
  },
  Mounthborn: {
    __glyph: '◬',
    A: {
      code: 'M·I', name: 'Fame della Regina', archetype: 'CONTROL · INCREMENTALE',
      flavor: 'Quando guardi altrove, fioriscono. E diventano denti.',
      keywords: ['Apertura', 'Swing', 'POT+'],
      leader: { name: 'Regina della Colonia', title: 'Regina della Colonia', img: null, league: 5, power: 6, damage: 4, ability: 'Imboscata: +1 POT, +1 DAN' },
    },
    B: {
      code: 'M·II', name: 'Predazione Finale', archetype: 'TURBO · AGGRESSIVO',
      flavor: "L'ultima fioritura è anche l'ultima cosa che vedi.",
      keywords: ['Aggro', 'Chiusura', 'Turbo'],
      leader: { name: 'Evoluzione Finale', title: 'Evoluzione Finale', img: null, league: 5, power: 6, damage: 5, ability: 'Turbo: +6 VA' },
    },
    C: {
      code: 'M·III', name: 'Guglia Invertita', archetype: 'TECNICO · ANTI-META',
      flavor: 'Anti-modificatori e pressione da intervento.',
      keywords: ['Tech', 'Intervento', 'Lettura'],
      leader: { name: 'Guardia Reale', title: 'Guglia Invertita', img: null, league: 5, power: 5, damage: 5, ability: 'Soppressione modificatori' },
    },
  },
  "L'Enclave delle Scaglie": {
    __glyph: '🐉',
    A: {
      code: 'E·I', name: 'Giudizio del Patriarca', archetype: 'TEMPO · CONQUISTA',
      flavor: 'Ogni terra conquistata accende un poco di più la brace antica.',
      keywords: ['Snowball', 'FC+', 'Tempo'],
      leader: { name: 'Patriarca delle Scaglie', title: 'Il Patriarca', img: null, league: 5, power: 6, damage: 5, ability: 'Conquista: +2 FC' },
    },
    B: {
      code: 'E·II', name: 'Sonno Antico', archetype: 'RIMONTA · ASSORBI',
      flavor: 'Difendi, assorbi, poi ribalti.',
      keywords: ['Rimonta', 'Difesa', 'Swing'],
      leader: { name: 'Drago Addormentato', title: 'Sonno Antico', img: null, league: 5, power: 5, damage: 5, ability: 'Assorbimento e ribaltone' },
    },
    C: {
      code: 'E·III', name: 'Sottosuolo Tirannico', archetype: 'CONTROL · BURST',
      flavor: 'Forte contro poteri chiave.',
      keywords: ['Control', 'Burst', 'Tech'],
      leader: { name: 'Tiranno del Sottosuolo', title: 'Tiranno', img: null, league: 5, power: 6, damage: 4, ability: 'Soppressione poteri' },
    },
  },
  'Ratti della Megera': {
    __glyph: '⚗',
    A: {
      code: 'T·I', name: 'Maledizione Eterna', archetype: 'CONTROL · LOGORAMENTO',
      flavor: 'Blocca e logora turno dopo turno.',
      keywords: ['Control', 'Tossina', 'Lungo'],
      leader: { name: 'Megera Eterna', title: 'La Megera Eterna', img: null, league: 5, power: 5, damage: 4, ability: 'Logoramento continuo' },
    },
    B: {
      code: 'T·II', name: 'Trono del Flagello', archetype: 'DEBUFF · PRESSIONE',
      flavor: 'Forte pressione debuff sulle stat nemiche.',
      keywords: ['Debuff', 'Stat−', 'Pressione'],
      leader: { name: 'Flagello della Colonia', title: 'Il Flagello', img: null, league: 5, power: 5, damage: 4, ability: 'Anti-stat nemiche' },
    },
    C: {
      code: 'T·III', name: "Figlio dell'Odio", archetype: 'TRICK · CAOS',
      flavor: 'Copia bonus e sfrutta caos di matchup.',
      keywords: ['Trick', 'Copia', 'Caos'],
      leader: { name: "L'Orfano", title: "Figlio dell'Odio", img: null, league: 5, power: 4, damage: 5, ability: 'Copia bonus avversario' },
    },
  },
  'Patto degli Indocili': {
    __glyph: '◈',
    A: {
      code: 'P·I', name: 'Linea Rossa', archetype: 'TECNICO · PRESSIONE',
      flavor: 'Massima pressione tecnica mantenendo Lega 30.',
      keywords: ['Tech', 'Mono-armata', 'Efficienza'],
      leader: { name: 'Voce degli Indocili', title: 'La Voce', img: null, league: 4, power: 5, damage: 4, ability: 'Rinforzi: −1 POT, −1 DAN nem.' },
    },
    B: {
      code: 'P·II', name: 'Protocollo Intersezione', archetype: 'REATTIVO · IBRIDO',
      flavor: 'Shell reattiva con altissima qualità di intervento.',
      keywords: ['Ibrido', 'Intervento', 'Reattivo'],
      leader: { name: 'Archivista Ribelle', title: "L'Archivista", img: null, league: 3, power: 4, damage: 5, ability: 'Intersezione Corte Rossa' },
    },
    C: {
      code: 'P·III', name: "Patto d'Acciaio", archetype: 'IBRIDO · TEMPO',
      flavor: 'Nucleo Indocili e supporto Mounthborn per chiusure mirate.',
      keywords: ['Ibrido', 'Tempo', 'Chiusura'],
      leader: { name: 'Custode del Patto', title: "Patto d'Acciaio", img: null, league: 4, power: 5, damage: 4, ability: 'Supporto Mounthborn' },
    },
  },
  Khemet: {
    __glyph: '𓂀',
    A: {
      code: 'X·I', name: 'Cerchio di Rottura', archetype: 'SPIKE · OVERDRIVE',
      flavor: 'Quando i riti si attivano, nulla nel deserto può fermarli.',
      keywords: ['Spike', 'Immune', 'Burst'],
      leader: { name: "Sacerdote dell'Occhio", title: "L'Occhio", img: null, league: 5, power: 6, damage: 5, ability: 'Overdrive: Immune' },
    },
    B: {
      code: 'X·II', name: "Gabbia dell'Intervento", archetype: 'CONTROL · REATTIVO',
      flavor: 'Riduce il picco nemico e converte i turni complessi.',
      keywords: ['Control', 'Reattivo', 'Intervento'],
      leader: { name: 'Custode delle Sabbie', title: 'Custode', img: null, league: 5, power: 5, damage: 4, ability: 'Overdrive prolungato' },
    },
    C: {
      code: 'X·III', name: 'Trono delle Calamità', archetype: 'RITUALE · ECONOMIA',
      flavor: 'Doppio L5, economia rituale e pacing disciplinato.',
      keywords: ['Rituale', 'Economia', 'Late'],
      leader: { name: 'Sovrano delle Calamità', title: 'Trono delle Calamità', img: null, league: 5, power: 6, damage: 5, ability: 'Economia rituale' },
    },
  },
};
