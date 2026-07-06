// Nexus Arcano (max DAN), Overdrive Centrale Energetica.
export function applyDuelNexusMaxDamage(battleLog, maxDamage, pDamage, eDamage) {
  let pd = pDamage;
  let ed = eDamage;
  if (maxDamage === null) return { pDamage: pd, eDamage: ed };
  if (pd > maxDamage) {
    battleLog.push(`🔮 Nexus Arcano: Il tuo DAN ${pd} → ${maxDamage} (max)`);
    pd = maxDamage;
  }
  if (ed > maxDamage) {
    battleLog.push(`🔮 Nexus Arcano: DAN IA ${ed} → ${maxDamage} (max)`);
    ed = maxDamage;
  }
  return { pDamage: pd, eDamage: ed };
}

export function applyCentraleOverdriveDamage(battleLog, fieldName, overdriveThreshold, pFocusUsed, eFocusUsed, pDamage, eDamage) {
  let pd = pDamage;
  let ed = eDamage;
  if (fieldName !== 'Centrale Energetica') return { pDamage: pd, eDamage: ed };
  if (pFocusUsed >= overdriveThreshold) {
    const before = pd;
    pd += 1;
    battleLog.push(`🔋 Centrale Energetica: TU Overdrive attivo! DAN ${before} → ${pd}`);
  }
  if (eFocusUsed >= overdriveThreshold) {
    const before = ed;
    ed += 1;
    battleLog.push(`🔋 Centrale Energetica: IA Overdrive attivo! DAN ${before} → ${ed}`);
  }
  return { pDamage: pd, eDamage: ed };
}
