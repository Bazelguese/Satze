import { HUD_ORATORIO_FONT_DISPLAY, HUD_ORATORIO_FONT_UI, PALETTE } from '../../theme/hudOratorioPalette';

export function TutorialSelector({ isOpen, onClose, onSelect, tracks }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative mx-4 max-w-4xl w-full border-2 rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: '#c026d3',
          background: 'linear-gradient(180deg, #0c0614 0%, #140f22 48%, #080612 100%)',
          boxShadow: '0 0 36px rgba(192, 38, 211, 0.35), 0 0 72px rgba(88, 28, 135, 0.2)',
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(74, 63, 102, 0.55)', background: 'rgba(192, 38, 211, 0.06)' }}
        >
          <div>
            <h2
              className="text-2xl font-bold"
              style={{
                fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                color: PALETTE.textPrimary,
                textShadow: '0 0 22px rgba(236, 72, 153, 0.45), 0 2px 4px #000',
              }}
            >
              Scegli il percorso tutorial
            </h2>
            <p className="text-sm text-slate-400 mt-1">Puoi ripeterli quando vuoi dal menu principale.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-fuchsia-200 transition-colors text-2xl leading-none"
            aria-label="Chiudi scelta tutorial"
          >
            ×
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelect(track.id)}
              className="text-left rounded-xl p-4 border transition-all hover:-translate-y-0.5"
              style={{
                borderColor: 'rgba(192, 38, 211, 0.35)',
                background: 'rgba(17, 11, 32, 0.8)',
              }}
            >
              <p className="text-lg font-semibold text-fuchsia-200">{track.title}</p>
              <p className="text-xs text-fuchsia-300 mt-1">{track.duration}</p>
              <p className="text-sm text-slate-300 mt-3">{track.description}</p>
              <p className="text-xs text-slate-500 mt-4">Avvia percorso</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
