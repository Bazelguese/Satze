// ============================================
// Arte Eminenze — path pubblici e fallback
// ============================================
// Convenzione: `public/card-images/eminence/{eminenceId}.png`
// (accettati anche .webp / .jpg).

import { EMINENCES } from './eminences.js';

const BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL != null
    ? import.meta.env.BASE_URL
    : './';

const EMINENCE_DIR = `${BASE}card-images/eminence/`;

/** Illustrazione di fallback se manca il file dedicato. */
export const EMINENCE_ART_FALLBACK = `${EMINENCE_DIR}tarot-prototype.png`;

const ART_EXTENSIONS = ['png', 'webp', 'jpg', 'jpeg'];

/**
 * URL arte preferito per un'Eminenza.
 * Se `eminence.artFile` è impostato, ha priorità assoluta (path relativo a /card-images/eminence/).
 *
 * @param {string|{id?: string, artFile?: string, artUrl?: string}|null} eminenceOrId
 * @returns {string}
 */
export function getEminenceArtUrl(eminenceOrId) {
  if (!eminenceOrId) return EMINENCE_ART_FALLBACK;

  if (typeof eminenceOrId === 'object') {
    if (eminenceOrId.artFile) {
      const file = String(eminenceOrId.artFile).replace(/^\//, '');
      return `${EMINENCE_DIR}${file}`;
    }
    if (eminenceOrId.artUrl) return eminenceOrId.artUrl;
    return getEminenceArtUrl(eminenceOrId.id);
  }

  const id = String(eminenceOrId);
  if (EMINENCES[id]) return `${EMINENCE_DIR}${id}.png`;

  return EMINENCE_ART_FALLBACK;
}

/** Mappa id → filename per le 12 Eminenze con arte dedicata (convenzione `{id}.png`). */
export const KNOWN_EMINENCE_ART = Object.fromEntries(
  Object.keys(EMINENCES).map((id) => [id, `${id}.png`]),
);

/** Path candidato — utile per drop-in futuri con estensione diversa. */
export function getEminenceArtCandidateUrl(eminenceId, ext = 'png') {
  if (!ART_EXTENSIONS.includes(ext)) ext = 'png';
  return `${EMINENCE_DIR}${eminenceId}.${ext}`;
}
