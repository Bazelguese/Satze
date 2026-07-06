// ============================================
// COMPONENTE: Tutorial
// Tutorial interattivo introduttivo al gioco
// ============================================

import { useEffect } from 'react';
import { MENU_ACCENTS, PALETTE, HUD_ORATORIO_FONT_UI, HUD_ORATORIO_FONT_DISPLAY } from '../../theme/hudOratorioPalette';

export function Tutorial({ isActive, currentStep, onNext, onPrevious, onClose, onComplete, onGoToStep, steps }) {
  if (!isActive) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Gestione tasti freccia
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight' && !isLast) {
        onNext();
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        onPrevious();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, isFirst, isLast, onNext, onPrevious, onClose]);

  const primaryBtn = {
    fontFamily: HUD_ORATORIO_FONT_UI,
    fontWeight: 600,
    padding: '10px 20px',
    borderRadius: '10px',
    border: `1.5px solid ${MENU_ACCENTS.magenta}`,
    color: MENU_ACCENTS.void,
    background: `linear-gradient(90deg, ${MENU_ACCENTS.magenta} 0%, #a855f7 50%, ${MENU_ACCENTS.pink} 100%)`,
    boxShadow: '0 0 20px rgba(192, 38, 211, 0.35)',
    cursor: 'pointer',
  };

  const secondaryBtn = {
    fontFamily: HUD_ORATORIO_FONT_UI,
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '10px',
    border: `1.5px solid ${PALETTE.slate}`,
    color: PALETTE.textSecondary,
    background: 'rgba(17, 11, 32, 0.9)',
    cursor: 'pointer',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative mx-4 max-w-2xl w-full overflow-hidden border-2"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #0c0614 0%, #140f22 48%, #080612 100%)',
          borderColor: MENU_ACCENTS.magenta,
          boxShadow: '0 0 36px rgba(192, 38, 211, 0.35), 0 0 72px rgba(88, 28, 135, 0.2)',
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        <div
          className="p-6 shrink-0"
          style={{
            borderBottom: `1px solid rgba(74, 63, 102, 0.55)`,
            background: 'rgba(192, 38, 211, 0.06)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-2xl font-bold"
              style={{
                fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                color: PALETTE.textPrimary,
                textShadow: '0 0 22px rgba(236, 72, 153, 0.45), 0 2px 4px #000',
              }}
            >
              {step.title}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-fuchsia-200 transition-colors text-2xl leading-none"
              aria-label="Chiudi tutorial"
            >
              ×
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ background: 'rgba(17, 11, 32, 0.95)', border: `1px solid ${PALETTE.slate}` }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  background: `linear-gradient(90deg, ${MENU_ACCENTS.magenta}, ${MENU_ACCENTS.pink})`,
                  boxShadow: '0 0 12px rgba(236, 72, 153, 0.5)',
                }}
              />
            </div>
            <span className="text-sm text-slate-400 min-w-[60px] text-right tabular-nums">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto satze-hide-scrollbar">
          <div className="text-slate-300 leading-relaxed">
            {step.content}
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-4 p-4 shrink-0"
          style={{
            borderTop: `1px solid rgba(74, 63, 102, 0.5)`,
            background: 'rgba(8, 6, 18, 0.55)',
          }}
        >
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirst}
            style={{
              ...secondaryBtn,
              opacity: isFirst ? 0.45 : 1,
              cursor: isFirst ? 'not-allowed' : 'pointer',
            }}
          >
            ← Indietro
          </button>

          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onGoToStep?.(index)}
                className="rounded-full transition-all"
                style={{
                  width: index === currentStep ? 24 : 8,
                  height: 8,
                  background:
                    index === currentStep
                      ? `linear-gradient(90deg, ${MENU_ACCENTS.magenta}, ${MENU_ACCENTS.pink})`
                      : index < currentStep
                        ? 'rgba(236, 72, 153, 0.45)'
                        : 'rgba(71, 85, 105, 0.6)',
                  cursor: onGoToStep ? 'pointer' : 'default',
                }}
                aria-label={`Passo ${index + 1}`}
                aria-current={index === currentStep ? 'step' : undefined}
              />
            ))}
          </div>

          {isLast ? (
            <button type="button" onClick={onComplete} style={primaryBtn}>
              Inizia a Giocare! 🎮
            </button>
          ) : (
            <button type="button" onClick={onNext} style={primaryBtn}>
              Avanti →
            </button>
          )}
        </div>

        <div
          className="px-4 py-2 text-center text-xs text-slate-500"
          style={{ borderTop: `1px solid rgba(51, 65, 85, 0.45)`, background: MENU_ACCENTS.void }}
        >
          Usa ← → per navigare • ESC per chiudere
        </div>
      </div>
    </div>
  );
}
