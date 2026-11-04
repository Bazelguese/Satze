// ============================================================
// MultiSeatPanel — il "Tavolo" delle modalità a più posti
// ============================================================
// Pannello dentro la scena del duello: posti, PV/FC, carte schierate, fronti, disposizione
// segreta (2v2) e reclamo. Le scelte proprie (Campo, Agente, FC) restano sui comandi del
// duello; qui solo ciò che l'1v1 non ha.
// ============================================================

import { HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette';
import '../../styles/satze-multi-seat.css';

const PAIRING_LABEL = { direct: 'Diretta', crossed: 'Incrociata' };

function cardOf(seat, cardId) {
  return seat?.hand?.find((c) => c.id === cardId) || null;
}

function CardChip({ card, hidden = false }) {
  if (hidden) return <span className="msp-chip msp-chip-hidden">Agente coperto</span>;
  if (!card) return <span className="msp-chip msp-chip-empty">—</span>;
  return (
    <span className="msp-chip" title={card.description || card.name}>
      <b>{card.name}</b>
      <i>{card.power} POT · {card.damage} DAN · L{card.league}</i>
    </span>
  );
}

function Bar({ value, max, accent }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <span className="msp-bar"><span style={{ width: `${pct}%`, background: accent }} /></span>
  );
}

function seatName(view, id) {
  return view.seats?.find((s) => s.id === id)?.name || id;
}

function presentingLine(view) {
  const scontri = view.kind === 'teamDuel' ? view.roundResult?.fronts : view.contestResult?.fights;
  const s = scontri?.[view.presentIndex ?? 0];
  if (!s) return 'Scontro in corso: premi CONTINUA alla fine.';
  const human = view.kind === 'teamDuel' ? 'A1' : 'P1';
  const involved = s.playerSeatId === human || s.enemySeatId === human;
  const who = `${seatName(view, s.playerSeatId)} contro ${seatName(view, s.enemySeatId)}`;
  return involved
    ? `Scontro: ${who}. Premi CONTINUA alla fine.`
    : `Assisti: ${who}. Premi CONTINUA alla fine.`;
}

function overLine(view) {
  const r = view.result;
  if (view.kind !== 'teamDuel' && view.seats?.find((s) => s.id === 'P1')?.eliminated) {
    return 'Partita conclusa: sei stato eliminato.';
  }
  if (!r) return 'Partita conclusa.';
  if (view.kind === 'teamDuel') {
    if (r.winner === 'draw') return 'Partita conclusa: pareggio.';
    return r.winner === 'A' ? 'Partita conclusa: vince la tua squadra!' : 'Partita conclusa: vince la squadra avversaria.';
  }
  if (!r.winners?.length) return 'Partita conclusa: nessun sopravvissuto, pareggio.';
  const names = r.winners.map((id) => seatName(view, id)).join(' e ');
  return r.shared ? `Partita conclusa: vittoria condivisa (${names}).` : `Partita conclusa: vince ${names}.`;
}

function stageLine(view) {
  switch (view.stage) {
    case 'pending': return 'Si prepara il tavolo…';
    case 'humanDeploy':
      if (view.kind === 'teamDuel') {
        return view.role === 'opening'
          ? 'Apri tu: scegli un Campo e trascina un Agente, poi conferma.'
          : 'Rispondi: trascina un Agente e conferma. Gli abbinamenti li decidi dopo.';
      }
      return view.role === 'opening'
        ? 'Apri tu: scegli il Campo, schiera un Agente e i FC.'
        : 'Tocca a te: schiera un Agente e i FC. Combatterai contro chi resta sulla collina.';
    case 'planning': return 'Piano segreto: regola i tuoi FC nel pannello FC e conferma.';
    case 'aiTurn': return 'Gli altri giocatori stanno scegliendo…';
    case 'presenting': return presentingLine(view);
    case 'claim': return 'Hai raggiunto la soglia dei Campi.';
    case 'over': return overLine(view);
    default: return '';
  }
}

function BoardVariantPicker({ value, variants, onChange }) {
  if (!onChange || !variants) return null;
  return (
    <div className="msp-variants">
      <span className="msp-dim">Carte sul tavolo (prova):</span>
      <div className="msp-variant-row">
        {Object.entries(variants).map(([id, v]) => (
          <button key={id} type="button" className={`msp-btn msp-btn-sm${value === id ? ' on' : ''}`} onClick={() => onChange(id)}>
            {v.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeamView({ view, ownFocus, onPairing, onSubmit, onClaim, boardVariant, boardVariants, onBoardVariant }) {
  const { seats, deployments, battlefields, teams, plan, openingTeam } = view;
  const seat = (id) => seats.find((s) => s.id === id);
  const planning = view.stage === 'planning';
  const revealed = view.stage === 'presenting' && view.roundResult;
  const responding = openingTeam === 'B';

  const investmentLabel = (s) => {
    if (revealed) return `${view.roundResult.investments[s.id]} FC`;
    if (s.team === 'A') return plan ? (s.id === 'A1' ? `${ownFocus} FC` : `${plan.investments[s.id]} FC`) : '';
    return deployments[s.id] && view.stage !== 'over' ? '? FC' : '';
  };

  const teamBlock = (teamId, label, accent) => (
    <div className="msp-team" key={teamId}>
      <div className="msp-team-head">
        <span>{label}{openingTeam === teamId ? ' · Apertura' : ' · Risposta'}</span>
        <span>{teams[teamId].hp}/{teams[teamId].maxHp} PV · {teams[teamId].fields}/{view.threshold} Campi</span>
      </div>
      <Bar value={teams[teamId].hp} max={teams[teamId].maxHp} accent={accent} />
      {seats.filter((s) => s.team === teamId).map((s) => {
        const d = deployments[s.id];
        return (
          <div className="msp-seat" key={s.id}>
            <div className="msp-seat-name">
              <span>{s.name}</span>
              <span className="msp-dim">{s.focus} FC {investmentLabel(s) ? `· ${investmentLabel(s)}` : ''}</span>
            </div>
            <div className="msp-seat-play">
              <CardChip card={d ? cardOf(s, d.cardId) : null} />
              {d?.fieldIndex != null && <span className="msp-field">{battlefields[d.fieldIndex]?.name}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>

      {view.board && <BoardVariantPicker value={boardVariant} variants={boardVariants} onChange={onBoardVariant} />}

      {planning && view.fronts && (
        <div className="msp-plan">
          <div className="msp-plan-title">Fronti {responding ? '· scegli la disposizione' : '· la disposizione la sceglie la risposta'}</div>
          {view.fronts.map((f) => {
            const first = seat(f.firstSeatId);
            const second = seat(f.secondSeatId);
            return (
              <div className="msp-front" key={f.index}>
                <span className="msp-field">{battlefields[f.fieldIndex]?.name}</span>
                <span>{first.name} <span className="msp-dim">contro</span> {responding ? second.name : '?'}</span>
              </div>
            );
          })}
          {responding && (
            <div className="msp-pairing">
              {['direct', 'crossed'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`msp-btn${plan.pairing === p ? ' on' : ''}`}
                  onClick={() => onPairing(p)}
                >
                  {PAIRING_LABEL[p]}{plan.suggestedPairing === p ? ' ★' : ''}
                </button>
              ))}
            </div>
          )}
          {responding && <div className="msp-dim msp-note">★ consigliata dal compagno</div>}
          <button type="button" className="msp-btn msp-primary" onClick={onSubmit}>Conferma piano ({ownFocus} FC)</button>
        </div>
      )}

      {view.stage === 'presenting' && view.roundResult && (
        <div className="msp-plan">
          <div className="msp-plan-title">
            Disposizione {PAIRING_LABEL[view.roundResult.pairing] || ''} · scontro {Math.min(2, (view.presentIndex ?? 0) + 1)} di 2
          </div>
          {view.roundResult.fronts.map((f, i) => (
            <div className={`msp-front${i === view.presentIndex ? ' on' : ''}`} key={f.index}>
              <span className="msp-field">{battlefields[f.fieldIndex]?.name}</span>
              <span>{seat(f.playerSeatId).name} <span className="msp-dim">contro</span> {seat(f.enemySeatId).name}</span>
            </div>
          ))}
          <div className="msp-dim msp-note">I due scontri leggono la Vita di inizio turno; i PV si sommano alla fine.</div>
        </div>
      )}

      {view.stage === 'claim' && (
        <div className="msp-plan">
          <div className="msp-plan-title">La tua squadra ha {teams.A.fields} Campi</div>
          <button type="button" className="msp-btn msp-primary" onClick={() => onClaim('claim')}>Reclama la vittoria</button>
          <button type="button" className="msp-btn" onClick={() => onClaim('continue')}>Continua a giocare</button>
        </div>
      )}

      {teamBlock('A', 'La tua squadra', '#a78bfa')}
      {teamBlock('B', 'Avversari', '#f87171')}
    </>
  );
}

function KothView({ view, onClaim }) {
  const { seats, order, commits, battlefields, contestFieldIndex } = view;
  const seat = (id) => seats.find((s) => s.id === id);
  const cr = view.stage === 'presenting' ? view.contestResult : null;
  const listed = order.length ? order : seats.map((s) => s.id);
  const eliminated = seats.filter((s) => s.eliminated && !listed.includes(s.id));
  return (
    <>
      {cr && (
        <div className="msp-plan">
          <div className="msp-plan-title">Catena · scontro {Math.min(cr.fights.length, (view.presentIndex ?? 0) + 1)} di {cr.fights.length}</div>
          {cr.fights.map((f, i) => (
            <div className={`msp-front${i === view.presentIndex ? ' on' : ''}`} key={f.fightIndex}>
              <span>{seat(f.firstSeatId).name} <span className="msp-dim">contro</span> {seat(f.secondSeatId).name}</span>
              {i < (view.presentIndex ?? 0) && <span className="msp-dim">→ {seat(f.winnerSeatId).name}</span>}
            </div>
          ))}
        </div>
      )}
      {view.stage === 'claim' && (
        <div className="msp-plan">
          <div className="msp-plan-title">Hai conquistato {seat('P1').conquests} Campi</div>
          <button type="button" className="msp-btn msp-primary" onClick={() => onClaim('claim')}>Reclama la vittoria</button>
          <button type="button" className="msp-btn" onClick={() => onClaim('continue')}>Continua a giocare</button>
        </div>
      )}
      {contestFieldIndex != null && (
        <div className="msp-contest">Campo conteso: <span className="msp-field">{battlefields[contestFieldIndex]?.name}</span></div>
      )}
      {listed.map((id, i) => {
        const s = seat(id);
        const c = commits[id];
        const card = c ? cardOf(s, c.cardId) : null;
        return (
          <div className="msp-seat" key={id}>
            <div className="msp-seat-name">
              <span>{i === 0 ? '♛ ' : `${i + 1}. `}{s.name}</span>
              <span className="msp-dim">{s.hp} PV · {s.focus} FC · {s.conquests} Campi</span>
            </div>
            <Bar value={s.hp} max={s.maxHp} accent={s.isHuman ? '#a78bfa' : '#f87171'} />
            <div className="msp-seat-play">
              <CardChip card={card} />
              {c && view.stage !== 'over' && <span className="msp-dim">{cr || s.isHuman ? `${c.investment} FC` : '? FC'}</span>}
            </div>
          </div>
        );
      })}
      {eliminated.map((s) => (
        <div className="msp-seat msp-out" key={s.id}><span>{s.name}</span><span className="msp-dim">eliminato</span></div>
      ))}
    </>
  );
}

export function MultiSeatPanel({ view, ownFocus, onPairing, onSubmit, onClaim, boardVariant, boardVariants, onBoardVariant }) {
  if (!view) return null;
  const title = view.kind === 'teamDuel' ? '2v2 · Abbinamenti segreti' : 'Re della collina';
  return (
    <div className="msp" style={{ fontFamily: HUD_ORATORIO_FONT_UI }} data-multi-seat-panel="">
      <div className="msp-head">
        <span>{title}</span>
        {view.roundNumber ? <span className="msp-dim">{view.kind === 'teamDuel' ? 'Turno' : 'Contesa'} {view.roundNumber}/5</span> : null}
      </div>
      <div className="msp-stage">{stageLine(view)}</div>
      {view.seats && (view.kind === 'teamDuel'
        ? <TeamView view={view} ownFocus={ownFocus} onPairing={onPairing} onSubmit={onSubmit} onClaim={onClaim} boardVariant={boardVariant} boardVariants={boardVariants} onBoardVariant={onBoardVariant} />
        : <KothView view={view} onClaim={onClaim} />)}
    </div>
  );
}
