import React, { useEffect, useMemo, useState } from 'react';

/** Durate ufficiali handoff duello2 (ms). */
export const DUEL_OV_DUR = {
  r5: 5200,
  win: 4400,
  lose: 5200,
};

/** Flip condizione vittoria: a fine tenda Round 5 (uscita verso sinistra). */
export const DUEL_R5_VICTORY_FLIP_MS = 4400;

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

function WinChips() {
  const chips = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 17) % 84)}%`,
        top: `${18 + ((i * 23) % 64)}%`,
        delay: `${0.9 + (i % 7) * 0.08}s`,
        dx: `${(i % 2 === 0 ? 1 : -1) * (40 + (i % 5) * 18)}px`,
        dy: `${-60 - (i % 6) * 22}px`,
        rot: `${(i % 2 === 0 ? 1 : -1) * (20 + i * 7)}deg`,
      })),
    []
  );
  return chips.map((c) => (
    <div
      key={c.id}
      className="chip"
      style={{
        left: c.left,
        top: c.top,
        animationDelay: c.delay,
        '--dx': c.dx,
        '--dy': c.dy,
        '--rot': c.rot,
      }}
    />
  ));
}

function LoseAsh() {
  const ashes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 13) % 88)}%`,
        bottom: `${4 + (i % 5) * 6}%`,
        delay: `${1.1 + (i % 9) * 0.12}s`,
        duration: `${2.2 + (i % 5) * 0.25}s`,
      })),
    []
  );
  return ashes.map((a) => (
    <div
      key={a.id}
      className="ash"
      style={{
        left: a.left,
        bottom: a.bottom,
        animationDelay: a.delay,
        animationDuration: a.duration,
      }}
    />
  ));
}

/** Overlay Round 5 — tenda R→L poi sequenza frasi */
export function DuelRound5Overlay({ active }) {
  if (!active) return null;
  return (
    <div className="ov r5 on" aria-hidden>
      <div className="r5-ink">
        <div className="slab" />
        <div className="grain" />
        <div className="flash" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="shard"
            style={{
              top: `${18 + i * 14}%`,
              left: 0,
              width: `${40 + i * 8}%`,
              animationDelay: `${0.85 + i * 0.07}s`,
            }}
          />
        ))}
        <div className="five">5</div>
        <div className="center beat-a">
          <div className="title">È il quinto turno!</div>
        </div>
        <div className="beat-b">
          <div className="kicker band">ROUND FINALE</div>
          <div className="title">ANNIENTA</div>
          <div className="sub">IL NEMICO</div>
          <div className="rule" />
          <div className="note">Vince chi ha più Punti Vita</div>
        </div>
      </div>
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

function SealMarks({ srcs }) {
  if (!srcs.length) return null;
  const dual = srcs.length >= 2;
  return (
    <div className={`seal${dual ? ' seal-dual' : ''}`}>
      {srcs.map((src, i) => (
        <img key={`${src}-${i}`} src={src} alt="" />
      ))}
    </div>
  );
}

/** Overlay vittoria — `.ov.win` */
export function DuelWinOverlay({ active, sealSrc, sealSrcs, subtitle }) {
  if (!active) return null;
  const srcs = normalizeSealSrcs(sealSrc, sealSrcs);
  return (
    <div className="ov win on" aria-hidden>
      <div className="slab" />
      <div className="rays" />
      <div className="plate" />
      <div className="wedge" />
      <WinChips />
      <SealMarks srcs={srcs} />
      <div className="content">
        <div className="word">
          {WIN_WORD.split('').map((ch, i) => (
            <span key={`${ch}-${i}`} style={{ animationDelay: `${0.55 + i * 0.06}s` }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="tag">{subtitle || 'Vittoria sul campo'}</div>
      </div>
    </div>
  );
}

/** Overlay sconfitta — `.ov.lose` (sigillo giocatore, mono o doppia armata) */
export function DuelLoseOverlay({ active, sealSrc, sealSrcs, subtitle }) {
  if (!active) return null;
  const srcs = normalizeSealSrcs(sealSrc, sealSrcs);
  return (
    <div className="ov lose on" aria-hidden>
      <div className="desat" />
      <div className="looming" />
      <SealMarks srcs={srcs} />
      <div className="tide t1" />
      <div className="tide t2" />
      <div className="tide t3" />
      <div className="crest" />
      <LoseAsh />
      <div className="center">
        <div className="title">{LOSE_WORD}</div>
        <div className="sub">{subtitle || 'Sconfitta sul campo'}</div>
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
