import { useState } from 'react';
import { MENU_ACCENTS } from '../../../theme/hudOratorioPalette';
import { ARMY_ICONS } from '../../../data/icons.jsx';

export function CosmicArmyCard({
  army,
  accentColor,
  description,
  subtitle = '15 carte • 2 eserciti',
  onClick,
  fallbackGlyph = '⚔',
}) {
  const [hovered, setHovered] = useState(false);
  const logoSrc = ARMY_ICONS[army];

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        maxWidth: 'none',
        minHeight: '250px',
        border: `1.5px solid ${hovered ? MENU_ACCENTS.hotPink : `${accentColor}aa`}`,
        background: 'linear-gradient(180deg, rgba(20,8,28,0.96) 0%, rgba(8,7,13,0.96) 100%)',
        clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
        boxShadow: hovered ? `0 0 28px ${accentColor}66` : '0 6px 20px rgba(0,0,0,0.55)',
        color: MENU_ACCENTS.text,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '88px',
          height: '88px',
          marginBottom: '8px',
          display: 'grid',
          placeItems: 'center',
          background: `radial-gradient(circle at 50% 42%, ${accentColor}55 0%, ${accentColor}22 48%, transparent 72%)`,
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={army}
            style={{ width: '76px', height: '76px', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: '2.2rem' }}>{fallbackGlyph}</span>
        )}
      </div>
      <h3
        style={{
          margin: 0,
          fontFamily: "'Cinzel', serif",
          fontWeight: 800,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          fontSize: '0.86rem',
          color: accentColor,
        }}
      >
        {army}
      </h3>
      <p
        style={{
          margin: '5px 0 4px',
          color: '#a9a4b8',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.58rem',
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
        }}
      >
        {subtitle}
      </p>
      <p
        style={{
          margin: 0,
          padding: '4px 6px',
          border: `1px solid ${accentColor}66`,
          background: `${accentColor}1a`,
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: '0.66rem',
          lineHeight: 1.25,
        }}
      >
        {description}
      </p>
    </button>
  );
}
