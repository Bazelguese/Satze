import React from 'react';
import { createPortal } from 'react-dom';
import { GUIDED_UI } from '../../data/tutorialGuidedContent';

export function GuidedTutorialOverlay({
  isActive,
  guidedMatch,
  guidedCallouts,
  guidedInstruction,
  guidedHint,
  showGuidedTrianglesHighlight,
  isGuidedIntroWelcomePhase,
  isGuidedIntroHandsPhase,
  isGuidedIntroPreviewPhase,
  isGuidedIntroBattlefieldsPhase,
  raiseAboveGlossary = false,
  onIntroContinue,
}) {
  if (!isActive) return null;
  const calloutZIndex = raiseAboveGlossary ? 70 : GUIDED_UI.goalCallout.zIndex;
  const lineZIndex = raiseAboveGlossary ? 69 : 17;
  const phaseKey = `${guidedMatch?.trackId || 'none'}::${guidedInstruction?.title || ''}::${guidedInstruction?.lines?.join('|') || ''}::${guidedHint || ''}`;
  const fadeBlockStyle = (delay = 0) => ({
    animation: `fade-in 540ms ease ${delay}ms both`,
  });

  const content = (
    <>
      <div
        className="fixed inset-0 pointer-events-none"
        style={GUIDED_UI.overlay}
      />
      {showGuidedTrianglesHighlight && (
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
              pointerEvents: callout.id === 'goal' ? 'auto' : 'none',
            }}
          >
            <div
              className="px-5 py-4 rounded-xl border backdrop-blur-sm"
              style={GUIDED_UI.goalCallout.cardStyle}
            >
              <div
                className="uppercase text-fuchsia-200 font-semibold"
                style={{ ...GUIDED_UI.goalCallout.headerStyle, ...fadeBlockStyle(40) }}
                key={`guided-header-${phaseKey}`}
              >
                {callout.icon} Partita guidata {guidedMatch.trackId === 'advanced' ? 'avanzata' : 'introduttiva'}
              </div>
              {callout.id === 'goal' ? (
                <div
                  className="text-slate-100/95 mt-2"
                  style={{ fontSize: '1rem', lineHeight: 1.35 }}
                >
                  <span style={{ fontWeight: 400 }}>{callout.title}: </span>
                  <span style={{ fontWeight: 700 }}>{callout.text}</span>
                </div>
              ) : (
                <>
                  <div
                    className="font-bold text-slate-100 mt-2"
                    style={{ ...GUIDED_UI.goalCallout.titleStyle, ...fadeBlockStyle(120) }}
                    key={`guided-title-${phaseKey}`}
                  >
                    {callout.title}
                  </div>
                  <div
                    className="text-slate-100/95 mt-2"
                    style={{ ...GUIDED_UI.goalCallout.textStyle, ...fadeBlockStyle(200) }}
                    key={`guided-text-${phaseKey}`}
                  >
                    {callout.text}
                  </div>
                </>
              )}
              {callout.id === 'goal' && Array.isArray(guidedInstruction?.lines) && guidedInstruction.lines.length > 0 && (
                <ul
                  className="mt-5 text-slate-100/95 space-y-2"
                  style={GUIDED_UI.goalCallout.listStyle}
                  key={`guided-lines-${phaseKey}`}
                >
                  {guidedInstruction.lines.slice(0, 5).map((line, index) => (
                    <li key={`guided-line-${phaseKey}-${index}`} style={fadeBlockStyle(300 + index * 220)}>- {line}</li>
                  ))}
                </ul>
              )}
              {callout.id === 'goal' && guidedHint && (
                <div
                  className="text-amber-300 mt-2"
                  style={{ ...GUIDED_UI.goalCallout.hintStyle, ...fadeBlockStyle(1420) }}
                  key={`guided-hint-${phaseKey}`}
                >
                  {guidedHint}
                </div>
              )}
              {callout.id === 'goal' && (isGuidedIntroWelcomePhase || isGuidedIntroHandsPhase || isGuidedIntroPreviewPhase || isGuidedIntroBattlefieldsPhase) && (
                <div className="mt-4" style={fadeBlockStyle(1540)} key={`guided-button-${phaseKey}`}>
                  <button
                    type="button"
                    onClick={onIntroContinue}
                    className="px-5 py-2 rounded-lg border text-lg font-semibold"
                    style={GUIDED_UI.goalCallout.continueButtonStyle}
                  >
                    OK, continua
                  </button>
                </div>
              )}
            </div>
          </div>
          {callout.line && (
            <div className="text-[11px] uppercase tracking-[0.16em] text-fuchsia-300">
              <div
                className="fixed pointer-events-none"
                style={{
                  zIndex: lineZIndex,
                  left: callout.line.left,
                  right: callout.line.right,
                  top: callout.line.top,
                  bottom: callout.line.bottom,
                  width: callout.line.width,
                  height: 2,
                  background: 'linear-gradient(90deg, rgba(236,72,153,0.08), rgba(236,72,153,0.9))',
                  transform: `${callout.line.transform || ''} rotate(${callout.line.rotate || 0}deg)`.trim(),
                  transformOrigin: 'left center',
                  boxShadow: '0 0 6px rgba(236,72,153,0.6)',
                }}
              />
              <div
                className="fixed rounded-full pointer-events-none"
                style={{
                  zIndex: lineZIndex,
                  left: callout.line.left,
                  right: callout.line.right,
                  top: callout.line.top,
                  bottom: callout.line.bottom,
                  width: 6,
                  height: 6,
                  background: 'rgba(236,72,153,0.95)',
                  boxShadow: '0 0 8px rgba(236,72,153,0.85)',
                  transform: callout.line.transform || undefined,
                }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
  return createPortal(content, document.body);
}
