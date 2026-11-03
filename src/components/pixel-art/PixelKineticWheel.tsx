import React from 'react';
import { PixelHamster } from '../PixelHamster';

interface PixelKineticWheelProps {
  rpm: number;
  settledWork: number;
  batteryEnergy: number;
  batteryCapacity: number;
  onClick?: () => void;
  className?: string;
}

export const PixelKineticWheel: React.FC<PixelKineticWheelProps> = ({
  rpm,
  settledWork,
  batteryEnergy,
  batteryCapacity,
  onClick,
  className = ''
}) => {
  const isRunning = rpm > 0;
  // Rotation period in seconds (faster when rpm is higher)
  const rotationDuration = isRunning ? Math.max(0.3, Math.min(4, 60 / rpm)) : 0;
  // Needle angle for analog gauge (-45 to +135 deg)
  const gaugeAngle = Math.min(135, Math.max(-45, -45 + (rpm / 120) * 180));

  return (
    <div
      onClick={onClick}
      className={`relative select-none cursor-pointer group flex flex-col items-center ${className}`}
      title="Squeektoshi's Kinetic Generator — Click to sync verified wheel work"
    >
      {/* Top Machine Status Badge / Tag */}
      <div className="mb-2 px-3 py-1 rounded-full bg-slate-900/95 border-2 border-slate-700 group-hover:border-amber-400 text-xs font-mono font-bold text-slate-200 flex items-center gap-2 shadow-lg transition-all duration-300 transform group-hover:-translate-y-0.5">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span className="text-amber-400 uppercase tracking-wider text-[11px]">KINETIC DYNAMO</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-lime-400 font-mono">
          {isRunning ? `${rpm.toFixed(1)} RPM` : 'RESTING'}
        </span>
      </div>

      {/* The Physical Pixel Art Generator Machine */}
      <div className="relative w-56 h-64 sm:w-64 sm:h-72">
        <svg
          viewBox="0 0 240 270"
          className="w-full h-full drop-shadow-2xl pixel-art"
          style={{ imageRendering: 'pixelated' }}
        >
          <defs>
            {/* Copper coil gradient */}
            <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            {/* Steel texture */}
            <linearGradient id="ironGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            {/* Glowing neon wire */}
            <filter id="electricGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Heavy Bolted Cast-Iron Bedplate / Base Frame */}
          <rect x="20" y="244" width="200" height="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="30" y="240" width="180" height="6" fill="#1e293b" />
          {/* Base Bolts */}
          <circle cx="36" cy="251" r="3" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
          <circle cx="60" cy="251" r="3" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
          <circle cx="180" cy="251" r="3" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
          <circle cx="204" cy="251" r="3" fill="#64748b" stroke="#0f172a" strokeWidth="1" />

          {/* 2. Copper Dynamo Housing (Behind Wheel on the left) */}
          <g transform="translate(18, 140)">
            {/* Dynamo block */}
            <rect x="0" y="0" width="56" height="85" fill="#1e293b" stroke="#475569" strokeWidth="3" rx="4" />
            {/* Copper Coils wrapped around cylindrical core */}
            <rect x="6" y="8" width="44" height="10" fill="url(#copperGradient)" stroke="#78350f" strokeWidth="1" />
            <rect x="6" y="22" width="44" height="10" fill="url(#copperGradient)" stroke="#78350f" strokeWidth="1" />
            <rect x="6" y="36" width="44" height="10" fill="url(#copperGradient)" stroke="#78350f" strokeWidth="1" />
            <rect x="6" y="50" width="44" height="10" fill="url(#copperGradient)" stroke="#78350f" strokeWidth="1" />
            {/* Ventilation vents */}
            <rect x="10" y="66" width="36" height="3" fill="#0f172a" />
            <rect x="10" y="72" width="36" height="3" fill="#0f172a" />
            {/* Coil Glow when Running */}
            {isRunning && (
              <rect
                x="4"
                y="6"
                width="48"
                height="56"
                fill="none"
                stroke="#facc15"
                strokeWidth="2"
                filter="url(#electricGlow)"
                className="animate-pulse"
                opacity="0.8"
              />
            )}
          </g>

          {/* 3. Analog Steam-Gauge Tachometer */}
          <g transform="translate(30, 95)">
            <circle cx="20" cy="20" r="18" fill="#0f172a" stroke="#d97706" strokeWidth="3" />
            <circle cx="20" cy="20" r="15" fill="#fef3c7" />
            {/* Dial Tick marks */}
            <line x1="8" y1="20" x2="11" y2="20" stroke="#78350f" strokeWidth="1.5" />
            <line x1="20" y1="8" x2="20" y2="11" stroke="#78350f" strokeWidth="1.5" />
            <line x1="32" y1="20" x2="29" y2="20" stroke="#78350f" strokeWidth="1.5" />
            <line x1="11" y1="12" x2="14" y2="15" stroke="#78350f" strokeWidth="1.5" />
            <line x1="29" y1="12" x2="26" y2="15" stroke="#dc2626" strokeWidth="1.5" />
            {/* Moving Gauge Needle */}
            <line
              x1="20"
              y1="20"
              x2="20"
              y2="9"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                transformOrigin: '20px 20px',
                transform: `rotate(${gaugeAngle}deg)`,
                transition: 'transform 0.4s ease-out'
              }}
            />
            <circle cx="20" cy="20" r="2.5" fill="#78350f" />
          </g>

          {/* 4. Heavy Steel A-Frame Wheel Struts */}
          {/* Back Strut */}
          <polygon points="120,110 114,110 65,244 80,244" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          <polygon points="120,110 126,110 175,244 160,244" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />

          {/* 5. ROTATING WHEEL STRUCTURE */}
          <g transform="translate(120, 110)">
            {/* Rotating Outer Ring & Spokes Group */}
            <g
              style={{
                transformOrigin: '0px 0px',
                animation: isRunning ? `spin ${rotationDuration}s linear infinite` : 'none'
              }}
            >
              {/* Outer Tread Rim with Pixel Mesh */}
              <circle cx="0" cy="0" r="88" fill="none" stroke="#334155" strokeWidth="8" />
              <circle
                cx="0"
                cy="0"
                r="88"
                fill="none"
                stroke={isRunning ? '#a3e635' : '#64748b'}
                strokeWidth="4"
                strokeDasharray="14 10"
              />
              <circle cx="0" cy="0" r="84" fill="none" stroke="#1e293b" strokeWidth="2" />
              <circle cx="0" cy="0" r="92" fill="none" stroke="#475569" strokeWidth="2" />

              {/* 8 Steel Spokes */}
              <line x1="0" y1="-86" x2="0" y2="86" stroke="#475569" strokeWidth="3" />
              <line x1="-86" y1="0" x2="86" y2="0" stroke="#475569" strokeWidth="3" />
              <line x1="-61" y1="-61" x2="61" y2="61" stroke="#475569" strokeWidth="3" />
              <line x1="-61" y1="61" x2="61" y2="-61" stroke="#475569" strokeWidth="3" />

              {/* Tread crossbar rivets on rim */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <rect
                  key={i}
                  x="-3"
                  y="-91"
                  width="6"
                  height="6"
                  fill="#94a3b8"
                  stroke="#1e293b"
                  strokeWidth="1"
                  style={{ transformOrigin: '0px 0px', transform: `rotate(${angle}deg)` }}
                />
              ))}
            </g>

            {/* Central Axle Hub & Brass Bushing (Stationary center over rotation) */}
            <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#475569" strokeWidth="3" />
            <circle cx="0" cy="0" r="11" fill="#d97706" stroke="#78350f" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#475569" />

            {/* Axle Gear Teeth */}
            <rect x="-3" y="-15" width="6" height="4" fill="#d97706" />
            <rect x="-3" y="11" width="6" height="4" fill="#d97706" />
            <rect x="-15" y="-3" width="4" height="6" fill="#d97706" />
            <rect x="11" y="-3" width="4" height="6" fill="#d97706" />
          </g>

          {/* 6. Front Strut and Pivot Bracket */}
          <polygon points="120,110 114,110 82,244 94,244" fill="#334155" stroke="#1e293b" strokeWidth="1" />
          <polygon points="120,110 126,110 158,244 146,244" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          {/* Strut Cross-Brace */}
          <rect x="94" y="180" width="52" height="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <circle cx="100" cy="183" r="2" fill="#94a3b8" />
          <circle cx="140" cy="183" r="2" fill="#94a3b8" />

          {/* 7. Output Power Conduits trailing onto floor */}
          <path
            d="M 64 220 Q 90 230 130 252 T 240 254"
            fill="none"
            stroke="#0f172a"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 64 220 Q 90 230 130 252 T 240 254"
            fill="none"
            stroke={isRunning ? '#facc15' : '#b45309'}
            strokeWidth="5"
            strokeLinecap="round"
            className={isRunning ? 'anim-conduit-pulse' : ''}
          />
          {isRunning && (
            <path
              d="M 64 220 Q 90 230 130 252 T 240 254"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeDasharray="8 12"
              className="anim-conduit-pulse"
            />
          )}

          {/* 8. Resting Bedding / Sawdust Fluff at bottom of wheel if not running */}
          {!isRunning && (
            <g transform="translate(95, 172)">
              <rect x="0" y="8" width="50" height="8" rx="4" fill="#fef08a" opacity="0.4" />
              <rect x="5" y="11" width="40" height="6" rx="3" fill="#fde047" opacity="0.6" />
            </g>
          )}

          {/* 9. High-RPM Electric Spark Emitter */}
          {isRunning && rpm > 30 && (
            <g transform="translate(185, 95)" className="animate-ping">
              <polygon points="10,0 15,10 8,12 14,24 2,14 8,11" fill="#fef08a" />
            </g>
          )}
        </svg>

        {/* 10. REAL SQUEEKTOSHI HAMSTER SPRITE INSIDE THE WHEEL */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-10">
          <PixelHamster
            speciesId="normal"
            size="md"
            isRunning={isRunning}
            isSleeping={!isRunning}
            className="transform scale-110 drop-shadow-md"
          />
        </div>

        {/* Floating "Zzz" Sleep Particles when Idle */}
        {!isRunning && (
          <div className="absolute top-20 right-10 flex flex-col items-center pointer-events-none text-slate-400 font-mono text-xs font-bold animate-pulse">
            <span className="text-[10px] translate-x-2">z</span>
            <span className="text-xs translate-x-1">z</span>
            <span className="text-sm">Z</span>
          </div>
        )}
      </div>

      {/* Bottom Machine Meter / Settled Units */}
      <div className="mt-1 px-3 py-1 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow-inner">
        <span className="text-amber-400">⚡ Storage:</span>
        <span className="text-white font-bold">{Math.floor(batteryEnergy)}/{batteryCapacity} E</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 text-[10px]">Work: {settledWork.toLocaleString()}</span>
      </div>
    </div>
  );
};
