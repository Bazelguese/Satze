// ============================================
// HUB CAMPAGNA — ATTO I
// Componenti del design system (pacchetto 2, convertiti in
// src/components/campaign/atto1/) montati sullo stato reale della run:
// CampaignMapShell (HUD + mappa + pannello missione), EventModal,
// RewardScreen per l'esito. La gestione mazzo resta un overlay dedicato.
// ============================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ACT } from '../../campaign/data/atto1.js';
import {
  NASCENTE_ID,
  campaignReducer,
  deckTotalLeague,
  isDeckLeagueValid,
  poolCardById,
  validateDeck,
  previewEventChoiceLeague,
  DECK_MAX_CARDS,
  DECK_MAX_LEAGUE,
} from '../../campaign/state/campaignState.js';
import {
  loadCampaignRun,
  saveCampaignRun,
  initializeCampaignRun,
  clearCampaignRun,
} from '../../campaign/state/persistence.js';
import { getMissionForNode, OBJECTIVE_LABELS } from '../../campaign/logic/missionAdapter.js';
import { lega, stadioVisivo, assembleNascenteCard } from '../../campaign/logic/nascente.js';
import { CAMPAIGN_UI, CAMPAIGN_FONTS } from '../../campaign/campaignTheme.js';
import { getNascenteStageImageUrl, nascenteStageFromLeague } from '../../data/images.js';

import CampaignMapShell from './atto1/CampaignMapShell.jsx';
import EventModal from './atto1/EventModal.jsx';
import RewardScreen from './atto1/RewardScreen.jsx';
import EvolutionPanel, { ProtagonistStagePreview } from './atto1/EvolutionPanel.jsx';

import '../../styles/campaign/colors_and_type.css';
import '../../styles/campaign/atto1-components.css';

const STADI_NASCENTE = ['L2 — Arco', 'L3 — Spada', 'L4 — Spadone', 'L5 — Alato'];

// Silhouette della mappa per tipo di nodo dell'Atto I
const NODE_VIEW_TYPES = {
  n_prologo: 'bridgehead',
  n_enclave_a: 'enclave',
  n_enclave_b: 'enclave',
  n_enclave_c: 'enclave',
  n_roccaforte: 'strategic',
  n_faro: 'stronghold',
};

// Chiave-fazione dei componenti per ogni armata nemica
const ARMY_KEYS = {
  "Figli dell'Orizzonte": 'orizzonte',
  Kethran: 'kethran',
  'Corte Rossa': 'corte',
  'Calibri Pesanti': 'calibri',
  'Ratti della Megera': 'ratti',
  "L'Enclave delle Scaglie": 'orathai',
  Khemet: 'khemet',
  Mounthborn: 'mounthborn',
};

const btnStyle = (accent, filled = false) => ({
  fontFamily: CAMPAIGN_FONTS.ui,
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: '0.06em',
  padding: '10px 18px',
  cursor: 'pointer',
  border: `1px solid ${accent}60`,
  background: filled ? `${accent}22` : 'transparent',
  color: accent,
  textTransform: 'uppercase',
});

function cardLabel(id, nascente) {
  if (id === NASCENTE_ID) {
    const card = assembleNascenteCard(nascente);
    return { name: card.name, league: card.league, meta: card.description || 'Nudo (nessun potere)', nascente: true };
  }
  const c = poolCardById(id);
  return c
    ? { name: c.name, league: c.league, meta: c.description || '', nascente: false }
    : { name: `Carta ${id}`, league: 0, meta: '', nascente: false };
}

/** Stato Faglia derivato dai giorni al Collasso. */
function riftStateFor(daysLeft) {
  if (daysLeft <= 1) return 'critical';
  if (daysLeft === 2) return 'grave';
  return 'active';
}

/**
 * @param {{
 *   campaignSaveSlot: number,
 *   onStartMission: (mission: Object, run: Object) => void,
 *   onBack: () => void,
 * }} props
 */
export function CampaignAtto1Hub({ campaignSaveSlot = 0, onStartMission, onBack, compact = false }) {
  const [run, setRun] = useState(() => {
    const loaded = loadCampaignRun(campaignSaveSlot, ACT);
    return loaded || initializeCampaignRun(ACT, campaignSaveSlot);
  });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showDeck, setShowDeck] = useState(false);
  const [showNascente, setShowNascente] = useState(false);
  const [draftDeck, setDraftDeck] = useState(null);
  const [evoSel, setEvoSel] = useState(-1);
  const [error, setError] = useState(null);

  const dispatch = useCallback(
    (action) => {
      try {
        setError(null);
        const next = campaignReducer(run, action, ACT);
        saveCampaignRun(next, campaignSaveSlot);
        setRun(next);
        return next;
      } catch (e) {
        setError(e.message);
        return null;
      }
    },
    [run, campaignSaveSlot]
  );

  const selectedMission = useMemo(
    () => (selectedNodeId ? getMissionForNode(ACT, run, selectedNodeId) : null),
    [selectedNodeId, run]
  );

  const league = deckTotalLeague(run.deck, run.nascente);
  const leagueOk = isDeckLeagueValid(run);
  const pendingEventId = run.pendingEvents[0] ?? null;
  const pendingEvent = pendingEventId ? (ACT.events || []).find((e) => e.id === pendingEventId) : null;
  // Gli eventi che plasmano il Nascente passano dal pannello Evoluzione
  const isEvolutionEvent = !!pendingEvent?.choices?.some((ch) => ch.effect?.nascente);

  useEffect(() => setEvoSel(-1), [pendingEventId]);

  const startSelectedMission = useCallback(() => {
    if (!selectedMission) return;
    const next = dispatch({ type: 'START_MISSION', nodeId: selectedMission.node });
    if (next) onStartMission(selectedMission, next);
  }, [selectedMission, dispatch, onStartMission]);

  const nascenteInfo = useMemo(() => {
    const card = assembleNascenteCard(run.nascente);
    return {
      league: lega(run.nascente),
      stadio: STADI_NASCENTE[stadioVisivo(run.nascente)] ?? STADI_NASCENTE[0],
      power: run.nascente.power,
      damage: run.nascente.damage,
      description: card.description,
    };
  }, [run.nascente]);

  // ---------- mappa: nodi, archi, HUD ----------

  const counterattacked = useMemo(
    () => new Set((run.flags.contrattacchi || []).map((c) => c.node)),
    [run.flags.contrattacchi]
  );

  const positions = ACT.mapPositions || [];

  const links = useMemo(() => {
    const out = [];
    for (const n of ACT.nodes) {
      for (const u of n.unlocks || []) out.push([n.id, u]);
    }
    return out;
  }, []);

  const mapNodes = useMemo(() => {
    const out = {};
    for (const n of ACT.nodes) {
      if (n.type === 'faglia') {
        const faglia = run.faglie.find((f) => f.nodeId === n.id);
        if (!faglia) {
          out[n.id] = { kind: 'riftSlot', state: 'hidden' };
          continue;
        }
        const tpl = (ACT.faglie?.missionTemplates || [])[faglia.templateIndex] || {};
        const daysLeft = Math.max(0, faglia.closesDay - run.day);
        out[n.id] = {
          kind: 'rift',
          riftType: 'incursion',
          state: riftStateFor(daysLeft),
          army: ARMY_KEYS[tpl.army] || 'kethran',
          title: tpl.title?.replace(/^Faglia: /, '') || n.title,
          days: daysLeft,
        };
        continue;
      }
      const runState = run.nodes[n.id];
      const mission = (ACT.missions || []).find((m) => m.node === n.id);
      const isRiconquista = counterattacked.has(n.id) && runState === 'available';
      out[n.id] = {
        kind: 'node',
        type: NODE_VIEW_TYPES[n.id] || 'enclave',
        state: isRiconquista ? 'threatened' : runState,
        title: n.title,
        subtitle: n.type === 'boss' ? 'Missione finale' : '',
        difficulty: mission ? (n.type === 'boss' ? 5 : mission.fields >= 5 ? 4 : 2) : 0,
        mode: mission ? (mission.objective === 'annientamento' ? 'annihilation' : 'domination') : 'none',
        mission: runState === 'available',
        mainPath: n.id === 'n_roccaforte' || n.id === 'n_faro',
      };
    }
    return out;
  }, [run.nodes, run.faglie, run.day, counterattacked]);

  const hudProps = useMemo(() => {
    // Contrattacco programmato in arrivo → Testa di ponte "minacciata"
    const nextAttack = (ACT.contrattacchi || []).find(
      (c) => c.day > run.day && c.targets.some((t) => run.nodes[t] === 'completed')
    );
    const worstFaglia = run.faglie.reduce(
      (worst, f) => Math.min(worst, f.closesDay - run.day),
      Infinity
    );
    const modifiers = [];
    if (!leagueOk) {
      modifiers.push({ short: 'Lega oltre cap', value: DECK_MAX_LEAGUE - league, days: 0, tip: `Mazzo a Lega ${league}/${DECK_MAX_LEAGUE}: aggiustalo prima della prossima missione` });
    }
    if (run.flags.faglie_collassate) {
      modifiers.push({ short: 'Faglie collassate', value: -run.flags.faglie_collassate, days: 0, tip: 'Ogni collasso è costato una carta del magazzino' });
    }
    return {
      showActTitle: true,
      day: run.day,
      maxDays: run.daysLimit,
      bridgeheadStatus: nextAttack && nextAttack.day - run.day <= 2 ? 'threatened' : 'stable',
      daysToBridgeheadAttack: nextAttack ? nextAttack.day - run.day : 0,
      pvEff: 25, pvBase: 25, pvCap: 25,
      fcEff: 10, fcBase: 10, fcCap: 10,
      army: run.deck.length,
      armyCap: DECK_MAX_CARDS,
      rifts: run.faglie.length,
      riftsMax: ACT.maxActiveFaglie ?? 2,
      mostCriticalRiftState: run.faglie.length ? riftStateFor(worstFaglia) : 'none',
      mostCriticalRiftDays: run.faglie.length ? Math.max(0, worstFaglia) : 0,
      modifiers,
      onOpenArmy: () => setShowDeck(true),
      onOpenRifts: () => {
        const f = run.faglie[0];
        if (f) setSelectedNodeId(f.nodeId);
      },
    };
  }, [run, league, leagueOk]);

  // ---------- pannello missione ----------

  const missionPanelProps = useMemo(() => {
    if (!selectedMission) return null;
    const m = selectedMission;
    const node = ACT.nodes.find((n) => n.id === m.node);
    const isRiconquista = counterattacked.has(m.node) && run.nodes[m.node] === 'available';
    const state = !leagueOk
      ? 'bloccata'
      : m.boss ? 'finale' : m.isFaglia ? 'faglia' : isRiconquista ? 'riconquista' : 'selezionata';
    const rewards = (m.rewards?.warehouseCards || []).map((id) => {
      const c = poolCardById(id);
      return c ? `${c.name} (L${c.league}) al magazzino` : `Carta ${id} al magazzino`;
    });
    if (!rewards.length) rewards.push(m.boss ? "Il Faro: l'Atto I si conclude" : 'Avanzata del fronte');
    const rules = [
      m.briefing || '',
      m.objective === 'annientamento' ? `Vittoria solo ad Annientamento: PV nemici ${m.enemy.life ?? 25}.` : '',
      m.boss?.phaseShiftAfterFieldsLost != null
        ? `Regola del boss: la carta firma è rivelata; il duello cambia volto dopo ${m.boss.phaseShiftAfterFieldsLost} campi persi.`
        : '',
    ].filter(Boolean).join(' ');
    return {
      state,
      title: m.title,
      subtitle: `${OBJECTIVE_LABELS[m.objective] ?? m.objective} · ${m.enemy.deck.length} carte nemiche`,
      nodeType: m.isFaglia ? 'rift' : NODE_VIEW_TYPES[m.node] || 'enclave',
      faction: ARMY_KEYS[m.enemy.army] || 'corte',
      factionName: m.enemy.army,
      mode: m.objective === 'annientamento' ? 'annihilation' : 'domination',
      difficulty: node?.type === 'boss' ? 5 : m.fields >= 5 ? 4 : 2,
      days: 1,
      rules,
      rewards,
      defeat: 'Il nodo resta nemico · passa 1 giorno.',
      ignored: m.isFaglia
        ? `La Faglia collassa al giorno ${m.closesDay} · perdi una carta dal magazzino.`
        : 'Il fronte non avanza · il tempo passa.',
      pvMod: 0,
      fcMod: 0,
      prereqs: [
        { label: `Mazzo ${run.deck.length}/${DECK_MAX_CARDS} · Lega ${league}/${DECK_MAX_LEAGUE}`, met: leagueOk },
      ],
      onEngage: startSelectedMission,
      onBack: () => setSelectedNodeId(null),
    };
  }, [selectedMission, counterattacked, run.nodes, run.deck.length, league, leagueOk, startSelectedMission]);

  // ---------- evento ----------

  const eventModalProps = useMemo(() => {
    if (!pendingEvent || isEvolutionEvent) return null;
    const choices = pendingEvent.choices.map((ch) => {
      // Conseguenze mostrate PRIMA della conferma: salto di Lega del Nascente
      // e eventuale sforamento del cap mazzo (30).
      const preview = previewEventChoiceLeague(run, ch.effect);
      const leagueJump = preview.nascenteLeague !== lega(run.nascente);
      const effects = [];
      if (ch.effect?.nascente) effects.push({ text: 'Il Nascente cambia', kind: 'perm', tip: 'Modifica permanente del Nascente' });
      if (ch.effect?.warehouseCards?.length) effects.push({ text: `+${ch.effect.warehouseCards.length} carta al magazzino`, kind: 'pos' });
      if (leagueJump) effects.push({ text: `Nascente → Lega ${preview.nascenteLeague} · mazzo ${preview.league}/${DECK_MAX_LEAGUE}`, kind: preview.leagueOk ? 'perm' : 'neg', tip: 'Il valore del Nascente cresce e pesa sulla Lega del mazzo' });
      if (!preview.leagueOk) effects.push({ text: 'Mazzo oltre il cap: aggiustalo prima della prossima missione', kind: 'neg' });
      if (!effects.length) effects.push({ text: 'Nessun effetto sul Nascente', kind: 'hidden', tip: 'Scelta narrativa' });
      return {
        label: ch.label,
        description: ch.description || '',
        effects,
        irreversible: !!ch.effect?.nascente,
      };
    });
    return {
      kind: pendingEvent.id === 'EV_impronta' ? 'incontro' : pendingEvent.trigger?.type === 'day' ? 'minaccia' : 'dilemma',
      title: pendingEvent.title,
      day: run.day,
      place: ACT.title,
      body: pendingEvent.body || '',
      choices,
      onChoose: (i) => dispatch({ type: 'APPLY_EVENT_CHOICE', eventId: pendingEvent.id, choiceIndex: i }),
    };
  }, [pendingEvent, isEvolutionEvent, run, dispatch]);

  // ---------- evoluzione del Nascente (eventi che lo plasmano) ----------

  const evolutionProps = useMemo(() => {
    if (!pendingEvent || !isEvolutionEvent) return null;
    const fromCard = assembleNascenteCard(run.nascente);
    const fromLega = lega(run.nascente);
    // Stadio narrativo: 1 + eventi del Nascente già risolti in questa run
    const applied = (run.eventsSeen || []).filter(
      (id) =>
        !run.pendingEvents.includes(id) &&
        (ACT.events || []).find((e) => e.id === id)?.choices?.some((ch) => ch.effect?.nascente)
    ).length;
    const fromStage = Math.min(1 + applied, 5);
    const previews = pendingEvent.choices.map((ch) => previewEventChoiceLeague(run, ch.effect));
    const glyphFor = (ch) =>
      ch.effect?.nascente?.acquire ? '✶' : ch.effect?.nascente?.upgrade ? '▲' : ch.effect?.nascente?.stats ? '⛨' : '◇';
    const choices = pendingEvent.choices.map((ch, i) => {
      const p = previews[i];
      const changes = !!ch.effect?.nascente;
      return {
        label: ch.label,
        league: changes ? `Lega ${p.nascenteLeague}` : 'Nessuna evoluzione',
        glyph: glyphFor(ch),
        accent: changes ? '#a78bfa' : '#e6c778',
        potFrom: run.nascente.power,
        potTo: p.nascente.power,
        danFrom: run.nascente.damage,
        danTo: p.nascente.damage,
        power: changes
          ? assembleNascenteCard(p.nascente).description || 'Nudo (nessun potere)'
          : ch.description || "Il Nascente resta com'è.",
        note: !p.leagueOk
          ? `Mazzo a Lega ${p.league}/${DECK_MAX_LEAGUE}: da aggiustare prima della prossima missione`
          : changes
            ? 'Scelta irreversibile'
            : ch.description || '',
      };
    });
    const selPreview = evoSel >= 0 ? previews[evoSel] : null;
    const selCard = selPreview ? assembleNascenteCard(selPreview.nascente) : null;
    return {
      eyebrow: `Giorno ${run.day} · ${ACT.title}`,
      title: pendingEvent.title,
      subtitle: pendingEvent.body || '',
      fromStage,
      toStage: Math.min(fromStage + 1, 5),
      fromName: fromCard.name,
      fromLeague: `Lega ${fromLega}`,
      fromLevel: fromLega,
      fromPot: run.nascente.power,
      fromDan: run.nascente.damage,
      fromPower: fromCard.description || 'Nudo (nessun potere)',
      fromImageSrc: getNascenteStageImageUrl(nascenteStageFromLeague(fromLega)),
      toName: selCard ? selCard.name : fromCard.name,
      toLeague: selPreview ? `Lega ${selPreview.nascenteLeague}` : '—',
      toLevel: selPreview ? selPreview.nascenteLeague : fromLega,
      toPot: selPreview ? selPreview.nascente.power : run.nascente.power,
      toDan: selPreview ? selPreview.nascente.damage : run.nascente.damage,
      toPower: selCard ? selCard.description || 'Nudo (nessun potere)' : 'Definito dalla scelta.',
      toImageSrc: getNascenteStageImageUrl(
        nascenteStageFromLeague(selPreview ? selPreview.nascenteLeague : fromLega)
      ),
      choices,
      selected: evoSel,
      onSelect: setEvoSel,
      confirmLabel: "Incidi l'evoluzione",
      note: 'La scelta è permanente.',
      onConfirm: () => {
        if (evoSel < 0) return;
        dispatch({ type: 'APPLY_EVENT_CHOICE', eventId: pendingEvent.id, choiceIndex: evoSel });
      },
    };
  }, [pendingEvent, isEvolutionEvent, run, evoSel, dispatch]);

  // ---------- esito run ----------

  const renderOutcome = () => {
    const won = run.outcome === 'won';
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(4,2,8,0.92)', zIndex: 300 }}>
        <div style={{ width: 720, maxWidth: '94vw' }}>
          <RewardScreen
            variant={won ? 'riepilogo' : 'risorse'}
            eyebrow={won ? `Vittoria · Giorno ${run.day}` : `Tempo scaduto · Giorno ${run.daysLimit}`}
            title={won ? 'IL FARO È NOSTRO' : 'TEMPO SCADUTO'}
            subtitle={won
              ? `L'Atto I si chiude al giorno ${run.day}. Il Nascente ha raggiunto lo stadio ${nascenteInfo.stadio}.`
              : `Il giorno ${run.daysLimit} è passato e il Faro resta lontano. La run si chiude qui.`}
            requireSelection={false}
            note={won ? 'La Frattura si è richiusa dietro di te.' : 'Le sconfitte insegnano: la prossima run parte più consapevole.'}
            confirmLabel="Nuova run"
            skipLabel="Menu principale"
            onConfirm={() => {
              clearCampaignRun(campaignSaveSlot);
              setRun(initializeCampaignRun(ACT, campaignSaveSlot));
              setSelectedNodeId(null);
            }}
            onSkip={onBack}
          />
        </div>
      </div>
    );
  };

  // ---------- scheda Nascente (stadio visivo corrente) ----------

  const renderNascente = () => {
    const card = assembleNascenteCard(run.nascente);
    const l = lega(run.nascente);
    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ background: 'rgba(4,2,8,0.88)', zIndex: 240 }}
        onClick={() => setShowNascente(false)}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <ProtagonistStagePreview
            state="current"
            stageNum={stadioVisivo(run.nascente) + 1}
            name={card.name}
            league={`Lega ${l} · ${nascenteInfo.stadio}`}
            level={l}
            pot={run.nascente.power}
            dan={run.nascente.damage}
            power={card.description || 'Nudo (nessun potere)'}
            imageSrc={getNascenteStageImageUrl(stadioVisivo(run.nascente))}
          />
          <button type="button" style={btnStyle(CAMPAIGN_UI.textMuted)} onClick={() => setShowNascente(false)}>
            Chiudi
          </button>
        </div>
      </div>
    );
  };

  // ---------- gestione mazzo (overlay funzionale) ----------

  const renderDeckPanel = () => {
    const deck = draftDeck ?? run.deck;
    const pool = [...run.deck, ...run.warehouse].filter((id) => id !== NASCENTE_ID);
    const inDeck = new Set(deck);
    const draftLeague = deckTotalLeague(deck, run.nascente);
    const check = validateDeck(deck, run.nascente);
    const dirty = draftDeck != null && JSON.stringify(draftDeck) !== JSON.stringify(run.deck);

    const toggle = (id) => {
      const base = draftDeck ?? [...run.deck];
      if (base.includes(id)) setDraftDeck(base.filter((x) => x !== id));
      else if (base.length < DECK_MAX_CARDS) setDraftDeck([...base, id]);
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(4,2,8,0.88)', zIndex: 200 }}>
        <div
          style={{
            maxWidth: 860,
            width: '100%',
            maxHeight: '86vh',
            overflowY: 'auto',
            padding: 28,
            border: '1.5px solid #a78bfa',
            boxShadow: '0 0 34px rgba(167,139,250,.3),inset 0 0 60px rgba(0,0,0,.55)',
            background: 'linear-gradient(176deg,#17141c,#0a0810 72%)',
            clipPath: 'polygon(0 14px,14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px))',
            fontFamily: CAMPAIGN_FONTS.ui,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: CAMPAIGN_UI.textPri, fontFamily: 'var(--font-display)', letterSpacing: '.04em' }}>Gestione mazzo</div>
            <div style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 13, color: check.ok ? CAMPAIGN_UI.greenLit : CAMPAIGN_UI.redLit }}>
              {deck.length}/{DECK_MAX_CARDS} carte · Lega {draftLeague}/{DECK_MAX_LEAGUE}
            </div>
          </div>
          {/* Barra validazione: non si nasconde mai */}
          <div
            style={{
              padding: '6px 10px',
              marginBottom: 14,
              fontSize: 12,
              fontFamily: CAMPAIGN_FONTS.mono,
              background: check.ok ? `${CAMPAIGN_UI.greenLit}14` : `${CAMPAIGN_UI.redLit}18`,
              color: check.ok ? CAMPAIGN_UI.greenLit : CAMPAIGN_UI.redLit,
            }}
          >
            {check.ok ? '✓ mazzo valido' : `✕ ${check.errors.join(' · ')}`}
          </div>

          <div style={{ fontSize: 11, letterSpacing: '0.14em', color: CAMPAIGN_UI.textMuted, marginBottom: 8 }}>MAZZO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            {deck.map((id) => {
              const c = cardLabel(id, run.nascente);
              return (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    border: `1px solid ${c.nascente ? CAMPAIGN_UI.violetLit : CAMPAIGN_UI.border}66`,
                    borderLeft: `3px solid ${c.nascente ? CAMPAIGN_UI.violetLit : `${CAMPAIGN_UI.border}66`}`,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: CAMPAIGN_UI.textPri, fontSize: 13, fontWeight: 600 }}>
                      {c.name}
                      {c.nascente && <span style={{ color: CAMPAIGN_UI.violetLit, fontSize: 10, marginLeft: 8 }}>NASCENTE · NON RIMOVIBILE</span>}
                    </span>
                    <div style={{ fontSize: 11, color: CAMPAIGN_UI.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.meta}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 12, color: CAMPAIGN_UI.amberLit }}>L{c.league}</span>
                    {!c.nascente && (
                      <button type="button" style={btnStyle(CAMPAIGN_UI.redLit)} onClick={() => toggle(id)}>−</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 11, letterSpacing: '0.14em', color: CAMPAIGN_UI.textMuted, marginBottom: 8 }}>
            MAGAZZINO ({pool.filter((id) => !inDeck.has(id)).length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {pool.filter((id) => !inDeck.has(id)).map((id) => {
              const c = cardLabel(id, run.nascente);
              return (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    border: `1px dashed ${CAMPAIGN_UI.border}55`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: CAMPAIGN_UI.textSec, fontSize: 13 }}>{c.name}</span>
                    <div style={{ fontSize: 11, color: CAMPAIGN_UI.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.meta}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontFamily: CAMPAIGN_FONTS.mono, fontSize: 12, color: CAMPAIGN_UI.amberLit }}>L{c.league}</span>
                    <button
                      type="button"
                      style={btnStyle(CAMPAIGN_UI.greenLit)}
                      disabled={deck.length >= DECK_MAX_CARDS}
                      onClick={() => toggle(id)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
            {pool.filter((id) => !inDeck.has(id)).length === 0 && (
              <p style={{ fontSize: 12, color: CAMPAIGN_UI.textMuted }}>Magazzino vuoto.</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              style={btnStyle(CAMPAIGN_UI.textMuted)}
              onClick={() => {
                setDraftDeck(null);
                setShowDeck(false);
              }}
            >
              Chiudi
            </button>
            <button type="button" style={btnStyle(CAMPAIGN_UI.textMuted)} onClick={() => setDraftDeck(null)} disabled={!dirty}>
              Ripristina
            </button>
            <button
              type="button"
              style={btnStyle(CAMPAIGN_UI.greenLit, true)}
              disabled={!dirty || !check.ok}
              onClick={() => {
                const next = dispatch({ type: 'SET_DECK', deck });
                if (next) setDraftDeck(null);
              }}
            >
              Conferma mazzo
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------- render ----------

  const tools = [
    { glyph: '⛨', label: 'Mazzo', tip: `Gestisci mazzo e magazzino — Lega ${league}/${DECK_MAX_LEAGUE}`, onClick: () => setShowDeck(true) },
    { glyph: '✶', label: 'Nascente', tip: `${nascenteInfo.stadio} · ${nascenteInfo.power} POT / ${nascenteInfo.damage} DAN\n${nascenteInfo.description || 'Nudo (nessun potere)'}`, onClick: () => setShowNascente(true) },
    { glyph: '⏭', label: 'Fine giorno', tip: 'Passa il giorno senza missione: le Faglie avanzano', onClick: () => dispatch({ type: 'END_DAY' }) },
    { glyph: '↩', label: 'Menu', tip: 'Torna al menu principale (la run è salvata)', onClick: onBack },
  ];

  return (
    <div className="w-full h-full min-h-full overflow-hidden flex flex-col" style={{ minHeight: '100%', position: 'relative' }}>
      {error && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 260, padding: '8px 20px', background: 'rgba(194,71,63,.18)', borderBottom: '1px solid #c2473f', color: '#e88f88', fontSize: 12, fontFamily: CAMPAIGN_FONTS.mono }}>
          {error}
        </div>
      )}

      <CampaignMapShell
        compact={compact}
        hud={hudProps}
        positions={positions}
        links={links}
        nodes={mapNodes}
        selectedId={selectedNodeId}
        onSelectNode={(id) => {
          const state = run.nodes[id];
          const isFaglia = run.faglie.some((f) => f.nodeId === id);
          if (state === 'available' || isFaglia) setSelectedNodeId(id);
        }}
        panel={missionPanelProps}
        showPanel={!!missionPanelProps}
        tools={tools}
        viewLabel={`Giorno ${run.day}/${run.daysLimit} · Nascente ${nascenteInfo.stadio}`}
        logText={leagueOk ? '' : `Mazzo a Lega ${league}/${DECK_MAX_LEAGUE}: aggiustalo prima di partire.`}
      />

      {showDeck && renderDeckPanel()}
      {showNascente && !showDeck && renderNascente()}
      {pendingEvent && !showDeck && eventModalProps && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(4,2,8,0.88)', zIndex: 250 }}>
          <EventModal {...eventModalProps} />
        </div>
      )}
      {pendingEvent && !showDeck && evolutionProps && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(4,2,8,0.88)', zIndex: 250 }}>
          <div style={{ width: 1060, maxWidth: '96vw', maxHeight: '92vh', overflowY: 'auto' }}>
            <EvolutionPanel {...evolutionProps} />
          </div>
        </div>
      )}
      {run.outcome && renderOutcome()}
    </div>
  );
}
