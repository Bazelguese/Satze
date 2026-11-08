import React from 'react';
import { MATCH_FORMATS } from '../../data/gameModes.js';
import { MENU_ACCENTS, HUD_ORATORIO_FONT_UI } from '../menu';
import { playUiClick } from '../../audio/soundBus';

/** Modalità online e formati ammessi (il 2v2 e il Re della collina sono senza Eminenze). */
export const ONLINE_MODES = {
  duel: { id: 'duel', name: 'Duello', description: '1 contro 1', minPlayers: 2, maxPlayers: 2, formats: ['standard', 'noEminenza', 'bareHands'] },
  teamDuel: { id: 'teamDuel', name: '2v2', description: 'Abbinamenti segreti · IA nei posti vuoti', minPlayers: 2, maxPlayers: 4, formats: ['noEminenza', 'bareHands'] },
  kingOfHill: { id: 'kingOfHill', name: 'Re della collina', description: 'Tutti contro tutti · IA nei posti vuoti', minPlayers: 2, maxPlayers: 4, formats: ['noEminenza', 'bareHands'] },
};

export const DIFFICOLTA_IA = [
  { id: 'easy', name: 'Facile' },
  { id: 'medium', name: 'Normale' },
  { id: 'hard', name: 'Difficile' },
];

const SEAT_LABELS = { A1: 'Squadra A', A2: 'Squadra A', B1: 'Squadra B', B2: 'Squadra B' };

function Bottone({ attivo, disabled, onClick, children, title }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={() => { if (!disabled) { playUiClick(); onClick?.(); } }}
      className="px-2 py-2 rounded text-xs font-bold transition-opacity disabled:cursor-default"
      style={{
        fontFamily: HUD_ORATORIO_FONT_UI,
        color: attivo ? MENU_ACCENTS.void : '#e2e8f0',
        background: attivo ? MENU_ACCENTS.magenta : 'rgba(255,255,255,0.06)',
        border: `1px solid ${attivo ? MENU_ACCENTS.magenta : 'rgba(255,255,255,0.18)'}`,
        opacity: disabled && !attivo ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Riga({ titolo, children, nota }) {
  return (
    <div className="w-full">
      <p className="text-xs text-slate-400 text-center mb-2 uppercase tracking-widest">{titolo}</p>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
      {nota ? <p className="text-[11px] text-slate-500 text-center mt-2">{nota}</p> : null}
    </div>
  );
}

/**
 * Impostazioni della stanza online (host modifica, ospiti vedono) ed elenco dei giocatori.
 * @param {{
 *   isHost: boolean,
 *   config: { mode: string, formatId: string, players: number, difficulty: string },
 *   onConfig: (patch: object) => void,
 *   members: Array<{ slot: number, name: string, connected: boolean, ready?: boolean, deckName?: string|null, seatId?: string|null }>,
 *   multiDisponibile: boolean,
 *   locked: boolean,
 * }} props
 */
export default function OnlineRoomPanel({ isHost, config, onConfig, members = [], multiDisponibile = true, locked = false }) {
  const modo = ONLINE_MODES[config.mode] || ONLINE_MODES.duel;
  const disabled = !isHost || locked;
  const umani = members.filter((m) => m.connected !== false).length;
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <Riga
        titolo="Modalità"
        nota={!multiDisponibile
          ? '2v2 e Re della collina richiedono il server aggiornato.'
          : `${modo.description}${isHost ? '' : " · la sceglie l'host"}`}
      >
        {Object.values(ONLINE_MODES).map((m) => (
          <Bottone
            key={m.id}
            attivo={m.id === modo.id}
            disabled={disabled || (m.id !== 'duel' && !multiDisponibile) || (m.id === 'duel' && umani > 2)}
            title={m.id === 'duel' && umani > 2 ? 'Il Duello è per 2 giocatori' : m.description}
            onClick={() => onConfig({ mode: m.id, formatId: m.formats.includes(config.formatId) ? config.formatId : m.formats[0] })}
          >
            {m.name}
          </Bottone>
        ))}
      </Riga>

      <Riga titolo="Formato" nota={(MATCH_FORMATS[config.formatId] || MATCH_FORMATS.standard).description}>
        {modo.formats.map((id) => (
          <Bottone key={id} attivo={id === config.formatId} disabled={disabled} onClick={() => onConfig({ formatId: id })}>
            {MATCH_FORMATS[id].name}
          </Bottone>
        ))}
      </Riga>

      {modo.id === 'kingOfHill' && (
        <Riga titolo="Giocatori al tavolo" nota="I posti senza giocatore li gioca l'IA.">
          {[3, 4].map((n) => (
            <Bottone key={n} attivo={config.players === n} disabled={disabled || umani > n} onClick={() => onConfig({ players: n })}>
              {n}
            </Bottone>
          ))}
        </Riga>
      )}

      {modo.id !== 'duel' && (
        <Riga titolo="Difficoltà dell'IA">
          {DIFFICOLTA_IA.map((d) => (
            <Bottone key={d.id} attivo={config.difficulty === d.id} disabled={disabled} onClick={() => onConfig({ difficulty: d.id })}>
              {d.name}
            </Bottone>
          ))}
        </Riga>
      )}

      <div className="w-full">
        <p className="text-xs text-slate-400 text-center mb-2 uppercase tracking-widest">Giocatori</p>
        <ul className="flex flex-col gap-1 w-full">
          {members.map((m) => (
            <li
              key={m.slot}
              className="flex items-center justify-between px-3 py-2 rounded text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span className="text-white font-bold">
                {m.name}
                {m.slot === 0 ? <span className="text-[10px] text-slate-400 ml-2">HOST</span> : null}
                {m.seatId && SEAT_LABELS[m.seatId] && modo.id === 'teamDuel'
                  ? <span className="text-[10px] text-slate-400 ml-2">{SEAT_LABELS[m.seatId]}</span>
                  : null}
              </span>
              <span className="text-xs" style={{ color: m.connected === false ? '#f87171' : m.ready ? '#34d399' : '#94a3b8' }}>
                {m.connected === false ? 'disconnesso' : m.ready ? `pronto${m.deckName ? ` · ${m.deckName}` : ''}` : 'sceglie l’esercito…'}
              </span>
            </li>
          ))}
        </ul>
        {modo.id === 'teamDuel' && (
          <p className="text-[11px] text-slate-500 text-center mt-2">
            Squadre: host e terzo giocatore (A) contro secondo e quarto (B). I posti vuoti sono IA.
          </p>
        )}
      </div>
    </div>
  );
}
