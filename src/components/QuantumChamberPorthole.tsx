import React, { useEffect } from 'react';

interface QuantumChamberPortholeProps {
  isExpRunning: boolean;
  isExpReady: boolean;
}

const PORTHOLE_ASSETS = [
  '/assets/quantum_chamber_vortex_disk.png',
  '/assets/quantum_chamber_core_star.png',
  '/assets/quantum_chamber_glass_overlay.png'
];

export const QuantumChamberPorthole: React.FC<QuantumChamberPortholeProps> = ({
  isExpRunning,
  isExpReady
}) => {
  // Preload all porthole layers on mount for flicker-free rendering
  useEffect(() => {
    PORTHOLE_ASSETS.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div
      className="relative w-full h-full rounded-full overflow-hidden select-none pointer-events-none shadow-[inset_0_0_8px_rgba(0,0,0,0.85)]"
      data-testid="quantum-chamber-porthole"
    >
      {/* LAYER 1: Deep Cosmic Space & Continuous Swirling Vortex Nebula */}
      <div className="absolute -inset-[6%] w-[112%] h-[112%] flex items-center justify-center">
        <img
          src="/assets/quantum_chamber_vortex_disk.png"
          alt="Quantum Vortex Swirl"
          className={`w-full h-full object-contain pixel-art ${
            isExpRunning ? 'anim-vortex-active' : 'anim-vortex-idle'
          }`}
          style={{
            imageRendering: 'pixelated'
          }}
          data-testid="porthole-vortex-disk"
        />
      </div>

      {/* LAYER 2: Central Singularity Core Star & Horizontal Flare */}
      <div
        className={`absolute inset-0 w-full h-full flex items-center justify-center ${
          isExpReady
            ? 'anim-core-ready'
            : isExpRunning
            ? 'anim-core-active'
            : 'anim-core-pulse'
        }`}
        data-testid="porthole-core-star"
      >
        <img
          src="/assets/quantum_chamber_core_star.png"
          alt="Singularity Core"
          className="w-full h-full object-contain pixel-art"
          style={{
            imageRendering: 'pixelated'
          }}
        />
      </div>

      {/* LAYER 3: Stationary Convex Glass Specular Reflection Highlight Overlay */}
      <img
        src="/assets/quantum_chamber_glass_overlay.png"
        alt="Porthole Glass Sheen"
        className="absolute inset-0 w-full h-full object-contain pixel-art pointer-events-none opacity-95"
        style={{
          imageRendering: 'pixelated'
        }}
        data-testid="porthole-glass-overlay"
      />
    </div>
  );
};
