// Token e sagome — portati da `Eminenza - costruttore (standalone).html`.
// Non reinventare clip, inchiostri o gerarchia: testo e SHAPES sono la fonte.

import { REVEAL_GATES } from '../../game/eminence/eminenceConstants.js';
import { OPTION_BLOCKERS } from '../../game/eminence/eminenceChoiceView.js';

export const PRESENCE_COLOR = '#38bdf8';
export const GAIN_TOP = '#3fb37c';
export const GAIN_BOT = '#1c6b48';
export const DEFAULT_SHAPE = 'nastro';
export const DEFAULT_APPEARANCE = 'mano';

export const GATE_UI = {
  [REVEAL_GATES.PRE_FIELD]: { label: 'pre campo', color: '#c05cf0', dark: '#6b2a94' },
  [REVEAL_GATES.PRE_AGENT]: { label: 'pre agente', color: '#f0a23c', dark: '#8a5410' },
  [REVEAL_GATES.GENERAL]: { label: 'generale', color: '#94a3b8', dark: '#5a6472' },
};

export const APPEARANCES = {
  affondo: {
    card: 'emCardSlam .5s cubic-bezier(.15,.9,.2,1) both',
    rail: 'emRailSlam .42s cubic-bezier(.12,.9,.2,1) both',
    step: 0.055,
    base: 0.16,
    originRail: 'right center',
    per: () => ({ '--dx': '380px' }),
  },
  mano: {
    card: 'emCardDeal .52s cubic-bezier(.18,.85,.25,1) both',
    rail: 'emRailFan .46s cubic-bezier(.2,1.25,.3,1) both',
    step: 0.08,
    base: 0.24,
    originRail: 'right center',
  },
  martello: {
    card: 'emCardStamp .58s cubic-bezier(.25,1.3,.35,1) both',
    rail: 'emRailDrop .48s cubic-bezier(.2,1.4,.35,1) both',
    step: 0.09,
    base: 0.3,
    originRail: 'right center',
    ring: true,
  },
  taglio: {
    card: 'emCardSlash .46s cubic-bezier(.3,.9,.2,1) both',
    rail: 'emRailSlash .36s cubic-bezier(.35,.9,.2,1) both',
    step: 0.07,
    base: 0.22,
    originRail: 'right center',
    slash: true,
  },
  ribalta: {
    card: 'emCardFlip .58s cubic-bezier(.2,.9,.25,1) both',
    rail: 'emRailFlip .44s cubic-bezier(.2,1.3,.3,1) both',
    step: 0.085,
    base: 0.26,
    originRail: 'center top',
  },
  sciame: {
    card: 'emCardRise .56s cubic-bezier(.2,.9,.25,1) both',
    rail: 'emRailSwarm .5s cubic-bezier(.16,.9,.24,1) both',
    step: 0.06,
    base: 0.2,
    originRail: 'right center',
    per: (i) => ({
      '--dx': `${i % 2 ? -260 : 340}px`,
      '--dy': `${i === 1 ? 180 : -160}px`,
      '--dr': `${i % 2 ? -14 : 12}deg`,
    }),
  },
};

export const RUNES = [
  'M -3 -3 L 3 -3 L 0 3 Z',
  'M -3 0 L 0 -3 L 3 0 L 0 3 Z',
  'M -3 -3 L 3 3 M -3 3 L 3 -3',
  'M -3 0 L 3 0 M 0 -3 L 0 3',
  'M -3 -2 L 3 -2 M -3 2 L 3 2',
  'M 0 -3 L 3 0 L 0 3 L -3 0 Z',
  'M -3 -3 L 3 -3 M 0 -3 L 0 3',
  'M -3 -3 L -3 3 L 3 0 Z',
  'M -3 -3 L 3 -3 L 3 3 L -3 3 Z M -3 0 L 3 0',
];

export function hexAlpha(color, alpha) {
  const raw = String(color || '#000000').replace('#', '').slice(0, 6);
  return `#${raw}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

export function relativeLuminance(hex) {
  const raw = String(hex || '#000').replace('#', '');
  if (raw.length < 6) return 0;
  const toLin = (c) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  const r = toLin(parseInt(raw.slice(0, 2), 16));
  const g = toLin(parseInt(raw.slice(2, 4), 16));
  const b = toLin(parseInt(raw.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function inkOn(hex) {
  return relativeLuminance(hex) > 0.42 ? '#0a0d12' : '#f7f4ee';
}

export function formatPresenceDelta(delta) {
  if (delta === 0) return '±0';
  return (delta > 0 ? '+' : '−') + Math.abs(delta);
}

export function formatCurve(deltas) {
  return (deltas || []).map(formatPresenceDelta).join(' / ');
}

export function blockerLabel(blocker) {
  if (blocker === OPTION_BLOCKERS.INSUFFICIENT_PRESENCE) return 'Presenza insufficiente';
  if (blocker === OPTION_BLOCKERS.GATE_PASSED) return 'Finestra già chiusa';
  return null;
}

export function sashRuneIndex(i, offset) {
  return (i * 7 + offset) % RUNES.length;
}

function costFill(armyAccent, gain) {
  if (gain) return `linear-gradient(180deg,${GAIN_TOP},${GAIN_BOT})`;
  return `linear-gradient(180deg,${armyAccent},${hexAlpha(armyAccent, 0.74)})`;
}

/** Sei forme del costruttore. Solo variabili: testo e gerarchia non cambiano. */
export const SHAPES = {
  nastro: (ac, _gain, cost) => ({
    '--clip': 'polygon(26px 0,100% 0,calc(100% - 14px) 100%,0 100%)',
    '--skew': '0deg',
    '--unskew': '0deg',
    '--plate': 'linear-gradient(270deg,rgba(14,18,25,.97),rgba(8,10,14,.97))',
    '--backplate': ac,
    '--offx': '9px',
    '--offy': '9px',
    '--barw': '0px',
    '--ink': '#f8fafc',
    '--sub': '#cdd8e6',
    '--costw': '96px',
    '--costbg': cost,
    '--costclip': 'polygon(18px 0,100% 0,calc(100% - 14px) 100%,0 100%)',
  }),
  strappo: (ac, _gain, cost) => ({
    '--clip': 'polygon(0 6%,3% 0,9% 5%,17% 1%,26% 6%,36% 2%,47% 7%,58% 2%,69% 6%,80% 1%,90% 6%,97% 2%,100% 7%,100% 93%,96% 100%,87% 95%,77% 100%,66% 94%,55% 99%,44% 94%,33% 99%,23% 94%,13% 99%,5% 95%,0 99%)',
    '--skew': '0deg',
    '--unskew': '0deg',
    '--plate': 'linear-gradient(180deg,#efe8d9,#ddd3bf)',
    '--grain': 'repeating-linear-gradient(94deg,rgba(120,100,70,.09) 0 2px,transparent 2px 6px)',
    '--grainop': '1',
    '--backplate': 'rgba(0,0,0,.85)',
    '--offx': '6px',
    '--offy': '7px',
    '--ink': '#16110c',
    '--inkshadow': 'none',
    '--sub': '#3b3227',
    '--subshadow': 'none',
    '--costw': '92px',
    '--costbg': cost,
    '--costclip': 'polygon(6% 3%,96% 0,100% 96%,3% 100%)',
    '--costshadowtext': '0 2px 0 rgba(0,0,0,.35)',
  }),
  scheggia: (ac, _gain, cost) => ({
    '--clip': 'polygon(40px 0,100% 0,100% 100%,0 100%)',
    '--skew': '-9deg',
    '--unskew': '9deg',
    '--plate': 'linear-gradient(270deg,rgba(22,28,38,.96),rgba(8,10,14,.97))',
    '--plateshadow': `inset 0 0 0 1px ${hexAlpha(ac, 0.45)}`,
    '--backplate': 'transparent',
    '--offx': '0px',
    '--offy': '0px',
    '--barw': '4px',
    '--bar': ac,
    '--ink': '#f4f8fd',
    '--sub': '#ccd7e6',
    '--costw': '86px',
    '--costbg': 'transparent',
    '--costfont': "'Chakra Petch',sans-serif",
    '--costfs': '34px',
    '--costshadowtext': `0 0 18px ${hexAlpha(ac, 0.75)},0 2px 4px #000`,
    '--costonplate': 'no',
    '--costFillUnused': cost,
  }),
  timbro: (ac, _gain, cost) => ({
    '--clip': 'none',
    '--skew': '-4deg',
    '--unskew': '4deg',
    '--plate': '#0a0b0e',
    '--plateshadow': 'inset 0 0 0 2px #f2f4f7',
    '--backplate': ac,
    '--offx': '10px',
    '--offy': '10px',
    '--ink': '#fbfcfe',
    '--sub': '#b9c4d2',
    '--namefs2': '20px',
    '--costw': '92px',
    '--costbg': cost,
    '--costfont': "'Chakra Petch',sans-serif",
    '--costfs': '36px',
    '--costshadow': 'inset 0 0 0 2px #0a0b0e',
  }),
  manifesto: (ac, _gain, cost) => ({
    '--clip': 'none',
    '--skew': '0deg',
    '--unskew': '0deg',
    '--plate': 'linear-gradient(270deg,#f4f1ea,#e6e1d6)',
    '--grain': 'radial-gradient(circle at 1px 1px,rgba(0,0,0,.16) 1px,transparent 1px)',
    '--grainop': '.5',
    '--backplate': 'transparent',
    '--offx': '0px',
    '--offy': '0px',
    '--ink': '#111417',
    '--inkshadow': 'none',
    '--sub': '#40474f',
    '--subshadow': 'none',
    '--costw': '104px',
    '--costbg': cost,
    '--costclip': 'polygon(22px 0,100% 0,100% 100%,0 100%)',
    '--costfont': "'Chakra Petch',sans-serif",
    '--costfs': '40px',
    '--costshadowtext': '0 3px 0 rgba(0,0,0,.3)',
  }),
  lama: (ac, _gain, cost) => ({
    '--clip': 'polygon(52px 0,100% 0,100% 100%,0 100%,0 50%)',
    '--skew': '0deg',
    '--unskew': '0deg',
    '--plate': 'linear-gradient(270deg,rgba(20,25,33,.95),rgba(9,11,15,.97))',
    '--plateshadow': 'inset 0 0 0 2px rgba(0,0,0,.9)',
    '--backplate': ac,
    '--offx': '-6px',
    '--offy': '0px',
    '--ink': '#f4f8fd',
    '--sub': '#cfd9e6',
    '--costw': '96px',
    '--costbg': cost,
    '--costshadow': 'inset 2px 0 0 rgba(0,0,0,.55)',
  }),
};

export function resolveShape(shapeId, armyAccent, gain) {
  const make = SHAPES[shapeId] || SHAPES[DEFAULT_SHAPE];
  return make(armyAccent, gain, costFill(armyAccent, gain));
}

export function costInk(shape, armyAccent, gain) {
  const base = gain ? GAIN_TOP : armyAccent;
  if (shape['--costonplate'] === 'no') return gain ? '#5ee39f' : armyAccent;
  return inkOn(base);
}

export function costTextShadow(shape, armyAccent, gain) {
  const base = gain ? GAIN_TOP : armyAccent;
  if (shape['--costonplate'] === 'no') return shape['--costshadowtext'];
  if (shape['--costshadowtext']) return shape['--costshadowtext'];
  return relativeLuminance(base) > 0.42
    ? '0 1px 0 rgba(255,255,255,.3)'
    : '0 1px 2px rgba(0,0,0,.55)';
}

export function gateColor(shape, revealGate) {
  const gate = GATE_UI[revealGate] || GATE_UI[REVEAL_GATES.GENERAL];
  return shape['--inkshadow'] === 'none' ? gate.dark : gate.color;
}
