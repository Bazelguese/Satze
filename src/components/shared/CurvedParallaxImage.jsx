// Overscan + parallax + tilt prospettico (CSS + rAF).
// Orbit idle: tilt intorno ai bordi, translate minimo → centro fermo.

import { useEffect, useRef } from 'react';
import './curvedParallaxImage.css';

/**
 * @param {object} props
 * @param {string} props.src
 * @param {number} [props.strength] px max parallax col mouse (es. 14)
 * @param {number} [props.scale] overscan (es. 1.1)
 * @param {number} [props.tiltX] gradi max rotateX (mouse)
 * @param {number} [props.tiltY] gradi max rotateY (mouse)
 * @param {boolean} [props.autoOrbit] loop tilt ai bordi quando il mouse è fuori
 * @param {number} [props.orbitPeriodSec] secondi per giro completo
 * @param {number} [props.orbitAmplitude] 0–1 quanto vicino ai bordi (default 0.92)
 * @param {number} [props.orbitTranslate] px max translate in orbit (basso = centro fermo)
 * @param {number} [props.orbitTiltX] rotateX in orbit; default tiltX * 1.35
 * @param {number} [props.orbitTiltY] rotateY in orbit; default tiltY * 1.35
 * @param {boolean} [props.lens]
 * @param {string} [props.objectPosition]
 * @param {string} [props.className]
 * @param {string} [props.alt]
 */
export function CurvedParallaxImage({
  src,
  strength = 14,
  scale = 1.1,
  tiltX = 1,
  tiltY = 1.4,
  autoOrbit = true,
  orbitPeriodSec = 14,
  orbitAmplitude = 0.92,
  orbitTranslate = 4,
  orbitTiltX,
  orbitTiltY,
  lens = true,
  objectPosition = 'center center',
  className = '',
  alt = '',
}) {
  const wrapperRef = useRef(/** @type {HTMLDivElement|null} */ (null));
  const imageRef = useRef(/** @type {HTMLImageElement|null} */ (null));
  const pointerActiveRef = useRef(false);

  const resolvedOrbitTiltX = orbitTiltX ?? tiltX * 1.35;
  const resolvedOrbitTiltY = orbitTiltY ?? tiltY * 1.35;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const image = imageRef.current;
    if (!wrapper || !image) return undefined;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;
    let alive = true;
    const startMs = performance.now();

    const applyTransform = () => {
      const pointer = pointerActiveRef.current;
      const moveStrength = pointer ? strength : orbitTranslate;
      const tx = pointer ? tiltX : resolvedOrbitTiltX;
      const ty = pointer ? tiltY : resolvedOrbitTiltY;

      const moveX = currentX * moveStrength;
      const moveY = currentY * moveStrength;
      const rotateY = currentX * ty;
      const rotateX = currentY * -tx;

      image.style.transform = [
        'translate(-50%, -50%)',
        `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`,
        `scale(${scale})`,
        `rotateX(${rotateX.toFixed(3)}deg)`,
        `rotateY(${rotateY.toFixed(3)}deg)`,
      ].join(' ');
    };

    const handlePointerMove = (event) => {
      pointerActiveRef.current = true;
      const rect = wrapper.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      targetX = (x - 0.5) * 2;
      targetY = (y - 0.5) * 2;
    };

    const handlePointerLeave = () => {
      pointerActiveRef.current = false;
    };

    const animate = () => {
      if (!alive) return;

      if (autoOrbit && !pointerActiveRef.current) {
        const t = (performance.now() - startMs) * 0.001;
        const omega = (Math.PI * 2) / Math.max(orbitPeriodSec, 1);
        targetX = Math.cos(t * omega) * orbitAmplitude;
        targetY = Math.sin(t * omega) * orbitAmplitude;
      }

      const lerp = pointerActiveRef.current ? 0.08 : 0.05;
      currentX += (targetX - currentX) * lerp;
      currentY += (targetY - currentY) * lerp;
      applyTransform();
      frame = requestAnimationFrame(animate);
    };

    applyTransform();
    wrapper.addEventListener('pointermove', handlePointerMove);
    wrapper.addEventListener('pointerleave', handlePointerLeave);
    frame = requestAnimationFrame(animate);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      wrapper.removeEventListener('pointermove', handlePointerMove);
      wrapper.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [
    strength,
    scale,
    tiltX,
    tiltY,
    autoOrbit,
    orbitPeriodSec,
    orbitAmplitude,
    orbitTranslate,
    resolvedOrbitTiltX,
    resolvedOrbitTiltY,
  ]);

  return (
    <div
      ref={wrapperRef}
      className={`curved-parallax ${lens ? 'curved-parallax--lens' : ''} ${className}`.trim()}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        draggable={false}
        decoding="async"
        style={{ objectPosition }}
      />
      <div className="curved-parallax__vignette" aria-hidden />
    </div>
  );
}

export default CurvedParallaxImage;
