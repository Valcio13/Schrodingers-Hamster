import React, { useState, useEffect } from 'react';
import {
  PlayerState,
  HAMSTER_SPECIES,
  HamsterSpecies,
  CollectibleHamster,
  QuantumHybrid,
  HamsterPersonality,
  MAX_HYBRID_CAPACITY,
  getMaxHybridCapacity
} from '../types/game';
import { PixelHamster } from './PixelHamster';
import { PixelHybridHamster } from './PixelHybridHamster';
import { MintNftModal } from './MintNftModal';
import { checkWalletConnection, checkSiweSession } from '../services/web3';
import { Web3WalletState, SiweSessionState } from '../types/game';
import {
  Award,
  UserCheck,
  Lock,
  Sparkles,
  Star,
  Edit2,
  Check,
  X,
  Users,
  Dna,
  Heart,
  Trash2,
  Zap,
  AlertTriangle,
  RotateCcw,
  History,
  Shield,
  Eye,
  ExternalLink
} from 'lucide-react';
import { audio } from '../services/audio';

interface QuantumDexProps {
  player: PlayerState;
  onAssignAssistant: (hamsterId: string) => Promise<void>;
  onRenameHamster: (hamsterId: string, nickname: string) => Promise<void>;
  onToggleFavorite: (hamsterId: string) => Promise<void>;
  onRenameHybrid?: (hybridId: string, nickname: string) => Promise<void>;
  onToggleFavoriteHybrid?: (hybridId: string) => Promise<void>;
  onReleaseHybrid?: (hybridId: string) => Promise<void>;
  onSetLabDisplayHybrid?: (hybridId: string | null) => Promise<void>;
  onNftMintSuccess?: (hybrid: QuantumHybrid) => void;
  isAssigning?: boolean;
}

const PERSONALITY_META: Record<HamsterPersonality, { emoji: string; color: string; desc: string }> = {
  Curious: { emoji: '🔍', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60', desc: 'Loves observing unexpected chamber signals.' },
  Sleepy: { emoji: '💤', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60', desc: 'Finds quantum superposition surprisingly restful.' },
  Mischievous: { emoji: '😼', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60', desc: 'Enjoys chewing on tachyon conduits.' },
  Brave: { emoji: '🛡️', color: 'bg-rose-950/80 text-rose-300 border-rose-700/60', desc: 'Unfazed by unstable chaotic wavefunctions.' },
  Shy: { emoji: '🌸', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60', desc: 'Prefers burrowing under the accumulator battery.' }
};

const SPECIES_THEMES: Record<string, {
  cardBorder: string;
  cardBg: string;
  glowShadow: string;
  badgeBg: string;
  badgeText: string;
  stageBg: string;
  stageBorder: string;
  accentText: string;
}> = {
  normal: {
    cardBorder: 'border-amber-600/40 hover:border-amber-500/70',
    cardBg: 'bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-950',
    glowShadow: 'shadow-[0_4px_20px_rgba(230,154,71,0.12)]',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300 border-amber-600/50',
    stageBg: 'bg-gradient-to-b from-amber-950/35 to-slate-950/70',
    stageBorder: 'border-amber-500/30',
    accentText: 'text-amber-400'
  },
  electric: {
    cardBorder: 'border-yellow-500/40 hover:border-yellow-400/80',
    cardBg: 'bg-gradient-to-b from-yellow-950/20 via-slate-900/90 to-slate-950',
    glowShadow: 'shadow-[0_4px_22px_rgba(250,204,21,0.18)]',
    badgeBg: 'bg-yellow-950/80',
    badgeText: 'text-yellow-300 border-yellow-500/50',
    stageBg: 'bg-gradient-to-b from-yellow-950/35 to-slate-950/70',
    stageBorder: 'border-yellow-400/35',
    accentText: 'text-yellow-400'
  },
  ghost: {
    cardBorder: 'border-cyan-500/40 hover:border-cyan-400/75',
    cardBg: 'bg-gradient-to-b from-cyan-950/20 via-slate-900/90 to-slate-950',
    glowShadow: 'shadow-[0_4px_22px_rgba(100,255,218,0.16)]',
    badgeBg: 'bg-cyan-950/80',
    badgeText: 'text-cyan-300 border-cyan-500/50',
    stageBg: 'bg-gradient-to-b from-cyan-950/35 to-slate-950/70',
    stageBorder: 'border-cyan-400/35',
    accentText: 'text-cyan-300'
  },
  glitch: {
    cardBorder: 'border-pink-500/40 hover:border-pink-400/75',
    cardBg: 'bg-gradient-to-b from-pink-950/20 via-slate-900/90 to-slate-950',
    glowShadow: 'shadow-[0_4px_22px_rgba(255,61,127,0.16)]',
    badgeBg: 'bg-pink-950/80',
    badgeText: 'text-pink-300 border-pink-500/50',
    stageBg: 'bg-gradient-to-b from-pink-950/35 to-slate-950/70',
    stageBorder: 'border-pink-400/35',
    accentText: 'text-pink-400'
  },
  plasma: {
    cardBorder: 'border-purple-500/45 hover:border-purple-400/80',
    cardBg: 'bg-gradient-to-b from-purple-950/25 via-slate-900/90 to-slate-950',
    glowShadow: 'shadow-[0_4px_24px_rgba(181,55,242,0.2)]',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300 border-purple-500/50',
    stageBg: 'bg-gradient-to-b from-purple-950/40 to-slate-950/70',
    stageBorder: 'border-purple-400/40',
    accentText: 'text-purple-300'
  },
  paradox: {
    cardBorder: 'border-lime-500/45 hover:border-lime-400/85',
    cardBg: 'bg-gradient-to-b from-lime-950/25 via-slate-900/90 to-slate-950',
    glowShadow: 'shadow-[0_4px_25px_rgba(161,255,10,0.22)]',
    badgeBg: 'bg-lime-950/80',
    badgeText: 'text-lime-300 border-lime-500/50',
    stageBg: 'bg-gradient-to-b from-lime-950/40 to-slate-950/70',
    stageBorder: 'border-lime-400/40',
    accentText: 'text-lime-300'
  }
};


export const QuantumDex: React.FC<QuantumDexProps> = ({
  player,
  onAssignAssistant,
  onRenameHamster,
  onToggleFavorite,
  onRenameHybrid,
  onToggleFavoriteHybrid,
  onReleaseHybrid,
  onSetLabDisplayHybrid,
  onNftMintSuccess,
  isAssigning = false
}) => {
  const speciesList = Object.values(HAMSTER_SPECIES);
  const discoveredSpeciesCount = Object.keys(player.discoveredHamsters || {}).length;
  const totalBaseSpecimens = player.hamsters?.length || 0;
  const hybridsList = player.hybrids || [];
  const totalHybrids = hybridsList.length;
  const maxCapacity = getMaxHybridCapacity(player);

  // Active Category: 'base' or 'hybrids'
  const [dexCategory, setDexCategory] = useState<'base' | 'hybrids'>('base');

  // Hybrid Sub-Category: 'active' or 'memorial'
  const [hybridSubTab, setHybridSubTab] = useState<'active' | 'memorial'>('active');

  // Selected hybrid for incident history & deep inspection modal
  const [inspectingHybrid, setInspectingHybrid] = useState<QuantumHybrid | null>(null);

  // Selected base species for individual specimens modal
  const [inspectingSpecies, setInspectingSpecies] = useState<HamsterSpecies | null>(null);

  // Rename modal or inline state for base hamsters
  const [renamingHamsterId, setRenamingHamsterId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Rename state for hybrids
  const [renamingHybridId, setRenamingHybridId] = useState<string | null>(null);
  const [hybridNicknameInput, setHybridNicknameInput] = useState('');
  const [isSavingHybridName, setIsSavingHybridName] = useState(false);

  // Release confirmation modal state
  const [releasingHybrid, setReleasingHybrid] = useState<QuantumHybrid | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  // Web3 Minting State
  const [mintingHybrid, setMintingHybrid] = useState<QuantumHybrid | null>(null);
  const [dexWallet, setDexWallet] = useState<Web3WalletState>({ connected: false, address: null, chainId: null, isSepolia: false });
  const [dexSession, setDexSession] = useState<SiweSessionState>({ authenticated: false, address: null, playerId: null, sessionToken: null });

  useEffect(() => {
    checkWalletConnection().then(setDexWallet).catch(() => {});
    checkSiweSession().then(setDexSession).catch(() => {});
  }, []);

  // Collection filter
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');

  const rarityBadges: Record<string, string> = {
    common: 'bg-slate-800 text-slate-300 border-slate-700',
    uncommon: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80',
    rare: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80',
    epic: 'bg-purple-950/80 text-purple-300 border-purple-700/80',
    legendary: 'bg-amber-950/80 text-amber-300 border-amber-600/80',
    mythic: 'bg-pink-950/85 text-pink-300 border-pink-500/80'
  };

  const hybridRarityFrames: Record<string, string> = {
    common: 'border-slate-700 bg-slate-950/70 hover:border-slate-500',
    uncommon: 'border-emerald-500/70 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:border-emerald-400',
    rare: 'border-cyan-400/80 bg-cyan-950/25 shadow-[0_0_14px_rgba(6,182,212,0.25)] hover:border-cyan-300',
    epic: 'border-purple-400 bg-purple-950/35 shadow-[0_0_18px_rgba(168,85,247,0.35)] hover:border-purple-300',
    legendary: 'border-amber-400 bg-amber-950/40 anim-legendary-gleam',
    mythic: 'border-pink-400 bg-pink-950/50 anim-mythic-cosmic'
  };

  const refundAmounts: Record<string, number> = {
    common: 15,
    uncommon: 20,
    rare: 25,
    epic: 30,
    legendary: 40,
    mythic: 50
  };

  // Milestone definitions for base species
  const milestones = [
    { count: 2, title: 'Quantum Duo', reward: 'Dual Resonance' },
    { count: 4, title: 'Entanglement Master', reward: 'Stable Field' },
    { count: 5, title: 'Multiverse Curator', reward: 'Tachyon Surge' },
    { count: 6, title: 'Paradox Pioneer', reward: 'Grand Finale Ready' }
  ];

  const handleStartRename = (hamster: CollectibleHamster) => {
    setRenamingHamsterId(hamster.id);
    setNicknameInput(hamster.nickname || HAMSTER_SPECIES[hamster.speciesId]?.name || 'Hamster');
  };

  const handleSaveRename = async (hamsterId: string) => {
    if (!nicknameInput.trim()) return;
    setIsSavingName(true);
    try {
      await onRenameHamster(hamsterId, nicknameInput.trim().slice(0, 20));
      setRenamingHamsterId(null);
      audio.playClick();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleStartHybridRename = (hybrid: QuantumHybrid) => {
    setRenamingHybridId(hybrid.id);
    setHybridNicknameInput(hybrid.nickname);
  };

  const handleSaveHybridRename = async (hybridId: string) => {
    if (!hybridNicknameInput.trim() || !onRenameHybrid) return;
    setIsSavingHybridName(true);
    try {
      await onRenameHybrid(hybridId, hybridNicknameInput.trim().slice(0, 20));
      setRenamingHybridId(null);
      audio.playClick();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingHybridName(false);
    }
  };

  const handleConfirmRelease = async () => {
    if (!releasingHybrid || !onReleaseHybrid) return;
    setIsReleasing(true);
    try {
      await onReleaseHybrid(releasingHybrid.id);
      audio.playCharge();
      setReleasingHybrid(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsReleasing(false);
    }
  };

  const getSpecimensForSpecies = (speciesId: string) => {
    return (player.hamsters || []).filter(h => {
      if (h.speciesId !== speciesId) return false;
      if (filterMode === 'favorites') return h.isFavorite;
      return true;
    });
  };

  const activeHybrids = hybridsList.filter(h => h.existenceStatus !== 'deceased');
  const memorialHybrids = hybridsList.filter(h => h.existenceStatus === 'deceased');

  const filteredHybrids = (hybridSubTab === 'memorial' ? memorialHybrids : activeHybrids).filter(h => {
    if (filterMode === 'favorites') return h.isFavorite;
    return true;
  });

  return (
    <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-lg font-sans">QUANTUMDEX</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                Creature Archive
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage Base Hamster specimens, procedural Quantum Hybrids, and Memorial Records
            </p>
          </div>
        </div>

        {/* Global Progress Counters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <Users className="w-3.5 h-3.5 text-lime-400" />
            <span className="text-slate-400">Base:</span>
            <span className="font-bold text-lime-400">
              {totalBaseSpecimens} / 30
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <Dna className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Active:</span>
            <span className="font-bold text-purple-300">
              {activeHybrids.length} / {maxCapacity}
            </span>
          </div>

          {memorialHybrids.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/60 font-mono text-xs">
              <span className="text-rose-400">Memorial:</span>
              <span className="font-bold text-rose-300">
                {memorialHybrids.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs: Base Species vs Quantum Hybrids */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              audio.playClick();
              setDexCategory('base');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all flex items-center gap-2 ${
              dexCategory === 'base'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>Base Species</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-purple-200">
              {discoveredSpeciesCount}/6
            </span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setDexCategory('hybrids');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all flex items-center gap-2 ${
              dexCategory === 'hybrids'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Quantum Hybrids</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-purple-200">
              {totalHybrids}/{maxCapacity}
            </span>
          </button>
        </div>

        {/* Filter Favorites Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
              filterMode === 'all'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterMode('favorites')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
              filterMode === 'favorites'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3 fill-current" /> Favorites
          </button>
        </div>
      </div>

      {/* TAB 1: BASE HAMSTERS */}
      {dexCategory === 'base' && (
        <div className="space-y-6">
          {/* Species Milestones Bar */}
          <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Collection Milestones
              </span>
              <span className="text-purple-300 font-bold">{Math.round((discoveredSpeciesCount / 6) * 100)}% Complete</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {milestones.map((m) => {
                const isUnlocked = discoveredSpeciesCount >= m.count;
                return (
                  <div
                    key={m.count}
                    className={`p-2 rounded-lg border text-xs transition-all flex items-center gap-2 ${
                      isUnlocked
                        ? 'bg-purple-950/40 border-purple-600/60 text-purple-200'
                        : 'bg-slate-900/50 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isUnlocked ? 'bg-purple-500 text-slate-950 font-mono' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isUnlocked ? '✓' : m.count}
                    </div>
                    <div className="truncate">
                      <div className="font-bold truncate text-[11px]">{m.title}</div>
                      <div className="text-[9px] text-slate-400 truncate">{m.count} species</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6 Species Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {speciesList.map((species) => {
              const discoveryInfo = player.discoveredHamsters?.[species.id];
              const isDiscovered = !!discoveryInfo;
              const specimens = getSpecimensForSpecies(species.id);
              const activeAssistantHere = (player.hamsters || []).find(
                h => h.speciesId === species.id && (h.isAssistant || h.id === player.activeAssistantHamsterId)
              );
              const theme = SPECIES_THEMES[species.id] || SPECIES_THEMES.normal;

              if (!isDiscovered) {
                return (
                  <div
                    key={species.id}
                    className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 shadow-lg flex flex-col justify-between relative overflow-hidden select-none"
                  >
                    <div>
                      {/* Undiscovered Mysterious Stage */}
                      <div className="relative w-full h-36 rounded-xl flex items-center justify-center overflow-hidden border border-slate-800/80 bg-slate-950/90">
                        {/* Mystery Silhouette: exact sprite blacked out */}
                        <div className="relative z-0 opacity-20 filter brightness-0 select-none">
                          <PixelHamster speciesId={species.id} size="lg" />
                        </div>

                        {/* Centered lock & wavefunction prompt */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                          <div className="w-10 h-10 rounded-full bg-slate-900/95 border border-slate-700 flex items-center justify-center text-slate-400 shadow-md">
                            <Lock className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 mt-1.5 uppercase tracking-wider font-semibold">
                            Wavefunction Unobserved
                          </span>
                        </div>

                        {/* Top Left: Rarity */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border bg-slate-900/90 text-slate-500 border-slate-800">
                            {species.rarity}
                          </span>
                        </div>

                        {/* Top Right: Status */}
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded-full">
                            Undiscovered
                          </span>
                        </div>

                        {/* Bottom overlay: discovery hint */}
                        <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/60 truncate">
                            Experiment chamber collapse required
                          </span>
                        </div>
                      </div>

                      {/* Header details */}
                      <div className="mt-3.5 mb-1.5">
                        <h4 className="font-bold text-slate-400 text-base font-fredoka tracking-wide">
                          Unknown Quantum Entity
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          Wavefunction not yet observed in chamber
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2 min-h-[2.5rem]">
                        Conduct experiments in the quantum chamber to collapse this unknown wavefunction into reality.
                      </p>

                      {/* Compact Perk */}
                      <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 text-[11px] mb-3 flex items-start gap-2">
                        <span className="font-bold text-slate-600 shrink-0 font-mono text-[10px] uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          PERK
                        </span>
                        <span className="text-slate-500 italic line-clamp-2 leading-tight self-center">
                          ??? (Discover species to reveal)
                        </span>
                      </div>
                    </div>

                    {/* Locked Bottom Action */}
                    <div className="w-full py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-500 text-center font-mono flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Undiscovered</span>
                    </div>
                  </div>
                );
              }

              // Discovered Species Card
              return (
                <div
                  key={species.id}
                  className={`group p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                    activeAssistantHere
                      ? 'bg-slate-900 border-lime-500 shadow-xl shadow-lime-500/10 ring-2 ring-lime-500/40'
                      : `${theme.cardBg} ${theme.cardBorder} ${theme.glowShadow} hover:scale-[1.01]`
                  }`}
                  onClick={() => {
                    audio.playClick();
                    setInspectingSpecies(species);
                  }}
                >
                  <div>
                    {/* Dedicated Portrait Stage (30-50% larger, dedicated prominent frame) */}
                    <div className={`relative w-full h-36 rounded-xl flex items-center justify-center overflow-hidden border ${theme.stageBorder} ${theme.stageBg} transition-all`}>
                      {/* Ambient Species Halo */}
                      <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none opacity-50" />

                      {/* Top Left: Rarity Badge */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm ${rarityBadges[species.rarity]}`}>
                          {species.rarity}
                        </span>
                      </div>

                      {/* Top Right: Active Assistant or Owned Count */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                        {activeAssistantHere ? (
                          <span className="bg-lime-400 text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono shadow-md animate-pulse">
                            <UserCheck className="w-3 h-3" /> ACTIVE ASSISTANT
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-purple-200 bg-slate-950/80 border border-purple-800/80 px-2 py-0.5 rounded-full font-bold shadow-sm backdrop-blur-xs">
                            {specimens.length} Owned
                          </span>
                        )}
                      </div>

                      {/* Large Centered Hamster Portrait (size="lg", 84px vs 56px = 50% larger) */}
                      <div className="relative z-0 transform transition-transform group-hover:scale-110 duration-200">
                        <PixelHamster speciesId={species.id} size="lg" />
                      </div>

                      {/* Bottom overlay: Title Badge */}
                      <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-mono text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80 truncate shadow-xs backdrop-blur-xs">
                          {species.title}
                        </span>
                        {specimens.length > 0 && activeAssistantHere && (
                          <span className="text-[10px] font-mono text-lime-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-lime-800/80 backdrop-blur-xs">
                            In Wheel
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Species Name & Subtitle */}
                    <div className="mt-3.5 mb-1.5 flex items-center justify-between gap-2">
                      <h4 className="font-bold text-white text-base font-fredoka tracking-wide truncate">
                        {species.name}
                      </h4>
                      {activeAssistantHere && (
                        <span className="text-[10px] font-mono text-lime-400 font-semibold shrink-0">
                          Active Companion
                        </span>
                      )}
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-2 min-h-[2.5rem]">
                      {species.description}
                    </p>

                    {/* Compact Passive Perk Box */}
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] mb-3 flex items-start gap-2">
                      <span className="font-bold text-cyan-400 shrink-0 font-mono text-[10px] uppercase bg-cyan-950/90 px-1.5 py-0.5 rounded border border-cyan-800/80">
                        PERK
                      </span>
                      <span className="text-slate-300 line-clamp-2 leading-tight self-center">
                        {species.assistantPerk}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-purple-300 border border-purple-500/30 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View {specimens.length} Companions →</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: QUANTUM HYBRIDS */}
      {dexCategory === 'hybrids' && (
        <div className="space-y-4">
          {/* Sub-navigation: Active Sanctuary vs Memorial Archive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  audio.playClick();
                  setHybridSubTab('active');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                  hybridSubTab === 'active'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Active Sanctuary</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-200">
                  {activeHybrids.length}/{maxCapacity}
                </span>
              </button>

              <button
                onClick={() => {
                  audio.playClick();
                  setHybridSubTab('memorial');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                  hybridSubTab === 'memorial'
                    ? 'bg-rose-950 text-rose-200 border border-rose-700/80 shadow-sm shadow-rose-900/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5 text-rose-400" />
                <span>Memorial Archive</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300">
                  {memorialHybrids.length}
                </span>
              </button>
            </div>

            <div className="text-xs font-mono text-slate-400">
              {hybridSubTab === 'active' ? (
                <span>
                  {activeHybrids.length} active hybrids in sanctuary {maxCapacity} capacity limit
                </span>
              ) : (
                <span className="text-rose-300/80">
                  Deceased specimens are permanently preserved and do not occupy sanctuary capacity
                </span>
              )}
            </div>
          </div>

          {filteredHybrids.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <Dna className="w-10 h-10 mx-auto text-purple-400/60" />
              <h4 className="font-bold text-white text-base">
                {hybridSubTab === 'active' ? 'No Active Quantum Hybrids' : 'No Deceased Hamsters in Memorial'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {hybridSubTab === 'active'
                  ? 'Unlock Quantum Genetics in the Research Notebook and initiate an incubation in the Quantum Incubator to synthesize procedural hybrids!'
                  : 'All your quantum hybrids remain actively coherent in physical reality.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHybrids.map((hybrid) => {
                const isLabDisplay = player.activeLabHybridId === hybrid.id;
                const p1 = HAMSTER_SPECIES[hybrid.parent1Species];
                const p2 = HAMSTER_SPECIES[hybrid.parent2Species];
                const isRenaming = renamingHybridId === hybrid.id;
                const isMissing = hybrid.existenceStatus === 'missing';
                const isDeceased = hybrid.existenceStatus === 'deceased';

                return (
                  <div
                    key={hybrid.id}
                    className={`group p-4 rounded-2xl border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
                      isDeceased
                        ? 'bg-slate-950/50 border-rose-900/40 opacity-75'
                        : isMissing
                        ? 'bg-slate-950 border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.35)] anim-missing-glitch'
                        : isLabDisplay
                        ? 'bg-slate-900 border-pink-500 shadow-[0_0_20px_rgba(244,114,182,0.3)] ring-2 ring-pink-500/40'
                        : hybridRarityFrames[hybrid.rarity] || 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Dedicated Prominent Hybrid Portrait Stage (size="lg": 84px, 50% larger) */}
                      <div
                        onClick={() => {
                          audio.playClick();
                          setInspectingHybrid(hybrid);
                        }}
                        className={`relative w-full h-36 rounded-xl flex items-center justify-center overflow-hidden border cursor-pointer transition-all group-hover:scale-[1.01] ${
                          isMissing
                            ? 'bg-cyan-950/40 border-cyan-400/80 anim-missing-glitch'
                            : isDeceased
                            ? 'bg-slate-950 border-rose-900/60 grayscale'
                            : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-slate-700/80 hover:border-purple-400/80'
                        }`}
                        title="Click to open Specimen Spotlight & Quantum History"
                      >
                        {/* Ambient aura glow matching hybrid palette */}
                        <div
                          className="absolute inset-0 opacity-20 pointer-events-none"
                          style={{ background: `radial-gradient(circle, ${hybrid.traits.palette.glow} 0%, transparent 70%)` }}
                        />

                        {/* Top Left: Rarity Badge */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm ${rarityBadges[hybrid.rarity]}`}>
                            {hybrid.rarity}
                          </span>
                        </div>

                        {/* Top Right: Status / Personality Badge */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                          {hybrid.nftTokenId && (
                            <span className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono shadow-sm border border-purple-400" title={`Minted Onchain: Token #${hybrid.nftTokenId}`}>
                              <span>ONCHAIN #{hybrid.nftTokenId}</span>
                            </span>
                          )}
                          {isLabDisplay && !isDeceased && !isMissing ? (
                            <span className="bg-pink-500 text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono shadow-sm">
                              <Heart className="w-3 h-3 fill-current" /> LAB COMPANION
                            </span>
                          ) : isMissing ? (
                            <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono animate-pulse shadow-sm">
                              <AlertTriangle className="w-3 h-3" /> UNOBSERVED
                            </span>
                          ) : isDeceased ? (
                            <span className="bg-rose-900 text-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono shadow-sm">
                              DECEASED
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-cyan-300 bg-slate-950/85 px-2.5 py-0.5 rounded-full border border-cyan-800 shadow-sm backdrop-blur-xs">
                              {hybrid.personality}
                            </span>
                          )}
                        </div>

                        {/* Centered Large Hybrid Portrait (size="lg", 84px) */}
                        <div className="relative z-0 transform transition-transform group-hover:scale-110 duration-200">
                          <PixelHybridHamster hybrid={hybrid} size="lg" />
                        </div>

                        {/* Bottom Parentage Overlay */}
                        <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between pointer-events-none">
                          <span className="text-[10px] font-mono text-slate-300 bg-slate-950/85 px-2 py-0.5 rounded border border-slate-800/80 truncate shadow-xs backdrop-blur-xs flex items-center gap-1">
                            <span>{p1?.icon} {p1?.name}</span>
                            <span>×</span>
                            <span>{p2?.icon} {p2?.name}</span>
                          </span>
                          <span className="text-[9px] font-mono text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/60 flex items-center gap-1 backdrop-blur-xs">
                            <Sparkles className="w-2.5 h-2.5" /> Spotlight
                          </span>
                        </div>
                      </div>

                      {/* Nickname & Inline Edit */}
                      <div className="mt-3.5 mb-2 flex items-center justify-between gap-2">
                        {isRenaming ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              value={hybridNicknameInput}
                              onChange={(e) => setHybridNicknameInput(e.target.value)}
                              maxLength={20}
                              className="bg-slate-900 border border-purple-500 rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-none flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveHybridRename(hybrid.id);
                                if (e.key === 'Escape') setRenamingHybridId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveHybridRename(hybrid.id)}
                              disabled={isSavingHybridName}
                              className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setRenamingHybridId(null)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-bold text-white text-base font-fredoka tracking-wide truncate">
                              {hybrid.nickname}
                            </h4>
                            {!isDeceased && (
                              <button
                                onClick={() => handleStartHybridRename(hybrid)}
                                className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors shrink-0"
                                title="Rename Hybrid"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {!isRenaming && (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {hybrid.traits.quantumEffect.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {/* Concise Mutation Tags */}
                      {hybrid.traits.activeMutations && hybrid.traits.activeMutations.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {hybrid.traits.activeMutations.slice(0, 3).map((mut) => (
                            <span
                              key={mut}
                              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60"
                            >
                              {mut}
                            </span>
                          ))}
                          {hybrid.traits.activeMutations.length > 3 && (
                            <span className="text-[9px] font-mono text-slate-500">
                              +{hybrid.traits.activeMutations.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Compact Phenotype Traits Pill */}
                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono mb-3 space-y-0.5">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>Pattern / Shape:</span>
                          <span className="text-white capitalize">{hybrid.traits.furPattern.replace('_', ' ')} • {hybrid.traits.bodyShape}</span>
                        </div>
                        {hybrid.traits.cosmeticMutation !== 'none' && (
                          <div className="flex justify-between text-purple-300 text-[10px]">
                            <span>Mutation:</span>
                            <span className="capitalize font-semibold">{hybrid.traits.cosmeticMutation.replace('_', ' ')}</span>
                          </div>
                        )}
                        {isMissing && (
                          <div className="text-[10px] text-amber-400 italic pt-1 border-t border-slate-800/80">
                            ⚠ Disappeared into the quantum void. Signal expected to return.
                          </div>
                        )}
                        {isDeceased && (
                          <div className="text-[10px] text-rose-400/80 italic pt-1 border-t border-slate-800/80">
                            💀 Superposition collapsed. Permanently preserved in Memorial.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80">
                      {/* Left: Lab Display & Favorite & History */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={async () => {
                            audio.playClick();
                            if (onToggleFavoriteHybrid) await onToggleFavoriteHybrid(hybrid.id);
                          }}
                          className={`p-2 rounded-xl border transition-all ${
                            hybrid.isFavorite
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                          title={
                            hybrid.isFavorite
                              ? 'Favorited: Protected from permanent quantum death'
                              : 'Favorite: Protects this hybrid from permanent quantum death'
                          }
                        >
                          <Star className={`w-3.5 h-3.5 ${hybrid.isFavorite ? 'fill-amber-400' : ''}`} />
                        </button>

                        <button
                          disabled={isMissing || isDeceased}
                          onClick={async () => {
                            if (isMissing || isDeceased) return;
                            audio.playClick();
                            if (onSetLabDisplayHybrid) {
                              await onSetLabDisplayHybrid(isLabDisplay ? null : hybrid.id);
                            }
                          }}
                          className={`p-2 rounded-xl border transition-all ${
                            isMissing || isDeceased
                              ? 'bg-slate-950 border-slate-900 text-slate-700 cursor-not-allowed'
                              : isLabDisplay
                              ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                          title={
                            isMissing
                              ? 'Cannot display a missing hamster'
                              : isDeceased
                              ? 'Cannot display a deceased hamster'
                              : isLabDisplay
                              ? 'Remove from Lab Display'
                              : 'Set as Lab Display Companion'
                          }
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLabDisplay && !isMissing && !isDeceased ? 'fill-pink-400' : ''}`} />
                        </button>

                        {/* View Quantum Timeline Button */}
                        <button
                          onClick={() => {
                            audio.playClick();
                            setInspectingHybrid(hybrid);
                          }}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-800/60 transition-colors"
                          title="View Quantum History & Incident Timeline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Right: Release to Quantum Field Button */}
                      {!isDeceased && (
                        <button
                          disabled={isMissing}
                          onClick={() => {
                            if (isMissing) return;
                            audio.playClick();
                            setReleasingHybrid(hybrid);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors flex items-center gap-1 ${
                            isMissing
                              ? 'text-slate-600 bg-slate-950 border border-slate-900 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-800/50'
                          }`}
                          title={
                            isMissing
                              ? 'Missing hamsters cannot be released while unobserved'
                              : 'Release to Quantum Field for Battery Energy'
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Release</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Individual Base Companions Modal Drawer */}
      {inspectingSpecies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0 shadow-md">
                  <PixelHamster speciesId={inspectingSpecies.id} size="md" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {inspectingSpecies.name} Specimen Archive
                  </h3>
                  <p className="text-xs text-slate-400">
                    {getSpecimensForSpecies(inspectingSpecies.id).length} individual companions in sanctuary
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingSpecies(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Companions Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {getSpecimensForSpecies(inspectingSpecies.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  No specimens matching current filter.
                </div>
              ) : (
                getSpecimensForSpecies(inspectingSpecies.id).map((hamster) => {
                  const isAssistant = hamster.isAssistant || player.activeAssistantHamsterId === hamster.id;
                  const personality = PERSONALITY_META[hamster.personality] || PERSONALITY_META.Curious;
                  const isRenaming = renamingHamsterId === hamster.id;

                  return (
                    <div
                      key={hamster.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isAssistant
                          ? 'bg-slate-950 border-lime-500/60 shadow-md shadow-lime-500/5 ring-1 ring-lime-500/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Avatar + Details */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                          <PixelHamster speciesId={hamster.speciesId} size="md" />
                        </div>

                        <div>
                          {/* Nickname & Edit */}
                          {isRenaming ? (
                            <div className="flex items-center gap-1.5 my-1">
                              <input
                                type="text"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                maxLength={20}
                                className="bg-slate-900 border border-purple-500 rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(hamster.id);
                                  if (e.key === 'Escape') setRenamingHamsterId(null);
                                }}
                              />
                              <button
                                onClick={() => handleSaveRename(hamster.id)}
                                disabled={isSavingName}
                                className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRenamingHamsterId(null)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {hamster.nickname || inspectingSpecies.name}
                              </span>
                              <button
                                onClick={() => handleStartRename(hamster)}
                                className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors"
                                title="Rename companion"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Personality & Origin Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${personality.color} flex items-center gap-1`}
                              title={personality.desc}
                            >
                              <span>{personality.emoji}</span>
                              <span>{hamster.personality}</span>
                            </span>

                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                              {hamster.experimentTier} • State {hamster.observationState || 'A'}
                            </span>

                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(hamster.discoveredAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Favorite + Assign Controls */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Favorite Toggle */}
                        <button
                          onClick={async () => {
                            audio.playClick();
                            await onToggleFavorite(hamster.id);
                          }}
                          className={`p-2 rounded-xl border transition-all ${
                            hamster.isFavorite
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                          title={hamster.isFavorite ? 'Favorited' : 'Add to Favorites'}
                        >
                          <Star className={`w-4 h-4 ${hamster.isFavorite ? 'fill-amber-400' : ''}`} />
                        </button>

                        {/* Assign Assistant */}
                        <button
                          onClick={async () => {
                            audio.playClick();
                            await onAssignAssistant(hamster.id);
                          }}
                          disabled={isAssistant || isAssigning}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition-all ${
                            isAssistant
                              ? 'bg-lime-500/20 text-lime-400 border border-lime-500/40 cursor-default'
                              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                          }`}
                        >
                          {isAssistant ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Assistant</span>
                            </>
                          ) : (
                            <span>Set Assistant</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">
                Species Perk: <strong className="text-cyan-300">{inspectingSpecies.assistantPerk}</strong>
              </span>
              <button
                onClick={() => setInspectingSpecies(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hybrid Deep Inspection & Incident Timeline Modal */}
      {inspectingHybrid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
            {/* Specimen Spotlight Modal Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-slate-800">
              {/* Hero Collectible Portrait Stage (size="hero": 130px) */}
              <div className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-2xl overflow-hidden ${
                inspectingHybrid.rarity === 'mythic'
                  ? 'border-2 anim-mythic-cosmic bg-pink-950/50'
                  : inspectingHybrid.rarity === 'legendary'
                  ? 'border-2 anim-legendary-gleam bg-amber-950/50'
                  : inspectingHybrid.rarity === 'epic'
                  ? 'border-2 border-purple-400 bg-purple-950/50 shadow-[0_0_25px_rgba(168,85,247,0.45)]'
                  : inspectingHybrid.rarity === 'rare'
                  ? 'border-2 border-cyan-400 bg-cyan-950/50 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                  : inspectingHybrid.rarity === 'uncommon'
                  ? 'border-2 border-emerald-400 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                  : 'border border-slate-700 bg-slate-950/90'
              }`}>
                {/* Holographic Pedestal base */}
                <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 w-24 h-4 rounded-full bg-white/5 border border-white/10 blur-[1px] pointer-events-none" />

                <div className="relative z-10 transform scale-110 sm:scale-120">
                  <PixelHybridHamster hybrid={inspectingHybrid} size="hero" />
                </div>
              </div>

              {/* Specimen Metadata & Titles */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <span className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${rarityBadges[inspectingHybrid.rarity]}`}>
                    {inspectingHybrid.rarity}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800 shadow-sm">
                    {inspectingHybrid.personality}
                  </span>
                  {inspectingHybrid.id === player.activeLabHybridId && (
                    <span className="text-[10px] font-mono text-pink-300 bg-pink-950/80 px-2.5 py-0.5 rounded-full border border-pink-800 flex items-center gap-1 font-bold shadow-sm">
                      <Heart className="w-3 h-3 fill-pink-400" /> Lab Display Companion
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold font-fredoka text-white tracking-wide">
                  {inspectingHybrid.nickname}
                </h3>

                <p className="text-xs text-slate-300 font-mono mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <span>Parentage:</span>
                  <strong className="text-white">{HAMSTER_SPECIES[inspectingHybrid.parent1Species]?.name}</strong>
                  <span>×</span>
                  <strong className="text-white">{HAMSTER_SPECIES[inspectingHybrid.parent2Species]?.name}</strong>
                </p>

                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Observed & synthesized on {new Date(inspectingHybrid.discoveredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setInspectingHybrid(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors self-start"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Existence & Protection Status Bar */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Quantum State: </span>
                  {inspectingHybrid.existenceStatus === 'alive' ? (
                    <span className="text-lime-400 font-bold">● ALIVE / COHERENT</span>
                  ) : inspectingHybrid.existenceStatus === 'missing' ? (
                    <span className="text-amber-400 font-bold animate-pulse">▲ UNOBSERVED IN VOID</span>
                  ) : (
                    <span className="text-rose-400 font-bold">✖ DECEASED (MEMORIAL)</span>
                  )}
                </div>

                {/* Protection Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {inspectingHybrid.isFavorite && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-300" /> Favorite Protection
                    </span>
                  )}
                  {Date.now() - inspectingHybrid.discoveredAt < 7 * 86400000 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Newborn Protected
                    </span>
                  )}
                  {(inspectingHybrid.rarity === 'legendary' || inspectingHybrid.rarity === 'mythic') && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Tier Immune
                    </span>
                  )}
                </div>
              </div>

              {/* Quantum Mutation Profile & Phenotype Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Dna className="w-3.5 h-3.5 text-purple-400" /> Quantum Mutation Profile
                  </span>
                  {inspectingHybrid.generatedName && inspectingHybrid.generatedName !== inspectingHybrid.nickname && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Designation: <strong className="text-purple-300">{inspectingHybrid.generatedName}</strong>
                    </span>
                  )}
                </div>

                {/* Active Mutation Badges List */}
                {inspectingHybrid.traits.activeMutations && inspectingHybrid.traits.activeMutations.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {inspectingHybrid.traits.activeMutations.map((mut) => (
                      <span
                        key={mut}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-700/80 flex items-center gap-1"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                        <span>{mut}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    Baseline quantum genome (no active structural mutations).
                  </div>
                )}

                {/* Detailed Trait Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Eye Morphology</div>
                    <div className="text-white capitalize truncate font-semibold">
                      {inspectingHybrid.traits.eyeMutation ? inspectingHybrid.traits.eyeMutation.replace('_', ' ') : 'Normal (2 Eyes)'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Head / Horns</div>
                    <div className="text-white capitalize truncate font-semibold">
                      {inspectingHybrid.traits.headMutation ? inspectingHybrid.traits.headMutation.replace('_', ' ') : 'None'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Limb Structure</div>
                    <div className="text-white capitalize truncate font-semibold">
                      {inspectingHybrid.traits.limbMutation === 'missing_hind_legs'
                        ? 'Floating (No Hind Legs)'
                        : inspectingHybrid.traits.limbMutation ? inspectingHybrid.traits.limbMutation.replace('_', ' ') : 'Standard Paws'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Tail / Back</div>
                    <div className="text-cyan-300 capitalize truncate font-semibold">
                      {inspectingHybrid.traits.tailMutation && inspectingHybrid.traits.tailMutation !== 'none'
                        ? inspectingHybrid.traits.tailMutation.replace('_', ' ')
                        : inspectingHybrid.traits.cosmeticMutation !== 'none'
                        ? inspectingHybrid.traits.cosmeticMutation.replace('_', ' ')
                        : 'Standard Nub'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Quantum Aura</div>
                    <div className="text-purple-300 capitalize truncate font-semibold">
                      {inspectingHybrid.traits.auraEffect && inspectingHybrid.traits.auraEffect !== 'none'
                        ? `${inspectingHybrid.traits.auraEffect} Aura`
                        : inspectingHybrid.traits.quantumEffect !== 'none'
                        ? inspectingHybrid.traits.quantumEffect.replace('_', ' ')
                        : 'None'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Fur Pattern</div>
                    <div className="text-white capitalize truncate">
                      {inspectingHybrid.traits.furPattern.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Web3 v1: Blockchain & Immutable NFT Section */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/40 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-white font-semibold flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Blockchain & Immutable NFT
                  </span>
                  <span className="text-[10px] text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                    Ethereum Sepolia Testnet (11155111)
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-400">Onchain Status</div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {inspectingHybrid.nftTokenId ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-300">ONCHAIN — TOKEN #{inspectingHybrid.nftTokenId}</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          <span className="text-slate-300">Not Minted (Offchain Laboratory — Minting Optional)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {inspectingHybrid.nftTokenId ? (
                    <div className="flex items-center gap-2">
                      {inspectingHybrid.nftTxHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${inspectingHybrid.nftTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <span>View on Explorer</span>
                          <ExternalLink className="w-3 h-3 text-purple-400" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div>
                      {inspectingHybrid.existenceStatus === 'deceased' ? (
                        <span className="text-[10px] text-slate-500 italic">
                          Deceased specimens cannot be minted
                        </span>
                      ) : inspectingHybrid.existenceStatus === 'missing' ? (
                        <span className="text-[10px] text-amber-400/80 italic">
                          Cannot mint while in superposition
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            audio.playClick();
                            setMintingHybrid(inspectingHybrid);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>MINT AS NFT</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {inspectingHybrid.nftTokenId && (
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                    <span>Contract: {inspectingHybrid.nftContractAddress ? `${inspectingHybrid.nftContractAddress.slice(0, 10)}...${inspectingHybrid.nftContractAddress.slice(-6)}` : 'Sepolia'}</span>
                    <span>Minted {inspectingHybrid.nftMintedAt ? new Date(inspectingHybrid.nftMintedAt).toLocaleDateString() : 'Onchain'}</span>
                  </div>
                )}
              </div>

              {/* Quantum Incident History Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-cyan-400" /> Quantum Fate Timeline
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {(inspectingHybrid.fateHistory || []).length} recorded incidents
                  </span>
                </div>

                <div className="space-y-2 relative border-l-2 border-slate-800 ml-3 pl-4">
                  {(inspectingHybrid.fateHistory && inspectingHybrid.fateHistory.length > 0) ? (
                    inspectingHybrid.fateHistory.map((incident, idx) => {
                      const icons: Record<string, string> = {
                        hatched: '🐣',
                        disappeared: '⚠',
                        returned: '⚛️',
                        returned_changed: '✨',
                        deceased: '💀',
                        impossible_return: '🌟'
                      };
                      const icon = icons[incident.type] || '🔬';

                      return (
                        <div key={incident.id || idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 relative text-xs">
                          {/* Dot on line */}
                          <div className="absolute -left-[23px] top-3.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-slate-900" />
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span>{icon}</span>
                              <span>{incident.title}</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(incident.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs">{incident.description}</p>
                          {incident.metadata?.traitAdded && (
                            <div className="mt-1 text-[11px] font-mono text-purple-300 font-semibold">
                              + Trait Added: {incident.metadata.traitAdded}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 text-slate-500 text-xs font-mono">
                      No quantum fate incidents recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingHybrid(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Confirmation Modal */}
      {releasingHybrid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-5 sm:p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center p-2 text-rose-400">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Release to Quantum Field?</h3>
              <p className="text-xs text-slate-300 mt-1">
                Are you sure you want to release <strong>{releasingHybrid.nickname}</strong>? This action is permanent and cannot be undone.
              </p>
            </div>

            {releasingHybrid.isFavorite ? (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-mono">
                ⚠️ This hybrid is currently marked as Favorite. You must unfavorite it before releasing.
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Battery Energy Refund:</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> +{refundAmounts[releasingHybrid.rarity] || 15} Energy
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setReleasingHybrid(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRelease}
                disabled={releasingHybrid.isFavorite || isReleasing}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  releasingHybrid.isFavorite
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                }`}
              >
                {isReleasing ? 'Releasing...' : 'Confirm Release'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web3 v1: Mint NFT Modal */}
      {mintingHybrid && (
        <MintNftModal
          hybrid={mintingHybrid}
          wallet={dexWallet}
          session={dexSession}
          onClose={() => setMintingHybrid(null)}
          onSuccess={(updated) => {
            setInspectingHybrid(updated);
            setMintingHybrid(null);
            if (onNftMintSuccess) onNftMintSuccess(updated);
          }}
        />
      )}
    </div>
  );
};