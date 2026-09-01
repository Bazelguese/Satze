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
import { SatzeCursorHost } from './components/cursor/SatzeCursorHost';
import { IS_PUBLIC_PLAYTEST_BUILD } from './config/buildProfile';

const SHOW_CARD_TEST = false; // true per pagina test carte

// Lazy: SatzeGame non viene caricato finché non serve (evita blocco su images.js)
const SatzeGame = lazy(() => import('../Codice/satze.jsx'));
const CardTest = lazy(() => import('./components/cards/CardTest').then((m) => ({ default: m.CardTest })));
const DeckSummaryCropTool = lazy(() => import('./components/deck/DeckSummaryCropTool').then((m) => ({ default: m.DeckSummaryCropTool })));
const CardPrototypePage = lazy(() => import('./components/cards/CardPrototypePage').then((m) => ({ default: m.CardPrototypePage })));
const StyleLabPage = lazy(() => import('./components/styleLab/StyleLabPage'));
const DuelVfxLabPage = lazy(() => import('./components/duelVfxLab/DuelVfxLabPage').then((m) => ({ default: m.DuelVfxLabPage })));
const DuelClashToolPage = lazy(() => import('./components/duelVfxLab/DuelClashToolPage').then((m) => ({ default: m.DuelClashToolPage })));
const OverdriveLabPage = lazy(() => import('./components/overdriveLab/OverdriveLabPage').then((m) => ({ default: m.OverdriveLabPage })));
const PerfectFocusLabPage = lazy(() =>
  import('./components/perfectFocusLab/PerfectFocusLabPage').then((m) => ({ default: m.PerfectFocusLabPage }))
);
const DialogueLabPage = lazy(() => import('./components/dialogueLab/DialogueLabPage').then((m) => ({ default: m.DialogueLabPage })));
const ArenaContesaLayoutPage = lazy(() =>
  import('./components/arenaContesaLab/ArenaContesaLayoutPage').then((m) => ({ default: m.ArenaContesaLayoutPage }))
);
const EminenceArtLabPage = lazy(() =>
  import('./components/eminenceLab/EminenceArtLabPage').then((m) => ({ default: m.EminenceArtLabPage }))
);

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
    if (!IS_PUBLIC_PLAYTEST_BUILD) return undefined;
    document.body.classList.add('satze-public-build');
    const blockSelect = (e) => e.preventDefault();
    document.addEventListener('selectstart', blockSelect);
    return () => {
      document.body.classList.remove('satze-public-build');
      document.removeEventListener('selectstart', blockSelect);
    };
  }, []);

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

  const devToolsAllowed = !IS_PUBLIC_PLAYTEST_BUILD;
  const showCropTool = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cropTool') === '1';
  const showCardPrototype = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cardPrototype') === '1';
  const showStyleLab = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('styleLab') === '1';
  const showDuelVfxLab = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('duelVfxLab') === '1';
  const showDuelClashTool = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('duelClashTool') === '1';
  const showOverdriveLab = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('overdriveLab') === '1';
  const showPerfectFocusLab = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('perfectFocusLab') === '1';
  const showDialogueLab = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dialogue1') === '1';
  const showArenaContesa = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('arenaContesa') === '1';
  const showEminenceArtLab = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('eminenceArtLab') === '1';

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

  const closeOverdriveLab = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('overdriveLab');
    window.location.href = url.toString();
  };

  const closePerfectFocusLab = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('perfectFocusLab');
    window.location.href = url.toString();
  };

  const closeDialogueLab = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('dialogue1');
    window.location.href = url.toString();
  };

  const closeArenaContesa = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('arenaContesa');
    window.location.href = url.toString();
  };

  const closeEminenceArtLab = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('eminenceArtLab');
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
      ) : showOverdriveLab ? (
        <OverdriveLabPage onClose={closeOverdriveLab} />
      ) : showPerfectFocusLab ? (
        <PerfectFocusLabPage onClose={closePerfectFocusLab} />
      ) : showDialogueLab ? (
        <DialogueLabPage onClose={closeDialogueLab} />
      ) : showArenaContesa ? (
        <ArenaContesaLayoutPage onClose={closeArenaContesa} />
      ) : showEminenceArtLab ? (
        <EminenceArtLabPage onClose={closeEminenceArtLab} />
      ) : showCardPrototype ? (
        <CardPrototypePage onClose={closeCardPrototype} />
      ) : SHOW_CARD_TEST ? (
        <CardTest />
      ) : (
        <GameViewport>
          <CosmicTransitionProvider>
            <SatzeGame />
            <SatzeCursorHost />
          </CosmicTransitionProvider>
        </GameViewport>
      )}
    </Suspense>
  );
}
