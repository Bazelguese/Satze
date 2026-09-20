/**
 * Normalizza SVG layout Eldritch da canvas 1024×1536 (2:3) a formato carta 23:33
 * (export 1104×1584).
 *
 * @param {string} source
 * @param {{ stretch?: boolean }} [opts] stretch:true = stesso stretch di object-fit:fill
 *   sui livelli art (testi allineati ad ala/soggetto). Default: letterbox senza deformare.
 */
export function normalizeEldritchSvgTo2333(source, opts = {}) {
  if (!source || typeof source !== 'string') return source || '';
  if (source.includes('data-format="23:33"') || source.includes("data-format='23:33'")) {
    return source;
  }

  if (opts.stretch) {
    let out = source;
    out = out.replace(/<svg\b([^>]*)>/i, (full, attrs) => {
      let a = attrs;
      a = a.replace(/\swidth="[^"]*"/i, '');
      a = a.replace(/\sheight="[^"]*"/i, '');
      a = a.replace(/\sviewBox="[^"]*"/i, '');
      a = a.replace(/\sdata-format="[^"]*"/i, '');
      return `<svg${a} width="1104" height="1584" viewBox="0 0 1024 1536" data-format="23:33">`;
    });
    return out;
  }

  // DOMParser non c'è in Node bake senza jsdom: transform testuale robusto sul root.
  const w = (1536 * 23) / 33;
  const dx = (w - 1024) / 2;

  let out = source;

  out = out.replace(/<svg\b([^>]*)>/i, (full, attrs) => {
    let a = attrs;
    a = a.replace(/\swidth="[^"]*"/i, '');
    a = a.replace(/\sheight="[^"]*"/i, '');
    a = a.replace(/\sviewBox="[^"]*"/i, '');
    a = a.replace(/\sdata-format="[^"]*"/i, '');
    return `<svg${a} width="1104" height="1584" viewBox="0 0 ${w} 1536" data-format="23:33">`;
  });

  // Rect full-bleed 1024 → w
  out = out.replace(
    /(<rect\b[^>]*\bwidth=")1024(")/gi,
    `$1${w}$2`
  );

  // clipPath round: allarga width di 2*dx se presente width numerica
  out = out.replace(
    /(clipPath[^>]*id="[^"]*-round"[^>]*>[\s\S]*?<rect\b[^>]*\bwidth=")([\d.]+)(")/i,
    (_, pre, width) => `${pre}${Number(width) + 2 * dx}"`
  );

  // Layer ink / league-ring / type: translate(dx)
  for (const name of ['ink', 'league-ring', 'type']) {
    const re = new RegExp(
      `(<g\\b[^>]*data-layer="${name}"[^>]*?)(\\stransform="([^"]*)")?([^>]*>)`,
      'i'
    );
    out = out.replace(re, (full, pre, _tAttr, existing, rest) => {
      const t = existing
        ? `transform="translate(${dx} 0) ${existing}"`
        : `transform="translate(${dx} 0)"`;
      if (_tAttr) {
        return `${pre} ${t}${rest}`;
      }
      return `${pre} ${t}${rest}`;
    });
  }

  // Frame: scale(w/1024 1)
  {
    const factor = w / 1024;
    out = out.replace(
      /(<g\b[^>]*data-layer="frame"[^>]*?)(\stransform="([^"]*)")?([^>]*>)/i,
      (full, pre, _tAttr, existing, rest) => {
        const t = existing
          ? `transform="scale(${factor} 1) ${existing}"`
          : `transform="scale(${factor} 1)"`;
        if (_tAttr) return `${pre} ${t}${rest}`;
        return `${pre} ${t}${rest}`;
      }
    );
  }

  return out;
}

export const ELDRITCH_FORMAT_23_33 = {
  ratio: '23:33',
  width: 1104,
  height: 1584,
  cardW: 230,
  cardH: 330,
  artW: 1024,
  artH: 1536,
  /** Anteprime Serie 23-33: fill (non cover) — allinea cornice e break clip. */
  artworkFit: 'fill',
};
