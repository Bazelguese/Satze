import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { getFieldRarita } from '../../data/battlefieldMeta.js';
import { selectBattlefields } from '../../game/fieldLogic.js';
import { mulberry32 } from '../../utils/seededRandom.js';
import { TOWER_ID } from '../data/firstAct.js';

/** One draw per attempt and squad. Resuming uses the persisted IDs, never a reroll. */
export function drawFirstActFields(run, node, phase) {
  if (node.winRule === 'varco') return [...node.fieldIds];
  let seed = run.seed >>> 0;
  for (const ch of `${node.id}:fields:${run.attempt + 1}:${phase}`) {
    seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  }
  const rng = mulberry32(seed);
  const hasTower = node.fieldIds.includes(TOWER_ID);
  // Torre occupies the special slot; the remaining fields follow the duel rarity rules.
  const pool = ALL_BATTLEFIELDS.filter(f => !f.campaignOnly && (!hasTower || getFieldRarita(f) !== 'special'));
  const fields = selectBattlefields('classic', pool, { rng, fieldCount: node.fieldIds.length }).map(f => f.id);
  if (hasTower) fields[3 + Math.floor(rng() * (fields.length - 3))] = TOWER_ID;
  return fields;
}
