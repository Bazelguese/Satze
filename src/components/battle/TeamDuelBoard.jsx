// ============================================================
// TeamDuelBoard — le quattro carte del 2v2 prima dei duelli
// ============================================================
// Si sovrappone al campo centrale del duello durante schieramento e piano segreto.
// Posizioni, scala, rotazione, livello ed etichette arrivano da una versione di layout
// (src/config/teamBoardLayouts.js), modificabile nel laboratorio TAVOLO 2V2 LAB.
// Coordinate della scena del duello (1920×1080).
// ============================================================

import { useEffect, useState } from 'react';
import { GameCard } from '../cards';
import { ArmyEntryFx } from '../fx/ArmyCardFx.jsx';
import { getArmyAccent } from '../../theme/duelAccents';
import { getPlaceFxPreference, placeFxStyleClass, resolvePlaceFxForVia } from '../../utils/placeFxPreference';
import {
  CARD_H,
  CARD_W,
  loadBoardLayouts,
  readActiveBoardLayoutId,
  subscribeBoardLayouts,
  writeActiveBoardLayoutId,
} from '../../config/teamBoardLayouts';
import '../../styles/satze-multi-seat.css';

/** Elenco delle versioni e versione attiva, aggiornati quando il laboratorio le modifica. */
export function useBoardLayouts() {
  const [state, setState] = useState(() => ({ layouts: loadBoardLayouts(), activeId: readActiveBoardLayoutId() }));
  useEffect(() => subscribeBoardLayouts(() => {
    setState({ layouts: loadBoardLayouts(), activeId: readActiveBoardLayoutId() });
  }), []);
  return {
    layouts: state.layouts,
    activeId: state.activeId,
    active: state.layouts[state.activeId],
    setActiveId: writeActiveBoardLayoutId,
  };
}

function slotStyle(cfg, side) {
  return {
    left: cfg.x,
    top: cfg.y,
    width: CARD_W * cfg.s,
    zIndex: cfg.z,
    '--s': cfg.s,
    '--r': `${cfg.r}deg`,
    '--dim': cfg.dim,
    transformOrigin: side === 'enemy' ? 'bottom right' : 'bottom left',
  };
}

function tagStyle(cfg) {
  return {
    left: cfg.tagX || 0,
    top: cfg.tagY == null ? CARD_H * cfg.s + 8 : cfg.tagY,
    justifyContent: cfg.tagAlign === 'left' ? 'flex-start' : cfg.tagAlign === 'right' ? 'flex-end' : 'center',
  };
}

/**
 * Ingresso della carta sul tavolo: stessa posa e stesso ingresso d'armata degli Agenti in
 * campo nel duello (preferenze di «Ingresso carta»). Va rimontata (key) a ogni schieramento.
 * Le pose «a tonfo» (drop) non hanno bisogno del dorso, quindi vanno bene per tutte e quattro.
 */
function BoardEntrance({ card, children }) {
  const [fx] = useState(() => {
    const prefs = getPlaceFxPreference();
    return { pose: prefs.army === 'replace' ? 'none' : resolvePlaceFxForVia('drop', prefs), style: prefs.style, army: prefs.army };
  });
  return (
    <div className="tdb-entry" style={{ '--acc': getArmyAccent(card) }}>
      <div className={`place-fx fx-${fx.pose}${placeFxStyleClass(fx.style)}`} style={fx.pose === 'none' ? { display: 'none' } : undefined}>
        <div className="place-shadow" />
        <div className="place-flash" />
        <div className="place-ring" />
        <div className="place-ring b" />
        <div className="place-echo" />
        <div className="place-echo e2" />
        <div className="place-echo e3" />
        <div className="place-edge l" />
        <div className="place-edge r" />
        <div className="place-dust" />
      </div>
      <div className={`place-card play-${fx.pose}`}>
        <ArmyEntryFx agent={card} enabled={fx.army !== 'off'} delayMs={0}>
          {children}
        </ArmyEntryFx>
      </div>
    </div>
  );
}

function Slot({ slotKey, side, cfg, entry, card, fieldName, note, onClick, onHover, cardLayout, accent, editable, selected, onSlotPointerDown }) {
  const cls = [
    'tdb-slot',
    cfg.front ? 'is-front-on-hover' : '',
    cfg.s < 0.6 ? 'is-small' : '',
    editable ? 'is-editable' : '',
    selected ? 'is-selected' : '',
  ].filter(Boolean).join(' ');
  return (
    <div
      className={cls}
      style={{ ...slotStyle(cfg, side), '--acc': accent }}
      data-board-slot={slotKey}
      onPointerDown={editable ? (e) => onSlotPointerDown?.(slotKey, e) : undefined}
    >
      {card ? (
        <div
          // nuova carta (o proposta del compagno che diventa definitiva) = nuovo ingresso
          key={`${card.id}-${entry?.proposal ? 'p' : 'd'}`}
          className={`tdb-card${entry?.proposal ? ' is-proposal' : ''}${onClick ? ' is-clickable' : ''}${!editable && !entry?.proposal ? ' has-entrance' : ''}`}
          onClick={onClick}
          onMouseEnter={onHover ? () => onHover(card) : undefined}
          title={onClick ? 'Clicca per riportarla in mano' : undefined}
        >
          {!editable && !entry?.proposal ? (
            <BoardEntrance card={card}>
              <GameCard agent={card} cardLayout={cardLayout} disabled />
            </BoardEntrance>
          ) : entry?.proposal ? (
            // Proposta del compagno: la carta «respira» e un riflesso le scorre sopra.
            <div className="tdb-proposal" title="Proposta del compagno: non è ancora la sua scelta">
              <GameCard agent={card} cardLayout={cardLayout} disabled />
            </div>
          ) : (
            <GameCard agent={card} cardLayout={cardLayout} disabled />
          )}
        </div>
      ) : (
        <div className="tdb-empty"><span>{entry?.isMe ? 'Trascina un Agente' : 'In attesa…'}</span></div>
      )}
      <div className="tdb-tag" style={tagStyle(cfg)}>
        {/* Solo il nome: Campi e direzione degli attacchi stanno nel pannello Tavolo. */}
        <b>{entry?.name}</b>
      </div>
    </div>
  );
}

/**
 * @param {object} p
 * @param {{ openingTeam: 'A'|'B', player: object[], enemy: object[] }} p.board
 * @param {object} p.layout - versione normalizzata (vedi teamBoardLayouts.js)
 * @param {string} [p.layoutId]
 * @param {object|null} p.humanCard - carta scelta dal giocatore ma non ancora confermata
 * @param {number|null} [p.humanFieldIndex] - Campo scelto dal giocatore quando apre
 * @param {object[]} p.battlefields
 * @param {Record<string,string>} [p.opponentOf] - per posto: avversario del fronte (piano)
 * @param {number} p.pairIndex - coppia mostrata in modalità 'pairs'
 * @param {(i: number) => void} p.onPairIndex
 * @param {() => void} [p.onHumanCardClick]
 * @param {(card: object) => void} [p.onHover]
 * @param {boolean} [p.editable] - laboratorio: carte selezionabili e trascinabili
 * @param {string|null} [p.selectedSlot]
 * @param {(slotKey: string, e: PointerEvent) => void} [p.onSlotPointerDown]
 */
export function TeamDuelBoard({
  board,
  layout,
  layoutId = '',
  humanCard,
  humanFieldIndex = null,
  battlefields,
  opponentOf = {},
  pairIndex = 0,
  onPairIndex,
  onHumanCardClick,
  onHover,
  cardLayout,
  playerColor,
  enemyColor,
  editable = false,
  selectedSlot = null,
  onSlotPointerDown,
  onPairsPointerDown,
}) {
  if (!board || !layout) return null;
  const fieldIndexOf = (e) => (e?.isMe && !e.locked && board.myOpening ? humanFieldIndex : e?.fieldIndex);
  const fieldName = (e) => {
    const i = fieldIndexOf(e);
    return i != null ? battlefields?.[i]?.name : null;
  };
  const cardOf = (e) => (e?.isMe && !e.locked ? humanCard : e?.card) || null;
  const [b1, b2] = board.enemy;
  const [a1, a2] = board.player;
  const humanClick = !editable && !a1.locked && humanCard ? onHumanCardClick : undefined;
  const common = { cardLayout, onHover: editable ? undefined : onHover, editable, onSlotPointerDown };
  const slot = (slotKey, side, entry, accent, onClick) => (
    <Slot
      key={slotKey}
      slotKey={slotKey}
      side={side}
      cfg={layout.slots[slotKey]}
      entry={entry}
      card={cardOf(entry)}
      fieldName={fieldName(entry)}
      note={opponentOf[entry.seatId]}
      accent={accent}
      onClick={onClick}
      selected={selectedSlot === slotKey}
      {...common}
    />
  );

  const pairs = layout.mode === 'pairs';
  const p = pairIndex === 1 ? 1 : 0;
  const slots = pairs
    ? [
      slot(p === 0 ? 'enemyMain' : 'enemyMate', 'enemy', p === 0 ? b1 : b2, enemyColor),
      slot(p === 0 ? 'playerMain' : 'playerMate', 'player', p === 0 ? a1 : a2, playerColor, p === 0 ? humanClick : undefined),
    ]
    : [
      slot('enemyMate', 'enemy', b2, enemyColor),
      slot('playerMate', 'player', a2, playerColor),
      slot('enemyMain', 'enemy', b1, enemyColor, undefined),
      slot('playerMain', 'player', a1, playerColor, humanClick),
    ];

  return (
    <div className={`tdb tdb--${layoutId}${editable ? ' tdb-editable' : ''}`} data-team-board="">
      {slots}
      {pairs && (
        <div
          className={`tdb-pairs${editable && selectedSlot === 'pairs' ? ' is-selected' : ''}`}
          style={{ left: layout.pairsX, top: layout.pairsY }}
          onPointerDown={editable ? (e) => onPairsPointerDown?.(e) : undefined}
        >
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              className={p === i ? 'on' : ''}
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
