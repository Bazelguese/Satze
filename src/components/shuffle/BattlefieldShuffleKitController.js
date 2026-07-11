import {
  ShuffleController,
  CARD_TRANSITION,
  SHUFFLES,
} from './shuffleKit';
import {
  applyDeckStackPosition,
  scheduleBattlefieldDeal,
} from './battlefieldDealMotion';
import { scheduleAlternateBattlefieldDeal } from './alternateDealMotion';
import { createShuffleZoneTransform } from './shuffleKitZoneTransform';
import {
  rollShuffleFieldJitter,
  withShuffleJitter,
} from './shuffleFieldJitter';

export { CARD_TRANSITION };

const DEAL_LEAD_MS = 280;

/**
 * ShuffleController: coreografia kit in zona locale + deal/restack sul campo reale.
 */
export class BattlefieldShuffleKitController extends ShuffleController {
  constructor({ layout, ...opts }) {
    super(opts);
    this.baseLayout = layout;
    this.layout = layout;
    this.zoneTransform = createShuffleZoneTransform(layout, this.g);
  }

  /** Coreografie kit: coordinate locali → campo (speculare per nemico). */
  setCardLocal(id, patch) {
    this.setCard(id, this.zoneTransform.mapPatch(patch));
  }

  restack(order, t) {
    const { layout, N } = this;
    this.after(t, () => {
      order.forEach((id, pos) => {
        this.setCard(id, applyDeckStackPosition(layout, id, pos, N));
      });
    });
  }

  deal(order, t) {
    return scheduleBattlefieldDeal({
      after: this.after.bind(this),
      setCard: this.setCard.bind(this),
      layout: this.layout,
      order,
      handSize: this.H,
      deckSize: this.N,
      startMs: t,
      dealScale: this.g.dealScale ?? 1,
    });
  }

  /** Una Sì Una No: ritmo alternato, stesse carte del deal standard. */
  dealAlternate(order, startMs) {
    return scheduleAlternateBattlefieldDeal({
      after: this.after.bind(this),
      setCard: this.setCard.bind(this),
      layout: this.layout,
      order,
      handSize: this.H,
      deckSize: this.N,
      startMs,
      dealScale: this.g.dealScale ?? 1,
    });
  }

  resetDeckStack() {
    const { layout, N } = this;
    for (let i = 0; i < N; i++) {
      this.setCard(i, applyDeckStackPosition(layout, i, i, N));
    }
  }

  play(kind, { onDone, order } = {}) {
    this.cancel();
    const chor = SHUFFLES[kind];
    if (!chor) throw new Error(`Unknown shuffle: ${kind}`);

    this.layout = this.baseLayout.shuffleJitter
      ? this.baseLayout
      : withShuffleJitter(this.baseLayout, rollShuffleFieldJitter());
    this.zoneTransform = createShuffleZoneTransform(this.layout, this.g);

    this.resetDeckStack();
    const ord = order ?? this._freshOrder();
    const ctx = {
      after: this.after.bind(this),
      setCard: this.setCardLocal.bind(this),
      restack: this.restack.bind(this),
      order: ord,
      N: this.N,
      H: this.H,
      g: this.g,
      battlefieldDeal: (dealOrder, dealStart) => this.dealAlternate(dealOrder, dealStart),
    };

    const tEnd = chor(ctx);
    const dealEnd = chor.selfDeal
      ? tEnd
      : this.deal(ord, tEnd + DEAL_LEAD_MS);

    if (onDone) this.after(dealEnd, onDone);
    return { order: ord, duration: dealEnd };
  }

  _freshOrder() {
    const a = Array.from({ length: this.N }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
