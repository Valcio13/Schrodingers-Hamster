import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlayerState,
  ExperimentOutcome,
  ExperimentApproach,
  QuantumFateIncident,
  isQuantumGeneticsUnlocked,
  RESEARCH_UPGRADES,
  ResearchUpgrade
} from './types/game';
import { SqueekTelemetry } from '../worker/squeekchain';
import {
  fetchPlayerState,
  claimWork,
  startExperiment,
  revealExperiment,
  useGhostSight,
  unlockResearch,
  synthesizeResearchNotes,
  assignAssistant,
  renameHamster,
  toggleFavoriteHamster,
  assignAssistantHamster,
  startIncubationApi,
  useIncubationGhostSightApi,
  revealIncubationApi,
  renameHybridApi,
  toggleFavoriteHybridApi,
  releaseHybridApi,
  setLabDisplayHybridApi,
  dismissFateIncidentsApi,
  fetchTelemetry,
  resetLab,
  setDevBatteryState,
  setDevActivityRpm,
  setDevBreedingCharges,
  addDevBreedingCharges
} from './services/api';
import { audio } from './services/audio';
import { LabEnvironment } from './components/LabEnvironment';
import { BatteryConduit } from './components/BatteryConduit';
import { ExperimentStation } from './components/ExperimentStation';
import { PixelHamster } from './components/PixelHamster';
import { QuantumIncubator } from './components/QuantumIncubator';
import { ResearchNotebook } from './components/ResearchNotebook';
import { QuantumDex } from './components/QuantumDex';
import { GrandParadoxPanel } from './components/GrandParadoxPanel';
import { DevSimDrawer } from './components/DevSimDrawer';
import { HybridPreviewGallery } from './components/HybridPreviewGallery';
import { SqueektoshiAnimationPreview } from './components/SqueektoshiAnimationPreview';
import { HowToPlayModal } from './components/HowToPlayModal';
import { BackupRecoveryModal } from './components/BackupRecoveryModal';
import { WalletConnectButton } from './components/WalletConnectButton';
import {
  Zap,
  BookOpen,
  Award,
  Volume2,
  VolumeX,
  Wrench,
  Radio,
  Dna,
  Sparkles,
  Check,
  Crown,
  X,
  Atom,
  HelpCircle,
  Lock,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [telemetry, setTelemetry] = useState<SqueekTelemetry | null>(null);
  const [activeTab, setActiveTab] = useState<'lab' | 'incubator' | 'collection' | 'research'>('lab');
  const [activeModal, setActiveModal] = useState<'chamber' | 'battery' | 'incubator' | 'incubator_locked' | 'paradox' | null>(null);
  const [chamberSubTab, setChamberSubTab] = useState<'experiments' | 'paradox'>('experiments');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isStartingExp, setIsStartingExp] = useState(false);
  const [isStartingIncubation, setIsStartingIncubation] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isMuted, setIsMuted] = useState(audio.isMuted);
  const [isDevOpen, setIsDevOpen] = useState(false);
  const [showPreviewGallery, setShowPreviewGallery] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [recentResearchUnlock, setRecentResearchUnlock] = useState<ResearchUpgrade | null>(null);
  const researchUnlockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showAnimationGallery, setShowAnimationGallery] = useState(false);
  const [showGeneticsCelebration, setShowGeneticsCelebration] = useState(false);
  const prevGeneticsUnlockedRef = useRef<boolean>(false);
  const [lastSqueekBonus, setLastSqueekBonus] = useState<number | null>(null);
  const bonusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingSave, setIsLoadingSave] = useState<boolean>(false);

  const triggerBonusNotification = useCallback((earned: number) => {
    if (earned <= 0) return;
    setLastSqueekBonus(earned);
    audio.playCharge();
    if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
    bonusTimerRef.current = setTimeout(() => {
      setLastSqueekBonus(null);
    }, 4000);
  }, []);

  // Quantum Fate incident announcement
  const [activeFateIncident, setActiveFateIncident] = useState<QuantumFateIncident | null>(null);
  const seenIncidentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (player?.recentFateIncidents && player.recentFateIncidents.length > 0) {
      const unseen = player.recentFateIncidents.find(inc => !seenIncidentIdsRef.current.has(inc.id));
      if (unseen) {
        seenIncidentIdsRef.current.add(unseen.id);
        setActiveFateIncident(unseen);
        if (unseen.type === 'deceased') audio.playError();
        else if (unseen.type === 'impossible_return') {
          audio.playVictory();
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } else if (unseen.type === 'returned_changed' || unseen.type === 'returned') {
          audio.playSuccess();
        } else {
          audio.playClick();
        }
      }
    }
  }, [player?.recentFateIncidents]);

  // Initial load
  const loadInitialData = useCallback(async () => {
    setIsLoadingSave(true);
    try {
      const [state, telem] = await Promise.all([
        fetchPlayerState(),
        fetchTelemetry()
      ]);
      setPlayer(state);
      setTelemetry(telem);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Failed to load initial lab state:', err);
      setErrorMsg(err.message || 'Failed to connect to local game server.');
    } finally {
      setIsLoadingSave(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Global ESC key listener to dismiss open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        setShowHowToPlay(false);
        setShowBackupModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Periodic Squeekchain Telemetry & Settled Work Sync (Every 8 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const syncRes = await claimWork();
        setPlayer(syncRes.player);
        setTelemetry(syncRes.telemetry);
        if (syncRes.squeekEnergyEarned > 0) {
          triggerBonusNotification(syncRes.squeekEnergyEarned);
        }
      } catch (err) {
        // Silently tolerate temporary polling errors
      }
    }, 8000);

    return () => {
      clearInterval(interval);
      if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
    };
  }, [triggerBonusNotification]);

  const handleDevSetBatteryPercentage = useCallback(async (pct: number) => {
    if (!player) return;
    const cap = player.batteryCapacity || 150;
    const targetEnergy = Math.round((pct / 100) * cap);
    setPlayer(prev => prev ? { ...prev, batteryEnergy: targetEnergy } : null);
    try {
      const res = await setDevBatteryState({ energy: targetEnergy });
      setPlayer(res.player);
    } catch (err) {
      console.error('Failed to sync dev battery percentage:', err);
    }
  }, [player]);

  const handleDevSetBatteryCapacity = useCallback(async (cap: number) => {
    if (!player) return;
    setPlayer(prev => prev ? { ...prev, batteryCapacity: cap, batteryEnergy: Math.min(prev.batteryEnergy, cap) } : null);
    try {
      const res = await setDevBatteryState({ capacity: cap });
      setPlayer(res.player);
    } catch (err) {
      console.error('Failed to sync dev battery capacity:', err);
    }
  }, [player]);

  const handleDevSetActivityRpm = useCallback(async (rpm: number) => {
    setTelemetry(prev => prev ? {
      ...prev,
      rpm,
      activityPattern: rpm > 60 ? 'fast' : rpm > 0 ? 'sustained' : 'resting',
      patternDescription: rpm > 0 ? `Squeektoshi running at ${rpm} RPM` : 'Squeektoshi is resting in nest'
    } : {
      freshness: 'live',
      rpm,
      speedMmPerSecond: rpm * 12,
      distanceMm: 1000,
      counterEpoch: 'dev',
      observedAt: new Date().toISOString(),
      provenance: 'DEV_SIM',
      coreStatus: 'active',
      settledCumulativeWork: 50000,
      settledRound: 100,
      blockHeight: 5000,
      activityPattern: rpm > 60 ? 'fast' : rpm > 0 ? 'sustained' : 'resting',
      patternDescription: rpm > 0 ? `Squeektoshi running at ${rpm} RPM` : 'Squeektoshi is resting in nest'
    });
    try {
      const res = await setDevActivityRpm(rpm);
      setPlayer(res.player);
      setTelemetry(res.telemetry);
    } catch (err) {
      console.error('Failed to sync dev activity rpm:', err);
    }
  }, []);

  const handleDevSetBreedingCharges = useCallback(async (charges: number, progress?: number) => {
    if (!player) return;
    const targetProgress = typeof progress === 'number' ? progress : (charges >= 3 ? 2000 : 0);
    setPlayer(prev => prev ? { ...prev, breedingCharges: charges, breedingChargeProgress: targetProgress } : null);
    try {
      const res = await setDevBreedingCharges(charges, progress);
      setPlayer(res.player);
      setTelemetry(res.telemetry);
    } catch (err) {
      console.error('Failed to sync dev breeding charges:', err);
    }
  }, [player]);

  const handleDevAddBreedingCharges = useCallback(async (amount: number = 1) => {
    if (!player) return;
    const newCharges = Math.min(3, (player.breedingCharges || 0) + amount);
    setPlayer(prev => prev ? { ...prev, breedingCharges: newCharges } : null);
    try {
      const res = await addDevBreedingCharges(amount);
      setPlayer(res.player);
      setTelemetry(res.telemetry);
    } catch (err) {
      console.error('Failed to sync dev add breeding charges:', err);
    }
  }, [player]);

  useEffect(() => {
    (window as any).__setDevBatteryPct = handleDevSetBatteryPercentage;
    (window as any).__setDevBatteryCap = handleDevSetBatteryCapacity;
    (window as any).__setDevActivityRpm = handleDevSetActivityRpm;
    (window as any).__setDevBreedingCharges = handleDevSetBreedingCharges;
    (window as any).__addDevBreedingCharge = handleDevAddBreedingCharges;
  }, [handleDevSetBatteryPercentage, handleDevSetBatteryCapacity, handleDevSetActivityRpm, handleDevSetBreedingCharges, handleDevAddBreedingCharges]);

  // Handlers
  const handleSyncWork = async () => {
    setIsSyncing(true);
    try {
      const syncRes = await claimWork();
      setPlayer(syncRes.player);
      setTelemetry(syncRes.telemetry);
      if (syncRes.squeekEnergyEarned > 0) {
        triggerBonusNotification(syncRes.squeekEnergyEarned);
      }
    } catch (err: any) {
      setErrorMsg('Failed to sync Squeekchain work.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartExperiment = async (
    type: 'basic' | 'unstable' | 'paradox' | 'grand',
    approach: ExperimentApproach = 'stable'
  ) => {
    setIsStartingExp(true);
    try {
      const res = await startExperiment(type, approach);
      setPlayer(res.player);
      audio.playZap();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not initiate experiment.');
    } finally {
      setIsStartingExp(false);
    }
  };

  const handleRevealExperiment = async (chosenState: 'A' | 'B' = 'A') => {
    const res = await revealExperiment(chosenState);
    setPlayer(res.player);
    return { outcome: res.outcome, chosenState: res.chosenState };
  };

  const handleGhostSight = async (target: 'A' | 'B') => {
    try {
      const res = await useGhostSight(target);
      setPlayer(prev => prev ? { ...prev, activeExperiment: res.activeExperiment } : null);
      audio.playCharge();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not use Quantum Sight.');
    }
  };


  const handleSynthesizeNotes = async (action: 'battery' | 'breeding_charge' | 'habitat_expansion') => {
    setIsSynthesizing(true);
    try {
      const res = await synthesizeResearchNotes(action);
      setPlayer(res.player);
      if (action === 'habitat_expansion') {
        audio.playDiscovery();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } else {
        audio.playCharge();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to synthesize research notes.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleUnlockUpgrade = async (upgradeId: string) => {
    setIsUnlocking(true);
    try {
      const wasUnlocked = player ? isQuantumGeneticsUnlocked(player) : false;
      const res = await unlockResearch(upgradeId);
      const isNowUnlocked = isQuantumGeneticsUnlocked(res.player);
      setPlayer(res.player);

      // Phase 3.A: Research Unlock Celebration Toast
      const upg = RESEARCH_UPGRADES.find(u => u.id === upgradeId);
      if (upg) {
        setRecentResearchUnlock(upg);
        audio.playLevelUp();
        if (researchUnlockTimerRef.current) clearTimeout(researchUnlockTimerRef.current);
        researchUnlockTimerRef.current = setTimeout(() => setRecentResearchUnlock(null), 4500);
      } else {
        audio.playDiscovery();
      }

      // Phase 3.B: Quantum Genetics Major Breakthrough
      if (!wasUnlocked && isNowUnlocked) {
        setShowGeneticsCelebration(true);
        confetti({
          particleCount: 170,
          spread: 90,
          origin: { y: 0.5 }
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not unlock research.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleAssignAssistant = async (speciesId: string) => {
    setIsAssigning(true);
    try {
      const res = await assignAssistant(speciesId);
      setPlayer(res.player);
      audio.playClick();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not assign assistant.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRenameHamster = async (hamsterId: string, nickname: string) => {
    try {
      const res = await renameHamster(hamsterId, nickname);
      setPlayer(res.player);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not rename hamster.');
    }
  };

  const handleToggleFavorite = async (hamsterId: string) => {
    try {
      const res = await toggleFavoriteHamster(hamsterId);
      setPlayer(res.player);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not toggle favorite.');
    }
  };

  const handleAssignAssistantHamster = async (hamsterId: string) => {
    setIsAssigning(true);
    try {
      const res = await assignAssistantHamster(hamsterId);
      setPlayer(res.player);
      audio.playClick();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not assign assistant.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Quantum Genetics & Incubation Handlers
  const handleStartIncubation = async (parent1Species: string, parent2Species: string) => {
    setIsStartingIncubation(true);
    try {
      const res = await startIncubationApi(parent1Species, parent2Species);
      setPlayer(res.player);
      audio.playZap();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not initiate incubation.');
    } finally {
      setIsStartingIncubation(false);
    }
  };

  const handleIncubationGhostSight = async (target: 'A' | 'B') => {
    try {
      const res = await useIncubationGhostSightApi(target);
      setPlayer(prev => prev ? { ...prev, activeIncubation: res.activeIncubation } : null);
      audio.playCharge();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not use Quantum Sight.');
    }
  };

  const handleRevealIncubation = async (chosenState: 'A' | 'B') => {
    const res = await revealIncubationApi(chosenState);
    setPlayer(res.player);
    return { hybrid: res.hybrid, chosenState: res.chosenState };
  };

  const handleRenameHybrid = async (hybridId: string, nickname: string) => {
    try {
      const res = await renameHybridApi(hybridId, nickname);
      setPlayer(res.player);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not rename hybrid.');
    }
  };

  const handleToggleFavoriteHybrid = async (hybridId: string) => {
    try {
      const res = await toggleFavoriteHybridApi(hybridId);
      setPlayer(res.player);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not toggle favorite.');
    }
  };

  const handleReleaseHybrid = async (hybridId: string) => {
    try {
      const res = await releaseHybridApi(hybridId);
      setPlayer(res.player);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not release hybrid.');
    }
  };

  const handleSetLabDisplayHybrid = async (hybridId: string | null) => {
    try {
      const res = await setLabDisplayHybridApi(hybridId);
      setPlayer(res.player);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not update lab display companion.');
    }
  };

  const handleSimulateWork = async (units: number) => {
    try {
      const res = await claimWork(units);
      setPlayer(res.player);
      setTelemetry(res.telemetry);
      if (res.squeekEnergyEarned > 0) {
        setLastSqueekBonus(res.squeekEnergyEarned);
        audio.playCharge();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetLab = async () => {
    try {
      const res = await resetLab();
      setPlayer(res.player);
      setLastSqueekBonus(null);
      const telem = await fetchTelemetry();
      setTelemetry(telem);
    } catch (err) {
      console.error(err);
    }
  };

  if (!player) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md p-6 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-2xl">
          {errorMsg ? (
            <>
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl">
                ⚠️
              </div>
              <h2 className="font-fredoka text-xl font-bold text-white">Laboratory Save Load Failed</h2>
              <p className="text-xs text-rose-300 font-mono">{errorMsg}</p>
              <p className="text-xs text-slate-400">
                Your player progression is protected. The server refused to overwrite your save.
              </p>
              <button
                onClick={loadInitialData}
                disabled={isLoadingSave}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-lime-400 text-slate-950 hover:bg-lime-300 transition-colors shadow-lg shadow-lime-400/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoadingSave ? 'Retrying Connection...' : 'Retry Loading Lab'}
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-lime-400 border-t-transparent animate-spin" />
              <h2 className="font-fredoka text-xl font-bold">Initializing Schrödinger's Lab...</h2>
              <p className="text-xs text-slate-400 font-mono">Syncing Squeekchain verified telemetry</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-lime-400 selection:text-slate-950 ${
      activeTab === 'lab' ? 'pb-1.5 sm:pb-2' : 'pb-12'
    }`}>
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none">🐹</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-fredoka text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1">
                  Schrödinger's Hamster <span className="text-lime-400">⚡</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-lime-500/10 text-lime-400 border border-lime-500/30">
                  Lvl {player.labLevel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Squeekchain Verified
                </span>
                <span>•</span>
                <span className="text-lime-300">+1 E/min Passive</span>
              </div>
            </div>
          </div>

          {/* Player Live Resource Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Battery Energy */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold shadow-sm"
              title="Accumulator Battery Energy"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{Math.floor(player.batteryEnergy)} / {player.batteryCapacity} E</span>
            </div>

            {/* Research Insight */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold shadow-sm"
              title="Research Notes / Quantum Insight"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>{player.researchInsight} Notes</span>
            </div>

            {/* How to Play Guide Button */}
            <button
              onClick={() => {
                audio.playClick();
                setShowHowToPlay(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-white font-mono text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Open Laboratory Manual & Field Guide"
            >
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">How to Play</span>
            </button>

            {/* Save Backup & Account Recovery Button */}
            <button
              onClick={() => {
                audio.playClick();
                setShowBackupModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 font-mono text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Save Backup & Cryptographic Account Recovery"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Save Backup</span>
            </button>

            {/* Web3 Wallet Connection & SIWE Auth */}
            <WalletConnectButton onSessionChange={() => {
              // Re-fetch player state to load linked wallet save
              fetchPlayerState().then(setPlayer).catch(console.error);
            }} />

            {/* Sound Toggle */}
            <button
              onClick={() => {
                const muted = audio.toggleMute();
                setIsMuted(muted);
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-lime-400" />}
            </button>

            {/* Dev / Simulation Drawer Button */}
            <button
              onClick={() => {
                audio.playClick();
                setIsDevOpen(true);
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
              data-testid="btn-dev-tools"
              title="Developer Simulation Tools"
            >
              <Wrench className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-2 sm:px-4 pt-1.5 sm:pt-2 pb-2 space-y-2 sm:space-y-3">
        
        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Tab 1: Full-Width 16:9 Interactive Pixel-Art Laboratory with Compact Game HUD */}
        {activeTab === 'lab' && (
          <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-start justify-center gap-2.5 xl:gap-3.5">
            {/* MAIN AREA: Dynamic Objective Ribbon + Maximized 16:9 Laboratory Stage */}
            <div className="flex-1 min-w-0 flex flex-col items-center space-y-1.5 sm:space-y-2">
              {/* Dynamic Guided Objective Ribbon */}
              {(() => {
                const discoveredBaseCount = Object.keys(player.discoveredHamsters || {}).length;
                let currentObjective = 'Discover new quantum hamsters in the chamber';
                if (discoveredBaseCount < 3) {
                  currentObjective = `Discover 3 Base Species (${discoveredBaseCount}/3) to unlock Quantum Genetics`;
                } else if (player.labLevel < 2) {
                  currentObjective = 'Upgrade to Lab Level 2 in the Research Notebook';
                } else if (!player.unlockedResearch.includes('quantum_genetics')) {
                  currentObjective = 'Research Quantum Genetics to open the Incubator';
                } else if (!player.completedGrandParadox) {
                  currentObjective = 'Synthesize hybrids and prepare for the Grand Paradox finale';
                } else {
                  currentObjective = 'Grand Paradox Complete! Experiment and collect rare hybrids!';
                }

                return (
                  <div className="w-full px-3 py-1.5 rounded-xl bg-slate-900/60 border border-purple-500/20 flex items-center justify-between text-xs font-mono shadow-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-amber-400 shrink-0">🎯</span>
                      <span className="text-slate-400 text-[10px] sm:text-[11px] shrink-0">OBJECTIVE:</span>
                      <span className="font-bold text-white text-[11px] sm:text-xs truncate">{currentObjective}</span>
                    </div>
                    <span className="hidden sm:inline text-[10px] text-purple-300 shrink-0 font-bold ml-2">
                      Lvl {player.labLevel} Lab
                    </span>
                  </div>
                );
              })()}

              {/* The Main 16:9 Laboratory Stage with No-Scroll Viewport Clamping */}
              <div className="w-full flex justify-center">
                <div className="relative aspect-[16/9] w-auto h-auto max-w-[min(1280px,calc((100vh-160px)*16/9))] max-h-[calc(100vh-160px)] shadow-2xl rounded-2xl overflow-hidden mx-auto">
                  <LabEnvironment
                    player={player}
                    telemetry={telemetry}
                    onOpenExperiment={() => {
                      audio.playClick();
                      setChamberSubTab('experiments');
                      setActiveModal('chamber');
                    }}
                    onObserveExperiment={() => {
                      audio.playClick();
                      setChamberSubTab('experiments');
                      setActiveModal('chamber');
                    }}
                    onOpenBattery={() => {
                      audio.playClick();
                      handleSyncWork();
                      setActiveModal('battery');
                    }}
                    onOpenIncubator={() => {
                      audio.playClick();
                      if (isQuantumGeneticsUnlocked(player)) {
                        setActiveModal('incubator');
                      } else {
                        setActiveModal('incubator_locked');
                      }
                    }}
                    onOpenResearch={() => {
                      audio.playClick();
                      setActiveTab('research');
                    }}
                    onInspectAssistant={() => {
                      audio.playClick();
                      setActiveTab('collection');
                    }}
                    onSyncWork={handleSyncWork}
                    onOpenHowToPlay={() => setShowHowToPlay(true)}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COMPACT HUD: Game Navigation & Live Lab Status (No-Scroll Desktop HUD / Bottom Dock on Mobile) */}
            <aside
              className="w-full lg:w-[230px] xl:w-[250px] shrink-0 flex flex-col justify-between bg-slate-900/80 border border-purple-500/30 rounded-2xl p-2 sm:p-2.5 shadow-xl backdrop-blur-md space-y-2 font-mono select-none lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto scrollbar-none"
              data-testid="compact-game-hud"
            >
              {/* TOP SECTION: GAME NAVIGATION */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                    NAVIGATION
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">v1.0</span>
                </div>

                {/* 4 Primary Navigation Buttons */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 pt-0.5">
                  {/* 1. Laboratory */}
                  <button
                    onClick={() => {
                      audio.playClick();
                      setActiveTab('lab');
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-between ${
                      activeTab === 'lab'
                        ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className={`w-3.5 h-3.5 ${activeTab === 'lab' ? 'text-slate-950' : 'text-lime-400'}`} />
                      <span className="font-fredoka tracking-wide">Laboratory</span>
                    </div>
                    {activeTab === 'lab' && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </button>

                  {/* 2. Incubator */}
                  <button
                    onClick={() => {
                      audio.playClick();
                      if (isQuantumGeneticsUnlocked(player)) {
                        setActiveTab('incubator');
                      } else {
                        setActiveModal('incubator_locked');
                      }
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-between ${
                      (activeTab as string) === 'incubator'
                        ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Dna className={`w-3.5 h-3.5 ${(activeTab as string) === 'incubator' ? 'text-white' : 'text-pink-400'}`} />
                      <span className="font-fredoka tracking-wide">Incubator</span>
                    </div>
                    {isQuantumGeneticsUnlocked(player) ? (
                      player.activeIncubation ? (
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-800/60 font-mono">
                          {player.breedingCharges || 0}⚡
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Lv.2
                      </span>
                    )}
                  </button>

                  {/* 3. QuantumDex */}
                  <button
                    onClick={() => {
                      audio.playClick();
                      setActiveTab('collection');
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-between ${
                      (activeTab as string) === 'collection'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Award className={`w-3.5 h-3.5 ${(activeTab as string) === 'collection' ? 'text-white' : 'text-amber-400'}`} />
                      <span className="font-fredoka tracking-wide">QuantumDex</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {Object.keys(player.discoveredHamsters).length}/6
                    </span>
                  </button>

                  {/* 4. Research */}
                  <button
                    onClick={() => {
                      audio.playClick();
                      setActiveTab('research');
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-between ${
                      (activeTab as string) === 'research'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className={`w-3.5 h-3.5 ${(activeTab as string) === 'research' ? 'text-slate-950' : 'text-cyan-400'}`} />
                      <span className="font-fredoka tracking-wide">Research</span>
                    </div>
                    {player.researchInsight >= 15 && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </button>
                </div>

                {/* Compact Telemetry Observatory Link */}
                <a
                  href="/observatory.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 text-[10px] text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-lime-400" />
                    <span>Telemetry Observatory</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">↗</span>
                </a>
              </div>

              {/* BOTTOM SECTION: LAB STATUS */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between px-1 pb-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                    LAB STATUS
                  </span>
                  <span className="text-[9px] font-mono text-lime-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
                  {/* 1. Battery Energy */}
                  <button
                    onClick={() => {
                      audio.playClick();
                      setActiveModal('battery');
                    }}
                    className="w-full p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
                    title="Click to view Battery Storage & Squeekchain work"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-amber-400 group-hover:text-amber-300 font-semibold">
                        <Zap className="w-3 h-3" /> Battery Energy
                      </span>
                      <span className="text-[9px] text-slate-500">+1 E/m</span>
                    </div>
                    <div className="font-bold text-white text-xs mt-0.5 font-mono">
                      {Math.floor(player.batteryEnergy)} / {player.batteryCapacity} E
                    </div>
                  </button>

                  {/* 2. Quantum Chamber */}
                  <button
                    onClick={() => {
                      audio.playClick();
                      setChamberSubTab('experiments');
                      setActiveModal('chamber');
                    }}
                    className="w-full p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-purple-500/40 text-left transition-all group"
                    title="Click to view Quantum Chamber & Experiments"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-purple-400 group-hover:text-purple-300 font-semibold">
                        <Atom className="w-3 h-3" /> Quantum Chamber
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs mt-0.5 font-mono flex items-center gap-1.5">
                      <span className={player.activeExperiment && Date.now() >= player.activeExperiment.finishesAt ? 'text-lime-300' : ''}>
                        {player.activeExperiment
                          ? Date.now() >= player.activeExperiment.finishesAt
                            ? 'Ready to Observe!'
                            : 'Superposition...'
                          : 'Standby'}
                      </span>
                      {player.activeExperiment && Date.now() >= player.activeExperiment.finishesAt && (
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
                      )}
                    </div>
                  </button>

                  {/* 3. Incubator */}
                  <button
                    onClick={() => {
                      audio.playClick();
                      if (isQuantumGeneticsUnlocked(player)) {
                        setActiveModal('incubator');
                      } else {
                        setActiveModal('incubator_locked');
                      }
                    }}
                    className="w-full p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-pink-500/40 text-left transition-all group"
                    title="Click to view Quantum Incubator"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-pink-400 group-hover:text-pink-300 font-semibold">
                        <Dna className="w-3 h-3" /> Incubator
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs mt-0.5 font-mono">
                      {isQuantumGeneticsUnlocked(player)
                        ? player.activeIncubation
                          ? 'Breeding...'
                          : `${player.breedingCharges || 0}⚡ Charges`
                        : 'Locked (Lv. 2)'}
                    </div>
                  </button>

                  {/* 4. Sanctuary */}
                  <button
                    onClick={() => {
                      audio.playClick();
                      setActiveTab('collection');
                    }}
                    className="w-full p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                    title="Click to view QuantumDex"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 group-hover:text-emerald-300 font-semibold">
                        <Award className="w-3 h-3" /> Sanctuary
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs mt-0.5 font-mono">
                      {Object.keys(player.discoveredHamsters).length} / 6 Discovered
                    </div>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Tab 2: Dedicated Quantum Incubator View */}
        {(activeTab as string) === 'incubator' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Header Breadcrumb & Nav */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => {
                  audio.playClick();
                  setActiveTab('lab');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs shadow-md transition-colors"
              >
                <span>← Return to Laboratory</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('collection')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  QuantumDex
                </button>
                <button
                  onClick={() => setActiveTab('research')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Research
                </button>
                <button
                  onClick={() => {
                    audio.playClick();
                    setIsDevOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
                  data-testid="btn-dev-tools-incubator"
                  title="Open Developer Simulation Console"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Dev Tools</span>
                </button>
              </div>
            </div>

            {isQuantumGeneticsUnlocked(player) ? (
              <QuantumIncubator
                player={player}
                telemetry={telemetry}
                onStartIncubation={handleStartIncubation}
                onGhostSight={handleIncubationGhostSight}
                onRevealIncubation={handleRevealIncubation}
                onRenameHybrid={handleRenameHybrid}
                onSetLabDisplay={handleSetLabDisplayHybrid}
                onViewInDex={() => setActiveTab('collection')}
                isStarting={isStartingIncubation}
                onQuickDevAddCharge={() => handleDevAddBreedingCharges(1)}
                onOpenDevTools={() => setIsDevOpen(true)}
                onSynthesizeCharge={() => handleSynthesizeNotes('breeding_charge')}
                isSynthesizing={isSynthesizing}
              />
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-950/80 border border-purple-800 flex items-center justify-center text-3xl">
                  🔒
                </div>
                <h3 className="text-lg font-bold text-white">Quantum Incubator Locked</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Breeding procedural Quantum Hybrids requires reaching <strong>Lab Level 2</strong>, discovering at least <strong>3 Base Hamster species</strong>, and completing the <strong>Quantum Genetics</strong> research upgrade.
                </p>
                <button
                  onClick={() => setActiveTab('research')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                >
                  View Research Notebook
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Research Notebook */}
        {(activeTab as string) === 'research' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Header Breadcrumb & Nav */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => {
                  audio.playClick();
                  setActiveTab('lab');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs shadow-md transition-colors"
              >
                <span>← Return to Laboratory</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('incubator')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Incubator
                </button>
                <button
                  onClick={() => setActiveTab('collection')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  QuantumDex
                </button>
              </div>
            </div>

            <ResearchNotebook
              player={player}
              onUnlockUpgrade={handleUnlockUpgrade}
              isUnlocking={isUnlocking}
              onSynthesizeNotes={handleSynthesizeNotes}
              isSynthesizing={isSynthesizing}
            />
          </div>
        )}

        {/* Tab 4: QuantumDex Collection */}
        {(activeTab as string) === 'collection' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Header Breadcrumb & Nav */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => {
                  audio.playClick();
                  setActiveTab('lab');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs shadow-md transition-colors"
              >
                <span>← Return to Laboratory</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('incubator')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Incubator
                </button>
                <button
                  onClick={() => setActiveTab('research')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Research
                </button>
              </div>
            </div>

            <QuantumDex
              player={player}
              onAssignAssistant={handleAssignAssistantHamster}
              onRenameHamster={handleRenameHamster}
              onToggleFavorite={handleToggleFavorite}
              onRenameHybrid={handleRenameHybrid}
              onToggleFavoriteHybrid={handleToggleFavoriteHybrid}
              onReleaseHybrid={handleReleaseHybrid}
              onSetLabDisplayHybrid={handleSetLabDisplayHybrid}
              onNftMintSuccess={(updatedHybrid) => {
                setPlayer(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    hybrids: (prev.hybrids || []).map(h => h.id === updatedHybrid.id ? updatedHybrid : h)
                  };
                });
              }}
              isAssigning={isAssigning}
            />
          </div>
        )}
      </main>

      {/* Dev Simulation Drawer */}
      <DevSimDrawer
        isOpen={isDevOpen}
        onClose={() => setIsDevOpen(false)}
        player={player}
        telemetry={telemetry}
        onSimulateWork={handleSimulateWork}
        onResetLab={handleResetLab}
        onOpenAnimationGallery={() => {
          setIsDevOpen(false);
          setShowAnimationGallery(true);
        }}
        onSetBatteryPercentage={handleDevSetBatteryPercentage}
        onSetBatteryCapacity={handleDevSetBatteryCapacity}
        onSetActivityRpm={handleDevSetActivityRpm}
        onSetBreedingCharges={handleDevSetBreedingCharges}
        onAddBreedingCharges={handleDevAddBreedingCharges}
      />

      {/* Squeektoshi Animation Prototype & Comparison Preview */}
      {showAnimationGallery && (
        <SqueektoshiAnimationPreview
          onClose={() => setShowAnimationGallery(false)}
          telemetryRpm={telemetry?.rpm || 0}
        />
      )}

      {/* 30-Hybrid Procedural Preview Gallery */}
      {showPreviewGallery && (
        <HybridPreviewGallery onClose={() => setShowPreviewGallery(false)} />
      )}

      {/* Phase 3.A: Research Unlock Celebration Toast */}
      {recentResearchUnlock && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none select-none">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950/95 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center gap-3 backdrop-blur-md">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Sparkles className="w-5 h-5 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-400">
                ★ RESEARCH COMPLETE! ★
              </div>
              <div className="text-xs font-bold text-white font-fredoka">
                {recentResearchUnlock.name}
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                {recentResearchUnlock.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3.B: Quantum Genetics Unlock Celebration Modal */}
      {showGeneticsCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-[0_0_20px_#c084fc]">
              🧬
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-purple-950 text-purple-300 border border-purple-700">
                ★ MAJOR BREAKTHROUGH ★
              </div>
              <h3 className="text-xl font-bold font-fredoka text-white mt-2">
                QUANTUM GENETICS UNLOCKED!
              </h3>
              <p className="text-xs text-purple-300 font-mono italic mt-1">
                "Two possibilities. One reality. Infinite adorable consequences."
              </p>
              <p className="text-xs text-slate-300 mt-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-left leading-relaxed">
                The <strong>Quantum Incubator</strong> is now operational in your laboratory. You can now cross-breed two Base Hamsters to synthesize unique, procedurally generated Quantum Hybrids!
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-400 text-left bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-lime-400 font-bold">
                <Check className="w-4 h-4" /> Dual-State Superposition Incubation
              </div>
              <div className="flex items-center gap-2 text-lime-400 font-bold">
                <Check className="w-4 h-4" /> Free Live Breeding while Squeektoshi Runs
              </div>
              <div className="flex items-center gap-2 text-lime-400 font-bold">
                <Check className="w-4 h-4" /> Procedural Pixel-Art Traits & Mutations
              </div>
            </div>

            <button
              onClick={() => {
                audio.playClick();
                setShowGeneticsCelebration(false);
                setActiveModal('incubator');
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold font-fredoka text-sm transition-all shadow-lg active:scale-95"
            >
              OPEN INCUBATOR
            </button>
          </div>
        </div>
      )}

      {/* Phase 4: Quantum Fate Incident Announcement Modal */}
      {activeFateIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-purple-500/60 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl shadow-lg ${
              activeFateIncident.type === 'deceased'
                ? 'bg-rose-950/80 border-2 border-rose-600 text-rose-400'
                : activeFateIncident.type === 'impossible_return'
                ? 'bg-amber-950/80 border-2 border-amber-400 text-amber-300 anim-legendary-gleam'
                : activeFateIncident.type === 'disappeared'
                ? 'bg-cyan-950/80 border-2 border-cyan-500 text-cyan-300 anim-missing-glitch'
                : 'bg-purple-950/80 border-2 border-purple-500 text-purple-300'
            }`}>
              {activeFateIncident.type === 'deceased' ? '💀' :
               activeFateIncident.type === 'impossible_return' ? '🌟' :
               activeFateIncident.type === 'disappeared' ? '🌀' :
               activeFateIncident.type === 'returned_changed' ? '✨' : '⚛️'}
            </div>

            <div>
              {/* Distinctive Header based on Fate Type */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase mb-1">
                {activeFateIncident.type === 'disappeared' ? (
                  <span className="text-cyan-300 bg-cyan-950/80 border border-cyan-500/80 px-2.5 py-0.5 rounded-full">
                    STATUS: UNOBSERVED
                  </span>
                ) : activeFateIncident.type === 'deceased' ? (
                  <span className="text-rose-300 bg-rose-950/80 border border-rose-500/80 px-2.5 py-0.5 rounded-full">
                    QUANTUM SIGNAL TERMINATED
                  </span>
                ) : activeFateIncident.type === 'impossible_return' ? (
                  <span className="text-amber-300 bg-amber-950/80 border border-amber-500/80 px-2.5 py-0.5 rounded-full">
                    ★ IMPOSSIBLE EVENT DETECTED ★
                  </span>
                ) : (
                  <span className="text-purple-300 bg-purple-950/80 border border-purple-500/80 px-2.5 py-0.5 rounded-full">
                    FAMILIAR SIGNAL DETECTED
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold font-fredoka text-white mt-1">
                {activeFateIncident.type === 'disappeared'
                  ? 'QUANTUM ANOMALY DETECTED'
                  : activeFateIncident.type === 'deceased'
                  ? 'QUANTUM SIGNAL TERMINATED'
                  : activeFateIncident.type === 'impossible_return'
                  ? 'IMPOSSIBLE EVENT DETECTED'
                  : 'FAMILIAR SIGNAL DETECTED'}
              </h3>

              <p className="text-xs text-slate-300 mt-2 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed font-sans text-left">
                {activeFateIncident.description}
              </p>

              {activeFateIncident.metadata?.traitAdded && (
                <div className="mt-2 text-xs font-mono text-purple-300 bg-purple-950/60 p-2 rounded-lg border border-purple-800 text-left">
                  + Observed Trait: {activeFateIncident.metadata.traitAdded}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {activeFateIncident.type === 'deceased' && (
                <button
                  onClick={async () => {
                    audio.playClick();
                    setActiveFateIncident(null);
                    await dismissFateIncidentsApi().catch(() => {});
                    setActiveTab('collection');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40 font-bold text-xs transition-colors"
                >
                  View Memorial Archive
                </button>
              )}
              <button
                onClick={async () => {
                  audio.playClick();
                  setActiveFateIncident(null);
                  await dismissFateIncidentsApi().catch(() => {});
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
              >
                Acknowledge Incident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Play Manual Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* Save Backup & Account Recovery Modal */}
      <BackupRecoveryModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        player={player}
        onRestoreSuccess={(restored) => {
          setPlayer(restored);
          if (!sessionStorage.getItem('squeek_session_token')) {
            localStorage.setItem('hamster_guest_player_id', restored.id);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* CONTEXTUAL MODAL 1: SCHRÖDINGER'S QUANTUM CHAMBER                        */}
      {/* ========================================================================= */}
      {activeModal === 'chamber' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              audio.playClick();
              setActiveModal(null);
            }
          }}
        >
          <div className="bg-[#0e0a1f] border-2 border-purple-500/40 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.25)] relative text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-purple-900/40 bg-[#120b29]/90 shrink-0">
              <div className="flex items-center gap-3">
                {/* Glowing bell jar with pixel hamster */}
                <div className="w-12 h-12 rounded-2xl bg-purple-950/70 border border-purple-500/50 p-1 flex items-center justify-center relative shadow-[0_0_15px_rgba(168,85,247,0.35)] shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-400/20 via-transparent to-purple-950/50 pointer-events-none" />
                  <div className="scale-75 transform">
                    <PixelHamster speciesId="normal" size="sm" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg font-sans tracking-tight">Schrödinger Chamber</h3>
                  <p className="text-xs text-slate-400 font-sans">Quantum state observation & wavefunction collapse</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Grand Paradox Tab Switcher */}
                <button
                  onClick={() => {
                    audio.playClick();
                    setChamberSubTab(chamberSubTab === 'experiments' ? 'paradox' : 'experiments');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                    chamberSubTab === 'paradox'
                      ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/40'
                      : 'bg-purple-950/60 border-purple-500/40 text-purple-200 hover:text-white hover:bg-purple-900/60'
                  }`}
                  title="Toggle Grand Paradox finale"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>Grand Paradox</span>
                </button>

                <button
                  onClick={() => {
                    audio.playClick();
                    setActiveModal(null);
                  }}
                  className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Close (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto">
              {chamberSubTab === 'paradox' ? (
                <GrandParadoxPanel
                  player={player}
                  onTriggerGrandParadox={() => handleStartExperiment('grand', 'stable')}
                  isStarting={isStartingExp}
                  onContinue={() => setActiveModal(null)}
                />
              ) : (
                <ExperimentStation
                  player={player}
                  telemetry={telemetry}
                  onStartExperiment={handleStartExperiment}
                  onRevealExperiment={handleRevealExperiment}
                  onGhostSight={handleGhostSight}
                  onRenameHamster={handleRenameHamster}
                  onAssignAssistant={handleAssignAssistantHamster}
                  onViewInDex={() => {
                    setActiveModal(null);
                    setActiveTab('collection');
                  }}
                  isStarting={isStartingExp}
                  hideHeader={true}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTEXTUAL MODAL 2: KINETIC GENERATOR & ACCUMULATOR BATTERY              */}
      {/* ========================================================================= */}
      {activeModal === 'battery' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              audio.playClick();
              setActiveModal(null);
            }
          }}
        >
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-sans">Accumulator & Kinetic Generator</h3>
                  <p className="text-xs text-slate-400">Zero-decay energy storage & Squeekchain work ledger</p>
                </div>
              </div>

              <button
                onClick={() => {
                  audio.playClick();
                  setActiveModal(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto">
              <BatteryConduit
                player={player}
                telemetry={telemetry}
                isSyncing={isSyncing}
                onSyncWork={handleSyncWork}
                lastSqueekBonus={lastSqueekBonus}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTEXTUAL MODAL 3: QUANTUM INCUBATOR & BREEDING BAY                     */}
      {/* ========================================================================= */}
      {activeModal === 'incubator' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              audio.playClick();
              setActiveModal(null);
            }
          }}
        >
          <div className="bg-slate-900 border-2 border-pink-500/50 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
                  <Dna className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-sans">Quantum Incubator & Synthesis Bay</h3>
                  <p className="text-xs text-slate-400">Entangle two Base Hamsters to synthesize procedural quantum hybrids</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    audio.playClick();
                    setActiveModal(null);
                    setActiveTab('incubator');
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
                  title="Expand to Full Tab"
                >
                  <span>Fullscreen ↗</span>
                </button>
                <button
                  onClick={() => {
                    audio.playClick();
                    setActiveModal(null);
                  }}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Close (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto">
              <QuantumIncubator
                player={player}
                telemetry={telemetry}
                onStartIncubation={handleStartIncubation}
                onGhostSight={handleIncubationGhostSight}
                onRevealIncubation={handleRevealIncubation}
                onRenameHybrid={handleRenameHybrid}
                onSetLabDisplay={handleSetLabDisplayHybrid}
                onViewInDex={() => {
                  setActiveModal(null);
                  setActiveTab('collection');
                }}
                isStarting={isStartingIncubation}
                onQuickDevAddCharge={() => handleDevAddBreedingCharges(1)}
                onOpenDevTools={() => setIsDevOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTEXTUAL MODAL 4: QUANTUM INCUBATOR OFFLINE (LOCKDOWN EXPLANATION)    */}
      {/* ========================================================================= */}
      {activeModal === 'incubator_locked' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              audio.playClick();
              setActiveModal(null);
            }
          }}
        >
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                  🔒
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-sans">Incubator Offline</h3>
                  <p className="text-xs text-slate-400">Security Lockdown in effect</p>
                </div>
              </div>
              <button
                onClick={() => {
                  audio.playClick();
                  setActiveModal(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The Quantum Incubator entangles two Base Hamsters to synthesize procedural quantum hybrids. Complete these 3 milestones to unlock the synthesis chamber:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  Object.keys(player.discoveredHamsters).length >= 3
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}
              >
                <span>1. Discover 3 Base Species</span>
                <span className="font-bold">{Object.keys(player.discoveredHamsters).length} / 3</span>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  player.labLevel >= 2
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}
              >
                <span>2. Lab Level 2 (Research Lab)</span>
                <span className="font-bold">Lv. {player.labLevel}</span>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  player.unlockedResearch.includes('quantum_genetics')
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}
              >
                <span>3. Quantum Genetics Protocol</span>
                <span className="font-bold">
                  {player.unlockedResearch.includes('quantum_genetics') ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  audio.playClick();
                  setActiveModal(null);
                  setActiveTab('research');
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-sans transition-colors"
              >
                Open Research Notebook ↗
              </button>
              <button
                onClick={() => {
                  audio.playClick();
                  setActiveModal(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-sans transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
