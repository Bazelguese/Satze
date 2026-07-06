import { DeckManagerListScreen } from '../../deck';

export function CosmicDeckManagerList(props) {
  return (
    <>
      <style>{`
        .deck-manager-list-root {
          position: absolute !important;
          inset: 0 !important;
          z-index: 50 !important;
          overflow: auto !important;
          width: 100% !important;
          height: 100% !important;
          background:
            radial-gradient(circle at 50% 10%, rgba(255,45,184,0.2) 0%, rgba(168,85,247,0.12) 28%, rgba(8,7,13,1) 70%),
            #08070d !important;
          font-family: 'Chakra Petch', sans-serif !important;
        }
        .deck-manager-list-root h2,
        .deck-manager-list-root .font-bold {
          font-family: 'Cinzel', serif !important;
          letter-spacing: 0.08em;
        }
        .deck-manager-list-root button {
          border-color: rgba(255,45,184,0.45) !important;
          box-shadow: 0 0 0 rgba(0,0,0,0) !important;
          transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease !important;
        }
        .deck-manager-list-root button:hover {
          border-color: rgba(255,45,184,0.85) !important;
          box-shadow: 0 0 24px rgba(255,45,184,0.24) !important;
          transform: translateY(-1px);
        }
        .deck-manager-list-root .cosmic-dm-card {
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          background: linear-gradient(180deg, rgba(20,8,28,0.94) 0%, rgba(8,7,13,0.96) 100%) !important;
          border: 1.5px solid rgba(255,45,184,0.45) !important;
          position: relative;
        }
        .deck-manager-list-root .cosmic-dm-card::after {
          content: '';
          position: absolute;
          inset: 6px;
          border: 1px solid rgba(168,85,247,0.35);
          pointer-events: none;
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
        }
        .deck-manager-list-root .cosmic-dm-create {
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .deck-manager-list-root .cosmic-dm-footer button {
          min-width: 220px;
          padding: 8px 18px;
          font-size: 14px;
          clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
          background: linear-gradient(90deg, rgba(20,8,28,0.95) 0%, rgba(8,7,13,0.95) 100%) !important;
          border: 1.5px solid rgba(255,45,184,0.5) !important;
          color: var(--menu-text) !important;
          letter-spacing: 0.14em;
        }
        .deck-manager-list-root .cosmic-dm-footer button:hover {
          background: linear-gradient(90deg, var(--menu-magenta) 0%, var(--menu-hot-pink) 100%) !important;
          color: var(--menu-void) !important;
          border-color: var(--menu-hot-pink) !important;
        }
        .deck-manager-list-root .text-xs,
        .deck-manager-list-root .text-sm {
          font-family: 'Chakra Petch', sans-serif !important;
          letter-spacing: 0.03em;
        }
      `}</style>
      <DeckManagerListScreen {...props} renderInPortal={false} />
    </>
  );
}
