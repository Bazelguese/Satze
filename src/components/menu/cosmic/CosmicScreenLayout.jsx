import { CosmicMenuOverlay } from '../CosmicMenuOverlay';

export function CosmicScreenLayout({ title, subtitle, children, footer }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'auto',
        background: '#08070d',
        zIndex: 50,
        fontFamily: 'var(--font-ui)',
        color: 'var(--menu-text)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 14%, rgba(255,45,184,0.22) 0%, rgba(168,85,247,0.12) 24%, rgba(8,7,13,1) 66%)',
        }}
      />
      <CosmicMenuOverlay />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '28px 18px 22px',
          gap: '18px',
        }}
      >
        {(title || subtitle) && (
          <header style={{ textAlign: 'center' }}>
            {title && (
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.28em',
                  fontSize: 'clamp(1.1rem, 2.6vw, 1.9rem)',
                  textShadow: '0 0 24px rgba(255,45,184,0.32)',
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                style={{
                  marginTop: '8px',
                  color: '#a9a4b8',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.14em',
                  fontSize: '0.74rem',
                }}
              >
                {subtitle}
              </p>
            )}
          </header>
        )}

        <main style={{ width: '100%', maxWidth: '1180px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          {children}
        </main>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>
  );
}
