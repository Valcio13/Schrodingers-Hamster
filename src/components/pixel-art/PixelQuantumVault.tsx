import React from 'react';
import { ActiveExperimentState } from '../../types/game';

interface PixelQuantumVaultProps {
  activeExp: ActiveExperimentState | null | undefined;
  isReady: boolean;
  isRunning: boolean;
  onClick?: () => void;
  className?: string;
}

export const PixelQuantumVault: React.FC<PixelQuantumVaultProps> = ({
  activeExp,
  isReady,
  isRunning,
  onClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative select-none cursor-pointer group flex flex-col items-center ${className}`}
      title={
        isReady
          ? 'Wavefunction Stabilized! Click to observe and collapse superposition into reality!'
          : isRunning
          ? 'Superposition in progress: Chamber sealed in quantum isolation.'
          : 'Schrödinger Quantum Chamber: Click to prepare and conduct an experiment.'
      }
    >
      {/* Top Station Status Badge */}
      <div
        className={`mb-2 px-3 py-1 rounded-full border-2 text-xs font-mono font-bold flex items-center gap-2 shadow-lg transition-all duration-300 transform group-hover:-translate-y-0.5 ${
          isReady
            ? 'bg-lime-950/95 border-lime-400 text-lime-300 animate-pulse'
            : isRunning
            ? 'bg-purple-950/95 border-purple-500 text-purple-300'
            : 'bg-slate-900/95 border-slate-700 group-hover:border-purple-400 text-slate-200'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isReady
              ? 'bg-lime-400 animate-ping'
              : isRunning
              ? 'bg-purple-400 animate-ping'
              : 'bg-slate-500'
          }`}
        />
        <span className="uppercase tracking-wider text-[11px]">QUANTUM CHAMBER</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            isReady
              ? 'bg-lime-900/90 text-white font-bold'
              : isRunning
              ? 'bg-purple-900/80 text-purple-200'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isReady ? 'READY TO OBSERVE!' : isRunning ? 'SEALED' : 'CALIBRATED'}
        </span>
      </div>

      {/* The Physical Pixel Art Chamber Vault */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
        <svg
          viewBox="0 0 260 270"
          className="w-full h-full drop-shadow-2xl pixel-art"
          style={{ imageRendering: 'pixelated' }}
        >
          <defs>
            {/* Vault Metal Gradient */}
            <linearGradient id="vaultPlate" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Brass Console Gradient */}
            <linearGradient id="brassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Glowing Singularity Filter */}
            <filter id="quantumCoreGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Hazard Stripe Pattern */}
            <pattern id="hazardStripe" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="16" fill="#facc15" />
              <rect x="8" width="8" height="16" fill="#1e293b" />
            </pattern>
          </defs>

          {/* 1. Industrial Concrete & Steel Pedestal Base */}
          <rect x="25" y="244" width="210" height="16" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="35" y="238" width="190" height="8" fill="#1e293b" />
          {/* Base Anchor Bolts */}
          <circle cx="45" cy="252" r="3" fill="#64748b" />
          <circle cx="75" cy="252" r="3" fill="#64748b" />
          <circle cx="185" cy="252" r="3" fill="#64748b" />
          <circle cx="215" cy="252" r="3" fill="#64748b" />

          {/* 2. Top Warning Siren / Beacon Tower */}
          <g transform="translate(112, 10)">
            {/* Beacon Mount Stalk */}
            <rect x="14" y="16" width="8" height="12" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            {/* Beacon Glass Dome */}
            <path
              d="M 10 16 C 10 5, 26 5, 26 16 Z"
              fill={
                isReady
                  ? '#a3e635'
                  : isRunning
                  ? '#c084fc'
                  : '#ef4444'
              }
              stroke="#0f172a"
              strokeWidth="2"
              className={isReady || isRunning ? 'animate-pulse' : ''}
              filter="url(#quantumCoreGlow)"
            />
            {/* Light beam rays if active */}
            {(isReady || isRunning) && (
              <g className="animate-spin" style={{ transformOrigin: '18px 12px', animationDuration: '3s' }}>
                <line x1="18" y1="2" x2="18" y2="-6" stroke={isReady ? '#bef264' : '#e9d5ff'} strokeWidth="2" />
                <line x1="26" y1="6" x2="34" y2="2" stroke={isReady ? '#bef264' : '#e9d5ff'} strokeWidth="2" />
                <line x1="10" y1="6" x2="2" y2="2" stroke={isReady ? '#bef264' : '#e9d5ff'} strokeWidth="2" />
              </g>
            )}
            {/* Beacon Base Ring */}
            <rect x="8" y="15" width="20" height="4" fill="#475569" stroke="#0f172a" strokeWidth="1" rx="1" />
          </g>

          {/* 3. Main Lead-Lined Vault Shell */}
          <rect
            x="40"
            y="36"
            width="180"
            height="204"
            fill="url(#vaultPlate)"
            stroke="#475569"
            strokeWidth="3"
            rx="6"
          />

          {/* Outer Rivet Perimeter */}
          {[48, 70, 94, 118, 142, 166, 190, 212].map((y, i) => (
            <React.Fragment key={`rivet-y-${i}`}>
              <circle cx="48" cy={y} r="2.5" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.5" />
              <circle cx="212" cy={y} r="2.5" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.5" />
            </React.Fragment>
          ))}
          {[72, 96, 120, 144, 168, 188].map((x, i) => (
            <React.Fragment key={`rivet-x-${i}`}>
              <circle cx={x} cy="44" r="2.5" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.5" />
              <circle cx={x} cy="232" r="2.5" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.5" />
            </React.Fragment>
          ))}

          {/* Top Hazard Caution Stripe Banner */}
          <rect x="54" y="52" width="152" height="12" fill="url(#hazardStripe)" stroke="#0f172a" strokeWidth="1" />
          {/* Bottom Hazard Caution Stripe Banner */}
          <rect x="54" y="214" width="152" height="10" fill="url(#hazardStripe)" stroke="#0f172a" strokeWidth="1" />

          {/* 4. Heavy Vault Door Bevel & Seal */}
          <rect
            x="58"
            y="70"
            width="144"
            height="138"
            fill="#1e2436"
            stroke="#334155"
            strokeWidth="2"
            rx="4"
          />

          {/* Left Hydraulic Hinges */}
          <rect x="52" y="80" width="8" height="18" fill="#475569" stroke="#0f172a" strokeWidth="1" rx="2" />
          <rect x="52" y="170" width="8" height="18" fill="#475569" stroke="#0f172a" strokeWidth="1" rx="2" />

          {/* Right Locking Bolts */}
          <rect x="198" y="90" width="8" height="12" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
          <rect x="198" y="160" width="8" height="12" fill="#64748b" stroke="#0f172a" strokeWidth="1" />

          {/* 5. Central Observation Viewport (Circular Reinforced Glass Portal) */}
          <g transform="translate(130, 134)">
            {/* Heavy Brass / Steel Beveled Flange */}
            <circle cx="0" cy="0" r="50" fill="#0f172a" stroke="#475569" strokeWidth="4" />
            <circle cx="0" cy="0" r="44" fill="#1e293b" stroke="#d97706" strokeWidth="2" />

            {/* 8 Portal Bolt Studs */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <circle
                key={i}
                cx="0"
                cy="-46"
                r="2"
                fill="#cbd5e1"
                style={{ transformOrigin: '0px 0px', transform: `rotate(${angle}deg)` }}
              />
            ))}

            {/* Deep Chamber Interior Background */}
            <circle cx="0" cy="0" r="40" fill="#050814" />

            {/* --- INTERIOR CHAMBER STATES --- */}
            {isReady ? (
              /* State: READY TO OBSERVE (Coherent Wavefunction) */
              <g>
                {/* Radiant harmonic golden/emerald singularity */}
                <circle cx="0" cy="0" r="28" fill="#14532d" opacity="0.6" filter="url(#quantumCoreGlow)" />
                <circle cx="0" cy="0" r="20" fill="#65a30d" opacity="0.7" className="animate-pulse" />
                <circle cx="0" cy="0" r="12" fill="#facc15" className="animate-ping" opacity="0.8" />
                
                {/* Harmonic standing wave ring */}
                <circle
                  cx="0"
                  cy="0"
                  r="26"
                  fill="none"
                  stroke="#bef264"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="animate-spin"
                  style={{ animationDuration: '4s' }}
                />

                {/* Dual Eigenstate Markers A and B */}
                <text x="-16" y="4" fill="#bef264" fontSize="11" fontFamily="monospace" fontWeight="bold">ΨA</text>
                <text x="5" y="4" fill="#facc15" fontSize="11" fontFamily="monospace" fontWeight="bold">ΨB</text>

                {/* Shimmer sparkle */}
                <polygon points="0,-18 3,-10 11,-10 5,-4 7,4 0,0 -7,4 -5,-4 -11,-10 -3,-10" fill="#ffffff" />
              </g>
            ) : isRunning ? (
              /* State: SUPERPOSITION ACTIVE (Swirling Tachyon Particle Vortex) */
              <g>
                <circle cx="0" cy="0" r="30" fill="#3b0764" opacity="0.7" />
                
                {/* Spinning Outer Quantum Orbit */}
                <g className="animate-spin" style={{ animationDuration: '2.5s' }}>
                  <ellipse cx="0" cy="0" rx="30" ry="12" fill="none" stroke="#a855f7" strokeWidth="2" />
                  <circle cx="30" cy="0" r="3" fill="#c084fc" filter="url(#quantumCoreGlow)" />
                </g>

                {/* Counter-Spinning Inner Orbit */}
                <g className="animate-spin" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }}>
                  <ellipse cx="0" cy="0" rx="14" ry="28" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                  <circle cx="0" cy="-28" r="2.5" fill="#7dd3fc" />
                </g>

                {/* Center Swirling Core */}
                <circle cx="0" cy="0" r="8" fill="#e879f9" className="animate-ping" opacity="0.6" />
                <circle cx="0" cy="0" r="5" fill="#ffffff" />

                {/* Electric Arcs */}
                <path d="M -18 6 L -10 -4 L -4 4 L 4 -8 L 14 -2" fill="none" stroke="#e0e7ff" strokeWidth="1.5" />
              </g>
            ) : (
              /* State: IDLE / CALIBRATED */
              <g>
                {/* Empty pedestal & sensors */}
                <rect x="-14" y="16" width="28" height="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <rect x="-8" y="22" width="16" height="8" fill="#0f172a" />
                
                {/* Sensor Pins */}
                <line x1="-10" y1="16" x2="-10" y2="6" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="-10" cy="5" r="2" fill="#ef4444" />

                <line x1="10" y1="16" x2="10" y2="6" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="10" cy="5" r="2" fill="#22c55e" />

                {/* Soft cathode vacuum glow */}
                <circle cx="0" cy="0" r="12" fill="#f59e0b" opacity="0.15" />
                <text x="-9" y="3" fill="#64748b" fontSize="9" fontFamily="monospace">OFF</text>
              </g>
            )}

            {/* Glass Glare Highlights */}
            <path
              d="M -26 -26 A 38 38 0 0 1 20 -28"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.35"
            />
          </g>

          {/* 6. Heavy Wheel Turn-Handle on Vault Door */}
          <g transform="translate(182, 134)">
            <circle cx="0" cy="0" r="10" fill="#475569" stroke="#0f172a" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#94a3b8" />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* 7. Attached Right Side Control Terminal / Nixie Gauge */}
          <g transform="translate(222, 90)">
            <rect x="0" y="0" width="26" height="70" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="3" />
            {/* Pressure Dial */}
            <circle cx="13" cy="16" r="8" fill="#fef3c7" stroke="#78350f" strokeWidth="1.5" />
            <line x1="13" y1="16" x2="16" y2="11" stroke="#dc2626" strokeWidth="1" />
            {/* Nixie status indicators */}
            <rect x="5" y="30" width="16" height="8" fill="#0f172a" stroke="#d97706" strokeWidth="1" />
            <circle
              cx="13"
              cy="34"
              r="2.5"
              fill={isReady ? '#a3e635' : isRunning ? '#c084fc' : '#64748b'}
              className={isReady || isRunning ? 'animate-pulse' : ''}
            />
            {/* 3 Toggle switches */}
            <circle cx="9" cy="46" r="2" fill="#d97706" />
            <circle cx="17" cy="46" r="2" fill="#d97706" />
            <circle cx="13" cy="56" r="2" fill="#22c55e" />
          </g>

          {/* 8. Floor Power Conduit entering from Left (connecting from generator) */}
          <path
            d="M 0 254 L 40 254"
            fill="none"
            stroke="#0f172a"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 0 254 L 40 254"
            fill="none"
            stroke={isRunning ? '#a855f7' : '#475569'}
            strokeWidth="5"
            strokeLinecap="round"
            className={isRunning ? 'anim-conduit-pulse' : ''}
          />

          {/* 9. Output Conduit running to the right towards Incubator */}
          <path
            d="M 220 254 L 260 254"
            fill="none"
            stroke="#0f172a"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 220 254 L 260 254"
            fill="none"
            stroke={isReady ? '#a3e635' : isRunning ? '#a855f7' : '#334155'}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        {/* Action Prompt Pill on Hover / Ready */}
        <div className="absolute bottom-4 inset-x-4 flex justify-center pointer-events-none">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold shadow-md transition-all ${
              isReady
                ? 'bg-lime-400 text-slate-950 animate-bounce'
                : isRunning
                ? 'bg-purple-900/90 text-purple-200 border border-purple-500/50'
                : 'bg-purple-600 group-hover:bg-purple-500 text-white'
            }`}
          >
            {isReady ? 'COLLAPSE SUPERPOSITION ↗' : isRunning ? 'IN SUPERPOSITION...' : 'CONDUCT EXPERIMENT ↗'}
          </span>
        </div>
      </div>

      {/* Bottom Subtext / Tier Info */}
      <div className="mt-1 px-3 py-1 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow-inner">
        {activeExp ? (
          <>
            <span className="text-purple-400">Tier: {activeExp.type.toUpperCase()}</span>
            <span className="text-slate-600">|</span>
            <span className="text-lime-300 font-bold">{isReady ? 'STABILIZED' : 'SEALED'}</span>
          </>
        ) : (
          <span className="text-slate-400">Dual-State Observation Ready</span>
        )}
      </div>
    </div>
  );
};
