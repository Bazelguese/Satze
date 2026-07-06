/**
 * Bootstrap dell'app: loading + preload + gioco
 * Mostra una schermata di caricamento invece dello schermo nero
 * e precarica solo gli asset essenziali del menu; gli sfondi campo
 * vengono caricati on-demand a inizio partita (vedi preloadAssets.js).
 */
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { preloadAllAssets } from './utils/preloadAssets';
import { GameViewport } from './components/GameViewport';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CosmicTransitionProvider } from './components/cosmic/ScreenTransition';

const SHOW_CARD_TEST = false; // true per pagina test carte

// Lazy: SatzeGame non viene caricato finché non serve (evita blocco su images.js)
const SatzeGame = lazy(() => import('../Codice/satze.jsx'));
const CardTest = lazy(() => import('./components/cards/CardTest').then((m) => ({ default: m.CardTest })));
const DeckSummaryCropTool = lazy(() => import('./components/deck/DeckSummaryCropTool').then((m) => ({ default: m.DeckSummaryCropTool })));
const CardPrototypePage = lazy(() => import('./components/cards/CardPrototypePage').then((m) => ({ default: m.CardPrototypePage })));
const StyleLabPage = lazy(() => import('./components/styleLab/StyleLabPage'));
const DuelVfxLabPage = lazy(() => import('./components/duelVfxLab/DuelVfxLabPage').then((m) => ({ default: m.DuelVfxLabPage })));
const DuelClashToolPage = lazy(() => import('./components/duelVfxLab/DuelClashToolPage').then((m) => ({ default: m.DuelClashToolPage })));

const PRELOAD_TIMEOUT_MS = 12000; // Max 12s di preload, poi procedi comunque
const MIN_LOADING_DISPLAY_MS = 2500; // Schermata di caricamento visibile almeno 2.5s

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Rimuovi il loading HTML statico (sostituito da React)
    const el = document.getElementById('loading-initial');
    if (el) el.remove();

    let cancelled = false;
    const startTime = Date.now();

    const run = async () => {
      try {
        const preloadPromise = preloadAllAssets((loaded, total, percent) => {
          if (!cancelled) setProgress(percent);
        });
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(resolve, PRELOAD_TIMEOUT_MS)
        );
        await Promise.race([preloadPromise, timeoutPromise]);
      } catch (err) {
        console.warn('Preload parziale:', err);
      }
      if (!cancelled) {
        setProgress(100);
        // Attendi che siano passati almeno MIN_LOADING_DISPLAY_MS dall'avvio
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed);
        await new Promise((r) => setTimeout(r, remaining + 300));
        if (!cancelled) setIsReady(true);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  if (!isReady) {
    return <LoadingScreen progress={progress} />;
  }

  const showCropTool = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cropTool') === '1';
  const showCardPrototype = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cardPrototype') === '1';
  const showStyleLab = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('styleLab') === '1';
  const showDuelVfxLab = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('duelVfxLab') === '1';
  const showDuelClashTool = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('duelClashTool') === '1';

  const closeCropTool = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('cropTool');
    window.location.href = url.toString();
  };

  const closeCardPrototype = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('cardPrototype');
    window.location.href = url.toString();
  };

  const closeStyleLab = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('styleLab');
    window.location.href = url.toString();
  };

  const closeDuelVfxLab = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('duelVfxLab');
    window.location.href = url.toString();
  };

  const closeDuelClashTool = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('duelClashTool');
    window.location.href = url.toString();
  };

  return (
    <Suspense fallback={<LoadingScreen progress={100} />}>
      {showCropTool ? (
        <DeckSummaryCropTool onClose={closeCropTool} />
      ) : showStyleLab ? (
        <StyleLabPage onClose={closeStyleLab} />
      ) : showDuelVfxLab ? (
        <DuelVfxLabPage onClose={closeDuelVfxLab} />
      ) : showDuelClashTool ? (
        <DuelClashToolPage onClose={closeDuelClashTool} />
      ) : showCardPrototype ? (
        <CardPrototypePage onClose={closeCardPrototype} />
      ) : SHOW_CARD_TEST ? (
        <CardTest />
      ) : (
        <GameViewport>
          <CosmicTransitionProvider>
            <SatzeGame />
          </CosmicTransitionProvider>
        </GameViewport>
      )}
    </Suspense>
  );
}
