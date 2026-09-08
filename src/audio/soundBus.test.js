import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cinematicSoundId,
  resolveSoundSrc,
  UI_SOUND,
  GAME_SOUND,
} from './soundCatalog.js';
import {
  normalizeAudioSettings,
  DEFAULT_AUDIO_SETTINGS,
} from './audioPreferences.js';
import {
  shouldPlayCinematicBeat,
  __resetSoundBusForTests,
} from './soundBus.js';
import { playDuelPhaseBeat, playPhaseTransition } from './gameSounds.js';

test('catalog: id cinematici e fallback', () => {
  assert.equal(cinematicSoundId('LINK_AGENT', 'launch'), 'cinematic.LINK_AGENT.launch');
  assert.match(resolveSoundSrc(UI_SOUND.CLICK), /audio\/sfx\/ui-click\.wav$/);
  assert.match(resolveSoundSrc(GAME_SOUND.DUEL_CLASH), /audio\/sfx\/clash\.wav$/);
  assert.match(resolveSoundSrc(GAME_SOUND.FC_TICK), /audio\/sfx\/fc-tick\.wav$/);
  assert.match(resolveSoundSrc('cinematic.HP_TICK.impact'), /audio\/sfx\/impact\.wav$/);
  assert.equal(resolveSoundSrc('nope'), null);
});

test('prefs: normalize clamp volume e mute', () => {
  assert.deepEqual(normalizeAudioSettings(null), DEFAULT_AUDIO_SETTINGS);
  assert.equal(normalizeAudioSettings({ muted: 1, sfxVolume: 2 }).sfxVolume, 1);
  assert.equal(normalizeAudioSettings({ sfxVolume: -1 }).sfxVolume, 0);
  assert.equal(normalizeAudioSettings({ muted: true }).muted, true);
});

test('policy: reduced-motion salta launch, tiene impact', () => {
  assert.equal(shouldPlayCinematicBeat('launch', true), false);
  assert.equal(shouldPlayCinematicBeat('impact', true), true);
  assert.equal(shouldPlayCinematicBeat('launch', false), true);
  __resetSoundBusForTests();
});

test('gameSounds: mapping fasi duello', () => {
  assert.equal(typeof playDuelPhaseBeat, 'function');
  assert.equal(typeof playPhaseTransition, 'function');
  // In node non c'è Audio: devono solo non lanciare
  assert.equal(playPhaseTransition('selectArmy', 'menu'), false);
  assert.equal(playDuelPhaseBeat(4, { winner: 'player' }), false);
  assert.equal(playDuelPhaseBeat(5, { winner: 'player' }), false);
});
