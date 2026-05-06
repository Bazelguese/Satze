// ============================================
// Colori glow focus coin (duello) — condiviso gioco + VFX Lab
// ============================================

/**
 * @param {number} focusCount — FC investiti (1–14)
 * @param {number} intensity — 0..1 avanzamento animazione
 * @param {number} rainbowTime — accumulatore animazione tinte speciali
 * @param {{ rainbowHueMul12: number, rainbowHueMul13: number, rainbowHueMul14: number }} hueMul
 */
export function getFocusCoinGlowColor(focusCount, intensity, rainbowTime, hueMul) {
  const count = Math.min(Math.max(focusCount, 1), 14);

  const colorMap = {
    1: { main: 'rgba(234, 179, 8, 1)', secondary: 'rgba(234, 179, 8, 0.8)' },
    2: { main: 'rgba(251, 191, 36, 1)', secondary: 'rgba(234, 179, 8, 0.8)' },
    3: { main: 'rgba(251, 146, 60, 1)', secondary: 'rgba(251, 191, 36, 0.8)' },
    4: { main: 'rgba(249, 115, 22, 1)', secondary: 'rgba(251, 146, 60, 0.8)' },
    5: { main: 'rgba(239, 68, 68, 1)', secondary: 'rgba(249, 115, 22, 0.8)' },
    6: { main: 'rgba(219, 39, 119, 1)', secondary: 'rgba(239, 68, 68, 0.8)' },
    7: { main: 'rgba(168, 85, 247, 1)', secondary: 'rgba(219, 39, 119, 0.8)' },
    8: { main: 'rgba(139, 92, 246, 1)', secondary: 'rgba(168, 85, 247, 0.8)' },
    9: { main: 'rgba(59, 130, 246, 1)', secondary: 'rgba(139, 92, 246, 0.8)' },
    10: { main: 'rgba(34, 197, 94, 1)', secondary: 'rgba(59, 130, 246, 0.8)' },
    11: { main: 'rgba(34, 197, 94, 1)', secondary: 'rgba(34, 197, 94, 0.8)' },
    12: { main: 'rgba(168, 85, 247, 1)', secondary: 'rgba(34, 197, 94, 0.8)' },
    13: { main: 'rgba(168, 85, 247, 1)', secondary: 'rgba(59, 130, 246, 0.8)' },
    14: { main: 'rgba(255, 255, 255, 1)', secondary: 'rgba(200, 200, 255, 0.9)' },
  };

  const currentColor = colorMap[count];
  const previousColor = count > 1 ? colorMap[count - 1] : currentColor;

  const interpolateColor = (color1, color2, t) => {
    const c1 = color1.match(/\d+/g).map(Number);
    const c2 = color2.match(/\d+/g).map(Number);
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    const a = c1[3] + (c2[3] - c1[3]) * t;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  if (count >= 12) {
    const time = rainbowTime;
    if (count === 12) {
      const hue = (time * hueMul.rainbowHueMul12) % 360;
      const r = Math.sin((hue * Math.PI) / 180) * 127 + 128;
      const g = Math.sin(((hue + 120) * Math.PI) / 180) * 127 + 128;
      const b = Math.sin(((hue + 240) * Math.PI) / 180) * 127 + 128;
      return {
        main: `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 1)`,
        secondary: `rgba(${Math.round(r * 0.8)}, ${Math.round(g * 0.8)}, ${Math.round(b * 0.8)}, 0.8)`,
      };
    }
    if (count === 13) {
      const hue = (time * hueMul.rainbowHueMul13) % 360;
      const r = Math.sin((hue * Math.PI) / 180) * 127 + 128;
      const g = Math.sin(((hue + 120) * Math.PI) / 180) * 127 + 128;
      const b = Math.sin(((hue + 240) * Math.PI) / 180) * 127 + 128;
      return {
        main: `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 1)`,
        secondary: `rgba(${Math.round(r * 0.8)}, ${Math.round(g * 0.8)}, ${Math.round(b * 0.8)}, 0.8)`,
      };
    }
    const hue = (time * hueMul.rainbowHueMul14) % 360;
    const r = 255 - Math.abs(Math.sin((hue * Math.PI) / 180)) * 50;
    const g = 255 - Math.abs(Math.sin(((hue + 120) * Math.PI) / 180)) * 50;
    const b = 255 - Math.abs(Math.sin(((hue + 240) * Math.PI) / 180)) * 50;
    return {
      main: `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 1)`,
      secondary: 'rgba(255, 255, 255, 0.9)',
    };
  }

  return {
    main:
      intensity < 1 && count > 1
        ? interpolateColor(previousColor.main, currentColor.main, intensity)
        : currentColor.main,
    secondary:
      intensity < 1 && count > 1
        ? interpolateColor(previousColor.secondary, currentColor.secondary, intensity)
        : currentColor.secondary,
  };
}
