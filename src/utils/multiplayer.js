// ============================================
// MULTIPLAYER — WebSocket verso server SATZE (stanze + relay)
// ============================================

/**
 * @typedef {Object} ServerMessage
 * @property {string} type
 */

export class MultiplayerManager {
  constructor() {
    /** @type {WebSocket | null} */
    this.ws = null;
    /** @type {Set<(msg: ServerMessage) => void>} */
    this.handlers = new Set();
    /** Chiusura volontaria (menu / nuova connessione): non mostrare "connessione persa" in multiplayer */
    this._intentionalClose = false;
  }

  /**
   * @param {string} serverUrl es. ws://localhost:3847
   * @returns {Promise<void>}
   */
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (detail) => {
        if (settled) return;
        settled = true;
        const hint =
          ' Controlla che il server sia avviato (nella cartella del progetto: npm run server) e che la porta 3847 non sia bloccata dal firewall.';
        reject(
          new Error(
            `Connessione WebSocket fallita verso ${serverUrl}.${detail ? ` (${detail})` : ''}${hint}`
          )
        );
      };
      try {
        this.ws = new WebSocket(serverUrl);
        this.ws.onopen = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        this.ws.onerror = () => fail('evento error');
        this.ws.onmessage = (event) => {
          let msg;
          try {
            msg = JSON.parse(event.data);
          } catch {
            return;
          }
          this.handlers.forEach((h) => {
            try {
              h(msg);
            } catch (e) {
              console.error(e);
            }
          });
        };
        this.ws.onclose = (ev) => {
          const intentional = this._intentionalClose;
          this._intentionalClose = false;
          if (!settled) {
            fail(ev.code ? `chiusura codice ${ev.code}` : "chiusa prima dell'apertura");
          }
          this.handlers.forEach((h) => {
            try {
              h({ type: 'disconnected', intentional: !!intentional });
            } catch (_) {
              /* ignore */
            }
          });
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @param {{ intentional?: boolean }} [opts] — intentional=true per chiusure da menu o prima di riconnettersi
   */
  disconnect(opts = {}) {
    if (this.ws) {
      if (opts.intentional) this._intentionalClose = true;
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * @param {Record<string, unknown>} obj
   */
  send(obj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[Multiplayer] WebSocket non connesso');
      return;
    }
    this.ws.send(JSON.stringify(obj));
  }

  /**
   * @param {(msg: ServerMessage) => void} handler
   * @returns {() => void} unsubscribe
   */
  onMessage(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * @param {string} roomCode
   * @param {Record<string, unknown>} payload
   */
  sendRelay(roomCode, payload) {
    this.send({ type: 'relay', roomCode, payload });
  }

  isConnected() {
    return !!(this.ws && this.ws.readyState === WebSocket.OPEN);
  }
}

let multiplayerInstance = null;

export function getMultiplayerManager() {
  if (!multiplayerInstance) {
    multiplayerInstance = new MultiplayerManager();
  }
  return multiplayerInstance;
}
