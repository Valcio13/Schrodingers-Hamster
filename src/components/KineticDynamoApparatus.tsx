import React, { useEffect, useState } from 'react';

interface KineticDynamoApparatusProps {
  isRunning: boolean;
  rpm: number;
  batteryPct: number;
  wheelPeriod: number;
}

/**
 * KineticDynamoApparatus
 *
 * Dedicated pixel-art animation layer for the Kinetic Dynamo & Battery Accumulator:
 * 1. Brass Gear Drivetrain: 5 interlocking gears (cogs) rotating when Squeektoshi sprints.
 * 2. Top-Right Induction Solenoid: Copper electromagnetic glow with ascending induction wave & micro-arcs.
 * 3. Bottom Dual Induction Coils: Synchronized electromagnetic resonance & downward energy flow.
 * 4. Commutator Shaft Sparks: Intermittent micro-spark bursts at the high-speed brush contact.
 * 5. Relay Indicator LED: Rhythmic status pulse beside the analog meter.
 * 6. Floor Energy Conduit: Flowing power packet pulses along the glowing golden cable.
 */
export const KineticDynamoApparatus: React.FC<KineticDynamoApparatusProps> = ({
  isRunning,
  rpm,
  batteryPct,
  wheelPeriod
}) => {
  // Animation clock for micro-sparks and cable particle pulses
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (now - lastTime >= 80) { // ~12 fps retro pixel cadence
        setTick((prev) => (prev + 1) % 64);
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Compute gear speeds based on gear ratios & wheel period
  // When running, period adapts dynamically with RPM
  const basePeriod = isRunning ? Math.max(0.3, Math.min(4.0, wheelPeriod)) : 0;
  const p1 = `${(basePeriod * 0.75).toFixed(2)}s`;
  const p2 = `${(basePeriod * 0.85).toFixed(2)}s`;
  const p3 = `${(basePeriod * 0.95).toFixed(2)}s`;
  const p4 = `${(basePeriod * 0.70).toFixed(2)}s`;
  const p5 = `${(basePeriod * 1.00).toFixed(2)}s`;

  // Random micro-spark active conditions when running fast
  const isSparkHigh = isRunning && rpm > 70 && tick % 6 === 0;
  const isSparkMid = isRunning && tick % 9 === 0;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-[9]"
      data-testid="kinetic-dynamo-apparatus"
    >
      {/* ========================================================================= */}
      {/* 1. GEAR DRIVETRAIN (5 INTERLOCKING ROTATING COGS)                          */}
      {/* ========================================================================= */}

      {/* --- GEAR 1: TOP-LEFT LARGE BRASS COG (x=302, y=94, w=44, h=44) --- */}
      <div
        className="absolute left-[21.9477%] top-[12.2396%] w-[3.1977%] h-[5.7292%]"
        title="Dynamo Coupling Gear 1"
      >
        {/* Neutralization mask behind gear */}
        <div className="absolute inset-[3px] rounded-full bg-[#273b32] opacity-95" />
        {/* Rotating Gear Sprite (Clockwise) */}
        <img
          src="/assets/dynamo_gear_1.png"
          alt="Dynamo Gear 1"
          className={`w-full h-full object-contain pixel-art ${isRunning ? 'anim-gear-spin-cw' : ''}`}
          style={{
            imageRendering: 'pixelated',
            animationDuration: isRunning ? p1 : undefined,
            transform: isRunning ? undefined : 'rotate(0deg)',
            transition: isRunning ? 'none' : 'transform 0.5s ease-out'
          }}
        />
      </div>

      {/* --- GEAR 2: TOP-SHAFT PINION COG (x=323, y=163, w=48, h=48) --- */}
      <div
        className="absolute left-[23.4738%] top-[21.2240%] w-[3.4884%] h-[6.2500%]"
        title="Dynamo Shaft Pinion Gear 2"
      >
        {/* Neutralization mask */}
        <div className="absolute inset-[3px] rounded-full bg-[#29233b] opacity-95" />
        {/* Rotating Gear Sprite (Counter-Clockwise) */}
        <img
          src="/assets/dynamo_gear_2.png"
          alt="Dynamo Gear 2"
          className={`w-full h-full object-contain pixel-art ${isRunning ? 'anim-gear-spin-ccw' : ''}`}
          style={{
            imageRendering: 'pixelated',
            animationDuration: isRunning ? p2 : undefined,
            transform: isRunning ? undefined : 'rotate(0deg)',
            transition: isRunning ? 'none' : 'transform 0.5s ease-out'
          }}
        />
      </div>

      {/* --- GEAR 3: MIDDLE IDLER COG (x=294, y=266, w=52, h=52) --- */}
      <div
        className="absolute left-[21.3663%] top-[34.6354%] w-[3.7791%] h-[6.7708%]"
        title="Dynamo Idler Gear 3"
      >
        {/* Neutralization mask */}
        <div className="absolute inset-[3px] rounded-full bg-[#29233b] opacity-95" />
        {/* Rotating Gear Sprite (Clockwise) */}
        <img
          src="/assets/dynamo_gear_3.png"
          alt="Dynamo Gear 3"
          className={`w-full h-full object-contain pixel-art ${isRunning ? 'anim-gear-spin-cw' : ''}`}
          style={{
            imageRendering: 'pixelated',
            animationDuration: isRunning ? p3 : undefined,
            transform: isRunning ? undefined : 'rotate(0deg)',
            transition: isRunning ? 'none' : 'transform 0.5s ease-out'
          }}
        />
      </div>

      {/* --- GEAR 4: LOWER DRIVE COG (x=283, y=301, w=40, h=40) --- */}
      <div
        className="absolute left-[20.5669%] top-[39.1927%] w-[2.9070%] h-[5.2083%]"
        title="Dynamo Drive Gear 4"
      >
        {/* Neutralization mask */}
        <div className="absolute inset-[2px] rounded-full bg-[#29233b] opacity-95" />
        {/* Rotating Gear Sprite (Counter-Clockwise) */}
        <img
          src="/assets/dynamo_gear_4.png"
          alt="Dynamo Gear 4"
          className={`w-full h-full object-contain pixel-art ${isRunning ? 'anim-gear-spin-ccw' : ''}`}
          style={{
            imageRendering: 'pixelated',
            animationDuration: isRunning ? p4 : undefined,
            transform: isRunning ? undefined : 'rotate(0deg)',
            transition: isRunning ? 'none' : 'transform 0.5s ease-out'
          }}
        />
      </div>

      {/* --- GEAR 5: WHEEL-BASE COUPLING COG (x=231, y=430, w=60, h=60) --- */}
      <div
        className="absolute left-[16.7878%] top-[55.9896%] w-[4.3605%] h-[7.8125%]"
        title="Dynamo Wheel Coupling Gear 5"
      >
        {/* Neutralization mask */}
        <div className="absolute inset-[4px] rounded-full bg-[#29233b] opacity-95" />
        {/* Rotating Gear Sprite (Clockwise) */}
        <img
          src="/assets/dynamo_gear_5.png"
          alt="Dynamo Gear 5"
          className={`w-full h-full object-contain pixel-art ${isRunning ? 'anim-gear-spin-cw' : ''}`}
          style={{
            imageRendering: 'pixelated',
            animationDuration: isRunning ? p5 : undefined,
            transform: isRunning ? undefined : 'rotate(0deg)',
            transition: isRunning ? 'none' : 'transform 0.5s ease-out'
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. COMMUTATOR BRUSH MICRO-SPARKS (x=345..355, y=258..268)                */}
      {/* ========================================================================= */}
      {isRunning && (
        <div
          className="absolute left-[25.0727%] top-[33.5938%] w-[0.7267%] h-[1.3021%] flex items-center justify-center pointer-events-none"
        >
          {isSparkHigh && (
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_#38bdf8] animate-ping" />
          )}
          {isSparkMid && (
            <div className="w-1 h-1 bg-cyan-300 rounded-sm shadow-[0_0_4px_#38bdf8]" />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TOP-RIGHT COPPER INDUCTION SOLENOID (x=382..424, y=108..214)           */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[27.7616%] top-[14.0625%] w-[3.0523%] h-[13.8021%] overflow-hidden pointer-events-none rounded-t-sm"
        title="Induction Coil Primary Solenoid"
      >
        {/* Ambient warm copper induction glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-amber-500/20 via-orange-500/30 to-amber-600/20 transition-opacity duration-500 ${
            isRunning ? 'opacity-80' : 'opacity-20'
          }`}
        />

        {/* Dynamic Electromagnetic Ripple Wave when running */}
        {isRunning && (
          <div
            className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-amber-300/60 to-transparent anim-induction-wave"
            style={{
              animationDuration: `${Math.max(0.6, basePeriod * 1.5)}s`
            }}
          />
        )}

        {/* Random Electric Arc Micro-Spark across coil windings */}
        {isRunning && tick % 5 === 0 && (
          <div
            className="absolute w-1 h-2 bg-cyan-200 rounded-full shadow-[0_0_5px_#22d3ee]"
            style={{
              left: `${20 + (tick * 13) % 60}%`,
              top: `${15 + (tick * 17) % 70}%`
            }}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM DUAL INDUCTION COILS (Left & Right Solenoids)                   */}
      {/* Left: x=312..352, y=512..614; Right: x=362..402, y=512..614               */}
      {/* ========================================================================= */}
      {/* Left Coil Glow & Energy Wave */}
      <div
        className="absolute left-[22.6744%] top-[66.6667%] w-[2.9070%] h-[13.2813%] overflow-hidden pointer-events-none"
        title="Bottom Left Accumulator Coil"
      >
        <div
          className={`absolute inset-0 bg-gradient-to-b from-amber-500/25 via-orange-500/35 to-amber-600/20 transition-opacity duration-500 ${
            isRunning ? 'opacity-90' : batteryPct > 50 ? 'opacity-30' : 'opacity-10'
          }`}
        />
        {isRunning && (
          <div
            className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-amber-200/70 to-transparent anim-induction-wave-down"
            style={{
              animationDuration: `${Math.max(0.7, basePeriod * 1.8)}s`
            }}
          />
        )}
      </div>

      {/* Right Coil Glow & Energy Wave */}
      <div
        className="absolute left-[26.3081%] top-[66.6667%] w-[2.9070%] h-[13.2813%] overflow-hidden pointer-events-none"
        title="Bottom Right Accumulator Coil"
      >
        <div
          className={`absolute inset-0 bg-gradient-to-b from-amber-500/25 via-orange-500/35 to-amber-600/20 transition-opacity duration-500 ${
            isRunning ? 'opacity-90' : batteryPct > 50 ? 'opacity-30' : 'opacity-10'
          }`}
        />
        {isRunning && (
          <div
            className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-amber-200/70 to-transparent anim-induction-wave-down"
            style={{
              animationDuration: `${Math.max(0.7, basePeriod * 1.8)}s`,
              animationDelay: '0.2s'
            }}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. ANALOG GAUGE STATUS RELAY LED (x=414..424, y=452..462)                  */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[30.0872%] top-[58.8542%] w-[0.7267%] h-[1.3021%] flex items-center justify-center pointer-events-none"
        title="Battery Relay Indicator"
      >
        <div
          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            isRunning
              ? 'bg-emerald-300 shadow-[0_0_8px_#34d399] animate-pulse'
              : batteryPct >= 90
              ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]'
              : batteryPct >= 30
              ? 'bg-lime-400 opacity-80'
              : 'bg-amber-500 opacity-60'
          }`}
        />
      </div>

      {/* ========================================================================= */}
      {/* 6. GLOWING FLOOR CONDUIT CABLE PULSES (x=362..402, y=620..710)            */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[26.3081%] top-[80.7292%] w-[2.9070%] h-[11.7188%] pointer-events-none overflow-visible"
        title="Dynamo Grounding & Power Conduit"
      >
        <svg
          viewBox="0 0 40 90"
          className="w-full h-full overflow-visible"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Subtle warm base wire glow when active */}
          <path
            d="M 6,2 Q 10,40 34,88"
            fill="none"
            stroke="#fef08a"
            strokeWidth={isRunning ? 2.2 : 1.5}
            strokeLinecap="round"
            opacity={isRunning ? 0.7 : 0.3}
            className={isRunning ? 'shadow-[0_0_6px_#fef08a]' : ''}
          />

          {/* Animated energy packets streaming along the cable into the floor */}
          {isRunning && (
            <path
              d="M 6,2 Q 10,40 34,88"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 14"
              className="anim-cable-flow"
              style={{
                animationDuration: `${Math.max(0.4, basePeriod * 0.9)}s`
              }}
            />
          )}
        </svg>
      </div>
    </div>
  );
};
