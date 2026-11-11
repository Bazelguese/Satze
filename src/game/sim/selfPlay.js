// ============================================
// Tornei IA contro IA (banco di prova Fase 0)
// ============================================

import { mulberry32 } from '../../utils/seededRandom.js';
import { playHeadlessMatch } from './headlessMatch.js';
import { createHeadlessMatch, listPresetDecks } from './headlessSetup.js';
import { createAgentFromSpec } from './simAgents.js';

/**
 * Coppia di mazzi per un seme: armate diverse, come nel gioco (l'IA sceglie un'altra armata).
 */
export function deckPairForSeed(seed, decks = listPresetDecks()) {
  const rng = mulberry32((seed * 2654435761) >>> 0);
  const first = decks[Math.floor(rng() * decks.length)];
  const others = decks.filter((d) => d.army !== first.army);
  const second = others[Math.floor(rng() * others.length)];
  return [first, second];
}

function agentSeed(matchSeed, slot) {
  return ((matchSeed * 7919) ^ (slot * 104729)) >>> 0;
}

/**
 * Gioca una coppia di agenti su `seeds` semi. Ogni seme si gioca due volte con i lati
 * scambiati (stesse mani, stessi Campi): così mazzi, Campi e apertura pesano uguale per entrambi.
 *
 * @param {{ a: string, b: string, mode?: string, seeds: number[], onMatch?: Function }} options
 * @returns {object[]} risultati per partita, dal punto di vista di `a`
 */
export function runPairing({ a, b, mode = 'classic', seeds, onMatch }) {
  const out = [];
  for (const seed of seeds) {
    const [deck1, deck2] = deckPairForSeed(seed);
    const base = createHeadlessMatch({ seed, mode, player: deck1, enemy: deck2 });
    for (const aSide of ['player', 'enemy']) {
      const bSide = aSide === 'player' ? 'enemy' : 'player';
      const agents = {
        [aSide]: createAgentFromSpec(a, { seed: agentSeed(seed, aSide === 'player' ? 1 : 2) }),
        [bSide]: createAgentFromSpec(b, { seed: agentSeed(seed, bSide === 'player' ? 3 : 4) }),
      };
      const started = Date.now();
      const result = playHeadlessMatch(base, agents);
      const record = summarizeMatch(result, { seed, mode, a, b, aSide, decks: [deck1, deck2] });
      record.wallMs = Date.now() - started;
      out.push(record);
      onMatch?.(record);
    }
  }
  return out;
}

function fieldsFor(final, aSide) {
  const won = (side) =>
    Object.values(final.conqueredFields || {}).filter((f) => f && f.winner === side).length;
  const bSide = aSide === 'player' ? 'enemy' : 'player';
  return { a: won(aSide), b: won(bSide) };
}

function summarizeMatch(result, { seed, mode, a, b, aSide, decks }) {
  const bSide = aSide === 'player' ? 'enemy' : 'player';
  const outcome =
    result.winner === 'draw' ? 'draw' : result.winner === aSide ? 'win' : 'loss';
  const sideStats = (side) => {
    const rounds = result.rounds;
    return {
      focus: rounds.map((r) => r[side].focus),
      leadMs: rounds.filter((r) => r.leader === side).map((r) => r.ms[side]),
      respondMs: rounds.filter((r) => r.leader !== side).map((r) => r.ms[side]),
      fixes: rounds.reduce((n, r) => n + r[side].fixes.length, 0),
      duelsWon: rounds.filter((r) => r.winner === side).length,
    };
  };
  const final = result.finalState;
  return {
    seed,
    mode,
    a,
    b,
    aSide,
    decks: { [aSide]: aSide === 'player' ? decks[0] : decks[1], [bSide]: aSide === 'player' ? decks[1] : decks[0] },
    aOpened: (aSide === 'player') === final.openingPlayerFirst,
    outcome,
    reason: result.reason,
    rounds: result.rounds.length,
    hp: { a: aSide === 'player' ? final.playerHP : final.enemyHP, b: aSide === 'player' ? final.enemyHP : final.playerHP },
    fields: fieldsFor(final, aSide),
    statsA: sideStats(aSide),
    statsB: sideStats(bSide),
  };
}
