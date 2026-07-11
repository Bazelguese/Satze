import React from 'react';
import { createPortal } from 'react-dom';
import {
  ADV_STAGE_GOAL,
  ADV_STAGE_TRIGGERS,
  GUIDED_COPY,
  GUIDED_UI,
  INTRO_STAGE_PLAY,
} from '../../data/tutorialGuidedContent';

const INTRO_OK_STAGES = new Set([0, 1, 3, 6, 7, 8]);

function resolveShowOkButton({
  isGuidedOkContinuePhase,
  isGuidedAckPause,
  isGuidedDuelPause,
  guidedMatch,
  guidedIntroStage,
  gamePhase,
}) {
  if (isGuidedAckPause || isGuidedDuelPause) return true;
  if (isGuidedOkContinuePhase) return true;
  if (!guidedMatch?.active || gamePhase !== 'selectField' || guidedMatch.freePlay) return false;
  if (guidedMatch.trackId === 'intro') {
    return INTRO_OK_STAGES.has(guidedIntroStage) && guidedIntroStage < INTRO_STAGE_PLAY;
  }
  if (guidedMatch.trackId === 'advanced') {
    return guidedIntroStage === ADV_STAGE_GOAL || guidedIntroStage === ADV_STAGE_TRIGGERS;
  }
  return false;
}

export function GuidedTutorialOverlay({
  isActive,
  guidedMatch,
  guidedCallouts,
  guidedInstruction,
  guidedHint,
  showGuidedTrianglesHighlight,
  isGuidedOkContinuePhase,
  isGuidedAckPause = false,
  isGuidedDuelPause = false,
  isGuidedIntroEpiloguePhase,
  isGuidedIntroFreePlayFinalPhase,
  isGuidedAdvancedEpiloguePhase,
  guidedIntroStage = 0,
  gamePhase = 'selectField',
  overlayMode = 'hidden',
  raiseAboveGlossary = false,
  onIntroContinue,
  onIntroEpiloguePlay,
  onIntroEpilogueEnd,
  onIntroFreePlayFinalClose,
  onAdvancedEpilogueClose,
}) {
  const showOkButton = resolveShowOkButton({
    isGuidedOkContinuePhase,
    isGuidedAckPause,
    isGuidedDuelPause,
    guidedMatch,
    guidedIntroStage,
    gamePhase,
  });

  if (!isActive || overlayMode === 'hidden') return null;

  const isCompact = overlayMode === 'compact';
  const isBlocking = overlayMode === 'blocking';
  const isDuelScene = gamePhase === 'battle' || gamePhase === 'result';
  const calloutInteractive = isBlocking || (isCompact && isGuidedDuelPause);
  const calloutZIndex = raiseAboveGlossary ? 70 : (isCompact ? 12 : GUIDED_UI.goalCallout.zIndex);
  const lineZIndex = raiseAboveGlossary ? 69 : 17;
  const phaseKey = `${guidedMatch?.trackId || 'none'}::${guidedIntroStage}::${overlayMode}::${guidedInstruction?.title || ''}::${guidedHint || ''}`;
  const maxLines = isCompact ? (gamePhase === 'battle' || gamePhase === 'result' ? 4 : 3) : 8;

  const intro = GUIDED_COPY.intro;
  const advanced = GUIDED_COPY.advanced;

  const content = (
    <>
      {isBlocking && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={GUIDED_UI.overlay}
        />
      )}
      {showGuidedTrianglesHighlight && isBlocking && (
        <>
          <div
            className="fixed pointer-events-none"
            style={{ ...GUIDED_UI.trianglesHighlight.common, ...GUIDED_UI.trianglesHighlight.topLeft }}
          />
          <div
            className="fixed pointer-events-none"
            style={{ ...GUIDED_UI.trianglesHighlight.common, ...GUIDED_UI.trianglesHighlight.bottomRight }}
          />
        </>
      )}
      {guidedCallouts.map((callout) => (
        <React.Fragment key={callout.id}>
          <div
            className="fixed"
            style={{
              ...callout.style,
              zIndex: calloutZIndex,
              pointerEvents: calloutInteractive && callout.id === 'goal' ? 'auto' : 'none',
            }}
          >
            <div
              className="px-4 py-3 rounded-xl border backdrop-blur-sm"
              style={{
                ...GUIDED_UI.goalCallout.cardStyle,
                ...(isCompact
                  ? {
                      borderColor: isDuelScene
                        ? 'rgba(251, 191, 36, 0.45)'
                        : 'rgba(244, 114, 182, 0.35)',
                      background: 'rgba(2, 6, 18, 0.88)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
                    }
                  : {}),
              }}
            >
              {!isCompact && (
                <div
                  className="uppercase text-fuchsia-200 font-semibold"
                  style={GUIDED_UI.goalCallout.headerStyle}
                  key={`guided-header-${phaseKey}`}
                >
                  {callout.icon} Partita guidata {guidedMatch.trackId === 'advanced' ? 'avanzata' : 'introduttiva'}
                </div>
              )}
              {callout.id === 'goal' ? (
                <div
                  className="text-slate-100/95"
                  style={{ fontSize: isCompact ? '0.92rem' : '1rem', lineHeight: 1.35, marginTop: isCompact ? 0 : 8 }}
                >
                  {isCompact ? (
                    <span style={{ fontWeight: 600 }}>{guidedInstruction?.title}</span>
                  ) : (
                    <>
                      <span style={{ fontWeight: 400 }}>{callout.title}: </span>
                      <span style={{ fontWeight: 700 }}>{callout.text}</span>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="font-bold text-slate-100 mt-2" style={GUIDED_UI.goalCallout.titleStyle}>
                    {callout.title}
                  </div>
                  <div className="text-slate-100/95 mt-2" style={GUIDED_UI.goalCallout.textStyle}>
                    {callout.text}
                  </div>
                </>
              )}
              {callout.id === 'goal' && Array.isArray(guidedInstruction?.lines) && guidedInstruction.lines.length > 0 && (
                <ul
                  className={`text-slate-100/95 space-y-1 ${isCompact ? 'mt-2' : 'mt-5'}`}
                  style={{ ...GUIDED_UI.goalCallout.listStyle, fontSize: isCompact ? '0.88rem' : GUIDED_UI.goalCallout.listStyle.fontSize }}
                  key={`guided-lines-${phaseKey}`}
                >
                  {guidedInstruction.lines.slice(0, maxLines).map((line, index) => (
                    <li key={`guided-line-${phaseKey}-${index}`}>- {line}</li>
                  ))}
                </ul>
              )}
              {callout.id === 'goal' && guidedHint && (
                <div className="text-amber-300 mt-2" style={GUIDED_UI.goalCallout.hintStyle} key={`guided-hint-${phaseKey}`}>
                  {guidedHint}
                </div>
              )}
              {callout.id === 'goal' && showOkButton && (
                <div className="mt-4" key={`guided-button-${phaseKey}`}>
                  <button
                    type="button"
                    onClick={onIntroContinue}
                    className="px-5 py-2 rounded-lg border text-lg font-semibold"
                    style={GUIDED_UI.goalCallout.continueButtonStyle}
                  >
                    {isGuidedAckPause || isGuidedDuelPause ? intro.ackContinueButton : 'OK, continua'}
                  </button>
                </div>
              )}
              {callout.id === 'goal' && isGuidedIntroEpiloguePhase && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onIntroEpiloguePlay}
                    className="px-5 py-2 rounded-lg border text-lg font-semibold"
                    style={GUIDED_UI.goalCallout.continueButtonStyle}
                  >
                    {intro.epiloguePlayButton}
                  </button>
                  <button
                    type="button"
                    onClick={onIntroEpilogueEnd}
                    className="px-5 py-2 rounded-lg border text-base font-semibold"
                    style={GUIDED_UI.goalCallout.secondaryButtonStyle}
                  >
                    {intro.epilogueEndButton}
                  </button>
                </div>
              )}
              {callout.id === 'goal' && isGuidedIntroFreePlayFinalPhase && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={onIntroFreePlayFinalClose}
                    className="px-5 py-2 rounded-lg border text-lg font-semibold"
                    style={GUIDED_UI.goalCallout.continueButtonStyle}
                  >
                    Torna al menu
                  </button>
                </div>
              )}
              {callout.id === 'goal' && isGuidedAdvancedEpiloguePhase && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={onAdvancedEpilogueClose}
                    className="px-5 py-2 rounded-lg border text-lg font-semibold"
                    style={GUIDED_UI.goalCallout.continueButtonStyle}
                  >
                    {advanced.advEpilogueButton}
                  </button>
                </div>
              )}
            </div>
          </div>
        </React.Fragment>
      ))}
    </>
  );
  return createPortal(content, document.body);
}
