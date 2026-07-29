/**
 * Unique localization point for battle-log events.
 * Emissions must not contain player-facing Italian phrases.
 */

import {
  BATTLE_EVENT_TYPES,
  BATTLE_STATS,
} from './battleEventTypes.js';

const DEFAULT_CONTEXT = {
  localLabel: 'Tu',
  opponentLabel: 'IA',
};

function sideLabel(side, context = DEFAULT_CONTEXT) {
  if (side === 'local') return context.localLabel ?? DEFAULT_CONTEXT.localLabel;
  if (side === 'opponent') return context.opponentLabel ?? DEFAULT_CONTEXT.opponentLabel;
  return '';
}

function sourceLabel(event) {
  return event?.source?.name || event?.source?.id || 'Sistema';
}

function targetLabel(event, context) {
  const t = event?.target;
  if (!t) return '';
  if (t.kind === 'player') return sideLabel(t.side, context);
  if (t.name) return t.name;
  return sideLabel(t.side, context) || t.id || '';
}

function transition(before, after, stat) {
  const b = before == null ? '?' : before;
  const a = after == null ? '?' : after;
  return `${stat} ${b}→${a}`;
}

function getEventTone(event) {
  if (event?.type === BATTLE_EVENT_TYPES.outcome) {
    if (event.winnerSide === 'local') return 'local';
    if (event.winnerSide === 'opponent') return 'opponent';
    return 'neutral';
  }
  if (event?.type === BATTLE_EVENT_TYPES.block) return 'warning';
  const side = event?.target?.side ?? event?.source?.ownerSide;
  if (side === 'local') return 'local';
  if (side === 'opponent') return 'opponent';
  return 'neutral';
}

function getBattleEventIcon(event) {
  switch (event?.type) {
    case BATTLE_EVENT_TYPES.roundHeader:
      return 'field';
    case BATTLE_EVENT_TYPES.statChange:
      if (event.stat === BATTLE_STATS.POT) return 'power';
      if (event.stat === BATTLE_STATS.DAN) return 'damage';
      if (event.stat === BATTLE_STATS.VA) return 'assault';
      return 'stat';
    case BATTLE_EVENT_TYPES.resourceChange:
      return event.stat === BATTLE_STATS.FC ? 'focus' : 'health';
    case BATTLE_EVENT_TYPES.block:
      return 'block';
    case BATTLE_EVENT_TYPES.copy:
      return 'copy';
    case BATTLE_EVENT_TYPES.fieldRule:
      return 'rule';
    case BATTLE_EVENT_TYPES.assaultCalculation:
      return 'assault';
    case BATTLE_EVENT_TYPES.outcome:
      return 'outcome';
    case BATTLE_EVENT_TYPES.info:
      return 'info';
    default:
      return 'info';
  }
}

function blockedEffectLabel(blockedEffect) {
  if (!blockedEffect) return 'effetto';
  if (blockedEffect.kind === 'ability') return 'Potere';
  if (blockedEffect.kind === 'bonus') return 'Bonus';
  if (blockedEffect.effectType) return String(blockedEffect.effectType);
  return 'effetto';
}

function getBattleEventText(event, context = DEFAULT_CONTEXT) {
  if (!event) return '';
  const src = sourceLabel(event);
  const tgt = targetLabel(event, context);

  switch (event.type) {
    case BATTLE_EVENT_TYPES.roundHeader: {
      const fieldName = event.field?.name || event.field?.id || 'Campo';
      return `R${event.round} · ${fieldName}`;
    }
    case BATTLE_EVENT_TYPES.statChange:
    case BATTLE_EVENT_TYPES.resourceChange: {
      // VA su statChange è il modificatore d'assalto, non il VA finale del duello.
      const statLabel = event.stat === BATTLE_STATS.VA ? 'mod VA' : event.stat;
      return `${src} · ${transition(event.before, event.after, statLabel)}`;
    }
    case BATTLE_EVENT_TYPES.block: {
      const what = blockedEffectLabel(event.blockedEffect);
      const by = event.blockedBy ? ` (${event.blockedBy})` : '';
      return `${src} · ${what}${tgt ? ` di ${tgt}` : ''} annullato${by}`;
    }
    case BATTLE_EVENT_TYPES.copy: {
      const kind = event.copied?.kind || 'valore';
      const val = event.copied?.value != null ? ` → ${event.copied.value}` : '';
      return `${src} · copia ${kind}${val}`;
    }
    case BATTLE_EVENT_TYPES.fieldRule: {
      const code = event.ruleCode || 'regola';
      return `${src} · ${code}`;
    }
    case BATTLE_EVENT_TYPES.assaultCalculation: {
      const side = sideLabel(event.target?.side, context);
      return `${side} VA ${event.finalVA}`;
    }
    case BATTLE_EVENT_TYPES.outcome: {
      const w = event.winnerSide;
      if (w === 'local') return 'VITTORIA';
      if (w === 'opponent') return 'SCONFITTA';
      return 'ESITO';
    }
    case BATTLE_EVENT_TYPES.info: {
      if (event.infoCode === 'opponentFieldChosen') {
        const name = event.data?.fieldName || event.data?.fieldId || 'campo';
        return `${sideLabel('opponent', context)} sceglie: ${name}`;
      }
      if (event.infoCode === 'toxinApplied') {
        return `${src} · Tossina ${event.data?.value ?? ''}`.trim();
      }
      if (event.infoCode === 'copiedTriggerInactive') {
        return `${src} · trigger copiato non attivo`;
      }
      return event.infoCode || 'info';
    }
    default:
      return event.type || '';
  }
}

function getBattleEventAriaLabel(event, context = DEFAULT_CONTEXT) {
  if (!event) return '';
  const src = sourceLabel(event);
  const tgt = targetLabel(event, context);

  switch (event.type) {
    case BATTLE_EVENT_TYPES.statChange:
    case BATTLE_EVENT_TYPES.resourceChange:
      return `${src} modifica ${event.stat} di ${tgt || 'bersaglio'} da ${event.before} a ${event.after}`;
    case BATTLE_EVENT_TYPES.block:
      return `${src} annulla ${blockedEffectLabel(event.blockedEffect)}${tgt ? ` di ${tgt}` : ''}${
        event.blockedBy ? `, motivo ${event.blockedBy}` : ''
      }`;
    case BATTLE_EVENT_TYPES.copy:
      return `${src} copia ${event.copied?.kind || 'valore'}${
        event.copied?.value != null ? ` valore ${event.copied.value}` : ''
      }`;
    case BATTLE_EVENT_TYPES.outcome: {
      const local = sideLabel('local', context);
      const opp = sideLabel('opponent', context);
      const winner =
        event.winnerSide === 'local' ? local : event.winnerSide === 'opponent' ? opp : 'nessuno';
      return `Esito duello: vince ${winner}. ${local} ${event.localVA} contro ${opp} ${event.opponentVA}`;
    }
    case BATTLE_EVENT_TYPES.roundHeader:
      return `Round ${event.round}, campo ${event.field?.name || ''}`;
    default:
      return getBattleEventText(event, context);
  }
}

/**
 * @param {object} event
 * @param {{ localLabel?: string, opponentLabel?: string }} [context]
 */
export function formatBattleEvent(event, context = DEFAULT_CONTEXT) {
  const ctx = { ...DEFAULT_CONTEXT, ...context };
  return {
    iconName: getBattleEventIcon(event),
    text: getBattleEventText(event, ctx),
    ariaLabel: getBattleEventAriaLabel(event, ctx),
    tone: getEventTone(event),
    emphasis: event?.type === BATTLE_EVENT_TYPES.outcome,
  };
}

export function formatTransition(before, after, stat) {
  return transition(before, after, stat);
}
