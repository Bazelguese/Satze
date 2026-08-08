// ============================================
// CICLO DEL GIORNO — SPEC_PROTOTIPO_CAMPAGNA_CURSOR §7
//
// avanzaGiorno():
//   1. day += 1
//   2. per ogni Faglia attiva: aggiorna scadenza (collasso se scaduta)
//   3. spawn secondo i dati dell'Atto (rispettando maxActiveFaglie)
//   4. check eventi a giorno fisso
//   5. se day > daysLimit → esito 'tempo_scaduto'
//
// Le missioni consumano un giorno; eventi e gestione no.
// ============================================

/** Eventi con trigger a giorno fisso attivi per il giorno corrente. */
export function collectDayEvents(act, run) {
  return (act.events || [])
    .filter((ev) => ev.trigger?.type === 'day' && ev.trigger.day === run.day)
    .filter((ev) => !run.eventsSeen.includes(ev.id))
    .filter((ev) => !ev.window || (run.day >= ev.window[0] && run.day <= ev.window[1]))
    .map((ev) => ev.id);
}

/** Collasso delle Faglie scadute: slot liberato + penalità dai dati dell'Atto. */
function collapseExpiredFaglie(run, act) {
  const expired = run.faglie.filter((f) => run.day > f.closesDay);
  if (!expired.length) return run;
  let next = { ...run };
  next.faglie = run.faglie.filter((f) => run.day <= f.closesDay);
  const nodes = { ...next.nodes };
  for (const f of expired) {
    nodes[f.nodeId] = 'locked'; // slot di nuovo libero
  }
  next.nodes = nodes;
  // Penalità: perdita carte dal magazzino (configurata nei dati)
  const loss = (act.faglie?.collapse?.warehouseCardLoss ?? 0) * expired.length;
  if (loss > 0 && next.warehouse.length > 0) {
    next.warehouse = next.warehouse.slice(0, Math.max(0, next.warehouse.length - loss));
  }
  next.flags = { ...next.flags, faglie_collassate: (next.flags.faglie_collassate || 0) + expired.length };
  return next;
}

/** Spawn deterministico (seed + giorno) di una nuova Faglia se i dati lo prevedono. */
function spawnFaglieForDay(run, act) {
  const cfg = act.faglie;
  if (!cfg || !Array.isArray(cfg.spawnDays) || !cfg.spawnDays.includes(run.day)) return run;
  const maxActive = act.maxActiveFaglie ?? 2;
  if (run.faglie.length >= maxActive) return run;
  const occupied = new Set(run.faglie.map((f) => f.nodeId));
  const freeNode = act.nodes.find((n) => n.type === 'faglia' && !occupied.has(n.id));
  if (!freeNode) return run;
  const templates = cfg.missionTemplates || [];
  if (!templates.length) return run;
  const tplIndex = (run.seed + run.day) % templates.length;
  const tpl = templates[tplIndex];
  const faglia = {
    id: `faglia_d${run.day}_${freeNode.id}`,
    nodeId: freeNode.id,
    openedDay: run.day,
    closesDay: run.day + (cfg.durationDays ?? 3),
    army: tpl.army,
    templateIndex: tplIndex,
  };
  return {
    ...run,
    faglie: [...run.faglie, faglia],
    nodes: { ...run.nodes, [freeNode.id]: 'available' },
  };
}

/**
 * Contrattacchi programmati: al giorno indicato il nemico riprende
 * una delle enclave completate (la prima nell'ordine dei target).
 */
function applyCounterattacks(run, act) {
  const due = (act.contrattacchi || []).filter((c) => c.day === run.day);
  if (!due.length) return run;
  let next = run;
  for (const attack of due) {
    const target = (attack.targets || []).find((id) => next.nodes[id] === 'completed');
    if (!target) continue;
    next = {
      ...next,
      nodes: { ...next.nodes, [target]: 'available' },
      flags: {
        ...next.flags,
        contrattacchi: [...(next.flags.contrattacchi || []), { day: run.day, node: target }],
      },
    };
  }
  return next;
}

/**
 * Avanza il giorno. Funzione pura: restituisce una nuova run.
 * NON asserisce le invarianti (lo fa il reducer chiamante).
 */
export function advanceDay(run, act) {
  let next = { ...run, day: run.day + 1 };

  // 2. Faglie scadute collassano
  next = collapseExpiredFaglie(next, act);

  // 3. Spawn nuove Faglie
  next = spawnFaglieForDay(next, act);

  // 3b. Contrattacchi programmati
  next = applyCounterattacks(next, act);

  // 4. Eventi a giorno fisso
  const dayEvents = collectDayEvents(act, next);
  if (dayEvents.length) {
    next.pendingEvents = [...next.pendingEvents, ...dayEvents];
    next.eventsSeen = [...next.eventsSeen, ...dayEvents];
  }

  // 5. Tempo scaduto (solo se la run non è già chiusa)
  if (next.day > next.daysLimit && !next.outcome) {
    next.outcome = 'tempo_scaduto';
  }

  return next;
}
