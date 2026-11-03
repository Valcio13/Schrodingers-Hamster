import React from 'react';

interface PixelHamsterProps {
  speciesId: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  isRunning?: boolean;
  isSleeping?: boolean;
  className?: string;
}

export const PixelHamster: React.FC<PixelHamsterProps> = ({
  speciesId,
  size = 'md',
  isRunning = false,
  isSleeping = false,
  className = ''
}) => {
  const pixelSizes = {
    sm: 36,
    md: 56,
    lg: 84,
    hero: 130
  };
  const px = pixelSizes[size];

  // Palette configs per species
  const palettes: Record<string, { body: string; dark: string; light: string; accent: string; glow: string }> = {
    normal: {
      body: '#e69a47',
      dark: '#b36d24',
      light: '#f5c48b',
      accent: '#ff8a8a',
      glow: 'rgba(230, 154, 71, 0.25)'
    },
    electric: {
      body: '#ffdc33',
      dark: '#d4a400',
      light: '#fff299',
      accent: '#ff5722',
      glow: 'rgba(255, 220, 51, 0.45)'
    },
    ghost: {
      body: '#88d9f7',
      dark: '#4fa3c7',
      light: '#c8f0ff',
      accent: '#64ffda',
      glow: 'rgba(100, 255, 218, 0.4)'
    },
    glitch: {
      body: '#ff3d7f',
      dark: '#b3104c',
      light: '#00f0ff',
      accent: '#ffeb3b',
      glow: 'rgba(255, 61, 127, 0.4)'
    },
    plasma: {
      body: '#b537f2',
      dark: '#6f0ba8',
      light: '#f188ff',
      accent: '#ff4081',
      glow: 'rgba(181, 55, 242, 0.45)'
    },
    paradox: {
      body: '#a1ff0a',
      dark: '#4e9900',
      light: '#e1ff80',
      accent: '#b388ff',
      glow: 'rgba(161, 255, 10, 0.5)'
    }
  };

  const p = palettes[speciesId] || palettes.normal;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: px,
        height: px,
        filter: speciesId === 'ghost' ? 'drop-shadow(0 0 8px ' + p.glow + ') opacity(0.88)' : 'drop-shadow(0 4px 8px ' + p.glow + ')'
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width={px}
        height={px}
        style={{ imageRendering: 'pixelated' }}
        className={`${isRunning ? 'animate-bounce' : ''} ${isSleeping ? 'animate-pulse' : ''}`}
      >
        {/* Glow halo for epic/legendary species */}
        {(speciesId === 'plasma' || speciesId === 'paradox') && (
          <circle cx="16" cy="16" r="14" fill={p.glow} />
        )}

        {/* Ears */}
        <rect x="7" y="4" width="4" height="5" fill={p.dark} rx="1" />
        <rect x="8" y="5" width="2" height="3" fill={p.accent} />
        
        <rect x="21" y="4" width="4" height="5" fill={p.dark} rx="1" />
        <rect x="22" y="5" width="2" height="3" fill={p.accent} />

        {/* Body Main */}
        <rect x="6" y="8" width="20" height="18" fill={p.body} rx="3" />
        <rect x="8" y="9" width="16" height="4" fill={p.light} />

        {/* Cheeks */}
        <rect x="5" y="14" width="3" height="6" fill={p.light} rx="1" />
        <rect x="24" y="14" width="3" height="6" fill={p.light} rx="1" />

        {/* Belly / Chest */}
        <rect x="10" y="15" width="12" height="10" fill={p.light} rx="2" />

        {/* Tail */}
        <circle cx="5" cy="22" r="2.5" fill={p.body} />

        {/* Paws */}
        <rect x="9" y="25" width="4" height="3" fill={p.dark} rx="1" />
        <rect x="19" y="25" width="4" height="3" fill={p.dark} rx="1" />

        {/* Face Elements */}
        {isSleeping ? (
          <>
            {/* Sleeping closed eye lines */}
            <rect x="9" y="13" width="3" height="1" fill="#1b1c22" />
            <rect x="20" y="13" width="3" height="1" fill="#1b1c22" />
            {/* Tiny Zzz text */}
            <text x="24" y="6" fill="#ffb84d" fontSize="6" fontFamily="Pixelify Sans" fontWeight="bold">z</text>
            <text x="28" y="3" fill="#ffb84d" fontSize="8" fontFamily="Pixelify Sans" fontWeight="bold">Z</text>
          </>
        ) : (
          <>
            {/* Eyes */}
            {speciesId === 'glitch' ? (
              <>
                <rect x="10" y="12" width="3" height="3" fill="#00f0ff" />
                <rect x="19" y="11" width="3" height="4" fill="#ffeb3b" />
              </>
            ) : speciesId === 'ghost' ? (
              <>
                <rect x="10" y="12" width="3" height="3" fill="#64ffda" />
                <rect x="11" y="13" width="1" height="1" fill="#fff" />
                <rect x="19" y="12" width="3" height="3" fill="#64ffda" />
                <rect x="20" y="13" width="1" height="1" fill="#fff" />
              </>
            ) : (
              <>
                <rect x="10" y="12" width="3" height="3" fill="#1b1c22" rx="0.5" />
                <rect x="10" y="12" width="1" height="1" fill="#fff" />
                <rect x="19" y="12" width="3" height="3" fill="#1b1c22" rx="0.5" />
                <rect x="19" y="12" width="1" height="1" fill="#fff" />
              </>
            )}
          </>
        )}

        {/* Snout & Nose */}
        <rect x="15" y="15" width="2" height="2" fill={p.accent} />
        <rect x="14" y="17" width="4" height="1" fill={p.dark} />

        {/* Species Quirks */}
        {speciesId === 'electric' && (
          <path d="M14 6 L18 6 L15 10 L19 10 L13 16" stroke="#fff" strokeWidth="1" fill="none" />
        )}
        {speciesId === 'glitch' && (
          <>
            <rect x="2" y="10" width="3" height="2" fill="#00f0ff" />
            <rect x="27" y="18" width="4" height="2" fill="#ff3d7f" />
          </>
        )}
        {speciesId === 'paradox' && (
          <>
            <circle cx="16" cy="11" r="1.5" fill="#fff" />
            <path d="M12 2 Q16 0 20 2" stroke="#b388ff" strokeWidth="1" fill="none" />
          </>
        )}
      </svg>
    </div>
  );
};
