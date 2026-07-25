import { DeckBuilderLabPage } from '../../deckBuilderLab/DeckBuilderLabPage';

export function CosmicDeckBuilderWrapper(props) {
  return (
    <div className="dbl-builder-shell">
      <DeckBuilderLabPage {...props} />
    </div>
  );
}
