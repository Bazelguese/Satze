import { TRIGGER_NAMES } from '../../data/triggers.js';

export function applyDuelPowerEffect(effect, value, target, source, log, options = {}, state, ctx) {
  const {
    minDamage,
    minPower,
    minAssault,
    copyDisabled = false,
    modifiersDisabled: modDisabled = false,
    directDamageDisabled = false,
    directDamageBonus = 0,
  } = options;
  
  // Specchio dell'Anima: annulla modificatori POT/DAN
  if (modDisabled && ['power', 'damage', 'enemyPower', 'enemyDamage', 'enemyPowerAndDamage', 'powerAndDamage', 'imponiPower', 'imponiDamage'].includes(effect)) {
    log.push(`🐛¡️ ${source}: BLOCCATO da Specchio dell'Anima`);
    return;
  }
  
  // Helper per nome target
  const targetName = target === 'player' ? 'TU' : 'IA';
  const enemyName = target === 'player' ? 'IA' : 'TU';
  
  switch (effect) {
    // Effetti SELF (bonus a se stesso) - MAI bloccati dalla propria immunità
    case 'power':
      if (target === 'player') { state.pPower += value; log.push(`⚡ ${source}: ${targetName} +${value} POT → ${state.pPower}`); }
      else { state.ePower += value; log.push(`⚡ ${source}: ${targetName} +${value} POT → ${state.ePower}`); }
      break;
    case 'damage':
      if (target === 'player') { state.pDamage += value; log.push(`🗡️ ${source}: ${targetName} +${value} DAN → ${state.pDamage}`); }
      else { state.eDamage += value; log.push(`🗡️ ${source}: ${targetName} +${value} DAN → ${state.eDamage}`); }
      break;
    case 'assaultValue':
      if (target === 'player') { state.pAssaultMod += value; log.push(`💥 ${source}: ${targetName} +${value} VA`); }
      else { state.eAssaultMod += value; log.push(`💥 ${source}: ${targetName} +${value} VA`); }
      break;
    
    // Effetti ENEMY (debuff al nemico) - bloccati dall'immunità di chi subisce
    case 'enemyPower':
      // target='player' → player riduce potenza IA → bloccato se IA immune
      // target='enemy' → IA riduce potenza player → bloccato se player immune
      // Inversione: un debuff POT subito dal bersaglio diventa +POT (solo valori negativi / riduzione)
      const minPow = options.minPower;
      if (target === 'player') {
        if (!state.eImmune) {
          const powerReduction = Math.abs(value);
          const minPowerValue = minPow !== undefined ? minPow : 1;
          if (state.eModifierInversion && value < 0) {
            state.ePower += powerReduction;
            log.push(`🔄 ${source}: Inversione — ${enemyName} +${powerReduction} POT → ${state.ePower}`);
          } else if (state.ePower <= minPowerValue) {
            log.push(`⚡ ${source}: ${value} POT nem. già al minimo ${minPowerValue} (nessun effetto)`);
          } else {
            const newPower = state.ePower - powerReduction;
            state.ePower = Math.max(minPowerValue, newPower);
            log.push(`⚡ ${source}: ${enemyName} ${value} POT → ${state.ePower}${state.ePower === minPowerValue ? ' (min)' : ''}`);
          }
        } else {
          log.push(`🐛¡️ ${source}: ${value} POT nem. BLOCCATO (Immune)`);
        }
      } else {
        if (!state.pImmune) {
          const powerReduction = Math.abs(value);
          const minPowerValue = minPow !== undefined ? minPow : 1;
          if (state.pModifierInversion && value < 0) {
            state.pPower += powerReduction;
            log.push(`🔄 ${source}: Inversione — ${enemyName} +${powerReduction} POT → ${state.pPower}`);
          } else if (state.pPower <= minPowerValue) {
            log.push(`⚡ ${source}: ${value} POT nem. già al minimo ${minPowerValue} (nessun effetto)`);
          } else {
            const newPower = state.pPower - powerReduction;
            state.pPower = Math.max(minPowerValue, newPower);
            log.push(`⚡ ${source}: ${enemyName} ${value} POT → ${state.pPower}${state.pPower === minPowerValue ? ' (min)' : ''}`);
          }
        } else {
          log.push(`🐛¡️ ${source}: ${value} POT nem. BLOCCATO (Immune)`);
        }
      }
      break;
    case 'enemyDamage':
      const minDmg = minDamage || 0;
      if (target === 'player') {
        if (state.eImmune) {
          log.push(`🐛¡️ ${source}: ${value} DAN nem. BLOCCATO (Immune)`);
        } else if (state.eModifierInversion && value < 0) {
          const before = state.eDamage;
          state.eDamage = Math.max(minDmg, state.eDamage - value);
          log.push(`🔄 ${source}: Inversione — ${enemyName} DAN ${before} → ${state.eDamage}`);
        } else if (state.eDamage <= minDmg) {
          log.push(`🐛¡️ ${source}: ${value} DAN nem. BLOCCATO (già al minimo ${minDmg})`);
        } else {
          const before = state.eDamage;
          state.eDamage = Math.max(minDmg, state.eDamage + value);
          log.push(`🗡️ ${source}: ${enemyName} ${value} DAN → ${before} → ${state.eDamage}${minDmg > 0 ? ` (min ${minDmg})` : ''}`);
        }
      } else {
        if (state.pImmune) {
          log.push(`🐛¡️ ${source}: ${value} DAN nem. BLOCCATO (Immune)`);
        } else if (state.pModifierInversion && value < 0) {
          const before = state.pDamage;
          state.pDamage = Math.max(minDmg, state.pDamage - value);
          log.push(`🔄 ${source}: Inversione — ${enemyName} DAN ${before} → ${state.pDamage}`);
        } else if (state.pDamage <= minDmg) {
          log.push(`🐛¡️ ${source}: ${value} DAN nem. BLOCCATO (già al minimo ${minDmg})`);
        } else {
          const before = state.pDamage;
          state.pDamage = Math.max(minDmg, state.pDamage + value);
          log.push(`🗡️ ${source}: ${enemyName} ${value} DAN → ${before} → ${state.pDamage}${minDmg > 0 ? ` (min ${minDmg})` : ''}`);
        }
      }
      break;
    case 'enemyPowerAndDamage':
      // Debuff combinato al nemico: applica POT e DAN in sequenza, rispettando minimi e immunità
      applyDuelPowerEffect('enemyPower', value, target, source, log, { minPower }, state, ctx);
      applyDuelPowerEffect('enemyDamage', value, target, source, log, { minDamage }, state, ctx);
      break;
    case 'imponiPower':
      // Imposta la POT nemica uguale alla POT corrente dell'utilizzatore (bloccabile da immune, non invertibile)
      if (target === 'player') {
        if (state.eImmune) {
          log.push(`🐛¡️ ${source}: Imponi POT BLOCCATO (Immune)`);
        } else {
          const before = state.ePower;
          state.ePower = state.pPower;
          log.push(`🧷 ${source}: Imponi POT nem. ${before} → ${state.ePower}`);
        }
      } else {
        if (state.pImmune) {
          log.push(`🐛¡️ ${source}: Imponi POT BLOCCATO (Immune)`);
        } else {
          const before = state.pPower;
          state.pPower = state.ePower;
          log.push(`🧷 ${source}: Imponi POT nem. ${before} → ${state.pPower}`);
        }
      }
      break;
    case 'imponiDamage':
      // Imposta il DAN nemico uguale al DAN corrente dell'utilizzatore (bloccabile da immune, non invertibile)
      if (target === 'player') {
        if (state.eImmune) {
          log.push(`🐛¡️ ${source}: Imponi DAN BLOCCATO (Immune)`);
        } else {
          const before = state.eDamage;
          state.eDamage = state.pDamage;
          log.push(`🧷 ${source}: Imponi DAN nem. ${before} → ${state.eDamage}`);
        }
      } else {
        if (state.pImmune) {
          log.push(`🐛¡️ ${source}: Imponi DAN BLOCCATO (Immune)`);
        } else {
          const before = state.pDamage;
          state.pDamage = state.eDamage;
          log.push(`🧷 ${source}: Imponi DAN nem. ${before} → ${state.pDamage}`);
        }
      }
      break;
    case 'enemyAssault':
      // VA È protetto da immunità (modifiche negative)
      // Il minimo significa: "può scendere FINO AL minimo" - se già sotto il minimo, non applicare
      const minAssault = options.minAssault;
      const invertAssaultPlayer = target === 'player' && state.eModifierInversion && value < 0;
      const invertAssaultEnemy = target === 'enemy' && state.pModifierInversion && value < 0;
      if (minAssault !== undefined && !invertAssaultPlayer && !invertAssaultEnemy) {
        if (target === 'player') {
          // Giocatore riduce VA nemico (IA)
          // Calcola VA attuale: (POT × FC) + modificatori attuali
          const currentAssaultRaw = (state.ePower * state.eFocusUsed) + state.eAssaultMod;
          // Se il VA è già sotto il minimo, NON applicare l'effetto
          if (currentAssaultRaw < minAssault) {
            log.push(`💥 ${source}: ${value} VA nem. BLOCCATO (VA già ${currentAssaultRaw} < minimo ${minAssault})`);
            break; // Non applicare la riduzione
          }
          // Traccia il minimo per applicarlo nel calcolo finale (stack: usa il minimo meno restrittivo/più basso)
          if (state.eMinAssault === null) {
            state.eMinAssault = minAssault;
          } else {
            state.eMinAssault = Math.min(state.eMinAssault, minAssault);
          }
        } else {
          // IA riduce VA nemico (giocatore)
          const currentAssaultRaw = (state.pPower * state.pFocusUsed) + state.pAssaultMod;
          if (currentAssaultRaw < minAssault) {
            log.push(`💥 ${source}: ${value} VA nem. BLOCCATO (VA già ${currentAssaultRaw} < minimo ${minAssault})`);
            break;
          }
          if (state.pMinAssault === null) {
            state.pMinAssault = minAssault;
          } else {
            state.pMinAssault = Math.min(state.pMinAssault, minAssault);
          }
        }
      }
      if (target === 'player') {
        if (!state.eImmune) {
          const v = invertAssaultPlayer ? -value : value;
          state.eAssaultMod += v;
          log.push(invertAssaultPlayer ? `🔄 ${source}: Inversione — ${enemyName} +${-value} VA` : `💥 ${source}: ${enemyName} ${value} VA`);
        }
        else log.push(`🐛¡️ ${source}: ${value} VA nem. BLOCCATO (Immune)`);
      } else {
        if (!state.pImmune) {
          const v = invertAssaultEnemy ? -value : value;
          state.pAssaultMod += v;
          log.push(invertAssaultEnemy ? `🔄 ${source}: Inversione — ${enemyName} +${-value} VA` : `💥 ${source}: ${enemyName} ${value} VA`);
        }
        else log.push(`🐛¡️ ${source}: ${value} VA nem. BLOCCATO (Immune)`);
      }
      break;
    
    // Effetti COPIA - sono poteri propri, non bloccati da immunità
    // Ma possono essere disabilitati dalla Fossa dei Traditori
    case 'copyPower':
      if (copyDisabled) {
        log.push(`🐛¡️ Fossa dei Traditori: Copia POT BLOCCATA`);
        break;
      }
      if (target === 'player') { 
        const newVal = state.ePower;
        state.pPower = newVal;
        log.push(`📋 ${source}: ${targetName} copia POT nem. → ${newVal}`);
      } else {
        const newVal = state.pPower;
        state.ePower = newVal;
        log.push(`📋 ${source}: ${targetName} copia POT nem. → ${newVal}`);
      }
      break;
    case 'copyDamage':
      if (copyDisabled) {
        log.push(`🐛¡️ Fossa dei Traditori: Copia DAN BLOCCATA`);
        break;
      }
      if (target === 'player') {
        const newVal = state.eDamage;
        state.pDamage = newVal;
        log.push(`📋 ${source}: ${targetName} copia DAN nem. → ${newVal}`);
      } else {
        const newVal = state.pDamage;
        state.eDamage = newVal;
        log.push(`📋 ${source}: ${targetName} copia DAN nem. → ${newVal}`);
      }
      break;
    case 'copyAbility':
      if (copyDisabled) {
        log.push(`🐛¡️ Fossa dei Traditori: Copia Potere BLOCCATA`);
        break;
      }
      // Copia il potere dell'avversario (incluso il trigger)
      const sourceAgent = target === 'player' ? ctx.eAgent : ctx.pAgent;
      if (sourceAgent.ability && sourceAgent.ability.effect) {
        // Verifica se il trigger del potere copiato è soddisfatto
        const copiedAbilityTrigger = sourceAgent.ability.trigger;
        const abilityTriggerSatisfied = copiedAbilityTrigger ? ctx.checkTrigger(copiedAbilityTrigger, target === 'player' ? ctx.playerContext : ctx.enemyContext) : true;
        
        if (abilityTriggerSatisfied) {
          log.push(`🔮 ${source}: ${targetName} copia Potere di ${sourceAgent.name}`);
          // Traccia il potere copiato
          if (target === 'player') {
            state.pAbilityCopied = sourceAgent.ability;
          } else {
            state.eAbilityCopied = sourceAgent.ability;
          }
          // Applica l'effetto copiato (ricorsione controllata)
          if (sourceAgent.ability.effect !== 'copyAbility') {
            applyDuelPowerEffect(sourceAgent.ability.effect, sourceAgent.ability.value, target, source + " (copiato)", log, { minDamage: sourceAgent.ability.minDamage, minPower: sourceAgent.ability.minPower, minAssault: sourceAgent.ability.minAssault, minHealth: sourceAgent.ability.minHealth, stat: sourceAgent.ability.stat }, state, ctx);
          }
        } else {
          const triggerName = TRIGGER_NAMES[copiedAbilityTrigger] || copiedAbilityTrigger;
          log.push(`⚠️ ${source}: Copia Potere (${triggerName} non attivo)`);
        }
      }
      break;
    case 'copyBonus':
      if (copyDisabled) {
        log.push(`🐛¡️ Fossa dei Traditori: Copia Bonus BLOCCATA`);
        break;
      }
      // Copia il bonus armata dell'avversario (incluso il trigger)
      const enemyBonusToCopy = target === 'player' ? ctx.eArmyBonus : ctx.pArmyBonus;
      const enemyHasBonusActive = target === 'player' ? ctx.eHasBonus : ctx.pHasBonus;
      if (enemyHasBonusActive && enemyBonusToCopy && enemyBonusToCopy.effects) {
        // Verifica se il trigger del bonus copiato è soddisfatto
        const copiedTrigger = enemyBonusToCopy.trigger;
        const triggerSatisfied = copiedTrigger ? ctx.checkTrigger(copiedTrigger, target === 'player' ? ctx.playerContext : ctx.enemyContext) : true;
        
        if (triggerSatisfied) {
          log.push(`🔮 ${source}: ${targetName} copia Bonus nem. (${enemyBonusToCopy.description})`);
          // Traccia il bonus copiato
          if (target === 'player') {
            state.pBonusCopied = enemyBonusToCopy;
          } else {
            state.eBonusCopied = enemyBonusToCopy;
          }
          enemyBonusToCopy.effects.forEach(eff => {
            if (eff.effect !== 'copyBonus') { // Evita ricorsione infinita
              applyDuelPowerEffect(eff.effect, eff.value, target, source + " (copiato)", log, { minDamage: eff.minDamage, minPower: eff.minPower, minAssault: eff.minAssault, minHealth: eff.minHealth }, state, ctx);
            }
          });
        } else {
          const triggerName = TRIGGER_NAMES[copiedTrigger] || copiedTrigger;
          log.push(`⚠️ ${source}: Copia Bonus (${triggerName} non attivo)`);
        }
      } else {
        log.push(`⚠️ ${source}: Copia Bonus (nessun bonus attivo)`);
      }
      break;
    case 'blockAbility':
      if (target === 'player') state.eAbilityBlocked = true;
      else state.pAbilityBlocked = true;
      log.push(`🚫 ${source}: Blocca Potere nemico`);
      break;
    case 'blockBonus':
      if (target === 'player') state.eBonusBlocked = true;
      else state.pBonusBlocked = true;
      log.push(`🚫 ${source}: Blocca Bonus nemico`);
      break;
    case 'immune':
      if (target === 'player') state.pImmune = true;
      else state.eImmune = true;
      log.push(`🐛¡️ ${source}: Immune`);
      break;
    case 'focusCoin':
      if (target === 'player') {
        const before = state.pFCCurrent;
        state.pFCCurrent += value;
        log.push(`💰 ${source}: +${value} FC (${before} → ${state.pFCCurrent})`);
      } else {
        const before = state.eFCCurrent;
        state.eFCCurrent += value;
        log.push(`💰 ${source}: IA +${value} FC (${before} → ${state.eFCCurrent})`);
      }
      break;
    case 'heal':
      if (target === 'player') {
        const before = state.pHPCurrent;
        state.pHPCurrent = Math.min(25, state.pHPCurrent + value);
        log.push(`💚 ${source}: +${value} PV (${before} → ${state.pHPCurrent})`);
      } else {
        const before = state.eHPCurrent;
        state.eHPCurrent = Math.min(25, state.eHPCurrent + value);
        log.push(`💚 ${source}: IA +${value} PV (${before} → ${state.eHPCurrent})`);
      }
      break;
    case 'directDamage':
      // Firewall Centrale disabilita i DAN diretti
      if (directDamageDisabled) {
        log.push(`🛡️ Firewall Centrale: Danni dir. annullato`);
        break;
      }
      // Nido della Regina aggiunge +1 ai DAN diretti
      const ddValue = value + directDamageBonus;
      if (directDamageBonus > 0) {
        log.push(`🐝 Nido della Regina: Danni dir. +${directDamageBonus}`);
      }
      if (target === 'player') {
        const before = state.eHPCurrent;
        state.eHPCurrent = Math.max(0, state.eHPCurrent - ddValue);
        log.push(`🔥 ${source}: ${ddValue} Danni dir. all'IA (${before} → ${state.eHPCurrent} PV)`);
      } else {
        const before = state.pHPCurrent;
        state.pHPCurrent = Math.max(0, state.pHPCurrent - ddValue);
        log.push(`🔥 ${source}: ${ddValue} Danni dir. a TE (${before} → ${state.pHPCurrent} PV)`);
      }
      break;
    case 'selfDamage':
      // Il danno va a chi usa l'abilità, non all'avversario
      if (target === 'player') {
        const before = state.pHPCurrent;
        state.pHPCurrent = Math.max(0, state.pHPCurrent - value);
        log.push(`💔 ${source}: -${value} PV a TE (${before} → ${state.pHPCurrent} PV)`);
      } else {
        const before = state.eHPCurrent;
        state.eHPCurrent = Math.max(0, state.eHPCurrent - value);
        log.push(`💔 ${source}: -${value} PV all'IA (${before} → ${state.eHPCurrent} PV)`);
      }
      break;
    case 'powerAndDamage':
      // Aumenta sia POT che DAN
      if (target === 'player') {
        state.pPower += value;
        state.pDamage += value;
        log.push(`⚔️ ${source}: TU +${value} POT → ${state.pPower}, +${value} DAN → ${state.pDamage}`);
      } else {
        state.ePower += value;
        state.eDamage += value;
        log.push(`⚔️ ${source}: IA +${value} POT → ${state.ePower}, +${value} DAN → ${state.eDamage}`);
      }
      break;
    case 'attrition':
      // Attrizione: +X [STAT] per ogni carta già giocata dal proprietario (solo le sue carte)
      const attritionStat = options.stat || 'power';
      const usedCards = target === 'player' ? (ctx.playerUsedCards || []) : (ctx.enemyUsedCards || []);
      const currentAgentId = target === 'player' ? ctx.pAgent?.id : ctx.eAgent?.id;
      const currentCardAlreadyIncluded = currentAgentId != null && usedCards.some((c) => c?.id === currentAgentId);
      // Conta solo le carte giocate PRIMA di quella corrente.
      const attritionCards = Math.max(0, usedCards.length - (currentCardAlreadyIncluded ? 1 : 0));
      const attritionBonus = value * attritionCards;
      if (attritionBonus > 0) {
        if (attritionStat === 'power') {
          if (target === 'player') { state.pPower += attritionBonus; log.push(`📈 ${source}: Attrizione +${attritionBonus} POT (${attritionCards} carte) → ${state.pPower}`); }
          else { state.ePower += attritionBonus; log.push(`📈 ${source}: Attrizione +${attritionBonus} POT (${attritionCards} carte) → ${state.ePower}`); }
        } else {
          if (target === 'player') { state.pDamage += attritionBonus; log.push(`📈 ${source}: Attrizione +${attritionBonus} DAN (${attritionCards} carte) → ${state.pDamage}`); }
          else { state.eDamage += attritionBonus; log.push(`📈 ${source}: Attrizione +${attritionBonus} DAN (${attritionCards} carte) → ${state.eDamage}`); }
        }
      }
      break;
    case 'escalation':
      // Escalation: +X [STAT] per ogni campo conquistato dal proprietario
      const escalationStat = options.stat || 'power';
      const escalationFields = target === 'player' ? ctx.playerFieldsConquered : ctx.enemyFieldsConquered;
      const escalationBonus = value * escalationFields;
      if (escalationBonus > 0) {
        if (escalationStat === 'power') {
          if (target === 'player') { state.pPower += escalationBonus; log.push(`📈 ${source}: Escalation +${escalationBonus} POT (${escalationFields} campi) → ${state.pPower}`); }
          else { state.ePower += escalationBonus; log.push(`📈 ${source}: Escalation +${escalationBonus} POT (${escalationFields} campi) → ${state.ePower}`); }
        } else if (escalationStat === 'powerAndDamage') {
          if (target === 'player') {
            state.pPower += escalationBonus; state.pDamage += escalationBonus;
            log.push(`📈 ${source}: Escalation +${escalationBonus} POT, +${escalationBonus} DAN (${escalationFields} campi) → ${state.pPower}/${state.pDamage}`);
          } else {
            state.ePower += escalationBonus; state.eDamage += escalationBonus;
            log.push(`📈 ${source}: Escalation +${escalationBonus} POT, +${escalationBonus} DAN (${escalationFields} campi) → ${state.ePower}/${state.eDamage}`);
          }
        } else {
          if (target === 'player') { state.pDamage += escalationBonus; log.push(`📈 ${source}: Escalation +${escalationBonus} DAN (${escalationFields} campi) → ${state.pDamage}`); }
          else { state.eDamage += escalationBonus; log.push(`📈 ${source}: Escalation +${escalationBonus} DAN (${escalationFields} campi) → ${state.eDamage}`); }
        }
      }
      break;
    case 'toxin':
      // Tossina: si attiva a fine turno successivo all'attivazione
      // value = danno, minHealth = soglia minima PV
      const minHealthToxin = options?.minHealth || 1;
      if (target === 'player') {
        // Tossina applicata al nemico (IA)
        // Controlla se c'è già una tossina attiva (dallo stato globale passato come closure)
        // NOTA: ctx.playerToxin e ctx.enemyToxin sono acceduti dallo scope esterno
        if (!ctx.enemyToxin) {
          // Prima attivazione
          state.enemyToxinActivated = { value, minHealth: minHealthToxin, source };
          log.push(`☠️ ${source}: Tossina ${value} attiva sull'IA (min ${minHealthToxin} PV)`);
        } else {
          // Stack: aumenta il valore di +1 e usa il minHealth meno restrittivo (più basso)
          state.enemyToxinActivated = {
            value: ctx.enemyToxin.value + 1,
            minHealth: Math.min(ctx.enemyToxin.minHealth, minHealthToxin),
            source: source
          };
          log.push(`☠️ ${source}: Tossina stacka! Ora ${state.enemyToxinActivated.value} (min ${state.enemyToxinActivated.minHealth} PV)`);
        }
      } else {
        // Tossina applicata al giocatore
        if (!ctx.playerToxin) {
          // Prima attivazione
          state.playerToxinActivated = { value, minHealth: minHealthToxin, source };
          log.push(`☠️ ${source}: Tossina ${value} attiva su TE (min ${minHealthToxin} PV)`);
        } else {
          // Stack: aumenta il valore di +1 e usa il minHealth meno restrittivo (più basso)
          state.playerToxinActivated = {
            value: ctx.playerToxin.value + 1,
            minHealth: Math.min(ctx.playerToxin.minHealth, minHealthToxin),
            source: source
          };
          log.push(`☠️ ${source}: Tossina stacka! Ora ${state.playerToxinActivated.value} (min ${state.playerToxinActivated.minHealth} PV)`);
        }
      }
      break;
    default:
      break;
  }
}