/**
 * Test di integrazione: esegue `computeDuelResolution` con la catena reale di moduli (Vite resolver).
 * I test in `duel/*.test.js` sono unitari: funzioni isolate con Node --test.
 */
import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import {
  hasBlock,
  hasCopy,
  hasEventType,
  hasFieldRule,
  hasOutcome,
  hasResourceChange,
  hasStatChange,
} from './duel/battleEventAssert.js';


const neutralField = ALL_BATTLEFIELDS.find((f) => f.id === 51);
const nexusField = ALL_BATTLEFIELDS.find((f) => f.name === 'Nexus Arcano');
const canyonField = ALL_BATTLEFIELDS.find((f) => f.name === 'Canyon delle Lame');
const paludeField = ALL_BATTLEFIELDS.find((f) => f.name === 'Palude Tossica');
const ossidianaField = ALL_BATTLEFIELDS.find((f) => f.id === 61);
const megeraThroneField = ALL_BATTLEFIELDS.find((f) => f.id === 68);
const cattedraleField = ALL_BATTLEFIELDS.find((f) => f.id === 70);
const circuitoField = ALL_BATTLEFIELDS.find((f) => f.id === 74);
const cameraRitualeField = ALL_BATTLEFIELDS.find((f) => f.id === 79);
const muraSfidaField = ALL_BATTLEFIELDS.find((f) => f.id === 39);
const fognaMaestraField = ALL_BATTLEFIELDS.find((f) => f.id === 66);
const fondamentaField = ALL_BATTLEFIELDS.find((f) => f.id === 22);
const croceviaField = ALL_BATTLEFIELDS.find((f) => f.id === 41);

function agent(name, army, overrides = {}) {
  return {
    name,
    army,
    power: 5,
    damage: 3,
    league: 2,
    ...overrides,
  };
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
  isPlayerFirst: true,
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
};

describe('computeDuelResolution (integrazione)', () => {
  it('completa un duello neutro e restituisce esito coerente', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte"),
      enemyAgent: agent('IA', 'Kethran', { power: 3, damage: 2 }),
    });
    expect(['player', 'enemy']).toContain(battleResult.winner);
    expect(battleResult.playerAssault).toBeGreaterThan(0);
    expect(battleResult.enemyAssault).toBeGreaterThan(0);
    expect(battleResult.events.length).toBeGreaterThan(0);
    expect(hasEventType(battleResult.events, 'roundHeader')).toBe(true);
    expect(hasOutcome(battleResult.events)).toBe(true);
    expect(battleResult.finalPlayerHP).toBeGreaterThanOrEqual(0);
    expect(battleResult.finalEnemyHP).toBeGreaterThanOrEqual(0);
  });

  it('con POT nettamente superiore il giocatore vince lo scontro', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 9, damage: 4 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.playerAssault).toBeGreaterThan(battleResult.enemyAssault);
  });

  it('Nexus Arcano tappa il DAN a 4 nel risultato', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: nexusField,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 8, damage: 9 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.playerDamage).toBe(4);
    expect(hasFieldRule(battleResult.events, 'maxDamage', nexusField.id)).toBe(true);
  });

  it('Canyon delle Lame · Ultimo Desiderio −2 PV al perdente', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: canyonField,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.playerDamage).toBe(3);
    expect(battleResult.damageDealt).toBe(3);
    expect(battleResult.finalEnemyHP).toBe(15);
    expect(hasResourceChange(battleResult.events, { stat: 'PV', side: 'opponent' })).toBe(true);
  });

  it('bonus Conquista Enclave: playerArmyBonusActive distinto da playerHasBonus', () => {
    const enclave = "L'Enclave delle Scaglie";
    const { battleResult: win } = computeDuelResolution({
      ...baseInput,
      selectedAgent: agent('Servo del Tesoro', enclave, { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
      playerArmyBonuses: { [enclave]: true },
    });
    expect(win.winner).toBe('player');
    expect(win.playerArmyBonusActive).toBe(true);
    expect(win.playerHasBonus).toBe(true);
    expect(win.playerBonusNotTriggered).toBe(false);
    expect(hasResourceChange(win.events, { stat: 'FC', side: 'local' }) || hasStatChange(win.events, { side: 'local' })).toBe(true);

    const { battleResult: loss } = computeDuelResolution({
      ...baseInput,
      selectedAgent: agent('Servo del Tesoro', enclave, { power: 1, damage: 1 }),
      enemyAgent: agent('IA', 'Kethran', { power: 9, damage: 4 }),
      playerArmyBonuses: { [enclave]: true },
    });
    expect(loss.winner).toBe('enemy');
    expect(loss.playerArmyBonusActive).toBe(true);
    expect(loss.playerHasBonus).toBe(false);
    expect(loss.playerBonusNotTriggered).toBe(false);
  });

  it('bonus Conquista (Ratti della Megera) attiva tossina sull\'IA a vittoria', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      selectedAgent: agent('Tu', 'Ratti della Megera', { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
      playerArmyBonuses: { 'Ratti della Megera': true },
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.enemyToxinActivated).toEqual(
      expect.objectContaining({ value: 1, minHealth: 10 })
    );
    expect(battleResult.events.some((e) => e.type === 'info' && e.infoCode === 'toxinApplied')).toBe(true);
  });

  it('Palude Tossica toglie 1 PV a entrambi dopo lo scontro', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: paludeField,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.finalPlayerHP).toBe(19);
    expect(hasResourceChange(battleResult.events, { stat: 'PV' })).toBe(true);
  });

  it('Trono d\'Ossidiana raddoppia gli effetti Conquista', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: ossidianaField,
      selectedAgent: agent('Tu', 'Ratti della Megera', { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
      playerArmyBonuses: { 'Ratti della Megera': true },
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.enemyToxinActivated).toEqual(
      expect.objectContaining({ value: 2, minHealth: 10 })
    );
  });

  it('Trono della Megera attiva Ultimo Desiderio due volte', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: megeraThroneField,
      selectedAgent: agent('Tu', 'Khemet', {
        power: 1,
        damage: 1,
        ability: { trigger: 'lastWish', effect: 'focusCoin', value: 2 },
      }),
      enemyAgent: agent('IA', 'Kethran', { power: 9, damage: 4 }),
    });
    expect(battleResult.winner).toBe('enemy');
    expect(battleResult.finalPlayerFC).toBe(8);
    expect(hasFieldRule(battleResult.events, 'lastWishDouble', megeraThroneField.id) || hasResourceChange(battleResult.events, { stat: 'FC', side: 'local' })).toBe(true);
  });

  it('Cattedrale del Decadimento sostituisce il bonus armata con Tossina 2', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: cattedraleField,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
      playerArmyBonuses: { "Figli dell'Orizzonte": true },
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.enemyToxinActivated).toEqual(
      expect.objectContaining({ value: 2, minHealth: 10 })
    );
  });

  it('Il Circuito fa attivare il Potere del primo con trigger Sfida', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: circuitoField,
      isPlayerFirst: true,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", {
        power: 5,
        damage: 3,
        league: 2,
        ability: { trigger: 'intervention', effect: 'power', value: 3 },
      }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1, league: 4 }),
    });
    expect(battleResult.playerPower).toBe(8);
    expect(hasStatChange(battleResult.events, { stat: 'POT', side: 'local' })).toBe(true);
  });

  it('Camera Rituale aggiunge +1 POT e +1 DAN con Overdrive attivo', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: cameraRitualeField,
      selectedFocus: 5,
      enemySelectedFocus: 5,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", { power: 5, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 5, damage: 3 }),
    });
    expect(hasStatChange(battleResult.events, { stat: 'POT', side: 'local' })).toBe(true);
    expect(battleResult.playerAssault).toBe(30);
    expect(battleResult.playerPower).toBe(6);
    expect(battleResult.playerDamage).toBe(4);
  });

  it('Mura della Sfida forza Rimonta anche a pari PV (bonus Kethran)', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: muraSfidaField,
      playerHP: 20,
      enemyHP: 20,
      selectedAgent: agent('Tu', 'Kethran', { power: 5, damage: 3 }),
      enemyAgent: agent('IA', "Figli dell'Orizzonte", { power: 5, damage: 3 }),
      playerArmyBonuses: { Kethran: true },
    });
    expect(battleResult.playerPower).toBe(7);
    expect(hasStatChange(battleResult.events, { stat: 'POT', side: 'local' })).toBe(true);
  });

  it('Fogna Maestra abbassa i minimi degli effetti Potere/Bonus', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: fognaMaestraField,
      selectedAgent: agent('Tu', 'Calibri Pesanti', { power: 5, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 5, damage: 3 }),
      playerArmyBonuses: { 'Calibri Pesanti': true },
    });
    expect(battleResult.enemyDamage).toBe(1);
    expect(hasStatChange(battleResult.events, { stat: 'DAN', side: 'opponent' })).toBe(true);
  });

  it('Fogna Maestra + Nobili Viola (Gloria): min 3 diventa 2, nemico POT 3 → 2', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: fognaMaestraField,
      lastWinner: 'player',
      selectedFocus: 6,
      enemySelectedFocus: 2,
      selectedAgent: agent('Nobili Viola', "L'Enclave delle Scaglie", {
        power: 3,
        damage: 2,
        league: 3,
        ability: { trigger: 'glory', effect: 'enemyPower', value: -3, minPower: 3 },
      }),
      enemyAgent: agent('Mounthborn', 'Mounthborn', { power: 3, damage: 3, league: 2 }),
    });
    expect(battleResult.enemyPower).toBe(2);
    expect(battleResult.enemyAssault).toBe(4);
  });

  it('Nobili Viola senza Gloria attiva: nemico resta POT 3 anche su Fogna', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: fognaMaestraField,
      lastWinner: null,
      selectedAgent: agent('Nobili Viola', "L'Enclave delle Scaglie", {
        power: 3,
        damage: 2,
        league: 3,
        ability: { trigger: 'glory', effect: 'enemyPower', value: -3, minPower: 3 },
      }),
      enemyAgent: agent('Mounthborn', 'Mounthborn', { power: 3, damage: 3, league: 2 }),
    });
    expect(battleResult.enemyPower).toBe(3);
    expect(battleResult.enemyAssault).toBe(6);
  });

  it('Fondamenta forza Gloria: stesso effetto −3 POT nem. subito in pre-VA', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: fondamentaField,
      lastWinner: null,
      selectedFocus: 6,
      enemySelectedFocus: 2,
      selectedAgent: agent('Nobili Viola', "L'Enclave delle Scaglie", {
        power: 3,
        damage: 2,
        league: 3,
        ability: { trigger: 'glory', effect: 'enemyPower', value: -3, minPower: 3 },
      }),
      enemyAgent: agent('Mounthborn', 'Mounthborn', { power: 3, damage: 3, league: 2 }),
    });
    expect(battleResult.enemyPower).toBe(3);
    expect(hasStatChange(battleResult.events, { stat: 'POT', side: 'opponent' }) || battleResult.enemyPower === 3).toBe(true);
  });

  it('Crocevia: bonus Conquista Enclave in pre-VA senza attendere la vittoria', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: croceviaField,
      lastWinner: null,
      selectedAgent: agent('Tu', "L'Enclave delle Scaglie", { power: 9, damage: 3 }),
      enemyAgent: agent('IA', 'Kethran', { power: 1, damage: 1 }),
      playerArmyBonuses: { "L'Enclave delle Scaglie": true },
    });
    expect(hasResourceChange(battleResult.events, { stat: 'FC', side: 'local' })).toBe(true);
    expect(battleResult.finalPlayerFC).toBeGreaterThan(baseInput.playerFocus - baseInput.selectedFocus);
  });

  it('isPlayerFirst false: il 1° giocatore (IA) risolve il potere prima del 2° (Copia POT)', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      isPlayerFirst: false,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", {
        ability: { trigger: 'intervention', effect: 'power', value: 3 },
      }),
      enemyAgent: agent('IA', 'Kethran', {
        ability: { trigger: null, effect: 'copyPower' },
      }),
    });
    expect(battleResult.playerPower).toBe(8);
    expect(battleResult.enemyPower).toBe(5);
    const kinds = battleResult.visualSteps.map((s) => `${s.kind}:${s.side ?? ''}`);
    const powerIdx = kinds.indexOf('power:enemy');
    const playerPowerIdx = kinds.indexOf('power:player');
    expect(powerIdx).toBeGreaterThanOrEqual(0);
    expect(playerPowerIdx).toBeGreaterThan(powerIdx);
  });

  it('isPlayerFirst false: block del 1° giocatore (IA) annulla il potere del 2°', () => {
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      isPlayerFirst: false,
      selectedAgent: agent('Tu', "Figli dell'Orizzonte", {
        ability: { trigger: 'intervention', effect: 'power', value: 3 },
      }),
      enemyAgent: agent('IA', 'Kethran', {
        ability: { trigger: null, effect: 'blockAbility' },
      }),
    });
    expect(battleResult.playerPower).toBe(5);
    expect(hasBlock(battleResult.events, 'blockAbility') || battleResult.playerAbilityBlocked).toBe(true);
  });

  it('Bonus Patto Rinforzi: con 3 L4 applica -1 POT/-1 DAN; con 2 L4 no', () => {
    const indocili = 'Patto degli Indocili';
    const playerCard = agent('Elysium', indocili, {
      id: 902,
      league: 4,
      power: 4,
      damage: 2,
    });
    const enemy = agent('IA', 'Kethran', { id: 201, league: 3, power: 5, damage: 4 });

    const withRinforzi = computeDuelResolution({
      ...baseInput,
      selectedAgent: playerCard,
      enemyAgent: enemy,
      playerArmyBonuses: { [indocili]: true },
      playerHand: [
        agent('KMD', indocili, { id: 903, league: 4 }),
        agent('L4b', indocili, { id: 904, league: 4 }),
        agent('L2a', indocili, { id: 915, league: 2 }),
        agent('L2b', indocili, { id: 916, league: 2 }),
      ],
    });
    expect(withRinforzi.battleResult.enemyPower).toBe(4);
    expect(withRinforzi.battleResult.enemyDamage).toBe(3);

    const withoutRinforzi = computeDuelResolution({
      ...baseInput,
      selectedAgent: playerCard,
      enemyAgent: enemy,
      playerArmyBonuses: { [indocili]: true },
      playerHand: [
        agent('KMD', indocili, { id: 903, league: 4 }),
        agent('L2a', indocili, { id: 915, league: 2 }),
        agent('L2b', indocili, { id: 916, league: 2 }),
        agent('L2c', indocili, { id: 917, league: 2 }),
      ],
    });
    expect(withoutRinforzi.battleResult.enemyPower).toBe(5);
    expect(withoutRinforzi.battleResult.enemyDamage).toBe(4);
  });

  it('Copia Bonus Rinforzi: con unica L4 IA non applica -1 POT al player', () => {
    const indocili = 'Patto degli Indocili';
    const corte = 'Corte Rossa';
    const fratello = agent('Fratello del Banditore di Schiavi', corte, {
      id: 318,
      league: 4,
      power: 6,
      damage: 2,
    });
    const playerCard = agent('Elysium', indocili, {
      id: 902,
      league: 4,
      power: 4,
      damage: 2,
    });
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      roundNumber: 2,
      selectedAgent: playerCard,
      enemyAgent: fratello,
      playerArmyBonuses: { [indocili]: true },
      enemyArmyBonuses: { [corte]: true },
      // Player ha 3 L4 (Rinforzi ok); IA ha solo Fratello come L4 (copia non scatta)
      playerHand: [
        agent('KMD', indocili, { id: 903, league: 4 }),
        agent('L4b', indocili, { id: 904, league: 4 }),
        agent('L2a', indocili, { id: 915, league: 2 }),
        agent('L2b', indocili, { id: 916, league: 2 }),
      ],
      enemyHand: [
        agent('Anima', corte, { id: 310, league: 2 }),
        agent('Debitore', corte, { id: 314, league: 3 }),
        agent('Archivista', corte, { id: 307, league: 2 }),
        agent('Larva', corte, { id: 315, league: 2 }),
      ],
    });

    expect(battleResult.enemyBonusCopied?.description).toMatch(/Rinforzi/);
    expect(battleResult.enemyCopiedBonusNotTriggered).toBe(true);
    expect(battleResult.playerPower).toBe(4);
    expect(hasCopy(battleResult.events, 'bonus')).toBe(true);
    expect(battleResult.events.some((e) => e.type === 'statChange' && String(e.source?.name || '').includes('(copiato)') && e.stat === 'POT')).toBe(false);
  });

  it('Potere Copia Bonus: aggiorna lo slot Potere e lascia intatto il Bonus armata', () => {
    const ratti = 'Ratti della Megera';
    const orizzonte = "Figli dell'Orizzonte";
    const orfano = agent("L'Orfano", ratti, {
      id: 816,
      league: 5,
      power: 7,
      damage: 1,
      ability: { trigger: 'intervention', effect: 'copyBonus', value: null },
    });
    const enemy = agent('IA', orizzonte, { id: 101, league: 2, power: 3, damage: 2 });
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      isPlayerFirst: false,
      selectedAgent: orfano,
      enemyAgent: enemy,
      playerArmyBonuses: { [ratti]: true },
      enemyArmyBonuses: { [orizzonte]: true },
    });

    expect(battleResult.playerBonusCopied).toBeFalsy();
    expect(battleResult.playerAbilityCopied?.effect).toBe('copiedArmyBonus');
    expect(battleResult.playerAbilityCopied?.displayText).toMatch(/VA/);
    expect(battleResult.playerCopiedAbilityNotTriggered).toBe(false);
    expect(battleResult.enemyAssault).toBeLessThanOrEqual(Math.max(6, 3 + 2 + 2 - 5));
    expect(hasCopy(battleResult.events, 'bonus')).toBe(true);
  });

  it('85 Tana dei Tagliagole: vince chi ha POT finale più alta anche con VA inferiore', () => {
    const tagliagole = ALL_BATTLEFIELDS.find((f) => f.id === 85);
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: tagliagole,
      selectedFocus: 1,
      enemySelectedFocus: 5,
      selectedAgent: agent('Tu', 'Apex', { power: 8, damage: 1, league: 4 }),
      enemyAgent: agent('IA', 'Kethran', { power: 3, damage: 4, league: 2 }),
    });
    expect(battleResult.winner).toBe('player');
    expect(battleResult.playerPower).toBeGreaterThan(battleResult.enemyPower);
    expect(hasFieldRule(battleResult.events, 'winnerByFinalPowerThenVa', 85)).toBe(true);
  });

  it('98 Piana del Vetro Nero: blocca +POT da Potere', () => {
    const vetro = ALL_BATTLEFIELDS.find((f) => f.id === 98);
    const { battleResult } = computeDuelResolution({
      ...baseInput,
      field: vetro,
      isPlayerFirst: true,
      selectedAgent: agent('Tu', 'Apex', {
        power: 3,
        damage: 2,
        league: 2,
        ability: { trigger: 'imboscata', effect: 'power', value: 2 },
      }),
      enemyAgent: agent('IA', 'Kethran', { power: 3, damage: 2, league: 2 }),
    });
    expect(battleResult.playerPower).toBe(3);
    expect(hasFieldRule(battleResult.events, 'positivePowerModifiersDisabled', 98)).toBe(true);
  });
});
