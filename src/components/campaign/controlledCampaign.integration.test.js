// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CampaignEventEditor } from './CampaignEventEditor.jsx';
import { ControlledCampaignHub } from './ControlledCampaignHub.jsx';
import { CampaignSaveSlots } from './CampaignSaveSlots.jsx';
import { CONTROLLED_CAMPAIGN } from '../../campaign/data/controlledCampaign.js';
import { createControlledRun, controlledCampaignReducer, currentStage } from '../../campaign/state/controlledCampaignState.js';
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
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('Ingresso saltabile: un clic e il timer non avviano due duelli', () => {
  vi.useFakeTimers();
  saveCampaignRun(createControlledRun(CONTROLLED_CAMPAIGN), 0);
  const launch = vi.fn();
  render(React.createElement(ControlledCampaignHub, { onStartMission: launch, onBack: vi.fn() }));
  click('Affronta l’incontro');
  expect(launch).not.toHaveBeenCalled();
  expect(loadCampaignRun(0).activeAttempt).toBe(1);
  click('Entra subito');
  act(() => vi.advanceTimersByTime(1000));
  expect(launch).toHaveBeenCalledTimes(1);
});

it('Ingresso automatico recupera un errore di avvio senza lasciare il tentativo bloccato', () => {
  vi.useFakeTimers();
  saveCampaignRun(createControlledRun(CONTROLLED_CAMPAIGN), 0);
  const launch = vi.fn(() => { throw new Error('Duello non disponibile'); });
  render(React.createElement(ControlledCampaignHub, { onStartMission: launch, onBack: vi.fn() }));
  click('Affronta l’incontro');
  act(() => vi.advanceTimersByTime(650));
  expect(launch).toHaveBeenCalledTimes(1);
  expect(loadCampaignRun(0).currentNode).toBeNull();
  expect(host.querySelector('[role=alert]').textContent).toContain('Duello non disponibile');
  expect(button('Affronta l’incontro').disabled).toBe(false);
});

it('La preferenza animazioni persiste e il movimento ridotto di sistema prevale', () => {
  saveCampaignRun(createControlledRun(CONTROLLED_CAMPAIGN), 0);
  render(React.createElement(ControlledCampaignHub, { onStartMission: vi.fn(), onBack: vi.fn() }));
  click('Animazioni: sì');
  expect(localStorage.getItem('satze_campaign_motion_v1')).toBe('off');
  expect(host.querySelector('.campaign-scene').classList.contains('cs-motion-off')).toBe(true);
  click('Animazioni: no');
  render(null);
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  render(React.createElement(ControlledCampaignHub, { onStartMission: vi.fn(), onBack: vi.fn() }));
  expect(button('Animazioni: no').disabled).toBe(true);
  expect(host.querySelector('.campaign-scene').classList.contains('cs-motion-off')).toBe(true);
});

const winStage = run => {
  const started = controlledCampaignReducer(run, { type: 'START_MISSION', nodeId: currentStage(run).alternatives[0].id });
  return controlledCampaignReducer(started, { type: 'APPLY_DUEL_RESULT', nodeId: started.currentNode, attempt: started.activeAttempt, winner: 'player' });
};

it('Il bivio sulla mappa seleziona l’armata speciale e tiene bloccati élite e boss', () => {
  let run = createControlledRun(CONTROLLED_CAMPAIGN);
  run = winStage(winStage(run));
  while (run.pendingEvents.length) run = controlledCampaignReducer(run, { type: 'APPLY_EVENT_CHOICE', eventId: run.pendingEvents[0], choiceIndex: 1 });
  expect(run.stageIndex).toBe(2);
  saveCampaignRun(run, 0);
  const launch = vi.fn();
  render(React.createElement(ControlledCampaignHub, { onStartMission: launch, onBack: vi.fn() }));
  const map = host.querySelector('[aria-label="Percorso dell’atto"]');
  const enabled = [...map.querySelectorAll('button')].filter(b => !b.disabled);
  expect(enabled).toHaveLength(2);
  const special = enabled.find(b => b.getAttribute('aria-label').includes('Corte Rossa'));
  act(() => special.click());
  expect(special.getAttribute('aria-pressed')).toBe('true');
  expect(host.querySelector('[aria-label="Incontro selezionato"]').textContent).toContain('Corte Rossa');
  click('Affronta l’incontro');
  click('Entra subito');
  expect(launch.mock.calls[0][0].enemy.army).toBe('Corte Rossa');
});

it('Ricognizione mostra le carte reali e restituisce il focus con Escape', () => {
  saveCampaignRun(createControlledRun(CONTROLLED_CAMPAIGN), 0);
  render(React.createElement(ControlledCampaignHub, { onStartMission: vi.fn(), onBack: vi.fn() }));
  const inspect = [...host.querySelectorAll('button')].find(b => b.textContent.includes('Esamina l’armata'));
  inspect.focus();
  act(() => inspect.click());
  const dialog = host.querySelector('[role="dialog"]');
  expect(dialog.textContent).toContain('Scudiero del Vallo');
  expect(dialog.contains(document.activeElement)).toBe(true);
  act(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })));
  expect(dialog.contains(document.activeElement)).toBe(true);
  act(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(host.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(inspect);
});

it('L’evento illustrato assegna la carta alla riserva e l’armata salva la sostituzione', () => {
  const run = winStage(winStage(createControlledRun(CONTROLLED_CAMPAIGN)));
  expect(run.pendingEvents).toHaveLength(1);
  saveCampaignRun(run, 0);
  render(React.createElement(ControlledCampaignHub, { onStartMission: vi.fn(), onBack: vi.fn() }));
  expect(button('Affronta l’incontro')).toBeUndefined();
  const event = host.querySelector('[aria-label="Evento da risolvere"]');
  expect(event.querySelector('img')).toBeTruthy();
  const reward = [...event.querySelectorAll('button')].find(b => b.textContent.includes('Accogli il Figlio'));
  act(() => reward.click());
  expect(loadCampaignRun(0).warehouse).toContain(113);
  expect(host.querySelector('[role=dialog]').textContent).toContain('Un nuovo compagno');
  click('Continua il cammino');
  expect(host.querySelector('[aria-label="Evento da risolvere"]')).toBeNull();
  click('Armata e Nascente');
  const checks = [...host.querySelectorAll('input[type="checkbox"]')];
  expect(checks).toHaveLength(11);
  expect(checks[0].disabled).toBe(true);
  act(() => checks[1].click());
  act(() => checks.at(-1).click());
  click('Salva armata');
  expect(loadCampaignRun(0).deck).toContain(113);
  expect(loadCampaignRun(0).warehouse).toContain(107);
  expect(host.querySelector('[aria-label="Percorso dell’atto"]')).toBeTruthy();
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
it('Il vecchio hub continua a lanciare useGameFlow con Nascente ed Eminenza', () => {
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
  saveCampaignRun(createControlledRun(CONTROLLED_CAMPAIGN), 0);
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
  click('Entra subito');
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
