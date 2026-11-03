import React, { useState, useMemo } from 'react';
import { AnimatedHamster, HamsterAnimationState } from './AnimatedHamster';
import { generateQuantumHybrid } from '../utils/hybridGenerator';
import { QuantumHybrid, HAMSTER_SPECIES } from '../types/game';
import { Play, Pause, FastForward, Activity, Moon, Zap, Sparkles, X, Sliders, Shield } from 'lucide-react';

interface AnimationPreviewGalleryProps {
  onClose: () => void;
}

export const AnimationPreviewGallery: React.FC<AnimationPreviewGalleryProps> = ({ onClose }) => {
  const [animation, setAnimation] = useState<HamsterAnimationState>('idle');
  const [speed, setSpeed] = useState<number>(1.0);
  const [size, setSize] = useState<'md' | 'lg' | 'hero'>('lg');
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [simReducedMotion, setSimReducedMotion] = useState<boolean>(false);
  const [gallerySeed, setGallerySeed] = useState<number>(101);

  // Six Base Hamsters + Squeektoshi
  const baseSpecies = [
    { id: 'normal', name: 'Normal Hamster', desc: 'Curious & cozy, classical companion' },
    { id: 'electric', name: 'Electric Hamster', desc: 'Crackles with sparks, energized runner' },
    { id: 'ghost', name: 'Ghost Hamster', desc: 'Ethereal floating, translucent presence' },
    { id: 'glitch', name: 'Glitch Hamster', desc: 'Cybernetic pixel flicker & chromatic traits' },
    { id: 'plasma', name: 'Plasma Hamster', desc: 'Coronal glowing aura & vibrant energy' },
    { id: 'paradox', name: 'Paradox Hamster', desc: 'Superposition afterimages & quantum rings' },
    { id: 'squeektoshi', name: 'Squeektoshi (Wheel)', desc: 'Real-world golden hero of Squeekchain' }
  ];

  // Representative procedural hybrids
  const sampleHybrids: QuantumHybrid[] = useMemo(() => {
    return [
      generateQuantumHybrid('preview', 'electric', 'ghost', gallerySeed + 1),
      generateQuantumHybrid('preview', 'plasma', 'glitch', gallerySeed + 2),
      generateQuantumHybrid('preview', 'paradox', 'electric', gallerySeed + 3),
      generateQuantumHybrid('preview', 'normal', 'plasma', gallerySeed + 4),
      generateQuantumHybrid('preview', 'ghost', 'paradox', gallerySeed + 5),
      generateQuantumHybrid('preview', 'glitch', 'normal', gallerySeed + 6)
    ];
  }, [gallerySeed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header with Global Animation Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Character Animation Preview Gallery</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700">
                  Dev Tool
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Interactive pose-based character animator for Base Hamsters, Squeektoshi, and Procedural Hybrids.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Animation Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          {/* State Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">State:</span>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
              <button
                onClick={() => setAnimation('idle')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  animation === 'idle'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>IDLE</span>
              </button>
              <button
                onClick={() => setAnimation('running')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  animation === 'running'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>RUNNING</span>
              </button>
              <button
                onClick={() => setAnimation('sleeping')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  animation === 'sleeping'
                    ? 'bg-purple-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>SLEEPING</span>
              </button>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Speed:</span>
            <input
              type="range"
              min="0.25"
              max="2.5"
              step="0.25"
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              className="w-24 accent-purple-400 cursor-pointer"
            />
            <span className="text-purple-300 font-bold w-10">{speed.toFixed(2)}x</span>
          </div>

          {/* Facing & Size Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFacing(prev => (prev === 'right' ? 'left' : 'right'))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
            >
              Facing: <strong className="text-cyan-300 uppercase">{facing}</strong>
            </button>

            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              {(['md', 'lg', 'hero'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-2 py-0.5 rounded uppercase ${
                    size === s ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSimReducedMotion(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-[10px] flex items-center gap-1 ${
                simReducedMotion
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Reduced Motion: {simReducedMotion ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Specimen Showcase Grid */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Base Hamsters & Squeektoshi */}
          <div>
            <h3 className="text-xs font-mono uppercase font-bold text-slate-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Base Species & Kinetic Squeektoshi</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {baseSpecies.map(sp => (
                <div
                  key={sp.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-between text-center transition-all group shadow-md"
                >
                  <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-400 mb-2">
                    <span className="font-bold text-slate-200">{sp.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                      {animation}
                    </span>
                  </div>

                  <div className="my-3 min-h-[90px] flex items-center justify-center">
                    <AnimatedHamster
                      speciesId={sp.id === 'squeektoshi' ? 'normal' : sp.id}
                      isSqueektoshi={sp.id === 'squeektoshi'}
                      animation={animation}
                      speed={speed}
                      size={size}
                      facing={facing}
                      reducedMotion={simReducedMotion}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight italic">
                    {sp.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Procedural Quantum Hybrids */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Procedural Quantum Hybrids (Genome + Pose System)</span>
              </h3>
              <button
                onClick={() => setGallerySeed(prev => prev + 10)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-[10px] font-mono"
              >
                Reroll Hybrids
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {sampleHybrids.map(hb => (
                <div
                  key={hb.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-between text-center transition-all shadow-md"
                >
                  <div className="w-full flex justify-between items-center text-[9px] font-mono mb-1">
                    <span className="text-purple-300 font-bold truncate max-w-[80px]">{hb.nickname}</span>
                    <span className="px-1 rounded bg-purple-950 text-purple-200 uppercase text-[8px]">
                      {hb.rarity}
                    </span>
                  </div>

                  <div className="my-2 min-h-[90px] flex items-center justify-center">
                    <AnimatedHamster
                      hybrid={hb}
                      animation={animation}
                      speed={speed}
                      size={size}
                      facing={facing}
                      reducedMotion={simReducedMotion}
                    />
                  </div>

                  <div className="w-full text-[8px] font-mono text-slate-400 space-y-0.5 text-left border-t border-slate-900 pt-1.5">
                    <div>Body: <span className="text-slate-200">{hb.traits.bodyShape}</span></div>
                    <div>Ears: <span className="text-slate-200">{hb.traits.earShape}</span></div>
                    {hb.traits.cosmeticMutation !== 'none' && (
                      <div className="text-pink-300 truncate">★ {hb.traits.cosmeticMutation}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
