// ============================================
// Effetti campo prima di poteri / bonus (duello)
// ============================================

/**
 * Muta `duel` e i context; imposta flag su playerContext/enemyContext.fieldModifiers.
 *
 * @param {Object} duel - stato mutabile (pImmune, pPower, pFocusUsed, …)
 * @param {Object} field
 * @param {string[]} battleLog
 * @param {Object} pAgent
 * @param {Object} eAgent
 * @param {Object} playerContext
 * @param {Object} enemyContext
 * @returns {Object} flag effetti campo per applyEffect
 */
export function applyDuelFieldSetup(duel, field, battleLog, pAgent, eAgent, playerContext, enemyContext) {
  const immuneDisabled = field.name === 'Mura EMP';
  if (immuneDisabled) {
    duel.pImmune = false;
    duel.eImmune = false;
    battleLog.push('⚡ Mura EMP: Immune disabilitato!');
  }

  const gloriaAlwaysActive = field.name === 'Fondamenta della Torre';
  const vendettaAlwaysActive = field.name === 'Fondamenta della Torre';
  const rimontaAlwaysActive = field.name === 'Mura della Sfida';
  const imboscataAlwaysActive = field.name === 'Alveare Abbandonato';
  const interventoAlwaysActive = field.name === 'Cerchio di Evocazione';
  const magnanimoAlwaysActive = field.name === 'Convergenza delle Ley';
  const triggersIgnored = field.name === 'Crocevia dei Patti';
  const overdriveThreshold = field.name === 'Nucleo del Reattore' ? 4 : 5;

  const fieldModifiers = {
    gloriaAlwaysActive,
    vendettaAlwaysActive,
    rimontaAlwaysActive,
    imboscataAlwaysActive,
    interventoAlwaysActive,
    magnanimoAlwaysActive,
    triggersIgnored,
    overdriveThreshold,
  };
  playerContext.fieldModifiers = fieldModifiers;
  enemyContext.fieldModifiers = fieldModifiers;

  const blockDisabled = field.name === 'Biblioteca delle Lingue Perdute';
  const copyDisabled = field.name === 'Fossa dei Traditori';
  const directDamageDisabled = field.name === 'Firewall Centrale';
  const modifiersDisabled = field.name === "Specchio dell'Anima";
  const maxDamage = field.name === 'Nexus Arcano' ? 4 : null;
  const maxFC = field.name === 'Anomalia Gravitazionale' ? 3 : null;
  const directDamageBonus = field.name === 'Nido della Regina' ? 1 : 0;

  if (maxFC !== null) {
    const pFCBefore = duel.pFocusUsed;
    const eFCBefore = duel.eFocusUsed;
    if (duel.pFocusUsed > maxFC) duel.pFocusUsed = maxFC;
    if (duel.eFocusUsed > maxFC) duel.eFocusUsed = maxFC;
    if (pFCBefore > maxFC || eFCBefore > maxFC) {
      battleLog.push(
        `🌀 ${field.name}: FC max ${maxFC} | TU ${pFCBefore} → ${duel.pFocusUsed} | IA ${eFCBefore} → ${duel.eFocusUsed}`
      );
    } else {
      battleLog.push(`🌀 ${field.name}: FC max ${maxFC} (nessun cambio)`);
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

  if (field.category === 'values' || field.name === 'Terza Luna') {
    if (field.name === 'Gran Corno') {
      const pBefore = pPower;
      const eBefore = ePower;
      pPower += 4;
      ePower += 4;
      battleLog.push(`⛰️ Gran Corno: TU POT ${pBefore} → ${pPower} | IA POT ${eBefore} → ${ePower}`);
    } else if (field.name === 'Terza Luna') {
      const pPowBefore = pPower;
      const pDanBefore = pDamage;
      const ePowBefore = ePower;
      const eDanBefore = eDamage;
      if (!pImmune) pPower -= 1;
      pDamage += 1;
      if (!eImmune) ePower -= 1;
      eDamage += 1;
      battleLog.push(
        `🌙 Terza Luna: TU POT ${pPowBefore} → ${pPower}${pImmune ? ' (Immune)' : ''}, DAN ${pDanBefore} → ${pDamage}`
      );
      battleLog.push(
        `🌙 Terza Luna: IA POT ${ePowBefore} → ${ePower}${eImmune ? ' (Immune)' : ''}, DAN ${eDanBefore} → ${eDamage}`
      );
    } else if (field.name === "Nido dell'Antico") {
      const pBefore = pDamage;
      const eBefore = eDamage;
      if (!pImmune) pDamage = Math.max(0, pDamage - 2);
      if (!eImmune) eDamage = Math.max(0, eDamage - 2);
      battleLog.push(
        `🪺 Nido dell'Antico: TU DAN ${pBefore} → ${pDamage}${pImmune ? ' (Immune)' : ''} | IA DAN ${eBefore} → ${eDamage}${eImmune ? ' (Immune)' : ''}`
      );
    } else if (field.name === 'Dimensione Specchiata') {
      const originalPPower = pPower;
      const originalEPower = ePower;
      if (!pImmune && !eImmune) {
        pPower = originalEPower;
        ePower = originalPPower;
        battleLog.push(
          `🪞 Dimensione Specchiata: POT scambiate! TU ${originalPPower} → ${pPower} | IA ${originalEPower} → ${ePower}`
        );
      } else if (!pImmune && eImmune) {
        pPower = originalEPower;
        battleLog.push(`🪞 Dimensione Specchiata: TU POT ${originalPPower} → ${pPower} (IA immune)`);
      } else if (pImmune && !eImmune) {
        ePower = originalPPower;
        battleLog.push(`🪞 Dimensione Specchiata: IA POT ${originalEPower} → ${ePower} (Tu immune)`);
      } else {
        battleLog.push('🐛¡️ Dimensione Specchiata: Bloccato da Immunità!');
      }
    } else if (field.name === 'Fossa dei Leoni' || field.name === 'Terreno di Caccia') {
      const pBefore = pDamage;
      const eBefore = eDamage;
      pDamage += 2;
      eDamage += 2;
      battleLog.push(`🦁 ${field.name}: TU DAN ${pBefore} → ${pDamage} | IA DAN ${eBefore} → ${eDamage}`);
    } else if (field.name === 'Trono di Cenere') {
      const pBefore = pDamage;
      const eBefore = eDamage;
      pDamage += 1;
      eDamage += 1;
      battleLog.push(`🔥 Trono di Cenere: TU DAN ${pBefore} → ${pDamage} | IA DAN ${eBefore} → ${eDamage}`);
    } else if (field.name === 'Nebulosa dei Ricordi') {
      const pBefore = pPower;
      const eBefore = ePower;
      pPower += 1;
      ePower += 1;
      battleLog.push(`🌌 Nebulosa dei Ricordi: TU POT ${pBefore} → ${pPower} | IA POT ${eBefore} → ${ePower}`);
    } else if (field.name === 'Orlo del Buco Nero') {
      const pPowBefore = pPower;
      const pDanBefore = pDamage;
      const ePowBefore = ePower;
      const eDanBefore = eDamage;
      pPower = pDanBefore;
      pDamage = pPowBefore;
      ePower = eDanBefore;
      eDamage = ePowBefore;
      battleLog.push('⚫ Orlo del Buco Nero: POT ↔ DAN invertiti!');
      battleLog.push(`   TU: POT ${pPowBefore} → ${pPower}, DAN ${pDanBefore} → ${pDamage}`);
      battleLog.push(`   IA: POT ${ePowBefore} → ${ePower}, DAN ${eDanBefore} → ${eDamage}`);
    } else if (field.name === 'Cimitero di Stelle') {
      const pVABefore = pAssaultMod;
      const eVABefore = eAssaultMod;
      if (!pImmune) pAssaultMod -= 2;
      if (!eImmune) eAssaultMod -= 2;
      battleLog.push(
        `✨ Cimitero di Stelle: TU VA mod ${pVABefore} → ${pAssaultMod}${pImmune ? ' (Immune)' : ''} | IA VA mod ${eVABefore} → ${eAssaultMod}${eImmune ? ' (Immune)' : ''}`
      );
    } else if (field.name === 'Mercato delle Anime') {
      const pBefore = pPower;
      const eBefore = ePower;
      if (!pImmune) pPower = Math.max(1, pPower - 3);
      if (!eImmune) ePower = Math.max(1, ePower - 3);
      battleLog.push(
        `💀 Mercato delle Anime: TU POT ${pBefore} → ${pPower}${pImmune ? ' (Immune)' : ''} | IA POT ${eBefore} → ${ePower}${eImmune ? ' (Immune)' : ''}`
      );
    } else if (field.name === "Sanctum dell'Equilibrio") {
      if (pAgent.league > eAgent.league && !pImmune) {
        pAssaultMod -= 5;
        battleLog.push(`⚖️ Sanctum: TU -5 VA (Lega ${pAgent.league} > ${eAgent.league})`);
      } else if (pAgent.league > eAgent.league && pImmune) {
        battleLog.push(`⚖️ Sanctum: TU Immune (Lega ${pAgent.league} > ${eAgent.league})`);
      } else if (eAgent.league > pAgent.league && !eImmune) {
        eAssaultMod -= 5;
        battleLog.push(`⚖️ Sanctum: IA -5 VA (Lega ${eAgent.league} > ${pAgent.league})`);
      } else if (eAgent.league > pAgent.league && eImmune) {
        battleLog.push(`⚖️ Sanctum: IA Immune (Lega ${eAgent.league} > ${pAgent.league})`);
      } else {
        battleLog.push(`⚖️ Sanctum: Nessun malus (Leghe pari: ${pAgent.league})`);
      }
    } else if (field.name === 'Eclissi Totale') {
      const pPowBefore = pPower;
      const pDanBefore = pDamage;
      const ePowBefore = ePower;
      const eDanBefore = eDamage;
      if (!pImmune) {
        pPower = Math.max(1, pPower - 2);
        pDamage = Math.max(0, pDamage - 2);
      }
      if (!eImmune) {
        ePower = Math.max(1, ePower - 2);
        eDamage = Math.max(0, eDamage - 2);
      }
      battleLog.push(
        `🌑 Eclissi Totale: TU POT ${pPowBefore} → ${pPower}, DAN ${pDanBefore} → ${pDamage}${pImmune ? ' (Immune)' : ''}`
      );
      battleLog.push(
        `🌑 Eclissi Totale: IA POT ${ePowBefore} → ${ePower}, DAN ${eDanBefore} → ${eDamage}${eImmune ? ' (Immune)' : ''}`
      );
    }
  } else if (field.category === 'focus') {
    if (field.name === 'Porte di Atlantide') {
      const pFCBefore = pFocusUsed;
      const eFCBefore = eFocusUsed;
      pFocusUsed *= 2;
      eFocusUsed *= 2;
      battleLog.push(
        `🌊 Porte di Atlantide: FC raddoppiati! TU ${pFCBefore} → ${pFocusUsed} | IA ${eFCBefore} → ${eFocusUsed}`
      );
    }
  } else if (field.category === 'limit') {
    if (field.name === 'Arena degli Gnomi') {
      pAbilityBlocked = true;
      eAbilityBlocked = true;
      battleLog.push('🎪 Arena degli Gnomi: Poteri annullati');
    } else if (field.name === 'Tempio del Monaco Pazzo') {
      pBonusBlocked = true;
      eBonusBlocked = true;
      battleLog.push('🛕 Tempio del Monaco Pazzo: Bonus annullati');
    } else if (field.name === 'Santuario del Silenzio') {
      pAbilityBlocked = true;
      eAbilityBlocked = true;
      pBonusBlocked = true;
      eBonusBlocked = true;
      battleLog.push('🤫 Santuario del Silenzio: Poteri E Bonus annullati!');
    } else if (field.name === 'Nexus Arcano') {
      battleLog.push('🔮 Nexus Arcano: DAN massimo = 4');
    } else if (field.name === 'Biblioteca delle Lingue Perdute') {
      battleLog.push('📜 Biblioteca Lingue Perdute: Blocca Potere/Bonus non funzionano');
    } else if (field.name === 'Fossa dei Traditori') {
      battleLog.push('🕳️ Fossa dei Traditori: Effetti Copia annullati');
    } else if (field.name === 'Firewall Centrale') {
      battleLog.push('🛡️ Firewall Centrale: DAN diretti annullati');
    } else if (field.name === "Specchio dell'Anima") {
      battleLog.push("🪞 Specchio dell'Anima: Modificatori POT/DAN annullati");
    }
  } else if (field.category === 'trigger') {
    if (field.name === 'Fondamenta della Torre') {
      battleLog.push('🧱 Fondamenta della Torre: Gloria e Vendetta sempre attivi!');
    } else if (field.name === 'Mura della Sfida') {
      battleLog.push('🧱 Mura della Sfida: Rimonta sempre attiva!');
    } else if (field.name === 'Crocevia dei Patti') {
      battleLog.push('🔀 Crocevia dei Patti: Poteri si attivano senza trigger!');
    } else if (field.name === 'Nucleo del Reattore') {
      battleLog.push('☢️ Nucleo del Reattore: Overdrive si attiva con 4 FC!');
    } else if (field.name === 'Cerchio di Evocazione') {
      battleLog.push('⭐• Cerchio di Evocazione: Intervento sempre attivo!');
    } else if (field.name === 'Alveare Abbandonato') {
      battleLog.push('🍯 Alveare Abbandonato: Imboscata sempre attiva!');
    } else if (field.name === 'Convergenza delle Ley') {
      battleLog.push('✴️ Convergenza delle Ley: Magnanimo sempre attivo!');
    }
  }

  if (field.name === 'Biblioteca Proibita') {
    battleLog.push(`📚 Biblioteca Proibita: Tu ${pFocusUsed} FC vs IA ${eFocusUsed} FC`);
    if (pFocusUsed < eFocusUsed) {
      const before = pAssaultMod;
      pAssaultMod += 5;
      battleLog.push(`📚 Biblioteca Proibita: TU VA mod ${before} → ${pAssaultMod} (meno FC)`);
    } else if (eFocusUsed < pFocusUsed) {
      const before = eAssaultMod;
      eAssaultMod += 5;
      battleLog.push(`📚 Biblioteca Proibita: IA VA mod ${before} → ${eAssaultMod} (meno FC)`);
    } else {
      battleLog.push('📚 Biblioteca Proibita: Nessun bonus (FC pari)');
    }
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
  };
}
