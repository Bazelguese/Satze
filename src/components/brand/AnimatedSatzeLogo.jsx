import { useEffect, useRef } from 'react';
import spiralSrc from './assets/spiral.webp';
import lettersSrc from './assets/letters.webp';
import swordSrc from './assets/sword.webp';
import { BRAND_LOGO_SRC } from '../../theme/hudOratorioPalette';
import './animatedLogo.js';

/** Vite owns the asset URLs so the same component works on the web and in Electron. */
export default function AnimatedSatzeLogo({
  reducedMotion = false,
  paused = false,
  strength = 1,
  speed = 1,
  glow = 1,
  onFlash,
  className,
  style,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const logo = ref.current;
    if (!onFlash) return undefined;
    logo.addEventListener('satze-flash', onFlash);
    return () => logo.removeEventListener('satze-flash', onFlash);
  }, [onFlash]);

  return (
    <satze-logo
      ref={ref}
      className={className}
      style={style}
      spiral-src={spiralSrc}
      letters-src={lettersSrc}
      sword-src={swordSrc}
      fallback-src={BRAND_LOGO_SRC}
      reduced-motion={reducedMotion ? '' : undefined}
      paused={paused ? '' : undefined}
      strength={strength}
      speed={speed}
      glow={glow}
    />
  );
}
