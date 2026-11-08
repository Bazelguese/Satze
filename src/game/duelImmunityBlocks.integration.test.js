// Immune concesso da un Potere o da un Bonus non vale quando quel Potere o Bonus è bloccato
// o disattivato (da un Agente avversario o da un Campo). Regressione del bug segnalato nel playtest.
import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { ALL_AGENTS } from '../data/cards.js';

const carta = (id) => ALL_AGENTS.find((c) => c.id === id);
const campo = (id) => ALL_BATTLEFIELDS.find((f) => f.id === id);

const TITANO = carta(401); // Calibri, Lega 5, POT 5 · Resa dei conti: Immune
const MEGERA = carta(801); // Ratti, Lega 5 · Blocca Potere (sempre)
const ECO = carta(107); // Figli, Lega 2 · Blocca Bonus (sempre)
const SETH_AMON = carta(1005); // Khemet, Lega 4, POT 4 · Bonus Khemet: Overdrive → Immune
const MERCATO = campo(42); // In scontro · Entrambi · −3 POT (min 1)

const base = {
  selectedFocus: 2, enemySelectedFocus: 2, playerHP: 20, enemyHP: 20, playerFocus: 12, enemyFocus: 12,
  // Resa dei conti: entrambi hanno già giocato 2 carte (questa è la terza).
  playerUsedCards: [9001, 9002], enemyUsedCards: [9003, 9004],
  isPlayerFirst: true, lastWinner: null,
  playerArmyBonuses: {}, enemyArmyBonuses: {}, playerToxin: null, enemyToxin: null,
  roundNumber: 3, conqueredFields: {}, playerHand: [], enemyHand: [], currentFieldIndex: 0,
};

describe('Immune e blocchi', () => {
  it('le carte di prova esistono', () => {
    for (const c of [TITANO, MEGERA, ECO, SETH_AMON, MERCATO]) expect(c).toBeTruthy();
    expect(TITANO.ability.effect).toBe('immune');
    expect(MEGERA.ability.effect).toBe('blockAbility');
    expect(ECO.ability.effect).toBe('blockBonus');
  });

  it('Potere Immune non bloccato: ignora il malus del Campo', () => {
    const avversario = carta(1002); // nessun blocco
    const { battleResult: br } = computeDuelResolution({ ...base, field: MERCATO, selectedAgent: TITANO, enemyAgent: avversario });
    expect(br.playerPower).toBe(TITANO.power);
  });

  it('Potere Immune bloccato da Blocca Potere: subisce il malus del Campo', () => {
    const { battleResult: br } = computeDuelResolution({ ...base, field: MERCATO, selectedAgent: TITANO, enemyAgent: MEGERA });
    expect(br.playerAbilityBlocked).toBe(true);
    expect(br.playerPower).toBe(Math.max(1, TITANO.power - 3));
  });

  it('Potere Immune disattivato dal Campo (Arena degli Gnomi): subisce il Bonus nemico', () => {
    // Arena degli Gnomi: Poteri disattivati. Il Bonus Calibri dell'avversario (−2 DAN nem., min 2) resta attivo.
    const arena = campo(3);
    const calibri = ALL_AGENTS.find((c) => c.army === 'Calibri Pesanti' && c.id !== TITANO.id
      && !['immune', 'blockAbility', 'blockBonus'].includes(c.ability?.effect));
    const input = { ...base, field: arena, selectedAgent: TITANO, enemyAgent: calibri, enemyArmyBonuses: { 'Calibri Pesanti': true } };
    const { battleResult: br } = computeDuelResolution(input);
    expect(br.playerDamage).toBe(Math.max(2, TITANO.damage - 2));
  });

  it('Bonus Khemet (Overdrive: Immune) bloccato da Blocca Bonus: subisce il malus del Campo', () => {
    const conBonus = { ...base, selectedFocus: 5, playerArmyBonuses: { Khemet: true } };
    const libero = computeDuelResolution({ ...conBonus, field: MERCATO, selectedAgent: SETH_AMON, enemyAgent: carta(1002) }).battleResult;
    expect(libero.playerPower).toBe(SETH_AMON.power); // Immune attivo: nessun −3 POT
    const bloccato = computeDuelResolution({ ...conBonus, field: MERCATO, selectedAgent: SETH_AMON, enemyAgent: ECO }).battleResult;
    expect(bloccato.playerBonusBlocked).toBe(true);
    expect(bloccato.playerPower).toBe(Math.max(1, SETH_AMON.power - 3));
  });

  it('Biblioteca delle Lingue Perdute (Blocca disattivati): il Potere Immune resta attivo', () => {
    const biblioteca = campo(24);
    const { battleResult: br } = computeDuelResolution({ ...base, field: biblioteca, selectedAgent: TITANO, enemyAgent: MEGERA });
    expect(br.playerAbilityBlocked).toBeFalsy();
  });
});
