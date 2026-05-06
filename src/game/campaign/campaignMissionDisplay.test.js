import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMissionDisplayPressure, isMissionMandatory } from './campaignMissionDisplay.js';
import { mergeWarState } from './campaignWarModel.js';

test('getMissionDisplayPressure usa severità faglia e factionPressure', () => {
  const war = mergeWarState({
    factionPressure: { Kethran: 20 },
    fissures: [
      {
        id: 'rift_1',
        factionKey: 'Kethran',
        severity: 40,
        bornOnDay: 1,
        ignoredDays: 0,
        mandatory: false,
      },
    ],
  });
  const mission = {
    enemyArmy: 'Kethran',
    _source: 'fissure',
    _fissureId: 'rift_1',
  };
  assert.equal(getMissionDisplayPressure(mission, war), 40);
});

test('isMissionMandatory con _mandatory', () => {
  const war = mergeWarState(null);
  assert.equal(isMissionMandatory({ _mandatory: true, enemyArmy: 'X' }, war), true);
});
