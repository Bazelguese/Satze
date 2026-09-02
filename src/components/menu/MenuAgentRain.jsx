import { useEffect, useRef, useState } from 'react';
import { CardReworkP4, CardBack } from '../cards';
import { ALL_AGENTS, ARMY_COLORS, AGENT_IMAGES } from '../../data';
import { pickDistinctCardBackPair } from '../../utils/cardBackPicker';
import { DISPLAY_SETTINGS_CHANGED_EVENT, getDisplaySettings } from '../../settings/displaySettings';
import { getVfxQualityProfile, resolveVfxQualityProfile } from '../../settings/vfxQualityProfile';

/** [piano, x, durata caduta (s), durata rotazione (s), delay (s), deriva, tilt] — 16 carte */
const DROPS = [
  ['far', '3%', 40, 19, -7, '40px', '-3deg'],
  ['far', '16%', 46, 23, -21, '-60px', '2deg'],
  ['far', '30%', 43, 16, -33, '30px', '-2deg'],
  ['far', '45%', 48, 25, -11, '-40px', '4deg'],
  ['far', '60%', 42, 18, -42, '55px', '-4deg'],
  ['far', '75%', 41, 20, -27, '50px', '-3deg'],
  ['far', '90%', 45, 17, -38, '-30px', '2deg'],
  ['mid', '8%', 32, 14, -13, '-70px', '3deg'],
  ['mid', '24%', 35, 19, -29, '60px', '-4deg'],
  ['mid', '42%', 31, 13, -41, '-35px', '4deg'],
  ['mid', '58%', 30, 12, -5, '-50px', '2deg'],
  ['mid', '74%', 37, 21, -23, '80px', '-2deg'],
  ['mid', '90%', 33, 15, -35, '-45px', '5deg'],
  ['near', '12%', 26, 13, -17, '-90px', '-5deg'],
  ['near', '48%', 28, 16, -3, '70px', '4deg'],
  ['near', '82%', 24, 11, -31, '-65px', '-3deg'],
];

const TIERS = {
  far: { w: 120, k: 120 / 230, t: 1.5, filter: 'blur(2.4px) brightness(.32) saturate(.6) contrast(1.05)' },
  mid: { w: 190, k: 190 / 230, t: 2.5, filter: 'blur(1px) brightness(.48) saturate(.8)' },
  near: { w: 280, k: 280 / 230, t: 3.5, filter: 'brightness(.68)' },
};

/** In qualità bassa restano solo i piani lontani. */
const RAIN_BY_QUALITY = { low: ['far'], medium: ['far', 'mid'], high: ['far', 'mid', 'near'] };

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getAgentPool() {
  const withArt = ALL_AGENTS.filter((a) => AGENT_IMAGES?.[a.id] ?? AGENT_IMAGES?.[String(a.id)]);
  return withArt.length ? withArt : ALL_AGENTS;
}

/** Mazzo completo senza doppioni, armate alternate per varietà. */
function buildCycleDeck(pool) {
  if (!pool.length) return [];
  const byArmy = new Map();
  for (const agent of pool) {
    const list = byArmy.get(agent.army);
    if (list) list.push(agent);
    else byArmy.set(agent.army, [agent]);
  }
  for (const list of byArmy.values()) shuffleInPlace(list);
  const armies = shuffleInPlace([...byArmy.keys()]);
  const cursor = new Map(armies.map((army) => [army, 0]));
  const deck = [];
  while (deck.length < pool.length) {
    let progressed = false;
    for (const army of armies) {
      const list = byArmy.get(army);
      const i = cursor.get(army);
      if (i < list.length) {
        deck.push(list[i]);
        cursor.set(army, i + 1);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return deck;
}

/** Nuovo ciclo: prima le carte non in scena, poi quelle ancora a schermo. */
function refillCycleDeck(pool, excludeIds) {
  const available = [];
  const deferred = [];
  for (const agent of pool) {
    if (excludeIds.has(agent.id)) deferred.push(agent);
    else available.push(agent);
  }
  return [...buildCycleDeck(available), ...buildCycleDeck(deferred)];
}

/** Probabilità che una carta in cascata sia foil (fronte olografico). */
const FOIL_SPAWN_CHANCE = 0.01;

const CSS = `
.menu-rain{position:absolute;inset:-12% -6%;z-index:1;perspective:1700px;perspective-origin:50% 38%;pointer-events:none;overflow:hidden}
.menu-rain__card{position:absolute;top:0;left:var(--x);width:var(--w);aspect-ratio:230/330;transform-style:preserve-3d;animation:menu-rain-drop var(--dur) linear var(--d) infinite;will-change:transform;filter:var(--f)}
.menu-rain__spin{position:absolute;inset:0;transform-style:preserve-3d;animation:menu-rain-spin var(--sdur) linear var(--d) infinite}
.menu-rain__face{position:absolute;inset:0;backface-visibility:hidden;transform:translateZ(calc(var(--t)/2))}
.menu-rain__face--back{transform:rotateY(180deg) translateZ(calc(var(--t)/2))}
.menu-rain__scale{position:absolute;top:0;left:0;width:230px;height:330px;transform:scale(var(--k));transform-origin:top left}
.menu-rain__edge{position:absolute;top:0;height:100%;width:var(--t);background:linear-gradient(180deg,#2b2632 0%,#14121c 42%,#08060c 100%);box-shadow:inset 0 0 0 1px rgba(0,0,0,.6)}
.menu-rain__edge::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.10) 0 .5px,transparent .5px 1.6px),linear-gradient(90deg,color-mix(in srgb,var(--a) 35%,transparent),transparent 70%)}
.menu-rain__edge--l{left:0;transform-origin:0 50%;transform:translateZ(calc(var(--t)/-2)) rotateY(-90deg)}
.menu-rain__edge--r{right:0;transform-origin:100% 50%;transform:translateZ(calc(var(--t)/-2)) rotateY(90deg)}
.menu-rain__sheen{position:absolute;inset:0;border-radius:0 0 14px 14px;background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.5) 46%,rgba(255,255,255,.08) 56%,transparent 74%);mix-blend-mode:screen;opacity:0;animation:menu-rain-sheen var(--sdur) linear var(--d) infinite}
.menu-rain__foil{position:absolute;inset:0;border-radius:0 0 14px 14px;pointer-events:none;z-index:2;background:repeating-linear-gradient(0deg,rgb(255,119,115) 0%,rgba(255,237,95,1) 8%,rgba(168,255,95,1) 16%,rgba(131,255,247,1) 24%,rgba(120,148,255,1) 32%,rgb(216,117,255) 40%,rgb(255,119,115) 48%),repeating-linear-gradient(133deg,#0e152e 0%,hsl(180,10%,60%) 4%,hsl(180,29%,66%) 5%,hsl(180,10%,60%) 7%,#0e152e 9%,#0e152e 14%);background-size:400% 400%,200% 200%;mix-blend-mode:color-dodge;filter:brightness(.82) contrast(1.28) saturate(1.12);opacity:.52;animation:menu-rain-foil var(--sdur) linear var(--d) infinite}
.menu-rain__card--foil .menu-rain__sheen{animation-duration:calc(var(--sdur)*.9)}
.menu-rain::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 38% 42%,rgba(6,3,10,.25) 12%,rgba(6,3,10,.72) 62%,rgba(6,3,10,.97) 100%)}
@keyframes menu-rain-drop{from{transform:translate3d(0,-75vh,0) rotate(var(--tilt))}to{transform:translate3d(var(--dx),135vh,0) rotate(var(--tilt))}}
@keyframes menu-rain-spin{from{transform:rotateY(0deg)}to{transform:rotateY(360deg)}}
@keyframes menu-rain-sheen{0%{opacity:0}12%{opacity:.42}26%{opacity:0}50%{opacity:0}62%{opacity:.42}76%{opacity:0}100%{opacity:0}}
@keyframes menu-rain-foil{0%{background-position:0% 50%,0% 50%}50%{background-position:100% 50%,100% 0%}100%{background-position:0% 50%,0% 0%}}
`;

function pickBack(backs) {
  return backs[Math.floor(Math.random() * backs.length)];
}

/** @returns {boolean} */
export function rollMenuRainFoilSpawn(chance = FOIL_SPAWN_CHANCE) {
  return Math.random() < chance;
}

function buildRainSlot(agent, backs, gen = 0) {
  return {
    agent,
    backImage: pickBack(backs),
    gen,
    foil: rollMenuRainFoilSpawn(),
  };
}

export function MenuAgentRain() {
  const [profile, setProfile] = useState(() => getVfxQualityProfile());
  const poolRef = useRef(null);
  const backsRef = useRef(null);
  const deckRef = useRef(null);
  const slotsRef = useRef(null);

  if (!poolRef.current) poolRef.current = getAgentPool();
  if (!backsRef.current) {
    const { playerCardBack, enemyCardBack } = pickDistinctCardBackPair();
    backsRef.current = [playerCardBack, enemyCardBack];
  }
  if (!deckRef.current) deckRef.current = buildCycleDeck(poolRef.current);

  const drawAgent = () => {
    const pool = poolRef.current;
    if (!deckRef.current.length) {
      const exclude = new Set(
        (slotsRef.current || []).map((s) => s?.agent?.id).filter((id) => id != null),
      );
      deckRef.current = refillCycleDeck(pool, exclude);
    }
    if (!deckRef.current.length) {
      deckRef.current = buildCycleDeck(pool);
    }
    return deckRef.current.shift();
  };

  const [slots, setSlots] = useState(() => {
    const initial = Array.from({ length: DROPS.length }, () => buildRainSlot(drawAgent(), backsRef.current));
    slotsRef.current = initial;
    return initial;
  });

  useEffect(() => {
    const on = () => setProfile(resolveVfxQualityProfile(getDisplaySettings()));
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
  }, []);

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) return null;
  const allowed = RAIN_BY_QUALITY[profile.quality] ?? RAIN_BY_QUALITY.high;
  const drops = DROPS
    .map((drop, i) => ({ drop, i }))
    .filter(({ drop: [tier] }) => allowed.includes(tier));
  if (!drops.length) return null;

  const advanceSlot = (slotIndex) => {
    setSlots((prev) => {
      slotsRef.current = prev;
      const agent = drawAgent();
      if (!agent) return prev;
      const next = prev.slice();
      next[slotIndex] = buildRainSlot(agent, backsRef.current, (prev[slotIndex]?.gen ?? 0) + 1);
      slotsRef.current = next;
      return next;
    });
  };

  return (
    <div className="menu-rain" aria-hidden>
      <style>{CSS}</style>
      {drops.map(({ drop: [tier, x, dur, sdur, d, dx, tilt], i }) => {
        const slot = slots[i];
        if (!slot?.agent) return null;
        const { agent, backImage, gen, foil } = slot;
        const T = TIERS[tier];
        const accent = ARMY_COLORS[agent.army]?.accent || '#94a3b8';
        return (
          <div
            key={`rain-slot-${i}`}
            className={`menu-rain__card${foil ? ' menu-rain__card--foil' : ''}`}
            style={{
              '--x': x, '--w': `${T.w}px`, '--k': T.k, '--t': `${T.t}px`, '--f': T.filter,
              '--a': accent, '--dur': `${dur}s`, '--sdur': `${sdur}s`, '--d': `${d}s`,
              '--dx': dx, '--tilt': tilt,
            }}
            onAnimationIteration={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.animationName !== 'menu-rain-drop') return;
              advanceSlot(i);
            }}
          >
            <div className="menu-rain__spin">
              <div className="menu-rain__edge menu-rain__edge--l" />
              <div className="menu-rain__edge menu-rain__edge--r" />
              <div className="menu-rain__face">
                <div className="menu-rain__scale">
                  <CardReworkP4 key={`${agent.id}-${gen}`} agent={agent} showBonus suppressAnimations />
                </div>
                <div className="menu-rain__sheen" />
                {foil ? <div className="menu-rain__foil" /> : null}
              </div>
              <div className="menu-rain__face menu-rain__face--back">
                <div className="menu-rain__scale">
                  <CardBack key={`back-${agent.id}-${gen}`} armies={[agent.army]} backImage={backImage} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
