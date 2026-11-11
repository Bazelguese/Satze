// Solo in sviluppo: il runtime del ricaricamento a caldo di React (@vitejs/plugin-react 4.2)
// scrive su `window` appena viene caricato, e ci arriva anche il worker dell'IA perché i dati
// del gioco importano src/data/icons.jsx. In un Web Worker `window` non esiste: senza questo
// alias il worker non parte e l'IA ripiega sul motore precedente.
// In produzione il runtime non c'è e questo modulo non fa nulla.
// Per lo stesso motivo servono anche le funzioni di registrazione del ricaricamento a caldo,
// che nel worker il plugin non definisce: qui non fanno nulla.
if (import.meta.env?.DEV && typeof window === 'undefined') {
  globalThis.window = globalThis;
  globalThis.$RefreshReg$ ??= () => {};
  globalThis.$RefreshSig$ ??= () => (type) => type;
}
