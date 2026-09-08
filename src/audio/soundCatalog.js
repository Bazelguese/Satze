/**
 * Catalogo SFX — ID stabili, path sotto public/audio.
 */

export const UI_SOUND = {
  CLICK: 'ui.click',
  CONFIRM: 'ui.confirm',
  BACK: 'ui.back',
  NAVIGATE: 'ui.navigate',
};

export const GAME_SOUND = {
  CARD_SELECT: 'game.card.select',
  CARD_DESELECT: 'game.card.deselect',
  CARD_PLACE: 'game.card.place',
  FIELD_SELECT: 'game.field.select',
  FC_TICK: 'game.fc.tick',
  LOCK_IN: 'game.lock',
  SHUFFLE: 'game.shuffle',
  DUEL_START: 'game.duel.start',
  DUEL_DEPLOY: 'game.duel.deploy',
  DUEL_POWER: 'game.duel.power',
  DUEL_FOCUS: 'game.duel.focus',
  DUEL_CLASH: 'game.duel.clash',
  DUEL_WIN: 'game.duel.win',
  DUEL_LOSE: 'game.duel.lose',
  DUEL_DRAW: 'game.duel.draw',
  ROUND_NEXT: 'game.round.next',
  ARMY_CONFIRM: 'game.army.confirm',
  DECK_CONFIRM: 'game.deck.confirm',
};

/** Beat cinematici Eminenza. */
export const CINEMATIC_BEATS = /** @type {const} */ (['launch', 'impact']);

/**
 * @param {string} path
 */
export function toPublicAudioUrl(path) {
  const raw = String(path || '').replace(/^\//, '');
  if (!raw) return null;
  const base =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  return base.endsWith('/') ? `${base}${raw}` : `${base}/${raw}`;
}

const FALLBACK = {
  launch: 'audio/sfx/whoosh.wav',
  impact: 'audio/sfx/impact.wav',
  ui: 'audio/sfx/ui-click.wav',
  soft: 'audio/sfx/ui-soft.wav',
  confirm: 'audio/sfx/ui-confirm.wav',
  place: 'audio/sfx/card-place.wav',
  tick: 'audio/sfx/fc-tick.wav',
  clash: 'audio/sfx/clash.wav',
  win: 'audio/sfx/win.wav',
  lose: 'audio/sfx/lose.wav',
  shuffle: 'audio/sfx/shuffle.wav',
};

/** @type {Record<string, string>} */
export const SOUND_CATALOG = {
  [UI_SOUND.CLICK]: FALLBACK.ui,
  [UI_SOUND.CONFIRM]: FALLBACK.confirm,
  [UI_SOUND.BACK]: FALLBACK.soft,
  [UI_SOUND.NAVIGATE]: FALLBACK.soft,
  'ui.soft': FALLBACK.soft,

  [GAME_SOUND.CARD_SELECT]: FALLBACK.place,
  [GAME_SOUND.CARD_DESELECT]: FALLBACK.soft,
  [GAME_SOUND.CARD_PLACE]: FALLBACK.place,
  [GAME_SOUND.FIELD_SELECT]: FALLBACK.confirm,
  [GAME_SOUND.FC_TICK]: FALLBACK.tick,
  [GAME_SOUND.LOCK_IN]: FALLBACK.confirm,
  [GAME_SOUND.SHUFFLE]: FALLBACK.shuffle,
  [GAME_SOUND.DUEL_START]: FALLBACK.launch,
  [GAME_SOUND.DUEL_DEPLOY]: FALLBACK.launch,
  [GAME_SOUND.DUEL_POWER]: FALLBACK.tick,
  [GAME_SOUND.DUEL_FOCUS]: FALLBACK.tick,
  [GAME_SOUND.DUEL_CLASH]: FALLBACK.clash,
  [GAME_SOUND.DUEL_WIN]: FALLBACK.win,
  [GAME_SOUND.DUEL_LOSE]: FALLBACK.lose,
  [GAME_SOUND.DUEL_DRAW]: FALLBACK.soft,
  [GAME_SOUND.ROUND_NEXT]: FALLBACK.soft,
  [GAME_SOUND.ARMY_CONFIRM]: FALLBACK.confirm,
  [GAME_SOUND.DECK_CONFIRM]: FALLBACK.confirm,

  'cinematic.LINK_AGENT.launch': FALLBACK.launch,
  'cinematic.LINK_AGENT.impact': FALLBACK.impact,
  'cinematic.VERIFY_LINK.launch': FALLBACK.launch,
  'cinematic.VERIFY_LINK.impact': FALLBACK.impact,
  'cinematic.REVEAL_OPEN.launch': FALLBACK.launch,
  'cinematic.REVEAL_OPEN.impact': FALLBACK.impact,
  'cinematic._.launch': FALLBACK.launch,
  'cinematic._.impact': FALLBACK.impact,
};

/**
 * @param {string} recipe
 * @param {'launch'|'impact'} beat
 */
export function cinematicSoundId(recipe, beat) {
  return `cinematic.${recipe}.${beat}`;
}

/**
 * @param {string} soundId
 * @returns {string|null}
 */
export function resolveSoundSrc(soundId) {
  if (!soundId || typeof soundId !== 'string') return null;
  if (SOUND_CATALOG[soundId]) return toPublicAudioUrl(SOUND_CATALOG[soundId]);
  const m = /^cinematic\.([^.]+)\.(launch|impact)$/.exec(soundId);
  if (m) return toPublicAudioUrl(FALLBACK[m[2]]);
  return null;
}
