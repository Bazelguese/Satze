/**
 * Chi ha l'iniziativa in un dato round.
 * Non usare toggle su stato precedente: è fragile se advanceRound viene chiamato due volte.
 *
 * Regole:
 * - Core / neutral: alterna da openingPlayerFirst (R1 = opening, R2 = !opening, …).
 * - Campagna assault: giocatore nei round 1–2, poi alterna (R3 nemico, R4 giocatore, …).
 * - Campagna defense: nemico nei round 1–2, poi alterna (R3 giocatore, R4 nemico, …).
 *
 * @param {{
 *   roundNumber: number,
 *   openingPlayerFirst: boolean,
 *   initiativeProfile?: 'assault'|'defense'|null,
 * }} args
 * @returns {boolean} true se il giocatore locale ha l'iniziativa
 */
export function resolveRoundInitiative({
  roundNumber,
  openingPlayerFirst,
  initiativeProfile = null,
}) {
  const round = Math.max(1, Number(roundNumber) || 1);
  const opening = Boolean(openingPlayerFirst);

  if (initiativeProfile === 'assault' && round <= 2) return true;
  if (initiativeProfile === 'defense' && round <= 2) return false;

  if (initiativeProfile === 'assault' || initiativeProfile === 'defense') {
    // Dopo la coppia forzata: R2 ha lo stesso valore di R1 (= opening), poi si alterna.
    return opening === (round % 2 === 0);
  }

  return opening === (round % 2 === 1);
}
