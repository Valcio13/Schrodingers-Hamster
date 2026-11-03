import React, { useState } from 'react';
import {
  HelpCircle,
  Zap,
  Atom,
  Dna,
  BookOpen,
  Sparkles,
  Heart,
  Keyboard,
  X,
  ChevronRight,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gauge
} from 'lucide-react';
import { audio } from '../services/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTab = 'quickstart' | 'stations' | 'quantum' | 'genetics' | 'controls';

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('quickstart');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          audio.playClick();
          onClose();
        }
      }}
    >
      <div className="bg-slate-900 border-2 border-purple-500/50 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative text-left">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-sans flex items-center gap-2">
                Schrödinger's Lab Manual <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono border border-purple-800/60">Field Guide</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">Official guide to quantum mechanics, power conduits, and genetics</p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Manual (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guide Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/50 overflow-x-auto scrollbar-none shrink-0 text-xs font-mono">
          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('quickstart');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quickstart'
                ? 'bg-lime-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Start</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('stations');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stations'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Lab Apparatus</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('quantum');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quantum'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Superposition</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('genetics');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'genetics'
                ? 'bg-cyan-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Genetics & Hybrids</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('controls');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'controls'
                ? 'bg-pink-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Controls & Secrets</span>
          </button>
        </div>

        {/* Tab Content Area (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-200 text-sm leading-relaxed">
          
          {/* TAB 1: QUICK START */}
          {activeTab === 'quickstart' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1 font-fredoka">The Quantum Hamster Loop</h4>
                  <p className="text-xs text-slate-300">
                    Welcome to Schrödinger's Laboratory! Your goal is to unlock the secrets of quantum superposition, collect extraordinary hamster species, breed procedural hybrids, and solve the Grand Paradox.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300">1</span>
                    <span>Generate Energy (E)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Your kinetic dynamo accumulates <strong className="text-amber-300">+1 E/min passive power</strong>, or charges dynamically when Squeektoshi sprints on the wheel.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">2</span>
                    <span>Conduct Chamber Experiments</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Spend Energy to seal a hamster into the Quantum Chamber. Superposition begins. Click <strong className="text-lime-400">OBSERVE</strong> when ready to collapse reality!
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300">3</span>
                    <span>Research Lab Upgrades</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Earn <strong>Research Notes</strong> from experiments. Open the Research Notebook on the desk to upgrade to <strong>Lab Level 2</strong> and unlock the Bio-Incubator.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-pink-400 font-mono text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-300">4</span>
                    <span>Breed Hybrids & Solve Paradox</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Combine base species in the incubator to hatch legendary procedural hybrids. Complete all research milestones to conduct <strong>The Grand Paradox (Final Quantum Experiment)</strong>!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-lime-950/30 border border-lime-500/30 flex items-center gap-3">
                <span className="text-xl">💡</span>
                <p className="text-xs text-lime-200">
                  <strong>Pro-Tip:</strong> You don't have to navigate through menus! Simply <strong>click directly on any apparatus</strong> inside the interactive pixel-art laboratory.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: LAB APPARATUS */}
          {activeTab === 'stations' && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/40 flex items-start gap-3">
                <span className="text-2xl mt-0.5">⚡</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-300 text-sm font-mono flex items-center gap-2">
                    1. Kinetic Dynamo & Wheel (Left Station)
                  </h4>
                  <p className="text-xs text-slate-300">
                    Driven by Squeektoshi the hamster. The analog gauge indicates current accumulator battery capacity (Green = Full, Red = Empty). Click to inspect battery levels, sync verified telemetry, or claim accumulated energy.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/40 flex items-start gap-3">
                <span className="text-2xl mt-0.5">⚛️</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-purple-300 text-sm font-mono flex items-center gap-2">
                    2. Schrödinger's Quantum Chamber (Center Vault)
                  </h4>
                  <p className="text-xs text-slate-300">
                    The heart of quantum observation. Features a hypnotic swirling vortex porthole. When an experiment is sealed, the porthole warps space-time. When the wavefunction stabilizes, an illuminated <strong>OBSERVE</strong> button glows. Click to observe and collapse reality!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/40 flex items-start gap-3">
                <span className="text-2xl mt-0.5">🧬</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-cyan-300 text-sm font-mono flex items-center gap-2">
                    3. Quantum Incubator (Right Glass Cylinder)
                  </h4>
                  <p className="text-xs text-slate-300">
                    Contains glowing bioluminescent fluid, floating DNA helices, and rising bubbles. Unlocks once you reach <strong>Lab Level 2</strong> and research <strong>Quantum Genetics</strong>. Click to pair parent hamsters and incubate procedural hybrid eggs!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-blue-500/40 flex items-start gap-3">
                <span className="text-2xl mt-0.5">📓</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-blue-300 text-sm font-mono flex items-center gap-2">
                    4. Research Desk (Foreground Table)
                  </h4>
                  <p className="text-xs text-slate-300">
                    Equipped with a green phosphor CRT oscilloscope, a flickering Bunsen burner flame, and chemical flasks. Click the desk or notebook to spend Research Notes on laboratory technology upgrades.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-pink-500/40 flex items-start gap-3">
                <span className="text-2xl mt-0.5">🐹</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-pink-300 text-sm font-mono flex items-center gap-2">
                    5. Scientist Companion (Purple Velvet Cushion)
                  </h4>
                  <p className="text-xs text-slate-300">
                    Your active laboratory assistant sits here wearing a lab coat. Click them anytime to <strong>pet them</strong>—they'll happily squish-bounce, squeak, and share thoughts! Use the thought bubble's button to inspect them in the QuantumDex.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUANTUM SUPERPOSITION */}
          {activeTab === 'quantum' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <h4 className="font-bold text-white text-xs font-mono mb-1 text-purple-300">Dual-State Superposition & Ghost Sight</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  During an active experiment or incubation, reality splits into <strong>two predetermined possible outcomes (State A & State B)</strong>. They exist simultaneously until you choose which branch to collapse and observe. Spend 2 Energy on <strong>Ghost Sight</strong> to preview one state's traits before deciding!
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-300 text-xs font-mono">🌟 New Species Discovery:</span>
                    <p className="text-xs text-slate-300">Reveals an unobserved Base Hamster species with a quantum silhouette reveal, recording it into your QuantumDex.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/40 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-cyan-300 text-xs font-mono">⚡ New Companion Acquired:</span>
                    <p className="text-xs text-slate-300">Acquiring duplicate species preserves individual names, personalities, and discovery histories without replacing existing records.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 text-xs font-mono">🌀 Quantum Disappearance & Return:</span>
                    <p className="text-xs text-slate-300">Hamsters may temporarily phase into an unobserved state. They can return unexpectedly with cosmetic quirks intact.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/40 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-300 text-xs font-mono">🛡️ Quantum Fate Protections:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong>Base Species</strong> are permanently safe from death. <strong>Favorite Hamsters (★)</strong> are 100% immune to disappearance and death. <strong>Legendary & Mythic</strong> specimens are protected against permanent decoherence. Deceased specimens remain honored in the Memorial Archive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GENETICS & BREEDING */}
          {activeTab === 'genetics' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <h4 className="font-bold text-white text-xs font-mono mb-1 text-cyan-300">Procedural Quantum Hybridization</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Synthesize unique procedural hybrid hamsters from discovered Base Species. Every hybrid features procedural palettes, eye markings, ear mutations, accessories, and quantum rarities from <strong>Common to Mythic</strong>!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="font-bold text-pink-300 font-mono">1. Unlock Milestone</span>
                  <p className="text-slate-300">
                    Reach <strong>Lab Level 2</strong> and research <strong>Quantum Genetics</strong> in the Research Notebook. Discover at least 3 Base Species to activate the Incubator.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="font-bold text-cyan-300 font-mono">2. Breeding Charges & Live Sprints</span>
                  <p className="text-slate-300">
                    Breeding consumes <strong>1 Breeding Charge</strong> (max 3, generated every 40 work units). <em>Bonus:</em> Live breeding while Squeektoshi is running on the wheel is completely free if the 15s cooldown has elapsed!
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-300 font-mono">3. Dual-State Superposition</span>
                  <p className="text-slate-300">
                    The incubator synthesizes two parallel potential offspring (State A & State B). Use <strong>Ghost Sight</strong> to inspect genome traits before choosing which reality to collapse.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="font-bold text-lime-300 font-mono">4. Hatching & Rarity Tiers</span>
                  <p className="text-slate-300">
                    Watch the egg wobble, crack, and collapse into reality! Common & Uncommon sparkle gently, while Legendary & Mythic radiate majestic cosmic flares.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONTROLS & SECRETS */}
          {activeTab === 'controls' && (
            <div className="space-y-3.5 animate-fade-in">
              <h4 className="font-bold text-white text-xs font-mono text-purple-300">Interactive Controls & Hotkeys</h4>
              
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-300">Close open modal / Dialog</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold shadow-sm">ESC</kbd>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-300">Pet Hamster on Velvet Cushion</span>
                  <span className="px-2 py-0.5 rounded bg-pink-950/60 border border-pink-700/60 text-pink-300 font-bold">Left Click</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-300">Open Kinetic Dynamo & Battery</span>
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/60 text-amber-300 font-bold">Click Left Apparatus</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-300">Open Quantum Chamber / Observe</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-700/60 text-purple-300 font-bold">Click Center Vault</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-300">Open Quantum Incubator / Hatch</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 font-bold">Click Right Tube</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-300">Toggle Synthesized Audio</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-lime-400 font-bold">Speaker Icon in Header</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-2 text-xs text-purple-200">
                <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>The ultimate research goal is The Grand Paradox: a final scientific experiment to observe the legendary Paradox Hamster. Post-completion research and breeding continue uninterrupted!</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0 text-xs font-mono">
          <span className="text-slate-500 text-[11px]">Schrödinger's Hamster • Quantum Lab v1.0</span>
          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <span>Got it, Scientist!</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
