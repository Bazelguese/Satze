import { useCallback, useMemo } from 'react';
import { GUIDED_COPY, GUIDED_UI, fillGuidedTemplate } from '../data/tutorialGuidedContent';

export function useGuidedTutorialFlow({
  guidedMatch,
  guidedIntroStage,
  setGuidedIntroStage,
  setGuidedHint,
  gamePhase,
  roundNumber,
  battlefields,
  playerHand,
  enemyHand,
  selectedAgent,
  selectedFocus,
  battleResult,
}) {
  const currentGuidedRound = useMemo(() => {
    if (!guidedMatch.active) return null;
    return guidedMatch.rounds.find((r) => r.round === roundNumber) || null;
  }, [guidedMatch, roundNumber]);

  const isGuidedIntroWelcomePhase =
    guidedMatch.active &&
    guidedMatch.trackId === 'intro' &&
    gamePhase === 'selectField' &&
    guidedIntroStage === 0;
  const isGuidedIntroHandsPhase =
    guidedMatch.active &&
    guidedMatch.trackId === 'intro' &&
    gamePhase === 'selectField' &&
    guidedIntroStage === 1;
  const isGuidedIntroCardPickPhase =
    guidedMatch.active &&
    guidedMatch.trackId === 'intro' &&
    gamePhase === 'selectField' &&
    guidedIntroStage === 2;
  const isGuidedIntroPreviewPhase =
    guidedMatch.active &&
    guidedMatch.trackId === 'intro' &&
    gamePhase === 'selectField' &&
    guidedIntroStage === 3;
  const isGuidedIntroGlossaryPromptPhase =
    guidedMatch.active &&
    guidedMatch.trackId === 'intro' &&
    gamePhase === 'selectField' &&
    guidedIntroStage === 4;
  const isGuidedIntroGlossaryOpenPhase =
    guidedMatch.active &&
    guidedMatch.trackId === 'intro' &&
    gamePhase === 'selectField' &&
    guidedIntroStage === 5;
  const isGuidedIntroBattlefieldsPhase =
    guidedMatch.active &&
    guidedMatch.trackId === 'intro' &&
    gamePhase === 'selectField' &&
    guidedIntroStage === 6;

  const shouldHideHandsForGuidedSetup =
    guidedMatch.active &&
    guidedMatch.trackId === 'intro' &&
    gamePhase === 'selectField' &&
    guidedIntroStage <= 1;

  const guidedIntroTargetCardId = currentGuidedRound?.playerAgentId ?? null;
  const guidedIntroTargetCardName =
    playerHand.find((c) => c.id === guidedIntroTargetCardId)?.name || 'Agente guida';
  const showGuidedTrianglesHighlight = isGuidedIntroHandsPhase;

  const guidedInstruction = useMemo(() => {
    if (!guidedMatch.active || !currentGuidedRound) return null;
    const guidedFieldName = battlefields[currentGuidedRound.fieldIndex]?.name || `Campo ${currentGuidedRound.fieldIndex + 1}`;
    const guidedAgentName = playerHand.find((c) => c.id === currentGuidedRound.playerAgentId)?.name || 'Agente guidato';
    const guidedEnemyName = enemyHand.find((c) => c.id === currentGuidedRound.enemyAgentId)?.name || 'Agente nemico';
    const guidedAgent = playerHand.find((c) => c.id === currentGuidedRound.playerAgentId);
    const guidedEnemy = enemyHand.find((c) => c.id === currentGuidedRound.enemyAgentId);
    const expectedPlayerVA = (guidedAgent?.power || 0) * currentGuidedRound.focus;
    const expectedEnemyVA = (guidedEnemy?.power || 0) * currentGuidedRound.enemyFocus;
    const intro = GUIDED_COPY.intro;
    const generic = GUIDED_COPY.generic;

    if (guidedMatch.trackId === 'intro') {
      if (gamePhase === 'selectField') {
        if (guidedIntroStage === 0) {
          return {
            title: intro.welcomeTitle,
            lines: [
              <>
                {intro.openingParts.beforeField}
                <span className="text-fuchsia-300 font-semibold">{intro.openingParts.fieldLabel}</span>
                {intro.openingParts.between}
                <span className="text-amber-300 font-semibold">{intro.openingParts.duelLabel}</span>
                {intro.openingParts.end}
              </>,
              intro.welcomeContinue,
            ],
          };
        }
        if (guidedIntroStage === 1) {
          return {
            title: intro.handsTitle,
            lines: intro.handsLines,
          };
        }
        if (guidedIntroStage === 2) {
          return {
            title: intro.drawTitle,
            lines: [
              intro.drawInfo,
              <>{intro.clickCardPrefix} <span className="text-amber-300 font-semibold">{guidedIntroTargetCardName}</span></>,
            ],
          };
        }
        if (guidedIntroStage === 3) {
          return {
            title: intro.previewTitle,
            lines: [
              intro.previewLine,
              intro.previewContinue,
            ],
          };
        }
        if (guidedIntroStage === 4) {
          return {
            title: intro.glossaryPromptTitle,
            lines: [intro.glossaryPromptLine],
          };
        }
        if (guidedIntroStage === 5) {
          return {
            title: intro.glossaryOpenTitle,
            lines: [intro.glossaryOpenLine, intro.glossaryCloseHint],
          };
        }
        if (guidedIntroStage === 6) {
          return {
            title: intro.battlefieldsTitle,
            lines: intro.battlefieldsLines,
          };
        }
        return {
          title: fillGuidedTemplate(intro.baseFieldTitle, { round: roundNumber }),
          lines: [fillGuidedTemplate(intro.baseFieldLine, { field: guidedFieldName })],
        };
      }
      if (gamePhase === 'selectAgent') {
        const focusHint = selectedAgent?.id === currentGuidedRound.playerAgentId
          ? fillGuidedTemplate(intro.focusHintSelected, {
              focus: currentGuidedRound.focus,
              power: guidedAgent?.power || 0,
              playerVa: expectedPlayerVA,
            })
          : fillGuidedTemplate(intro.focusHintUnselected, {
              player: guidedAgentName,
              focus: currentGuidedRound.focus,
            });
        return {
          title: fillGuidedTemplate(intro.selectAgentTitle, { round: roundNumber }),
          lines: [
            fillGuidedTemplate(intro.stepLine, {
              player: guidedAgentName,
              enemy: guidedEnemyName,
              enemyFocus: currentGuidedRound.enemyFocus,
            }),
            intro.duelFormula,
            fillGuidedTemplate(intro.expectedVa, {
              playerVa: expectedPlayerVA,
              enemyVa: expectedEnemyVA,
            }),
            focusHint,
            intro.confirmLine,
          ],
        };
      }
      if (gamePhase === 'result') {
        const winnerLabel = battleResult?.winner === 'player' ? intro.wonLabel : intro.lostLabel;
        return {
          title: fillGuidedTemplate(intro.resultTitle, { round: roundNumber }),
          lines: [
            winnerLabel,
            ...intro.resultLines,
            battleResult
              ? fillGuidedTemplate(intro.resultState, {
                  playerHp: battleResult.finalPlayerHP,
                  enemyHp: battleResult.finalEnemyHP,
                })
              : intro.resultContinue,
          ],
        };
      }
      return {
        title: intro.fallbackTitle,
        lines: [intro.fallbackLine],
      };
    }

    if (gamePhase === 'selectField') {
      return {
        title: generic.step1,
        lines: [fillGuidedTemplate(generic.pickField, { field: guidedFieldName })],
      };
    }
    if (gamePhase === 'selectAgent') {
      if (!selectedAgent) {
        return {
          title: generic.step2,
          lines: [fillGuidedTemplate(generic.pickAgent, { agent: guidedAgentName })],
        };
      }
      if (selectedAgent.id !== currentGuidedRound.playerAgentId) {
        return {
          title: generic.step2,
          lines: [fillGuidedTemplate(generic.enforceAgent, { agent: guidedAgentName })],
        };
      }
      if (selectedFocus !== currentGuidedRound.focus) {
        return {
          title: generic.step3,
          lines: [fillGuidedTemplate(generic.enforceFocus, { focus: currentGuidedRound.focus })],
        };
      }
      return { title: generic.step4, lines: [generic.confirmObserve] };
    }
    if (gamePhase === 'result') {
      return { title: generic.step5, lines: [generic.analyzeResult] };
    }
    return { title: generic.fallbackTitle, lines: [generic.fallbackLine] };
  }, [
    guidedMatch.active,
    guidedMatch.trackId,
    currentGuidedRound,
    battlefields,
    playerHand,
    enemyHand,
    gamePhase,
    selectedAgent,
    selectedFocus,
    battleResult,
    roundNumber,
    guidedIntroStage,
    guidedIntroTargetCardName,
  ]);

  const guidedCallouts = useMemo(() => {
    if (!guidedMatch.active || !currentGuidedRound) return [];
    return [
      {
        id: 'goal',
        icon: '🎯',
        title: 'Conoscenza attuale',
        text: guidedInstruction?.title || 'Segui i passaggi guidati.',
        style: GUIDED_UI.goalCallout.style,
      },
    ];
  }, [guidedMatch.active, currentGuidedRound, guidedInstruction]);

  const handleGuidedIntroContinue = useCallback(() => {
    setGuidedIntroStage((prev) => Math.min(7, prev + 1));
    setGuidedHint('');
  }, [setGuidedIntroStage, setGuidedHint]);

  return {
    currentGuidedRound,
    isGuidedIntroWelcomePhase,
    isGuidedIntroHandsPhase,
    isGuidedIntroCardPickPhase,
    isGuidedIntroPreviewPhase,
    isGuidedIntroGlossaryPromptPhase,
    isGuidedIntroGlossaryOpenPhase,
    isGuidedIntroBattlefieldsPhase,
    shouldHideHandsForGuidedSetup,
    guidedIntroTargetCardId,
    guidedIntroTargetCardName,
    showGuidedTrianglesHighlight,
    guidedInstruction,
    guidedCallouts,
    handleGuidedIntroContinue,
  };
}
