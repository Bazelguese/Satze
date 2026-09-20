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
/** Cache-bust compositas dopo ogni bake (partita / tile statiche). */
const COMPOSITA_CACHE = '20260920c';

/**
 * Kit Eldritch da cartella `public/card-images/eldritch/layers/<slug>/`.
 * File attesi: soggetto.webp, sfondo.webp; opz. cornice.webp, composita.webp, card.json.
 */
export function layeredKitFromFolder(id, slug, label, faction, composition = {}, extras = {}) {
  const base = `${LAYERS_DIR}${slug}/`;
  return {
    id,
    slug,
    label,
    faction,
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
    composition,
  };
}

/** Forme Eldritch ufficiali a livelli (parallasse). Una voce = una cartella. */
export const LAYERED_CARD_KITS = {
  101: layeredKitFromFolder(101, 'sorethai', 'Sorethai', "Figli dell'Orizzonte", {
    subjectScale: 1.045,
    subjectYPercent: 16,
    backgroundScale: 1.07,
    backgroundYPercent: 12,
    breakHeadClip: 'polygon(65% 0, 100% 0, 100% 72%, 65% 72%)',
    breakHeadMask:
      'linear-gradient(to bottom, transparent 10%, #000 23%, #000 53%, transparent 72%)',
    breakShoulderClip: 'polygon(0 32%, 24% 32%, 24% 66%, 0 66%)',
    breakShoulderMask:
      'linear-gradient(to bottom, transparent 32%, #000 44%, #000 56%, transparent 66%)',
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
        name: { x: 82, y: 82, w: 725, h: 175, fontSize: 97, scaleX: 0.9 },

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
        // Nome abbassato perché la testa (nebula) ci stia sopra.
        name: { x: 82, y: 135, w: 700, h: 175, fontSize: 96, scaleX: 0.9 },

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
      breakHeadAbove: false,
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
        name: { x: 270, y: 82, w: 515, h: 120, fontSize: 118, scaleX: 0.9 },
        nameSubtitle: { x: 275, y: 200, w: 505, h: 70, fontSize: 44, scaleX: 0.88 },

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
        name: { x: 82, y: 82, w: 725, h: 175, fontSize: 97, scaleX: 0.9 },

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
      // Corona sopra nome; mantello DX sopra cornice sotto testi.
      breakHeadClip: 'polygon(40% 0, 66% 0, 66% 15%, 40% 15%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(75% 25%, 100% 25%, 100% 91%, 75% 91%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Corona sopra nome; mantello sopra cornice',
    },
    {
      displayName: 'Nimrod, il Primo Re',
      layout: {
        name: { x: 82, y: 82, w: 440, h: 120, fontSize: 112, scaleX: 0.9 },
        nameSubtitle: { x: 86, y: 198, w: 345, h: 66, fontSize: 48, scaleX: 0.88 },

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
        name: { x: 82, y: 82, w: 725, h: 175, fontSize: 97, scaleX: 0.9 },

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
        name: { x: 330, y: 100, w: 462, h: 110, fontSize: 122, scaleX: 0.9 },
        nameSubtitle: { x: 337, y: 220, w: 462, h: 70, fontSize: 45, scaleX: 0.88 },

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
        name: { x: 82, y: 82, w: 730, h: 115, fontSize: 95, scaleX: 0.9 },
        nameSubtitle: { x: 90, y: 195, w: 335, h: 66, fontSize: 48, scaleX: 0.88 },

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
      // Corna sopra + manica SX sopra cornice, sotto testi.
      breakHeadClip: 'polygon(24% 0, 79% 0, 79% 25%, 24% 25%)',
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'polygon(0 24%, 24% 24%, 24% 89%, 0 89%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Corna e manica sopra la cornice',
    },
    {
      layout: {
        name: { x: 82, y: 82, w: 720, h: 150, fontSize: 100, scaleX: 0.9 },

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
      breakHeadAbove: false,
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
        name: { x: 82, y: 82, w: 720, h: 150, fontSize: 90, scaleX: 0.9 },

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
        name: { x: 270, y: 100, w: 515, h: 125, fontSize: 122, scaleX: 0.9 },

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
      breakHeadClip: 'polygon(0 34%, 35% 34%, 35% 83%, 0 83%)',
      breakHeadMask:
        'linear-gradient(to bottom, transparent 34%, #000 44%, #000 73%, transparent 83%)',
      breakShoulderClip: 'polygon(80% 46%, 100% 46%, 100% 88%, 80% 88%)',
      breakShoulderMask:
        'linear-gradient(to bottom, transparent 46%, #000 56%, #000 78%, transparent 88%)',
      popLabel: 'Spalle sopra la cornice',
    },
    {
      layout: {
        name: { x: 82, y: 90, w: 715, h: 205, fontSize: 116, scaleX: 0.9 },

        damageLabel: { x: 794, y: 1340 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
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
      subjectYPercent: 0,
      backgroundScale: 1.07,
      backgroundYPercent: 0,
      // Canna sopra cornice e testi (z6 in anteprima kit); lembo DX solo cornice.
      breakHeadClip: 'polygon(0 23%, 54% 23%, 54% 46%, 0 46%)',
      breakHeadMask: undefined,
      breakHeadAbove: true,
      breakShoulderClip: 'polygon(94% 33%, 100% 33%, 100% 67%, 94% 67%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Canna sopra cornice e testi',
    },
    {
      layout: {
        name: { x: 82, y: 77, w: 720, h: 145, fontSize: 76, scaleX: 0.9 },

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
      // Dorso sopra cornice top; zampa SX sopra cornice (sotto testi).
      breakHeadClip: 'polygon(18% 0, 82% 0, 82% 20%, 18% 20%)',
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'polygon(0 37%, 42% 37%, 42% 94%, 0 94%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Dorso e zampa sopra la cornice',
    },
    {
      layout: {
        name: { x: 82, y: 77, w: 600, h: 132, fontSize: 100, scaleX: 0.9 },

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
      breakShoulderClip: 'polygon(78% 40%, 100% 40%, 100% 69%, 78% 69%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Laser sopra nome e cornice',
    },
    {
      layout: {
        // Nome nella scia del fascio (breakAbove lo copre).
        name: { x: 480, y: 95, w: 340, h: 190, fontSize: 78, scaleX: 0.9 },

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
        name: { x: 215, y: 86, w: 570, h: 205, fontSize: 110, scaleX: 0.95 },

        damageLabel: { x: 794, y: 1340 },
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
        name: { x: 228, y: 85, w: 560, h: 205, fontSize: 110, scaleX: 0.94 },

        damageLabel: { x: 794, y: 1340 },
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
        name: { x: 235, y: 85, w: 565, h: 205, fontSize: 110, scaleX: 0.94 },

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
        name: { x: 82, y: 90, w: 715, h: 205, fontSize: 116, scaleX: 0.9 },

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
        name: { x: 82, y: 85, w: 705, h: 120, fontSize: 122 },
        nameSubtitle: { x: 88, y: 212, w: 500, h: 72, fontSize: 43 },

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
      // Spada sul bordo inferiore; mano libera a destra. Testi sopra.
      breakHeadClip: 'polygon(42% 65%, 100% 65%, 100% 100%, 42% 100%)',
      breakHeadMask:
        'linear-gradient(to bottom, transparent 65%, #000 72%, #000 100%)',
      breakHeadAbove: false,
      breakShoulderClip: 'polygon(84% 22%, 100% 22%, 100% 49%, 84% 49%)',
      breakShoulderMask:
        'linear-gradient(to bottom, transparent 22%, #000 28%, #000 44%, transparent 49%)',
      breakShoulderAbove: false,
      breaksAboveLayout: false,
      popLabel: 'Spada e mano sopra cornice, sotto testi',
    },
    {
      layout: {
        name: { x: 82, y: 85, w: 725, h: 190, fontSize: 100 },

        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
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
      // Mano sinistra + pinne destra sopra cornice, sotto testi (anteprima kit).
      breakHeadClip: 'polygon(0 20%, 32% 20%, 32% 57%, 0 57%)',
      breakHeadMask: undefined,
      breakHeadAbove: false,
      breakShoulderClip: 'polygon(84% 0, 100% 0, 100% 70%, 84% 70%)',
      breakShoulderMask: undefined,
      breakShoulderAbove: false,
      breakRightClip: null,
      breakExtraClip: null,
      breaksAboveLayout: false,
      popLabel: 'Mano e pinne sopra la cornice',
    },
    {
      displayName: 'Filomena, "Death Springboard"',
      layout: {
        name: { x: 82, y: 85, w: 725, h: 115, fontSize: 112 },
        nameSubtitle: { x: 88, y: 205, w: 705, h: 60, fontSize: 48 },

        damageLabel: { x: 794, y: 1354 },
        powerLabel: { x: 72, y: 1176 },
        league: { x: 836, y: 93 },
        damage: { x: 803, y: 1120 },
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
export const ELDRITCH_FACE_PRESETS = Object.values(LAYERED_CARD_KITS).map((kit) => ({
  id: kit.id,
  label: kit.label,
}));

export function hasLayeredAltArt(agentId) {
  return Boolean(LAYERED_CARD_KITS[agentId]);
}

export function getLayeredAltArt(agentId) {
  return LAYERED_CARD_KITS[agentId] || null;
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
