import { emitOutcome, toBattleSide } from './battleEventEmit.js';

function pushLog(log, message) {
  if (log && typeof log.push === 'function') log.push(message);
}

function emitWinner(battleLog, winnerEngineSide, pAssault, eAssault, tieBreakCode, tieBreakData) {
  if (!battleLog || typeof battleLog.emit !== 'function') return;
  emitOutcome(battleLog, {
    winnerSide: toBattleSide(winnerEngineSide),
    localVA: pAssault,
    opponentVA: eAssault,
    tieBreakCode,
    tieBreakData,
  });
}

/** @returns {'player'|'enemy'} */
export function resolveDuelWinnerByAssault({
  pAssault,
  eAssault,
  pAgent,
  eAgent,
  pPower,
  ePower,
  isPlayerFirst,
  battleLog,
  vaTieWinnerSide = null,
}) {
  const pPot = pPower ?? pAgent.power;
  const ePot = ePower ?? eAgent.power;
  if (pAssault > eAssault) {
    pushLog(battleLog, `${pAssault} > ${eAssault} → Vinci tu!`);
    emitWinner(battleLog, 'player', pAssault, eAssault, null, null);
    return 'player';
  }
  if (eAssault > pAssault) {
    pushLog(battleLog, `${eAssault} > ${pAssault} → Vince l'IA`);
    emitWinner(battleLog, 'enemy', pAssault, eAssault, null, null);
    return 'enemy';
  }
  if (vaTieWinnerSide === 'player' || vaTieWinnerSide === 'enemy') {
    const ownWin = vaTieWinnerSide === 'player';
    pushLog(battleLog, ownWin ? 'Parità VA! Vinci tu' : "Parità VA! Vince l'IA");
    emitWinner(battleLog, vaTieWinnerSide, pAssault, eAssault, 'vaTieSide', null);
    return vaTieWinnerSide;
  }
  if (pAgent.league < eAgent.league) {
    pushLog(battleLog, 'Parità VA! Vinci tu (Lega più bassa)');
    emitWinner(battleLog, 'player', pAssault, eAssault, 'league', {
      localLeague: pAgent.league,
      opponentLeague: eAgent.league,
    });
    return 'player';
  }
  if (eAgent.league < pAgent.league) {
    pushLog(battleLog, "Parità VA! Vince l'IA (Lega più bassa)");
    emitWinner(battleLog, 'enemy', pAssault, eAssault, 'league', {
      localLeague: pAgent.league,
      opponentLeague: eAgent.league,
    });
    return 'enemy';
  }
  if (pPot < ePot) {
    pushLog(battleLog, 'Parità VA e Lega! Vinci tu (POT più bassa)');
    emitWinner(battleLog, 'player', pAssault, eAssault, 'power', { localPower: pPot, opponentPower: ePot });
    return 'player';
  }
  if (ePot < pPot) {
    pushLog(battleLog, "Parità VA e Lega! Vince l'IA (POT più bassa)");
    emitWinner(battleLog, 'enemy', pAssault, eAssault, 'power', { localPower: pPot, opponentPower: ePot });
    return 'enemy';
  }
  const w = isPlayerFirst ? 'enemy' : 'player';
  pushLog(
    battleLog,
    w === 'player'
      ? 'Parità VA, Lega e POT! Vinci tu (hai giocato per secondo)'
      : "Parità VA, Lega e POT! Vince l'IA (ha giocato per secondo)"
  );
  emitWinner(battleLog, w, pAssault, eAssault, 'secondPlayer', { isPlayerFirst });
  return w;
}
