// ============================================================
// TournamentHubScreen.jsx — tabellone del torneo
// ============================================================
// Stesso linguaggio della scelta armata / esercito e di "Imposta la
// partita": lastre inclinate, Chakra Petch corsivo, ombre piene,
// barra chiara in basso. Canvas di gioco 1920×1080.
// Tastiera: Invio gioca (o nuovo torneo), Esc torna al menù.
// ============================================================

import { useEffect, useRef } from 'react';
import { ARMY_COLORS, ARMY_ICONS } from '../../data/armies.js';
import { playUiClick } from '../../audio/soundBus';
import {
  ROUND_NAMES,
  describeHumanMatch,
  getTournamentStatus,
} from '../../game/tournament/tournamentLogic.js';

const DEFAULT_ACCENT = '#a288fb';

const HAND_RULE_TEXT = {
  draw: 'Peschi 5 carte a caso dal tuo esercito.',
  remainder: 'Giochi le 5 carte rimaste fuori dalla partita 1.',
  reshuffle: 'Spareggio: esercito rimischiato, 5 carte a caso.',
};

function colorOf(participant, accent) {
  if (!participant) return 'rgba(245,243,235,0.18)';
  if (participant.isHuman) return accent;
  return ARMY_COLORS[participant.army]?.accent || accent;
}

function Side({ participant, wins, state, showScore, accent }) {
  const icon = participant ? ARMY_ICONS[participant.army] : null;
  return (
    <div
      className={`trn-side is-${state}${participant?.isHuman ? ' is-you' : ''}${participant ? '' : ' is-empty'}`}
      style={{ '--c': colorOf(participant, accent) }}
      title={participant ? `${participant.army} — ${participant.deckName}` : undefined}
    >
      <span className="ic">{icon ? <img src={icon} alt="" /> : null}</span>
      <span className="nm">{participant ? participant.army : 'Da definire'}</span>
      {participant?.isHuman ? <span className="you">TU</span> : null}
      {showScore ? <span className="sc">{wins}</span> : null}
    </div>
  );
}

function Match({ match, participants, current, accent }) {
  const a = match.a ? participants[match.a] : null;
  const b = match.b ? participants[match.b] : null;
  const done = Boolean(match.winnerId);
  const started = match.series.games.some((g) => g.winner);
  const stateOf = (id) => (!done || !id ? 'open' : match.winnerId === id ? 'won' : 'lost');
  const showScore = !match.bye && (done || started);
  return (
    <div className={`trn-match${current ? ' is-current' : ''}${match.bye ? ' is-bye' : ''}`}>
      <Side participant={a} wins={match.series.winsA} state={match.bye ? 'open' : stateOf(match.a)} showScore={showScore} accent={accent} />
      {match.bye
        ? <div className="trn-bye">PASSA IL TURNO</div>
        : <Side participant={b} wins={match.series.winsB} state={stateOf(match.b)} showScore={showScore} accent={accent} />}
    </div>
  );
}

export function TournamentHubScreen({ tournament, onPlay, onMenu, onAbandon, onNewTournament }) {
  const status = getTournamentStatus(tournament);
  const info = describeHumanMatch(tournament);
  const human = tournament.participants[tournament.humanId];
  const champion = tournament.championId ? tournament.participants[tournament.championId] : null;
  const accent = ARMY_COLORS[human.army]?.accent || DEFAULT_ACCENT;
  const playing = status === 'active' && Boolean(info);

  let label;
  let headline;
  let hint;
  if (status === 'champion') {
    label = 'CAMPIONE';
    headline = 'Hai vinto il torneo';
    hint = `${human.army} · ${human.deckName}`;
  } else if (status === 'eliminated') {
    label = 'ELIMINATO';
    headline = champion ? `Il torneo va a ${champion.army}` : 'Sei stato eliminato';
    hint = champion ? champion.deckName : '';
  } else if (info) {
    label = `${info.roundName.toUpperCase()} · SERIE ${info.humanWins}–${info.opponentWins}`;
    headline = `Contro ${info.opponent.army}`;
    hint = `${info.opponent.deckName} · ${HAND_RULE_TEXT[info.handRule]}`;
  }
  const goLabel = playing
    ? `${info.resuming ? 'RIPRENDI' : 'GIOCA'} PARTITA ${info.gameNumber}`
    : 'NUOVO TORNEO';
  const go = () => { playUiClick(); (playing ? onPlay : onNewTournament)?.(); };
  const back = () => { playUiClick(); onMenu?.(); };

  const keysRef = useRef({});
  keysRef.current = { go, back };
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (e.key === 'Enter') { e.preventDefault(); keysRef.current.go(); }
      else if (e.key === 'Escape') { e.preventDefault(); keysRef.current.back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="trn" style={{ '--accent': accent }}>
      <div className="trn-bg" aria-hidden="true">
        <div className="trn-ghost">TORNEO</div>
      </div>

      <header className="trn-top">
        <button type="button" className="trn-back" onClick={back}>
          <span>←</span> <span>MENÙ</span>
        </button>
        <div className="trn-title-block">
          <div className="trn-eye">12 ARMATE · ELIMINAZIONE DIRETTA · AL MEGLIO DELLE 3</div>
          <h1 className="trn-title">TORNEO</h1>
        </div>
        <div className="trn-who">
          <span className="tag">IL TUO ESERCITO</span>
          <span className="army">{human.army}</span>
          <span className="deck">{human.deckName}</span>
        </div>
      </header>

      <main className="trn-bracket">
        {tournament.rounds.map((round, r) => (
          <section key={ROUND_NAMES[r]} className={`trn-col${info?.match.round === r ? ' is-live' : ''}`}>
            <h2><span className="n">{String(r + 1).padStart(2, '0')}</span>{ROUND_NAMES[r].toUpperCase()}</h2>
            <div className="trn-col-body">
              {round.map((match) => (
                <Match
                  key={match.id}
                  match={match}
                  participants={tournament.participants}
                  current={info?.match.id === match.id}
                  accent={accent}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="trn-foot">
        <div className="trn-next">
          <span className="lbl">{label}</span>
          <div className="txt">
            <span className="head">{headline}</span>
            <span className="hint">{hint}</span>
          </div>
        </div>
        {status === 'active' ? (
          <button type="button" className="trn-ghost-btn" onClick={() => { playUiClick(); onAbandon?.(); }}>
            <span>✕</span> <span>ABBANDONA TORNEO</span>
          </button>
        ) : null}
        <button type="button" className="trn-go" onClick={go}>
          <span>{goLabel}</span><kbd>↵</kbd>
        </button>
      </footer>
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
      .trn kbd {
        display: inline-grid; place-items: center; min-width: 30px; height: 28px; padding: 0 6px;
        background: var(--void); color: var(--ink); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 16px; font-style: normal;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }

      /* Fondo: retino, scritta fantasma e fascia obliqua come nella scelta esercito */
      .trn-bg { position: absolute; inset: 0; z-index: -1; pointer-events: none;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 1.4px, transparent 1.8px) 0 0 / 11px 11px,
          radial-gradient(ellipse 70% 60% at 60% 45%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%);
      }
      .trn-ghost {
        position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%) rotate(-8deg) skewX(-10deg);
        font-weight: 700; font-style: italic; font-size: 430px; line-height: 0.8; letter-spacing: -0.02em; white-space: nowrap;
        color: transparent; -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 26%, transparent);
      }

      /* Testata */
      .trn-top { display: grid; grid-template-columns: 420px 1fr 420px; align-items: start; padding: 22px 48px 0; }
      .trn-back {
        justify-self: start; border: 0; cursor: pointer;
        background: var(--void); color: var(--ink);
        font: italic 700 20px/1 'Chakra Petch', sans-serif; letter-spacing: 0.08em;
        padding: 10px 24px 10px 18px;
        transform: skewX(-14deg) rotate(-2deg);
        box-shadow: 5px 5px 0 var(--accent);
        transition: transform .15s, box-shadow .15s;
      }
      .trn-back > * { display: inline-block; transform: skewX(14deg); }
      .trn-back:hover, .trn-back:focus-visible { transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--accent); }
      .trn-title-block { justify-self: center; text-align: center; transform: rotate(-2deg); }
      .trn-eye {
        display: inline-block; background: var(--accent); color: var(--void);
        font-weight: 700; font-size: 13px; letter-spacing: 0.26em; padding: 3px 14px; transform: skewX(-14deg);
      }
      .trn-title {
        margin: 4px 0 0; font-weight: 700; font-style: italic; font-size: 76px; line-height: 0.95; letter-spacing: -0.01em;
        text-shadow: 5px 5px 0 var(--accent), 10px 10px 0 var(--void);
      }
      .trn-who { justify-self: end; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; transform: rotate(-2deg); }
      .trn-who .tag {
        background: var(--ink); color: var(--void); font-weight: 700; font-size: 12px; letter-spacing: 0.22em;
        padding: 2px 12px; transform: skewX(-14deg);
      }
      .trn-who .army { font-weight: 700; font-style: italic; font-size: 30px; line-height: 1; color: var(--accent); text-transform: uppercase; }
      .trn-who .deck { font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.14em; color: var(--dim); text-transform: uppercase; }

      /* Tabellone */
      .trn-bracket { display: grid; grid-template-columns: repeat(4, 390px); justify-content: center; gap: 46px; padding: 18px 48px 22px; min-height: 0; }
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
        background: var(--plate);
        clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
      }
      .trn-match::before {
        content: ''; position: absolute; left: 12px; top: 0; bottom: 0; width: 5px;
        background: rgba(245,243,235,0.18); transform: skewX(-12deg);
      }
      .trn-match.is-current { background: #1c1c23; box-shadow: inset 0 0 0 2px var(--accent); filter: drop-shadow(7px 7px 0 var(--accent)); transform: translateX(-8px); }
      .trn-match.is-current::before { background: var(--accent); }
      .trn-side {
        display: grid; grid-template-columns: 28px 1fr auto auto; align-items: center; gap: 10px;
        height: 34px; padding: 0 10px 0 8px; color: var(--ink);
        transform: skewX(-14deg);
      }
      .trn-side > * { transform: skewX(14deg); }
      .trn-side .ic { width: 26px; height: 26px; display: grid; place-items: center; }
      .trn-side .ic img { width: 24px; height: 24px; object-fit: contain; }
      .trn-side .nm { font-weight: 700; font-size: 17px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--c); }
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
      .trn-next .head { font-weight: 700; font-style: italic; font-size: 32px; line-height: 1.05; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .trn-next .hint { font-weight: 600; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .trn-ghost-btn {
        height: 60px; padding: 0 22px; border: 0; cursor: pointer; background: var(--void); color: var(--dim);
        font: 700 16px/1 'Chakra Petch', sans-serif; letter-spacing: 0.12em; white-space: nowrap;
        transform: skewX(-14deg); box-shadow: inset 0 0 0 2px rgba(245,243,235,0.3);
        transition: color .15s, box-shadow .15s;
      }
      .trn-ghost-btn > * { display: inline-block; transform: skewX(14deg); }
      .trn-ghost-btn:hover, .trn-ghost-btn:focus-visible { color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
      .trn-go {
        display: inline-flex; align-items: center; gap: 18px; height: 92px; padding: 0 40px; border: 0; cursor: pointer;
        background: var(--accent); color: var(--void);
        font: italic 700 44px/1 'Chakra Petch', sans-serif; letter-spacing: 0.01em; white-space: nowrap;
        transform: skewX(-14deg); box-shadow: 8px 8px 0 var(--ink);
        transition: transform .15s, box-shadow .15s;
      }
      .trn-go > * { transform: skewX(14deg); }
      .trn-go:hover, .trn-go:focus-visible { transform: skewX(-14deg) translate(-3px,-3px) rotate(-1deg); box-shadow: 12px 12px 0 var(--ink); }

      @media (prefers-reduced-motion: reduce) { .trn { animation: none; } }
    `}</style>
  );
}
