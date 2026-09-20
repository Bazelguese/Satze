import React, { useEffect, useMemo, useState } from 'react';
import { RuneTitle, CARD_RUNES } from '../ui/RuneTitle.jsx';

/** Durate ufficiali handoff duello2 (ms). */
export const DUEL_OV_DUR = {
  r5: 6200,
  win: 4400,
  lose: 5200,
};

/** Flip condizione vittoria: a fine tenda Round 5 (uscita verso sinistra). */
export const DUEL_R5_VICTORY_FLIP_MS = 5400;

const WIN_WORD = 'TRIONFO';
const LOSE_WORD = 'SCONFITTA';

/**
 * Sottotitolo esito in base al motivo di vittoria/sconfitta.
 * @param {{ winner?: string, reason?: string } | null | undefined} gameResult
 * @param {'win'|'lose'} kind
 */
export function getDuelOutcomeSubtitle(gameResult, kind) {
  const reason = gameResult?.reason;
  if (kind === 'win') {
    if (reason === 'hp') return 'Più PV del tuo avversario';
    if (reason === 'fields') return '3 campi conquistati';
    return 'Vittoria sul campo';
  }
  if (reason === 'hp') return 'Meno PV del tuo avversario';
  if (reason === 'fields') return "3 campi conquistati dall'avversario";
  return 'Sconfitta sul campo';
}

/* ─────────────────────────────────────────────────────────────────────────
 * Linguaggio comune (HUD cosmico): un grande portale ellittico che si apre sul
 * campo, anello di rune delle carte che scorre lungo il bordo, testi che si
 * decifrano dalle rune (RuneTitle). Colore d'armata solo per bagliori e rune.
 * ───────────────────────────────────────────────────────────────────────── */

/** Portale grande: ellissi, tacche in moto e rune che scorrono sul bordo. */
function CinePortal({ rx, ry, lap = 26, count = 34, className = '' }) {
  const pad = 40;
  const w = (rx + pad) * 2;
  const h = (ry + pad) * 2;
  const cx = w / 2;
  const cy = h / 2;
  const gap = 18;
  const id = useMemo(() => `cine-ring-${Math.random().toString(36).slice(2, 8)}`, []);
  const ring = `M ${cx - rx - gap} ${cy} A ${rx + gap} ${ry + gap} 0 1 1 ${cx + rx + gap} ${cy} A ${rx + gap} ${ry + gap} 0 1 1 ${cx - rx - gap} ${cy}`;
  return (
    <svg className={`cine-portal ${className}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <radialGradient id={`${id}-win`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a2130" stopOpacity=".55" />
          <stop offset="70%" stopColor="#070a10" stopOpacity=".92" />
          <stop offset="100%" stopColor="#020305" stopOpacity="1" />
        </radialGradient>
        <path id={id} d={ring} />
      </defs>
      <ellipse className="cine-portal-window" cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-win)`} />
      <ellipse className="cine-portal-halo" cx={cx} cy={cy} rx={rx + 4} ry={ry + 4} />
      <ellipse className="cine-portal-edge" cx={cx} cy={cy} rx={rx} ry={ry} />
      <ellipse className="cine-portal-ticks" cx={cx} cy={cy} rx={rx + 8} ry={ry + 8} pathLength="360" />
      <ellipse className="cine-portal-outer" cx={cx} cy={cy} rx={rx + gap + 12} ry={ry + gap + 12} pathLength="100" />
      {Array.from({ length: count }, (_, i) => (
        <g key={i}>
          <animateMotion dur={`${lap}s`} repeatCount="indefinite" rotate="auto" begin={`${(-lap * i) / count}s`}>
            <mpath href={`#${id}`} />
          </animateMotion>
          <path d={CARD_RUNES[(i * 5) % CARD_RUNES.length]} className="cine-portal-rune" transform="scale(1.9)" />
        </g>
      ))}
    </svg>
  );
}

/** Rune che schizzano fuori dal portale (vittoria) o cadono (sconfitta). */
function RuneBurst({ n = 22, mode = 'out' }) {
  const bits = useMemo(
    () => Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + (i % 3) * 0.2;
      const r = mode === 'out' ? 300 + (i % 5) * 60 : 0;
      return {
        id: i,
        rune: CARD_RUNES[(i * 7) % CARD_RUNES.length],
        x0: Math.cos(a) * 180,
        y0: Math.sin(a) * 240,
        dx: mode === 'out' ? Math.cos(a) * r : ((i % 5) - 2) * 26,
        dy: mode === 'out' ? Math.sin(a) * r : 260 + (i % 4) * 70,
        rot: ((i % 2) ? 1 : -1) * (90 + i * 23),
        delay: (mode === 'out' ? 0.95 : 2.9) + (i % 6) * 0.05,
      };
    }),
    [n, mode]
  );
  return (
    <div className={`cine-burst is-${mode}`} aria-hidden>
      {bits.map((b) => (
        <svg
          key={b.id}
          className="cine-burst-rune"
          viewBox="-4 -4 8 8"
          style={{
            left: `calc(50% + ${b.x0}px)`,
            top: `calc(50% + ${b.y0}px)`,
            animationDelay: `${b.delay}s`,
            '--dx': `${b.dx}px`,
            '--dy': `${b.dy}px`,
            '--rot': `${b.rot}deg`,
          }}
        >
          <path d={b.rune} />
        </svg>
      ))}
    </div>
  );
}

/** Normalizza 1–2 src sigillo (compat: stringa singola o array). */
function normalizeSealSrcs(sealSrc, sealSrcs) {
  const list = Array.isArray(sealSrcs)
    ? sealSrcs
    : sealSrc
      ? [sealSrc]
      : [];
  return list.filter(Boolean).slice(0, 2);
}

function SealMarks({ srcs, className = '' }) {
  if (!srcs.length) return null;
  return (
    <div className={`cine-seal${srcs.length >= 2 ? ' is-dual' : ''} ${className}`}>
      {srcs.map((src, i) => (
        <img key={`${src}-${i}`} src={src} alt="" />
      ))}
    </div>
  );
}

/**
 * Round 5 — il portale si spalanca con il 5 dentro; "È il quinto turno!" si
 * decifra e torna runa, poi "ANNIENTA il nemico"; il portale si richiude sul
 * campo (DUEL_OV_DUR.r5, flip condizione a DUEL_R5_VICTORY_FLIP_MS).
 */
export function DuelRound5Overlay({ active }) {
  if (!active) return null;
  return (
    <div className="cine cine-r5" aria-hidden>
      <div className="cine-veil" />
      <div className="cine-stage">
        <CinePortal rx={170} ry={232} lap={22} />
        <div className="cine-r5-five">5</div>
      </div>
      <div className="cine-r5-beat-a">
        <RuneTitle text="È il quinto turno!" global={false} delay={950} stepMs={45} reverseAt={2700} className="cine-r5-lead" />
      </div>
      <div className="cine-r5-beat-b">
        <div className="cine-kicker"><RuneTitle text="Round finale" global={false} delay={2900} stepMs={45} reverseAt={4700} /></div>
        <div className="cine-r5-title"><RuneTitle text="ANNIENTA" global={false} delay={3000} stepMs={75} reverseAt={4650} /></div>
        <div className="cine-r5-sub"><RuneTitle text="il nemico" global={false} delay={3350} stepMs={55} reverseAt={4700} /></div>
        <div className="cine-rule" />
        <div className="cine-r5-note"><RuneTitle text="Vince chi ha più Punti Vita" global={false} delay={3550} stepMs={28} reverseAt={4750} /></div>
      </div>
      <div className="cine-flash" />
    </div>
  );
}

/** Vittoria — portale nel colore della tua armata, sigillo impresso, TRIONFO dalle rune. */
export function DuelWinOverlay({ active, sealSrc, sealSrcs, subtitle }) {
  if (!active) return null;
  const srcs = normalizeSealSrcs(sealSrc, sealSrcs);
  return (
    <div className="cine cine-win" aria-hidden>
      <div className="cine-veil" />
      <div className="cine-rays" />
      <div className="cine-stage">
        <CinePortal rx={160} ry={218} lap={14} />
        <SealMarks srcs={srcs} />
      </div>
      <RuneBurst mode="out" />
      <div className="cine-outcome">
        <div className="cine-word"><RuneTitle text={WIN_WORD} global={false} delay={500} stepMs={85} /></div>
        <div className="cine-tag"><RuneTitle text={subtitle || 'Vittoria sul campo'} global={false} delay={1250} stepMs={30} /></div>
      </div>
      <div className="cine-flash" />
    </div>
  );
}

/** Sconfitta — portale nel colore avversario, il tuo sigillo si spegne, SCONFITTA torna runa. */
export function DuelLoseOverlay({ active, sealSrc, sealSrcs, subtitle }) {
  if (!active) return null;
  const srcs = normalizeSealSrcs(sealSrc, sealSrcs);
  return (
    <div className="cine cine-lose" aria-hidden>
      <div className="cine-desat" />
      <div className="cine-veil" />
      <div className="cine-stage">
        <CinePortal rx={160} ry={218} lap={40} />
        <SealMarks srcs={srcs} />
      </div>
      <RuneBurst mode="fall" n={18} />
      <div className="cine-outcome">
        <div className="cine-word"><RuneTitle text={LOSE_WORD} global={false} delay={1100} stepMs={95} reverseAt={3500} /></div>
        <div className="cine-tag"><RuneTitle text={subtitle || 'Sconfitta sul campo'} global={false} delay={1900} stepMs={30} reverseAt={3700} /></div>
      </div>
    </div>
  );
}

/**
 * Mostra l'overlay esito una sola volta per gameResult, poi lo spegne.
 * @returns {'win'|'lose'|null} quale overlay è attivo
 */
export function useDuelOutcomeOverlay(gamePhase, gameResult) {
  const [kind, setKind] = useState(null);

  useEffect(() => {
    if (gamePhase !== 'gameOver' || !gameResult) {
      setKind(null);
      return undefined;
    }
    if (gameResult.winner === 'player') setKind('win');
    else if (gameResult.winner === 'enemy') setKind('lose');
    else {
      setKind(null);
      return undefined;
    }
    const ms = gameResult.winner === 'player' ? DUEL_OV_DUR.win : DUEL_OV_DUR.lose;
    const t = setTimeout(() => setKind(null), ms);
    return () => clearTimeout(t);
  }, [gamePhase, gameResult]);

  return kind;
}
