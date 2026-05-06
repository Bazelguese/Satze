import React, { useState, useCallback } from 'react';
import { Icon } from '../ui/Icon';
import { FIELD_STYLES } from '../../utils';
import { ALL_BATTLEFIELDS, getBattlefieldAnimationType } from '../../data';
import { BattlefieldReveal } from './BattlefieldRevealAnimations';

/**
 * Griglia campi di battaglia + anteprima.
 */
export function BattlefieldGallery() {
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const selectedField = selectedFieldId != null
    ? ALL_BATTLEFIELDS.find(f => f.id === selectedFieldId) ?? null
    : null;

  const handleSelect = useCallback((fieldId) => {
    setSelectedFieldId(fieldId);
  }, []);

  return (
    <div className="flex flex-col gap-6 min-h-0 h-full overflow-hidden">
      {/* Anteprima in alto - fissa, non scrolla */}
      <div
        key={`preview-${selectedFieldId ?? 'none'}`}
        className="flex-shrink-0 w-full max-w-md mx-auto rounded-xl overflow-hidden border-2 transition-all duration-300 bg-[#110b20]"
        style={{
          borderColor: selectedField ? 'rgba(192, 38, 211, 0.65)' : 'rgba(74, 63, 102, 0.55)',
          aspectRatio: '16/9',
        }}
      >
        {selectedField?.bgImage ? (
          <div key={selectedField.id} className="w-full h-full relative overflow-hidden">
            <BattlefieldReveal
              imageSrc={selectedField.bgImage}
              animationType={getBattlefieldAnimationType(selectedField.id)}
            />
          </div>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center text-slate-500"
            style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}
          >
            <Icon name="tower" type="cardIcon" size={48} />
            <p className="text-sm mt-2">Clicca su un campo</p>
            <p className="text-xs">per vedere l&apos;anteprima</p>
          </div>
        )}
        {selectedField && (
          <div
            key={selectedField.id}
            className="px-3 py-2 text-center animate-fade-in"
            style={{ background: 'rgba(15, 23, 42, 0.95)' }}
          >
            <p className="text-fuchsia-400 font-bold text-sm">{selectedField.name}</p>
            <p className="text-slate-400 text-xs">{selectedField.effect}</p>
          </div>
        )}
      </div>
      {/* Griglia in contenitore scroll - i bottoni restano sotto l'anteprima, mai sopra */}
      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden satze-hide-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
        {ALL_BATTLEFIELDS.map((field) => {
          const fieldStyle = FIELD_STYLES[field.id] || {};
          const isSelected = selectedField?.id === field.id;
          return (
            <div
              key={field.id}
              role="button"
              tabIndex={0}
              className={`relative w-full text-left border rounded-xl p-4 transition-all overflow-hidden cursor-pointer bg-transparent ${
                isSelected ? 'border-fuchsia-500/80 ring-2 ring-fuchsia-500/35' : 'border-slate-600/60 hover:border-fuchsia-500/45'
              }`}
              onPointerDown={() => handleSelect(field.id)}
              onClick={() => handleSelect(field.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(field.id);
                }
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: fieldStyle.gradient || 'linear-gradient(135deg, #1e293b, #0f172a)',
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 30% 30%, ${fieldStyle.glow || 'rgba(100,100,100,0.2)'} 0%, transparent 60%)`,
                }}
              />
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex items-center justify-center drop-shadow-lg flex-shrink-0">
                  <Icon name={field.icon} type="cardIcon" size={36} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base mb-0.5 drop-shadow-md truncate">{field.name}</h3>
                  <p className="text-amber-300 text-xs mb-2 drop-shadow-sm">{field.effect}</p>
                  {field.flavour && (
                    <p className="text-slate-300 text-[10px] italic line-clamp-2">"{field.flavour}"</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
