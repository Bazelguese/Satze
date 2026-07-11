import { SHUFFLE_STYLE_OPTIONS } from './shuffleStylePreference';

/** Etichette compatte nel picker dev. */
const ARMY_MENU_LABELS = {
  "Figli dell'Orizzonte": 'ORIZZONTE',
  Kethran: 'KETHRAN',
  'Corte Rossa': 'CORTE ROSSA',
  'Calibri Pesanti': 'CALIBRI',
  Orathai: 'ORATHAI',
  Mounthborn: 'MOUNTHBORN',
  "L'Enclave delle Scaglie": 'ENCLAVE',
  'Ratti della Megera': 'RATTI',
  'Patto degli Indocili': 'PATTO',
  Khemet: 'KHEMET',
};

export function armyMenuLabel(armyName) {
  return ARMY_MENU_LABELS[armyName] || armyName.toUpperCase();
}

/** @param {unknown} value */
export function isMenuFollowUpPicker(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray(value.options) &&
      value.options.length > 0
  );
}

/** Passo 1: scegli armata → ritorna config picker mischia (gestito dal menu). */
export function buildDialogueDuelArmyChoices(armyNames, onLaunch) {
  return armyNames.map((playerArmy) => ({
    label: armyMenuLabel(playerArmy),
    sub: 'TU',
    meta: 'POI SCEGLI MISCHIA',
    onClick: () => ({
      accent: '#94a3b8',
      title: `Mischia · ${armyMenuLabel(playerArmy)}`,
      options: buildDialogueDuelShuffleChoices(playerArmy, onLaunch),
    }),
  }));
}

/** Passo 2: stile mischia → avvio duello. */
export function buildDialogueDuelShuffleChoices(playerArmy, onLaunch) {
  return SHUFFLE_STYLE_OPTIONS.map((opt) => ({
    label: opt.title.toUpperCase(),
    sub: opt.sub,
    meta: 'DUELLO + FUMETTI',
    onClick: () => onLaunch(playerArmy, opt.key),
  }));
}
