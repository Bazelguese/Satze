import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EMINENCES,
  EMINENCE_IDS,
  IMPLEMENTED_EMINENCE_IDS,
} from '../../data/eminences.js';
import { TRIGGER_NAMES } from '../../data/triggers.js';

function implementedEminences() {
  return IMPLEMENTED_EMINENCE_IDS.map((id) => EMINENCES[id]).filter(Boolean);
}

function allCatalogEminences() {
  return EMINENCE_IDS.map((id) => EMINENCES[id]).filter(Boolean);
}

function allTexts(eminence) {
  const texts = [];
  if (eminence.static?.text) {
    texts.push({ label: 'static', name: eminence.static.name, text: eminence.static.text });
  }
  for (const ability of eminence.abilities || []) {
    texts.push({ label: ability.id, name: ability.name, text: ability.text });
  }
  return texts;
}

test('copy: la lista implementata deriva da IMPLEMENTED_EMINENCE_IDS', () => {
  assert.ok(IMPLEMENTED_EMINENCE_IDS.length >= 1);
  for (const id of IMPLEMENTED_EMINENCE_IDS) {
    assert.equal(EMINENCES[id].implemented, true, `${id} in export ma implemented≠true`);
  }
  for (const id of EMINENCE_IDS) {
    if (!EMINENCES[id].implemented) continue;
    assert.ok(
      IMPLEMENTED_EMINENCE_IDS.includes(id),
      `${id} ha implemented:true ma manca dall'export`,
    );
  }
});

test('copy: nessun testo del catalogo ripete il prefisso NomeAbilità:', () => {
  for (const eminence of allCatalogEminences()) {
    for (const entry of allTexts(eminence)) {
      if (!entry.name) continue;
      assert.ok(
        !entry.text.startsWith(`${entry.name}:`),
        `${eminence.id}/${entry.label}: prefisso ridondante nel testo`,
      );
    }
  }
});

test('copy: testi implementati usano abbreviazioni stat in maiuscolo', () => {
  const lowerStatPattern = /\b(pot|dan|va|pv|fc)\b/;
  for (const eminence of implementedEminences()) {
    for (const entry of allTexts(eminence)) {
      const lowerHits = entry.text.match(lowerStatPattern);
      assert.equal(
        lowerHits,
        null,
        `${eminence.id}/${entry.label}: stat minuscola in "${entry.text}"`,
      );
    }
  }
});

test('copy: trigger citati nel Patto usano nomi UI canonici', () => {
  const semaforo = EMINENCES.patto_grande_semaforo;
  const triggerNames = new Set(Object.values(TRIGGER_NAMES));
  for (const ability of semaforo.abilities) {
    for (const name of triggerNames) {
      if (!ability.text.includes(name)) continue;
      assert.ok(
        ability.text.includes(name),
        `trigger ${name} presente con casing canonico`,
      );
    }
  }
});

test('copy: nessun testo implementato usa "controllore" o "effetto scatta"', () => {
  const banned = [/controllore/i, /effetto scatta/i, /capacità/i];
  for (const eminence of implementedEminences()) {
    for (const entry of allTexts(eminence)) {
      for (const pattern of banned) {
        assert.ok(
          !pattern.test(entry.text),
          `${eminence.id}/${entry.label}: copy vietata in "${entry.text}"`,
        );
      }
    }
  }
});

test('copy: abilità con param slot usano "slot" nel catalogo, non "Scegli un Campo"', () => {
  for (const eminence of implementedEminences()) {
    for (const ability of eminence.abilities || []) {
      if (!ability.paramsSchema?.slot) continue;
      assert.ok(
        !/Scegli un Campo/i.test(ability.text),
        `${eminence.id}/${ability.id}: usare "Scegli uno slot" nel catalogo`,
      );
      assert.match(
        ability.text,
        /slot/i,
        `${eminence.id}/${ability.id}: manca "slot" nel testo catalogo`,
      );
    }
  }
});

test('copy: Khemet Convalida distingue attivazione reale del Potere', () => {
  const devozione = EMINENCES.khemet_maledizioni.abilities.find((a) => a.id === 'khemet_devozione');
  assert.match(devozione.text, /si attiva realmente/i);
});

test('copy: pavimenti min usano il registro (min N), non "minimo N PV"', () => {
  for (const eminence of allCatalogEminences()) {
    for (const entry of allTexts(eminence)) {
      assert.ok(
        !/\bminimo\s+\d+\s*PV\b/i.test(entry.text),
        `${eminence.id}/${entry.label}: usare "(min N)" come le carte Agente`,
      );
    }
  }
});

test('copy: Orathai Statico non collide con il nome Risonanza di Khemet', () => {
  assert.notEqual(EMINENCES.orathai_primo_canto.static.name, 'Risonanza');
  assert.notEqual(
    EMINENCES.orathai_primo_canto.static.name,
    EMINENCES.khemet_maledizioni.static.name,
  );
});
