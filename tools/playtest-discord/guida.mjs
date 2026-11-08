// ============================================
// GUIDA DEL GIOCO · forum #guida (un post per argomento, sola lettura)
// Fonte: il codice del gioco (src/game, src/data). Dove i documenti in
// Documentazione/ non coincidono con il codice, vale il codice.
// Ogni post: { titolo (max 100 caratteri), messaggi: [testi da max 2000 caratteri] }.
// ============================================

export function guida(cfg) {
  return [
    {
      titolo: 'Guida in preparazione',
      messaggi: [`Regolamento di SATZE v${cfg.versione}: in preparazione.`],
    },
  ];
}
