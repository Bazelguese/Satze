// Calcolo VA, log intermedio animazione, risultato VA nel log.
import {
  emitAssaultCalculation,
  makeAgentTarget,
} from './battleEventEmit.js';

function pushLog(log, message) {
  if (log && typeof log.push === 'function') log.push(message);
}

export function runDuelAssaultCalculation(battleLog, {
  pAgent,
  eAgent,
  pPower,
  ePower,
  pFocusUsed,
  eFocusUsed,
  pAssaultMod,
  eAssaultMod,
  pMinAssault,
  eMinAssault,
}) {
  const pAssaultRaw = pPower * pFocusUsed + pAssaultMod;
  const eAssaultRaw = ePower * eFocusUsed + eAssaultMod;
  const pMinBase = pPower;
  const eMinBase = ePower;
  const pMinFinal = pMinAssault !== null ? pMinAssault : pMinBase;
  const eMinFinal = eMinAssault !== null ? eMinAssault : eMinBase;
  const pAssault = Math.max(pMinFinal, pAssaultRaw);
  const eAssault = Math.max(eMinFinal, eAssaultRaw);

  pushLog(battleLog, `━━━ CALCOLO VA ━━━`);
  const pMinText = pAssaultRaw < pMinFinal ? ` → ${pAssault} (min ${pMinFinal})` : '';
  const eMinText = eAssaultRaw < eMinFinal ? ` → ${eAssault} (min ${eMinFinal})` : '';
  pushLog(
    battleLog,
    `TU: ${pPower} POT × ${pFocusUsed} FC${pAssaultMod !== 0 ? ` ${pAssaultMod > 0 ? '+' : ''}${pAssaultMod} mod` : ''} = ${pAssaultRaw}${pMinText}`
  );
  pushLog(
    battleLog,
    `IA: ${ePower} POT × ${eFocusUsed} FC${eAssaultMod !== 0 ? ` ${eAssaultMod > 0 ? '+' : ''}${eAssaultMod} mod` : ''} = ${eAssaultRaw}${eMinText}`
  );

  if (pAssaultRaw < pMinFinal) {
    pushLog(
      battleLog,
      `Il tuo VA era ${pAssaultRaw}, ma non può scendere sotto ${pMinFinal}${pMinAssault !== null ? ` (minAssault ${pMinAssault})` : ` (POT corrente ${pPower})`}`
    );
  }
  if (eAssaultRaw < eMinFinal) {
    pushLog(
      battleLog,
      `VA IA era ${eAssaultRaw}, ma non può scendere sotto ${eMinFinal}${eMinAssault !== null ? ` (minAssault ${eMinAssault})` : ` (POT corrente ${ePower})`}`
    );
  }

  const pAssaultBase = pAgent.power;
  const eAssaultBase = eAgent.power;
  const pPowerAfterEffects = pPower;
  const ePowerAfterEffects = ePower;
  const pAssaultAfterFocus = Math.max(pMinBase, pPower * pFocusUsed);
  const eAssaultAfterFocus = Math.max(eMinBase, ePower * eFocusUsed);

  pushLog(battleLog, `━━━ RISULTATO ━━━`);
  pushLog(battleLog, `VA FINALE: Tu ${pAssault} vs IA ${eAssault}`);

  if (battleLog && typeof battleLog.emit === 'function') {
    emitAssaultCalculation(battleLog, {
      target: makeAgentTarget('player', pAgent),
      basePower: pPower,
      focus: pFocusUsed,
      modifiers: pAssaultMod,
      floorApplied: pAssaultRaw < pMinFinal,
      floorValue: pMinFinal,
      rawVA: pAssaultRaw,
      finalVA: pAssault,
    });
    emitAssaultCalculation(battleLog, {
      target: makeAgentTarget('enemy', eAgent),
      basePower: ePower,
      focus: eFocusUsed,
      modifiers: eAssaultMod,
      floorApplied: eAssaultRaw < eMinFinal,
      floorValue: eMinFinal,
      rawVA: eAssaultRaw,
      finalVA: eAssault,
    });
  }

  return {
    pAssaultRaw,
    eAssaultRaw,
    pAssault,
    eAssault,
    pMinFinal,
    eMinFinal,
    pAssaultBase,
    eAssaultBase,
    pPowerAfterEffects,
    ePowerAfterEffects,
    pAssaultAfterFocus,
    eAssaultAfterFocus,
  };
}
