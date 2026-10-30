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
  DUEL_COIN: 'game.duel.coin',
  DUEL_PERFECT: 'game.duel.perfect',
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

/** Set della partita (ElevenLabs): code naturali, volume già bilanciato tra i file. */
const MATCH = {
  cardArrive: 'audio/sfx/match/card-arrive.mp3',
  confirm: 'audio/sfx/match/confirm.mp3',
  coin: 'audio/sfx/match/coin.mp3',
  clash: 'audio/sfx/match/clash.mp3',
  perfect: 'audio/sfx/match/perfect.mp3',
  win: 'audio/sfx/match/win.mp3',
  lose: 'audio/sfx/match/lose.mp3',
  draw: 'audio/sfx/match/draw.mp3',
};

/**
 * Millisecondi dall'inizio del file al colpo udibile: chi sincronizza un suono
 * con un'animazione lo anticipa di questo tanto.
 * @type {Record<string, number>}
 */
export const SOUND_HIT_MS = {
  [GAME_SOUND.DUEL_CLASH]: 850,
};

/** @type {Record<string, string>} */
export const SOUND_CATALOG = {
  [UI_SOUND.CLICK]: FALLBACK.ui,
  [UI_SOUND.CONFIRM]: FALLBACK.confirm,
  [UI_SOUND.BACK]: FALLBACK.soft,
  [UI_SOUND.NAVIGATE]: FALLBACK.soft,
  'ui.soft': FALLBACK.soft,

  [GAME_SOUND.CARD_SELECT]: MATCH.cardArrive,
  [GAME_SOUND.CARD_DESELECT]: FALLBACK.soft,
  [GAME_SOUND.CARD_PLACE]: MATCH.cardArrive,
  [GAME_SOUND.FIELD_SELECT]: FALLBACK.confirm,
  [GAME_SOUND.FC_TICK]: MATCH.coin,
  [GAME_SOUND.LOCK_IN]: MATCH.confirm,
  [GAME_SOUND.SHUFFLE]: FALLBACK.shuffle,
  [GAME_SOUND.DUEL_START]: FALLBACK.launch,
  [GAME_SOUND.DUEL_DEPLOY]: FALLBACK.launch,
  [GAME_SOUND.DUEL_POWER]: FALLBACK.tick,
  [GAME_SOUND.DUEL_FOCUS]: FALLBACK.tick,
  [GAME_SOUND.DUEL_CLASH]: MATCH.clash,
  [GAME_SOUND.DUEL_COIN]: MATCH.coin,
  [GAME_SOUND.DUEL_PERFECT]: MATCH.perfect,
  [GAME_SOUND.DUEL_WIN]: MATCH.win,
  [GAME_SOUND.DUEL_LOSE]: MATCH.lose,
  [GAME_SOUND.DUEL_DRAW]: MATCH.draw,
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
