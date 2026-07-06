import { useState } from 'react';

export function CosmicBannerButton({ children, onClick, accent = 'var(--menu-magenta)', disabled = false, variant = 'primary', style }) {
  const [hovered, setHovered] = useState(false);
  const isSmall = variant === 'small';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: isSmall ? '8px 18px' : '12px 22px',
        minWidth: isSmall ? '160px' : '220px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        background: 'transparent',
        color: hovered ? 'var(--menu-void)' : 'var(--menu-text)',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        fontSize: isSmall ? '14px' : '16px',
        clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
        transition: 'transform 0.2s ease',
        transform: hovered && !disabled ? 'translateY(-2px)' : 'none',
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          border: `1.5px solid ${accent}`,
          background: hovered
            ? `linear-gradient(90deg, ${accent} 0%, var(--menu-hot-pink) 100%)`
            : 'linear-gradient(90deg, rgba(21,10,29,0.95) 0%, rgba(10,5,16,0.95) 100%)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: '5px',
          zIndex: 0,
          border: `1px solid ${hovered ? 'var(--menu-void)' : '#4a2b61'}`,
          clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  );
}
