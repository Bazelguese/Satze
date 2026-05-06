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
}) {
  const pPot = pPower ?? pAgent.power;
  const ePot = ePower ?? eAgent.power;
  if (pAssault > eAssault) {
    battleLog.push(`⚔️ ${pAssault} > ${eAssault} → Vinci tu!`);
    return 'player';
  }
  if (eAssault > pAssault) {
    battleLog.push(`⚔️ ${eAssault} > ${pAssault} → Vince l'IA`);
    return 'enemy';
  }
  if (pAgent.league < eAgent.league) {
    battleLog.push('⚖️ Parità VA! Vinci tu (Lega più bassa)');
    return 'player';
  }
  if (eAgent.league < pAgent.league) {
    battleLog.push("⚖️ Parità VA! Vince l'IA (Lega più bassa)");
    return 'enemy';
  }
  if (pPot < ePot) {
    battleLog.push('⚖️ Parità VA e Lega! Vinci tu (POT più bassa)');
    return 'player';
  }
  if (ePot < pPot) {
    battleLog.push("⚖️ Parità VA e Lega! Vince l'IA (POT più bassa)");
    return 'enemy';
  }
  const w = isPlayerFirst ? 'enemy' : 'player';
  battleLog.push(
    w === 'player'
      ? '⚖️ Parità VA, Lega e POT! Vinci tu (hai giocato per secondo)'
      : "⚖️ Parità VA, Lega e POT! Vince l'IA (ha giocato per secondo)"
  );
  return w;
}
