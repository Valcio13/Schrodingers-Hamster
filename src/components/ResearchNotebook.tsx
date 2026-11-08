import React from 'react';
import {
  PlayerState,
  RESEARCH_UPGRADES,
  ResearchUpgrade,
  getMaxHybridCapacity,
  NOTE_COST_BATTERY_RECHARGE,
  NOTE_ENERGY_RECHARGE_AMOUNT,
  NOTE_COST_BREEDING_CHARGE,
  NOTE_COST_HABITAT_EXPANSION,
  MAX_BREEDING_CHARGES
} from '../types/game';
import { BookOpen, Check, Lock, Sparkles, Zap, Dna, Atom, Award, Plus, FlaskConical } from 'lucide-react';
import { audio } from '../services/audio';

interface ResearchNotebookProps {
  player: PlayerState;
  onUnlockUpgrade: (upgradeId: string) => Promise<void>;
  isUnlocking: boolean;
  onSynthesizeNotes?: (action: 'battery' | 'breeding_charge' | 'habitat_expansion') => Promise<void>;
  isSynthesizing?: boolean;
}

export const ResearchNotebook: React.FC<ResearchNotebookProps> = ({
  player,
  onUnlockUpgrade,
  isUnlocking,
  onSynthesizeNotes,
  isSynthesizing = false
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

      {/* Post-Doctoral Quantum Synthesis & Lab Mastery */}
      <div className="rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-b from-[#120d2a]/95 to-slate-950 p-5 space-y-4 shadow-xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-60 h-24 bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <FlaskConical className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-base">Quantum Synthesis & Lab Mastery</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 uppercase">
                  Endgame Research Sink
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Channel surplus scientific research notes into immediate reactor fuel or infinite colony expansion.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-700 text-purple-300 font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-yellow-300" />
              <span>Mastery Rank {player.researchMasteryLevel || 0}</span>
            </span>
          </div>
        </div>

        {/* 3 Synthesis Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Action 1: Battery Flash-Charge */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-between space-y-3 relative hover:border-amber-400/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1.5 border border-amber-500/40">
                  <Zap className="w-3.5 h-3.5" /> Energy Fuel
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {NOTE_COST_BATTERY_RECHARGE} Notes
                </span>
              </div>
              <h5 className="font-bold text-white text-sm">Emergency Battery Recharge</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Synthesize and inject +{NOTE_ENERGY_RECHARGE_AMOUNT} Battery Energy straight into your accumulator conduits.
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-1">
                Current: <strong className="text-amber-300">{Math.floor(player.batteryEnergy)}/{player.batteryCapacity} E</strong>
              </div>
            </div>

            <button
              onClick={() => onSynthesizeNotes && onSynthesizeNotes('battery')}
              disabled={isSynthesizing || player.researchInsight < NOTE_COST_BATTERY_RECHARGE || player.batteryEnergy >= player.batteryCapacity}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {player.batteryEnergy >= player.batteryCapacity
                  ? 'Battery Full'
                  : player.researchInsight < NOTE_COST_BATTERY_RECHARGE
                  ? `Need ${NOTE_COST_BATTERY_RECHARGE} Notes`
                  : `Inject +${NOTE_ENERGY_RECHARGE_AMOUNT} E`}
              </span>
            </button>
          </div>

          {/* Action 2: Synthesize Breeding Charge */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-pink-500/30 flex flex-col justify-between space-y-3 relative hover:border-pink-400/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 font-bold text-xs flex items-center gap-1.5 border border-pink-500/40">
                  <Dna className="w-3.5 h-3.5" /> Genetic Charge
                </span>
                <span className="text-xs font-mono font-bold text-pink-300">
                  {NOTE_COST_BREEDING_CHARGE} Notes
                </span>
              </div>
              <h5 className="font-bold text-white text-sm">Synthesize Breeding Charge</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Condense quantum data into 1 Stored Breeding Charge to incubate hybrids immediately even while Squeektoshi rests.
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-1">
                Stored Charges: <strong className="text-pink-300">{player.breedingCharges || 0}/{MAX_BREEDING_CHARGES}</strong>
              </div>
            </div>

            <button
              onClick={() => onSynthesizeNotes && onSynthesizeNotes('breeding_charge')}
              disabled={isSynthesizing || player.researchInsight < NOTE_COST_BREEDING_CHARGE || (player.breedingCharges || 0) >= MAX_BREEDING_CHARGES}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-500 hover:from-pink-500 hover:to-fuchsia-400 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {(player.breedingCharges || 0) >= MAX_BREEDING_CHARGES
                  ? 'Charges Full (3/3)'
                  : player.researchInsight < NOTE_COST_BREEDING_CHARGE
                  ? `Need ${NOTE_COST_BREEDING_CHARGE} Notes`
                  : 'Synthesize +1 Charge'}
              </span>
            </button>
          </div>

          {/* Action 3: Expand Colony Habitat (+1 Slot) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between space-y-3 relative hover:border-cyan-400/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center gap-1.5 border border-cyan-500/40">
                  <Sparkles className="w-3.5 h-3.5" /> Infinite Expansion
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {NOTE_COST_HABITAT_EXPANSION} Notes
                </span>
              </div>
              <h5 className="font-bold text-white text-sm">Expand Colony Habitat</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Permanently increases your total hybrid holding capacity by +1 slot. Unlocks limitless room for hybrid specimens!
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-1">
                Colony Capacity: <strong className="text-cyan-300">{(player.hybrids || []).filter(h => h.existenceStatus !== 'deceased').length} / {getMaxHybridCapacity(player)} Slots</strong>
              </div>
            </div>

            <button
              onClick={() => onSynthesizeNotes && onSynthesizeNotes('habitat_expansion')}
              disabled={isSynthesizing || player.researchInsight < NOTE_COST_HABITAT_EXPANSION}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {player.researchInsight < NOTE_COST_HABITAT_EXPANSION
                  ? `Need ${NOTE_COST_HABITAT_EXPANSION} Notes`
                  : 'Expand Habitat (+1 Slot)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
