import { ARMY_SETS } from '../../data/cards';
import { ARMY_BONUSES, ARMY_COLORS } from '../../data/armies';
import { getCardImageUrl } from '../../data/images';
import { TRIGGER_NAMES } from '../../data/triggers';
import {
  ALFA_DEFAULTS,
  ELDRITCH_COLORS,
  ELDRITCH_DEFAULT_LAYOUT,
  sanitizeLayout,
} from './alfaCardRenderer';

const BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL != null
    ? import.meta.env.BASE_URL
    : './';

const ELDRITCH_DIR = `${BASE}card-images/eldritch/`;
const LAYERS_DIR = `${ELDRITCH_DIR}layers/`;
const ARCANA_DIR = `${BASE}card-images/arcana/`;
const ARCANA_LAYERS_DIR = `${ARCANA_DIR}layers/`;
/** Cache-bust compositas dopo ogni bake (partita / tile statiche). */
const COMPOSITA_CACHE = '20260922guardiano1';
const ARCANA_COMPOSITA_CACHE = '20260924arcana8';

/** Fascia alta soggetto sopra il nome — base Berserker della Spira. */
export const ELDRITCH_NAME_UNDER_SUBJECT_CLIP = 'polygon(0 0, 100% 0, 100% 29%, 0 29%)';

/**
 * Kit Eldritch da cartella `public/card-images/eldritch/layers/<slug>/`.
 * File attesi: soggetto.webp, sfondo.webp; opz. cornice.webp, composita.webp, card.json.
 * Nome sempre sotto il soggetto (breakHeadAbove), come Berserker della Spira.
 */
export function layeredKitFromFolder(id, slug, label, faction, composition = {}, extras = {}) {
  const base = `${LAYERS_DIR}${slug}/`;
  // null esplicito = niente overflow (tutto in cornice). Solo undefined → default Berserker.
  const headClipExplicit = Object.prototype.hasOwnProperty.call(composition, 'breakHeadClip');
  const headAboveExplicit = Object.prototype.hasOwnProperty.call(composition, 'breakHeadAbove');
  const headClipOff = headClipExplicit && composition.breakHeadClip == null;
  const compositionNormalized = {
    ...composition,
    breakHeadClip: headClipExplicit
      ? composition.breakHeadClip
      : ELDRITCH_NAME_UNDER_SUBJECT_CLIP,
    // Rispetta breakHeadAbove esplicito (es. spalla SX sotto ink). Default: sopra nome se c'è clip.
    breakHeadAbove: headAboveExplicit
      ? composition.breakHeadAbove
      : headClipOff
        ? false
        : true,
  };
  return {
    id,
    slug,
    label,
    faction,
    style: 'eldritch',
    subject: `${base}soggetto.webp`,
    background: `${base}sfondo.webp`,
    ...(extras.frame !== false ? { frame: extras.frame || `${base}cornice.webp` } : {}),
    ...(extras.composite === false
      ? {}
      : {
          composite:
            extras.composite || `${base}composita.webp?v=${COMPOSITA_CACHE}`,
        }),
    ...(extras.displayName ? { displayName: extras.displayName } : {}),
    ...(extras.layout ? { layout: extras.layout } : {}),
    composition: compositionNormalized,
  };
}

/**
 * Kit Arcana da cartella `public/card-images/arcana/layers/<slug>/`.
 * Stesso formato 23:33 degli Eldritch; ordine: sfondo → vetro → soggetto → cartigli → layout.
 */
export function arcanaKitFromFolder(id, slug, label, faction, extras = {}) {
  const base = `${ARCANA_LAYERS_DIR}${slug}/`;
  const parallax = extras.parallax || {
    subjectX: 0.45,
    subjectY: 0.27,
    backgroundX: -0.55,
    backgroundY: -0.36,
    tiltX: 3,
    tiltY: 4,
  };
  return {
    id,
    slug,
    label,
    faction,
    style: 'arcana',
    subject: `${base}soggetto.webp`,
    background: `${base}sfondo.webp`,
    backgroundFramed: `${base}sfondo-inquadrato.webp`,
    frame: `${base}cornice.webp`,
    layoutRaster: `${base}layout.webp`,
    composite: `${base}composita.webp?v=${ARCANA_COMPOSITA_CACHE}`,
    parallax,
    ...(extras.displayName ? { displayName: extras.displayName } : {}),
    ...(extras.textLayout ? { textLayout: extras.textLayout } : {}),
    ...(extras.textColors ? { textColors: extras.textColors } : {}),
    composition: {
      subjectScale: 1,
      subjectXPercent: 0,
      subjectYPercent: 0,
      backgroundScale: 1,
      backgroundYPercent: 0,
      breakHeadClip: null,
      breakHeadAbove: false,
      breakShoulderClip: null,
      subjectAboveFrame: true,
      popLabel: 'Soggetto sopra il vetro (sotto cartigli)',
      ...(extras.composition || {}),
    },
  };
}

/** Forme alternative ufficiali a livelli (parallasse). Una voce = una cartella. */
export const LAYERED_CARD_KITS = {
  108: arcanaKitFromFolder(
    108,
    'leggero-richiamato',
    'Leggero Richiamato',
    "Figli dell'Orizzonte",
    {
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      composition: {
        subjectScale: 1.15,
        subjectXPercent: -1,
        subjectYPercent: 4.5,
        backgroundScale: 1,
        backgroundYPercent: 0,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  220: arcanaKitFromFolder(
    220,
    'mezzanotte',
    'Mezzanotte, il Mai Nato',
    'Kethran',
    {
      displayName: 'Mezzanotte, il Mai Nato',
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      composition: {
        subjectScale: 1.11,
        subjectXPercent: 0,
        subjectYPercent: 0,
        backgroundScale: 1,
        backgroundYPercent: 0,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  428: arcanaKitFromFolder(
    428,
    'bombardiere-ali-argentee',
    'Bombardiere Ali Argentee',
    'Calibri Pesanti',
    {
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      composition: {
        subjectScale: 1.25,
        subjectXPercent: 0,
        subjectYPercent: 4.5,
        backgroundScale: 1,
        backgroundYPercent: 0,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  327: arcanaKitFromFolder(
    327,
    'intrattenitore-di-corte',
    'Intrattenitore di Corte',
    'Corte Rossa',
    {
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      composition: {
        subjectScale: 1.2,
        subjectXPercent: 2.5,
        subjectYPercent: -10,
        backgroundScale: 1,
        backgroundYPercent: 0,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  525: arcanaKitFromFolder(
    525,
    'protettore-dei-protettori',
    'Protettore dei Protettori',
    'Orathai',
    {
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  717: arcanaKitFromFolder(
    717,
    'dracoltoio',
    'Dracoltoio',
    "L'Enclave delle Scaglie",
    {
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      composition: {
        subjectScale: 1.21,
        subjectXPercent: 0,
        subjectYPercent: -3,
        backgroundScale: 1,
        backgroundYPercent: 0,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  625: arcanaKitFromFolder(
    625,
    'matriarca-gentile',
    'Matriarca Gentile',
    'Mounthborn',
    {
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      composition: {
        subjectScale: 1.1,
        subjectXPercent: -2.5,
        subjectYPercent: -8.5,
        backgroundScale: 1,
        backgroundYPercent: 0,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  1023: arcanaKitFromFolder(
    1023,
    'hekwa-sew',
    'Hekwa-sew, lo scultore osseo',
    'Khemet',
    {
      displayName: 'Hekwa-sew, lo scultore osseo',
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  923: arcanaKitFromFolder(
    923,
    'artista-dell-ultrastrada',
    "Artista dell'Ultrastrada",
    'Patto degli Indocili',
    {
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  803: arcanaKitFromFolder(
    803,
    'strega-del-crepuscolo',
    'Strega del Crepuscolo',
    'Ratti della Megera',
    {
      parallax: {
        subjectX: 0.45,
        subjectY: 0.27,
        backgroundX: -0.55,
        backgroundY: -0.36,
        tiltX: 3,
        tiltY: 4,
      },
      textColors: { ink: '#080704', leagueInk: '#fff1ce' },
    }
  ),
  101: layeredKitFromFolder(101, 'sorethai', 'Sorethai', "Figli dell'Orizzonte", {
    subjectScale: 1.045,
    subjectYPercent: 16,
    backgroundScale: 1.07,
    backgroundYPercent: 12,
    // Solo casco/cresta DX sopra nome — non le ciocche verso DANNO (restano sotto ink in finestra).
    breakHeadClip: 'polygon(66% 0, 100% 0, 100% 44%, 66% 44%)',
    breakHeadMask:
      'linear-gradient(to bottom, transparent 8%, #000 18%, #000 34%, transparent 44%)',
    breakShoulderClip: 'polygon(0 32%, 24% 32%, 24% 66%, 0 66%)',
    breakShoulderMask:
      'linear-gradient(to bottom, transparent 32%, #000 44%, #000 56%, transparent 66%)',
    // Sopra macchie: a sinistra l'ink del testo abilità copre il bordo cornice.
    breakShoulderAbove: 'ink',
    popLabel: 'Magia e mano sopra la cornice',
  }),
  103: layeredKitFromFolder(
    103,
    'portatore-della-domanda',
    'Portatore della Domanda',
    "Figli dell'Orizzonte",
    {
      subjectScale: 0.96,
      subjectYPercent: 8,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Testa + rune sopra il nome; mani sopra cornice sotto testi.
      breakHeadClip: 'polygon(24% 0, 76% 0, 74% 24%, 26% 24%)',
      breakHeadMask:
        'linear-gradient(to bottom, #000 0%, #000 17%, transparent 24%)',
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 10%, 40% 10%, 40% 64%, 0 64%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: 'polygon(58% 28%, 100% 28%, 100% 85%, 58% 85%)',
      breakRightMask: undefined,
      breakRightAbove: false,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Testa/rune sopra nome; mani sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  104: layeredKitFromFolder(
    104,
    'cartografo-del-vuoto',
    'Cartografo del Vuoto',
    "Figli dell'Orizzonte",
    {
      subjectScale: 1.04,
      subjectYPercent: 14,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Nebula-testa sopra titolo/macchia; mano sinistra sopra cornice sotto testi.
      breakHeadClip: 'polygon(30% 1%, 70% 1%, 68% 27%, 32% 27%)',
      breakHeadMask:
        'linear-gradient(to bottom, #000 0%, #000 20%, transparent 27%)',
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 18%, 40% 18%, 40% 52%, 0 52%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Testa sopra titolo; mano sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  115: layeredKitFromFolder(
    115,
    'vethan',
    'Vethan',
    "Figli dell'Orizzonte",
    {
      subjectScale: 0.96,
      subjectYPercent: 1,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Lama/asta SX + mano in primo piano sopra cornice, sotto testi.
      breakHeadClip: 'polygon(0 0, 80% 0, 45% 66%, 0 77%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 55%, 36% 55%, 36% 76%, 0 82%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Falce e mano sopra la cornice',
    },
    {
      displayName: 'Vethan, Guerriero per un Giorno',
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  206: layeredKitFromFolder(
    206,
    'berserker-della-spira',
    'Berserker della Spira',
    'Kethran',
    {
      subjectScale: 1.03,
      subjectYPercent: -3,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Pugni sopra nome; avambracci sopra cornice sotto testi (anteprima kit).
      breakHeadClip: 'polygon(0 0, 100% 0, 100% 29%, 0 29%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 29%, 100% 29%, 100% 58%, 0 58%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Pugni sopra nome; braccia sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  211: layeredKitFromFolder(
    211,
    'nimrod',
    'Nimrod',
    'Kethran',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 4,
      nameInkUnderSubject: true,
      inkAboveSubject: true,
      // Scettro è a SINISTRA + corona in alto: banda intera sopra cornice/macchia nome.
      breakHeadClip: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
      breakHeadMask:
        'linear-gradient(to bottom, #000 0%, #000 30%, transparent 50%)',
      breakHeadAbove: true,
      // Mantello DX sopra cornice, sotto macchie stats.
      breakShoulderClip: 'polygon(78% 22%, 100% 22%, 100% 92%, 78% 92%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Corona e scettro SX sopra cornice/nome',
    },
    {
      displayName: 'Nimrod, il Primo Re',
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  226: layeredKitFromFolder(
    226,
    'centauro-rivoltante',
    'Centauro Rivoltante',
    'Kethran',
    {
      subjectScale: 1,
      subjectYPercent: 1,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Testa/criniera sopra nome; artiglio/zoccolo SX sopra cornice sotto testi.
      breakHeadClip: 'polygon(25% 0, 84% 0, 84% 34%, 25% 34%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 0, 33% 0, 33% 88%, 0 88%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Testa sopra nome; artiglio sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  221: layeredKitFromFolder(
    221,
    'glauson',
    'Glauson',
    'Kethran',
    {
      subjectScale: 1.045,
      subjectYPercent: 9,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      breakHeadClip: 'polygon(0 0, 35% 0, 35% 50%, 0 50%)',
      breakHeadMask: 'linear-gradient(to right, #000 0%, #000 29%, transparent 35%)',
      breakShoulderClip: 'polygon(0 42%, 22% 42%, 22% 68%, 0 68%)',
      breakShoulderMask:
        'linear-gradient(to bottom, transparent 42%, #000 48%, #000 61%, transparent 68%)',
      popLabel: 'Martello e scalpello sopra la cornice',
    },
    {
      displayName: 'Glauson, il Secondo Architetto',
      layout: {
        damageLabel: { x: 794, y: 1340 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  301: layeredKitFromFolder(
    301,
    'vaelith-sorn',
    'Vaelith Sorn',
    'Corte Rossa',
    {
      subjectScale: 1,
      subjectYPercent: 8,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Corna sopra nome; artigli SX sopra cornice sotto testi.
      breakHeadClip: 'polygon(29% 0, 85% 0, 85% 19%, 29% 19%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 39%, 31% 39%, 31% 65%, 0 65%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Corna sopra nome; artigli sopra cornice',
    },
    {
      displayName: 'Vaelith Sorn, il Primo',
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  302: layeredKitFromFolder(
    302,
    'estrattrice',
    "L'Estrattrice",
    'Corte Rossa',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Corna sopra nome; manica SX DENTRO cornice (niente overflow spalla).
      breakHeadClip: 'polygon(24% 0, 79% 0, 79% 25%, 24% 25%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: null,
      breakShoulderMask: null,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Corna sopra nome; manica in cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  315: layeredKitFromFolder(
    315,
    'larva-della-corte',
    'Larva della Corte',
    'Corte Rossa',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Corna + artiglio SX sopra cornice, sotto testi.
      breakHeadClip: 'polygon(16% 0, 83% 0, 83% 25%, 16% 25%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 34%, 48% 34%, 48% 66%, 0 66%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Corna e artiglio sopra la cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  323: layeredKitFromFolder(
    323,
    'phimesto',
    'Phimesto',
    'Corte Rossa',
    {
      subjectScale: 1.025,
      subjectYPercent: 4,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      breakHeadClip: 'polygon(0 0, 46% 0, 46% 64%, 0 64%)',
      breakHeadMask: 'linear-gradient(to bottom, #000 0%, #000 57%, transparent 64%)',
      breakShoulderClip: 'polygon(83% 12%, 100% 12%, 100% 31%, 83% 31%)',
      breakShoulderMask:
        'linear-gradient(to bottom, transparent 12%, #000 17%, #000 25%, transparent 31%)',
      breaksAboveLayout: true,
      popLabel: 'Carte, testa e corno sopra cornice e fazione',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1340 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  402: layeredKitFromFolder(
    402,
    'nucleo-comando-nord',
    'Nucleo Comando Nord',
    'Calibri Pesanti',
    {
      subjectScale: 1.025,
      subjectYPercent: 5,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Niente overflow sopra nome: la spalla SX deve stare SOTTO l'ink OVERDRIVE.
      breakHeadClip: null,
      breakHeadAbove: false,
      // Spalla SX sopra cornice, sotto macchie abilità.
      breakShoulderClip: 'polygon(0 34%, 35% 34%, 35% 83%, 0 83%)',
      breakShoulderMask:
        'linear-gradient(to bottom, transparent 34%, #000 44%, #000 73%, transparent 83%)',
      breakShoulderAbove: false,
      // Spalla DX sopra cornice, sotto macchie.
      breakRightClip: 'polygon(80% 46%, 100% 46%, 100% 88%, 80% 88%)',
      breakRightMask:
        'linear-gradient(to bottom, transparent 46%, #000 56%, #000 78%, transparent 88%)',
      breakRightAbove: false,
      popLabel: 'Spalle sopra la cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1340 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  405: layeredKitFromFolder(
    405,
    'guardiano-di-settore',
    'Guardiano di Settore',
    'Calibri Pesanti',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 1,
      nameInkUnderSubject: true,
      // Pistola e piede sopra cornice.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Pistola e piede sopra la cornice',
    },
    {
      layout: {
        abilityTitle: { x: 790, y: 950, w: 220, fontSize: 74 },
        abilityText: { x: 785, y: 1060, w: 220, fontSize: 48 },
        name: { x: 60, y: 45, w: 785, h: 95, fontSize: 71 },
        faction: { x: 70, y: 760, w: 415, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
        bonusTitle: { x: 245, y: 1225, w: 490, h: 115, fontSize: 72 },
        bonusText: { x: 260, y: 1345, w: 230, fontSize: 55 },
      },
    }
  ),
  407: layeredKitFromFolder(
    407,
    'drone-cacciatore-x9',
    'Drone Cacciatore X-9',
    'Calibri Pesanti',
    {
      subjectScale: 1,
      // Cappa DX finisce ~5.8% dal bordo: sposta a DX così il taglio resta sulla cornice.
      subjectXPercent: 2.8,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Testa + canna sopra nome/testi (prima solo canna dal 23% → testa restava sotto il banner).
      breakHeadClip: 'polygon(0 0, 100% 0, 100% 28%, 54% 28%, 54% 46%, 0 46%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      // Overflow pieno sopra cornice (sotto macchie).
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Testa/canna sopra nome; lato DX sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  419: layeredKitFromFolder(
    419,
    'k-9-1',
    'K-9.1',
    'Calibri Pesanti',
    {
      subjectScale: 1.04,
      subjectXPercent: -3,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Dorso sopra cornice top, sotto titolo/macchia nome.
      breakHeadClip: 'polygon(18% 0, 82% 0, 82% 20%, 18% 20%)',
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'polygon(0 37%, 42% 37%, 42% 94%, 0 94%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Dorso sotto titolo; zampa sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  430: layeredKitFromFolder(
    430,
    'obice-campione',
    'Obice Campione',
    'Calibri Pesanti',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Laser + aureola sopra nome, macchia e cornice.
      breakHeadClip: 'polygon(0 0, 92% 0, 88% 18%, 72% 36%, 48% 52%, 0 56%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      // Struttura DX in cornice (niente overflow sul bordo destro).
      breakShoulderClip: null,
      breakShoulderMask: null,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Laser sopra nome; struttura DX in cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  501: layeredKitFromFolder(
    501,
    'voce-della-fine',
    'Voce della Fine',
    'Orathai',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Mani sopra cornice/nome/testi (z6 anteprima); avambracci sopra cornice sotto layout.
      breakHeadClip:
        'polygon(0 0, 30% 0, 30% 40%, 70% 40%, 70% 14%, 100% 14%, 100% 43%, 0 43%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 40%, 100% 40%, 100% 68%, 0 68%)',
      breakShoulderMask:
        'linear-gradient(to bottom, #000 0%, #000 55%, transparent 66%)',
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Mani sopra cornice e testi',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  520: layeredKitFromFolder(
    520,
    'il-soffocatore-silente',
    'Il Soffocatore Silente',
    'Orathai',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Testa sopra macchia nome; dito sopra macchia potenza; corpo sopra cornice.
      breakHeadClip: 'ellipse(11% 14% at 67% 15%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakExtraClip: 'polygon(0 61%, 11% 61%, 11% 90%, 0 90%)',
      breakExtraMask: undefined,
      breakExtraAbove: true,
      breakRightClip: null,
      breaksAboveLayout: false,
      popLabel: 'Testa e dito sopra layout; braccio sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  524: layeredKitFromFolder(
    524,
    'sylwajuck',
    'Sylwajuck',
    'Orathai',
    {
      subjectScale: 1.025,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      breakHeadClip: 'polygon(0 0, 100% 0, 100% 36%, 0 36%)',
      breakHeadMask: 'linear-gradient(to bottom, #000 0%, #000 28%, transparent 36%)',
      breakShoulderClip: 'polygon(60% 44%, 100% 44%, 100% 89%, 60% 89%)',
      breakShoulderMask:
        'linear-gradient(to bottom, transparent 44%, #000 49%, #000 83%, transparent 89%)',
      popLabel: 'Corna e artiglio sopra la cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1340 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  526: layeredKitFromFolder(
    526,
    'regalita-baritonale',
    'Regalità Baritonale',
    'Orathai',
    {
      subjectScale: 1,
      subjectYPercent: 6,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Mano protesa sopra layout; cappello sopra cornice top.
      breakHeadClip: 'polygon(0 15%, 50% 15%, 50% 53%, 0 53%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 0, 100% 0, 100% 25%, 0 25%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Mano sopra layout; cappello sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  604: layeredKitFromFolder(
    604,
    'l-apripista',
    "L'Apripista",
    'Mounthborn',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Spalla/artigli SX sopra layout; corpo sopra cornice.
      breakHeadClip: 'polygon(0 16%, 45% 16%, 45% 45%, 0 45%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Spalla sopra layout; corpo sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  611: layeredKitFromFolder(
    611,
    'evoluzione-finale',
    'Evoluzione Finale',
    'Mounthborn',
    {
      subjectScale: 1.025,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      breakHeadClip:
        'polygon(0 0, 100% 0, 100% 30%, 65% 30%, 56% 23%, 56% 0, 44% 0, 44% 23%, 35% 30%, 0 30%)',
      breakShoulderClip: 'polygon(0 34%, 37% 34%, 37% 79%, 0 79%)',
      breakShoulderMask:
        'linear-gradient(to bottom, transparent 34%, #000 44%, #000 75%, transparent 79%)',
      breakRightClip: 'polygon(78% 32%, 100% 32%, 100% 58%, 78% 58%)',
      breakRightMask:
        'linear-gradient(to bottom, transparent 32%, #000 38%, #000 56%, transparent 58%)',
      breaksAboveLayout: true,
      popLabel: 'Corna, mano e artiglio sopra cornice e testi',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1340 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  615: layeredKitFromFolder(
    615,
    'zanzara-furiosa',
    'Zanzara Furiosa',
    'Mounthborn',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Intero soggetto sopra cornice e nome (ali uscite; niente tagli lato SX).
      breakHeadClip: 'inset(0)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: null,
      breakShoulderMask: null,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Soggetto intero sopra cornice e nome',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  618: layeredKitFromFolder(
    618,
    'il-flagello-chitinoso',
    'Il Flagello Chitinoso',
    'Mounthborn',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Coda sopra layout; soggetto intero sopra cornice (chele ai bordi).
      breakHeadClip: 'polygon(0 0, 76% 0, 76% 31%, 0 31%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Coda sopra layout; chele sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  910: layeredKitFromFolder(
    910,
    'cyber-may-punk',
    'Cyber May Punk',
    'Patto degli Indocili',
    {
      subjectScale: 1.025,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      popLabel: 'Testa e spalla sopra la cornice',
    },
    { frame: false }
  ),
  929: layeredKitFromFolder(
    929,
    'king',
    'King',
    'Patto degli Indocili',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 11,
      // Macchia nome sotto il soggetto (break testa sopra la macchia, dentro cornice).
      nameInkUnderSubject: true,
      breakHeadClip: 'inset(3.3% 4.5% 52% 4.5% round 4.8%)',
      breakHeadMask:
        'linear-gradient(to bottom, #000 0%, #000 38%, transparent 52%)',
      breakHeadAbove: false,
      // Solo headstock fuori cornice.
      breakShoulderClip:
        'polygon(78% 16%, 100% 12%, 100% 40%, 86% 46%, 76% 32%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Solo chitarra sopra la cornice',
    },
    {
      layout: {
        abilityTitle: { x: 740, y: 955, w: 265, fontSize: 52 },
        abilityText: { x: 750, y: 1060, w: 245, fontSize: 46 },
        name: { x: 80, y: 65, w: 740, h: 110, fontSize: 100 },
        faction: { x: 70, y: 755, w: 455, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  916: layeredKitFromFolder(
    916,
    'regolatore-di-debiti',
    'Regolatore di Debiti',
    'Patto degli Indocili',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 2,
      nameInkUnderSubject: true,
      // Casco/mazza sopra macchia nome e cornice.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Mazza sopra la cornice',
    },
    {
      layout: {
        abilityTitle: { x: 740, y: 955, w: 265, fontSize: 46 },
        abilityText: { x: 750, y: 1060, w: 245, fontSize: 46 },
        name: { x: 65, y: 65, w: 350, h: 125, fontSize: 48 },
        faction: { x: 500, y: 755, w: 455, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 35, y: 1176, w: 135, fontSize: 38 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
        power: { x: 40, y: 956, w: 125, fontSize: 210 },
      },
    }
  ),
  705: layeredKitFromFolder(
    705,
    'predatore-alato',
    'Predatore Alato',
    "L'Enclave delle Scaglie",
    {
      subjectScale: 1.025,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Solo testa/corna sopra titolo+macchia. Ali escluse → restano in finestra sotto il titolo.
      breakHeadClip: 'polygon(44% 8%, 78% 6%, 82% 40%, 46% 42%)',
      breakHeadMask:
        'linear-gradient(to bottom, #000 0%, #000 30%, transparent 42%)',
      breakHeadAbove: true,
      // Niente overflow ali → chiuse alla cornice, sotto il titolo.
      breakShoulderClip: null,
      breakShoulderMask: null,
      breakShoulderAbove: false,
      // Coda (e artigli posteriori) fuori carta sopra la cornice, sotto i testi effetti.
      breakRightClip: 'polygon(26% 74%, 72% 74%, 70% 100%, 24% 100%)',
      breakRightMask:
        'linear-gradient(to bottom, transparent 74%, #000 78%, #000 100%)',
      breakRightAbove: false,
      breakExtraClip: null,
      breakExtraMask: null,
      breakExtraAbove: false,
      breaksAboveLayout: false,
      popLabel: 'Testa sopra titolo; ali sotto titolo; coda sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  711: layeredKitFromFolder(
    711,
    'drago-antico-addormentato',
    'Drago Antico Addormentato',
    "L'Enclave delle Scaglie",
    {
      subjectScale: 1.025,
      subjectXPercent: 0,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Tutto dentro cornice: niente overflow.
      breakHeadClip: null,
      breakHeadMask: null,
      breakHeadAbove: true,
      breakShoulderClip: null,
      breakShoulderMask: null,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Soggetto in cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  721: layeredKitFromFolder(
    721,
    're-carbone',
    'Re Carbone',
    "L'Enclave delle Scaglie",
    {
      subjectScale: 1.025,
      subjectXPercent: 0,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Corona/cranio sopra nome (prima solo spada DX → testa sotto banner).
      breakHeadClip: 'polygon(12% 0, 88% 0, 88% 30%, 12% 30%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 18%, 100% 18%, 100% 66%, 0 66%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: 'polygon(79% 37%, 100% 37%, 100% 51%, 79% 51%)',
      breakRightMask: undefined,
      breakRightAbove: true,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Corona sopra nome; spada sopra fascia; corpo sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  726: layeredKitFromFolder(
    726,
    'giallotuono',
    'Giallotuono',
    "L'Enclave delle Scaglie",
    {
      subjectScale: 1.025,
      subjectXPercent: 0,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Testa sopra nome (prima solo torso mid → testa sotto banner).
      breakHeadClip: 'polygon(18% 0, 92% 0, 92% 32%, 18% 32%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      // Artigli/fulmini sopra cornice; fondo resta in finestra.
      breakShoulderClip: 'polygon(0 28%, 100% 28%, 100% 76%, 0 76%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      // Coda SX sopra cornice, SOTTO macchie Potenza.
      breakExtraClip: 'polygon(0 52%, 36% 52%, 36% 86%, 0 86%)',
      breakExtraMask: undefined,
      breakExtraAbove: false,
      breakRightClip: 'polygon(55% 44%, 73% 44%, 73% 57%, 55% 57%)',
      breakRightMask: undefined,
      breakRightAbove: true,
      breaksAboveLayout: false,
      popLabel: 'Testa sopra nome; coda sopra cornice sotto macchie Potenza',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  807: layeredKitFromFolder(
    807,
    'spia-della-megera',
    'Spia della Megera',
    'Ratti della Megera',
    {
      subjectScale: 1.07,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Banda media sopra cornice (sotto macchie), come Anteprima kit.
      breakHeadClip: 'polygon(0 49%, 100% 49%, 100% 77%, 0 77%)',
      breakHeadMask: undefined,
      breakHeadAbove: false,
      // Dita ossute SX sopra cornice e layout.
      breakShoulderClip: 'polygon(0 49%, 7% 49%, 7% 74%, 0 74%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: true,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Dita ossute sopra la cornice',
    },
    {
      layout: {
        abilityTitle: { x: 740, y: 955, w: 265, fontSize: 52 },
        abilityText: { x: 750, y: 1060, w: 245, fontSize: 46 },
        name: { x: 80, y: 65, w: 740, h: 110, fontSize: 100 },
        faction: { x: 70, y: 755, w: 455, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  815: layeredKitFromFolder(
    815,
    'il-gondoliere',
    'Il Gondoliere',
    'Ratti della Megera',
    {
      subjectScale: 1.025,
      subjectXPercent: 0,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Testa/corona sopra nome (prima solo tip stretta).
      breakHeadClip: 'polygon(40% 0, 88% 0, 88% 26%, 40% 26%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      // Gondola + bastone + corpo sopra cornice.
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakExtraClip: null,
      breakRightClip: null,
      breaksAboveLayout: false,
      popLabel: 'Testa sopra nome; gondola/bastone sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  826: layeredKitFromFolder(
    826,
    'principessa-di-birgherund',
    'Principessa di Birgherund',
    'Ratti della Megera',
    {
      subjectScale: 1.025,
      subjectXPercent: -2.5,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Corona/testa sopra nome (prima solo tip 4.5%).
      breakHeadClip: 'polygon(18% 0, 78% 0, 78% 24%, 18% 24%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      // Mano SX (guanto sulla balaustra) sopra cornice — senza ruches abito.
      breakShoulderClip: 'polygon(0 46%, 28% 46%, 28% 66%, 0 66%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakRightMask: null,
      breakRightAbove: false,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Testa sopra nome; mano sopra cornice; abito in cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  830: layeredKitFromFolder(
    830,
    'quarto-marito',
    'Il Quarto Marito',
    'Ratti della Megera',
    {
      subjectScale: 1.0,
      subjectYPercent: 2,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Nessun overflow: braccio e resto restano in cornice (sotto nome/lega).
      breakHeadClip: null,
      breakHeadMask: null,
      breakShoulderClip: null,
      breakShoulderMask: null,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Tutto in cornice; niente braccio fuori',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  1001: layeredKitFromFolder(
    1001,
    'xer-thael',
    'Xer-Thael',
    'Khemet',
    {
      subjectScale: 1.07,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 4,
      // Scale 1.07 spinge il break in alto: escludere ~8% evita bleed sulla cornice ciano.
      breakHeadClip: 'polygon(0 8%, 100% 8%, 100% 100%, 0 100%)',
      breakHeadMask: undefined,
      breakHeadAbove: false,
      // Mano SX protesa sopra cornice laterale (ok sul bordo, non sul top).
      breakShoulderClip: 'polygon(0 23%, 10% 23%, 10% 49%, 0 49%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: true,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Mano e cerchi sopra la cornice',
    },
    {
      displayName: "Xer-Thael, Architetto dell'anima",
      layout: {
        abilityTitle: { x: 740, y: 955, w: 265, fontSize: 52 },
        abilityText: { x: 750, y: 1060, w: 245, fontSize: 46 },
        name: { x: 80, y: 65, w: 740, h: 110, fontSize: 100 },
        faction: { x: 70, y: 755, w: 455, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  1013: layeredKitFromFolder(
    1013,
    'mala-kor',
    'Mala-Kor',
    'Khemet',
    {
      subjectScale: 0.95,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Overflow sotto testi; niente bleed sul bordo ciano superiore.
      breakHeadClip: 'polygon(0 8%, 100% 8%, 100% 100%, 0 100%)',
      breakHeadMask: undefined,
      breakHeadAbove: false,
      // Mano demoniaca SX sopra cornice laterale.
      breakShoulderClip: 'polygon(0 34%, 8% 34%, 8% 77%, 0 77%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: true,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Mano demoniaca sopra la cornice',
    },
    {
      displayName: "Mala-Kor, il Campione dell'Esterno",
      layout: {
        abilityTitle: { x: 740, y: 955, w: 265, fontSize: 52 },
        abilityText: { x: 750, y: 1060, w: 245, fontSize: 46 },
        name: { x: 80, y: 65, w: 740, h: 110, fontSize: 100 },
        faction: { x: 70, y: 755, w: 455, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  1004: layeredKitFromFolder(
    1004,
    'vel-khar',
    'Vel-Khar',
    'Khemet',
    {
      subjectScale: 1.025,
      subjectYPercent: 4,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      breakHeadClip: 'polygon(0 22%, 58% 22%, 58% 61%, 0 61%)',
      breakHeadMask:
        'linear-gradient(to bottom, transparent 22%, #000 30%, #000 52%, transparent 61%)',
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(66% 0, 100% 0, 100% 37%, 66% 37%)',
      breakShoulderMask: 'linear-gradient(to bottom, #000 0%, #000 28%, transparent 37%)',
      breakShoulderAbove: true,
      breaksAboveLayout: false,
      popLabel: 'Mano e mantello sopra cornice/testi',
    },
    {
      displayName: 'Vel-Khar, il sigillatore',
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  1020: layeredKitFromFolder(
    1020,
    'ekon-det',
    'Ekon-Det',
    'Khemet',
    {
      subjectScale: 1.025,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 1,
      nameInkUnderSubject: true,
      // Cappuccio sopra macchia nome; lembi veste sopra cornice.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Cappuccio e lembi sopra la cornice',
    },
    {
      displayName: 'Ekon-Det, emissario delle piume',
      layout: {
        abilityTitle: { x: 740, y: 955, w: 265, fontSize: 52 },
        abilityText: { x: 750, y: 1060, w: 245, fontSize: 46 },
        name: { x: 80, y: 65, w: 740, h: 110, fontSize: 100 },
        faction: { x: 70, y: 755, w: 455, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  1122: layeredKitFromFolder(
    1122,
    'terrore-cremisi',
    'Terrore Cremisi',
    'Apex',
    {
      subjectScale: 0.9,
      subjectYPercent: 7.5,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Testa sopra nome; spada/mano sopra cornice sotto testi.
      breakHeadClip: 'polygon(22% 0, 82% 0, 82% 30%, 22% 30%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(42% 65%, 100% 65%, 100% 100%, 42% 100%)',
      breakShoulderMask:
        'linear-gradient(to bottom, transparent 65%, #000 72%, #000 100%)',
      breakShoulderAbove: false,
      breakRightClip: 'polygon(84% 22%, 100% 22%, 100% 49%, 84% 49%)',
      breakRightMask:
        'linear-gradient(to bottom, transparent 22%, #000 28%, #000 44%, transparent 49%)',
      breakRightAbove: false,
      breaksAboveLayout: false,
      popLabel: 'Testa sopra nome; spada e mano sopra cornice',
    },
    {
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  1106: layeredKitFromFolder(
    1106,
    'zanna-corta',
    'Zanna Corta',
    'Apex',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 1,
      nameInkUnderSubject: true,
      // Scimmione + lancia sopra macchia nome e cornice.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Lancia sopra la cornice',
    },
    {
      displayName: "Zanna Corta, l'abile lanciere",
      layout: {
        abilityTitle: { x: 430, y: 955, w: 265, fontSize: 65 },
        abilityText: { x: 450, y: 1060, w: 200, fontSize: 45 },
        name: { x: 290, y: 65, w: 505, h: 150, fontSize: 84 },
        nameSubtitle: { x: 325, y: 158, w: 410, h: 65, fontSize: 40 },
        faction: { x: 70, y: 755, w: 455, h: 65, fontSize: 37 },
        damageLabel: { x: 725, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 730, y: 1120 },
      },
    }
  ),
  1108: layeredKitFromFolder(
    1108,
    'capobranco-per-un-giorno',
    'Capobranco per un Giorno',
    'Apex',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 1,
      nameInkUnderSubject: true,
      // Scimmione, spada e cranio sopra macchia nome e cornice.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Spada e cranio sopra la cornice',
    },
    {
      layout: {
        abilityTitle: { x: 740, y: 955, w: 265, fontSize: 62 },
        abilityText: { x: 750, y: 1060, w: 245, fontSize: 46 },
        name: { x: 65, y: 55, w: 390, h: 190, fontSize: 62 },
        faction: { x: 70, y: 755, w: 455, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  1127: layeredKitFromFolder(
    1127,
    'domatore-dei-taglia-gole',
    'Domatore dei taglia-gole',
    'Apex',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 4,
      nameInkUnderSubject: true,
      // Spada, scimmione e tigre sopra macchia nome e cornice.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Branco e spada sopra la cornice',
    },
    {
      layout: {
        abilityTitle: { x: 740, y: 1010, w: 265, fontSize: 56 },
        abilityText: { x: 750, y: 1115, w: 245, fontSize: 46 },
        name: { x: 70, y: 65, w: 710, h: 110, fontSize: 58 },
        faction: { x: 240, y: 755, w: 330, h: 65, fontSize: 37 },
        // Potenza/danno: default Eldritch (non il layout atelier centrato).
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
        bonusTitle: { x: 345, y: 1225, w: 390, h: 122, fontSize: 85 },
        bonusText: { x: 355, y: 1345, w: 360, fontSize: 55 },
      },
    }
  ),
  1205: layeredKitFromFolder(
    1205,
    'castillo-tornillo',
    'Castillo',
    'Mascarada',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 1,
      nameInkUnderSubject: true,
      // Piede e aura sopra cornice.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Piede e aura sopra la cornice',
    },
    {
      displayName: 'Castillo, "Tornillo"',
      layout: {
        abilityTitle: { x: 790, y: 950, w: 220, fontSize: 74 },
        abilityText: { x: 790, y: 1060, w: 220, fontSize: 54 },
        name: { x: 65, y: 55, w: 360, h: 100, fontSize: 76 },
        nameSubtitle: { x: 80, y: 153, w: 310, h: 70, fontSize: 45 },
        faction: { x: 75, y: 795, w: 360, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
        bonusTitle: { x: 230, y: 1225, w: 540, h: 120, fontSize: 80 },
        bonusText: { x: 260, y: 1345, w: 230, fontSize: 55 },
      },
    }
  ),
  1207: layeredKitFromFolder(
    1207,
    'blackwing-headbutt',
    'Blackwing',
    'Mascarada',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 1,
      nameInkUnderSubject: true,
      // Collare e aura sopra cornice.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Collare e aura sopra la cornice',
    },
    {
      displayName: 'Blackwing, "Headbutt"',
      layout: {
        abilityTitle: { x: 790, y: 925, w: 210, fontSize: 56 },
        abilityText: { x: 810, y: 1090, w: 195, fontSize: 54 },
        name: { x: 65, y: 55, w: 475, h: 100, fontSize: 74 },
        nameSubtitle: { x: 90, y: 153, w: 350, h: 70, fontSize: 45 },
        faction: { x: 75, y: 800, w: 380, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
        bonusTitle: { x: 230, y: 1225, w: 540, h: 120, fontSize: 80 },
        bonusText: { x: 260, y: 1345, w: 230, fontSize: 55 },
      },
    }
  ),
  1215: layeredKitFromFolder(
    1215,
    'filomena',
    'Filomena',
    'Mascarada',
    {
      subjectScale: 1.025,
      subjectYPercent: 4,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Testa sopra nome; mano SX + pinne DX sopra cornice.
      breakHeadClip: 'polygon(22% 0, 82% 0, 82% 28%, 22% 28%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(0 20%, 32% 20%, 32% 57%, 0 57%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: 'polygon(84% 0, 100% 0, 100% 70%, 84% 70%)',
      breakRightMask: undefined,
      breakRightAbove: false,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Testa sopra nome; mano e pinne sopra cornice',
    },
    {
      displayName: 'Filomena, "Death Springboard"',
      layout: {
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
      },
    }
  ),
  1222: layeredKitFromFolder(
    1222,
    'maximillion-iron-press',
    'Maximillion',
    'Mascarada',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 1,
      nameInkUnderSubject: true,
      // Pugno e aura sopra cornice.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Pugno e aura sopra la cornice',
    },
    {
      displayName: 'Maximillion, "Iron Press"',
      layout: {
        abilityTitle: { x: 770, y: 955, w: 240, fontSize: 76 },
        abilityText: { x: 750, y: 1060, w: 245, fontSize: 46 },
        name: { x: 65, y: 55, w: 475, h: 100, fontSize: 74 },
        nameSubtitle: { x: 90, y: 153, w: 350, h: 70, fontSize: 45 },
        faction: { x: 100, y: 775, w: 390, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
        bonusTitle: { x: 230, y: 1225, w: 540, h: 120, fontSize: 80 },
        bonusText: { x: 260, y: 1345, w: 230, fontSize: 55 },
      },
    }
  ),
  1229: layeredKitFromFolder(
    1229,
    'killer-widows-wail',
    "Killer \"Widow's Wail\"",
    'Mascarada',
    {
      subjectScale: 1,
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      compositionRev: 1,
      nameInkUnderSubject: true,
      // Zampe sopra cornice; sagoma sotto testi.
      breakHeadClip: null,
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'inset(0)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Zampe sopra la cornice',
    },
    {
      displayName: "Killer \"Widow's Wail\"",
      layout: {
        abilityTitle: { x: 710, y: 955, w: 310, fontSize: 44 },
        abilityText: { x: 750, y: 1060, w: 245, fontSize: 46 },
        name: { x: 70, y: 65, w: 740, h: 130, fontSize: 74 },
        faction: { x: 280, y: 755, w: 370, h: 65, fontSize: 37 },
        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
        bonusTitle: { x: 240, y: 1230, w: 540, h: 120, fontSize: 80 },
        bonusText: { x: 300, y: 1340, w: 300, fontSize: 55 },
      },
    }
  ),
};

export const CARD_FACE_FONT_ASSETS = {
  displayFont: `${BASE}fonts/alfa-display.otf`,
  bodyFont: `${BASE}fonts/alfa-body.otf`,
};

/** Asset base Eldritch 2.0 (cornice/anello tintabili + macchie). */
export const ELDRITCH_LAYOUT_BASE = {
  frame: `${ELDRITCH_DIR}Eldritch-Cornice.png`,
  ring: `${ELDRITCH_DIR}Eldritch-Anello-Lega.png`,
  wide: `${ELDRITCH_DIR}Eldritch-Macchia-Larga.png`,
  compact: `${ELDRITCH_DIR}Eldritch-Macchia-Compatta.png`,
};

/** Slug file cornice/anello per esercito (manifest kit). */
const ARMY_CHROME_SLUG = {
  'Concordia di Caelion': 'Concordia-di-Caelion',
  "Figli dell'Orizzonte": 'Figli-dell-Orizzonte',
  Kethran: 'Kethran',
  'Corte Rossa': 'Corte-Rossa',
  'Calibri Pesanti': 'Calibri-Pesanti',
  Orathai: 'Orathai',
  Mounthborn: 'Mounthborn',
  "L'Enclave delle Scaglie": 'L-Enclave-delle-Scaglie',
  'Ratti della Megera': 'Ratti-della-Megera',
  "Patto degli Indocili": 'Patto-degli-Indocili',
  Khemet: 'Khemet',
  Apex: 'Apex',
  Mascarada: 'Mascarada',
};

export function getArmyChromeUrls(army) {
  const slug = ARMY_CHROME_SLUG[army];
  if (!slug) return null;
  return {
    frame: `${ELDRITCH_DIR}cornici/Cornice-${slug}.png`,
    ring: `${ELDRITCH_DIR}anelli/Anello-${slug}.png`,
  };
}

export const ALL_FACE_CARDS = Object.entries(ARMY_SETS).flatMap(([army, cards]) =>
  cards.map((c) => ({ ...c, army }))
);

/** Agenti con forma Eldritch a livelli (default del lab). */
export const ELDRITCH_FACE_PRESETS = Object.values(LAYERED_CARD_KITS)
  .filter((kit) => kit.style !== 'arcana')
  .map((kit) => ({
    id: kit.id,
    label: kit.label,
  }));

/** Agenti con forma Arcana a livelli. */
export const ARCANA_FACE_PRESETS = Object.values(LAYERED_CARD_KITS)
  .filter((kit) => kit.style === 'arcana')
  .map((kit) => ({
    id: kit.id,
    label: kit.label,
  }));

export function hasLayeredAltArt(agentId) {
  return Boolean(LAYERED_CARD_KITS[agentId]);
}

export function getLayeredAltArt(agentId) {
  return LAYERED_CARD_KITS[agentId] || null;
}

/** @returns {'eldritch'|'arcana'|null} */
export function getAltFaceStyle(agentId) {
  const kit = LAYERED_CARD_KITS[agentId];
  if (!kit) return null;
  return kit.style === 'arcana' ? 'arcana' : 'eldritch';
}

/** Etichetta UI per lo stile alternativo della carta. */
export function getAltFaceStyleLabel(agentId) {
  const style = getAltFaceStyle(agentId);
  if (style === 'arcana') return 'Arcana';
  if (style === 'eldritch') return 'Eldritch';
  return null;
}

function abilityTitle(ability) {
  if (!ability) return 'Sempre';
  if (ability.trigger && TRIGGER_NAMES[ability.trigger]) return TRIGGER_NAMES[ability.trigger];
  return 'Sempre';
}

function abilityTextFromDescription(description, ability) {
  if (typeof description === 'string' && description.includes(':')) {
    const m = description.match(/^Potere:\s*[^:]+:\s*(.+)$/i);
    if (m) return m[1].trim();
    const m2 = description.match(/^Potere:\s*(.+)$/i);
    if (m2) return m2[1].trim();
  }
  if (!ability) return '';
  const parts = [];
  if (ability.effect) parts.push(String(ability.effect));
  if (ability.value != null) parts.push(String(ability.value));
  return parts.join(' ') || '—';
}

/** Titolo bonus esercito: trigger nominato, altrimenti «Sempre» (mai la parola Bonus). */
function bonusParts(army) {
  const bonus = ARMY_BONUSES[army];
  if (!bonus) return { title: 'Sempre', text: '—' };
  const title =
    (bonus.trigger && TRIGGER_NAMES[bonus.trigger]) || 'Sempre';
  let text = String(bonus.description || '—').trim();
  if (title !== 'Sempre' && text.includes(':')) {
    text = text.slice(text.lastIndexOf(':') + 1).trim() || text;
  }
  return { title, text };
}

/**
 * @param {'alfa'|'eldritch'} style
 */
export function agentToFaceData(agent, style = 'eldritch') {
  if (!agent) return { ...ALFA_DEFAULTS, layout: {} };
  const army = agent.army || "Figli dell'Orizzonte";
  const bonus = bonusParts(army);
  const accent =
    style === 'eldritch'
      ? ELDRITCH_COLORS[army] || ARMY_COLORS[army]?.accent || ALFA_DEFAULTS.accent
      : ARMY_COLORS[army]?.accent || ALFA_DEFAULTS.accent;
  const kit = style === 'eldritch' ? LAYERED_CARD_KITS[agent.id] : null;
  const layout =
    style === 'eldritch'
      ? sanitizeLayout({ ...ELDRITCH_DEFAULT_LAYOUT, ...(kit?.layout || {}) })
      : {};

  return {
    id: agent.id,
    name: agent.name,
    displayName: kit?.displayName || undefined,
    faction: kit?.faction || army,
    league: agent.league ?? 0,
    power: agent.power ?? 0,
    damage: agent.damage ?? 0,
    ability: {
      title: abilityTitle(agent.ability),
      text: abilityTextFromDescription(agent.description, agent.ability),
    },
    bonus,
    accent,
    artY: 0,
    artScale: 1,
    autoFaction: style === 'eldritch',
    whiteBackground: false,
    style: style === 'eldritch' ? 'Eldritch' : 'Alfa',
    description: agent.description,
    flavour: agent.flavour,
    layout,
    illustration: getCardImageUrl(null, agent.id) || undefined,
  };
}

/**
 * @param {string} [illustrationOverride]
 * @param {{ styleMode?: 'alfa'|'eldritch', faction?: string, useArmyChrome?: boolean }} [opts]
 */
export function buildAssets(illustrationOverride, opts = {}) {
  const { styleMode = 'eldritch', faction, useArmyChrome = true } = opts;
  const base = {
    ...CARD_FACE_FONT_ASSETS,
    art: illustrationOverride || undefined,
  };
  if (styleMode !== 'eldritch') return base;

  const armyChrome = useArmyChrome && faction ? getArmyChromeUrls(faction) : null;
  if (armyChrome) {
    return {
      ...base,
      ...ELDRITCH_LAYOUT_BASE,
      frame: armyChrome.frame,
      ring: armyChrome.ring,
      useArmyChrome: true,
    };
  }
  return {
    ...base,
    ...ELDRITCH_LAYOUT_BASE,
    useArmyChrome: false,
  };
}
