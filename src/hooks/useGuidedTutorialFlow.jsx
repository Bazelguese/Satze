import { useCallback, useMemo } from 'react';
import {
  ADV_STAGE_EPILOGUE,
  ADV_STAGE_GOAL,
  ADV_STAGE_TRIGGERS,
  GUIDED_COPY,
  GUIDED_UI,
  INTRO_STAGE_EPILOGUE,
  INTRO_STAGE_FREE_PLAY_FINAL,
  INTRO_STAGE_PLAY,
  fillGuidedTemplate,
  getGameResultLabel,
} from '../data/tutorialGuidedContent';
import {
  classifyAdvancedR5,
  countGuidedConqueredFields,
  validateGuidedFocus,
} from '../utils/guidedTutorialValidation';

function appendLessonLines(lines, lessonLines, vars) {
  if (!lessonLines) return lines;
  const extras = Array.isArray(lessonLines) ? lessonLines : [lessonLines];
  return [...lines, ...extras.map((line) => fillGuidedTemplate(line, vars))];
}

function buildGuidedDuelInstruction({
  gamePhase,
  duelPhase,
  roundNumber,
  battleResult,
  playerAgent,
  enemyAgent,
  isAdvancedTrack,
  lesson,
  playerFocus,
  enemyFocus,
}) {
  const intro = GUIDED_COPY.intro;
  const duelCopy = intro.duel;
  const adv = GUIDED_COPY.advanced;

  if (gamePhase !== 'result' || !battleResult || duelPhase < 0 || duelPhase > 5) {
    if (gamePhase === 'battle') {
      const battleLines = lesson?.duelBattleLines ?? duelCopy.battleLines;
      return {
        title: fillGuidedTemplate(duelCopy.battleTitle, { round: roundNumber }),
        lines: [...battleLines],
        actions: 'ackPause',
      };
    }
    return null;
  }

  const roundPhase = lesson?.duelPhases?.[duelPhase];
  const phaseCopy = duelCopy.phases[duelPhase];
  if (!phaseCopy && !roundPhase) return null;

  const playerCard = battleResult.playerAgent || playerAgent;
  const enemyCard = battleResult.enemyAgent || enemyAgent;
  const playerFc = battleResult.playerFocusUsed ?? 0;
  const enemyFc = battleResult.enemyFocusUsed ?? 0;
  const playerPower = playerCard?.power ?? 0;
  const enemyPower = enemyCard?.power ?? 0;
  const playerVaBase = playerPower * playerFc;
  const enemyVaBase = enemyPower * enemyFc;
  const phaseVars = {
    round: roundNumber,
    playerPower,
    playerFc,
    playerVa: playerVaBase,
    enemyPower,
    enemyFc,
    enemyVa: enemyVaBase,
    playerFcLeft: playerFocus ?? 18,
    enemyFcLeft: enemyFocus ?? 18,
  };

  let lines = roundPhase
    ? roundPhase.lines.map((line) => fillGuidedTemplate(line, phaseVars))
    : [...phaseCopy.lines];
  const phaseTitle = roundPhase?.title ?? phaseCopy.title;

  if (!roundPhase && isAdvancedTrack && duelPhase === 1 && adv.advDuelPhases?.[0]) {
    lines = [...adv.advDuelPhases[0].lines];
    lines = appendLessonLines(lines, lesson?.triggerNote, {
      round: roundNumber,
      focus: battleResult.playerFocusUsed ?? lesson?.focus,
    });
  } else if (!roundPhase && !isAdvancedTrack && duelPhase === 1) {
    lines = [...phaseCopy.lines, intro.triggersPhaseHint];
    lines = appendLessonLines(lines, lesson?.triggerNote, { round: roundNumber });
  }

  const showVaLine = roundPhase?.showVaLine ?? (!roundPhase && duelPhase === 2);
  const showClashLine = roundPhase?.showClashLine ?? (!roundPhase && duelPhase === 3);
  const showOutcome = roundPhase?.showOutcome ?? (!roundPhase && duelPhase === 5);

  if (showVaLine && phaseCopy?.vaLine && playerCard && enemyCard) {
    lines.push(
      fillGuidedTemplate(phaseCopy.vaLine, {
        playerPower,
        playerFc,
        playerVa: playerVaBase,
        enemyPower,
        enemyFc,
        enemyVa: enemyVaBase,
      })
    );
  }

  if (showClashLine && phaseCopy?.clashLine) {
    const playerVaFinal = battleResult.playerAssault ?? playerVaBase;
    const enemyVaFinal = battleResult.enemyAssault ?? enemyVaBase;
    let vaLeader = 'Pareggio di VA: si applicano le regole di spareggio.';
    if (playerVaFinal > enemyVaFinal) vaLeader = 'Sei in vantaggio: con questi VA vinci lo scontro.';
    else if (enemyVaFinal > playerVaFinal) vaLeader = 'Il nemico è in vantaggio: con questi VA vince lui.';
    lines.push(
      fillGuidedTemplate(phaseCopy.clashLine, {
        playerVa: playerVaFinal,
        enemyVa: enemyVaFinal,
        vaLeader,
      })
    );
  }

  if (showOutcome) {
    const damage = battleResult.damageDealt ?? 0;
    if (battleResult.winner === 'player' && phaseCopy?.outcomeWin) {
      lines.push(fillGuidedTemplate(phaseCopy.outcomeWin, { damage }));
    } else if (battleResult.winner === 'enemy' && phaseCopy?.outcomeLoss) {
      lines.push(fillGuidedTemplate(phaseCopy.outcomeLoss, { damage }));
    } else if (battleResult.winner === 'draw' && phaseCopy?.outcomeDraw) {
      lines.push(phaseCopy.outcomeDraw);
    }
    lines = appendLessonLines(lines, lesson?.duelPhaseOutcomeExtra, phaseVars);
  }

  if (!roundPhase && duelPhase === 2) {
    lines = appendLessonLines(lines, lesson?.duelExtra, {
      round: roundNumber,
      playerPower,
      playerFc,
      playerVa: playerVaBase,
      enemyPower,
      enemyFc,
      enemyVa: enemyVaBase,
    });
  }

  return {
    title: fillGuidedTemplate(phaseTitle, { round: roundNumber }),
    lines,
    actions: 'ackPause',
  };
}

export function useGuidedTutorialFlow({
  guidedMatch,
  guidedIntroStage,
  guidedPause,
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
  conqueredFields,
  playerHP,
  enemyHP,
  playerFocus,
  enemyFocus,
  gameResult,
  isPlayerFirst,
  duelPhase = 0,
  enemyAgent,
}) {
  const currentGuidedRound = useMemo(() => {
    if (!guidedMatch.active || guidedMatch.freePlay) return null;
    return guidedMatch.rounds.find((r) => r.round === roundNumber) || null;
  }, [guidedMatch, roundNumber]);

  const fieldCounts = useMemo(
    () => countGuidedConqueredFields(conqueredFields),
    [conqueredFields]
  );

  const isIntroTrack = guidedMatch.active && guidedMatch.trackId === 'intro';
  const isAdvancedTrack = guidedMatch.active && guidedMatch.trackId === 'advanced';
  const isFreePlay = Boolean(guidedMatch.freePlay);

  const isGuidedIntroWelcomePhase =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage === 0;
  const isGuidedIntroHandsPhase =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage === 1;
  const isGuidedIntroCardPickPhase =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage === 2;
  const isGuidedIntroPreviewPhase =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage === 3;
  const isGuidedIntroGlossaryPromptPhase =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage === 4;
  const isGuidedIntroGlossaryOpenPhase =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage === 5;
  const isGuidedIntroBattlefieldsPhase =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage === 6;
  const isGuidedIntroVictoryPhase =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage === 7;
  const isGuidedIntroFcBudgetPhase =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage === 8;
  const isGuidedIntroEpiloguePhase =
    isIntroTrack && guidedIntroStage === INTRO_STAGE_EPILOGUE;
  const isGuidedIntroFreePlayFinalPhase =
    isIntroTrack && guidedIntroStage === INTRO_STAGE_FREE_PLAY_FINAL;

  const isGuidedAdvancedGoalPhase =
    isAdvancedTrack && gamePhase === 'selectField' && guidedIntroStage === ADV_STAGE_GOAL;
  const isGuidedAdvancedTriggersPhase =
    isAdvancedTrack && gamePhase === 'selectField' && guidedIntroStage === ADV_STAGE_TRIGGERS;
  const isGuidedAdvancedEpiloguePhase =
    isAdvancedTrack && guidedIntroStage === ADV_STAGE_EPILOGUE;

  const isGuidedOkContinuePhase =
    isGuidedIntroWelcomePhase ||
    isGuidedIntroHandsPhase ||
    isGuidedIntroPreviewPhase ||
    isGuidedIntroBattlefieldsPhase ||
    isGuidedIntroVictoryPhase ||
    isGuidedIntroFcBudgetPhase ||
    isGuidedAdvancedGoalPhase ||
    isGuidedAdvancedTriggersPhase;

  const shouldHideHandsForGuidedSetup =
    isIntroTrack && !isFreePlay && gamePhase === 'selectField' && guidedIntroStage <= 1;

  const guidedIntroTargetCardId = currentGuidedRound?.playerAgentId ?? playerHand[0]?.id ?? null;
  const guidedIntroTargetCardName =
    playerHand.find((c) => c.id === guidedIntroTargetCardId)?.name || 'Agente guida';
  const showGuidedTrianglesHighlight = isGuidedIntroHandsPhase;

  const isGuidedBlockingOverlay =
    isGuidedOkContinuePhase ||
    isGuidedIntroEpiloguePhase ||
    isGuidedIntroFreePlayFinalPhase ||
    isGuidedAdvancedEpiloguePhase;

  const isGuidedPlayPhase =
    guidedMatch.active &&
    !isFreePlay &&
    guidedIntroStage >= INTRO_STAGE_PLAY &&
    !isGuidedBlockingOverlay;

  const isGuidedEnemyFieldPause =
    isGuidedPlayPhase && gamePhase === 'selectField' && !isPlayerFirst && guidedPause === 'enemyField';
  const isGuidedEnemyAgentPause =
    isGuidedPlayPhase && gamePhase === 'selectAgent' && !isPlayerFirst && guidedPause === 'enemyAgent';
  const isGuidedEnemyAckPause = isGuidedEnemyFieldPause || isGuidedEnemyAgentPause;
  const isGuidedDuelPause =
    isGuidedPlayPhase &&
    guidedPause === 'duel' &&
    (gamePhase === 'battle' || (gamePhase === 'result' && duelPhase <= 5));
  const showGuidedCompactOverlay =
    isGuidedPlayPhase &&
    (gamePhase === 'selectField' ||
      gamePhase === 'selectAgent' ||
      gamePhase === 'battle' ||
      gamePhase === 'result');

  const guidedOverlayMode = useMemo(() => {
    if (!guidedMatch.active) return 'hidden';
    if (gamePhase === 'gameOver') return 'hidden';
    if (isGuidedBlockingOverlay || isGuidedEnemyAckPause) return 'blocking';
    if (showGuidedCompactOverlay) return 'compact';
    return 'hidden';
  }, [guidedMatch.active, gamePhase, isGuidedBlockingOverlay, isGuidedEnemyAckPause, showGuidedCompactOverlay]);

  const shouldPlayerPickField =
    isGuidedPlayPhase && gamePhase === 'selectField' && isPlayerFirst;

  const templateVars = useMemo(() => {
    const fcSpent = 18 - (playerFocus ?? 18);
    return {
      round: roundNumber,
      playerFields: fieldCounts.player,
      enemyFields: fieldCounts.enemy,
      playerHp: battleResult?.finalPlayerHP ?? playerHP,
      enemyHp: battleResult?.finalEnemyHP ?? enemyHP,
      playerFc: playerFocus ?? 18,
      enemyFc: enemyFocus ?? 18,
      fcSpent,
      fcLeft: playerFocus ?? 18,
      gameResultLabel: getGameResultLabel(gameResult),
      victoryReminder:
        roundNumber >= 5
          ? GUIDED_COPY.intro.victoryReminderRound5
          : GUIDED_COPY.intro.victoryReminderRound4,
    };
  }, [
    roundNumber,
    fieldCounts,
    battleResult,
    playerHP,
    enemyHP,
    playerFocus,
    enemyFocus,
    gameResult,
  ]);

  const guidedInstruction = useMemo(() => {
    if (!guidedMatch.active) return null;

    if (isGuidedIntroEpiloguePhase) {
      const intro = GUIDED_COPY.intro;
      return {
        title: intro.epilogueTitle,
        lines: intro.epilogueLines.map((line) => fillGuidedTemplate(line, templateVars)),
        actions: 'introEpilogue',
      };
    }

    if (isGuidedIntroFreePlayFinalPhase) {
      const intro = GUIDED_COPY.intro;
      return {
        title: intro.freePlayFinalTitle,
        lines: intro.freePlayFinalLines.map((line) => fillGuidedTemplate(line, templateVars)),
        actions: 'introFreePlayFinal',
      };
    }

    // Round liberi (4–5): nessun messaggio tutorial durante la partita
    if (isFreePlay) return null;

    if (isGuidedAdvancedEpiloguePhase) {
      const adv = GUIDED_COPY.advanced;
      return {
        title: adv.advEpilogueTitle,
        lines: adv.advEpilogueLines.map((line) => fillGuidedTemplate(line, templateVars)),
        actions: 'advancedEpilogue',
      };
    }

    if (!currentGuidedRound && isAdvancedTrack) return null;

    const duelInstruction = buildGuidedDuelInstruction({
      gamePhase,
      duelPhase,
      roundNumber,
      battleResult,
      playerAgent: selectedAgent,
      enemyAgent,
      isAdvancedTrack,
      lesson: currentGuidedRound?.lesson,
      playerFocus,
      enemyFocus,
    });
    if (duelInstruction) return duelInstruction;

    const guidedFieldName =
      battlefields[currentGuidedRound?.fieldIndex]?.name || `Campo ${(currentGuidedRound?.fieldIndex ?? 0) + 1}`;
    const guidedAgentName =
      playerHand.find((c) => c.id === currentGuidedRound?.playerAgentId)?.name || 'Agente guidato';
    const guidedEnemyName =
      enemyHand.find((c) => c.id === currentGuidedRound?.enemyAgentId)?.name || 'Agente nemico';
    const guidedAgent = playerHand.find((c) => c.id === currentGuidedRound?.playerAgentId);
    const guidedEnemy = enemyHand.find((c) => c.id === currentGuidedRound?.enemyAgentId);
    const enemyFocusScripted = currentGuidedRound?.enemyFocusAllIn
      ? enemyFocus
      : currentGuidedRound?.enemyFocus;
    const expectedPlayerVA = (guidedAgent?.power || 0) * (currentGuidedRound?.focus || selectedFocus || 1);
    const expectedEnemyVA = (guidedEnemy?.power || 0) * (enemyFocusScripted || 1);
    const intro = GUIDED_COPY.intro;
    const generic = GUIDED_COPY.generic;
    const adv = GUIDED_COPY.advanced;

    if (isIntroTrack) {
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
          return { title: intro.handsTitle, lines: intro.handsLines };
        }
        if (guidedIntroStage === 2) {
          return {
            title: intro.drawTitle,
            lines: [
              intro.drawInfo,
              <>
                {intro.clickCardPrefix}{' '}
                <span className="text-amber-300 font-semibold">{guidedIntroTargetCardName}</span>
              </>,
            ],
          };
        }
        if (guidedIntroStage === 3) {
          return {
            title: intro.previewTitle,
            lines: [intro.previewLine, intro.previewContinue],
          };
        }
        if (guidedIntroStage === 4) {
          return { title: intro.glossaryPromptTitle, lines: [intro.glossaryPromptLine] };
        }
        if (guidedIntroStage === 5) {
          return {
            title: intro.glossaryOpenTitle,
            lines: [intro.glossaryOpenLine, intro.glossaryCloseHint],
          };
        }
        if (guidedIntroStage === 6) {
          return { title: intro.battlefieldsTitle, lines: intro.battlefieldsLines };
        }
        if (guidedIntroStage === 7) {
          return { title: intro.victoryTitle, lines: intro.victoryLines };
        }
        if (guidedIntroStage === 8) {
          return { title: intro.fcBudgetTitle, lines: intro.fcBudgetLines };
        }
        if (!isPlayerFirst) {
          if (isGuidedEnemyFieldPause) {
            return {
              title: fillGuidedTemplate(intro.enemyFieldTitle, { round: roundNumber }),
              lines: [intro.enemyFieldLine],
              actions: 'ackPause',
            };
          }
          return {
            title: fillGuidedTemplate(intro.enemyFieldTitle, { round: roundNumber }),
            lines: [
              intro.enemyFieldLine,
              fillGuidedTemplate(intro.enemyFieldChosen, { field: guidedFieldName }),
            ],
          };
        }
        return {
          title: fillGuidedTemplate(intro.baseFieldTitle, { round: roundNumber }),
          lines: [fillGuidedTemplate(intro.baseFieldLine, { field: guidedFieldName })],
        };
      }
      if (gamePhase === 'selectAgent' && currentGuidedRound) {
        if (isGuidedEnemyAgentPause) {
          return {
            title: fillGuidedTemplate(intro.enemyDeployTitle, { round: roundNumber }),
            lines: intro.enemyDeployLines.map((line) =>
              fillGuidedTemplate(line, {
                enemy: guidedEnemyName,
                enemyFocus: enemyFocusScripted,
              })
            ),
            actions: 'ackPause',
          };
        }
        const fieldLine = !isPlayerFirst
          ? fillGuidedTemplate(intro.enemyFieldChosen, { field: guidedFieldName })
          : null;
        const focusTarget = currentGuidedRound.focus;
        const focusHint =
          selectedAgent?.id === currentGuidedRound.playerAgentId
            ? fillGuidedTemplate(intro.focusHintSelected, {
                focus: focusTarget,
                power: guidedAgent?.power || 0,
                playerVa: (guidedAgent?.power || 0) * focusTarget,
              })
            : fillGuidedTemplate(intro.focusHintUnselected, {
                player: guidedAgentName,
                focus: focusTarget,
              });
        const agentLessonExtras = [
          currentGuidedRound.lesson?.selectAgentExtra,
          currentGuidedRound.lesson?.triggerNote,
        ].filter(Boolean);
        const showVaFormula = currentGuidedRound.lesson?.showVaFormula !== false;
        const selectAgentCore = [
          ...(fieldLine ? [fieldLine] : []),
          fillGuidedTemplate(intro.stepLine, {
            player: guidedAgentName,
            enemy: guidedEnemyName,
            enemyFocus: currentGuidedRound.enemyFocus,
          }),
        ];
        if (showVaFormula) {
          selectAgentCore.push(
            intro.duelFormula,
            fillGuidedTemplate(intro.expectedVa, {
              playerVa: (guidedAgent?.power || 0) * focusTarget,
              enemyVa: (guidedEnemy?.power || 0) * currentGuidedRound.enemyFocus,
            })
          );
        } else if (currentGuidedRound.lesson?.expectedVaNote) {
          selectAgentCore.push(
            fillGuidedTemplate(currentGuidedRound.lesson.expectedVaNote, {
              playerVa: (guidedAgent?.power || 0) * focusTarget,
              enemyVa: (guidedEnemy?.power || 0) * currentGuidedRound.enemyFocus,
              playerPower: guidedAgent?.power || 0,
              enemyPower: guidedEnemy?.power || 0,
              playerFc: focusTarget,
              enemyFc: currentGuidedRound.enemyFocus,
            })
          );
        }
        selectAgentCore.push(focusHint, intro.confirmLine);
        const selectTitle =
          currentGuidedRound.lesson?.selectAgentTitle ??
          fillGuidedTemplate(intro.selectAgentTitle, { round: roundNumber });
        return {
          title: selectTitle,
          lines: appendLessonLines(
            selectAgentCore,
            agentLessonExtras.length ? agentLessonExtras : null,
            { ...templateVars, player: guidedAgentName }
          ),
        };
      }
      if (gamePhase === 'result' && currentGuidedRound && battleResult) {
        const winnerLabel = battleResult.winner === 'player' ? intro.wonLabel : intro.lostLabel;
        const resultTitle =
          currentGuidedRound.lesson?.resultTitle ??
          fillGuidedTemplate(intro.resultTitle, { round: roundNumber });
        const resultCore = currentGuidedRound.lesson?.resultCoreLines
          ? currentGuidedRound.lesson.resultCoreLines.map((line) => fillGuidedTemplate(line, templateVars))
          : [
              winnerLabel,
              ...intro.resultLines,
              fillGuidedTemplate(intro.resultFieldsState, {
                playerFields: fieldCounts.player,
                enemyFields: fieldCounts.enemy,
              }),
              fillGuidedTemplate(intro.resultState, {
                playerHp: battleResult.finalPlayerHP,
                enemyHp: battleResult.finalEnemyHP,
                playerFc: playerFocus ?? 18,
                enemyFc: enemyFocus ?? 18,
              }),
            ];
        return {
          title: resultTitle,
          lines: appendLessonLines(
            [...resultCore, intro.resultContinue],
            currentGuidedRound.lesson?.resultExtra,
            templateVars
          ),
        };
      }
      return { title: intro.fallbackTitle, lines: [intro.fallbackLine] };
    }

    if (isAdvancedTrack) {
      if (gamePhase === 'selectField') {
        if (guidedIntroStage === ADV_STAGE_GOAL) {
          return { title: adv.advGoalTitle, lines: adv.advGoalLines };
        }
        if (guidedIntroStage === ADV_STAGE_TRIGGERS) {
          return { title: adv.advTriggersTitle, lines: adv.advTriggersLines };
        }
        if (!isPlayerFirst) {
          if (isGuidedEnemyFieldPause) {
            return {
              title: fillGuidedTemplate(intro.enemyFieldTitle, { round: roundNumber }),
              lines: [intro.enemyFieldLine],
              actions: 'ackPause',
            };
          }
          return {
            title: fillGuidedTemplate(intro.enemyFieldTitle, { round: roundNumber }),
            lines: [
              intro.enemyFieldLine,
              fillGuidedTemplate(intro.enemyFieldChosen, { field: guidedFieldName }),
            ],
          };
        }
        return {
          title: fillGuidedTemplate(generic.step1, { round: roundNumber }),
          lines: [fillGuidedTemplate(generic.pickField, { field: guidedFieldName })],
        };
      }
      if (gamePhase === 'selectAgent' && currentGuidedRound) {
        if (isGuidedEnemyAgentPause) {
          return {
            title: fillGuidedTemplate(intro.enemyDeployTitle, { round: roundNumber }),
            lines: intro.enemyDeployLines.map((line) =>
              fillGuidedTemplate(line, {
                enemy: guidedEnemyName,
                enemyFocus: enemyFocusScripted,
              })
            ),
            actions: 'ackPause',
          };
        }
        const fieldLine = !isPlayerFirst
          ? fillGuidedTemplate(intro.enemyFieldChosen, { field: guidedFieldName })
          : null;
        const policy = currentGuidedRound.focusPolicy || 'exact';
        const focusLabel =
          policy === 'range'
            ? `${currentGuidedRound.focusMin}–${currentGuidedRound.focusMax} FC`
            : policy === 'free'
              ? 'liberi'
              : `${currentGuidedRound.focus} FC`;
        const advLessonExtras = [
          currentGuidedRound.lesson?.selectAgentExtra,
          currentGuidedRound.lesson?.triggerNote,
        ].filter(Boolean);
        const lines = appendLessonLines(
          [
            ...(fieldLine ? [fieldLine] : []),
            fillGuidedTemplate(intro.stepLine, {
              player: guidedAgentName,
              enemy: guidedEnemyName,
              enemyFocus: enemyFocusScripted,
            }),
            fillGuidedTemplate(adv.advExpectedVa, {
              playerVa: expectedPlayerVA,
              enemyVa: expectedEnemyVA,
            }),
            `Investimento: ${focusLabel}.`,
            generic.confirmObserve,
          ],
          advLessonExtras.length ? advLessonExtras : null,
          { ...templateVars, player: guidedAgentName, focus: currentGuidedRound.focus }
        );
        return {
          title: fillGuidedTemplate('Round {round}: scelta FC', { round: roundNumber }),
          lines,
        };
      }
      if (gamePhase === 'result' && currentGuidedRound) {
        const winnerLabel = battleResult?.winner === 'player' ? intro.wonLabel : intro.lostLabel;
        let lines = appendLessonLines(
          [
            winnerLabel,
            fillGuidedTemplate(intro.resultState, {
              playerHp: battleResult?.finalPlayerHP ?? playerHP,
              enemyHp: battleResult?.finalEnemyHP ?? enemyHP,
              playerFc: playerFocus ?? 18,
              enemyFc: enemyFocus ?? 18,
            }),
            intro.resultContinue,
          ],
          currentGuidedRound.lesson?.resultExtra,
          {
            ...templateVars,
            dan: battleResult?.winner === 'enemy' ? guidedAgent?.damage ?? 0 : 0,
            focus: selectedFocus,
          }
        );

        if (currentGuidedRound.round === 5) {
          const evalKey = classifyAdvancedR5({
            playerHp: playerHP,
            enemyHp: enemyHP,
            enemyDamage: guidedEnemy?.damage ?? 0,
            focus: selectedFocus,
            won: battleResult?.winner === 'player',
          });
          const evalLine = adv.eval[evalKey];
          if (evalLine) {
            const pvLead = Math.max(0, playerHP - enemyHP);
            const enemyMaxVa = (guidedEnemy?.power || 0) * (enemyFocusScripted || 1);
            lines = [
              ...lines,
              fillGuidedTemplate(evalLine, { ...templateVars, pvLead, enemyMaxVa }),
            ];
          }
        }

        return {
          title: fillGuidedTemplate(intro.resultTitle, { round: roundNumber }),
          lines,
        };
      }
      return { title: adv.fallbackTitle, lines: [adv.fallbackLine] };
    }

    return { title: generic.fallbackTitle, lines: [generic.fallbackLine] };
  }, [
    guidedMatch.active,
    guidedMatch.trackId,
    guidedMatch.freePlay,
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
    isIntroTrack,
    isAdvancedTrack,
    isFreePlay,
    isPlayerFirst,
    isGuidedEnemyFieldPause,
    isGuidedEnemyAgentPause,
    isGuidedIntroEpiloguePhase,
    isGuidedIntroFreePlayFinalPhase,
    isGuidedAdvancedEpiloguePhase,
    duelPhase,
    enemyAgent,
    fieldCounts,
    templateVars,
    playerHP,
    enemyHP,
    playerFocus,
    enemyFocus,
  ]);

  const guidedCallouts = useMemo(() => {
    if (!guidedMatch.active || guidedOverlayMode === 'hidden') return [];
    const isCompact = guidedOverlayMode === 'compact';
    const isDuelScene = gamePhase === 'battle' || gamePhase === 'result';
    return [
      {
        id: 'goal',
        icon: isCompact ? '💡' : '🎯',
        title: isCompact ? (isDuelScene ? 'Duello' : 'Suggerimento') : 'Conoscenza attuale',
        text: guidedInstruction?.title || 'Segui i passaggi guidati.',
        style: isCompact ? GUIDED_UI.goalCallout.compactStyle : GUIDED_UI.goalCallout.style,
      },
    ];
  }, [guidedMatch.active, guidedOverlayMode, guidedInstruction, gamePhase]);

  const handleGuidedIntroContinue = useCallback(() => {
    setGuidedIntroStage((prev) => {
      if (guidedMatch.trackId === 'advanced') {
        if (prev === ADV_STAGE_GOAL || prev === ADV_STAGE_TRIGGERS) return INTRO_STAGE_PLAY;
      }
      return Math.min(INTRO_STAGE_PLAY, prev + 1);
    });
    setGuidedHint('');
  }, [guidedMatch.trackId, setGuidedIntroStage, setGuidedHint]);

  const validateFocusForRound = useCallback(
    (round, focus) => validateGuidedFocus(round, focus),
    []
  );

  return {
    currentGuidedRound,
    isGuidedIntroWelcomePhase,
    isGuidedIntroHandsPhase,
    isGuidedIntroCardPickPhase,
    isGuidedIntroPreviewPhase,
    isGuidedIntroGlossaryPromptPhase,
    isGuidedIntroGlossaryOpenPhase,
    isGuidedIntroBattlefieldsPhase,
    isGuidedIntroVictoryPhase,
    isGuidedIntroFcBudgetPhase,
    isGuidedIntroEpiloguePhase,
    isGuidedIntroFreePlayFinalPhase,
    isGuidedAdvancedGoalPhase,
    isGuidedAdvancedTriggersPhase,
    isGuidedAdvancedEpiloguePhase,
    isGuidedOkContinuePhase,
    isGuidedEnemyAckPause,
    isGuidedDuelPause,
    shouldHideHandsForGuidedSetup,
    guidedIntroTargetCardId,
    guidedIntroTargetCardName,
    showGuidedTrianglesHighlight,
    guidedInstruction,
    guidedCallouts,
    handleGuidedIntroContinue,
    validateFocusForRound,
    fieldCounts,
    guidedOverlayMode,
    shouldPlayerPickField,
  };
}
