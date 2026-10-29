// ============================================================
// GalleryCinematic.jsx — Schermata "Galleria dei Campi" (stile Persona)
// ============================================================
// Rail = tipo meccanico (Valori, Vincolo, ...), lista = campi del tipo,
// stage = animazione reveal reale (BattlefieldReveal) in cornice inclinata.
// E' consultazione pura, non una scelta: nessuna fase di conferma.
//
// Props:
//   onBack()   torna al menu
//
// Si renderizza fullscreen (position: absolute). Renderizzala al livello
// del routing, NON dentro CosmicScreenLayout o altri wrapper.
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { ALL_BATTLEFIELDS, getBattlefieldAnimationType } from '../../../data/battlefields.js';
import {
  BATTLEFIELD_CATEGORY_ORDER,
  flattenBattlefieldsByCategory,
} from '../../../data/battlefieldMeta.js';
import { BattlefieldReveal } from '../../gallery/BattlefieldRevealAnimations.jsx';
import { useCosmicHeavyContentReady } from '../../cosmic/ScreenTransition.jsx';
import { resolvePublicAssetUrl, resolveFieldThumbUrl } from '../../../utils/preloadAssets.js';
import {
  GalleryPersonaShell,
  PersonaRail,
  PersonaList,
  PersonaNamePlate,
  armyAccent,
  armyGlyph,
  wrapIndex,
} from './GalleryPersonaShell.jsx';

const CATEGORY_LABEL = {
  values: 'VALORI',
  limit: 'VINCOLO',
  conditional: 'CONDIZIONALE',
  focus: 'FOCUS',
  trigger: 'INNESCO',
  neutral: 'NEUTRO',
};

const CATEGORY_DESC = {
  values: 'Altera POT o DAN in base allo stato della partita.',
  limit: 'Impone un tetto rigido alle mosse disponibili.',
  conditional: "Si attiva solo se una condizione è soddisfatta.",
  focus: 'Il Focus Coin scorre a un ritmo diverso, qui.',
  trigger: "Un evento innesca l'effetto una sola volta.",
  neutral: 'Nessun effetto: resta solo lo scenario.',
};

/** Accento del tipo quando il campo non ha un tema d'armata. */
const CATEGORY_ACCENT = {
  values: '#f8504f',
  limit: '#fbbf24',
  conditional: '#38bdf8',
  focus: '#a288fb',
  trigger: '#fb912d',
  neutral: '#cbd5e1',
};

const RARITY_LABEL = {
  comune: 'COMUNE',
  raro: 'RARO',
  special: 'SPECIALE',
};

function resolveFieldImage(bgImage, fieldId) {
  // Griglia/viewer galleria: thumb (leggere). Full-res resta per il duello.
  if (bgImage) {
    return resolveFieldThumbUrl(bgImage) || resolvePublicAssetUrl(bgImage) || bgImage;
  }
  return resolveFieldThumbUrl(`/campi_bg/campo-${fieldId}.webp`)
    || resolvePublicAssetUrl(`/campi_bg/campo-${fieldId}.webp`);
}

function buildFields() {
  return flattenBattlefieldsByCategory(ALL_BATTLEFIELDS).map((f) => {
    const themed = f.tema && f.tema !== 'generico';
    return {
      id: f.id,
      name: f.name,
      army: themed ? f.tema : 'Generico',
      accent: themed ? armyAccent(f.tema, CATEGORY_ACCENT[f.category]) : (CATEGORY_ACCENT[f.category] || '#94a3b8'),
      glyph: themed ? armyGlyph(f.tema) : '◈',
      anim: getBattlefieldAnimationType(f.id),
      img: resolveFieldImage(f.bgImage, f.id),
      category: f.category,
      catLabel: CATEGORY_LABEL[f.category] || 'NEUTRO',
      catDesc: CATEGORY_DESC[f.category] || '',
      effect: f.effect || CATEGORY_DESC[f.category] || '',
      rarity: RARITY_LABEL[f.rarita] || null,
      flavour: f.flavour || '',
    };
  });
}

export default function GalleryCinematic({
  onBack,
  totalFields = ALL_BATTLEFIELDS.length,
  galleryTab,
  onGalleryTabChange,
  agentCount,
  alternativeCount,
  fieldCount = ALL_BATTLEFIELDS.length,
  eminenceCount,
}) {
  const FIELDS = useMemo(() => buildFields(), []);
  const categories = useMemo(
    () => BATTLEFIELD_CATEGORY_ORDER.filter((c) => FIELDS.some((f) => f.category === c)),
    [FIELDS],
  );
  const [category, setCategory] = useState(categories[0]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [token, setToken] = useState(0);
  const heavyOk = useCosmicHeavyContentReady();

  const shown = useMemo(() => FIELDS.filter((f) => f.category === category), [FIELDS, category]);

  useEffect(() => {
    setActiveIndex(0);
  }, [category]);

  const index = Math.min(activeIndex, Math.max(0, shown.length - 1));
  const field = shown[index] || FIELDS[0];

  const railItems = useMemo(() => categories.map((c) => ({
    id: c,
    label: CATEGORY_LABEL[c] || c,
    accent: CATEGORY_ACCENT[c] || '#94a3b8',
    count: FIELDS.filter((f) => f.category === c).length,
  })), [categories, FIELDS]);

  const listItems = useMemo(() => shown.map((f) => ({
    key: f.id,
    number: `№${String(f.id).padStart(3, '0')}`,
    title: f.name,
    sub: f.effect,
    accent: f.accent,
    glyph: f.glyph,
  })), [shown]);

  const changeCategory = (delta) => {
    const i = categories.indexOf(category);
    setCategory(categories[wrapIndex(i, delta, categories.length)]);
  };

  return (
    <>
      <GalleryPersonaShell
        accent={field.accent}
        section="CAMPI"
        eyebrow={`${totalFields} CAMPI DI BATTAGLIA`}
        title={CATEGORY_LABEL[category]}
        motto={CATEGORY_DESC[category]}
        watermark="CAMPI"
        bgImage={field.img}
        counterLabel={CATEGORY_LABEL[category]}
        counterCurrent={index + 1}
        counterTotal={shown.length}
        onBack={onBack}
        galleryTab={galleryTab}
        onGalleryTabChange={onGalleryTabChange}
        agentCount={agentCount}
        alternativeCount={alternativeCount}
        fieldCount={fieldCount}
        eminenceCount={eminenceCount}
        onPrev={() => setActiveIndex(wrapIndex(index, -1, shown.length))}
        onNext={() => setActiveIndex(wrapIndex(index, 1, shown.length))}
        onRailPrev={() => changeCategory(-1)}
        onRailNext={() => changeCategory(1)}
        onReplay={() => setToken((t) => t + 1)}
        hints={[
          { keys: ['↑', '↓'], label: 'CAMPO' },
          { keys: ['←', '→'], label: 'TIPO' },
          { keys: ['R'], label: 'RIGIOCA' },
          { keys: ['Q', 'E'], label: 'SEZIONE' },
          { keys: ['ESC'], label: 'MENU' },
        ]}
        rail={<PersonaRail items={railItems} activeId={category} onSelect={setCategory} />}
        list={<PersonaList items={listItems} activeIndex={index} onSelect={setActiveIndex} />}
        stage={(
          <FieldStage
            key={field.id}
            field={field}
            token={token}
            heavyOk={heavyOk}
            onReplay={() => setToken((t) => t + 1)}
          />
        )}
      />
      <GalleryStyles />
    </>
  );
}

function FieldStage({ field, token, heavyOk, onReplay }) {
  return (
    <div className="glp-stage" style={{ '--accent': field.accent }}>
      <div className="glp-viewer-wrap">
        <div className="glp-viewer">
          <div className="glp-viewer-frame" key={`v-${token}`}>
            {heavyOk ? (
              <BattlefieldReveal imageSrc={field.img} animationType={field.anim} />
            ) : (
              <img src={field.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div className="glp-viewer-tone" />
        </div>
        <button type="button" className="glp-replay" onClick={onReplay} title="Rigioca (R)">
          <span>↻ RIGIOCA</span>
        </button>
      </div>

      <div className="glp-head gp-anim-swipe">
        <PersonaNamePlate
          number={`№ ${String(field.id).padStart(3, '0')}`}
          name={field.name}
          sub={field.catLabel}
        />
      </div>

      <div className="glp-info">
        <div className="gp-panel gp-panel--light glp-effect gp-anim-swipe d1">
          <div className="gp-panel-label">EFFETTO</div>
          <p>{field.effect}</p>
        </div>
        <div className="glp-side gp-anim-swipe d2">
          <div className="glp-chip glp-chip--theme">
            <span className="gy">{field.glyph}</span>
            <span>{field.army}</span>
          </div>
          {field.rarity && <div className="glp-chip"><span>{field.rarity}</span></div>}
        </div>
        {field.flavour && (
          <div className="gp-panel glp-flavour gp-anim-swipe d3">
            <p>{field.flavour}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryStyles() {
  return (
    <style>{`
      .glp-stage { position: absolute; inset: 0; }

      .glp-viewer-wrap {
        position: absolute; left: 0; right: 0; top: 104px; height: 486px; z-index: 4;
        transform: rotate(-2deg);
        animation: gp-swipe-in .45s cubic-bezier(.2,1,.3,1) both;
      }
      .glp-viewer {
        position: absolute; inset: 0; overflow: hidden; background: #0a0a0e;
        clip-path: polygon(4% 0, 100% 0, 96% 100%, 0 100%);
      }
      .glp-viewer-wrap::before {
        content: ''; position: absolute; inset: 0; transform: translate(14px, 14px);
        background: var(--accent);
        clip-path: polygon(4% 0, 100% 0, 96% 100%, 0 100%);
        transition: background .3s;
      }
      .glp-viewer-frame { position: absolute; inset: 0; }
      .glp-viewer-tone {
        position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 35%);
      }
      .glp-replay {
        position: absolute; right: 64px; bottom: 18px; z-index: 3;
        border: 0; cursor: pointer; padding: 9px 18px; transform: skewX(-14deg);
        background: #050507; color: #f5f3eb;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: 0.12em;
        box-shadow: 4px 4px 0 var(--accent); transition: transform .15s, box-shadow .15s;
      }
      .glp-replay > span { display: inline-block; transform: skewX(14deg); }
      .glp-replay:hover { transform: skewX(-14deg) translate(-2px,-2px); box-shadow: 7px 7px 0 var(--accent); }

      .glp-head { position: absolute; top: -6px; right: 20px; z-index: 6; max-width: 900px; display: flex; justify-content: flex-end; }

      .glp-info {
        position: absolute; left: 30px; right: 0; bottom: 0; z-index: 5;
        display: grid; grid-template-columns: 1fr 240px; gap: 12px 18px; align-items: start;
      }
      .glp-effect p { margin: 0; font-weight: 600; font-size: 24px; line-height: 1.3; }
      .glp-side { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding-top: 6px; }
      .glp-chip {
        display: inline-flex; align-items: center; gap: 8px;
        background: #050507; color: #f5f3eb; padding: 6px 14px;
        font-weight: 700; font-size: 14px; letter-spacing: 0.14em; text-transform: uppercase;
        transform: skewX(-14deg);
      }
      .glp-chip > * { display: inline-block; transform: skewX(14deg); }
      .glp-chip--theme { background: var(--accent); color: #050507; }
      .glp-chip .gy { font-size: 17px; }
      .glp-flavour { grid-column: 1 / -1; }
      .glp-flavour p { margin: 0; font-size: 15px; line-height: 1.5; font-style: italic; color: rgba(245,243,235,0.85); }
    `}</style>
  );
}
