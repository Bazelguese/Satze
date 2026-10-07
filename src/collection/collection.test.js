import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARMY_SETS } from '../data/cards.js';
import { mulberry32 } from '../utils/seededRandom.js';
import { generatePack, generateStarterPacks, findValidDeck, cardPool } from './packGenerator.js';
import {
  createCollection,
  sanitizeCollection,
  addCards,
  earnCoins,
  buyPack,
  claimStarterPacks,
  craftCard,
  isDeckOwned,
  missingDeckCards,
  getCatalogCard,
} from './collectionState.js';
import { createLocalCollectionService } from './collectionService.js';
import {
  PACK_SIZE,
  PACK_TYPES,
  STARTER_PACK_COUNT,
  DECK_SIZE,
  DECK_TOTAL_LEAGUE,
  DUST_FROM_DUPLICATE,
  CRAFT_COST,
} from './collectionConfig.js';

const ARMIES = Object.keys(ARMY_SETS);

test('bustina: PACK_SIZE carte distinte, ultima di Lega 4+', () => {
  const rng = mulberry32(1);
  for (let i = 0; i < 500; i++) {
    for (const army of [null, ...ARMIES]) {
      const pack = generatePack({ army }, rng);
      assert.equal(pack.length, PACK_SIZE);
      assert.equal(new Set(pack.map((c) => c.id)).size, PACK_SIZE);
      assert.ok(pack[PACK_SIZE - 1].league >= 4, `slot raro di Lega ${pack[PACK_SIZE - 1].league}`);
      if (army) assert.ok(pack.every((c) => c.army === army));
    }
  }
});

test('bustina mista: frequenza di Lega 5 intorno al 10%', () => {
  const rng = mulberry32(7);
  const n = 20000;
  let withL5 = 0;
  for (let i = 0; i < n; i++) if (generatePack({}, rng).some((c) => c.league === 5)) withL5++;
  const rate = withL5 / n;
  assert.ok(rate > 0.08 && rate < 0.12, `frequenza Lega 5: ${rate}`);
});

test('armata senza Lega 5 (Patto degli Indocili): lo slot raro ripiega sulla Lega 4', () => {
  const army = 'Patto degli Indocili';
  assert.ok(!cardPool(army).some((c) => c.league === 5));
  const rng = mulberry32(3);
  for (let i = 0; i < 300; i++) assert.equal(generatePack({ army }, rng)[PACK_SIZE - 1].league, 4);
});

test('mazzo valido trovabile per ogni armata', () => {
  for (const army of ARMIES) {
    const deck = findValidDeck(cardPool(army), mulberry32(11));
    assert.ok(deck, army);
    assert.equal(deck.length, DECK_SIZE);
    assert.equal(deck.reduce((s, c) => s + c.league, 0), DECK_TOTAL_LEAGUE);
  }
});

test('bustine iniziali: carte distinte che contengono un mazzo valido', () => {
  for (const army of ARMIES) {
    for (let seed = 0; seed < 25; seed++) {
      const packs = generateStarterPacks(army, mulberry32(seed));
      assert.equal(packs.length, STARTER_PACK_COUNT);
      const all = packs.flat();
      assert.equal(all.length, STARTER_PACK_COUNT * PACK_SIZE);
      assert.equal(new Set(all.map((c) => c.id)).size, all.length);
      assert.ok(all.every((c) => c.army === army));
      assert.ok(findValidDeck(all, mulberry32(seed)), `${army} seed ${seed}`);
    }
  }
});

test('doppioni diventano polvere', () => {
  const card = ARMY_SETS[ARMIES[0]][0];
  const first = addCards(createCollection(), [card.id]);
  assert.deepEqual(first.collection.owned, [card.id]);
  const second = addCards(first.collection, [card.id]);
  assert.deepEqual(second.collection.owned, [card.id]);
  assert.equal(second.collection.dust, DUST_FROM_DUPLICATE[card.league]);
  assert.equal(second.results[0].duplicate, true);
});

test('acquisto bustina: scala la valuta, rifiuta se insufficiente', () => {
  const price = PACK_TYPES.mista.price;
  assert.throws(() => buyPack(createCollection(), { type: 'mista' }, mulberry32(1)), /insufficiente/);
  const rich = earnCoins(createCollection(), price + 5);
  const { collection, results } = buyPack(rich, { type: 'mista' }, mulberry32(1));
  assert.equal(collection.coins, 5);
  assert.equal(collection.packsOpened, 1);
  assert.equal(results.length, PACK_SIZE);
  assert.throws(() => buyPack(earnCoins(createCollection(), 1000), { type: 'armata', army: 'Nessuna' }, mulberry32(1)), /Armata/);
});

test('bustine iniziali: una volta sola', () => {
  const { collection, packs } = claimStarterPacks(createCollection(), ARMIES[0], mulberry32(5));
  assert.equal(collection.starterArmy, ARMIES[0]);
  assert.equal(collection.owned.length, STARTER_PACK_COUNT * PACK_SIZE);
  assert.equal(packs.length, STARTER_PACK_COUNT);
  assert.throws(() => claimStarterPacks(collection, ARMIES[1], mulberry32(5)), /già riscattate/);
});

test('creazione con polvere', () => {
  const card = ARMY_SETS[ARMIES[0]].find((c) => c.league === 5);
  const cost = CRAFT_COST[5];
  assert.throws(() => craftCard(createCollection(), card.id), /insufficiente/);
  const crafted = craftCard({ ...createCollection(), dust: cost }, card.id);
  assert.equal(crafted.dust, 0);
  assert.ok(crafted.owned.includes(card.id));
  assert.throws(() => craftCard({ ...crafted, dust: cost }, card.id), /già posseduta/);
});

test('verifica possesso mazzo', () => {
  const ids = ARMY_SETS[ARMIES[0]].slice(0, 3).map((c) => c.id);
  const { collection } = addCards(createCollection(), ids.slice(0, 2));
  assert.equal(isDeckOwned(collection, ids.slice(0, 2)), true);
  assert.deepEqual(missingDeckCards(collection, ids), [ids[2]]);
});

test('sanitize: scarta carte sconosciute e valori non validi', () => {
  const id = ARMY_SETS[ARMIES[0]][0].id;
  const clean = sanitizeCollection({ coins: -5, dust: 'x', owned: [id, id, 999999], starterArmy: 'Nessuna' });
  assert.deepEqual(clean, { ...createCollection(), owned: [id] });
  assert.ok(getCatalogCard(id));
});

test('servizio locale: salva e ricarica', async () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
  const service = createLocalCollectionService({ storage, rng: mulberry32(9) });

  await service.claimStarterPacks(ARMIES[2]);
  const { amount } = await service.rewardMatch('ai', true);
  assert.ok(amount > 0);

  const reloaded = await createLocalCollectionService({ storage }).getCollection();
  assert.equal(reloaded.starterArmy, ARMIES[2]);
  assert.equal(reloaded.coins, amount);
  assert.equal(reloaded.owned.length, STARTER_PACK_COUNT * PACK_SIZE);

  store.set('satze_collection_v1', '{non json');
  assert.deepEqual(await service.getCollection(), createCollection());
});
