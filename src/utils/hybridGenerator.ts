import {
  HybridRarity,
  FurPattern,
  BodyShape,
  EarShape,
  QuantumEffect,
  CosmeticMutation,
  EyeMutation,
  HeadMutation,
  LimbMutation,
  BodyMutation,
  TailMutation,
  AuraEffect,
  HybridCosmeticTraits,
  QuantumHybrid,
  HybridPalette,
  HamsterPersonality,
  HAMSTER_PERSONALITIES,
  HYBRID_RARITY_WEIGHTS
} from '../types/game';

// Base Species Palettes for Inheritance
export const BASE_PALETTES: Record<string, HybridPalette> = {
  normal: {
    body: '#e69a47',
    dark: '#b36d24',
    light: '#f5c48b',
    accent: '#ff8a8a',
    glow: 'rgba(230, 154, 71, 0.3)'
  },
  electric: {
    body: '#ffdc33',
    dark: '#d4a400',
    light: '#fff299',
    accent: '#ff5722',
    glow: 'rgba(255, 220, 51, 0.55)'
  },
  ghost: {
    body: '#88d9f7',
    dark: '#4fa3c7',
    light: '#c8f0ff',
    accent: '#64ffda',
    glow: 'rgba(100, 255, 218, 0.5)'
  },
  glitch: {
    body: '#ff3d7f',
    dark: '#b3104c',
    light: '#00f0ff',
    accent: '#ffeb3b',
    glow: 'rgba(255, 61, 127, 0.55)'
  },
  plasma: {
    body: '#b537f2',
    dark: '#6f0ba8',
    light: '#f188ff',
    accent: '#ff4081',
    glow: 'rgba(181, 55, 242, 0.55)'
  },
  paradox: {
    body: '#a1ff0a',
    dark: '#4e9900',
    light: '#e1ff80',
    accent: '#b388ff',
    glow: 'rgba(161, 255, 10, 0.6)'
  }
};

/**
 * Deterministic PRNG using Mulberry32
 */
export function createPrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Helper to interpolate hex colors
 */
function interpolateHex(hex1: string, hex2: string, ratio: number): string {
  const c1 = parseInt(hex1.replace('#', ''), 16);
  const c2 = parseInt(hex2.replace('#', ''), 16);

  const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Roll hybrid rarity according to configured probabilities
 */
export function rollHybridRarity(rand: () => number): HybridRarity {
  const r = rand();
  if (r < 0.005) return 'mythic';      // 0.5%
  if (r < 0.030) return 'legendary';   // 2.5%
  if (r < 0.100) return 'epic';        // 7%
  if (r < 0.250) return 'rare';        // 15%
  if (r < 0.500) return 'uncommon';    // 25%
  return 'common';                     // 50%
}

/**
 * Procedural Naming Engine: Generates cute, science-infused, mutation-aware creature names
 */
export function generateProceduralHybridName(
  traits: HybridCosmeticTraits,
  p1: string,
  p2: string,
  rarity: HybridRarity,
  rand: () => number
): { baseName: string; fullDisplayName: string } {
  // 1. Identify primary prefix candidates based on strongest visible mutation
  let prefixCandidates: string[] = [];

  if (traits.eyeMutation === 'cyclops') {
    prefixCandidates = ['Mono', 'Cyclo', 'Eye', 'Iris'];
  } else if (traits.eyeMutation === 'five_eyed') {
    prefixCandidates = ['Hex', 'Poly', 'Blink', 'Penta'];
  } else if (traits.eyeMutation === 'tri_eye') {
    prefixCandidates = ['Tri', 'Omni', 'Third'];
  } else if (traits.headMutation === 'crystal_horns') {
    prefixCandidates = ['Glim', 'Crystal', 'Shard', 'Gem'];
  } else if (traits.headMutation === 'two_horns') {
    prefixCandidates = ['Thorn', 'Horn', 'Spike'];
  } else if (traits.headMutation === 'single_horn') {
    prefixCandidates = ['Uni', 'Spire', 'Point'];
  } else if (traits.headMutation === 'small_antlers') {
    prefixCandidates = ['Antler', 'Branch', 'Moss'];
  } else if (traits.limbMutation === 'missing_hind_legs') {
    prefixCandidates = ['Drift', 'Hover', 'Float', 'Aero'];
  } else if (traits.tailMutation === 'bat_wings' || traits.cosmeticMutation === 'energy_wings') {
    prefixCandidates = ['Wing', 'Bat', 'Flutter'];
  } else if (traits.tailMutation === 'moth_wings') {
    prefixCandidates = ['Moth', 'Fae', 'Silk'];
  } else if (traits.auraEffect === 'electric') {
    prefixCandidates = ['Volt', 'Zap', 'Spark', 'Jolt'];
  } else if (traits.auraEffect === 'ghost' || traits.bodyMutation === 'ghost_body') {
    prefixCandidates = ['Wisp', 'Boo', 'Shade', 'Ghost'];
  } else if (traits.auraEffect === 'glitch' || traits.bodyMutation === 'glitch_fur') {
    prefixCandidates = ['Glitch', 'Byte', 'Pixel', 'Bug'];
  } else if (traits.auraEffect === 'plasma') {
    prefixCandidates = ['Nova', 'Plasma', 'Flux', 'Solar'];
  } else if (traits.auraEffect === 'cosmic' || traits.auraEffect === 'void') {
    prefixCandidates = ['Void', 'Nebu', 'Astral', 'Cosmo'];
  } else if (traits.auraEffect === 'crystal') {
    prefixCandidates = ['Glim', 'Shard', 'Diamond'];
  } else if (traits.bodyMutation === 'extra_fluffy') {
    prefixCandidates = ['Floof', 'Cloud', 'Cotton', 'Puff'];
  }

  // Fallback to parent species themed prefixes if no primary mutation prefix
  if (prefixCandidates.length === 0) {
    const parentPrefixes: Record<string, string[]> = {
      normal: ['Syrian', 'Pip', 'Bean', 'Tame'],
      electric: ['Volt', 'Spark', 'Zap', 'Dynamo'],
      ghost: ['Spook', 'Phantom', 'Ethereal', 'Shadow'],
      glitch: ['Pixel', 'Cyber', 'Null', 'Bug'],
      plasma: ['Ion', 'Cosmic', 'Solar', 'Nova'],
      paradox: ['Tachyon', 'Chronos', 'Quantum', 'Nebula']
    };
    const list = parentPrefixes[p1] || parentPrefixes.normal;
    prefixCandidates = [...list];
  }

  // 2. Select cute core suffix
  const cuteSuffixes = [
    'peep', 'nib', 'puff', 'whisk', 'bean', 'mochi',
    'pip', 'squee', 'floof', 'tuft', 'mallow', 'pop',
    'kin', 'bun', 'bit', 'horn', 'ling'
  ];

  // Specific thematic suffix affinities
  if (traits.headMutation === 'crystal_horns' && rand() < 0.4) {
    cuteSuffixes.unshift('horn');
  }
  if (traits.tailMutation === 'bat_wings' && rand() < 0.4) {
    cuteSuffixes.unshift('wing');
  }

  const prefix = prefixCandidates[Math.floor(rand() * prefixCandidates.length)];
  const suffix = cuteSuffixes[Math.floor(rand() * cuteSuffixes.length)];
  const baseName = `${prefix}${suffix}`;

  // 3. Optional honorific titles for high rarity
  let fullDisplayName = baseName;

  if (rarity === 'mythic') {
    const mythicTitles = [
      ', Eye of the Ninth Wave',
      ' the Impossible',
      ' of the Quantum Void',
      ', Herald of the Singularity',
      ' Starweaver'
    ];
    // 75% chance of title on mythic
    if (rand() < 0.75) {
      fullDisplayName = `${baseName}${mythicTitles[Math.floor(rand() * mythicTitles.length)]}`;
    }
  } else if (rarity === 'legendary') {
    const legendaryTitles = [
      ' Prime',
      ' the Unstable',
      ' of the Rift',
      ' Alpha',
      ' the Radiant'
    ];
    // 50% chance of title on legendary
    if (rand() < 0.50) {
      fullDisplayName = `${baseName}${legendaryTitles[Math.floor(rand() * legendaryTitles.length)]}`;
    }
  }

  return { baseName, fullDisplayName };
}

/**
 * Generate deterministic hybrid traits, mutations, and metadata from parent species & seed
 */
export function generateQuantumHybrid(
  playerId: string,
  parent1Species: string,
  parent2Species: string,
  seed: number = Math.floor(Math.random() * 1000000000)
): QuantumHybrid {
  const rand = createPrng(seed);
  const generatorVersion = 2; // Upgraded to v2 with modular mutations & procedural naming

  const p1Palette = BASE_PALETTES[parent1Species] || BASE_PALETTES.normal;
  const p2Palette = BASE_PALETTES[parent2Species] || BASE_PALETTES.normal;

  const rarity = rollHybridRarity(rand);
  const personality: HamsterPersonality = HAMSTER_PERSONALITIES[Math.floor(rand() * HAMSTER_PERSONALITIES.length)];

  // Inheritance blend ratio (e.g. 0.3 = favors parent 1, 0.7 = favors parent 2)
  const blendRatio = 0.25 + rand() * 0.5;

  let bodyColor = interpolateHex(p1Palette.body, p2Palette.body, blendRatio);
  let darkColor = interpolateHex(p1Palette.dark, p2Palette.dark, blendRatio);
  let lightColor = interpolateHex(p1Palette.light, p2Palette.light, blendRatio);
  let accentColor = rand() < 0.5 ? p1Palette.accent : p2Palette.accent;
  let glowColor = rand() < 0.5 ? p1Palette.glow : p2Palette.glow;

  // Mythic and Legendary Color Radiance Mutation
  if (rarity === 'mythic') {
    glowColor = 'rgba(255, 255, 255, 0.85)';
    accentColor = '#ffffff';
  } else if (rarity === 'legendary') {
    glowColor = 'rgba(168, 85, 247, 0.75)';
  }

  // Fur Pattern based on rarity
  let furPattern: FurPattern;
  if (rarity === 'mythic') {
    furPattern = rand() < 0.5 ? 'void_nebula' : 'quantum_swirl';
  } else if (rarity === 'legendary') {
    const choices: FurPattern[] = ['void_nebula', 'quantum_swirl', 'circuit_marks'];
    furPattern = choices[Math.floor(rand() * choices.length)];
  } else if (rarity === 'epic') {
    const choices: FurPattern[] = ['quantum_swirl', 'circuit_marks', 'split_half', 'striped'];
    furPattern = choices[Math.floor(rand() * choices.length)];
  } else if (rarity === 'rare') {
    const choices: FurPattern[] = ['striped', 'split_half', 'spotted', 'circuit_marks'];
    furPattern = choices[Math.floor(rand() * choices.length)];
  } else if (rarity === 'uncommon') {
    const choices: FurPattern[] = ['spotted', 'striped', 'split_half'];
    furPattern = choices[Math.floor(rand() * choices.length)];
  } else {
    furPattern = rand() < 0.5 ? 'solid' : 'spotted';
  }

  // Body Shape
  const bodyShapes: BodyShape[] = ['standard', 'chubby', 'sleek', 'round'];
  const bodyShape = bodyShapes[Math.floor(rand() * bodyShapes.length)];

  // Ear Shape (species influence)
  let earShape: EarShape;
  if (parent1Species === 'glitch' || parent2Species === 'glitch' || rarity === 'legendary') {
    earShape = rand() < 0.4 ? 'antenna' : (rand() < 0.7 ? 'quantum_rings' : 'tufted');
  } else if (parent1Species === 'paradox' || parent2Species === 'paradox') {
    earShape = rand() < 0.5 ? 'quantum_rings' : 'folded';
  } else {
    const standardEars: EarShape[] = ['round', 'tufted', 'folded'];
    earShape = standardEars[Math.floor(rand() * standardEars.length)];
  }

  // Eye Color
  let eyeColor = '#1b1c22';
  if (rarity === 'mythic') {
    eyeColor = '#ffffff';
  } else if (rarity === 'legendary') {
    eyeColor = rand() < 0.5 ? '#00f0ff' : '#ff007f';
  } else if (rarity === 'epic' || rarity === 'rare') {
    const eyePalette = ['#00f0ff', '#ffeb3b', '#64ffda', '#ff4081', '#a1ff0a', '#1b1c22'];
    eyeColor = eyePalette[Math.floor(rand() * eyePalette.length)];
  }

  // Quantum Effect (legacy particle effect)
  let quantumEffect: QuantumEffect = 'none';
  if (rarity === 'mythic') {
    quantumEffect = 'cosmic_singularity';
  } else if (rarity === 'legendary') {
    quantumEffect = rand() < 0.5 ? 'paradox_rings' : 'cosmic_singularity';
  } else if (rarity === 'epic') {
    const effects: QuantumEffect[] = ['glitch_flicker', 'plasma_glow', 'paradox_rings'];
    quantumEffect = effects[Math.floor(rand() * effects.length)];
  } else if (rarity === 'rare') {
    const effects: QuantumEffect[] = ['spark_halo', 'ghost_shimmer', 'glitch_flicker', 'plasma_glow'];
    quantumEffect = effects[Math.floor(rand() * effects.length)];
  } else if (rarity === 'uncommon') {
    const effects: QuantumEffect[] = ['spark_halo', 'ghost_shimmer', 'none'];
    quantumEffect = effects[Math.floor(rand() * effects.length)];
  }

  // ==========================================
  // MODULAR QUANTUM MUTATIONS GENERATION
  // ==========================================
  const activeMutationsList: string[] = [];

  // 1. Eye Mutations
  let eyeMutation: EyeMutation = 'normal';
  const hasParadox = parent1Species === 'paradox' || parent2Species === 'paradox';
  const hasGlitch = parent1Species === 'glitch' || parent2Species === 'glitch';
  const hasElectric = parent1Species === 'electric' || parent2Species === 'electric';

  if (rarity === 'mythic') {
    // Mythic has 50% chance of single giant eye (cyclops) or 5 eyes!
    const roll = rand();
    if (roll < 0.45) eyeMutation = 'cyclops';
    else if (roll < 0.75) eyeMutation = 'five_eyed';
    else eyeMutation = 'glowing_eyes';
  } else if (rarity === 'legendary') {
    const roll = rand();
    if (roll < 0.35) eyeMutation = 'cyclops';
    else if (roll < 0.60) eyeMutation = 'tri_eye';
    else if (roll < 0.85) eyeMutation = 'five_eyed';
    else eyeMutation = 'glowing_eyes';
  } else if (rarity === 'epic') {
    const roll = rand();
    if (hasParadox && roll < 0.35) eyeMutation = 'five_eyed';
    else if (roll < 0.30) eyeMutation = 'tri_eye';
    else if (roll < 0.55) eyeMutation = 'heterochromia';
    else if (roll < 0.75) eyeMutation = 'glowing_eyes';
  } else if (rarity === 'rare') {
    const roll = rand();
    if (hasParadox && roll < 0.25) eyeMutation = 'cyclops';
    else if (roll < 0.25) eyeMutation = 'tri_eye';
    else if (hasGlitch || roll < 0.45) eyeMutation = 'heterochromia';
    else if (hasElectric && roll < 0.65) eyeMutation = 'glowing_eyes';
  } else if (rarity === 'uncommon') {
    if (hasGlitch && rand() < 0.30) eyeMutation = 'heterochromia';
    else if (rand() < 0.15) eyeMutation = 'tri_eye';
  }

  if (eyeMutation === 'cyclops') activeMutationsList.push('ONE EYE');
  else if (eyeMutation === 'five_eyed') activeMutationsList.push('FIVE EYES');
  else if (eyeMutation === 'tri_eye') activeMutationsList.push('THIRD EYE');
  else if (eyeMutation === 'heterochromia') activeMutationsList.push('HETEROCHROMIA');
  else if (eyeMutation === 'glowing_eyes') activeMutationsList.push('GLOWING EYES');

  // 2. Head Mutations (Horns, Antlers, Antennae, Extra Ears)
  let headMutation: HeadMutation = 'none';
  if (rarity === 'mythic') {
    headMutation = rand() < 0.5 ? 'crystal_horns' : 'two_horns';
  } else if (rarity === 'legendary') {
    const roll = rand();
    if (roll < 0.35) headMutation = 'crystal_horns';
    else if (roll < 0.65) headMutation = 'two_horns';
    else if (roll < 0.85) headMutation = 'small_antlers';
    else headMutation = 'single_horn';
  } else if (rarity === 'epic') {
    const roll = rand();
    if (roll < 0.30) headMutation = 'two_horns';
    else if (roll < 0.55) headMutation = 'crystal_horns';
    else if (roll < 0.75) headMutation = 'small_antlers';
    else if (roll < 0.90) headMutation = 'quantum_antennae';
  } else if (rarity === 'rare') {
    const roll = rand();
    if (roll < 0.25) headMutation = 'two_horns';
    else if (roll < 0.45) headMutation = 'single_horn';
    else if (roll < 0.65) headMutation = 'extra_ears';
  } else if (rarity === 'uncommon') {
    const roll = rand();
    if (roll < 0.20) headMutation = 'single_horn';
    else if (roll < 0.35) headMutation = 'extra_ears';
  }

  if (headMutation === 'crystal_horns') activeMutationsList.push('CRYSTAL HORNS');
  else if (headMutation === 'two_horns') activeMutationsList.push('DUAL HORNS');
  else if (headMutation === 'single_horn') activeMutationsList.push('UNICORN HORN');
  else if (headMutation === 'small_antlers') activeMutationsList.push('ANTLERS');
  else if (headMutation === 'quantum_antennae') activeMutationsList.push('ANTENNAE');
  else if (headMutation === 'extra_ears') activeMutationsList.push('FOUR EARS');

  // 3. Limb Mutations (Missing Hind Legs / Floating, Oversized Paws, Tiny Forepaws)
  let limbMutation: LimbMutation = 'normal';
  const hasGhost = parent1Species === 'ghost' || parent2Species === 'ghost';

  if (rarity === 'mythic' || rarity === 'legendary') {
    if (hasGhost || rand() < 0.40) limbMutation = 'missing_hind_legs';
    else if (rand() < 0.35) limbMutation = 'oversized_paws';
  } else if (rarity === 'epic') {
    if (hasGhost && rand() < 0.45) limbMutation = 'missing_hind_legs';
    else if (rand() < 0.30) limbMutation = 'oversized_paws';
    else if (rand() < 0.25) limbMutation = 'tiny_forepaws';
  } else if (rarity === 'rare') {
    if (hasGhost && rand() < 0.35) limbMutation = 'missing_hind_legs';
    else if (rand() < 0.25) limbMutation = 'oversized_paws';
  } else if (rarity === 'uncommon') {
    if (rand() < 0.20) limbMutation = 'tiny_forepaws';
  }

  if (limbMutation === 'missing_hind_legs') activeMutationsList.push('FLOATING BODY');
  else if (limbMutation === 'oversized_paws') activeMutationsList.push('OVERSIZED PAWS');
  else if (limbMutation === 'tiny_forepaws') activeMutationsList.push('TINY FOREPAWS');

  // 4. Body Mutations (Extra Fluffy, Ghost Body, Crystal Patches, Glitch Fur)
  let bodyMutation: BodyMutation = 'normal';
  if (hasGhost && (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') && rand() < 0.50) {
    bodyMutation = 'ghost_body';
  } else if (hasGlitch && rand() < 0.40) {
    bodyMutation = 'glitch_fur';
  } else if ((rarity === 'legendary' || rarity === 'epic') && rand() < 0.35) {
    bodyMutation = 'crystal_patches';
  } else if (rand() < 0.25) {
    bodyMutation = 'extra_fluffy';
  }

  if (bodyMutation === 'ghost_body') activeMutationsList.push('GHOST BODY');
  else if (bodyMutation === 'crystal_patches') activeMutationsList.push('CRYSTAL PATCHES');
  else if (bodyMutation === 'glitch_fur') activeMutationsList.push('GLITCH FUR');
  else if (bodyMutation === 'extra_fluffy') activeMutationsList.push('EXTRA FLUFFY');

  // 5. Tail and Back Mutations (Wings, Tails)
  let tailMutation: TailMutation = 'none';
  const hasPlasma = parent1Species === 'plasma' || parent2Species === 'plasma';

  if (rarity === 'mythic') {
    tailMutation = rand() < 0.6 ? 'bat_wings' : 'moth_wings';
  } else if (rarity === 'legendary') {
    const roll = rand();
    if (roll < 0.40) tailMutation = 'bat_wings';
    else if (roll < 0.70) tailMutation = 'crystal_tail';
    else if (roll < 0.90) tailMutation = 'moth_wings';
  } else if (rarity === 'epic') {
    const roll = rand();
    if (hasPlasma && roll < 0.40) tailMutation = 'bat_wings';
    else if (roll < 0.30) tailMutation = 'crystal_tail';
    else if (hasGhost && roll < 0.60) tailMutation = 'spectral_tail';
    else if (roll < 0.80) tailMutation = 'forked_tail';
  } else if (rarity === 'rare') {
    const roll = rand();
    if (hasElectric && roll < 0.40) tailMutation = 'glowing_tail';
    else if (roll < 0.30) tailMutation = 'long_tail';
    else if (roll < 0.55) tailMutation = 'forked_tail';
  } else if (rarity === 'uncommon') {
    if (rand() < 0.25) tailMutation = 'long_tail';
  }

  if (tailMutation === 'bat_wings') activeMutationsList.push('BAT WINGS');
  else if (tailMutation === 'moth_wings') activeMutationsList.push('MOTH WINGS');
  else if (tailMutation === 'crystal_tail') activeMutationsList.push('CRYSTAL TAIL');
  else if (tailMutation === 'glowing_tail') activeMutationsList.push('GLOWING TAIL');
  else if (tailMutation === 'spectral_tail') activeMutationsList.push('SPECTRAL TAIL');
  else if (tailMutation === 'forked_tail') activeMutationsList.push('FORKED TAIL');
  else if (tailMutation === 'long_tail') activeMutationsList.push('LONG TAIL');

  // 6. Quantum Aura Effect
  let auraEffect: AuraEffect = 'none';
  if (rarity === 'mythic') {
    auraEffect = rand() < 0.5 ? 'cosmic' : 'void';
  } else if (rarity === 'legendary') {
    const roll = rand();
    if (roll < 0.40) auraEffect = 'cosmic';
    else if (roll < 0.70) auraEffect = 'crystal';
    else if (roll < 0.90) auraEffect = 'void';
    else auraEffect = 'solar';
  } else if (rarity === 'epic') {
    const roll = rand();
    if (hasPlasma && roll < 0.45) auraEffect = 'plasma';
    else if (hasElectric && roll < 0.70) auraEffect = 'electric';
    else if (hasGhost && roll < 0.85) auraEffect = 'ghost';
    else if (roll < 0.90) auraEffect = 'solar';
  } else if (rarity === 'rare') {
    const roll = rand();
    if (hasElectric && roll < 0.40) auraEffect = 'electric';
    else if (hasGhost && roll < 0.70) auraEffect = 'ghost';
    else if (hasGlitch && roll < 0.90) auraEffect = 'glitch';
  }

  if (auraEffect === 'electric') activeMutationsList.push('ELECTRIC AURA');
  else if (auraEffect === 'ghost') activeMutationsList.push('GHOST AURA');
  else if (auraEffect === 'plasma') activeMutationsList.push('PLASMA AURA');
  else if (auraEffect === 'glitch') activeMutationsList.push('GLITCH AURA');
  else if (auraEffect === 'cosmic') activeMutationsList.push('COSMIC AURA');
  else if (auraEffect === 'crystal') activeMutationsList.push('CRYSTAL AURA');
  else if (auraEffect === 'solar') activeMutationsList.push('SOLAR AURA');
  else if (auraEffect === 'void') activeMutationsList.push('VOID AURA');

  // Legacy cosmeticMutation mapping for backward-compatibility
  let cosmeticMutation: CosmeticMutation = 'none';
  if (tailMutation === 'bat_wings' || tailMutation === 'moth_wings') cosmeticMutation = 'energy_wings';
  else if (tailMutation === 'crystal_tail') cosmeticMutation = 'crystal_tail';
  else if (headMutation === 'two_horns' || headMutation === 'single_horn' || headMutation === 'crystal_horns') cosmeticMutation = 'tiny_horns';
  else if (eyeMutation === 'tri_eye') cosmeticMutation = 'third_eye';
  else if (auraEffect === 'cosmic' || auraEffect === 'void') cosmeticMutation = 'floating_orbs';

  const traits: HybridCosmeticTraits = {
    palette: {
      body: bodyColor,
      dark: darkColor,
      light: lightColor,
      accent: accentColor,
      glow: glowColor
    },
    furPattern,
    bodyShape,
    earShape,
    eyeColor,
    quantumEffect,
    cosmeticMutation,
    eyeMutation,
    headMutation,
    limbMutation,
    bodyMutation,
    tailMutation,
    auraEffect,
    activeMutations: activeMutationsList
  };

  // Generate unique procedural name matching the creature's actual mutations
  const { fullDisplayName } = generateProceduralHybridName(traits, parent1Species, parent2Species, rarity, rand);
  const discoveredAt = Date.now();
  const id = `hybrid_${playerId}_${discoveredAt}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    playerId,
    generatorVersion,
    seed,
    parent1Species,
    parent2Species,
    nickname: fullDisplayName,
    generatedName: fullDisplayName,
    personality,
    rarity,
    discoveredAt,
    isFavorite: false,
    traits,
    existenceStatus: 'alive',
    missingSince: null,
    expectedReturnAt: null,
    lastFateIncidentAt: null,
    fateHistory: [
      {
        id: `fate_${id}_hatched`,
        hybridId: id,
        type: 'hatched',
        timestamp: discoveredAt,
        title: 'Quantum Genesis',
        description: `Synthesized from ${parent1Species.toUpperCase()} × ${parent2Species.toUpperCase()} in the Quantum Incubator.`
      }
    ]
  };
}

/**
 * Curated Archetype Mutants for Quality Verification (Visual Quality Gate)
 */
export function getCuratedArchetypes(): QuantumHybrid[] {
  const base = generateQuantumHybrid('dev_showcase', 'normal', 'electric', 1001);

  return [
    // 1. One-eyed hamster (Monopeep)
    {
      ...base,
      id: 'arch_01_cyclops',
      nickname: 'Monopeep',
      generatedName: 'Monopeep',
      rarity: 'rare',
      parent1Species: 'glitch',
      parent2Species: 'paradox',
      traits: {
        ...base.traits,
        palette: BASE_PALETTES.paradox,
        eyeMutation: 'cyclops',
        headMutation: 'none',
        limbMutation: 'normal',
        tailMutation: 'none',
        auraEffect: 'none',
        activeMutations: ['ONE EYE']
      }
    },
    // 2. Three-eyed hamster (Triwhisk)
    {
      ...base,
      id: 'arch_02_tri_eye',
      nickname: 'Triwhisk',
      generatedName: 'Triwhisk',
      rarity: 'rare',
      parent1Species: 'ghost',
      parent2Species: 'paradox',
      traits: {
        ...base.traits,
        palette: BASE_PALETTES.ghost,
        eyeMutation: 'tri_eye',
        headMutation: 'none',
        limbMutation: 'normal',
        tailMutation: 'none',
        auraEffect: 'none',
        activeMutations: ['THIRD EYE']
      }
    },
    // 3. Five-eyed hamster (Hexwhisk)
    {
      ...base,
      id: 'arch_03_five_eyed',
      nickname: 'Hexwhisk',
      generatedName: 'Hexwhisk',
      rarity: 'epic',
      parent1Species: 'glitch',
      parent2Species: 'plasma',
      traits: {
        ...base.traits,
        palette: BASE_PALETTES.glitch,
        eyeMutation: 'five_eyed',
        headMutation: 'small_antlers',
        limbMutation: 'normal',
        tailMutation: 'none',
        auraEffect: 'glitch',
        activeMutations: ['FIVE EYES', 'ANTLERS', 'GLITCH AURA']
      }
    },
    // 4. Horned hamster (Glimhorn)
    {
      ...base,
      id: 'arch_04_horned',
      nickname: 'Glimhorn',
      generatedName: 'Glimhorn',
      rarity: 'rare',
      parent1Species: 'normal',
      parent2Species: 'plasma',
      traits: {
        ...base.traits,
        palette: BASE_PALETTES.plasma,
        eyeMutation: 'normal',
        headMutation: 'crystal_horns',
        limbMutation: 'normal',
        tailMutation: 'none',
        auraEffect: 'none',
        activeMutations: ['CRYSTAL HORNS']
      }
    },
    // 5. Winged hamster (Wingpuff)
    {
      ...base,
      id: 'arch_05_winged',
      nickname: 'Wingpuff',
      generatedName: 'Wingpuff',
      rarity: 'epic',
      parent1Species: 'plasma',
      parent2Species: 'normal',
      traits: {
        ...base.traits,
        palette: BASE_PALETTES.normal,
        eyeMutation: 'normal',
        headMutation: 'none',
        limbMutation: 'normal',
        tailMutation: 'bat_wings',
        auraEffect: 'none',
        activeMutations: ['BAT WINGS']
      }
    },
    // 6. Floating hamster without visible rear paws (Driftpuff)
    {
      ...base,
      id: 'arch_06_floating',
      nickname: 'Driftpuff',
      generatedName: 'Driftpuff',
      rarity: 'rare',
      parent1Species: 'ghost',
      parent2Species: 'normal',
      traits: {
        ...base.traits,
        palette: BASE_PALETTES.ghost,
        eyeMutation: 'normal',
        headMutation: 'none',
        limbMutation: 'missing_hind_legs',
        tailMutation: 'none',
        auraEffect: 'none',
        activeMutations: ['FLOATING BODY']
      }
    },
    // 7. Ghost aura hamster (Wispbean)
    {
      ...base,
      id: 'arch_07_ghost_aura',
      nickname: 'Wispbean',
      generatedName: 'Wispbean',
      rarity: 'rare',
      parent1Species: 'ghost',
      parent2Species: 'electric',
      traits: {
        ...base.traits,
        palette: BASE_PALETTES.ghost,
        eyeMutation: 'normal',
        headMutation: 'none',
        limbMutation: 'missing_hind_legs',
        bodyMutation: 'ghost_body',
        tailMutation: 'spectral_tail',
        auraEffect: 'ghost',
        activeMutations: ['GHOST AURA', 'GHOST BODY', 'FLOATING BODY']
      }
    },
    // 8. Electric aura hamster (Sparkmallow)
    {
      ...base,
      id: 'arch_08_electric_aura',
      nickname: 'Sparkmallow',
      generatedName: 'Sparkmallow',
      rarity: 'rare',
      parent1Species: 'electric',
      parent2Species: 'normal',
      traits: {
        ...base.traits,
        palette: BASE_PALETTES.electric,
        eyeMutation: 'glowing_eyes',
        headMutation: 'none',
        limbMutation: 'oversized_paws',
        tailMutation: 'glowing_tail',
        auraEffect: 'electric',
        activeMutations: ['ELECTRIC AURA', 'GLOWING EYES', 'GLOWING TAIL']
      }
    },
    // 9. Legendary hybrid (Alpha Shardpuff)
    {
      ...base,
      id: 'arch_09_legendary',
      nickname: 'Alpha Shardpuff Prime',
      generatedName: 'Alpha Shardpuff Prime',
      rarity: 'legendary',
      parent1Species: 'plasma',
      parent2Species: 'paradox',
      traits: {
        ...base.traits,
        palette: BASE_PALETTES.paradox,
        eyeMutation: 'tri_eye',
        headMutation: 'crystal_horns',
        limbMutation: 'oversized_paws',
        tailMutation: 'crystal_tail',
        auraEffect: 'crystal',
        activeMutations: ['CRYSTAL HORNS', 'CRYSTAL AURA', 'THIRD EYE', 'CRYSTAL TAIL']
      }
    },
    // 10. Mythic hybrid (Nebupaws, Eye of the Ninth Wave)
    {
      ...base,
      id: 'arch_10_mythic',
      nickname: 'Nebupaws, Eye of the Ninth Wave',
      generatedName: 'Nebupaws, Eye of the Ninth Wave',
      rarity: 'mythic',
      parent1Species: 'paradox',
      parent2Species: 'glitch',
      traits: {
        ...base.traits,
        palette: {
          body: '#ff007f',
          dark: '#581c87',
          light: '#e0e7ff',
          accent: '#00f0ff',
          glow: 'rgba(255, 255, 255, 0.9)'
        },
        eyeMutation: 'cyclops',
        headMutation: 'two_horns',
        limbMutation: 'missing_hind_legs',
        tailMutation: 'bat_wings',
        auraEffect: 'cosmic',
        activeMutations: ['ONE EYE', 'BAT WINGS', 'COSMIC AURA', 'FLOATING BODY', 'DUAL HORNS']
      }
    }
  ];
}
