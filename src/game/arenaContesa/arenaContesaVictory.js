import { ARENA_CONTESA } from './arenaContesaConstants.js';

/**
 * Elimina a 0 PV; se resta un solo giocatore vivo → Annientamento.
 * @returns {{ match: object, ended: boolean }}
 */
export function applyAnnihilationCheck(match) {
  const players = match.players.map((p) =>
    p.hp <= 0 && !p.eliminated ? { ...p, hp: 0, eliminated: true } : p
  );
  const alive = players.filter((p) => !p.eliminated);
  if (alive.length === 1) {
    return {
      match: {
        ...match,
        players,
        phase: 'gameOver',
        winnerId: alive[0].id,
        winReason: 'annientamento',
      },
      ended: true,
    };
  }
  if (alive.length === 0) {
    return {
      match: {
        ...match,
        players,
        phase: 'gameOver',
        winnerId: null,
        winReason: 'pareggio',
      },
      ended: true,
    };
  }
  return { match: { ...match, players }, ended: false };
}

/**
 * Controllo a fine Giro (dopo 4 Turni di Chiamata).
 * Giri 1–4: Conquista ≥6. Giro 5+: Supremazia (PV strettamente maggiori).
 */
export function checkEndOfGiroVictory(match) {
  const alive = match.players.filter((p) => !p.eliminated);

  if (match.giro < ARENA_CONTESA.maxGiro) {
    const leaders = alive.filter((p) => p.fieldsWon >= ARENA_CONTESA.conquestThreshold);
    if (leaders.length === 0) return null;

    leaders.sort((a, b) => {
      if (b.fieldsWon !== a.fieldsWon) return b.fieldsWon - a.fieldsWon;
      if (b.hp !== a.hp) return b.hp - a.hp;
      return b.focus - a.focus;
    });

    const top = leaders[0];
    const tied = leaders.filter(
      (p) => p.fieldsWon === top.fieldsWon && p.hp === top.hp && p.focus === top.focus
    );
    if (tied.length > 1) return null;

    return { winnerId: top.id, winReason: 'conquista' };
  }

  // Giro 5+
  const byHp = [...alive].sort((a, b) => b.hp - a.hp);
  if (byHp.length === 0) return null;
  if (byHp.length === 1 || byHp[0].hp > byHp[1].hp) {
    return { winnerId: byHp[0].id, winReason: 'supremazia' };
  }
  return null; // parità in testa → continua
}
