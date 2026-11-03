import React from 'react';
import { PlayerState } from '../types/game';
import { SqueekTelemetry } from '../../worker/squeekchain';
import { BatteryCharging, RefreshCw, ChevronDown, Sparkles, Activity } from 'lucide-react';
import { audio } from '../services/audio';

interface BatteryConduitProps {
  player: PlayerState;
  telemetry: SqueekTelemetry | null;
  isSyncing: boolean;
  onSyncWork: () => void;
  lastSqueekBonus: number | null;
}

export const BatteryConduit: React.FC<BatteryConduitProps> = ({
  player,
  telemetry,
  isSyncing,
  onSyncWork,
  lastSqueekBonus
}) => {
  const percent = Math.min(100, Math.round((player.batteryEnergy / player.batteryCapacity) * 100));
  const settledWork = telemetry?.settledCumulativeWork || player.lastCreditedWork;
  const uncreditedWork = Math.max(0, settledWork - player.lastCreditedWork);

  // Derive clear hamster telemetry state
  let squeekStateText = 'Data Unavailable';
  let squeekStateColor = 'text-slate-400';
  let squeekBg = 'bg-slate-800/80 border-slate-700';

  if (!telemetry || telemetry.freshness === 'stale') {
    squeekStateText = 'Data Unavailable';
    squeekStateColor = 'text-amber-400';
    squeekBg = 'bg-amber-950/40 border-amber-800/60';
  } else if (telemetry.rpm > 0) {
    squeekStateText = `Running (${telemetry.rpm.toFixed(1)} RPM)`;
    squeekStateColor = 'text-lime-400';
    squeekBg = 'bg-lime-950/40 border-lime-800/60';
  } else {
    squeekStateText = 'Resting in Nest';
    squeekStateColor = 'text-slate-300';
    squeekBg = 'bg-slate-800/80 border-slate-700';
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Battery Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base font-sans">Accumulator Battery</h3>
            <p className="text-xs text-slate-400">Zero-decay quantum energy storage</p>
          </div>
        </div>

        <button
          onClick={() => {
            audio.playClick();
            onSyncWork();
          }}
          disabled={isSyncing}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
          title="Sync with Squeekchain"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>
      </div>

      {/* Primary Battery Status: Prioritizing Clean Essentials */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between font-mono">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-fredoka text-amber-400">
              🔋 {Math.floor(player.batteryEnergy)}
            </span>
            <span className="text-xs text-slate-400 font-sans">/ {player.batteryCapacity} Energy</span>
          </div>
          <span className="text-sm font-semibold text-slate-300 font-sans">{percent}%</span>
        </div>

        {/* Battery Container Bar */}
        <div className="w-full h-5 rounded-full bg-slate-950 border border-slate-700 p-0.5 overflow-hidden relative shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-lime-400 to-emerald-400 transition-all duration-500 shadow-sm"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Key Real-Time Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Passive Charging */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Passive Regen</div>
                <div className="text-xs font-mono font-bold text-lime-400">+1 Energy / min</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-bold">
              Active
            </span>
          </div>

          {/* Squeektoshi Live State */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${squeekBg}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm">🐹</span>
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Squeektoshi</div>
                <div className={`text-xs font-mono font-bold ${squeekStateColor}`}>
                  {squeekStateText}
                </div>
              </div>
            </div>
            {telemetry?.rpm && telemetry.rpm > 0 ? (
              <Activity className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
            ) : null}
          </div>
        </div>

        {/* Squeekchain Bonus Alert (Appears when new verified work is credited!) */}
        {lastSqueekBonus !== null && lastSqueekBonus > 0 && (
          <div className="p-2.5 rounded-xl bg-lime-500/15 border border-lime-500/40 text-xs text-lime-300 flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-lime-400 shrink-0" />
            <span>
              <strong>+{lastSqueekBonus} Energy</strong> — Powered by Squeektoshi's settled wheel work!
            </span>
          </div>
        )}

        {/* Expandable Technical Details (For verification & debugging) */}
        <details className="mt-3 group text-xs text-slate-400">
          <summary className="cursor-pointer select-none py-1.5 flex items-center justify-between font-mono text-[11px] text-slate-400 hover:text-slate-300 transition-colors">
            <span>📐 Advanced Squeekchain Ledger Details</span>
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
          </summary>
          
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Settled Core Work</span>
              <span className="text-white font-bold">{settledWork.toLocaleString()} units</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Conversion Rate</span>
              <span className="text-lime-400 font-bold">100 Work = 1 E</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Unclaimed Delta</span>
              <span className="text-cyan-400 font-bold">
                {uncreditedWork > 0 ? `+${Math.floor(uncreditedWork / 100)} E ready` : 'Synced'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Block Height</span>
              <span className="text-purple-300 font-bold">#{telemetry?.blockHeight || 5204}</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};
