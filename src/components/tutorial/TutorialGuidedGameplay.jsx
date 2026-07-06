import { useMemo, useState } from 'react';

function ActionButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-lg border text-sm transition-colors"
      style={{
        borderColor: active ? 'rgba(236, 72, 153, 0.7)' : 'rgba(148, 163, 184, 0.4)',
        background: active ? 'rgba(192, 38, 211, 0.18)' : 'rgba(17, 11, 32, 0.65)',
        color: active ? '#f5d0fe' : '#cbd5e1',
      }}
    >
      {children}
    </button>
  );
}

export function IntroGuidedGameplay() {
  const [selectedFc, setSelectedFc] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const playerPower = 4;
  const enemyPower = 3;
  const enemyFc = 3;
  const enemyVa = enemyPower * enemyFc;
  const playerVa = selectedFc ? playerPower * selectedFc : 0;

  const outcome = useMemo(() => {
    if (!confirmed || !selectedFc) return null;
    if (selectedFc === 3) {
      return {
        label: 'Linea consigliata',
        color: 'text-green-400',
        text: 'Vinco senza overcommit: trade FC positivo e pressione sostenibile.',
      };
    }
    if (selectedFc < 3) {
      return {
        label: 'Linea rischiosa',
        color: 'text-red-400',
        text: 'Sotto-investi: rischi di perdere campo e iniziativa.',
      };
    }
    return {
      label: 'Linea sub-ottimale',
      color: 'text-yellow-400',
      text: 'Vinci, ma spendi troppo: riduci opzioni nei round 4-5.',
    };
  }, [confirmed, selectedFc]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 bg-menu-panel/70 border-fuchsia-500/30">
        <p className="text-sm text-slate-300">
          Scenario: Round 2, campo neutro. Tu: POT 4 DAN 3. Nemico: POT 3. L’IA investe 3 FC.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Obiettivo guidato: vincere lo scontro con il minor investimento possibile.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-300">Scegli quanti FC investire:</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((fc) => (
            <ActionButton
              key={fc}
              active={selectedFc === fc}
              onClick={() => {
                setSelectedFc(fc);
                setConfirmed(false);
              }}
            >
              {fc} FC
            </ActionButton>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-slate-600/40 p-3 bg-black/20">
          <p className="text-slate-400">Il tuo VA</p>
          <p className="text-lg font-semibold text-fuchsia-200">{selectedFc ? playerVa : '-'}</p>
        </div>
        <div className="rounded-lg border border-slate-600/40 p-3 bg-black/20">
          <p className="text-slate-400">VA avversario</p>
          <p className="text-lg font-semibold text-red-300">{enemyVa}</p>
        </div>
      </div>

      <button
        type="button"
        disabled={!selectedFc}
        onClick={() => setConfirmed(true)}
        className="px-4 py-2 rounded-lg border text-sm"
        style={{
          borderColor: selectedFc ? 'rgba(236, 72, 153, 0.7)' : 'rgba(148, 163, 184, 0.4)',
          color: selectedFc ? '#f5d0fe' : '#94a3b8',
          background: selectedFc ? 'rgba(192, 38, 211, 0.18)' : 'rgba(17, 11, 32, 0.4)',
          cursor: selectedFc ? 'pointer' : 'not-allowed',
        }}
      >
        Conferma scelta
      </button>

      {outcome && (
        <div className="rounded-lg border border-fuchsia-500/30 p-3 bg-[#0c0818]/90">
          <p className={`font-semibold ${outcome.color}`}>{outcome.label}</p>
          <p className="text-sm text-slate-300 mt-1">{outcome.text}</p>
        </div>
      )}
    </div>
  );
}

export function AdvancedGuidedGameplay() {
  const [triggerChoice, setTriggerChoice] = useState('');
  const [economyChoice, setEconomyChoice] = useState('');
  const [evaluated, setEvaluated] = useState(false);

  const evaluation = useMemo(() => {
    if (!evaluated || !triggerChoice || !economyChoice) return null;

    const triggerOk = triggerChoice === 'pre';
    const economyOk = economyChoice === 'immediate';
    const score = Number(triggerOk) + Number(economyOk);

    if (score === 2) {
      return {
        level: 'Lettura ottima',
        color: 'text-green-400',
        lines: [
          'Validita tecnica: scegli trigger pre-duello, quindi impatto reale sul confronto corrente.',
          'Utilita reale: scegli valore spendibile subito (no dead value al round 5).',
          'Coerenza armata: linea convergente, non dipende da win-more.',
        ],
      };
    }

    if (score === 1) {
      return {
        level: 'Lettura parziale',
        color: 'text-yellow-400',
        lines: [
          'Una decisione e corretta, ma l altra perde valore nel timing attuale.',
          'Rivedi fase del trigger e spendibilita del vantaggio con maxRounds: 5.',
        ],
      };
    }

    return {
      level: 'Lettura da correggere',
      color: 'text-red-400',
      lines: [
        'Trigger post-duello non modifica il duello appena chiuso.',
        'Economia su ultima chance al round 5 tende a dead value se non spendibile subito.',
      ],
    };
  }, [evaluated, triggerChoice, economyChoice]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 bg-menu-panel/70 border-fuchsia-500/30">
        <p className="text-sm text-slate-300">
          Scenario: Round 5, duello decisivo. Devi scegliere linea tattica.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Valuta in ordine: fase trigger, bersaglio effettivo, spendibilita del valore.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-300">1) Quale effetto impatta il duello corrente?</p>
        <div className="flex flex-wrap gap-2">
          <ActionButton active={triggerChoice === 'pre'} onClick={() => { setTriggerChoice('pre'); setEvaluated(false); }}>
            Imboscata: -2 POT avv.
          </ActionButton>
          <ActionButton active={triggerChoice === 'post'} onClick={() => { setTriggerChoice('post'); setEvaluated(false); }}>
            Conquista: -2 POT avv.
          </ActionButton>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-300">2) Con maxRounds: 5, quale valore e piu utile ora?</p>
        <div className="flex flex-wrap gap-2">
          <ActionButton active={economyChoice === 'immediate'} onClick={() => { setEconomyChoice('immediate'); setEvaluated(false); }}>
            Bonus VA immediato
          </ActionButton>
          <ActionButton active={economyChoice === 'late'} onClick={() => { setEconomyChoice('late'); setEvaluated(false); }}>
            Ultima Chance: +3 FC
          </ActionButton>
        </div>
      </div>

      <button
        type="button"
        disabled={!triggerChoice || !economyChoice}
        onClick={() => setEvaluated(true)}
        className="px-4 py-2 rounded-lg border text-sm"
        style={{
          borderColor: triggerChoice && economyChoice ? 'rgba(236, 72, 153, 0.7)' : 'rgba(148, 163, 184, 0.4)',
          color: triggerChoice && economyChoice ? '#f5d0fe' : '#94a3b8',
          background: triggerChoice && economyChoice ? 'rgba(192, 38, 211, 0.18)' : 'rgba(17, 11, 32, 0.4)',
          cursor: triggerChoice && economyChoice ? 'pointer' : 'not-allowed',
        }}
      >
        Valuta decisione
      </button>

      {evaluation && (
        <div className="rounded-lg border border-fuchsia-500/30 p-3 bg-[#0c0818]/90">
          <p className={`font-semibold ${evaluation.color}`}>{evaluation.level}</p>
          <ul className="mt-2 text-sm text-slate-300 list-disc list-inside space-y-1">
            {evaluation.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
