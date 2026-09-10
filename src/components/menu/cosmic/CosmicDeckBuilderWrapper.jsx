import React, { useEffect, useState } from 'react';
import { LoadingScreen } from '../../LoadingScreen';
import { DeckBuilderLabPage } from '../../deckBuilderLab/DeckBuilderLabPage';
import { ALL_CARDS } from '../../deckBuilderLab/deckBuilderLabData';
import { getCardSprite } from '../../../utils/cardUtils';
import { getCardImageUrl, markImageUrlPreloaded } from '../../../data/images';
import '../../deckBuilderLab/deckBuilderLab.css';

function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

function preloadUrl(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }
    const img = new Image();
    const done = () => {
      markImageUrlPreloaded(url);
      resolve();
    };
    img.onload = () => {
      if (typeof img.decode === 'function') img.decode().then(done).catch(done);
      else done();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

async function preloadDeckBuilderAssets(onProgress) {
  const urls = [];
  const seen = new Set();
  for (const card of ALL_CARDS) {
    const sprite = getCardSprite(card);
    const url = getCardImageUrl(sprite?.type, sprite?.agentId);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }

  const total = Math.max(1, urls.length);
  let loaded = 0;
  const BATCH = 12;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    await Promise.all(batch.map((u) => preloadUrl(u)));
    loaded += batch.length;
    onProgress?.(Math.round((loaded / total) * 100));
  }
  onProgress?.(100);
}

/**
 * Gate di ingresso alla costruzione esercito:
 * precarica texture + CSS, monta il builder sotto loading, poi rivela.
 */
export function CosmicDeckBuilderWrapper(props) {
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState('Caricamento carte');
  const [assetsReady, setAssetsReady] = useState(false);
  const [uiReady, setUiReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setDetail('Caricamento carte e catalogo');
      try {
        await preloadDeckBuilderAssets((p) => {
          if (!cancelled) setProgress(Math.min(72, Math.round(p * 0.72)));
        });
      } catch (err) {
        console.warn('Preload builder parziale:', err);
      }
      if (cancelled) return;

      setDetail('Preparazione interfaccia');
      setProgress(78);
      await nextFrame();
      if (cancelled) return;
      setAssetsReady(true);
      setProgress(86);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Failsafe: non restare bloccati sul loading se il boot UI non segnala ready.
  useEffect(() => {
    if (!assetsReady || uiReady) return undefined;
    const t = window.setTimeout(() => {
      setProgress(100);
      setUiReady(true);
    }, 8000);
    return () => window.clearTimeout(t);
  }, [assetsReady, uiReady]);

  const handleBootProgress = (p) => {
    setProgress(Math.min(99, 86 + Math.round((Number(p) || 0) * 0.13)));
    setDetail('Riscaldamento griglia carte');
  };

  const handleBootReady = () => {
    setProgress(100);
    setDetail('Pronto');
    requestAnimationFrame(() => {
      setTimeout(() => setUiReady(true), 120);
    });
  };

  return (
    <div className="dbl-builder-shell">
      {!uiReady ? (
        <LoadingScreen progress={progress} detail={detail} />
      ) : null}
      {assetsReady ? (
        <div
          className="dbl-builder-boot-host"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: uiReady ? 1 : 0.02,
            pointerEvents: uiReady ? 'auto' : 'none',
            contain: 'strict',
          }}
          aria-hidden={!uiReady}
        >
          <DeckBuilderLabPage
            {...props}
            onBootProgress={handleBootProgress}
            onBootReady={handleBootReady}
          />
        </div>
      ) : null}
    </div>
  );
}
