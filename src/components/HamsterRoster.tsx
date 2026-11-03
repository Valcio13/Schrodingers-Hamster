import React from 'react';
import { PlayerState, HAMSTER_SPECIES, HamsterSpecies } from '../types/game';
import { PixelHamster } from './PixelHamster';
import { Award, UserCheck, Lock, Sparkles } from 'lucide-react';
import { audio } from '../services/audio';

interface HamsterRosterProps {
  player: PlayerState;
  onAssignAssistant: (speciesId: string) => Promise<void>;
  isAssigning: boolean;
}

export const HamsterRoster: React.FC<HamsterRosterProps> = ({
  player,
  onAssignAssistant,
  isAssigning
}) => {
  const speciesList = Object.values(HAMSTER_SPECIES);
  const discoveredCount = Object.keys(player.discoveredHamsters).length;

  const rarityBadges = {
    common: 'bg-slate-800 text-slate-300 border-slate-700',
    uncommon: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    rare: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80',
    epic: 'bg-purple-950/70 text-purple-300 border-purple-800/80',
    legendary: 'bg-lime-950/70 text-lime-300 border-lime-800/80'
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base font-sans">Hamster Menagerie</h3>
            <p className="text-xs text-slate-400">Quantum specimens discovered across experiments</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
          <span className="text-slate-400">Collection:</span>
          <span className="font-bold text-lime-400">{discoveredCount} / {speciesList.length}</span>
        </div>
      </div>

      {/* 6 Species Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {speciesList.map((species) => {
          const discoveryInfo = player.discoveredHamsters[species.id];
          const isDiscovered = !!discoveryInfo;
          const isCurrentAssistant = player.activeAssistant === species.id;

          return (
            <div
              key={species.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                isCurrentAssistant
                  ? 'bg-slate-900 border-lime-500/70 shadow-lg shadow-lime-500/5'
                  : isDiscovered
                  ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              {isCurrentAssistant && (
                <div className="absolute top-0 right-0 bg-lime-400 text-slate-950 text-[10px] font-bold px-3 py-0.5 rounded-bl-lg flex items-center gap-1 font-mono">
                  <UserCheck className="w-3 h-3" /> ACTIVE ASSISTANT
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 relative">
                    {isDiscovered ? (
                      <PixelHamster speciesId={species.id} size="md" />
                    ) : (
                      <div className="text-2xl opacity-30 select-none">❓</div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${rarityBadges[species.rarity]}`}>
                        {species.rarity}
                      </span>
                      {isDiscovered && discoveryInfo.count > 1 && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          x{discoveryInfo.count}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {isDiscovered ? species.name : 'Unknown Quantum Entity'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {isDiscovered ? species.title : 'Not yet observed in chamber'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {isDiscovered ? species.description : 'Conduct experiments in the quantum chamber to collapse this unknown wavefunction into reality.'}
                </p>

                {/* Assistant Perk */}
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] mb-3">
                  <span className="font-bold text-cyan-300 block mb-0.5">Assistant Perk:</span>
                  <span className="text-slate-300">
                    {isDiscovered ? species.assistantPerk : '??? (Discover species to reveal)'}
                  </span>
                </div>
              </div>

              {/* Assignment Controls */}
              {isDiscovered ? (
                <button
                  onClick={() => {
                    audio.playClick();
                    onAssignAssistant(species.id);
                  }}
                  disabled={isCurrentAssistant || isAssigning}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isCurrentAssistant
                      ? 'bg-slate-800 text-lime-400 border border-lime-500/40 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-white border border-slate-700'
                  }`}
                >
                  {isCurrentAssistant ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>On Active Lab Duty</span>
                    </>
                  ) : (
                    <span>Assign as Active Assistant</span>
                  )}
                </button>
              ) : (
                <div className="w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-500 text-center font-mono flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" /> Undiscovered
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
