import test from 'node:test';
import assert from 'node:assert/strict';

import { EMINENCES, EMINENCE_IDS } from '../../data/eminences.js';
import {
  EMINENCE_PRIMITIVES,
  EFFECT_TIMINGS,
  PRIMITIVE_TARGETS,
  PRIMITIVE_ALLOWED_TARGETS,
} from './eminenceConstants.js';
import { CONDITION_KEYS } from './effectConditions.js';
import { getSupportedPrimitives } from './primitiveHandlers.js';

const KNOWN_PRIMITIVES = new Set(Object.values(EMINENCE_PRIMITIVES));
const KNOWN_TIMINGS = new Set(Object.values(EFFECT_TIMINGS));
const KNOWN_TARGETS = new Set(Object.values(PRIMITIVE_TARGETS));
const KNOWN_CONDITION_KEYS = new Set(CONDITION_KEYS);
const SUPPORTED = new Set(getSupportedPrimitives());

function* catalogSegments() {
  for (const id of EMINENCE_IDS) {
    const eminence = EMINENCES[id];
    const staticDef = eminence.static;
    if (staticDef?.segments) {
      for (const [index, segment] of staticDef.segments.entries()) {
        yield { path: `${id}.static[${index}]`, segment };
      }
    }
    if (staticDef?.setupSegments) {
      for (const [index, segment] of staticDef.setupSegments.entries()) {
        yield { path: `${id}.static.setup[${index}]`, segment, setup: true };
      }
    }
    for (const ability of eminence.abilities || []) {
      if (!ability.segments) continue;
      for (const [index, segment] of ability.segments.entries()) {
        yield { path: `${id}.${ability.id}[${index}]`, segment };
      }
    }
  }
}

test('schema: ogni primitiva del catalogo è nota e ha un handler', () => {
  for (const { path, segment } of catalogSegments()) {
    assert.ok(segment.primitive, `${path}: manca primitive`);
    assert.ok(
      KNOWN_PRIMITIVES.has(segment.primitive),
      `${path}: primitiva sconosciuta "${segment.primitive}"`,
    );
    assert.ok(
      SUPPORTED.has(segment.primitive),
      `${path}: primitiva senza handler "${segment.primitive}"`,
    );
  }
});

test('schema: ogni timing di segmento è in EFFECT_TIMINGS (salvo setup)', () => {
  for (const { path, segment, setup } of catalogSegments()) {
    if (setup) {
      assert.equal(
        segment.timing,
        undefined,
        `${path}: i setupSegments non usano timing di round`,
      );
      continue;
    }
    assert.ok(segment.timing, `${path}: manca timing`);
    assert.ok(
      KNOWN_TIMINGS.has(segment.timing),
      `${path}: timing sconosciuto "${segment.timing}" — il segmento non scatterebbe mai`,
    );
  }
});

test('schema: target ammesso dalla primitiva', () => {
  for (const { path, segment } of catalogSegments()) {
    const allowed = PRIMITIVE_ALLOWED_TARGETS[segment.primitive];
    assert.ok(allowed, `${path}: manca PRIMITIVE_ALLOWED_TARGETS per ${segment.primitive}`);

    const target = segment.target ?? null;
    if (target != null) {
      assert.ok(
        KNOWN_TARGETS.has(target),
        `${path}: target sconosciuto "${target}"`,
      );
    }
    assert.ok(
      allowed.includes(target),
      `${path}: target ${JSON.stringify(target)} non ammesso per ${segment.primitive}`,
    );
  }
});

test('schema: ogni chiave di condition esiste nel vocabolario', () => {
  for (const { path, segment } of catalogSegments()) {
    if (!segment.condition) continue;
    for (const key of Object.keys(segment.condition)) {
      assert.ok(
        KNOWN_CONDITION_KEYS.has(key),
        `${path}: condition key sconosciuta "${key}" — aggiungere a CONDITION_KEYS`,
      );
    }
  }
});

test('schema: PRIMITIVE_ALLOWED_TARGETS copre tutte le primitive note', () => {
  for (const primitive of KNOWN_PRIMITIVES) {
    assert.ok(
      PRIMITIVE_ALLOWED_TARGETS[primitive],
      `manca PRIMITIVE_ALLOWED_TARGETS[${primitive}]`,
    );
  }
});
