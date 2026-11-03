import React from 'react';
import { QuantumHybrid } from '../types/game';

interface PixelHybridHamsterProps {
  hybrid: QuantumHybrid;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  isAnimated?: boolean;
}

export const PixelHybridHamster: React.FC<PixelHybridHamsterProps> = ({
  hybrid,
  size = 'md',
  className = '',
  isAnimated = true
}) => {
  const pixelSizes = {
    sm: 36,
    md: 56,
    lg: 84,
    hero: 130
  };
  const px = pixelSizes[size];

  const { traits, rarity } = hybrid;
  const {
    palette,
    furPattern,
    bodyShape,
    earShape,
    eyeColor,
    quantumEffect,
    cosmeticMutation,
    eyeMutation = 'normal',
    headMutation = 'none',
    limbMutation = 'normal',
    bodyMutation = 'normal',
    tailMutation = 'none',
    auraEffect = 'none'
  } = traits;

  // Determine body dimensions based on morphology
  let bodyX = 6, bodyY = 8, bodyW = 20, bodyH = 18, bodyRx = 3;
  if (bodyShape === 'chubby') {
    bodyX = 5; bodyY = 7; bodyW = 22; bodyH = 19; bodyRx = 4;
  } else if (bodyShape === 'sleek') {
    bodyX = 7; bodyY = 8; bodyW = 18; bodyH = 18; bodyRx = 3;
  } else if (bodyShape === 'round') {
    bodyX = 5; bodyY = 7; bodyW = 22; bodyH = 19; bodyRx = 8;
  }

  // Animation class based on quantum effect / limb state
  let animClass = '';
  if (isAnimated && hybrid.existenceStatus !== 'deceased') {
    if (hybrid.existenceStatus === 'missing') {
      animClass = 'anim-hamster-glitch';
    } else if (limbMutation === 'missing_hind_legs' || auraEffect === 'ghost') {
      animClass = 'anim-hamster-float';
    } else if (auraEffect === 'electric' || quantumEffect === 'spark_halo') {
      animClass = 'anim-hamster-spark';
    } else if (auraEffect === 'glitch' || quantumEffect === 'glitch_flicker') {
      animClass = 'anim-hamster-glitch';
    } else if (auraEffect === 'plasma' || quantumEffect === 'plasma_glow') {
      animClass = 'anim-hamster-aura';
    } else if (auraEffect === 'cosmic' || auraEffect === 'void' || quantumEffect === 'paradox_rings' || quantumEffect === 'cosmic_singularity') {
      animClass = 'anim-hamster-paradox';
    } else {
      animClass = 'anim-hamster-hop';
    }
  }

  // Existence state & container styling
  let containerFilter = `drop-shadow(0 4px 10px ${palette.glow})`;
  let containerExtraClass = '';

  if (hybrid.existenceStatus === 'missing') {
    containerFilter = 'grayscale(0.9) opacity(0.4) contrast(1.2)';
    containerExtraClass = 'animate-pulse';
  } else if (hybrid.existenceStatus === 'deceased') {
    containerFilter = 'grayscale(1) opacity(0.35) contrast(0.6)';
  }

  const isGhostBody = bodyMutation === 'ghost_body';
  const bodyOpacity = isGhostBody ? 0.82 : 1.0;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${containerExtraClass} ${className}`}
      style={{
        width: px,
        height: px,
        filter: containerFilter
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width={px}
        height={px}
        style={{ imageRendering: 'pixelated' }}
        className={animClass}
      >
        {/* ========================================================= */}
        {/* LAYER 0: FAR BACKGROUND AURA / SINGULARITY                */}
        {/* ========================================================= */}
        {(quantumEffect === 'plasma_glow' || quantumEffect === 'cosmic_singularity' || auraEffect === 'plasma') && (
          <circle cx="16" cy="16" r="14.5" fill={palette.glow} opacity="0.55" />
        )}
        {(quantumEffect === 'paradox_rings' || auraEffect === 'cosmic') && (
          <ellipse
            cx="16"
            cy="16"
            rx="15"
            ry="6"
            fill="none"
            stroke={palette.accent}
            strokeWidth="1"
            strokeDasharray="3 2"
            transform="rotate(-20 16 16)"
            opacity="0.8"
          />
        )}
        {auraEffect === 'solar' && (
          <circle cx="16" cy="16" r="15" fill="rgba(255, 215, 0, 0.18)" />
        )}
        {auraEffect === 'ghost' && (
          <g opacity="0.6">
            <circle cx="5" cy="10" r="3" fill="rgba(100, 255, 218, 0.35)" />
            <circle cx="27" cy="20" r="3.5" fill="rgba(100, 255, 218, 0.35)" />
          </g>
        )}
        {auraEffect === 'electric' && (
          <g fill="#ffeb3b">
            <polygon points="3,6 4,4 5,7 6,5 4,8" />
            <polygon points="27,24 28,22 29,25 30,23 28,26" />
          </g>
        )}
        {auraEffect === 'glitch' && (
          <g>
            <rect x="2" y="11" width="2" height="2" fill="#00f0ff" opacity="0.85" />
            <rect x="28" y="7" width="2" height="2" fill="#ff007f" opacity="0.85" />
            <rect x="27" y="24" width="2" height="2" fill="#ffeb3b" opacity="0.85" />
          </g>
        )}
        {auraEffect === 'crystal' && (
          <g fill={palette.accent} opacity="0.85">
            <polygon points="4,7 5,5 6,7 5,9" />
            <polygon points="27,17 28,15 29,17 28,19" />
          </g>
        )}
        {auraEffect === 'void' && (
          <g fill="#581c87" opacity="0.75">
            <polygon points="3,13 5,12 4,15" />
            <polygon points="28,9 30,11 29,12" />
            <polygon points="26,25 28,24 27,27" />
          </g>
        )}

        {/* Floating Orbs Legacy/Cosmic Mutation */}
        {(cosmeticMutation === 'floating_orbs' || auraEffect === 'cosmic') && (
          <g>
            <circle cx="3" cy="11" r="1.8" fill={palette.accent} />
            <circle cx="29" cy="19" r="1.8" fill={palette.light} />
            <circle cx="16" cy="2" r="1.2" fill="#ffffff" />
          </g>
        )}

        {/* ========================================================= */}
        {/* LAYER 1: TAILS & WINGS (BEHIND BODY)                      */}
        {/* ========================================================= */}
        {/* Bat Wings Mutation */}
        {(tailMutation === 'bat_wings' || cosmeticMutation === 'energy_wings') && (
          <g opacity="0.9">
            <path d="M6 14 Q-1 8 2 4 Q6 8 5 15 Z" fill={palette.dark} />
            <path d="M26 14 Q33 8 30 4 Q26 8 27 15 Z" fill={palette.dark} />
            <path d="M4 11 Q1 7 3 5" stroke={palette.accent} strokeWidth="0.8" fill="none" />
            <path d="M28 11 Q31 7 29 5" stroke={palette.accent} strokeWidth="0.8" fill="none" />
          </g>
        )}

        {/* Moth Wings Mutation */}
        {tailMutation === 'moth_wings' && (
          <g opacity="0.75">
            <ellipse cx="4" cy="13" rx="4.5" ry="7" fill={palette.accent} transform="rotate(-15 4 13)" />
            <ellipse cx="28" cy="13" rx="4.5" ry="7" fill={palette.accent} transform="rotate(15 28 13)" />
            <circle cx="4" cy="13" r="1.5" fill="#ffffff" />
            <circle cx="28" cy="13" r="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Tails */}
        {tailMutation === 'crystal_tail' || cosmeticMutation === 'crystal_tail' ? (
          <polygon points="2,24 6,20 4,26" fill={palette.accent} />
        ) : tailMutation === 'glowing_tail' ? (
          <g>
            <circle cx="4" cy="22" r="2.8" fill={palette.accent} />
            <circle cx="4" cy="22" r="1.2" fill="#ffffff" />
          </g>
        ) : tailMutation === 'spectral_tail' ? (
          <path d="M6 22 Q1 25 3 29 Q0 31 2 32" stroke={palette.glow} strokeWidth="2.5" fill="none" opacity="0.8" strokeLinecap="round" />
        ) : tailMutation === 'long_tail' ? (
          <path d="M6 22 Q1 24 2 18 Q3 14 6 15" stroke={palette.body} strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : tailMutation === 'forked_tail' ? (
          <g stroke={palette.body} strokeWidth="1.8" fill="none" strokeLinecap="round">
            <path d="M6 22 Q2 24 1 19" />
            <path d="M6 22 Q1 26 2 29" />
          </g>
        ) : (
          /* Standard Cute Hamster Nub Tail */
          <circle cx="5" cy="22" r="2.5" fill={palette.body} />
        )}

        {/* ========================================================= */}
        {/* LAYER 2: EARS & SECONDARY HEAD STRUCTURES                 */}
        {/* ========================================================= */}
        {/* Extra Ears Mutation (Secondary rear pair) */}
        {headMutation === 'extra_ears' && (
          <g opacity="0.85">
            <rect x="5" y="6" width="3" height="4" fill={palette.dark} rx="1" />
            <rect x="24" y="6" width="3" height="4" fill={palette.dark} rx="1" />
          </g>
        )}

        {/* Primary Ears */}
        {earShape === 'antenna' ? (
          <g>
            <line x1="9" y1="9" x2="6" y2="3" stroke={palette.dark} strokeWidth="1.5" />
            <circle cx="6" cy="3" r="1.5" fill={palette.accent} />
            <line x1="23" y1="9" x2="26" y2="3" stroke={palette.dark} strokeWidth="1.5" />
            <circle cx="26" cy="3" r="1.5" fill={palette.accent} />
          </g>
        ) : earShape === 'quantum_rings' ? (
          <g>
            <rect x="7" y="4" width="4" height="5" fill={palette.dark} rx="1" />
            <rect x="21" y="4" width="4" height="5" fill={palette.dark} rx="1" />
            <circle cx="9" cy="4" r="3" fill="none" stroke={palette.accent} strokeWidth="1" />
            <circle cx="23" cy="4" r="3" fill="none" stroke={palette.accent} strokeWidth="1" />
          </g>
        ) : earShape === 'tufted' ? (
          <g>
            <polygon points="6,9 8,2 11,9" fill={palette.dark} />
            <polygon points="7,8 8,4 10,8" fill={palette.accent} />
            <polygon points="21,9 24,2 26,9" fill={palette.dark} />
            <polygon points="22,8 24,4 25,8" fill={palette.accent} />
          </g>
        ) : earShape === 'folded' ? (
          <g>
            <rect x="7" y="6" width="4" height="3" fill={palette.dark} rx="1" />
            <rect x="21" y="6" width="4" height="3" fill={palette.dark} rx="1" />
          </g>
        ) : (
          <g>
            <rect x="7" y="4" width="4" height="5" fill={palette.dark} rx="1" />
            <rect x="8" y="5" width="2" height="3" fill={palette.accent} />
            <rect x="21" y="4" width="4" height="5" fill={palette.dark} rx="1" />
            <rect x="22" y="5" width="2" height="3" fill={palette.accent} />
          </g>
        )}

        {/* ========================================================= */}
        {/* LAYER 3: MAIN BODY SILHOUETTE & FLUFF                     */}
        {/* ========================================================= */}
        {/* Extra Fluffy Cheek/Side Tufts */}
        {bodyMutation === 'extra_fluffy' && (
          <g fill={palette.body} opacity={bodyOpacity}>
            <polygon points="5,15 2,17 5,19" />
            <polygon points="27,15 30,17 27,19" />
            <polygon points="6,21 3,23 6,24" />
            <polygon points="26,21 29,23 26,24" />
          </g>
        )}

        {/* Main Body Rectangle */}
        <rect
          x={bodyX}
          y={bodyY}
          width={bodyW}
          height={bodyH}
          fill={palette.body}
          rx={bodyRx}
          opacity={bodyOpacity}
        />

        {/* Fur Patterns */}
        {furPattern === 'split_half' && (
          <rect
            x={bodyX + bodyW / 2}
            y={bodyY}
            width={bodyW / 2}
            height={bodyH}
            fill={palette.dark}
            rx={bodyRx}
            opacity={bodyOpacity}
          />
        )}

        {furPattern === 'striped' && (
          <g fill={palette.dark} opacity={bodyOpacity}>
            <rect x={bodyX + 2} y={bodyY + 3} width={bodyW - 4} height="2" />
            <rect x={bodyX + 2} y={bodyY + 7} width={bodyW - 4} height="2" />
            <rect x={bodyX + 2} y={bodyY + 11} width={bodyW - 4} height="2" />
          </g>
        )}

        {furPattern === 'spotted' && (
          <g fill={palette.dark} opacity={bodyOpacity}>
            <circle cx={bodyX + 4} cy={bodyY + 4} r="2" />
            <circle cx={bodyX + bodyW - 4} cy={bodyY + 6} r="2" />
            <circle cx={bodyX + 5} cy={bodyY + 12} r="1.5" />
          </g>
        )}

        {furPattern === 'circuit_marks' && (
          <g stroke={palette.accent} strokeWidth="1" fill="none" opacity={bodyOpacity}>
            <path d="M8 12 L12 12 L14 16 L14 20" />
            <circle cx="14" cy="20" r="1" fill={palette.accent} />
            <path d="M24 12 L20 12 L18 16" />
          </g>
        )}

        {furPattern === 'quantum_swirl' && (
          <path
            d={`M${bodyX + 3} ${bodyY + 5} Q16 12 ${bodyX + bodyW - 3} ${bodyY + 14}`}
            stroke={palette.light}
            strokeWidth="2.5"
            fill="none"
            opacity={bodyOpacity}
          />
        )}

        {furPattern === 'void_nebula' && (
          <g opacity={bodyOpacity}>
            <circle cx={bodyX + 4} cy={bodyY + 4} r="1" fill="#fff" />
            <circle cx={bodyX + bodyW - 5} cy={bodyY + 7} r="1" fill="#fff" />
            <circle cx="16" cy="18" r="1" fill="#fff" />
            <path d={`M${bodyX + 2} ${bodyY + 10} Q16 16 ${bodyX + bodyW - 2} ${bodyY + 8}`} stroke={palette.accent} strokeWidth="1.5" fill="none" opacity="0.7" />
          </g>
        )}

        {/* Crystal Patches Body Mutation */}
        {bodyMutation === 'crystal_patches' && (
          <g fill={palette.accent} opacity="0.9">
            <polygon points="8,10 10,8 11,11 9,12" />
            <polygon points="22,18 24,16 25,19 23,20" />
          </g>
        )}

        {/* Glitch Fur Body Mutation */}
        {bodyMutation === 'glitch_fur' && (
          <g opacity="0.85">
            <rect x="8" y="16" width="3" height="2" fill="#ff007f" />
            <rect x="22" y="10" width="2" height="3" fill="#00f0ff" />
            <rect x="14" y="22" width="4" height="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Forehead / Light Crest */}
        <rect x={bodyX + 2} y={bodyY + 1} width={bodyW - 4} height="4" fill={palette.light} opacity="0.6" />

        {/* Cheeks */}
        <rect x={bodyX - 1} y={14} width="3" height="6" fill={palette.light} rx="1" opacity={bodyOpacity} />
        <rect x={bodyX + bodyW - 2} y={14} width="3" height="6" fill={palette.light} rx="1" opacity={bodyOpacity} />

        {/* Belly / Chest */}
        <rect x="10" y="16" width="12" height="9" fill={palette.light} rx="2" opacity={bodyOpacity} />

        {/* ========================================================= */}
        {/* LAYER 4: HORNS, ANTLERS & HEAD MUTATIONS                  */}
        {/* ========================================================= */}
        {/* Single Unicorn Horn */}
        {headMutation === 'single_horn' && (
          <g>
            <polygon points="15,8 16,1 17,8" fill={palette.accent} />
            <polygon points="15.5,7 16,2 16.5,7" fill="#ffffff" opacity="0.7" />
          </g>
        )}

        {/* Two Horns */}
        {(headMutation === 'two_horns' || cosmeticMutation === 'tiny_horns') && (
          <g fill={palette.accent}>
            <polygon points="11,8 9,2 12,6" />
            <polygon points="21,8 23,2 20,6" />
          </g>
        )}

        {/* Crystal Horns */}
        {headMutation === 'crystal_horns' && (
          <g>
            <polygon points="11,8 9,2 13,6" fill={palette.accent} opacity="0.9" />
            <polygon points="21,8 23,2 19,6" fill={palette.accent} opacity="0.9" />
            <polygon points="15,7 16,3 17,7" fill="#ffffff" opacity="0.8" />
          </g>
        )}

        {/* Small Antlers */}
        {headMutation === 'small_antlers' && (
          <g stroke={palette.dark} strokeWidth="1.2" strokeLinecap="round" fill="none">
            <path d="M10 8 L9 3 M9 5 L7 4 M9 3 L8 1" />
            <path d="M22 8 L23 3 M23 5 L25 4 M23 3 L24 1" />
          </g>
        )}

        {/* Quantum Antennae Head Mutation */}
        {headMutation === 'quantum_antennae' && (
          <g>
            <line x1="11" y1="8" x2="8" y2="2" stroke={palette.dark} strokeWidth="1.2" />
            <circle cx="8" cy="2" r="1.5" fill={palette.accent} />
            <line x1="21" y1="8" x2="24" y2="2" stroke={palette.dark} strokeWidth="1.2" />
            <circle cx="24" cy="2" r="1.5" fill={palette.accent} />
          </g>
        )}

        {/* ========================================================= */}
        {/* LAYER 5: EYES & FACIAL ARRANGEMENT                        */}
        {/* ========================================================= */}
        {/* 1. CYCLOPS (ONE GIANT CENTRAL EYE) */}
        {eyeMutation === 'cyclops' ? (
          <g>
            {/* Sclera & Iris */}
            <circle cx="16" cy="12" r="3.2" fill="#ffffff" />
            <circle cx="16" cy="12" r="2.5" fill={eyeColor} />
            <circle cx="16" cy="12" r="1.3" fill="#0f1117" />
            {/* Anime Sparkle Highlights */}
            <circle cx="15.2" cy="11.2" r="0.9" fill="#ffffff" />
            <circle cx="16.9" cy="12.9" r="0.45" fill="#ffffff" />
          </g>
        ) : eyeMutation === 'five_eyed' ? (
          /* 2. FIVE-EYED (5 SMALL CUTE EYES IN FACIAL ARC) */
          <g>
            {/* Eye 1 (Leftmost) */}
            <circle cx="9" cy="13.2" r="1.3" fill={eyeColor} />
            <circle cx="8.8" cy="13" r="0.4" fill="#ffffff" />
            {/* Eye 2 (Mid-left) */}
            <circle cx="12" cy="11.6" r="1.5" fill={eyeColor} />
            <circle cx="11.8" cy="11.3" r="0.5" fill="#ffffff" />
            {/* Eye 3 (Center Top) */}
            <circle cx="16" cy="10.4" r="1.6" fill={eyeColor} />
            <circle cx="15.7" cy="10.1" r="0.5" fill="#ffffff" />
            {/* Eye 4 (Mid-right) */}
            <circle cx="20" cy="11.6" r="1.5" fill={eyeColor} />
            <circle cx="19.8" cy="11.3" r="0.5" fill="#ffffff" />
            {/* Eye 5 (Rightmost) */}
            <circle cx="23" cy="13.2" r="1.3" fill={eyeColor} />
            <circle cx="22.8" cy="13" r="0.4" fill="#ffffff" />
          </g>
        ) : eyeMutation === 'heterochromia' ? (
          /* 3. HETEROCHROMIA (TWO DIFFERENT VIVID HUES) */
          <g>
            {/* Left Eye: Vivid Accent Color */}
            <rect x="10" y="12" width="3" height="3" fill={palette.accent} rx="0.5" />
            <rect x="10" y="12" width="1" height="1" fill="#ffffff" />
            {/* Right Eye: Standard / Contrasting Eye Color */}
            <rect x="19" y="12" width="3" height="3" fill={eyeColor} rx="0.5" />
            <rect x="19" y="12" width="1" height="1" fill="#ffffff" />
          </g>
        ) : eyeMutation === 'glowing_eyes' ? (
          /* 4. GLOWING EYES (PURE WHITE CORES WITH NEON DROPSHADOW) */
          <g filter={`drop-shadow(0 0 2px ${palette.accent})`}>
            <circle cx="11.5" cy="13.5" r="1.8" fill="#ffffff" />
            <circle cx="20.5" cy="13.5" r="1.8" fill="#ffffff" />
          </g>
        ) : (
          /* 5. STANDARD DUAL EYES (WITH OPTIONAL THIRD EYE) */
          <g>
            <rect x="10" y="12" width="3" height="3" fill={eyeColor} rx="0.5" />
            <rect x="10" y="12" width="1" height="1" fill="#ffffff" />
            <rect x="19" y="12" width="3" height="3" fill={eyeColor} rx="0.5" />
            <rect x="19" y="12" width="1" height="1" fill="#ffffff" />

            {/* Third Eye Mutation / Cosmetic */}
            {(eyeMutation === 'tri_eye' || cosmeticMutation === 'third_eye') && (
              <g>
                <circle cx="16" cy="9.5" r="1.8" fill={eyeColor} />
                <circle cx="15.8" cy="9.2" r="0.6" fill="#ffffff" />
              </g>
            )}
          </g>
        )}

        {/* Snout & Nose (Always preserved for cuteness) */}
        <rect x="15" y="15" width="2" height="2" fill={palette.accent} />
        <rect x="14" y="17" width="4" height="1" fill={palette.dark} />

        {/* ========================================================= */}
        {/* LAYER 6: PAWS & LIMBS                                     */}
        {/* ========================================================= */}
        {/* Floating Hindquarters (NO REAR PAWS) */}
        {limbMutation === 'missing_hind_legs' ? (
          <g>
            {/* Gentle wispy floating cloud / spectral vapor supporting the body */}
            <path
              d="M8 24 Q12 28 16 25 Q20 28 24 24 Q21 28.5 16 27.5 Q11 28.5 8 24 Z"
              fill={palette.glow}
              opacity="0.8"
            />
            <circle cx="12" cy="27.5" r="1" fill={palette.accent} opacity="0.7" />
            <circle cx="20" cy="27.5" r="1" fill={palette.accent} opacity="0.7" />
          </g>
        ) : limbMutation === 'oversized_paws' ? (
          /* Oversized Big Fluffy Paws */
          <g fill={palette.dark}>
            <rect x="7" y="24" width="6" height="4" rx="2" />
            <rect x="19" y="24" width="6" height="4" rx="2" />
            <circle cx="8.5" cy="24.5" r="0.6" fill="#ffffff" opacity="0.5" />
            <circle cx="20.5" cy="24.5" r="0.6" fill="#ffffff" opacity="0.5" />
          </g>
        ) : (
          /* Normal Paws */
          <g fill={palette.dark}>
            <rect x="9" y="25" width="4" height="3" rx="1" />
            <rect x="19" y="25" width="4" height="3" rx="1" />
          </g>
        )}

        {/* Tiny Forepaws Mutation (Resting cute paws on chest) */}
        {limbMutation === 'tiny_forepaws' && (
          <g fill={palette.dark}>
            <circle cx="13" cy="18" r="1.2" />
            <circle cx="19" cy="18" r="1.2" />
          </g>
        )}

        {/* Star Sparkles Legacy Mutation */}
        {cosmeticMutation === 'star_sparkles' && (
          <g fill={palette.accent}>
            <path d="M4 8 L5 6 L6 8 L8 9 L6 10 L5 12 L4 10 L2 9 Z" transform="scale(0.5) translate(4, 4)" />
            <path d="M4 8 L5 6 L6 8 L8 9 L6 10 L5 12 L4 10 L2 9 Z" transform="scale(0.5) translate(50, 32)" />
          </g>
        )}
      </svg>
    </div>
  );
};
