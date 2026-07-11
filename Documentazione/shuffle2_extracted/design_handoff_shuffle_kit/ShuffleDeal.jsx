/* ============================================================================
 * Satze — Shuffle Kit · React reference component
 * ----------------------------------------------------------------------------
 * Plain React (hooks) reference that renders the Satze `sashNameHud` card and
 * drives it with shuffleKit.js. Provided as a PORTING AID for the real codebase
 * (Bazelguese/Satze, React + Vite + Electron) — recreate with the project's own
 * card component (CardReworkP4) if you prefer; only the wiring matters.
 *
 *   <ShuffleDeal kind="overhandCut" cards={myTenCards} handCount={5} />
 *
 * Each `card` object: { name, pot, dan, army, armyColor, img }.
 * The wrapper element carries CARD_TRANSITION so the engine's target changes
 * animate. Positions live in engine-space (geometry.stageW × stageH); scale the
 * outer stage to taste.
 * ========================================================================== */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShuffleController, initialDeck, DEFAULT_GEOMETRY, CARD_TRANSITION, SHUFFLES,
} from './shuffleKit.js';

// Satze back face — swap logoSrc for src/assets/logo-satze.png in-app.
function CardBack({ logoSrc }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 8,
      background: 'linear-gradient(160deg,#17171a,#0b0b0c 70%)', border: '1.5px solid #34343a',
      boxShadow: '0 4px 16px rgba(0,0,0,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {logoSrc && <img src={logoSrc} alt="" style={{ width: '58%', opacity: .85, filter: 'grayscale(1) brightness(1.4)', pointerEvents: 'none' }} />}
    </div>
  );
}

// Satze front face — the official `sashNameHud` layout.
function CardFront({ card }) {
  const pod = (color) => ({
    width: 20, height: 20, flex: 'none', borderRadius: '50%', background: 'rgba(0,0,0,.85)',
    border: `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 800, color, fontFamily: "'Share Tech Mono',monospace",
  });
  return (
    <div style={{
      position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
      borderRadius: 8, overflow: 'hidden', background: '#0a0a0d', border: '2px solid rgba(255,255,255,.28)',
      boxShadow: `0 0 0 1px ${card.armyColor}66, 0 4px 16px rgba(0,0,0,.9)`,
    }}>
      <img src={card.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.62) 0%,transparent 22%,transparent 68%,rgba(0,0,0,.6) 100%)' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 5, height: 26, background: `${card.armyColor}cc`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', boxShadow: '0 2px 6px rgba(0,0,0,.6)',
      }}>
        <div style={pod('#fde047')}>{card.pot}</div>
        <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 7, letterSpacing: '.04em', textTransform: 'uppercase', textShadow: '0 1px 3px #000', padding: '0 3px' }}>{card.name}</div>
        <div style={pod('#c084fc')}>{card.dan}</div>
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 12, background: card.armyColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 5.5,
        fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,.8)',
      }}>{card.army}</div>
    </div>
  );
}

function Card({ card, tf, geometry }) {
  return (
    <div style={{
      position: 'absolute', left: tf.x, top: tf.y, width: geometry.cardW, height: geometry.cardH,
      transform: `translate(-50%,-50%) rotate(${tf.rot}deg) scale(${tf.scale})`,
      transition: CARD_TRANSITION, zIndex: tf.z,
    }}>
      <div style={{
        position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
        transition: 'transform .55s cubic-bezier(.4,0,.2,1)', transform: `rotateY(${tf.flipped ? 180 : 0}deg)`,
      }}>
        <CardBack logoSrc={card.logo} />
        <CardFront card={card} />
      </div>
    </div>
  );
}

export default function ShuffleDeal({
  kind = 'overhandCut',
  cards,
  handCount = 5,
  geometry = DEFAULT_GEOMETRY,
  timeScale = 1,
  autoPlay = true,
  showReplayButton = true,
  logoSrc,
}) {
  const N = cards.length;
  const [tfs, setTfs] = useState(() => initialDeck(N, geometry));
  const [replay, setReplay] = useState(false);
  const ctlRef = useRef(null);

  useEffect(() => {
    const ctl = new ShuffleController({
      setCard: (id, patch) => setTfs(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t))),
      geometry, deckSize: N, handCount, timeScale,
    });
    ctlRef.current = ctl;
    if (autoPlay) { setReplay(false); ctl.play(kind, { onDone: () => setReplay(true) }); }
    return () => ctl.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, N, handCount, timeScale, autoPlay]);

  const play = () => { setReplay(false); ctlRef.current && ctlRef.current.play(kind, { onDone: () => setReplay(true) }); };

  const byId = useMemo(() => new Map(tfs.map(t => [t.id, t])), [tfs]);

  return (
    <div style={{ position: 'relative', width: geometry.stageW, height: geometry.stageH, background: '#0e0e0f', overflow: 'hidden', perspective: 1500 }}>
      {cards.map((c, i) => {
        const tf = byId.get(i) || initialDeck(N, geometry)[i];
        return <Card key={i} card={{ ...c, logo: logoSrc }} tf={tf} geometry={geometry} />;
      })}
      {showReplayButton && replay && (
        <button onClick={play} style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: '#ece9e2', background: 'rgba(245,243,236,0.06)',
          border: '1.5px solid #34343a', padding: '10px 24px', cursor: 'pointer', zIndex: 200,
        }}>Rigioca</button>
      )}
    </div>
  );
}

export { SHUFFLES };
