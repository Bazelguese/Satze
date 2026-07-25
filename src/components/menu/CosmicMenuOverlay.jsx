import { useEffect, useRef, useState } from 'react';
import { MENU_ACCENTS } from '../../theme/hudOratorioPalette';
import { DISPLAY_SETTINGS_CHANGED_EVENT, getDisplaySettings } from '../../settings/displaySettings';
import { getVfxQualityProfile, resolveVfxQualityProfile } from '../../settings/vfxQualityProfile';

export function CosmicMenuOverlay() {
  const canvasRef = useRef(null);
  const [profile, setProfile] = useState(() => getVfxQualityProfile());

  useEffect(() => {
    const on = () => setProfile(resolveVfxQualityProfile(getDisplaySettings()));
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particleCount = profile.menuParticleCount;
    if (particleCount <= 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return undefined;
    }

    let rafId = 0;
    let width = 0;
    let height = 0;
    let particles = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.7 + Math.random() * 1.9,
        speedY: 0.15 + Math.random() * 0.55,
        drift: (Math.random() - 0.5) * 0.18,
        alpha: 0.18 + Math.random() * 0.55,
        hue: Math.random() > 0.62 ? '255,45,184' : '255,255,255',
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.speedY;
        p.x += p.drift;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;

        ctx.fillStyle = `rgba(${p.hue}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = window.requestAnimationFrame(animate);
    };

    resize();
    seed();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [profile.menuParticleCount]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <style>{`
        @keyframes cosmic-menu-stargate-rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes cosmic-menu-stargate-rotate-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes sigil-rot {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      {(() => {
        const HEAT = MENU_ACCENTS.pink;
        const ACCENT = MENU_ACCENTS.magenta;
        return (
          <div style={{
            position: 'absolute', bottom: 50, left: 36, zIndex: 2,
            width: 200, height: 200,
            pointerEvents: 'none',
            animation: profile.menuSigilAnimation ? 'sigil-rot 36s linear infinite' : 'none',
            opacity: profile.menuSigilAnimation ? 0.65 : 0.35,
          }}>
            <svg viewBox="0 0 200 200" width="100%" height="100%">
              <circle cx="100" cy="100" r="78" fill="none" stroke={ACCENT} strokeWidth="0.5" strokeDasharray="2 6"/>
              <circle cx="100" cy="100" r="62" fill="none" stroke={HEAT} strokeWidth="0.4"/>
              {(() => {
                const RUNES = [
                  'M -4 -4 L 4 -4 L 0 4 Z',
                  'M -4 0 L 0 -4 L 4 0 L 0 4 Z',
                  'M -4 -4 L 4 4 M -4 4 L 4 -4',
                  'M -4 0 L 4 0 M 0 -4 L 0 4',
                  'M -4 -3 L 4 -3 M -4 3 L 4 3',
                  'M 0 -4 L 4 0 L 0 4 L -4 0 Z',
                  'M -4 -4 L 4 -4 M 0 -4 L 0 4',
                  'M -4 -4 L -4 4 L 4 0 Z',
                  'M -4 -4 L 4 -4 L 4 4 L -4 4 Z M -4 0 L 4 0',
                ];
                const COUNT = 18;
                const R = 70;
                return Array.from({length: COUNT}).map((_, i) => {
                  const ang = (i / COUNT) * 2 * Math.PI;
                  const cx = 100 + Math.cos(ang) * R;
                  const cy = 100 + Math.sin(ang) * R;
                  const rotDeg = (ang * 180 / Math.PI) + 90;
                  const glyph = RUNES[i % RUNES.length];
                  return (
                    <g key={i} transform={`translate(${cx} ${cy}) rotate(${rotDeg})`}>
                      <path d={glyph} fill="none" stroke={HEAT} strokeWidth="0.9" opacity="0.95"/>
                    </g>
                  );
                });
              })()}
              {[0,60,120,180,240,300].map(a => (
                <line key={a} x1="100" y1="22" x2="100" y2="32"
                  stroke={ACCENT} strokeWidth="1"
                  transform={`rotate(${a} 100 100)`}/>
              ))}
            </svg>
          </div>
        );
      })()}
    </div>
  );
}
