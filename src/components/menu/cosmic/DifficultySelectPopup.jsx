import { Icon } from '../../ui/Icon';
import { getAllDifficulties } from '../../../utils';
import { MENU_ACCENTS, HUD_ORATORIO_FONT_DISPLAY, HUD_ORATORIO_FONT_UI, PALETTE } from '../../../theme/hudOratorioPalette';

export function DifficultySelectPopup({
  isOpen,
  onClose,
  onSelect,
  armyName,
  deckName,
  accentColor = MENU_ACCENTS.magenta,
}) {
  if (!isOpen) return null;

  const difficulties = getAllDifficulties();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative mx-4 max-w-3xl w-full border-2 rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: accentColor,
          background: 'linear-gradient(180deg, #0c0614 0%, #140f22 48%, #080612 100%)',
          boxShadow: `0 0 36px ${accentColor}55, 0 0 72px rgba(88, 28, 135, 0.2)`,
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(74, 63, 102, 0.55)', background: `${accentColor}12` }}
        >
          <div>
            <h2
              className="text-2xl font-bold"
              style={{
                fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                color: PALETTE.textPrimary,
                textShadow: `0 0 22px ${accentColor}70, 0 2px 4px #000`,
              }}
            >
              Scegli la difficoltà
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {armyName}
              {deckName ? ` · "${deckName}"` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-fuchsia-200 transition-colors text-2xl leading-none"
            aria-label="Chiudi scelta difficoltà"
          >
            ×
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              type="button"
              onClick={() => onSelect(diff.id)}
              className="text-left rounded-xl p-4 border transition-all hover:-translate-y-0.5"
              style={{
                borderColor: `${diff.color}66`,
                background: 'linear-gradient(180deg, rgba(20,8,28,0.95) 0%, rgba(8,7,13,0.95) 100%)',
                boxShadow: `0 0 16px ${diff.color}22`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon name={diff.icon} type="cardIcon" size={28} />
                <div>
                  <p
                    className="text-base font-semibold"
                    style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY, color: diff.color }}
                  >
                    {diff.name}
                  </p>
                  <p className="text-xs text-slate-400">{diff.description}</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 m-0">{diff.longDescription}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
