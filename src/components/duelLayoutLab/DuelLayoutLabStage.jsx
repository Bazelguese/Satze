/**
 * Stage 1920×1080 — stessa composizione/marker di Codice/satze.jsx (Schermata di gioco).
 * Solo demo state: niente logica partita. Serve a iterare skin / alternative art.
 */
import React, { useMemo, useState } from 'react';
import { GameCard } from '../cards/GameCard';
import { Hand } from '../cards/Hand';
import { MiniBattlefield, BattlefieldPanel } from '../battle';
import { FocusCoinSelector, LogPanel, StatsPanel } from '../ui';
import { ARMY_SETS } from '../../data/cards';
import { ARMY_COLORS } from '../../data/armies';
import { ALL_BATTLEFIELDS } from '../../data/battlefields';
import {
  IA_CARD_POSITIONS,
  PLAYER_CARD_POSITIONS,
} from '../../config/battlefieldHandLayout';
import {
  PALETTE,
  HUD_ORATORIO_FONT_UI,
} from '../../theme/hudOratorioPalette';
import { resolveAltArtClass } from './duelLayoutLabPrefs';

const PLAYER_ARMY = "Figli dell'Orizzonte";
const ENEMY_ARMY = 'Kethran';

function withArmy(cards, army) {
  return (cards || []).slice(0, 5).map((c) => ({ ...c, army }));
}

function BannerSilhouette({ filled, color }) {
  const c = color || PALETTE.slate;
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? c : 'none'}
      stroke={c}
      strokeWidth="1.2"
      strokeLinejoin="round"
      className="w-full h-full"
      style={{ opacity: filled ? 1 : 0.5 }}
    >
      <path d="M4 2h16v16l-4 4-4-4-4 4-4-4v-16z" />
    </svg>
  );
}

function ConquestSlot({ filled, accent }) {
  const isFilled = filled && accent;
  const strokeColor = isFilled ? accent : `${PALETTE.slate}66`;
  return (
    <div
      className="flex-1 aspect-square min-w-[28px] max-w-[40px] flex items-center justify-center p-0.5"
      style={{
        background: isFilled ? `${accent}22` : 'transparent',
        border: `1px solid ${strokeColor}`,
        borderRadius: '4px',
        boxShadow: isFilled ? `0 0 6px ${accent}44` : 'none',
      }}
    >
      <BannerSilhouette filled={isFilled} color={isFilled ? accent : strokeColor} />
    </div>
  );
}

/**
 * @param {{
 *   sty: string,
 *   dep: string,
 *   mov: string,
 *   altArt: string,
 *   phase: 'selectField'|'selectAgent'|'battle',
 *   showAgents: boolean,
 *   showHands: boolean,
 * }} props
 */
export function DuelLayoutLabStage({
  sty,
  dep,
  mov,
  altArt,
  phase,
  showAgents,
  showHands,
}) {
  const [previewAgent, setPreviewAgent] = useState(null);
  const [selectedFieldIdx, setSelectedFieldIdx] = useState(0);

  const demo = useMemo(() => {
    const playerHand = withArmy(ARMY_SETS[PLAYER_ARMY], PLAYER_ARMY);
    const enemyHand = withArmy(ARMY_SETS[ENEMY_ARMY], ENEMY_ARMY);
    const playerAgent = playerHand[0] || null;
    const enemyAgent = enemyHand[0] || null;
    const battlefields = ALL_BATTLEFIELDS.slice(0, 5);
    const playerAccent = ARMY_COLORS[PLAYER_ARMY]?.accent || '#a78bfa';
    const enemyAccent = ARMY_COLORS[ENEMY_ARMY]?.accent || '#f87171';
    return {
      playerHand,
      enemyHand,
      playerAgent,
      enemyAgent,
      battlefields,
      playerAccent,
      enemyAccent,
      field: battlefields[0],
    };
  }, []);

  const {
    playerHand,
    enemyHand,
    playerAgent,
    enemyAgent,
    battlefields,
    playerAccent,
    enemyAccent,
    field,
  } = demo;

  const currentField = battlefields[selectedFieldIdx] || field;
  const altClass = resolveAltArtClass(altArt);
  const gamePhase = phase === 'battle' ? 'selectAgent' : phase;
  const showDeployed = showAgents && phase !== 'selectField';

  const sceneClass = [
    'relative overflow-visible satze-scene imp-center',
    dep,
    mov,
    sty,
    altClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={sceneClass}
      data-duel-layout-lab="1"
      style={{
        width: '1920px',
        height: '1080px',
        minWidth: '1920px',
        minHeight: '1080px',
        maxWidth: '1920px',
        maxHeight: '1080px',
        margin: '0 auto',
        display: 'block',
        backgroundColor: PALETTE.deepVoid,
        '--acc': playerAccent,
        '--acc-en': enemyAccent,
      }}
    >
      <div className="dep-floor" aria-hidden />

      {currentField?.bgImage && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <img
            src={currentField.bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(6,8,14,.35), rgba(6,8,14,.55))' }}
          />
        </div>
      )}

      {/* COLONNA SINISTRA */}
      <div
        className="absolute top-0 left-0 flex flex-col p-4 gap-6 justify-end overflow-visible imp-colL border-r border-slate-600/50"
        style={{
          width: '428px',
          height: '1080px',
          zIndex: 1,
          fontFamily: HUD_ORATORIO_FONT_UI,
          background: 'rgba(10, 14, 26, 0.4)',
        }}
      >
        <div
          className="p-3 mb-4 flex flex-col overflow-hidden satze-hide-scrollbar satze-hud-panel imp-preview"
          style={{ height: '530px', fontFamily: HUD_ORATORIO_FONT_UI, position: 'relative' }}
        >
          <div
            className="text-sm font-bold mb-2 uppercase tracking-[0.15em]"
            style={{ color: PALETTE.textPrimary, textShadow: `0 0 20px ${PALETTE.amber}44, 0 2px 4px #000` }}
          >
            ANTEPRIMA
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col items-center">
            {previewAgent ? (
              <GameCard agent={previewAgent} disabled />
            ) : (
              <div className="text-center text-xs py-8" style={{ color: PALETTE.textSecondary }}>
                Clicca su una carta
                <br />
                per vedere i dettagli
              </div>
            )}
          </div>
        </div>

        <div
          className="block w-full overflow-hidden border rounded-2xl py-3 text-center text-[10px] uppercase tracking-[0.2em]"
          style={{
            border: `1.5px solid ${PALETTE.slate}`,
            background: 'rgba(8,10,18,.7)',
            color: PALETTE.textSecondary,
          }}
          aria-hidden
        >
          Glossario
        </div>
      </div>

      {/* COLONNA DESTRA */}
      <div
        className="absolute top-0 right-0 flex flex-col p-4 gap-6 overflow-visible imp-colR border-l border-slate-600/50"
        style={{
          width: '428px',
          height: '1080px',
          zIndex: 1,
          background: 'rgba(10, 14, 26, 0.4)',
        }}
      >
        <div className="p-2 flex-shrink-0 satze-hud-panel imp-topbar" style={{ fontFamily: HUD_ORATORIO_FONT_UI }}>
          <div className="flex justify-between gap-4 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center gap-2 py-0.5">
                <div className="flex gap-2 flex-1 min-w-0 justify-center">
                  {[0, 1, 2].map((i) => (
                    <ConquestSlot key={`e-${i}`} filled={i < 1} accent={enemyAccent} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center gap-2 py-0.5">
                <div className="flex gap-2 flex-1 min-w-0 justify-center">
                  {[0, 1, 2].map((i) => (
                    <ConquestSlot key={`p-${i}`} filled={i < 2} accent={playerAccent} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div
            className="px-3 py-2 text-center rounded-xl imp-victory"
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: PALETTE.textSecondary }}>
              Condizione di Vittoria
            </div>
            <div
              className="text-sm font-bold leading-tight"
              style={{ color: PALETTE.amber, textShadow: `0 1px 3px #000, 0 0 12px ${PALETTE.amber}44` }}
            >
              Conquista 3 campi!
            </div>
            <div className="text-xs mt-1.5" style={{ color: PALETTE.textSecondary }}>
              Cambierà tra 3 turni
            </div>
          </div>
        </div>

        <div
          className="p-2 -mt-4 flex flex-col h-[300px] satze-hud-panel imp-board imp-fields"
          style={{ fontFamily: HUD_ORATORIO_FONT_UI, position: 'relative' }}
        >
          <div
            className="text-sm font-bold mb-1 text-center uppercase tracking-[0.15em]"
            style={{ color: PALETTE.textPrimary, textShadow: `0 0 20px ${PALETTE.amber}44, 0 2px 4px #000` }}
          >
            Prossima conquista!
          </div>
          <div className="grid grid-rows-5 grid-cols-1 gap-0.5 flex-1 min-h-0">
            {battlefields.map((bf, idx) => {
              const locked = idx >= 3;
              const selected = idx === selectedFieldIdx;
              const rowCls = [
                'imp-row',
                locked ? 'imp-row-locked' : selected ? 'imp-row-sel' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <div
                  key={bf.id}
                  className={rowCls}
                  data-field-slot={idx}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    width: '100%',
                    overflow: 'hidden',
                    '--imp-accent': locked ? PALETTE.slate : PALETTE.amber,
                  }}
                >
                  <MiniBattlefield
                    field={bf}
                    conquered={idx === 4}
                    conqueredBy={idx === 4 ? ENEMY_ARMY : undefined}
                    conqueredAccent={idx === 4 ? enemyAccent : null}
                    hidden={locked}
                    turnsUntilReveal={locked ? idx - 2 : 0}
                    selected={selected}
                    onClick={
                      locked
                        ? undefined
                        : () => {
                            setSelectedFieldIdx(idx);
                          }
                    }
                    onHover={() => {}}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="satze-panel-flip-container">
          <div className="satze-panel-flip-inner">
            <div className="satze-panel-flip-face">
              <LogPanel
                logs={[
                  '[Lab] Composizione ufficiale 1920×1080',
                  '[Lab] Skin switch: stesse coordinate / marker imp-*',
                ]}
                battleEvents={null}
                duelPhase={0}
                currentRound={2}
                gamePhase={gamePhase}
                playerColor={playerAccent}
                enemyColor={enemyAccent}
                localLabel="Tu"
                opponentLabel="IA"
              />
            </div>
            <div
              className="satze-panel-flip-face satze-panel-flip-face-back p-2 flex flex-col overflow-hidden items-center justify-start pt-4 satze-hide-scrollbar satze-fc-panel rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.88) 0%, rgba(15, 23, 42, 0.85) 100%)',
                border: '2px solid #000',
                boxShadow: '3px 3px 0 #000',
                fontFamily: HUD_ORATORIO_FONT_UI,
              }}
            >
              <div className="text-base font-bold uppercase tracking-[0.2em] mb-3" style={{ color: PALETTE.textSecondary }}>
                Focus
              </div>
              <FocusCoinSelector
                value={3}
                max={8}
                onChange={() => {}}
                accentColor={playerAccent}
              />
            </div>
          </div>
        </div>
      </div>

      {showHands && (
        <>
          <div className="imp-hand imp-hand-enemy">
            <Hand
              hand={enemyHand}
              usedCards={[]}
              selectedAgent={showDeployed ? enemyAgent : null}
              onPreviewClick={({ agent }) => setPreviewAgent(agent)}
              cardPositions={IA_CARD_POSITIONS}
              position="top-left"
              label="IA"
              gamePhase={gamePhase}
              disabled
              isActive={false}
            />
          </div>
          <div className="imp-hand imp-hand-player">
            <Hand
              hand={playerHand}
              usedCards={[]}
              selectedAgent={showDeployed ? playerAgent : null}
              onPreviewClick={({ agent }) => setPreviewAgent(agent)}
              onAgentSelect={(agent) => setPreviewAgent(agent)}
              cardPositions={PLAYER_CARD_POSITIONS}
              position="bottom-right"
              label="Tu"
              gamePhase={gamePhase}
              disabled={false}
              isActive={phase === 'selectAgent'}
              isPlayerFirst
            />
          </div>
        </>
      )}

      <div className="dep-stage" aria-hidden />

      <BattlefieldPanel
        field={phase === 'selectField' ? null : currentField}
        gamePhase={phase === 'battle' ? 'selectAgent' : phase}
        isPlayerFirst
        isZoomed={false}
        selectedAgent={showDeployed ? playerAgent : null}
        onConfirm={() => {}}
        duelPhase={0}
        battleResult={null}
        onContinue={() => {}}
        gameResult={null}
        onMenu={() => {}}
      />

      {/* Offset agent panel = Codice/satze.jsx / ProductionDuelStage (DUEL_AGENT_PANEL_OFFSET_X) */}
      {showDeployed && playerAgent && enemyAgent && (
        <>
          <div
            className="absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-380px, -50%)',
              width: '240px',
              height: '400px',
              zIndex: 5,
            }}
          >
            <div className="text-red-400 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">
              Il Nemico
            </div>
            <GameCard agent={enemyAgent} disabled />
          </div>
          <div
            className="absolute bg-transparent border-none rounded-xl flex flex-col items-center justify-center p-5 pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(140px, -50%)',
              width: '240px',
              height: '400px',
              zIndex: 5,
            }}
          >
            <div className="text-cyan-300 text-sm font-bold mb-3 uppercase tracking-wide satze-duel-label">
              L&apos;eroe
            </div>
            <GameCard agent={playerAgent} disabled />
          </div>
        </>
      )}

      <StatsPanel
        label="IA"
        hp={18}
        focus={6}
        toxin={null}
        position="top-left"
        gamePhase={gamePhase}
        accentColor={enemyAccent}
      />
      <StatsPanel
        label="Tu"
        hp={22}
        focus={8}
        toxin={null}
        position="bottom-right"
        gamePhase={gamePhase}
        accentColor={playerAccent}
      />

      <div className="dep-vignette" aria-hidden />
    </div>
  );
}
