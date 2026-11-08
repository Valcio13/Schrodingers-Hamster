export interface HamsterSpecies {
  id: string;
  name: string;
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description: string;
  lore: string;
  assistantPerk: string;
  color: string;
  secondaryColor: string;
  icon: string;
}

export const HAMSTER_SPECIES: Record<string, HamsterSpecies> = {
  normal: {
    id: 'normal',
    name: 'Normal Hamster',
    title: 'The Baseline Specimen',
    rarity: 'common',
    description: 'A polite Syrian hamster who enjoys sunflower seeds and obeys standard classical physics.',
    lore: 'Found snacking behind the server racks. Unaffected by quantum weirdness... for now.',
    assistantPerk: 'Steady Paws: 10% chance to recover 5 Research Notes on any experiment.',
    color: '#f5af63',
    secondaryColor: '#e08e45',
    icon: '🐹'
  },
  electric: {
    id: 'electric',
    name: 'Electric Hamster',
    title: 'Bio-Static Dynamo',
    rarity: 'uncommon',
    description: 'Fur crackles with high-voltage static. Its whiskers emit tiny Saint Elmo\'s fire sparks.',
    lore: 'Ran so fast on a carpeted wheel that it attained permanent static charge.',
    assistantPerk: 'Voltage Booster: Reduces all experiment battery costs by 15%.',
    color: '#ffea47',
    secondaryColor: '#f39c12',
    icon: '⚡'
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost Hamster',
    title: 'Quantum Superposition',
    rarity: 'rare',
    description: 'Simultaneously occupies both sides of the exercise wheel until you look directly at it.',
    lore: 'Has a 50% probability of being a hallucination caused by lab coffee.',
    assistantPerk: 'Quantum Sight: Active ability to peek and reveal hidden outcome data of one quantum state before observing.',
    color: '#a1c4fd',
    secondaryColor: '#c2e9fb',
    icon: '👻'
  },
  glitch: {
    id: 'glitch',
    name: 'Glitch Hamster',
    title: 'Texture Missing Rodent',
    rarity: 'rare',
    description: 'Phases through cage bars and periodically leaves magenta and black checkerboard footprints.',
    lore: 'Result of an integer overflow in the wheel rotation counter.',
    assistantPerk: 'Anomaly Magnet: +20% chance for rare species or exotic outcomes in Unstable experiments.',
    color: '#ff5e97',
    secondaryColor: '#11eed9',
    icon: '👾'
  },
  plasma: {
    id: 'plasma',
    name: 'Plasma Hamster',
    title: 'Ionized Micro-Star',
    rarity: 'epic',
    description: 'Surrounded by a glowing corona of ionized gas. Needs heat-resistant seed bowls.',
    lore: 'Harnessed the power of nuclear fusion by running at near-relativistic speeds.',
    assistantPerk: 'Thermal Velocity: Decreases experiment wait times by 40%.',
    color: '#ff416c',
    secondaryColor: '#8a2387',
    icon: '🔮'
  },
  paradox: {
    id: 'paradox',
    name: 'Paradox Hamster',
    title: 'The Schrödinger Entity',
    rarity: 'legendary',
    description: 'Neither fully alive nor fully dead, yet exceedingly fluffy and fond of head scritches.',
    lore: 'The ultimate culmination of Schrödinger\'s experiment. Escaped the box and conquered spacetime.',
    assistantPerk: 'Quantum Mastery: +20% Research Notes from all experiments & 10% lower experiment costs.',
    color: '#b6f343',
    secondaryColor: '#aa7ef7',
    icon: '✨'
  }
};

export type HamsterPersonality = 'Curious' | 'Sleepy' | 'Mischievous' | 'Brave' | 'Shy';

export const HAMSTER_PERSONALITIES: HamsterPersonality[] = [
  'Curious',
  'Sleepy',
  'Mischievous',
  'Brave',
  'Shy'
];

export interface CollectibleHamster {
  id: string;
  playerId: string;
  speciesId: string;
  nickname: string;
  personality: HamsterPersonality;
  discoveredAt: number;
  experimentTier: 'basic' | 'unstable' | 'paradox' | 'grand';
  observationState?: 'A' | 'B';
  isFavorite: boolean;
  isAssistant: boolean;
}

export type HybridRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export const HYBRID_RARITY_WEIGHTS: Record<HybridRarity, number> = {
  common: 0.50,
  uncommon: 0.25,
  rare: 0.15,
  epic: 0.07,
  legendary: 0.025,
  mythic: 0.005
};

export type FurPattern =
  | 'solid'
  | 'spotted'
  | 'striped'
  | 'quantum_swirl'
  | 'split_half'
  | 'circuit_marks'
  | 'void_nebula';

export type BodyShape = 'standard' | 'chubby' | 'sleek' | 'round';
export type EarShape = 'round' | 'tufted' | 'folded' | 'quantum_rings' | 'antenna';

export type QuantumEffect =
  | 'none'
  | 'spark_halo'
  | 'ghost_shimmer'
  | 'glitch_flicker'
  | 'plasma_glow'
  | 'paradox_rings'
  | 'cosmic_singularity';

export type CosmeticMutation =
  | 'none'
  | 'tiny_horns'
  | 'third_eye'
  | 'crystal_tail'
  | 'star_sparkles'
  | 'floating_orbs'
  | 'energy_wings';

export type EyeMutation =
  | 'normal'
  | 'cyclops'
  | 'tri_eye'
  | 'five_eyed'
  | 'heterochromia'
  | 'glowing_eyes';

export type HeadMutation =
  | 'none'
  | 'single_horn'
  | 'two_horns'
  | 'crystal_horns'
  | 'small_antlers'
  | 'quantum_antennae'
  | 'extra_ears';

export type LimbMutation =
  | 'normal'
  | 'oversized_paws'
  | 'tiny_forepaws'
  | 'missing_hind_legs'
  | 'ghostly_paws';

export type BodyMutation =
  | 'normal'
  | 'extra_fluffy'
  | 'ghost_body'
  | 'crystal_patches'
  | 'glitch_fur';

export type TailMutation =
  | 'none'
  | 'long_tail'
  | 'forked_tail'
  | 'glowing_tail'
  | 'crystal_tail'
  | 'spectral_tail'
  | 'bat_wings'
  | 'moth_wings';

export type AuraEffect =
  | 'none'
  | 'electric'
  | 'ghost'
  | 'plasma'
  | 'glitch'
  | 'cosmic'
  | 'crystal'
  | 'solar'
  | 'void';

export interface HybridPalette {
  body: string;
  dark: string;
  light: string;
  accent: string;
  glow: string;
}

export interface HybridCosmeticTraits {
  palette: HybridPalette;
  furPattern: FurPattern;
  bodyShape: BodyShape;
  earShape: EarShape;
  eyeColor: string;
  quantumEffect: QuantumEffect;
  cosmeticMutation: CosmeticMutation;
  // Extended modular quantum mutations
  eyeMutation?: EyeMutation;
  headMutation?: HeadMutation;
  limbMutation?: LimbMutation;
  bodyMutation?: BodyMutation;
  tailMutation?: TailMutation;
  auraEffect?: AuraEffect;
  activeMutations?: string[];
}

export type HybridExistenceStatus = 'alive' | 'missing' | 'deceased';

export type FateEventType =
  | 'hatched'
  | 'disappeared'
  | 'returned'
  | 'returned_changed'
  | 'deceased'
  | 'impossible_return';

export interface QuantumFateIncident {
  id: string;
  hybridId: string;
  type: FateEventType;
  timestamp: number;
  title: string;
  description: string;
  metadata?: {
    traitAdded?: string;
    previousStatus?: HybridExistenceStatus;
    newStatus?: HybridExistenceStatus;
    absenceDurationHours?: number;
    [key: string]: any;
  };
}

export interface QuantumHybrid {
  id: string;
  playerId: string;
  generatorVersion: number;
  seed: number;
  parent1Species: string;
  parent2Species: string;
  nickname: string;
  generatedName?: string;
  personality: HamsterPersonality;
  rarity: HybridRarity;
  discoveredAt: number;
  isFavorite: boolean;
  traits: HybridCosmeticTraits;
  // Generation & Lineage
  generation?: 1 | 2;
  parent1Id?: string;
  parent2Id?: string;
  parent1Name?: string;
  parent2Name?: string;
  ancestryLineage?: string;
  // Quantum Fate fields
  existenceStatus: HybridExistenceStatus;
  missingSince?: number | null;
  expectedReturnAt?: number | null;
  lastFateIncidentAt?: number | null;
  fateHistory?: QuantumFateIncident[];
  // Web3 v1 Immutable NFT fields
  nftTokenId?: number | null;
  nftTxHash?: string | null;
  nftContractAddress?: string | null;
  nftMintedAt?: number | null;
  nftMetadataUri?: string | null;
  nftOwnerAddress?: string | null;
}

export interface MintAuthorizationPayload {
  recipient: string;
  tokenId: number;
  tokenURI: string;
  metadataHash: string;
  specimenHash: string;
  nonce: string;
  deadline: number;
  signature: string;
  contractAddress: string;
  chainId: number;
}

export type MintGateStatus =
  | 'not_requested'
  | 'awaiting_block'
  | 'verifying'
  | 'unlocked'
  | 'minted';

export interface MintGateInfo {
  status: MintGateStatus;
  requestId?: string;
  specimenId?: string;
  baselineBlockHeight?: number;
  baselineRound?: number;
  requestTimestamp?: number;
  liveBlockHeight?: number;
  qualifyingBlockHeight?: number;
  qualifyingRound?: number;
  qualifyingConfirmedAt?: number;
  unlockedAt?: number;
  apiError?: string;
}

export interface Web3WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  isSepolia: boolean;
}

export interface SiweSessionState {
  authenticated: boolean;
  address: string | null;
  playerId: string | null;
  sessionToken: string | null;
}

export interface HybridStatePreview {
  id: 'A' | 'B';
  name: string;
  stability: 'High' | 'Moderate' | 'Low';
  mutationLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
  inheritanceType: 'Dominant P1' | 'Dominant P2' | 'Balanced Coherence' | 'Quantum Divergence';
  waveformColor: string;
  waveformStyle: 'sine' | 'pulse' | 'chaotic' | 'sawtooth';
  summary: string;
  revealedClue?: string | null;
}

export interface ActiveIncubationState {
  id: string;
  parent1Species: string;
  parent2Species: string;
  parent1Id?: string;
  parent2Id?: string;
  parent1Name?: string;
  parent2Name?: string;
  childGeneration?: 1 | 2;
  ancestryLineage?: string;
  startedAt: number;
  finishesAt: number;
  isLiveBreeding: boolean;
  stateA: HybridStatePreview;
  stateB: HybridStatePreview;
  _candidateA?: QuantumHybrid; // Preserved server-side
  _candidateB?: QuantumHybrid; // Preserved server-side
  ghostSightUsed: boolean;
  ghostSightTarget?: 'A' | 'B' | null;
}

export interface ResearchUpgrade {
  id: string;
  name: string;
  branch: 'engineering' | 'biology' | 'quantum';
  cost: number;
  description: string;
  icon: string;
  prerequisiteId?: string;
  effectType: 'battery_capacity' | 'cost_reduction' | 'species_unlock' | 'assistant_boost' | 'experiment_unlock' | 'lab_level' | 'grand_paradox' | 'genetics_unlock';
  effectValue: number;
}

export const RESEARCH_UPGRADES: ResearchUpgrade[] = [
  // Engineering Branch
  {
    id: 'improved_battery',
    name: 'Improved Battery Arrays',
    branch: 'engineering',
    cost: 15,
    description: 'Expands laboratory accumulator storage to 300 Battery Energy.',
    icon: '🔋',
    effectType: 'battery_capacity',
    effectValue: 300
  },
  {
    id: 'quantum_battery',
    name: 'Zero-Point Battery Core',
    branch: 'engineering',
    cost: 45,
    description: 'Expands laboratory accumulator storage to 600 Battery Energy.',
    icon: '⚡',
    prerequisiteId: 'improved_battery',
    effectType: 'battery_capacity',
    effectValue: 600
  },
  {
    id: 'efficiency_coils',
    name: 'Superconducting Coils',
    branch: 'engineering',
    cost: 30,
    description: 'Reduces energy waste, cutting all experiment costs by 10%.',
    icon: '🌀',
    effectType: 'cost_reduction',
    effectValue: 10
  },

  // Biology Branch
  {
    id: 'quantum_seeds',
    name: 'Entangled Sunflower Seeds',
    branch: 'biology',
    cost: 20,
    description: 'Enables discovery of Ghost and Glitch hamsters during experiments.',
    icon: '🌻',
    effectType: 'species_unlock',
    effectValue: 1
  },
  {
    id: 'assistant_resonance',
    name: 'Symbiotic Lab Coats',
    branch: 'biology',
    cost: 40,
    description: 'Equips your assistant hamster with a miniature coat, boosting its passive perk by 50%.',
    icon: '🥼',
    prerequisiteId: 'quantum_seeds',
    effectType: 'assistant_boost',
    effectValue: 50
  },
  {
    id: 'exotic_containment',
    name: 'Plasma-Safe Habitats',
    branch: 'biology',
    cost: 35,
    description: 'Enables discovery of Plasma Hamster and upgrades lab to Level 2 (Research Lab)!',
    icon: '🧪',
    effectType: 'lab_level',
    effectValue: 2
  },
  {
    id: 'quantum_genetics',
    name: 'Quantum Genetics Protocol',
    branch: 'biology',
    cost: 35,
    description: 'Unlocks the Quantum Incubator to breed two Base Hamsters into procedurally generated Quantum Hybrids!',
    icon: '🧬',
    prerequisiteId: 'quantum_seeds',
    effectType: 'genetics_unlock',
    effectValue: 1
  },

  // Quantum Physics Branch
  {
    id: 'unstable_chamber',
    name: 'Wavefunction Perturbation',
    branch: 'quantum',
    cost: 25,
    description: 'Unlocks Unstable Experiments, influenced by real hamster wheel speed patterns.',
    icon: '⚛️',
    effectType: 'experiment_unlock',
    effectValue: 2
  },
  {
    id: 'tachyon_field',
    name: 'Tachyon Containment Grid',
    branch: 'quantum',
    cost: 55,
    description: 'Unlocks Paradox Experiments and elevates lab to Level 3 (Quantum Lab)!',
    icon: '🌌',
    prerequisiteId: 'unstable_chamber',
    effectType: 'lab_level',
    effectValue: 3
  },
  {
    id: 'grand_paradox_blueprint',
    name: 'The Grand Paradox Blueprint',
    branch: 'quantum',
    cost: 100,
    description: 'The final equation of quantum rodent dynamics. Allows conducting The Grand Paradox!',
    icon: '👑',
    prerequisiteId: 'tachyon_field',
    effectType: 'grand_paradox',
    effectValue: 1
  }
];

export interface ExperimentTypeInfo {
  id: 'basic' | 'unstable' | 'paradox' | 'grand';
  name: string;
  cost: number;
  durationSeconds: number;
  description: string;
  badge: string;
  requiredResearchId?: string;
}

export const EXPERIMENT_TYPES: Record<string, ExperimentTypeInfo> = {
  basic: {
    id: 'basic',
    name: 'Basic Experiment',
    cost: 10,
    durationSeconds: 5,
    description: 'Safe quantum measurement. Yields reliable Research Notes and common hamsters.',
    badge: 'Standard'
  },
  unstable: {
    id: 'unstable',
    name: 'Unstable Experiment',
    cost: 25,
    durationSeconds: 9,
    description: 'Chamber conditions fluctuate with Squeektoshi\'s live RPM. Higher risk, rarer species.',
    badge: 'Live RPM Influenced',
    requiredResearchId: 'unstable_chamber'
  },
  paradox: {
    id: 'paradox',
    name: 'Paradox Experiment',
    cost: 50,
    durationSeconds: 14,
    description: 'Deep quantum tunneling. Generates abundant Insight and unlocks high-tier species.',
    badge: 'High Energy',
    requiredResearchId: 'tachyon_field'
  },
  grand: {
    id: 'grand',
    name: 'The Grand Paradox',
    cost: 150,
    durationSeconds: 20,
    description: 'The ultimate breakthrough. Opens a portal to the Schrödinger dimension to rescue the Paradox Hamster!',
    badge: 'Climax Climax',
    requiredResearchId: 'grand_paradox_blueprint'
  }
};

export type ExperimentApproach = 'stable' | 'chaotic';

export interface QuantumStatePreview {
  id: 'A' | 'B';
  name: string;
  stability: 'High' | 'Moderate' | 'Low' | 'Volatile';
  energySignature: 'Low' | 'Medium' | 'High' | 'Anomalous';
  researchPotential: 'High' | 'Moderate' | 'Variable';
  mutationPotential: 'High' | 'Moderate' | 'Low';
  waveformColor: string;
  waveformStyle: 'sine' | 'pulse' | 'chaotic' | 'sawtooth';
  summary: string;
  revealedClue?: string | null;
}

export interface ExperimentOutcome {
  type: 'new_species' | 'duplicate_species' | 'research_insight' | 'quantum_surge';
  speciesId?: string;
  speciesName?: string;
  hamster?: CollectibleHamster; // Individual companion awarded!
  isNewSpecies?: boolean; // True if this species was never discovered before
  insightAwarded: number;
  batteryAwarded?: number;
  message: string;
  flavorText: string;
}

export interface ActiveExperimentState {
  id: string;
  type: 'basic' | 'unstable' | 'paradox' | 'grand';
  approach: ExperimentApproach;
  startedAt: number;
  finishesAt: number;
  energyCost: number;
  status: 'running' | 'completed';
  stateA: QuantumStatePreview;
  stateB: QuantumStatePreview;
  ghostSightUsed: boolean;
  ghostSightTarget?: 'A' | 'B' | null;
  outcome?: ExperimentOutcome;
  _outcomeA?: ExperimentOutcome;
  _outcomeB?: ExperimentOutcome;
}

export interface PlayerState {
  id: string;
  createdAt?: number;
  batteryEnergy: number;
  batteryCapacity: number;
  researchInsight: number;
  labLevel: 1 | 2 | 3;
  activeAssistant: string | null; // Species ID of assistant
  activeAssistantHamsterId?: string | null; // Specific individual ID assigned
  discoveredHamsters: Record<string, { discoveredAt: number; count: number }>;
  hamsters: CollectibleHamster[]; // Individual collection (up to 30 companions)
  hybrids: QuantumHybrid[]; // Procedural hybrid collection (up to 30 hybrids)
  activeIncubation: ActiveIncubationState | null; // Active breeding incubation
  breedingCharges: number; // Stored breeding charges (0 to 3)
  breedingChargeProgress: number; // Work progress toward next charge (0 to 2000)
  lastLiveBreedingAt: number; // Timestamp of last free live breeding
  activeLabHybridId?: string | null; // Optional cosmetic hybrid wandering lab
  lastFateRollAt: number; // Timestamp of last Quantum Fate incident check
  lastSeriousIncidentAt: number; // Timestamp of last major incident (death/grave event cooldown)
  recentFateIncidents?: QuantumFateIncident[]; // Ephemeral/latest incidents for notification
  unlockedResearch: string[];
  activeExperiment: ActiveExperimentState | null;
  lastCreditedWork: number;
  fractionalWorkRemainder: number;
  completedGrandParadox: boolean;
  totalExperimentsConducted: number;
  lastRegenAt: number;
  lastActiveAt?: number;
  fractionalRegenMs: number;
  hybridCapacityBonus?: number; // Additional hybrid slots earned from research mastery
  researchMasteryLevel?: number; // Mastery rank achieved through note investment
  saveRevision?: number; // Monotonically increasing revision counter (server-authoritative)
  saveLineageId?: string; // Stable lineage identifier for continuous progression branch
  lastRestoredBackupId?: string | null; // ID of the most recent restored backup snapshot
}

export interface PlayerBackupSummary {
  saveRevision?: number;
  labLevel: number;
  totalHamsters: number;
  totalHybrids: number;
  researchInsight: number;
  batteryCapacity: number;
  breedingCharges: number;
  totalExperiments: number;
}

export interface PlayerBackupFile {
  app: string;
  version: number;
  backupId?: string;
  lineageId?: string;
  saveRevision?: number;
  exportedAt: number;
  exportedDate: string;
  playerId: string;
  walletAddress?: string | null;
  summary: PlayerBackupSummary;
  playerState: PlayerState;
  signature: string;
}

export interface BackupValidationResult {
  valid: boolean;
  canRestore: boolean;
  error?: string | null;
  message: string;
  summary?: PlayerBackupSummary;
  exportedDate?: string;
  backupId?: string;
  saveRevision?: number;
}

export const MAX_HYBRID_CAPACITY = 30;
export const WORK_PER_BREEDING_CHARGE = 2000;
export const MAX_BREEDING_CHARGES = 3;
export const LIVE_BREEDING_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

export const NOTE_COST_BATTERY_RECHARGE = 15;
export const NOTE_ENERGY_RECHARGE_AMOUNT = 50;
export const NOTE_COST_BREEDING_CHARGE = 25;
export const NOTE_COST_HABITAT_EXPANSION = 50;

export function getMaxHybridCapacity(player?: PlayerState | null): number {
  return MAX_HYBRID_CAPACITY + (player?.hybridCapacityBonus || 0);
}

// Quantum Fate Constants
export const NEWBORN_PROTECTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days of protection from permanent death
export const FATE_ROLL_INTERVAL_MS = 24 * 60 * 60 * 1000; // At most one incident opportunity per player per 24 hours
export const FATE_INCIDENT_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days individual cooldown for recent incident
export const MAX_ABSENCE_LEGENDARY_MYTHIC_MS = 24 * 60 * 60 * 1000; // Max 24 hours absence for top-tier hybrids

export function isQuantumGeneticsUnlocked(player: PlayerState): boolean {
  const baseCount = Object.keys(player.discoveredHamsters || {}).length;
  const isLevel2 = (player.labLevel || 1) >= 2;
  const hasResearch = (player.unlockedResearch || []).includes('quantum_genetics');
  return baseCount >= 3 && isLevel2 && hasResearch;
}
