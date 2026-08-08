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
 * @param {number} p.damageDealt - DAN inflitto al perdente (prima degli effetti post-scontro del campo)
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
  pFocusUsed = 0,
  eFocusUsed = 0,
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
    if (field.id === 17 || field.name === 'Altare del Sacrificio') {
      const pBefore = pHP;
      pHP = Math.max(0, pHP - 2);
      battleLog.push(`⛩️ Altare del Sacrificio: Conquista · −2 PV (${pBefore} → ${pHP})`);
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
    if (field.id === 17 || field.name === 'Altare del Sacrificio') {
      const eBefore = eHP;
      eHP = Math.max(0, eHP - 2);
      battleLog.push(`⛩️ Altare del Sacrificio: Conquista · −2 PV (IA ${eBefore} → ${eHP})`);
    }
  }

  if (field.id === 11 || field.name === 'Canyon delle Lame') {
    if (winner === 'player') {
      const before = eHP;
      eHP = Math.max(0, eHP - 2);
      battleLog.push(`🗡️ Canyon delle Lame: Ultimo Desiderio · −2 PV (IA ${before} → ${eHP})`);
    } else {
      const before = pHP;
      pHP = Math.max(0, pHP - 2);
      battleLog.push(`🗡️ Canyon delle Lame: Ultimo Desiderio · −2 PV (Tu ${before} → ${pHP})`);
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

  if (field.id === 37 || field.name === 'Trono Solare') {
    if (winner === 'player') {
      const before = pHP;
      pHP = Math.min(25, pHP + 1);
      battleLog.push(`☀️ Trono Solare: +1 PV (${before} → ${pHP})`);
    } else {
      const before = eHP;
      eHP = Math.min(25, eHP + 1);
      battleLog.push(`☀️ Trono Solare: IA +1 PV (${before} → ${eHP})`);
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

  if (field.name === 'Ziqqurat Spezzata' || field.id === 23) {
    if (winner === 'player') {
      const eFcBefore = eFC;
      eFC += 1;
      battleLog.push(`🏛️ Ziqqurat Spezzata: IA +1 FC sconfitta (${eFcBefore} → ${eFC})`);
      const pFcBefore = pFC;
      pFC = Math.max(0, pFC - 1);
      battleLog.push(`🏛️ Ziqqurat Spezzata: Tu −1 FC vittoria (${pFcBefore} → ${pFC})`);
    } else {
      const pFcBefore = pFC;
      pFC += 1;
      battleLog.push(`🏛️ Ziqqurat Spezzata: +1 FC sconfitta (${pFcBefore} → ${pFC})`);
      const eFcBefore = eFC;
      eFC = Math.max(0, eFC - 1);
      battleLog.push(`🏛️ Ziqqurat Spezzata: IA −1 FC vittoria (${eFcBefore} → ${eFC})`);
    }
  }

  if (field.name === 'Deposito di Rottami' || field.id === 30) {
    if (winner === 'player') {
      const before = eFC;
      eFC += 2;
      battleLog.push(`🏛️ Deposito di Rottami: IA +2 FC sconfitta (${before} → ${eFC})`);
    } else {
      const before = pFC;
      pFC += 2;
      battleLog.push(`🏛️ Deposito di Rottami: +2 FC sconfitta (${before} → ${pFC})`);
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

  if (field.id === 60) {
    pFC += 2;
    eFC += 2;
    battleLog.push(`💰 Volta del Tesoro: +2 FC a entrambi (${pFC - 2}→${pFC}, ${eFC - 2}→${eFC})`);
  }

  if (field.id === 57) {
    if (pHP < eHP) {
      pHP = Math.min(25, pHP + 1);
      battleLog.push(`🔧 La Grande Forgia: Tu +1 PV (meno PV)`);
    } else if (eHP < pHP) {
      eHP = Math.min(25, eHP + 1);
      battleLog.push(`🔧 La Grande Forgia: IA +1 PV (meno PV)`);
    } else {
      pHP = Math.min(25, pHP + 1);
      eHP = Math.min(25, eHP + 1);
      battleLog.push(`🔧 La Grande Forgia: pari PV, +1 a entrambi`);
    }
  }

  if (field.id === 65) {
    if (winner === 'player') {
      pFC += 1;
      pHP = Math.max(0, pHP - 2);
      battleLog.push(`🐉 Picco del Drago Caduto: Tu +1 FC, -2 PV`);
    } else {
      eFC += 1;
      eHP = Math.max(0, eHP - 2);
      battleLog.push(`🐉 Picco del Drago Caduto: IA +1 FC, -2 PV`);
    }
  }

  if (field.id === 82) {
    if (winner === 'player') {
      pHP = Math.min(25, pHP + 1);
      battleLog.push(`🏛️ Necropoli Dorata: Tu +1 PV`);
    } else {
      eHP = Math.min(25, eHP + 1);
      battleLog.push(`🏛️ Necropoli Dorata: IA +1 PV`);
    }
  }

  // Viale delle Delegazioni (119): se FC totali investiti > 10, entrambi +1 FC
  if (field.id === 119) {
    const totalFocus = (pFocusUsed || 0) + (eFocusUsed || 0);
    if (totalFocus > 10) {
      const pBefore = pFC;
      const eBefore = eFC;
      pFC += 1;
      eFC += 1;
      battleLog.push(
        `🎭 Viale delle Delegazioni: FC totali ${totalFocus} > 10 · entrambi +1 FC (Tu ${pBefore}→${pFC} | IA ${eBefore}→${eFC})`
      );
    } else {
      battleLog.push(`🎭 Viale delle Delegazioni: FC totali ${totalFocus} ≤ 10 · nessun recupero`);
    }
  }

  // Terme di Karsil (103): vincitore cura 2 PV
  if (field.id === 103) {
    if (winner === 'player') {
      const before = pHP;
      pHP = Math.min(25, pHP + 2);
      battleLog.push(`♨️ Terme di Karsil: Tu +2 PV (${before} → ${pHP})`);
    } else {
      const before = eHP;
      eHP = Math.min(25, eHP + 2);
      battleLog.push(`♨️ Terme di Karsil: IA +2 PV (${before} → ${eHP})`);
    }
  }

  // Porto della Catena (106): vincitore +1 FC
  if (field.id === 106) {
    if (winner === 'player') {
      const before = pFC;
      pFC += 1;
      battleLog.push(`⚓ Porto della Catena: Tu +1 FC (${before} → ${pFC})`);
    } else {
      const before = eFC;
      eFC += 1;
      battleLog.push(`⚓ Porto della Catena: IA +1 FC (${before} → ${eFC})`);
    }
  }

  // Lago delle Sette Lune (113): perdente +1 FC e +1 PV
  if (field.id === 113) {
    if (winner === 'player') {
      const beforeFC = eFC;
      const beforeHP = eHP;
      eFC += 1;
      eHP = Math.min(25, eHP + 1);
      battleLog.push(`🌙 Lago delle Sette Lune: IA +1 FC (${beforeFC} → ${eFC}), +1 PV (${beforeHP} → ${eHP})`);
    } else {
      const beforeFC = pFC;
      const beforeHP = pHP;
      pFC += 1;
      pHP = Math.min(25, pHP + 1);
      battleLog.push(`🌙 Lago delle Sette Lune: Tu +1 FC (${beforeFC} → ${pFC}), +1 PV (${beforeHP} → ${pHP})`);
    }
  }

  // Arena del Banco Rosso (97): perdente recupera floor(FC investiti / 2), max 3
  if (field.id === 97) {
    if (winner === 'player') {
      const gain = Math.min(3, Math.floor((eFocusUsed || 0) / 2));
      if (gain > 0) {
        const before = eFC;
        eFC += gain;
        battleLog.push(`🔴 Arena del Banco Rosso: IA +${gain} FC (perdente, ${eFocusUsed} investiti) (${before} → ${eFC})`);
      } else {
        battleLog.push(`🔴 Arena del Banco Rosso: IA +0 FC (perdente, ${eFocusUsed} investiti)`);
      }
    } else {
      const gain = Math.min(3, Math.floor((pFocusUsed || 0) / 2));
      if (gain > 0) {
        const before = pFC;
        pFC += gain;
        battleLog.push(`🔴 Arena del Banco Rosso: Tu +${gain} FC (perdente, ${pFocusUsed} investiti) (${before} → ${pFC})`);
      } else {
        battleLog.push(`🔴 Arena del Banco Rosso: Tu +0 FC (perdente, ${pFocusUsed} investiti)`);
      }
    }
  }

  return {
    pHPCurrent: pHP,
    eHPCurrent: eHP,
    pFCCurrent: pFC,
    eFCCurrent: eFC,
  };
}
