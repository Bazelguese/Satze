/**
 * Scommessa FC "PERFECT": il vincitore ha investito il minimo necessario a vincere
 * (non uno di più, non uno di meno), a parità di POT/mod/floor del duello già risolto.
 */
import { getFieldSetupFlags } from '../battlefieldEffects.js';
import { MIN_FOCUS_INVESTMENT } from '../legalFocusSpend.js';
import { resolveDuelWinnerByAssault } from './duelWinnerResolve.js';

function focusCountedInVa(fc, flags) {
  let n = flags?.focusHalvedInVa ? Math.ceil(fc / 2) : fc;
  if (flags?.maxFocusCountedInVa != null) n = Math.min(n, flags.maxFocusCountedInVa);
  return n;
}

function assaultFromParts(power, focusCounted, mod, minFinal) {
  const raw = power * focusCounted + mod;
  return Math.max(minFinal, raw);
}

function sidePower(br, side) {
  if (side === 'player') {
    return br.playerPowerAfterEffects ?? br.playerPower ?? br.playerAgent?.power ?? 0;
  }
  return br.enemyPowerAfterEffects ?? br.enemyPower ?? br.enemyAgent?.power ?? 0;
}

function sideAssaultMod(br, side, flags) {
  const power = sidePower(br, side);
  const focusUsed = side === 'player' ? br.playerFocusUsed : br.enemyFocusUsed;
  const counted = focusCountedInVa(focusUsed || 0, flags);
  const raw =
    side === 'player'
      ? (br.playerAssaultRaw ?? br.playerAssault ?? 0)
      : (br.enemyAssaultRaw ?? br.enemyAssault ?? 0);
  return raw - power * counted;
}

function sideMinFinal(br, side) {
  if (side === 'player') {
    return br.playerAssaultMinFinal ?? sidePower(br, 'player');
  }
  return br.enemyAssaultMinFinal ?? sidePower(br, 'enemy');
}

/**
 * Ricalcola il vincitore con FC ipotetici, usando POT/mod/floor del risultato già noto.
 * @returns {'player'|'enemy'}
 */
export function resolveWinnerWithHypotheticalFocus(battleResult, playerFocus, enemyFocus) {
  const br = battleResult;
  const flags = getFieldSetupFlags(br.field);
  const pPower = sidePower(br, 'player');
  const ePower = sidePower(br, 'enemy');
  const pMod = sideAssaultMod(br, 'player', flags);
  const eMod = sideAssaultMod(br, 'enemy', flags);
  const pMin = sideMinFinal(br, 'player');
  const eMin = sideMinFinal(br, 'enemy');
  const pAssault = assaultFromParts(
    pPower,
    focusCountedInVa(playerFocus, flags),
    pMod,
    pMin
  );
  const eAssault = assaultFromParts(
    ePower,
    focusCountedInVa(enemyFocus, flags),
    eMod,
    eMin
  );
  const pDamage = br.playerDamage ?? br.playerAgent?.damage ?? 0;
  const eDamage = br.enemyDamage ?? br.enemyAgent?.damage ?? 0;
  const pAgent = br.playerAgent;
  const eAgent = br.enemyAgent;
  const isPlayerFirst = br.isPlayerFirst !== false;

  if (flags.winnerByFocusNotVa) {
    if (playerFocus > enemyFocus) return 'player';
    if (enemyFocus > playerFocus) return 'enemy';
    return resolveDuelWinnerByAssault({
      pAssault,
      eAssault,
      pAgent,
      eAgent,
      pPower,
      ePower,
      isPlayerFirst,
      battleLog: null,
    });
  }

  if (flags.winnerByFinalPowerThenVa) {
    if (pPower > ePower) return 'player';
    if (ePower > pPower) return 'enemy';
    if (pAssault > eAssault) return 'player';
    if (eAssault > pAssault) return 'enemy';
    return resolveDuelWinnerByAssault({
      pAssault,
      eAssault,
      pAgent,
      eAgent,
      pPower,
      ePower,
      isPlayerFirst,
      battleLog: null,
    });
  }

  if (flags.winnerByFinalDamageThenVa) {
    if (pDamage > eDamage) return 'player';
    if (eDamage > pDamage) return 'enemy';
    if (pAssault > eAssault) return 'player';
    if (eAssault > pAssault) return 'enemy';
    return resolveDuelWinnerByAssault({
      pAssault,
      eAssault,
      pAgent,
      eAgent,
      pPower,
      ePower,
      isPlayerFirst,
      battleLog: null,
    });
  }

  return resolveDuelWinnerByAssault({
    pAssault,
    eAssault,
    pAgent,
    eAgent,
    pPower,
    ePower,
    isPlayerFirst,
    battleLog: null,
  });
}

/**
 * True se la vittoria è "decisiva" per PERFECT (non da pareggio VA con lega uguale).
 * - VA stretto maggiore, oppure
 * - più FC sul campo winnerByFocusNotVa, oppure
 * - VA pari ma lega diversa (vince la lega più bassa).
 * Escluso: VA pari + lega pari (POT / secondo giocatore).
 */
function hasPerfectEligibleWin(battleResult, side) {
  const br = battleResult;
  const flags = getFieldSetupFlags(br.field);
  const pFocus = br.playerFocusUsed ?? 0;
  const eFocus = br.enemyFocusUsed ?? 0;
  const pAssault = br.playerAssault ?? 0;
  const eAssault = br.enemyAssault ?? 0;
  const pLeague = br.playerAgent?.league;
  const eLeague = br.enemyAgent?.league;

  if (flags.winnerByFocusNotVa) {
    if (side === 'player') return pFocus > eFocus;
    return eFocus > pFocus;
  }

  if (flags.winnerByFinalPowerThenVa) {
    const pPower = sidePower(br, 'player');
    const ePower = sidePower(br, 'enemy');
    if (pPower !== ePower) return false; // vittoria per POT, non per scommessa FC
    if (side === 'player') {
      if (pAssault > eAssault) return true;
      if (pAssault < eAssault) return false;
    } else {
      if (eAssault > pAssault) return true;
      if (eAssault < pAssault) return false;
    }
    // VA pari dopo parità POT: solo se lega diversa
    return pLeague != null && eLeague != null && pLeague !== eLeague;
  }

  if (flags.winnerByFinalDamageThenVa) {
    const pDamage = br.playerDamage ?? br.playerAgent?.damage ?? 0;
    const eDamage = br.enemyDamage ?? br.enemyAgent?.damage ?? 0;
    if (pDamage !== eDamage) return false;
    if (side === 'player') {
      if (pAssault > eAssault) return true;
      if (pAssault < eAssault) return false;
    } else {
      if (eAssault > pAssault) return true;
      if (eAssault < pAssault) return false;
    }
    return pLeague != null && eLeague != null && pLeague !== eLeague;
  }

  if (side === 'player') {
    if (pAssault > eAssault) return true;
    if (pAssault < eAssault) return false;
  } else {
    if (eAssault > pAssault) return true;
    if (eAssault < pAssault) return false;
  }

  // Pareggio VA: ammissibile solo se le leghe differiscono
  if (pLeague == null || eLeague == null) return false;
  if (pLeague === eLeague) return false;
  return true;
}

/**
 * True se `side` ha vinto spendendo esattamente il minimo FC necessario.
 * @param {object} battleResult
 * @param {'player'|'enemy'} side
 */
export function isPerfectFocusBet(battleResult, side) {
  if (!battleResult || (side !== 'player' && side !== 'enemy')) return false;
  if (battleResult.winner !== side) return false;
  if (!hasPerfectEligibleWin(battleResult, side)) return false;

  const playerFocus = battleResult.playerFocusUsed ?? 0;
  const enemyFocus = battleResult.enemyFocusUsed ?? 0;
  const focus = side === 'player' ? playerFocus : enemyFocus;
  if (focus < MIN_FOCUS_INVESTMENT) return false;

  if (focus <= MIN_FOCUS_INVESTMENT) return true;

  const hypoPlayer = side === 'player' ? focus - 1 : playerFocus;
  const hypoEnemy = side === 'enemy' ? focus - 1 : enemyFocus;
  const winnerWithLess = resolveWinnerWithHypotheticalFocus(
    battleResult,
    hypoPlayer,
    hypoEnemy
  );
  return winnerWithLess !== side;
}

/**
 * @returns {'player'|'enemy'|null}
 */
export function getPerfectFocusSide(battleResult) {
  if (!battleResult?.winner) return null;
  if (isPerfectFocusBet(battleResult, 'player')) return 'player';
  if (isPerfectFocusBet(battleResult, 'enemy')) return 'enemy';
  return null;
}
