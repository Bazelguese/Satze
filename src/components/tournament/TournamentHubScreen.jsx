// ============================================================
// TournamentHubScreen.jsx — tabellone del torneo
// ============================================================
// Stesso linguaggio della scelta armata / esercito e di "Imposta la
// partita": lastre inclinate, Chakra Petch corsivo, ombre piene,
// barra chiara in basso. Canvas di gioco 1920×1080.
//
// Ogni partecipante compare con il nome del suo esercito e con il colore
// dell'esercito (per un bi-armata è la fusione delle due armate, la
// stessa usata sul tavolo). Si seleziona un incontro per agire: giocare
// il proprio, guardare una serie tra IA sul tavolo, leggerne il riepilogo
// a turni, oppure concludere il turno senza guardare.
// Tastiera: Invio azione principale, Esc indietro.
//
// Movimento (solo trasformazioni e opacità, niente filtri animati):
//  - ingresso a cascata di testata, colonne, incontri e barra;
//  - linee del tabellone che si disegnano e prendono il colore di chi passa;
//  - risultati nuovi che "timbrano" la riga del vincitore e fanno arrivare
//    l'esercito nel turno dopo, anche tornando da una partita;
//  - la serie che le IA stanno giocando è percorsa da una scansione.
// ============================================================

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLeaveThen } from '../../hooks/usePresence';
import { ARMY_COLORS, ARMY_ICONS } from '../../data/armies.js';
import { playUiClick } from '../../audio/soundBus';
import { getDeckVisualMeta } from '../../utils/deckManager';
import {
  ROUND_NAMES,
  describeHumanMatch,
  getPendingAiMatches,
  getTournamentStatus,
} from '../../game/tournament/tournamentLogic.js';
import { getTournamentField, hasGameLog, resolveTournamentCards } from '../../game/tournament/tournamentSetup.js';

const DEFAULT_ACCENT = '#a288fb';

const HAND_RULE_TEXT = {
  draw: 'Peschi 5 carte a caso dal tuo esercito.',
  remainder: 'Giochi le 5 carte rimaste fuori dalla partita 1.',
  reshuffle: 'Spareggio: esercito rimischiato, 5 carte a caso.',
};

const HAND_RULE_SHORT = ['5 carte a caso', 'Le 5 carte rimaste', 'Spareggio rimischiato'];
const REASON_TEXT = { fields: 'per Conquista', hp: 'per Punti Vita', draw: '' };

/**
 * Ultimo stato del tabellone mostrato in questa sessione, per riconoscere i risultati
 * nuovi anche quando la schermata viene rimontata (ritorno da una partita).
 */
const seenBoard = { key: null, matches: new Map() };

function boardKey(tournament) {
  return tournament.rounds[0].map((m) => `${m.a}-${m.b}`).join('|');
}

/**
 * Novità rispetto all'ultima volta: incontri appena decisi e posti appena assegnati.
 * Restano marcati finché la schermata è montata, così l'animazione non viene troncata.
 */
function useBoardNews(tournament) {
  const newsRef = useRef({ decided: new Map(), arrived: new Map() });
  const key = boardKey(tournament);
  if (seenBoard.key !== key) {
    seenBoard.key = key;
    seenBoard.matches = new Map();
    newsRef.current = { decided: new Map(), arrived: new Map() };
  } else {
    const news = newsRef.current;
    for (const m of tournament.rounds.flat()) {
      const prev = seenBoard.matches.get(m.id);
      if (!prev) continue;
      if (m.winnerId && !prev.winnerId && !news.decided.has(m.id)) news.decided.set(m.id, news.decided.size);
      for (const side of ['a', 'b']) {
        const slot = `${m.id}:${side}`;
        if (m[side] && !prev[side] && !news.arrived.has(slot)) news.arrived.set(slot, news.arrived.size);
      }
    }
  }
  useEffect(() => {
    for (const m of tournament.rounds.flat()) {
      seenBoard.matches.set(m.id, { winnerId: m.winnerId, a: m.a, b: m.b });
    }
  }, [tournament]);
  return newsRef.current;
}

/** Linee tra un turno e il successivo, misurate sulla disposizione reale degli incontri. */
function useConnectors(bracketRef, tournament) {
  const [lines, setLines] = useState([]);
  useLayoutEffect(() => {
    const root = bracketRef.current;
    if (!root) return;
    const box = (id) => {
      const el = root.querySelector(`[data-mid="${id}"]`);
      return el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null;
    };
    const next = [];
    tournament.rounds.slice(0, -1).forEach((round, r) => {
      round.forEach((m, i) => {
        const from = box(m.id);
        const to = box(tournament.rounds[r + 1][Math.floor(i / 2)].id);
        if (!from || !to) return;
        const x1 = from.x + from.w - 4;
        const y1 = from.y + from.h / 2;
        const x2 = to.x + 8;
        const y2 = to.y + to.h * (i % 2 === 0 ? 0.3 : 0.7);
        const xm = (x1 + x2) / 2;
        // gomito inclinato, come le lastre
        next.push({ id: m.id, round: r, winnerId: m.winnerId, d: `M${x1} ${y1} L${xm + 5} ${y1} L${xm - 5} ${y2} L${x2} ${y2}` });
      });
    });
    setLines(next);
  }, [bracketRef, tournament]);
  return lines;
}

/** Colore e armate di ogni esercito iscritto, calcolati sulle sue 10 carte. */
function useParticipantVisuals(tournament) {
  return useMemo(() => {
    const out = {};
    for (const p of Object.values(tournament.participants)) {
      const cards = resolveTournamentCards(p.cardIds);
      const meta = getDeckVisualMeta(cards, { fallbackArmy: p.army, armyColors: ARMY_COLORS, fallbackAccent: DEFAULT_ACCENT });
      out[p.id] = { accent: meta.accent, armies: meta.armies, cards: Object.fromEntries(cards.map((c) => [c.id, c])) };
    }
    return out;
  }, [tournament.participants]);
}

function Side({ participant, visual, wins, state, showScore, fresh = null, order = 0 }) {
  const armies = visual?.armies || [];
  return (
    <div
      className={`trn-side is-${state}${participant ? '' : ' is-empty'}${fresh ? ` is-fresh-${fresh}` : ''}`}
      style={{ '--c': visual?.accent || 'rgba(245,243,235,0.18)', '--d': `${order * 140}ms` }}
      title={participant ? `${participant.deckName} — ${armies.join(' · ') || participant.army}` : undefined}
    >
      <span className="ic">
        {armies.slice(0, 2).map((army) => (ARMY_ICONS[army] ? <img key={army} src={ARMY_ICONS[army]} alt="" /> : null))}
      </span>
      <span className="nm">{participant ? participant.deckName : 'Da definire'}</span>
      {participant?.isHuman ? <span className="you">TU</span> : null}
      {showScore ? <span className="sc">{wins}</span> : null}
    </div>
  );
}

function Match({ match, participants, visuals, current, selected, selectable, watchable, playing, champion, index, news, onSelect }) {
  const a = match.a ? participants[match.a] : null;
  const b = match.b ? participants[match.b] : null;
  const done = Boolean(match.winnerId);
  const started = match.series.games.some((g) => g.winner);
  const stateOf = (id) => (!done || !id ? 'open' : match.winnerId === id ? 'won' : 'lost');
  const showScore = !match.bye && (done || started);
  const cls = `trn-match${current ? ' is-current' : ''}${selected ? ' is-selected' : ''}${match.bye ? ' is-bye' : ''}${selectable ? ' is-selectable' : ''}${playing ? ' is-playing' : ''}${champion ? ' is-champion' : ''}`;
  const decidedOrder = news.decided.get(match.id);
  const freshOf = (side) => {
    if (decidedOrder != null && !match.bye) return match.winnerId === match[side] ? 'win' : 'lose';
    return news.arrived.has(`${match.id}:${side}`) ? 'arrive' : null;
  };
  const orderOf = (side) => decidedOrder ?? news.arrived.get(`${match.id}:${side}`) ?? 0;
  const style = { '--i': index };
  const body = (
    <>
      <Side participant={a} visual={visuals[match.a]} wins={match.series.winsA} state={match.bye ? 'open' : stateOf(match.a)} showScore={showScore} fresh={freshOf('a')} order={orderOf('a')} />
      {match.bye
        ? <div className="trn-bye">PASSA IL TURNO</div>
        : <Side participant={b} visual={visuals[match.b]} wins={match.series.winsB} state={stateOf(match.b)} showScore={showScore} fresh={freshOf('b')} order={orderOf('b')} />}
      {watchable && !playing ? <span className="trn-tag">DA GIOCARE</span> : null}
      {playing ? <span className="trn-tag is-live">IN CORSO</span> : null}
    </>
  );
  if (!selectable) return <div className={cls} data-mid={match.id} style={style}>{body}</div>;
  return (
    <button type="button" className={cls} data-mid={match.id} style={style} aria-pressed={selected} onClick={() => { playUiClick(); onSelect(match.id); }}>
      {body}
    </button>
  );
}

/** Riepilogo a turni di una serie tra IA già giocata. */
function SeriesSummary({ tournament, match, visuals, gameIndex, onGame, onWatch, onClose, closeRef }) {
  const [closing, requestClose] = useLeaveThen(onClose, 240);
  // Esc sul tabellone chiude il riepilogo con la stessa uscita del tasto
  if (closeRef) closeRef.current = requestClose;
  const a = tournament.participants[match.a];
  const b = tournament.participants[match.b];
  const games = match.series.games;
  const game = games[gameIndex];
  const cardName = (side, id) => visuals[match[side]]?.cards[id]?.name || `#${id}`;
  const winnerName = game.winner === 'a' ? a.deckName : game.winner === 'b' ? b.deckName : null;
  return (
    <div className={`trn-sum${closing ? ' is-leaving' : ''}`} onClick={requestClose}>
      <div className="trn-sum-card" role="dialog" aria-modal="true" aria-label="Riepilogo della serie" onClick={(e) => e.stopPropagation()}>
        <div className="trn-sum-sheet">
          <header className="trn-sum-head">
            <span className="trn-sum-eye">{ROUND_NAMES[match.round].toUpperCase()} · RIEPILOGO A TURNI</span>
            <h2>
              <span style={{ color: visuals[match.a].accent }}>{a.deckName}</span>
              <span className="score">{match.series.winsA}–{match.series.winsB}</span>
              <span style={{ color: visuals[match.b].accent }}>{b.deckName}</span>
            </h2>
            <button type="button" className="trn-sum-x" onClick={requestClose} aria-label="Chiudi riepilogo">
              <kbd>ESC</kbd><span>INDIETRO</span>
            </button>
          </header>

          <div className="trn-sum-tabs">
            {games.map((g, i) => (
              <button
                key={i}
                type="button"
                className={`trn-chip${i === gameIndex ? ' sel' : ''}`}
                aria-pressed={i === gameIndex}
                onClick={() => { playUiClick(); onGame(i); }}
              >
                <span className="t">Partita {i + 1}</span>
                <span className="d">{HAND_RULE_SHORT[Math.min(i, 2)]} · {g.winner === 'a' ? a.deckName : g.winner === 'b' ? b.deckName : 'Pareggio'}</span>
              </button>
            ))}
          </div>

          {hasGameLog(game) ? (
            <div className="trn-sum-rows" key={gameIndex}>
              <div className="trn-sum-row is-head">
                <span>TURNO</span><span>CAMPO</span><span>{a.deckName}</span><span>{b.deckName}</span><span>PV</span><span>CAMPI</span>
              </div>
              {game.rounds.map((r, ri) => {
                const field = getTournamentField(game.fields[r.fieldIndex]);
                return (
                  <div key={r.round} className="trn-sum-row" style={{ '--i': ri }}>
                    <span className="n">{String(r.round).padStart(2, '0')}</span>
                    <span className="fld">{field?.name || '—'}{r.conquered ? '' : ' · non conquistato'}</span>
                    {['a', 'b'].map((side) => (
                      <span key={side} className={`ag${r.winner === side ? ' won' : ''}`} style={{ '--c': visuals[match[side]].accent }}>
                        <b>{cardName(side, r[side].cardId)}</b>
                        <i>{r.first === side ? 'APRE · ' : ''}{r[side].focus} FC · VA {r.va[side] ?? '—'}</i>
                      </span>
                    ))}
                    <span className="num">{r.hp.a}–{r.hp.b}</span>
                    <span className="num">{r.fields.a}–{r.fields.b}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="trn-sum-empty">Il registro dei turni non è disponibile per questa partita.</div>
          )}

          <footer className="trn-sum-foot">
            <div className="res">
              <span className="lbl">ESITO</span>
              <span className="txt">{winnerName ? `Vince ${winnerName} ${REASON_TEXT[game.reason] || ''}` : 'Pareggio: la partita non assegna vittorie'}</span>
            </div>
            {hasGameLog(game) ? (
              <button type="button" className="trn-go is-small" onClick={() => { playUiClick(); onWatch(match.id, gameIndex); }}>
                <span>GUARDA AL TAVOLO</span>
              </button>
            ) : null}
          </footer>
        </div>
      </div>
    </div>
  );
}

export function TournamentHubScreen({ tournament, busy = null, onPlay, onWatch, onConcludeRound, onMenu, onAbandon, onNewTournament }) {
  const status = getTournamentStatus(tournament);
  const info = describeHumanMatch(tournament);
  const visuals = useParticipantVisuals(tournament);
  const news = useBoardNews(tournament);
  const bracketRef = useRef(null);
  const lines = useConnectors(bracketRef, tournament);
  const human = tournament.participants[tournament.humanId];
  const champion = tournament.championId ? tournament.participants[tournament.championId] : null;
  const accent = visuals[human.id]?.accent || DEFAULT_ACCENT;
  const pendingAi = getPendingAiMatches(tournament);
  const pendingIds = new Set(pendingAi.map((m) => m.id));
  /** Serie che «Concludi il turno» giocherebbe: quelle del turno più arretrato. */
  const pendingRound = pendingAi.length ? Math.min(...pendingAi.map((m) => m.round)) : null;
  const pendingNow = pendingAi.filter((m) => m.round === pendingRound).length;

  const [selectedId, setSelectedId] = useState(null);
  const [summary, setSummary] = useState(null); // { matchId, gameIndex }
  // Quando cambia l'incontro da giocare (turno concluso, serie finita) la selezione torna lì.
  const humanMatchId = info?.match.id ?? null;
  useEffect(() => { setSelectedId(null); }, [humanMatchId]);
  const allMatches = tournament.rounds.flat();
  const selected = allMatches.find((m) => m.id === (selectedId ?? info?.match.id)) || null;
  const summaryMatch = summary ? allMatches.find((m) => m.id === summary.matchId) : null;

  const nameOf = (id) => tournament.participants[id]?.deckName;
  const isHumanNext = Boolean(selected && info && selected.id === info.match.id);
  const isAiPending = Boolean(selected && pendingIds.has(selected.id));
  const isAiDone = Boolean(selected && selected.winnerId && !selected.bye && selected.series.games.some(hasGameLog));

  let label;
  let headline;
  let hint;
  let primary;
  const secondary = [];
  if (isHumanNext) {
    label = `${info.roundName.toUpperCase()} · SERIE ${info.humanWins}–${info.opponentWins}`;
    headline = `Contro ${info.opponent.deckName}`;
    hint = HAND_RULE_TEXT[info.handRule];
    primary = { label: `${info.resuming ? 'RIPRENDI' : 'GIOCA'} PARTITA ${info.gameNumber}`, run: onPlay };
  } else if (isAiPending) {
    label = `${ROUND_NAMES[selected.round].toUpperCase()} · DA GIOCARE`;
    headline = `${nameOf(selected.a)} – ${nameOf(selected.b)}`;
    hint = 'Guardala sul tavolo, oppure concludi il turno per avere subito i risultati.';
    primary = { label: 'GUARDA LA SERIE', run: () => onWatch?.(selected.id, 0) };
  } else if (isAiDone) {
    const won = selected.winnerId === selected.a ? 'a' : 'b';
    label = `${ROUND_NAMES[selected.round].toUpperCase()} · ${selected.series.winsA}–${selected.series.winsB}`;
    headline = `Vince ${nameOf(selected[won])}`;
    hint = `Contro ${nameOf(selected[won === 'a' ? 'b' : 'a'])} · ${selected.series.games.length} partite giocate dalle IA.`;
    primary = { label: 'RIEPILOGO A TURNI', run: () => setSummary({ matchId: selected.id, gameIndex: 0 }) };
    secondary.push({ label: 'RIVEDI AL TAVOLO', run: () => onWatch?.(selected.id, 0) });
  } else if (status === 'champion') {
    label = 'CAMPIONE';
    headline = 'Hai vinto il torneo';
    hint = human.deckName;
    primary = { label: 'NUOVO TORNEO', run: onNewTournament };
  } else if (champion) {
    label = 'ELIMINATO';
    headline = `Il torneo va a ${champion.deckName}`;
    hint = 'Seleziona un incontro per leggerne il riepilogo o rivederlo.';
    primary = { label: 'NUOVO TORNEO', run: onNewTournament };
  } else {
    label = status === 'eliminated' ? 'ELIMINATO' : 'IN ATTESA';
    headline = status === 'eliminated' ? 'Il torneo prosegue senza di te' : 'Il turno non è concluso';
    hint = 'Seleziona una serie da guardare, oppure concludi il turno.';
    primary = { label: 'CONCLUDI IL TURNO', run: onConcludeRound };
  }
  if (pendingAi.length > 0 && primary.label !== 'CONCLUDI IL TURNO') {
    secondary.push({ label: `CONCLUDI ${ROUND_NAMES[pendingRound].toUpperCase()} · ${pendingNow}`, run: onConcludeRound });
  }

  const locked = Boolean(busy);
  if (busy) {
    // mentre le IA giocano la barra racconta la serie in corso; il tabellone resta in vista
    const live = allMatches.find((m) => m.id === busy.matchId);
    label = `LE IA GIOCANO${busy.total ? ` · SERIE ${busy.step}/${busy.total}` : ''}`;
    headline = live ? `${nameOf(live.a)} – ${nameOf(live.b)}` : 'Serie in corso';
    hint = busy.label;
  }
  const championFresh = Boolean(champion) && news.decided.has(tournament.rounds[tournament.rounds.length - 1][0].id);
  const go = () => { if (locked) return; playUiClick(); primary.run?.(); };
  const back = () => {
    if (locked) return;
    playUiClick();
    if (summary) summaryCloseRef.current?.();
    else onMenu?.();
  };

  const summaryCloseRef = useRef(null);
  const keysRef = useRef({});
  keysRef.current = { go, back, summaryOpen: Boolean(summary) };
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (e.key === 'Enter' && !keysRef.current.summaryOpen) { e.preventDefault(); keysRef.current.go(); }
      else if (e.key === 'Escape') { e.preventDefault(); keysRef.current.back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`trn${locked ? ' is-busy' : ''}`} style={{ '--accent': accent }}>
      <div className="trn-bg" aria-hidden="true">
        <div className="trn-ghost">TORNEO</div>
      </div>

      <header className="trn-top">
        <div className="trn-top-left">
          <button type="button" className="trn-back" onClick={back}>
            <span>←</span> <span>MENÙ</span>
          </button>
          {status === 'active' ? (
            <button type="button" className="trn-quit" onClick={() => { if (!locked) { playUiClick(); onAbandon?.(); } }}>
              <span>✕ ABBANDONA</span>
            </button>
          ) : null}
        </div>
        <div className="trn-title-block">
          <div className="trn-eye">12 ESERCITI · ELIMINAZIONE DIRETTA · AL MEGLIO DELLE 3</div>
          <h1 className="trn-title">TORNEO</h1>
        </div>
        <div className="trn-who">
          <span className="tag">IL TUO ESERCITO</span>
          <span className="army">{human.deckName}</span>
          <span className="deck">{(visuals[human.id]?.armies || []).join(' · ')}</span>
        </div>
      </header>

      <main className="trn-bracket" ref={bracketRef}>
        <svg className="trn-lines" aria-hidden="true">
          {lines.map((l) => (
            <path
              key={`${l.id}-${l.winnerId || 'open'}`}
              d={l.d}
              pathLength="1"
              className={l.winnerId ? 'is-done' : ''}
              style={{ '--c': l.winnerId ? visuals[l.winnerId]?.accent : undefined, '--r': l.round, '--d': `${(news.decided.get(l.id) ?? 0) * 140}ms` }}
            />
          ))}
        </svg>
        {tournament.rounds.map((round, r) => (
          <section key={ROUND_NAMES[r]} className={`trn-col${info?.match.round === r ? ' is-live' : ''}`} style={{ '--r': r }}>
            <h2><span className="n">{String(r + 1).padStart(2, '0')}</span>{ROUND_NAMES[r].toUpperCase()}</h2>
            <div className="trn-col-body">
              {round.map((match, mi) => (
                <Match
                  key={match.id}
                  match={match}
                  index={mi}
                  news={news}
                  playing={busy?.matchId === match.id}
                  champion={Boolean(champion) && r === tournament.rounds.length - 1}
                  participants={tournament.participants}
                  visuals={visuals}
                  current={info?.match.id === match.id}
                  selected={selected?.id === match.id}
                  selectable={!match.bye && Boolean(match.a && match.b)}
                  watchable={pendingIds.has(match.id)}
                  onSelect={setSelectedId}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="trn-foot">
        <div className="trn-next">
          <span className="lbl">{label}</span>
          <div className="txt" key={`${label}|${headline}`}>
            <span className="head">{headline}</span>
            <span className="hint">{hint}</span>
          </div>
          {busy ? <span className="bar" aria-hidden="true"><i /></span> : null}
        </div>
        {secondary.map((s) => (
          <button key={s.label} type="button" className="trn-ghost-btn" onClick={() => { if (!locked) { playUiClick(); s.run?.(); } }}>
            <span>{s.label}</span>
          </button>
        ))}
        <button type="button" className="trn-go" onClick={go}>
          <span>{primary.label}</span><kbd>↵</kbd>
        </button>
      </footer>

      {summaryMatch ? (
        <SeriesSummary
          tournament={tournament}
          match={summaryMatch}
          visuals={visuals}
          gameIndex={Math.min(summary.gameIndex, summaryMatch.series.games.length - 1)}
          onGame={(i) => setSummary({ matchId: summaryMatch.id, gameIndex: i })}
          closeRef={summaryCloseRef}
          onWatch={(id, i) => { setSummary(null); onWatch?.(id, i); }}
          onClose={() => setSummary(null)}
        />
      ) : null}

      {championFresh ? (
        <div className="trn-crown" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
          <span style={{ '--c': visuals[champion.id]?.accent }}>CAMPIONE</span>
        </div>
      ) : null}
      <TournamentStyles />
    </div>
  );
}

function TournamentStyles() {
  return (
    <style>{`
      .trn {
        --ink: #f5f3eb; --void: #050507; --plate: #111116; --dim: rgba(245,243,235,0.6);
        position: fixed; inset: 0; z-index: 1000; overflow: hidden; isolation: isolate;
        display: grid; grid-template-rows: auto 1fr auto;
        background: var(--void); color: var(--ink);
        font-family: 'Chakra Petch', sans-serif;
        animation: trn-fade .25s ease both;
      }
      @keyframes trn-fade { from { opacity: 0; } }
      .trn * { box-sizing: border-box; }
      /* Ingresso a cascata: testata, colonne, incontri, barra */
      @keyframes trn-drop { from { opacity: 0; transform: translateY(-34px) rotate(-2deg); } }
      @keyframes trn-rise { from { opacity: 0; transform: translateY(46px); } }
      @keyframes trn-slide { from { opacity: 0; transform: translateX(-34px); } }
      .trn-top { animation: trn-drop .45s cubic-bezier(.2,1.1,.4,1) both; }
      .trn-foot { animation: trn-rise .45s cubic-bezier(.2,1.1,.4,1) .28s both; }
      .trn-col h2 { animation: trn-slide .4s cubic-bezier(.2,.9,.3,1) calc(var(--r) * 90ms + 80ms) both; }
      .trn-match { animation: trn-slide .42s cubic-bezier(.2,.9,.3,1) calc(var(--r) * 90ms + var(--i) * 34ms + 140ms) both; }
      .trn kbd {
        display: inline-grid; place-items: center; min-width: 30px; height: 28px; padding: 0 6px;
        background: var(--void); color: var(--ink); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 16px; font-style: normal;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }

      /* Fondo: retino e scritta fantasma come nella scelta esercito */
      .trn-bg { position: absolute; inset: 0; z-index: -1; pointer-events: none;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 1.4px, transparent 1.8px) 0 0 / 11px 11px,
          radial-gradient(ellipse 70% 60% at 60% 45%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%);
      }
      @keyframes trn-drift { from { transform: translate(-52%, -50%) rotate(-8deg) skewX(-10deg); } to { transform: translate(-48%, -51%) rotate(-7deg) skewX(-10deg); } }
      .trn-ghost {
        will-change: transform; animation: trn-drift 26s ease-in-out infinite alternate;
        position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%) rotate(-8deg) skewX(-10deg);
        font-weight: 700; font-style: italic; font-size: 430px; line-height: 0.8; letter-spacing: -0.02em; white-space: nowrap;
        color: transparent; -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 26%, transparent);
      }

      /* Testata */
      .trn-top { display: grid; grid-template-columns: 520px 1fr 520px; align-items: start; padding: 22px 48px 0; }
      .trn-top-left { justify-self: start; display: flex; align-items: center; gap: 22px; }
      .trn-back {
        border: 0; cursor: pointer;
        background: var(--void); color: var(--ink);
        font: italic 700 20px/1 'Chakra Petch', sans-serif; letter-spacing: 0.08em;
        padding: 10px 24px 10px 18px;
        transform: skewX(-14deg) rotate(-2deg);
        box-shadow: 5px 5px 0 var(--accent);
        transition: transform .15s, box-shadow .15s;
      }
      .trn-back > * { display: inline-block; transform: skewX(14deg); }
      .trn-back:hover, .trn-back:focus-visible { transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--accent); }
      .trn-quit {
        border: 0; cursor: pointer; background: transparent; color: var(--dim);
        font: 700 13px/1 'Chakra Petch', sans-serif; letter-spacing: 0.16em; padding: 8px 12px;
        transform: skewX(-14deg) rotate(-2deg); box-shadow: inset 0 0 0 2px rgba(245,243,235,0.22);
        transition: color .15s, box-shadow .15s;
      }
      .trn-quit > * { display: inline-block; transform: skewX(14deg); }
      .trn-quit:hover, .trn-quit:focus-visible { color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
      .trn-title-block { justify-self: center; text-align: center; transform: rotate(-2deg); }
      .trn-eye {
        display: inline-block; background: var(--accent); color: var(--void);
        font-weight: 700; font-size: 13px; letter-spacing: 0.26em; padding: 3px 14px; transform: skewX(-14deg);
      }
      .trn-title {
        margin: 4px 0 0; font-weight: 700; font-style: italic; font-size: 76px; line-height: 0.95; letter-spacing: -0.01em;
        text-shadow: 5px 5px 0 var(--accent), 10px 10px 0 var(--void);
      }
      .trn-who { justify-self: end; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; transform: rotate(-2deg); max-width: 500px; margin-right: 34px; }
      .trn-who .tag {
        background: var(--ink); color: var(--void); font-weight: 700; font-size: 12px; letter-spacing: 0.22em;
        padding: 2px 12px; transform: skewX(-14deg);
      }
      .trn-who .army { font-weight: 700; font-style: italic; font-size: 26px; line-height: 1; color: var(--accent); text-transform: uppercase; text-align: right; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .trn-who .deck { font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.14em; color: var(--dim); text-transform: uppercase; }

      /* Tabellone */
      /* Linee del tabellone: si disegnano, e a serie decisa prendono il colore di chi passa */
      .trn-lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
      .trn-lines path {
        fill: none; stroke: rgba(245,243,235,0.2); stroke-width: 2; stroke-dasharray: 1; stroke-dashoffset: 0;
        animation: trn-draw .5s ease-out calc(var(--r) * 90ms + 420ms) both;
      }
      .trn-lines path.is-done { stroke: var(--c); stroke-width: 3; animation: trn-draw .45s ease-out calc(var(--d) + 380ms) both; }
      @keyframes trn-draw { from { stroke-dashoffset: 1; } }
      .trn-bracket { position: relative; display: grid; grid-template-columns: repeat(4, 410px); justify-content: center; gap: 34px; padding: 18px 48px 22px; min-height: 0; }
      .trn-col { display: flex; flex-direction: column; min-height: 0; }
      .trn-col h2 {
        margin: 0 0 12px; display: flex; align-items: baseline; gap: 12px;
        font-weight: 700; font-size: 24px; letter-spacing: 0.04em; color: var(--dim);
        border-bottom: 3px solid rgba(245,243,235,0.18); padding-bottom: 6px; transform: skewX(-14deg);
      }
      .trn-col h2 .n { font-family: 'Share Tech Mono', monospace; font-weight: 400; font-size: 14px; color: var(--accent); }
      .trn-col.is-live h2 { color: var(--ink); font-style: italic; border-bottom-color: var(--accent); }
      .trn-col-body { flex: 1; display: flex; flex-direction: column; justify-content: space-around; gap: 10px; min-height: 0; }

      .trn-match {
        position: relative; display: flex; flex-direction: column; gap: 3px; padding: 5px 16px 5px 22px;
        background: var(--plate); border: 0; color: inherit; font-family: inherit; text-align: left; width: 100%;
        clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
        transition: background .15s, transform .15s;
      }
      .trn-match::before {
        content: ''; position: absolute; left: 12px; top: 0; bottom: 0; width: 5px;
        background: rgba(245,243,235,0.18); transform: skewX(-12deg);
      }
      .trn-match.is-selectable { cursor: pointer; }
      .trn-match.is-selectable:hover, .trn-match.is-selectable:focus-visible { background: #1c1c23; }
      .trn-match.is-current::before { background: var(--accent); animation: trn-pulse 1.6s ease-in-out infinite; }
      @keyframes trn-pulse { 50% { opacity: 0.35; } }
      /* serie che le IA stanno giocando: una scansione la percorre */
      .trn-match.is-playing { background: #1c1c23; }
      .trn-match.is-playing::after {
        content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 38%;
        background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 38%, transparent), transparent);
        animation: trn-scan 1s linear infinite; pointer-events: none;
      }
      @keyframes trn-scan { from { transform: translateX(-110%); } to { transform: translateX(290%); } }
      .trn-tag.is-live { background: var(--accent); animation: trn-pulse 1s ease-in-out infinite; }
      /* risultato nuovo: la riga di chi vince si riempie da sinistra, chi perde si spegne dopo */
      .trn-side.is-fresh-win { animation: trn-stamp .5s cubic-bezier(.2,.9,.3,1) var(--d) both; }
      @keyframes trn-stamp { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
      .trn-side.is-fresh-win .sc { animation: trn-pop .45s cubic-bezier(.3,1.6,.5,1) calc(var(--d) + 260ms) both; }
      @keyframes trn-pop { from { opacity: 0; transform: skewX(14deg) scale(2.2); } }
      .trn-side.is-fresh-lose { animation: trn-dim .5s ease calc(var(--d) + 200ms) both; }
      @keyframes trn-dim { from { opacity: 1; } }
      /* l'esercito che passa il turno arriva nel suo nuovo posto */
      .trn-side.is-fresh-arrive { animation: trn-arrive .5s cubic-bezier(.2,1.2,.4,1) calc(var(--d) + 520ms) both; }
      @keyframes trn-arrive { from { opacity: 0; transform: skewX(-14deg) translateX(-46px); } }
      /* finale decisa: un riflesso passa sulla riga del campione */
      .trn-match.is-champion .trn-side.is-won { position: relative; overflow: hidden; }
      .trn-match.is-champion .trn-side.is-won::after {
        content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 30%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
        animation: trn-scan 2.6s ease-in-out infinite; pointer-events: none;
      }
      .trn-match.is-selected { background: #1c1c23; box-shadow: inset 0 0 0 2px var(--ink); filter: drop-shadow(7px 7px 0 var(--accent)); transform: translateX(-8px); }
      .trn-match.is-selected::before { background: var(--ink); }
      .trn-tag {
        position: absolute; right: 22px; top: 50%; transform: translateY(-50%) skewX(-14deg);
        background: var(--ink); color: var(--void); font-weight: 700; font-size: 10px; letter-spacing: 0.18em; padding: 2px 8px;
      }
      .trn-side {
        display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 10px;
        height: 34px; padding: 0 10px 0 8px; color: var(--ink);
        transform: skewX(-14deg);
      }
      .trn-side > * { transform: skewX(14deg); }
      .trn-side .ic { min-width: 26px; height: 26px; display: flex; align-items: center; gap: 2px; }
      .trn-side .ic img { width: 22px; height: 22px; object-fit: contain; }
      .trn-side .nm { font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--c); }
      .trn-side .you { background: var(--ink); color: var(--void); font-weight: 700; font-size: 11px; letter-spacing: 0.18em; padding: 1px 7px; }
      .trn-side .sc { min-width: 26px; text-align: center; font-weight: 700; font-style: italic; font-size: 22px; color: var(--dim); }
      .trn-side.is-empty .nm { color: rgba(245,243,235,0.32); font-family: 'Share Tech Mono', monospace; font-weight: 400; font-size: 13px; letter-spacing: 0.14em; }
      .trn-side.is-won { background: var(--c); }
      .trn-side.is-won .nm, .trn-side.is-won .sc { color: var(--void); font-style: italic; }
      .trn-side.is-won .ic img { filter: brightness(0); }
      .trn-side.is-lost { opacity: 0.38; }
      .trn-bye { height: 20px; padding-left: 46px; font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--dim); }

      /* Barra in basso */
      .trn-foot { display: flex; align-items: flex-end; gap: 22px; padding: 0 60px 30px 111px; }
      .trn-next {
        flex: 1; min-width: 0; display: flex; align-items: center; gap: 22px; height: 92px; padding: 0 40px 0 30px;
        background: var(--ink); color: var(--void);
        transform: skewX(-14deg) rotate(-1deg); box-shadow: 7px 7px 0 var(--accent);
      }
      .trn-next > * { transform: skewX(14deg); }
      .trn-next .lbl {
        flex: none; background: var(--void); color: var(--ink); font-weight: 700; font-size: 14px; letter-spacing: 0.16em;
        padding: 4px 14px; white-space: nowrap;
      }
      .trn-next .txt { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .trn-next .head { font-weight: 700; font-style: italic; font-size: 30px; line-height: 1.05; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .trn-next .hint { font-weight: 600; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* il testo cambia con la selezione: entra scivolando, senza scatti */
      .trn-next .txt { animation: trn-swap .28s cubic-bezier(.2,.9,.3,1) both; }
      @keyframes trn-swap { from { opacity: 0; transform: skewX(14deg) translateX(-22px); } }
      .trn-next .bar { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; overflow: hidden; transform: none; }
      .trn-next .bar i { display: block; width: 30%; height: 100%; background: var(--accent); animation: trn-scan 1.1s linear infinite; }
      .trn-next { position: relative; }
      .trn-ghost-btn {
        height: 60px; padding: 0 22px; border: 0; cursor: pointer; background: var(--void); color: var(--dim);
        font: 700 16px/1 'Chakra Petch', sans-serif; letter-spacing: 0.12em; white-space: nowrap;
        transform: skewX(-14deg); box-shadow: inset 0 0 0 2px rgba(245,243,235,0.3);
        transition: color .15s, box-shadow .15s;
      }
      .trn-ghost-btn > * { display: inline-block; transform: skewX(14deg); }
      .trn-ghost-btn:hover, .trn-ghost-btn:focus-visible { color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
      .trn-go {
        display: inline-flex; align-items: center; gap: 18px; height: 92px; padding: 0 36px; border: 0; cursor: pointer;
        background: var(--accent); color: var(--void);
        font: italic 700 40px/1 'Chakra Petch', sans-serif; letter-spacing: 0.01em; white-space: nowrap;
        transform: skewX(-14deg); box-shadow: 8px 8px 0 var(--ink);
        transition: transform .15s, box-shadow .15s;
      }
      .trn-go > * { transform: skewX(14deg); }
      .trn-go:hover, .trn-go:focus-visible { transform: skewX(-14deg) translate(-3px,-3px) rotate(-1deg); box-shadow: 12px 12px 0 var(--ink); }
      .trn-go.is-small { height: 62px; font-size: 26px; padding: 0 28px; box-shadow: 6px 6px 0 var(--void); }
      .trn-go.is-small:hover { box-shadow: 10px 10px 0 var(--void); }
      .trn.is-busy .trn-go, .trn.is-busy .trn-ghost-btn, .trn.is-busy .trn-back, .trn.is-busy .trn-quit { pointer-events: none; opacity: 0.4; transition: opacity .25s; }
      .trn.is-busy .trn-match { pointer-events: none; }
      .trn-go, .trn-ghost-btn { transition: transform .15s, box-shadow .15s, opacity .25s; }

      /* Riepilogo a turni: riquadro come "Imposta la partita" */
      .trn-sum {
        position: absolute; inset: 0; z-index: 20; display: grid; place-items: center;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent) 1.4px, transparent 1.8px) 0 0 / 11px 11px,
          rgba(5,5,7,0.86);
        animation: trn-fade .2s ease both;
      }
      .trn-sum.is-leaving { animation: trn-sum-bg-out .24s ease forwards; }
      .trn-sum.is-leaving .trn-sum-card { animation: trn-sum-out .24s cubic-bezier(.6,0,.9,.4) forwards; }
      @keyframes trn-sum-out { to { opacity: 0; transform: rotate(3deg) translate(120px, -160px) skewX(-8deg) scale(.94); } }
      @keyframes trn-sum-bg-out { to { opacity: 0; } }
      .trn-sum-row:not(.is-head) { animation: trn-slide .32s cubic-bezier(.2,.9,.3,1) calc(var(--i) * 55ms + 120ms) both; }
      .trn-sum-card { width: 1560px; transform: rotate(-1deg); filter: drop-shadow(16px 16px 0 var(--accent)); animation: trn-sum-in .34s cubic-bezier(.2,1.2,.4,1) both; }
      @keyframes trn-sum-in { from { opacity: 0; transform: rotate(-1deg) translateY(60px) skewX(-6deg); } }
      .trn-sum-sheet { position: relative; display: flex; flex-direction: column; background: var(--void); clip-path: polygon(0 0, 100% 0, calc(100% - 34px) 100%, 0 100%); }
      .trn-sum-sheet::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: var(--accent); }
      .trn-sum-head { position: relative; display: flex; align-items: flex-end; gap: 24px; padding: 34px 56px 14px 52px; }
      .trn-sum-eye { position: absolute; left: 50px; top: 16px; background: var(--accent); color: var(--void); font-weight: 700; font-size: 14px; letter-spacing: 0.28em; padding: 3px 14px; transform: skewX(-14deg); }
      .trn-sum-head h2 { margin: 14px 0 0; display: flex; align-items: baseline; gap: 22px; font-weight: 700; font-style: italic; font-size: 44px; line-height: 1; text-transform: uppercase; white-space: nowrap; min-width: 0; }
      .trn-sum-head h2 .score { color: var(--ink); background: var(--plate); padding: 2px 16px; font-size: 40px; }
      .trn-sum-x { margin-left: auto; margin-bottom: 6px; display: inline-flex; align-items: center; gap: 10px; border: 0; cursor: pointer; background: transparent; color: var(--ink); font: italic 700 20px/1 'Chakra Petch', sans-serif; letter-spacing: 0.08em; }
      .trn-sum-x kbd { background: var(--ink); color: var(--void); height: 22px; min-width: 24px; font-size: 12px; }
      .trn-sum-x:hover span { color: var(--accent); }
      .trn-sum-tabs { display: flex; gap: 10px; padding: 6px 76px 14px 60px; }
      .trn-chip {
        flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px;
        min-height: 60px; padding: 6px 22px; border: 0; cursor: pointer; text-align: left;
        background: var(--plate); color: var(--dim); font-family: inherit;
        transform: skewX(-14deg); box-shadow: inset 0 0 0 2px rgba(245,243,235,0.18);
        transition: background .15s, color .15s, box-shadow .15s, transform .15s;
      }
      .trn-chip > * { transform: skewX(14deg); max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .trn-chip .t { font-weight: 700; font-size: 22px; text-transform: uppercase; }
      .trn-chip .d { font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.06em; }
      .trn-chip:hover:not(.sel) { color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
      .trn-chip.sel { background: var(--accent); color: var(--void); box-shadow: 5px 5px 0 var(--ink); transform: skewX(-14deg) translateY(-3px); }
      .trn-chip.sel .t { font-style: italic; }
      .trn-sum-rows { display: flex; flex-direction: column; gap: 6px; padding: 6px 76px 22px 52px; }
      .trn-sum-row {
        display: grid; grid-template-columns: 90px 330px 1fr 1fr 110px 100px; align-items: center; gap: 16px;
        min-height: 62px; padding: 6px 26px 6px 34px; background: var(--plate);
        clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
      }
      .trn-sum-row.is-head { min-height: 30px; background: transparent; font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.18em; color: var(--dim); text-transform: uppercase; }
      .trn-sum-row.is-head span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .trn-sum-row .n { font-weight: 700; font-style: italic; font-size: 30px; color: var(--accent); }
      .trn-sum-row .fld { font-weight: 600; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .trn-sum-row .ag { display: flex; flex-direction: column; gap: 1px; min-width: 0; padding: 4px 12px; border-left: 4px solid var(--c); }
      .trn-sum-row .ag b { font-weight: 700; font-size: 17px; color: var(--c); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .trn-sum-row .ag i { font-family: 'Share Tech Mono', monospace; font-style: normal; font-size: 12px; letter-spacing: 0.08em; color: var(--dim); }
      .trn-sum-row .ag.won { background: var(--c); }
      .trn-sum-row .ag.won b { color: var(--void); font-style: italic; }
      .trn-sum-row .ag.won i { color: rgba(5,5,7,0.75); }
      .trn-sum-row .num { font-weight: 700; font-size: 24px; font-variant-numeric: tabular-nums; }
      .trn-sum-empty { padding: 40px 76px 40px 60px; font-size: 20px; color: var(--dim); }
      .trn-sum-foot { display: flex; align-items: center; gap: 26px; padding: 22px 86px 18px 52px; background: var(--ink); color: var(--void); clip-path: polygon(0 16px, 100% 0, 100% 100%, 0 100%); }
      .trn-sum-foot .res { flex: 1; min-width: 0; display: flex; align-items: center; gap: 16px; padding-top: 8px; }
      .trn-sum-foot .lbl { flex: none; background: var(--void); color: var(--ink); font-weight: 700; font-size: 14px; letter-spacing: 0.14em; padding: 4px 14px; transform: skewX(-14deg); box-shadow: 4px 4px 0 var(--accent); }
      .trn-sum-foot .txt { font-weight: 700; font-style: italic; font-size: 24px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      /* Torneo deciso: schegge e timbro, una volta sola */
      .trn-crown { position: absolute; inset: 0; z-index: 15; pointer-events: none; display: grid; place-items: center; }
      .trn-crown span {
        font-weight: 700; font-style: italic; font-size: 190px; letter-spacing: -0.02em; color: var(--c, var(--accent));
        text-shadow: 8px 8px 0 var(--void), 14px 14px 0 var(--ink);
        animation: trn-crown 2.2s cubic-bezier(.2,1.1,.4,1) .9s both;
      }
      @keyframes trn-crown {
        0% { opacity: 0; transform: rotate(-8deg) scale(2.4); }
        14% { opacity: 1; transform: rotate(-8deg) scale(1); }
        78% { opacity: 1; transform: rotate(-8deg) scale(1.04); }
        100% { opacity: 0; transform: rotate(-8deg) scale(1.08) translateY(-30px); }
      }
      .trn-crown i {
        position: absolute; left: 50%; top: 50%; width: 46px; height: 12px;
        background: var(--ink);
        animation: trn-shard 1.3s cubic-bezier(.1,.8,.3,1) calc(1s + var(--i) * 18ms) both;
      }
      .trn-crown i:nth-child(odd) { background: var(--accent); }
      @keyframes trn-shard {
        from { opacity: 1; transform: rotate(calc(var(--i) * 25.7deg)) translateX(60px) skewX(-30deg); }
        to { opacity: 0; transform: rotate(calc(var(--i) * 25.7deg)) translateX(620px) skewX(-30deg) scaleX(0.4); }
      }

      @media (prefers-reduced-motion: reduce) {
        .trn, .trn *, .trn *::before, .trn *::after { animation: none !important; transition: none !important; }
        .trn-crown { display: none; }
      }
    `}</style>
  );
}
