// ============================================
// CAMPAIGN MENU - Prototipo campagna (mappa + meta + ricompense)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  CAMPAIGN_LEVELS,
  loadCampaignProgress,
  isLevelUnlocked,
  acknowledgeCampaignRewards,
  CAMPAIGN_MISSION_TYPE_LABELS,
  CAMPAIGN_DIFFICULTY_LABELS,
} from '../../data/campaign';
import { ARMY_COLORS } from '../../data';
import { PALETTE, HUD_ORATORIO_FONT_UI, HUD_ORATORIO_FONT_DISPLAY, injectSatzeUiFonts } from '../../theme/hudOratorioPalette';

function MetaPressureBar({ label, value, colorClass }) {
  const pct = Math.round(Math.max(0, Math.min(100, value)));
  return (
    <div className="flex-1 min-w-[120px]">
      <div className="flex justify-between text-[10px] uppercase tracking-wide mb-0.5 text-slate-500">
        <span>{label}</span>
        <span className="text-slate-400">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden border border-slate-600/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CampaignMenu({ onStartLevel, onClose }) {
  const [progress, setProgress] = useState(() => loadCampaignProgress(0));

  const refresh = useCallback(() => {
    setProgress(loadCampaignProgress(0));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    injectSatzeUiFonts();
  }, []);

  const handleLevelClick = (level) => {
    if (!isLevelUnlocked(level, progress.completedLevels)) return;
    onStartLevel(level);
  };

  const handleDismissRewards = () => {
    acknowledgeCampaignRewards();
    refresh();
  };

  const completionPercentage = Math.round(
    (progress.completedLevels.length / CAMPAIGN_LEVELS.length) * 100
  );

  const meta = progress.meta || {};
  const showRewardsGate = meta.segment === 'rewards';
  const missionTypeLabel = (t) => CAMPAIGN_MISSION_TYPE_LABELS[t] || t || 'Standard';
  const difficultyLabel = (d) => CAMPAIGN_DIFFICULTY_LABELS[d] || d || '';

  const panelStyle = {
    background: `linear-gradient(135deg, ${PALETTE.nebula}aa 0%, ${PALETTE.deepVoid}ee 100%)`,
    borderColor: `${PALETTE.slate}aa`,
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-[95vw] border-2"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(180deg, ${PALETTE.deepVoid} 0%, ${PALETTE.nebula} 50%, ${PALETTE.nebulaFloor} 100%)`,
          borderColor: '#c026d3',
          boxShadow: '0 0 32px rgba(192, 38, 211, 0.35), 0 0 64px rgba(88, 28, 135, 0.2)',
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 gap-4">
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{
                  fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                  color: PALETTE.textPrimary,
                  textShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
                }}
              >
                Campagna
              </h2>
              <p className="text-slate-300 text-sm">
                Completati:{' '}
                <span className="text-fuchsia-400 font-bold">{progress.completedLevels.length}</span>/
                <span className="text-slate-400">{CAMPAIGN_LEVELS.length}</span>{' '}
                <span className="text-slate-500">({completionPercentage}%)</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-2xl transition-colors shrink-0 text-slate-400 hover:text-fuchsia-300"
              style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY }}
            >
              ✕
            </button>
          </div>

          {/* Meta-layer prototipo: giorno, pressione, faglie */}
          <div className="mb-4 rounded-lg border p-3 flex flex-wrap gap-4 items-stretch" style={panelStyle}>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 text-xs uppercase tracking-wide">Giorno</span>
              <span className="font-bold tabular-nums text-fuchsia-300">{meta.day ?? 1}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 text-xs uppercase tracking-wide">Faglie</span>
              <span className="font-bold tabular-nums text-fuchsia-400">{meta.rifts ?? 0}</span>
            </div>
            <div className="flex flex-1 flex-wrap gap-3 min-w-[200px]">
              <MetaPressureBar
                label="Pressione (tu)"
                value={meta.pressure?.player ?? 0}
                colorClass="bg-gradient-to-r from-rose-600 to-orange-500"
              />
              <MetaPressureBar
                label="Pressione (mondo)"
                value={meta.pressure?.world ?? 0}
                colorClass="bg-gradient-to-r from-violet-600 to-cyan-500"
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-5 h-3 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
            <div
              className="h-full transition-all duration-500 shadow-lg"
              style={{
                width: `${completionPercentage}%`,
                background: 'linear-gradient(90deg, #c026d3, #a855f7, #ec4899)',
                boxShadow: '0 0 14px rgba(236, 72, 153, 0.45)',
              }}
            />
          </div>

          {/* Schermata ricompense post-vittoria (segment meta) */}
          {showRewardsGate && (
            <div
              className="mb-5 rounded-lg border p-4"
              style={{
                borderColor: 'rgba(192, 38, 211, 0.45)',
                background: 'rgba(17, 11, 32, 0.55)',
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: '#ec4899' }}>
                Missione completata — ricompense
              </h3>
              <p className="text-slate-400 text-sm mb-3">
                Il meta-livello è aggiornato (giorno, pressione, magazzino). Continua per tornare alla mappa.
              </p>
              {Array.isArray(meta.warehouse) && meta.warehouse.length > 0 && (
                <ul className="text-sm text-slate-300 space-y-1 mb-4 max-h-32 overflow-y-auto border border-slate-700/50 rounded p-2 bg-black/20">
                  {meta.warehouse.map((item) => (
                    <li key={item.id} className="flex gap-2">
                      <span className="text-fuchsia-400/90">◆</span>
                      <span>{item.label || item.kind}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={handleDismissRewards}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-colors text-[#06030a]"
                style={{
                  border: '1.5px solid #c026d3',
                  background: 'linear-gradient(90deg, #c026d3, #a855f7)',
                  boxShadow: '0 0 16px rgba(192, 38, 211, 0.35)',
                }}
              >
                Continua alla mappa
              </button>
            </div>
          )}

          {/* Lista livelli */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {CAMPAIGN_LEVELS.map((level, index) => {
              const isCompleted = progress.completedLevels.includes(level.id);
              const isNext = index === progress.completedLevels.length;
              const canPlay = isLevelUnlocked(level, progress.completedLevels);

              return (
                <div
                  key={level.id}
                  className={`flex-shrink-0 p-4 rounded-lg border-2 transition-all flex flex-col ${
                    !canPlay
                      ? 'opacity-45 border-slate-800 bg-slate-900/80 cursor-not-allowed'
                      : isCompleted
                        ? 'border-green-500/50 bg-green-950/20 cursor-pointer'
                        : isNext
                          ? 'ring-2 ring-fuchsia-500/50 bg-fuchsia-950/20 border-fuchsia-500/50 cursor-pointer'
                          : 'bg-slate-800 border-slate-700 hover:border-fuchsia-500/45 cursor-pointer'
                  }`}
                  onClick={() => handleLevelClick(level)}
                  style={{
                    width: '206px',
                    height: '430px',
                    ...(!isCompleted && !isNext
                      ? {
                          backgroundColor: ARMY_COLORS[level.playerArmy]
                            ? `${ARMY_COLORS[level.playerArmy].accent}15`
                            : undefined,
                          borderColor: ARMY_COLORS[level.playerArmy]
                            ? `${ARMY_COLORS[level.playerArmy].accent}40`
                            : undefined,
                        }
                      : {}),
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isCompleted ? 'bg-green-500 text-black' : 'bg-gradient-to-br from-fuchsia-600 to-violet-600 text-white'
                      }`}
                    >
                      {isCompleted ? '✓' : level.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{level.name}</h3>
                    </div>
                    {!canPlay && (
                      <span className="px-2 py-1 bg-slate-700/80 text-slate-400 text-xs font-bold rounded flex-shrink-0">
                        BLOCCATO
                      </span>
                    )}
                    {canPlay && isNext && (
                      <span className="px-2 py-1 bg-fuchsia-500/20 text-fuchsia-300 text-xs font-bold rounded flex-shrink-0">
                        PROSSIMO
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-green-400 text-lg flex-shrink-0">✓</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-600/60">
                      {missionTypeLabel(level.missionType)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/90 text-fuchsia-200/90 border border-fuchsia-600/40">
                      {difficultyLabel(level.difficulty)}
                    </span>
                  </div>

                  <p className="text-slate-400 text-sm mb-4 line-clamp-4 flex-1">{level.description}</p>

                  <div className="text-sm mt-auto">
                    <span style={{ color: ARMY_COLORS[level.enemyArmy]?.accent || '#64748b' }}>
                      🎖️ {level.enemyArmy}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
