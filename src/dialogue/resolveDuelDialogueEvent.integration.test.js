import { describe, expect, it } from 'vitest';
import { ARMY_SETS } from '../data/cards.js';
import { buildDuelDialogueForPhase } from './buildDuelDialogueLine.js';
import { createDialogueSession } from './resolveDuelDialogueEvent.js';
import {
  inferStatNemicoBands,
  resolveConstatazioneEventKey,
  resolveDuelPhaseEventKey,
  resolveOpportunistTriggerEventKey,
  resolvePhase1EventKey,
  resolveTriggerEventKey,
} from './resolveDuelDialogueEvent.js';

function mockBattle(overrides = {}) {
  const playerAgent = ARMY_SETS['Ratti della Megera'].find((c) => c.id === 801);
  const enemyAgent = ARMY_SETS['Corte Rossa'].find((c) => c.id === 301);
  return {
    winner: 'player',
    playerAgent: { ...playerAgent, army: 'Ratti della Megera' },
    enemyAgent: { ...enemyAgent, army: 'Corte Rossa' },
    playerAbilityTriggered: true,
    enemyAbilityTriggered: false,
    playerToxinActivated: false,
    enemyToxinActivated: false,
    ...overrides,
  };
}

describe('resolveDuelDialogueEvent', () => {
  it('inferisce fasce stat nemiche', () => {
    expect(inferStatNemicoBands({ power: 6, damage: 4 })).toContain('colosso');
    expect(inferStatNemicoBands({ power: 2, damage: 1 })).toContain('fragile');
    expect(inferStatNemicoBands({ power: 4, damage: 5 })).toContain('spinato');
  });

  it('fase 1: trigger preVa quando potere scatta', () => {
    const br = mockBattle({ enemyAbilityTriggered: true });
    expect(resolveTriggerEventKey(br.enemyAgent, 'enemy', br)).toBe('triggerAttivato');
  });

  it('fase 0: entrata solo se scritta (armata senza file dialoghi → silenzio)', () => {
    const br = mockBattle({
      playerAgent: { id: 999, name: 'Test', army: 'Kethran', power: 3, damage: 2 },
    });
    expect(resolveDuelPhaseEventKey(0, 'player', br)).toBeNull();
  });

  it('fase 7: morte solo se scritta (Ratti no, Corte sì)', () => {
    const br = mockBattle();
    expect(resolveDuelPhaseEventKey(7, 'player', br)).toBeNull();
    const brCorte = mockBattle({
      playerAgent: {
        ...ARMY_SETS['Corte Rossa'].find((c) => c.id === 301),
        army: 'Corte Rossa',
      },
    });
    expect(resolveDuelPhaseEventKey(7, 'player', brCorte)).toBe('morte');
  });

  it('fase 1: reattivo prima di senzaTossina', () => {
    const br = mockBattle({
      enemyAgent: {
        ...ARMY_SETS['Ratti della Megera'].find((c) => c.id === 816),
        army: 'Ratti della Megera',
      },
    });
    expect(
      resolveConstatazioneEventKey(br.playerAgent, br.enemyAgent, br, 'player')
    ).toBe('reattivo.Ratti della Megera');
  });

  it('fase 1: senzaTossina se nemico non ha stack Tossina', () => {
    const br = mockBattle({
      playerAgent: {
        ...ARMY_SETS['Ratti della Megera'].find((c) => c.id === 801),
        army: 'Ratti della Megera',
      },
      enemyAgent: {
        ...ARMY_SETS['Corte Rossa'].find((c) => c.id === 301),
        army: 'Corte Rossa',
      },
      enemyToxinActivated: false,
    });
    expect(
      resolveConstatazioneEventKey(br.playerAgent, br.enemyAgent, br, 'player')
    ).toBe('statNemico.senzaTossina');
  });

  it('fase 1: potAlta se nemico POT > 5', () => {
    const br = mockBattle({
      playerAgent: {
        ...ARMY_SETS['Ratti della Megera'].find((c) => c.id === 802),
        army: 'Ratti della Megera',
      },
      enemyAgent: {
        ...ARMY_SETS['Corte Rossa'].find((c) => c.id === 301),
        army: 'Corte Rossa',
        power: 6,
        damage: 4,
      },
    });
    expect(
      resolveConstatazioneEventKey(br.playerAgent, br.enemyAgent, br, 'player')
    ).toBe('statNemico.potAlta');
  });

  it('fase 1: constatazione ha priorità su trigger preVa', () => {
    const br = mockBattle({
      playerAgent: {
        ...ARMY_SETS['Ratti della Megera'].find((c) => c.id === 802),
        army: 'Ratti della Megera',
      },
      enemyAgent: {
        ...ARMY_SETS['Corte Rossa'].find((c) => c.id === 301),
        army: 'Corte Rossa',
        power: 6,
        damage: 4,
      },
      playerAbilityTriggered: true,
    });
    expect(resolvePhase1EventKey(br.playerAgent, br.enemyAgent, 'player', br)).toBe(
      'statNemico.potAlta'
    );
  });

  it('fase 2: trigger Opportunista', () => {
    const br = mockBattle({
      playerAgent: {
        ...ARMY_SETS['Ratti della Megera'].find((c) => c.id === 804),
        army: 'Ratti della Megera',
      },
      playerAbilityTriggered: true,
    });
    expect(resolveOpportunistTriggerEventKey(br.playerAgent, 'player', br)).toBe(
      'triggerAttivato'
    );
    expect(resolveDuelPhaseEventKey(2, 'player', br)).toBe('triggerAttivato');
  });

  it('fase 2: niente trigger preVa per Opportunista in phase 1', () => {
    const br = mockBattle({
      playerAgent: {
        ...ARMY_SETS['Ratti della Megera'].find((c) => c.id === 804),
        army: 'Ratti della Megera',
      },
      playerAbilityTriggered: true,
    });
    expect(resolveDuelPhaseEventKey(1, 'player', br)).toBeNull();
  });

  it('fase 3: silenzio (constatazione spostata in phase 1)', () => {
    const br = mockBattle();
    expect(resolveDuelPhaseEventKey(3, 'player', br)).toBeNull();
  });

  it('fasi 4: nessun evento', () => {
    const br = mockBattle();
    expect(resolveDuelPhaseEventKey(4, 'player', br)).toBeNull();
  });

  it('Ratti: niente fallback se manca la riga (es. morte)', () => {
    const ratti801 = ARMY_SETS['Ratti della Megera'].find((c) => c.id === 801);
    const ratti816 = ARMY_SETS['Ratti della Megera'].find((c) => c.id === 816);
    const br = mockBattle({
      playerAgent: { ...ratti801, army: 'Ratti della Megera' },
      enemyAgent: { ...ratti816, army: 'Ratti della Megera' },
    });
    expect(resolveDuelPhaseEventKey(7, 'player', br)).toBeNull();
    expect(resolveDuelPhaseEventKey(7, 'enemy', br)).toBeNull();
    const session = createDialogueSession();
    const morte = buildDuelDialogueForPhase(br, 7, false, session);
    expect(morte).toHaveLength(0);
  });

  it('Ratti: entrata solo da dialoghiRatti.js', () => {
    const br = mockBattle();
    const session = createDialogueSession();
    const deploy = buildDuelDialogueForPhase(br, 0, false, session);
    expect(deploy).toHaveLength(2);
    expect(deploy[0].text).toContain('sale');
    expect(deploy[0].text).not.toContain('si schiera');
  });

  it('fase 5: esito con variante trigger (808 perde+Ultimo Desiderio)', () => {
    const br = mockBattle({
      winner: 'enemy',
      playerAgent: {
        ...ARMY_SETS['Ratti della Megera'].find((c) => c.id === 808),
        army: 'Ratti della Megera',
      },
      playerAbilityTriggered: true,
    });
    expect(resolveDuelPhaseEventKey(5, 'player', br)).toBe('perdeConTrigger');
    const session = createDialogueSession();
    const lines = buildDuelDialogueForPhase(br, 5, false, session);
    expect(lines[0].text).toContain('pentirai');
  });

  it('fase 5: solo righe scritte (niente fallback generici)', () => {
    const session = createDialogueSession();
    const br = mockBattle();
    const outcome = buildDuelDialogueForPhase(br, 5, false, session);
    expect(outcome).toHaveLength(2);
    expect(outcome[0].eventKey).toBe('vince');
    expect(outcome[0].army).toBe('ratti');
    expect(outcome[1].eventKey).toBe('perde');
    expect(outcome[1].text).not.toContain('cede');
    expect(outcome[0].text).not.toContain('trionfa');
  });
});
