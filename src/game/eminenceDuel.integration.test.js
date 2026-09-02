/**
 * Test di integrazione: il bundle Eminenza attraversa la catena reale fino a
 * `computeDuelResolution`. Percorre l'intero innesto — catalogo, gate, primitive, overlay —
 * invece di iniettare un overlay costruito a mano.
 */
import { describe, it, expect } from 'vitest';

import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { createEminenceMatchState } from './eminence/eminenceState.js';
import {
  beginEminenceRound,
  collectPendingEffects,
  completeGate,
  selectEminenceAbility,
} from './eminence/eminenceRound.js';
import { applyEminenceSegments } from './eminence/primitiveHandlers.js';
import { openEminenceRound } from './eminence/eminenceDuelGate.js';
import { applyFieldOperations } from './eminence/fieldOperations.js';
import {
  EFFECT_TIMINGS,
  EMINENCE_FORMAT,
  REVEAL_GATES,
  SIDES,
} from './eminence/eminenceConstants.js';

const neutralField = ALL_BATTLEFIELDS.find((f) => f.id === 51);

function agent(name, army, ability) {
  return { name, army, power: 4, damage: 3, league: 2, ability };
}

const baseInput = {
  field: neutralField,
  selectedFocus: 2,
  enemySelectedFocus: 2,
  playerHP: 20,
  enemyHP: 20,
  playerFocus: 6,
  enemyFocus: 6,
  playerUsedCards: [],
  enemyUsedCards: [],
  // Il giocatore risponde. Imboscata è quindi naturalmente falsa per lui e vera per
  // l'avversario: lo stesso trigger cade sui due lati in modo opposto, e un overlay che
  // sbagliasse lato si vedrebbe subito.
  isPlayerFirst: false,
  lastWinner: null,
  playerArmyBonuses: {},
  enemyArmyBonuses: {},
  playerToxin: null,
  enemyToxin: null,
  roundNumber: 1,
  conqueredFields: {},
  playerHand: [],
  enemyHand: [],
  currentFieldIndex: 0,
  selectedAgent: agent('Tu', 'Patto degli Indocili', {
    trigger: 'imboscata',
    effect: 'power',
    value: 2,
  }),
  enemyAgent: agent('IA', 'Kethran', {
    trigger: 'imboscata',
    effect: 'power',
    value: 2,
  }),
};

/**
 * Esegue il round Eminenza fino al Duello e restituisce il bundle dovuto prima
 * del controllo dei trigger.
 */
function bundleForAbility(abilityId, { presence = null, eminenceId = 'patto_grande_semaforo' } = {}) {
  let matchState = createEminenceMatchState({
    format: EMINENCE_FORMAT.REQUIRED,
    playerEminenceId: eminenceId,
    enemyEminenceId: null,
  });

  if (presence != null) {
    matchState = {
      ...matchState,
      [SIDES.PLAYER]: { ...matchState[SIDES.PLAYER], presence },
    };
  }

  matchState = beginEminenceRound(matchState, { roundNumber: 1 });

  const selection = selectEminenceAbility(matchState, SIDES.PLAYER, abilityId);
  expect(selection.ok).toBe(true);

  const opened = completeGate(selection.matchState, REVEAL_GATES.GENERAL, {
    initiativeSide: SIDES.ENEMY,
  });
  const { queue } = collectPendingEffects(opened.matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {
    initiativeSide: SIDES.ENEMY,
  });

  return applyEminenceSegments([...opened.resolutionQueue, ...queue]);
}

describe('Eminenze nel Duello reale', () => {
  it('senza Eminenza il Duello si comporta come prima', () => {
    const { battleResult } = computeDuelResolution({ ...baseInput });

    expect(battleResult.playerPower).toBe(4);
    expect(battleResult.enemyPower).toBe(6);
  });

  it('Semaforo Verde accende Imboscata su chi non ha l\'iniziativa', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      eminenceBundle: bundleForAbility('semaforo_verde'),
    });

    expect(battleResult.playerPower).toBe(6);
    expect(battleResult.enemyPower).toBe(6);
  });

  it('Semaforo Rosso spegne Imboscata anche sul lato avversario', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      eminenceBundle: bundleForAbility('semaforo_rosso', { presence: 2 }),
    });

    // Il divieto è di ambito globale e nasce dal giocatore: se il lato venisse letto male,
    // il Potere avversario resterebbe attivo a 6.
    expect(battleResult.playerPower).toBe(4);
    expect(battleResult.enemyPower).toBe(4);
  });

  it('Semaforo Giallo non deposita regole e lascia il Duello identico al naturale', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      eminenceBundle: bundleForAbility('semaforo_giallo'),
    });

    expect(battleResult.playerPower).toBe(4);
    expect(battleResult.enemyPower).toBe(6);
  });

  it('Apex Furia: +1 POT all\'Agente e 2 PV al controllore', () => {
    const bundle = bundleForAbility('apex_furia', { eminenceId: 'apex_sole_verde' });
    const { battleResult } = computeDuelResolution({ ...baseInput, eminenceBundle: bundle });

    expect(battleResult.playerPower).toBe(5);
    // Il costo in PV precede il Duello, quindi il danno della sconfitta parte da 18.
    expect(battleResult.finalPlayerHP).toBeLessThanOrEqual(18);
  });

  it('Apex Cataclisma: +2 POT e +2 DAN entrano già nello schieramento', () => {
    const bundle = bundleForAbility('apex_cataclisma', {
      eminenceId: 'apex_sole_verde',
      presence: 4,
    });
    const { battleResult } = computeDuelResolution({ ...baseInput, eminenceBundle: bundle });

    expect(battleResult.playerPower).toBe(6);
    expect(battleResult.playerDamage).toBe(5);

    // Lo schieramento è il punto in cui l'Eminenza ha agito: non deve comparire uno step
    // di setup Campo che attribuisca la modifica al Campo.
    const deploy = battleResult.visualSteps[0];
    expect(deploy.kind).toBe('deploy');
    expect(deploy.playerPower).toBe(6);
    expect(battleResult.visualSteps.some((step) => step.kind === 'fieldSetup')).toBe(false);
  });

  it('gli effetti dell\'Eminenza compaiono nel log come eventi di schieramento', () => {
    const bundle = bundleForAbility('apex_furia', { eminenceId: 'apex_sole_verde' });
    const { battleResult } = computeDuelResolution({ ...baseInput, eminenceBundle: bundle });

    const eminenceEvents = battleResult.events.filter((e) => e.source?.kind === 'eminence');
    expect(eminenceEvents.length).toBeGreaterThan(0);
    // Classificati allo schieramento: il log non deve attribuirli a un Potere o al Campo.
    expect(eminenceEvents.every((e) => e.phase === 'deploy')).toBe(true);

    const hpEvent = eminenceEvents.find((e) => e.stat === 'PV');
    expect(hpEvent.before - hpEvent.after).toBe(2);
    expect(hpEvent.source.id).toBe('apex_furia');

    const powerEvent = eminenceEvents.find((e) => e.stat === 'POT');
    expect(powerEvent.after - powerEvent.before).toBe(1);
  });

  it('gli FC temporanei alzano il VA ma non intaccano il pool', () => {
    const bundle = applyEminenceSegments([
      {
        ownerSide: SIDES.PLAYER,
        abilityId: 'test_fc_temporanei',
        segment: { primitive: 'GRANT_TEMPORARY_FOCUS', target: 'SELF', amount: 2 },
      },
    ]);

    const baseline = computeDuelResolution({ ...baseInput }).battleResult;
    const withTemp = computeDuelResolution({ ...baseInput, eminenceBundle: bundle }).battleResult;

    expect(withTemp.playerAssault).toBeGreaterThan(baseline.playerAssault);
    // La spesa reale resta quella investita: il pool finale non cambia.
    expect(withTemp.finalPlayerFC).toBe(baseline.finalPlayerFC);
  });

  it('il lato si legge dal contesto: un overlay non travasa fra i due agenti', () => {
    const bundle = bundleForAbility('semaforo_verde');
    // Regole di ambito globale: devono valere per entrambi i lati, non per il solo autore.
    expect(bundle.triggerRules.forceSatisfied).toHaveLength(1);
    expect(bundle.triggerRules.forceForbidden).toHaveLength(1);
    expect(bundle.triggerRules.forceSatisfied[0].ownerSide).toBe(SIDES.PLAYER);
  });
});

/**
 * «Il prossimo Agente ignora tutti gli effetti del Campo» ha una portata delimitata: cade
 * ciò che il Campo fa all'Agente, resta ciò che decide chi vince.
 */
describe('Disprezzo: portata di “ignora gli effetti del Campo”', () => {
  const fieldById = (id) => ALL_BATTLEFIELDS.find((f) => f.id === id);
  const veil = () => bundleForAbility('apex_disprezzo', { eminenceId: 'apex_sole_verde' });

  it('i modificatori di statistica cadono sul lato velato e restano sull\'altro', () => {
    // Nido dei Grifoni (5): −2 DAN a entrambi.
    const input = { ...baseInput, field: fieldById(5) };

    const plain = computeDuelResolution(input).battleResult;
    const veiled = computeDuelResolution({ ...input, eminenceBundle: veil() }).battleResult;

    expect(plain.playerDamage).toBe(1);
    expect(veiled.playerDamage).toBe(3);
    // L'avversario continua a subirlo: il velo è di un lato, non del tavolo.
    expect(veiled.enemyDamage).toBe(plain.enemyDamage);
  });

  it('un trigger reso sempre attivo dal Campo non raggiunge il lato velato', () => {
    // Ninfea di Miele (49): Imboscata sempre attiva. Il giocatore risponde, quindi senza
    // Campo la sua Imboscata sarebbe falsa.
    const input = { ...baseInput, field: fieldById(49) };

    const plain = computeDuelResolution(input).battleResult;
    const veiled = computeDuelResolution({ ...input, eminenceBundle: veil() }).battleResult;

    expect(plain.playerPower).toBe(6);
    expect(veiled.playerPower).toBe(4);
  });

  it('il cap di DAN del Campo non si applica al lato velato', () => {
    // Nexus Arcano (15): DAN massimo 4.
    const heavy = (name, army) => ({ name, army, power: 4, damage: 6, league: 2, ability: null });
    const input = {
      ...baseInput,
      field: fieldById(15),
      selectedAgent: heavy('Tu', 'Patto degli Indocili'),
      enemyAgent: heavy('IA', 'Kethran'),
    };

    const plain = computeDuelResolution(input).battleResult;
    const veiled = computeDuelResolution({ ...input, eminenceBundle: veil() }).battleResult;

    expect(plain.playerDamage).toBe(4);
    expect(veiled.playerDamage).toBe(6);
    expect(veiled.enemyDamage).toBe(4);
  });

  it('il log dichiara chi ignora il Campo, perché le righe del Campo restano', () => {
    const input = { ...baseInput, field: fieldById(5), eminenceBundle: veil() };
    const { battleResult } = computeDuelResolution(input);

    const declared = battleResult.events.find((e) => e.ruleCode === 'fieldIgnoredByAgent');
    expect(declared).toBeDefined();
    expect(declared.target.side).toBe('local');
    expect(declared.params.structuralRulesStillApply).toBe(true);
  });

  it('la condizione di vittoria del Campo resta valida anche per il lato velato', () => {
    // Arena delle Scaglie (62): vince chi ha investito più FC, non chi ha il VA più alto.
    // Qui le due letture divergono: a VA vincerebbe l'avversario.
    const quiet = (name, army, power) => ({
      name,
      army,
      power,
      damage: 3,
      league: 2,
      ability: { trigger: 'gloria', effect: 'power', value: 0 },
    });
    const input = {
      ...baseInput,
      field: fieldById(62),
      selectedAgent: quiet('Tu', 'Patto degli Indocili', 1),
      enemyAgent: quiet('IA', 'Kethran', 10),
      selectedFocus: 5,
      enemySelectedFocus: 1,
      eminenceBundle: veil(),
    };

    const result = computeDuelResolution(input).battleResult;

    expect(result.enemyAssault).toBeGreaterThan(result.playerAssault);
    // Un Agente non può ignorare per conto proprio la regola che stabilisce chi vince.
    expect(result.winner).toBe('player');
  });
});

/**
 * L'Ora Verde è lo Statico di riferimento: nessuna scelta, nessun gate, nessun costo, e un
 * effetto che non tocca il Duello ma il tabellone su cui il Duello si combatte.
 */
describe('Statico: Ora Verde sul tabellone reale', () => {
  const board = () => [1, 2, 3, 4, 5].map((id) => ALL_BATTLEFIELDS.find((f) => f.id === id));

  // Quattro slot già giocati: al round 5 ne resta uno, ed è quello che verrà sostituito.
  const conquered = {
    0: { winner: 'player' },
    1: { winner: 'enemy' },
    2: { winner: 'player' },
    3: { winner: 'enemy' },
  };

  function replaceAtRound(roundNumber) {
    const matchState = createEminenceMatchState({
      format: EMINENCE_FORMAT.REQUIRED,
      playerEminenceId: 'apex_sole_verde',
      enemyEminenceId: 'patto_grande_semaforo',
    });

    const { bundle } = openEminenceRound(matchState, { roundNumber });
    return applyFieldOperations(bundle?.fieldOperations || [], {
      battlefields: board(),
      conqueredFields: conquered,
    });
  }

  it('al round 5 lo slot superstite diventa un Campo Apex', () => {
    const { battlefields, changes } = replaceAtRound(5);

    expect(changes).toHaveLength(1);
    expect(changes[0].slot).toBe(4);
    expect(battlefields[4].tema).toBe('Apex');
    // Gli slot già conquistati appartengono a round giocati e non vengono riscritti.
    expect(battlefields.slice(0, 4).map((f) => f.id)).toEqual([1, 2, 3, 4]);
  });

  it('nei round precedenti il tabellone resta quello sorteggiato', () => {
    for (const roundNumber of [1, 2, 3, 4]) {
      expect(replaceAtRound(roundNumber).changes).toHaveLength(0);
    }
  });

  it('il Duello si combatte davvero sul Campo sostituito', () => {
    const { battlefields } = replaceAtRound(5);
    const field = battlefields[4];

    const duelInput = {
      ...baseInput,
      field,
      currentFieldIndex: 4,
      conqueredFields: conquered,
      roundNumber: 5,
      // Il Meridiano non aggiunge statistiche: sostituisce il Bonus d'Armata di chi ce l'ha
      // attivo. Senza un Bonus attivo la sostituzione non sarebbe osservabile.
      playerArmyBonuses: { [baseInput.selectedAgent.army]: true },
    };

    // Il Campo entrato in gioco non era fra quelli sorteggiati.
    expect(board().some((f) => f.id === field.id)).toBe(false);

    // Confronto a Campo costante: cambia solo se il Bonus d'Armata è attivo, così il delta
    // isola il Bonus sostituito dal Meridiano invece di mescolarlo a quello del Campo uscito.
    const withoutBonus = computeDuelResolution({ ...duelInput, playerArmyBonuses: {} }).battleResult;
    const withBonus = computeDuelResolution(duelInput).battleResult;

    // Invasione è soddisfatta: il giocatore ha conquistato due slot.
    expect(withBonus.playerPower - withoutBonus.playerPower).toBe(2);
    expect(withBonus.playerDamage - withoutBonus.playerDamage).toBe(1);
    // La sostituzione riguarda chi ha il Bonus attivo, non entrambi.
    expect(withBonus.enemyPower).toBe(withoutBonus.enemyPower);
  });
});

describe('Maledizioni di slot nel Duello reale', () => {
  it('restano dopo il velo Campo e colpiscono entrambi i lati', () => {
    const fieldById = (id) => ALL_BATTLEFIELDS.find((f) => f.id === id);
    const input = {
      ...baseInput,
      field: fieldById(5),
      selectedAgent: { ...baseInput.selectedAgent, damage: 3, league: 4 },
      enemyAgent: { ...baseInput.enemyAgent, damage: 3, league: 2 },
    };
    const plain = computeDuelResolution(input).battleResult;
    expect(plain.playerDamage).toBe(1);
    expect(plain.enemyDamage).toBe(1);

    const cursed = computeDuelResolution({
      ...input,
      eminenceBundle: {
        ignoreFieldSides: ['player'],
        slotModifiers: [{ deltas: { damage: -1 }, leagueScaled: false }],
      },
    }).battleResult;

    // Il velo toglie il −2 DAN del Campo al giocatore; la maledizione resta.
    expect(cursed.playerDamage).toBe(2);
    expect(cursed.enemyDamage).toBe(0);
  });

  it('−VA scala sulla Lega anche se il Campo è ignorato', () => {
    const plain = computeDuelResolution(baseInput).battleResult;
    const cursed = computeDuelResolution({
      ...baseInput,
      eminenceBundle: {
        ignoreFieldSides: ['player'],
        slotModifiers: [{ deltas: {}, leagueScaled: true }],
      },
    }).battleResult;

    expect(cursed.playerAssault).toBe(plain.playerAssault - baseInput.selectedAgent.league);
    expect(cursed.enemyAssault).toBe(plain.enemyAssault - baseInput.enemyAgent.league);
  });
});
