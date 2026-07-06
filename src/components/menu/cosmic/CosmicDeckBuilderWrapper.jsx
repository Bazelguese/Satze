import { SatzeDeckBuilderPrototype } from '../../deck';

export function CosmicDeckBuilderWrapper(props) {
  return (
    <>
      <style>{`
        .satze-deck-builder-root {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 50 !important;
          overflow: auto !important;
          background:
            radial-gradient(circle at 50% 10%, rgba(255,45,184,0.2) 0%, rgba(168,85,247,0.12) 28%, rgba(8,7,13,1) 70%),
            #08070d !important;
          font-family: 'Chakra Petch', sans-serif !important;
        }
        .satze-deck-builder-root.cosmic-builder {
          background:
            radial-gradient(ellipse at 30% 20%, #2a0a3a 0%, #14051f 45%, var(--menu-void) 80%) !important;
          position: relative;
          isolation: isolate;
        }
        .satze-deck-builder-root.cosmic-builder::before {
          content: "ESERCITO";
          position: absolute;
          top: -90px;
          right: -100px;
          font-family: 'Cinzel', serif;
          font-weight: 900;
          font-size: clamp(180px, 20vw, 360px);
          line-height: 0.75;
          color: transparent;
          -webkit-text-stroke: 2px rgba(192, 38, 211, 0.15);
          transform: skewX(-8deg) rotate(-2deg);
          pointer-events: none;
          user-select: none;
          z-index: 0;
        }
        .satze-deck-builder-root.cosmic-builder::after {
          content: "";
          position: absolute;
          top: 112px;
          right: 24px;
          width: 172px;
          height: 4px;
          background: linear-gradient(90deg, rgba(236,72,153,0.88) 0%, rgba(236,72,153,0.65) 25%, rgba(236,72,153,0.45) 50%, rgba(236,72,153,0.25) 75%, rgba(236,72,153,0.12) 100%);
          transform: skewX(-15deg);
          box-shadow: 0 8px 0 rgba(236,72,153,0.26), 0 16px 0 rgba(236,72,153,0.2), 0 24px 0 rgba(236,72,153,0.14), 0 32px 0 rgba(236,72,153,0.08);
          pointer-events: none;
          z-index: 0;
        }
        .satze-deck-builder-root .cosmic-builder-header {
          border-bottom: 1px solid rgba(192,38,211,0.25) !important;
          background: linear-gradient(180deg, rgba(8,3,14,0.88) 0%, rgba(8,3,14,0.45) 100%) !important;
        }
        .satze-deck-builder-root .cosmic-builder-main,
        .satze-deck-builder-root .cosmic-builder-header,
        .satze-deck-builder-root .cosmic-builder-statsbar,
        .satze-deck-builder-root .cosmic-builder-catalog,
        .satze-deck-builder-root .cosmic-builder-deckpanel {
          position: relative;
          z-index: 1;
        }
        .satze-deck-builder-root .cosmic-builder-title {
          font-family: 'Cinzel', serif !important;
          font-weight: 900 !important;
          letter-spacing: 0.32em !important;
          text-transform: uppercase;
          text-shadow: 2px 2px 0 rgba(192,38,211,0.45) !important;
        }
        .satze-deck-builder-root .cosmic-builder-subtitle {
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 0.4em !important;
          color: var(--menu-pink) !important;
          font-size: 10px !important;
          text-transform: uppercase;
        }
        .satze-deck-builder-root .cosmic-builder-header-stats {
          padding: 0 10px;
          border-left: 1px solid rgba(192,38,211,0.25);
          border-right: 1px solid rgba(192,38,211,0.25);
        }
        .satze-deck-builder-root .cosmic-builder-header-actions button,
        .satze-deck-builder-root .cosmic-builder-catalog-toolbar button,
        .satze-deck-builder-root .cosmic-builder-confirmarea button {
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 0.18em !important;
          text-transform: uppercase;
        }
        .satze-deck-builder-root .cosmic-builder-statsbar > div > div:first-child,
        .satze-deck-builder-root .cosmic-builder-deckstats > div > div:first-child,
        .satze-deck-builder-root .cosmic-builder-catalog-toolbar label,
        .satze-deck-builder-root .cosmic-builder-catalog-toolbar span {
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 0.12em;
        }
        .satze-deck-builder-root .cosmic-builder-deckheader,
        .satze-deck-builder-root .cosmic-builder-deckheader * {
          font-family: 'Cinzel', serif !important;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .satze-deck-builder-root .cosmic-builder-decklist > div > div > div,
        .satze-deck-builder-root .cosmic-builder-confirmarea > div {
          font-family: 'Chakra Petch', sans-serif !important;
        }
        .satze-deck-builder-root .cosmic-builder-main {
          background: linear-gradient(180deg, rgba(8,3,14,0.28) 0%, rgba(8,3,14,0.12) 100%);
          border-top: 1px solid rgba(192,38,211,0.18);
        }
        .satze-deck-builder-root .cosmic-builder-catalog-toolbar {
          box-shadow: inset 0 -1px 0 rgba(192,38,211,0.18);
        }
        .satze-deck-builder-root .cosmic-builder-deckpanel {
          box-shadow: 0 0 30px rgba(192,38,211,0.25), inset 0 0 60px rgba(0,0,0,0.55) !important;
        }
        .satze-deck-builder-root .cosmic-builder-statsbar,
        .satze-deck-builder-root .cosmic-builder-catalog-toolbar {
          background: rgba(14,5,24,0.8) !important;
          border-color: rgba(192,38,211,0.25) !important;
        }
        .satze-deck-builder-root .cosmic-builder-main {
          gap: 14px;
        }
        .satze-deck-builder-root .cosmic-builder-filters {
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 0.08em;
        }
        .satze-deck-builder-root .cosmic-filter-label {
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 0.26em !important;
          color: #94a3b8 !important;
          font-size: 10px !important;
        }
        .satze-deck-builder-root .cosmic-filter-btn,
        .satze-deck-builder-root .cosmic-sort-btn {
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 0.15em;
          border-color: rgba(192,38,211,0.35) !important;
          color: #a78bfa !important;
          background: transparent !important;
        }
        .satze-deck-builder-root .cosmic-filter-btn:hover,
        .satze-deck-builder-root .cosmic-sort-btn:hover {
          border-color: rgba(236,72,153,0.8) !important;
          box-shadow: 0 0 12px rgba(236,72,153,0.22) !important;
        }
        .satze-deck-builder-root .cosmic-filter-select {
          border-color: rgba(192,38,211,0.35) !important;
          background: #0e0518 !important;
          color: #a78bfa !important;
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 0.08em;
        }
        .satze-deck-builder-root .cosmic-cards-found {
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 0.16em;
          color: var(--menu-pink) !important;
          text-transform: uppercase;
        }
        .satze-deck-builder-root .cosmic-builder-grid {
          gap: 10px !important;
          grid-template-columns: 1fr 1fr !important;
          background: linear-gradient(180deg, rgba(14,5,24,0.24) 0%, rgba(8,3,14,0.08) 100%);
        }
        .satze-deck-builder-root .cosmic-catalog-row {
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px) !important;
          border-color: rgba(192,38,211,0.35) !important;
        }
        .satze-deck-builder-root .cosmic-builder-catalog {
          position: relative;
        }
        .satze-deck-builder-root .cosmic-builder-catalog::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(192,38,211,0.14) 1px, transparent 1.6px);
          background-size: 8px 8px;
          opacity: 0.16;
          pointer-events: none;
          z-index: 0;
        }
        .satze-deck-builder-root .cosmic-builder-catalog > * {
          position: relative;
          z-index: 1;
        }
        .satze-deck-builder-root .satze-deck-army-btn {
          clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%) !important;
          border: 1px solid rgba(192,38,211,0.35) !important;
          background: linear-gradient(180deg, rgba(20,8,28,0.9) 0%, rgba(8,7,13,0.9) 100%) !important;
          width: 100% !important;
          min-width: 0 !important;
          padding: 8px 6px !important;
          display: flex !important;
          justify-content: center;
          align-items: center;
          gap: 4px !important;
          overflow: hidden;
        }
        .satze-deck-builder-root .satze-deck-army-btn:hover {
          border-color: rgba(236,72,153,0.85) !important;
          box-shadow: 0 0 16px rgba(192,38,211,0.3) !important;
        }
        .satze-deck-builder-root .satze-deck-army-btn span {
          max-width: 100% !important;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px !important;
        }
        .satze-deck-builder-root .cosmic-builder-armies {
          align-items: stretch;
        }
        .satze-deck-builder-root .cosmic-army-count {
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 0.08em;
          border: 1px solid rgba(236,72,153,0.35);
          background: rgba(236,72,153,0.18) !important;
          color: var(--menu-pink) !important;
        }
        .satze-deck-builder-root .cosmic-builder-deckpanel {
          background: linear-gradient(180deg, #0e0518 0%, var(--menu-void) 100%) !important;
          border: 1px solid rgba(192,38,211,0.5) !important;
          box-shadow: 0 0 30px rgba(192,38,211,0.2), inset 0 0 40px rgba(0,0,0,0.45) !important;
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%) !important;
        }
        .satze-deck-builder-root .cosmic-builder-deckheader {
          border-bottom: 1px dashed rgba(192,38,211,0.45) !important;
        }
        .satze-deck-builder-root .cosmic-builder-deckstats {
          border-bottom: 1px dashed rgba(192,38,211,0.3) !important;
        }
        .satze-deck-builder-root .cosmic-deck-row {
          border-left: 3px solid var(--menu-pink) !important;
          border-color: rgba(192,38,211,0.45) !important;
        }
        .satze-deck-builder-root .cosmic-builder-confirmarea {
          border-top-color: rgba(192,38,211,0.4) !important;
          background: rgba(8,3,14,0.8) !important;
        }
        .satze-deck-builder-root h1,
        .satze-deck-builder-root .font-bold {
          font-family: 'Cinzel', serif !important;
          letter-spacing: 0.08em;
        }
        .satze-deck-builder-root button {
          transition: box-shadow 0.2s ease, border-color 0.2s ease !important;
        }
        .satze-deck-builder-root button:hover {
          box-shadow: 0 0 20px rgba(255,45,184,0.2);
        }
        .satze-deck-builder-root .satze-deck-btn-small,
        .satze-deck-builder-root .satze-deck-btn-confirm {
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          border: 1.5px solid rgba(255,45,184,0.55) !important;
          background: linear-gradient(180deg, rgba(20,8,28,0.95) 0%, rgba(8,7,13,0.95) 100%) !important;
        }
        .satze-deck-builder-root .satze-deck-btn-confirm:hover,
        .satze-deck-builder-root .satze-deck-btn-small:hover {
          border-color: var(--menu-hot-pink) !important;
          box-shadow: 0 0 24px rgba(255,45,184,0.3) !important;
        }
      `}</style>
      <SatzeDeckBuilderPrototype {...props} />
    </>
  );
}
