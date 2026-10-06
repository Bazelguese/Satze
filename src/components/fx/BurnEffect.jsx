import React from 'react';
import { ElementFx } from './ElementFx.jsx';
import { burnEffect } from './effects/burn.js';

/**
 * Scorciatoia per la bruciatura: come <ElementFx effect={burnEffect}>, con `burning`
 * al posto di `active`. `params.flameColor` resta accettato come alias di `params.color`.
 */
export function BurnEffect({ burning = false, params, ...rest }) {
  const merged = params?.flameColor && !params.color ? { ...params, color: params.flameColor } : params;
  return <ElementFx effect={burnEffect} active={burning} params={merged} {...rest} />;
}
