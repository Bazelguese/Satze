// ============================================================
// TeamDuelBoard — le quattro carte del 2v2 prima dei duelli
// ============================================================
// Si sovrappone al campo centrale del duello durante schieramento e piano segreto.
// Versioni di prova (variant):
//  - 'quattro'   : quattro slot, due per lato, carte un po' ridotte
//  - 'accanto'   : carte principali piene, compagni piccoli al loro fianco
//  - 'ventaglio' : compagni a grandezza piena dietro le principali, sfalsati
//  - 'alternanza': due carte piene alla volta, si passa da una coppia all'altra
// Le coordinate sono quelle della scena del duello (1920×1080).
// ============================================================

import { GameCard } from '../cards';

export const TEAM_BOARD_VARIANTS = [
  { id: 'quattro', name: 'Quattro slot' },
  { id: 'accanto', name: 'Compagno accanto' },
  { id: 'ventaglio', name: 'Ventaglio' },
  { id: 'alternanza', name: 'Alternanza' },
];

const VARIANT_STORAGE_KEY = 'satze_2v2_board_variant';

export function readBoardVariant() {
  try {
    const v = window.localStorage?.getItem(VARIANT_STORAGE_KEY);
    return TEAM_BOARD_VARIANTS.some((x) => x.id === v) ? v : 'ventaglio';
  } catch {
    return 'ventaglio';
  }
}

export function writeBoardVariant(v) {
  try {
    window.localStorage?.setItem(VARIANT_STORAGE_KEY, v);
  } catch {
    /* preferenza facoltativa */
  }
}

function Slot({ entry, card, cls, fieldName, note, onClick, onHover, cardLayout, accent }) {
  return (
    <div className={`tdb-slot ${cls}`} style={{ '--acc': accent }}>
      {card ? (
        <div
          className={`tdb-card${entry?.proposal ? ' is-proposal' : ''}${onClick ? ' is-clickable' : ''}`}
          onClick={onClick}
          onMouseEnter={onHover ? () => onHover(card) : undefined}
          title={onClick ? 'Clicca per riportarla in mano' : undefined}
        >
          <GameCard agent={card} cardLayout={cardLayout} disabled />
        </div>
      ) : (
        <div className="tdb-empty"><span>{entry?.isHuman ? 'Trascina un Agente' : 'In attesa…'}</span></div>
      )}
      <div className="tdb-tag">
        <b>{entry?.name}</b>
        {entry?.proposal ? <i>proposta</i> : null}
        {fieldName ? <span className="tdb-field">{fieldName}</span> : null}
        {note ? <span className="tdb-note">{note}</span> : null}
      </div>
    </div>
  );
}

/**
 * @param {object} p
 * @param {{ openingTeam: 'A'|'B', player: object[], enemy: object[] }} p.board
 * @param {string} p.variant
 * @param {object|null} p.humanCard - carta scelta dal giocatore ma non ancora confermata
 * @param {object[]} p.battlefields
 * @param {Record<string,string>} [p.opponentOf] - per posto: nome dell'avversario del fronte (piano)
 * @param {number} p.pairIndex - coppia mostrata nella variante 'alternanza'
 * @param {(i: number) => void} p.onPairIndex
 * @param {() => void} [p.onHumanCardClick]
 * @param {(card: object) => void} [p.onHover]
 * @param {string} p.cardLayout
 * @param {string} p.playerColor
 * @param {string} p.enemyColor
 */
export function TeamDuelBoard({
  board,
  variant,
  humanCard,
  battlefields,
  opponentOf = {},
  pairIndex = 0,
  onPairIndex,
  onHumanCardClick,
  onHover,
  cardLayout,
  playerColor,
  enemyColor,
}) {
  if (!board) return null;
  const fieldName = (e) => (e?.fieldIndex != null ? battlefields[e.fieldIndex]?.name : null);
  const cardOf = (e) => (e?.isHuman && !e.locked ? humanCard : e?.card) || null;
  const [b1, b2] = board.enemy;
  const [a1, a2] = board.player;
  const humanClick = !a1.locked && humanCard ? onHumanCardClick : undefined;
  const common = { cardLayout, onHover };

  const slots = [];
  if (variant === 'alternanza') {
    const p = pairIndex === 1 ? 1 : 0;
    const e = board.enemy[p];
    const a = board.player[p];
    slots.push(
      <Slot key="e" entry={e} card={cardOf(e)} cls="pos-enemy-main" fieldName={fieldName(e)} note={opponentOf[e.seatId]} accent={enemyColor} {...common} />,
      <Slot key="p" entry={a} card={cardOf(a)} cls="pos-player-main" fieldName={fieldName(a)} note={opponentOf[a.seatId]} accent={playerColor} onClick={p === 0 ? humanClick : undefined} {...common} />,
    );
  } else {
    slots.push(
      <Slot key="b2" entry={b2} card={cardOf(b2)} cls="pos-enemy-mate" fieldName={fieldName(b2)} note={opponentOf[b2.seatId]} accent={enemyColor} {...common} />,
      <Slot key="a2" entry={a2} card={cardOf(a2)} cls="pos-player-mate" fieldName={fieldName(a2)} note={opponentOf[a2.seatId]} accent={playerColor} {...common} />,
      <Slot key="b1" entry={b1} card={cardOf(b1)} cls="pos-enemy-main" fieldName={fieldName(b1)} note={opponentOf[b1.seatId]} accent={enemyColor} {...common} />,
      <Slot key="a1" entry={a1} card={cardOf(a1)} cls="pos-player-main" fieldName={fieldName(a1)} note={opponentOf[a1.seatId]} accent={playerColor} onClick={humanClick} {...common} />,
    );
  }

  return (
    <div className={`tdb tdb--${variant}${variant === 'alternanza' && pairIndex === 1 ? ' tdb-pair-2' : ''}`} data-team-board="">
      {slots}
      {variant === 'alternanza' && (
        <div className="tdb-pairs">
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              className={pairIndex === i ? 'on' : ''}
              onClick={() => onPairIndex?.(i)}
            >
              {i === 0 ? `${b1.name} · ${a1.name}` : `${b2.name} · ${a2.name}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
