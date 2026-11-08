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
  HYBRID_RARITY_WEIGHTS,
  HAMSTER_SPECIES,
  PlayerState
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
    generation: 1,
    parent1Id: parent1Species,
    parent2Id: parent2Species,
    parent1Name: HAMSTER_SPECIES[parent1Species]?.name || parent1Species,
    parent2Name: HAMSTER_SPECIES[parent2Species]?.name || parent2Species,
    ancestryLineage: `${HAMSTER_SPECIES[parent1Species]?.name || parent1Species} × ${HAMSTER_SPECIES[parent2Species]?.name || parent2Species} (Gen 1)`,
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

export interface BreedingParentDescriptor {
  id: string;
  name: string;
  isBase: boolean;
  speciesId?: string;
  generation?: 1 | 2;
  traits?: HybridCosmeticTraits;
  rarity?: HybridRarity;
  personality?: HamsterPersonality;
  hybrid?: QuantumHybrid;
}

export function createParentDescriptor(
  player: PlayerState,
  parentIdOrSpecies: string
): BreedingParentDescriptor {
  // Check if it's a base species ID (e.g. 'normal', 'quantum')
  if (HAMSTER_SPECIES[parentIdOrSpecies]) {
    const spec = HAMSTER_SPECIES[parentIdOrSpecies];
    return {
      id: parentIdOrSpecies,
      name: spec.name,
      isBase: true,
      speciesId: parentIdOrSpecies,
      generation: 1
    };
  }

  // Check if it's a hybrid in player collection
  const hybrid = (player.hybrids || []).find((h: QuantumHybrid) => h.id === parentIdOrSpecies);
  if (hybrid) {
    if (hybrid.existenceStatus === 'deceased' || hybrid.existenceStatus === 'missing') {
      throw new Error(`Parent specimen "${hybrid.nickname || hybrid.generatedName}" cannot breed because it is ${hybrid.existenceStatus}.`);
    }
    return {
      id: hybrid.id,
      name: hybrid.nickname || hybrid.generatedName || 'Hybrid Hamster',
      isBase: false,
      speciesId: hybrid.parent1Species,
      generation: hybrid.generation || 1,
      traits: hybrid.traits,
      rarity: hybrid.rarity,
      personality: hybrid.personality,
      hybrid
    };
  }

  // Check companion in hamsters list
  const hamster = (player.hamsters || []).find((h: any) => h.id === parentIdOrSpecies || h.speciesId === parentIdOrSpecies);
  if (hamster && HAMSTER_SPECIES[hamster.speciesId]) {
    const spec = HAMSTER_SPECIES[hamster.speciesId];
    return {
      id: hamster.speciesId,
      name: hamster.nickname || spec.name,
      isBase: true,
      speciesId: hamster.speciesId,
      generation: 1
    };
  }

  throw new Error(`Parent specimen "${parentIdOrSpecies}" not found in player collection.`);
}

/**
 * Multi-Generation Hybrid Generator:
 * Base × Base → Gen 1
 * Base × Gen 1 → Gen 2
 * Gen 1 × Gen 1 → Gen 2
 * Gen 2 cannot breed.
 * Maximum 4 active mutations.
 */
export function generateMultiGenHybrid(
  playerId: string,
  parent1: BreedingParentDescriptor,
  parent2: BreedingParentDescriptor,
  seed: number = Math.floor(Math.random() * 1000000000)
): QuantumHybrid {
  if (parent1.id === parent2.id) {
    throw new Error('Cannot select the same specimen twice as both parents.');
  }

  const p1Gen = parent1.generation || (parent1.isBase ? 1 : 1);
  const p2Gen = parent2.generation || (parent2.isBase ? 1 : 1);

  if ((!parent1.isBase && p1Gen >= 2) || (!parent2.isBase && p2Gen >= 2)) {
    throw new Error('Generation 2 hamsters cannot breed.');
  }

  // Base × Base produces Gen 1; Any pairing with Gen 1 produces Gen 2
  const childGen: 1 | 2 = (parent1.isBase && parent2.isBase) ? 1 : 2;

  // For pure Base × Base, preserve exact mathematical output of generateQuantumHybrid
  if (childGen === 1) {
    const p1Spec = parent1.speciesId || parent1.id;
    const p2Spec = parent2.speciesId || parent2.id;
    return generateQuantumHybrid(playerId, p1Spec, p2Spec, seed);
  }

  const rand = createPrng(seed);
  const generatorVersion = 2;

  // Retrieve parent palettes
  const p1Palette = parent1.isBase
    ? (BASE_PALETTES[parent1.speciesId || parent1.id] || BASE_PALETTES.normal)
    : (parent1.traits?.palette || BASE_PALETTES.normal);

  const p2Palette = parent2.isBase
    ? (BASE_PALETTES[parent2.speciesId || parent2.id] || BASE_PALETTES.normal)
    : (parent2.traits?.palette || BASE_PALETTES.normal);

  // Preserve existing rarity probabilities
  const rarity = rollHybridRarity(rand);
  const personality: HamsterPersonality = HAMSTER_PERSONALITIES[Math.floor(rand() * HAMSTER_PERSONALITIES.length)];

  // Palette blend
  const blendRatio = 0.25 + rand() * 0.5;
  let bodyColor = interpolateHex(p1Palette.body, p2Palette.body, blendRatio);
  let darkColor = interpolateHex(p1Palette.dark, p2Palette.dark, blendRatio);
  let lightColor = interpolateHex(p1Palette.light, p2Palette.light, blendRatio);
  let accentColor = rand() < 0.5 ? p1Palette.accent : p2Palette.accent;
  let glowColor = rand() < 0.5 ? p1Palette.glow : p2Palette.glow;

  if (rarity === 'mythic') {
    glowColor = 'rgba(255, 255, 255, 0.85)';
    accentColor = '#ffffff';
  } else if (rarity === 'legendary') {
    glowColor = 'rgba(168, 85, 247, 0.75)';
  }

  // Inherit or roll Fur Pattern
  let furPattern: FurPattern;
  const parentPatterns = [parent1.traits?.furPattern, parent2.traits?.furPattern].filter(Boolean) as FurPattern[];
  if (parentPatterns.length > 0 && rand() < 0.40) {
    furPattern = parentPatterns[Math.floor(rand() * parentPatterns.length)];
  } else if (rarity === 'mythic') {
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

  // Inherit or roll Body Shape
  let bodyShape: BodyShape;
  const parentShapes = [parent1.traits?.bodyShape, parent2.traits?.bodyShape].filter(Boolean) as BodyShape[];
  if (parentShapes.length > 0 && rand() < 0.65) {
    bodyShape = parentShapes[Math.floor(rand() * parentShapes.length)];
  } else {
    const bodyShapes: BodyShape[] = ['standard', 'chubby', 'sleek', 'round'];
    bodyShape = bodyShapes[Math.floor(rand() * bodyShapes.length)];
  }

  // Inherit or roll Ear Shape
  let earShape: EarShape;
  const parentEars = [parent1.traits?.earShape, parent2.traits?.earShape].filter(Boolean) as EarShape[];
  if (parentEars.length > 0 && rand() < 0.65) {
    earShape = parentEars[Math.floor(rand() * parentEars.length)];
  } else {
    const standardEars: EarShape[] = ['round', 'tufted', 'folded'];
    earShape = standardEars[Math.floor(rand() * standardEars.length)];
  }

  // Inherit or roll Eye Color
  let eyeColor = '#1b1c22';
  const parentEyes = [parent1.traits?.eyeColor, parent2.traits?.eyeColor].filter(Boolean) as string[];
  if (parentEyes.length > 0 && rand() < 0.60) {
    eyeColor = parentEyes[Math.floor(rand() * parentEyes.length)];
  } else if (rarity === 'mythic') {
    eyeColor = '#ffffff';
  } else if (rarity === 'legendary') {
    eyeColor = rand() < 0.5 ? '#00f0ff' : '#ff007f';
  } else if (rarity === 'epic' || rarity === 'rare') {
    const eyePalette = ['#00f0ff', '#ffeb3b', '#64ffda', '#ff4081', '#a1ff0a', '#1b1c22'];
    eyeColor = eyePalette[Math.floor(rand() * eyePalette.length)];
  }

  // Quantum Effect
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

  // Active Mutations & Inheritance
  const p1Species = parent1.speciesId || (parent1.hybrid ? parent1.hybrid.parent1Species : 'normal');
  const p2Species = parent2.speciesId || (parent2.hybrid ? parent2.hybrid.parent2Species : 'normal');
  const hasParadox = p1Species === 'paradox' || p2Species === 'paradox';
  const hasGlitch = p1Species === 'glitch' || p2Species === 'glitch';
  const hasElectric = p1Species === 'electric' || p2Species === 'electric';
  const hasGhost = p1Species === 'ghost' || p2Species === 'ghost';
  const hasPlasma = p1Species === 'plasma' || p2Species === 'plasma';

  // 1. Eye Mutation
  let eyeMutation: EyeMutation = 'normal';
  if (parent1.traits?.eyeMutation && parent1.traits.eyeMutation !== 'normal' && rand() < 0.35) {
    eyeMutation = parent1.traits.eyeMutation;
  } else if (parent2.traits?.eyeMutation && parent2.traits.eyeMutation !== 'normal' && rand() < 0.35) {
    eyeMutation = parent2.traits.eyeMutation;
  } else {
    // Novel roll
    if (rarity === 'mythic') {
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
  }

  // 2. Head Mutation
  let headMutation: HeadMutation = 'none';
  if (parent1.traits?.headMutation && parent1.traits.headMutation !== 'none' && rand() < 0.35) {
    headMutation = parent1.traits.headMutation;
  } else if (parent2.traits?.headMutation && parent2.traits.headMutation !== 'none' && rand() < 0.35) {
    headMutation = parent2.traits.headMutation;
  } else {
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
  }

  // 3. Limb Mutation
  let limbMutation: LimbMutation = 'normal';
  if (parent1.traits?.limbMutation && parent1.traits.limbMutation !== 'normal' && rand() < 0.35) {
    limbMutation = parent1.traits.limbMutation;
  } else if (parent2.traits?.limbMutation && parent2.traits.limbMutation !== 'normal' && rand() < 0.35) {
    limbMutation = parent2.traits.limbMutation;
  } else {
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
  }

  // 4. Body Mutation
  let bodyMutation: BodyMutation = 'normal';
  if (parent1.traits?.bodyMutation && parent1.traits.bodyMutation !== 'normal' && rand() < 0.35) {
    bodyMutation = parent1.traits.bodyMutation;
  } else if (parent2.traits?.bodyMutation && parent2.traits.bodyMutation !== 'normal' && rand() < 0.35) {
    bodyMutation = parent2.traits.bodyMutation;
  } else {
    if (hasGhost && (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') && rand() < 0.50) {
      bodyMutation = 'ghost_body';
    } else if (hasGlitch && rand() < 0.40) {
      bodyMutation = 'glitch_fur';
    } else if ((rarity === 'legendary' || rarity === 'epic') && rand() < 0.35) {
      bodyMutation = 'crystal_patches';
    } else if (rand() < 0.25) {
      bodyMutation = 'extra_fluffy';
    }
  }

  // 5. Tail Mutation
  let tailMutation: TailMutation = 'none';
  if (parent1.traits?.tailMutation && parent1.traits.tailMutation !== 'none' && rand() < 0.35) {
    tailMutation = parent1.traits.tailMutation;
  } else if (parent2.traits?.tailMutation && parent2.traits.tailMutation !== 'none' && rand() < 0.35) {
    tailMutation = parent2.traits.tailMutation;
  } else {
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
  }

  // 6. Aura Effect
  let auraEffect: AuraEffect = 'none';
  if (parent1.traits?.auraEffect && parent1.traits.auraEffect !== 'none' && rand() < 0.35) {
    auraEffect = parent1.traits.auraEffect;
  } else if (parent2.traits?.auraEffect && parent2.traits.auraEffect !== 'none' && rand() < 0.35) {
    auraEffect = parent2.traits.auraEffect;
  } else {
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
  }

  // Collect candidate active mutations
  const mutationEntries: { category: string; label: string }[] = [];
  if (eyeMutation === 'cyclops') mutationEntries.push({ category: 'eye', label: 'ONE EYE' });
  else if (eyeMutation === 'five_eyed') mutationEntries.push({ category: 'eye', label: 'FIVE EYES' });
  else if (eyeMutation === 'tri_eye') mutationEntries.push({ category: 'eye', label: 'THIRD EYE' });
  else if (eyeMutation === 'heterochromia') mutationEntries.push({ category: 'eye', label: 'HETEROCHROMIA' });
  else if (eyeMutation === 'glowing_eyes') mutationEntries.push({ category: 'eye', label: 'GLOWING EYES' });

  if (headMutation === 'crystal_horns') mutationEntries.push({ category: 'head', label: 'CRYSTAL HORNS' });
  else if (headMutation === 'two_horns') mutationEntries.push({ category: 'head', label: 'DUAL HORNS' });
  else if (headMutation === 'single_horn') mutationEntries.push({ category: 'head', label: 'UNICORN HORN' });
  else if (headMutation === 'small_antlers') mutationEntries.push({ category: 'head', label: 'ANTLERS' });
  else if (headMutation === 'quantum_antennae') mutationEntries.push({ category: 'head', label: 'ANTENNAE' });
  else if (headMutation === 'extra_ears') mutationEntries.push({ category: 'head', label: 'FOUR EARS' });

  if (limbMutation === 'missing_hind_legs') mutationEntries.push({ category: 'limb', label: 'FLOATING BODY' });
  else if (limbMutation === 'oversized_paws') mutationEntries.push({ category: 'limb', label: 'OVERSIZED PAWS' });
  else if (limbMutation === 'tiny_forepaws') mutationEntries.push({ category: 'limb', label: 'TINY FOREPAWS' });

  if (bodyMutation === 'ghost_body') mutationEntries.push({ category: 'body', label: 'GHOST BODY' });
  else if (bodyMutation === 'crystal_patches') mutationEntries.push({ category: 'body', label: 'CRYSTAL PATCHES' });
  else if (bodyMutation === 'glitch_fur') mutationEntries.push({ category: 'body', label: 'GLITCH FUR' });
  else if (bodyMutation === 'extra_fluffy') mutationEntries.push({ category: 'body', label: 'EXTRA FLUFFY' });

  if (tailMutation === 'bat_wings') mutationEntries.push({ category: 'tail', label: 'BAT WINGS' });
  else if (tailMutation === 'moth_wings') mutationEntries.push({ category: 'tail', label: 'MOTH WINGS' });
  else if (tailMutation === 'crystal_tail') mutationEntries.push({ category: 'tail', label: 'CRYSTAL TAIL' });
  else if (tailMutation === 'glowing_tail') mutationEntries.push({ category: 'tail', label: 'GLOWING TAIL' });
  else if (tailMutation === 'spectral_tail') mutationEntries.push({ category: 'tail', label: 'SPECTRAL TAIL' });
  else if (tailMutation === 'forked_tail') mutationEntries.push({ category: 'tail', label: 'FORKED TAIL' });
  else if (tailMutation === 'long_tail') mutationEntries.push({ category: 'tail', label: 'LONG TAIL' });

  if (auraEffect === 'electric') mutationEntries.push({ category: 'aura', label: 'ELECTRIC AURA' });
  else if (auraEffect === 'ghost') mutationEntries.push({ category: 'aura', label: 'GHOST AURA' });
  else if (auraEffect === 'plasma') mutationEntries.push({ category: 'aura', label: 'PLASMA AURA' });
  else if (auraEffect === 'glitch') mutationEntries.push({ category: 'aura', label: 'GLITCH AURA' });
  else if (auraEffect === 'cosmic') mutationEntries.push({ category: 'aura', label: 'COSMIC AURA' });
  else if (auraEffect === 'crystal') mutationEntries.push({ category: 'aura', label: 'CRYSTAL AURA' });
  else if (auraEffect === 'solar') mutationEntries.push({ category: 'aura', label: 'SOLAR AURA' });
  else if (auraEffect === 'void') mutationEntries.push({ category: 'aura', label: 'VOID AURA' });

  // HARD CAP: Maximum four active mutations
  const cappedEntries = mutationEntries.slice(0, 4);
  const activeMutationsList = cappedEntries.map(e => e.label);
  const retainedCategories = new Set(cappedEntries.map(e => e.category));

  if (!retainedCategories.has('eye')) eyeMutation = 'normal';
  if (!retainedCategories.has('head')) headMutation = 'none';
  if (!retainedCategories.has('limb')) limbMutation = 'normal';
  if (!retainedCategories.has('body')) bodyMutation = 'normal';
  if (!retainedCategories.has('tail')) tailMutation = 'none';
  if (!retainedCategories.has('aura')) auraEffect = 'none';

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

  const { fullDisplayName } = generateProceduralHybridName(traits, p1Species, p2Species, rarity, rand);
  const discoveredAt = Date.now();
  const id = `hybrid_${playerId}_${discoveredAt}_${Math.random().toString(36).substring(2, 7)}`;
  const ancestryLineage = `${parent1.name} × ${parent2.name} (Gen ${childGen})`;

  return {
    id,
    playerId,
    generatorVersion,
    seed,
    parent1Species: p1Species,
    parent2Species: p2Species,
    nickname: fullDisplayName,
    generatedName: fullDisplayName,
    personality,
    rarity,
    discoveredAt,
    isFavorite: false,
    traits,
    generation: childGen,
    parent1Id: parent1.id,
    parent2Id: parent2.id,
    parent1Name: parent1.name,
    parent2Name: parent2.name,
    ancestryLineage,
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
        description: `Synthesized from ${parent1.name} × ${parent2.name} (${ancestryLineage}) in the Quantum Incubator.`
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
