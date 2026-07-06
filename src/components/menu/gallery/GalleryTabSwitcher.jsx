/**
 * Tab Agenti / Campi — controllo segmentato in evidenza (barra mode galleria).
 */
export function GalleryTabSwitcher({ activeTab, onTabChange, agentCount, fieldCount }) {
  const tabs = [
    { id: 'agents', label: 'AGENTI', count: agentCount },
    { id: 'battlefields', label: 'CAMPI', count: fieldCount },
  ];

  return (
    <div className="gallery-mode-switch" role="tablist" aria-label="Sezione galleria">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(tab.id)}
            className={`gallery-mode-switch-btn ${active ? 'on' : ''}`}
          >
            <span className="lbl">{tab.label}</span>
            <span className="cnt">{tab.count}</span>
          </button>
        );
      })}
      <style>{`
        .gallery-mode-switch {
          display: inline-flex; align-items: stretch;
          gap: 0; padding: 3px;
          background: rgba(3,4,6,0.92);
          border: 1.5px solid rgba(245,243,236,0.2);
          box-shadow: 0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .gallery-mode-switch-btn {
          display: inline-flex; flex-direction: row; align-items: baseline; justify-content: center;
          gap: 7px; min-width: 118px; padding: 7px 16px;
          background: transparent; border: none; cursor: pointer;
          font-family: 'Share Tech Mono', monospace;
          color: rgba(245,243,236,0.48);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s;
          clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
        }
        .gallery-mode-switch-btn + .gallery-mode-switch-btn {
          border-left: 1px solid rgba(255,255,255,0.1);
        }
        .gallery-mode-switch-btn .lbl {
          font-family: 'Cinzel', serif; font-weight: 700;
          font-size: 11px; letter-spacing: 0.18em;
        }
        .gallery-mode-switch-btn .cnt {
          font-size: 9px; letter-spacing: 0.12em; opacity: 0.75;
        }
        .gallery-mode-switch-btn:hover:not(.on) {
          background: rgba(255,255,255,0.05);
          color: rgba(245,243,236,0.88);
        }
        .gallery-mode-switch-btn.on {
          background: rgba(245,243,236,0.12);
          color: #f5f3eb;
          box-shadow: inset 0 0 0 1px rgba(245,243,236,0.28), 0 0 16px rgba(245,243,236,0.06);
        }
        .gallery-mode-switch-btn.on .lbl { text-shadow: 0 0 14px rgba(245,243,236,0.3); }
      `}</style>
    </div>
  );
}

export default GalleryTabSwitcher;
