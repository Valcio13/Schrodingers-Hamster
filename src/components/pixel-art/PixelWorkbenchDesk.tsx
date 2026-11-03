import React, { useState } from 'react';
import { CollectibleHamster, QuantumHybrid, HAMSTER_SPECIES, HamsterSpecies } from '../../types/game';
import { PixelHamster } from '../PixelHamster';
import { PixelHybridHamster } from '../PixelHybridHamster';

interface PixelWorkbenchDeskProps {
  researchNotes: number;
  activeCompanion: CollectibleHamster | null | undefined;
  activeSpecies: HamsterSpecies | null | undefined;
  labHybrid: QuantumHybrid | null | undefined;
  onOpenResearch?: () => void;
  onInspectCompanion?: () => void;
  className?: string;
}

export const PixelWorkbenchDesk: React.FC<PixelWorkbenchDeskProps> = ({
  researchNotes,
  activeCompanion,
  activeSpecies,
  labHybrid,
  onOpenResearch,
  onInspectCompanion,
  className = ''
}) => {
  const [showSpeech, setShowSpeech] = useState(false);

  // Personality quotes
  const personalityQuotes: Record<string, string> = {
    Curious: "Did you hear that quantum click? Something is observing us back!",
    Sleepy: "Zzz... the superposition is warm and comfortable today...",
    Mischievous: "I didn't chew through the tachyon conduit... it was already glowing like that!",
    Brave: "Fear not the chaotic state! We conquer entropy together!",
    Shy: "I'll keep watch from behind the battery array... squeek!"
  };

  const personality = activeCompanion?.personality || labHybrid?.personality || 'Curious';
  const quote = personalityQuotes[personality] || "Running quantum diagnostics!";
  const companionName = activeCompanion?.nickname || activeSpecies?.name || labHybrid?.nickname || 'Research Assistant';

  return (
    <div className={`relative select-none flex flex-col items-center ${className}`}>
      
      {/* Top Station Status Badge */}
      <div className="mb-2 flex items-center gap-3">
        {/* Research Desk Pill */}
        <button
          onClick={onOpenResearch}
          className="px-3 py-1 rounded-full bg-slate-900/95 border-2 border-slate-700 hover:border-cyan-400 text-xs font-mono font-bold text-slate-200 flex items-center gap-2 shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          title="Click to open Schrödinger's Research Notebook"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-400 uppercase tracking-wider text-[11px]">RESEARCH BENCH</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
            {researchNotes} NOTES
          </span>
        </button>

        {/* Companion Perch Pill */}
        <button
          onClick={onInspectCompanion}
          className="px-3 py-1 rounded-full bg-slate-900/95 border-2 border-slate-700 hover:border-purple-400 text-xs font-mono font-bold text-purple-200 flex items-center gap-2 shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          title="Click to view companion in QuantumDex"
        >
          <span className="text-sm">🐹</span>
          <span className="text-[11px] uppercase tracking-wider text-purple-300">{companionName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
            {personality}
          </span>
        </button>
      </div>

      {/* The Physical Pixel Art Workbench & Companion Stage */}
      <div className="relative w-full max-w-[420px] h-64 sm:h-72">
        <svg
          viewBox="0 0 420 270"
          className="w-full h-full drop-shadow-2xl pixel-art"
          style={{ imageRendering: 'pixelated' }}
        >
          <defs>
            {/* Wood Grain Gradient for Workbench */}
            <linearGradient id="oakDeskTop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="50%" stopColor="#713f12" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            {/* CRT Screen Glow */}
            <radialGradient id="crtGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#14532d" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#052e16" stopOpacity="0.8" />
            </radialGradient>

            {/* Velvet Cushion Gradient */}
            <linearGradient id="velvetCushion" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="50%" stopColor="#6b21a8" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>

            {/* Desk Lamp Light Cone Gradient */}
            <linearGradient id="lampCone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 1. Heavy Wooden Workbench Structure */}
          {/* Floor Plinths / Leg Bases */}
          <rect x="25" y="244" width="370" height="16" fill="#0f172a" stroke="#334155" strokeWidth="2" />

          {/* Cast Iron Table Legs */}
          <rect x="45" y="160" width="16" height="84" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <rect x="359" y="160" width="16" height="84" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          {/* Leg Cross-Brace Support Bar */}
          <rect x="45" y="210" width="330" height="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />

          {/* Lower Storage Shelf */}
          <rect x="55" y="200" width="310" height="10" fill="#713f12" stroke="#451a03" strokeWidth="1.5" />
          {/* Jars on Lower Shelf */}
          <rect x="75" y="186" width="18" height="14" fill="#0284c7" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1" rx="2" />
          <rect x="98" y="182" width="14" height="18" fill="#a855f7" fillOpacity="0.5" stroke="#c084fc" strokeWidth="1" rx="2" />
          <rect x="116" y="188" width="22" height="12" fill="#eab308" fillOpacity="0.6" stroke="#fde047" strokeWidth="1" rx="2" />

          {/* Heavy Beveled Solid Oak Tabletop */}
          <rect x="20" y="146" width="380" height="18" fill="url(#oakDeskTop)" stroke="#271102" strokeWidth="2" rx="3" />
          <rect x="22" y="148" width="376" height="4" fill="#a16207" />
          {/* Front Shadow Lip */}
          <rect x="20" y="162" width="380" height="6" fill="#271102" />

          {/* 2. Banker's Desk Lamp with Light Cone */}
          <g transform="translate(45, 60)">
            {/* Brass Lamp Base */}
            <ellipse cx="20" cy="86" rx="14" ry="4" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            {/* Articulated Brass Neck */}
            <path d="M 20 86 C 16 55, 34 35, 48 30" fill="none" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="34" cy="46" r="3" fill="#78350f" />
            {/* Emerald Green Glass Shade */}
            <path d="M 32 30 C 32 20, 68 20, 68 30 Z" fill="#047857" stroke="#064e3b" strokeWidth="2" />
            <ellipse cx="50" cy="30" rx="18" ry="4" fill="#a7f3d0" stroke="#047857" strokeWidth="1" />
            {/* Warm Light Cone illuminating desk surface */}
            <polygon points="50,32 10,146 110,146" fill="url(#lampCone)" pointerEvents="none" />
          </g>

          {/* 3. Open Research Notebook on Desk */}
          <g transform="translate(105, 120)" className="cursor-pointer" onClick={onOpenResearch}>
            {/* Leather Cover Edges */}
            <rect x="0" y="6" width="76" height="24" fill="#78350f" stroke="#451a03" strokeWidth="1.5" rx="2" />
            {/* Open Pages */}
            <rect x="3" y="2" width="34" height="26" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
            <rect x="39" y="2" width="34" height="26" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
            {/* Center Spine Stitch */}
            <line x1="37" y1="2" x2="37" y2="28" stroke="#92400e" strokeWidth="2" />
            {/* Handwritten scribble lines */}
            <line x1="7" y1="8" x2="31" y2="8" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="7" y1="14" x2="27" y2="14" stroke="#475569" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="7" y1="20" x2="32" y2="20" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 2" />
            {/* Sketch of hamster on right page */}
            <circle cx="56" cy="12" r="5" fill="#f5af63" />
            <circle cx="54" cy="11" r="1" fill="#000000" />
            <line x1="43" y1="22" x2="69" y2="22" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 2" />
            {/* Feather Quill */}
            <path d="M 72 26 L 86 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <polygon points="86,6 88,2 84,4" fill="#ffffff" />
          </g>

          {/* 4. Chemical Glassware Set */}
          <g transform="translate(195, 106)">
            {/* Erlenmeyer Flask with Bubbling Liquid */}
            <polygon points="12,14 4,40 28,40 20,14" fill="#22c55e" fillOpacity="0.5" stroke="#15803d" strokeWidth="1.5" />
            <rect x="11" y="6" width="10" height="9" fill="none" stroke="#15803d" strokeWidth="1.5" />
            {/* Liquid level */}
            <polygon points="7,32 5,39 27,39 25,32" fill="#4ade80" />
            <circle cx="16" cy="34" r="1.5" fill="#ffffff" className="anim-bubble" />
            <circle cx="13" cy="28" r="1" fill="#ffffff" className="anim-bubble" style={{ animationDelay: '0.5s' }} />

            {/* Distillation Beaker with Cyan Liquid */}
            <rect x="36" y="16" width="18" height="24" fill="#06b6d4" fillOpacity="0.4" stroke="#0891b2" strokeWidth="1.5" rx="2" />
            <rect x="37" y="26" width="16" height="13" fill="#22d3ee" rx="1" />
            
            {/* Glass Tube linking flasks */}
            <path d="M 20 10 Q 32 -2 45 18" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          </g>

          {/* 5. Retro Green-Phosphor CRT Oscilloscope Terminal */}
          <g transform="translate(265, 80)">
            {/* Beige/Grey Computer Casing */}
            <rect x="0" y="0" width="70" height="66" fill="#334155" stroke="#1e293b" strokeWidth="2" rx="4" />
            {/* Screen Bezel */}
            <rect x="6" y="6" width="58" height="42" fill="#0f172a" stroke="#475569" strokeWidth="1.5" rx="3" />
            {/* CRT Phosphor Screen */}
            <rect x="9" y="9" width="52" height="36" fill="url(#crtGlow)" rx="2" />
            {/* Live Waveform Pulse */}
            <path
              d="M 12 27 L 22 27 L 26 15 L 30 38 L 34 23 L 38 27 L 58 27"
              fill="none"
              stroke="#4ade80"
              strokeWidth="2"
              strokeLinecap="round"
              className="anim-conduit-pulse"
            />
            {/* Dials and Buttons below screen */}
            <circle cx="16" cy="56" r="3.5" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
            <circle cx="28" cy="56" r="3.5" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
            <rect x="40" y="53" width="6" height="6" fill="#dc2626" rx="1" />
            <rect x="50" y="53" width="10" height="6" fill="#22c55e" rx="1" />
          </g>

          {/* 6. DEDICATED COMPANION PERCH (PLUSH VELVET CUSHION) */}
          <g
            transform="translate(345, 126)"
            className="cursor-pointer"
            onClick={() => {
              setShowSpeech(!showSpeech);
              if (onInspectCompanion) onInspectCompanion();
            }}
          >
            {/* Cushion Shadow */}
            <ellipse cx="26" cy="22" rx="30" ry="7" fill="#0f172a" opacity="0.6" />
            {/* Plush Velvet Cushion */}
            <ellipse cx="26" cy="18" rx="28" ry="8" fill="url(#velvetCushion)" stroke="#581c87" strokeWidth="2" />
            <ellipse cx="26" cy="16" rx="24" ry="6" fill="#a855f7" opacity="0.5" />
            {/* Golden Corner Tassels */}
            <circle cx="2" cy="18" r="3" fill="#facc15" stroke="#854d0e" strokeWidth="1" />
            <circle cx="50" cy="18" r="3" fill="#facc15" stroke="#854d0e" strokeWidth="1" />
          </g>
        </svg>

        {/* 7. THE ACTIVE COMPANION HAMSTER SPRITE (PROMINENTLY PERCHED) */}
        <div
          className="absolute top-[82px] right-[20px] pointer-events-auto cursor-pointer flex flex-col items-center group/hamster"
          onClick={() => {
            setShowSpeech(!showSpeech);
            if (onInspectCompanion) onInspectCompanion();
          }}
          title={`${companionName}: Click to chat or inspect in QuantumDex`}
        >
          {labHybrid ? (
            <PixelHybridHamster
              hybrid={labHybrid}
              size="lg"
              className="transform scale-110 drop-shadow-xl transition-transform hover:scale-125"
            />
          ) : activeSpecies ? (
            <PixelHamster
              speciesId={activeSpecies.id}
              size="lg"
              className="transform scale-110 drop-shadow-xl transition-transform hover:scale-125"
            />
          ) : (
            <PixelHamster
              speciesId="normal"
              size="lg"
              className="transform scale-110 drop-shadow-xl transition-transform hover:scale-125"
            />
          )}

          {/* Interactive Speech / Thought Bubble */}
          {(showSpeech || true) && (
            <div
              className={`absolute -top-16 -left-28 sm:-left-36 w-48 sm:w-56 p-2 rounded-xl bg-slate-900/95 border-2 border-purple-400 text-slate-100 shadow-xl transition-all duration-300 pointer-events-none z-30 ${
                showSpeech ? 'opacity-100 scale-100' : 'opacity-0 sm:opacity-90 scale-95 group-hover/hamster:opacity-100 group-hover/hamster:scale-100'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-mono font-bold text-purple-300 uppercase">
                  {companionName}
                </span>
                <span className="text-[9px] px-1 rounded bg-purple-950 text-purple-200 font-mono">
                  {personality}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] leading-tight text-slate-200 italic font-sans">
                "{quote}"
              </p>
              {/* Bubble Tail */}
              <div className="absolute -bottom-2 right-8 w-3 h-3 bg-slate-900 border-r-2 border-b-2 border-purple-400 transform rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Subtext / Assistant Perk Display */}
      <div className="mt-1 px-3 py-1 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow-inner">
        <span className="text-cyan-400 font-bold">Perk:</span>
        <span className="text-lime-300">
          {activeSpecies?.assistantPerk ? activeSpecies.assistantPerk.split(':')[0] : 'Steady Paws'}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 text-[10px]">Click Hamster to inspect</span>
      </div>
    </div>
  );
};
