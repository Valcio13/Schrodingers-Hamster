import {
  HAMSTER_SPECIES,
  HAMSTER_PERSONALITIES,
  RESEARCH_UPGRADES,
  EXPERIMENT_TYPES,
  PlayerState,
  ExperimentOutcome,
  ExperimentApproach,
  QuantumStatePreview,
  CollectibleHamster,
  HamsterPersonality,
  QuantumHybrid,
  ActiveIncubationState,
  HybridStatePreview,
  MAX_HYBRID_CAPACITY,
  WORK_PER_BREEDING_CHARGE,
  MAX_BREEDING_CHARGES,
  LIVE_BREEDING_COOLDOWN_MS,
  NEWBORN_PROTECTION_MS,
  FATE_ROLL_INTERVAL_MS,
  FATE_INCIDENT_COOLDOWN_MS,
  MAX_ABSENCE_LEGENDARY_MYTHIC_MS,
  QuantumFateIncident,
  FateEventType,
  isQuantumGeneticsUnlocked,
  getMaxHybridCapacity,
  NOTE_COST_BATTERY_RECHARGE,
  NOTE_ENERGY_RECHARGE_AMOUNT,
  NOTE_COST_BREEDING_CHARGE,
  NOTE_COST_HABITAT_EXPANSION
} from '../src/types/game';
import { generateQuantumHybrid } from '../src/utils/hybridGenerator';
import { SqueekTelemetry } from './squeekchain';

export {
  MAX_HYBRID_CAPACITY,
  WORK_PER_BREEDING_CHARGE,
  MAX_BREEDING_CHARGES,
  LIVE_BREEDING_COOLDOWN_MS,
  NEWBORN_PROTECTION_MS,
  FATE_ROLL_INTERVAL_MS,
  FATE_INCIDENT_COOLDOWN_MS,
  MAX_ABSENCE_LEGENDARY_MYTHIC_MS,
  getMaxHybridCapacity,
  NOTE_COST_BATTERY_RECHARGE,
  NOTE_ENERGY_RECHARGE_AMOUNT,
  NOTE_COST_BREEDING_CHARGE,
  NOTE_COST_HABITAT_EXPANSION
};

export const MAX_COLLECTION_CAPACITY = 30;

export function createInitialPlayerState(playerId: string, currentSettledWork: number): PlayerState {
  const now = Date.now();
  const starterHamster: CollectibleHamster = {
    id: `ham_${playerId}_normal_${now}`,
    playerId,
    speciesId: 'normal',
    nickname: 'Squeeky',
    personality: 'Curious',
    discoveredAt: now,
    experimentTier: 'basic',
    observationState: 'A',
    isFavorite: true,
    isAssistant: true
  };

  return {
    id: playerId,
    batteryEnergy: 100, // Battery 2.0: Starting 100 energy
    batteryCapacity: 150, // Starting capacity 150
    researchInsight: 5,
    labLevel: 1, // Makeshift Lab
    activeAssistant: 'normal',
    activeAssistantHamsterId: starterHamster.id,
    discoveredHamsters: {
      normal: { discoveredAt: now, count: 1 }
    },
    hamsters: [starterHamster], // Initial individual collection
    hybrids: [], // Quantum Hybrids collection
    activeIncubation: null, // Active breeding chamber
    breedingCharges: 0, // Stored charges
    breedingChargeProgress: 0, // Settled work towards next charge
    lastLiveBreedingAt: 0, // Last live free breeding timestamp
    activeLabHybridId: null, // Favorite hybrid wandering the lab
    unlockedResearch: [],
    activeExperiment: null,
    lastCreditedWork: currentSettledWork,
    fractionalWorkRemainder: 0,
    completedGrandParadox: false,
    totalExperimentsConducted: 0,
    lastRegenAt: now,
    fractionalRegenMs: 0,
    lastFateRollAt: now,
    lastSeriousIncidentAt: 0,
    recentFateIncidents: [],
    saveRevision: 1,
    saveLineageId: `lin_${playerId}_${now}`,
    lastRestoredBackupId: null
  };
}

/**
 * Migration helper to ensure legacy player state receives
 * individual collectible hamsters and Battery 2.0 fields.
 */
export function ensurePlayerMigration(player: any, now: number = Date.now()) {
  if (!player.lastRegenAt) {
    player.lastRegenAt = now;
    player.fractionalRegenMs = 0;
  }
  if (player.batteryEnergy > player.batteryCapacity) {
    player.batteryEnergy = player.batteryCapacity;
  }

  // Quantum Collection: Backfill individual hamsters if missing
  if (!player.hamsters || player.hamsters.length === 0) {
    player.hamsters = [];
    const discovered = player.discoveredHamsters || { normal: { discoveredAt: now, count: 1 } };
    for (const [speciesId, rawInfo] of Object.entries(discovered)) {
      const info = (rawInfo || {}) as any;
      const isAsst = player.activeAssistant === speciesId;
      const individual: CollectibleHamster = {
        id: `ham_${player.id || 'p'}_${speciesId}_${info.discoveredAt || now}`,
        playerId: player.id || 'p',
        speciesId,
        nickname: HAMSTER_SPECIES[speciesId]?.name || 'Hamster',
        personality: 'Curious',
        discoveredAt: info.discoveredAt || now,
        experimentTier: 'basic',
        isFavorite: isAsst,
        isAssistant: isAsst
      };
      player.hamsters.push(individual);
      if (isAsst) {
        player.activeAssistantHamsterId = individual.id;
      }
    }
  }

  // Ensure activeAssistantHamsterId is valid
  if (!player.activeAssistantHamsterId && player.hamsters.length > 0) {
    const asst = player.hamsters.find((h: any) => h.isAssistant) || player.hamsters[0];
    asst.isAssistant = true;
    player.activeAssistant = asst.speciesId;
    player.activeAssistantHamsterId = asst.id;
  }

  // Quantum Genetics: Backfill hybrid fields
  if (!player.hybrids) {
    player.hybrids = [];
  }
  if (player.activeIncubation === undefined) {
    player.activeIncubation = null;
  }
  if (player.breedingCharges === undefined) {
    player.breedingCharges = 0;
  }
  if (player.breedingChargeProgress === undefined) {
    player.breedingChargeProgress = 0;
  }
  if (player.lastLiveBreedingAt === undefined) {
    player.lastLiveBreedingAt = 0;
  }
  if (player.activeLabHybridId === undefined) {
    player.activeLabHybridId = null;
  }

  // Quantum Fate backfill
  if (player.lastFateRollAt === undefined) {
    player.lastFateRollAt = now;
  }
  if (player.lastSeriousIncidentAt === undefined) {
    player.lastSeriousIncidentAt = 0;
  }
  if (!player.recentFateIncidents) {
    player.recentFateIncidents = [];
  }
  if (!player.saveRevision) {
    player.saveRevision = 1;
  }
  if (!player.saveLineageId) {
    player.saveLineageId = `lin_${player.id}`;
  }
  if (player.lastRestoredBackupId === undefined) {
    player.lastRestoredBackupId = null;
  }

  // Ensure all hybrids have existenceStatus, fate fields, and initial hatched history
  for (const hybrid of (player.hybrids || [])) {
    if (!hybrid.existenceStatus) {
      hybrid.existenceStatus = 'alive';
    }
    if (hybrid.missingSince === undefined) {
      hybrid.missingSince = null;
    }
    if (hybrid.expectedReturnAt === undefined) {
      hybrid.expectedReturnAt = null;
    }
    if (hybrid.lastFateIncidentAt === undefined) {
      hybrid.lastFateIncidentAt = hybrid.discoveredAt || now;
    }
    if (!hybrid.fateHistory || hybrid.fateHistory.length === 0) {
      hybrid.fateHistory = [
        {
          id: `fate_${player.id || 'p'}_${hybrid.id}_${hybrid.discoveredAt || now}`,
          hybridId: hybrid.id,
          type: 'hatched',
          timestamp: hybrid.discoveredAt || now,
          title: 'Quantum Genesis',
          description: `Hatched from quantum observation in the incubator chamber.`
        }
      ];
    }
  }
}

/**
 * Accumulate breeding charge progress from newly verified Squeekchain work.
 * 1 Charge per 2,000 eligible settled work units (max 3 charges).
 */
export function applyBreedingWorkProgress(player: PlayerState, deltaWorkUnits: number) {
  if (deltaWorkUnits <= 0) return;
  player.breedingChargeProgress = (player.breedingChargeProgress || 0) + deltaWorkUnits;
  while (player.breedingChargeProgress >= WORK_PER_BREEDING_CHARGE && (player.breedingCharges || 0) < MAX_BREEDING_CHARGES) {
    player.breedingCharges = (player.breedingCharges || 0) + 1;
    player.breedingChargeProgress -= WORK_PER_BREEDING_CHARGE;
  }
  if ((player.breedingCharges || 0) >= MAX_BREEDING_CHARGES) {
    player.breedingChargeProgress = Math.min(player.breedingChargeProgress, WORK_PER_BREEDING_CHARGE);
  }
}

/**
 * Generate a truthful preview clue for a candidate hybrid state
 */
export function createHybridStatePreview(stateId: 'A' | 'B', hybrid: QuantumHybrid): HybridStatePreview {
  const { rarity, traits } = hybrid;

  let stability: 'High' | 'Moderate' | 'Low' = 'High';
  if (rarity === 'legendary' || rarity === 'mythic') stability = 'Low';
  else if (rarity === 'rare' || rarity === 'epic') stability = 'Moderate';

  let mutationLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' = 'Low';
  if (traits.cosmeticMutation === 'floating_orbs' || traits.cosmeticMutation === 'energy_wings') {
    mutationLevel = 'Extreme';
  } else if (traits.cosmeticMutation === 'crystal_tail' || traits.cosmeticMutation === 'third_eye') {
    mutationLevel = 'High';
  } else if (traits.cosmeticMutation === 'star_sparkles' || traits.cosmeticMutation === 'tiny_horns') {
    mutationLevel = 'Moderate';
  }

  let inheritanceType: 'Dominant P1' | 'Dominant P2' | 'Balanced Coherence' | 'Quantum Divergence' = 'Balanced Coherence';
  if (rarity === 'mythic' || rarity === 'legendary') {
    inheritanceType = 'Quantum Divergence';
  } else if (traits.palette.accent === HAMSTER_SPECIES[hybrid.parent1Species]?.color) {
    inheritanceType = 'Dominant P1';
  } else if (traits.palette.accent === HAMSTER_SPECIES[hybrid.parent2Species]?.color) {
    inheritanceType = 'Dominant P2';
  }

  let waveformColor = '#10b981';
  let waveformStyle: 'sine' | 'pulse' | 'chaotic' | 'sawtooth' = 'sine';

  if (stability === 'Low') {
    waveformColor = '#a855f7';
    waveformStyle = 'chaotic';
  } else if (stability === 'Moderate') {
    waveformColor = '#06b6d4';
    waveformStyle = 'pulse';
  }

  const p1Name = HAMSTER_SPECIES[hybrid.parent1Species]?.name || 'Parent 1';
  const p2Name = HAMSTER_SPECIES[hybrid.parent2Species]?.name || 'Parent 2';

  const summary = `Genetic superposition synthesized from ${p1Name} and ${p2Name}. Shows ${stability.toLowerCase()} stability with ${mutationLevel.toLowerCase()} phenotypic mutation.`;

  return {
    id: stateId,
    name: `State ${stateId} — ${stability} Coherence`,
    stability,
    mutationLevel,
    inheritanceType,
    waveformColor,
    waveformStyle,
    summary,
    revealedClue: null
  };
}

/**
 * Start incubation between two owned Base Hamster parents.
 * Checks unlock status, hybrid capacity, parent ownership, and live vs. stored charge breeding.
 */
export function startIncubation(
  player: PlayerState,
  parent1Species: string,
  parent2Species: string,
  telemetry: SqueekTelemetry,
  now: number = Date.now()
): { player: PlayerState; activeIncubation: ActiveIncubationState } {
  if (!isQuantumGeneticsUnlocked(player)) {
    throw new Error('Quantum Genetics is locked. Unlock requires 3 Base Species, Lab Level 2, and Quantum Genetics research.');
  }

  const activeHybrids = (player.hybrids || []).filter(h => h.existenceStatus !== 'deceased');
  const maxCapacity = getMaxHybridCapacity(player);
  if (activeHybrids.length >= maxCapacity) {
    throw new Error(`Quantum Hybrids capacity reached (${activeHybrids.length}/${maxCapacity}). Expand colony habitat or release an unwanted hybrid to incubate.`);
  }

  if (player.activeIncubation) {
    throw new Error('An incubation is already active in the Quantum Incubator chamber.');
  }

  // Validate parents: must be discovered Base Hamsters
  if (!player.discoveredHamsters[parent1Species] || !HAMSTER_SPECIES[parent1Species]) {
    throw new Error(`Invalid Parent 1: ${parent1Species} is not discovered.`);
  }
  if (!player.discoveredHamsters[parent2Species] || !HAMSTER_SPECIES[parent2Species]) {
    throw new Error(`Invalid Parent 2: ${parent2Species} is not discovered.`);
  }

  // Check breeding method: Live Squeektoshi running vs Stored Charge
  const isSqueektoshiRunning = (telemetry.rpm || 0) > 0 && telemetry.freshness === 'online';
  const liveCooldownElapsed = now - (player.lastLiveBreedingAt || 0);
  const isLiveBreedingEligible = isSqueektoshiRunning && liveCooldownElapsed >= LIVE_BREEDING_COOLDOWN_MS;

  let isLiveBreeding = false;
  if (isLiveBreedingEligible) {
    // Free live breeding! Does not consume stored charges
    isLiveBreeding = true;
    player.lastLiveBreedingAt = now;
  } else {
    // Requires a stored breeding charge
    if ((player.breedingCharges || 0) < 1) {
      if (isSqueektoshiRunning) {
        const minsLeft = Math.ceil((LIVE_BREEDING_COOLDOWN_MS - liveCooldownElapsed) / 60000);
        throw new Error(`Live breeding cooldown active (${minsLeft}m remaining) and no stored breeding charges available.`);
      }
      throw new Error('No breeding charges available. Accumulate 2,000 settled work units from Squeektoshi or wait for live running!');
    }
    player.breedingCharges -= 1;
  }

  // Generate Candidate A & Candidate B with deterministic seeds
  const seedA = Math.floor(now % 100000000) + Math.floor(Math.random() * 999999);
  const seedB = seedA + 77777 + Math.floor(Math.random() * 55555);

  const candidateA = generateQuantumHybrid(player.id, parent1Species, parent2Species, seedA);
  const candidateB = generateQuantumHybrid(player.id, parent1Species, parent2Species, seedB);

  const stateA = createHybridStatePreview('A', candidateA);
  const stateB = createHybridStatePreview('B', candidateB);

  // 8-second incubation duration
  const incubationDurationMs = 8000;

  const incubation: ActiveIncubationState = {
    id: `inc_${player.id}_${now}`,
    parent1Species,
    parent2Species,
    startedAt: now,
    finishesAt: now + incubationDurationMs,
    isLiveBreeding,
    stateA,
    stateB,
    _candidateA: candidateA,
    _candidateB: candidateB,
    ghostSightUsed: false,
    ghostSightTarget: null
  };

  player.activeIncubation = incubation;
  return { player, activeIncubation: incubation };
}

/**
 * Ghost Hamster Quantum Sight for Incubation
 */
export function useIncubationGhostSight(
  player: PlayerState,
  target: 'A' | 'B'
): { clue: string; activeIncubation: ActiveIncubationState } {
  if (player.activeAssistant !== 'ghost') {
    throw new Error('Ghost Hamster must be assigned as active lab assistant to use Quantum Sight.');
  }

  const inc = player.activeIncubation;
  if (!inc) {
    throw new Error('No active incubation in chamber.');
  }

  if (inc.ghostSightUsed) {
    throw new Error('Quantum Sight can only be used once per incubation.');
  }

  const candidate = target === 'B' ? inc._candidateA && inc._candidateB : inc._candidateA;
  const pickedCandidate = target === 'B' ? inc._candidateB : inc._candidateA;

  if (!pickedCandidate) {
    throw new Error('Candidate data not found.');
  }

  const clue = `👻 Quantum Sight (State ${target}): Spectral resonance reveals a ${pickedCandidate.rarity.toUpperCase()} hybrid with ${pickedCandidate.traits.furPattern.replace('_', ' ')} pattern and ${pickedCandidate.personality} temperament!`;

  inc.ghostSightUsed = true;
  inc.ghostSightTarget = target;
  if (target === 'A') {
    inc.stateA.revealedClue = clue;
  } else {
    inc.stateB.revealedClue = clue;
  }

  return { clue, activeIncubation: inc };
}

/**
 * Reveal / Collapse Chosen Quantum State in Incubation
 */
export function revealIncubation(
  player: PlayerState,
  chosenState: 'A' | 'B',
  now: number = Date.now()
): { player: PlayerState; hybrid: QuantumHybrid; chosenState: 'A' | 'B' } {
  const inc = player.activeIncubation;
  if (!inc) {
    throw new Error('No active incubation to observe.');
  }

  if (now < inc.finishesAt) {
    throw new Error('Quantum genetic waveform has not stabilized yet.');
  }

  const chosenHybrid = chosenState === 'B' ? inc._candidateB : inc._candidateA;
  if (!chosenHybrid) {
    throw new Error('Failed to resolve chosen hybrid candidate.');
  }

  // Clear unchosen candidate and add chosen hybrid to collection
  if (!player.hybrids) player.hybrids = [];
  player.hybrids.push(chosenHybrid);
  player.activeIncubation = null;

  return { player, hybrid: chosenHybrid, chosenState };
}

/**
 * Release an unwanted hybrid to the Quantum Field for a battery energy refund.
 * Base Hamsters cannot be released. Favorited hybrids must be unfavorited first.
 */
export function releaseHybrid(
  player: PlayerState,
  hybridId: string
): { player: PlayerState; releasedHybrid: QuantumHybrid; energyRefunded: number } {
  if (!player.hybrids) player.hybrids = [];

  const index = player.hybrids.findIndex(h => h.id === hybridId);
  if (index === -1) {
    throw new Error('Hybrid not found in your collection.');
  }

  const hybrid = player.hybrids[index];

  if (hybrid.existenceStatus === 'missing') {
    throw new Error('Missing hamsters cannot be released while unobserved in the quantum void.');
  }

  if (hybrid.existenceStatus === 'deceased') {
    throw new Error('Deceased hamsters cannot be released.');
  }

  if (hybrid.isFavorite) {
    throw new Error('Cannot release a favorited hybrid. Please unfavorite it first.');
  }

  // Base Hamster check: hybridId must be a hybrid
  if (!hybrid.id.startsWith('hybrid_')) {
    throw new Error('Base Hamsters cannot be released.');
  }

  // Refund values by rarity
  const refundValues: Record<string, number> = {
    common: 15,
    uncommon: 20,
    rare: 25,
    epic: 30,
    legendary: 40,
    mythic: 50
  };

  const refund = refundValues[hybrid.rarity] || 15;
  const oldBattery = player.batteryEnergy;
  player.batteryEnergy = Math.min(player.batteryCapacity, player.batteryEnergy + refund);
  const actualRefund = player.batteryEnergy - oldBattery;

  // If this hybrid was the lab display companion, clear it
  if (player.activeLabHybridId === hybridId) {
    player.activeLabHybridId = null;
  }

  // Remove hybrid from collection
  player.hybrids.splice(index, 1);

  return {
    player,
    releasedHybrid: hybrid,
    energyRefunded: actualRefund
  };
}

/**
 * Rename hybrid
 */
export function renameHybrid(
  player: PlayerState,
  hybridId: string,
  rawNickname: string
): { player: PlayerState; hybrid: QuantumHybrid } {
  if (!player.hybrids) player.hybrids = [];
  const hybrid = player.hybrids.find(h => h.id === hybridId);
  if (!hybrid) {
    throw new Error('Hybrid not found.');
  }

  const cleanName = (rawNickname || '').replace(/[<>&"']/g, '').trim().slice(0, 20);
  if (!cleanName) {
    throw new Error('Nickname must be between 1 and 20 characters.');
  }

  hybrid.nickname = cleanName;
  return { player, hybrid };
}

/**
 * Toggle Favorite status on hybrid
 */
export function toggleFavoriteHybrid(
  player: PlayerState,
  hybridId: string
): { player: PlayerState; hybrid: QuantumHybrid } {
  if (!player.hybrids) player.hybrids = [];
  const hybrid = player.hybrids.find(h => h.id === hybridId);
  if (!hybrid) {
    throw new Error('Hybrid not found.');
  }

  hybrid.isFavorite = !hybrid.isFavorite;
  return { player, hybrid };
}

/**
 * Set or unset the cosmetic hybrid wandering the lab environment
 */
export function setLabDisplayHybrid(
  player: PlayerState,
  hybridId: string | null
): { player: PlayerState } {
  if (hybridId !== null) {
    const hybrid = (player.hybrids || []).find(h => h.id === hybridId);
    if (!hybrid) {
      throw new Error('Hybrid not found in your collection.');
    }
    if (hybrid.existenceStatus === 'missing') {
      throw new Error('Cannot assign a missing hamster to lab display.');
    }
    if (hybrid.existenceStatus === 'deceased') {
      throw new Error('Cannot assign a deceased hamster to lab display.');
    }
  }
  player.activeLabHybridId = hybridId;
  return { player };
}

/**
 * Quantum Fate: Passive random incident engine.
 * Server-authoritative, checked during state synchronization or work claims.
 */
export function processQuantumFate(
  player: PlayerState,
  now: number = Date.now(),
  forceEvent?: { type: FateEventType; hybridId?: string }
): QuantumFateIncident[] {
  ensurePlayerMigration(player, now);
  const incidents: QuantumFateIncident[] = [];
  if (!player.hybrids || player.hybrids.length === 0) {
    return incidents;
  }

  // 1. Process Missing Hybrids due for return
  for (const hybrid of player.hybrids) {
    if (hybrid.existenceStatus === 'missing') {
      const isDue = hybrid.expectedReturnAt && now >= hybrid.expectedReturnAt;
      const isForcedReturn =
        forceEvent &&
        (forceEvent.type === 'returned' || forceEvent.type === 'returned_changed') &&
        (!forceEvent.hybridId || forceEvent.hybridId === hybrid.id);

      if (isDue || isForcedReturn) {
        const returnChanged =
          forceEvent?.type === 'returned_changed' || (!forceEvent && Math.random() < 0.35);
        hybrid.existenceStatus = 'alive';
        hybrid.missingSince = null;
        hybrid.expectedReturnAt = null;
        hybrid.lastFateIncidentAt = now;

        if (returnChanged) {
          // Mutate cosmetic mutation trait
          const mutationPool: any[] = [
            'floating_orbs',
            'energy_wings',
            'crystal_tail',
            'third_eye',
            'star_sparkles',
            'tiny_horns'
          ];
          const availableMutations = mutationPool.filter(m => m !== hybrid.traits.cosmeticMutation);
          const chosenMutation =
            availableMutations[Math.floor(Math.random() * availableMutations.length)] || 'floating_orbs';
          hybrid.traits.cosmeticMutation = chosenMutation;

          const incident: QuantumFateIncident = {
            id: `fate_${player.id}_${hybrid.id}_${now}_ret_chg`,
            hybridId: hybrid.id,
            type: 'returned_changed',
            timestamp: now,
            title: `⚛️ Familiar Signal Detected`,
            description: `${hybrid.nickname} has returned, but its quantum signature no longer matches our records!`,
            metadata: {
              previousStatus: 'missing',
              newStatus: 'alive',
              traitAdded: chosenMutation.replace('_', ' ')
            }
          };
          if (!hybrid.fateHistory) hybrid.fateHistory = [];
          hybrid.fateHistory.push(incident);
          incidents.push(incident);
        } else {
          const incident: QuantumFateIncident = {
            id: `fate_${player.id}_${hybrid.id}_${now}_ret`,
            hybridId: hybrid.id,
            type: 'returned',
            timestamp: now,
            title: `⚛️ Familiar Signal Detected`,
            description: `${hybrid.nickname} safely re-materialized in the quantum sanctuary from unobserved space, nibbling contentedly on seeds.`,
            metadata: {
              previousStatus: 'missing',
              newStatus: 'alive'
            }
          };
          if (!hybrid.fateHistory) hybrid.fateHistory = [];
          hybrid.fateHistory.push(incident);
          incidents.push(incident);
        }
      }
    }
  }

  // 2. Process Impossible Return for Deceased Hybrids
  const deceasedHybrids = player.hybrids.filter(h => h.existenceStatus === 'deceased');
  if (deceasedHybrids.length > 0) {
    const isForcedImpossible = forceEvent && forceEvent.type === 'impossible_return';
    const naturalImpossible =
      !forceEvent &&
      now - (player.lastFateRollAt || 0) >= FATE_ROLL_INTERVAL_MS &&
      Math.random() < 0.01;

    if (isForcedImpossible || naturalImpossible) {
      const targetDeceased =
        (forceEvent?.hybridId && deceasedHybrids.find(h => h.id === forceEvent.hybridId)) ||
        deceasedHybrids[0];
      if (targetDeceased) {
        targetDeceased.existenceStatus = 'alive';
        targetDeceased.lastFateIncidentAt = now;
        const incident: QuantumFateIncident = {
          id: `fate_${player.id}_${targetDeceased.id}_${now}_imp`,
          hybridId: targetDeceased.id,
          type: 'impossible_return',
          timestamp: now,
          title: `⚠ Impossible Event Detected`,
          description: `${targetDeceased.nickname} has returned. Our records indicate that this should not be possible!`,
          metadata: {
            previousStatus: 'deceased',
            newStatus: 'alive'
          }
        };
        if (!targetDeceased.fateHistory) targetDeceased.fateHistory = [];
        targetDeceased.fateHistory.push(incident);
        incidents.push(incident);
      }
    }
  }

  // 3. Process 24-hour New Incident Roll (Offline lazy single batch)
  if (
    forceEvent &&
    (forceEvent.type === 'returned' ||
      forceEvent.type === 'returned_changed' ||
      forceEvent.type === 'impossible_return')
  ) {
    player.recentFateIncidents = [...(player.recentFateIncidents || []), ...incidents];
    return incidents;
  }

  if (!forceEvent) {
    const elapsedSinceRoll = now - (player.lastFateRollAt || 0);
    if (elapsedSinceRoll < FATE_ROLL_INTERVAL_MS) {
      // Cooldown active, return any returns that occurred
      player.recentFateIncidents = [...(player.recentFateIncidents || []), ...incidents];
      return incidents;
    }
    // Update lastFateRollAt lazily to now (preventing catch-up storm)
    player.lastFateRollAt = now;
    // 25% chance of an incident
    if (Math.random() > 0.25) {
      player.recentFateIncidents = [...(player.recentFateIncidents || []), ...incidents];
      return incidents;
    }
  }

  // Candidate Selection (Alive hybrids only)
  const aliveHybrids = player.hybrids.filter(h => h.existenceStatus === 'alive');
  if (aliveHybrids.length === 0) {
    player.recentFateIncidents = [...(player.recentFateIncidents || []), ...incidents];
    return incidents;
  }

  let eligible = aliveHybrids;
  if (!forceEvent) {
    eligible = aliveHybrids.filter(
      h => !h.lastFateIncidentAt || now - h.lastFateIncidentAt >= FATE_INCIDENT_COOLDOWN_MS
    );
  } else if (forceEvent.hybridId) {
    eligible = aliveHybrids.filter(h => h.id === forceEvent.hybridId);
  }

  if (eligible.length === 0) {
    player.recentFateIncidents = [...(player.recentFateIncidents || []), ...incidents];
    return incidents;
  }

  const target = eligible[Math.floor(Math.random() * eligible.length)];

  // Determine incident type
  let eventType: 'disappeared' | 'deceased' = 'disappeared';
  if (forceEvent && (forceEvent.type === 'disappeared' || forceEvent.type === 'deceased')) {
    eventType = forceEvent.type;
  } else if (!forceEvent) {
    // Check death eligibility
    const isProtectedFromDeath =
      target.isFavorite ||
      now - target.discoveredAt < NEWBORN_PROTECTION_MS ||
      target.rarity === 'legendary' ||
      target.rarity === 'mythic' ||
      now - (player.lastSeriousIncidentAt || 0) < 7 * 24 * 60 * 60 * 1000;

    if (!isProtectedFromDeath) {
      // Very rare death chances
      const deathRates: Record<string, number> = {
        common: 0.05,
        uncommon: 0.03,
        rare: 0.01,
        epic: 0.005
      };
      const deathChance = deathRates[target.rarity] || 0.01;
      if (Math.random() < deathChance) {
        eventType = 'deceased';
      }
    }
  }

  // Double-check protection: if eventType is deceased, verify rules
  if (
    eventType === 'deceased' &&
    (target.isFavorite ||
      now - target.discoveredAt < NEWBORN_PROTECTION_MS ||
      target.rarity === 'legendary' ||
      target.rarity === 'mythic')
  ) {
    // Protection fallback: cannot die, disappears instead
    eventType = 'disappeared';
  }

  // Execute Disappearance
  if (eventType === 'disappeared') {
    target.existenceStatus = 'missing';
    target.missingSince = now;
    const maxAbsence =
      target.rarity === 'legendary' || target.rarity === 'mythic'
        ? MAX_ABSENCE_LEGENDARY_MYTHIC_MS
        : 24 * 60 * 60 * 1000;
    const absenceDuration = Math.min(
      maxAbsence,
      Math.max(2 * 3600000, Math.floor(Math.random() * maxAbsence))
    );
    target.expectedReturnAt = now + absenceDuration;
    target.lastFateIncidentAt = now;

    if (player.activeLabHybridId === target.id) {
      player.activeLabHybridId = null;
    }

    const incident: QuantumFateIncident = {
      id: `fate_${player.id}_${target.id}_${now}_disp`,
      hybridId: target.id,
      type: 'disappeared',
      timestamp: now,
      title: `⚠ Quantum Anomaly Detected`,
      description: `${target.nickname} has disappeared. Last observed near the Quantum Incubator. STATUS: UNOBSERVED.`,
      metadata: {
        previousStatus: 'alive',
        newStatus: 'missing',
        absenceDurationHours: Math.round(absenceDuration / 3600000)
      }
    };
    if (!target.fateHistory) target.fateHistory = [];
    target.fateHistory.push(incident);
    incidents.push(incident);
  }

  // Execute Deceased
  if (eventType === 'deceased') {
    target.existenceStatus = 'deceased';
    target.lastFateIncidentAt = now;
    player.lastSeriousIncidentAt = now;

    if (player.activeLabHybridId === target.id) {
      player.activeLabHybridId = null;
    }

    const incident: QuantumFateIncident = {
      id: `fate_${player.id}_${target.id}_${now}_dec`,
      hybridId: target.id,
      type: 'deceased',
      timestamp: now,
      title: `💀 Quantum Signal Terminated`,
      description: `Specimen ${target.nickname} — No measurable quantum activity remains. STATUS: DECEASED. Memory preserved in Memorial Archive.`,
      metadata: {
        previousStatus: 'alive',
        newStatus: 'deceased'
      }
    };
    if (!target.fateHistory) target.fateHistory = [];
    target.fateHistory.push(incident);
    incidents.push(incident);
  }

  player.recentFateIncidents = [...(player.recentFateIncidents || []), ...incidents];
  return incidents;
}

/**
 * Passive Laboratory Regeneration (Battery 2.0)
 * Generates 1 Energy per minute (60,000 ms) using server-authoritative elapsed time.
 */
export function applyPassiveRegeneration(player: PlayerState, now: number = Date.now()): number {
  if (!player.lastRegenAt) {
    player.lastRegenAt = now;
    player.fractionalRegenMs = 0;
    return 0;
  }

  const elapsedMs = Math.max(0, now - player.lastRegenAt);
  if (elapsedMs <= 0) return 0;

  const MS_PER_ENERGY = 60000;
  const totalMs = elapsedMs + (player.fractionalRegenMs || 0);
  const earnedEnergy = Math.floor(totalMs / MS_PER_ENERGY);
  const remainderMs = totalMs % MS_PER_ENERGY;

  player.lastRegenAt = now;

  if (earnedEnergy > 0) {
    if (player.batteryEnergy < player.batteryCapacity) {
      const space = player.batteryCapacity - player.batteryEnergy;
      const actualCredit = Math.min(space, earnedEnergy);
      player.batteryEnergy += actualCredit;
      player.fractionalRegenMs = player.batteryEnergy >= player.batteryCapacity ? 0 : remainderMs;
      return actualCredit;
    } else {
      player.batteryEnergy = player.batteryCapacity;
      player.fractionalRegenMs = 0;
      return 0;
    }
  } else {
    player.fractionalRegenMs = remainderMs;
    return 0;
  }
}

export function calculateExperimentCost(
  baseCost: number,
  player: PlayerState
): number {
  let cost = baseCost;
  
  // Electric hamster assistant bonus: 15% discount (25% with resonance)
  if (player.activeAssistant === 'electric') {
    const hasSynergy = player.unlockedResearch.includes('assistant_resonance');
    const discount = hasSynergy ? 0.25 : 0.15;
    cost = Math.floor(cost * (1 - discount));
  }

  // Superconducting coils upgrade: 10% discount
  if (player.unlockedResearch.includes('efficiency_coils')) {
    cost = Math.floor(cost * 0.9);
  }

  // Paradox hamster assistant perk: 10% cost discount
  if (player.activeAssistant === 'paradox') {
    cost = Math.floor(cost * 0.9);
  }

  // Prevent negative or zero-cost exploits (minimum clamp of 3 energy)
  return Math.max(3, cost);
}

export function calculateExperimentDuration(
  baseSeconds: number,
  player: PlayerState
): number {
  let seconds = baseSeconds;
  
  // Plasma hamster assistant bonus: 40% speedup (55% with resonance)
  if (player.activeAssistant === 'plasma') {
    const hasSynergy = player.unlockedResearch.includes('assistant_resonance');
    const speedup = hasSynergy ? 0.55 : 0.40;
    seconds = Math.max(2, Math.round(seconds * (1 - speedup)));
  }

  return seconds;
}

export interface GeneratedCandidate {
  preview: QuantumStatePreview;
  outcome: ExperimentOutcome;
}

/**
 * Generates two distinct candidate quantum states (State A & State B)
 * with different stability, energy signatures, research and mutation profiles.
 */
export function generateQuantumStatePair(
  experimentType: 'basic' | 'unstable' | 'paradox' | 'grand',
  approach: ExperimentApproach = 'stable',
  player: PlayerState,
  telemetry: SqueekTelemetry
): { stateA: GeneratedCandidate; stateB: GeneratedCandidate } {
  // Climax Special Case: The Grand Paradox
  if (experimentType === 'grand') {
    const isNew = !player.discoveredHamsters['paradox'];
    const paradoxHamster: CollectibleHamster = {
      id: `ham_${player.id}_paradox_${Date.now()}`,
      playerId: player.id,
      speciesId: 'paradox',
      nickname: 'Schrödinger',
      personality: 'Brave',
      discoveredAt: Date.now(),
      experimentTier: 'grand',
      observationState: 'A',
      isFavorite: true,
      isAssistant: false
    };

    const paradoxOutcome: ExperimentOutcome = {
      type: 'new_species',
      speciesId: 'paradox',
      speciesName: HAMSTER_SPECIES.paradox.name,
      hamster: paradoxHamster,
      isNewSpecies: isNew,
      insightAwarded: 100,
      batteryAwarded: 50,
      message: 'THE QUANTUM WAVEFUNCTION HAS COLLAPSED!',
      flavorText: 'Against all known laws of physics, the Paradox Hamster emerges from the rift. It is simultaneously napping, running, and eating a sunflower seed.'
    };

    return {
      stateA: {
        preview: {
          id: 'A',
          name: 'Eigenstate Alpha — Living Superposition',
          stability: 'Volatile',
          energySignature: 'Anomalous',
          researchPotential: 'High',
          mutationPotential: 'High',
          waveformColor: '#b6f343',
          waveformStyle: 'pulse',
          summary: 'The living state of Schrödinger\'s creature, vibrating at tachyon resonance.'
        },
        outcome: paradoxOutcome
      },
      stateB: {
        preview: {
          id: 'B',
          name: 'Eigenstate Beta — Non-Living Singularity',
          stability: 'Volatile',
          energySignature: 'Anomalous',
          researchPotential: 'High',
          mutationPotential: 'High',
          waveformColor: '#aa7ef7',
          waveformStyle: 'chaotic',
          summary: 'The unobserved void state, collapsing into the same paradoxical living rodent!'
        },
        outcome: {
          ...paradoxOutcome,
          hamster: {
            ...paradoxHamster,
            observationState: 'B'
          }
        }
      }
    };
  }

  // Pre-configured state profile archetypes
  const profileArchetypes: Array<{
    name: string;
    stability: 'High' | 'Moderate' | 'Low' | 'Volatile';
    energySignature: 'Low' | 'Medium' | 'High' | 'Anomalous';
    researchPotential: 'High' | 'Moderate' | 'Variable';
    mutationPotential: 'High' | 'Moderate' | 'Low';
    waveformColor: string;
    waveformStyle: 'sine' | 'pulse' | 'chaotic' | 'sawtooth';
    summary: string;
    bias: 'research' | 'mutation' | 'balanced';
  }> = [
    {
      name: 'Stable Coherent Resonance',
      stability: 'High',
      energySignature: 'Low',
      researchPotential: 'High',
      mutationPotential: 'Moderate',
      waveformColor: '#52e1e8',
      waveformStyle: 'sine',
      summary: 'Clean harmonic signal with low entropy. Maximizes reliable Research Notes extraction.',
      bias: 'research'
    },
    {
      name: 'Perturbed High-Flux Wave',
      stability: 'Low',
      energySignature: 'High',
      researchPotential: 'Variable',
      mutationPotential: 'High',
      waveformColor: '#f472b6',
      waveformStyle: 'chaotic',
      summary: 'Energetic quantum perturbation. Greatly elevates chance of specimen collapse.',
      bias: 'mutation'
    },
    {
      name: 'Tachyon Bio-Static Lattice',
      stability: 'Moderate',
      energySignature: 'Medium',
      researchPotential: 'High',
      mutationPotential: 'High',
      waveformColor: '#b6f343',
      waveformStyle: 'pulse',
      summary: 'Entangled packet balanced between research yield and specimen discovery.',
      bias: 'balanced'
    },
    {
      name: 'Zero-Point Anomaly Drift',
      stability: 'Volatile',
      energySignature: 'Anomalous',
      researchPotential: 'Variable',
      mutationPotential: 'High',
      waveformColor: '#fbbf24',
      waveformStyle: 'sawtooth',
      summary: 'Extreme tunneling fluctuations. High variance with potential for exotic breakthroughs.',
      bias: 'mutation'
    }
  ];

  // Randomly select two contrasting profiles
  const isAFirst = Math.random() < 0.5;
  const profileAData = isAFirst ? profileArchetypes[0] : profileArchetypes[1];
  const profileBData = isAFirst
    ? (Math.random() < 0.5 ? profileArchetypes[1] : profileArchetypes[3])
    : (Math.random() < 0.5 ? profileArchetypes[0] : profileArchetypes[2]);

  // Generate outcomes with specific bias
  const outcomeA = generateBiasedOutcome(experimentType, approach, profileAData.bias, 'A', player, telemetry);
  const outcomeB = generateBiasedOutcome(experimentType, approach, profileBData.bias, 'B', player, telemetry);

  return {
    stateA: {
      preview: {
        id: 'A',
        name: `State A — ${profileAData.name}`,
        stability: profileAData.stability,
        energySignature: profileAData.energySignature,
        researchPotential: profileAData.researchPotential,
        mutationPotential: profileAData.mutationPotential,
        waveformColor: profileAData.waveformColor,
        waveformStyle: profileAData.waveformStyle,
        summary: profileAData.summary
      },
      outcome: outcomeA
    },
    stateB: {
      preview: {
        id: 'B',
        name: `State B — ${profileBData.name}`,
        stability: profileBData.stability,
        energySignature: profileBData.energySignature,
        researchPotential: profileBData.researchPotential,
        mutationPotential: profileBData.mutationPotential,
        waveformColor: profileBData.waveformColor,
        waveformStyle: profileBData.waveformStyle,
        summary: profileBData.summary
      },
      outcome: outcomeB
    }
  };
}

export function generateBiasedOutcome(
  experimentType: 'basic' | 'unstable' | 'paradox' | 'grand',
  approach: ExperimentApproach,
  bias: 'research' | 'mutation' | 'balanced',
  stateId: 'A' | 'B',
  player: PlayerState,
  telemetry: SqueekTelemetry
): ExperimentOutcome {
  // Base insight calculation influenced by Tier, Approach and State Bias
  let baseInsight = 8;
  if (experimentType === 'basic') {
    baseInsight = approach === 'stable' ? Math.floor(Math.random() * 5) + 10 : Math.floor(Math.random() * 12) + 5;
  } else if (experimentType === 'unstable') {
    baseInsight = approach === 'stable' ? Math.floor(Math.random() * 8) + 18 : Math.floor(Math.random() * 20) + 10;
  } else {
    // paradox
    baseInsight = approach === 'stable' ? Math.floor(Math.random() * 12) + 38 : Math.floor(Math.random() * 35) + 20;
  }

  // Research bias adds a healthy bonus to notes
  if (bias === 'research') {
    baseInsight = Math.round(baseInsight * 1.35);
  }

  // Ghost hamster assistant boost: +25% insight (or +40% with resonance)
  if (player.activeAssistant === 'ghost') {
    const hasResonance = player.unlockedResearch.includes('assistant_resonance');
    baseInsight = Math.round(baseInsight * (hasResonance ? 1.40 : 1.25));
  }

  // Paradox hamster assistant perk: +20% Research Notes
  if (player.activeAssistant === 'paradox') {
    baseInsight = Math.round(baseInsight * 1.20);
  }

  // Eligible species based on player research
  const eligibleSpecies: string[] = ['normal', 'electric'];
  if (player.unlockedResearch.includes('quantum_seeds')) {
    eligibleSpecies.push('ghost', 'glitch');
  }
  if (player.unlockedResearch.includes('exotic_containment')) {
    eligibleSpecies.push('plasma');
  }

  const undiscovered = eligibleSpecies.filter(s => !player.discoveredHamsters[s]);

  // Determine roll chances
  let newSpeciesChance: number;
  if (experimentType === 'basic') {
    newSpeciesChance = approach === 'chaotic' ? 55 : 35;
  } else if (experimentType === 'unstable') {
    newSpeciesChance = approach === 'chaotic' ? 75 : 55;
  } else {
    newSpeciesChance = approach === 'chaotic' ? 90 : 70;
  }

  // State bias influence
  if (bias === 'mutation') {
    newSpeciesChance += 30; // Mutation state strongly favors discovery
  } else if (bias === 'research') {
    newSpeciesChance -= 15; // Research state leans more into notes
  }

  if (player.activeAssistant === 'glitch') {
    newSpeciesChance += 20;
  }

  // Live Squeekchain Wheel Pattern Influence (Unstable tier)
  if (experimentType === 'unstable') {
    if ((telemetry.activityPattern === 'fast' || telemetry.activityPattern === 'accelerating') && telemetry.rpm > 20) {
      if (!player.discoveredHamsters['plasma'] && eligibleSpecies.includes('plasma')) {
        const plasmaHamster = createIndividualHamster(player.id, 'plasma', experimentType, stateId);
        return {
          type: 'new_species',
          speciesId: 'plasma',
          speciesName: HAMSTER_SPECIES.plasma.name,
          hamster: plasmaHamster,
          isNewSpecies: true,
          insightAwarded: baseInsight + 10,
          message: 'Relativistic Velocity Resonance!',
          flavorText: `Squeektoshi\'s live sprint (${telemetry.rpm.toFixed(1)} RPM) ignited an ionized plasma companion!`
        };
      }
    } else if (telemetry.activityPattern === 'resting' && telemetry.freshness === 'online') {
      if (!player.discoveredHamsters['ghost'] && eligibleSpecies.includes('ghost') && Math.random() < 0.7) {
        const ghostHamster = createIndividualHamster(player.id, 'ghost', experimentType, stateId);
        return {
          type: 'new_species',
          speciesId: 'ghost',
          speciesName: HAMSTER_SPECIES.ghost.name,
          hamster: ghostHamster,
          isNewSpecies: true,
          insightAwarded: baseInsight + 8,
          message: 'Observer Invariance Triggered!',
          flavorText: 'Because Squeektoshi was resting unobserved, quantum uncertainty peaked, materializing a Ghost companion!'
        };
      }
    }
  }

  const roll = Math.random() * 100;
  const currentHamsterCount = player.hamsters ? player.hamsters.length : 1;
  const isSanctuaryFull = currentHamsterCount >= MAX_COLLECTION_CAPACITY;

  // Duplicate Protection: Prioritize undiscovered eligible species
  if (undiscovered.length > 0 && roll < newSpeciesChance) {
    let pickedId: string;
    if ((approach === 'chaotic' || bias === 'mutation') && undiscovered.length > 1) {
      pickedId = undiscovered[undiscovered.length - 1]; // Pick rarer unlocked species
    } else {
      pickedId = undiscovered[Math.floor(Math.random() * undiscovered.length)];
    }

    const species = HAMSTER_SPECIES[pickedId];
    const newCompanion = createIndividualHamster(player.id, pickedId, experimentType, stateId);

    return {
      type: 'new_species',
      speciesId: pickedId,
      speciesName: species.name,
      hamster: newCompanion,
      isNewSpecies: true,
      insightAwarded: baseInsight + 12,
      message: `NEW SPECIES REGISTERED: ${species.name.toUpperCase()}!`,
      flavorText: species.lore
    };
  }

  // Duplicate companion discovery roll
  if (Math.random() < 0.45 && eligibleSpecies.length > 0) {
    const pickedId = eligibleSpecies[Math.floor(Math.random() * eligibleSpecies.length)];
    const species = HAMSTER_SPECIES[pickedId];

    if (isSanctuaryFull) {
      // Sanctuary is full (30/30) and this is a duplicate: convert to bonus Research Notes safely
      const bonusNotes = baseInsight + 16;
      return {
        type: 'duplicate_species',
        speciesId: pickedId,
        speciesName: species.name,
        isNewSpecies: false,
        insightAwarded: bonusNotes,
        message: `Sanctuary Full (30/30): Transmuted`,
        flavorText: `A resonant ${species.name} was observed, but your QuantumDex sanctuary is at full capacity (30/30). Its quantum bio-energy was safely converted into +${bonusNotes} Research Notes.`
      };
    }

    // Award duplicate individual companion!
    const companion = createIndividualHamster(player.id, pickedId, experimentType, stateId);
    const bonusInsight = baseInsight + 6;

    return {
      type: 'duplicate_species',
      speciesId: pickedId,
      speciesName: species.name,
      hamster: companion,
      isNewSpecies: false,
      insightAwarded: bonusInsight,
      message: `NEW COMPANION ACQUIRED: ${species.name}!`,
      flavorText: `Another ${species.name} collapsed into your lab, possessing its own unique personality! (+${bonusInsight} Research Notes).`
    };
  }

  // Pure Research Progress
  return {
    type: 'research_insight',
    insightAwarded: baseInsight,
    message: 'Quantum State Collapsed Cleanly',
    flavorText: `Careful observation of the waveform extracted high-density experimental findings (+${baseInsight} Research Notes).`
  };
}

function createIndividualHamster(
  playerId: string,
  speciesId: string,
  tier: 'basic' | 'unstable' | 'paradox' | 'grand',
  stateId?: 'A' | 'B'
): CollectibleHamster {
  const personality: HamsterPersonality = HAMSTER_PERSONALITIES[Math.floor(Math.random() * HAMSTER_PERSONALITIES.length)];
  const species = HAMSTER_SPECIES[speciesId] || HAMSTER_SPECIES.normal;
  const uniqueSuffix = Math.random().toString(36).substring(2, 7);

  return {
    id: `ham_${playerId}_${speciesId}_${Date.now()}_${uniqueSuffix}`,
    playerId,
    speciesId,
    nickname: species.name,
    personality,
    discoveredAt: Date.now(),
    experimentTier: tier,
    observationState: stateId,
    isFavorite: false,
    isAssistant: false
  };
}

/**
 * Ghost Hamster Active Ability: Quantum Sight
 * Generates an accurate, honest clue about the stored outcome of a specific candidate.
 */
export function generateGhostSightClue(target: 'A' | 'B', outcome: ExperimentOutcome): string {
  if (outcome.hamster) {
    if (outcome.isNewSpecies) {
      return `👻 Quantum Sight (State ${target}): An undiscovered ${outcome.speciesName || 'specimen'} signature is present!`;
    }
    return `👻 Quantum Sight (State ${target}): A familiar ${outcome.speciesName || 'companion'} signature detected.`;
  }
  return `👻 Quantum Sight (State ${target}): Pure energy anomaly (+${outcome.insightAwarded} Notes). No biological specimen.`;
}
