import React, { useRef, useEffect, useState } from 'react';
import { PALETTE, HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette';
import { resolvePublicAssetUrl } from '../../utils/preloadAssets';
import { formatBattleEvent } from '../../game/duel/formatBattleEvent.js';
import {
  aggregateBattleEvents,
  filterVisibleByReveal,
  getRoundHeaderEvent,
  getRoundOutcomeEvent,
  groupEventsByRound,
  selectDetailEvents,
} from '../../game/duel/battleEventSelectors.js';
import { BATTLE_EVENT_TYPES } from '../../game/duel/battleEventTypes.js';

const TONE_COLORS = {
  local: '#4FD1C5',
  opponent: '#D946EF',
  neutral: '#94a3b8',
  warning: '#f59e0b',
};

function SideMarker({ tone, localColor, enemyColor }) {
  const color =
    tone === 'local' ? localColor : tone === 'opponent' ? enemyColor : TONE_COLORS[tone] || TONE_COLORS.neutral;
  const label = tone === 'local' ? 'L' : tone === 'opponent' ? 'O' : tone === 'warning' ? '!' : '·';
  return (
    <span
      aria-hidden="true"
      className="mr-1 inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-sm text-[8px] font-bold"
      style={{ backgroundColor: `${color}33`, color, border: `1px solid ${color}88` }}
    >
      {label}
    </span>
  );
}

function RoundBlock({
  round,
  events,
  expanded,
  onToggle,
  context,
  localColor,
  enemyColor,
  isCurrent,
}) {
  const header = getRoundHeaderEvent(events);
  const outcome = getRoundOutcomeEvent(events);
  const headerFmt = header ? formatBattleEvent(header, context) : null;
  const outcomeFmt = outcome ? formatBattleEvent(outcome, context) : null;
  const compactRows = aggregateBattleEvents(events, context);
  const detailEvents = selectDetailEvents(events);

  const title =
    headerFmt?.text ||
    `R${round}${header?.field?.name ? ` · ${header.field.name}` : ''}`;

  const localAgent = header?.localAgent?.name || '';
  const oppAgent = header?.opponentAgent?.name || '';
  const vaLine =
    outcome && (outcome.localVA != null || outcome.opponentVA != null)
      ? `${localAgent || context.localLabel} ${outcome.localVA ?? '—'}  vs  ${oppAgent || context.opponentLabel} ${outcome.opponentVA ?? '—'}`
      : localAgent && oppAgent
        ? `${localAgent}  vs  ${oppAgent}`
        : null;

  const outcomeTone = outcomeFmt?.tone || 'neutral';
  const outcomeColor =
    outcomeTone === 'local' ? localColor : outcomeTone === 'opponent' ? enemyColor : PALETTE.textPrimary;

  return (
    <section
      className="mb-2 rounded-xl border px-2 py-1.5"
      style={{
        borderColor: isCurrent ? `${PALETTE.amber}66` : `${PALETTE.slate}66`,
        background: isCurrent ? `${PALETTE.nebula}55` : 'transparent',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-2 text-left"
        aria-expanded={expanded}
        aria-label={`${title}. ${outcomeFmt?.ariaLabel || ''}. ${expanded ? 'Dettaglio aperto' : 'Dettaglio chiuso'}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[11px] font-semibold" style={{ color: PALETTE.textPrimary }}>
              {title}
            </span>
            {outcomeFmt && (
              <span
                className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: outcomeColor }}
              >
                {outcomeFmt.text}
              </span>
            )}
          </div>
          {vaLine && (
            <div className="mt-0.5 truncate text-[10px]" style={{ color: PALETTE.textSecondary }}>
              {vaLine}
            </div>
          )}
        </div>
        <span className="text-[10px]" style={{ color: PALETTE.textSecondary }} aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      <ul className="mt-1 space-y-0.5">
        {(expanded
          ? detailEvents.map((event) => {
              const formatted = formatBattleEvent(event, context);
              return {
                kind: 'row',
                events: [event],
                text: formatted.text,
                formatted,
              };
            })
          : compactRows
        ).map((row, idx) => {
          if (row.kind === 'overflow') {
            return (
              <li key={`ov-${idx}`} className="text-[10px] italic" style={{ color: PALETTE.textSecondary }}>
                <button type="button" onClick={onToggle} className="underline-offset-2 hover:underline">
                  {row.text}
                </button>
              </li>
            );
          }
          const tone = row.formatted?.tone || 'neutral';
          const color =
            tone === 'local' ? localColor : tone === 'opponent' ? enemyColor : TONE_COLORS[tone];
          return (
            <li
              key={row.events[0]?.id || idx}
              className="flex items-start leading-snug"
              style={{ color: PALETTE.textSecondary }}
            >
              <SideMarker tone={tone} localColor={localColor} enemyColor={enemyColor} />
              <span className="min-w-0 flex-1 text-[11px]">
                <span className="font-medium" style={{ color }}>
                  {row.text}
                </span>
              </span>
              <span className="sr-only">{row.formatted?.ariaLabel || row.text}</span>
            </li>
          );
        })}
      </ul>

      {expanded &&
        events
          .filter((e) => e.type === BATTLE_EVENT_TYPES.assaultCalculation)
          .sort((a, b) => a.sequence - b.sequence)
          .map((event) => {
            const side = event.target?.side === 'opponent' ? context.opponentLabel : context.localLabel;
            const mod = event.modifiers || 0;
            return (
              <div
                key={`va-${event.id}`}
                className="mt-1 rounded-md px-1.5 py-1 text-[10px]"
                style={{ background: `${PALETTE.deepVoid}88`, color: PALETTE.textSecondary }}
                aria-label={`${side}: ${event.basePower} per ${event.focus} focus${
                  mod ? `, modificatore ${mod}` : ''
                }${event.floorApplied ? `, minimo ${event.floorValue}` : ''}, VA finale ${event.finalVA}`}
              >
                {side}: {event.basePower}×{event.focus}
                {mod ? ` ${mod > 0 ? '+' : ''}${mod}` : ''}
                {event.floorApplied ? ` · min ${event.floorValue}` : ''} = {event.finalVA} VA
              </div>
            );
          })}
    </section>
  );
}

/**
 * Pannello log battaglia: blocchi per round da eventi strutturati.
 * Fallback `logs` (stringhe) solo per messaggi non-duello / lab legacy.
 */
export const LogPanel = ({
  logs = [],
  battleEvents = null,
  duelPhase = 99,
  gamePhase,
  className = '',
  playerColor = '#4FD1C5',
  enemyColor = '#D946EF',
  localLabel = 'Tu',
  opponentLabel = 'IA',
  currentRound = null,
}) => {
  const logRef = useRef(null);
  const [expandedRound, setExpandedRound] = useState(null);
  const context = { localLabel, opponentLabel };
  const useEvents = Array.isArray(battleEvents);

  const visibleEvents = useEvents
    ? filterVisibleByReveal(battleEvents, gamePhase === 'result' ? duelPhase : 99)
    : [];
  const rounds = useEvents ? groupEventsByRound(visibleEvents) : [];

  useEffect(() => {
    if (!useEvents || visibleEvents.length === 0) {
      setExpandedRound(null);
    }
  }, [useEvents, visibleEvents.length]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [battleEvents, logs, duelPhase, expandedRound]);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl p-2 satze-hide-scrollbar ${
        gamePhase === 'result' ? 'animate-fade-out-panels' : ''
      } ${className}`}
      style={{
        ...(gamePhase === 'result' ? { pointerEvents: 'auto' } : {}),
        background: `linear-gradient(135deg, ${PALETTE.deepVoid}dd 0%, ${PALETTE.nebula}cc 100%), url(${resolvePublicAssetUrl('/Immagini_bg/CampoLOG_bg.webp')}) center/cover no-repeat`,
        border: `1.5px solid ${PALETTE.slate}`,
        boxShadow: `0 2px 8px #000`,
        fontFamily: HUD_ORATORIO_FONT_UI,
      }}
    >
      <div
        className="text-center text-sm font-bold uppercase tracking-[0.15em]"
        style={{
          color: PALETTE.textPrimary,
          textShadow: `0 0 20px ${PALETTE.amber}44, 0 2px 4px #000`,
        }}
      >
        LOG BATTAGLIA
      </div>
      <div
        className="w-full my-1.5"
        style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent 0%, ${PALETTE.slate}88 20%, ${PALETTE.amber}66 50%, ${PALETTE.slate}88 80%, transparent 100%)`,
          boxShadow: `0 0 6px ${PALETTE.amber}22`,
        }}
      />
      <div
        ref={logRef}
        className="flex min-h-0 flex-1 overflow-x-hidden overflow-y-auto text-xs"
        style={{ color: PALETTE.textSecondary }}
      >
        <div className="w-full pb-[40vh]">
          {useEvents ? (
            rounds.length === 0 ? (
              <p className="px-1 text-[11px]" style={{ color: PALETTE.textSecondary }}>
                —
              </p>
            ) : (
              rounds.map(({ round, events }) => (
                <RoundBlock
                  key={round}
                  round={round}
                  events={events}
                  expanded={expandedRound === round}
                  onToggle={() => setExpandedRound((prev) => (prev === round ? null : round))}
                  context={context}
                  localColor={playerColor}
                  enemyColor={enemyColor}
                  isCurrent={currentRound != null && round === currentRound}
                />
              ))
            )
          ) : (
            [...logs.slice(-150)].reverse().map((log, i) => (
              <p key={i} className="leading-relaxed whitespace-pre-wrap text-[11px]">
                {typeof log === 'string' ? log : String(log)}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
