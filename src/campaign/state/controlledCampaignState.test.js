import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTROLLED_CAMPAIGN } from '../data/controlledCampaign.js';
import {
  CONCORDIA_CARDS,
  CONCORDIA_DECKS,
  CONCORDIA_EMINENCE_ID,
  CONCORDIA_ARMY,
} from '../data/concordia.js';
import { ARMY_SETS } from '../../data/cards.js';
import {
  cloneDefinition,
  validateCampaignDefinition,
  saveCampaignDefinition,
  loadCampaignDefinition,
} from '../logic/campaignDefinition.js';
import {
  createControlledRun,
  controlledCampaignReducer as reduce,
  currentStage,
} from './controlledCampaignState.js';
import { buildDuelConfig, applyDuelResult } from '../logic/missionAdapter.js';
import {
  createMatchEminenceState,
  resolveEminenceFormat,
} from '../../game/eminence/eminenceSetup.js';
import { EMINENCE_IDS } from '../../data/eminences.js';
import { createCampaignRun } from './campaignState.js';
import { ACT } from '../data/atto1.js';
import {
  loadCampaignRun,
  saveCampaignRun,
  getCampaignRunSummary,
} from './persistence.js';
const resolveEvents = (run) => {
  while (run.pendingEvents.length)
    run = reduce(run, {
      type: 'APPLY_EVENT_CHOICE',
      eventId: run.pendingEvents[0],
      choiceIndex: 0,
    });
  return run;
};
const finish = (run, winner = 'player') =>
  reduce(run, {
    type: 'APPLY_DUEL_RESULT',
    nodeId: run.currentNode,
    attempt: run.activeAttempt,
    winner,
  });

test('Concordia: catalogo esclusivo, 6/4/3/2 livree, mazzi 24/26/27/27/30', () => {
  assert.deepEqual(
    [2, 3, 4, 5].map(
      (l) => CONCORDIA_CARDS.filter((c) => c.league === l).length,
    ),
    [6, 4, 3, 2],
  );
  assert.equal(ARMY_SETS[CONCORDIA_ARMY], undefined);
  assert.ok(!EMINENCE_IDS.includes(CONCORDIA_EMINENCE_ID));
  assert.deepEqual(
    Object.values(CONCORDIA_DECKS).map((d) =>
      d.reduce(
        (s, id) => s + CONCORDIA_CARDS.find((c) => c.id === id).league,
        0,
      ),
    ),
    [24, 26, 27, 27, 30],
  );
  assert.deepEqual(validateCampaignDefinition(CONTROLLED_CAMPAIGN), []);
});
test('Tutti gli otto percorsi attraversano 18 incontri e tre atti, per ogni Impronta', () => {
  for (const imprint of ['turbo', 'imboscata', 'vendetta'])
    for (let path = 0; path < 8; path++) {
      let run = createControlledRun(CONTROLLED_CAMPAIGN, { imprint });
      const visited = [];
      for (let i = 0; i < 18; i++) {
        run = resolveEvents(run);
        const alternatives = currentStage(run).alternatives;
        const m =
          alternatives[
            alternatives.length > 1 ? (path >> run.actIndex) & 1 : 0
          ];
        visited.push(m.id);
        run = reduce(run, { type: 'START_MISSION', nodeId: m.id });
        const cfg = buildDuelConfig(m, run);
        assert.equal(cfg.playerDeckCards.length, 10);
        assert.equal(cfg.enemyDeckIds.length, 10);
        assert.equal(cfg.startOptions.fixedHands.playerHand.length, 5);
        assert.ok(
          cfg.startOptions.fixedHands.playerHand.some((c) => c.id === 9001),
        );
        assert.equal(cfg.startOptions.fixedHands.enemyHand.length, 5);
        if (m.signatureCardId)
          assert.ok(
            cfg.startOptions.fixedHands.enemyHand.some(
              (c) => c.id === m.signatureCardId,
            ),
          );
        const setup = createMatchEminenceState({
          format: resolveEminenceFormat(cfg.startOptions),
          playerDeck: cfg.playerDeckCards,
          enemyDeck: cfg.enemyDeckIds,
          ...cfg.startOptions,
        });
        assert.equal(setup.enemyResolution.reason, null);
        assert.equal(setup.playerResolution.reason, null);
        assert.ok(setup.matchState.enemy.eminenceId);
        if (m.kind !== 'special')
          assert.equal(setup.matchState.enemy.presence, 1);
        run = applyDuelResult(
          run,
          null,
          { ...m, campaignAttempt: run.activeAttempt },
          { winner: 'player' },
        );
        run = JSON.parse(JSON.stringify(run));
        if (i < 17) assert.equal(run.outcome, null);
      }
      assert.equal(run.outcome, 'won');
      assert.equal(run.history.length, 18);
      assert.equal(new Set(visited).size, 18);
    }
});
test('Sconfitte, pareggi e callback duplicati non avanzano o duplicano premi', () => {
  let run = createControlledRun(CONTROLLED_CAMPAIGN);
  assert.throws(() =>
    reduce(run, { type: 'START_MISSION', nodeId: 'concordia_atto_3_6' }),
  );
  run = reduce(run, {
    type: 'START_MISSION',
    nodeId: currentStage(run).alternatives[0].id,
  });
  const stale = {
    nodeId: run.currentNode,
    attempt: run.activeAttempt,
    type: 'APPLY_DUEL_RESULT',
    winner: 'player',
  };
  run = finish(run, 'enemy');
  assert.equal(run.stageIndex, 0);
  run = reduce(run, {
    type: 'START_MISSION',
    nodeId: currentStage(run).alternatives[0].id,
  });
  assert.equal(reduce(run, stale), run);
  run = finish(run, 'draw');
  assert.equal(run.stageIndex, 0);
  run = reduce(run, {
    type: 'START_MISSION',
    nodeId: currentStage(run).alternatives[0].id,
  });
  const result = { ...stale, attempt: run.activeAttempt };
  run = reduce(run, result);
  assert.equal(run.stageIndex, 1);
  assert.equal(reduce(run, result), run);
});
test('Distribuzione modificata: ordine rispettato, ricompense una sola volta', () => {
  const d = cloneDefinition(CONTROLLED_CAMPAIGN),
    first = d.acts[0].stages[0].alternatives[0].id;
  d.events = [
    { ...d.events[0], missionId: first },
    { ...d.events[1], missionId: first },
  ];
  let run = createControlledRun(d);
  d.events.reverse();
  run = reduce(run, { type: 'START_MISSION', nodeId: first });
  run = finish(run);
  assert.deepEqual(run.pendingEvents, ['richiamo_1', 'evoluzione_1']);
  assert.throws(() =>
    reduce(run, {
      type: 'START_MISSION',
      nodeId: currentStage(run).alternatives[0].id,
    }),
  );
  assert.throws(() =>
    reduce(run, {
      type: 'APPLY_EVENT_CHOICE',
      eventId: 'evoluzione_1',
      choiceIndex: 0,
    }),
  );
  run = reduce(run, {
    type: 'APPLY_EVENT_CHOICE',
    eventId: 'richiamo_1',
    choiceIndex: 0,
  });
  assert.equal(run.warehouse.filter((id) => id === 113).length, 1);
  assert.throws(() =>
    reduce(run, {
      type: 'APPLY_EVENT_CHOICE',
      eventId: 'richiamo_1',
      choiceIndex: 0,
    }),
  );
});
test('Import rifiuta carte nemiche nei premi, ID duplicati e incontri inesistenti', () => {
  for (const corrupt of [
    (d) => (d.events[0].choices[0].cardId = 9101),
    (d) => (d.events[1].id = d.events[0].id),
    (d) => (d.events[0].missionId = 'missing'),
    (d) => d.acts[0].stages.pop(),
    (d) => (d.acts[0].stages[0].alternatives[0].enemy.deck[0] = 9001),
  ]) {
    const d = cloneDefinition(CONTROLLED_CAMPAIGN);
    corrupt(d);
    assert.ok(validateCampaignDefinition(d).length);
    assert.throws(() => createControlledRun(d));
  }
});
test('Salvataggi: nuova run, vecchia run e definizione editor indipendenti', () => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
  try {
    const run = createControlledRun(CONTROLLED_CAMPAIGN);
    saveCampaignRun(run, 0);
    saveCampaignRun(createCampaignRun(ACT), 1);
    assert.deepEqual(loadCampaignRun(0).deck, run.deck);
    assert.equal(loadCampaignRun(1, ACT).actId, 'atto1');
    assert.equal(getCampaignRunSummary(0).controlled, true);
    const changed = cloneDefinition(CONTROLLED_CAMPAIGN);
    changed.events[0].title = 'Evento modificato';
    saveCampaignDefinition(changed);
    assert.equal(loadCampaignDefinition().events[0].title, 'Evento modificato');
    assert.notEqual(
      loadCampaignRun(0).definition.events[0].title,
      'Evento modificato',
    );
  } finally {
    delete globalThis.localStorage;
  }
});
