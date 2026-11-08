// Simulazione del multiplayer a più posti senza browser: N client, ciascuno con la propria
// prospettiva, ricevono le stesse voci di log dall'host (sequencer) e devono restare allineati.
// Gli "umani" decidono con l'IA del gioco ma con generatori propri (scelte indipendenti).
import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../../utils/seededRandom.js';
import {
  MULTI_KINDS, ENTRY, buildMatchPackage, matchFromPackage, applyEntry, advanceIfResolved, stateHash,
  requiredDecision, HostSequencer, seatOfSlot, defaultSeatMap,
} from './onlineSession.js';
import { aiOpeningDeploy, aiResponsePlan } from '../teamDuel/teamDuelAI.js';
import { aiCommit } from '../kingOfHill/kingOfHillAI.js';
import { ARMY_DECKS } from '../../data/cards.js';

const ARMATE = Object.keys(ARMY_DECKS);

function giocatori(n, rng) {
  return Array.from({ length: n }, (_, slot) => {
    const army = ARMATE[Math.floor(rng() * ARMATE.length)];
    const keys = Object.keys(ARMY_DECKS[army]);
    return { slot, name: `G${slot}`, army, deckKey: keys[Math.floor(rng() * keys.length)] };
  });
}

/** Decisione di un client umano per i posti che controlla (come farebbe la sua UI). */
function decisione(client, rng) {
  const req = requiredDecision(client.match);
  if (!req) return null;
  const miei = req.seatIds.filter((id) => id === client.seatId);
  if (req.kind === ENTRY.CLAIM) {
    const capitano = req.seatIds.map((id) => client.pkg.seats.find((s) => s.id === id)).find((s) => s.controller.type === 'human');
    if (capitano?.id !== client.seatId) return null;
    return { kind: ENTRY.CLAIM, round: client.match.roundNumber, decision: rng() < 0.5 ? 'claim' : 'continue' };
  }
  if (!miei.length) return null;
  const id = miei[0];
  if (req.kind === ENTRY.OPEN) {
    const ai = aiOpeningDeploy(client.match, id, rng, client.campiCompagno || []);
    return { kind: ENTRY.OPEN, round: client.match.roundNumber, deployments: { [id]: ai } };
  }
  if (req.kind === ENTRY.RESPOND) {
    const plan = aiResponsePlan(client.match, req.team, rng);
    return { kind: ENTRY.RESPOND, round: client.match.roundNumber, deployments: { [id]: plan.deployments[id] }, pairing: plan.pairing };
  }
  const ai = aiCommit(client.match, id, rng);
  return { kind: ENTRY.COMMIT, round: client.match.roundNumber, deployments: { [id]: ai } };
}

function partita({ kind, umani, players = 4, fieldMode, seme }) {
  const rng = mulberry32(seme);
  const readies = giocatori(umani, rng);
  const pkg = buildMatchPackage({ kind, fieldMode, players, difficulty: 'medium', teammatePreset: 'equilibrato' }, readies, seme);
  // Il pacchetto viaggia via rete.
  const viaggio = JSON.parse(JSON.stringify(pkg));
  const host = new HostSequencer(viaggio);
  const clients = readies.map((r) => {
    const seatId = seatOfSlot(viaggio, r.slot);
    return { slot: r.slot, seatId, pkg: viaggio, match: matchFromPackage(viaggio, seatId), visti: 0, rng: mulberry32(seme * 31 + r.slot), inviato: null };
  });
  const consegna = (voci) => {
    for (const v of voci) {
      for (const c of clients) {
        expect(v.seq).toBe(c.visti + 1);
        c.match = advanceIfResolved(applyEntry(c.match, v.entry));
        c.visti = v.seq;
        expect(stateHash(c.match), `seq ${v.seq}: client ${c.slot} (${c.seatId}) disallineato`).toBe(v.hash);
        c.inviato = null;
      }
    }
  };
  consegna(host.pump());
  let rifiuti = 0;
  for (let passo = 0; passo < 400 && !host.match.result; passo++) {
    let mosso = false;
    // Ordine di invio variabile, come in rete.
    const ordine = [...clients].sort(() => rng() - 0.5);
    for (const c of ordine) {
      const chiave = `${c.visti}:${c.match.phase}`;
      if (c.inviato === chiave) continue;
      const intent = decisione(c, c.rng);
      if (!intent) continue;
      c.inviato = chiave;
      mosso = true;
      try {
        consegna(host.receive(c.slot, intent));
      } catch (e) {
        // Es. Campo già preso dal compagno umano: il client riprova con un altro Campo.
        rifiuti += 1;
        c.inviato = null;
        c.campiCompagno = Object.values(host.pending.deployments || {}).map((d) => d.fieldIndex);
        if (rifiuti > 200) throw e;
      }
    }
    if (!mosso && !host.match.result) throw new Error(`stallo: ${JSON.stringify(requiredDecision(host.match))}`);
  }
  expect(host.match.result, 'la partita finisce').toBeTruthy();
  for (const c of clients) expect(c.match.result).toEqual(host.match.result);
  return host.log.length;
}

describe('Multiplayer a più posti: client allineati via log del sequencer', () => {
  it('pacchetto deterministico e stessa impronta da ogni prospettiva', () => {
    const rng = mulberry32(5);
    const readies = giocatori(3, rng);
    const a = buildMatchPackage({ kind: MULTI_KINDS.TEAM, fieldMode: 'classic' }, readies, 99);
    const b = buildMatchPackage({ kind: MULTI_KINDS.TEAM, fieldMode: 'classic' }, readies, 99);
    expect(a).toEqual(b);
    const impronte = ['A1', 'A2', 'B1', 'B2', null].map((id) => stateHash(matchFromPackage(a, id)));
    expect(new Set(impronte).size).toBe(1);
    expect(defaultSeatMap(MULTI_KINDS.TEAM, [0, 1, 2])).toEqual({ A1: 0, B1: 1, A2: 2, B2: null });
  });

  for (const fieldMode of ['classic', 'bareHands']) {
    it(`2v2 (${fieldMode}) con 2, 3 e 4 giocatori umani`, () => {
      let voci = 0;
      for (const umani of [2, 3, 4]) {
        for (let s = 1; s <= 12; s++) voci += partita({ kind: MULTI_KINDS.TEAM, umani, fieldMode, seme: s * 101 + umani });
      }
      expect(voci).toBeGreaterThan(100);
    });

    it(`Re della collina (${fieldMode}) a 3 e 4 con 2-4 giocatori umani`, () => {
      for (const players of [3, 4]) {
        for (let umani = 2; umani <= players; umani++) {
          for (let s = 1; s <= 10; s++) partita({ kind: MULTI_KINDS.KOTH, umani, players, fieldMode, seme: s * 97 + umani * 7 + players });
        }
      }
    });
  }

  it('il sequencer rifiuta decisioni non valide', () => {
    const rng = mulberry32(8);
    const pkg = buildMatchPackage({ kind: MULTI_KINDS.KOTH, fieldMode: 'classic', players: 3 }, giocatori(3, rng), 77);
    const host = new HostSequencer(pkg);
    host.pump();
    const req = requiredDecision(host.match);
    const tocca = pkg.seats.find((s) => s.id === req.seatIds[0]);
    const altro = pkg.seats.find((s) => s.id !== tocca.id && s.controller.type === 'human');
    expect(() => host.receive(altro.controller.slot, { kind: ENTRY.COMMIT, round: 1, deployments: { [altro.id]: { cardId: 1, investment: 1 } } })).toThrow();
    expect(() => host.receive(tocca.controller.slot, { kind: ENTRY.COMMIT, round: 2, deployments: {} })).toThrow('Turno sbagliato');
    expect(() => host.receive(tocca.controller.slot, { kind: ENTRY.OPEN, round: 1, deployments: {} })).toThrow('Fase sbagliata');
  });
});
