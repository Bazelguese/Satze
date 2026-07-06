// ============================================
// Effetti campo prima di poteri / bonus (duello)
// ============================================

import { applyFieldMinFloor, attachFieldModifiersToContexts, getFieldSetupFlags } from '../battlefieldEffects.js';

export function applyDuelFieldSetup(duel, field, battleLog, pAgent, eAgent, playerContext, enemyContext) {
  const id = field?.id ?? 0;
  const flags = getFieldSetupFlags(field);
  const fn = field.name;

  if (flags.immuneDisabled) {
    duel.pImmune = false;
    duel.eImmune = false;
    battleLog.push('⚡ Mura EMP: Immune disabilitato!');
  }

  if (flags.forceBothImmune) {
    duel.pImmune = true;
    duel.eImmune = true;
    battleLog.push(`🛡️ ${fn}: Entrambi Immune`);
  }

  attachFieldModifiersToContexts(field, playerContext, enemyContext);
  const fieldModifiers = playerContext.fieldModifiers || {};

  const {
    blockDisabled,
    copyDisabled,
    directDamageDisabled,
    modifiersDisabled,
    maxDamage,
    maxFC,
    directDamageBonus,
  } = flags;
  const overdriveThreshold = fieldModifiers.overdriveThreshold;
  const triggersIgnored = fieldModifiers.triggersIgnored;

  if (maxFC !== null) {
    const pFCBefore = duel.pFocusUsed;
    const eFCBefore = duel.eFocusUsed;
    if (duel.pFocusUsed > maxFC) duel.pFocusUsed = maxFC;
    if (duel.eFocusUsed > maxFC) duel.eFocusUsed = maxFC;
    if (pFCBefore > maxFC || eFCBefore > maxFC) {
      battleLog.push(
        `🌀 ${fn}: FC max ${maxFC} | TU ${pFCBefore} → ${duel.pFocusUsed} | IA ${eFCBefore} → ${duel.eFocusUsed}`
      );
    } else {
      battleLog.push(`🌀 ${fn}: FC max ${maxFC} (nessun cambio)`);
    }
  }

  const { pImmune, eImmune } = duel;
  let pPower = duel.pPower;
  let ePower = duel.ePower;
  let pDamage = duel.pDamage;
  let eDamage = duel.eDamage;
  let pFocusUsed = duel.pFocusUsed;
  let eFocusUsed = duel.eFocusUsed;
  let pAssaultMod = duel.pAssaultMod;
  let eAssaultMod = duel.eAssaultMod;
  let pAbilityBlocked = duel.pAbilityBlocked;
  let eAbilityBlocked = duel.eAbilityBlocked;
  let pBonusBlocked = duel.pBonusBlocked;
  let eBonusBlocked = duel.eBonusBlocked;

  const minRed = flags.minFloorReduction || 0;

  if (flags.maxPower != null) {
    pPower = Math.min(pPower, flags.maxPower);
    ePower = Math.min(ePower, flags.maxPower);
    battleLog.push(`🐉 ${fn}: POT max ${flags.maxPower}`);
  }

  if (field.category === 'values' || id === 2) {
    if (id === 1) {
      pPower += 4;
      ePower += 4;
      battleLog.push(`⛰️ ${fn}: +4 POT a entrambi`);
    } else if (id === 2) {
      if (!pImmune) pPower -= 1;
      pDamage += 1;
      if (!eImmune) ePower -= 1;
      eDamage += 1;
      battleLog.push(`🌙 ${fn}: -1 POT, +1 DAN a entrambi`);
    } else if (id === 5) {
      if (!pImmune) pDamage = Math.max(0, pDamage - 2);
      if (!eImmune) eDamage = Math.max(0, eDamage - 2);
      battleLog.push(`🪺 ${fn}: -2 DAN a entrambi`);
    } else if (id === 7) {
      if (!pImmune && !eImmune) {
        [pPower, ePower] = [ePower, pPower];
        battleLog.push(`🪞 ${fn}: POT scambiate`);
      }
    } else if (id === 13 || id === 50) {
      pDamage += 2;
      eDamage += 2;
      battleLog.push(`🦁 ${fn}: +2 DAN a entrambi`);
    } else if (id === 26) {
      pDamage += 1;
      eDamage += 1;
      battleLog.push(`🔥 ${fn}: +1 DAN a entrambi`);
    } else if (id === 19) {
      pPower += 1;
      ePower += 1;
      battleLog.push(`🌌 ${fn}: +1 POT a entrambi`);
    } else if (id === 20) {
      [pPower, pDamage] = [pDamage, pPower];
      [ePower, eDamage] = [eDamage, ePower];
      battleLog.push(`⚫ ${fn}: POT ↔ DAN invertiti`);
    } else if (id === 21) {
      if (!pImmune) pAssaultMod -= 2;
      if (!eImmune) eAssaultMod -= 2;
      battleLog.push(`✨ ${fn}: -2 VA a entrambi`);
    } else if (id === 42) {
      if (!pImmune) pPower = applyFieldMinFloor(pPower - 3, 1, minRed);
      if (!eImmune) ePower = applyFieldMinFloor(ePower - 3, 1, minRed);
      battleLog.push(`💀 ${fn}: -3 POT (min ridotto)`);
    } else if (id === 47) {
      if (pAgent.league > eAgent.league && !pImmune) pAssaultMod -= 5;
      else if (eAgent.league > pAgent.league && !eImmune) eAssaultMod -= 5;
      battleLog.push(`⚖️ ${fn}: -5 VA a Lega più alta`);
    } else if (id === 35) {
      if (!pImmune) {
        pPower = Math.max(1, pPower - 2);
        pDamage = Math.max(0, pDamage - 2);
      }
      if (!eImmune) {
        ePower = Math.max(1, ePower - 2);
        eDamage = Math.max(0, eDamage - 2);
      }
      battleLog.push(`🌑 ${fn}: -2 POT e -2 DAN`);
    } else if (id === 69) {
      if (pPower > ePower && !pImmune) pPower -= 1;
      else if (ePower > pPower && !eImmune) ePower -= 1;
      battleLog.push(`🌫️ ${fn}: -1 POT al più forte`);
    } else if (id === 75) {
      if (!pImmune) pPower -= 1;
      if (!eImmune) ePower -= 1;
      if (!pImmune) pAssaultMod -= 3;
      if (!eImmune) eAssaultMod -= 3;
      battleLog.push(`🚗 ${fn}: -1 POT, -3 VA a entrambi`);
    } else if (id === 78) {
      pAssaultMod += 4;
      eAssaultMod += 4;
      battleLog.push(`🔷 ${fn}: +4 VA a entrambi`);
    } else if (id === 71) {
      if (pAgent.power < eAgent.power) pAssaultMod += 5;
      else if (eAgent.power < pAgent.power) eAssaultMod += 5;
      battleLog.push(`🦴 ${fn}: +5 VA alla carta con meno POT`);
    }
  }

  if (id === 9) {
    pFocusUsed *= 2;
    eFocusUsed *= 2;
    battleLog.push(`🌊 ${fn}: Calcolo VA · FC ×2`);
  }

  if (id === 76) {
    pDamage += Math.floor(pFocusUsed / 3);
    eDamage += Math.floor(eFocusUsed / 3);
    battleLog.push(`⛽ ${fn}: +1 DAN ogni 3 FC propri`);
  }

  if (field.category === 'limit' || field.category === 'trigger') {
    if (id === 3) {
      pAbilityBlocked = true;
      eAbilityBlocked = true;
      battleLog.push(`🎪 ${fn}: Poteri annullati`);
    } else if (id === 6) {
      pBonusBlocked = true;
      eBonusBlocked = true;
      battleLog.push(`🛕 ${fn}: Bonus annullati`);
    } else if (id === 14) {
      pAbilityBlocked = eAbilityBlocked = pBonusBlocked = eBonusBlocked = true;
      battleLog.push(`🤫 ${fn}: Poteri e Bonus annullati`);
    } else if (id === 15) battleLog.push(`🔮 ${fn}: DAN massimo = 4`);
    else if (id === 24) battleLog.push(`📜 ${fn}: Blocca Potere/Bonus non funzionano`);
    else if (id === 27) battleLog.push(`🕳️ ${fn}: Effetti Copia annullati`);
    else if (id === 43) battleLog.push(`🛡️ ${fn}: DAN diretti annullati`);
    else if (id === 32) battleLog.push(`🪞 ${fn}: Modificatori POT/DAN annullati`);
    else if (id === 22) battleLog.push(`🧱 ${fn}: Gloria, Vendetta sempre attivo`);
    else if (id === 39) battleLog.push(`🧱 ${fn}: Regola · Rimonta · sempre attivo`);
    else if (id === 41) battleLog.push(`🔀 ${fn}: Regola · Poteri · sempre attivi`);
    else if (id === 29) battleLog.push(`☢️ ${fn}: Regola · Overdrive · 4 FC necessari`);
    else if (id === 45) battleLog.push(`⭐ ${fn}: Regola · Intervento · sempre attivo`);
    else if (id === 49) battleLog.push(`🍯 ${fn}: Regola · Imboscata · sempre attivo`);
    else if (id === 31) battleLog.push(`✴️ ${fn}: Regola · Magnanimo · sempre attivo`);
    else if (id === 58) battleLog.push(`🌳 ${fn}: Regola · Resa dei conti · sempre attivo`);
    else if (id === 72) battleLog.push(`🛣️ ${fn}: Regola · Turbo · sempre attivo`);
    else if (id === 83) battleLog.push(`📜 ${fn}: Regola · Resistenza · sempre attivo`);
    else if (id === 68) battleLog.push(`👑 ${fn}: Regola · Ultimo Desiderio · ×2`);
    else if (id === 59) battleLog.push(`🦷 ${fn}: Imboscata/Intervento invertiti`);
    else if (id === 73) battleLog.push(`🌉 ${fn}: Turbo/Ultima Chance invertiti`);
    else if (id === 74) battleLog.push(`🏁 ${fn}: Circuito Sfida/Sopraffare`);
    else if (id === 77 && !playerContext.isFirst) {
      pAbilityBlocked = true;
      battleLog.push(`🚧 ${fn}: Tu perdi il Potere (secondo)`);
    } else if (id === 77 && playerContext.isFirst) {
      eAbilityBlocked = true;
      battleLog.push(`🚧 ${fn}: IA perde il Potere (secondo)`);
    }
  }

  if (id === 56) {
    const pHP = duel.pHPCurrent ?? 25;
    const eHP = duel.eHPCurrent ?? 25;
    if (pHP < eHP) pAssaultMod += 3;
    else if (eHP < pHP) eAssaultMod += 3;
    battleLog.push(`👑 ${fn}: Rimonta · +3 VA`);
  }

  if (playerContext.isFirst) {
    if (id === 64) {
      if (!pImmune) pPower += 1;
      battleLog.push(`🥚 ${fn}: Imboscata · +1 POT (Tu)`);
    }
  } else if (id === 64) {
    if (!eImmune) ePower += 1;
    battleLog.push(`🥚 ${fn}: Imboscata · +1 POT (IA)`);
  }

  if (id === 18) {
    if (pFocusUsed < eFocusUsed) pAssaultMod += 5;
    else if (eFocusUsed < pFocusUsed) eAssaultMod += 5;
    battleLog.push(`📚 ${fn}: +5 VA a chi investe meno FC`);
  }

  if (flags.imposeDamageFromPower) {
    pDamage = pPower;
    eDamage = ePower;
    battleLog.push(`⚱️ ${fn}: DAN imposto = POT`);
  }

  Object.assign(duel, {
    pPower,
    ePower,
    pDamage,
    eDamage,
    pFocusUsed,
    eFocusUsed,
    pAssaultMod,
    eAssaultMod,
    pAbilityBlocked,
    eAbilityBlocked,
    pBonusBlocked,
    eBonusBlocked,
  });

  return {
    blockDisabled,
    copyDisabled,
    directDamageDisabled,
    modifiersDisabled,
    maxDamage,
    maxFC,
    directDamageBonus,
    overdriveThreshold,
    triggersIgnored,
    winnerByFocusNotVa: flags.winnerByFocusNotVa,
    focusHalvedInVa: flags.focusHalvedInVa,
    conquestDouble: flags.conquestDouble === true,
    lastWishDouble: flags.lastWishDouble === true,
    minFloorReduction: flags.minFloorReduction || 0,
  };
}
