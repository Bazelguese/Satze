// ============================================================
// DuelVersusScreen.jsx — schermata VS d'ingresso al duello (prova)
// ============================================================
// Due lati (giocatore / avversario) con: chi gioca, la custodia dell'esercito
// (stesso ticket della scelta mazzo) e le armate di cui è composto.
// Canvas logico 1920×1080: va montata dentro GameViewport (o un parent 1920×1080).
// Accesso di prova: ?vsLab=1 (VersusLabPage).
// ============================================================

import React, { useMemo } from 'react';
import { ARMY_COLORS, ARMY_ICONS } from '../../data/armies.js';
import { DIFFICULTY_NAMES } from '../../utils/aiConstants.js';
import {
  DeckTicket,
  DeckSelectStyles,
  buildDeckTicketEntry,
} from '../menu/cosmic/DeckSelectCinematic.jsx';
import './duelVersusScreen.css';

/**
 * Etichette dei due lati.
 * Contro l'IA: «TU» vs «IA · <difficoltà>»; online: nomi scelti in lobby.
 */
export function buildVersusIdentity({ isOnline = false, difficulty = 'medium', selfName = '', peerName = '' } = {}) {
  if (isOnline) {
    return {
      player: { eyebrow: 'TU', name: String(selfName || '').trim() || 'Giocatore', sub: null },
      enemy: { eyebrow: 'AVVERSARIO', name: String(peerName || '').trim() || 'Avversario', sub: null },
    };
  }
  return {
    player: { eyebrow: 'GIOCATORE', name: 'TU', sub: null },
    enemy: {
      eyebrow: 'AVVERSARIO',
      name: 'IA',
      sub: DIFFICULTY_NAMES[difficulty] || DIFFICULTY_NAMES.medium,
    },
  };
}

function VersusArmies({ armies }) {
  const list = (armies || []).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="vsx-armies">
      <span className="vsx-armies-lbl">{list.length > 1 ? 'ARMATE' : 'ARMATA'}</span>
      <div className="vsx-armies-list">
        {list.map((army) => (
          <span
            key={army}
            className="vsx-army"
            style={{ '--army': ARMY_COLORS[army]?.accent || '#94a3b8' }}
          >
            {ARMY_ICONS[army] ? (
              <img className="vsx-army-icon" src={ARMY_ICONS[army]} alt="" draggable={false} />
            ) : null}
            <span className="vsx-army-name">{army}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function VersusSide({ side, identity, entry }) {
  return (
    <div className={`vsx-side vsx-side--${side}`} style={{ '--accent': entry.accent }}>
      <header className="vsx-who">
        <span className="vsx-who-eyebrow">{identity.eyebrow}</span>
        <span className="vsx-who-name">{identity.name}</span>
        {identity.sub ? <span className="vsx-who-sub">{identity.sub}</span> : null}
      </header>

      <div className="vsx-ticket" aria-label={`Esercito: ${entry.name}`}>
        <div className="vsx-ticket-scale">
          <DeckTicket deck={entry} number={1} total={1} offset={0} isCenter visible />
        </div>
      </div>

      <VersusArmies armies={entry.armies} />
    </div>
  );
}

/**
 * @param {object} props
 * @param {{ eyebrow: string, name: string, sub?: string|null }} props.playerIdentity
 * @param {{ eyebrow: string, name: string, sub?: string|null }} props.enemyIdentity
 * @param {{ army: string, deckKey?: string|null, cardIds?: number[]|null, name?: string|null }} props.playerDeck
 * @param {{ army: string, deckKey?: string|null, cardIds?: number[]|null, name?: string|null }} props.enemyDeck
 * @param {number|null} [props.progress] 0–100; null nasconde la barra
 * @param {string} [props.statusLabel]
 */
export function DuelVersusScreen({
  playerIdentity,
  enemyIdentity,
  playerDeck,
  enemyDeck,
  progress = null,
  statusLabel = 'Preparazione scontro',
}) {
  const playerEntry = useMemo(
    () => buildDeckTicketEntry(playerDeck || {}),
    [playerDeck]
  );
  const enemyEntry = useMemo(
    () => buildDeckTicketEntry(enemyDeck || {}),
    [enemyDeck]
  );
  const p = progress == null ? null : Math.min(100, Math.max(0, Number(progress) || 0));

  return (
    <div
      className="vsx"
      style={{ '--pa': playerEntry.accent, '--ea': enemyEntry.accent }}
      role="presentation"
    >
      <DeckSelectStyles />

      <div className="vsx-half vsx-half--p">
        <div className="vsx-half-bg" style={{ backgroundImage: playerEntry.bg ? `url('${playerEntry.bg}')` : 'none' }} />
        <div className="vsx-half-tint" />
      </div>
      <div className="vsx-half vsx-half--e">
        <div className="vsx-half-bg" style={{ backgroundImage: enemyEntry.bg ? `url('${enemyEntry.bg}')` : 'none' }} />
        <div className="vsx-half-tint" />
      </div>
      <div className="vsx-seam" aria-hidden />

      <VersusSide side="p" identity={playerIdentity} entry={playerEntry} />
      <VersusSide side="e" identity={enemyIdentity} entry={enemyEntry} />

      <div className="vsx-vs" aria-label="contro">
        <div className="vsx-vs-ring" />
        <div className="vsx-vs-flash" />
        <span className="vsx-vs-v">V</span>
        <span className="vsx-vs-s">S</span>
      </div>

      {p != null ? (
        <div className="vsx-foot">
          <div className="vsx-foot-bar">
            <div className="vsx-foot-fill" style={{ width: `${p}%` }} />
          </div>
          <span className="vsx-foot-lbl">{p >= 100 ? 'Pronto' : statusLabel}</span>
        </div>
      ) : null}

      <div className="vsx-scanlines" aria-hidden />
    </div>
  );
}

export default DuelVersusScreen;
