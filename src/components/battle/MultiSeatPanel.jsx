// ============================================================
// MultiSeatPanel — il "Tavolo" delle modalità a più posti
// ============================================================
// Vive nel riquadro Anteprima della colonna sinistra del duello, con lo stesso linguaggio
// degli altri pannelli dell'HUD (titoli runici, palette lavanda, colori delle due squadre).
// Ordine: fase → Fronti (2v2) → Consigli al compagno → Squadre → opzioni di prova.
// Le scelte proprie (Campo, Agente, FC) restano sui comandi del duello.
// ============================================================

import { HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette';
import { RuneTitle } from '../ui/RuneTitle';
import { MiniBattlefield } from './MiniBattlefield';
import '../../styles/satze-multi-seat.css';
import '../../styles/satze-multi-seat-table.css';

const PAIRING_LABEL = { direct: 'Diretta', crossed: 'Incrociata' };
const INVEST_LABEL = { basso: 'Basso', medio: 'Medio', alto: 'Alto' };

function cardOf(seat, cardId) {
  return seat?.hand?.find((c) => c.id === cardId) || null;
}

function seatName(view, id) {
  return view.seats?.find((s) => s.id === id)?.name || id;
}

function Section({ title, extra = null, children, className = '' }) {
  return (
    <section className={`mst-sec ${className}`}>
      <header className="mst-sec-head">
        <span className="mst-sec-title"><RuneTitle text={title} global={false} /></span>
        {extra ? <span className="mst-sec-extra">{extra}</span> : null}
      </header>
      {children}
    </section>
  );
}

function CardLine({ card }) {
  if (!card) return <span className="mst-card is-empty">—</span>;
  return (
    <span className="mst-card" title={card.description || card.name}>
      <span className="mst-card-name">{card.name}</span>
      <span className="mst-card-stats">{card.power}/{card.damage} · L{card.league}</span>
    </span>
  );
}

function Bar({ value, max }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return <span className="mst-bar"><span style={{ width: `${pct}%` }} /></span>;
}

/** Stato di riflessione di un posto IA (puntini animati o spunta). */
function ThinkTag({ view, seatId }) {
  const st = view.thinkingSeats?.[seatId];
  if (!st) return null;
  return st.status === 'thinking'
    ? <span className="mst-think">sta pensando<span className="mst-dots"><i>.</i><i>.</i><i>.</i></span> <em>{st.task}</em></span>
    : <span className="mst-think is-ready">✓ pronto</span>;
}

// ------------------------------------------------------------
// Riga di fase
// ------------------------------------------------------------

function presentingLine(view) {
  const scontri = view.kind === 'teamDuel' ? view.roundResult?.fronts : view.contestResult?.fights;
  const s = scontri?.[view.presentIndex ?? 0];
  const tasto = view.scontroQueue?.hasNext ? 'Prossimo duello' : 'Continua';
  if (!s) return `Scontro in corso: premi ${tasto} alla fine.`;
  const human = view.kind === 'teamDuel' ? 'A1' : 'P1';
  const involved = s.playerSeatId === human || s.enemySeatId === human;
  const who = `${seatName(view, s.playerSeatId)} contro ${seatName(view, s.enemySeatId)}`;
  return involved ? `Scontro: ${who}. Premi ${tasto} alla fine.` : `Assisti: ${who}. Premi ${tasto} alla fine.`;
}

function overLine(view) {
  const r = view.result;
  if (view.kind !== 'teamDuel' && view.seats?.find((s) => s.id === 'P1')?.eliminated) return 'Partita conclusa: sei stato eliminato.';
  if (!r) return 'Partita conclusa.';
  if (view.kind === 'teamDuel') {
    if (r.winner === 'draw') return 'Partita conclusa: pareggio.';
    return r.winner === 'A' ? 'Partita conclusa: vince la tua squadra!' : 'Partita conclusa: vince la squadra avversaria.';
  }
  if (!r.winners?.length) return 'Partita conclusa: nessun sopravvissuto, pareggio.';
  const names = r.winners.map((id) => seatName(view, id)).join(' e ');
  return r.shared ? `Partita conclusa: vittoria condivisa (${names}).` : `Partita conclusa: vince ${names}.`;
}

function aiTurnLine(view) {
  if (view.revealing) return 'Rivelazione: disposizione e investimenti scoperti.';
  if (view.pendingConfirm) return 'Hai scelto: aspetti che il compagno decida la sua carta.';
  const kinds = view.thinkingKinds || [];
  if (view.kind === 'teamDuel') {
    if (kinds.includes('opening')) return 'La squadra avversaria sceglie Campi, Agenti e FC…';
    if (kinds.includes('response')) return 'La squadra avversaria studia le vostre carte e sceglie chi attacca chi…';
    return 'Gli altri giocatori stanno scegliendo…';
  }
  const id = Object.keys(view.thinkingSeats || {})[0];
  return id ? `${seatName(view, id)} sta scegliendo Agente e FC…` : 'Gli altri giocatori stanno scegliendo…';
}

/** Testo della fase e tono: 'act' tocca a te, 'wait' attendi, 'info' altro. */
function phaseOf(view) {
  switch (view.stage) {
    case 'pending': return { tone: 'info', text: 'Si prepara il tavolo…' };
    case 'humanDeploy':
      if (view.kind === 'teamDuel') {
        return {
          tone: 'act',
          text: view.role === 'opening'
            ? 'Apri tu: scegli un Campo, trascina un Agente, regola i FC e conferma. Il compagno sceglie insieme a te.'
            : 'Rispondi: scegli qui sotto chi attacca chi, trascina un Agente, regola i FC e conferma.',
        };
      }
      return {
        tone: 'act',
        text: view.role === 'opening'
          ? 'Apri tu: scegli il Campo, schiera un Agente e i FC.'
          : 'Tocca a te: schiera un Agente e i FC contro chi resta sulla collina.',
      };
    case 'aiTurn': return { tone: 'wait', text: aiTurnLine(view) };
    case 'presenting': return { tone: 'info', text: presentingLine(view) };
    case 'claim': return { tone: 'act', text: 'Hai raggiunto la soglia dei Campi.' };
    case 'over': return { tone: 'info', text: overLine(view) };
    default: return { tone: 'info', text: '' };
  }
}

// ------------------------------------------------------------
// 2v2
// ------------------------------------------------------------

/**
 * I due fronti del turno: per ciascun Campo chi difende (apertura) e chi attacca
 * (risposta). Quando risponde la tua squadra, prima di confermare si inverte da qui la direzione.
 */
function Fronts({ view, ownFieldIndex, onPairing, onHoverField }) {
  const { seats, deployments, battlefields, plan, openingTeam, board } = view;
  const seat = (id) => seats.find((x) => x.id === id);
  const presenting = view.stage === 'presenting' && view.roundResult;
  const usResponding = openingTeam === 'B';
  // Risponde la tua squadra e gli avversari hanno aperto: si sceglie chi attacca chi.
  const choosing = usResponding && Boolean(view.fronts) && Boolean(plan) && ['humanDeploy', 'aiTurn'].includes(view.stage) && !view.revealing;

  let fronts;
  if (presenting) {
    fronts = view.roundResult.fronts.map((f) => ({ fieldIndex: f.fieldIndex, opener: f.firstSeatId, responder: f.secondSeatId, winner: f.winnerSeatId }));
  } else {
    const fieldOf = (id) => {
      if (deployments[id]?.fieldIndex != null) return deployments[id].fieldIndex;
      if (id === 'A1') return ownFieldIndex ?? null;
      if (id === 'A2') return board?.player?.[1]?.fieldIndex ?? null;
      return null;
    };
    const responderOf = (id) => (choosing
      ? view.fronts.find((f) => f.firstSeatId === id)?.secondSeatId ?? null
      : null);
    fronts = seats.filter((x) => x.team === openingTeam).map((o) => ({ fieldIndex: fieldOf(o.id), opener: o.id, responder: responderOf(o.id), winner: null }));
  }

  const cardFor = (id) => {
    const entry = [...(board?.player || []), ...(board?.enemy || [])].find((e) => e.seatId === id);
    const cardId = deployments?.[id]?.cardId ?? entry?.card?.id ?? null;
    return cardId != null ? cardOf(seat(id), cardId) : null;
  };
  const side = (id) => (seat(id)?.team === 'A' ? 'ally' : 'foe');
  const hint = presenting
    ? null
    : usResponding
      ? (choosing ? null : 'Quando gli avversari hanno aperto scegli chi attacca chi, prima di confermare.')
      : 'Chi attacca cosa lo decide in segreto la squadra avversaria.';

  const extra = presenting
    ? `Disposizione ${PAIRING_LABEL[view.roundResult.pairing] || ''}`
    : `Apre: ${openingTeam === 'A' ? 'la tua squadra' : 'gli avversari'}`;

  return (
    <Section title="Fronti" extra={extra}>
      {fronts.map((f, i) => {
        const field = f.fieldIndex != null ? battlefields[f.fieldIndex] : null;
        return (
          <div key={f.opener} className={`mst-front${presenting && view.presentIndex === i ? ' is-live' : ''}`}>
            <div className="mst-front-field">
              <span className="mst-front-n">{i + 1}</span>
              {field ? (
                <div className="mst-front-mini" onMouseEnter={() => onHoverField?.(field)} onMouseLeave={() => onHoverField?.(null)}>
                  <MiniBattlefield field={field} conquered={false} hidden={false} selected={false} />
                </div>
              ) : (
                <div className="mst-front-empty">Campo da scegliere</div>
              )}
            </div>
            <div className="mst-vs">
              <div className={`mst-vs-side is-${side(f.opener)}`}>
                <span className="mst-vs-role">Difende</span>
                <span className="mst-vs-name">{seat(f.opener)?.name}</span>
                <CardLine card={cardFor(f.opener)} />
                <ThinkTag view={view} seatId={f.opener} />
              </div>
              <span className="mst-vs-x" aria-hidden>VS</span>
              <div className={`mst-vs-side ${f.responder ? `is-${side(f.responder)}` : 'is-unknown'}`}>
                <span className="mst-vs-role">Attacca</span>
                {f.responder ? (
                  <>
                    <span className="mst-vs-name">{seat(f.responder)?.name}</span>
                    <CardLine card={cardFor(f.responder)} />
                  </>
                ) : (
                  <span className="mst-vs-name is-unknown">?</span>
                )}
              </div>
            </div>
            {presenting && f.winner && view.presentIndex > i ? (
              <div className="mst-front-result">Conquista {seat(f.winner)?.name}</div>
            ) : null}
          </div>
        );
      })}
      {choosing && view.stage === 'humanDeploy' ? (
        <button type="button" className="mst-btn is-wide" onClick={() => onPairing(plan.pairing === 'crossed' ? 'direct' : 'crossed')}>
          ⇄ Inverti direzione
          <small>{PAIRING_LABEL[plan.pairing]}{plan.suggestedPairing === plan.pairing ? ' · consigliata dal compagno' : ''}</small>
        </button>
      ) : null}
      {hint ? <p className="mst-hint">{hint}</p> : null}
    </Section>
  );
}

/** Consigli al compagno IA: carta (dalla sua mano), Campo (quando aprite), investimento. */
function Advice({ view, ownFieldIndex, onAdvise }) {
  const mate = view.seats.find((x) => x.id === 'A2');
  if (!mate || !onAdvise) return null;
  const deploying = view.stage === 'humanDeploy' && !view.deployments?.A2;
  // Gli FC si consigliano finché il compagno non si è schierato.
  const canInvest = ['humanDeploy', 'aiTurn'].includes(view.stage) && !view.deployments?.A2 && !view.revealing;
  if (!deploying && !canInvest) return null;
  const advice = view.advice || {};
  const replies = view.adviceReplies || {};
  const advisedCard = advice.card ? cardOf(mate, advice.card.value) : null;
  const opening = view.openingTeam === 'A';
  const fields = (view.legalFields || []).filter((i) => i !== ownFieldIndex);
  const reply = (kind) => (replies[kind]
    ? <p className={`mst-reply ${replies[kind].accepted ? 'is-ok' : 'is-no'}`}>«{replies[kind].text}»</p>
    : null);
  const mateThinking = view.thinkingSeats?.A2?.status === 'thinking';

  return (
    <Section title="Consigli" extra={view.mateTrust != null ? `${mate.name} · ascolta ${Math.round(view.mateTrust * 100)}%` : mate.name} className="mst-sec--advice">
      {deploying && (
        <div className="mst-row">
          <span className="mst-row-k">Carta</span>
          <span className="mst-row-v">
            {advisedCard
              ? <b>{advisedCard.name}</b>
              : mateThinking
                ? <span className="mst-muted">Il compagno sta ancora scegliendo…</span>
                : <span className="mst-muted">Apri «Mano compagno» e clicca una sua carta.</span>}
          </span>
        </div>
      )}
      {deploying && reply('card')}
      {deploying && opening && (
        <div className="mst-row">
          <span className="mst-row-k">Campo</span>
          <div className="mst-row-v mst-chips">
            {fields.map((i) => (
              <button key={i} type="button" className={`mst-chip${advice.field?.value === i ? ' is-on' : ''}`} onClick={() => onAdvise('field', i)}>
                {view.battlefields[i]?.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {deploying && opening && reply('field')}
      {canInvest && (
        <div className="mst-row">
          <span className="mst-row-k">FC</span>
          <div className="mst-row-v mst-chips">
            {['basso', 'medio', 'alto'].map((lvl) => (
              <button key={lvl} type="button" className={`mst-chip${advice.invest?.value === lvl ? ' is-on' : ''}`} onClick={() => onAdvise('invest', lvl)}>
                {INVEST_LABEL[lvl]}
              </button>
            ))}
          </div>
        </div>
      )}
      {canInvest && reply('invest')}
    </Section>
  );
}

function Teams({ view, ownFocus }) {
  const { seats, deployments, teams, plan, openingTeam } = view;
  const revealed = (view.stage === 'presenting' || view.revealing) && view.roundResult;
  const investment = (s) => {
    if (revealed) return `${view.roundResult.investments[s.id]} FC`;
    if (s.team === 'A') {
      if (!plan) return null;
      if (s.id === 'A1') return `${ownFocus} FC`;
      return view.mateReady ? `${plan.investments[s.id]} FC` : '… FC';
    }
    return deployments[s.id] && view.stage !== 'over' ? '? FC' : null;
  };
  const team = (id, label) => (
    <div className={`mst-team is-${id === 'A' ? 'ally' : 'foe'}`} key={id}>
      <div className="mst-team-head">
        <span className="mst-team-name">{label}</span>
        <span className="mst-team-role">{openingTeam === id ? 'Apertura' : 'Risposta'}</span>
      </div>
      <div className="mst-team-stats">
        <Bar value={teams[id].hp} max={teams[id].maxHp} />
        <span>{teams[id].hp}<small>/{teams[id].maxHp} PV</small></span>
        <span>{teams[id].fields}<small>/{view.threshold} Campi</small></span>
      </div>
      {seats.filter((s) => s.team === id).map((s) => (
        <div className="mst-seat" key={s.id}>
          <span className="mst-seat-name">{s.name}</span>
          <span className="mst-seat-fc">{s.focus} FC{investment(s) ? ` · ${investment(s)}` : ''}</span>
          <ThinkTag view={view} seatId={s.id} />
          {s.id === 'A2' && view.mateLine && !view.thinkingSeats?.A2 ? <p className="mst-quote">«{view.mateLine}»</p> : null}
        </div>
      ))}
    </div>
  );
  return (
    <Section title="Squadre">
      {team('A', 'La tua squadra')}
      {team('B', 'Avversari')}
    </Section>
  );
}

function VariantPicker({ value, variants, onChange }) {
  if (!onChange || !variants) return null;
  return (
    <details className="mst-proto">
      <summary>Carte sul tavolo · versione di prova</summary>
      <div className="mst-chips">
        {Object.entries(variants).map(([id, v]) => (
          <button key={id} type="button" className={`mst-chip${value === id ? ' is-on' : ''}`} onClick={() => onChange(id)}>
            {v.name}
          </button>
        ))}
      </div>
    </details>
  );
}

function Claim({ count, onClaim }) {
  return (
    <Section title="Vittoria a portata">
      <p className="mst-hint">Avete {count} Campi: potete reclamare la vittoria o continuare a giocare.</p>
      <button type="button" className="mst-btn is-primary is-wide" onClick={() => onClaim('claim')}>Reclama la vittoria</button>
      <button type="button" className="mst-btn is-wide" onClick={() => onClaim('continue')}>Continua a giocare</button>
    </Section>
  );
}

function TeamView({ view, ownFocus, ownFieldIndex, onPairing, onClaim, onAdvise, onHoverField, boardVariant, boardVariants, onBoardVariant }) {
  const showFronts = Boolean(view.board) || (view.stage === 'presenting' && view.roundResult);
  return (
    <>
      {showFronts && <Fronts view={view} ownFieldIndex={ownFieldIndex} onPairing={onPairing} onHoverField={onHoverField} />}
      {view.stage === 'claim' && <Claim count={view.teams.A.fields} onClaim={onClaim} />}
      <Advice view={view} ownFieldIndex={ownFieldIndex} onAdvise={onAdvise} />
      <Teams view={view} ownFocus={ownFocus} />
      {view.board && <VariantPicker value={boardVariant} variants={boardVariants} onChange={onBoardVariant} />}
    </>
  );
}

// ------------------------------------------------------------
// Re della collina
// ------------------------------------------------------------

function KothView({ view, onClaim }) {
  const { seats, order, commits, battlefields, contestFieldIndex } = view;
  const seat = (id) => seats.find((s) => s.id === id);
  const cr = view.stage === 'presenting' ? view.contestResult : null;
  const listed = order.length ? order : seats.map((s) => s.id);
  const eliminated = seats.filter((s) => s.eliminated && !listed.includes(s.id));
  const field = contestFieldIndex != null ? battlefields[contestFieldIndex] : null;
  return (
    <>
      <Section title="Contesa" extra={cr ? `Scontro ${Math.min(cr.fights.length, (view.presentIndex ?? 0) + 1)} di ${cr.fights.length}` : null}>
        {field ? (
          <div className="mst-front-mini is-solo"><MiniBattlefield field={field} conquered={false} hidden={false} selected={false} /></div>
        ) : <div className="mst-front-empty">Campo da scegliere</div>}
        {cr ? cr.fights.map((f, i) => (
          <div className={`mst-chain${i === view.presentIndex ? ' is-live' : ''}`} key={f.fightIndex}>
            <span>{seat(f.firstSeatId).name}</span>
            <span className="mst-vs-x">VS</span>
            <span>{seat(f.secondSeatId).name}</span>
            {i < (view.presentIndex ?? 0) ? <span className="mst-chain-win">→ {seat(f.winnerSeatId).name}</span> : null}
          </div>
        )) : null}
      </Section>
      {view.stage === 'claim' && <Claim count={seat('P1').conquests} onClaim={onClaim} />}
      <Section title="Sulla collina">
        {listed.map((id, i) => {
          const s = seat(id);
          const c = commits[id];
          const card = c ? cardOf(s, c.cardId) : null;
          return (
            <div className={`mst-team is-${s.isHuman ? 'ally' : 'foe'}`} key={id}>
              <div className="mst-team-head">
                <span className="mst-team-name">{i === 0 ? '♛ ' : `${i + 1}. `}{s.name}</span>
                <span className="mst-team-role">{s.conquests} Campi</span>
              </div>
              <div className="mst-team-stats">
                <Bar value={s.hp} max={s.maxHp} />
                <span>{s.hp}<small>/{s.maxHp} PV</small></span>
                <span>{s.focus}<small> FC</small></span>
              </div>
              <div className="mst-seat">
                <CardLine card={card} />
                {c && view.stage !== 'over' ? <span className="mst-seat-fc">{cr || s.isHuman ? `${c.investment} FC` : '? FC'}</span> : null}
                <ThinkTag view={view} seatId={id} />
              </div>
            </div>
          );
        })}
        {eliminated.map((s) => (
          <div className="mst-team is-out" key={s.id}><span className="mst-team-name">{s.name}</span><span className="mst-team-role">eliminato</span></div>
        ))}
      </Section>
    </>
  );
}

// ------------------------------------------------------------

export function MultiSeatPanel({
  view,
  ownFocus,
  ownFieldIndex = null,
  onPairing,
  onClaim,
  onAdvise,
  onHoverField,
  boardVariant,
  boardVariants,
  onBoardVariant,
  allyColor = '#a78bfa',
  foeColor = '#f87171',
}) {
  if (!view) return null;
  const title = view.kind === 'teamDuel' ? '2v2 · Abbinamenti segreti' : 'Re della collina';
  const phase = phaseOf(view);
  return (
    <div className="mst" style={{ fontFamily: HUD_ORATORIO_FONT_UI, '--ally': allyColor, '--foe': foeColor }} data-multi-seat-panel="">
      <header className="mst-head">
        <span className="mst-mode">{title}</span>
        {view.roundNumber ? <span className="mst-round">{view.kind === 'teamDuel' ? 'Turno' : 'Contesa'} {view.roundNumber}/5</span> : null}
      </header>
      <div className={`mst-phase is-${phase.tone}`}>
        {phase.tone === 'wait' ? <span className="mst-dots"><i>.</i><i>.</i><i>.</i></span> : null}
        <span>{phase.text}</span>
      </div>
      {view.seats && (view.kind === 'teamDuel'
        ? <TeamView view={view} ownFocus={ownFocus} ownFieldIndex={ownFieldIndex} onPairing={onPairing} onClaim={onClaim} onAdvise={onAdvise} onHoverField={onHoverField} boardVariant={boardVariant} boardVariants={boardVariants} onBoardVariant={onBoardVariant} />
        : <KothView view={view} onClaim={onClaim} />)}
    </div>
  );
}
