/**
 * Bootstrap dell'app: loading denso (asset + chunk + warm-up GPU/animazioni).
 * Solo gli sfondi campo full-res restano on-demand a inizio partita.
 */
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { FpsCounter } from './components/FpsCounter';
import { WarmupStage } from './components/WarmupStage';
import { preloadAllAssets } from './utils/preloadAssets';
import { GameViewport } from './components/GameViewport';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CosmicTransitionProvider } from './components/cosmic/ScreenTransition';
import { SatzeCursorHost } from './components/cursor/SatzeCursorHost';
import { IS_PUBLIC_PLAYTEST_BUILD } from './config/buildProfile';

const SHOW_CARD_TEST = false; // true per pagina test carte

/** Avvio immediato del chunk gioco (in parallelo al preload asset). */
const satzeGameModulePromise = import('../Codice/satze.jsx');

// Lab/tool: lazy on-demand (non nel boot principale)
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
const EminenceSystemLabPage = lazy(() =>
  import('./components/eminenceLab/EminenceSystemLabPage').then((m) => ({ default: m.EminenceSystemLabPage }))
);

/** Boot denso: aspetta fino a 90s prima di procedere comunque sugli asset. */
const PRELOAD_TIMEOUT_MS = 90000;
const MIN_LOADING_DISPLAY_MS = 600;

export function App() {
  return (
    <ErrorBoundary>
      <FpsCounter />
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [bootPhase, setBootPhase] = useState('assets'); // assets | warmup | ready
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState('Caricamento risorse');
  const [SatzeGame, setSatzeGame] = useState(null);

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
    const el = document.getElementById('loading-initial');
    if (el) el.remove();

    let cancelled = false;
    const startTime = Date.now();

    const run = async () => {
      let assetPercent = 0;
      let gameLoaded = false;

      const reportProgress = () => {
        if (cancelled) return;
        // Asset 0–72%, chunk gioco +8% → max 80% prima del warm-up
        setProgress(Math.min(80, Math.round(assetPercent * 0.72) + (gameLoaded ? 8 : 0)));
        setDetail(gameLoaded ? 'Caricamento risorse' : 'Caricamento motore e carte');
      };

      const assetsPromise = preloadAllAssets((_loaded, _total, percent) => {
        assetPercent = percent;
        reportProgress();
      }).catch((err) => {
        console.warn('Preload asset parziale:', err);
      });

      const assetsWithTimeout = Promise.race([
        assetsPromise,
        new Promise((resolve) => setTimeout(resolve, PRELOAD_TIMEOUT_MS)),
      ]);

      const gamePromise = satzeGameModulePromise
        .then((mod) => {
          gameLoaded = true;
          reportProgress();
          return mod.default;
        })
        .catch((err) => {
          console.error('Caricamento SatzeGame fallito:', err);
          throw err;
        });

      let GameComponent = null;
      try {
        const [, gameDefault] = await Promise.all([assetsWithTimeout, gamePromise]);
        GameComponent = gameDefault;
      } catch (err) {
        console.error('Impossibile caricare il gioco:', err);
      }

      if (cancelled || !GameComponent) return;

      setSatzeGame(() => GameComponent);
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed);
      await new Promise((r) => setTimeout(r, remaining));
      if (cancelled) return;

      setProgress(82);
      setDetail('Preparazione animazioni');
      setBootPhase('warmup');
    };

    run();
    return () => { cancelled = true; };
  }, []);

  const onWarmupProgress = useCallback((p) => {
    // Warm-up mappa su 82–99
    setProgress(Math.min(99, 82 + Math.round((Number(p) || 0) * 0.17)));
    setDetail('Riscaldamento grafica e animazioni');
  }, []);

  const onWarmupComplete = useCallback(() => {
    setProgress(100);
    setDetail('Pronto');
    // Un frame di “Pronto” poi entra
    requestAnimationFrame(() => {
      setTimeout(() => setBootPhase('ready'), 180);
    });
  }, []);

  if (bootPhase !== 'ready' || !SatzeGame) {
    return (
      <>
        {bootPhase === 'warmup' ? (
          <WarmupStage onComplete={onWarmupComplete} onProgress={onWarmupProgress} />
        ) : null}
        <LoadingScreen progress={progress} detail={detail} />
      </>
    );
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
  const showEminenceSystemLab = devToolsAllowed && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('eminenceSystemLab') === '1';

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

  const closeEminenceSystemLab = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('eminenceSystemLab');
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
      ) : showEminenceSystemLab ? (
        <EminenceSystemLabPage onClose={closeEminenceSystemLab} />
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
