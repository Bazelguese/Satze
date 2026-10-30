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
import { clashContactMs, duelPhaseCues, playDuelPhaseBeat, playPhaseTransition } from './gameSounds.js';

test('catalog: id cinematici e fallback', () => {
  assert.equal(cinematicSoundId('LINK_AGENT', 'launch'), 'cinematic.LINK_AGENT.launch');
  assert.match(resolveSoundSrc(UI_SOUND.CLICK), /audio\/sfx\/ui-click\.wav$/);
  assert.match(resolveSoundSrc(GAME_SOUND.DUEL_CLASH), /audio\/sfx\/match\/clash\.mp3$/);
  assert.match(resolveSoundSrc(GAME_SOUND.FC_TICK), /audio\/sfx\/match\/coin\.mp3$/);
  assert.match(resolveSoundSrc(GAME_SOUND.DUEL_COIN), /audio\/sfx\/match\/coin\.mp3$/);
  for (const [id, file] of [[GAME_SOUND.DUEL_PERFECT, 'perfect'], [GAME_SOUND.DUEL_WIN, 'win'], [GAME_SOUND.DUEL_LOSE, 'lose'], [GAME_SOUND.DUEL_DRAW, 'draw']]) {
    assert.match(resolveSoundSrc(id), new RegExp(`audio/sfx/match/${file}\\.mp3$`));
  }
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
  assert.equal(typeof playDuelPhaseBeat(4, { winner: 'player' }), 'function');
  assert.equal(typeof playDuelPhaseBeat(5, { winner: 'player' }), 'function');
});

test('gameSounds: la conferma resta sola, niente suoni di fase prima dello scontro', () => {
  assert.equal(playPhaseTransition('battle', 'selectAgent'), false);
  for (const phase of [0, 1, 2, 3, 5, 6]) assert.deepEqual(duelPhaseCues(phase, { winner: 'player' }), []);
});

test('gameSounds: scontro sul contatto delle carte, esito subito dopo (anche senza fase 5)', () => {
  const [clash, outcome] = duelPhaseCues(4, { winner: 'player' });
  assert.equal(clash.id, GAME_SOUND.DUEL_CLASH);
  assert.equal(clash.atMs, clashContactMs({ winner: 'player' }));
  // fase 4 dura almeno 2,6 s: il contatto arriva oltre metà
  assert.ok(clash.atMs >= 1300, `contatto a ${clash.atMs} ms`);
  assert.equal(outcome.id, GAME_SOUND.DUEL_WIN);
  assert.ok(outcome.atMs > clash.atMs);
  assert.equal(duelPhaseCues(4, { winner: 'enemy' })[1].id, GAME_SOUND.DUEL_LOSE);
  assert.equal(duelPhaseCues(4, { winner: 'draw' })[1].id, GAME_SOUND.DUEL_DRAW);
});
