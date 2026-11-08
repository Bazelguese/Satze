// ============================================
// TELEMETRIA DEL PLAYTEST
// A fine partita il gioco invia i dati della partita al canale privato #dati-partite del
// Discord del playtest, tramite un webhook. Attiva solo nella build pubblica con
// VITE_SATZE_TELEMETRY_URL impostato in .env.public (l'indirizzo non va nel repository: è pubblico).
// Senza connessione i dati restano in coda e partono alla prima occasione.
// ============================================

import { IS_PUBLIC_PLAYTEST_BUILD, SATZE_VERSION, SATZE_BUILD_DATE } from '../config/buildProfile.js';

const URL_WEBHOOK =
  typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_SATZE_TELEMETRY_URL || '').trim() : '';

export const SCHEMA_TELEMETRIA = 1;
const CHIAVE_NOME = 'satze_nome_giocatore';
const CHIAVE_INSTALLAZIONE = 'satze_id_installazione';
const CHIAVE_CODA = 'satze_telemetria_coda';
const MAX_CODA = 200;
export const MAX_NOME = 32;

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function inviaTramiteElectron() {
  if (typeof window === 'undefined') return null;
  return window.electronAPI?.telemetry?.send ?? null;
}

/** true se questa build raccoglie i dati di gioco. */
export function telemetriaAttiva() {
  return IS_PUBLIC_PLAYTEST_BUILD && URL_WEBHOOK.startsWith('https://') && Boolean(inviaTramiteElectron());
}

export function getNomeGiocatore() {
  return (storage()?.getItem(CHIAVE_NOME) || '').trim();
}

export function setNomeGiocatore(nome) {
  const pulito = String(nome || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NOME);
  if (!pulito) return '';
  storage()?.setItem(CHIAVE_NOME, pulito);
  return pulito;
}

/** Serve il nome solo se la telemetria è attiva e il giocatore non l'ha ancora dato. */
export function serveNomeGiocatore() {
  return telemetriaAttiva() && !getNomeGiocatore();
}

/** Identificativo casuale dell'installazione: distingue due PC con lo stesso nome. */
export function getIdInstallazione() {
  const s = storage();
  let id = s?.getItem(CHIAVE_INSTALLAZIONE);
  if (!id) {
    id = `I-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    s?.setItem(CHIAVE_INSTALLAZIONE, id);
  }
  return id;
}

export function nuovoIdPartita() {
  return `P-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function leggiCoda() {
  try {
    const grezzo = storage()?.getItem(CHIAVE_CODA);
    const coda = grezzo ? JSON.parse(grezzo) : [];
    return Array.isArray(coda) ? coda : [];
  } catch {
    return [];
  }
}

function scriviCoda(coda) {
  try {
    storage()?.setItem(CHIAVE_CODA, JSON.stringify(coda.slice(-MAX_CODA)));
  } catch {
    /* coda piena o storage non disponibile: si perde al massimo la partita più vecchia */
  }
}

const ESITI = { vittoria: '🏆 Vittoria', sconfitta: '💀 Sconfitta', pareggio: '🤝 Pareggio' };
const MODALITA = { duello: 'Duello', '2v2': '2v2', reDellaCollina: 'Re della collina', multiplayer: 'Multiplayer' };
const FORMATI = { standard: 'Standard', noEminenza: 'No Eminenza', maniNude: 'Mani nude' };

/** Una riga leggibile per il canale Discord; i dati completi sono nel file allegato. */
export function riepilogoPartita(r) {
  const parti = [
    `**${r.giocatore?.nome || 'Senza nome'}**`,
    [MODALITA[r.modalita] || r.modalita, FORMATI[r.formato]].filter(Boolean).join(' '),
    `${r.giocatore?.armata || '?'} vs ${(r.avversari || []).map((a) => a.armata || '?').join(' / ') || '?'}`,
    `${ESITI[r.esito] || r.esito}${r.motivo ? ` (${r.motivo})` : ''}`,
    `${r.roundGiocati ?? '?'} round`,
    r.durataSecondi != null ? `${Math.round(r.durataSecondi / 60)} min` : null,
    `v${r.versione}`,
  ];
  return parti.filter(Boolean).join(' · ').slice(0, 1900);
}

let invioInCorso = false;

/** Prova a inviare tutto ciò che è in coda. Sicura da chiamare spesso. */
export async function svuotaCoda() {
  const invia = inviaTramiteElectron();
  if (!telemetriaAttiva() || !invia || invioInCorso) return;
  invioInCorso = true;
  try {
    let coda = leggiCoda();
    while (coda.length) {
      const record = coda[0];
      let esito;
      try {
        esito = await invia({
          url: URL_WEBHOOK,
          testo: riepilogoPartita(record),
          nomeFile: `${record.idPartita || 'partita'}.json`,
          json: JSON.stringify(record, null, 2),
        });
      } catch {
        esito = { ok: false };
      }
      if (!esito?.ok) break; // offline o Discord non raggiungibile: si riprova più tardi
      coda = leggiCoda().filter((r) => r.idPartita !== record.idPartita);
      scriviCoda(coda);
    }
  } finally {
    invioInCorso = false;
  }
}

/**
 * Registra una partita conclusa e la mette in coda di invio.
 * `dati` contiene i campi specifici della partita (modalità, round, esito...).
 */
export function registraPartita(dati) {
  if (!telemetriaAttiva()) return null;
  const record = {
    schema: SCHEMA_TELEMETRIA,
    versione: SATZE_VERSION,
    dataBuild: SATZE_BUILD_DATE,
    idPartita: dati.idPartita || nuovoIdPartita(),
    idInstallazione: getIdInstallazione(),
    inviataIl: new Date().toISOString(),
    ...dati,
    giocatore: { nome: getNomeGiocatore() || null, ...(dati.giocatore || {}) },
  };
  scriviCoda([...leggiCoda().filter((r) => r.idPartita !== record.idPartita), record]);
  svuotaCoda();
  return record;
}
