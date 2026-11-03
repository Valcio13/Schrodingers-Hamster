import React, { useState, useRef } from 'react';
import { PlayerState, HAMSTER_SPECIES, isQuantumGeneticsUnlocked } from '../types/game';
import { SqueekTelemetry } from '../../worker/squeekchain';
import { PixelHamster } from './PixelHamster';
import { PixelHybridHamster } from './PixelHybridHamster';
import { SqueektoshiKineticRunner } from './SqueektoshiKineticRunner';
import { ScientistHamsterCompanion } from './ScientistHamsterCompanion';
import { QuantumChamberPorthole } from './QuantumChamberPorthole';
import { ResearchDeskApparatus } from './ResearchDeskApparatus';
import { CeilingLightingApparatus } from './CeilingLightingApparatus';
import { QuantumIncubatorApparatus } from './QuantumIncubatorApparatus';
import { Sparkles, Eye, Info, Lock, Zap, Clock, HelpCircle } from 'lucide-react';
import { audio } from '../services/audio';

interface ClickRipple {
  id: number;
  x: number;
  y: number;
  color: 'amber' | 'purple' | 'cyan' | 'pink' | 'lime';
}

interface PetParticle {
  id: number;
  text: string;
}

interface LabEnvironmentProps {
  player: PlayerState;
  telemetry: SqueekTelemetry | null;
  onOpenExperiment: () => void;
  onObserveExperiment: () => void;
  onInspectAssistant?: () => void;
  onOpenIncubator?: () => void;
  onOpenResearch?: () => void;
  onSyncWork?: () => void;
  onOpenBattery?: () => void;
  onOpenHowToPlay?: () => void;
  activeSidePanel?: 'chamber' | 'battery' | 'paradox' | null;
}

export const LabEnvironment: React.FC<LabEnvironmentProps> = ({
  player,
  telemetry,
  onOpenExperiment,
  onObserveExperiment,
  onInspectAssistant,
  onOpenIncubator,
  onOpenResearch,
  onSyncWork,
  onOpenBattery,
  onOpenHowToPlay,
  activeSidePanel = null
}) => {
  const rpm = telemetry?.rpm || 0;
  const isRunning = rpm > 0;
  const isTelemetryOnline = telemetry !== null;
  const wheelPeriod = isRunning ? Math.max(0.35, Math.min(6.0, 60 / Math.max(1, rpm))) : 0;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [showSpeech, setShowSpeech] = useState<boolean>(false);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const [isPetting, setIsPetting] = useState<boolean>(false);
  const [petParticles, setPetParticles] = useState<PetParticle[]>([]);
  const lastHoverSoundRef = useRef<number>(0);

  const triggerHoverSound = () => {
    const now = Date.now();
    if (now - lastHoverSoundRef.current > 120) {
      lastHoverSoundRef.current = now;
      audio.playHover();
    }
  };

  const spawnRipple = (e: React.MouseEvent<HTMLElement>, color: 'amber' | 'purple' | 'cyan' | 'pink' | 'lime') => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newRipple: ClickRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      color
    };
    setRipples(prev => [...prev.slice(-4), newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 460);
  };

  const triggerPetHamster = (e: React.MouseEvent<HTMLElement>) => {
    audio.playSqueak();
    spawnRipple(e, 'pink');
    setIsPetting(true);
    setTimeout(() => setIsPetting(false), 450);

    const petPhrases = [
      '🐹 Squeek! 💕',
      '✨ *happy squeeks*',
      '❤️ Squeeky loves you!',
      '⚡ Quantum Squeek!',
      '🌟 *purr-squeek*'
    ];
    const phrase = petPhrases[Math.floor(Math.random() * petPhrases.length)];
    const particle: PetParticle = {
      id: Date.now() + Math.random(),
      text: phrase
    };
    setPetParticles(prev => [...prev.slice(-2), particle]);
    setTimeout(() => {
      setPetParticles(prev => prev.filter(p => p.id !== particle.id));
    }, 900);
  };

  // Active assistant resolution
  const activeCompanion =
    (player.hamsters || []).find(
      h =>
        h.id === player.activeAssistantHamsterId ||
        (player.activeAssistant && h.speciesId === player.activeAssistant && h.isAssistant)
    ) ||
    (player.activeAssistant
      ? (player.hamsters || []).find(h => h.speciesId === player.activeAssistant)
      : null);

  const assistantSpecies = activeCompanion
    ? HAMSTER_SPECIES[activeCompanion.speciesId]
    : player.activeAssistant
    ? HAMSTER_SPECIES[player.activeAssistant]
    : null;

  const labHybrid = player.activeLabHybridId
    ? (player.hybrids || []).find(h => h.id === player.activeLabHybridId)
    : null;

  // Determine existence status (missing / deceased hamsters must NOT be rendered on cushion)
  const isHybridCompanion = !!labHybrid;
  const isCompanionAvailable = labHybrid
    ? labHybrid.existenceStatus !== 'missing' && labHybrid.existenceStatus !== 'deceased'
    : (activeCompanion !== null || player.activeAssistant !== null);

  const isGeneticsUnlocked = isQuantumGeneticsUnlocked(player);
  const activeExp = player.activeExperiment;
  const isExpReady = activeExp && Date.now() >= activeExp.finishesAt;
  const isExpRunning = activeExp && !isExpReady;
  const expSecondsRemaining = activeExp ? Math.max(0, Math.ceil((activeExp.finishesAt - Date.now()) / 1000)) : 0;

  const activeInc = player.activeIncubation;
  const isIncReady = activeInc && Date.now() >= activeInc.finishesAt;
  const isIncRunning = activeInc && !isIncReady;
  const incSecondsRemaining = activeInc ? Math.max(0, Math.ceil((activeInc.finishesAt - Date.now()) / 1000)) : 0;

  // Battery metrics & Dynamic Analog Gauge
  // Approved direction: 100% (Full Battery) = Green zone (left / -65°), 0% (Empty Battery) = Red zone (right / +65°)
  const rawPct = (player.batteryEnergy / (player.batteryCapacity || 1)) * 100;
  const clampedPct = Math.max(0, Math.min(100, isNaN(rawPct) ? 0 : rawPct));
  const batteryPct = Math.round(clampedPct);
  // Dial arc spans 130°: +65° (0% / empty / red zone) to -65° (100% / full / green zone)
  const needleAngle = 65 - (clampedPct / 100) * 130;

  // Personality quotes
  const personalityQuotes: Record<string, string> = {
    Curious: "Did you hear that quantum click? Something is observing us back!",
    Sleepy: "Zzz... the superposition is warm and comfortable today...",
    Mischievous: "I didn't chew through the tachyon conduit... it was already glowing like that!",
    Brave: "Fear not the chaotic state! We conquer entropy together!",
    Shy: "I'll keep watch from behind the battery array... squeek!"
  };
  const companionPersonality = activeCompanion?.personality || labHybrid?.personality || 'Curious';
  const companionQuote = personalityQuotes[companionPersonality] || "Running quantum diagnostics!";
  const companionName = activeCompanion?.nickname || assistantSpecies?.name || labHybrid?.nickname || 'Squeeky';

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-slate-700/80 bg-[#070b14] shadow-2xl transition-all duration-300">
      
      {/* THE HANDCRAFTED PIXEL-ART LABORATORY SCENE (16:9 VIEWPORT) */}
      <div ref={containerRef} className="relative w-full h-full aspect-[16/9] select-none overflow-hidden bg-black">
        
        {/* Core Illustrated Pixel-Art Background Artwork */}
        <img
          src="/assets/schrodingers_hamster_lab.jpg"
          alt="Schrödinger's Hamster Pixel-Art Laboratory"
          className="w-full h-full object-fill pixel-art pointer-events-none select-none"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Subtle Ambient CRT Scanline & Edge Vignette */}
        <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-15" />
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]" />

        {/* Atmospheric Vintage Edison Ceiling Bulbs & Banker's Lamp Lighting */}
        <CeilingLightingApparatus />

        {/* ========================================================================= */}
        {/* PHASE THREE.C: LAB LEVEL PROGRESSION (LEVEL 1 / LEVEL 2 / LEVEL 3)        */}
        {/* ========================================================================= */}
        

        {/* Level 2+ Environmental Conduit Illumination */}
        {player.labLevel >= 2 && (
          <div className="absolute left-[70%] top-[40%] w-[18%] h-[24%] pointer-events-none z-[4] opacity-40">
            <div className="w-full h-full rounded-full bg-cyan-400/15 blur-md animate-pulse" />
          </div>
        )}

        {/* Level 3 Environmental Superconducting & Portal Resonance */}
        {player.labLevel >= 3 && (
          <div className="absolute left-[45%] top-[35%] w-[24%] h-[26%] pointer-events-none z-[5] opacity-50">
            <div className="w-full h-full rounded-full bg-purple-500/15 blur-lg anim-hud-pulse" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* DYNAMIC LAYER 0: KINETIC GENERATOR WHEEL & SQUEEKTOSHI SPRINT / SLEEP     */}
        {/* Wheel Center: x=157, y=395; Box: 280x280 (left: 1.2355%, top: 33.2031%)   */}
        {/* Squeektoshi: x=105, y=428, w=127, h=72 (left: 7.6308%, top: 55.7292%)    */}
        {/* ========================================================================= */}
        {/* Clean Wheel Interior Backdrop: neutralizes old static standing sprite */}
        <div
          className="absolute left-[1.2355%] top-[33.2031%] w-[20.3488%] h-[36.4583%] pointer-events-none select-none z-[6]"
          data-testid="kinetic-wheel-backdrop"
        >
          <img
            src="/assets/kinetic_wheel_backdrop.png"
            alt=""
            className="w-full h-full object-contain pixel-art"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Rotating Wheel Spinner (spokes, hub, and rim rungs) */}
        <div
          className="absolute left-[1.2355%] top-[33.2031%] w-[20.3488%] h-[36.4583%] pointer-events-none select-none z-[7]"
          data-testid="kinetic-wheel-spinner"
        >
          <img
            src="/assets/kinetic_wheel_spinner.png"
            alt="Kinetic Wheel Rotating Assembly"
            className={`w-full h-full object-contain pixel-art ${isRunning ? 'anim-wheel-spin' : ''}`}
            style={{
              imageRendering: 'pixelated',
              animationDuration: isRunning ? `${wheelPeriod}s` : undefined,
              transform: isRunning ? undefined : 'rotate(0deg)',
              transformOrigin: '50% 50%',
              transition: isRunning ? 'none' : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          />
        </div>

        {/* Cozy Hamster Sleeping Nest (visible when resting, fades out during sprint) */}
        <div
          className={`absolute left-[1.2355%] top-[33.2031%] w-[20.3488%] h-[36.4583%] pointer-events-none select-none z-[8] transition-opacity duration-300 ${
            isRunning ? 'opacity-0' : 'opacity-100'
          }`}
          data-testid="kinetic-wheel-nest"
        >
          <img
            src="/assets/kinetic_wheel_nest.png"
            alt="Cozy Hamster Bedding Nest"
            className="w-full h-full object-contain pixel-art"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Squeektoshi Hamster (Sprints when isRunning, Sleeps in nest when resting) */}
        <div
          className="absolute left-[7.6308%] top-[55.7292%] w-[9.2297%] h-[9.375%] pointer-events-none select-none z-[9]"
          data-testid="squeektoshi-kinetic-runner"
        >
          <SqueektoshiKineticRunner isRunning={isRunning} rpm={rpm} />
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC READOUT 1A: KINETIC GENERATOR ANALOG BATTERY GAUGE NEEDLE         */}
        {/* Exact dial location in 1376x768: x=320..402, y=412..468, pivot=(41, 44)   */}
        {/* ========================================================================= */}
        <div
          className="absolute left-[23.2558%] top-[53.6458%] w-[5.9593%] h-[7.2917%] pointer-events-none z-10 select-none overflow-visible"
          title={`Generator Battery Gauge: ${batteryPct}% (${player.batteryEnergy}/${player.batteryCapacity} E)`}
          data-testid="kinetic-generator-gauge"
        >
          <svg
            viewBox="0 0 82 56"
            className="w-full h-full overflow-visible"
            style={{ imageRendering: 'pixelated' }}
          >
            {/* Smoothly animated needle group rotating around (41, 45.5) */}
            <g
              data-testid="gauge-needle"
                            style={{
                                transform: `rotate(${needleAngle}deg)`,
                transformOrigin: '41px 45.5px',
                transformBox: 'view-box',
                transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                willChange: 'transform'
              }}
            >
              {/* Subtle needle shadow */}
              <polygon
                points="40.5,45.5 41.7,45.5 41.3,20 40.7,20"
                fill="rgba(30, 25, 20, 0.35)"
                transform="translate(0.5, 0.5)"
              />
              {/* Tapered dark pixel needle extending into colored arc */}
              <polygon
                points="40.3,45.5 41.7,45.5 41.2,19.5 40.8,19.5"
                fill="#1c1917"
              />
              {/* Needle center highlight spine */}
              <line
                x1="41"
                y1="45"
                x2="41"
                y2="20"
                stroke="#443c34"
                strokeWidth="0.5"
              />
              {/* Fine needle tip */}
              <circle
                cx="41"
                cy="19.5"
                r="0.4"
                fill="#151210"
              />
            </g>

            {/* Symmetrical metallic pivot hub cap sitting flat on bottom bezel */}
            <path
              d="M 37.5,45.5 A 3.5,3.5 0 0 1 44.5,45.5 Z"
              fill="#2c241c"
              stroke="#4a3e30"
              strokeWidth="0.6"
            />
            {/* Hub specular highlight */}
            <circle
              cx="40.5"
              cy="43.8"
              r="0.8"
              fill="#786c5c"
            />
          </svg>
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC READOUT 1B: GENERATOR GAUGE HUD OVERLAY (Digital Readout)          */}
        {/* Exact screen location: x=315..395, y=467..497                            */}
        {/* ========================================================================= */}
        <div
          className="absolute left-[23.0%] top-[60.9%] w-[5.7%] h-[3.8%] flex items-center justify-center pointer-events-none z-10 overflow-hidden"
          title={`Generator Battery: ${batteryPct}% (${player.batteryEnergy}/${player.batteryCapacity} E)`}
        >
          <span
            className={`font-mono text-[9px] sm:text-[10px] md:text-[11px] font-black tracking-tighter select-none ${
              batteryPct >= 90
                ? 'text-emerald-400 drop-shadow-[0_0_4px_#34d399]'
                : batteryPct >= 40
                ? 'text-lime-300 drop-shadow-[0_0_3px_#a3e635]'
                : 'text-amber-400 drop-shadow-[0_0_3px_#fbbf24]'
            }`}
            style={{ imageRendering: 'pixelated' }}
          >
            {batteryPct}%
          </span>
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC OVERLAY 1C: QUANTUM CHAMBER PORTHOLE (Hypnotic Swirling Vortex)   */}
        {/* Exact circular porthole: center=(690.5, 368.5), diam=190 (13.81% x 24.74%)*/}
        {/* ========================================================================= */}
        <div
          className="absolute left-[50.1817%] top-[47.9818%] -translate-x-1/2 -translate-y-1/2 w-[13.8081%] h-[24.7396%] pointer-events-none select-none z-[8]"
          title="Schrödinger's Quantum Chamber Porthole"
        >
          <QuantumChamberPorthole
            isExpRunning={Boolean(isExpRunning)}
            isExpReady={Boolean(isExpReady)}
          />
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC OVERLAY 2: CUSHION COMPANION RENDERER (Animated Idle Companion)   */}
        {/* Exact cushion area: x=951, y=504, w=104, h=146                           */}
        {/* ========================================================================= */}
        <div className={`absolute left-[69.1134%] top-[65.625%] w-[7.5581%] h-[19.0104%] pointer-events-none z-10 transition-transform origin-bottom ${isPetting ? 'anim-squish-bounce' : ''}`}>

          {isCompanionAvailable ? (
            isHybridCompanion || (activeCompanion && activeCompanion.speciesId !== 'normal') ? (
              <div className="flex flex-col items-center justify-end w-full h-full">
                {isHybridCompanion && labHybrid ? (
                  <div className="transform scale-95 origin-bottom">
                    <PixelHybridHamster
                      hybrid={labHybrid}
                      size="lg"
                      className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)]"
                    />
                  </div>
                ) : activeCompanion ? (
                  <div className="transform scale-95 origin-bottom">
                    <PixelHamster
                      speciesId={activeCompanion.speciesId}
                      size="lg"
                      className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)]"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <ScientistHamsterCompanion />
            )
          ) : null}
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC LAYER 2.5: RESEARCH DESK APPARATUS (Oscilloscope, Flame, Flasks)  */}
        {/* ========================================================================= */}
        <ResearchDeskApparatus />

        {/* ========================================================================= */}
        {/* DYNAMIC LAYER 3: QUANTUM INCUBATOR & GENETICS APPARATUS                   */}
        {/* ========================================================================= */}
        <QuantumIncubatorApparatus
          isGeneticsUnlocked={Boolean(isGeneticsUnlocked)}
          activeInc={Boolean(activeInc)}
          isIncReady={Boolean(isIncReady)}
          incSecondsRemaining={incSecondsRemaining}
        />

        {/* ========================================================================= */}
        {/* HOTSPOT 1: SQUEEKTOSHI'S KINETIC GENERATOR & WHEEL (LEFT)                */}
        {/* ========================================================================= */}
        <div
          onClick={(e) => {
            audio.playCharge();
            spawnRipple(e, 'amber');
            if (onOpenBattery) {
              onOpenBattery();
            } else if (onSyncWork) {
              onSyncWork();
            }
          }}
          onMouseEnter={() => {
            triggerHoverSound();
            setHoveredStation(
              !isTelemetryOnline
                ? `⚡ Kinetic Dynamo • Telemetry Syncing... • Battery: ${player.batteryEnergy}/${player.batteryCapacity} E`
                : `⚡ Kinetic Dynamo • ${isRunning ? `${rpm.toFixed(1)} RPM (Generating Power)` : 'Resting (0 RPM)'} • Battery: ${player.batteryEnergy}/${player.batteryCapacity} E`
            );
          }}
          onMouseLeave={() => setHoveredStation(null)}
          className={`group/dynamo absolute left-[2%] top-[14%] w-[32%] h-[76%] rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.985] ${
            activeSidePanel === 'battery'
              ? 'ring-1 ring-amber-400/80 bg-amber-400/10'
              : 'hover:ring-1 hover:ring-amber-400/60 hover:bg-amber-400/5'
          }`}
          title="Click to inspect Battery Storage & Squeekchain work"
        >
          {/* Cyber HUD Corner Reticles */}
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/dynamo:opacity-100 transition-opacity duration-200">
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl border-amber-400/90" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr border-amber-400/90" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl border-amber-400/90" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br border-amber-400/90" />
          </div>

          {/* Floating Action Badge on Hover */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-amber-400/80 text-amber-300 font-mono text-[9px] font-bold shadow-[0_0_12px_rgba(251,191,36,0.35)] pointer-events-none opacity-0 group-hover/dynamo:opacity-100 transition-all duration-200 flex items-center gap-1 whitespace-nowrap z-20">
            <span>⚡ DYNAMO</span>
            <span className="text-[8px] text-amber-200/80 font-normal">• INSPECT</span>
          </div>
          {/* Subtle spark emitter when running */}
          {isRunning && (
            <div className="absolute top-[28%] left-[45%] text-amber-300 text-sm animate-ping pointer-events-none">
              ⚡
            </div>
          )}

          {/* Sleeping particles when idle */}
          {!isRunning && (
            <div className="absolute top-[34%] left-[46%] pointer-events-none text-slate-300 font-mono font-bold animate-pulse text-[11px]">
              <span className="text-[9px] block">z</span>
              <span className="text-[10px] block translate-x-1">z</span>
              <span className="text-xs block translate-x-2">Z</span>
            </div>
          )}

          {/* Telemetry Offline Notice */}
          {!isTelemetryOnline && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-950/80 border border-amber-600/40 text-[8px] font-mono text-amber-300 pointer-events-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Syncing</span>
            </div>
          )}

          {/* Mobile Tap Target Indicator */}
          <div className="sm:hidden absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-amber-500/40 text-[9px] font-mono text-amber-300 pointer-events-none">
            ⚡ Dynamo
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HOTSPOT 2: SCHRÖDINGER'S QUANTUM CHAMBER (CENTER VAULT)                  */}
        {/* ========================================================================= */}
        <div
          onClick={(e) => {
            audio.playZap();
            spawnRipple(e, 'purple');
            if (isExpReady) {
              onObserveExperiment();
            } else {
              onOpenExperiment();
            }
          }}
          onMouseEnter={() => {
            triggerHoverSound();
            setHoveredStation(
              isExpReady
                ? '★ Wavefunction Stabilized! Click to observe & collapse reality.'
                : isExpRunning
                ? `⚛️ Chamber Sealed: Superposition in progress (${expSecondsRemaining}s remaining).`
                : '⚛️ Quantum Chamber: Click to select experiment tier.'
            );
          }}
          onMouseLeave={() => setHoveredStation(null)}
          className={`group/chamber absolute left-[35%] top-[12%] w-[29%] h-[76%] rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.985] ${
            activeSidePanel === 'chamber'
              ? 'ring-1 ring-purple-400/80 bg-purple-500/10'
              : 'hover:ring-1 hover:ring-purple-400/60 hover:bg-purple-500/5'
          }`}
          title="Click to operate the Quantum Chamber"
        >
          {/* Cyber HUD Corner Reticles */}
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/chamber:opacity-100 transition-opacity duration-200">
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl border-purple-400/90" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr border-purple-400/90" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl border-purple-400/90" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br border-purple-400/90" />
          </div>

          {/* Floating Action Badge on Hover */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-purple-400/80 text-purple-300 font-mono text-[9px] font-bold shadow-[0_0_12px_rgba(192,132,252,0.35)] pointer-events-none opacity-0 group-hover/chamber:opacity-100 transition-all duration-200 flex items-center gap-1 whitespace-nowrap z-20">
            <span>⚛️ VAULT</span>
            <span className="text-[8px] text-purple-200/80 font-normal">• {isExpReady ? 'OBSERVE' : 'OPERATE'}</span>
          </div>
          {/* Live Coherent Singularity Highlight ONLY when Ready to Observe */}
          {isExpReady && (
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none animate-bounce">
              <div className="px-2.5 py-1 rounded-full bg-lime-400 text-slate-950 font-mono font-bold text-[10px] shadow-[0_0_20px_#a3e635] flex items-center gap-1">
                <span>OBSERVE</span>
                <Eye className="w-3 h-3" />
              </div>
            </div>
          )}

          {/* Spinning ring & countdown when actively sealed in superposition */}
          {isExpRunning && (
            <div className="absolute top-[33%] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <div className="w-12 h-12 rounded-full border-2 border-purple-400/60 border-t-cyan-300 animate-spin" />
              <div className="mt-1 px-2 py-0.5 rounded bg-slate-950/85 border border-purple-400/80 text-[9px] font-mono text-cyan-300 font-bold">
                {expSecondsRemaining}s
              </div>
            </div>
          )}

          {/* Mobile Tap Target Indicator */}
          <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-purple-500/40 text-[9px] font-mono text-purple-300 pointer-events-none">
            ⚛️ Chamber
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HOTSPOT 3: THE QUANTUM INCUBATOR (RIGHT CYLINDER)                        */}
        {/* ========================================================================= */}
        <div
          onClick={(e) => {
            audio.playBubble();
            spawnRipple(e, 'cyan');
            if (onOpenIncubator) onOpenIncubator();
          }}
          onMouseEnter={() => {
            triggerHoverSound();
            setHoveredStation(
              !isGeneticsUnlocked
                ? '🔒 Quantum Incubator: Locked (Requires Level 2 & Genetics Research)'
                : isIncReady
                ? '🧬 Incubator: Superposition ready! Click to hatch hybrid.'
                : activeInc
                ? `🧬 Incubator: Incubating hybrid egg (${incSecondsRemaining}s remaining).`
                : '🧬 Incubator: Click to breed procedural quantum hybrids'
            );
          }}
          onMouseLeave={() => setHoveredStation(null)}
          className="group/incubator absolute left-[77%] top-[12%] w-[19%] h-[76%] rounded-2xl cursor-pointer hover:ring-1 hover:ring-cyan-400/60 hover:bg-cyan-400/5 transition-all duration-200 active:scale-[0.985]"
          title="Click to open the Quantum Incubator"
        >
          {/* Cyber HUD Corner Reticles */}
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/incubator:opacity-100 transition-opacity duration-200">
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl border-cyan-400/90" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr border-cyan-400/90" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl border-cyan-400/90" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br border-cyan-400/90" />
          </div>

          {/* Floating Action Badge on Hover */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-cyan-400/80 text-cyan-300 font-mono text-[9px] font-bold shadow-[0_0_12px_rgba(34,211,238,0.35)] pointer-events-none opacity-0 group-hover/incubator:opacity-100 transition-all duration-200 flex items-center gap-1 whitespace-nowrap z-20">
            <span>🧬 INCUBATOR</span>
            <span className="text-[8px] text-cyan-200/80 font-normal">• {isIncReady ? 'HATCH' : 'GENETICS'}</span>
          </div>
          {/* Ready to hatch badge */}
          {isIncReady && (
            <div className="absolute top-[32%] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none animate-bounce">
              <div className="px-2 py-0.5 rounded-full bg-pink-400 text-slate-950 font-mono font-bold text-[9px] shadow-[0_0_15px_#f472b6] flex items-center gap-1">
                <span>HATCH</span>
                <Sparkles className="w-3 h-3" />
              </div>
            </div>
          )}

          {/* Mobile Tap Target Indicator */}
          <div className="sm:hidden absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-pink-500/40 text-[9px] font-mono text-pink-300 pointer-events-none">
            🧬 Incubator
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HOTSPOT 4: RESEARCH DESK / NOTEBOOK (MIDGROUND TABLE)                    */}
        {/* ========================================================================= */}
        <div
          onClick={(e) => {
            audio.playPaper();
            spawnRipple(e, 'cyan');
            if (onOpenResearch) onOpenResearch();
          }}
          onMouseEnter={() => {
            triggerHoverSound();
            setHoveredStation(`📓 Research Notebook • ${player.researchInsight} Notes • Click to research upgrades`);
          }}
          onMouseLeave={() => setHoveredStation(null)}
          className="group/research absolute left-[47%] top-[67%] w-[20%] h-[27%] rounded-xl cursor-pointer hover:ring-1 hover:ring-cyan-400/60 hover:bg-cyan-400/5 transition-all duration-200 active:scale-[0.98]"
          title="Click to open Schrödinger's Research Notebook"
        >
          {/* Cyber HUD Corner Reticles */}
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/research:opacity-100 transition-opacity duration-200">
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 rounded-tl border-cyan-400/90" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr border-cyan-400/90" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 rounded-bl border-cyan-400/90" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 rounded-br border-cyan-400/90" />
          </div>

          {/* Floating Action Badge on Hover */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-cyan-400/80 text-cyan-300 font-mono text-[9px] font-bold shadow-[0_0_12px_rgba(34,211,238,0.35)] pointer-events-none opacity-0 group-hover/research:opacity-100 transition-all duration-200 flex items-center gap-1 whitespace-nowrap z-20">
            <span>📓 RESEARCH</span>
            <span className="text-[8px] text-cyan-200/80 font-normal">• UPGRADES</span>
          </div>
          {/* Mobile Tap Target Indicator */}
          <div className="sm:hidden absolute bottom-1 left-2 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-cyan-500/40 text-[8px] font-mono text-cyan-300 pointer-events-none">
            📓 Research
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HOTSPOT 5: HAMSTER COMPANION ON VELVET CUSHION                           */}
        {/* ========================================================================= */}
        <div
          onClick={(e) => {
            triggerPetHamster(e);
            setShowSpeech(prev => !prev);
          }}
          onMouseEnter={() => {
            triggerHoverSound();
            setHoveredStation(
              isCompanionAvailable
                ? `🐹 ${companionName} (${companionPersonality}) • Click to pet or inspect in QuantumDex`
                : `🐹 Velvet Cushion (Empty) • Select companion in QuantumDex`
            );
          }}
          onMouseLeave={() => setHoveredStation(null)}
          className="group/hamster absolute left-[67.5%] top-[61%] w-[10.5%] h-[28%] rounded-xl cursor-pointer flex flex-col items-center justify-center hover:ring-1 hover:ring-pink-400/60 hover:bg-pink-500/5 transition-all duration-200 active:scale-[0.97]"
          title={
            isCompanionAvailable
              ? `${companionName}: Click to pet or inspect in QuantumDex`
              : 'Velvet Cushion: Click to choose companion'
          }
        >
          {/* Cyber HUD Corner Reticles */}
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/hamster:opacity-100 transition-opacity duration-200">
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 rounded-tl border-pink-400/90" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr border-pink-400/90" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 rounded-bl border-pink-400/90" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 rounded-br border-pink-400/90" />
          </div>

          {/* Floating Action Badge on Hover */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-pink-400/80 text-pink-300 font-mono text-[9px] font-bold shadow-[0_0_12px_rgba(244,114,182,0.4)] pointer-events-none opacity-0 group-hover/hamster:opacity-100 transition-all duration-200 flex items-center gap-1 whitespace-nowrap z-20">
            <span>🐹 PET {companionName.toUpperCase()}</span>
          </div>
          {/* Mobile Tap Target Indicator */}
          <div className="sm:hidden absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-purple-500/40 text-[8px] font-mono text-purple-300 pointer-events-none whitespace-nowrap">
            🐹 {isCompanionAvailable ? companionName : 'Cushion'}
          </div>

          {/* Interactive Speech / Thought Bubble (Only if companion is alive & present) */}
          {isCompanionAvailable && (
            <div
              className={`absolute -top-16 -left-20 sm:-left-24 w-44 sm:w-52 p-2 rounded-xl bg-slate-950/95 border border-purple-400/80 text-slate-100 shadow-2xl transition-all duration-200 pointer-events-none z-30 ${
                showSpeech ? 'opacity-100 scale-100' : 'opacity-0 group-hover/hamster:opacity-100 group-hover/hamster:scale-100'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-mono font-bold text-purple-300 uppercase">
                  {companionName}
                </span>
                <span className="text-[8px] px-1 rounded bg-purple-950 text-purple-200 font-mono">
                  {companionPersonality}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] leading-tight text-slate-200 italic font-sans mb-1.5">
                "{companionQuote}"
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-purple-500/30 pointer-events-auto">
                <span className="text-[8px] text-pink-300/80 font-mono">Click to pet 💕</span>
                {onInspectAssistant && (
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      audio.playClick();
                      onInspectAssistant();
                    }}
                    className="text-[8px] font-mono font-bold text-pink-300 hover:text-white px-1.5 py-0.5 rounded bg-pink-950/80 hover:bg-pink-900 border border-pink-500/40 transition-colors shadow-sm"
                  >
                    Inspect Dex →
                  </button>
                )}
              </div>
              {/* Bubble Tail */}
              <div className="absolute -bottom-1.5 right-10 w-2.5 h-2.5 bg-slate-950 border-r border-b border-purple-400 transform rotate-45" />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
                {/* Interactive Petting Particles */}
        {petParticles.map(p => (
          <div
            key={p.id}
            className="absolute left-[73.5%] top-[60%] -translate-x-1/2 pointer-events-none z-40 font-mono font-bold text-[10px] text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.9)] bg-slate-950/85 px-2.5 py-0.5 rounded-full border border-pink-400/80 whitespace-nowrap anim-float-particle"
          >
            {p.text}
          </div>
        ))}

        {/* Interactive Quantum Shockwave Rings on Click */}
        {ripples.map(r => {
          const borderColors = {
            amber: 'border-amber-400 bg-amber-400/20 shadow-[0_0_16px_rgba(251,191,36,0.8)]',
            purple: 'border-purple-400 bg-purple-500/20 shadow-[0_0_16px_rgba(192,132,252,0.8)]',
            cyan: 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_16px_rgba(34,211,238,0.8)]',
            pink: 'border-pink-400 bg-pink-400/20 shadow-[0_0_16px_rgba(244,114,182,0.8)]',
            lime: 'border-lime-400 bg-lime-400/20 shadow-[0_0_16px_rgba(163,230,53,0.8)]'
          };
          return (
            <div
              key={r.id}
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
              className={`absolute w-14 h-14 rounded-full border-2 pointer-events-none z-30 anim-shockwave ${borderColors[r.color] || borderColors.cyan}`}
            />
          );
        })}

        {/* CLEAN INTERACTIVE STATUS TICKER BAR AT BOTTOM OF CANVAS                  */}
        {/* ========================================================================= */}
        <div className="absolute bottom-2 inset-x-3 pointer-events-none flex items-center justify-between z-10 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              <span>Interactive Laboratory</span>
            </div>

            {onOpenHowToPlay && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  audio.playClick();
                  onOpenHowToPlay();
                }}
                className="px-2 py-0.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 hover:text-white flex items-center gap-1 backdrop-blur-sm pointer-events-auto transition-colors shadow-sm"
                title="Open How to Play Field Guide"
              >
                <HelpCircle className="w-3 h-3 text-purple-400" />
                <span>Guide</span>
              </button>
            )}
          </div>

          {hoveredStation && (
            <div className="px-3 py-0.5 rounded-lg bg-slate-950/90 border border-purple-500/70 text-purple-200 flex items-center gap-1.5 shadow-md backdrop-blur-sm animate-fade-in">
              <Info className="w-3 h-3 text-purple-400 shrink-0" />
              <span>{hoveredStation}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
