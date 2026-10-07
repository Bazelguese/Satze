import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARMY_SETS } from '../data/cards.js';
import { mulberry32 } from '../utils/seededRandom.js';
import {
  generatePack,
  generateStarterPacks,
  findValidDeck,
  cardPool,
  availableTriggers,
  rollSkin,
} from './packGenerator.js';
import {
  createCollection,
  sanitizeCollection,
  addCards,
  earnCoins,
  buyPack,
  buyOffer,
  canClaimDaily,
  claimStarterPacks,
  craftCard,
  setEquippedSkin,
  equippedSkin,
  ownedSkins,
  skinsForCard,
  isDeckOwned,
  missingDeckCards,
  getCatalogCard,
} from './collectionState.js';
import { createLocalCollectionService, localDay } from './collectionService.js';
import {
  PACK_SIZE,
  PACK_TYPES,
  OFFERS,
  STARTER_PACK_COUNT,
  DECK_SIZE,
  DECK_TOTAL_LEAGUE,
  DUST_FROM_DUPLICATE,
  CRAFT_COST,
} from './collectionConfig.js';

const ARMIES = Object.keys(ARMY_SETS);
const FIRST = ARMY_SETS[ARMIES[0]][0];
/** Catalogo skin finto: due carte con faccia alternativa. */
const SKIN_CATALOG = new Map([[FIRST.id, 'eldritch'], [ARMY_SETS[ARMIES[1]][0].id, 'arcana']]);

test('bustina mista: PACK_SIZE carte distinte, ultima di Lega 4+', () => {
  const rng = mulberry32(1);
  for (let i = 0; i < 500; i++) {
    for (const army of ARMIES) {
      const pack = generatePack('armata', { army }, rng);
      assert.equal(pack.length, PACK_SIZE);
      assert.equal(new Set(pack.map((c) => c.id)).size, PACK_SIZE);
      assert.ok(pack[PACK_SIZE - 1].league >= 4, `slot raro di Lega ${pack[PACK_SIZE - 1].league}`);
      assert.ok(pack.every((c) => c.army === army));
    }
    assert.ok(generatePack('mista', {}, rng)[PACK_SIZE - 1].league >= 4);
  }
});

test('bustina mista: frequenza di Lega 5 intorno al 10%', () => {
  const rng = mulberry32(7);
  const n = 20000;
  let withL5 = 0;
  for (let i = 0; i < n; i++) if (generatePack('mista', {}, rng).some((c) => c.league === 5)) withL5++;
  const rate = withL5 / n;
  assert.ok(rate > 0.08 && rate < 0.12, `frequenza Lega 5: ${rate}`);
});

test('armata senza Lega 5 (Patto degli Indocili): lo slot raro ripiega sulla Lega 4', () => {
  const army = 'Patto degli Indocili';
  assert.ok(!cardPool(army).some((c) => c.league === 5));
  const rng = mulberry32(3);
  for (let i = 0; i < 300; i++) assert.equal(generatePack('armata', { army }, rng)[PACK_SIZE - 1].league, 4);
});

test('bustina leggendaria: sempre una Lega 5', () => {
  const rng = mulberry32(4);
  for (let i = 0; i < 500; i++) assert.equal(generatePack('leggendaria', {}, rng)[PACK_SIZE - 1].league, 5);
});

test('bustina delle reclute: solo Lega 2 e 3', () => {
  const rng = mulberry32(5);
  for (let i = 0; i < 500; i++) assert.ok(generatePack('reclute', {}, rng).every((c) => c.league <= 3));
});

test('bustina grande: 10 carte distinte, ultime due di Lega 4+', () => {
  const rng = mulberry32(6);
  for (let i = 0; i < 300; i++) {
    const pack = generatePack('grande', {}, rng);
    assert.equal(pack.length, PACK_TYPES.grande.size);
    assert.equal(new Set(pack.map((c) => c.id)).size, pack.length);
    assert.ok(pack.slice(-2).every((c) => c.league >= 4));
  }
});

test('bustina del Potere: solo carte con quel Potere, per ogni Potere disponibile', () => {
  const rng = mulberry32(8);
  const triggers = availableTriggers();
  assert.ok(triggers.length > 10);
  for (const { trigger } of triggers) {
    for (let i = 0; i < 40; i++) {
      const pack = generatePack('potere', { trigger }, rng);
      assert.equal(pack.length, PACK_SIZE, trigger);
      assert.ok(pack.every((c) => c.ability?.trigger === trigger), trigger);
    }
  }
});

test('skin: Eldritch/Arcana solo sulle carte che hanno la faccia, foil su tutte', () => {
  const rng = mulberry32(9);
  const plain = ARMY_SETS[ARMIES[2]][0];
  const seen = { alt: new Set(), plain: new Set() };
  for (let i = 0; i < 5000; i++) {
    seen.alt.add(rollSkin(FIRST, rng, SKIN_CATALOG));
    seen.plain.add(rollSkin(plain, rng, SKIN_CATALOG));
  }
  assert.deepEqual([...seen.alt].sort(), ['eldritch', 'foil', 'standard']);
  assert.deepEqual([...seen.plain].sort(), ['foil', 'standard']);
  assert.deepEqual(skinsForCard(FIRST.id, SKIN_CATALOG), ['standard', 'foil', 'eldritch']);
});

test('mazzo valido trovabile per ogni armata', () => {
  for (const army of ARMIES) {
    const deck = findValidDeck(cardPool(army), mulberry32(11));
    assert.ok(deck, army);
    assert.equal(deck.length, DECK_SIZE);
    assert.equal(deck.reduce((s, c) => s + c.league, 0), DECK_TOTAL_LEAGUE);
  }
});

test('bustine iniziali: carte distinte, standard, che contengono un mazzo valido', () => {
  for (const army of ARMIES) {
    for (let seed = 0; seed < 25; seed++) {
      const packs = generateStarterPacks(army, mulberry32(seed));
      assert.equal(packs.length, STARTER_PACK_COUNT);
      const all = packs.flat();
      assert.equal(all.length, STARTER_PACK_COUNT * PACK_SIZE);
      assert.equal(new Set(all.map((c) => c.id)).size, all.length);
      assert.ok(all.every((c) => c.army === army && c.skin === 'standard'));
      assert.ok(findValidDeck(all, mulberry32(seed)), `${army} seed ${seed}`);
    }
  }
});

test('doppioni diventano polvere, una skin nuova si sblocca a parte', () => {
  const first = addCards(createCollection(), [FIRST.id]);
  assert.deepEqual(first.collection.owned, [FIRST.id]);
  assert.equal(first.results[0].newCard, true);

  const dup = addCards(first.collection, [FIRST.id]);
  assert.equal(dup.results[0].duplicate, true);
  assert.equal(dup.collection.dust, DUST_FROM_DUPLICATE[FIRST.league]);

  const foil = addCards(dup.collection, [{ id: FIRST.id, skin: 'foil' }]);
  assert.equal(foil.results[0].newSkin, true);
  assert.equal(foil.results[0].duplicate, false);
  assert.equal(foil.collection.dust, dup.collection.dust);
  assert.deepEqual(ownedSkins(foil.collection, FIRST.id), ['standard', 'foil']);

  const foilAgain = addCards(foil.collection, [{ id: FIRST.id, skin: 'foil' }]);
  assert.equal(foilAgain.results[0].duplicate, true);
});

test('carta nuova con skin: si ottengono carta e skin insieme', () => {
  const { collection, results } = addCards(createCollection(), [{ id: FIRST.id, skin: 'eldritch' }]);
  assert.equal(results[0].newCard, true);
  assert.equal(results[0].newSkin, true);
  assert.deepEqual(ownedSkins(collection, FIRST.id), ['standard', 'eldritch']);
});

test('faccia in partita: solo skin possedute', () => {
  const { collection } = addCards(createCollection(), [{ id: FIRST.id, skin: 'foil' }]);
  assert.equal(equippedSkin(collection, FIRST.id), 'standard');
  const withFoil = setEquippedSkin(collection, FIRST.id, 'foil');
  assert.equal(equippedSkin(withFoil, FIRST.id), 'foil');
  assert.throws(() => setEquippedSkin(withFoil, FIRST.id, 'eldritch'), /non posseduta/);
  assert.equal(equippedSkin(setEquippedSkin(withFoil, FIRST.id, 'standard'), FIRST.id), 'standard');
});

test('acquisto bustina: scala la valuta, rifiuta se insufficiente o parametro non valido', () => {
  const price = PACK_TYPES.mista.price;
  assert.throws(() => buyPack(createCollection(), { type: 'mista' }, mulberry32(1)), /insufficiente/);
  const rich = earnCoins(createCollection(), price + 5);
  const { collection, results } = buyPack(rich, { type: 'mista' }, mulberry32(1));
  assert.equal(collection.coins, 5);
  assert.equal(collection.packsOpened, 1);
  assert.equal(results.length, PACK_SIZE);
  const thousand = earnCoins(createCollection(), 1000);
  assert.throws(() => buyPack(thousand, { type: 'armata', army: 'Nessuna' }, mulberry32(1)), /Armata/);
  assert.throws(() => buyPack(thousand, { type: 'potere', trigger: 'nessuno' }, mulberry32(1)), /Potere/);
});

test('offerta 5 bustine: un solo pagamento, cinque bustine', () => {
  const offer = OFFERS.cinquina;
  const rich = earnCoins(createCollection(), offer.price);
  const { collection, packs } = buyOffer(rich, 'cinquina', mulberry32(2));
  assert.equal(collection.coins, 0);
  assert.equal(packs.length, offer.count);
  assert.equal(collection.packsOpened, offer.count);
});

test('bustina del giorno: gratuita, una volta per giorno', () => {
  const { collection, packs } = buyOffer(createCollection(), 'giornaliera', mulberry32(3), { today: '2026-10-07' });
  assert.equal(packs.length, 1);
  assert.equal(collection.coins, 0);
  assert.equal(canClaimDaily(collection, '2026-10-07'), false);
  assert.throws(() => buyOffer(collection, 'giornaliera', mulberry32(3), { today: '2026-10-07' }), /già riscattata/);
  assert.equal(canClaimDaily(collection, '2026-10-08'), true);
  assert.equal(localDay(new Date(2026, 0, 5)), '2026-01-05');
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

test('sanitize: scarta carte, skin e scelte non valide', () => {
  const id = FIRST.id;
  const clean = sanitizeCollection({
    coins: -5, dust: 'x', owned: [id, id, 999999], starterArmy: 'Nessuna',
    skins: { [id]: ['foil', 'arcana', 'nonesiste', 'foil'], 999999: ['foil'] },
    equipped: { [id]: 'arcana' },
  }, SKIN_CATALOG);
  assert.deepEqual(clean, { ...createCollection(), owned: [id], skins: { [id]: ['foil'] } });
  assert.ok(getCatalogCard(id));
});

test('servizio locale: salva e ricarica, compresi skin e bustina del giorno', async () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
  const service = createLocalCollectionService({ storage, rng: mulberry32(9), skinCatalog: SKIN_CATALOG, today: () => '2026-10-07' });

  await service.claimStarterPacks(ARMIES[2]);
  const { amount } = await service.rewardMatch('ai', true);
  assert.ok(amount > 0);
  await service.buyOffer('giornaliera');
  await assert.rejects(service.buyOffer('giornaliera'), /già riscattata/);

  const reloaded = await createLocalCollectionService({ storage }).getCollection();
  assert.equal(reloaded.starterArmy, ARMIES[2]);
  assert.equal(reloaded.coins, amount);
  assert.equal(reloaded.lastFreePackDay, '2026-10-07');
  assert.ok(reloaded.owned.length >= STARTER_PACK_COUNT * PACK_SIZE);

  store.set('satze_collection_v1', '{non json');
  assert.deepEqual(await service.getCollection(), createCollection());
});
