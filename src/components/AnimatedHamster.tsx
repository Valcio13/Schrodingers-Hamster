import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QuantumHybrid, HAMSTER_SPECIES } from '../types/game';

export type HamsterAnimationState = 'idle' | 'running' | 'sleeping';

export interface AnimatedHamsterProps {
  speciesId?: string;
  hybrid?: QuantumHybrid;
  isSqueektoshi?: boolean;
  hasLabCoat?: boolean;
  animation?: HamsterAnimationState;
  speed?: number;
  size?: 'sm' | 'md' | 'lg' | 'hero' | number;
  facing?: 'left' | 'right';
  reducedMotion?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BASE_PALETTES: Record<string, { body: string; dark: string; light: string; accent: string; glow: string }> = {
  normal: {
    body: '#e69a47',
    dark: '#b36d24',
    light: '#f5c48b',
    accent: '#ff8a8a',
    glow: 'rgba(230, 154, 71, 0.25)'
  },
  squeektoshi: {
    body: '#f5a623',
    dark: '#b86a04',
    light: '#fedb80',
    accent: '#ff9292',
    glow: 'rgba(245, 166, 35, 0.45)'
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

const PIXEL_SIZES = {
  sm: 36,
  md: 56,
  lg: 84,
  hero: 130
};

export const AnimatedHamster: React.FC<AnimatedHamsterProps> = ({
  speciesId = 'normal',
  hybrid,
  isSqueektoshi = false,
  hasLabCoat = false,
  animation = 'idle',
  speed = 1,
  size = 'md',
  facing = 'right',
  reducedMotion: propReducedMotion,
  className = '',
  onClick
}) => {
  const px = typeof size === 'number' ? size : PIXEL_SIZES[size] || 56;

  // Reduced motion preference detection
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setSystemReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isReducedMotion = propReducedMotion ?? systemReducedMotion;

  // Animation frame state
  const [frame, setFrame] = useState(0);

  // Frame sequencer with Page Visibility handling
  useEffect(() => {
    if (isReducedMotion) {
      setFrame(0);
      return;
    }

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let timer: NodeJS.Timeout | null = null;

    if (animation === 'running') {
      // 6-frame running loop at ~10 FPS (100ms per frame / speed)
      const intervalMs = Math.max(40, Math.round(100 / Math.max(0.2, speed)));
      timer = setInterval(() => {
        if (!isVisible) return;
        setFrame(prev => (prev + 1) % 6);
      }, intervalMs);
    } else if (animation === 'sleeping') {
      // 4-frame breathing cycle at ~1.5 FPS (650ms per frame / speed)
      const intervalMs = Math.max(200, Math.round(650 / Math.max(0.2, speed)));
      timer = setInterval(() => {
        if (!isVisible) return;
        setFrame(prev => (prev + 1) % 4);
      }, intervalMs);
    } else {
      // Idle state machine: mostly frame 0, occasional blink (frame 1), ear twitch (frame 2, 3), sniff (frame 4)
      let idleStep = 0;
      const tick = () => {
        if (!isVisible) {
          timer = setTimeout(tick, 1000);
          return;
        }

        idleStep++;
        const cycle = idleStep % 20;

        if (cycle === 6) {
          // Blink
          setFrame(1);
          timer = setTimeout(() => {
            setFrame(0);
            timer = setTimeout(tick, 300);
          }, 150);
        } else if (cycle === 12) {
          // Ear twitch left
          setFrame(2);
          timer = setTimeout(() => {
            // Ear twitch right
            setFrame(3);
            timer = setTimeout(() => {
              setFrame(0);
              timer = setTimeout(tick, 300);
            }, 180);
          }, 180);
        } else if (cycle === 17) {
          // Sniff
          setFrame(4);
          timer = setTimeout(() => {
            setFrame(0);
            timer = setTimeout(tick, 300);
          }, 250);
        } else {
          // Normal idle breathing (oscillates 0 and 5 every 800ms)
          setFrame(cycle % 2 === 0 ? 0 : 5);
          timer = setTimeout(tick, 500);
        }
      };

      timer = setTimeout(tick, 400);
    }

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [animation, speed, isReducedMotion]);

  // Resolve palette and traits
  const effectiveSpecies = isSqueektoshi ? 'squeektoshi' : speciesId;
  const p = hybrid
    ? hybrid.traits.palette
    : BASE_PALETTES[effectiveSpecies] || BASE_PALETTES.normal;

  const earShape = hybrid?.traits.earShape || 'round';
  const bodyShape = hybrid?.traits.bodyShape || 'standard';
  const furPattern = hybrid?.traits.furPattern || 'solid';
  const cosmeticMutation = hybrid?.traits.cosmeticMutation || 'none';
  const quantumEffect = hybrid?.traits.quantumEffect || (speciesId === 'plasma' ? 'plasma_glow' : speciesId === 'paradox' ? 'paradox_rings' : 'none');
  const eyeColor = hybrid?.traits.eyeColor || (speciesId === 'glitch' ? '#00f0ff' : speciesId === 'ghost' ? '#64ffda' : '#1b1c22');

  // Base dimensions by body shape
  let baseBodyX = 6, baseBodyY = 8, baseBodyW = 20, baseBodyH = 18, baseBodyRx = 3;
  if (bodyShape === 'chubby') {
    baseBodyX = 5; baseBodyY = 7; baseBodyW = 22; baseBodyH = 19; baseBodyRx = 4;
  } else if (bodyShape === 'sleek') {
    baseBodyX = 7; baseBodyY = 8; baseBodyW = 18; baseBodyH = 18; baseBodyRx = 3;
  } else if (bodyShape === 'round') {
    baseBodyX = 5; baseBodyY = 7; baseBodyW = 22; baseBodyH = 19; baseBodyRx = 8;
  }

  // =========================================================================
  // DYNAMIC POSE GEOMETRY CALCULATION (Pose-Based Procedural Animation)
  // =========================================================================
  const pose = useMemo(() => {
    // RUNNING ANIMATION (6 Frames)
    if (animation === 'running') {
      switch (frame) {
        case 0:
          // Contact 1: Front right forward, rear left back, body elongated
          return {
            bodyX: baseBodyX,
            bodyY: baseBodyY + 1,
            bodyW: baseBodyW + 1,
            bodyH: baseBodyH - 1,
            bodyRx: baseBodyRx,
            pawFrontX: 21,
            pawFrontY: 26,
            pawFrontW: 4,
            pawFrontH: 3,
            pawBackX: 6,
            pawBackY: 24,
            pawBackW: 4,
            pawBackH: 3,
            earYOffset: 1,
            tailY: 21,
            eyeClosed: false,
            snoutYOffset: 1,
            chestOffset: 0
          };
        case 1:
          // Passing 1: Lift / tuck paws, body rises
          return {
            bodyX: baseBodyX,
            bodyY: baseBodyY - 1,
            bodyW: baseBodyW,
            bodyH: baseBodyH + 1,
            bodyRx: baseBodyRx,
            pawFrontX: 18,
            pawFrontY: 24,
            pawFrontW: 3,
            pawFrontH: 3,
            pawBackX: 10,
            pawBackY: 24,
            pawBackW: 3,
            pawBackH: 3,
            earYOffset: -1,
            tailY: 23,
            eyeClosed: false,
            snoutYOffset: -1,
            chestOffset: -1
          };
        case 2:
          // High Flight: Both paws airborne, stretched
          return {
            bodyX: baseBodyX - 1,
            bodyY: baseBodyY - 1,
            bodyW: baseBodyW + 2,
            bodyH: baseBodyH - 1,
            bodyRx: baseBodyRx,
            pawFrontX: 20,
            pawFrontY: 23,
            pawFrontW: 4,
            pawFrontH: 2,
            pawBackX: 7,
            pawBackY: 23,
            pawBackW: 4,
            pawBackH: 2,
            earYOffset: 0,
            tailY: 20,
            eyeClosed: false,
            snoutYOffset: 0,
            chestOffset: 0
          };
        case 3:
          // Contact 2: Opposite paws (front left forward, rear right back)
          return {
            bodyX: baseBodyX,
            bodyY: baseBodyY + 1,
            bodyW: baseBodyW + 1,
            bodyH: baseBodyH - 1,
            bodyRx: baseBodyRx,
            pawFrontX: 19,
            pawFrontY: 26,
            pawFrontW: 4,
            pawFrontH: 3,
            pawBackX: 8,
            pawBackY: 24,
            pawBackW: 4,
            pawBackH: 3,
            earYOffset: 1,
            tailY: 21,
            eyeClosed: false,
            snoutYOffset: 1,
            chestOffset: 0
          };
        case 4:
          // Passing 2: Lift / body rises
          return {
            bodyX: baseBodyX,
            bodyY: baseBodyY - 1,
            bodyW: baseBodyW,
            bodyH: baseBodyH + 1,
            bodyRx: baseBodyRx,
            pawFrontX: 16,
            pawFrontY: 24,
            pawFrontW: 3,
            pawFrontH: 3,
            pawBackX: 12,
            pawBackY: 24,
            pawBackW: 3,
            pawBackH: 3,
            earYOffset: -1,
            tailY: 23,
            eyeClosed: false,
            snoutYOffset: -1,
            chestOffset: -1
          };
        case 5:
        default:
          // Landing / Compression: Paws touch, body compresses
          return {
            bodyX: baseBodyX,
            bodyY: baseBodyY + 2,
            bodyW: baseBodyW + 1,
            bodyH: baseBodyH - 2,
            bodyRx: baseBodyRx,
            pawFrontX: 19,
            pawFrontY: 26,
            pawFrontW: 5,
            pawFrontH: 3,
            pawBackX: 9,
            pawBackY: 26,
            pawBackW: 5,
            pawBackH: 3,
            earYOffset: 1,
            tailY: 22,
            eyeClosed: false,
            snoutYOffset: 1,
            chestOffset: 1
          };
      }
    }

    // SLEEPING ANIMATION (4 Frames - Breathing & Curled Posture)
    if (animation === 'sleeping') {
      const breatheOffset = frame === 1 || frame === 2 ? -1 : 0;
      const breatheWidth = frame === 2 ? 1 : 0;
      return {
        bodyX: baseBodyX - 1,
        bodyY: baseBodyY + 2 + breatheOffset,
        bodyW: baseBodyW + 2 + breatheWidth,
        bodyH: baseBodyH - 2 - breatheOffset,
        bodyRx: baseBodyRx + 2,
        pawFrontX: 17,
        pawFrontY: 25,
        pawFrontW: 4,
        pawFrontH: 3,
        pawBackX: 8,
        pawBackY: 25,
        pawBackW: 4,
        pawBackH: 3,
        earYOffset: 2, // Drooped ears
        tailY: 23,
        eyeClosed: true,
        snoutYOffset: 2,
        chestOffset: breatheOffset
      };
    }

    // IDLE ANIMATION (Blinking, Ear Twitching, Sniffing, Gentle Breathing)
    switch (frame) {
      case 1:
        // Blink
        return {
          bodyX: baseBodyX,
          bodyY: baseBodyY,
          bodyW: baseBodyW,
          bodyH: baseBodyH,
          bodyRx: baseBodyRx,
          pawFrontX: 19,
          pawFrontY: 25,
          pawFrontW: 4,
          pawFrontH: 3,
          pawBackX: 9,
          pawBackY: 25,
          pawBackW: 4,
          pawBackH: 3,
          earYOffset: 0,
          tailY: 22,
          eyeClosed: true,
          snoutYOffset: 0,
          chestOffset: 0
        };
      case 2:
        // Ear twitch left
        return {
          bodyX: baseBodyX,
          bodyY: baseBodyY,
          bodyW: baseBodyW,
          bodyH: baseBodyH,
          bodyRx: baseBodyRx,
          pawFrontX: 19,
          pawFrontY: 25,
          pawFrontW: 4,
          pawFrontH: 3,
          pawBackX: 9,
          pawBackY: 25,
          pawBackW: 4,
          pawBackH: 3,
          earYOffset: -1,
          leftEarOffset: -2,
          tailY: 21,
          eyeClosed: false,
          snoutYOffset: 0,
          chestOffset: 0
        };
      case 3:
        // Ear twitch right
        return {
          bodyX: baseBodyX,
          bodyY: baseBodyY,
          bodyW: baseBodyW,
          bodyH: baseBodyH,
          bodyRx: baseBodyRx,
          pawFrontX: 19,
          pawFrontY: 25,
          pawFrontW: 4,
          pawFrontH: 3,
          pawBackX: 9,
          pawBackY: 25,
          pawBackW: 4,
          pawBackH: 3,
          earYOffset: 0,
          rightEarOffset: -2,
          tailY: 22,
          eyeClosed: false,
          snoutYOffset: 0,
          chestOffset: 0
        };
      case 4:
        // Sniff / Head up
        return {
          bodyX: baseBodyX,
          bodyY: baseBodyY - 1,
          bodyW: baseBodyW,
          bodyH: baseBodyH,
          bodyRx: baseBodyRx,
          pawFrontX: 19,
          pawFrontY: 25,
          pawFrontW: 4,
          pawFrontH: 3,
          pawBackX: 9,
          pawBackY: 25,
          pawBackW: 4,
          pawBackH: 3,
          earYOffset: -1,
          tailY: 21,
          eyeClosed: false,
          snoutYOffset: -1,
          chestOffset: -1
        };
      case 5:
        // Gentle breath expansion
        return {
          bodyX: baseBodyX,
          bodyY: baseBodyY - 1,
          bodyW: baseBodyW,
          bodyH: baseBodyH + 1,
          bodyRx: baseBodyRx,
          pawFrontX: 19,
          pawFrontY: 25,
          pawFrontW: 4,
          pawFrontH: 3,
          pawBackX: 9,
          pawBackY: 25,
          pawBackW: 4,
          pawBackH: 3,
          earYOffset: 0,
          tailY: 22,
          eyeClosed: false,
          snoutYOffset: 0,
          chestOffset: -1
        };
      case 0:
      default:
        // Standard resting idle
        return {
          bodyX: baseBodyX,
          bodyY: baseBodyY,
          bodyW: baseBodyW,
          bodyH: baseBodyH,
          bodyRx: baseBodyRx,
          pawFrontX: 19,
          pawFrontY: 25,
          pawFrontW: 4,
          pawFrontH: 3,
          pawBackX: 9,
          pawBackY: 25,
          pawBackW: 4,
          pawBackH: 3,
          earYOffset: 0,
          tailY: 22,
          eyeClosed: false,
          snoutYOffset: 0,
          chestOffset: 0
        };
    }
  }, [animation, frame, baseBodyX, baseBodyY, baseBodyW, baseBodyH, baseBodyRx]);

  // Direction transform
  const transformStyle = facing === 'left' ? 'scaleX(-1)' : 'none';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: px,
        height: px,
        transform: transformStyle,
        filter:
          speciesId === 'ghost'
            ? `drop-shadow(0 0 8px ${p.glow}) opacity(${animation === 'sleeping' ? 0.65 : 0.88})`
            : `drop-shadow(0 4px 8px ${p.glow})`
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width={px}
        height={px}
        style={{ imageRendering: 'pixelated' }}
        className="overflow-visible"
      >
        {/* Quantum / Species Aura */}
        {(quantumEffect === 'plasma_glow' || speciesId === 'plasma') && (
          <circle cx="16" cy="16" r={animation === 'sleeping' ? '12' : '15'} fill={p.glow} opacity={animation === 'sleeping' ? 0.3 : 0.6} />
        )}
        {(quantumEffect === 'paradox_rings' || speciesId === 'paradox') && (
          <ellipse
            cx="16"
            cy="16"
            rx="15"
            ry="6"
            fill="none"
            stroke={p.accent}
            strokeWidth="1"
            strokeDasharray="3 2"
            transform={`rotate(${animation === 'running' ? frame * 30 : -20} 16 16)`}
          />
        )}

        {/* Energy Wings Cosmetic Mutation */}
        {cosmeticMutation === 'energy_wings' && (
          <g opacity="0.85" transform={`translate(0, ${pose.snoutYOffset})`}>
            <path
              d={animation === 'running' && frame % 2 === 0 ? "M4 12 Q0 6 3 3 Q7 6 6 13 Z" : "M4 14 Q0 10 3 6 Q7 8 6 15 Z"}
              fill={p.accent}
            />
            <path
              d={animation === 'running' && frame % 2 === 0 ? "M28 12 Q32 6 29 3 Q25 6 26 13 Z" : "M28 14 Q32 10 29 6 Q25 8 26 15 Z"}
              fill={p.accent}
            />
          </g>
        )}

        {/* Floating Orbs Cosmetic Mutation */}
        {cosmeticMutation === 'floating_orbs' && (
          <g transform={`translate(0, ${pose.snoutYOffset})`}>
            <circle cx="3" cy={11 + (frame % 2)} r="2" fill={p.accent} />
            <circle cx="29" cy={18 - (frame % 2)} r="2" fill={p.light} />
          </g>
        )}

        {/* Tail */}
        {cosmeticMutation === 'crystal_tail' ? (
          <polygon points={`4,${pose.tailY} 1,${pose.tailY - 2} 4,${pose.tailY - 4} 7,${pose.tailY - 2}`} fill={p.accent} />
        ) : (
          <circle cx="5" cy={pose.tailY} r="2.5" fill={p.body} />
        )}

        {/* Ears */}
        {earShape === 'antenna' ? (
          <g transform={`translate(0, ${pose.earYOffset})`}>
            <line x1="9" y1="9" x2="6" y2="3" stroke={p.dark} strokeWidth="1.5" />
            <circle cx="6" cy="3" r="1.5" fill={p.accent} />
            <line x1="23" y1="9" x2="26" y2="3" stroke={p.dark} strokeWidth="1.5" />
            <circle cx="26" cy="3" r="1.5" fill={p.accent} />
          </g>
        ) : earShape === 'quantum_rings' ? (
          <g transform={`translate(0, ${pose.earYOffset})`}>
            <rect x="7" y="4" width="4" height="5" fill={p.dark} rx="1" />
            <circle cx="9" cy="4" r="2.5" fill="none" stroke={p.accent} strokeWidth="1" />
            <rect x="21" y="4" width="4" height="5" fill={p.dark} rx="1" />
            <circle cx="23" cy="4" r="2.5" fill="none" stroke={p.accent} strokeWidth="1" />
          </g>
        ) : earShape === 'tufted' ? (
          <g transform={`translate(0, ${pose.earYOffset})`}>
            <polygon points="7,9 9,2 11,9" fill={p.dark} />
            <polygon points="8,8 9,4 10,8" fill={p.accent} />
            <polygon points="21,9 23,2 25,9" fill={p.dark} />
            <polygon points="22,8 23,4 24,8" fill={p.accent} />
          </g>
        ) : earShape === 'folded' ? (
          <g transform={`translate(0, ${pose.earYOffset})`}>
            <rect x="7" y="6" width="5" height="3" fill={p.dark} rx="1" />
            <rect x="20" y="6" width="5" height="3" fill={p.dark} rx="1" />
          </g>
        ) : (
          <g>
            {/* Left Ear */}
            <g transform={`translate(0, ${pose.earYOffset + (pose.leftEarOffset || 0)})`}>
              <rect x="7" y="4" width="4" height="5" fill={p.dark} rx="1" />
              <rect x="8" y="5" width="2" height="3" fill={p.accent} />
            </g>
            {/* Right Ear */}
            <g transform={`translate(0, ${pose.earYOffset + (pose.rightEarOffset || 0)})`}>
              <rect x="21" y="4" width="4" height="5" fill={p.dark} rx="1" />
              <rect x="22" y="5" width="2" height="3" fill={p.accent} />
            </g>
          </g>
        )}

        {/* Tiny Horns Cosmetic Mutation */}
        {cosmeticMutation === 'tiny_horns' && (
          <g fill={p.accent} transform={`translate(0, ${pose.earYOffset})`}>
            <polygon points="11,8 10,4 12,7" />
            <polygon points="21,8 22,4 20,7" />
          </g>
        )}

        {/* Body Main */}
        <rect
          x={pose.bodyX}
          y={pose.bodyY}
          width={pose.bodyW}
          height={pose.bodyH}
          fill={p.body}
          rx={pose.bodyRx}
        />

        {/* Fur Patterns */}
        {furPattern === 'split_half' && (
          <rect
            x={pose.bodyX + pose.bodyW / 2}
            y={pose.bodyY}
            width={pose.bodyW / 2}
            height={pose.bodyH}
            fill={p.dark}
            rx={pose.bodyRx}
          />
        )}

        {furPattern === 'striped' && (
          <g fill={p.dark}>
            <rect x={pose.bodyX + 2} y={pose.bodyY + 3} width={pose.bodyW - 4} height="2" />
            <rect x={pose.bodyX + 2} y={pose.bodyY + 7} width={pose.bodyW - 4} height="2" />
            <rect x={pose.bodyX + 2} y={pose.bodyY + 11} width={pose.bodyW - 4} height="2" />
          </g>
        )}

        {furPattern === 'spotted' && (
          <g fill={p.dark}>
            <circle cx={pose.bodyX + 4} cy={pose.bodyY + 4} r="2" />
            <circle cx={pose.bodyX + pose.bodyW - 4} cy={pose.bodyY + 6} r="2" />
            <circle cx={pose.bodyX + 5} cy={pose.bodyY + 12} r="1.5" />
          </g>
        )}

        {furPattern === 'circuit_marks' && (
          <g stroke={p.accent} strokeWidth="1" fill="none">
            <path d={`M${pose.bodyX + 2} 12 L12 12 L14 16 L14 20`} />
            <circle cx="14" cy="20" r="1" fill={p.accent} />
            <path d={`M${pose.bodyX + pose.bodyW - 2} 12 L20 12 L18 16`} />
          </g>
        )}

        {furPattern === 'quantum_swirl' && (
          <path
            d={`M${pose.bodyX + 3} ${pose.bodyY + 5} Q16 12 ${pose.bodyX + pose.bodyW - 3} ${pose.bodyY + 14}`}
            stroke={p.light}
            strokeWidth="2"
            fill="none"
          />
        )}

        {furPattern === 'void_nebula' && (
          <g>
            <circle cx={pose.bodyX + 4} cy={pose.bodyY + 4} r="1" fill="#fff" />
            <circle cx={pose.bodyX + pose.bodyW - 5} cy={pose.bodyY + 7} r="1" fill="#fff" />
            <circle cx="16" cy="18" r="1" fill="#fff" />
            <path d={`M${pose.bodyX + 2} ${pose.bodyY + 10} Q16 16 ${pose.bodyX + pose.bodyW - 2} ${pose.bodyY + 8}`} stroke={p.accent} strokeWidth="1.5" fill="none" opacity="0.7" />
          </g>
        )}

        {/* Forehead / Light Crest */}
        <rect x={pose.bodyX + 2} y={pose.bodyY + 1} width={pose.bodyW - 4} height="4" fill={p.light} opacity="0.6" />

        {/* Cheeks */}
        <rect x={pose.bodyX - 1} y={14 + pose.snoutYOffset} width="3" height="6" fill={p.light} rx="1" />
        <rect x={pose.bodyX + pose.bodyW - 2} y={14 + pose.snoutYOffset} width="3" height="6" fill={p.light} rx="1" />

        {/* Belly / Chest */}
        <rect x="10" y={16 + pose.chestOffset} width="12" height="9" fill={p.light} rx="2" />

        {/* Lab Coat & Tie (Mad Scientist Assistant) */}
        {hasLabCoat && (
          <g>
            {/* White Coat Main Body */}
            <path
              d={`M${pose.bodyX + 1} ${15 + pose.chestOffset} L${pose.bodyX + pose.bodyW - 1} ${15 + pose.chestOffset} L${pose.bodyX + pose.bodyW} ${pose.bodyY + pose.bodyH} L${pose.bodyX} ${pose.bodyY + pose.bodyH} Z`}
              fill="#f8fafc"
            />
            {/* Lapels */}
            <line x1={pose.bodyX + 3} y1={15 + pose.chestOffset} x2="15" y2={20 + pose.chestOffset} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={pose.bodyX + pose.bodyW - 3} y1={15 + pose.chestOffset} x2="17" y2={20 + pose.chestOffset} stroke="#cbd5e1" strokeWidth="1" />
            {/* Black Tie / Bow */}
            <path
              d={`M15 ${15 + pose.chestOffset} L17 ${15 + pose.chestOffset} L16.5 ${19 + pose.chestOffset} L15.5 ${19 + pose.chestOffset} Z`}
              fill="#0f172a"
            />
            <polygon
              points={`16,${19 + pose.chestOffset} 17.5,${22 + pose.chestOffset} 16,${24 + pose.chestOffset} 14.5,${22 + pose.chestOffset}`}
              fill="#0f172a"
            />
            {/* Small Breast Pocket & Blue Pen */}
            <rect x={pose.bodyX + 2} y={19 + pose.chestOffset} width="3" height="2" fill="#e2e8f0" />
            <line x1={pose.bodyX + 3} y1={18 + pose.chestOffset} x2={pose.bodyX + 3} y2={20 + pose.chestOffset} stroke="#3b82f6" strokeWidth="0.8" />
          </g>
        )}

        {/* Eyes (Open vs Closed Sleeping Line / Blink) */}
        {pose.eyeClosed ? (
          <g>
            {/* Curved closed eye slits */}
            <path d="M10 13 Q11.5 15 13 13" stroke="#1b1c22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M19 13 Q20.5 15 22 13" stroke="#1b1c22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          <g transform={`translate(0, ${pose.snoutYOffset})`}>
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
                <rect x="10" y="12" width="3" height="3" fill={eyeColor} rx="0.5" />
                <rect x="10" y="12" width="1" height="1" fill="#ffffff" />
                <rect x="19" y="12" width="3" height="3" fill={eyeColor} rx="0.5" />
                <rect x="19" y="12" width="1" height="1" fill="#ffffff" />
              </>
            )}
          </g>
        )}

        {/* Third Eye Cosmetic Mutation */}
        {cosmeticMutation === 'third_eye' && (
          <g transform={`translate(0, ${pose.snoutYOffset})`}>
            {pose.eyeClosed ? (
              <path d="M15 10 Q16 11.5 17 10" stroke="#1b1c22" strokeWidth="1" fill="none" />
            ) : (
              <>
                <circle cx="16" cy="10" r="1.8" fill={eyeColor} />
                <circle cx="16" cy="10" r="0.6" fill="#ffffff" />
              </>
            )}
          </g>
        )}

        {/* Snout & Nose */}
        <g transform={`translate(0, ${pose.snoutYOffset})`}>
          <rect x="15" y="15" width="2" height="2" fill={p.accent} />
          <rect x="14" y="17" width="4" height="1" fill={p.dark} />
        </g>

        {/* Paws (Alternating Front / Back positions) */}
        <rect
          x={pose.pawBackX}
          y={pose.pawBackY}
          width={pose.pawBackW}
          height={pose.pawBackH}
          fill={p.dark}
          rx="1"
        />
        <rect
          x={pose.pawFrontX}
          y={pose.pawFrontY}
          width={pose.pawFrontW}
          height={pose.pawFrontH}
          fill={p.dark}
          rx="1"
        />

        {/* Species Quirks */}
        {speciesId === 'electric' && (
          <g>
            <path d="M14 6 L18 6 L15 10 L19 10 L13 16" stroke="#fff" strokeWidth="1" fill="none" />
            {animation === 'running' && (
              <g fill="#ffeb3b">
                <rect x={pose.pawFrontX + 2} y={pose.pawFrontY + 1} width="2" height="2" />
                <rect x={pose.pawBackX - 1} y={pose.pawBackY + 1} width="2" height="2" />
              </g>
            )}
          </g>
        )}

        {speciesId === 'glitch' && (
          <g>
            <rect x={frame % 2 === 0 ? 2 : 3} y="10" width="3" height="2" fill="#00f0ff" />
            <rect x={frame % 2 === 0 ? 27 : 26} y="18" width="4" height="2" fill="#ff3d7f" />
          </g>
        )}

        {/* Star Sparkles Cosmetic Mutation */}
        {cosmeticMutation === 'star_sparkles' && (
          <g fill={p.accent}>
            <path d="M4 8 L5 6 L6 8 L8 9 L6 10 L5 12 L4 10 L2 9 Z" transform="scale(0.5) translate(4, 4)" />
            <path d="M4 8 L5 6 L6 8 L8 9 L6 10 L5 12 L4 10 L2 9 Z" transform="scale(0.5) translate(50, 32)" />
          </g>
        )}

        {/* Sleeping Zzz Floating Particles */}
        {animation === 'sleeping' && (
          <g>
            <text
              x={22 + (frame % 2)}
              y={7 - (frame % 3)}
              fill="#fbbf24"
              fontSize="6"
              fontFamily="Pixelify Sans, monospace"
              fontWeight="bold"
              opacity={0.8}
            >
              z
            </text>
            <text
              x={26 + (frame % 3)}
              y={3 - (frame % 2)}
              fill="#f59e0b"
              fontSize="8"
              fontFamily="Pixelify Sans, monospace"
              fontWeight="bold"
              opacity={0.9}
            >
              Z
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
