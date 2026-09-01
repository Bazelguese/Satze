import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Restituisce una callback con identità stabile per tutta la vita del componente,
 * che però invoca sempre l'ultima closure ricevuta (nessun rischio di valori stantii).
 *
 * Serve a passare handler ai componenti pesanti del duello senza vanificare
 * `React.memo`: un'arrow function inline cambia identità a ogni render e forza
 * comunque il re-render del figlio.
 */
export function useEventCallback(fn) {
  const ref = useRef(fn);

  useLayoutEffect(() => {
    ref.current = fn;
  });

  return useCallback((...args) => ref.current?.(...args), []);
}

export default useEventCallback;
