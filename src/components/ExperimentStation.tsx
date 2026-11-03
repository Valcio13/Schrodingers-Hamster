import React, { useState, useEffect } from 'react';
import {
  PlayerState,
  EXPERIMENT_TYPES,
  ExperimentOutcome,
  ExperimentApproach,
  QuantumStatePreview,
  RESEARCH_UPGRADES,
  HAMSTER_SPECIES,
  HamsterPersonality
} from '../types/game';
import { SqueekTelemetry } from '../../worker/squeekchain';
import { PixelHamster } from './PixelHamster';
import { Sparkles, Clock, Zap, Atom, Eye, ChevronRight, CheckCircle2, UserCheck, Edit2, Check, ArrowRight } from 'lucide-react';
import { audio } from '../services/audio';
import confetti from 'canvas-confetti';

interface ExperimentStationProps {
  player: PlayerState;
  telemetry: SqueekTelemetry | null;
  onStartExperiment: (type: 'basic' | 'unstable' | 'paradox' | 'grand', approach: ExperimentApproach) => Promise<void>;
  onRevealExperiment: (chosenState: 'A' | 'B') => Promise<{ outcome: ExperimentOutcome; chosenState: 'A' | 'B' }>;
  onGhostSight: (target: 'A' | 'B') => Promise<void>;
  onRenameHamster?: (hamsterId: string, nickname: string) => Promise<void>;
  onAssignAssistant?: (hamsterId: string) => Promise<void>;
  onViewInDex?: () => void;
  isStarting: boolean;
  hideHeader?: boolean;
}

export const ExperimentStation: React.FC<ExperimentStationProps> = ({
  player,
  telemetry,
  onStartExperiment,
  onRevealExperiment,
  onGhostSight,
  onRenameHamster,
  onAssignAssistant,
  onViewInDex,
  isStarting,
  hideHeader = false
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [approach, setApproach] = useState<ExperimentApproach>('stable');
  const [revealedResult, setRevealedResult] = useState<{ outcome: ExperimentOutcome; chosenState: 'A' | 'B' } | null>(null);
  const [revealPhase, setRevealPhase] = useState<'silhouette' | 'revealed'>('revealed');
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [selectedObserving, setSelectedObserving] = useState<'A' | 'B' | null>(null);
  const [isGhostPeeking, setIsGhostPeeking] = useState<boolean>(false);

  // New Companion Naming & Assignment in Reveal Modal
  const [companionNickname, setCompanionNickname] = useState<string>('');
  const [isSavingNickname, setIsSavingNickname] = useState<boolean>(false);
  const [hasSavedNickname, setHasSavedNickname] = useState<boolean>(false);
  const [isAssigningAssistant, setIsAssigningAssistant] = useState<boolean>(false);
  const [hasAssignedAssistant, setHasAssignedAssistant] = useState<boolean>(false);

  const activeExp = player.activeExperiment;

  // Countdown timer effect
  useEffect(() => {
    if (!activeExp) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((activeExp.finishesAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activeExp]);

  const handleObserve = async (stateId: 'A' | 'B') => {
    setSelectedObserving(stateId);
    audio.playZap();
    setIsRevealing(true);
    try {
      const result = await onRevealExperiment(stateId);
      setRevealedResult(result);

      if (result.outcome.hamster) {
        setCompanionNickname(result.outcome.hamster.nickname || '');
        setHasSavedNickname(false);
        setHasAssignedAssistant(false);
      }

      if (result.outcome.isNewSpecies) {
        // Phase 1.A: Quantum Collapse Silhouette Reveal Sequence
        setRevealPhase('silhouette');
        audio.playQuantumCollapse();

        setTimeout(() => {
          setRevealPhase('revealed');
          audio.playDiscovery();
          confetti({
            particleCount: 140,
            spread: 90,
            origin: { y: 0.6 }
          });
        }, 1400);
      } else if (result.outcome.hamster) {
        // Phase 1.B: Duplicate Companion Acquired
        setRevealPhase('revealed');
        audio.playSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        setRevealPhase('revealed');
        audio.playCharge();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRevealing(false);
      setSelectedObserving(null);
    }
  };

  const handleSaveNickname = async () => {
    if (!revealedResult?.outcome.hamster || !companionNickname.trim() || !onRenameHamster) return;
    setIsSavingNickname(true);
    try {
      await onRenameHamster(revealedResult.outcome.hamster.id, companionNickname.trim());
      setHasSavedNickname(true);
      audio.playClick();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleQuickAssignAssistant = async () => {
    if (!revealedResult?.outcome.hamster || !onAssignAssistant) return;
    setIsAssigningAssistant(true);
    try {
      await onAssignAssistant(revealedResult.outcome.hamster.id);
      setHasAssignedAssistant(true);
      audio.playClick();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigningAssistant(false);
    }
  };

  const handleUseGhostSight = async (target: 'A' | 'B') => {
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

  const getEffectiveCost = (baseCost: number) => {
    let cost = baseCost;
    if (player.activeAssistant === 'electric') {
      const hasSynergy = player.unlockedResearch.includes('assistant_resonance');
      cost = Math.floor(cost * (hasSynergy ? 0.75 : 0.85));
    }
    if (player.unlockedResearch.includes('efficiency_coils')) {
      cost = Math.floor(cost * 0.9);
    }
    if (player.activeAssistant === 'paradox') {
      cost = Math.floor(cost * 0.9);
    }
    return Math.max(3, cost);
  };

  // Find next research upgrade to display progression in reveal modal
  const nextResearch = RESEARCH_UPGRADES.find(u => !player.unlockedResearch.includes(u.id));

  // Render SVG waveform graphics for each state
  const renderWaveform = (style: string, color: string) => {
    return (
      <svg className="w-full h-8" viewBox="0 0 100 24" preserveAspectRatio="none">
        {style === 'sine' && (
          <path d="M0 12 Q25 0 50 12 T100 12" fill="none" stroke={color} strokeWidth="2.5" />
        )}
        {style === 'pulse' && (
          <path d="M0 12 L35 12 L45 2 L55 22 L65 12 L100 12" fill="none" stroke={color} strokeWidth="2.5" />
        )}
        {style === 'chaotic' && (
          <path d="M0 12 Q15 2 30 18 T60 4 T80 20 L100 12" fill="none" stroke={color} strokeWidth="2.5" />
        )}
        {style === 'sawtooth' && (
          <path d="M0 18 L25 4 L25 18 L50 4 L50 18 L75 4 L75 18 L100 4" fill="none" stroke={color} strokeWidth="2.5" />
        )}
      </svg>
    );
  };

  const renderStateCard = (state: QuantumStatePreview, isA: boolean) => {
    const isObservingThis = selectedObserving === state.id;
    const canUseGhostSight = player.activeAssistant === 'ghost' && activeExp && !activeExp.ghostSightUsed;

    const stabilityColors = {
      High: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
      Moderate: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
      Low: 'text-amber-400 bg-amber-950/60 border-amber-800',
      Volatile: 'text-rose-400 bg-rose-950/60 border-rose-800'
    };

    return (
      <div
        className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${
          isObservingThis
            ? 'border-lime-400 bg-lime-950/30 scale-[1.02] shadow-xl'
            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase"
              style={{ color: state.waveformColor, backgroundColor: `${state.waveformColor}20`, border: `1px solid ${state.waveformColor}40` }}
            >
              {state.id === 'A' ? '⚛️ STATE A' : '🌌 STATE B'}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stabilityColors[state.stability]}`}>
              Stability: {state.stability}
            </span>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm leading-snug">{state.name}</h4>
            <div className="mt-1 opacity-90">{renderWaveform(state.waveformStyle, state.waveformColor)}</div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {state.summary}
          </p>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block">Research:</span>
              <span className="text-cyan-300 font-bold">{state.researchPotential}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Mutation:</span>
              <span className="text-purple-300 font-bold">{state.mutationPotential}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Energy:</span>
              <span className="text-amber-300 font-bold">{state.energySignature}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Signal:</span>
              <span className="text-slate-300 font-bold uppercase">{state.waveformStyle}</span>
            </div>
          </div>

          {/* Revealed Clue from Ghost Hamster */}
          {state.revealedClue && (
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-xs text-cyan-200 animate-fade-in flex items-start gap-1.5">
              <span className="text-base">👻</span>
              <div>
                <strong className="block text-[11px] text-cyan-400 font-mono">Quantum Sight Peek:</strong>
                <span>{state.revealedClue}</span>
              </div>
            </div>
          )}

          {/* Ghost Sight Action Button */}
          {canUseGhostSight && !state.revealedClue && (
            <button
              type="button"
              onClick={() => handleUseGhostSight(state.id)}
              disabled={isGhostPeeking}
              className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-800/80 text-[11px] font-mono text-cyan-300 hover:text-cyan-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Use Quantum Sight on State {state.id}</span>
            </button>
          )}
        </div>

        {/* Observe Button */}
        <div className="pt-3 mt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => handleObserve(state.id)}
            disabled={timeLeft > 0 || isRevealing}
            className={`w-full py-2.5 rounded-xl font-bold font-sans text-xs transition-all flex items-center justify-center gap-2 shadow-md ${
              timeLeft > 0
                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 hover:shadow-lime-500/20 transform hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <span>{timeLeft > 0 ? `Sealed (${timeLeft}s)` : `OBSERVE STATE ${state.id}`}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${hideHeader ? '' : 'bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg'}`}>
      {!hideHeader && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-sans">Schrödinger Chamber</h3>
              <p className="text-xs text-slate-400">Quantum state observation & wavefunction collapse</p>
            </div>
          </div>

          {activeExp && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 border border-purple-700 text-purple-300">
              {timeLeft > 0 ? `Sealed (${activeExp.approach.toUpperCase()}): ${timeLeft}s` : 'Stabilized — Choose State'}
            </span>
          )}
        </div>
      )}

      {/* Active Experiment Status Pill when Header is hidden */}
      {hideHeader && activeExp && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/60 border border-purple-700 text-xs font-mono">
          <div className="flex items-center gap-2 text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>Chamber Superposition Active</span>
          </div>
          <span className="font-bold text-white">
            {timeLeft > 0 ? `Sealed (${activeExp.approach.toUpperCase()}): ${timeLeft}s` : 'Stabilized — Select State to Observe'}
          </span>
        </div>
      )}

      {/* Active Experiment View: Dual State Quantum Observation Interface */}
      {activeExp ? (
        <div className="space-y-4">
          {timeLeft > 0 ? (
            /* During countdown: Chamber sealed with emerging quantum signals */
            <div className="p-4 rounded-xl border border-purple-500/30 bg-gradient-to-b from-purple-950/30 to-slate-950 text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin flex items-center justify-center" />
                <div className="text-left">
                  <h4 className="font-bold text-white text-sm">Chamber Sealed in Superposition</h4>
                  <p className="text-xs text-slate-400">
                    Emerging quantum eigenstates detected • Stabilizing in <strong className="text-purple-300 font-mono">{timeLeft}s</strong>
                  </p>
                </div>
              </div>

              {/* Emerging State Previews */}
              <div className="flex flex-col space-y-3 text-left pt-2">
                {activeExp.stateA && renderStateCard(activeExp.stateA, true)}
                {activeExp.stateB && renderStateCard(activeExp.stateB, false)}
              </div>
            </div>
          ) : (
            /* Wavefunction stabilized: Choose State A or State B */
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <div>
                    <h4 className="font-bold text-lime-400 text-sm">
                      Wavefunction Stabilized: Choose Which State to Observe
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Inspect the signals below. Your observation will permanently collapse that state into reality!
                    </p>
                  </div>
                </div>
                {player.activeAssistant === 'ghost' && !activeExp.ghostSightUsed && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2 py-1 rounded">
                    👻 Quantum Sight Ready
                  </span>
                )}
              </div>

              {/* State A and State B Choice Cards */}
              <div className="flex flex-col space-y-3">
                {activeExp.stateA && renderStateCard(activeExp.stateA, true)}
                {activeExp.stateB && renderStateCard(activeExp.stateB, false)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Idle Experiment Selection Interface */
        <div className="space-y-3">
          {/* Approach Selector (STABLE vs CHAOTIC) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Experiment Approach</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">Choice</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {approach === 'stable'
                  ? '🔬 Stable: Consistent Research Notes, steady discovery pace.'
                  : '⚡ Chaotic: +25% discovery chance for rare species, volatile Notes.'}
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  setApproach('stable');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  approach === 'stable'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔬 Stable
              </button>
              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  setApproach('chaotic');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  approach === 'chaotic'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Chaotic
              </button>
            </div>
          </div>

          {/* Experiment Selection List (Comfortable & Spacious) */}
          <div className="flex flex-col space-y-3">
            {Object.values(EXPERIMENT_TYPES).map((exp) => {
              if (exp.id === 'grand') return null; // Rendered in Grand Paradox panel

              const isLocked = exp.requiredResearchId && !player.unlockedResearch.includes(exp.requiredResearchId);
              const effectiveCost = getEffectiveCost(exp.cost);
              const canAfford = player.batteryEnergy >= effectiveCost;

              // Distinctive tier styling
              const tierStyles = {
                basic: {
                  border: isLocked ? 'border-slate-800/60 bg-slate-950/40' : 'border-cyan-500/40 bg-gradient-to-r from-cyan-950/30 to-slate-950/80 hover:border-cyan-400 shadow-md',
                  badge: 'bg-cyan-950/90 border border-cyan-700/70 text-cyan-300',
                  button: 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold shadow-cyan-500/25',
                  icon: '🔬',
                  themeColor: 'text-cyan-400'
                },
                unstable: {
                  border: isLocked ? 'border-slate-800/60 bg-slate-950/40' : 'border-amber-500/40 bg-gradient-to-r from-amber-950/30 to-slate-950/80 hover:border-amber-400 shadow-md',
                  badge: 'bg-amber-950/90 border border-amber-700/70 text-amber-300',
                  button: 'bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-slate-950 font-bold shadow-amber-500/25',
                  icon: '⚡',
                  themeColor: 'text-amber-400'
                },
                paradox: {
                  border: isLocked ? 'border-slate-800/60 bg-slate-950/40' : 'border-purple-500/40 bg-gradient-to-r from-purple-950/30 to-slate-950/80 hover:border-purple-400 shadow-md',
                  badge: 'bg-purple-950/90 border border-purple-700/70 text-purple-300',
                  button: 'bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white font-bold shadow-purple-500/25',
                  icon: '🌌',
                  themeColor: 'text-purple-400'
                }
              };

              const style = tierStyles[exp.id as keyof typeof tierStyles] || tierStyles.basic;

              return (
                <div
                  key={exp.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all space-y-2.5 ${style.border} ${
                    isLocked ? 'opacity-60' : ''
                  }`}
                >
                  {/* Top Row: Name + Badges + Cost/Duration */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{style.icon}</span>
                      <span className="font-bold text-white text-sm">{exp.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${style.badge}`}>
                        {exp.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {effectiveCost} E
                        {effectiveCost < exp.cost && (
                          <span className="text-slate-500 line-through text-[10px]">
                            {exp.cost}
                          </span>
                        )}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {exp.durationSeconds}s
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Clear, Readable Description */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {exp.description}
                  </p>

                  {/* Bottom Row: Full-width Action Button */}
                  <div className="pt-1">
                    {isLocked ? (
                      <div className="w-full py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-500 text-center">
                        Locked (Research Required)
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          audio.playClick();
                          onStartExperiment(exp.id, approach);
                        }}
                        disabled={!canAfford || isStarting}
                        className={`w-full py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? style.button
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>{canAfford ? `Conduct Experiment (${effectiveCost} Energy)` : 'Insufficient Battery Energy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outcome Reveal Modal: Informative, Rewarding & Companion-Focused */}
      {revealedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-purple-500/50 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            
            {/* STAGE A: SILHOUETTE QUANTUM COLLAPSE REVEAL */}
            {revealPhase === 'silhouette' ? (
              <div className="space-y-4 py-4 animate-fade-in">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-purple-950/80 border-2 border-purple-400 flex items-center justify-center p-2 relative shadow-[0_0_30px_rgba(168,85,247,0.7)] overflow-hidden">
                  <div className="anim-silhouette-reveal transform scale-110">
                    {revealedResult.outcome.speciesId && (
                      <PixelHamster speciesId={revealedResult.outcome.speciesId} size="lg" />
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-3xl font-black text-purple-200 drop-shadow-[0_0_12px_#c084fc] animate-pulse">?</span>
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-purple-950/90 text-purple-300 border border-purple-500/80 animate-pulse">
                    ⚡ COLLAPSING SUPERPOSITION...
                  </div>
                  <h3 className="text-lg font-bold text-white font-fredoka mt-2">
                    A mysterious lifeform is taking shape!
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    The quantum wavefunction is resolving reality...
                  </p>
                </div>

                <button
                  onClick={() => {
                    setRevealPhase('revealed');
                    audio.playDiscovery();
                    confetti({ particleCount: 120, spread: 85, origin: { y: 0.6 } });
                  }}
                  className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition-colors"
                >
                  Skip Reveal ⏩
                </button>
              </div>
            ) : (
              /* STAGE B: FULL CELEBRATION REVEAL */
              <div className="space-y-4 animate-fade-in">
                {/* Hamster / Outcome Avatar */}
                <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center p-2 relative shadow-xl transition-all ${
                  revealedResult.outcome.isNewSpecies
                    ? 'bg-gradient-to-b from-lime-950/80 to-slate-950 border-2 border-lime-400 shadow-[0_0_25px_rgba(163,230,53,0.5)]'
                    : revealedResult.outcome.hamster
                    ? 'bg-purple-950/50 border-2 border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.4)]'
                    : 'bg-slate-950 border border-slate-700'
                }`}>
                  {revealedResult.outcome.speciesId ? (
                    <PixelHamster speciesId={revealedResult.outcome.speciesId} size="lg" />
                  ) : (
                    <Sparkles className="w-10 h-10 text-lime-400 animate-pulse" />
                  )}
                </div>

                <div>
                  {/* Phase 1.A & 1.B: Celebratory Headings */}
                  {revealedResult.outcome.isNewSpecies ? (
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black tracking-wider uppercase bg-lime-400 text-slate-950 shadow-[0_0_15px_rgba(163,230,53,0.8)]">
                        ★ NEW SPECIES DISCOVERED! ★
                      </div>
                      <h3 className="text-xl font-bold font-fredoka text-white mt-2">
                        {HAMSTER_SPECIES[revealedResult.outcome.speciesId || '']?.name || 'Quantum Hamster'}
                      </h3>
                      <p className="text-xs text-lime-300 font-mono italic">
                        The quantum field has produced an entirely new lifeform!
                      </p>
                    </div>
                  ) : revealedResult.outcome.hamster ? (
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-purple-950 text-purple-300 border border-purple-500/80">
                        ★ NEW COMPANION ACQUIRED! ★
                      </div>
                      <h3 className="text-xl font-bold font-fredoka text-white mt-1">
                        {companionNickname || HAMSTER_SPECIES[revealedResult.outcome.hamster.speciesId]?.name || 'Quantum Companion'}
                      </h3>
                      <p className="text-xs text-slate-300 font-mono">
                        A unique specimen has stepped out of the superposition!
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-0.5 rounded-full text-xs font-mono">
                        OBSERVED STATE {revealedResult.chosenState}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">
                        {revealedResult.outcome.message}
                      </h3>
                    </div>
                  )}

                  {/* Individual Companion Identity Card */}
                  {revealedResult.outcome.hamster && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-purple-500/40 text-left space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Species:</span>
                        <span className="font-bold text-white">
                          {HAMSTER_SPECIES[revealedResult.outcome.hamster.speciesId]?.name || 'Quantum Hamster'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Personality:</span>
                        <span className="font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                          {revealedResult.outcome.hamster.personality}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Species Perk:</span>
                        <span className="text-slate-200">
                          {HAMSTER_SPECIES[revealedResult.outcome.hamster.speciesId]?.assistantPerk || 'Quantum Resonance'}
                        </span>
                      </div>

                      {/* Inline Nickname Input */}
                      <div className="pt-2 border-t border-slate-800">
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">
                          Name your new companion:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={companionNickname}
                            onChange={(e) => setCompanionNickname(e.target.value)}
                            placeholder="Enter nickname..."
                            maxLength={20}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveNickname();
                            }}
                          />
                          <button
                            onClick={handleSaveNickname}
                            disabled={isSavingNickname || !companionNickname.trim() || hasSavedNickname}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1 ${
                              hasSavedNickname
                                ? 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/50'
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {hasSavedNickname ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <span>Save Name</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Quick Assign as Assistant Button */}
                      {onAssignAssistant && (
                        <button
                          onClick={handleQuickAssignAssistant}
                          disabled={isAssigningAssistant || hasAssignedAssistant}
                          className={`w-full py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 mt-2 ${
                            hasAssignedAssistant
                              ? 'bg-lime-500/20 text-lime-300 border border-lime-500/50'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5 text-lime-400" />
                          <span>{hasAssignedAssistant ? 'Assigned as Active Assistant' : 'Assign to Velvet Cushion'}</span>
                        </button>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-300 mt-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left italic">
                    "{revealedResult.outcome.flavorText}"
                  </p>
                </div>

                {/* Rewards collected */}
                <div className="flex items-center justify-center gap-3 py-1 font-mono text-sm">
                  <span className="px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold">
                    +{revealedResult.outcome.insightAwarded} Research Notes
                  </span>
                  {revealedResult.outcome.batteryAwarded && (
                    <span className="px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-300 font-bold">
                      +{revealedResult.outcome.batteryAwarded} Battery
                    </span>
                  )}
                </div>

                {/* Research Progression Indicator */}
                {nextResearch && (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Next Research: {nextResearch.name}</span>
                      <span className="text-cyan-400 font-bold">
                        {Math.min(player.researchInsight, nextResearch.cost)} / {nextResearch.cost} Notes
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (player.researchInsight / nextResearch.cost) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Modal Bottom Buttons: [NAME HAMSTER] [VIEW QUANTUMDEX] [CONTINUE] */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  {revealedResult.outcome.hamster && onViewInDex && (
                    <button
                      onClick={() => {
                        audio.playClick();
                        setRevealedResult(null);
                        onViewInDex();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>View in QuantumDex</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      audio.playClick();
                      setRevealedResult(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
