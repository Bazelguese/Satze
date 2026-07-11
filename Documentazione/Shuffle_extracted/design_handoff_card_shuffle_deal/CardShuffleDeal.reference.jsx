// Reference port of CardShuffleDeal.source.html into plain React.
// Mirrors the source structure/timing/values 1:1 — adapt to the real
// codebase's card art, deck data (src/data/cards.js) and component
// conventions (see CardReworkP4.jsx for the real in-game card layout).

import React from 'react';

const CARD_W = 150, CARD_H = 214;
const STAGE_CX = 500, STAGE_CY = 300;
const DECK_POS = { x: 330, y: 300 };
const REMAIN_POS = { x: 150, y: 300 };
const HAND_Y = 522;

// Replace with the real deck (src/data/cards.js / armies.js).
const CARD_DATA = [
  { name: "Veggente dell'Alba", pot: 7, dan: 5, army: "Figli dell'Orizzonte", armyColor: '#a78bfa', img: './assets/cards/101.png' },
  { name: 'Custode Astrale', pot: 5, dan: 6, army: "Figli dell'Orizzonte", armyColor: '#a78bfa', img: './assets/cards/102.png' },
  { name: 'Ombra Cometa', pot: 6, dan: 4, army: "Figli dell'Orizzonte", armyColor: '#a78bfa', img: './assets/cards/111.png' },
  { name: 'Sacerdote del Tempio', pot: 8, dan: 3, army: 'Kethran', armyColor: '#fbbf24', img: './assets/cards/201.png' },
  { name: "Guardiano d'Ambra", pot: 4, dan: 7, army: 'Kethran', armyColor: '#fbbf24', img: './assets/cards/202.png' },
  { name: 'Araldo Dorato', pot: 6, dan: 6, army: 'Kethran', armyColor: '#fbbf24', img: './assets/cards/211.png' },
  { name: 'Lama Scarlatta', pot: 9, dan: 2, army: 'Corte Rossa', armyColor: '#f43f5e', img: './assets/cards/301.png' },
  { name: 'Boia della Corte', pot: 5, dan: 8, army: 'Corte Rossa', armyColor: '#f43f5e', img: './assets/cards/311.png' },
  { name: 'Fante Corazzato', pot: 4, dan: 9, army: 'Calibri Pesanti', armyColor: '#94a3b8', img: './assets/cards/401.png' },
  { name: "Colosso d'Acciaio", pot: 7, dan: 5, army: 'Calibri Pesanti', armyColor: '#94a3b8', img: './assets/cards/411.png' },
];

function fanSlot(i, n) {
  const t = n === 1 ? 0.5 : i / (n - 1);
  return {
    x: STAGE_CX + (t - 0.5) * 620,
    y: STAGE_CY - Math.sin(t * Math.PI) * 36,
    rot: (t - 0.5) * 56,
  };
}

function handSlot(i, n) {
  const t = n === 1 ? 0.5 : i / (n - 1);
  return {
    x: STAGE_CX + (t - 0.5) * 480,
    y: HAND_Y - Math.sin(t * Math.PI) * 22,
    rot: (t - 0.5) * 44,
  };
}

function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function initialCards() {
  return CARD_DATA.map((d, i) => ({
    id: i,
    ...d,
    x: DECK_POS.x + i * 0.6,
    y: DECK_POS.y + i * 1.4,
    rot: (i - 4.5) * 0.8,
    scale: 1,
    z: i,
    flipped: false,
  }));
}

export default function CardShuffleDeal() {
  const [cards, setCards] = React.useState(initialCards);
  const [showReplay, setShowReplay] = React.useState(false);
  const timers = React.useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const after = (ms, fn) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const setCard = (idx, patch) => {
    setCards(prev => {
      const next = prev.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const play = React.useCallback(() => {
    clearTimers();
    setCards(initialCards());
    setShowReplay(false);

    after(500, () => {
      CARD_DATA.forEach((_, i) => {
        const slot = fanSlot(i, 10);
        setCard(i, { x: slot.x, y: slot.y, rot: slot.rot, z: 10 + i });
      });
    });

    let slotOrder = CARD_DATA.map((_, i) => i);
    const applyOrder = (order, delay) => {
      after(delay, () => {
        order.forEach((cardIdx, slotIdx) => {
          const slot = fanSlot(slotIdx, 10);
          setCard(cardIdx, { x: slot.x, y: slot.y, rot: slot.rot, z: 30 + slotIdx });
        });
      });
    };

    let t = 1350;
    for (let round = 0; round < 2; round++) {
      slotOrder = shuffleArr(slotOrder);
      applyOrder(slotOrder, t);
      t += 620;
    }
    const finalOrder = slotOrder;

    after(t, () => {
      finalOrder.forEach((cardIdx, pos) => {
        setCard(cardIdx, {
          x: DECK_POS.x + pos * 0.6,
          y: DECK_POS.y + pos * 1.4,
          rot: (pos - 4.5) * 0.8,
          z: 10 - pos,
        });
      });
    });
    t += 900;

    for (let k = 0; k < 5; k++) {
      const cardIdx = finalOrder[k];
      after(t + k * 300, () => {
        const slot = handSlot(k, 5);
        setCard(cardIdx, { x: slot.x, y: slot.y, rot: slot.rot, z: 50 + k, flipped: true, scale: 1.06 });
      });
    }
    after(t, () => {
      finalOrder.slice(5).forEach((cardIdx, pos) => {
        setCard(cardIdx, {
          x: REMAIN_POS.x + pos * 0.6,
          y: REMAIN_POS.y + pos * 1.4,
          rot: (pos - 2) * 1.2,
          z: 5 - pos,
        });
      });
    });
    t += 5 * 300 + 750;

    after(t, () => setShowReplay(true));
  }, []);

  React.useEffect(() => {
    play();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg-night)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-ui)',
    }}>
      <div style={{ position: 'relative', width: 1000, height: 600, perspective: 1600 }}>
        {cards.map(c => {
          const wrapStyle = {
            position: 'absolute', left: c.x, top: c.y, width: CARD_W, height: CARD_H,
            transform: `translate(-50%,-50%) rotate(${c.rot}deg) scale(${c.scale})`,
            transition: 'left .7s cubic-bezier(.4,0,.2,1), top .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1)',
            zIndex: c.z,
          };
          const innerStyle = {
            position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
            transition: 'transform .6s cubic-bezier(.4,0,.2,1)',
            transform: `rotateY(${c.flipped ? 180 : 0}deg)`,
          };
          return (
            <div key={c.id} style={wrapStyle}>
              <div style={innerStyle}>
                {/* back face */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  borderRadius: 10, background: 'linear-gradient(160deg,#17171a,#0b0b0c 70%)',
                  border: '1.5px solid var(--accent-slate)', boxShadow: 'var(--sh-drop)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img src="./assets/logo-satze.png" alt="" style={{ width: '58%', opacity: 0.85, filter: 'grayscale(1) brightness(1.4)', pointerEvents: 'none' }} />
                </div>
                {/* front face */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                  borderRadius: 10, overflow: 'hidden', background: '#0a0a0d',
                  border: '2px solid rgba(255,255,255,.28)',
                  boxShadow: `0 0 0 1px ${c.armyColor}66, var(--sh-drop)`,
                }}>
                  <img src={c.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.62) 0%,transparent 22%,transparent 68%,rgba(0,0,0,.6) 100%)' }} />
                  <div style={{
                    position: 'absolute', left: 0, right: 0, top: 6, height: 34,
                    background: `${c.armyColor}cc`, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '0 7px', boxShadow: '0 2px 6px rgba(0,0,0,.6)',
                  }}>
                    <div style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: 'rgba(0,0,0,.85)', border: '1.5px solid #fde047', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fde047', fontFamily: 'var(--font-mono)' }}>{c.pot}</div>
                    <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 8.5, letterSpacing: '.05em', textTransform: 'uppercase', textShadow: '0 1px 3px #000', padding: '0 3px' }}>{c.name}</div>
                    <div style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: 'rgba(0,0,0,.85)', border: '1.5px solid #c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>{c.dan}</div>
                  </div>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 16, background: c.armyColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 6.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,.8)' }}>{c.army}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showReplay && (
        <button
          onClick={play}
          style={{
            position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'var(--fg1)', background: 'rgba(245,243,236,0.06)',
            border: '1.5px solid var(--accent-slate)', padding: '11px 26px', cursor: 'pointer',
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent-light)';
            e.currentTarget.style.background = 'rgba(245,243,236,0.14)';
            e.currentTarget.style.boxShadow = 'var(--glow-light)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--accent-slate)';
            e.currentTarget.style.background = 'rgba(245,243,236,0.06)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Rigioca
        </button>
      )}
    </div>
  );
}
