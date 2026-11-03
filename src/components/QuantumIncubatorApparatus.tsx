import React from 'react';
import { Lock } from 'lucide-react';

interface QuantumIncubatorApparatusProps {
  isGeneticsUnlocked: boolean;
  activeInc: boolean;
  isIncReady: boolean;
  incSecondsRemaining: number;
}

/**
 * QuantumIncubatorApparatus
 *
 * Pixel-art animation system strictly aligned to the interior glass cylinders:
 * 1. Main Glass Cylinder (x=1124, y=292, w=128, h=233):
 *    - Left: 81.6860%, Top: 38.0208%, Width: 9.3023%, Height: 30.3385%
 *    - Strictly bounded with overflow-hidden (100% inside glass, never on roof or pipes)
 *    - Bioluminescent fluid circulation and energy shimmer
 *    - Floating DNA double helixes (left gold strand & right cyan strand)
 *    - Rising quantum micro-bubbles and sparkling nanite motes
 *    - Center: Incubation egg or sleek holographic lock badge
 * 2. Left Satellite Glass Tube (x=1075, y=430, w=38, h=95):
 *    - Left: 78.1250%, Top: 55.9896%, Width: 2.7616%, Height: 12.3698%
 * 3. Right Satellite Glass Tube (x=1264, y=430, w=38, h=95):
 *    - Left: 91.8605%, Top: 55.9896%, Width: 2.7616%, Height: 12.3698%
 * 4. Metal Base Machine Conduit LEDs (x=1155, y=534, w=65, h=8):
 *    - Left: 83.9390%, Top: 69.5313%, Width: 4.7238%, Height: 1.0417%
 */
export const QuantumIncubatorApparatus: React.FC<QuantumIncubatorApparatusProps> = ({
  isGeneticsUnlocked,
  activeInc,
  isIncReady,
  incSecondsRemaining
}) => {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-[10]"
      data-testid="quantum-incubator-apparatus"
    >
      {/* ========================================================================= */}
      {/* 1. MAIN GLASS CYLINDER (STRICTLY INSIDE GLASS FLUID)                      */}
      {/* Coords: x=1124, y=292, w=128, h=233                                       */}
      {/* Percentages: left=81.6860%, top=38.0208%, width=9.3023%, height=30.3385%  */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[81.6860%] top-[38.0208%] w-[9.3023%] h-[30.3385%] overflow-hidden rounded-t-[6px] rounded-b-[4px]"
        title="Bioluminescent Quantum Incubation Fluid"
      >
        {/* Soft Bioluminescent Fluid Shimmer & Circulation */}
        <div
          className="absolute inset-0 pointer-events-none animate-tube-fluid-shimmer"
          style={{
            background:
              'linear-gradient(180deg, rgba(34, 211, 238, 0.12) 0%, rgba(52, 211, 153, 0.08) 50%, rgba(6, 182, 212, 0.16) 100%)'
          }}
        />

        {/* Floating DNA Strands - Vertical bob & luminance pulse */}
        {/* Left Golden DNA Helix Overlay (x=10..45, y=30..180 inside glass) */}
        <div
          className="absolute left-[6%] top-[18%] w-[32%] h-[60%] pointer-events-none animate-dna-bob-gold"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.22) 0%, transparent 70%)',
            filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.35))'
          }}
        />

        {/* Right Cyan DNA Helix Overlay (x=70..105, y=20..170 inside glass) */}
        <div
          className="absolute right-[6%] top-[12%] w-[32%] h-[60%] pointer-events-none animate-dna-bob-cyan"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(34, 211, 238, 0.25) 0%, transparent 70%)',
            filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.4))'
          }}
        />

        {/* Rising Bioluminescent Micro-Bubbles (contained strictly within the 233px glass) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Bubble 1: Center-left rising bubble */}
          <div
            className="absolute rounded-full bg-cyan-200/90 shadow-[0_0_4px_#22d3ee] animate-tube-bubble-1"
            style={{ width: '3px', height: '3px', left: '26%', bottom: '6%' }}
          />

          {/* Bubble 2: Center-right ascending bubble */}
          <div
            className="absolute rounded-full bg-emerald-200/80 shadow-[0_0_3px_#34d399] animate-tube-bubble-2"
            style={{ width: '4px', height: '4px', left: '68%', bottom: '10%' }}
          />

          {/* Bubble 3: Central nanite spark */}
          <div
            className="absolute rounded-full bg-white/90 shadow-[0_0_4px_#a7f3d0] animate-tube-bubble-3"
            style={{ width: '2px', height: '2px', left: '48%', bottom: '4%' }}
          />

          {/* Bubble 4: Left gentle rising bubble */}
          <div
            className="absolute rounded-full bg-teal-200/80 shadow-[0_0_3px_#2dd4bf] animate-tube-bubble-4"
            style={{ width: '3px', height: '3px', left: '18%', bottom: '12%' }}
          />

          {/* Bubble 5: Right fast bubble */}
          <div
            className="absolute rounded-full bg-cyan-100 shadow-[0_0_4px_#38bdf8] animate-tube-bubble-5"
            style={{ width: '2.5px', height: '2.5px', left: '82%', bottom: '8%' }}
          />
        </div>

        {/* Center Chamber Element: Egg, Lockdown Badge, or Idle Superposition */}
        <div className="absolute inset-0 flex items-center justify-center">
          {activeInc ? (
            /* Active Hybrid Egg Incubating or Ready to Hatch */
            <div className={`flex flex-col items-center z-20 ${isIncReady ? 'animate-bounce' : 'anim-egg-wobble'}`}>
              <img
                src="/assets/quantum_egg_sprite.png"
                alt="Quantum Incubation Egg"
                className={`w-[42px] h-auto object-contain pixel-art ${
                  isIncReady
                    ? 'drop-shadow-[0_0_14px_#34d399] filter brightness-110'
                    : 'drop-shadow-[0_0_10px_#c084fc]'
                }`}
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/85 border border-purple-400/80 font-mono font-bold text-[8px] text-purple-200 shadow-md">
                {isIncReady ? 'READY' : `${incSecondsRemaining}s`}
              </div>
            </div>
          ) : !isGeneticsUnlocked ? (
            /* Sleek Sci-Fi Holographic Lock Badge (Crisp, centered on the egg pod) */
            <div className="flex flex-col items-center opacity-90 hover:opacity-100 transition-opacity">
              <div className="px-2 py-0.5 rounded-full bg-slate-950/80 border border-cyan-400/50 backdrop-blur-[2px] flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                <Lock className="w-2.5 h-2.5 text-cyan-300" />
                <span className="text-[7.5px] font-mono text-cyan-200 font-bold uppercase tracking-wider">
                  LVL 2
                </span>
              </div>
            </div>
          ) : (
            /* Unlocked & Ready: Gentle Superposition Gene Pulse */
            <div className="flex flex-col items-center opacity-70 animate-pulse">
              <div className="w-9 h-9 rounded-full border border-cyan-400/35 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border border-emerald-400/45 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LEFT SATELLITE GLASS TUBE (GOLDEN DNA HELIX)                           */}
      {/* Coords: x=1075, y=430, w=38, h=95                                         */}
      {/* Percentages: left=78.1250%, top=55.9896%, width=2.7616%, height=12.3698%  */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[78.1250%] top-[55.9896%] w-[2.7616%] h-[12.3698%] overflow-hidden rounded-[3px]"
        title="Sample Matrix A: Genomic Helices"
      >
        {/* Soft Golden Fluid Glow */}
        <div
          className="absolute inset-0 pointer-events-none animate-satellite-glow-gold"
          style={{
            background:
              'linear-gradient(180deg, rgba(251, 191, 36, 0.14) 0%, rgba(245, 158, 11, 0.08) 100%)'
          }}
        />

        {/* Rising Golden Gene Micro-Particle */}
        <div
          className="absolute rounded-full bg-amber-200 shadow-[0_0_3px_#fbbf24] animate-satellite-particle-gold"
          style={{ width: '2px', height: '2px', left: '46%', bottom: '15%' }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT SATELLITE GLASS TUBE (QUANTUM AMETHYST CRYSTAL)                  */}
      {/* Coords: x=1264, y=430, w=38, h=95                                         */}
      {/* Percentages: left=91.8605%, top=55.9896%, width=2.7616%, height=12.3698%  */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[91.8605%] top-[55.9896%] w-[2.7616%] h-[12.3698%] overflow-hidden rounded-[3px]"
        title="Sample Matrix B: Superposition Crystal"
      >
        {/* Soft Purple Crystal Shimmer */}
        <div
          className="absolute inset-0 pointer-events-none animate-satellite-glow-purple"
          style={{
            background:
              'linear-gradient(180deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.08) 100%)'
          }}
        />

        {/* Rising Amethyst Micro-Particle */}
        <div
          className="absolute rounded-full bg-purple-200 shadow-[0_0_3px_#c084fc] animate-satellite-particle-purple"
          style={{ width: '2px', height: '2px', left: '50%', bottom: '18%' }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 4. BASE MACHINERY STATUS INDICATOR LEDS                                   */}
      {/* Coords: x=1155, y=534, w=65, h=8                                          */}
      {/* Percentages: left=83.9390%, top=69.5313%, width=4.7238%, height=1.0417%   */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[83.9390%] top-[69.5313%] w-[4.7238%] h-[1.0417%] flex items-center justify-between px-1"
        title="Incubator Power Conduit"
      >
        <div className="w-1.5 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee] animate-machinery-led-1" />
        <div className="w-2.5 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399] animate-machinery-led-2" />
        <div className="w-1.5 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee] animate-machinery-led-3" />
      </div>
    </div>
  );
};
