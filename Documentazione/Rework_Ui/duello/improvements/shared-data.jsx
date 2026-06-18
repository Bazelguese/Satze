/* Mock dati duello — derivati da Satze/src/data/cards.js + armies.js
 * Carte/portraits disponibili in assets/cards/*.png (101,102,111,201,211,301,311,401,411,501,601)
 * Glifi armate in assets/armies/*.png
 * Campi in assets/battlefields/*.png
 */

const ARMIES = {
  orizzonte: {
    key: 'orizzonte',
    name: "Figli dell'Orizzonte",
    short: "ORIZZONTE",
    color: '#a78bfa',
    colorDark: '#5b21b6',
    glow: 'rgba(167,139,250,0.55)',
    glyph: 'assets/armies/orizzonte.png',
    motif: 'cosmico',
  },
  kethran: {
    key: 'kethran',
    name: 'Kethran',
    short: 'KETHRAN',
    color: '#fbbf24',
    colorDark: '#92400e',
    glow: 'rgba(251,191,36,0.55)',
    glyph: 'assets/armies/kethran.png',
    motif: 'rovine',
  },
  corteRossa: {
    key: 'corteRossa',
    name: 'Corte Rossa',
    short: 'CORTE ROSSA',
    color: '#dc2626',
    colorDark: '#7f1d1d',
    glow: 'rgba(220,38,38,0.55)',
    glyph: 'assets/armies/corte-rossa.png',
    motif: 'patti',
  },
  calibri: {
    key: 'calibri',
    name: 'Calibri Pesanti',
    short: 'CALIBRI',
    color: '#94a3b8',
    colorDark: '#334155',
    glow: 'rgba(148,163,184,0.55)',
    glyph: 'assets/armies/calibri-pesanti.png',
    motif: 'industriale',
  },
  orathai: {
    key: 'orathai',
    name: 'Orathai',
    short: 'ORATHAI',
    color: '#14b8a6',
    colorDark: '#134e4a',
    glow: 'rgba(20,184,166,0.55)',
    glyph: 'assets/armies/orathai.png',
    motif: 'marea',
  },
  enclave: {
    key: 'enclave',
    name: "L'Enclave delle Scaglie",
    short: 'ENCLAVE',
    color: '#ea580c',
    colorDark: '#7c2d12',
    glow: 'rgba(234,88,12,0.55)',
    glyph: 'assets/armies/enclave.png',
    motif: 'draconico',
  },
};

const PLAYER_HAND = [
  {
    id: 'p1', name: "L'Eco del Primo Sole", army: ARMIES.orizzonte,
    league: 5, pot: 5, dan: 6, va: 13,
    portrait: 'assets/cards/111.png',
    abilityTitle: 'Potere', abilityKind: 'Turbo',
    abilityText: '+8 VA',
    bonusTitle: 'Bonus', bonusText: '+2 FC se 2+ Figli',
    flavour: 'Il sole di Vaelith morì nella Fusione. Quando vince, il sistema ricorda la luce.',
    used: false,
  },
  {
    id: 'p2', name: 'Sorethal, il Primo Ancorante', army: ARMIES.orizzonte,
    league: 5, pot: 6, dan: 4, va: 12,
    portrait: 'assets/cards/101.png',
    abilityTitle: 'Potere', abilityKind: '',
    abilityText: '-8 VA nem. (min 6)',
    bonusTitle: 'Bonus', bonusText: '+2 FC se 2+ Figli',
    flavour: 'Si vestì di reliquie del vecchio mondo. Fu il primo a restare intero.',
    used: false,
  },
  {
    id: 'p3', name: 'Tessitrice della Trama', army: ARMIES.orizzonte,
    league: 4, pot: 5, dan: 3, va: 10,
    portrait: 'assets/cards/102.png',
    abilityTitle: 'Potere', abilityKind: 'Sopraffare',
    abilityText: '+2 FC',
    bonusTitle: 'Bonus', bonusText: '+2 FC se 2+ Figli',
    flavour: 'Tiene i fili dell\u2019arazzo del reale.',
    used: false,
  },
  {
    id: 'p4', name: 'Profeta delle Rovine', army: ARMIES.kethran,
    league: 4, pot: 5, dan: 4, va: 11,
    portrait: 'assets/cards/202.png',
    abilityTitle: 'Potere', abilityKind: 'Vendetta',
    abilityText: '+2 DAN',
    bonusTitle: 'Bonus', bonusText: 'Rimonta +1 POT',
    flavour: 'Legge i frammenti delle rovine. Vendetta è la storia preferita.',
    used: false,
  },
  {
    id: 'p5', name: 'L\u2019Estrattrice', army: ARMIES.corteRossa,
    league: 4, pot: 5, dan: 4, va: 11,
    portrait: 'assets/cards/311.png',
    abilityTitle: 'Potere', abilityKind: 'Intervento',
    abilityText: 'Copia Potere',
    bonusTitle: 'Bonus', bonusText: '\u2014',
    flavour: 'Va di persona a riscuotere.',
    used: true,
  },
];

const ENEMY_HAND = [
  { id: 'e1', army: ARMIES.kethran },
  { id: 'e2', army: ARMIES.kethran },
  { id: 'e3', army: ARMIES.corteRossa },
  { id: 'e4', army: ARMIES.calibri },
];

const BATTLEFIELD = {
  name: 'Cimitero di Stelle',
  effect: 'I FC non spesi: -1 VA ciascuno (max -4)',
  icon: '☄',
  bg: 'assets/battlefields/campo-12.png',
  glowColor: 'rgba(56,189,248,0.4)',
  accent: '#38bdf8',
};

const TURN_LOG = [
  { t: 1, tone: 'act', text: '> Turno 1 — Campo "Anomalia Gravitazionale"' },
  { t: 1, tone: 'pos', text: '+2 FC · Bonus Figli dell\u2019Orizzonte' },
  { t: 2, tone: 'neg', text: '-3 PV · Vendetta Profeta' },
  { t: 2, tone: 'act', text: '> Conquisti il campo (1/3)' },
  { t: 3, tone: 'neg', text: 'Sconfitta · -4 PV da Bastione Ambulante' },
  { t: 3, tone: 'pos', text: 'Ultimo Desiderio: 2 Danni dir.' },
  { t: 4, tone: 'act', text: '> Turno 4 — Cimitero di Stelle attivo' },
  { t: 4, tone: '', text: 'In attesa della tua mossa…' },
];

// Per la clash animation, scenario di base: tu giochi Eco del Primo Sole, nemico Profeta delle Rovine. Tu vinci 13 a 11.
const CLASH_SCENARIO = {
  player: PLAYER_HAND[0],
  playerFc: 2,
  enemy: {
    name: 'Profeta delle Rovine',
    army: ARMIES.kethran,
    league: 4, pot: 5, dan: 4, va: 11,
    portrait: 'assets/cards/202.png',
    abilityTitle: 'Potere', abilityKind: 'Vendetta',
    abilityText: '+2 DAN',
    bonusTitle: 'Bonus', bonusText: '\u2014',
    flavour: 'Legge i frammenti. Vendetta è la storia preferita.',
  },
  enemyFc: 1,
  winner: 'player',
  damage: 6,
  field: BATTLEFIELD,
};

Object.assign(window, { ARMIES, PLAYER_HAND, ENEMY_HAND, BATTLEFIELD, TURN_LOG, CLASH_SCENARIO });
