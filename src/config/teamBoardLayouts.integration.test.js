/**
 * Versioni del tavolo 2v2: salvataggio nel browser, duplicazione, ripristino, importazione.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_TEAM_BOARD_LAYOUTS,
  deleteBoardLayout,
  duplicateBoardLayout,
  exportBoardLayouts,
  importBoardLayouts,
  loadBoardLayouts,
  readActiveBoardLayoutId,
  resetBoardLayout,
  saveBoardLayout,
  writeActiveBoardLayoutId,
} from './teamBoardLayouts.js';

function installFakeBrowser() {
  const store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe('teamBoardLayouts', () => {
  beforeEach(installFakeBrowser);

  it('senza modifiche restituisce le versioni predefinite e Ventaglio attiva', () => {
    const layouts = loadBoardLayouts();
    expect(Object.keys(layouts)).toEqual(Object.keys(DEFAULT_TEAM_BOARD_LAYOUTS));
    expect(layouts.ventaglio.slots.playerMate.r).toBe(9);
    expect(readActiveBoardLayoutId()).toBe('ventaglio');
  });

  it('salva una modifica e la ripristina', () => {
    const l = loadBoardLayouts().quattro;
    l.slots.playerMate.x = 1400;
    saveBoardLayout('quattro', l);
    expect(loadBoardLayouts().quattro.slots.playerMate.x).toBe(1400);
    resetBoardLayout('quattro');
    expect(loadBoardLayouts().quattro.slots.playerMate.x).toBe(DEFAULT_TEAM_BOARD_LAYOUTS.quattro.slots.playerMate.x);
  });

  it('duplica, attiva ed elimina una versione propria', () => {
    const id = duplicateBoardLayout('ventaglio', 'Mia');
    const layouts = loadBoardLayouts();
    expect(layouts[id]).toMatchObject({ name: 'Mia', custom: true, mode: 'all' });
    writeActiveBoardLayoutId(id);
    expect(readActiveBoardLayoutId()).toBe(id);
    deleteBoardLayout(id);
    expect(loadBoardLayouts()[id]).toBeUndefined();
    expect(readActiveBoardLayoutId()).toBe('ventaglio');
  });

  it('le versioni predefinite non si eliminano', () => {
    deleteBoardLayout('quattro');
    expect(loadBoardLayouts().quattro).toBeDefined();
  });

  it('esporta e reimporta', () => {
    duplicateBoardLayout('accanto', 'Esportata');
    const json = exportBoardLayouts();
    installFakeBrowser();
    const ids = importBoardLayouts(json);
    expect(ids).toContain('custom-1');
    expect(loadBoardLayouts()['custom-1'].name).toBe('Esportata');
    expect(() => importBoardLayouts('non json')).toThrow();
  });

  it('completa i campi mancanti delle versioni salvate', () => {
    window.localStorage.setItem('satze_2v2_board_layouts', JSON.stringify({ quattro: { name: 'Vecchia', slots: { playerMate: { x: 1 } } } }));
    const l = loadBoardLayouts().quattro;
    expect(l.name).toBe('Vecchia');
    expect(l.slots.playerMate).toMatchObject({ x: 1, s: 0.72 });
    expect(l.slots.enemyMain.x).toBe(DEFAULT_TEAM_BOARD_LAYOUTS.quattro.slots.enemyMain.x);
  });
});
