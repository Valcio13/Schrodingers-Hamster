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
import { Sparkles, Clock, Zap, Atom, Eye, ChevronRight, CheckCircle2, UserCheck, Edit2, Check, ArrowRight, Dna, FlaskConical, Radio } from 'lucide-react';
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


const CyberTerminalIllustration = () => (
  <svg className="w-24 sm:w-28 h-20 shrink-0" viewBox="0 0 120 80" fill="none">
    <defs>
      <filter id="psi-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f472b6" floodOpacity="0.9" />
      </filter>
      <linearGradient id="screen-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e1035" />
        <stop offset="100%" stopColor="#0b0617" />
      </linearGradient>
    </defs>
    {/* Stacked books on left */}
    <rect x="6" y="62" width="22" height="6" rx="2" fill="#3b2667" stroke="#6d28d9" strokeWidth="1" />
    <rect x="8" y="55" width="18" height="6" rx="2" fill="#4c1d95" stroke="#7c3aed" strokeWidth="1" />

    {/* Desk surface line */}
    <line x1="2" y1="72" x2="118" y2="72" stroke="#2e1b4e" strokeWidth="2" strokeLinecap="round" />

    {/* CRT Monitor stand */}
    <path d="M 45 68 L 55 68 L 52 58 L 48 58 Z" fill="#2d1b4e" stroke="#4c2882" strokeWidth="1" />
    <rect x="40" y="68" width="20" height="3" rx="1.5" fill="#3b2064" />

    {/* CRT Monitor Outer Casing */}
    <rect x="30" y="16" width="40" height="38" rx="6" fill="#1b1030" stroke="#582a99" strokeWidth="2" />
    {/* Inner Screen */}
    <rect x="34" y="20" width="32" height="28" rx="4" fill="url(#screen-grad)" stroke="#7c3aed" strokeWidth="1" />
    {/* Scanline subtle reflection */}
    <path d="M 35 22 Q 50 25, 65 22" stroke="rgba(236,72,153,0.25)" strokeWidth="1" fill="none" />

    {/* Quantum Psi (Ψ) Symbol on Screen */}
    <text
      x="50"
      y="39"
      textAnchor="middle"
      fill="#f472b6"
      fontSize="17"
      fontWeight="900"
      fontFamily="serif"
      filter="url(#psi-glow)"
    >
      Ψ
    </text>

    {/* Reagent Flask on Right */}
    <path
      d="M 94 44 L 98 56 Q 101 68, 92 68 Q 83 68, 86 56 L 90 44 Z"
      fill="#28114b"
      stroke="#a855f7"
      strokeWidth="1.5"
    />
    {/* Cork */}
    <rect x="91" y="40" width="6" height="4" rx="1" fill="#78350f" />
    {/* Glowing fluid inside flask */}
    <path
      d="M 87 58 Q 92 66, 97 58 Q 98 66, 92 66 Q 86 66, 87 58 Z"
      fill="#c084fc"
      opacity="0.85"
      filter="drop-shadow(0 0 5px #a855f7)"
    />
    {/* Rising bubble */}
    <circle cx="92" cy="52" r="1.5" fill="#f472b6" opacity="0.8" />
  </svg>
);

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

  // Render glowing SVG waveform graphics matching Image 1
  const renderWaveform = (style: string, color: string, isA: boolean) => {
    return (
      <svg className="w-36 sm:w-52 h-9 overflow-visible" viewBox="0 0 200 40" fill="none">
        <defs>
          <filter id={`glow-${style}-${isA ? 'A' : 'B'}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={color} floodOpacity="0.85" />
          </filter>
        </defs>
        {style === 'sine' && (
          <path
            d="M 5 20 Q 25 5, 50 20 T 95 20 T 140 20 T 185 20"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            filter={`url(#glow-${style}-${isA ? 'A' : 'B'})`}
          />
        )}
        {style === 'pulse' && (
          <path
            d="M 5 20 L 70 20 L 85 6 L 100 34 L 115 12 L 125 20 L 195 20"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${style}-${isA ? 'A' : 'B'})`}
          />
        )}
        {style === 'chaotic' && (
          <path
            d="M 5 20 Q 40 8, 70 22 T 110 12 Q 130 28, 150 15 L 170 30 L 195 24"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${style}-${isA ? 'A' : 'B'})`}
          />
        )}
        {style === 'sawtooth' && (
          <path
            d="M 5 28 L 45 12 L 45 28 L 85 12 L 85 28 L 125 12 L 125 28 L 165 12 L 165 28 L 195 18"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${style}-${isA ? 'A' : 'B'})`}
          />
        )}
      </svg>
    );
  };

  const renderStateCard = (state: QuantumStatePreview, isA: boolean) => {
    const isObservingThis = selectedObserving === state.id;
    const canUseGhostSight = player.activeAssistant === 'ghost' && activeExp && !activeExp.ghostSightUsed;

    const stabilityColors = {
      High: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80',
      Moderate: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80',
      Low: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
      Volatile: 'text-rose-400 bg-rose-950/60 border-rose-800/80'
    };

    const stateColor = isA ? '#ec4899' : '#a3e635';

    return (
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-3.5 ${
          isObservingThis
            ? 'border-purple-400 bg-[#160f30] scale-[1.01] shadow-[0_0_30px_rgba(168,85,247,0.35)]'
            : 'bg-[#120d26]/90 border-purple-900/40 hover:border-purple-500/50 shadow-lg'
        }`}
      >
        <div className="space-y-3">
          {/* Top Header Row */}
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase flex items-center gap-1.5 ${
                isA
                  ? 'text-pink-300 bg-purple-950/80 border border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.25)]'
                  : 'text-lime-300 bg-lime-950/40 border border-lime-500/40 shadow-[0_0_10px_rgba(163,230,53,0.25)]'
              }`}
            >
              {isA ? '⚛️ STATE A' : '📶 STATE B'}
            </span>
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${stabilityColors[state.stability]}`}>
              Stability: {state.stability}
            </span>
          </div>

          {/* Title & Waveform Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <h4 className="font-bold text-white text-base sm:text-lg leading-snug tracking-tight">{state.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {state.summary}
              </p>
            </div>
            <div className="shrink-0 self-end sm:self-center opacity-95">
              {renderWaveform(state.waveformStyle, stateColor, isA)}
            </div>
          </div>

          {/* Revealed Clue from Ghost Hamster (if any) */}
          {state.revealedClue && (
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-xs text-cyan-200 animate-fade-in flex items-start gap-2 shadow-sm">
              <span className="text-base">👻</span>
              <div>
                <strong className="block text-[11px] text-cyan-400 font-mono">Quantum Sight Peek:</strong>
                <span>{state.revealedClue}</span>
              </div>
            </div>
          )}

          {/* Ghost Sight Action Button (if available) */}
          {canUseGhostSight && !state.revealedClue && (
            <button
              type="button"
              onClick={() => handleUseGhostSight(state.id)}
              disabled={isGhostPeeking}
              className="w-full py-1.5 px-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800 text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Use Quantum Sight on State {state.id}</span>
            </button>
          )}

          {/* Bottom Matrix & CTA Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {/* 2x2 Telemetry Matrix */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono flex-1">
              {/* Research */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#181133] border border-purple-900/50">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Research</span>
                </span>
                <span className="text-cyan-300 font-bold ml-2">{state.researchPotential}</span>
              </div>

              {/* Mutation */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#181133] border border-purple-900/50">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Dna className="w-3.5 h-3.5 text-pink-400" />
                  <span>Mutation</span>
                </span>
                <span className="text-pink-300 font-bold ml-2">{state.mutationPotential}</span>
              </div>

              {/* Energy */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#181133] border border-purple-900/50">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Energy</span>
                </span>
                <span className="text-amber-300 font-bold ml-2">{state.energySignature}</span>
              </div>

              {/* Signal */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#181133] border border-purple-900/50">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  <span>Signal</span>
                </span>
                <span className="text-slate-100 font-bold uppercase ml-2">
                  {state.waveformStyle === 'chaotic' ? 'CHAOTIC' : state.waveformStyle === 'sine' ? 'COHERENT' : state.waveformStyle === 'pulse' ? 'PULSING' : 'LATTICE'}
                </span>
              </div>
            </div>

            {/* Observe Button */}
            <button
              type="button"
              onClick={() => handleObserve(state.id)}
              disabled={timeLeft > 0 || isRevealing}
              className={`py-3.5 px-6 rounded-2xl font-bold font-sans text-sm transition-all flex items-center justify-center gap-2 shadow-lg shrink-0 ${
                timeLeft > 0
                  ? 'bg-purple-950/40 border border-purple-900/50 text-purple-400/60 cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 text-white shadow-[0_0_25px_rgba(217,70,239,0.45)] hover:shadow-[0_0_35px_rgba(236,72,153,0.6)] transform hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{timeLeft > 0 ? `Sealed (${timeLeft}s)` : `Observe State ${state.id}`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const totalSecs = activeExp ? Math.max(1, Math.round((activeExp.finishesAt - activeExp.startedAt) / 1000)) : 3;

  return (
    <div className={`space-y-4 ${hideHeader ? '' : 'bg-[#0e0a1f] border-2 border-purple-500/40 rounded-3xl p-5 shadow-2xl'}`}>
      {!hideHeader && (
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
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

      {/* Active Experiment View: Dual State Quantum Observation Interface (Image 1) */}
      {activeExp ? (
        <div className="space-y-4">
          {/* Superposition Banner: Countdown Ring, Striped Progress Bar & Cyberpunk Terminal */}
          <div className="rounded-2xl border border-purple-500/30 bg-[#140e2b]/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-xl">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-1/4 w-48 h-24 bg-purple-600/10 blur-2xl pointer-events-none" />

            {/* Left: Circular Countdown Timer */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 60 60">
                  {/* Background Ring */}
                  <circle cx="30" cy="30" r="24" stroke="rgba(88,28,135,0.4)" strokeWidth="4" fill="none" />
                  {/* Progress Ring with neon glow */}
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    stroke={timeLeft > 0 ? '#ec4899' : '#10b981'}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (timeLeft > 0 ? (timeLeft / totalSecs) : 0)}
                    style={{
                      filter: timeLeft > 0 ? 'drop-shadow(0 0 6px #ec4899)' : 'drop-shadow(0 0 6px #10b981)',
                      transition: 'stroke-dashoffset 0.8s linear'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-base">
                  {timeLeft > 0 ? `${timeLeft}s` : 'READY'}
                </div>
              </div>

              {/* Middle Column: Text & Striped Animated Progress Bar */}
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-bold text-white text-base leading-tight">
                    {timeLeft > 0 ? 'Chamber Sealed in Superposition' : 'Wavefunction Stabilized'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {timeLeft > 0
                      ? 'Quantum eigenstates detected • Stabilizing for collapse...'
                      : 'Quantum eigenstates resolved • Ready to collapse reality!'}
                  </p>
                </div>

                {/* Striped Diagonal Progress Bar */}
                <div className="w-full h-3 rounded-full bg-slate-950/80 border border-purple-800/60 overflow-hidden relative p-0.5">
                  <div
                    className="h-full rounded-full animate-quantum-stripes shadow-[0_0_12px_rgba(236,72,153,0.7)] transition-all duration-700"
                    style={{
                      width: timeLeft > 0
                        ? `${Math.max(15, Math.round((1 - timeLeft / totalSecs) * 100))}%`
                        : '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Retro Cyberpunk CRT Terminal Illustration */}
            <div className="hidden sm:block shrink-0">
              <CyberTerminalIllustration />
            </div>
          </div>

          {/* State A and State B Cards */}
          <div className="flex flex-col space-y-3.5">
            {activeExp.stateA && renderStateCard(activeExp.stateA, true)}
            {activeExp.stateB && renderStateCard(activeExp.stateB, false)}
          </div>
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
