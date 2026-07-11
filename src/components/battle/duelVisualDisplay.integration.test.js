import { describe, it, expect } from 'vitest';
import {
  getDuelVisualDisplay,
  buildVaModProgressionLines,
} from '../../components/battle/duelVisualDisplay.js';

const preVaStep = {
  kind: 'preVa',
  side: null,
  playerPower: 7,
  enemyPower: 4,
  playerDamage: 3,
  enemyDamage: 2,
  playerAssaultMod: 0,
  enemyAssaultMod: 0,
  highlightPlayerAbility: false,
  highlightEnemyAbility: false,
  highlightPlayerBonus: false,
  highlightEnemyBonus: false,
};

const battleResult = {
  playerAgent: { power: 5, damage: 3, army: 'Kethran' },
  enemyAgent: { power: 4, damage: 2, army: "Figli dell'Orizzonte" },
  playerPower: 7,
  enemyPower: 4,
  playerDamage: 3,
  enemyDamage: 2,
  playerAbilityTriggered: true,
  enemyAbilityTriggered: false,
  playerHasBonus: true,
  enemyHasBonus: false,
  playerBonusBlocked: false,
  enemyBonusBlocked: false,
  visualSteps: [
    {
      kind: 'deploy',
      side: null,
      playerPower: 5,
      enemyPower: 4,
      playerDamage: 3,
      enemyDamage: 2,
      playerAssaultMod: 0,
      enemyAssaultMod: 0,
      highlightPlayerAbility: false,
      highlightEnemyAbility: false,
      highlightPlayerBonus: false,
      highlightEnemyBonus: false,
    },
    {
      kind: 'power',
      side: 'player',
      playerPower: 7,
      enemyPower: 4,
      playerDamage: 3,
      enemyDamage: 2,
      highlightPlayerAbility: true,
      highlightEnemyAbility: false,
      highlightPlayerBonus: false,
      highlightEnemyBonus: false,
    },
    {
      kind: 'bonus',
      side: 'player',
      playerPower: 7,
      enemyPower: 4,
      playerDamage: 3,
      enemyDamage: 2,
      highlightPlayerAbility: false,
      highlightEnemyAbility: false,
      highlightPlayerBonus: true,
      highlightEnemyBonus: false,
    },
    preVaStep,
  ],
};

describe('getDuelVisualDisplay', () => {
  it('fase 0: stat base senza highlight', () => {
    const d = getDuelVisualDisplay(battleResult, 0, 1);
    expect(d.playerPower).toBe(5);
    expect(d.enemyPower).toBe(4);
    expect(d.highlightPlayerAbility).toBe(false);
    expect(d.highlightPlayerBonus).toBe(false);
  });

  it('fase 1 step 1: solo potere player', () => {
    const d = getDuelVisualDisplay(battleResult, 1, 1);
    expect(d.playerPower).toBe(7);
    expect(d.highlightPlayerAbility).toBe(true);
    expect(d.highlightPlayerBonus).toBe(false);
    expect(d.pulsePlayerSide).toBe(true);
  });

  it('fase 1 step 2: potere e bonus player', () => {
    const d = getDuelVisualDisplay(battleResult, 1, 2);
    expect(d.highlightPlayerAbility).toBe(true);
    expect(d.highlightPlayerBonus).toBe(true);
  });

  it('fase 2-4: stat preVa nonostante step post-duello successivi', () => {
    const br = {
      ...battleResult,
      playerPower: 9,
      visualSteps: [
        ...battleResult.visualSteps,
        {
          kind: 'postPower',
          side: 'player',
          playerPower: 9,
          enemyPower: 4,
          playerDamage: 3,
          enemyDamage: 2,
          highlightPlayerAbility: true,
          highlightEnemyAbility: false,
          highlightPlayerBonus: false,
          highlightEnemyBonus: false,
        },
      ],
    };
    const d = getDuelVisualDisplay(br, 2, 1);
    expect(d.playerPower).toBe(7);
    const d4 = getDuelVisualDisplay(br, 4, 1);
    expect(d4.playerPower).toBe(7);
  });

  it('blocked: non visibile fino allo step powerBlocked', () => {
    const br = {
      ...battleResult,
      playerAgent: {
        ...battleResult.playerAgent,
        ability: { trigger: 'sfida', effect: 'toxin', value: 1 },
      },
      playerAbilityBlocked: true,
      playerAbilityTriggered: true,
      visualSteps: [
        battleResult.visualSteps[0],
        {
          kind: 'block',
          side: 'enemy',
          playerPower: 5,
          enemyPower: 4,
          playerDamage: 3,
          enemyDamage: 2,
          highlightPlayerAbility: false,
          highlightEnemyAbility: true,
          highlightPlayerBonus: false,
          highlightEnemyBonus: false,
        },
        {
          kind: 'powerBlocked',
          side: 'player',
          playerPower: 5,
          enemyPower: 4,
          playerDamage: 3,
          enemyDamage: 2,
          highlightPlayerAbility: true,
          highlightEnemyAbility: false,
          highlightPlayerBonus: false,
          highlightEnemyBonus: false,
        },
        preVaStep,
      ],
    };
    expect(getDuelVisualDisplay(br, 0, 1).showPlayerAbilityBlocked).toBe(false);
    expect(getDuelVisualDisplay(br, 1, 1).showPlayerAbilityBlocked).toBe(false);
    expect(getDuelVisualDisplay(br, 1, 2).showPlayerAbilityBlocked).toBe(true);
    expect(getDuelVisualDisplay(br, 2, 1).showPlayerAbilityBlocked).toBe(true);
  });

  it('notTriggered: non visibile in fase 0, sì dopo step valutazione potere', () => {
    const br = {
      ...battleResult,
      playerAgent: {
        ...battleResult.playerAgent,
        ability: { trigger: 'sfida', effect: 'toxin', value: 1 },
      },
      playerAbilityNotTriggered: true,
      playerAbilityTriggered: false,
      visualSteps: [
        battleResult.visualSteps[0],
        {
          kind: 'power',
          side: 'enemy',
          playerPower: 5,
          enemyPower: 4,
          playerDamage: 3,
          enemyDamage: 2,
          highlightPlayerAbility: false,
          highlightEnemyAbility: true,
          highlightPlayerBonus: false,
          highlightEnemyBonus: false,
        },
        preVaStep,
      ],
    };
    expect(getDuelVisualDisplay(br, 0, 1).showPlayerAbilityNotTriggered).toBe(false);
    expect(getDuelVisualDisplay(br, 1, 1).showPlayerAbilityNotTriggered).toBe(true);
    expect(getDuelVisualDisplay(br, 2, 1).showPlayerAbilityNotTriggered).toBe(true);
  });

  it('bonusActive: non attivo prima dello step bonus', () => {
    const br = {
      ...battleResult,
      visualSteps: battleResult.visualSteps,
    };
    expect(getDuelVisualDisplay(br, 0, 1).showPlayerBonusActive).toBe(false);
    expect(getDuelVisualDisplay(br, 1, 1).showPlayerBonusActive).toBe(false);
    expect(getDuelVisualDisplay(br, 1, 2).showPlayerBonusActive).toBe(true);
  });

  it('fase 5 post step 1: stat intermedie post-duello', () => {
    const br = {
      ...battleResult,
      playerPower: 9,
      playerAgent: {
        ...battleResult.playerAgent,
        ability: { trigger: 'conquest', effect: 'power', value: 2 },
      },
      playerAbilityTriggered: true,
      visualSteps: [
        ...battleResult.visualSteps,
        {
          kind: 'postPower',
          side: 'player',
          playerPower: 9,
          enemyPower: 4,
          playerDamage: 3,
          enemyDamage: 2,
          highlightPlayerAbility: true,
          highlightEnemyAbility: false,
          highlightPlayerBonus: false,
          highlightEnemyBonus: false,
        },
      ],
    };
    const d = getDuelVisualDisplay(br, 5, 1);
    expect(d.playerPower).toBe(9);
    expect(d.highlightPlayerAbility).toBe(true);
    expect(d.pulsePlayerSide).toBe(true);
  });
});

describe('copia bonus/potere', () => {
  const brWithCopy = {
    ...battleResult,
    playerBonusCopied: { trigger: 'imboscata', description: 'Imboscata: +1 POT', effects: [] },
    visualSteps: [
      battleResult.visualSteps[0],
      {
        kind: 'copyBonus',
        side: 'player',
        playerPower: 5,
        enemyPower: 4,
        playerDamage: 3,
        enemyDamage: 2,
        highlightPlayerBonus: true,
        highlightEnemyBonus: false,
        highlightPlayerAbility: false,
        highlightEnemyAbility: false,
      },
      {
        kind: 'bonus',
        side: 'player',
        playerPower: 6,
        enemyPower: 4,
        playerDamage: 3,
        enemyDamage: 2,
        highlightPlayerBonus: true,
        highlightEnemyBonus: false,
        highlightPlayerAbility: false,
        highlightEnemyAbility: false,
      },
      battleResult.visualSteps[3],
    ],
  };

  it('fase 0: bonus copiato non visibile', () => {
    const d = getDuelVisualDisplay(brWithCopy, 0, 1);
    expect(d.showPlayerCopiedBonus).toBe(false);
    expect(d.copyPlayerBonusAnim).toBe(false);
  });

  it('step copyBonus: animazione copia, non highlight trigger', () => {
    const d = getDuelVisualDisplay(brWithCopy, 1, 1);
    expect(d.showPlayerCopiedBonus).toBe(true);
    expect(d.copyPlayerBonusAnim).toBe(true);
    expect(d.highlightPlayerBonus).toBe(false);
  });

  it('step bonus: highlight normale, no anim copia', () => {
    const d = getDuelVisualDisplay(brWithCopy, 1, 2);
    expect(d.showPlayerCopiedBonus).toBe(true);
    expect(d.copyPlayerBonusAnim).toBe(false);
    expect(d.highlightPlayerBonus).toBe(true);
  });
});

describe('copia potere non attivo', () => {
  const brCopyInactive = {
    ...battleResult,
    playerAbilityTriggered: true,
    playerAbilityCopied: { trigger: 'imboscata', effect: 'power', value: 2 },
    playerCopiedAbilityNotTriggered: true,
    visualSteps: [
      battleResult.visualSteps[0],
      {
        kind: 'copyAbility',
        side: 'player',
        playerPower: 5,
        enemyPower: 4,
        playerDamage: 3,
        enemyDamage: 2,
        highlightPlayerAbility: false,
        highlightEnemyAbility: false,
        highlightPlayerBonus: false,
        highlightEnemyBonus: false,
      },
      {
        kind: 'power',
        side: 'player',
        playerPower: 5,
        enemyPower: 4,
        playerDamage: 3,
        enemyDamage: 2,
        highlightPlayerAbility: true,
        highlightEnemyAbility: false,
        highlightPlayerBonus: false,
        highlightEnemyBonus: false,
      },
      battleResult.visualSteps[3],
    ],
  };

  it('potere copiato non attivo: flag visibile dopo step copia', () => {
    expect(getDuelVisualDisplay(brCopyInactive, 0, 1).showPlayerCopiedAbilityNotTriggered).toBe(
      false
    );
    expect(getDuelVisualDisplay(brCopyInactive, 1, 1).showPlayerCopiedAbilityNotTriggered).toBe(
      true
    );
    expect(getDuelVisualDisplay(brCopyInactive, 2, 1).showPlayerCopiedAbilityNotTriggered).toBe(
      true
    );
  });

  it('potere copiato non attivo: niente highlight, UI inattiva', () => {
    const d = getDuelVisualDisplay(brCopyInactive, 2, 1);
    expect(d.highlightPlayerAbility).toBe(false);
    expect(d.showPlayerCopiedAbility).toBe(true);
    expect(d.showPlayerCopiedAbilityNotTriggered).toBe(true);
  });
});

describe('copia bonus non attivo', () => {
  const brCopyBonusInactive = {
    ...battleResult,
    playerBonusCopied: {
      trigger: 'imboscata',
      description: 'Imboscata: +1 POT',
      effects: [{ effect: 'power', value: 1 }],
    },
    playerCopiedBonusNotTriggered: true,
    visualSteps: [
      battleResult.visualSteps[0],
      {
        kind: 'copyBonus',
        side: 'player',
        playerPower: 5,
        enemyPower: 4,
        playerDamage: 3,
        enemyDamage: 2,
        highlightPlayerBonus: false,
        highlightEnemyBonus: false,
        highlightPlayerAbility: false,
        highlightEnemyAbility: false,
      },
      battleResult.visualSteps[3],
    ],
  };

  it('bonus copiato non attivo: flag visibile dopo step copia', () => {
    expect(getDuelVisualDisplay(brCopyBonusInactive, 1, 1).showPlayerCopiedBonusNotTriggered).toBe(
      true
    );
    expect(getDuelVisualDisplay(brCopyBonusInactive, 1, 1).showPlayerCopiedBonus).toBe(true);
    expect(getDuelVisualDisplay(brCopyBonusInactive, 1, 1).highlightPlayerBonus).toBe(false);
  });
});

describe('copia bonus Conquista: niente spoiler pre-esito', () => {
  const brConquestCopy = {
    ...battleResult,
    playerHasBonus: true,
    playerBonusCopied: {
      trigger: 'conquest',
      description: 'Conquista: +2 FC',
      effects: [{ effect: 'focusCoin', value: 2 }],
    },
    playerCopiedBonusNotTriggered: true,
    visualSteps: [
      battleResult.visualSteps[0],
      {
        kind: 'copyBonus',
        side: 'player',
        playerPower: 5,
        enemyPower: 4,
        playerDamage: 3,
        enemyDamage: 2,
        highlightPlayerBonus: false,
        highlightEnemyBonus: false,
        highlightPlayerAbility: false,
        highlightEnemyAbility: false,
      },
      preVaStep,
      {
        kind: 'postBonus',
        side: 'player',
        playerPower: 5,
        enemyPower: 4,
        playerDamage: 3,
        enemyDamage: 2,
        highlightPlayerBonus: true,
        highlightEnemyBonus: false,
        highlightPlayerAbility: false,
        highlightEnemyAbility: false,
      },
    ],
  };

  it('fase 1: Conquista copiata neutra come nativo, niente highlight', () => {
    const d = getDuelVisualDisplay(brConquestCopy, 1, 1);
    expect(d.showPlayerCopiedBonus).toBe(true);
    expect(d.showPlayerCopiedBonusNotTriggered).toBe(false);
    expect(d.highlightPlayerBonus).toBe(false);
  });

  it('fase 4: Conquista copiata in attesa, non grigia', () => {
    const d = getDuelVisualDisplay(brConquestCopy, 4, 1);
    expect(d.highlightPlayerBonus).toBe(false);
    expect(d.showPlayerCopiedBonusNotTriggered).toBe(false);
  });

  it('fase 5 postBonus: highlight al reveal post-duello', () => {
    const d = getDuelVisualDisplay(brConquestCopy, 5, 1);
    expect(d.highlightPlayerBonus).toBe(true);
    expect(d.showPlayerCopiedBonusNotTriggered).toBe(false);
  });
});

describe('buildVaModProgressionLines', () => {
  it('righe incrementali da visualSteps', () => {
    const br = {
      ...battleResult,
      playerFocusUsed: 2,
      playerAssaultMod: 5,
      visualSteps: [
        battleResult.visualSteps[0],
        {
          ...battleResult.visualSteps[1],
          playerAssaultMod: 2,
        },
        {
          ...battleResult.visualSteps[2],
          playerAssaultMod: 5,
        },
        { ...preVaStep, playerAssaultMod: 5 },
      ],
    };
    const lines = buildVaModProgressionLines(br, true);
    expect(lines).toHaveLength(2);
    expect(lines[0].main).toBe('+2 mod VA');
    expect(lines[1].main).toBe('+3 mod VA');
  });
});
