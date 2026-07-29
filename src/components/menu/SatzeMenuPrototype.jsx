import { useState, useEffect, useMemo } from "react";
import { MENU_ACCENTS,
  BRAND_LOGO_SRC,
  BRAND_LOGO_WIDTH,
  BRAND_LOGO_HEIGHT,
  injectSatzeUiFonts,
} from "../../theme/hudOratorioPalette";
import { CosmicMenuOverlay } from "./CosmicMenuOverlay";
import { isMenuFollowUpPicker } from "../../utils/devDialogueDuelMenu";
import { DISPLAY_SETTINGS_CHANGED_EVENT, getDisplaySettings } from "../../settings/displaySettings";
import { getVfxQualityProfile, resolveVfxQualityProfile } from "../../settings/vfxQualityProfile";
import { useUiScale } from "../../hooks/useUiScale";

/**
 * @param {{ label: string, onClick?: () => void, sub?: string, meta?: string, disabled?: boolean, choices?: Array<unknown> }} c
 */
function normalizeChoiceOption(c) {
  const nested = c.choices?.map((child) => normalizeChoiceOption(child)) ?? null;
  return {
    label: c.label,
    sub: c.sub ?? "",
    meta: c.meta ?? "",
    onClick: c.onClick,
    disabled: c.disabled,
    choices: nested?.length ? nested : null,
  };
}

/**
 * Menu principale — variante **V5 COSMIC** (handoff Claude Design: MenuV5PersonaCosmic).
 * Logo reale, palette viola/magenta, bandiere skew P5-style, footer a nastro.
 *
 * Opzionale `choices`: un solo bottone trapezio; al click si apre un pannello per scegliere un’opzione.
 * (`children` è ancora accettato come alias di `choices`.)
 *
 * @param {{ menuItems: Array<{
 *   label: string,
 *   onClick?: () => void,
 *   sub?: string,
 *   meta?: string,
 *   accent?: string,
 *   disabled?: boolean,
 *   choices?: Array<{ label: string, onClick?: () => void, sub?: string, meta?: string, disabled?: boolean, choices?: Array<unknown> }>,
 *   children?: Array<{ label: string, onClick?: () => void, sub?: string, meta?: string, disabled?: boolean, choices?: Array<unknown> }>,
 *   marqueeText?: string,
 * }> }} props
 */
export default function SatzeMenuPrototype({ menuItems, marqueeText }) {
  const [hover, setHover] = useState(null);
  /** @type {Array<{ accent: string, title: string, options: ReturnType<typeof normalizeChoiceOption>[] }>} */
  const [choicePickerStack, setChoicePickerStack] = useState([]);
  const [vfxProfile, setVfxProfile] = useState(() => getVfxQualityProfile());
  const uiScale = useUiScale();

  const choicePicker = choicePickerStack[choicePickerStack.length - 1] ?? null;

  const closeAllPickers = () => setChoicePickerStack([]);
  const closeTopPicker = () => setChoicePickerStack((s) => s.slice(0, -1));
  const openPicker = (picker) => setChoicePickerStack((s) => [...s, picker]);

  useEffect(() => {
    injectSatzeUiFonts();
  }, []);

  useEffect(() => {
    const on = () => setVfxProfile(resolveVfxQualityProfile(getDisplaySettings()));
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
  }, []);

  useEffect(() => {
    if (!choicePicker) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (choicePickerStack.length > 1) closeTopPicker();
        else closeAllPickers();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choicePicker, choicePickerStack.length]);

  const ACCENT = MENU_ACCENTS.magenta;
  const HEAT = MENU_ACCENTS.pink;

  /** Centro luce viola/magenta (allineato al gradiente di sfondo) */
  const GLOW_X = "30%";
  const GLOW_Y = "40%";

  const accentCycle = useMemo(
    () => [MENU_ACCENTS.pink, MENU_ACCENTS.magenta, "#a78bfa", "#22d3ee", "#94a3b8", "#f472b6"],
    [],
  );

  const items = useMemo(() => {
    return menuItems.map((item, i) => {
      const raw = item.choices ?? item.children;
      const options =
        raw?.map((c) => normalizeChoiceOption(c)) ?? null;
      const accent = item.accent ?? accentCycle[i % accentCycle.length];
      const hasPicker = Boolean(options?.length);
      return {
        id: `menu-${i}`,
        label: item.label,
        sub: item.sub ?? "",
        meta: item.meta ?? "",
        accent,
        disabled: item.disabled,
        hasPicker,
        options,
        leafOnClick: item.onClick,
      };
    });
  }, [menuItems, accentCycle]);

  const marqueeTextResolved =
    marqueeText ?? "v0.1 ALPHA · NON DISTRIBUIRE · LA GRANDE GUERRA · SATZE · ";

  const renderTrapButton = (
    row,
    {
      rowKey,
      height = 78,
      titleSize = "clamp(18px, 2.2vw, 26px)",
      marginLeft,
      animDelay,
    },
  ) => {
    const isHover = hover === rowKey;
    const subline = [row.sub, row.meta].filter(Boolean).join(" · ");
    const accent = row.accent;
    const disabled = row.disabled;

    return (
      <button
        key={rowKey}
        type="button"
        onMouseEnter={() => !disabled && setHover(rowKey)}
        onMouseLeave={() => setHover(null)}
        disabled={disabled}
        onClick={() => {
          row.onClick?.();
        }}
        style={{
          position: "relative",
          marginLeft,
          padding: 0,
          background: "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          transition: "margin-left 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.2)",
          transformOrigin: "right center",
          animation: `satze-v5-slide-in 0.5s ${animDelay}s backwards ease-out`,
        }}
      >
        <div
          style={{
            position: "relative",
            height,
            background: isHover
              ? `linear-gradient(90deg, ${accent} 0%, ${accent}dd 60%, ${accent}88 100%)`
              : "linear-gradient(90deg, #1a0d24 0%, #0a0510 100%)",
            clipPath: "polygon(40px 0, 100% 0, 100% 100%, 0 100%)",
            transform: "skewX(-12deg)",
            transition: "background 0.2s",
            boxShadow: isHover
              ? `-6px 6px 0 ${accent}, 0 0 32px ${accent}66`
              : "4px 4px 0 rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 6,
              bottom: 6,
              left: 50,
              right: 6,
              border: `1.5px solid ${isHover ? MENU_ACCENTS.void : "#3a2a44"}`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 12,
              background: accent,
              boxShadow: `inset -2px 0 0 ${MENU_ACCENTS.void}`,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 80,
            right: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: isHover ? MENU_ACCENTS.void : MENU_ACCENTS.text,
            pointerEvents: "none",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontWeight: 900,
                fontSize: titleSize,
                letterSpacing: "0.18em",
                textShadow: isHover ? `2px 2px 0 ${MENU_ACCENTS.text}` : `2px 2px 0 ${accent}`,
                lineHeight: 1,
              }}
            >
              {row.label}
            </div>
            {subline ? (
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.35em",
                  marginTop: 5,
                  color: isHover ? MENU_ACCENTS.void : "#94a3b8",
                }}
              >
                {subline}
              </div>
            ) : null}
          </div>
          <div
            style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontWeight: 900,
              fontSize: height > 72 ? 30 : 26,
              color: isHover ? MENU_ACCENTS.void : accent,
              transform: isHover ? "translateX(6px)" : "translateX(0)",
              transition: "transform 0.25s ease",
            }}
          >
            ›
          </div>
        </div>
        {isHover && (
          <div
            style={{
              position: "absolute",
              top: -14,
              left: -28,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.35em",
              color: accent,
              background: MENU_ACCENTS.void,
              padding: "4px 10px",
              transform: "skewX(-12deg)",
              border: `1px solid ${accent}`,
              animation: "satze-v5-slide-in 0.18s ease-out",
            }}
          >
            SELECT ›
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      className="satze-menu-v5-root"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100%",
        overflow: uiScale > 1 ? "auto" : "hidden",
        background: MENU_ACCENTS.void,
        fontFamily: "'Chakra Petch', system-ui, sans-serif",
        color: MENU_ACCENTS.text,
        zoom: uiScale,
      }}
    >
      <style>{`
        @keyframes satze-v5-float-y { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes satze-v5-pulse-glow { 0%,100% { filter: drop-shadow(0 0 8px currentColor) } 50% { filter: drop-shadow(0 0 18px currentColor) } }
        @keyframes satze-v5-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes satze-v5-slide-in { from { transform: translateX(-30px) skewX(-12deg); opacity: 0 } to { transform: translateX(0) skewX(-8deg); opacity: 1 } }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at ${GLOW_X} ${GLOW_Y}, #2a0a3a 0%, #14051f 40%, ${MENU_ACCENTS.void} 80%)`,
        }}
      />
      {vfxProfile.menuGlowEnabled && (
        <div
          style={{
            position: "absolute",
            left: GLOW_X,
            top: GLOW_Y,
            transform: "translate(-50%, -50%)",
            width: "min(920px, 95vw)",
            height: "min(880px, 95vh)",
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(192,38,211,0.24) 0%, rgba(88,28,135,0.2) 30%, transparent 64%)",
            filter: vfxProfile.menuBlurPx > 0 ? `blur(${vfxProfile.menuBlurPx}px)` : "none",
            animation: vfxProfile.menuSigilAnimation ? "satze-v5-pulse-glow 6s ease-in-out infinite" : "none",
            color: ACCENT,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: vfxProfile.quality === "low" ? 0.04 : 0.1,
          backgroundImage: `radial-gradient(${ACCENT} 1px, transparent 1.4px)`,
          backgroundSize: "8px 8px",
          mixBlendMode: "screen",
        }}
      />
      <CosmicMenuOverlay />

      <div
        style={{
          position: "absolute",
          top: "clamp(-20px, -2vw, -40px)",
          left: "clamp(-40px, -4vw, -60px)",
          fontFamily: "'Cinzel', Georgia, serif",
          fontWeight: 900,
          fontSize: "clamp(120px, 28vw, 320px)",
          lineHeight: 0.75,
          letterSpacing: "-0.04em",
          color: "rgba(192,38,211,0.07)",
          WebkitTextStroke: "2px rgba(192,38,211,0.18)",
          transform: "skewX(-8deg) rotate(-2deg)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        SATZE
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "clamp(-40px, -4vw, -60px)",
          right: "clamp(-20px, -2vw, -40px)",
          fontFamily: "'Cinzel', Georgia, serif",
          fontStyle: "italic",
          fontSize: "clamp(72px, 14vw, 180px)",
          lineHeight: 0.85,
          color: "rgba(236,72,153,0.06)",
          WebkitTextStroke: "1px rgba(236,72,153,0.22)",
          transform: "skewX(-8deg) rotate(2deg)",
          textAlign: "right",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        LA GRANDE
        <br />
        GUERRA
      </div>

      <div
        style={{
          position: "absolute",
          left: GLOW_X,
          top: GLOW_Y,
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "min(92vw, 820px)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            animation: "satze-v5-float-y 5s ease-in-out infinite",
            filter:
              "drop-shadow(0 0 36px rgba(192,38,211,0.55)) drop-shadow(0 12px 28px rgba(0,0,0,0.75))",
          }}
        >
          <div className="satze-brand-logo-wrap">
            <div className="satze-brand-logo-inner-static">
              <div className="satze-brand-logo-glare-host">
                <img
                  src={BRAND_LOGO_SRC}
                  alt="SATZE"
                  width={BRAND_LOGO_WIDTH}
                  height={BRAND_LOGO_HEIGHT}
                  decoding="async"
                  className="satze-brand-logo"
                  style={{
                    width: "min(720px, 58vw)",
                    height: "auto",
                    display: "block",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
                <div
                  className="satze-brand-logo-glare-layer"
                  aria-hidden
                  style={{
                    WebkitMaskImage: `url(${BRAND_LOGO_SRC})`,
                    maskImage: `url(${BRAND_LOGO_SRC})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11,
            color: HEAT,
            letterSpacing: "0.45em",
            marginTop: 4,
            textShadow: `0 0 8px ${HEAT}88`,
            textAlign: "center",
          }}
        >
          LA·GRANDE·GUERRA
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "clamp(200px, 32vh, 280px)",
          right: "clamp(16px, 4vw, 60px)",
          width: "min(620px, 92vw)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          zIndex: 5,
          paddingBottom: 48,
        }}
      >
        {items.map((item, i) => {
          const singleHover = hover === item.id;
          const offsetBase = singleHover ? -36 : -i * 12;

          const row = {
            label: item.label,
            sub: item.sub,
            meta: item.meta,
            accent: item.accent,
            disabled: item.disabled,
            onClick: item.hasPicker
              ? () =>
                  openPicker({
                    accent: item.accent,
                    title: item.label,
                    options: item.options,
                  })
              : item.leafOnClick,
          };
          return renderTrapButton(row, {
            rowKey: item.id,
            marginLeft: offsetBase,
            animDelay: i * 0.08,
          });
        })}
      </div>

      {choicePicker ? (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "rgba(6,3,10,0.82)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => closeAllPickers()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="satze-choice-picker-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#0a0510",
              border: `2px solid ${choicePicker.accent}`,
              boxShadow: `0 0 40px ${choicePicker.accent}44, 0 16px 48px rgba(0,0,0,0.85)`,
              padding: "24px 22px 20px",
              fontFamily: "'Chakra Petch', system-ui, sans-serif",
            }}
          >
            <h2
              id="satze-choice-picker-title"
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontWeight: 900,
                fontSize: 20,
                letterSpacing: "0.2em",
                color: MENU_ACCENTS.text,
                margin: "0 0 6px",
                textAlign: "center",
              }}
            >
              {choicePicker.title}
            </h2>
            <p
              style={{
                margin: "0 0 20px",
                textAlign: "center",
                fontSize: 12,
                color: "#94a3b8",
                letterSpacing: "0.12em",
              }}
            >
              Scegli un’opzione
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {choicePicker.options.map((opt, idx) => {
                const line = [opt.sub, opt.meta].filter(Boolean).join(" · ");
                return (
                  <button
                    key={`${opt.label}-${idx}`}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return;
                      if (opt.choices?.length) {
                        openPicker({
                          accent: choicePicker.accent,
                          title: opt.label,
                          options: opt.choices,
                        });
                        return;
                      }
                      const followUp = opt.onClick?.();
                      if (isMenuFollowUpPicker(followUp)) {
                        closeAllPickers();
                        openPicker({
                          accent: followUp.accent ?? choicePicker.accent,
                          title: followUp.title ?? opt.label,
                          options: followUp.options.map((c) => normalizeChoiceOption(c)),
                        });
                        return;
                      }
                      closeAllPickers();
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "14px 16px",
                      textAlign: "left",
                      cursor: opt.disabled ? "not-allowed" : "pointer",
                      opacity: opt.disabled ? 0.45 : 1,
                      background: "#140a1c",
                      border: "1.5px solid #3a2a44",
                      color: MENU_ACCENTS.text,
                      borderRadius: 2,
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!opt.disabled) {
                        e.currentTarget.style.borderColor = choicePicker.accent;
                        e.currentTarget.style.background = "#1a1028";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#3a2a44";
                      e.currentTarget.style.background = "#140a1c";
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Cinzel', Georgia, serif",
                        fontWeight: 700,
                        fontSize: 15,
                        letterSpacing: "0.14em",
                        display: "block",
                      }}
                    >
                      {opt.label}
                    </span>
                    {line ? (
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 10,
                          letterSpacing: "0.28em",
                          color: "#94a3b8",
                          marginTop: 6,
                          display: "block",
                        }}
                      >
                        {line}
                      </span>
                    ) : null}
                    {opt.choices?.length ? (
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 9,
                          letterSpacing: "0.22em",
                          color: choicePicker.accent,
                          marginTop: 4,
                          display: "block",
                        }}
                      >
                        › SCEGLI
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                if (choicePickerStack.length > 1) closeTopPicker();
                else closeAllPickers();
              }}
              style={{
                marginTop: 18,
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: "1px solid #4a3f55",
                color: "#94a3b8",
                fontSize: 12,
                letterSpacing: "0.2em",
                cursor: "pointer",
                borderRadius: 2,
              }}
            >
              {choicePickerStack.length > 1 ? "INDIETRO" : "ANNULLA"}
            </button>
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 26,
          background: ACCENT,
          clipPath: "polygon(0 6px, 100% 0, 100% 100%, 0 100%)",
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          zIndex: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.3em",
            color: MENU_ACCENTS.void,
            padding: "0 24px",
            animation: "satze-v5-marquee 60s linear infinite",
          }}
        >
          {[0, 1].map((idx) => (
            <span key={idx}>
              {marqueeTextResolved}
              BUILD {new Date().toISOString().slice(0, 10).replace(/-/g, ".")} ·{" "}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
