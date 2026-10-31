import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Cache delle schermate.
 *
 * Ogni cambio di fase del gioco smontava la schermata vecchia e ricostruiva la nuova da zero
 * (componenti, DOM, stili, layout, livelli grafici). Con la cache le schermate fisse restano
 * montate e nascoste (display: none): tornandoci si rimostrano e si aggiornano, senza ricrearle.
 *
 * - Nascosta, una schermata riceve sempre lo stesso elemento React dell'ultima volta che era
 *   attiva: React la salta del tutto, quindi non costa nulla agli aggiornamenti del gioco.
 *   display: none ferma anche le sue animazioni CSS, che ripartono da capo al rientro.
 * - Ciò che una schermata creava "alla nascita" va rifatto a ogni ingresso: useScreenState
 *   (stato che torna al valore iniziale), useScreenVisit (effetti d'ingresso da rieseguire),
 *   useScreenActiveRef (tastiera e listener globali solo se la schermata è visibile).
 * - Le schermate legate allo stato della partita non vanno in cache (cacheable=false): si
 *   smontano appena si esce, come prima.
 */

const SlotContext = createContext({ active: true, visit: 0 });

/** true se la schermata che contiene il componente è quella visibile (fuori cache: sempre true). */
export function useScreenActive() {
  return useContext(SlotContext).active;
}

/** Ref sempre aggiornato a useScreenActive(), da leggere dentro i listener globali. */
export function useScreenActiveRef() {
  const active = useScreenActive();
  const ref = useRef(active);
  ref.current = active;
  return ref;
}

/** Numero dell'ingresso corrente nella schermata: cambia a ogni rientro. */
export function useScreenVisit() {
  return useContext(SlotContext).visit;
}

const resolveInitial = (initial) => (typeof initial === 'function' ? initial() : initial);

/**
 * useState che a ogni rientro nella schermata torna al valore iniziale, come se la schermata
 * fosse appena stata creata. Il reset avviene nello stesso render (nessun frame col valore vecchio).
 */
export function useScreenState(initial) {
  const visit = useScreenVisit();
  const [state, setState] = useState(initial);
  const [seenVisit, setSeenVisit] = useState(visit);
  if (seenVisit !== visit) {
    setSeenVisit(visit);
    const fresh = resolveInitial(initial);
    setState(fresh);
    return [fresh, setState];
  }
  return [state, setState];
}

const HIDDEN_STYLE = { display: 'none' };
const ACTIVE_STYLE = { display: 'contents' };

/**
 * Tiene in vita fino a `max` schermate in cache. Tutti i return del render del gioco devono
 * passare da qui (stessa posizione nell'albero), altrimenti React smonterebbe la cache.
 *
 * screenKey: identità della schermata (una per punto di return).
 * cacheable: se false la schermata non resta in memoria quando si esce.
 */
export function ScreenCacheHost({ screenKey, cacheable = false, max = 6, children }) {
  const elementsRef = useRef(new Map());
  const cacheableRef = useRef(new Map());
  const lastActiveRef = useRef(new Map());
  const ctxRef = useRef(new Map());
  const [order, setOrder] = useState(() => [screenKey]);
  const [visits, setVisits] = useState(() => ({ [screenKey]: 1 }));
  const [current, setCurrent] = useState(screenKey);

  // cambio schermata: nuovo ingresso e, se serve, nuovo posto in coda (mai riordinare: un nodo
  // spostato nel DOM farebbe ripartire animazioni e canvas)
  let liveOrder = order;
  let liveVisits = visits;
  if (current !== screenKey) {
    liveVisits = { ...visits, [screenKey]: (visits[screenKey] || 0) + 1 };
    liveOrder = order.includes(screenKey) ? order : [...order, screenKey];
    // via le schermate non conservabili e, oltre il limite, le meno usate di recente
    liveOrder = liveOrder.filter((k) => k === screenKey || cacheableRef.current.get(k));
    const cached = liveOrder.filter((k) => k !== screenKey);
    if (cached.length > max) {
      const drop = new Set(
        [...cached]
          .sort((a, b) => (lastActiveRef.current.get(a) || 0) - (lastActiveRef.current.get(b) || 0))
          .slice(0, cached.length - max)
      );
      liveOrder = liveOrder.filter((k) => !drop.has(k));
    }
    setCurrent(screenKey);
    setVisits(liveVisits);
    setOrder(liveOrder);
  }

  elementsRef.current.set(screenKey, children);
  cacheableRef.current.set(screenKey, cacheable);
  for (const k of [...elementsRef.current.keys()]) {
    if (!liveOrder.includes(k)) {
      elementsRef.current.delete(k);
      ctxRef.current.delete(k);
    }
  }

  useEffect(() => {
    lastActiveRef.current.set(screenKey, performance.now());
  });

  // valore di contesto stabile per (attiva, ingresso): una schermata nascosta non si ri-renderizza
  const ctxFor = (key, active) => {
    const visit = liveVisits[key] || 0;
    const prev = ctxRef.current.get(key);
    if (prev && prev.active === active && prev.visit === visit) return prev;
    const next = { active, visit };
    ctxRef.current.set(key, next);
    return next;
  };

  return liveOrder.map((key) => {
    const active = key === screenKey;
    return (
      <SlotContext.Provider key={key} value={ctxFor(key, active)}>
        <div data-screen-slot={key} style={active ? ACTIVE_STYLE : HIDDEN_STYLE}>
          {elementsRef.current.get(key)}
        </div>
      </SlotContext.Provider>
    );
  });
}

/** Esegue `fn` a ogni rientro nella schermata (non alla prima creazione), prima del disegno. */
export function useScreenEnter(fn) {
  const visit = useScreenVisit();
  const first = useRef(visit);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useLayoutEffect(() => {
    if (visit !== first.current) fnRef.current();
  }, [visit]);
}
