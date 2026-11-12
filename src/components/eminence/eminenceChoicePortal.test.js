import test from 'node:test';
import assert from 'node:assert/strict';

import { CHOICE_PORTAL_CLOSED, CHOICE_PORTAL_OPEN, PLATE_GAP, PLATE_T, answerPlates, answerSpan, ellipsePoint } from './eminenceChoiceGeometry.js';

const { rx, ry } = CHOICE_PORTAL_OPEN;

test('portale: aperto ha le stesse proporzioni di quello a riposo', () => {
  assert.ok(Math.abs(rx / ry - CHOICE_PORTAL_CLOSED.rx / CHOICE_PORTAL_CLOSED.ry) < 0.005);
});

test('placche: lo scostamento lungo la normale dà spessore costante', () => {
  for (const deg of [30, 60, 90, 120, 150]) {
    const [x0, y0] = ellipsePoint(rx, ry, deg, PLATE_GAP);
    const [x1, y1] = ellipsePoint(rx, ry, deg, PLATE_GAP + PLATE_T);
    assert.ok(Math.abs(Math.hypot(x1 - x0, y1 - y0) - PLATE_T) < 1e-6, `spessore a ${deg}°`);
  }
});

test('placche: una per risposta, da sinistra a destra, simmetriche sul fondo', () => {
  for (const n of [1, 2, 3, 4]) {
    const plates = answerPlates(n);
    assert.equal(plates.length, n);
    const xs = plates.map((p) => p.push[0]);
    assert.deepEqual([...xs].sort((a, b) => a - b), xs, `${n} risposte in ordine`);
    assert.ok(Math.abs(xs[0] + xs[n - 1]) < 1e-6, `${n} risposte simmetriche`);
    assert.ok(plates.every((p) => p.shape.endsWith('Z') && p.push[1] > 0));
  }
  assert.ok(answerSpan(3) > answerSpan(2) && answerSpan(2) > answerSpan(1));
});
