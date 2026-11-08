import React, { useState, useEffect } from 'react';
import {
  PlayerState,
  HAMSTER_SPECIES,
  QuantumHybrid,
  HybridStatePreview,
  ActiveIncubationState,
  WORK_PER_BREEDING_CHARGE,
  MAX_BREEDING_CHARGES,
  MAX_HYBRID_CAPACITY,
  getMaxHybridCapacity,
  NOTE_COST_BREEDING_CHARGE,
  LIVE_BREEDING_COOLDOWN_MS
} from '../types/game';
import { SqueekTelemetry } from '../../worker/squeekchain';
import { PixelHamster } from './PixelHamster';
import { PixelHybridHamster } from './PixelHybridHamster';
import {
  Dna,
  Zap,
  Sparkles,
  Eye,
  Check,
  Clock,
  Activity,
  Heart,
  ArrowRight,
  ShieldAlert,
  Flame,
  Award
} from 'lucide-react';
import { audio } from '../services/audio';
import confetti from 'canvas-confetti';

interface QuantumIncubatorProps {
  player: PlayerState;
  telemetry: SqueekTelemetry | null;
  onStartIncubation: (p1: string, p2: string) => Promise<void>;
  onGhostSight: (target: 'A' | 'B') => Promise<void>;
  onRevealIncubation: (chosenState: 'A' | 'B') => Promise<{ hybrid: QuantumHybrid; chosenState: 'A' | 'B' }>;
  onRenameHybrid: (hybridId: string, nickname: string) => Promise<void>;
  onSetLabDisplay: (hybridId: string | null) => Promise<void>;
  onViewInDex?: () => void;
  isStarting?: boolean;
  onQuickDevAddCharge?: () => void;
  onOpenDevTools?: () => void;
  onSynthesizeCharge?: () => Promise<void>;
  isSynthesizing?: boolean;
}

export const QuantumIncubator: React.FC<QuantumIncubatorProps> = ({
  player,
  telemetry,
  onStartIncubation,
  onGhostSight,
  onRevealIncubation,
  onRenameHybrid,
  onSetLabDisplay,
  onViewInDex,
  isStarting = false,
  onQuickDevAddCharge,
  onOpenDevTools,
  onSynthesizeCharge,
  isSynthesizing = false
}) => {
  const discoveredSpeciesIds = Object.keys(player.discoveredHamsters || {});
  const eligibleHybridParents = (player.hybrids || []).filter(
    (h) => h.existenceStatus === 'alive' && (h.generation === 1 || !h.generation)
  );

  // Parent selections (defaults to first two discovered species)
  const [parent1, setParent1] = useState<string>(discoveredSpeciesIds[0] || 'normal');
  const [parent2, setParent2] = useState<string>(discoveredSpeciesIds[1] || discoveredSpeciesIds[0] || 'normal');

  const getParentInfo = (id: string) => {
    if (HAMSTER_SPECIES[id]) {
      const spec = HAMSTER_SPECIES[id];
      return {
        id,
        name: spec.name,
        isBase: true,
        generation: 1,
        rarity: spec.rarity,
        title: spec.title,
        speciesId: id,
        hybrid: null
      };
    }
    const hybrid = (player.hybrids || []).find((h) => h.id === id);
    if (hybrid) {
      return {
        id: hybrid.id,
        name: hybrid.nickname || hybrid.generatedName || 'Hybrid Hamster',
        isBase: false,
        generation: hybrid.generation || 1,
        rarity: hybrid.rarity,
        title: `${(hybrid.generation || 1) === 1 ? 'Gen 1' : 'Gen 2'} Hybrid • ${hybrid.personality}`,
        speciesId: hybrid.parent1Species,
        hybrid
      };
    }
    return null;
  };

  const p1Info = getParentInfo(parent1);
  const p2Info = getParentInfo(parent2);

  const isSameParent = parent1 === parent2;
  const childProjectedGen = (p1Info?.isBase && p2Info?.isBase) ? 1 : 2;

  // Incubation state & timer
  const activeInc = player.activeIncubation;
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isObserving, setIsObserving] = useState<boolean>(false);
  const [selectedState, setSelectedState] = useState<'A' | 'B' | null>(null);
  const [isGhostPeeking, setIsGhostPeeking] = useState<boolean>(false);

  // Hatch result modal & reveal animation
  const [hatchedResult, setHatchedResult] = useState<{ hybrid: QuantumHybrid; chosenState: 'A' | 'B' } | null>(null);
  const [isHatchingAnimation, setIsHatchingAnimation] = useState<boolean>(false);
  const [hatchStage, setHatchStage] = useState<'none' | 'glowing' | 'cracking' | 'burst'>('none');
  const hatchTimerRef = React.useRef<NodeJS.Timeout[]>([]);
  const [customNickname, setCustomNickname] = useState<string>('');
  const [hasSavedName, setHasSavedName] = useState<boolean>(false);
  const [isSavingName, setIsSavingName] = useState<boolean>(false);

  // Real-world telemetry & breeding status
  const rpm = telemetry?.rpm || 0;
  const isSqueektoshiRunning = rpm > 0 && telemetry?.freshness === 'online';
  const liveCooldownElapsed = Date.now() - (player.lastLiveBreedingAt || 0);
  const isLiveEligible = isSqueektoshiRunning && liveCooldownElapsed >= LIVE_BREEDING_COOLDOWN_MS;
  const cooldownMinsRemaining = Math.max(0, Math.ceil((LIVE_BREEDING_COOLDOWN_MS - liveCooldownElapsed) / 60000));

  const totalHybrids = player.hybrids?.length || 0;
  const maxCapacity = getMaxHybridCapacity(player);
  const isCapacityFull = totalHybrids >= maxCapacity;

  // Countdown timer for incubation
  useEffect(() => {
    if (!activeInc) {
      setTimeLeft(0);
      return;
    }
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((activeInc.finishesAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activeInc]);

  const handleStart = async () => {
    if (!parent1 || !parent2 || isSameParent || isCapacityFull || activeInc || isStarting) return;
    audio.playZap();
    try {
      await onStartIncubation(parent1, parent2);
    } catch (err: any) {
      console.error(err);
    }
  };

  const completeHatchSequence = (res: { hybrid: QuantumHybrid; chosenState: 'A' | 'B' }) => {
    // Clear any pending timers
    hatchTimerRef.current.forEach(clearTimeout);
    hatchTimerRef.current = [];

    setHatchStage('none');
    setIsHatchingAnimation(false);
    setHatchedResult(res);
    setCustomNickname(res.hybrid.nickname);
    setHasSavedName(false);

    if (res.hybrid.rarity === 'legendary' || res.hybrid.rarity === 'mythic') {
      audio.playRareReveal();
      confetti({
        particleCount: res.hybrid.rarity === 'mythic' ? 240 : 170,
        spread: 90,
        origin: { y: 0.6 }
      });
    } else if (res.hybrid.rarity === 'epic' || res.hybrid.rarity === 'rare') {
      audio.playDiscovery();
      confetti({
        particleCount: res.hybrid.rarity === 'epic' ? 110 : 80,
        spread: 75,
        origin: { y: 0.6 }
      });
    } else {
      audio.playSuccess();
      confetti({
        particleCount: res.hybrid.rarity === 'uncommon' ? 55 : 35,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const handleObserve = async (stateId: 'A' | 'B') => {
    setSelectedState(stateId);
    setIsObserving(true);
    setIsHatchingAnimation(true);
    setHatchStage('glowing');
    audio.playCharge();

    try {
      const res = await onRevealIncubation(stateId);

      // Phase 1: Glowing egg (0ms) -> Phase 2: Cracking (500ms) -> Phase 3: Burst (1100ms) -> Revealed (1500ms)
      const t1 = setTimeout(() => {
        setHatchStage('cracking');
        audio.playEggCrack();
      }, 500);

      const t2 = setTimeout(() => {
        setHatchStage('burst');
        audio.playQuantumCollapse();
      }, 1100);

      const t3 = setTimeout(() => {
        completeHatchSequence(res);
      }, 1500);

      hatchTimerRef.current = [t1, t2, t3];
    } catch (err) {
      console.error(err);
      setIsHatchingAnimation(false);
      setHatchStage('none');
    } finally {
      setIsObserving(false);
      setSelectedState(null);
    }
  };

  const handleGhostSightPeek = async (target: 'A' | 'B') => {
    setIsGhostPeeking(true);
    audio.playClick();
    try {
      await onGhostSight(target);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGhostPeeking(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!hatchedResult || !customNickname.trim()) return;
    setIsSavingName(true);
    try {
      await onRenameHybrid(hatchedResult.hybrid.id, customNickname.trim());
      setHasSavedName(true);
      audio.playClick();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingName(false);
    }
  };

  const rarityBadges: Record<string, string> = {
    common: 'bg-slate-800 text-slate-300 border-slate-700',
    uncommon: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    rare: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80',
    epic: 'bg-purple-950/70 text-purple-300 border-purple-800/80',
    legendary: 'bg-lime-950/70 text-lime-300 border-lime-800/80',
    mythic: 'bg-pink-950/80 text-pink-300 border-pink-500/80'
  };

  return (
    <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
            <Dna className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-lg font-sans">QUANTUM INCUBATOR</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-bold uppercase">
                Genetics Lab
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Synthesize two Base Hamsters into dual-state quantum hybrid superpositions
            </p>
          </div>
        </div>

        {/* Breeding Charges & Telemetry Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Stored Charges */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Charges:</span>
            <span className="font-bold text-amber-400">
              {player.breedingCharges || 0} / {MAX_BREEDING_CHARGES}
            </span>
          </div>

          {/* Next Charge Progress */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Progress:</span>
            <span className="font-bold text-cyan-300">
              {player.breedingChargeProgress || 0} / {WORK_PER_BREEDING_CHARGE}
            </span>
          </div>

          {/* Capacity */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400">Hybrids:</span>
            <span className={`font-bold ${isCapacityFull ? 'text-rose-400' : 'text-lime-400'}`}>
              {totalHybrids} / {maxCapacity}
            </span>
          </div>
        </div>
      </div>

      {/* Squeektoshi Live Breeding Notification Banner */}
      <div className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 relative z-10 font-mono ${
        isLiveEligible
          ? 'bg-gradient-to-r from-lime-950/80 to-emerald-950/80 border-lime-500/60 text-lime-300 shadow-md shadow-lime-500/10'
          : isSqueektoshiRunning
          ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
          : 'bg-slate-950/60 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isSqueektoshiRunning ? 'text-lime-400 animate-spin' : 'text-slate-500'}`} />
          <span>
            Squeektoshi:{' '}
            <strong className={isSqueektoshiRunning ? 'text-white' : 'text-slate-400'}>
              {isSqueektoshiRunning ? `RUNNING (${rpm.toFixed(1)} RPM)` : 'RESTING'}
            </strong>
          </span>
        </div>

        <div>
          {isLiveEligible ? (
            <span className="font-bold text-lime-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-lime-400" />
              LIVE BREEDING AVAILABLE — NO CHARGE REQUIRED
            </span>
          ) : isSqueektoshiRunning ? (
            <span className="text-amber-400">
              Live Cooldown: {cooldownMinsRemaining}m remaining (Stored charge can be used)
            </span>
          ) : (
            <span>Resting: Stored breeding charge required to incubate</span>
          )}
        </div>
      </div>

      {/* Active Incubation View (When breeding is underway) */}
      {activeInc ? (
        <div className="space-y-5 animate-fade-in">
          {/* Chamber Chamber Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-purple-500/50 text-center relative overflow-hidden">
            {/* Countdown / Status */}
            {timeLeft > 0 ? (
              <div className="flex flex-col items-center py-4">
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full border-3 border-purple-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-xl">
                    🧬
                  </div>
                </div>
                <h4 className="font-mono text-sm font-bold text-purple-300 tracking-wider">
                  QUANTUM SUPERPOSITION INCUBATING
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Synthesizing dual genetic eigenstates... {timeLeft}s remaining
                </p>
              </div>
            ) : (
              <div className="py-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/20 border border-lime-400 text-lime-400 font-mono text-xs font-bold animate-pulse mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> DUAL QUANTUM OFFSPRING READY FOR OBSERVATION
                </span>
                <p className="text-xs text-slate-300">
                  Examine both genetic wavefunctions. Your quantum observation decides which companion becomes physical reality!
                </p>
              </div>
            )}

            {/* Parents involved */}
            <div className="flex flex-col items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <PixelHamster speciesId={activeInc.parent1Species} size="sm" />
                  <span>{activeInc.parent1Name || HAMSTER_SPECIES[activeInc.parent1Species]?.name}</span>
                </div>
                <span className="text-purple-400 font-bold text-sm">×</span>
                <div className="flex items-center gap-1.5">
                  <PixelHamster speciesId={activeInc.parent2Species} size="sm" />
                  <span>{activeInc.parent2Name || HAMSTER_SPECIES[activeInc.parent2Species]?.name}</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${activeInc.childGeneration === 2 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'}`}>
                Incubating Generation {activeInc.childGeneration || 1} Hybrid
              </span>
            </div>
          </div>

          {/* Dual State Cards (State A & State B) */}
          {timeLeft === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[activeInc.stateA, activeInc.stateB].map((st) => {
                const isA = st.id === 'A';
                const canGhostPeek = player.activeAssistant === 'ghost' && !activeInc.ghostSightUsed;

                return (
                  <div
                    key={st.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative hover:border-purple-500/60 transition-all"
                  >
                    <div>
                      {/* State Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="font-mono text-xs font-bold text-purple-300">
                          {st.name}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          st.stability === 'High'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                            : st.stability === 'Moderate'
                            ? 'bg-cyan-950/70 text-cyan-300 border-cyan-800'
                            : 'bg-purple-950/70 text-purple-300 border-purple-800'
                        }`}>
                          {st.stability} Stability
                        </span>
                      </div>

                      {/* Signals / Traits */}
                      <div className="grid grid-cols-2 gap-2 my-3 text-[11px] font-mono">
                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Mutation:</span>
                          <span className="font-bold text-white">{st.mutationLevel}</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Inheritance:</span>
                          <span className="font-bold text-white">{st.inheritanceType}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 italic mb-2">
                        "{st.summary}"
                      </p>

                      {/* Revealed Ghost Clue */}
                      {st.revealedClue && (
                        <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800 text-xs text-cyan-300 font-mono mt-2 animate-fade-in">
                          {st.revealedClue}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      {canGhostPeek && !st.revealedClue && (
                        <button
                          onClick={() => handleGhostSightPeek(st.id)}
                          disabled={isGhostPeeking}
                          className="w-full py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Peek Genetic Signature (Ghost Assistant)</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleObserve(st.id)}
                        disabled={isObserving}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>OBSERVE STATE {st.id} (COLLAPSE REALITY)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Idle Setup: Parent Selection & Incubation Launch */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent 1 Selector */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-400 font-bold">
                  SELECT PARENT 1:
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${p1Info?.isBase ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30' : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'}`}>
                  {p1Info?.isBase ? 'Base Specimen' : `Gen ${p1Info?.generation} Hybrid`}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {p1Info?.hybrid ? (
                    <PixelHybridHamster hybrid={p1Info.hybrid} size="sm" />
                  ) : (
                    <PixelHamster speciesId={p1Info?.speciesId || 'normal'} size="md" />
                  )}
                </div>
                <div className="flex-1">
                  <select
                    value={parent1}
                    onChange={(e) => setParent1(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-purple-500"
                  >
                    <optgroup label="Discovered Base Hamsters">
                      {discoveredSpeciesIds.map((sid) => (
                        <option key={'p1_' + sid} value={sid}>
                          {HAMSTER_SPECIES[sid]?.name || sid} (Base • {HAMSTER_SPECIES[sid]?.rarity})
                        </option>
                      ))}
                    </optgroup>
                    {eligibleHybridParents.length > 0 && (
                      <optgroup label="Generation 1 Hybrids (Eligible for Breeding)">
                        {eligibleHybridParents.map((h) => (
                          <option key={'p1_' + h.id} value={h.id}>
                            {h.nickname || h.generatedName} (Gen 1 • {h.rarity})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {p1Info?.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Parent 2 Selector */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-400 font-bold">
                  SELECT PARENT 2:
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${p2Info?.isBase ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30' : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'}`}>
                  {p2Info?.isBase ? 'Base Specimen' : `Gen ${p2Info?.generation} Hybrid`}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {p2Info?.hybrid ? (
                    <PixelHybridHamster hybrid={p2Info.hybrid} size="sm" />
                  ) : (
                    <PixelHamster speciesId={p2Info?.speciesId || 'normal'} size="md" />
                  )}
                </div>
                <div className="flex-1">
                  <select
                    value={parent2}
                    onChange={(e) => setParent2(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-purple-500"
                  >
                    <optgroup label="Discovered Base Hamsters">
                      {discoveredSpeciesIds.map((sid) => (
                        <option key={'p2_' + sid} value={sid}>
                          {HAMSTER_SPECIES[sid]?.name || sid} (Base • {HAMSTER_SPECIES[sid]?.rarity})
                        </option>
                      ))}
                    </optgroup>
                    {eligibleHybridParents.length > 0 && (
                      <optgroup label="Generation 1 Hybrids (Eligible for Breeding)">
                        {eligibleHybridParents.map((h) => (
                          <option key={'p2_' + h.id} value={h.id}>
                            {h.nickname || h.generatedName} (Gen 1 • {h.rarity})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {p2Info?.title}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Projected Generation Ribbon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs font-mono gap-2">
            <div className="flex items-center gap-2">
              <Dna className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300">Projected Offspring:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${childProjectedGen === 2 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'}`}>
                Generation {childProjectedGen} Hybrid
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">
              {childProjectedGen === 2 ? 'Multi-gen lineage cross (max 4 mutations)' : 'Pure base cross (dual quantum state)'}
            </span>
          </div>

          {isSameParent && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Cannot select the same specimen twice as both parents. Please choose two distinct specimens.</span>
            </div>
          )}

          {/* Launch Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-mono">
              {isCapacityFull ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" /> Capacity Full ({totalHybrids}/{maxCapacity}). Expand colony habitat or release a hybrid.
                </span>
              ) : isLiveEligible ? (
                <span className="text-lime-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-lime-400" /> Free Live Squeektoshi Breeding Available!
                </span>
              ) : (player.breedingCharges || 0) > 0 ? (
                <span className="text-amber-300 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-400" /> Will consume 1 of {player.breedingCharges} stored breeding charges.
                </span>
              ) : (
                <span className="text-slate-500">
                  Needs 1 breeding charge (or wait for Squeektoshi to run live).
                </span>
              )}
            </div>

            <button
              onClick={handleStart}
              disabled={isSameParent || isCapacityFull || (!isLiveEligible && (player.breedingCharges || 0) < 1) || isStarting}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                isCapacityFull || (!isLiveEligible && (player.breedingCharges || 0) < 1)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  : isLiveEligible
                  ? 'bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-lime-500/20'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25'
              }`}
            >
              <Dna className="w-4 h-4" />
              <span>{isLiveEligible ? 'Initiate Free Live Breeding' : 'Begin Incubation (1 Charge)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Hatching Transformation Animation Overlay */}
      {isHatchingAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative w-32 h-32 flex items-center justify-center anim-egg-hatch">
              <div className="w-20 h-28 rounded-full bg-gradient-to-b from-purple-300 via-pink-400 to-indigo-600 shadow-2xl shadow-purple-500 border-4 border-white flex items-center justify-center text-3xl">
                ⚡
              </div>
            </div>
            <div className="font-mono text-base font-bold text-purple-300 tracking-widest animate-pulse">
              COLLAPSING GENETIC WAVEFORM...
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Materializing chosen eigenstate into reality!
            </p>
          </div>
        </div>
      )}

      {/* Multi-Phase Egg Hatching Sequence Overlay */}
      {hatchStage !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
          <div className="text-center space-y-4 max-w-sm w-full p-6 bg-slate-900/90 border-2 border-purple-500/60 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            
            {/* Animated Quantum Egg Graphic */}
            <div className="w-32 h-32 mx-auto relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl animate-pulse" />
              
              {/* Egg shell representation */}
              <div className={`w-20 h-28 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] border-4 shadow-2xl flex items-center justify-center transition-all ${
                hatchStage === 'glowing'
                  ? 'bg-gradient-to-b from-cyan-300 via-teal-400 to-indigo-600 border-cyan-200 shadow-[0_0_25px_#22d3ee] scale-105'
                  : hatchStage === 'cracking'
                  ? 'bg-gradient-to-b from-purple-300 via-pink-400 to-indigo-600 border-pink-300 shadow-[0_0_35px_#f472b6] anim-egg-wobble'
                  : 'bg-white border-white anim-egg-explode'
              }`}>
                {/* Quantum Core Shimmer */}
                <span className="text-2xl animate-spin">⚛️</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>
                  {hatchStage === 'glowing' ? 'SUPERPOSITION CHARGING' :
                   hatchStage === 'cracking' ? 'SHELL CRACKING' : 'WAVEFUNCTION COLLAPSING!'}
                </span>
              </div>
              <h3 className="text-lg font-bold font-fredoka text-white">
                {hatchStage === 'glowing' ? 'Synthesizing Genome Realities...' :
                 hatchStage === 'cracking' ? 'Reality Boundary Fracturing!' : 'Collapsing into One Reality!'}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Hatching Reveal Modal */}
      {hatchedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/60 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative">
            
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-purple-950 text-purple-300 border border-purple-700">
              ★ QUANTUM HYBRID MATERIALIZED ★
            </div>

            {/* Hybrid Avatar with Rarity-Specific Frame Intensity */}
            <div className={`w-28 h-28 mx-auto rounded-2xl flex items-center justify-center p-2 shadow-2xl relative transition-all ${
              hatchedResult.hybrid.rarity === 'mythic'
                ? 'bg-gradient-to-b from-pink-950/90 to-purple-950 border-2 anim-mythic-cosmic'
                : hatchedResult.hybrid.rarity === 'legendary'
                ? 'bg-gradient-to-b from-amber-950/90 to-slate-950 border-2 anim-legendary-gleam'
                : hatchedResult.hybrid.rarity === 'epic'
                ? 'bg-purple-950/80 border-2 border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.5)]'
                : hatchedResult.hybrid.rarity === 'rare'
                ? 'bg-cyan-950/80 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                : hatchedResult.hybrid.rarity === 'uncommon'
                ? 'bg-emerald-950/70 border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                : 'bg-slate-950 border border-slate-700 shadow-md'
            }`}>
              <PixelHybridHamster hybrid={hatchedResult.hybrid} size="hero" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${rarityBadges[hatchedResult.hybrid.rarity]}`}>
                  {hatchedResult.hybrid.rarity}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${hatchedResult.hybrid.generation === 2 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-cyan-950 text-cyan-300 border-cyan-700'}`}>
                  Generation {hatchedResult.hybrid.generation || 1}
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                  {hatchedResult.hybrid.personality}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">
                {hatchedResult.hybrid.nickname}
              </h3>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-mono mt-1">
                <span>Lineage: {hatchedResult.hybrid.ancestryLineage || `${hatchedResult.hybrid.parent1Name || HAMSTER_SPECIES[hatchedResult.hybrid.parent1Species]?.name} × ${hatchedResult.hybrid.parent2Name || HAMSTER_SPECIES[hatchedResult.hybrid.parent2Species]?.name}`}</span>
              </div>
            </div>

            {/* Resolved Traits Showcase */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Fur Pattern:</span>
                <span className="text-white capitalize">{hatchedResult.hybrid.traits.furPattern.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Body & Ears:</span>
                <span className="text-white capitalize">{hatchedResult.hybrid.traits.bodyShape} / {hatchedResult.hybrid.traits.earShape}</span>
              </div>
              {hatchedResult.hybrid.traits.cosmeticMutation !== 'none' && (
                <div className="flex justify-between">
                  <span className="text-purple-400 font-bold">Cosmetic Mutation:</span>
                  <span className="text-purple-300 capitalize">{hatchedResult.hybrid.traits.cosmeticMutation.replace('_', ' ')}</span>
                </div>
              )}
            </div>

            {/* Inline Nickname Input */}
            <div className="pt-2 border-t border-slate-800 text-left">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Give your hybrid companion a nickname:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customNickname}
                  onChange={(e) => setCustomNickname(e.target.value)}
                  maxLength={20}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNickname();
                  }}
                />
                <button
                  onClick={handleSaveNickname}
                  disabled={isSavingName || !customNickname.trim() || hasSavedName}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1 ${
                    hasSavedName
                      ? 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/50'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {hasSavedName ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={async () => {
                  audio.playClick();
                  await onSetLabDisplay(hatchedResult.hybrid.id);
                  setHatchedResult(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                <span>Display in Lab</span>
              </button>

              {onViewInDex && (
                <button
                  onClick={() => {
                    audio.playClick();
                    setHatchedResult(null);
                    onViewInDex();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View in QuantumDex</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                audio.playClick();
                setHatchedResult(null);
              }}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};