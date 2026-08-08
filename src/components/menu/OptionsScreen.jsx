import { useCallback, useEffect, useMemo, useState } from 'react';
import { MenuScreenLayout } from './MenuScreenLayout';
import { MenuBackButton } from './MenuCard';
import { MENU_ACCENTS, PALETTE, HUD_ORATORIO_FONT_UI, HUD_ORATORIO_FONT_DISPLAY } from '../../theme/hudOratorioPalette';
import {
  DISPLAY_MODES,
  RESOLUTION_PRESETS,
  UI_SCALE_PRESETS,
  CURSOR_SIZE_PRESETS,
  CURSOR_TRAIL_LENGTH_PRESETS,
  CURSOR_TRAIL_DURATION_PRESETS,
  VFX_QUALITY_LEVELS,
  DUEL_LAYOUT_BREATH_LEVELS,
  applyElectronDisplay,
  getDisplaySettings,
  hasElectronDisplayApi,
  resetDisplaySettings,
  setDisplaySettings,
} from '../../settings/displaySettings';

const MODE_LABELS = {
  windowed: 'Finestra',
  fullscreen: 'Schermo intero',
  borderless: 'Borderless',
};

const QUALITY_LABELS = {
  high: 'Alta',
  medium: 'Media',
  low: 'Bassa',
};

const BREATH_LABELS = {
  off: 'Off',
  soft: 'Soft',
  strong: 'Forte',
};

const TRAIL_LENGTH_LABELS = {
  5: 'Corta',
  10: 'Media',
  16: 'Lunga',
};

const TRAIL_DURATION_LABELS = {
  200: 'Rapida',
  400: 'Media',
  700: 'Lunga',
};

const selectStyle = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  background: '#0f0a14',
  border: `1.5px solid ${PALETTE.slate}`,
  color: PALETTE.textPrimary,
  fontFamily: HUD_ORATORIO_FONT_UI,
  fontSize: '0.8rem',
};

const segmentBtnStyle = (active, accent = MENU_ACCENTS.magenta) => ({
  flex: 1,
  minWidth: 0,
  padding: '0.65rem 0.5rem',
  background: active ? `${accent}28` : `${MENU_ACCENTS.panel}`,
  border: `1.5px solid ${active ? accent : PALETTE.slate}`,
  color: active ? '#fdf4ff' : PALETTE.textSecondary,
  cursor: 'pointer',
  fontFamily: HUD_ORATORIO_FONT_UI,
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  fontWeight: 600,
  textTransform: 'uppercase',
  boxShadow: active ? `0 0 16px ${accent}35` : 'none',
  transition: 'all 0.2s ease',
});

function Row({ label, hint, children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 200px) 1fr',
        gap: '0.75rem 1.25rem',
        alignItems: 'center',
        padding: '0.85rem 0',
        borderBottom: `1px solid ${PALETTE.slate}55`,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: HUD_ORATORIO_FONT_DISPLAY,
            fontSize: '0.85rem',
            letterSpacing: '0.12em',
            color: PALETTE.textPrimary,
            fontWeight: 700,
          }}
        >
          {label}
        </div>
        {hint && (
          <div
            style={{
              marginTop: 4,
              fontSize: '0.68rem',
              color: '#94a3b8',
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: '0.04em',
              lineHeight: 1.35,
            }}
          >
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function OptionsScreen({ onClose }) {
  const [settings, setSettings] = useState(() => getDisplaySettings());
  const [status, setStatus] = useState(/** @type {null | { tone: 'ok'|'warn'|'err', text: string }} */ (null));
  const [applying, setApplying] = useState(false);
  const electronReady = hasElectronDisplayApi();

  const resolutionLocked = settings.displayMode !== 'windowed';

  const dirtyDisplay = useMemo(() => {
    const saved = getDisplaySettings();
    return (
      settings.displayMode !== saved.displayMode ||
      settings.resolutionPreset !== saved.resolutionPreset
    );
  }, [settings.displayMode, settings.resolutionPreset]);

  const persistPresentation = useCallback((partial) => {
    const next = setDisplaySettings(partial);
    setSettings(next);
    setStatus({ tone: 'ok', text: 'Impostazioni presentazione aggiornate.' });
  }, []);

  const handleMode = (displayMode) => {
    setSettings((s) => ({ ...s, displayMode }));
    setStatus(null);
  };

  const handleResolution = (resolutionPreset) => {
    setSettings((s) => ({ ...s, resolutionPreset }));
    setStatus(null);
  };

  const handleApplyDisplay = async () => {
    setApplying(true);
    setStatus(null);
    const next = setDisplaySettings({
      displayMode: settings.displayMode,
      resolutionPreset: settings.resolutionPreset,
    });
    setSettings(next);
    const result = await applyElectronDisplay(next);
    setApplying(false);
    if (!result.ok) {
      setStatus({ tone: 'err', text: result.error || 'Applicazione display fallita.' });
      return;
    }
    if (result.warning) {
      setStatus({ tone: 'warn', text: result.warning });
      return;
    }
    setStatus({ tone: 'ok', text: 'Display applicato.' });
  };

  const handleReset = async () => {
    if (!window.confirm('Ripristinare le impostazioni video predefinite?')) return;
    const next = resetDisplaySettings();
    setSettings(next);
    const result = await applyElectronDisplay(next);
    if (!result.ok) {
      setStatus({
        tone: 'warn',
        text: 'Default ripristinati in locale. Display Electron non applicato.',
      });
      return;
    }
    setStatus({ tone: 'ok', text: 'Impostazioni ripristinate.' });
  };

  useEffect(() => {
    // Sync eventuali valori display salvati dal main process (solo Electron)
    let cancelled = false;
    (async () => {
      if (!window.electronAPI?.display?.getSaved) return;
      try {
        const saved = await window.electronAPI.display.getSaved();
        if (cancelled || !saved) return;
        setSettings((s) => ({
          ...s,
          displayMode: saved.displayMode || s.displayMode,
          resolutionPreset: saved.resolutionPreset || s.resolutionPreset,
        }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusColor =
    status?.tone === 'err' ? '#fb7185' : status?.tone === 'warn' ? '#fbbf24' : MENU_ACCENTS.pink;

  return (
    <MenuScreenLayout centered={false} title="Opzioni" subtitle="Video · Display Electron">
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 0.5rem 2rem',
        }}
      >
        <div
          style={{
            background: `${MENU_ACCENTS.panel}ee`,
            border: `1.5px solid ${PALETTE.slate}`,
            boxShadow: '0 8px 32px #000a',
            padding: '0.5rem 1.25rem 1.25rem',
          }}
        >
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              color: MENU_ACCENTS.magenta,
              marginBottom: '0.25rem',
              paddingTop: '0.5rem',
            }}
          >
            VIDEO
          </div>

          <Row label="Modalità schermo" hint="Richiede Applica">
            <div style={{ display: 'flex', gap: 6 }}>
              {DISPLAY_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleMode(mode)}
                  style={segmentBtnStyle(settings.displayMode === mode)}
                >
                  {MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </Row>

          <Row
            label="Risoluzione"
            hint={resolutionLocked ? 'Disponibile solo in modalità Finestra' : 'Richiede Applica'}
          >
            <select
              value={settings.resolutionPreset}
              disabled={resolutionLocked}
              onChange={(e) => handleResolution(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                background: '#0f0a14',
                border: `1.5px solid ${resolutionLocked ? '#334155' : PALETTE.slate}`,
                color: resolutionLocked ? '#64748b' : PALETTE.textPrimary,
                fontFamily: HUD_ORATORIO_FONT_UI,
                fontSize: '0.8rem',
                opacity: resolutionLocked ? 0.7 : 1,
              }}
            >
              {RESOLUTION_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </Row>

          <Row label="Qualità effetti" hint="Particelle, overdrive, clash, zoom">
            <div style={{ display: 'flex', gap: 6 }}>
              {VFX_QUALITY_LEVELS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => persistPresentation({ vfxQuality: q })}
                  style={segmentBtnStyle(settings.vfxQuality === q, MENU_ACCENTS.pink)}
                >
                  {QUALITY_LABELS[q]}
                </button>
              ))}
            </div>
          </Row>

          <Row
            label="Respiro layout duello"
            hint={
              settings.reduceMotion
                ? 'Disattivato da «Riduci animazioni»'
                : 'Oscillazione leggera di colonne, mani e pannello campo'
            }
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {DUEL_LAYOUT_BREATH_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  disabled={settings.reduceMotion}
                  onClick={() => persistPresentation({ duelLayoutBreath: level })}
                  style={{
                    ...segmentBtnStyle(settings.duelLayoutBreath === level, MENU_ACCENTS.magenta),
                    opacity: settings.reduceMotion ? 0.55 : 1,
                    cursor: settings.reduceMotion ? 'not-allowed' : 'pointer',
                  }}
                >
                  {BREATH_LABELS[level]}
                </button>
              ))}
            </div>
          </Row>

          <Row
            label="Scala interfaccia"
            hint="Densità menù (testi/controlli). Il frame resta intero; scroll se serve."
          >
            <select
              value={settings.uiScale}
              onChange={(e) => persistPresentation({ uiScale: Number(e.target.value) })}
              style={selectStyle}
            >
              {UI_SCALE_PRESETS.map((n) => (
                <option key={n} value={n}>
                  {n}%
                </option>
              ))}
            </select>
          </Row>

          <Row label="Scala cursore" hint="Dimensione del puntatore custom">
            <select
              value={settings.cursorSize}
              onChange={(e) => persistPresentation({ cursorSize: Number(e.target.value) })}
              style={selectStyle}
            >
              {CURSOR_SIZE_PRESETS.map((n) => (
                <option key={n} value={n}>
                  {n}%
                </option>
              ))}
            </select>
          </Row>

          <Row
            label="Lunghezza scia"
            hint={
              settings.reduceMotion
                ? 'Disattivata da «Riduci animazioni»'
                : 'Quanti segmenti lascia dietro il cursore'
            }
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {CURSOR_TRAIL_LENGTH_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={settings.reduceMotion}
                  onClick={() => persistPresentation({ cursorTrailLength: n })}
                  style={{
                    ...segmentBtnStyle(settings.cursorTrailLength === n, MENU_ACCENTS.pink),
                    opacity: settings.reduceMotion ? 0.55 : 1,
                    cursor: settings.reduceMotion ? 'not-allowed' : 'pointer',
                  }}
                >
                  {TRAIL_LENGTH_LABELS[n]}
                </button>
              ))}
            </div>
          </Row>

          <Row
            label="Durata scia"
            hint={
              settings.reduceMotion
                ? 'Disattivata da «Riduci animazioni»'
                : 'Quanto resta visibile a cursore fermo'
            }
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {CURSOR_TRAIL_DURATION_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={settings.reduceMotion}
                  onClick={() => persistPresentation({ cursorTrailDuration: n })}
                  style={{
                    ...segmentBtnStyle(settings.cursorTrailDuration === n, '#38bdf8'),
                    opacity: settings.reduceMotion ? 0.55 : 1,
                    cursor: settings.reduceMotion ? 'not-allowed' : 'pointer',
                  }}
                >
                  {TRAIL_DURATION_LABELS[n]}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Riduci animazioni" hint="Forza profilo effetti Basso">
            <button
              type="button"
              onClick={() => persistPresentation({ reduceMotion: !settings.reduceMotion })}
              style={{
                ...segmentBtnStyle(settings.reduceMotion, '#38bdf8'),
                flex: '0 0 auto',
                minWidth: 120,
                paddingLeft: '1.25rem',
                paddingRight: '1.25rem',
              }}
            >
              {settings.reduceMotion ? 'Attivo' : 'Disattivo'}
            </button>
          </Row>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.65rem',
              marginTop: '1.25rem',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              disabled={applying || !electronReady}
              onClick={handleApplyDisplay}
              style={{
                padding: '0.75rem 1.4rem',
                background: electronReady ? `${MENU_ACCENTS.magenta}33` : '#1e293b',
                border: `1.5px solid ${electronReady ? MENU_ACCENTS.magenta : '#475569'}`,
                color: electronReady ? '#fdf4ff' : '#94a3b8',
                cursor: electronReady && !applying ? 'pointer' : 'not-allowed',
                fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                fontWeight: 700,
                letterSpacing: '0.12em',
                fontSize: '0.8rem',
              }}
            >
              {applying ? 'APPLICO…' : dirtyDisplay ? 'APPLICA DISPLAY' : 'APPLICA DISPLAY'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '0.75rem 1.1rem',
                background: 'transparent',
                border: `1.5px solid ${PALETTE.slate}`,
                color: PALETTE.textSecondary,
                cursor: 'pointer',
                fontFamily: HUD_ORATORIO_FONT_UI,
                letterSpacing: '0.1em',
                fontSize: '0.75rem',
              }}
            >
              RIPRISTINA DEFAULT
            </button>
          </div>

          {!electronReady && (
            <p
              style={{
                marginTop: '0.85rem',
                fontSize: '0.72rem',
                color: '#fbbf24',
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              Client web: qualità / scala / riduci animazioni funzionano. Modalità schermo e
              risoluzione richiedono l&apos;exe Electron.
            </p>
          )}

          {status && (
            <p
              style={{
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                color: statusColor,
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              {status.text}
            </p>
          )}
        </div>

        <MenuBackButton onClick={onClose}>Menu principale</MenuBackButton>
      </div>
    </MenuScreenLayout>
  );
}

export default OptionsScreen;
