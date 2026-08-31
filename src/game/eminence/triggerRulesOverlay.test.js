import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createTriggerRules,
  applyPrimitiveToTriggerRules,
  buildTriggerRulesFromSegments,
  expireDuelReplacements,
  resolveTriggerState,
  resolveActivationRequirement,
} from './triggerRulesOverlay.js';
import {
  EMINENCE_PRIMITIVES as P,
  TRIGGER_SCOPES,
  SIDES,
} from './eminenceConstants.js';
import { EMINENCES } from '../../data/eminences.js';

// isFirst: true → imboscata naturalmente soddisfatta, intervention no.
// roundNumber 3 → né turbo (<=2) né ultimaChance (>=5).
const ctx = (overrides = {}) => ({
  fieldModifiers: {},
  isFirst: true,
  roundNumber: 3,
  playerHP: 25,
  enemyHP: 25,
  focusCoins: 0,
  enemyFocusCoins: 0,
  ...overrides,
});

const CARD = { id: 101, name: 'Agente di prova', league: 3 };

const resolve = (trigger, rules, extra = {}) =>
  resolveTriggerState({
    originalTrigger: trigger,
    context: ctx(extra.context),
    card: extra.card || CARD,
    side: extra.side || SIDES.PLAYER,
    triggerRules: rules,
    powerDisabled: extra.powerDisabled || false,
    powerBlocked: extra.powerBlocked || false,
  });

const segment = (primitive, props) => ({ primitive, ...props });

const withRule = (primitive, props, ownerSide = SIDES.PLAYER) =>
  applyPrimitiveToTriggerRules(createTriggerRules(), segment(primitive, props), {
    ownerSide,
    source: 'test',
  });

// ------------------------------------------------------------------
// Condizione naturale
// ------------------------------------------------------------------

test('naturale: overlay vuoto lascia intatta la condizione del trigger', () => {
  const rules = createTriggerRules();
  assert.equal(resolve('imboscata', rules).naturalSatisfied, true);
  assert.equal(resolve('intervention', rules).naturalSatisfied, false);
  assert.equal(resolve('turbo', rules).satisfied, false);
});

test('naturale: trigger nullo conta come requisito soddisfatto', () => {
  const state = resolve(null, createTriggerRules());
  assert.equal(state.naturalSatisfied, true);
  assert.equal(state.effectiveTrigger, null);
});

test('naturale: le modifiche di Campo restano nel motore dei trigger, non nell\'overlay', () => {
  const rules = createTriggerRules();
  const state = resolve('intervention', rules, {
    context: { fieldModifiers: { interventoAlwaysActive: true } },
  });
  assert.equal(state.naturalSatisfied, true);
  assert.equal(state.forced, false);
});

// ------------------------------------------------------------------
// Sostituzione (§7.3 passo 1, §7.4)
// ------------------------------------------------------------------

test('sostituzione: determina quale trigger possiede il Potere', () => {
  const rules = withRule(P.REPLACE_TRIGGER, { cardIds: [CARD.id], trigger: 'intervention' });
  const state = resolve('imboscata', rules);

  assert.equal(state.originalTrigger, 'imboscata');
  assert.equal(state.effectiveTrigger, 'intervention');
  assert.equal(state.naturalSatisfied, false);
});

test('sostituzione: quella di Duello prevale su quella persistente', () => {
  let rules = withRule(P.REPLACE_TRIGGER, {
    cardIds: [CARD.id],
    trigger: 'ultimaChance',
    persistent: true,
  });
  rules = applyPrimitiveToTriggerRules(
    rules,
    segment(P.REPLACE_TRIGGER, { cardIds: [CARD.id], trigger: 'imboscata' }),
    { ownerSide: SIDES.PLAYER, source: 'circuito' }
  );

  assert.equal(resolve('glory', rules).effectiveTrigger, 'imboscata');
});

test('sostituzione: a fine Duello la persistente torna in vigore', () => {
  let rules = withRule(P.REPLACE_TRIGGER, {
    cardIds: [CARD.id],
    trigger: 'ultimaChance',
    persistent: true,
  });
  rules = applyPrimitiveToTriggerRules(
    rules,
    segment(P.REPLACE_TRIGGER, { cardIds: [CARD.id], trigger: 'imboscata' }),
    { ownerSide: SIDES.PLAYER }
  );

  const afterDuel = expireDuelReplacements(rules);
  assert.equal(resolve('glory', afterDuel).effectiveTrigger, 'ultimaChance');
});

test('sostituzione: colpisce solo le carte indicate', () => {
  const rules = withRule(P.REPLACE_TRIGGER, { cardIds: [999], trigger: 'intervention' });
  assert.equal(resolve('imboscata', rules).effectiveTrigger, 'imboscata');
});

// ------------------------------------------------------------------
// Alias (§7.3 passo 2)
// ------------------------------------------------------------------

test('alias: aggiunge una condizione alternativa valida', () => {
  const rules = withRule(P.ALIAS_TRIGGER, {
    scope: TRIGGER_SCOPES.GLOBAL,
    map: { glory: ['vendetta'], vendetta: ['glory'] },
  });

  // Gloria non soddisfatta di suo, ma Vendetta sì: l'alternativa la rende soddisfatta.
  const state = resolve('glory', rules, { context: { lostPrevious: true } });
  assert.equal(state.naturalSatisfied, true);
  assert.equal(state.forced, false);
});

test('alias: non inventa soddisfazione quando nemmeno l\'alternativa regge', () => {
  const rules = withRule(P.ALIAS_TRIGGER, {
    scope: TRIGGER_SCOPES.GLOBAL,
    map: { glory: ['vendetta'] },
  });
  assert.equal(resolve('glory', rules).naturalSatisfied, false);
});

// ------------------------------------------------------------------
// Force / Forbid (§7.3 passo 3)
// ------------------------------------------------------------------

test('force: rende soddisfatto un trigger che non lo era', () => {
  const rules = withRule(P.FORCE_TRIGGER, { scope: TRIGGER_SCOPES.OWN, triggers: ['turbo'] });
  const state = resolve('turbo', rules);

  assert.equal(state.naturalSatisfied, false);
  assert.equal(state.satisfied, true);
  assert.equal(state.forced, true);
});

test('forbid: annulla un trigger naturalmente soddisfatto', () => {
  const rules = withRule(P.FORBID_TRIGGER, { scope: TRIGGER_SCOPES.OWN, triggers: ['imboscata'] });
  const state = resolve('imboscata', rules);

  assert.equal(state.naturalSatisfied, true);
  assert.equal(state.satisfied, false);
  assert.equal(state.forbidden, true);
});

test('precedenza: FORBID prevale su FORCE in conflitto diretto', () => {
  let rules = withRule(P.FORCE_TRIGGER, { scope: TRIGGER_SCOPES.GLOBAL, triggers: ['turbo'] });
  rules = applyPrimitiveToTriggerRules(
    rules,
    segment(P.FORBID_TRIGGER, { scope: TRIGGER_SCOPES.GLOBAL, triggers: ['turbo'] }),
    { ownerSide: SIDES.ENEMY, source: 'divieto' }
  );

  const state = resolve('turbo', rules);
  assert.equal(state.forbidden, true);
  assert.equal(state.forced, false);
  assert.equal(state.satisfied, false);
});

test('ambito: OWN non tocca l\'avversario, ENEMY non tocca sé stessi', () => {
  const own = withRule(P.FORCE_TRIGGER, { scope: TRIGGER_SCOPES.OWN, triggers: ['turbo'] }, SIDES.PLAYER);
  assert.equal(resolve('turbo', own, { side: SIDES.PLAYER }).satisfied, true);
  assert.equal(resolve('turbo', own, { side: SIDES.ENEMY }).satisfied, false);

  const enemy = withRule(P.FORBID_TRIGGER, { scope: TRIGGER_SCOPES.ENEMY, triggers: ['imboscata'] }, SIDES.PLAYER);
  assert.equal(resolve('imboscata', enemy, { side: SIDES.PLAYER }).satisfied, true);
  assert.equal(resolve('imboscata', enemy, { side: SIDES.ENEMY, context: { isFirst: true } }).satisfied, false);
});

test('ambito: GLOBAL colpisce entrambi i lati', () => {
  const rules = withRule(P.FORCE_TRIGGER, { scope: TRIGGER_SCOPES.GLOBAL, triggers: ['turbo'] });
  assert.equal(resolve('turbo', rules, { side: SIDES.PLAYER }).satisfied, true);
  assert.equal(resolve('turbo', rules, { side: SIDES.ENEMY }).satisfied, true);
});

test('soppressione Conquista: è un divieto con ambito nemico, non una categoria a sé', () => {
  const rules = withRule(P.SUPPRESS_CONQUEST, {}, SIDES.PLAYER);

  const enemyConquest = resolve('conquest', rules, {
    side: SIDES.ENEMY,
    context: { won: true },
  });
  const ownConquest = resolve('conquest', rules, {
    side: SIDES.PLAYER,
    context: { won: true },
  });

  assert.equal(enemyConquest.satisfied, false);
  assert.equal(enemyConquest.forbidden, true);
  assert.equal(ownConquest.satisfied, true);
});

// ------------------------------------------------------------------
// Disattivazione e blocco (§7.3 passi 4 e 5)
// ------------------------------------------------------------------

test('disattivazione: un trigger soddisfatto non implica un Potere risolto', () => {
  const state = resolve('imboscata', createTriggerRules(), { powerDisabled: true });
  assert.equal(state.satisfied, true);
  assert.equal(state.disabled, true);
  assert.equal(state.resolves, false);
});

test('blocco: il Blocca normale impedisce la risoluzione ma non la soddisfazione', () => {
  const state = resolve('imboscata', createTriggerRules(), { powerBlocked: true });
  assert.equal(state.satisfied, true);
  assert.equal(state.blocked, true);
  assert.equal(state.resolves, false);
});

test('non bloccabile: supera il Blocca normale', () => {
  const rules = withRule(P.UNBLOCKABLE_POWER, { scope: TRIGGER_SCOPES.OWN });
  const state = resolve('imboscata', rules, { powerBlocked: true });

  assert.equal(state.unblockable, true);
  assert.equal(state.blocked, false);
  assert.equal(state.resolves, true);
});

test('non bloccabile: non supera la disattivazione globale dei Poteri', () => {
  const rules = withRule(P.UNBLOCKABLE_POWER, { scope: TRIGGER_SCOPES.OWN });
  const state = resolve('imboscata', rules, { powerBlocked: true, powerDisabled: true });

  assert.equal(state.unblockable, true);
  assert.equal(state.blocked, false);
  assert.equal(state.disabled, true);
  assert.equal(state.resolves, false);
});

test('categorie distinte: disattivazione e blocco non si confondono', () => {
  const onlyDisabled = resolve('imboscata', createTriggerRules(), { powerDisabled: true });
  const onlyBlocked = resolve('imboscata', createTriggerRules(), { powerBlocked: true });

  assert.deepEqual(
    [onlyDisabled.disabled, onlyDisabled.blocked],
    [true, false]
  );
  assert.deepEqual(
    [onlyBlocked.disabled, onlyBlocked.blocked],
    [false, true]
  );
});

// ------------------------------------------------------------------
// Lettura per Orathai (§12.6)
// ------------------------------------------------------------------

test('requisito di attivazione: letto prima di force, forbid e blocchi', () => {
  let rules = withRule(P.FORCE_TRIGGER, { scope: TRIGGER_SCOPES.GLOBAL, triggers: ['turbo'] });
  rules = applyPrimitiveToTriggerRules(
    rules,
    segment(P.FORBID_TRIGGER, { scope: TRIGGER_SCOPES.GLOBAL, triggers: ['imboscata'] }),
    { ownerSide: SIDES.PLAYER }
  );

  assert.equal(
    resolveActivationRequirement({
      originalTrigger: 'turbo',
      context: ctx(),
      card: CARD,
      side: SIDES.PLAYER,
      triggerRules: rules,
    }).naturalSatisfied,
    false
  );
  assert.equal(
    resolveActivationRequirement({
      originalTrigger: 'imboscata',
      context: ctx(),
      card: CARD,
      side: SIDES.PLAYER,
      triggerRules: rules,
    }).naturalSatisfied,
    true
  );
});

// ------------------------------------------------------------------
// Il Grande Semaforo attraverso il catalogo, senza logica dedicata
// ------------------------------------------------------------------

const semaforoRules = (abilityId, ownerSide = SIDES.PLAYER) => {
  const ability = EMINENCES.patto_grande_semaforo.abilities.find((a) => a.id === abilityId);
  return buildTriggerRulesFromSegments(
    ability.segments.map((s) => ({ segment: s, ownerSide, abilityId }))
  );
};

test('Semaforo Verde: Imboscata e Turbo soddisfatti, Intervento e Ultima Chance vietati', () => {
  const rules = semaforoRules('semaforo_verde');

  assert.equal(resolve('imboscata', rules).satisfied, true);
  assert.equal(resolve('turbo', rules).satisfied, true);
  assert.equal(resolve('intervention', rules).satisfied, false);
  assert.equal(resolve('ultimaChance', rules).satisfied, false);
});

test('Semaforo Rosso: il divieto batte anche una condizione naturalmente vera', () => {
  const rules = semaforoRules('semaforo_rosso');

  const imboscata = resolve('imboscata', rules);
  assert.equal(imboscata.naturalSatisfied, true);
  assert.equal(imboscata.satisfied, false);

  assert.equal(resolve('turbo', rules).satisfied, false);
  assert.equal(resolve('intervention', rules).satisfied, true);
  assert.equal(resolve('ultimaChance', rules).satisfied, true);
});

test('Semaforo Giallo: nessuna regola depositata, condizioni normali', () => {
  const rules = semaforoRules('semaforo_giallo');

  assert.deepEqual(rules.forceSatisfied, []);
  assert.deepEqual(rules.forceForbidden, []);
  assert.equal(resolve('imboscata', rules).satisfied, true);
  assert.equal(resolve('turbo', rules).satisfied, false);
});

test('Semaforo: l\'effetto è simmetrico, colpisce anche l\'avversario', () => {
  const rules = semaforoRules('semaforo_rosso', SIDES.PLAYER);
  assert.equal(resolve('turbo', rules, { side: SIDES.ENEMY }).satisfied, false);
  assert.equal(resolve('ultimaChance', rules, { side: SIDES.ENEMY }).satisfied, true);
});

test('Semaforo contro Semaforo: a colori concorrenti vale FORBID > FORCE', () => {
  // Punto ancora aperto nella specifica (§11.8): qui si fissa solo la base già decisa.
  const verde = semaforoRules('semaforo_verde', SIDES.PLAYER);
  const rules = EMINENCES.patto_grande_semaforo.abilities
    .find((a) => a.id === 'semaforo_rosso')
    .segments.reduce(
      (acc, s) => applyPrimitiveToTriggerRules(acc, s, { ownerSide: SIDES.ENEMY, source: 'semaforo_rosso' }),
      verde
    );

  // Verde forza Imboscata, Rosso la vieta: prevale il divieto, per entrambi i lati.
  assert.equal(resolve('imboscata', rules, { side: SIDES.PLAYER }).satisfied, false);
  assert.equal(resolve('imboscata', rules, { side: SIDES.ENEMY }).satisfied, false);
  assert.equal(resolve('turbo', rules).satisfied, false);
  assert.equal(resolve('intervention', rules).satisfied, false);
  assert.equal(resolve('ultimaChance', rules).satisfied, false);
});

// ------------------------------------------------------------------
// Immutabilità
// ------------------------------------------------------------------

test('immutabilità: depositare una regola non muta l\'overlay di partenza', () => {
  const base = createTriggerRules();
  const next = applyPrimitiveToTriggerRules(base, segment(P.FORCE_TRIGGER, { triggers: ['turbo'] }), {
    ownerSide: SIDES.PLAYER,
  });

  assert.equal(base.forceSatisfied.length, 0);
  assert.equal(next.forceSatisfied.length, 1);
});

test('immutabilità: una primitiva estranea ai trigger lascia l\'overlay invariato', () => {
  const base = createTriggerRules();
  const next = applyPrimitiveToTriggerRules(base, segment(P.MODIFY_STAT, { stat: 'power', delta: 1 }), {
    ownerSide: SIDES.PLAYER,
  });
  assert.equal(next, base);
});
