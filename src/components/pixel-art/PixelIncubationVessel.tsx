import React from 'react';
import { ActiveIncubationState, HAMSTER_SPECIES } from '../../types/game';
import { PixelHamster } from '../PixelHamster';

interface PixelIncubationVesselProps {
  isUnlocked: boolean;
  activeInc: ActiveIncubationState | null | undefined;
  breedingCharges: number;
  onClick?: () => void;
  className?: string;
}

export const PixelIncubationVessel: React.FC<PixelIncubationVesselProps> = ({
  isUnlocked,
  activeInc,
  breedingCharges,
  onClick,
  className = ''
}) => {
  const isIncubating = !!activeInc;

  return (
    <div
      onClick={onClick}
      className={`relative select-none cursor-pointer group flex flex-col items-center ${className}`}
      title={
        !isUnlocked
          ? 'Quantum Incubator: Locked. Requires 3 Base Species, Lab Level 2, and Genetics Research.'
          : isIncubating
          ? 'Genetic Superposition in progress: Click to observe and choose offspring!'
          : 'Quantum Incubator: Click to pair two Base Hamsters and synthesize procedural hybrids.'
      }
    >
      {/* Top Station Status Badge */}
      <div
        className={`mb-2 px-3 py-1 rounded-full border-2 text-xs font-mono font-bold flex items-center gap-2 shadow-lg transition-all duration-300 transform group-hover:-translate-y-0.5 ${
          !isUnlocked
            ? 'bg-slate-950 border-slate-800 text-slate-500'
            : isIncubating
            ? 'bg-purple-950/95 border-purple-400 text-purple-200 animate-pulse'
            : 'bg-slate-900/95 border-slate-700 group-hover:border-purple-400 text-purple-300'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            !isUnlocked
              ? 'bg-slate-600'
              : isIncubating
              ? 'bg-pink-400 animate-ping'
              : 'bg-purple-400'
          }`}
        />
        <span className="uppercase tracking-wider text-[11px]">QUANTUM INCUBATOR</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            !isUnlocked
              ? 'bg-slate-900 text-slate-600'
              : isIncubating
              ? 'bg-pink-900/80 text-pink-200 font-bold'
              : 'bg-purple-950 text-purple-300'
          }`}
        >
          {!isUnlocked ? 'LOCKED' : isIncubating ? 'INCUBATING' : `${breedingCharges}⚡ CHARGES`}
        </span>
      </div>

      {/* The Physical Pixel Art Incubation Machine */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
        <svg
          viewBox="0 0 260 270"
          className="w-full h-full drop-shadow-2xl pixel-art"
          style={{ imageRendering: 'pixelated' }}
        >
          <defs>
            {/* Brass & Bronze Gradients */}
            <linearGradient id="brassCylinder" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="35%" stopColor="#d97706" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            {/* Quantum Fluid Gradient */}
            <linearGradient id="quantumFluid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b0764" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#1e1b4b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            {/* Glowing Egg Filter */}
            <filter id="eggAura" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Heavy Pedestal Stand on Floor */}
          <rect x="25" y="244" width="210" height="16" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="40" y="238" width="180" height="8" fill="#1e293b" />
          <circle cx="50" cy="252" r="3" fill="#64748b" />
          <circle cx="210" cy="252" r="3" fill="#64748b" />

          {/* 2. Left Parent Pod (Parent 1) */}
          <g transform="translate(18, 110)">
            {/* Pod Base */}
            <rect x="4" y="58" width="40" height="16" fill="#1e293b" stroke="#334155" strokeWidth="1.5" rx="2" />
            <circle cx="12" cy="66" r="2" fill="#64748b" />
            <circle cx="36" cy="66" r="2" fill="#64748b" />
            {/* Glass Bell Dome */}
            <path
              d="M 6 58 C 6 25, 42 25, 42 58 Z"
              fill={isUnlocked ? '#0284c7' : '#1e293b'}
              fillOpacity={isUnlocked ? '0.25' : '0.4'}
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Glass reflection */}
            <path d="M 12 52 C 12 36, 24 32, 30 32" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
            {/* Parent 1 DNA Conduit leading to center vessel */}
            <path
              d="M 42 45 C 56 45, 62 70, 72 80"
              fill="none"
              stroke="#0f172a"
              strokeWidth="6"
            />
            <path
              d="M 42 45 C 56 45, 62 70, 72 80"
              fill="none"
              stroke={isIncubating ? '#ec4899' : '#0284c7'}
              strokeWidth="2.5"
              className={isIncubating ? 'anim-conduit-pulse' : ''}
            />
            {/* Parent 1 Label */}
            <text x="14" y="70" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">P1</text>
          </g>

          {/* 3. Right Parent Pod (Parent 2) */}
          <g transform="translate(194, 110)">
            {/* Pod Base */}
            <rect x="4" y="58" width="40" height="16" fill="#1e293b" stroke="#334155" strokeWidth="1.5" rx="2" />
            <circle cx="12" cy="66" r="2" fill="#64748b" />
            <circle cx="36" cy="66" r="2" fill="#64748b" />
            {/* Glass Bell Dome */}
            <path
              d="M 6 58 C 6 25, 42 25, 42 58 Z"
              fill={isUnlocked ? '#a855f7' : '#1e293b'}
              fillOpacity={isUnlocked ? '0.25' : '0.4'}
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Glass reflection */}
            <path d="M 12 52 C 12 36, 24 32, 30 32" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
            {/* Parent 2 DNA Conduit leading to center vessel */}
            <path
              d="M 6 45 C -8 45, -14 70, -24 80"
              fill="none"
              stroke="#0f172a"
              strokeWidth="6"
            />
            <path
              d="M 6 45 C -8 45, -14 70, -24 80"
              fill="none"
              stroke={isIncubating ? '#a855f7' : '#38bdf8'}
              strokeWidth="2.5"
              className={isIncubating ? 'anim-conduit-pulse' : ''}
            />
            {/* Parent 2 Label */}
            <text x="14" y="70" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">P2</text>
          </g>

          {/* 4. MAIN CENTRAL CYLINDRICAL INCUBATION VESSEL */}
          {/* Lower Brass Base Collar */}
          <rect x="74" y="214" width="112" height="26" fill="url(#brassCylinder)" stroke="#451a03" strokeWidth="2" rx="4" />
          <circle cx="84" cy="227" r="3" fill="#fef08a" />
          <circle cx="176" cy="227" r="3" fill="#fef08a" />
          {/* Pressure Relief Valve */}
          <rect x="120" y="222" width="20" height="8" fill="#475569" stroke="#0f172a" strokeWidth="1" />
          <circle cx="130" cy="226" r="2" fill="#ef4444" />

          {/* Top Brass Crown / Condenser Cap */}
          <rect x="74" y="24" width="112" height="22" fill="url(#brassCylinder)" stroke="#451a03" strokeWidth="2" rx="4" />
          <circle cx="84" cy="35" r="3" fill="#fef08a" />
          <circle cx="176" cy="35" r="3" fill="#fef08a" />
          {/* Top Helical Coil Rod */}
          <rect x="124" y="8" width="12" height="16" fill="#d97706" stroke="#78350f" strokeWidth="1" />
          <circle cx="130" cy="8" r="5" fill="#f59e0b" />

          {/* Central Borosilicate Glass Chamber */}
          <rect
            x="82"
            y="46"
            width="96"
            height="168"
            fill={isUnlocked ? 'url(#quantumFluid)' : '#090d16'}
            stroke="#475569"
            strokeWidth="3"
            rx="6"
          />

          {/* Glass Specular Glare Highlights */}
          <line x1="88" y1="52" x2="88" y2="208" stroke="#ffffff" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
          <line x1="93" y1="56" x2="93" y2="180" stroke="#ffffff" strokeWidth="1" opacity="0.15" strokeLinecap="round" />

          {/* Copper Magnetic Stabilization Rings (Top and Bottom) */}
          <rect x="80" y="60" width="100" height="8" fill="#b45309" stroke="#78350f" strokeWidth="1" rx="2" />
          <rect x="80" y="196" width="100" height="8" fill="#b45309" stroke="#78350f" strokeWidth="1" rx="2" />

          {/* --- VESSEL INTERIOR STATES --- */}
          {!isUnlocked ? (
            /* LOCKED STATE: Crisscrossing Heavy Steel Chains & Padlock */
            <g>
              {/* Crossed Chains */}
              <line x1="84" y1="56" x2="176" y2="204" stroke="#475569" strokeWidth="5" strokeDasharray="8 6" />
              <line x1="176" y1="56" x2="84" y2="204" stroke="#475569" strokeWidth="5" strokeDasharray="8 6" />
              <line x1="84" y1="56" x2="176" y2="204" stroke="#1e293b" strokeWidth="2" strokeDasharray="8 6" />
              <line x1="176" y1="56" x2="84" y2="204" stroke="#1e293b" strokeWidth="2" strokeDasharray="8 6" />

              {/* Heavy Pixel Padlock in Center */}
              <g transform="translate(112, 110)">
                {/* Padlock Shackle */}
                <path d="M 6 12 C 6 -2, 30 -2, 30 12" fill="none" stroke="#94a3b8" strokeWidth="4" />
                {/* Padlock Body */}
                <rect x="0" y="10" width="36" height="30" fill="#d97706" stroke="#78350f" strokeWidth="2" rx="3" />
                <circle cx="18" cy="22" r="3.5" fill="#451a03" />
                <rect x="16.5" y="24" width="3" height="7" fill="#451a03" />
              </g>

              {/* Warning Sign Plaque */}
              <rect x="88" y="160" width="84" height="18" fill="#0f172a" stroke="#dc2626" strokeWidth="1" rx="2" />
              <text x="96" y="172" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">OFFLINE: LVL 2</text>
            </g>
          ) : isIncubating ? (
            /* INCUBATING STATE: Suspended Radiant Egg & Bubbles */
            <g>
              {/* Rising Quantum Fluid Bubbles */}
              <circle cx="98" cy="180" r="2.5" fill="#e879f9" className="anim-bubble" opacity="0.6" />
              <circle cx="156" cy="165" r="3" fill="#38bdf8" className="anim-bubble" opacity="0.6" style={{ animationDelay: '0.8s' }} />
              <circle cx="106" cy="115" r="2" fill="#f472b6" className="anim-bubble" opacity="0.6" style={{ animationDelay: '1.4s' }} />
              <circle cx="146" cy="85" r="2.5" fill="#a855f7" className="anim-bubble" opacity="0.6" style={{ animationDelay: '0.3s' }} />

              {/* Magnetic Levitation Rings glowing */}
              <ellipse cx="130" cy="155" rx="32" ry="7" fill="none" stroke="#c084fc" strokeWidth="2" opacity="0.8" className="animate-pulse" />
              <ellipse cx="130" cy="105" rx="32" ry="7" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.8" className="animate-pulse" />

              {/* DNA Double-Helix Energy Ribbon Arcs */}
              <path
                d="M 100 80 Q 130 130 160 80 T 130 180"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="animate-spin"
                style={{ transformOrigin: '130px 130px', animationDuration: '6s' }}
              />

              {/* Suspended Radiant Quantum Egg */}
              <g transform="translate(130, 130)" className="anim-egg-wobble" filter="url(#eggAura)">
                {/* Egg Body */}
                <ellipse cx="0" cy="0" rx="16" ry="24" fill="url(#quantumFluid)" />
                <path
                  d="M 0 -24 C 18 -24, 20 10, 16 20 C 12 26, -12 26, -16 20 C -20 10, -18 -24, 0 -24 Z"
                  fill="#c084fc"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {/* Egg Shell Pattern Details */}
                <circle cx="-3" cy="-4" r="5" fill="#f472b6" opacity="0.8" />
                <circle cx="5" cy="8" r="4" fill="#67e8f9" opacity="0.8" />
                <circle cx="0" cy="0" r="2" fill="#ffffff" />
                {/* Egg Highlight */}
                <path d="M -8 -16 C -3 -20, 4 -20, 8 -16" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
              </g>
            </g>
          ) : (
            /* READY / STANDBY STATE */
            <g>
              {/* Gentle Fluid Glow & Micro-Bubbles */}
              <circle cx="130" cy="130" r="30" fill="#38bdf8" opacity="0.1" />
              <circle cx="115" cy="170" r="2" fill="#38bdf8" opacity="0.5" className="anim-bubble" />
              <circle cx="145" cy="150" r="2" fill="#a855f7" opacity="0.5" className="anim-bubble" style={{ animationDelay: '1s' }} />

              {/* Empty Levitation Magnetic Cradle */}
              <ellipse cx="130" cy="140" rx="26" ry="6" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="130" y1="140" x2="130" y2="125" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
              
              {/* Holographic DNA Strand in Standby */}
              <text x="110" y="125" fill="#c084fc" fontSize="16" fontFamily="monospace">🧬</text>
              <text x="100" y="165" fill="#94a3b8" fontSize="8" fontFamily="monospace">READY</text>
            </g>
          )}

          {/* 5. Floor Input Power Conduit from Left (Vault to Incubator) */}
          <path
            d="M 0 254 L 35 254"
            fill="none"
            stroke="#0f172a"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 0 254 L 35 254"
            fill="none"
            stroke={isIncubating ? '#ec4899' : isUnlocked ? '#a855f7' : '#334155'}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        {/* Small Parent Hamster Avatars inside Pods if Incubating */}
        {isIncubating && activeInc && (
          <>
            <div className="absolute top-[132px] left-[26px] pointer-events-none transform scale-75">
              <PixelHamster speciesId={activeInc.parent1Species} size="sm" />
            </div>
            <div className="absolute top-[132px] right-[26px] pointer-events-none transform scale-75">
              <PixelHamster speciesId={activeInc.parent2Species} size="sm" />
            </div>
          </>
        )}

        {/* Action Prompt Pill on Hover */}
        <div className="absolute bottom-4 inset-x-4 flex justify-center pointer-events-none">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold shadow-md transition-all ${
              !isUnlocked
                ? 'bg-slate-900 border border-slate-800 text-slate-500'
                : isIncubating
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white animate-bounce'
                : 'bg-purple-900 group-hover:bg-purple-800 text-purple-200 border border-purple-700/60'
            }`}
          >
            {!isUnlocked ? 'LOCKED (LEVEL 2 REQUIRED)' : isIncubating ? 'OBSERVE HYBRID ↗' : 'BREED HYBRIDS ↗'}
          </span>
        </div>
      </div>

      {/* Bottom Subtext / Status */}
      <div className="mt-1 px-3 py-1 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow-inner">
        {!isUnlocked ? (
          <span className="text-slate-500">Requires Lab Level 2 & Research</span>
        ) : isIncubating ? (
          <>
            <span className="text-pink-400 font-bold">
              {HAMSTER_SPECIES[activeInc?.parent1Species || 'normal']?.name}
            </span>
            <span className="text-slate-500">×</span>
            <span className="text-purple-400 font-bold">
              {HAMSTER_SPECIES[activeInc?.parent2Species || 'electric']?.name}
            </span>
          </>
        ) : (
          <>
            <span className="text-purple-400">Charges:</span>
            <span className="text-amber-400 font-bold">{breedingCharges} Ready</span>
          </>
        )}
      </div>
    </div>
  );
};
