// ============================================
// TRIGGER - Chiavi codice allineate al glossario SATZE
// ============================================
//
// Chiavi principali (evitare confusione storica):
// - imboscata  = primo a scegliere (ex chiave `turbo`)
// - vendetta   = perso scontro precedente (ex chiave `ambush`)
// - rimonta    = meno PV del nemico (ex chiave `vendetta`)
// - turbo      = round 1 o 2 (ex chiave `turboRound`; etichetta regola "Turbo")

export const TRIGGER_NAMES = {
  imboscata: 'Imboscata',
  intervention: 'Intervento',
  glory: 'Gloria',
  vendetta: 'Vendetta',
  rimonta: 'Rimonta',
  overdrive: 'Overdrive',
  reckoning: 'Resa dei conti',
  magnanimous: 'Magnanimo',
  lastWish: 'Ultimo desiderio',
  conquest: 'Conquista',
  opportunista: 'Opportunista',
  sfida: 'Sfida',
  sopraffare: 'Sopraffare',
  invasione: 'Invasione',
  resistenza: 'Resistenza',
  turbo: 'Turbo',
  ultimaChance: 'Ultima Chance',
  alleato: 'Alleato',
  rinforzi: 'Rinforzi',
  debt: 'Debito',
};

export const TRIGGER_DESCRIPTIONS = {
  imboscata: 'se sei il primo a scegliere',
  intervention: 'se sei il secondo a scegliere',
  glory: 'se hai vinto lo scontro precedente',
  vendetta: 'se hai perso lo scontro precedente',
  overdrive: 'se spendi 5+ Focus Coin',
  reckoning: 'dopo almeno 2 duelli completati per entrambi (dal 3° scontro)',
  rimonta: "se hai meno PV dell'avversario",
  magnanimous: "se hai più PV dell'avversario",
  lastWish: 'se perdi questo scontro',
  conquest: 'se vinci questo scontro',
  opportunista: 'se il nemico ha speso 5+ Focus Coin questo turno',
  sfida: 'se la tua Lega è inferiore a quella nemica',
  sopraffare: 'se la tua Lega è superiore a quella nemica',
  invasione: 'se hai conquistato 1+ campi',
  resistenza: 'se il nemico ha conquistato 1+ campi',
  turbo: 'se è il Round 1 o 2',
  ultimaChance: 'se è il Round 5 o successivo',
  alleato: 'se nella tua mano iniziale c era almeno 1 altra carta della stessa Lega della carta giocata',
  rinforzi: 'se nella tua mano iniziale c erano almeno 2 altre carte della stessa Lega della carta giocata',
  debt: 'quando viene schierato, il suo giocatore perde 2 PV; poi il Potere si attiva',
};

export const getAbilityExplanation = (ability) => {
  if (!ability) return null;

  let triggerText = '';
  if (ability.trigger) {
    const nm = TRIGGER_NAMES[ability.trigger];
    const ds = TRIGGER_DESCRIPTIONS[ability.trigger];
    triggerText = nm && ds ? `${nm} (${ds}): ` : `${nm || ability.trigger}: `;
  }

  let effectText = '';
  switch (ability.effect) {
    case 'power':
      effectText = `aumenta la tua POT di ${ability.value}. La POT viene moltiplicata per i Focus Coin per calcolare il Valore Assalto.`;
      break;
    case 'enemyPower':
      effectText = `riduce la POT nemica di ${Math.abs(ability.value)}. Meno POT significa un Valore Assalto più basso per l'avversario.`;
      break;
    case 'damage':
      effectText = `aumenta il tuo Danno di ${ability.value}. Il Danno sono i PV inflitti all'avversario se vinci lo scontro.`;
      break;
    case 'enemyDamage':
      effectText = `riduce il Danno nemico di ${Math.abs(ability.value)}${ability.minDamage ? ` (minimo ${ability.minDamage})` : ''}. L'avversario infliggerà meno danni se vince.`;
      break;
    case 'enemyPowerAndDamage': {
      const mins = [];
      if (ability.minPower != null) mins.push(`POT minimo ${ability.minPower}`);
      if (ability.minDamage != null) mins.push(`DAN minimo ${ability.minDamage}`);
      effectText = `riduce POT e DAN nemici di ${Math.abs(ability.value)}${mins.length ? ` (${mins.join(', ')})` : ''}.`;
      break;
    }
    case 'imponiPower':
      effectText = `imposta la POT nemica uguale alla tua POT corrente al momento dell'attivazione.`;
      break;
    case 'imponiDamage':
      effectText = `imposta il DAN nemico uguale al tuo DAN corrente al momento dell'attivazione.`;
      break;
    case 'assaultValue':
      effectText = `aggiunge ${ability.value} direttamente al tuo Valore Assalto finale. Questo bonus si applica dopo il calcolo POT × FC.`;
      break;
    case 'enemyAssault':
      effectText = `riduce il Valore Assalto nemico di ${Math.abs(ability.value)}${ability.minAssault ? ` (minimo ${ability.minAssault})` : ''}. Si applica dopo il calcolo del VA avversario.`;
      break;
    case 'copyPower':
      effectText = `copia la POT dell'avversario. La tua POT diventa uguale a quella nemica.`;
      break;
    case 'copyDamage':
      effectText = `copia il Danno dell'avversario. Il tuo Danno diventa uguale a quello nemico.`;
      break;
    case 'copyAbility':
      effectText = `copia il Potere dell'agente avversario. Userai l'abilità nemica come se fosse tua.`;
      break;
    case 'copyBonus':
      effectText = `copia il Bonus Armata dell'avversario. Otterrai il bonus della sua armata.`;
      break;
    case 'blockAbility':
      effectText = `blocca il Potere dell'agente avversario. L'abilità nemica non si attiverà.`;
      break;
    case 'blockBonus':
      effectText = `blocca il Bonus Armata dell'avversario. Il bonus nemico non si attiverà.`;
      break;
    case 'immune':
      effectText = `rende immune agli effetti negativi. Riduzioni di POT, Danno e VA non avranno effetto su di te.`;
      break;
    case 'focusCoin':
      effectText = `fa guadagnare ${ability.value} Focus Coin a fine scontro. Avrai più risorse per i prossimi turni.`;
      break;
    case 'heal':
      effectText = `cura ${ability.value} PV a fine scontro. Recupererai punti vita.`;
      break;
    case 'selfDamage':
      effectText = `ti infligge ${ability.value} danno ai tuoi PV a fine scontro. Un prezzo da pagare per il potere.`;
      break;
    case 'directDamage':
      effectText = `infligge ${ability.value} danno diretto ai PV nemici, indipendentemente dal risultato dello scontro.`;
      break;
    case 'powerAndDamage':
      effectText = `aumenta POT e DAN di ${ability.value} ciascuno. Potenzia sia l'attacco che il danno.`;
      break;
    case 'escalation': {
      const escalationStat =
        ability.stat === 'powerAndDamage'
          ? 'POT e DAN'
          : ability.stat === 'power'
            ? 'POT'
            : ability.stat === 'damage'
              ? 'DAN'
              : ability.stat;
      effectText = `aumenta la tua ${escalationStat} di ${ability.value} per ogni campo che hai conquistato. Più campi controlli, più diventi potente.`;
      break;
    }
    case 'attrition': {
      const attritionStat =
        ability.stat === 'powerAndDamage'
          ? 'POT e DAN'
          : ability.stat === 'power'
            ? 'POT'
            : ability.stat === 'damage'
              ? 'DAN'
              : ability.stat;
      effectText = `aumenta la tua ${attritionStat} di ${ability.value} per ogni carta che hai già giocato in questa partita. Diventa più forte man mano che la partita procede.`;
      break;
    }
    case 'inversion':
      effectText = `inverte tutti i modificatori esterni che ricevi. I debuff del nemico e i malus dei campi diventano buff, mentre i buff dei campi diventano malus.`;
      break;
    case 'toxin':
      effectText = `applica Tossina ${ability.value}${ability.minHealth != null ? ` (min ${ability.minHealth} PV per disattivazione)` : ''} al bersaglio.`;
      break;
    default:
      effectText = 'effetto sconosciuto.';
  }

  return triggerText + effectText.charAt(0).toUpperCase() + effectText.slice(1);
};
