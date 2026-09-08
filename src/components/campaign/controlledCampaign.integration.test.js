// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CampaignEventEditor } from './CampaignEventEditor.jsx';
import { ControlledCampaignHub } from './ControlledCampaignHub.jsx';
import { CampaignSaveSlots } from './CampaignSaveSlots.jsx';
import { CONTROLLED_CAMPAIGN } from '../../campaign/data/controlledCampaign.js';
import { createControlledRun } from '../../campaign/state/controlledCampaignState.js';
import {
  loadCampaignRun,
  saveCampaignRun,
} from '../../campaign/state/persistence.js';
import { loadCampaignDefinition } from '../../campaign/logic/campaignDefinition.js';
import { buildDuelConfig } from '../../campaign/logic/missionAdapter.js';
import { useGameFlow } from '../../hooks/useGameFlow.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
let host, root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const render = (el) => act(() => root.render(el));
const button = (text) =>
  [...host.querySelectorAll('button')].find(
    (b) => b.textContent.trim() === text,
  );
const click = (text) => {
  const b = button(text);
  expect(b).toBeTruthy();
  act(() => b.click());
};
it('Editor sposta un evento in Atto III e conserva la run esistente', () => {
  saveCampaignRun(createControlledRun(CONTROLLED_CAMPAIGN), 0);
  render(React.createElement(CampaignEventEditor, { onBack: vi.fn() }));
  const select = host.querySelector('select'),
    target = CONTROLLED_CAMPAIGN.acts[2].stages[5].alternatives[0].id;
  act(() => {
    select.value = target;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  click('Salva distribuzione');
  expect(loadCampaignDefinition().events[0].missionId).toBe(target);
  expect(loadCampaignRun(0).definition.events[0].missionId).not.toBe(target);
  expect(host.querySelector('[role=status]').textContent).toContain(
    'Distribuzione salvata',
  );
});
it('Menu crea una run; hub lancia il vero useGameFlow con Nascente ed Eminenza', () => {
  const chosen = vi.fn();
  render(
    React.createElement(CampaignSaveSlots, {
      onSlotChosen: chosen,
      onBack: vi.fn(),
    }),
  );
  click('Nuova campagna');
  click('Inizia il cammino');
  expect(chosen).toHaveBeenCalledWith(0);
  const setters = {},
    state = new Proxy({}, { get: (_, key) => (setters[key] ||= vi.fn()) });
  function GameHarness() {
    const flow = useGameFlow(state);
    return React.createElement(ControlledCampaignHub, {
      campaignSaveSlot: 0,
      onBack: vi.fn(),
      onStartMission: (mission, run) => {
        const cfg = buildDuelConfig(mission, run);
        flow.startGame(
          cfg.playerArmy,
          cfg.playerDeckCards,
          'campaign',
          cfg.difficulty,
          ALL_BATTLEFIELDS,
          cfg.enemyArmy,
          cfg.enemyDeckIds,
          cfg.campaignDuelMod,
          cfg.startOptions,
        );
      },
    });
  }
  render(React.createElement(GameHarness));
  expect(host.textContent).toContain('Oltre il Vallo');
  click('Affronta l’incontro');
  expect(host.querySelector('[role=alert]')).toBeNull();
  expect(setters.setGamePhase).toHaveBeenLastCalledWith('duelLoading');
  expect(setters.setPlayerHP).toHaveBeenLastCalledWith(25);
  expect(setters.setPlayerFocus).toHaveBeenLastCalledWith(18);
  const setup = setters.setShuffleDealSetup.mock.calls.at(-1)[0];
  expect(setup.playerHand).toHaveLength(5);
  expect(setup.playerHand.some((c) => c.id === 9001)).toBe(true);
  expect(setup.enemyHand.every((c) => c.campaignOnly)).toBe(true);
  const eminences = setters.setEminenceMatchState.mock.calls.at(-1)[0];
  expect(eminences.enemy.eminenceId).toBe('concordia_campane_vallo');
  expect(eminences.enemy.presence).toBe(1);
});
it('Configurazione corrotta segnala errore e consente il ripristino esplicito', () => {
  localStorage.setItem('satze_campaign_editor_v1', '{');
  render(React.createElement(CampaignEventEditor, { onBack: vi.fn() }));
  expect(host.querySelector('[role=alert]').textContent).toContain(
    'non leggibile',
  );
  click('Salva distribuzione');
  expect(loadCampaignDefinition().acts).toHaveLength(3);
});
