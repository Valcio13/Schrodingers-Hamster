import React, { useState } from 'react';
import { PlayerState } from '../types/game';
import { SqueekTelemetry } from '../../worker/squeekchain';
import { Wrench, Terminal, RotateCcw, Zap, ExternalLink, X } from 'lucide-react';
import { audio } from '../services/audio';

interface DevSimDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState;
  telemetry: SqueekTelemetry | null;
  onSimulateWork: (units: number) => Promise<void>;
  onResetLab: () => Promise<void>;
  onOpenAnimationGallery?: () => void;
  onSetBatteryPercentage?: (pct: number) => void;
  onSetBatteryCapacity?: (cap: number) => void;
  onSetActivityRpm?: (rpm: number) => void;
}

export const DevSimDrawer: React.FC<DevSimDrawerProps> = ({
  isOpen,
  onClose,
  player,
  telemetry,
  onSimulateWork,
  onResetLab,
  onOpenAnimationGallery,
  onSetBatteryPercentage,
  onSetBatteryCapacity,
  onSetActivityRpm
}) => {
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center gap-1.5 border border-amber-500/40">
              <Terminal className="w-3.5 h-3.5" /> DEV / SIMULATION CONSOLE
            </span>
          </div>

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
          <strong>Notice:</strong> This simulation tool allows validating the game loop even if Squeektoshi is currently resting or if the live wheel API is unreachable.
        </div>

        {/* Telemetry Diagnostics */}
        <div className="space-y-2 text-xs font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-slate-400 uppercase font-bold text-[10px] mb-1">Live Squeekchain Telemetry</div>
          <div className="flex justify-between text-slate-300">
            <span>Wheel RPM:</span>
            <span className="text-lime-400 font-bold">{telemetry?.rpm.toFixed(1) || '0.0'} RPM</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Hardware Driver:</span>
            <span className="text-cyan-400">{telemetry?.provenance || 'RP2040'}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Settled Core Work:</span>
            <span className="text-white font-bold">{telemetry?.settledCumulativeWork || player.lastCreditedWork} units</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Activity Classification:</span>
            <span className="text-purple-300">{telemetry?.patternDescription || 'Resting'}</span>
          </div>
        </div>

        {/* Simulation Action Buttons */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300">Simulate Hamster Activity (Dev Mode):</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                audio.playZap();
                setIsSimulating(true);
                await onSimulateWork(1000); // 1000 units = 10 Battery Energy
                setIsSimulating(false);
              }}
              disabled={isSimulating}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Jog (+10 E)</span>
            </button>

            <button
              onClick={async () => {
                audio.playZap();
                setIsSimulating(true);
                await onSimulateWork(3000); // 3000 units = 30 Battery Energy
                setIsSimulating(false);
              }}
              disabled={isSimulating}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-lime-400" />
              <span>Simulate Sprint (+30 E)</span>
            </button>
          </div>
        </div>

        {/* Hamster Sprint & Wheel Activity Test (Rest 0 RPM, Jog 28 RPM, Sprint 85 RPM) */}
        {onSetActivityRpm && (
          <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-lime-400" /> Kinetic Wheel & Sprint Test:
              </span>
              <span className="text-[11px] font-mono text-lime-400 font-bold">
                {telemetry?.rpm.toFixed(1) || '0.0'} RPM
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              {[
                { label: 'Rest (0 RPM)', rpm: 0 },
                { label: 'Jog (28 RPM)', rpm: 28.5 },
                { label: 'Sprint (85 RPM)', rpm: 85.0 }
              ].map(item => (
                <button
                  key={item.rpm}
                  data-testid={`btn-activity-test-${item.rpm}`}
                  onClick={() => {
                    audio.playClick();
                    onSetActivityRpm(item.rpm);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-center font-bold transition-colors border ${
                    (telemetry?.rpm || 0) === item.rpm || (item.rpm > 0 && Math.abs((telemetry?.rpm || 0) - item.rpm) < 5)
                      ? 'bg-lime-500/20 text-lime-300 border-lime-400/80 shadow-[0_0_8px_rgba(163,230,53,0.3)]'
                      : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border-slate-700 hover:border-lime-400/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Analog Battery Gauge Test States (0%, 25%, 50%, 75%, 100%) */}
        {onSetBatteryPercentage && (
          <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Analog Gauge Visual Test:
              </span>
              <span className="text-[11px] font-mono text-lime-400 font-bold">
                {Math.round((player.batteryEnergy / (player.batteryCapacity || 1)) * 100)}% ({player.batteryEnergy}/{player.batteryCapacity} E)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
              {[0, 25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  data-testid={`btn-battery-test-${pct}`}
                  onClick={() => {
                    audio.playClick();
                    onSetBatteryPercentage(pct);
                  }}
                  className="py-1.5 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 hover:border-amber-400/50 text-center font-bold transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Test Capacities: 150, 300, 600 E */}
            {onSetBatteryCapacity && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Battery Capacity:</span>
                <div className="flex gap-1.5">
                  {[150, 300, 600].map(cap => (
                    <button
                      key={cap}
                      data-testid={`btn-capacity-test-${cap}`}
                      onClick={() => {
                        audio.playClick();
                        onSetBatteryCapacity(cap);
                      }}
                      className={`px-2 py-0.5 rounded border transition-colors ${
                        player.batteryCapacity === cap
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {cap}E
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Animation Preview Gallery Launcher */}
        {onOpenAnimationGallery && (
          <div className="pt-2">
            <button
              onClick={() => {
                audio.playClick();
                onOpenAnimationGallery();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/50 text-xs font-mono font-bold text-purple-200 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span>🎞️ Squeektoshi Animation Prototype & Comparison</span>
            </button>
          </div>
        )}

        {/* Reset Lab Profile */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={async () => {
              if (confirm('Reset your laboratory back to Level 1 and starter state?')) {
                audio.playClick();
                await onResetLab();
                onClose();
              }
            }}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Laboratory Save</span>
          </button>

          <a
            href="https://docs.squeekchain.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>Squeekchain Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
