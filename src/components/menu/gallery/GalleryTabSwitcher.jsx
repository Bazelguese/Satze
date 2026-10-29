/**
 * Tab Agenti / Alternative / Eminenze / Campi — schegge inclinate stile Persona
 * con i tasti Q / E ai lati (gestiti da GalleryPersonaShell).
 */
export const GALLERY_TAB_ORDER = ['agents', 'alternative', 'eminences', 'battlefields'];

const TAB_LABEL = {
  agents: 'AGENTI',
  alternative: 'ALTERNATIVE',
  eminences: 'EMINENZE',
  battlefields: 'CAMPI',
};

export function GalleryTabSwitcher({
  activeTab,
  onTabChange,
  agentCount,
  alternativeCount,
  fieldCount,
  eminenceCount,
}) {
  const counts = {
    agents: agentCount,
    alternative: alternativeCount,
    eminences: eminenceCount,
    battlefields: fieldCount,
  };
  const tabs = GALLERY_TAB_ORDER
    .filter((id) => counts[id] != null)
    .map((id) => ({ id, label: TAB_LABEL[id], count: counts[id] }));

  return (
    <div className="gallery-mode-switch" role="tablist" aria-label="Sezione galleria">
      <kbd className="gms-key">Q</kbd>
      {tabs.map((tab, i) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => { if (!active) onTabChange(tab.id); }}
            className={`gallery-mode-switch-btn ${active ? 'on' : ''}`}
            style={{ '--tilt': `${[-2, 1.5, -1, 2][i % 4]}deg` }}
          >
            <span className="in">
              <span className="lbl">{tab.label}</span>
              <span className="cnt">{tab.count}</span>
            </span>
          </button>
        );
      })}
      <kbd className="gms-key">E</kbd>
      <style>{`
        .gallery-mode-switch {
          justify-self: center; display: inline-flex; align-items: center; gap: 4px;
        }
        .gallery-mode-switch .gms-key {
          display: inline-grid; place-items: center; width: 28px; height: 26px;
          background: #f5f3eb; color: #050507;
          font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 14px;
          clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
          margin: 0 8px;
        }
        .gallery-mode-switch-btn {
          border: 0; padding: 0; background: transparent; cursor: pointer;
          transform: skewX(-16deg) rotate(var(--tilt));
          transition: transform .18s cubic-bezier(.3,1.6,.5,1);
        }
        .gallery-mode-switch-btn .in {
          display: inline-flex; align-items: baseline; gap: 8px;
          padding: 9px 20px 8px;
          background: #050507; color: rgba(245,243,235,0.62);
          font-family: 'Chakra Petch', sans-serif;
          transition: background .15s, color .15s, box-shadow .15s;
        }
        .gallery-mode-switch-btn .in > * { transform: skewX(16deg); display: inline-block; }
        .gallery-mode-switch-btn .lbl { font-weight: 700; font-size: 19px; letter-spacing: 0.04em; font-style: italic; }
        .gallery-mode-switch-btn .cnt { font-family: 'Share Tech Mono', monospace; font-size: 12px; opacity: 0.7; }
        .gallery-mode-switch-btn:hover:not(.on) { transform: skewX(-16deg) rotate(var(--tilt)) translateY(-3px); }
        .gallery-mode-switch-btn:hover:not(.on) .in { color: #f5f3eb; }
        .gallery-mode-switch-btn.on {
          transform: skewX(-16deg) rotate(calc(var(--tilt) * -1.5)) scale(1.16);
          z-index: 2; margin: 0 12px;
        }
        .gallery-mode-switch-btn.on .in {
          background: #f5f3eb; color: #050507;
          box-shadow: 6px 6px 0 var(--accent, #c026d3);
        }
        .gallery-mode-switch-btn.on .cnt { opacity: 0.75; }
      `}</style>
    </div>
  );
}

export default GalleryTabSwitcher;
