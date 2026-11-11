// Due client del Duello online che giocano con le Eminenze scambiandosi solo i messaggi di
// eminenceOnline.js (e le mosse Agente/FC, come peer_move): dopo ogni passo lo stato di uno
// deve essere lo specchio esatto dell'altro (player ↔ enemy).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARMY_DECKS, ALL_AGENTS } from '../../data/cards.js';
import { mulberry32 } from '../../utils/seededRandom.js';
import { EMINENCE_FORMAT, SIDES } from './eminenceConstants.js';
import { createMatchEminenceState } from './eminenceSetup.js';
import {
  openEminenceRound, advanceToNextRevealGate, prepareEminenceDuel, settleEminenceRound,
  isEminenceSetupPending, commitEminenceSetupChoice, resolvePendingDeal, remoteSideMissingParams,
} from './eminenceDuelGate.js';
import { getNextGate, selectEminenceAbility, setEminenceAbilityParams } from './eminenceRound.js';
import { getLegalAbilityIds } from './eminenceState.js';
import { getEminence, getEminenceAbility } from '../../data/eminences.js';
import { resolveParamsSchema, pickDefaultSelectionParams, schemaTargetsAvailable } from './eminenceParamSchema.js';
import {
  EMINENCE_ONLINE_MESSAGES as M, flipSides, choiceMessage, setupMessage, dealMessage,
  applyRemoteChoice, applyRemoteSetup, dealNeedsRemoteResponse, forcedDealResponse, applyRemoteDealResponse,
  legalDealOptions,
} from './eminenceOnline.js';

const carta = (id) => ALL_AGENTS.find((c) => c.id === id);
const mazzo = (army, key = 'A') => ARMY_DECKS[army][key].cards.map(carta);
const OPP = { player: 'enemy', enemy: 'player' };

function creaClient(nome, mioMazzo, suoMazzo) {
  return {
    nome,
    ms: createMatchEminenceState({ format: EMINENCE_FORMAT.REQUIRED, playerDeck: mioMazzo, enemyDeck: suoMazzo }).matchState,
    mano: mioMazzo.slice(0, 5).map((c) => c.id),
    manoAvv: suoMazzo.slice(0, 5).map((c) => c.id),
    usate: [],
    usateAvv: [],
    inbox: [],
    affariInAttesa: [],
    risposteAnticipate: [],
  };
}

function contesto(c, agenti = null) {
  return {
    ownUndeployedCardIds: c.mano.filter((id) => !c.usate.includes(id) && id !== agenti?.player),
    enemyUndeployedCardIds: c.manoAvv.filter((id) => !c.usateAvv.includes(id) && id !== agenti?.enemy),
    confirmedAgents: agenti ? [{ id: agenti.player, side: 'player' }, { id: agenti.enemy, side: 'enemy' }] : [],
    slotCount: 5,
    slots: [0, 1, 2, 3, 4].map((index) => ({ index, conquered: false, revealed: true })),
  };
}

function paramsDefault(c, abilityId, agenti) {
  const ability = getEminenceAbility(c.ms.player.eminenceId, abilityId);
  if (!ability?.paramsSchema) return null;
  const resolved = resolveParamsSchema(ability.paramsSchema, c.ms.player.persistent, contesto(c, agenti));
  if (!schemaTargetsAvailable(resolved, ability.paramsSchema)) return null;
  const p = pickDefaultSelectionParams(resolved) || {};
  if (Object.values(ability.paramsSchema).some((s) => s?.source === 'CONFIRMED_AGENTS') && p.cardId == null && agenti) {
    p.cardId = agenti.player;
    p.targetSide = 'player';
  }
  return Object.keys(p).length ? p : null;
}

function invia(da, a, msg) {
  a.inbox.push(JSON.parse(JSON.stringify(msg))); // passa per la rete: niente riferimenti condivisi
}

function ricevi(c, iniziativa) {
  while (c.inbox.length) {
    const msg = c.inbox.shift();
    if (msg.type === M.CHOICE) {
      const r = applyRemoteChoice(c.ms, msg);
      assert.ok(r.ok, `${c.nome}: scelta remota rifiutata (${r.reason}) ${JSON.stringify(msg)}`);
      c.ms = r.matchState;
    } else if (msg.type === M.SETUP) {
      const r = applyRemoteSetup(c.ms, msg);
      assert.ok(r.ok, `${c.nome}: setup remoto rifiutato (${r.reason})`);
      c.ms = r.matchState;
    } else if (msg.type === M.DEAL) {
      // La risposta può arrivare prima che questo client abbia aperto il gate dell'Affare.
      const deal = c.affariInAttesa.shift();
      if (deal) c.ms = applyRemoteDealResponse(c.ms, deal, msg, { initiativeSide: iniziativa }).matchState;
      else c.risposteAnticipate.push(msg);
    }
  }
}

function scegliAbilita(c, rng, round, altro) {
  const s = c.ms.player;
  if (!s?.eminenceId || s.selectedAbilityId || s.blockedThisRound) return;
  const legali = getLegalAbilityIds(s.eminenceId, s.selectionCheckpointPresence, s.persistent, { lastSelectedAbilityId: s.lastSelectedAbilityId });
  const conBersagli = legali.filter((id) => {
    const ab = getEminenceAbility(s.eminenceId, id);
    if (!ab?.paramsSchema || ab.choiceParamsTiming !== 'AT_SELECTION') return true;
    return paramsDefault(c, id, null) != null;
  });
  if (!conBersagli.length) return;
  const id = conBersagli[Math.floor(rng() * conBersagli.length)];
  const ab = getEminenceAbility(s.eminenceId, id);
  const params = ab?.choiceParamsTiming === 'AT_SELECTION' ? paramsDefault(c, id, null) : null;
  const r = selectEminenceAbility(c.ms, 'player', id, params);
  if (!r.ok) return;
  c.ms = r.matchState;
  invia(c, altro, choiceMessage(round, id, params));
}

function rispondiAffari(c, pendenti, rng, round, altro, iniziativa) {
  for (const deal of pendenti) {
    if (deal.recipientSide === 'player') {
      let risposta;
      if (deal.mode === 'CHOOSE_ONE') {
        const legali = legalDealOptions(deal, c.ms);
        risposta = legali.length <= 1
          ? forcedDealResponse(deal, c.ms)
          : { dealChoice: legali[Math.floor(rng() * legali.length)].id, opponentPresence: c.ms.player.presence };
        if (legali.length <= 1) {
          c.ms = resolvePendingDeal(c.ms, deal, risposta, { initiativeSide: iniziativa }).matchState;
          continue; // forzato: l'altro client lo risolve da solo
        }
      } else if (deal.mode === 'OFFER') {
        if (!dealNeedsRemoteResponse({ ...deal, recipientSide: 'enemy' }, c.ms)) {
          c.ms = resolvePendingDeal(c.ms, deal, forcedDealResponse(deal, c.ms), { initiativeSide: iniziativa }).matchState;
          continue; // obbligata e senza varianti: l'altro client la risolve da solo
        }
        const accetta = deal.mustAccept || rng() < 0.5;
        const scelte = deal.choices || [];
        risposta = accetta
          ? { dealAccepted: true, dealChoice: scelte.length ? scelte[Math.floor(rng() * scelte.length)] : null }
          : { dealAccepted: false, dealResponse: 'refuse' };
      } else {
        risposta = rng() < 0.5 ? { dealAccepted: true } : { dealAccepted: false, dealResponse: 'refuse' };
      }
      c.ms = resolvePendingDeal(c.ms, deal, risposta, { initiativeSide: iniziativa }).matchState;
      invia(c, altro, dealMessage(round, risposta));
    } else if (!dealNeedsRemoteResponse(deal, c.ms)) {
      c.ms = resolvePendingDeal(c.ms, deal, forcedDealResponse(deal, c.ms), { initiativeSide: iniziativa }).matchState;
    } else if (c.risposteAnticipate.length) {
      c.ms = applyRemoteDealResponse(c.ms, deal, c.risposteAnticipate.shift(), { initiativeSide: iniziativa }).matchState;
    } else {
      c.affariInAttesa.push(deal);
    }
  }
}

const CAMPI_CONFRONTATI = ['presence', 'selectedAbilityId', 'revealedAbilityId', 'totalPresenceSpent', 'setupCommitted', 'persistent', 'selectedParams'];

function specchio(a, b, dove) {
  for (const lato of ['player', 'enemy']) {
    for (const k of CAMPI_CONFRONTATI) {
      assert.deepEqual(flipSides(b.ms[OPP[lato]]?.[k] ?? null), a.ms[lato]?.[k] ?? null, `${dove}: ${a.nome}.${lato}.${k} ≠ ${b.nome}.${OPP[lato]}.${k}`);
    }
  }
  assert.deepEqual(a.ms.gateProgress, b.ms.gateProgress, `${dove}: gate diversi`);
}

function avanzaGate(c, altro, rng, round, iniziativa, agenti) {
  // Se tocca a me fornire params al reveal (lato player), li scelgo e li mando.
  const gate = getNextGate(c.ms.gateProgress);
  if (!gate) return 'fatto';
  if (c.affariInAttesa.length) return 'attesa';
  const s = c.ms.player;
  if (remoteSideMissingParams(c.ms, 'player', { gate, agentIdBySide: agenti, paramContext: contesto(c, agenti) })) {
    const params = paramsDefault(c, s.selectedAbilityId, agenti);
    if (params) {
      c.ms = setEminenceAbilityParams(c.ms, 'player', params).matchState;
      invia(c, altro, choiceMessage(round, s.selectedAbilityId, params));
    }
  }
  if (gate === 'GENERAL' && !agenti) return 'attesa';
  const r = advanceToNextRevealGate(c.ms, {
    initiativeSide: iniziativa, agentIdBySide: agenti, paramContext: contesto(c, agenti),
    toxinBySide: { player: null, enemy: null }, remoteEnemy: true,
  });
  if (r.blocked) return 'attesa';
  c.ms = r.matchState;
  rispondiAffari(c, r.bundle?.pendingDeals || [], rng, round, altro, iniziativa);
  return 'avanzato';
}

function partita(armataHost, armataOspite, seme) {
  const rng = mulberry32(seme);
  const mazzoHost = mazzo(armataHost);
  const mazzoOspite = mazzo(armataOspite);
  const host = creaClient('host', mazzoHost, mazzoOspite);
  const ospite = creaClient('ospite', mazzoOspite, mazzoHost);
  assert.ok(host.ms.player?.eminenceId && host.ms.enemy?.eminenceId, `${armataHost} vs ${armataOspite}: Eminenze dedotte`);
  specchio(host, ospite, 'inizio');

  for (let round = 1; round <= 5; round++) {
    const iniz = round % 2 === 1 ? 'player' : 'enemy'; // dal punto di vista dell'host
    host.ms = openEminenceRound(host.ms, { roundNumber: round, initiativeSide: iniz }).matchState;
    ospite.ms = openEminenceRound(ospite.ms, { roundNumber: round, initiativeSide: OPP[iniz] }).matchState;

    for (const [c, altro] of [[host, ospite], [ospite, host]]) {
      if (isEminenceSetupPending(c.ms, 'player')) {
        // Come nel gioco: si inviano i params confermati (il motore li svuota dopo il reveal).
        const key = Object.keys(getEminence(c.ms.player.eminenceId)?.static?.setupParamsSchema || {})[0] || 'cardId';
        const params = { [key]: c.manoAvv.find((id) => !c.usateAvv.includes(id)) };
        const r = commitEminenceSetupChoice(c.ms, 'player', params);
        assert.ok(r.ok);
        c.ms = r.matchState;
        invia(c, altro, setupMessage(params));
      }
    }
    ricevi(host, iniz); ricevi(ospite, OPP[iniz]);

    scegliAbilita(host, rng, round, ospite);
    scegliAbilita(ospite, rng, round, host);
    ricevi(host, iniz); ricevi(ospite, OPP[iniz]);
    specchio(host, ospite, `round ${round}: scelte`);

    // Agenti (come peer_move): ognuno sceglie il suo, poi lo scambiano.
    const mioH = host.mano.find((id) => !host.usate.includes(id));
    const mioO = ospite.mano.find((id) => !ospite.usate.includes(id));
    let agentiH = null;
    let agentiO = null;
    for (let passo = 0; passo < 30; passo++) {
      if (passo === 4) { agentiH = { player: mioH, enemy: mioO }; agentiO = { player: mioO, enemy: mioH }; }
      const a = avanzaGate(host, ospite, rng, round, iniz, agentiH);
      ricevi(ospite, OPP[iniz]);
      const b = avanzaGate(ospite, host, rng, round, OPP[iniz], agentiO);
      ricevi(host, iniz);
      if (a === 'fatto' && b === 'fatto') break;
    }
    assert.equal(getNextGate(host.ms.gateProgress), null, `round ${round}: l'host ha aperto tutti i gate`);
    specchio(host, ospite, `round ${round}: dopo i gate`);

    const ph = prepareEminenceDuel(host.ms, { initiativeSide: iniz, agentIdBySide: agentiH, paramContext: contesto(host, agentiH), remoteEnemy: true });
    const po = prepareEminenceDuel(ospite.ms, { initiativeSide: OPP[iniz], agentIdBySide: agentiO, paramContext: contesto(ospite, agentiO), remoteEnemy: true });
    assert.equal(ph.blocked, null, `round ${round}: host bloccato (${ph.blocked})`);
    assert.equal(po.blocked, null, `round ${round}: ospite bloccato (${po.blocked})`);
    host.ms = ph.matchState; ospite.ms = po.matchState;
    specchio(host, ospite, `round ${round}: preparazione duello`);

    const vinceHost = rng() < 0.5;
    host.ms = settleEminenceRound(host.ms, { initiativeSide: iniz, winner: vinceHost ? 'player' : 'enemy', agentIdBySide: agentiH }).matchState;
    ospite.ms = settleEminenceRound(ospite.ms, { initiativeSide: OPP[iniz], winner: vinceHost ? 'enemy' : 'player', agentIdBySide: agentiO }).matchState;
    specchio(host, ospite, `round ${round}: fine round`);

    host.usate.push(mioH); host.usateAvv.push(mioO);
    ospite.usate.push(mioO); ospite.usateAvv.push(mioH);
  }
}

test('flipSides scambia solo i campi *Side', () => {
  assert.deepEqual(
    flipSides({ cardId: 5, targetSide: 'player', inner: { ownerSide: 'enemy', side: 'player' }, pronostico: 'VITTORIA_PROPRIA' }),
    { cardId: 5, targetSide: 'enemy', inner: { ownerSide: 'player', side: 'enemy' }, pronostico: 'VITTORIA_PROPRIA' },
  );
});

const ARMATE = Object.keys(ARMY_DECKS);
test('Duello online con Eminenze: i due client restano speculari (ogni armata contro le altre)', () => {
  let partite = 0;
  for (let i = 0; i < ARMATE.length; i++) {
    for (const passo of [1, 5]) {
      const j = (i + passo) % ARMATE.length;
      for (const seme of [1, 2, 3]) {
        partita(ARMATE[i], ARMATE[j], seme * 1000 + i * 31 + j);
        partite++;
      }
    }
  }
  assert.ok(partite >= 60);
});

test('Calibri senza abilità legali (Fermo Macchine rincarata, Presenza 0): il round non si blocca', async () => {
  const { mustChooseThisRound, areSelectionsComplete } = await import('./eminenceRound.js');
  const base = createMatchEminenceState({
    format: EMINENCE_FORMAT.REQUIRED, playerDeck: mazzo('Calibri Pesanti'), enemyDeck: mazzo('Kethran'),
  }).matchState;
  let ms = openEminenceRound(base, { roundNumber: 2, initiativeSide: 'player' }).matchState;
  assert.equal(ms.player.eminenceId, 'calibri_quattro_fronti');
  ms = {
    ...ms,
    player: {
      ...ms.player,
      presence: 0,
      selectionCheckpointPresence: 0,
      persistent: { ...ms.player.persistent, abilityPresenceDeltas: { calibri_fermo_macchine: -2 } },
    },
  };
  assert.equal(mustChooseThisRound(ms, 'player'), false);
  const kethran = selectEminenceAbility(ms, 'enemy', getLegalAbilityIds(ms.enemy.eminenceId, ms.enemy.selectionCheckpointPresence, ms.enemy.persistent)[0]);
  assert.ok(kethran.ok);
  assert.equal(areSelectionsComplete(kethran.matchState), true);
});
