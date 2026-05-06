// ============================================
// Effetti post-scontro legati al campo (PV/FC)
// Logica pura: nessuna dipendenza da React
// ============================================

/**
 * Applica il danno dello scontro e tutti gli effetti di campo che modificano PV/FC dopo la risoluzione.
 * Non sottrae i FC investiti nel duello (lo fa il chiamante dopo questa funzione).
 *
 * @param {Object} p
 * @param {Object} p.field - Campo di battaglia corrente
 * @param {'player'|'enemy'} p.winner
 * @param {number} p.damageDealt - DAN inflitto al perdente (già modificato da Canyon delle Lame se applicabile)
 * @param {number} p.pHPCurrent
 * @param {number} p.eHPCurrent
 * @param {number} p.pFCCurrent
 * @param {number} p.eFCCurrent
 * @param {string[]} p.battleLog
 * @returns {{ pHPCurrent: number, eHPCurrent: number, pFCCurrent: number, eFCCurrent: number }}
 */
export function applyBattlefieldRoundAftermath({
  field,
  winner,
  damageDealt,
  pHPCurrent,
  eHPCurrent,
  pFCCurrent,
  eFCCurrent,
  battleLog,
}) {
  let pHP = pHPCurrent;
  let eHP = eHPCurrent;
  let pFC = pFCCurrent;
  let eFC = eFCCurrent;

  if (winner === 'player') {
    const before = eHP;
    eHP = Math.max(0, eHP - damageDealt);
    battleLog.push(`💥 L'IA perde ${damageDealt} PV (${before} → ${eHP})`);

    if (field.name === 'Nido di Spine') {
      const pBefore = pHP;
      pHP = Math.max(0, pHP - 5);
      battleLog.push(`🌵 Nido di Spine: Perdi 5 PV per aver vinto (${pBefore} → ${pHP})`);
    }
    if (field.name === 'Miniera di Lacrime') {
      const pBefore = pHP;
      pHP = Math.min(25, pHP + 2);
      battleLog.push(`💎 Miniera di Lacrime: +2 PV (${pBefore} → ${pHP})`);
    }
    if (field.name === "Torre d'Avorio") {
      const fcBefore = pFC;
      pFC += 1;
      battleLog.push(`🏰 Torre d'Avorio: +1 FC (${fcBefore} → ${pFC})`);
    }
  } else {
    const before = pHP;
    pHP = Math.max(0, pHP - damageDealt);
    battleLog.push(`💔 Perdi ${damageDealt} PV (${before} → ${pHP})`);

    if (field.name === 'Nido di Spine') {
      const eBefore = eHP;
      eHP = Math.max(0, eHP - 5);
      battleLog.push(`🌵 Nido di Spine: L'IA perde 5 PV per aver vinto (${eBefore} → ${eHP})`);
    }
    if (field.name === 'Miniera di Lacrime') {
      const eBefore = eHP;
      eHP = Math.min(25, eHP + 2);
      battleLog.push(`💎 Miniera di Lacrime: IA +2 PV (${eBefore} → ${eHP})`);
    }
    if (field.name === "Torre d'Avorio") {
      const fcBefore = eFC;
      eFC += 1;
      battleLog.push(`🏰 Torre d'Avorio: IA +1 FC (${fcBefore} → ${eFC})`);
    }
  }

  if (field.name === 'Cripta dei Sussurri') {
    if (winner === 'player') {
      const before = eFC;
      eFC += 1;
      battleLog.push(`👻 Cripta dei Sussurri: IA +1 FC sconfitta (${before} → ${eFC})`);
    } else {
      const before = pFC;
      pFC += 1;
      battleLog.push(`👻 Cripta dei Sussurri: +1 FC sconfitta (${before} → ${pFC})`);
    }
  }

  if (field.name === 'Voragine Infinita') {
    const pBefore = pHP;
    const eBefore = eHP;
    pHP = Math.max(0, pHP - 3);
    eHP = Math.max(0, eHP - 3);
    battleLog.push(`🕳️ Voragine Infinita: Tu ${pBefore} → ${pHP} | IA ${eBefore} → ${eHP} PV`);
  }

  if (field.name === 'Altare del Sacrificio') {
    if (winner === 'player') {
      const before = eHP;
      eHP = Math.max(0, eHP - 2);
      battleLog.push(`⛩️ Altare del Sacrificio: IA -2 PV extra (${before} → ${eHP})`);
    } else {
      const before = pHP;
      pHP = Math.max(0, pHP - 2);
      battleLog.push(`⛩️ Altare del Sacrificio: Tu -2 PV extra (${before} → ${pHP})`);
    }
  }

  if (field.name === 'Corona Solare') {
    if (winner === 'player') {
      const before = pHP;
      pHP = Math.min(25, pHP + 1);
      battleLog.push(`☀️ Corona Solare: +1 PV (${before} → ${pHP})`);
    } else {
      const before = eHP;
      eHP = Math.min(25, eHP + 1);
      battleLog.push(`☀️ Corona Solare: IA +1 PV (${before} → ${eHP})`);
    }
  }

  if (field.name === 'Trono dei Re Caduti') {
    if (winner === 'player') {
      const before = pHP;
      pHP = Math.max(0, pHP - 1);
      battleLog.push(`👑 Trono dei Re Caduti: -1 PV per aver vinto (${before} → ${pHP})`);
    } else {
      const before = eHP;
      eHP = Math.max(0, eHP - 1);
      battleLog.push(`👑 Trono dei Re Caduti: IA -1 PV per aver vinto (${before} → ${eHP})`);
    }
  }

  if (field.name === 'Sala dei Contratti') {
    if (winner === 'player') {
      const before = pFC;
      pFC = Math.max(0, pFC - 2);
      battleLog.push(`🔝 Sala dei Contratti: -2 FC per aver vinto (${before} → ${pFC})`);
    } else {
      const before = eFC;
      eFC = Math.max(0, eFC - 2);
      battleLog.push(`🔝 Sala dei Contratti: IA -2 FC per aver vinto (${before} → ${eFC})`);
    }
  }

  if (field.name === "Tribunale dell'Anima") {
    if (winner === 'player') {
      const before = eFC;
      eFC = Math.max(0, eFC - 1);
      battleLog.push(`⚖️ Tribunale dell'Anima: IA -1 FC sconfitta (${before} → ${eFC})`);
    } else {
      const before = pFC;
      pFC = Math.max(0, pFC - 1);
      battleLog.push(`⚖️ Tribunale dell'Anima: -1 FC sconfitta (${before} → ${pFC})`);
    }
  }

  if (field.name === 'Ziqqurat Spezzata' || field.name === 'Deposito di Rottami') {
    if (winner === 'player') {
      const before = eFC;
      eFC += 1;
      battleLog.push(`🏛️ ${field.name}: IA +1 FC sconfitta (${before} → ${eFC})`);
    } else {
      const before = pFC;
      pFC += 1;
      battleLog.push(`🏛️ ${field.name}: +1 FC sconfitta (${before} → ${pFC})`);
    }
  }

  if (field.name === 'Pianura Divorata') {
    const pBefore = pHP;
    const eBefore = eHP;
    pHP = Math.min(25, pHP + 1);
    eHP = Math.min(25, eHP + 1);
    battleLog.push(`🏓️ Pianura Divorata: Tu ${pBefore} → ${pHP} | IA ${eBefore} → ${eHP} PV`);
  }

  if (field.name === 'Palude Tossica') {
    const pBefore = pHP;
    const eBefore = eHP;
    pHP = Math.max(0, pHP - 1);
    eHP = Math.max(0, eHP - 1);
    battleLog.push(`🐸 Palude Tossica: Tu ${pBefore} → ${pHP} | IA ${eBefore} → ${eHP} PV`);
  }

  if (field.name === 'Fonte del Mana') {
    const pBefore = pFC;
    const eBefore = eFC;
    pFC += 1;
    eFC += 1;
    battleLog.push(`💧 Fonte del Mana: Tu ${pBefore} → ${pFC} FC | IA ${eBefore} → ${eFC} FC`);
  }

  return {
    pHPCurrent: pHP,
    eHPCurrent: eHP,
    pFCCurrent: pFC,
    eFCCurrent: eFC,
  };
}
