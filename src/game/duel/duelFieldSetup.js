// ============================================
// Effetti campo prima di poteri / bonus (duello)
// ============================================

import { applyFieldMinFloor, attachFieldModifiersToContexts, getFieldSetupFlags } from '../battlefieldEffects.js';
import { computeFieldStatDeltas } from './duelFieldStatTracking.js';

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
    maxFCByLeague,
    directDamageBonus,
    positivePowerModifiersDisabled,
    positiveDamageModifiersDisabled,
  } = flags;
  const overdriveThreshold = fieldModifiers.overdriveThreshold;
  const triggersIgnored = fieldModifiers.triggersIgnored;

  if (maxFCByLeague) {
    const pMax = pAgent?.league ?? 1;
    const eMax = eAgent?.league ?? 1;
    const pFCBefore = duel.pFocusUsed;
    const eFCBefore = duel.eFocusUsed;
    if (duel.pFocusUsed > pMax) duel.pFocusUsed = pMax;
    if (duel.eFocusUsed > eMax) duel.eFocusUsed = eMax;
    battleLog.push(
      `🏯 ${fn}: FC max = Lega | TU ${pFCBefore}→${duel.pFocusUsed} (max ${pMax}) | IA ${eFCBefore}→${duel.eFocusUsed} (max ${eMax})`
    );
  } else if (maxFC !== null) {
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
  const fieldStatBaseline = {
    pPower: duel.pPower,
    ePower: duel.ePower,
    pDamage: duel.pDamage,
    eDamage: duel.eDamage,
    pAssaultMod: duel.pAssaultMod,
    eAssaultMod: duel.eAssaultMod,
  };
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

  // Lizza del Palazzo d'Onice (96): DAN = Lega prima dei successivi modificatori
  if (id === 96) {
    pDamage = pAgent?.league ?? pDamage;
    eDamage = eAgent?.league ?? eDamage;
    battleLog.push(`🏛️ ${fn}: DAN = Lega`);
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
    } else if (id === 84) {
      if (pAgent.league > eAgent.league) pAssaultMod += 5;
      else if (eAgent.league > pAgent.league) eAssaultMod += 5;
      battleLog.push(`🪦 ${fn}: +5 VA a Lega più alta`);
    } else if (id === 87) {
      const pFields = playerContext.playerFieldsConquered ?? 0;
      const eFields = playerContext.enemyFieldsConquered ?? 0;
      if (pFields < eFields && !pImmune) pPower -= 1;
      else if (eFields < pFields && !eImmune) ePower -= 1;
      battleLog.push(`🧊 ${fn}: −1 POT a chi ha meno Campi conquistati`);
    } else if (id === 90) {
      const pHP = duel.pHPCurrent ?? 25;
      const eHP = duel.eHPCurrent ?? 25;
      if (pHP < eHP) pAssaultMod += 4;
      else if (eHP < pHP) eAssaultMod += 4;
      battleLog.push(`⚓ ${fn}: +4 VA a chi ha meno PV`);
    } else if (id === 91) {
      if (pAgent.league < eAgent.league) pPower += 1;
      else if (eAgent.league < pAgent.league) ePower += 1;
      battleLog.push(`🪖 ${fn}: +1 POT a Lega più bassa`);
    } else if (id === 92) {
      battleLog.push(`🏚️ ${fn}: −4 VA a DAN più alta (pre-VA)`);
    } else if (id === 93) {
      const pSum = (pAgent.power ?? 0) + (pAgent.damage ?? 0);
      const eSum = (eAgent.power ?? 0) + (eAgent.damage ?? 0);
      if (pSum < eSum) pAssaultMod += 5;
      else if (eSum < pSum) eAssaultMod += 5;
      battleLog.push(`⚔️ ${fn}: +5 VA a somma POT+DAN base più bassa`);
    } else if (id === 95) {
      if (playerContext.isFirst) {
        pAssaultMod += 3;
        eDamage += 1;
      } else {
        eAssaultMod += 3;
        pDamage += 1;
      }
      battleLog.push(`🧱 ${fn}: 1° +3 VA · 2° +1 DAN`);
    } else if (id === 102) {
      if (playerContext.isFirst) eAssaultMod += 3;
      else pAssaultMod += 3;
      battleLog.push(`🗼 ${fn}: +3 VA al 2° giocato`);
    } else if (id === 104) {
      const pFields = playerContext.playerFieldsConquered ?? 0;
      const eFields = playerContext.enemyFieldsConquered ?? 0;
      if (pFields < eFields) pAssaultMod += 5;
      else if (eFields < pFields) eAssaultMod += 5;
      battleLog.push(`🔭 ${fn}: +5 VA a chi ha meno Campi conquistati`);
    } else if (id === 105) {
      if (pAgent.league === eAgent.league) {
        pDamage += 1;
        eDamage += 1;
        battleLog.push(`🗿 ${fn}: stessa Lega · +1 DAN a entrambi`);
      } else {
        battleLog.push(`🗿 ${fn}: Leghe diverse · nessun effetto`);
      }
    } else if (id === 107) {
      if (playerContext.isFirst) pAssaultMod += 3;
      else eAssaultMod += 3;
      battleLog.push(`🏰 ${fn}: +3 VA al 1° giocato`);
    } else if (id === 111) {
      const pHP = duel.pHPCurrent ?? 25;
      const eHP = duel.eHPCurrent ?? 25;
      if (pHP < eHP) pAssaultMod += 4;
      else if (eHP < pHP) eAssaultMod += 4;
      battleLog.push(`🌬️ ${fn}: +4 VA a chi ha meno PV`);
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
    else if (id === 88) battleLog.push(`🌋 ${fn}: Regola · Invasione · sempre attivo`);
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
    } else if (id === 85) battleLog.push(`🗡️ ${fn}: Vincitore · POT finale (parità → VA)`);
    else if (id === 89) battleLog.push(`☀️ ${fn}: Bonus → Invasione: +2 POT, +1 DAN`);
    else if (id === 94) {
      if (pAgent.league === eAgent.league) {
        pAbilityBlocked = true;
        eAbilityBlocked = true;
        battleLog.push(`⚖️ ${fn}: stessa Lega · Poteri disattivati`);
      } else {
        battleLog.push(`⚖️ ${fn}: Leghe diverse · nessun effetto`);
      }
    } else if (id === 96) {
      // DAN già impostato sopra
    } else if (id === 98) battleLog.push(`🖤 ${fn}: modificatori positivi di POT disattivati`);
    else if (id === 99) battleLog.push(`⛓️ ${fn}: POT/DAN entro ±2 dal base (pre-VA)`);
    else if (id === 108) battleLog.push(`🧱 ${fn}: Vincitore · DAN finale (parità → VA)`);
    else if (id === 109) {
      pBonusBlocked = true;
      eBonusBlocked = true;
      battleLog.push(`📡 ${fn}: Bonus Armata disattivati`);
    }     else if (id === 110) battleLog.push(`💧 ${fn}: modificatori positivi di DAN disattivati`);
    else if (id === 112) battleLog.push(`🌲 ${fn}: POT finale max 7 (pre-VA)`);
    else if (id === 114) battleLog.push(`🏟️ ${fn}: Effetti Overdrive disattivati`);
    else if (id === 115) battleLog.push(`💍 ${fn}: Tossina disattivata`);
    else if (id === 118) battleLog.push(`🖤 ${fn}: Copia ↔ Imponi`);
    else if (id === 120) battleLog.push(`🖼️ ${fn}: Bonus Armata scambiati`);
    else if (id === 121) battleLog.push(`🏛️ ${fn}: Effetti Conquista disattivati`);
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

  if (id === 101) {
    if (pFocusUsed === 3) pAssaultMod += 4;
    if (eFocusUsed === 3) eAssaultMod += 4;
    battleLog.push(`🌉 ${fn}: +4 VA a chi investe esattamente 3 FC`);
  }

  if (id === 116) {
    battleLog.push(`⚖️ ${fn}: Calcolo VA · max 6 FC conteggiati`);
  }

  if (id === 117) {
    battleLog.push(`🎭 ${fn}: +1 POT se Potere o Bonus disattivato (pre-VA)`);
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

  const fieldStatDeltas = computeFieldStatDeltas(fieldStatBaseline, {
    pPower,
    ePower,
    pDamage,
    eDamage,
    pAssaultMod,
    eAssaultMod,
  });
  if (id === 7 || id === 20) {
    fieldStatDeltas.invertible = false;
  }

  return {
    fieldStatDeltas,
    blockDisabled,
    copyDisabled,
    directDamageDisabled,
    modifiersDisabled,
    maxDamage,
    maxFC,
    maxFCByLeague: Boolean(maxFCByLeague),
    directDamageBonus,
    overdriveThreshold,
    triggersIgnored,
    winnerByFocusNotVa: flags.winnerByFocusNotVa,
    winnerByFinalPowerThenVa: flags.winnerByFinalPowerThenVa === true,
    winnerByFinalDamageThenVa: flags.winnerByFinalDamageThenVa === true,
    vaModifiersDouble: flags.vaModifiersDouble === true,
    positivePowerModifiersDisabled: positivePowerModifiersDisabled === true,
    positiveDamageModifiersDisabled: positiveDamageModifiersDisabled === true,
    clampPowerDamageToBasePlusMinus2: flags.clampPowerDamageToBasePlusMinus2 === true,
    maxFinalPower: flags.maxFinalPower ?? null,
    maxFocusCountedInVa: flags.maxFocusCountedInVa ?? null,
    overdriveDisabled: flags.overdriveDisabled === true,
    toxinDisabled: flags.toxinDisabled === true,
    swapCopyImponi: flags.swapCopyImponi === true,
    conquestDisabled: flags.conquestDisabled === true,
    focusHalvedInVa: flags.focusHalvedInVa,
    conquestDouble: flags.conquestDouble === true,
    lastWishDouble: flags.lastWishDouble === true,
    minFloorReduction: flags.minFloorReduction || 0,
  };
}
