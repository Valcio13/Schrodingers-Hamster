import React from 'react';

/**
 * CeilingLightingApparatus
 *
 * Adds warm, atmospheric, living vintage Edison lightbulb flickers and ambient halos
 * to the laboratory ceiling and workstation:
 * - Bulb 1 (Left ceiling above kinetic wheel)
 * - Bulb 2 (Lower middle hanging bulb)
 * - Bulb 3 (Upper right of chalkboard cluster)
 * - Bulb 4 (Right ceiling above chamber / portrait)
 * - Banker's Desk Lamp (Warm downward cone shimmer)
 */
export const CeilingLightingApparatus: React.FC = () => {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-[8]"
      data-testid="ceiling-lighting-apparatus"
    >
      {/* ========================================================================= */}
      {/* BULB 1 (LEFT CEILING ABOVE WHEEL)                                         */}
      {/* Filament center: x=323.4, y=129.0 (left: 23.5029%, top: 16.7969%)         */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[23.5029%] top-[16.7969%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center animate-bulb-flicker-1"
        title="Vintage Edison Bulb 1"
      >
        {/* Soft Amber Ambient Glow */}
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(254, 240, 138, 0.42) 0%, rgba(251, 191, 36, 0.22) 35%, rgba(245, 158, 11, 0.08) 65%, transparent 80%)'
          }}
        />
        {/* Filament Center Hotspot */}
        <div className="absolute w-3 h-4 rounded-full bg-amber-100/70 blur-[1px] shadow-[0_0_8px_#fef08a]" />
      </div>

      {/* ========================================================================= */}
      {/* BULB 2 (LOWER MIDDLE HANGING BULB - MOODY VINTAGE FLICKER)                */}
      {/* Filament center: x=401.1, y=182.8 (left: 29.1497%, top: 23.8021%)         */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[29.1497%] top-[23.8021%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center animate-bulb-flicker-2"
        title="Vintage Edison Bulb 2 (Low Hanging)"
      >
        {/* Soft Golden Ambient Halo */}
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(254, 240, 138, 0.48) 0%, rgba(251, 191, 36, 0.25) 35%, rgba(245, 158, 11, 0.09) 65%, transparent 80%)'
          }}
        />
        {/* Filament Center Hotspot */}
        <div className="absolute w-3.5 h-4.5 rounded-full bg-amber-100/75 blur-[1px] shadow-[0_0_10px_#fde047]" />
      </div>

      {/* ========================================================================= */}
      {/* BULB 3 (UPPER RIGHT OF CHALKBOARD CLUSTER)                                */}
      {/* Filament center: x=429.0, y=120.1 (left: 31.1773%, top: 15.6380%)         */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[31.1773%] top-[15.6380%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center animate-bulb-flicker-3"
        title="Vintage Edison Bulb 3"
      >
        {/* Soft Warm Ambient Halo */}
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(254, 240, 138, 0.42) 0%, rgba(251, 191, 36, 0.22) 35%, rgba(245, 158, 11, 0.08) 65%, transparent 80%)'
          }}
        />
        {/* Filament Center Hotspot */}
        <div className="absolute w-3 h-4 rounded-full bg-amber-100/70 blur-[1px] shadow-[0_0_8px_#fef08a]" />
      </div>

      {/* ========================================================================= */}
      {/* BULB 4 (RIGHT CEILING BY HAMSTER PORTRAIT)                                */}
      {/* Filament center: x=929.4, y=125.0 (left: 67.5436%, top: 16.2760%)         */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[67.5436%] top-[16.2760%] -translate-x-1/2 -translate-y-1/2 w-22 h-22 sm:w-30 sm:h-30 flex items-center justify-center animate-bulb-flicker-4"
        title="Vintage Edison Bulb 4 (Portrait Area)"
      >
        {/* Soft Ambient Halo */}
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(254, 240, 138, 0.44) 0%, rgba(251, 191, 36, 0.23) 35%, rgba(245, 158, 11, 0.08) 65%, transparent 80%)'
          }}
        />
        {/* Filament Center Hotspot */}
        <div className="absolute w-3 h-4.5 rounded-full bg-amber-100/75 blur-[1px] shadow-[0_0_9px_#fde047]" />
      </div>

      {/* ========================================================================= */}
      {/* BANKER'S DESK LAMP AMBIENT CONE SHIMMER (WORKSTATION LIGHT)               */}
      {/* Lamp bulb center: x=495, y=525 (left: 36.0%, top: 68.3%)                  */}
      {/* ========================================================================= */}
      <div
        className="absolute left-[36.0%] top-[68.3%] -translate-x-1/2 -translate-y-1/4 w-32 h-24 pointer-events-none animate-lamp-shimmer"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(254, 240, 138, 0.28) 0%, rgba(251, 191, 36, 0.14) 40%, transparent 75%)'
        }}
        title="Banker's Lamp Ambient Light"
      />
    </div>
  );
};
