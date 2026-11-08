// @vitest-environment jsdom
/**
 * Uscite animate: il popup resta montato per la durata dell'uscita e poi si
 * smonta; con «Riduci animazioni» si chiude subito.
 */
import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePresence, useLeaveThen } from './usePresence.js';

const h = React.createElement;

let host, root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  document.documentElement.classList.remove('satze-reduce-motion');
});

function Presence({ value }) {
  const p = usePresence(value, 200);
  return p.present ? h('div', { className: p.leaving ? 'pop leaving' : 'pop' }, p.value?.label) : null;
}
const render = (el) => act(() => root.render(h(StrictMode, null, el)));
const pop = () => host.querySelector('.pop');

it('usePresence: resta in scena con l’ultimo contenuto durante l’uscita, poi si smonta', () => {
  render(h(Presence, { value: { label: 'Riepilogo' } }));
  expect(pop().className).toBe('pop');
  render(h(Presence, { value: null }));
  expect(pop().className).toBe('pop leaving');
  expect(pop().textContent).toBe('Riepilogo');
  act(() => vi.advanceTimersByTime(199));
  expect(pop()).toBeTruthy();
  act(() => vi.advanceTimersByTime(1));
  expect(pop()).toBeNull();
});

it('usePresence: riaprire durante l’uscita annulla lo smontaggio', () => {
  render(h(Presence, { value: { label: 'A' } }));
  render(h(Presence, { value: null }));
  act(() => vi.advanceTimersByTime(100));
  render(h(Presence, { value: { label: 'B' } }));
  act(() => vi.advanceTimersByTime(500));
  expect(pop().className).toBe('pop');
  expect(pop().textContent).toBe('B');
});

it('usePresence: chiuso dall’inizio non monta nulla', () => {
  render(h(Presence, { value: null }));
  act(() => vi.advanceTimersByTime(500));
  expect(pop()).toBeNull();
});

it('usePresence: con «Riduci animazioni» si smonta subito', () => {
  document.documentElement.classList.add('satze-reduce-motion');
  render(h(Presence, { value: { label: 'A' } }));
  render(h(Presence, { value: null }));
  expect(pop()).toBeNull();
});

function Leave({ onClose }) {
  const [leaving, requestClose] = useLeaveThen(onClose, 300);
  return h('button', { type: 'button', className: leaving ? 'leaving' : '', onClick: () => requestClose('esc') }, 'x');
}

it('useLeaveThen: chiama onClose a uscita finita, una volta sola', () => {
  const onClose = vi.fn();
  render(h(Leave, { onClose }));
  const button = host.querySelector('button');
  act(() => button.click());
  act(() => button.click());
  expect(button.className).toBe('leaving');
  expect(onClose).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(300));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledWith('esc');
});

it('useLeaveThen: con «Riduci animazioni» chiude subito', () => {
  document.documentElement.classList.add('satze-reduce-motion');
  const onClose = vi.fn();
  render(h(Leave, { onClose }));
  act(() => host.querySelector('button').click());
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('useLeaveThen: smontato durante l’uscita non chiama più onClose', () => {
  const onClose = vi.fn();
  render(h(Leave, { onClose }));
  act(() => host.querySelector('button').click());
  render(null);
  act(() => vi.advanceTimersByTime(500));
  expect(onClose).not.toHaveBeenCalled();
});
