// ============================================================
// Coda degli scontri di un turno a più posti (2v2, Re della collina)
// ============================================================
// Gli scontri di un turno passano uno alla volta nella scena del duello. Qui si decide, per
// lo scontro in corso, quali Agenti aspettano dietro (sfocati) e, al passaggio allo scontro
// dopo, chi resta in campo, chi cambia lato, chi avanza dalla coda e chi esce.
//
// Uno scontro è { playerSeatId, enemySeatId, playerCardId, enemyCardId } nella prospettiva
// della scena: `player` è il lato destro (il tuo), `enemy` il sinistro.
// ============================================================

const SIDES = ['player', 'enemy'];

function agentOf(scontro, side) {
  return { seatId: scontro[`${side}SeatId`], cardId: scontro[`${side}CardId`] };
}

function sameAgent(a, b) {
  return a.seatId === b.seatId && a.cardId === b.cardId;
}

/**
 * Agenti che aspettano il loro turno mentre si gioca lo scontro `index`: chi compare in uno
 * scontro successivo e non è in campo adesso, sul lato del suo primo scontro. In ogni lato il
 * primo della lista è il più vicino (entra prima).
 * @param {object[]} scontri
 * @param {number} index
 * @returns {{ player: object[], enemy: object[] }} voci { seatId, cardId, entersAt }
 */
export function waitingAgents(scontri, index) {
  const out = { player: [], enemy: [] };
  const current = scontri[index];
  if (!current) return out;
  const onField = SIDES.map((side) => agentOf(current, side));
  const seen = [];
  for (let i = index + 1; i < scontri.length; i += 1) {
    for (const side of SIDES) {
      const agent = agentOf(scontri[i], side);
      if (onField.some((a) => sameAgent(a, agent)) || seen.some((a) => sameAgent(a, agent))) continue;
      seen.push(agent);
      out[side].push({ ...agent, entersAt: i });
    }
  }
  return out;
}

/**
 * Passaggio dallo scontro `index` al successivo, lato per lato.
 * - `enter` di un lato: 'stay' (stesso Agente, stesso lato), 'swap' (l'Agente arriva
 *   dall'altro lato), 'advance' (arriva dalla coda).
 * - `leaves` di un lato: true se l'Agente in campo adesso non c'è nello scontro dopo.
 * @returns {null | { enter: { player: string, enemy: string }, leaves: { player: boolean, enemy: boolean } }}
 */
export function scontroTransition(scontri, index) {
  const current = scontri[index];
  const next = scontri[index + 1];
  if (!current || !next) return null;
  const enter = {};
  const leaves = {};
  for (const side of SIDES) {
    const incoming = agentOf(next, side);
    const other = side === 'player' ? 'enemy' : 'player';
    if (sameAgent(agentOf(current, side), incoming)) enter[side] = 'stay';
    else if (sameAgent(agentOf(current, other), incoming)) enter[side] = 'swap';
    else enter[side] = 'advance';
    const here = agentOf(current, side);
    leaves[side] = !SIDES.some((s) => sameAgent(agentOf(next, s), here));
  }
  return { enter, leaves };
}

/** Scontri del turno 2v2 nella prospettiva della scena. */
export function teamScontri(roundResult) {
  return (roundResult?.fronts || []).map((f) => {
    const playerFirst = f.playerSeatId === f.firstSeatId;
    return {
      playerSeatId: f.playerSeatId,
      enemySeatId: f.enemySeatId,
      playerCardId: playerFirst ? f.firstCardId : f.secondCardId,
      enemyCardId: playerFirst ? f.secondCardId : f.firstCardId,
    };
  });
}

/** Scontri della contesa del Re della collina nella prospettiva della scena. */
export function kothScontri(contestResult) {
  return (contestResult?.fights || []).map((f) => {
    const playerFirst = f.playerSeatId === f.firstSeatId;
    return {
      playerSeatId: f.playerSeatId,
      enemySeatId: f.enemySeatId,
      playerCardId: playerFirst ? f.firstCardId : f.secondCardId,
      enemyCardId: playerFirst ? f.secondCardId : f.firstCardId,
    };
  });
}
