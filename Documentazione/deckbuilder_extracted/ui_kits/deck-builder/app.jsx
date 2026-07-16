// ============================================================
// app.jsx — DeckBuilder: schermata "Creazione Esercito" (Satze)
// Fase II · Arruolamento. Componi un esercito di 10 carte (MAX 30 LEGA)
// dal set d'armata, con sistema TAG (7 categorie), trigger, filtri,
// analisi tattica live e assistente intelligente.
// Esporta window.DeckBuilder.
// ============================================================
const { useState, useMemo, useEffect } = React;
const DB = window.SATZE_DB;
const { DECK_SIZE, MAX_LEAGUE, isRole, TAG_TOOLTIPS, TRIGGER_COLORS, LEAGUE_COLORS } = DB;

const avg = (arr, k) => (arr.length ? arr.reduce((s, c) => s + c[k], 0) / arr.length : 0);
const ROLES = ['Assalto', 'Difesa', 'Élite', 'Supporto'];
const ROLE_ORDER = { Assalto: 0, Difesa: 1, Élite: 2, Supporto: 3 };
const uniqTags = (c) => [...new Set(c.tags || [])];

// tag "firma" da mostrare sulla carta (postura + funzione) — gli stat-tag sono ridondanti coi numeri
function cardChips(c) {
  const u = uniqTags(c);
  const roles = u.filter(isRole);
  const grey = [c.tags[4], c.tags[5]].filter(Boolean); // postura, funzione
  return { roles, grey, hidden: u.length - roles.length - grey.length };
}

// Punteggio "quanto questa carta aiuta l'esercito" (rispetta il budget lega)
function scoreCard(card, deckCards, remLeague) {
  if (card.league > remLeague) return -999;
  const aP = avg(deckCards, 'pot'), aD = avg(deckCards, 'dan');
  let s = card.pot + card.dan;
  if (aD < aP) s += (card.dan - card.pot) * 0.6;
  else if (aP < aD) s += (card.pot - card.dan) * 0.6;
  const lgCount = deckCards.filter((c) => c.league === card.league).length;
  s -= lgCount * 0.7;
  if (isRole(card.tags[6]) && card.tags.includes('Pillar')) s += 0.5;
  return s;
}

function analyze(deckCards) {
  const count = deckCards.length;
  const totalLeague = deckCards.reduce((s, c) => s + c.league, 0);
  const remLeague = MAX_LEAGUE - totalLeague;
  const aP = avg(deckCards, 'pot'), aD = avg(deckCards, 'dan');
  const roles = ROLES.map((r) => ({ r, n: deckCards.filter((c) => c.role === r).length }));
  const leagues = [2, 3, 4, 5].map((l) => ({ l, n: deckCards.filter((c) => c.league === l).length }));
  const off = Math.round((aP / 9) * 100);
  const def = Math.round((aD / 9) * 100);
  const msgs = [];
  if (count === 0) msgs.push({ t: 'info', x: 'Seleziona le carte dal set per formare l’esercito.' });
  else if (count < DECK_SIZE) msgs.push({ t: 'warn', x: `Mancano ${DECK_SIZE - count} carte (${remLeague} Lega residua).` });
  if (count >= 4) {
    if (aD < aP - 1.5) msgs.push({ t: 'warn', x: 'Fronte scoperto — poca difesa (DAN basso).' });
    else if (aP < aD - 1.5) msgs.push({ t: 'warn', x: 'Poco potere offensivo — POT basso.' });
    if (leagues[3].n >= 4) msgs.push({ t: 'warn', x: 'Curva pesante — troppe carte di Lega 5.' });
    if (roles.filter((r) => r.n > 0).length <= 1) msgs.push({ t: 'warn', x: 'Nessuna varietà di ruolo.' });
  }
  const legal = count === DECK_SIZE && totalLeague <= MAX_LEAGUE;
  if (legal && msgs.filter((m) => m.t === 'warn').length === 0) { msgs.length = 0; msgs.push({ t: 'ok', x: 'Esercito legale e bilanciato. Pronto a schierare.' }); }
  else if (legal) msgs.unshift({ t: 'ok', x: `Esercito completo · ${totalLeague}/${MAX_LEAGUE} Lega.` });
  return { count, totalLeague, remLeague, aP, aD, roles, leagues, off, def, msgs, legal };
}

// ── Tag badge (grigio o rosso-ruolo, con tooltip) ─────────
function Tag({ t, mini }) {
  const role = isRole(t);
  return (
    <span className={`db-tag${role ? ' role' : ''}${mini ? ' mini' : ''}`} title={TAG_TOOLTIPS[t] || t}>{t}</span>
  );
}

function TriggerBadge({ trigger, mini }) {
  const c = TRIGGER_COLORS[trigger] || '#94a3b8';
  return <span className={`db-trig${mini ? ' mini' : ''}`} style={{ color: c, background: c + '20', borderColor: c + '55' }}>{trigger}</span>;
}

function glyphFor(accent) { return GLYPH_MAP[accent] || '◈'; }
let GLYPH_MAP = {};

// ── MiniCard (sashNameHud + strip tag) ────────────────────
function MiniCard({ card, accent, inDeck, recommended, disabled, onClick, onHover, onLeave }) {
  const { roles, grey, hidden } = cardChips(card);
  const lc = LEAGUE_COLORS[card.league] || accent;
  return (
    <button
      className={`db-mc${inDeck ? ' in' : ''}${recommended ? ' rec' : ''}${disabled ? ' dis' : ''}`}
      style={{ '--c': accent }}
      onClick={onClick}
      onMouseEnter={(e) => onHover(card, e.currentTarget)}
      onMouseLeave={onLeave}
    >
      <div className="db-mc-face">
        <div className="db-mc-art">
          {card.img ? <img src={card.img} alt="" draggable="false" /> : <div className="db-mc-ph"><span className="g">{glyphFor(accent)}</span></div>}
          <div className="db-mc-topgrad" />
        </div>
        <span className="db-mc-lega" style={{ color: lc, borderColor: lc }}>L{card.league}</span>
        <div className="db-mc-sash">
          <span className="db-mc-circ pot"><b>{card.pot}</b><i>POT</i></span>
          <span className="db-mc-nm">{card.name}</span>
          <span className="db-mc-circ dan"><b>{card.dan}</b><i>DAN</i></span>
        </div>
        {inDeck && <span className="db-mc-check">✓</span>}
        {recommended && !inDeck && <span className="db-mc-star" title="Consigliata dall’assistente">★</span>}
      </div>
      <div className="db-mc-tags">
        {roles.map((t) => <Tag key={t} t={t} mini />)}
        {grey.map((t) => <Tag key={t} t={t} mini />)}
        {hidden > 0 && <span className="db-tag mini more">+{hidden}</span>}
      </div>
    </button>
  );
}

// ── Popover dettaglio (portal su body: fuori dal canvas scalato) ──
function Detail({ data, accent }) {
  if (!data) return null;
  const { card, rect } = data;
  const u = uniqTags(card);
  const roles = u.filter(isRole), grey = u.filter((t) => !isRole(t));
  const W = 260;
  const right = rect.right + 12 + W < window.innerWidth;
  const left = right ? rect.right + 12 : rect.left - 12 - W;
  const top = Math.min(Math.max(12, rect.top), window.innerHeight - 340);
  return ReactDOM.createPortal(
    <div className="db-detail" style={{ left, top, width: W, '--c': accent }}>
      <div className="db-detail-head">
        <span className="db-detail-lega" style={{ color: LEAGUE_COLORS[card.league], borderColor: LEAGUE_COLORS[card.league] }}>LEGA {card.league}</span>
        <div className="db-detail-stats"><b style={{ color: '#fde047' }}>{card.pot}</b><i>POT</i><b style={{ color: '#c084fc' }}>{card.dan}</b><i>DAN</i></div>
      </div>
      <div className="db-detail-name">{card.name}</div>
      <div className="db-detail-trig"><TriggerBadge trigger={card.trigger} /><span className="db-detail-ab">{card.ability}</span></div>
      <div className="db-detail-sec">TAG · SISTEMA AGENTI</div>
      <div className="db-detail-tags">{grey.map((t) => <Tag key={t} t={t} />)}</div>
      {roles.length > 0 && <div className="db-detail-tags">{roles.map((t) => <Tag key={t} t={t} />)}</div>}
    </div>,
    document.body
  );
}

function DeckRow({ card, accent, onRemove }) {
  const { roles } = cardChips(card);
  const lc = LEAGUE_COLORS[card.league] || accent;
  return (
    <div className="db-row" style={{ '--c': accent }}>
      <span className="db-row-lg" style={{ color: lc, borderColor: lc + '80' }}>L{card.league}</span>
      <div className="db-row-mid">
        <span className="db-row-nm">{card.name}</span>
        <span className="db-row-tags"><TriggerBadge trigger={card.trigger} mini />{roles.slice(0, 1).map((t) => <Tag key={t} t={t} mini />)}</span>
      </div>
      <span className="db-row-st"><b style={{ color: '#fde047' }}>{card.pot}</b>/<b style={{ color: '#c084fc' }}>{card.dan}</b></span>
      <button className="db-row-x" onClick={onRemove} aria-label="rimuovi">✕</button>
    </div>
  );
}

function Bar({ label, value, max, accent, unit }) {
  return (
    <div className="db-bar">
      <div className="db-bar-h"><span>{label}</span><em style={{ color: accent }}>{value}{unit || ''}</em></div>
      <div className="db-bar-t"><div className="db-bar-f" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: `linear-gradient(90deg, ${accent}44, ${accent})`, boxShadow: `0 0 8px ${accent}80` }} /></div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────
function DeckBuilder() {
  const { FACTIONS, POOLS } = DB;
  GLYPH_MAP = useMemo(() => Object.fromEntries(FACTIONS.map((f) => [f.accent, f.glyph])), [FACTIONS]);

  const [facKey, setFacKey] = useState(FACTIONS[0].key);
  const [deckByFac, setDeckByFac] = useState({});
  const [names, setNames] = useState({});
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('lega');
  const [roleFilter, setRoleFilter] = useState('Tutti');
  const [legaFilter, setLegaFilter] = useState(null);
  const [trigFilter, setTrigFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [flash, setFlash] = useState(false);

  const fac = FACTIONS.find((f) => f.key === facKey);
  const pool = POOLS[facKey];
  const accent = fac.accent;
  const deckIds = deckByFac[facKey] || [];
  const deckName = names[facKey] || `Esercito ${fac.name}`;

  const deckCards = useMemo(() => deckIds.map((id) => pool.find((c) => c.id === id)).filter(Boolean), [deckIds, pool]);
  const A = useMemo(() => analyze(deckCards), [deckCards]);
  const bonusActive = deckCards.length >= 2;

  const recommended = useMemo(() => {
    if (deckCards.length >= DECK_SIZE) return new Set();
    return new Set(pool.filter((c) => !deckIds.includes(c.id) && c.league <= A.remLeague)
      .map((c) => ({ id: c.id, s: scoreCard(c, deckCards, A.remLeague) }))
      .sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.id));
  }, [pool, deckIds, deckCards, A.remLeague]);

  const canAdd = (card) => deckIds.includes(card.id) || (deckIds.length < DECK_SIZE && card.league <= A.remLeague);
  function setDeck(ids) { setDeckByFac((m) => ({ ...m, [facKey]: ids })); }
  function toggle(card) {
    if (deckIds.includes(card.id)) { setDeck(deckIds.filter((i) => i !== card.id)); return; }
    if (!canAdd(card)) return;
    setDeck([...deckIds, card.id]);
  }
  function fillFrom(startIds) {
    // Fase 1: raggiungi 10 carte scegliendo per punteggio (ignora budget)
    let ids = [...startIds];
    let dc = ids.map((id) => pool.find((c) => c.id === id));
    while (ids.length < DECK_SIZE) {
      const next = pool.filter((c) => !ids.includes(c.id))
        .sort((a, b) => scoreCard(b, dc, Infinity) - scoreCard(a, dc, Infinity))[0];
      if (!next) break;
      ids.push(next.id); dc.push(next);
    }
    // Fase 2: se sfori 30 Lega, sostituisci le carte più costose con alternative più leggere
    let total = dc.reduce((s, c) => s + c.league, 0);
    let guard = 40;
    while (total > MAX_LEAGUE && guard-- > 0) {
      const hi = dc.slice().sort((a, b) => b.league - a.league);
      let swapped = false;
      for (const h of hi) {
        const repl = pool.filter((c) => !ids.includes(c.id) && c.league < h.league)
          .sort((a, b) => b.league - a.league || scoreCard(b, dc, Infinity) - scoreCard(a, dc, Infinity))[0];
        if (repl) { ids = ids.map((id) => (id === h.id ? repl.id : id)); dc = ids.map((id) => pool.find((c) => c.id === id)); total = dc.reduce((s, c) => s + c.league, 0); swapped = true; break; }
      }
      if (!swapped) break;
    }
    setDeck(ids);
  }
  const autoComplete = () => fillFrom(deckIds);
  const optimize = () => fillFrom([]);
  const clear = () => setDeck([]);
  function schiera() { if (!A.legal) return; setFlash(true); setTimeout(() => setFlash(false), 1400); }

  const shown = useMemo(() => {
    let list = pool.slice();
    if (query.trim()) { const q = query.toLowerCase(); list = list.filter((c) => c.name.toLowerCase().includes(q)); }
    if (roleFilter !== 'Tutti') list = list.filter((c) => c.role === roleFilter);
    if (legaFilter) list = list.filter((c) => c.league === legaFilter);
    if (trigFilter) list = list.filter((c) => c.trigger === trigFilter);
    if (tagFilter) list = list.filter((c) => c.tags.includes(tagFilter));
    const cmp = {
      lega: (a, b) => a.league - b.league || b.pot + b.dan - (a.pot + a.dan),
      pot: (a, b) => b.pot - a.pot, dan: (a, b) => b.dan - a.dan,
      ruolo: (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || b.pot - a.pot,
    }[sort];
    return list.sort(cmp);
  }, [pool, query, roleFilter, legaFilter, trigFilter, tagFilter, sort]);

  const allTriggers = useMemo(() => [...new Set(pool.map((c) => c.trigger))].sort(), [pool]);
  const allTags = useMemo(() => [...new Set(pool.flatMap((c) => c.tags))].sort(), [pool]);

  useEffect(() => { const onKey = (e) => { if (e.key === 'Enter' && A.legal) schiera(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); });
  // reset filtri lega/trig/tag quando cambia armata
  useEffect(() => { setLegaFilter(null); setTrigFilter(''); setTagFilter(''); setDetail(null); }, [facKey]);

  return (
    <div className="db" style={{ '--accent': accent }}>
      <div className="db-cosmic" />
      <div className="db-vignette" />

      <header className="db-head">
        <button className="db-back"><span className="ar">←</span><span>ARMATA</span></button>
        <div className="db-head-mid">
          <div className="db-eyebrow" style={{ color: accent }}>FASE II · ARRUOLAMENTO</div>
          <h1 className="db-title">COSTRUZIONE ESERCITO</h1>
          <div className="db-subtitle">10 CARTE · MAX 30 LEGA · SISTEMA TAG v2</div>
        </div>
        <div className="db-head-r">
          <span className="db-fac-glyph" style={{ color: accent }}>{fac.glyph}</span>
          <span className="db-fac-name">{fac.name}</span>
        </div>
      </header>

      <div className="db-body">
        {/* RAIL */}
        <aside className="db-rail">
          <div className="db-rail-h">ARMATA</div>
          <div className="db-rail-list">
            {FACTIONS.map((f) => (
              <button key={f.key} className={`db-fac${f.key === facKey ? ' on' : ''}`} style={{ '--c': f.accent }} onClick={() => setFacKey(f.key)}>
                <img src={`../../${f.icon}`} alt="" className="db-fac-ic" draggable="false" />
                <span className="db-fac-lbl">{f.name}</span>
                <span className="db-fac-dot" />
              </button>
            ))}
          </div>
          <div className="db-bonus" style={{ borderColor: accent }}>
            <div className="db-bonus-h" style={{ color: accent }}>
              BONUS · {fac.bonusLabel}
              <span className={`db-bonus-state${bonusActive ? ' on' : ''}`}>{bonusActive ? 'ATTIVO' : '2+ CARTE'}</span>
            </div>
            <div className="db-bonus-v">{fac.bonus}</div>
            <div className="db-bonus-kw">{fac.keywords.map((k) => <span key={k} style={{ borderColor: accent + '66', color: accent }}>{k}</span>)}</div>
          </div>
        </aside>

        {/* POOL */}
        <main className="db-pool">
          <div className="db-toolbar">
            <div className="db-search">
              <span className="db-search-ic">⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca carta…" />
            </div>
            <div className="db-filtgroup">
              <label>LEGA</label>
              {[null, 2, 3, 4, 5].map((l) => (
                <button key={l ?? 'all'} className={`db-lg${legaFilter === l ? ' on' : ''}`} onClick={() => setLegaFilter(l)}
                  style={l && legaFilter === l ? { color: LEAGUE_COLORS[l], borderColor: LEAGUE_COLORS[l] } : undefined}>{l ?? '∗'}</button>
              ))}
            </div>
            <select className="db-sel" value={trigFilter} onChange={(e) => setTrigFilter(e.target.value)} title="Filtro trigger">
              <option value="">TRIGGER · tutti</option>
              {allTriggers.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="db-sel" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} title="Filtro tag">
              <option value="">TAG · tutti</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="db-sort">
              <label>ORDINA</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="lega">Lega</option><option value="pot">POT ↓</option><option value="dan">DAN ↓</option><option value="ruolo">Ruolo</option>
              </select>
            </div>
          </div>

          <div className="db-grid">
            {shown.map((c) => (
              <MiniCard key={c.id} card={c} accent={accent}
                inDeck={deckIds.includes(c.id)} recommended={recommended.has(c.id)}
                disabled={!canAdd(c)} onClick={() => toggle(c)}
                onHover={(card, el) => setDetail({ card, rect: el.getBoundingClientRect() })}
                onLeave={() => setDetail(null)} />
            ))}
            {shown.length === 0 && <div className="db-empty">Nessuna carta con questi filtri.</div>}
          </div>
          <div className="db-pool-foot">
            <span>{shown.length} {shown.length === 1 ? 'carta' : 'carte'} · SET {fac.name}</span>
            <span className="db-hint">Clicca per arruolare · <b style={{ color: accent }}>★</b> consigliata · tag <b style={{ color: '#ef4444' }}>rossi</b> = Ruolo</span>
          </div>
        </main>

        {/* DECK */}
        <aside className="db-deck">
          <div className="db-deck-name">
            <input value={deckName} onChange={(e) => setNames((m) => ({ ...m, [facKey]: e.target.value }))} spellCheck="false" />
            <span className="db-deck-edit">✎</span>
          </div>

          {/* budget lega + conteggio */}
          <div className="db-budget">
            <div className="db-budget-bar">
              <div className="db-budget-h"><span>LEGA TOTALE</span><em style={{ color: A.totalLeague > MAX_LEAGUE ? '#c2473f' : A.totalLeague >= 25 ? '#c9a23e' : accent }}>{A.totalLeague} / {MAX_LEAGUE}</em></div>
              <div className="db-budget-t"><div className="db-budget-f" style={{ width: `${Math.min(100, (A.totalLeague / MAX_LEAGUE) * 100)}%`, background: A.totalLeague >= 25 ? 'linear-gradient(90deg,#4a9e78,#c9a23e)' : `linear-gradient(90deg,#4a9e78,${accent})` }} /></div>
            </div>
            <div className="db-count" style={{ '--pct': A.count / DECK_SIZE }}>
              <svg viewBox="0 0 60 60" className="db-count-ring">
                <circle cx="30" cy="30" r="26" className="db-ring-bg" />
                <circle cx="30" cy="30" r="26" className="db-ring-fg" style={{ stroke: accent, strokeDasharray: 2 * Math.PI * 26, strokeDashoffset: 2 * Math.PI * 26 * (1 - A.count / DECK_SIZE) }} />
              </svg>
              <div className="db-count-txt"><b>{A.count}</b><i>/{DECK_SIZE}</i></div>
            </div>
          </div>

          <div className="db-slots">
            {deckCards.map((c) => <DeckRow key={c.id} card={c} accent={accent} onRemove={() => setDeck(deckIds.filter((i) => i !== c.id))} />)}
            {Array.from({ length: Math.max(0, DECK_SIZE - deckCards.length) }).map((_, i) => <div className="db-slot-x" key={`e${i}`}><span>—</span></div>)}
          </div>

          <div className="db-analysis">
            <div className="db-an-h">ANALISI TATTICA</div>
            <div className="db-an-grid">
              <Bar label="POT medio" value={+A.aP.toFixed(1)} max={9} accent="#fde047" />
              <Bar label="DAN medio" value={+A.aD.toFixed(1)} max={9} accent="#c084fc" />
              <Bar label="Offesa" value={A.off} max={100} accent={accent} unit="%" />
              <Bar label="Difesa" value={A.def} max={100} accent={accent} unit="%" />
            </div>
            <div className="db-curve">
              <span className="db-curve-l">CURVA LEGHE</span>
              <div className="db-curve-bars">
                {A.leagues.map((lg) => (
                  <div key={lg.l} className="db-curve-col">
                    <div className="db-curve-fill" style={{ height: `${Math.min(100, lg.n * 22)}%`, background: LEAGUE_COLORS[lg.l] }} />
                    <span className="db-curve-n">{lg.n}</span><span className="db-curve-t">L{lg.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="db-advice">
            {A.msgs.map((m, i) => <div key={i} className={`db-msg ${m.t}`}><span className="db-msg-ic">{m.t === 'ok' ? '✓' : m.t === 'warn' ? '!' : 'i'}</span>{m.x}</div>)}
          </div>

          <div className="db-actions">
            <button className="db-act" onClick={autoComplete} disabled={A.count >= DECK_SIZE}>◈ Auto-completa</button>
            <button className="db-act" onClick={optimize}>⟳ Ottimizza</button>
            <button className="db-act ghost" onClick={clear} disabled={A.count === 0}>Svuota</button>
          </div>

          <button className={`db-schiera${A.legal ? ' ready' : ''}`} style={{ borderColor: accent, color: A.legal ? accent : undefined }} onClick={schiera} disabled={!A.legal}>
            <span className="db-schiera-bg" /><span className="db-schiera-l">SCHIERA ESERCITO</span><span className="db-schiera-k">↵</span>
          </button>
        </aside>
      </div>

      <div className="db-scan" />
      <Detail data={detail} accent={accent} />
      {flash && (
        <div className="db-flash" style={{ '--accent': accent }}>
          <div className="db-flash-bg" />
          <div className="db-flash-txt">
            <div className="e" style={{ color: accent }}>ESERCITO SCHIERATO</div>
            <div className="n">{deckName}</div>
            <div className="s">{fac.name} · {A.count} carte · {A.totalLeague} Lega · POT {A.aP.toFixed(1)} / DAN {A.aD.toFixed(1)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

window.DeckBuilder = DeckBuilder;
