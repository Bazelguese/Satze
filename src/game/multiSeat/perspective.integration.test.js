// Proprietà di prospettiva: lo stesso scontro calcolato dal punto di vista di uno dei due
// posti o dell'altro deve dare lo stesso esito (vincitore, PV, FC, tossine, Campo distrutto).
// Ogni client del multiplayer a più posti calcola gli scontri dalla propria prospettiva:
// se questa proprietà non regge, i client divergono.
import { describe, it, expect } from 'vitest';
import { ALL_AGENTS } from '../../data/cards.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { createSeat, resolveSeatDuel } from './multiSeatCore.js';
import { mulberry32 } from '../../utils/seededRandom.js';

const CAMPI = ALL_BATTLEFIELDS.filter((f) => f.category !== 'neutral');

function posto(id, mano, rng) {
  const seat = createSeat({ id, name: id, army: mano[0].army, hand: mano, focus: 6 + Math.floor(rng() * 12) });
  seat.armyBonuses = { [mano[0].army]: rng() < 0.6 };
  seat.previousResult = [null, 'won', 'lost'][Math.floor(rng() * 3)];
  seat.usedCardIds = mano.slice(0, Math.floor(rng() * 3)).map((c) => c.id);
  return seat;
}

function scontro(field, primo, secondo, cartaPrimo, cartaSecondo, fcPrimo, fcSecondo, pvPrimo, pvSecondo, round, primoGuarda) {
  // primoGuarda = true: il posto che gioca per primo è il "player" di questo client.
  const comune = { field, conqueredFields: {}, roundNumber: round, fieldIndex: 0, firstMaxHP: 25, secondMaxHP: 25 };
  if (primoGuarda) {
    return resolveSeatDuel({
      ...comune, firstSeat: primo, secondSeat: secondo, firstCard: cartaPrimo, secondCard: cartaSecondo,
      firstFocus: fcPrimo, secondFocus: fcSecondo, firstHP: pvPrimo, secondHP: pvSecondo, playerHasInitiative: true,
    });
  }
  return resolveSeatDuel({
    ...comune, firstSeat: secondo, secondSeat: primo, firstCard: cartaSecondo, secondCard: cartaPrimo,
    firstFocus: fcSecondo, secondFocus: fcPrimo, firstHP: pvSecondo, secondHP: pvPrimo, playerHasInitiative: false,
  });
}

/** Esito in termini assoluti: chi vince (primo/secondo) e i valori finali di ciascun posto. */
function assoluto(br, primoGuarda) {
  const lato = (chi) => ((chi === 'primo') === primoGuarda ? 'player' : 'enemy');
  const vince = br.winner === lato('primo') ? 'primo' : br.winner === lato('secondo') ? 'secondo' : 'pari';
  const val = (chi, chiave) => br[`${lato(chi)}${chiave}`];
  const pv = (chi) => (lato(chi) === 'player' ? br.finalPlayerHP : br.finalEnemyHP);
  const fc = (chi) => (lato(chi) === 'player' ? br.finalPlayerFC : br.finalEnemyFC);
  return {
    vince,
    pv: [pv('primo'), pv('secondo')],
    fc: [fc('primo'), fc('secondo')],
    va: [val('primo', 'Assault'), val('secondo', 'Assault')],
    tossina: [Boolean(val('primo', 'ToxinActivated')), Boolean(val('secondo', 'ToxinActivated'))],
    campoDistrutto: Boolean(br.fieldDestroyed),
    niente: Boolean(br.skipConquest),
  };
}

describe('Scontro a più posti: stesso esito da entrambe le prospettive', () => {
  it('carte e Campi reali, 3000 scontri casuali', () => {
    const rng = mulberry32(20261108);
    const diversi = [];
    for (let n = 0; n < 3000; n++) {
      const field = CAMPI[Math.floor(rng() * CAMPI.length)];
      const manoA = Array.from({ length: 5 }, () => ALL_AGENTS[Math.floor(rng() * ALL_AGENTS.length)]);
      const manoB = Array.from({ length: 5 }, () => ALL_AGENTS[Math.floor(rng() * ALL_AGENTS.length)]);
      const semePosti = Math.floor(rng() * 1e9);
      const primo = () => posto('P', manoA, mulberry32(semePosti));
      const secondo = () => posto('S', manoB, mulberry32(semePosti + 1));
      const cartaA = manoA[4];
      const cartaB = manoB[4];
      const fcA = 1 + Math.floor(rng() * 6);
      const fcB = 1 + Math.floor(rng() * 6);
      const pvA = 5 + Math.floor(rng() * 21);
      const pvB = 5 + Math.floor(rng() * 21);
      const round = 1 + Math.floor(rng() * 5);
      const x = assoluto(scontro(field, primo(), secondo(), cartaA, cartaB, fcA, fcB, pvA, pvB, round, true), true);
      const y = assoluto(scontro(field, primo(), secondo(), cartaA, cartaB, fcA, fcB, pvA, pvB, round, false), false);
      if (JSON.stringify(x) !== JSON.stringify(y)) {
        diversi.push({ campo: `${field.id} ${field.name}`, primo: `${cartaA.id} ${cartaA.name}`, secondo: `${cartaB.id} ${cartaB.name}`, round, x, y });
      }
    }
    expect(diversi.slice(0, 5), `${diversi.length} scontri con esito diverso`).toEqual([]);
  });
});
