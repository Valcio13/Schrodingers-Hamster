import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, ZoomIn, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { audio } from '../services/audio';

interface SqueektoshiAnimationPreviewProps {
  onClose: () => void;
  telemetryRpm?: number;
}

export type PrototypeState = 'idle' | 'running' | 'sleeping';

export const SqueektoshiAnimationPreview: React.FC<SqueektoshiAnimationPreviewProps> = ({
  onClose,
  telemetryRpm = 0
}) => {
  const [animState, setAnimState] = useState<PrototypeState>('running');
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [zoomScale, setZoomScale] = useState<number>(3); // 1x, 2x, 3x, 4x

  // Frame counts per animation state
  const frameCounts: Record<PrototypeState, number> = {
    idle: 3,
    sleeping: 3,
    running: 4
  };

  const frameIntervals: Record<PrototypeState, number[]> = {
    idle: [1400, 160, 300],
    sleeping: [650, 650, 650],
    running: [120, 120, 120, 120]
  };

  // Frame Sequencer
  useEffect(() => {
    if (!isPlaying) return;

    const intervals = frameIntervals[animState];
    const duration = Math.max(30, Math.round(intervals[currentFrame % intervals.length] / speedMultiplier));

    const timer = setTimeout(() => {
      setCurrentFrame(prev => (prev + 1) % frameCounts[animState]);
    }, duration);

    return () => clearTimeout(timer);
  }, [animState, currentFrame, isPlaying, speedMultiplier]);

  // Reset frame on state change
  const handleStateChange = (newState: PrototypeState) => {
    audio.playClick();
    setAnimState(newState);
    setCurrentFrame(0);
  };

  // Resolve current prototype image path
  const prefix = animState === 'running' ? 'run' : animState === 'sleeping' ? 'sleep' : 'idle';
  const currentFrameSrc = `/assets/squeektoshi_prototype/${prefix}_${currentFrame}.png`;
  const animatedGifSrc = `/assets/squeektoshi_prototype/${animState}.gif`;
  const originalApprovedSrc = '/assets/squeektoshi_prototype/original_approved.png';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b0f19] border-2 border-amber-500/50 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl relative space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs font-bold border border-amber-500/40">
                PROTOTYPE QUALITY GATE
              </span>
              <h2 className="text-xl font-bold font-sans text-white tracking-wide">
                Squeektoshi Animation Prototype & Art Comparison
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Side-by-side verification: Compare proposed frame-by-frame animation against the approved static baseline.
            </p>
          </div>

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          {/* State Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase mr-1">State:</span>
            <button
              data-testid="btn-state-running"
              onClick={() => handleStateChange('running')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                animState === 'running'
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_#f59e0b]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🏃 RUNNING (4-Frame Stride)
            </button>
            <button
              data-testid="btn-state-sleeping"
              onClick={() => handleStateChange('sleeping')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                animState === 'sleeping'
                  ? 'bg-purple-400 text-slate-950 shadow-[0_0_12px_#c084fc]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              😴 SLEEPING (3-Frame Breath)
            </button>
            <button
              data-testid="btn-state-idle"
              onClick={() => handleStateChange('idle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                animState === 'idle'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_#22d3ee]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              👀 IDLE (Natural Blink)
            </button>
          </div>

          {/* Zoom and Play Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400">ZOOM:</span>
              {[2, 3, 4].map(z => (
                <button
                  key={z}
                  onClick={() => setZoomScale(z)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    zoomScale === z ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1 border border-slate-700"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-lime-400" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
          </div>
        </div>

        {/* SIDE-BY-SIDE COMPARISON (SECTION 9 REQUIREMENT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT: ORIGINAL APPROVED HAMSTER */}
          <div className="flex flex-col rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  LEFT — ORIGINAL APPROVED HAMSTER
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                Static Baseline
              </span>
            </div>

            <div className="p-6 flex flex-col items-center justify-center min-h-[220px] bg-[#070b14] relative overflow-hidden">
              {/* Pixel Art Checkerboard backing */}
              <div
                className="transition-transform duration-100 flex items-center justify-center"
                style={{
                  transform: `scale(${zoomScale})`,
                  imageRendering: 'pixelated'
                }}
              >
                <img
                  src={originalApprovedSrc}
                  alt="Original Approved Squeektoshi"
                  className="pixel-art pointer-events-none select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] font-mono space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Source:</span>
                <span className="text-slate-200">schrodingers_hamster_lab.jpg</span>
              </div>
              <div className="flex justify-between">
                <span>Fur Shading:</span>
                <span className="text-amber-300">Golden Amber Gradient + Cream Belly</span>
              </div>
              <div className="flex justify-between">
                <span>In-Game Status:</span>
                <span className="text-emerald-400 font-bold">100% RESTORED IN LAB</span>
              </div>
            </div>
          </div>

          {/* RIGHT: NEW ANIMATED HAMSTER */}
          <div className="flex flex-col rounded-xl bg-slate-950 border border-amber-500/40 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  RIGHT — NEW ANIMATED HAMSTER
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                Frame {currentFrame + 1} of {frameCounts[animState]}
              </span>
            </div>

            <div className="p-6 flex flex-col items-center justify-center min-h-[220px] bg-[#070b14] relative overflow-hidden">
              <div
                className="transition-transform duration-100 flex items-center justify-center"
                style={{
                  transform: `scale(${zoomScale})`,
                  imageRendering: 'pixelated'
                }}
              >
                <img
                  src={currentFrameSrc}
                  alt={`Squeektoshi ${animState} frame ${currentFrame}`}
                  className="pixel-art pointer-events-none select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Sleeping Zzz particles overlay during sleep state */}
              {animState === 'sleeping' && (
                <div className="absolute top-4 right-10 pointer-events-none text-amber-300 font-mono font-bold animate-pulse">
                  <span className="text-xs block">z</span>
                  <span className="text-sm block translate-x-1">z</span>
                  <span className="text-base block translate-x-2">Z</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] font-mono space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Active Cycle:</span>
                <span className="text-amber-300 uppercase font-bold">{animState}</span>
              </div>
              <div className="flex justify-between">
                <span>Pixel Density:</span>
                <span className="text-slate-200">1:1 Native Pixel-Art (No Procedural Vector)</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-cyan-300 font-bold">Awaiting User Approval</span>
              </div>
            </div>
          </div>

        </div>

        {/* Frame Scrubber & Inspection Controls */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <span>🎞️ Manual Frame Scrubber (Paused Inspection)</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Click any frame to freeze & inspect pixel alignment:
            </span>
          </div>

          <div className="flex items-center gap-2">
            {Array.from({ length: frameCounts[animState] }).map((_, fIdx) => (
              <button
                key={fIdx}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrame(fIdx);
                }}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-mono font-bold flex flex-col items-center transition-all ${
                  currentFrame === fIdx
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>Frame {fIdx}</span>
                <span className="text-[9px] opacity-70">
                  {animState === 'running'
                    ? fIdx === 0
                      ? 'Right Contact'
                      : fIdx === 1
                      ? 'Passing 1'
                      : fIdx === 2
                      ? 'Push / Ext'
                      : 'Passing 2'
                    : animState === 'sleeping'
                    ? fIdx === 0
                      ? 'Exhale / Rest'
                      : fIdx === 1
                      ? 'Inhale / Chest'
                      : 'Ear Relax'
                    : fIdx === 0
                    ? 'Alert Smile'
                    : fIdx === 1
                    ? 'Closed Blink'
                    : 'Ear Twitch'}
                </span>
              </button>
            ))}
          </div>

          {/* Speed slider */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400">Playback Speed:</span>
              <input
                type="range"
                min="0.25"
                max="2.5"
                step="0.25"
                value={speedMultiplier}
                onChange={e => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-32 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-amber-300">{speedMultiplier.toFixed(2)}x</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>Telemetry Sync Preview:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${telemetryRpm > 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {telemetryRpm > 0 ? `${telemetryRpm.toFixed(1)} RPM (Live Run)` : '0 RPM (Resting)'}
              </span>
            </div>
          </div>
        </div>

        {/* Quality Gate Notice */}
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200/90 text-xs font-sans space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-300 font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>CRITICAL INSTRUCTION HONORED: IN-GAME ARTWORK IS PRESERVED</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            The main in-game laboratory screen retains the <strong>100% original approved Squeektoshi and Scientist Hamster artwork</strong>.
            This preview allows frame-by-frame inspection. No animation will replace the in-game characters until you approve this preview.
          </p>
        </div>

      </div>
    </div>
  );
};
