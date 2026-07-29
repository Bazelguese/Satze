/**
 * Stage Contesa live: 4 mani + duello 1v1 di sistema (stessi widget di Codice/satze.jsx).
 */
import React, { useMemo, useState } from 'react';
import { FocusCoinSelector, LogPanel, StatsPanel, Icon } from '../ui';
import { GameCard } from '../cards';
import { MiniBattlefield, BattlefieldPanel } from '../battle';
import { ProductionDuelStage } from '../battle/ProductionDuelStage';
import { useProductionDuelPresentation } from '../battle/useProductionDuelPresentation';
import { BattlefieldReveal } from '../gallery/BattlefieldRevealAnimations';
import { getBattlefieldAnimationType } from '../../data/battlefields';
import { DUEL_AGENT_PANEL_OFFSET_X, DUEL_PANEL_LAYOUT } from '../../config/duelClashLayout';
import { ARENA_SEAT_CORNERS } from '../../config/arenaContesaLayout';
import { getAbilityExplanation } from '../../data/triggers';
import { resolvePublicAssetUrl } from '../../utils/preloadAssets';
import { PALETTE, HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette';
import {
  ARENA_CONTESA,
  ARENA_PHASES,
  ARENA_PHASE_LABELS,
  getArenaPlayer,
  isLastResponder,
  flipBattleResultForLocal,
} from '../../game/arenaContesa';
import { ArenaSeatHand } from './ArenaSeatHand';

const STAGE_STYLE = {
  width: '1920px',
  height: '1080px',
  minWidth: '1920px',
  minHeight: '1080px',
  maxWidth: '1920px',
  maxHeight: '1080px',
  margin: '0 auto',
  display: 'block',
  backgroundColor: PALETTE.deepVoid,
};

function BannerSilhouette({ filled, color }) {
  const c = color || PALETTE.slate;
  return (
    <svg viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="1.2" strokeLinejoin="round" className="w-full h-full" style={{ opacity: filled ? 1 : 0.5 }}>
      <path d="M4 2h16v16l-4 4-4-4-4 4-4-4v-16z" />
    </svg>
  );
}

function ConquestSlots({ count, accent, slots = ARENA_CONTESA.conquestThreshold }) {
  return (
    <div className="flex items-center justify-center gap-px py-0.5">
      {Array.from({ length: slots }, (_, i) => {
        const filled = i < count && accent;
        const strokeColor = filled ? accent : `${PALETTE.slate}66`;
        return (
          <div
            key={i}
            className="w-[12px] h-[12px] flex items-center justify-center"
            style={{
              background: filled ? `${accent}22` : 'transparent',
              border: `1px solid ${strokeColor}`,
              borderRadius: '2px',
            }}
          >
            <BannerSilhouette filled={Boolean(filled)} color={filled ? accent : strokeColor} />
          </div>
        );
      })}
    </div>
  );
}

function ResponseOverlay({ match, onPass, onContest, interactive }) {
  const responding = getArenaPlayer(match, match.responseCursor);
  const field = match.fieldPool.find((f) => f.id === match.contestedFieldId);
  const last = isLastResponder(match);
  const lastPlayer = last
    ? responding
    : getArenaPlayer(match, (match.responseQueue || [])[(match.responseQueue || []).length - 1]);
  if (!responding) return null;
  return (
    <div className="absolute inset-0 z-[40] flex items-center justify-center pointer-events-auto" style={{ background: 'rgba(8,6,18,0.55)' }}>
      <div
        className="satze-hud-panel w-[520px] max-w-[90%] p-6 text-center"
        style={{ fontFamily: HUD_ORATORIO_FONT_UI, border: `1.5px solid ${responding.accent}` }}
      >
        <div className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: PALETTE.textSecondary }}>
          Turno di risposta
        </div>
        <div className="text-2xl font-bold mb-1" style={{ color: responding.accent }}>
          {responding.name}
        </div>
        <p className="text-sm mb-2" style={{ color: PALETTE.textPrimary }}>
          Contesta <span style={{ color: PALETTE.amber }}>{field?.name || 'il Campo'}</span>
          {last ? '.' : ' o passa.'}
        </p>
        <p className="text-sm mb-4" style={{ color: PALETTE.textSecondary }}>
          {last ? (
            <>
              Non puoi passare: sei l&apos;ultimo risponditore{' '}
              <span style={{ color: responding.accent, fontWeight: 700 }}>
                ({responding.name})
              </span>
              .
            </>
          ) : (
            <>
              L&apos;ultimo risponditore{' '}
              <span style={{ color: lastPlayer?.accent || PALETTE.amber, fontWeight: 700 }}>
                ({lastPlayer?.name || '—'})
              </span>
              {' '}non può passare.
            </>
          )}
        </p>
        {interactive ? (
          <div className="flex gap-3 justify-center">
            <button type="button" className="satze-tool-btn-primary px-6 py-3 text-base" onClick={onContest}>
              Contesta
            </button>
            <button
              type="button"
              className="satze-tool-btn-secondary px-6 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onPass}
              disabled={last}
              title={last ? `${responding.name} non può passare` : 'Passa'}
            >
              Passa
            </button>
          </div>
        ) : (
          <div className="text-xs" style={{ color: PALETTE.textSecondary }}>IA sta decidendo…</div>
        )}
      </div>
    </div>
  );
}

function seatRole(playerId, phase, callerId, contestantId, responseCursor) {
  if (playerId === callerId) return 'Chiamante';
  if (
    contestantId &&
    playerId === contestantId &&
    phase !== ARENA_PHASES.SCELTA_CAMPO &&
    phase !== ARENA_PHASES.CHIAMATA &&
    phase !== ARENA_PHASES.RISPOSTE
  ) {
    return 'Contestatore';
  }
  if (phase === ARENA_PHASES.RISPOSTE && playerId === responseCursor) return 'Risponde';
  return null;
}

function toSeatView(player) {
  return {
    ...player,
    fields: player.fieldsWon ?? 0,
  };
}

export function ArenaContesaDuelStage({
  match,
  selectedFocus = 4,
  onSelectedFocusChange,
  onSelectField,
  onSelectAgent,
  onConfirmFocus,
  onRespond,
  onDuelPresentationComplete,
  isHumanTurn = false,
  maxFocus = 14,
}) {
  const [previewCard, setPreviewCard] = useState(null);
  const [hoveredField, setHoveredField] = useState(null);

  // Come satze: fase battle (pannelli vuoti) → result (spawn + timeline)
  const inDuelPhase = match?.phase === ARENA_PHASES.DUELLO;
  const duelResultActive = inDuelPhase && Boolean(match?.battleResult);
  // Destra = sempre tu (come duello di sistema). Se sei Contestatore, ribalta i lati.
  const displayBattleResult = useMemo(() => {
    if (!duelResultActive || !match?.battleResult) return null;
    if (match.contestantId === match.localPlayerId) {
      return flipBattleResultForLocal(match.battleResult);
    }
    return match.battleResult;
  }, [duelResultActive, match?.battleResult, match?.contestantId, match?.localPlayerId]);

  const duelPres = useProductionDuelPresentation({
    battleResult: displayBattleResult,
    active: duelResultActive,
    onComplete: onDuelPresentationComplete,
  });

  if (!match) {
    return (
      <div className="relative flex items-center justify-center" style={STAGE_STYLE}>
        <div className="satze-hud-panel px-6 py-4 text-sm" style={{ color: PALETTE.textSecondary }}>
          Avvia una partita Contesa
        </div>
      </div>
    );
  }

  const local = getArenaPlayer(match, match.localPlayerId);
  const caller = getArenaPlayer(match, match.callerId);
  const contestant = match.contestantId ? getArenaPlayer(match, match.contestantId) : null;
  const isLocalCaller = local?.id === caller?.id;

  const activeField =
    match.fieldPool.find((f) => f.id === match.contestedFieldId) ||
    ((match.phase === ARENA_PHASES.DUELLO || match.phase === ARENA_PHASES.SOSTITUZIONE)
      ? match.battleResult?.field
      : null) ||
    match.fieldPool[0] ||
    null;
  const fieldBgImage = activeField?.bgImage || null;
  const entranceAnimationType = activeField
    ? getBattlefieldAnimationType(activeField.id)
    : 'default';

  const callerAgent =
    caller?.hand?.find((c) => c.id === match.callerAgentId) ||
    match.battleResult?.playerAgent ||
    null;
  const contestantAgent =
    contestant?.hand?.find((c) => c.id === match.contestantAgentId) ||
    match.battleResult?.enemyAgent ||
    null;

  // Pre-duello: niente GameCard in DUELLO (spawn ufficiale via ProductionDuelStage)
  const showCallerCard =
    Boolean(callerAgent) &&
    [ARENA_PHASES.CHIAMATA, ARENA_PHASES.RISPOSTE, ARENA_PHASES.CONTESTAZIONE].includes(match.phase);
  const showContestantCard =
    Boolean(contestantAgent) && match.phase === ARENA_PHASES.CONTESTAZIONE;

  const playerCard = isLocalCaller
    ? (showCallerCard ? callerAgent : null)
    : (showContestantCard ? contestantAgent : null);
  const enemyCard = isLocalCaller
    ? (showContestantCard ? contestantAgent : null)
    : (showCallerCard ? callerAgent : null);

  const playerAccent = isLocalCaller ? caller?.accent : contestant?.accent;
  const enemyAccent = isLocalCaller ? contestant?.accent : caller?.accent;
  const playerStats = isLocalCaller ? caller : contestant || local;
  const enemyStats = isLocalCaller ? contestant : caller;

  const showFcFlip =
    isHumanTurn &&
    (match.phase === ARENA_PHASES.CHIAMATA || match.phase === ARENA_PHASES.CONTESTAZIONE) &&
    Boolean(isLocalCaller ? match.callerAgentId : match.contestantAgentId);

  // Mapping fasi UI satze: battle (vuoto) / result (duello sistema) / select*
  const gamePhase = duelResultActive
    ? 'result'
    : inDuelPhase
      ? 'battle'
      : match.phase === ARENA_PHASES.SCELTA_CAMPO
        ? 'selectField'
        : 'selectAgent';

  const {
    duelPhase,
    visualEffectStep,
    playerFocusCoinsShown,
    enemyFocusCoinsShown,
    playerCardGlow,
    enemyCardGlow,
    showClashAnimation,
    isZoomed: duelZoomed,
    duelVfx,
    vfxProfile,
    getFocusCoinGlowColor,
    skipDuel,
    continueAfterDuel,
  } = duelPres;

  // Durante battle i pannelli restano non-zoomati; allo spawn result zoom come resolveBattle
  const isZoomed = duelResultActive ? duelZoomed : false;
  const displayPreview = previewCard || (playerCard ? { agent: playerCard } : null);
  const enemyOffset = DUEL_AGENT_PANEL_OFFSET_X.enemy.normal;
  const playerOffset = DUEL_AGENT_PANEL_OFFSET_X.player.normal;
  const battlefieldPanelHalfH = 140;
  const arenaChromeFading = inDuelPhase;

  const victoryLabel =
    match.giro >= ARENA_CONTESA.maxGiro
      ? 'Supremazia: più PV a fine Giro'
      : `Conquista ${ARENA_CONTESA.conquestThreshold} Campi`;

  const activeSeatIds = new Set([match.callerId]);
  if (match.contestantId) activeSeatIds.add(match.contestantId);
  if (match.responseCursor) activeSeatIds.add(match.responseCursor);

  const poolForBoard = (() => {
    // Mostra fino a 5 campi: contestato (anche appena conquistato in duello) + liberi
    const free = match.fieldPool.filter((f) => !match.conqueredByFieldId[f.id]);
    const contestedId = match.contestedFieldId;
    const contested =
      free.find((f) => f.id === contestedId) ||
      (contestedId && match.battleResult?.field?.id === contestedId
        ? match.battleResult.field
        : null);
    const rest = free.filter((f) => f.id !== contestedId);
    const ordered = contested ? [contested, ...rest] : rest;
    return ordered.slice(0, 5);
  })();

  const handlePreview = (data) => {
    if (!data?.agent) return;
    setPreviewCard(data);
  };

  const canHumanPickField =
    isHumanTurn && match.phase === ARENA_PHASES.SCELTA_CAMPO && local?.id === match.callerId;
  const canHumanPickAgent =
    isHumanTurn &&
    (match.phase === ARENA_PHASES.CHIAMATA || match.phase === ARENA_PHASES.CONTESTAZIONE) &&
    (local?.id === match.callerId || local?.id === match.contestantId);

  const selectedBySeat = {
    [match.callerId]: match.callerAgentId,
    ...(match.contestantId ? { [match.contestantId]: match.contestantAgentId } : {}),
  };

  return (
    <div className="relative overflow-hidden" style={STAGE_STYLE}>
      {fieldBgImage && (
        <div key={fieldBgImage} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <BattlefieldReveal imageSrc={fieldBgImage} animationType={entranceAnimationType} />
        </div>
      )}

      {/* Conquista — alto centro, stretto tra le mani alte */}
      <div
        className={`absolute left-1/2 pointer-events-none ${arenaChromeFading ? 'animate-fade-out-panels' : ''}`}
        style={{ top: 36, transform: 'translateX(-50%)', zIndex: 12, width: 252, fontFamily: HUD_ORATORIO_FONT_UI }}
      >
        <div className="px-1.5 py-1 satze-hud-panel">
          <div className="text-[9px] font-bold text-center uppercase tracking-[0.1em] mb-1" style={{ color: PALETTE.amber }}>
            {victoryLabel}
          </div>
          <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5">
            {match.players.map((p) => (
              <div key={p.id} className="min-w-0">
                <div className="text-[9px] text-center truncate font-semibold" style={{ color: p.accent, opacity: p.eliminated ? 0.4 : 1 }}>
                  {p.seat} {p.name}
                </div>
                <ConquestSlots count={p.fieldsWon} accent={p.accent} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Giro subito sopra il pannello campo centrale */}
      <div
        className={`absolute left-1/2 pointer-events-none ${arenaChromeFading ? 'animate-fade-out-panels' : ''}`}
        style={{
          top: `calc(50% - ${battlefieldPanelHalfH}px - 6px)`,
          transform: 'translate(-50%, -100%)',
          zIndex: 11,
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        <div className="flex flex-col items-center px-3 py-1.5 satze-hud-panel">
          <span className="font-bold text-sm uppercase tracking-wider" style={{ color: PALETTE.amber }}>
            Giro {match.giro}/{ARENA_CONTESA.maxGiro} · Contesa
          </span>
          <span className="text-[11px]" style={{ color: PALETTE.textSecondary }}>
            {ARENA_PHASE_LABELS[match.phase] || match.phase}
            {caller ? ` · Call: ${caller.name}` : ''}
          </span>
        </div>
      </div>

      {/* Anteprima — fascia centrale SX (tra mani alte/basse) */}
      <div
        className={`absolute flex flex-col overflow-visible ${arenaChromeFading ? 'animate-fade-out-panels pointer-events-none' : ''}`}
        style={{ left: 36, top: 360, width: 220, height: 240, zIndex: 4, fontFamily: HUD_ORATORIO_FONT_UI }}
      >
        <div className="p-2 flex flex-col overflow-hidden satze-hide-scrollbar satze-hud-panel flex-1">
          <div className="text-[11px] font-bold mb-1 uppercase tracking-[0.14em]" style={{ color: PALETTE.textPrimary }}>
            Anteprima
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col items-center">
            {displayPreview?.agent ? (
              <div className="flex flex-col items-center w-full scale-[0.62] origin-top">
                <GameCard agent={displayPreview.agent} disabled />
                {displayPreview.agent.ability && (() => {
                  const fullText = getAbilityExplanation(displayPreview.agent.ability);
                  if (!fullText) return null;
                  return (
                    <p className="mt-2 text-[11px] leading-snug px-1" style={{ color: PALETTE.textSecondary }}>
                      {fullText}
                    </p>
                  );
                })()}
              </div>
            ) : hoveredField ? (
              <div className="text-center p-2">
                <div className="text-sm font-bold" style={{ color: PALETTE.textPrimary }}>{hoveredField.name}</div>
                <div className="text-xs mt-1" style={{ color: PALETTE.amber }}>{hoveredField.effect}</div>
              </div>
            ) : (
              <div className="text-center text-[11px] py-6" style={{ color: PALETTE.textSecondary }}>
                Clicca una carta
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log / FC — stesso flip+copy del duello (satze.jsx colonna destra) */}
      <div
        className={`absolute flex flex-col overflow-visible ${arenaChromeFading ? 'animate-fade-out-panels-right pointer-events-none' : ''}`}
        style={{ right: 36, top: 360, width: 240, height: 280, zIndex: 4, fontFamily: HUD_ORATORIO_FONT_UI }}
      >
        <div className={`satze-panel-flip-container flex-1 min-h-0 h-full ${gamePhase === 'result' ? 'pointer-events-none' : ''}`}>
          <div className={`satze-panel-flip-inner h-full ${showFcFlip ? 'satze-panel-flipped' : ''}`}>
            <div className="satze-panel-flip-face h-full">
              <LogPanel
                logs={match.logs}
                gamePhase={gamePhase === 'battle' ? 'selectAgent' : gamePhase}
                playerColor={playerAccent || '#4FD1C5'}
                enemyColor={enemyAccent || '#D946EF'}
                className="h-full"
              />
            </div>
            <div
              className="satze-panel-flip-face satze-panel-flip-face-back p-2 flex flex-col overflow-hidden items-center justify-start pt-4 satze-hide-scrollbar satze-fc-panel rounded-3xl h-full"
              style={{
                background: `linear-gradient(135deg, rgba(10, 14, 26, 0.88) 0%, rgba(15, 23, 42, 0.85) 100%), url(${resolvePublicAssetUrl('/Immagini_bg/CampoFC_bg.webp')}) center/cover no-repeat`,
                border: '2px solid #000',
                boxShadow: '3px 3px 0 #000',
                fontFamily: HUD_ORATORIO_FONT_UI,
              }}
            >
              {(() => {
                const reserved = Math.max(0, (local?.hand?.filter((c) => !local.usedIds.includes(c.id)).length || 1) - 1);
                const maxFC = Math.max(1, (local?.focus ?? maxFocus) - reserved);
                const t = maxFC <= 1 ? 1 : Math.max(0, Math.min(1, (selectedFocus - 1) / (maxFC - 1)));
                const [r1, g1, b1] = [148, 163, 184];
                const [r2, g2, b2] = [255, 224, 130];
                const r = Math.round(r1 + (r2 - r1) * t);
                const g = Math.round(g1 + (g2 - g1) * t);
                const b = Math.round(b1 + (b2 - b1) * t);
                const base = '255, 224, 130';
                const innerAlpha = 0.05 + t * 0.85;
                const midBlur = 1 + t * 10;
                const midAlpha = 0.02 + t * 0.58;
                const outerBlur = 2 + t * 36;
                const outerAlpha = 0.01 + t * 0.55;
                const stroke = '0 1px 2px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,1)';
                const glow = `0 0 2px rgba(${base}, ${innerAlpha}), 0 0 ${midBlur}px rgba(${base}, ${midAlpha}), 0 0 ${outerBlur}px rgba(${base}, ${outerAlpha})`;
                return (
                  <div
                    className="text-base font-bold uppercase tracking-[0.2em] mb-1 transition-all duration-300"
                    style={{
                      WebkitFontSmoothing: 'antialiased',
                      color: `rgb(${r},${g},${b})`,
                      textShadow: `${stroke}, ${glow}`,
                    }}
                  >
                    Quanto vale questo Agente?
                  </div>
                );
              })()}
              <FocusCoinSelector
                value={selectedFocus}
                onChange={onSelectedFocusChange}
                max={local?.focus ?? maxFocus}
                reserved={Math.max(0, (local?.hand?.filter((c) => !local.usedIds.includes(c.id)).length || 1) - 1)}
                agent={playerCard}
                accentColor={local?.accent}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pool Campi — basso centro, tra le due mani inferiori */}
      <div
        className={`absolute left-1/2 ${arenaChromeFading ? 'animate-fade-out-panels pointer-events-none' : ''}`}
        style={{ bottom: 28, transform: 'translateX(-50%)', zIndex: 10, width: 420, height: 280, fontFamily: HUD_ORATORIO_FONT_UI }}
      >
        <div className="p-2 flex flex-col h-full satze-hud-panel">
          <div className="text-[11px] font-bold mb-1 text-center uppercase tracking-[0.12em]" style={{ color: PALETTE.textPrimary }}>
            Pool Campi ({match.fieldPool.filter((f) => !match.conqueredByFieldId[f.id]).length})
          </div>
          <div className="grid grid-rows-5 grid-cols-1 gap-1 flex-1 min-h-0">
            {poolForBoard.map((field) => {
              const conquered = match.conqueredByFieldId[field.id];
              const owner = conquered ? getArenaPlayer(match, conquered.winnerId) : null;
              return (
                <MiniBattlefield
                  key={field.id}
                  field={field}
                  selected={match.contestedFieldId === field.id}
                  conquered={Boolean(conquered)}
                  conqueredBy={conquered?.army}
                  conqueredAccent={owner?.accent || null}
                  hidden={false}
                  turnsUntilReveal={0}
                  onClick={canHumanPickField ? () => onSelectField?.(field.id) : undefined}
                  onHover={setHoveredField}
                />
              );
            })}
            {poolForBoard.length === 0 && (
              <div className="text-[11px] text-center py-4" style={{ color: PALETTE.textSecondary }}>
                Pool esaurito
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 mani — fade come satze durante battle/result */}
      {match.players.map((p) => {
        const corner = ARENA_SEAT_CORNERS[p.seat];
        const role = seatRole(p.id, match.phase, match.callerId, match.contestantId, match.responseCursor);
        return (
          <ArenaSeatHand
            key={p.id}
            player={toSeatView(p)}
            corner={corner}
            role={role}
            isActive={activeSeatIds.has(p.id) && !p.eliminated}
            isLocal={p.id === match.localPlayerId}
            selectedAgentId={selectedBySeat[p.id] || null}
            usedIds={p.usedIds}
            onPreview={handlePreview}
            onSelectAgent={
              canHumanPickAgent && p.id === local?.id
                ? (agentId) => onSelectAgent?.(agentId)
                : undefined
            }
            className={arenaChromeFading ? 'animate-fade-out-hands' : ''}
          />
        );
      })}

      <BattlefieldPanel
        field={activeField}
        gamePhase={gamePhase === 'battle' ? 'selectAgent' : gamePhase}
        isPlayerFirst
        isZoomed={isZoomed}
        selectedAgent={inDuelPhase ? null : playerCard}
        onConfirm={() => onConfirmFocus?.(selectedFocus)}
        awaitingEnemySelection={
          match.phase === ARENA_PHASES.CONTESTAZIONE && isLocalCaller
        }
        isOnlinePvP
        duelPhase={duelResultActive ? duelPhase : 0}
        battleResult={duelResultActive ? displayBattleResult : null}
        onSkipDuel={duelResultActive ? skipDuel : undefined}
        onContinue={duelResultActive ? continueAfterDuel : undefined}
        gameResult={null}
        onMenu={() => {}}
      />

      {/* Duello di sistema: battle (vuoto) → result (spawn ufficiale). Destra = sempre tu. */}
      {inDuelPhase ? (
        <ProductionDuelStage
          mode={duelResultActive ? 'result' : 'battle'}
          battleResult={displayBattleResult}
          duelPhase={duelPhase}
          duelEffectStep={visualEffectStep}
          duelVfx={duelVfx}
          vfxProfile={vfxProfile}
          isZoomed={isZoomed}
          playerFocusCoinsShown={playerFocusCoinsShown}
          enemyFocusCoinsShown={enemyFocusCoinsShown}
          playerCardGlow={playerCardGlow}
          enemyCardGlow={enemyCardGlow}
          showClashAnimation={showClashAnimation}
          getFocusCoinGlowColor={getFocusCoinGlowColor}
          enemyLabel={match.contestantId === match.localPlayerId ? 'Chiamante' : 'Contestatore'}
          playerLabel="Tu"
        />
      ) : (
        <>
          <div
            className="absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(${enemyOffset}px, -50%)`,
              width: `${DUEL_PANEL_LAYOUT.width}px`,
              height: `${DUEL_PANEL_LAYOUT.height}px`,
              zIndex: 5,
            }}
          >
            <div className="text-red-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">
              {isLocalCaller ? 'Contestatore' : 'Chiamante'}
            </div>
            {enemyCard ? (
              <GameCard agent={enemyCard} onHover={(data) => handlePreview(data)} />
            ) : (
              <div className="text-slate-500 text-sm text-center">In attesa…</div>
            )}
          </div>

          <div
            className="absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(${playerOffset}px, -50%)`,
              width: `${DUEL_PANEL_LAYOUT.width}px`,
              height: `${DUEL_PANEL_LAYOUT.height}px`,
              zIndex: 5,
            }}
          >
            <div className="text-blue-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">
              {isLocalCaller ? 'Chiamante' : 'Contestatore'}
            </div>
            {playerCard ? (
              <div className="pointer-events-auto">
                <GameCard agent={playerCard} onHover={(data) => handlePreview(data)} />
              </div>
            ) : (
              <div className="w-44 h-64 border-2 border-dashed rounded-xl flex items-center justify-center border-green-500/30 text-slate-500 text-sm text-center p-4">
                Schiera
              </div>
            )}
          </div>
        </>
      )}

      <div className={arenaChromeFading ? 'animate-fade-out-panels pointer-events-none' : undefined}>
        {enemyStats && (
          <StatsPanel
            label={isLocalCaller ? 'Contestatore' : 'Chiamante'}
            hp={enemyStats.hp}
            focus={enemyStats.focus}
            position="top-left"
            gamePhase={gamePhase === 'battle' ? 'selectAgent' : gamePhase}
            accentColor={enemyAccent}
          />
        )}
        {playerStats && (
          <StatsPanel
            label={isLocalCaller ? 'Tu · Chiamante' : local?.id === match.contestantId ? 'Tu · Contestatore' : 'Tu'}
            hp={local?.hp ?? playerStats.hp}
            focus={local?.focus ?? playerStats.focus}
            position="bottom-right"
            gamePhase={gamePhase === 'battle' ? 'selectAgent' : gamePhase}
            accentColor={local?.accent || playerAccent}
          />
        )}
      </div>

      {match.phase === ARENA_PHASES.RISPOSTE && (
        <ResponseOverlay
          match={match}
          interactive={isHumanTurn && match.responseCursor === match.localPlayerId}
          onContest={() => onRespond?.('contest')}
          onPass={() => onRespond?.('pass')}
        />
      )}

      {match.phase === ARENA_PHASES.SOSTITUZIONE && (
        <div className="absolute inset-0 z-[35] flex items-center justify-center pointer-events-none">
          <div className="satze-hud-panel px-5 py-3 text-center" style={{ fontFamily: HUD_ORATORIO_FONT_UI }}>
            <div className="text-sm font-bold flex items-center justify-center gap-2" style={{ color: PALETTE.amber }}>
              <Icon name="lightning" type="cardIcon" size={16} />
              Sostituzione dalla Riserva
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
