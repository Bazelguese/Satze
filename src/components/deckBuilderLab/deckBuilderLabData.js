// Dati reali per Deck Builder Lab — allineati a ARMY_SETS, cardTags, deck builder ufficiale
import { ARMY_SETS } from '../../data';
import { ARMY_COLORS, ARMY_BONUSES } from '../../data/armies';
import { LEAGUE_TIER_COLORS as LEAGUE_COLORS } from '../../data/leagueColors';
import { TRIGGER_NAMES } from '../../data/triggers';
import { getCardTags, RUOLO_TAGS, TAG_TOOLTIPS } from '../../data/cardTags';
import { ARMY_ICONS } from '../../data/icons.jsx';

export const DECK_SIZE = 10;
export const MAX_LEAGUE = 30;

export const TRIGGER_COLORS = {
  Sempre: '#94a3b8',
  Imboscata: '#f97316',
  Turbo: '#38bdf8',
  Intervento: '#06b6d4',
  Gloria: '#eab308',
  Vendetta: '#ef4444',
  Rimonta: '#10b981',
  Overdrive: '#ec4899',
  'Resa dei conti': '#8b5cf6',
  Magnanimo: '#14b8a6',
  'Ultimo desiderio': '#6b7280',
  Conquista: '#22c55e',
  Opportunista: '#a855f7',
  Sfida: '#f472b6',
  Sopraffare: '#34d399',
  Invasione: '#fb923c',
  Resistenza: '#60a5fa',
  'Ultima Chance': '#eab308',
  Rinforzi: '#94a3b8',
};

export const EFFECT_NAMES = {
  power: '+POT',
  damage: '+DAN',
  enemyPower: '-POT nem.',
  enemyDamage: '-DAN nem.',
  assaultValue: '+VA',
  enemyAssault: '-VA nem.',
  copyPower: 'Copia POT',
  copyDamage: 'Copia DAN',
  copyAbility: 'Copia Potere',
  copyBonus: 'Copia Bonus',
  blockAbility: 'Blocca Potere',
  blockBonus: 'Blocca Bonus',
  immune: 'Immune',
  focusCoin: '+FC',
  heal: 'Cura',
  selfDamage: '-PV (a te)',
  directDamage: 'Danni dir.',
  powerAndDamage: '+POT e DAN',
  escalation: 'Escalation',
  attrition: 'Attrition',
  inversion: 'Inversione',
  toxin: 'Tossina',
  imponiPower: 'Imponi POT',
  imponiDamage: 'Imponi DAN',
  enemyPowerAndDamage: '-POT e DAN nem.',
};

const ARMY_KEY_BY_NAME = {
  "Figli dell'Orizzonte": 'orizzonte',
  Kethran: 'kethran',
  'Corte Rossa': 'corte-rossa',
  'Calibri Pesanti': 'calibri-pesanti',
  Orathai: 'orathai',
  Mounthborn: 'mounthborn',
  "L'Enclave delle Scaglie": 'enclave',
  'Ratti della Megera': 'ratti',
  'Patto degli Indocili': 'indocili',
  Khemet: 'khemet',
  Apex: 'apex',
};

function roleFromStats(pot, dan) {
  if (pot - dan >= 3) return 'Assalto';
  if (dan - pot >= 3) return 'Difesa';
  if (pot >= 6 && dan >= 6) return 'Élite';
  return 'Supporto';
}

function bonusLabelFor(armyName) {
  const bonus = ARMY_BONUSES[armyName];
  if (!bonus?.trigger) return 'PASSIVO';
  const key = bonus.trigger;
  return (TRIGGER_NAMES[key] || key).toUpperCase();
}

function buildCard(card, army) {
  const agent = { ...card, army };
  const tags = getCardTags(card.id);
  const trigger = card.ability?.trigger ? (TRIGGER_NAMES[card.ability.trigger] || 'Sempre') : 'Sempre';
  const abilityText = card.description?.replace(/^Potere: /, '') || '';

  return {
    ...agent,
    pot: card.power,
    dan: card.damage,
    powerDesc: abilityText,
    trigger,
    effect: card.ability?.effect || null,
    abilityText,
    tags,
    role: roleFromStats(card.power, card.damage),
  };
}

export const FACTIONS = Object.keys(ARMY_SETS).map((name) => {
  const colors = ARMY_COLORS[name];
  const bonus = ARMY_BONUSES[name];
  return {
    key: ARMY_KEY_BY_NAME[name] || name.toLowerCase().replace(/\s+/g, '-'),
    name,
    accent: colors?.accent || '#a78bfa',
    icon: ARMY_ICONS[name] || '',
    bonusLabel: bonusLabelFor(name),
    bonus: bonus?.description || '-',
    trigger: bonus?.trigger ? (TRIGGER_NAMES[bonus.trigger] || 'Sempre') : 'Sempre',
  };
});

export const POOLS = Object.fromEntries(
  Object.entries(ARMY_SETS).map(([army, cards]) => {
    const key = ARMY_KEY_BY_NAME[army] || army.toLowerCase().replace(/\s+/g, '-');
    return [key, cards.map((c) => buildCard(c, army))];
  })
);

export const ALL_CARDS = Object.values(POOLS).flat();

export function isRole(tag) {
  return RUOLO_TAGS.has(tag);
}

export { LEAGUE_COLORS, TAG_TOOLTIPS, RUOLO_TAGS };
