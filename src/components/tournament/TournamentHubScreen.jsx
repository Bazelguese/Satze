// ============================================
// TORNEO — tabellone a eliminazione diretta
// ============================================

import { MenuScreenLayout, MenuBackButton, MENU_ACCENTS, PALETTE, HUD_ORATORIO_FONT_DISPLAY } from '../menu';
import { ARMY_COLORS, ARMY_ICONS } from '../../data/armies.js';
import { playUiClick } from '../../audio/soundBus';
import {
  ROUND_NAMES,
  describeHumanMatch,
  getTournamentStatus,
} from '../../game/tournament/tournamentLogic.js';

const HAND_RULE_TEXT = {
  draw: 'Peschi 5 carte a caso dal tuo esercito.',
  remainder: 'Giochi le 5 carte rimaste fuori dalla partita 1.',
  reshuffle: 'Spareggio: esercito rimischiato, 5 carte a caso.',
};

function accentOf(participant) {
  if (!participant) return PALETTE.slate;
  if (participant.isHuman) return MENU_ACCENTS.pink;
  return ARMY_COLORS[participant.army]?.accent || PALETTE.slate;
}

function ParticipantRow({ participant, wins, state, showScore }) {
  const accent = accentOf(participant);
  const dim = state === 'lost';
  const icon = participant ? ARMY_ICONS[participant.army] : null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 8px',
        opacity: dim ? 0.42 : 1,
        background: state === 'won' ? `${accent}22` : 'transparent',
        borderLeft: `3px solid ${participant ? accent : 'transparent'}`,
        minHeight: 30,
      }}
    >
      {icon
        ? <img src={icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
        : <span style={{ width: 20, flexShrink: 0 }} />}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 13,
          fontWeight: participant?.isHuman || state === 'won' ? 700 : 500,
          color: participant ? (participant.isHuman ? '#fdf4ff' : PALETTE.textPrimary) : PALETTE.textSecondary,
        }}
        title={participant ? `${participant.army} — ${participant.deckName}` : undefined}
      >
        {participant ? (participant.isHuman ? `Tu · ${participant.army}` : participant.name) : 'Da definire'}
      </span>
      {showScore && (
        <span style={{ fontSize: 14, fontWeight: 700, color: state === 'won' ? accent : PALETTE.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
          {wins}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match, participants, current }) {
  const a = match.a ? participants[match.a] : null;
  const b = match.b ? participants[match.b] : null;
  const done = Boolean(match.winnerId);
  const started = match.series.games.some((g) => g.winner);
  const stateOf = (id) => (!done || !id ? 'open' : match.winnerId === id ? 'won' : 'lost');
  return (
    <div
      style={{
        width: 250,
        background: 'rgba(12, 6, 20, 0.82)',
        border: `1.5px solid ${current ? MENU_ACCENTS.pink : PALETTE.slate}`,
        boxShadow: current ? `0 0 18px ${MENU_ACCENTS.pink}55` : '0 2px 8px #000',
      }}
    >
      <ParticipantRow participant={a} wins={match.series.winsA} state={match.bye ? 'open' : stateOf(match.a)} showScore={!match.bye && (done || started)} />
      {match.bye ? (
        <div style={{ padding: '3px 11px 6px', fontSize: 10, letterSpacing: '0.12em', color: PALETTE.textSecondary }}>
          PASSA IL TURNO
        </div>
      ) : (
        <>
          <div style={{ height: 1, background: PALETTE.slate, opacity: 0.6 }} />
          <ParticipantRow participant={b} wins={match.series.winsB} state={stateOf(match.b)} showScore={done || started} />
        </>
      )}
    </div>
  );
}

function ActionButton({ children, onClick, primary = false }) {
  const accent = primary ? MENU_ACCENTS.pink : PALETTE.slate;
  return (
    <button
      type="button"
      onClick={(e) => { playUiClick(); onClick?.(e); }}
      style={{
        padding: primary ? '0.8rem 2.2rem' : '0.6rem 1.2rem',
        background: primary ? `${accent}30` : MENU_ACCENTS.panel,
        border: `1.5px solid ${accent}`,
        color: primary ? '#fdf4ff' : PALETTE.textSecondary,
        cursor: 'pointer',
        fontFamily: "'Cinzel', 'Georgia', serif",
        fontWeight: 700,
        fontSize: primary ? 16 : 12,
        letterSpacing: '0.12em',
        boxShadow: primary ? `0 0 20px ${accent}55` : 'none',
      }}
    >
      {children}
    </button>
  );
}

export function TournamentHubScreen({ tournament, onPlay, onMenu, onAbandon, onNewTournament }) {
  const status = getTournamentStatus(tournament);
  const info = describeHumanMatch(tournament);
  const champion = tournament.championId ? tournament.participants[tournament.championId] : null;
  const human = tournament.participants[tournament.humanId];

  let headline;
  let detail;
  if (status === 'champion') {
    headline = 'Hai vinto il torneo';
    detail = `${human.army} — ${human.deckName}`;
  } else if (status === 'eliminated') {
    headline = 'Sei stato eliminato';
    detail = champion ? `Il torneo va a ${champion.name} (${champion.deckName}).` : '';
  } else if (info) {
    headline = `${info.roundName} · contro ${info.opponent.name}`;
    detail = `Serie al meglio delle 3: ${info.humanWins}–${info.opponentWins} · Partita ${info.gameNumber}. ${HAND_RULE_TEXT[info.handRule]}`;
  }

  return (
    <MenuScreenLayout centered={false} title="TORNEO" subtitle="12 partecipanti · eliminazione diretta · incontri al meglio delle 3">
      <div
        style={{
          width: '100%',
          maxWidth: 1180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          padding: '14px 20px',
          marginBottom: 14,
          background: 'rgba(12, 6, 20, 0.82)',
          border: `1.5px solid ${status === 'eliminated' ? PALETTE.slate : MENU_ACCENTS.pink}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY, fontSize: 20, fontWeight: 700, letterSpacing: '0.08em', color: PALETTE.textPrimary }}>
            {headline}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: PALETTE.textSecondary }}>{detail}</div>
          {status === 'active' && info && (
            <div style={{ marginTop: 4, fontSize: 12, color: PALETTE.textSecondary }}>
              Avversario: {info.opponent.army} — {info.opponent.deckName}. PV e FC ripartono da capo a ogni partita; l’esercito resta lo stesso per tutto il torneo.
            </div>
          )}
        </div>
        {status === 'active' && info ? (
          <ActionButton primary onClick={onPlay}>
            {info.resuming ? `RIPRENDI PARTITA ${info.gameNumber}` : `GIOCA PARTITA ${info.gameNumber}`}
          </ActionButton>
        ) : (
          <ActionButton primary onClick={onNewTournament}>NUOVO TORNEO</ActionButton>
        )}
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'stretch', justifyContent: 'center' }}>
        {tournament.rounds.map((round, r) => (
          <div key={ROUND_NAMES[r]} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                textAlign: 'center',
                marginBottom: 8,
                fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: info?.match.round === r ? MENU_ACCENTS.pink : PALETTE.textSecondary,
              }}
            >
              {ROUND_NAMES[r].toUpperCase()}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 8 }}>
              {round.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  participants={tournament.participants}
                  current={info?.match.id === match.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <MenuBackButton onClick={onMenu}>{status === 'active' ? 'Menù (torneo salvato)' : 'Menù'}</MenuBackButton>
        {status === 'active' && <ActionButton onClick={onAbandon}>ABBANDONA TORNEO</ActionButton>}
      </div>
    </MenuScreenLayout>
  );
}
