// ============================================
// ARTIFACT DISPLAY - Visualizza artefatti raccolti
// ============================================

import React from 'react';
import { ARTIFACT_CATEGORIES } from '../../data/artifacts';

export default function ArtifactDisplay({ artifacts, compact = false }) {
  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="text-slate-400 text-sm text-center py-2">
        Nessun artefatto
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {artifacts.map((artifact, idx) => {
          const categoryInfo = ARTIFACT_CATEGORIES[artifact.category] || ARTIFACT_CATEGORIES.neutral;
          return (
            <div
              key={artifact.id || idx}
              className={`px-2 py-1 rounded text-xs border ${
                categoryInfo.color === 'red' ? 'bg-red-900/30 border-red-500/50 text-red-300' :
                categoryInfo.color === 'orange' ? 'bg-orange-900/30 border-orange-500/50 text-orange-300' :
                categoryInfo.color === 'blue' ? 'bg-blue-900/30 border-blue-500/50 text-blue-300' :
                categoryInfo.color === 'green' ? 'bg-green-900/30 border-green-500/50 text-green-300' :
                'bg-purple-900/30 border-purple-500/50 text-purple-300'
              }`}
              title={artifact.description || artifact.name}
            >
              {categoryInfo.icon} {artifact.name}
            </div>
          );
        })}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {artifacts.map((artifact, idx) => {
        const categoryInfo = ARTIFACT_CATEGORIES[artifact.category] || ARTIFACT_CATEGORIES.neutral;
        const categoryColor = categoryInfo.color;
        
        return (
          <div
            key={artifact.id || idx}
            className={`p-4 rounded-lg border-2 ${
              categoryColor === 'red' ? 'bg-red-900/20 border-red-500/50' :
              categoryColor === 'orange' ? 'bg-orange-900/20 border-orange-500/50' :
              categoryColor === 'blue' ? 'bg-blue-900/20 border-blue-500/50' :
              categoryColor === 'green' ? 'bg-green-900/20 border-green-500/50' :
              'bg-purple-900/20 border-purple-500/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`text-2xl ${categoryColor === 'red' ? 'text-red-400' : categoryColor === 'orange' ? 'text-orange-400' : categoryColor === 'blue' ? 'text-blue-400' : categoryColor === 'green' ? 'text-green-400' : 'text-purple-400'}`}>
                {categoryInfo.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-white">{artifact.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    categoryColor === 'red' ? 'bg-red-500/30 text-red-300' :
                    categoryColor === 'orange' ? 'bg-orange-500/30 text-orange-300' :
                    categoryColor === 'blue' ? 'bg-blue-500/30 text-blue-300' :
                    categoryColor === 'green' ? 'bg-green-500/30 text-green-300' :
                    'bg-purple-500/30 text-purple-300'
                  }`}>
                    {categoryInfo.name}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{artifact.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
