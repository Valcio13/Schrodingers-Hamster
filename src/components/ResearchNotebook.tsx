import React from 'react';
import { PlayerState, RESEARCH_UPGRADES, ResearchUpgrade } from '../types/game';
import { BookOpen, Check, Lock, Sparkles, Zap, Dna, Atom } from 'lucide-react';
import { audio } from '../services/audio';

interface ResearchNotebookProps {
  player: PlayerState;
  onUnlockUpgrade: (upgradeId: string) => Promise<void>;
  isUnlocking: boolean;
}

export const ResearchNotebook: React.FC<ResearchNotebookProps> = ({
  player,
  onUnlockUpgrade,
  isUnlocking
}) => {
  const branches = [
    {
      id: 'engineering',
      name: 'Engineering',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      color: 'amber',
      desc: 'Battery storage capacity and electrical efficiency'
    },
    {
      id: 'biology',
      name: 'Biology',
      icon: <Dna className="w-4 h-4 text-emerald-400" />,
      color: 'emerald',
      desc: 'Quantum nutrition, assistant perks and habitat upgrades'
    },
    {
      id: 'quantum',
      name: 'Quantum Physics',
      icon: <Atom className="w-4 h-4 text-purple-400" />,
      color: 'purple',
      desc: 'Wavefunction manipulation, paradox chambers and the climax'
    }
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base font-sans">Research Notebook</h3>
            <p className="text-xs text-slate-400">Unlock lab expansions, species, and quantum milestones</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800 font-mono">
          <span className="text-xs text-cyan-400 uppercase font-sans font-bold">Research Notes:</span>
          <span className="text-sm font-bold text-white">{player.researchInsight}</span>
        </div>
      </div>

      {/* 3 Research Branches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {branches.map(branch => {
          const upgrades = RESEARCH_UPGRADES.filter(u => u.branch === branch.id);

          return (
            <div key={branch.id} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                {branch.icon}
                <div>
                  <h4 className="font-bold text-white text-sm">{branch.name}</h4>
                  <p className="text-[11px] text-slate-400">{branch.desc}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {upgrades.map(upgrade => {
                  const isUnlocked = player.unlockedResearch.includes(upgrade.id);
                  const isPrereqMet = !upgrade.prerequisiteId || player.unlockedResearch.includes(upgrade.prerequisiteId);
                  const canAfford = player.researchInsight >= upgrade.cost;

                  return (
                    <div
                      key={upgrade.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isUnlocked
                          ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-300'
                          : isPrereqMet
                          ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-900 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{upgrade.icon}</span>
                          <span className="font-bold text-white text-xs leading-snug">
                            {upgrade.name}
                          </span>
                        </div>
                        {isUnlocked ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-cyan-300">
                            {upgrade.cost} Notes
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {upgrade.description}
                      </p>

                      {!isUnlocked && (
                        <button
                          onClick={() => {
                            audio.playClick();
                            onUnlockUpgrade(upgrade.id);
                          }}
                          disabled={!isPrereqMet || !canAfford || isUnlocking}
                          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            !isPrereqMet
                              ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                              : canAfford
                              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {!isPrereqMet ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Prerequisite Needed</span>
                            </>
                          ) : canAfford ? (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Unlock Upgrade</span>
                            </>
                          ) : (
                            <span>Need {upgrade.cost} Notes</span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
