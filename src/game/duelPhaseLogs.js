// ============================================
// Log a fasi per animazione duello (UI)
// ============================================

/**
 * Costruisce phase0–phase4 per le animazioni, a partire dal battleLog lineare.
 */
export function buildDuelPhaseLogs({
  battleLog,
  field,
  pAgent,
  eAgent,
  isPlayerFirst,
  playerHP,
  enemyHP,
  playerFocus,
  enemyFocus,
  selectedFocus,
  enemySelectedFocus,
  pFocusUsed,
  eFocusUsed,
  pPower,
  ePower,
  pAssaultMod,
  eAssaultMod,
  pAssault,
  eAssault,
  winner,
}) {
  const idxCalcoloVA = battleLog.findIndex((l) => l.includes('━━━ CALCOLO VA ━━━'));
  const idxRisultato = battleLog.findIndex((l) => l.includes('━━━ RISULTATO ━━━'));

  const phase2Logs =
    idxCalcoloVA >= 0 ? battleLog.slice(3, idxCalcoloVA) : battleLog.slice(3);

  const phaseLogs = {
    phase0: [
      `━━━ DUELLO ━━━`,
      `🔍 Campo: ${field.name} — "${field.effect}"`,
      `⚡ Inizia: ${isPlayerFirst ? 'TU' : 'IA'}`,
      ``,
      `🟢 TU schieri: ${pAgent.name} (${pAgent.army})`,
      `   POT ${pAgent.power} | Danno ${pAgent.damage}`,
      `🔴 IA schiera: ${eAgent.name} (${eAgent.army})`,
      `   POT ${eAgent.power} | Danno ${eAgent.damage}`,
      ``,
      `📊 PV iniziali: Tu ${playerHP ?? '?'} | IA ${enemyHP ?? '?'}`,
      `💰 FC disponibili: Tu ${playerFocus ?? '?'} | IA ${enemyFocus ?? '?'}`,
    ],
    phase1: [`━━━ EFFETTI ━━━`, ...phase2Logs],
    phase2: [
      `━━━ FOCUS COIN ━━━`,
      `🟢 Tu investi: ${selectedFocus ?? '?'} FC`,
      `🔴 IA investe: ${enemySelectedFocus ?? '?'} FC`,
    ],
    phase3: [],
    phase4: [],
  };

  if (field.id === 9 || field.name === 'Porte di Atlantide') {
    phaseLogs.phase2.push(`🌊 Porte di Atlantide: Calcolo VA · FC ×2`);
    phaseLogs.phase2.push(
      `   Tu: ${selectedFocus} → ${pFocusUsed} | IA: ${enemySelectedFocus} → ${eFocusUsed}`
    );
  }
  if (field.id === 36 || field.name === 'Il Pozzo Gravitazionale') {
    phaseLogs.phase2.push(`🌀 ${field.name}: FC max 3 applicato`);
  }

  if (phaseLogs.phase1.length === 1) {
    phaseLogs.phase1.push(`   Nessun effetto attivato`);
  }

  const phase3Logs =
    idxCalcoloVA >= 0 && idxRisultato >= 0
      ? battleLog.slice(idxCalcoloVA, idxRisultato)
      : [
          `━━━ CALCOLO VA ━━━`,
          `🟢 TU: ${pPower} Pot × ${pFocusUsed} FC ${pAssaultMod !== 0 ? (pAssaultMod > 0 ? `+ ${pAssaultMod}` : `${pAssaultMod}`) : ''} = ${pAssault} VA`,
          `🔴 IA: ${ePower} Pot × ${eFocusUsed} FC ${eAssaultMod !== 0 ? (eAssaultMod > 0 ? `+ ${eAssaultMod}` : `${eAssaultMod}`) : ''} = ${eAssault} VA`,
          ``,
          pAssault > eAssault
            ? `⚔️ ${pAssault} > ${eAssault} → TU VINCI!`
            : eAssault > pAssault
              ? `⚔️ ${eAssault} > ${pAssault} → IA VINCE`
              : `⚔️ ${pAssault} = ${eAssault} → spareggio Lega → POT → secondo`,
        ];
  phaseLogs.phase3 = phase3Logs;

  phaseLogs.phase4 = [`━━━ RISULTATO ━━━`];
  if (winner === 'player') {
    phaseLogs.phase4.push(`🎉 VITTORIA!`);
    phaseLogs.phase4.push(`🏆 Tu conquisti: ${field.name}`);
  } else {
    phaseLogs.phase4.push(`💀 SCONFITTA!`);
    phaseLogs.phase4.push(`🏆 IA conquista: ${field.name}`);
  }
  if (idxRisultato >= 0) {
    phaseLogs.phase4.push(...battleLog.slice(idxRisultato + 1));
  }

  return phaseLogs;
}
