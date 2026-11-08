import React from 'react';
import { MATCH_FORMATS } from '../../data/gameModes.js';
import { playUiClick } from '../../audio/soundBus';

/** Modalità online e formati ammessi (il 2v2 e il Re della collina sono senza Eminenze). */
export const ONLINE_MODES = {
  duel: { id: 'duel', name: 'Duello', description: '1 contro 1', minPlayers: 2, maxPlayers: 2, formats: ['standard', 'noEminence', 'bareHands'] },
  teamDuel: { id: 'teamDuel', name: '2v2', description: 'Abbinamenti segreti · IA nei posti vuoti', minPlayers: 2, maxPlayers: 4, formats: ['noEminence', 'bareHands'] },
  kingOfHill: { id: 'kingOfHill', name: 'Re della collina', description: 'Tutti contro tutti · IA nei posti vuoti', minPlayers: 2, maxPlayers: 4, formats: ['noEminence', 'bareHands'] },
};

export const DIFFICOLTA_IA = [
  { id: 'easy', name: 'Facile' },
  { id: 'medium', name: 'Normale' },
  { id: 'hard', name: 'Difficile' },
];

const SEAT_LABELS = { A1: 'Squadra A', A2: 'Squadra A', B1: 'Squadra B', B2: 'Squadra B' };

function Chip({ attivo, disabled, onClick, children, sub, title }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-pressed={attivo}
      className={`orp-chip${attivo ? ' sel' : ''}`}
      onClick={() => { if (!disabled) { playUiClick(); onClick?.(); } }}
    >
      <span className="t">{children}</span>
      {sub ? <span className="d">{sub}</span> : null}
    </button>
  );
}

function Riga({ n, titolo, nota, children }) {
  return (
    <section className="orp-row">
      <div className="orp-row-head">
        <h3><span className="n">{n}</span>{titolo}</h3>
        {nota ? <p className="orp-row-note">{nota}</p> : null}
      </div>
      <div className="orp-chips">{children}</div>
    </section>
  );
}

/**
 * Impostazioni della stanza online (host modifica, ospiti vedono) ed elenco dei giocatori.
 * Stile Persona: righe a lastra inclinata con chip, come «Imposta la partita».
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
  const righe = [];
  righe.push(
    <Riga
      key="mode"
      titolo="MODALITÀ"
      nota={!multiDisponibile
        ? '2v2 e Re della collina richiedono il server aggiornato.'
        : `${modo.description}${isHost ? '' : " · la sceglie l'host"}`}
    >
      {Object.values(ONLINE_MODES).map((m) => (
        <Chip
          key={m.id}
          attivo={m.id === modo.id}
          disabled={disabled || (m.id !== 'duel' && !multiDisponibile) || (m.id === 'duel' && umani > 2)}
          title={m.id === 'duel' && umani > 2 ? 'Il Duello è per 2 giocatori' : m.description}
          onClick={() => onConfig({ mode: m.id, formatId: m.formats.includes(config.formatId) ? config.formatId : m.formats[0] })}
        >
          {m.name}
        </Chip>
      ))}
    </Riga>,
  );
  righe.push(
    <Riga key="format" titolo="FORMATO" nota={(MATCH_FORMATS[config.formatId] || MATCH_FORMATS.standard).description}>
      {modo.formats.map((id) => (
        <Chip key={id} attivo={id === config.formatId} disabled={disabled} onClick={() => onConfig({ formatId: id })}>
          {MATCH_FORMATS[id].name}
        </Chip>
      ))}
    </Riga>,
  );
  if (modo.id === 'kingOfHill') {
    righe.push(
      <Riga key="players" titolo="GIOCATORI AL TAVOLO" nota="I posti senza giocatore li gioca l'IA.">
        {[3, 4].map((n) => (
          <Chip key={n} attivo={config.players === n} disabled={disabled || umani > n} onClick={() => onConfig({ players: n })}>
            {n}
          </Chip>
        ))}
      </Riga>,
    );
  }
  if (modo.id !== 'duel') {
    righe.push(
      <Riga key="difficulty" titolo="DIFFICOLTÀ DELL'IA">
        {DIFFICOLTA_IA.map((d) => (
          <Chip key={d.id} attivo={config.difficulty === d.id} disabled={disabled} onClick={() => onConfig({ difficulty: d.id })}>
            {d.name}
          </Chip>
        ))}
      </Riga>,
    );
  }

  return (
    <div className={`orp${isHost ? ' is-host' : ''}`}>
      {righe.map((r, i) => React.cloneElement(r, { n: String(i + 1).padStart(2, '0') }))}

      <section className="orp-members">
        <h3><span className="n">{String(righe.length + 1).padStart(2, '0')}</span>GIOCATORI</h3>
        <ul>
          {members.map((m) => {
            const stato = m.connected === false ? 'off' : m.ready ? 'ready' : 'wait';
            return (
              <li key={m.slot} className={`orp-member is-${stato}`}>
                <span className="who">
                  <span className="name">{m.name}</span>
                  {m.slot === 0 ? <span className="tag">HOST</span> : null}
                  {m.seatId && SEAT_LABELS[m.seatId] && modo.id === 'teamDuel'
                    ? <span className="tag tag--team">{SEAT_LABELS[m.seatId]}</span>
                    : null}
                </span>
                <span className="state">
                  {m.connected === false ? 'disconnesso' : m.ready ? `pronto${m.deckName ? ` · ${m.deckName}` : ''}` : 'sceglie l’esercito…'}
                </span>
              </li>
            );
          })}
        </ul>
        {modo.id === 'teamDuel' && (
          <p className="orp-row-note">
            Squadre: host e terzo giocatore (A) contro secondo e quarto (B). I posti vuoti sono IA.
          </p>
        )}
      </section>
      <OnlineRoomPanelStyles />
    </div>
  );
}

function OnlineRoomPanelStyles() {
  return (
    <style>{`
      .orp { display: flex; flex-direction: column; gap: 12px; width: 100%; }
      .orp h3 { margin: 0; display: flex; align-items: baseline; gap: 12px; font-weight: 700; font-size: 22px; white-space: nowrap; letter-spacing: 0.02em; }
      .orp h3 .n { font-family: 'Share Tech Mono', monospace; font-weight: 400; font-size: 14px; color: var(--accent); }
      .orp-row-note { margin: 4px 0 0; font-weight: 600; font-size: 14px; line-height: 1.3; color: var(--dim); }

      .orp-row {
        position: relative; display: grid; grid-template-columns: 290px 1fr; align-items: center; gap: 18px;
        min-height: 92px; padding: 10px 22px 10px 34px; background: var(--plate);
        clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
      }
      .orp-row::before {
        content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 6px;
        background: var(--accent); transform: skewX(-12deg);
      }
      .orp-chips { display: flex; gap: 10px; min-width: 0; }
      .orp-chip {
        flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px;
        min-height: 58px; padding: 6px 14px; border: 0; cursor: pointer; text-align: left;
        background: var(--void); color: var(--dim); font-family: inherit;
        transform: skewX(-14deg); box-shadow: inset 0 0 0 2px rgba(245,243,235,0.18);
        transition: background .15s, color .15s, box-shadow .15s, transform .15s, opacity .15s;
      }
      .orp-chip > * { transform: skewX(14deg); max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .orp-chip .t { font-weight: 700; font-size: 19px; text-transform: uppercase; letter-spacing: 0.02em; }
      .orp-chip:hover:not(:disabled):not(.sel), .orp-chip:focus-visible { color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
      .orp-chip.sel { background: var(--accent); color: var(--void); box-shadow: 5px 5px 0 var(--ink); transform: skewX(-14deg) translateY(-3px); }
      .orp-chip.sel .t { font-style: italic; }
      .orp-chip:disabled { cursor: default; }
      .orp-chip:disabled:not(.sel) { opacity: 0.4; }

      .orp-members {
        position: relative; display: flex; flex-direction: column; gap: 10px;
        padding: 14px 22px 16px 34px; background: var(--plate);
        clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
      }
      .orp-members::before {
        content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 6px;
        background: var(--accent); transform: skewX(-12deg);
      }
      .orp-members ul { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
      .orp-member {
        display: flex; align-items: center; justify-content: space-between; gap: 14px; min-width: 0;
        height: 50px; padding: 0 20px; background: var(--void);
        transform: skewX(-12deg); box-shadow: inset 0 0 0 2px rgba(245,243,235,0.14);
      }
      .orp-member > * { transform: skewX(12deg); }
      .orp-member .who { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .orp-member .name { font-weight: 700; font-style: italic; font-size: 21px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .orp-member .tag {
        flex: none; background: var(--ink); color: var(--void); font-weight: 700; font-size: 11px; letter-spacing: 0.16em; padding: 2px 8px;
      }
      .orp-member .tag--team { background: var(--accent); }
      .orp-member .state { flex: none; max-width: 55%; font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.06em; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .orp-member.is-ready { box-shadow: inset 0 0 0 2px #4ade80; }
      .orp-member.is-ready .state { color: #4ade80; }
      .orp-member.is-off .state { color: var(--danger); }
      .orp-member.is-off .name { opacity: 0.5; }
    `}</style>
  );
}
