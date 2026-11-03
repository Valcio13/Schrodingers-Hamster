import React, { useEffect, useRef, useState } from 'react';

/**
 * ResearchDeskApparatus
 *
 * Lightweight, high-performance pixel-art animation layer for the laboratory research desk:
 * 1. Oscilloscope CRT screen: scrolling neon-green phosphor quantum waveform with electron trace glow.
 * 2. Bunsen Burner: 4-frame flickering pixel flame with blue base, hot yellow core, and dancing orange tip.
 * 3. Chemistry Glassware: rising effervescent bubbles ascending the blue Erlenmeyer flask into the air,
 *    and sparkling amber bubbles floating in the round potion flask.
 */
export const ResearchDeskApparatus: React.FC = () => {
  // Phase tracker for smooth oscilloscope scrolling & quantum oscillation
  const [phase, setPhase] = useState(0);
  const [flameFrame, setFlameFrame] = useState(0);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let flameTimer = 0;

    const loop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      // Scroll oscilloscope wave smoothly (~1.2 cycles per second)
      setPhase((prev) => (prev + (dt * 0.006)) % (Math.PI * 2));

      // Advance flame animation every ~90ms
      flameTimer += dt;
      if (flameTimer > 90) {
        flameTimer = 0;
        setFlameFrame((prev) => (prev + 1) % 4);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Generate SVG path for the CRT oscilloscope wave (width 71px, height 66px, center y=33)
  const generateOscilloscopePath = () => {
    const width = 71;
    const centerY = 33;
    const points: string[] = [];

    for (let x = 0; x <= width; x += 1.5) {
      // Quantum superposition wave: fundamental sine + 2nd harmonic + subtle amplitude pulse
      const k1 = 0.12;
      const k2 = 0.24;
      const amp1 = 14;
      const amp2 = 5;

      const y =
        centerY +
        Math.sin(x * k1 + phase) * amp1 +
        Math.sin(x * k2 - phase * 1.5) * amp2;

      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return `M ${points.join(' L ')}`;
  };

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-[9]"
      data-testid="research-desk-apparatus"
    >
      {/* ========================================================================= */}
      {/* 1. OSCILLOSCOPE CRT SCREEN                                                */}
      {/* Laboratory background coords: x=669, y=572, w=71, h=66                    */}
      {/* Percentages: left=48.6192%, top=74.4792%, width=5.1600%, height=8.5938%   */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[48.6192%] top-[74.4792%] w-[5.1600%] h-[8.5938%] overflow-hidden rounded-[2px]"
        style={{
          backgroundColor: '#051308',
          boxShadow: 'inset 0 0 6px rgba(5, 25, 12, 0.95), inset 0 0 2px rgba(34, 197, 94, 0.4)'
        }}
        title="Quantum Oscilloscope CRT Trace"
      >
        {/* Subtle CRT Phosphor Scanlines */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0px, rgba(0, 0, 0, 0.6) 1px, transparent 1px, transparent 2px)'
          }}
        />

        {/* Ambient CRT Phosphor Glow */}
        <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />

        {/* SVG Oscilloscope Trace Wave */}
        <svg
          viewBox="0 0 71 66"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Faint Background Wave Trail (phosphor persistence) */}
          <path
            d={generateOscilloscopePath()}
            fill="none"
            stroke="#15803d"
            strokeWidth="3"
            opacity="0.35"
            strokeLinecap="round"
          />

          {/* Core Sharp Phosphor Wave */}
          <path
            d={generateOscilloscopePath()}
            fill="none"
            stroke="#4ade80"
            strokeWidth="1.6"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 2px #22c55e)'
            }}
          />

          {/* White-Hot Electron Beam Center Line */}
          <path
            d={generateOscilloscopePath()}
            fill="none"
            stroke="#f0fdf4"
            strokeWidth="0.8"
            opacity="0.85"
            strokeLinecap="round"
          />
        </svg>

        {/* Oscilloscope Status Indicator (blinking green LED) */}
        <div className="absolute top-1 left-1.5 flex items-center space-x-0.5">
          <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_3px_#34d399]" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BUNSEN BURNER FLAME                                                    */}
      {/* Laboratory background coords: x=771, y=642, w=10, h=15                    */}
      {/* Percentages: left=56.0320%, top=83.5938%, width=0.7267%, height=1.9531%   */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[56.0320%] top-[83.5938%] w-[0.7267%] h-[1.9531%] flex items-end justify-center"
        title="Bunsen Burner Flame"
      >
        {/* Soft Radiant Warm Glow on Desk */}
        <div className="absolute -bottom-1 w-4 h-3 bg-amber-400/25 rounded-full blur-[2px] animate-pulse pointer-events-none" />

        {/* 4-Frame Dynamic Pixel Flame SVG */}
        <svg
          viewBox="0 0 10 15"
          className="w-full h-full overflow-visible pixel-art"
          style={{ imageRendering: 'pixelated' }}
        >
          {flameFrame === 0 && (
            <g>
              {/* Frame 0: Standard bright flame */}
              <path d="M 4 14 L 6 14 L 7 11 L 6 7 L 5 4 L 4 7 L 3 11 Z" fill="#f97316" />
              <path d="M 4 14 L 6 14 L 6 10 L 5 7 L 4 10 Z" fill="#fde047" />
              <path d="M 4 14 L 6 14 L 5 11 Z" fill="#38bdf8" />
            </g>
          )}

          {flameFrame === 1 && (
            <g>
              {/* Frame 1: Stretched taller dancing tip */}
              <path d="M 4 14 L 6 14 L 7 10 L 6 5 L 5 2 L 4 6 L 3 10 Z" fill="#f97316" />
              <path d="M 4 14 L 6 14 L 6 9 L 5 5 L 4 9 Z" fill="#fde047" />
              <path d="M 4 14 L 6 14 L 5 12 Z" fill="#38bdf8" />
            </g>
          )}

          {flameFrame === 2 && (
            <g>
              {/* Frame 2: Flickering slight left tilt */}
              <path d="M 4 14 L 6 14 L 7 11 L 5 6 L 4 3 L 3 8 L 3 11 Z" fill="#ea580c" />
              <path d="M 4 14 L 6 14 L 5 9 L 4 6 L 4 10 Z" fill="#facc15" />
              <path d="M 4 14 L 6 14 L 5 11 Z" fill="#0284c7" />
            </g>
          )}

          {flameFrame === 3 && (
            <g>
              {/* Frame 3: Bright white-hot flash with slight right perk */}
              <path d="M 4 14 L 6 14 L 7 11 L 6 8 L 6 4 L 4 7 L 3 11 Z" fill="#f97316" />
              <path d="M 4 14 L 6 14 L 6 9 L 5 6 L 4 9 Z" fill="#fef08a" />
              <path d="M 4 14 L 6 14 L 5 11 Z" fill="#38bdf8" />
            </g>
          )}
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 3. BLUE ERLENMEYER FLASK EFFERVESCENT BUBBLES                             */}
      {/* Laboratory background coords: x=788, y=510, w=52, h=146                   */}
      {/* Percentages: left=57.2674%, top=66.4063%, width=3.7791%, height=19.0104%  */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[57.2674%] top-[66.4063%] w-[3.7791%] h-[19.0104%] overflow-visible"
        title="Effervescent Quantum Reagent"
      >
        {/* Animated Rising Bubbles */}
        <div className="absolute inset-0">
          {/* Bubble 1: Central rising bubble */}
          <div
            className="absolute rounded-full bg-cyan-300 shadow-[0_0_4px_#22d3ee] animate-lab-bubble-1"
            style={{
              width: '4px',
              height: '4px',
              left: '48%',
              bottom: '22%'
            }}
          />

          {/* Bubble 2: Left-side ascending bubble */}
          <div
            className="absolute rounded-full bg-cyan-200 shadow-[0_0_3px_#67e8f9] animate-lab-bubble-2"
            style={{
              width: '3px',
              height: '3px',
              left: '38%',
              bottom: '18%'
            }}
          />

          {/* Bubble 3: Right-side ascending bubble */}
          <div
            className="absolute rounded-full bg-sky-300 shadow-[0_0_4px_#38bdf8] animate-lab-bubble-3"
            style={{
              width: '4px',
              height: '4px',
              left: '58%',
              bottom: '26%'
            }}
          />

          {/* Bubble 4: Fast rising bubble heading up through the neck */}
          <div
            className="absolute rounded-full bg-white shadow-[0_0_5px_#a5f3fc] animate-lab-bubble-4"
            style={{
              width: '3px',
              height: '3px',
              left: '51%',
              bottom: '30%'
            }}
          />

          {/* Bubble 5: Floating vapor bubble above the flask rim */}
          <div
            className="absolute rounded-full bg-cyan-300/80 shadow-[0_0_4px_#22d3ee] animate-lab-vapor"
            style={{
              width: '5px',
              height: '5px',
              left: '46%',
              top: '12%'
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ORANGE ROUND FLASK SPARKLING BUBBLES                                   */}
      {/* Laboratory background coords: x=846, y=560, w=56, h=86                    */}
      {/* Percentages: left=61.4826%, top=72.9167%, width=4.0698%, height=11.1979%  */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[61.4826%] top-[72.9167%] w-[4.0698%] h-[11.1979%] overflow-visible"
        title="Volatile Amber Catalyst"
      >
        {/* Amber Potion Floating Effervescence */}
        <div className="absolute inset-0">
          {/* Amber Bubble 1 */}
          <div
            className="absolute rounded-full bg-amber-200 shadow-[0_0_4px_#fde047] animate-lab-amber-1"
            style={{
              width: '4px',
              height: '4px',
              left: '42%',
              bottom: '24%'
            }}
          />

          {/* Amber Bubble 2 */}
          <div
            className="absolute rounded-full bg-orange-200 shadow-[0_0_3px_#fed7aa] animate-lab-amber-2"
            style={{
              width: '3px',
              height: '3px',
              left: '58%',
              bottom: '32%'
            }}
          />

          {/* Amber Bubble 3 */}
          <div
            className="absolute rounded-full bg-yellow-100 shadow-[0_0_4px_#fef08a] animate-lab-amber-3"
            style={{
              width: '3px',
              height: '3px',
              left: '32%',
              bottom: '28%'
            }}
          />
        </div>
      </div>
    </div>
  );
};
