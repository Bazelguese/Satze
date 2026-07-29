/**
 * Arena Contesa — istanza Dev a schermo intero (come una partita vera).
 * Entry: STRUMENTI DEV → ARENA CONTESA → armata → ?arenaContesa=1&army=…
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameViewport } from '../GameViewport';
import { ArenaContesaDuelStage } from './ArenaContesaDuelStage';
import { useArenaContesaGame } from './useArenaContesaGame';
import { ARMY_SETS } from '../../data/cards';
import { ARENA_CONTESA, ARENA_PHASE_LABELS, ARENA_PHASES, getArenaPlayer } from '../../game/arenaContesa';
import {
  PALETTE,
  HUD_ORATORIO_FONT_UI,
  injectSatzeUiFonts,
} from '../../theme/hudOratorioPalette';

function readLaunchArmy() {
  if (typeof window === 'undefined') return null;
  const army = new URLSearchParams(window.location.search).get('army');
  if (army && Object.prototype.hasOwnProperty.call(ARMY_SETS, army)) return army;
  return null;
}

export function ArenaContesaLayoutPage({ onClose }) {
  const game = useArenaContesaGame();
  const startedRef = useRef(false);
  const [humanArmy, setHumanArmy] = useState('');

  const launchArmy = useMemo(() => readLaunchArmy(), []);
  const startMatch = game.startMatch;

  useEffect(() => {
    injectSatzeUiFonts();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    html.style.backgroundColor = PALETTE.deepVoid;
    body.style.backgroundColor = PALETTE.deepVoid;
    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const army =
      launchArmy ||
      Object.keys(ARMY_SETS)[Math.floor(Math.random() * Object.keys(ARMY_SETS).length)];
    setHumanArmy(army);
    startMatch({ humanArmy: army });
  }, [startMatch, launchArmy]);

  const restart = () => {
    const army = humanArmy || readLaunchArmy() || Object.keys(ARMY_SETS)[0];
    setHumanArmy(army);
    startMatch({ humanArmy: army });
  };

  const phaseLabel = game.match
    ? ARENA_PHASE_LABELS[game.match.phase] || game.match.phase
    : 'Avvio…';

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ backgroundColor: PALETTE.deepVoid, fontFamily: HUD_ORATORIO_FONT_UI }}
    >
      <GameViewport>
        <div className="relative" style={{ width: 1920, height: 1080 }}>
          <ArenaContesaDuelStage
            match={game.match}
            selectedFocus={game.selectedFocus}
            onSelectedFocusChange={game.setSelectedFocus}
            onSelectField={game.onSelectField}
            onSelectAgent={game.onSelectAgent}
            onConfirmFocus={game.onConfirmFocus}
            onRespond={game.onRespond}
            onDuelPresentationComplete={game.onDuelPresentationComplete}
            isHumanTurn={game.isHumanTurn}
            maxFocus={game.maxFocus}
          />

          {/* Chrome Dev minimale — in-canvas, non ToolPageShell */}
          <div
            className="absolute pointer-events-auto flex items-center gap-2"
            style={{ top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}
          >
            <div
              className="satze-hud-panel px-3 py-1 flex items-center gap-3"
              style={{ fontFamily: HUD_ORATORIO_FONT_UI }}
            >
              <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: PALETTE.textSecondary }}>
                Dev · Contesa
              </span>
              <span className="text-xs font-semibold" style={{ color: PALETTE.amber }}>
                {phaseLabel}
              </span>
              {game.match && (
                <span className="text-[11px]" style={{ color: PALETTE.textSecondary }}>
                  Giro {game.match.giro}/{ARENA_CONTESA.maxGiro}
                  {game.actingPlayer ? ` · ${game.actingPlayer.name}` : ''}
                  {game.isHumanTurn ? ' · tuo turno' : ''}
                </span>
              )}
            </div>
          </div>

          <div
            className="absolute pointer-events-auto flex gap-2"
            style={{ top: 8, right: 12, zIndex: 60 }}
          >
            <button
              type="button"
              onClick={restart}
              className="satze-hud-panel px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:brightness-110"
              style={{ color: PALETTE.amber, fontFamily: HUD_ORATORIO_FONT_UI }}
            >
              Nuova
            </button>
            <button
              type="button"
              onClick={onClose}
              className="satze-hud-panel px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:brightness-110"
              style={{ color: PALETTE.textPrimary, fontFamily: HUD_ORATORIO_FONT_UI }}
            >
              Menu
            </button>
          </div>

          {game.match?.phase === ARENA_PHASES.GAME_OVER && (
            <div
              className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-auto"
              style={{ background: 'rgba(8,6,18,0.55)' }}
            >
              <div className="satze-hud-panel px-10 py-8 text-center" style={{ fontFamily: HUD_ORATORIO_FONT_UI }}>
                <div className="text-xs uppercase tracking-[0.16em] mb-2" style={{ color: PALETTE.textSecondary }}>
                  Fine partita · {game.match.winReason}
                </div>
                <div className="text-4xl font-bold mb-6" style={{ color: PALETTE.amber }}>
                  {getArenaPlayer(game.match, game.match.winnerId)?.name || '—'}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={restart}
                    className="satze-tool-btn-primary px-5 py-2.5 text-sm"
                  >
                    Nuova partita
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="satze-tool-btn-secondary px-5 py-2.5 text-sm"
                  >
                    Torna al menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </GameViewport>
    </div>
  );
}

export default ArenaContesaLayoutPage;
