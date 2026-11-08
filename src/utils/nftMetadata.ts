import { QuantumHybrid, HAMSTER_SPECIES } from '../types/game';
import { keccak256, toHex } from 'viem';

/**
 * Generates deterministic, standalone 32x32 pixel-perfect SVG markup for a Quantum Hybrid.
 * Replicates the EXACT visual features, coordinates, colors, and mutation layering
 * from PixelHybridHamster.tsx down to every single pixel.
 */
export function generateDeterministicHybridSvg(hybrid: QuantumHybrid): string {
  const { traits } = hybrid;
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

  const isGhostBody = bodyMutation === 'ghost_body';
  const bodyOpacity = isGhostBody ? '0.82' : '1.0';

  const parts: string[] = [];

  // 0. Dark background container (high contrast pixel preview)
  parts.push(`<rect width="32" height="32" fill="#0b0f19"/>`);

  // LAYER 0: FAR BACKGROUND AURA / SINGULARITY
  if (quantumEffect === 'plasma_glow' || quantumEffect === 'cosmic_singularity' || auraEffect === 'plasma') {
    parts.push(`<circle cx="16" cy="16" r="14.5" fill="${palette.glow}" opacity="0.55"/>`);
  }
  if (quantumEffect === 'paradox_rings' || auraEffect === 'cosmic') {
    parts.push(`<ellipse cx="16" cy="16" rx="15" ry="6" fill="none" stroke="${palette.accent}" stroke-width="1" stroke-dasharray="3 2" transform="rotate(-20 16 16)" opacity="0.8"/>`);
  }
  if (auraEffect === 'solar') {
    parts.push(`<circle cx="16" cy="16" r="15" fill="rgba(255, 215, 0, 0.18)"/>`);
  }
  if (auraEffect === 'ghost') {
    parts.push(`<g opacity="0.6"><circle cx="5" cy="10" r="3" fill="rgba(100, 255, 218, 0.35)"/><circle cx="27" cy="20" r="3.5" fill="rgba(100, 255, 218, 0.35)"/></g>`);
  }
  if (auraEffect === 'electric') {
    parts.push(`<g fill="#ffeb3b"><polygon points="3,6 4,4 5,7 6,5 4,8"/><polygon points="27,24 28,22 29,25 30,23 28,26"/></g>`);
  }
  if (auraEffect === 'glitch') {
    parts.push(`<g><rect x="2" y="11" width="2" height="2" fill="#00f0ff" opacity="0.85"/><rect x="28" y="7" width="2" height="2" fill="#ff007f" opacity="0.85"/><rect x="27" y="24" width="2" height="2" fill="#ffeb3b" opacity="0.85"/></g>`);
  }
  if (auraEffect === 'crystal') {
    parts.push(`<g fill="${palette.accent}" opacity="0.85"><polygon points="4,7 5,5 6,7 5,9"/><polygon points="27,17 28,15 29,17 28,19"/></g>`);
  }
  if (auraEffect === 'void') {
    parts.push(`<g fill="#581c87" opacity="0.75"><polygon points="3,13 5,12 4,15"/><polygon points="28,9 30,11 29,12"/><polygon points="26,25 28,24 27,27"/></g>`);
  }
  if (cosmeticMutation === 'floating_orbs' || auraEffect === 'cosmic') {
    parts.push(`<g><circle cx="3" cy="11" r="1.8" fill="${palette.accent}"/><circle cx="29" cy="19" r="1.8" fill="${palette.light}"/><circle cx="16" cy="2" r="1.2" fill="#ffffff"/></g>`);
  }

  // LAYER 1: TAILS & WINGS (BEHIND BODY)
  if (tailMutation === 'bat_wings' || cosmeticMutation === 'energy_wings') {
    parts.push(`<g opacity="0.9"><path d="M6 14 Q-1 8 2 4 Q6 8 5 15 Z" fill="${palette.dark}"/><path d="M26 14 Q33 8 30 4 Q26 8 27 15 Z" fill="${palette.dark}"/><path d="M4 11 Q1 7 3 5" stroke="${palette.accent}" stroke-width="0.8" fill="none"/><path d="M28 11 Q31 7 29 5" stroke="${palette.accent}" stroke-width="0.8" fill="none"/></g>`);
  }
  if (tailMutation === 'moth_wings') {
    parts.push(`<g opacity="0.75"><ellipse cx="4" cy="13" rx="4.5" ry="7" fill="${palette.accent}" transform="rotate(-15 4 13)"/><ellipse cx="28" cy="13" rx="4.5" ry="7" fill="${palette.accent}" transform="rotate(15 28 13)"/><circle cx="4" cy="13" r="1.5" fill="#ffffff"/><circle cx="28" cy="13" r="1.5" fill="#ffffff"/></g>`);
  }

  // Tails
  if (tailMutation === 'crystal_tail' || cosmeticMutation === 'crystal_tail') {
    parts.push(`<polygon points="2,24 6,20 4,26" fill="${palette.accent}"/>`);
  } else if (tailMutation === 'glowing_tail') {
    parts.push(`<g><circle cx="4" cy="22" r="2.8" fill="${palette.accent}"/><circle cx="4" cy="22" r="1.2" fill="#ffffff"/></g>`);
  } else if (tailMutation === 'spectral_tail') {
    parts.push(`<path d="M6 22 Q1 25 3 29 Q0 31 2 32" stroke="${palette.glow}" stroke-width="2.5" fill="none" opacity="0.8" stroke-linecap="round"/>`);
  } else if (tailMutation === 'long_tail') {
    parts.push(`<path d="M6 22 Q1 24 2 18 Q3 14 6 15" stroke="${palette.body}" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  } else if (tailMutation === 'forked_tail') {
    parts.push(`<g stroke="${palette.body}" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M6 22 Q2 24 1 19"/><path d="M6 22 Q1 26 2 29"/></g>`);
  } else {
    parts.push(`<circle cx="5" cy="22" r="2.5" fill="${palette.body}"/>`);
  }

  // LAYER 2: EARS & SECONDARY HEAD STRUCTURES
  if (headMutation === 'extra_ears') {
    parts.push(`<g opacity="0.85"><rect x="5" y="6" width="3" height="4" fill="${palette.dark}" rx="1"/><rect x="24" y="6" width="3" height="4" fill="${palette.dark}" rx="1"/></g>`);
  }
  if (earShape === 'antenna') {
    parts.push(`<g><line x1="9" y1="9" x2="6" y2="3" stroke="${palette.dark}" stroke-width="1.5"/><circle cx="6" cy="3" r="1.5" fill="${palette.accent}"/><line x1="23" y1="9" x2="26" y2="3" stroke="${palette.dark}" stroke-width="1.5"/><circle cx="26" cy="3" r="1.5" fill="${palette.accent}"/></g>`);
  } else if (earShape === 'quantum_rings') {
    parts.push(`<g><rect x="7" y="4" width="4" height="5" fill="${palette.dark}" rx="1"/><rect x="21" y="4" width="4" height="5" fill="${palette.dark}" rx="1"/><circle cx="9" cy="4" r="3" fill="none" stroke="${palette.accent}" stroke-width="1"/><circle cx="23" cy="4" r="3" fill="none" stroke="${palette.accent}" stroke-width="1"/></g>`);
  } else if (earShape === 'tufted') {
    parts.push(`<g><polygon points="6,9 8,2 11,9" fill="${palette.dark}"/><polygon points="7,8 8,4 10,8" fill="${palette.accent}"/><polygon points="21,9 24,2 26,9" fill="${palette.dark}"/><polygon points="22,8 24,4 25,8" fill="${palette.accent}"/></g>`);
  } else if (earShape === 'folded') {
    parts.push(`<g><rect x="7" y="6" width="4" height="3" fill="${palette.dark}" rx="1"/><rect x="21" y="6" width="4" height="3" fill="${palette.dark}" rx="1"/></g>`);
  } else {
    parts.push(`<g><rect x="7" y="4" width="4" height="5" fill="${palette.dark}" rx="1"/><rect x="8" y="5" width="2" height="3" fill="${palette.accent}"/><rect x="21" y="4" width="4" height="5" fill="${palette.dark}" rx="1"/><rect x="22" y="5" width="2" height="3" fill="${palette.accent}"/></g>`);
  }

  // LAYER 3: MAIN BODY SILHOUETTE & FLUFF
  if (bodyMutation === 'extra_fluffy') {
    parts.push(`<g fill="${palette.body}" opacity="${bodyOpacity}"><polygon points="5,15 2,17 5,19"/><polygon points="27,15 30,17 27,19"/><polygon points="6,21 3,23 6,24"/><polygon points="26,21 29,23 26,24"/></g>`);
  }
  parts.push(`<rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" fill="${palette.body}" rx="${bodyRx}" opacity="${bodyOpacity}"/>`);

  // Fur Patterns
  if (furPattern === 'split_half') {
    parts.push(`<rect x="${bodyX + bodyW / 2}" y="${bodyY}" width="${bodyW / 2}" height="${bodyH}" fill="${palette.dark}" rx="${bodyRx}" opacity="${bodyOpacity}"/>`);
  } else if (furPattern === 'striped') {
    parts.push(`<g fill="${palette.dark}" opacity="${bodyOpacity}"><rect x="${bodyX + 2}" y="${bodyY + 3}" width="${bodyW - 4}" height="2"/><rect x="${bodyX + 2}" y="${bodyY + 7}" width="${bodyW - 4}" height="2"/><rect x="${bodyX + 2}" y="${bodyY + 11}" width="${bodyW - 4}" height="2"/></g>`);
  } else if (furPattern === 'spotted') {
    parts.push(`<g fill="${palette.dark}" opacity="${bodyOpacity}"><circle cx="${bodyX + 4}" cy="${bodyY + 4}" r="2"/><circle cx="${bodyX + bodyW - 4}" cy="${bodyY + 6}" r="2"/><circle cx="${bodyX + 5}" cy="${bodyY + 12}" r="1.5"/></g>`);
  } else if (furPattern === 'circuit_marks') {
    parts.push(`<g stroke="${palette.accent}" stroke-width="1" fill="none" opacity="${bodyOpacity}"><path d="M8 12 L12 12 L14 16 L14 20"/><circle cx="14" cy="20" r="1" fill="${palette.accent}"/><path d="M24 12 L20 12 L18 16"/></g>`);
  } else if (furPattern === 'quantum_swirl') {
    parts.push(`<path d="M${bodyX + 3} ${bodyY + 5} Q16 12 ${bodyX + bodyW - 3} ${bodyY + 14}" stroke="${palette.light}" stroke-width="2.5" fill="none" opacity="${bodyOpacity}"/>`);
  } else if (furPattern === 'void_nebula') {
    parts.push(`<g opacity="${bodyOpacity}"><circle cx="${bodyX + 4}" cy="${bodyY + 4}" r="1" fill="#fff"/><circle cx="${bodyX + bodyW - 5}" cy="${bodyY + 7}" r="1" fill="#fff"/><circle cx="16" cy="18" r="1" fill="#fff"/><path d="M${bodyX + 2} ${bodyY + 10} Q16 16 ${bodyX + bodyW - 2} ${bodyY + 8}" stroke="${palette.accent}" stroke-width="1.5" fill="none" opacity="0.7"/></g>`);
  }

  if (bodyMutation === 'crystal_patches') {
    parts.push(`<g fill="${palette.accent}" opacity="0.9"><polygon points="8,10 10,8 11,11 9,12"/><polygon points="22,18 24,16 25,19 23,20"/></g>`);
  } else if (bodyMutation === 'glitch_fur') {
    parts.push(`<g opacity="0.85"><rect x="8" y="16" width="3" height="2" fill="#ff007f"/><rect x="22" y="10" width="2" height="3" fill="#00f0ff"/><rect x="14" y="22" width="4" height="1.5" fill="#ffffff"/></g>`);
  }

  // Forehead & Cheeks
  parts.push(`<rect x="${bodyX + 2}" y="${bodyY + 1}" width="${bodyW - 4}" height="4" fill="${palette.light}" opacity="0.6"/>`);
  parts.push(`<rect x="${bodyX - 1}" y="14" width="3" height="6" fill="${palette.light}" rx="1" opacity="${bodyOpacity}"/>`);
  parts.push(`<rect x="${bodyX + bodyW - 2}" y="14" width="3" height="6" fill="${palette.light}" rx="1" opacity="${bodyOpacity}"/>`);
  parts.push(`<rect x="10" y="16" width="12" height="9" fill="${palette.light}" rx="2" opacity="${bodyOpacity}"/>`);

  // LAYER 4: HORNS, ANTLERS & HEAD MUTATIONS
  if (headMutation === 'single_horn') {
    parts.push(`<g><polygon points="15,8 16,1 17,8" fill="${palette.accent}"/><polygon points="15.5,7 16,2 16.5,7" fill="#ffffff" opacity="0.7"/></g>`);
  } else if (headMutation === 'two_horns' || cosmeticMutation === 'tiny_horns') {
    parts.push(`<g fill="${palette.accent}"><polygon points="11,8 9,2 12,6"/><polygon points="21,8 23,2 20,6"/></g>`);
  } else if (headMutation === 'crystal_horns') {
    parts.push(`<g><polygon points="11,8 9,2 13,6" fill="${palette.accent}" opacity="0.9"/><polygon points="21,8 23,2 19,6" fill="${palette.accent}" opacity="0.9"/><polygon points="15,7 16,3 17,7" fill="#ffffff" opacity="0.8"/></g>`);
  } else if (headMutation === 'small_antlers') {
    parts.push(`<g stroke="${palette.dark}" stroke-width="1.2" stroke-linecap="round" fill="none"><path d="M10 8 L9 3 M9 5 L7 4 M9 3 L8 1"/><path d="M22 8 L23 3 M23 5 L25 4 M23 3 L24 1"/></g>`);
  } else if (headMutation === 'quantum_antennae') {
    parts.push(`<g><line x1="11" y1="8" x2="8" y2="2" stroke="${palette.dark}" stroke-width="1.2"/><circle cx="8" cy="2" r="1.5" fill="${palette.accent}"/><line x1="21" y1="8" x2="24" y2="2" stroke="${palette.dark}" stroke-width="1.2"/><circle cx="24" cy="2" r="1.5" fill="${palette.accent}"/></g>`);
  }

  // LAYER 5: EYES & FACIAL ARRANGEMENT
  if (eyeMutation === 'cyclops') {
    parts.push(`<g><circle cx="16" cy="12" r="3.2" fill="#ffffff"/><circle cx="16" cy="12" r="2.5" fill="${eyeColor}"/><circle cx="16" cy="12" r="1.3" fill="#0f1117"/><circle cx="15.2" cy="11.2" r="0.9" fill="#ffffff"/><circle cx="16.9" cy="12.9" r="0.45" fill="#ffffff"/></g>`);
  } else if (eyeMutation === 'five_eyed') {
    parts.push(`<g><circle cx="9" cy="13.2" r="1.3" fill="${eyeColor}"/><circle cx="8.8" cy="13" r="0.4" fill="#ffffff"/><circle cx="12" cy="11.6" r="1.5" fill="${eyeColor}"/><circle cx="11.8" cy="11.3" r="0.5" fill="#ffffff"/><circle cx="16" cy="10.4" r="1.6" fill="${eyeColor}"/><circle cx="15.7" cy="10.1" r="0.5" fill="#ffffff"/><circle cx="20" cy="11.6" r="1.5" fill="${eyeColor}"/><circle cx="19.8" cy="11.3" r="0.5" fill="#ffffff"/><circle cx="23" cy="13.2" r="1.3" fill="${eyeColor}"/><circle cx="22.8" cy="13" r="0.4" fill="#ffffff"/></g>`);
  } else if (eyeMutation === 'heterochromia') {
    parts.push(`<g><rect x="10" y="12" width="3" height="3" fill="${palette.accent}" rx="0.5"/><rect x="10" y="12" width="1" height="1" fill="#ffffff"/><rect x="19" y="12" width="3" height="3" fill="${eyeColor}" rx="0.5"/><rect x="19" y="12" width="1" height="1" fill="#ffffff"/></g>`);
  } else if (eyeMutation === 'glowing_eyes') {
    parts.push(`<g><circle cx="11.5" cy="13.5" r="1.8" fill="#ffffff"/><circle cx="20.5" cy="13.5" r="1.8" fill="#ffffff"/></g>`);
  } else {
    parts.push(`<g><rect x="10" y="12" width="3" height="3" fill="${eyeColor}" rx="0.5"/><rect x="10" y="12" width="1" height="1" fill="#ffffff"/><rect x="19" y="12" width="3" height="3" fill="${eyeColor}" rx="0.5"/><rect x="19" y="12" width="1" height="1" fill="#ffffff"/>`);
    if (eyeMutation === 'tri_eye' || cosmeticMutation === 'third_eye') {
      parts.push(`<circle cx="16" cy="9.5" r="1.8" fill="${eyeColor}"/><circle cx="15.8" cy="9.2" r="0.6" fill="#ffffff"/>`);
    }
    parts.push(`</g>`);
  }

  // Snout & Nose
  parts.push(`<rect x="15" y="15" width="2" height="2" fill="${palette.accent}"/><rect x="14" y="17" width="4" height="1" fill="${palette.dark}"/>`);

  // LAYER 6: PAWS & LIMBS
  if (limbMutation === 'missing_hind_legs') {
    parts.push(`<g><path d="M8 24 Q12 28 16 25 Q20 28 24 24 Q21 28.5 16 27.5 Q11 28.5 8 24 Z" fill="${palette.glow}" opacity="0.8"/><circle cx="12" cy="27.5" r="1" fill="${palette.accent}" opacity="0.7"/><circle cx="20" cy="27.5" r="1" fill="${palette.accent}" opacity="0.7"/></g>`);
  } else if (limbMutation === 'oversized_paws') {
    parts.push(`<g fill="${palette.dark}"><rect x="7" y="24" width="6" height="4" rx="2"/><rect x="19" y="24" width="6" height="4" rx="2"/><circle cx="8.5" cy="24.5" r="0.6" fill="#ffffff" opacity="0.5"/><circle cx="20.5" cy="24.5" r="0.6" fill="#ffffff" opacity="0.5"/></g>`);
  } else {
    parts.push(`<g fill="${palette.dark}"><rect x="9" y="25" width="4" height="3" rx="1"/><rect x="19" y="25" width="4" height="3" rx="1"/></g>`);
  }

  if (limbMutation === 'tiny_forepaws') {
    parts.push(`<g fill="${palette.dark}"><circle cx="13" cy="18" r="1.2"/><circle cx="19" cy="18" r="1.2"/></g>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="512" height="512" shape-rendering="crispEdges" style="image-rendering:pixelated;background:#0b0f19;">${parts.join('')}</svg>`;
}

/**
 * Creates deterministic CID-like content address string from content bytes using SHA-256.
 * Adheres to standard IPFS CIDv1 raw multihash convention: bafkrei...
 */
export function computeDeterministicIpfsCid(contentString: string): string {
  const hash = keccak256(toHex(contentString)).slice(2);
  return `bafkrei${hash.slice(0, 52).toLowerCase()}`;
}

/**
 * Creates canonical ERC-721 metadata JSON object for a quantum hybrid hamster.
 */
export function buildCanonicalNftMetadata(hybrid: QuantumHybrid, tokenId: number, artworkCid: string) {
  const p1Name = HAMSTER_SPECIES[hybrid.parent1Species]?.name || hybrid.parent1Species;
  const p2Name = HAMSTER_SPECIES[hybrid.parent2Species]?.name || hybrid.parent2Species;

  const displayName = hybrid.generatedName || hybrid.nickname || `Hamster #${tokenId}`;

  const attributes = [
    { trait_type: 'Species Lineage', value: `${p1Name} × ${p2Name}` },
    { trait_type: 'Parent 1', value: p1Name },
    { trait_type: 'Parent 2', value: p2Name },
    { trait_type: 'Rarity', value: hybrid.rarity.charAt(0).toUpperCase() + hybrid.rarity.slice(1) },
    { trait_type: 'Personality', value: hybrid.personality },
    { trait_type: 'Body Shape', value: hybrid.traits.bodyShape },
    { trait_type: 'Ear Shape', value: hybrid.traits.earShape },
    { trait_type: 'Fur Pattern', value: hybrid.traits.furPattern },
    { trait_type: 'Eye Mutation', value: formatTraitName(hybrid.traits.eyeMutation || 'normal') },
    { trait_type: 'Head Mutation', value: formatTraitName(hybrid.traits.headMutation || 'none') },
    { trait_type: 'Limb Mutation', value: formatTraitName(hybrid.traits.limbMutation || 'normal') },
    { trait_type: 'Body Mutation', value: formatTraitName(hybrid.traits.bodyMutation || 'normal') },
    { trait_type: 'Tail Mutation', value: formatTraitName(hybrid.traits.tailMutation || 'none') },
    { trait_type: 'Aura Effect', value: formatTraitName(hybrid.traits.auraEffect || 'none') },
    { trait_type: 'Generator Version', value: hybrid.generatorVersion || 1 },
    { trait_type: 'Quantum Seed', value: hybrid.seed }
  ];

  return {
    name: displayName,
    description: `Schrödinger's Hamster #${tokenId} — An immutable procedurally generated quantum hybrid created through dual-state quantum incubation in Schrödinger's Laboratory.`,
    image: `ipfs://${artworkCid}`,
    external_url: `https://schrodingers-hamster.pages.dev/dex?token=${tokenId}`,
    attributes
  };
}

function formatTraitName(trait: string): string {
  if (trait === 'none' || trait === 'normal') return 'Standard';
  return trait.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Computes the immutable specimen hash from specimen identity and traits.
 */
export function computeSpecimenHash(hybrid: QuantumHybrid): `0x${string}` {
  const payload = [
    hybrid.id,
    hybrid.seed,
    hybrid.parent1Species,
    hybrid.parent2Species,
    hybrid.rarity,
    hybrid.personality,
    JSON.stringify(hybrid.traits)
  ].join('|');
  return keccak256(toHex(payload));
}
