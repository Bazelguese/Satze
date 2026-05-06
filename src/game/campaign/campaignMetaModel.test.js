import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeCampaignMeta, clamp, createDefaultCampaignMeta } from './campaignMetaModel.js';

test('mergeCampaignMeta ripristina campi mancanti', () => {
  const m = mergeCampaignMeta({ day: 5, pressure: { player: 20 } });
  assert.equal(m.day, 5);
  assert.equal(m.pressure.player, 20);
  assert.equal(m.pressure.world, 0);
  assert.equal(m.rifts, 0);
  assert.ok(Array.isArray(m.warehouse));
});

test('clamp', () => {
  assert.equal(clamp(150, 0, 100), 100);
  assert.equal(clamp(-5, 0, 100), 0);
});

test('createDefaultCampaignMeta', () => {
  const d = createDefaultCampaignMeta();
  assert.equal(d.segment, 'mission_select');
});
