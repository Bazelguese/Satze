import { useRef, useCallback, useEffect } from "react";
import { PALETTE, HUD_ORATORIO_FONT_UI, HUD_ORATORIO_FONT_DISPLAY, injectSatzeUiFonts } from "../../theme/hudOratorioPalette";
import { CosmicMenuBackground } from "./CosmicMenuBackground";

// ═══════════════════════════════════════════════════
// Layout condiviso — stesso cosmic del menù V5 (non duello)
// ═══════════════════════════════════════════════════

/** Layout full-screen con sfondo cosmic viola/magenta. children = contenuto. */
export function MenuScreenLayout({ children, title, subtitle, centered = true }) {
  const containerRef = useRef(null);
  const glowRef = useRef(null);
  const pendingMouseRef = useRef({ x: 0, y: 0 });
  const parallaxRafRef = useRef(0);

  useEffect(() => {
    injectSatzeUiFonts();
  }, []);

  const applyParallax = useCallback(() => {
    parallaxRafRef.current = 0;
    const { x, y } = pendingMouseRef.current;
    const glow = glowRef.current;
    if (glow) {
      glow.style.transform = `translate(calc(-50% + ${x * 0.012}px), calc(-50% + ${y * 0.01}px))`;
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      pendingMouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 100,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 100,
      };
      if (!parallaxRafRef.current) {
        parallaxRafRef.current = requestAnimationFrame(applyParallax);
      }
    },
    [applyParallax],
  );

  useEffect(
    () => () => {
      if (parallaxRafRef.current) cancelAnimationFrame(parallaxRafRef.current);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="satze-hide-scrollbar"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100%",
        overflow: "auto",
        background: "var(--menu-void)",
        fontFamily: HUD_ORATORIO_FONT_UI,
        color: "var(--menu-text)",
      }}
    >
      <CosmicMenuBackground parallaxRef={glowRef} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 28%, var(--menu-void) 100%)",
          zIndex: 35,
          pointerEvents: "none",
          animation: "satze-vignette-pulse 36s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 40,
          isolation: "isolate",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: centered ? "center" : "flex-start",
          height: centered ? "100%" : "auto",
          minHeight: centered ? 0 : "100%",
          padding: "1rem",
          overflow: centered ? "hidden" : "visible",
        }}
      >
        {(title || subtitle) && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "0.75rem",
              flexShrink: 0,
              animation: "satze-title-entrance 0.8s ease-out both",
            }}
          >
            {title && (
              <h1
                style={{
                  fontSize: "clamp(1.1rem, 3vw, 1.75rem)",
                  fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                  fontWeight: "700",
                  letterSpacing: "0.15em",
                  color: PALETTE.textPrimary,
                  textShadow:
                    "0 0 28px rgba(192,38,211,0.45), 0 0 12px rgba(236,72,153,0.25), 0 2px 4px #000",
                  marginBottom: subtitle ? "0.5rem" : 0,
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: "0.85rem",
                  fontFamily: "'Share Tech Mono', monospace",
                  color: "#94a3b8",
                  letterSpacing: "0.12em",
                  opacity: 0.95,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
