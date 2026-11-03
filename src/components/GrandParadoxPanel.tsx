import React from 'react';
import { PlayerState } from '../types/game';
import { PixelHamster } from './PixelHamster';
import { Crown, Sparkles, Check, Lock, Zap, ArrowRight } from 'lucide-react';
import { audio } from '../services/audio';

interface GrandParadoxPanelProps {
  player: PlayerState;
  onTriggerGrandParadox: () => Promise<void>;
  isStarting: boolean;
  onContinue?: () => void;
}

export const GrandParadoxPanel: React.FC<GrandParadoxPanelProps> = ({
  player,
  onTriggerGrandParadox,
  isStarting,
  onContinue
}) => {
  const isBlueprintUnlocked = player.unlockedResearch.includes('grand_paradox_blueprint');
  const isLabLvl3 = player.labLevel >= 3;
  const hasRequiredSpecies = Object.keys(player.discoveredHamsters).length >= 4;
  const hasEnergy = player.batteryEnergy >= 150;

  const allReqsMet = isBlueprintUnlocked && isLabLvl3 && hasRequiredSpecies && hasEnergy;
  const isCompleted = player.completedGrandParadox;

  return (
    <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border-2 border-purple-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative Quantum Background Flecks */}
      <div className="absolute -top-6 -right-6 p-8 text-8xl opacity-10 pointer-events-none select-none">
        ⚛️
      </div>

      {isCompleted ? (
        /* Completed State: THE GRAND PARADOX — RESOLVED */
        <div className="relative z-10 flex flex-col items-center text-center space-y-5 py-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-500/20 border-2 border-lime-400 text-lime-300 text-xs font-mono font-bold uppercase shadow-[0_0_15px_rgba(163,230,53,0.3)]">
            <Crown className="w-4 h-4 text-lime-400 animate-pulse" />
            ★ THE GRAND PARADOX — RESOLVED ★
          </div>

          <div className="space-y-2 max-w-lg">
            <h3 className="text-2xl sm:text-3xl font-black font-fredoka text-white tracking-wide">
              Reality has been successfully questioned.
            </h3>
            <p className="text-sm text-purple-200 font-mono italic">
              The laboratory will never be quite the same.
            </p>
          </div>

          {/* Paradox Hamster Hero Frame */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border-2 border-purple-400/80 shadow-[0_0_30px_rgba(192,132,252,0.3)] flex flex-col items-center gap-3 anim-mythic-cosmic">
            <PixelHamster speciesId="paradox" size="hero" isRunning />
            <div>
              <div className="font-black font-fredoka text-lime-400 text-lg">
                ⚡ PARADOX HAMSTER OBSERVED ⚡
              </div>
              <div className="text-xs text-slate-300 font-mono mt-1">
                Entity permanently stabilized in laboratory spacetime
              </div>
            </div>

            {/* Permanent Passive Rewards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-700/60 text-purple-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+2 Battery Energy / 10s</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-700/60 text-purple-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>+2 Research Notes / 10s</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => {
              audio.playClick();
              if (onContinue) onContinue();
            }}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 font-black font-fredoka text-sm shadow-xl hover:shadow-lime-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>CONTINUE RESEARCH & BREEDING</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Uncompleted State: Conduct The Grand Paradox (Final Quantum Experiment) */
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400 text-purple-300 text-xs font-mono font-bold uppercase">
              <Crown className="w-3.5 h-3.5 text-lime-400" />
              ★ ULTIMATE PROGRESSION GOAL ★
            </div>

            <h3 className="text-2xl font-bold font-fredoka text-white">
              Conduct The Grand Paradox (Final Quantum Experiment)
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              The culmination of all quantum hamster research. Synchronize all laboratory conduits to collapse the cosmic superposition and observe the legendary Paradox Hamster.
            </p>

            {/* Requirements Checklist */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${isLabLvl3 ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'}`}>
                {isLabLvl3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Lab Level 3 (Quantum)</span>
              </div>

              <div className={`flex items-center gap-2 p-2 rounded-lg border ${isBlueprintUnlocked ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'}`}>
                {isBlueprintUnlocked ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Grand Blueprint Research</span>
              </div>

              <div className={`flex items-center gap-2 p-2 rounded-lg border ${hasRequiredSpecies ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'}`}>
                {hasRequiredSpecies ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5" />}
                <span>4+ Species Discovered ({Object.keys(player.discoveredHamsters).length}/4)</span>
              </div>

              <div className={`flex items-center gap-2 p-2 rounded-lg border ${hasEnergy ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'}`}>
                {hasEnergy ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5" />}
                <span>150 Battery Energy ({Math.floor(player.batteryEnergy)}/150)</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            <button
              onClick={() => {
                audio.playZap();
                onTriggerGrandParadox();
              }}
              disabled={!allReqsMet || isStarting || !!player.activeExperiment}
              className={`px-8 py-4 rounded-2xl font-bold font-fredoka text-base shadow-2xl transition-all transform flex items-center gap-2 ${
                allReqsMet && !player.activeExperiment
                  ? 'bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 hover:from-lime-300 hover:to-cyan-300 text-slate-950 shadow-lime-500/30 hover:-translate-y-1 active:translate-y-0 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>INITIATE EXPERIMENT</span>
            </button>
            <span className="block text-[11px] text-slate-400 font-mono">
              Cost: 150 Battery Energy • Duration: 20s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
