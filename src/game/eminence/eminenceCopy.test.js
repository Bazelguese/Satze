import test from 'node:test';
import assert from 'node:assert/strict';

import { EMINENCES } from '../../data/eminences.js';
import { TRIGGER_NAMES } from '../../data/triggers.js';

const STAT_TOKENS = ['POT', 'DAN', 'VA', 'PV', 'FC'];
const IMPLEMENTED_IDS = [
  'apex_sole_verde',
  'patto_grande_semaforo',
  'mascarada_organizzatore',
  'kethran_altare',
  'mounthborn_fame',
  'khemet_maledizioni',
  'figli_domanda_senza_fine',
  'corte_rossa',
];

function implementedEminences() {
  return IMPLEMENTED_IDS.map((id) => EMINENCES[id]).filter(Boolean);
}

function allTexts(eminence) {
  const texts = [];
  if (eminence.static?.text) texts.push({ label: 'static', text: eminence.static.text });
  for (const ability of eminence.abilities || []) {
    texts.push({ label: ability.id, name: ability.name, text: ability.text });
  }
  return texts;
}

test('copy: le abilità implementate non ripetono il prefisso NomeAbilità:', () => {
  for (const eminence of implementedEminences()) {
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
