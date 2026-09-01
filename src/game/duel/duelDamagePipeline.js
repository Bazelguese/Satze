// Nexus Arcano (max DAN), Overdrive Centrale Energetica.
//
// `exemptSides` elenca i lati che questo Duello non subiscono la parte per-Agente del Campo.
// È vuoto in tutti i percorsi che non passano da un'Eminenza.
const isExempt = (exemptSides, side) => Boolean(exemptSides?.includes(side));

export function applyDuelNexusMaxDamage(battleLog, maxDamage, pDamage, eDamage, exemptSides = []) {
  let pd = pDamage;
  let ed = eDamage;
  if (maxDamage === null) return { pDamage: pd, eDamage: ed };
  if (pd > maxDamage && !isExempt(exemptSides, 'player')) {
    battleLog.push(`🔮 Nexus Arcano: Il tuo DAN ${pd} → ${maxDamage} (max)`);
    pd = maxDamage;
  }
  if (ed > maxDamage && !isExempt(exemptSides, 'enemy')) {
    battleLog.push(`🔮 Nexus Arcano: DAN IA ${ed} → ${maxDamage} (max)`);
    ed = maxDamage;
  }
  return { pDamage: pd, eDamage: ed };
}

export function applyCentraleOverdriveDamage(battleLog, fieldName, overdriveThreshold, pFocusUsed, eFocusUsed, pDamage, eDamage, exemptSides = []) {
  let pd = pDamage;
  let ed = eDamage;
  if (fieldName !== 'Centrale Energetica') return { pDamage: pd, eDamage: ed };
  if (pFocusUsed >= overdriveThreshold && !isExempt(exemptSides, 'player')) {
    const before = pd;
    pd += 1;
    battleLog.push(`🔋 Centrale Energetica: TU Overdrive attivo! DAN ${before} → ${pd}`);
  }
  if (eFocusUsed >= overdriveThreshold && !isExempt(exemptSides, 'enemy')) {
    const before = ed;
    ed += 1;
    battleLog.push(`🔋 Centrale Energetica: IA Overdrive attivo! DAN ${before} → ${ed}`);
  }
  return { pDamage: pd, eDamage: ed };
}
