import React, { useRef, useEffect, useState } from 'react';

/**
 * Nome carta con scroll al passaggio del mouse quando il testo è troppo lungo
 */
export const CardName = ({ name, className = '', small = false }) => {
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && innerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const contentWidth = innerRef.current.scrollWidth;
        // Solo overflow reale: duplica il nome solo se il testo non entra
        if (containerWidth > 0) {
          setShouldScroll(contentWidth > containerWidth);
        }
      }
    };
    checkOverflow();
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    const t = setTimeout(checkOverflow, 150);
    const t2 = setTimeout(checkOverflow, 500);
    const t3 = setTimeout(checkOverflow, 1000);
    return () => {
      resizeObserver.disconnect();
      clearTimeout(t);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [name]);

  const textSize = small ? 'text-[10px]' : 'text-xs';

  return (
    <span
      ref={containerRef}
      className={`${textSize} font-bold text-white drop-shadow-lg flex-1 min-w-0 ${
        shouldScroll ? 'card-name-scroll-on-hover' : 'truncate'
      } ${className}`}
    >
      <span ref={innerRef} className={shouldScroll ? 'card-name-inner' : ''}>
        {shouldScroll ? (
          <>
            {name}
            <span style={{ marginLeft: '1em' }} aria-hidden="true">{name}</span>
          </>
        ) : (
          name
        )}
      </span>
    </span>
  );
};
