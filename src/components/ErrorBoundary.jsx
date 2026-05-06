import React from 'react';
import { PALETTE, HUD_ORATORIO_FONT_UI } from '../theme/hudOratorioPalette';

/**
 * Error Boundary: cattura errori nei componenti figli e mostra
 * una schermata di fallback invece di far crashare l'intera app.
 */
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Satze crash:', error?.message ?? String(error));
    console.error('Stack:', error?.stack);
    console.error('Component stack:', errorInfo?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            background: PALETTE.deepVoid,
            color: PALETTE.textPrimary,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: HUD_ORATORIO_FONT_UI,
          }}
        >
          <h1 style={{ fontSize: 24, marginBottom: 16, color: PALETTE.magenta }}>
            Qualcosa è andato storto
          </h1>
          <p style={{ marginBottom: 24, textAlign: 'center', maxWidth: 400, color: PALETTE.textSecondary }}>
            Il gioco ha riscontrato un errore. Controlla la console (F12) per i dettagli.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              background: PALETTE.panelEdge,
              color: PALETTE.textPrimary,
              border: `1px solid ${PALETTE.slate}`,
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Ricarica il gioco
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
