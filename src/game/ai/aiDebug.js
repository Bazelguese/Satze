// ============================================
// Debug / ragionamento IA (developer + post-match)
// ============================================

import { INFORMATION_POLICY } from './aiConstants.js';
import { TRIGGER_NAMES, TRIGGER_DESCRIPTIONS, getAbilityExplanation } from '../../data/triggers.js';
import { evaluateTriggerWindow } from './strategyPlanner.js';

const POST_BATTLE_TRIGGERS = new Set(['conquest', 'lastWish']);

export function isAIDebugEnabled() {
  try {
    return (
      typeof import.meta !== 'undefined' &&
      import.meta.env?.DEV &&
      typeof window !== 'undefined' &&
      window.__SATZE_AI_DEBUG__ === true
    );
  } catch {
    return false;
  }
}

function fmt(n, digits = 1) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Number(Number(n).toFixed(digits));
}

function fieldLabel(context, fieldIndex) {
  if (fieldIndex == null) return null;
  const field = context?.battlefields?.[fieldIndex];
  return field?.name ? `${field.name}` : `Campo #${fieldIndex}`;
}

function abilityBlurb(card) {
  if (!card?.ability) return null;
  if (card.description) return String(card.description).replace(/^Potere:\s*/i, '');
  const explained = getAbilityExplanation?.(card.ability);
  if (explained) return explained;
  const trig = TRIGGER_NAMES[card.ability.trigger] || card.ability.trigger;
  const when = TRIGGER_DESCRIPTIONS[card.ability.trigger];
  return when ? `${trig} (${when})` : trig || null;
}

function terminalLabel(status, winner) {
  if (status === 'ai_win_hp' || status === 'ai_win_fields' || status === 'ai_win_cards') {
    return 'chiuderebbe la partita a suo favore';
  }
  if (status === 'ai_loss_hp' || status === 'ai_loss_fields' || status === 'ai_loss_cards') {
    return 'rischierebbe di chiudere la partita a tuo favore';
  }
  if (winner === 'enemy') return 'vince il Campo';
  if (winner === 'player') return 'perde il Campo';
  return null;
}

/**
 * Costruisce il payload tecnico della decisione (usato da console e dal log partita).
 */
export function buildAIDebugPayload({ difficulty, selected, candidates, context, extras = {} }) {
  if (!selected) {
    return {
      difficulty,
      informationPolicy: INFORMATION_POLICY,
      selected: null,
      reasons: ['nessuna mossa legale'],
      candidates: [],
    };
  }

  const reasons = [];
  const sim = selected.simulation;
  if (selected.isTerminalWin) reasons.push('chiude la partita');
  if (sim?.terminalStatus === 'ai_win_hp') reasons.push('letale');
  if (sim?.terminalStatus === 'ai_win_fields') reasons.push('terzo Campo');
  if (sim?.winner === 'enemy') reasons.push('vince il Campo');
  if (sim?.winner === 'player') reasons.push('sconfitta strategica possibile');
  if (sim?.aiAbilityTriggered) reasons.push('abilità attiva');
  if (selected.exceptionReason) reasons.push(`eccezione:${selected.exceptionReason}`);
  reasons.push(`Focus ${selected.action.focus}`);
  reasons.push('Focus giocatore nascosto');

  const card = selected.action.card;
  const visible = context?.player?.visibleCard || null;
  const candList = candidates || [];
  const triggerWindow = evaluateTriggerWindow(card, context, 'ai', selected.action);
  const abilityFired = Boolean(sim?.aiAbilityTriggered);
  const postBattle = POST_BATTLE_TRIGGERS.has(card?.ability?.trigger);

  const sameCard = candList.filter((c) => c.action?.cardId === selected.action.cardId);
  const lowerFocus = [...sameCard]
    .filter((c) => (c.action?.focus || 0) < selected.action.focus)
    .sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  const higherFocus = [...sameCard]
    .filter((c) => (c.action?.focus || 0) > selected.action.focus)
    .sort((a, b) => (b.score || 0) - (a.score || 0))[0];

  const otherCards = candList
    .filter((c) => c.action?.cardId !== selected.action.cardId)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  const bestOtherByCard = [];
  const seen = new Set();
  for (const c of otherCards) {
    if (seen.has(c.action.cardId)) continue;
    seen.add(c.action.cardId);
    bestOtherByCard.push(c);
    if (bestOtherByCard.length >= 3) break;
  }

  const whyFocus = [];
  if (lowerFocus) {
    const gap = (selected.score || 0) - (lowerFocus.score || 0);
    if (gap > 50) {
      whyFocus.push({
        vsFocus: lowerFocus.action.focus,
        reason: 'with_less_worse',
        detail: terminalLabel(lowerFocus.simulation?.terminalStatus, lowerFocus.simulation?.winner),
      });
    } else if (gap < -50) {
      whyFocus.push({
        vsFocus: lowerFocus.action.focus,
        reason: 'with_less_better_but_picked_more',
        detail: terminalLabel(lowerFocus.simulation?.terminalStatus, lowerFocus.simulation?.winner),
      });
    }
  }
  if (higherFocus) {
    const gap = (selected.score || 0) - (higherFocus.score || 0);
    if (gap > 50) {
      whyFocus.push({
        vsFocus: higherFocus.action.focus,
        reason: 'with_more_waste',
        detail: null,
      });
    }
  }
  if (selected.exceptionReason) {
    whyFocus.push({ vsFocus: null, reason: 'budget_exception', detail: selected.exceptionReason });
  }

  const whyNotCards = bestOtherByCard.map((c) => {
    let reason = 'overall_worse';
    const gap = (selected.score || 0) - (c.score || 0);
    if (c.simulation?.winner === 'player' && sim?.winner === 'enemy') reason = 'loses_field';
    else if (
      selected.winProbability != null &&
      c.winProbability != null &&
      selected.winProbability > c.winProbability + 0.15
    ) {
      reason = 'wins_less_often';
    }
    if (sim?.aiAbilityTriggered && !c.simulation?.aiAbilityTriggered) reason = 'no_ability';
    if (c.isTerminalLoss && !selected.isTerminalLoss) reason = 'risks_match_loss';
    if (gap < -80) reason = 'numerically_better_but_not_picked';
    return {
      cardName: c.action?.card?.name || c.action?.cardId,
      focus: c.action?.focus,
      reason,
      winner: c.simulation?.winner,
      winProbability: c.winProbability,
      abilityWouldFire: Boolean(c.simulation?.aiAbilityTriggered),
    };
  });

  return {
    difficulty,
    informationPolicy: INFORMATION_POLICY,
    roundNumber: context?.roundNumber,
    isPlayerFirst: context?.isPlayerFirst,
    visiblePlayerCardId: visible?.id ?? null,
    visiblePlayerCardName: visible?.name ?? null,
    selectedAbility: abilityBlurb(card),
    selectedTrigger: card?.ability?.trigger || null,
    selectedTriggerLabel: card?.ability?.trigger
      ? TRIGGER_NAMES[card.ability.trigger] || card.ability.trigger
      : null,
    abilityFired,
    abilityPostBattle: postBattle,
    triggerReady: triggerWindow?.ready !== false,
    triggerWindowReason: triggerWindow?.reason || null,
    fairShare: extras.fairShare ?? selected.budget?.fairShare,
    ordinaryCap: extras.ordinaryCap ?? selected.budget?.ordinaryCap,
    searchDepth: extras.searchDepth ?? selected.searchDepth ?? 0,
    searchNodes: extras.searchNodes ?? 0,
    searchCacheHits: extras.searchCacheHits ?? 0,
    exception: selected.exceptionReason || null,
    expectedScore: selected.expectedScore,
    lowerPercentileScore: selected.lowerPercentileScore,
    overinvestmentPenalty: selected.overinvestmentPenalty,
    winProbability: selected.winProbability,
    scenarios: extras.scenarios || [],
    whyFocus,
    whyNotCards,
    selected: {
      cardId: selected.action.cardId,
      cardName: selected.action.card?.name,
      focus: selected.action.focus,
      fieldIndex: selected.action.fieldIndex,
      score: selected.score,
    },
    reasons,
    candidates: candList.slice(0, 24).map((c) => ({
      cardId: c.action.cardId,
      cardName: c.action.card?.name,
      focus: c.action.focus,
      score: fmt(c.score),
      expectedScore: fmt(c.expectedScore),
      overinvestmentPenalty: fmt(c.overinvestmentPenalty),
      exception: c.exceptionReason || null,
      winner: c.simulation?.winner,
      aiHpAfter: c.simulation?.aiHpAfter,
      playerHpAfter: c.simulation?.playerHpAfter,
      aiFocusAfter: c.simulation?.aiFocusAfter,
      playerFocusAfter: c.simulation?.playerFocusAfter,
      terminalStatus: c.simulation?.terminalStatus,
      winProbability: c.winProbability,
      abilityTriggered: Boolean(c.simulation?.aiAbilityTriggered),
    })),
  };
}

const FIT_REASON_IT = {
  'attiva-trigger-spento': 'su questo Campo il suo potere si attiva (altrimenti no)',
  'spegne-trigger-attivo': 'attenzione: il Campo spegnerebbe un potere che di solito funziona',
  'soglia-overdrive-ridotta': 'qui l’Overdrive scatta più facilmente',
  'bonus-overdrive-campo': 'il Campo potenzia l’Overdrive',
  'tema-armata': 'il tema del Campo combacia con la sua armata',
  'campo-valori': 'è un Campo da valori (premia POT/DAN alti)',
  'campo-trigger': 'è un Campo che esalta i trigger',
  'campo-focus': 'è un Campo legato al Focus',
  'vittoria-per-focus': 'qui vince chi investe più Focus, non il VA',
  'vittoria-per-potenza': 'qui decide soprattutto la potenza',
  'vittoria-per-danno': 'qui decide soprattutto il danno',
  'danno-da-potenza': 'il Campo fa sì che il danno dipenda dalla potenza',
  'potenza-tagliata': 'il Campo taglia le potenze troppo alte',
  'potenza-finale-tagliata': 'il Campo limita la potenza finale',
  'danno-tagliato': 'il Campo taglia i danni troppo alti',
  'potere-limitato-dal-campo': 'il Campo limita il potere della carta',
};

function describeFitReasons(reasons) {
  return (reasons || [])
    .map((r) => FIT_REASON_IT[r] || null)
    .filter(Boolean)
    .slice(0, 2);
}

function whyNotCardLine(entry, selectedName) {
  const name = entry.cardName;
  switch (entry.reason) {
    case 'loses_field':
      return `Non ${name}: nelle sue ipotesi perderebbe il Campo più spesso di con ${selectedName}.`;
    case 'wins_less_often':
      return `Non ${name}: vinceva lo scontro meno spesso (stima ~${Math.round((entry.winProbability || 0) * 100)}% vs la scelta fatta).`;
    case 'no_ability':
      return `Non ${name}: con quella linea il potere della carta non partiva, con ${selectedName} sì.`;
    case 'risks_match_loss':
      return `Non ${name}: in alcuni scenari rischiava di farti chiudere la partita.`;
    case 'numerically_better_but_not_picked':
      return `Ha scartato ${name} anche se sui numeri sembrava buona: ha preferito ${selectedName} per rischio/Focus/setup futuro.`;
    default:
      return `Non ${name} (con ${entry.focus} FC): complessivamente la valutava peggio di ${selectedName}.`;
  }
}

function whyFocusLines(whyFocus, focus, fairShare, ordinaryCap) {
  const lines = [];
  for (const w of whyFocus || []) {
    if (w.reason === 'with_less_worse') {
      lines.push(
        w.detail
          ? `Perché ${focus} FC e non ${w.vsFocus}: con meno Focus ${w.detail}.`
          : `Perché ${focus} FC e non ${w.vsFocus}: con meno Focus lo scontro andava peggio nelle sue ipotesi.`
      );
    } else if (w.reason === 'with_less_better_but_picked_more') {
      lines.push(
        `Curiosità: con ${w.vsFocus} FC i numeri erano anche meglio — ha comunque messo ${focus} (rischio/abilità/setup).`
      );
    } else if (w.reason === 'with_more_waste') {
      lines.push(
        `Perché non ${w.vsFocus} FC: spendere di più non migliorava abbastanza lo scontro (avrebbe sprecato Focus).`
      );
    } else if (w.reason === 'budget_exception') {
      lines.push(
        `Ha forzato il budget Focus per un’emergenza (${w.detail || 'minaccia / Campo decisivo'}).`
      );
    }
  }
  if (!lines.length && focus != null) {
    const fair = fairShare != null ? Math.round(Number(fairShare)) : null;
    const cap = ordinaryCap != null ? Math.round(Number(ordinaryCap)) : null;
    if (fair != null && focus > fair + 1) {
      lines.push(
        `Perché tanti Focus (${focus}): vuole spingere lo scontro sopra il ritmo normale (~${fair})${cap != null ? `, fino al tetto ${cap}` : ''}.`
      );
    } else if (fair != null && focus < fair - 1) {
      lines.push(
        `Perché pochi Focus (${focus}): sta risparmiando rispetto al ritmo (~${fair}) — o non gliene servono di più per l’obiettivo.`
      );
    } else if (cap != null && focus >= cap) {
      lines.push(`Mette ${focus} FC: è al massimo che si concede in questo round (tetto ${cap}).`);
    } else {
      lines.push(
        `Mette ${focus} FC perché, nelle ipotesi sul tuo Focus, è il punto in cui lo scontro le torna meglio senza bruciare la riserva.`
      );
    }
  }
  return lines;
}

function abilityNarrativeLines(debug, cardName, focus) {
  const lines = [];
  const trigger = debug.selectedTrigger;
  const label = debug.selectedTriggerLabel || trigger;
  const blurb = debug.selectedAbility;
  const fired = debug.abilityFired === true || debug.reasons?.includes('abilità attiva');
  const ready = debug.triggerReady !== false;
  const postBattle = debug.abilityPostBattle === true;

  if (!blurb && !trigger) return lines;

  // Evita "Trigger X: X: effetto"
  let effectText = blurb || label || '';
  if (label && effectText.toLowerCase().startsWith(String(label).toLowerCase())) {
    effectText = effectText.slice(label.length).replace(/^:\s*/, '');
  }

  if (trigger === 'conquest') {
    if (fired || debug.reasons?.includes('vince il Campo')) {
      lines.push(
        `Perché ${cardName}: punta a vincere il Campo; Conquista (${effectText || 'premio post-vittoria'}) scatta dopo, non durante il confronto.`
      );
    } else {
      lines.push(
        `Perché ${cardName}: ha Conquista, ma senza vittoria del Campo il premio post-duello non parte — qui la valuta soprattutto per i valori.`
      );
    }
    return lines;
  }

  if (trigger === 'lastWish') {
    if (fired || debug.reasons?.includes('sconfitta strategica possibile')) {
      lines.push(
        `Perché ${cardName}: Ultimo desiderio (${effectText || 'premio post-sconfitta'}) scatta dopo aver perso il Campo, non per vincere lo scontro.`
      );
    } else {
      lines.push(
        `Perché ${cardName}: ha Ultimo desiderio, utile solo se perde il Campo; non è un piano per vincere il confronto.`
      );
    }
    return lines;
  }

  if (trigger === 'overdrive' && !fired && !ready) {
    lines.push(
      `Perché ${cardName}: la gioca per valori / contenimento — Overdrive a ${focus ?? '?'} FC non parte (serve Focus sufficienti).`
    );
    return lines;
  }

  if (!fired && !ready && trigger) {
    lines.push(
      `Perché ${cardName}: ${effectText || label} — in questa linea il potere non è pronto${
        debug.triggerWindowReason ? ` (${debug.triggerWindowReason})` : ''
      }; la sceglie per altro (stats / risparmio / setup).`
    );
    return lines;
  }

  if (effectText) {
    lines.push(
      label && !String(effectText).toLowerCase().includes(String(label).toLowerCase())
        ? `Perché ${cardName}: ${label} — ${effectText}.`
        : `Perché ${cardName}: ${effectText}.`
    );
  }

  if (fired && !postBattle) {
    lines.push(
      `In questa linea il potere di ${cardName} parte: è uno dei motivi per cui l’ha preferita.`
    );
  } else if (fired && postBattle) {
    lines.push(
      `Il premio post-duello di ${cardName} risulta attivo in questa linea (dopo l’esito del Campo).`
    );
  }

  return lines;
}

/**
 * Log post-match: spiega il PERCHÉ (Campo / carta / FC / alternative).
 */
export function formatAIReasoningEntry(decision, meta = {}) {
  const debug = decision?.debug || {};
  const context = meta.context;
  const round = debug.roundNumber ?? context?.roundNumber ?? meta.roundNumber ?? '?';
  const fieldIndex = decision?.fieldIndex ?? debug.selected?.fieldIndex ?? null;
  const fieldName =
    fieldLabel(context, fieldIndex) ||
    debug.fieldName ||
    (fieldIndex != null
      ? debug.jointCandidates?.find((c) => c.fieldIndex === fieldIndex)?.fieldName
      : null) ||
    null;
  const cardName = decision?.card?.name || debug.selected?.cardName || '—';
  const focus = decision?.focus ?? debug.selected?.focus ?? null;
  const kind =
    meta.kind ||
    (debug.jointAction ? 'joint' : context?.isPlayerFirst === false ? 'lead' : 'response');

  const lines = [];

  if (kind === 'joint' || debug.jointAction) {
    lines.push(
      fieldName
        ? `Cosa: apre lei → Campo «${fieldName}» + ${cardName} con ${focus} FC.`
        : `Cosa: apre lei → ${cardName} con ${focus} FC.`
    );
  } else if (kind === 'response') {
    const vs = debug.visiblePlayerCardName
      ? ` (tu hai giocato ${debug.visiblePlayerCardName})`
      : '';
    lines.push(
      fieldName
        ? `Cosa: risponde su «${fieldName}» con ${cardName} (${focus} FC)${vs}.`
        : `Cosa: risponde con ${cardName} (${focus} FC)${vs}.`
    );
  } else {
    lines.push(`Cosa: gioca ${cardName} con ${focus} FC${fieldName ? ` su «${fieldName}»` : ''}.`);
  }

  const fs = debug.fieldStrategy;
  if (fs && (kind === 'joint' || debug.jointAction) && fieldName) {
    const threat = Number(fs.playerThreat) || 0;
    const opp = Number(fs.aiOpportunity) || 0;
    const threats = fs.threatCardNames || [];
    const opps = fs.opportunityCardNames || [];

    if (threat >= opp + 1.5 && threats.length) {
      lines.push(
        `Perché questo Campo: soprattutto per togliertelo — le tue carte che ci guadagnerebbero di più sono ${threats.join(' e ')}.`
      );
    } else if (threat >= opp + 1.5) {
      lines.push(
        `Perché questo Campo: soprattutto per togliertelo (le sembrava più pericoloso per te che utile a lei).`
      );
    } else if (opp >= threat + 1.5 && opps.length) {
      lines.push(
        `Perché questo Campo: le torna utile con ${opps.join(' / ')}, non solo per togliertelo.`
      );
    } else if (opps.length || threats.length) {
      const bits = [];
      if (opps.length) bits.push(`a lei serve per ${opps.join(' / ')}`);
      if (threats.length) bits.push(`a te sarebbe utile per ${threats.join(' / ')}`);
      lines.push(`Perché questo Campo: bilancia ${bits.join(' e ')}.`);
    } else {
      lines.push(
        `Perché questo Campo: tra quelli disponibili era il compromesso migliore carta+Focus.`
      );
    }

    const fit = describeFitReasons(fs.fitReasons);
    if (fit.length) {
      lines.push(`Perché ${cardName} proprio qui: ${fit.join('; ')}.`);
    }

    if (fs.reserveCardName && Number(fs.preservePenalty) > 100) {
      lines.push(
        `Sapeva che «${fieldName}» forse stava meglio a ${fs.reserveCardName} più avanti, ma ha comunque giocato qui adesso.`
      );
    }

    const rejectedFields = (debug.jointCandidates || [])
      .filter((c) => c.fieldIndex !== fieldIndex && c.rejectWhy)
      .slice(0, 2);
    for (const rf of rejectedFields) {
      lines.push(`Perché non «${rf.fieldName}»: ${rf.rejectWhy}.`);
    }
  }

  for (const line of abilityNarrativeLines(debug, cardName, focus)) {
    lines.push(line);
  }
  if (debug.reasons?.includes('vince il Campo')) {
    lines.push(`Obiettivo primario: conquistare il Campo con questa linea.`);
  }
  if (debug.reasons?.includes('sconfitta strategica possibile')) {
    lines.push(
      `Non è sicura di vincere lo scontro: sta scegliendo una linea di contenimento / risparmio, non un all-in sicuro.`
    );
  }
  if (debug.winProbability != null) {
    const pct = Math.round(Number(debug.winProbability) * 100);
    lines.push(
      `Nelle ipotesi sul tuo Focus (che non vede), stima ~${pct}% di vincere questo Campo con ${cardName} a ${focus} FC.`
    );
  }

  for (const line of whyFocusLines(debug.whyFocus, focus, debug.fairShare, debug.ordinaryCap)) {
    lines.push(line);
  }
  if (debug.overinvestmentPenalty != null && Number(debug.overinvestmentPenalty) > 80) {
    const fair = debug.fairShare != null ? Math.round(Number(debug.fairShare)) : null;
    lines.push(
      fair != null && focus != null && focus >= fair + 3
        ? `Attenzione budget: con ${focus} FC (ritmo ~${fair}) accetta di restare scoperta nei round dopo — rischio vittoria di Pirro.`
        : `Sa di stare spendendo Focus in modo aggressivo: accetta di arrivare più corta ai round dopo.`
    );
  }

  for (const alt of (debug.whyNotCards || []).slice(0, 3)) {
    lines.push(whyNotCardLine(alt, cardName));
  }

  lines.push(
    `Limite: non conosce i tuoi Focus esatti — confronta scenari tipici (pochi / medi / tanti FC).`
  );

  const headline =
    kind === 'response'
      ? `Round ${round} — Perché ${cardName} (${focus ?? '?'} FC)`
      : fieldName
        ? `Round ${round} — Perché «${fieldName}» + ${cardName}`
        : `Round ${round} — Perché ${cardName}`;

  return {
    id: `${round}-${kind}-${decision?.cardId ?? 'x'}-${focus ?? 0}-${fieldIndex ?? 'nf'}-${Date.now()}`,
    roundNumber: round,
    kind,
    headline,
    considerations: lines,
    selected: {
      cardId: decision?.cardId ?? debug.selected?.cardId ?? null,
      cardName,
      focus,
      fieldIndex,
      fieldName,
      score: fmt(decision?.score ?? debug.selected?.score),
    },
    difficulty: debug.difficulty || meta.difficulty || null,
    debug,
  };
}

export function logAIDebug(debug) {
  if (!debug) return;
  console.info(
    '[SATZE AI]',
    {
      card: debug.selected?.cardName,
      focus: debug.selected?.focus,
      fairShare: debug.fairShare,
      ordinaryCap: debug.ordinaryCap,
      exception: debug.exception,
      expectedScore: debug.expectedScore,
      lowerPercentileScore: debug.lowerPercentileScore,
      overinvestmentPenalty: debug.overinvestmentPenalty,
      winProbability: debug.winProbability,
      informationPolicy: debug.informationPolicy,
    },
    debug.reasons
  );
  if (debug.candidates?.length && typeof console.table === 'function') {
    console.table(debug.candidates.slice(0, 10));
  }
}

/**
 * Testo plain per copia/incolla del log partita.
 * @param {ReturnType<typeof formatAIReasoningEntry>[]} entries
 */
export function formatAIReasoningLogText(entries) {
  if (!entries?.length) return 'Nessuna decisione IA registrata in questa partita.';
  return entries
    .map((e, i) => {
      const rows = [`${i + 1}. ${e.headline}`];
      for (const c of e.considerations || []) rows.push(`   - ${c}`);
      return rows.join('\n');
    })
    .join('\n\n');
}
