// Anteprima con componenti REALI del duello (StatsPanel, MiniBattlefield, Card) — dati finti, layout compatto

import React, { useMemo } from 'react';
import { StatsPanel } from '../ui/StatsPanel';
import { MiniBattlefield } from '../battle/MiniBattlefield';
import { CardReworkP4AsHtml } from '../cards/CardReworkP4AsHtml';
import { ALL_BATTLEFIELDS } from '../../data/battlefields';
import { ARMY_SETS } from '../../data/cards';
import { ARMY_COLORS } from '../../data/armies';
import { STYLELAB_STATS_SHELL, STYLELAB_ROUND_BOX, STYLELAB_STAGE_BG } from './styleLabShellStyles';

const DEMO_ARMY = "Figli dell'Orizzonte";

function getDemoAgent() {
  const raw = ARMY_SETS[DEMO_ARMY][2];
  return { ...raw, army: DEMO_ARMY };
}

export function StyleLabRealPreview({ themeId, large }) {
  const agent = useMemo(() => getDemoAgent(), []);
  const fields = useMemo(() => ALL_BATTLEFIELDS.slice(0, 5), []);

  const shell = STYLELAB_STATS_SHELL[themeId] || STYLELAB_STATS_SHELL.campaign;
  const roundBox = STYLELAB_ROUND_BOX[themeId] || STYLELAB_ROUND_BOX.campaign;
  const stageBg = STYLELAB_STAGE_BG[themeId] || STYLELAB_STAGE_BG.campaign;

  const scale = large ? 0.62 : 0.52;
  const stageW = 720;
  const stageH = 460;

  return (
    <div className={`sl-real-preview ${large ? 'sl-real-preview--large' : ''}`}>
      <div className="sl-real-preview__label">Anteprima duello — componenti di gioco</div>
      <p className="sl-real-preview__hint">
        Pannelli PV/FC e lista campi come nel duello; la carta è il P4 come il mock HTML (Rework Carte), con numeri
        POT/DAN ai colori di gioco. Ridimensionato; colori shell legati al tema sotto.
      </p>
      <div className="sl-real-preview__viewport">
        <div
          className="sl-real-preview__scaler"
          style={{
            width: stageW,
            height: stageH,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <div
            className="sl-real-preview__stage relative rounded-sm overflow-hidden"
            style={{
              width: stageW,
              height: stageH,
              background: stageBg,
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.35)',
            }}
          >
            <StatsPanel
              label="IA"
              hp={18}
              focus={4}
              position="top-left"
              gamePhase="selectAgent"
              styleOverride={shell}
              accentColor={ARMY_COLORS[DEMO_ARMY]?.accent}
            />
            <StatsPanel
              label="TU"
              hp={20}
              focus={5}
              position="bottom-right"
              gamePhase="selectAgent"
              styleOverride={shell}
              accentColor={ARMY_COLORS[DEMO_ARMY]?.accent}
            />

            <div
              className="absolute flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl pointer-events-none"
              style={{
                top: 18,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                background: roundBox.background,
                border: roundBox.border,
                fontFamily: roundBox.fontFamily,
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              <span className="font-bold text-sm uppercase tracking-wider" style={{ color: roundBox.colorRound }}>
                Round 3/5
              </span>
              <span className="text-xs" style={{ color: roundBox.colorSub }}>
                Tu inizi
              </span>
            </div>

            <div
              className="absolute left-1/2 -translate-x-1/2 top-[88px] w-[400px] space-y-0.5 pointer-events-none"
              style={{ zIndex: 5 }}
            >
              {fields.map((field, idx) => (
                <div key={field.id} className="h-9 min-h-[2.25rem]">
                  <MiniBattlefield
                    field={field}
                    selected={idx === 2}
                    conquered={idx === 0}
                    conqueredBy={idx === 0 ? DEMO_ARMY : undefined}
                    hidden={idx >= 3}
                    turnsUntilReveal={idx === 3 ? 1 : idx === 4 ? 2 : 0}
                  />
                </div>
              ))}
            </div>

            <div
              className="sl-stylelab-card-wrap absolute left-1/2 -translate-x-1/2 bottom-4 pointer-events-none"
              style={{ zIndex: 6, width: 230 }}
            >
              <CardReworkP4AsHtml agent={agent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
