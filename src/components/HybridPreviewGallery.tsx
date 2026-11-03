import React, { useState, useMemo } from 'react';
import { generateQuantumHybrid, getCuratedArchetypes } from '../utils/hybridGenerator';
import { PixelHybridHamster } from './PixelHybridHamster';
import { QuantumHybrid, HAMSTER_SPECIES } from '../types/game';
import { Sparkles, Dna, RefreshCw, X, Eye, Award } from 'lucide-react';
import { audio } from '../services/audio';

interface HybridPreviewGalleryProps {
  onClose: () => void;
}

export const HybridPreviewGallery: React.FC<HybridPreviewGalleryProps> = ({ onClose }) => {
  const [gallerySeed, setGallerySeed] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'archetypes' | 'procedural'>('archetypes');
  const [spotlightHybrid, setSpotlightHybrid] = useState<QuantumHybrid | null>(null);

  const curatedArchetypes = useMemo(() => getCuratedArchetypes(), []);

  const baseSpeciesIds = ['normal', 'electric', 'ghost', 'glitch', 'plasma', 'paradox'];

  // Generate 30 diverse sample hybrids
  const sampleHybrids: QuantumHybrid[] = useMemo(() => {
    const list: QuantumHybrid[] = [];
    let seedCount = gallerySeed;

    for (let i = 0; i < baseSpeciesIds.length; i++) {
      for (let j = 0; j < baseSpeciesIds.length; j++) {
        if (list.length >= 30) break;
        const p1 = baseSpeciesIds[i];
        const p2 = baseSpeciesIds[(i + j + 1) % baseSpeciesIds.length];
        list.push(generateQuantumHybrid('dev_preview', p1, p2, seedCount++));
      }
    }

    return list;
  }, [gallerySeed]);

  const rarityBadges: Record<string, string> = {
    common: 'bg-slate-800 text-slate-300 border-slate-700',
    uncommon: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
    rare: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80',
    epic: 'bg-purple-950/70 text-purple-300 border-purple-800/80',
    legendary: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    mythic: 'bg-pink-950/80 text-pink-300 border-pink-500/80'
  };

  const currentList = activeTab === 'archetypes' ? curatedArchetypes : sampleHybrids;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-fredoka tracking-wide">
                  Quantum Mutations & Procedural Gallery
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Update 1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visual quality gate & specimen browser for modular quantum mutations and procedural names
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Tab switch */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  audio.playClick();
                  setActiveTab('archetypes');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeTab === 'archetypes'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                10 Core Archetypes
              </button>
              <button
                onClick={() => {
                  audio.playClick();
                  setActiveTab('procedural');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeTab === 'procedural'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Procedural Rolls (30)
              </button>
            </div>

            {activeTab === 'procedural' && (
              <button
                onClick={() => {
                  audio.playClick();
                  setGallerySeed(prev => prev + 31);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Reroll procedural seeds"
              >
                <RefreshCw className="w-3.5 h-3.5 text-lime-400" />
                <span className="hidden sm:inline">Reroll</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'archetypes' && (
            <div className="mb-3 p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-center justify-between">
              <span>
                <strong>Quality Gate Showcase:</strong> Demonstrating One-Eyed (Cyclops), Three-Eyed, Five-Eyed, Horned, Winged, Floating (no hind legs), Ghost Aura, Electric Aura, Legendary, and Mythic archetypes.
              </span>
              <span className="text-[10px] font-mono text-lime-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-lime-800/60">
                10/10 Verified
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {currentList.map((hybrid, idx) => {
              const p1 = HAMSTER_SPECIES[hybrid.parent1Species];
              const p2 = HAMSTER_SPECIES[hybrid.parent2Species];

              return (
                <div
                  key={hybrid.id || idx}
                  onClick={() => {
                    audio.playClick();
                    setSpotlightHybrid(hybrid);
                  }}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col items-center text-center relative group hover:border-purple-500/60 transition-all hover:bg-slate-900/60 cursor-pointer shadow-md"
                >
                  {/* Top Bar: Rarity */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border shadow-xs ${rarityBadges[hybrid.rarity]}`}>
                      {hybrid.rarity}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Pixel Avatar Stage */}
                  <div className="w-24 h-24 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center p-1 my-1.5 group-hover:scale-105 transition-transform">
                    <PixelHybridHamster hybrid={hybrid} size="lg" />
                  </div>

                  {/* Nickname & Parents */}
                  <div className="w-full mt-2 min-w-0">
                    <div className="text-sm font-bold text-white font-fredoka truncate" title={hybrid.nickname}>
                      {hybrid.nickname}
                    </div>

                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{p1?.icon || '🐹'} {p1?.name}</span>
                      <span>×</span>
                      <span>{p2?.icon || '⚡'} {p2?.name}</span>
                    </div>

                    {/* Active Mutation Badges */}
                    {hybrid.traits.activeMutations && hybrid.traits.activeMutations.length > 0 && (
                      <div className="flex items-center justify-center gap-1 flex-wrap mt-2">
                        {hybrid.traits.activeMutations.slice(0, 2).map((mut) => (
                          <span
                            key={mut}
                            className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 truncate max-w-full"
                          >
                            {mut}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400 px-5">
          <span>
            {activeTab === 'archetypes' ? 'Showing 10 / 10 Curated Quality Archetypes' : `Showing ${sampleHybrids.length} Procedural Samples (Seed: ${gallerySeed})`}
          </span>
          <span className="text-purple-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Click any specimen to inspect full mutation profile</span>
          </span>
        </div>
      </div>

      {/* Mini Spotlight Modal inside Preview Gallery */}
      {spotlightHybrid && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-purple-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${rarityBadges[spotlightHybrid.rarity]}`}>
                  {spotlightHybrid.rarity}
                </span>
                <h4 className="text-lg font-bold font-fredoka text-white">
                  {spotlightHybrid.nickname}
                </h4>
              </div>
              <button
                onClick={() => setSpotlightHybrid(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hero Stage */}
            <div className="w-full h-40 rounded-xl bg-slate-950 border border-purple-500/30 flex items-center justify-center relative overflow-hidden">
              <div className="relative z-10 transform scale-110">
                <PixelHybridHamster hybrid={spotlightHybrid} size="hero" />
              </div>
            </div>

            {/* Mutation Profile */}
            <div className="space-y-2 text-xs font-mono">
              <div className="text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Active Quantum Mutations:</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {spotlightHybrid.traits.activeMutations && spotlightHybrid.traits.activeMutations.length > 0 ? (
                  spotlightHybrid.traits.activeMutations.map(m => (
                    <span key={m} className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-bold text-[10px]">
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">None (Baseline genome)</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">Eyes:</span>
                  <span className="text-white capitalize">{spotlightHybrid.traits.eyeMutation || 'Normal'}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">Head / Horns:</span>
                  <span className="text-white capitalize">{spotlightHybrid.traits.headMutation || 'None'}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">Limbs:</span>
                  <span className="text-white capitalize">
                    {spotlightHybrid.traits.limbMutation === 'missing_hind_legs' ? 'Floating (No Hind Legs)' : spotlightHybrid.traits.limbMutation || 'Normal'}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">Aura:</span>
                  <span className="text-cyan-300 capitalize">{spotlightHybrid.traits.auraEffect || 'None'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSpotlightHybrid(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
