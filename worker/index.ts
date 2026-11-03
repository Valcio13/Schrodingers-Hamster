import { fetchSqueekchainTelemetry, calculateEnergyFromWork, SqueekTelemetry } from './squeekchain';
import {
  createInitialPlayerState,
  applyPassiveRegeneration,
  calculateExperimentCost,
  calculateExperimentDuration,
  generateQuantumStatePair,
  generateGhostSightClue,
  ensurePlayerMigration,
  applyBreedingWorkProgress,
  startIncubation,
  useIncubationGhostSight,
  revealIncubation,
  releaseHybrid,
  renameHybrid,
  toggleFavoriteHybrid,
  setLabDisplayHybrid,
  processQuantumFate,
  MAX_COLLECTION_CAPACITY
} from './gameLogic';
import {
  PlayerState,
  RESEARCH_UPGRADES,
  EXPERIMENT_TYPES,
  ExperimentApproach,
  CollectibleHamster,
  HAMSTER_SPECIES
} from '../src/types/game';

// In-memory persistent store for development & fallback
const playerStore = new Map<string, PlayerState>();

export interface Env {
  DB?: any; // Cloudflare D1 binding
}

function sanitizePlayerForClient(player: PlayerState): PlayerState {
  const sanitized: any = { ...player };
  if (sanitized.activeExperiment) {
    const expCopy: any = { ...sanitized.activeExperiment };
    delete expCopy._outcomeA;
    delete expCopy._outcomeB;
    sanitized.activeExperiment = expCopy;
  }
  if (sanitized.activeIncubation) {
    const incCopy: any = { ...sanitized.activeIncubation };
    delete incCopy._candidateA;
    delete incCopy._candidateB;
    sanitized.activeIncubation = incCopy;
  }
  return sanitized;
}

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Enable CORS for all API calls
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Player-ID'
        }
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    };

    try {
      // 1. Telemetry endpoint (direct proxy with derived patterns)
      if (pathname === '/api/telemetry' && request.method === 'GET') {
        const telemetry = await fetchSqueekchainTelemetry();
        return new Response(JSON.stringify(telemetry), { headers });
      }

      // Player identity from header or query param
      const playerId = request.headers.get('X-Player-ID') || url.searchParams.get('playerId') || 'local-researcher';
      const now = Date.now();

      // Load or initialize player
      let player = playerStore.get(playerId);
      if (!player) {
        const telemetry = await fetchSqueekchainTelemetry();
        player = createInitialPlayerState(playerId, telemetry.settledCumulativeWork);

        playerStore.set(playerId, player);
      } else {
        ensurePlayerMigration(player, now);
      }

      // 2. Get State (applies passive regeneration & quantum fate check)
      if (pathname === '/api/state' && request.method === 'GET') {
        applyPassiveRegeneration(player, now);
        processQuantumFate(player, now);

        playerStore.set(playerId, player);
        return new Response(JSON.stringify(sanitizePlayerForClient(player)), { headers });
      }

      // 3. Claim Settled Work / Sync Battery
      if (pathname === '/api/claim-work' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const telemetry = await fetchSqueekchainTelemetry();

        // 3a. Passive Regeneration (1 energy per minute, offline-capable)
        const passiveEnergyEarned = applyPassiveRegeneration(player, now);

        // 3b. Squeekchain Settled Work Bonus (100 units = 1 energy)
        let workToCredit = telemetry.settledCumulativeWork;
        if (body.simulateUnits && typeof body.simulateUnits === 'number') {
          workToCredit = player.lastCreditedWork + body.simulateUnits;
        }

        const result = calculateEnergyFromWork(
          workToCredit,
          player.lastCreditedWork,
          player.fractionalWorkRemainder,
          player.batteryCapacity,
          player.batteryEnergy
        );

        const squeekEnergyEarned = result.newEnergy;
        player.batteryEnergy = result.newTotalBattery;
        player.lastCreditedWork = result.updatedLastCreditedWork;
        player.fractionalWorkRemainder = result.updatedFractionalRemainder;

        // Quantum Genetics: Accumulate breeding charge progress from newly verified work
        if (result.deltaWorkUnits > 0) {
          applyBreedingWorkProgress(player, result.deltaWorkUnits);
        }

        // Quantum Fate check
        const fateIncidents = processQuantumFate(player, now);

        // Dev test overrides (0%, 25%, 50%, 75%, 100% battery & capacity test states, and simulated activity)
        const returnTelemetry: SqueekTelemetry = { ...telemetry };
        if (body.simulateUnits && typeof body.simulateUnits === 'number') {
          returnTelemetry.rpm = body.simulateUnits >= 3000 ? 84.5 : 28.2;
          returnTelemetry.activityPattern = body.simulateUnits >= 3000 ? 'fast' : 'sustained';
          returnTelemetry.patternDescription = body.simulateUnits >= 3000 ? 'Squeektoshi is in high-speed sprint!' : 'Squeektoshi is jogging on the wheel';
        }
        if (typeof body.simulateRpm === 'number') {
          returnTelemetry.rpm = body.simulateRpm;
          returnTelemetry.activityPattern = body.simulateRpm > 60 ? 'fast' : body.simulateRpm > 0 ? 'sustained' : 'resting';
          returnTelemetry.patternDescription = body.simulateRpm > 0 ? `Squeektoshi running at ${body.simulateRpm} RPM` : 'Squeektoshi is resting in nest';
        }

        if (typeof body.setBatteryCapacity === 'number') {
          player.batteryCapacity = body.setBatteryCapacity;
          player.batteryEnergy = Math.min(player.batteryEnergy, player.batteryCapacity);
        }
        if (typeof body.setBatteryEnergy === 'number') {
          player.batteryEnergy = Math.max(0, Math.min(player.batteryCapacity, body.setBatteryEnergy));
        }

        playerStore.set(playerId, player);

        return new Response(JSON.stringify({
          player: sanitizePlayerForClient(player),
          passiveEnergyEarned,
          squeekEnergyEarned,
          deltaWorkUnits: result.deltaWorkUnits,
          currentSettledWork: telemetry.settledCumulativeWork,
          telemetry: returnTelemetry,
          fateIncidents
        }), { headers });
      }

      // 4. Start Quantum Experiment (generates State A and State B candidates)
      if (pathname === '/api/experiment/start' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const expType = body.type as 'basic' | 'unstable' | 'paradox' | 'grand';
        const approach = (body.approach === 'chaotic' ? 'chaotic' : 'stable') as ExperimentApproach;

        applyPassiveRegeneration(player, now);

        if (!EXPERIMENT_TYPES[expType]) {
          return new Response(JSON.stringify({ error: 'Invalid experiment type' }), { status: 400, headers });
        }

        if (player.activeExperiment) {
          return new Response(JSON.stringify({ error: 'Chamber is already in use' }), { status: 400, headers });
        }

        // Check required research
        const expInfo = EXPERIMENT_TYPES[expType];
        if (expInfo.requiredResearchId && !player.unlockedResearch.includes(expInfo.requiredResearchId)) {
          return new Response(JSON.stringify({ error: `Requires research: ${expInfo.requiredResearchId}` }), { status: 400, headers });
        }

        const energyCost = calculateExperimentCost(expInfo.cost, player);
        if (player.batteryEnergy < energyCost) {
          return new Response(JSON.stringify({ error: `Insufficient energy (Need ${energyCost}, have ${player.batteryEnergy})` }), { status: 400, headers });
        }

        // Deduct energy
        player.batteryEnergy -= energyCost;

        // Normal Hamster perk: 10% chance to refund 5 insight
        if (player.activeAssistant === 'normal' && Math.random() < 0.10) {
          player.researchInsight += 5;
        }

        const durationSec = calculateExperimentDuration(expInfo.durationSeconds, player);
        const telemetry = await fetchSqueekchainTelemetry();
        
        // Generate two distinct candidate states (State A & State B)
        const statePair = generateQuantumStatePair(expType, approach, player, telemetry);

        const expState: any = {
          id: 'exp_' + Date.now(),
          type: expType,
          approach,
          startedAt: Date.now(),
          finishesAt: Date.now() + (durationSec * 1000),
          energyCost,
          status: 'running',
          stateA: statePair.stateA.preview,
          stateB: statePair.stateB.preview,
          ghostSightUsed: false,
          ghostSightTarget: null,
          _outcomeA: statePair.stateA.outcome,
          _outcomeB: statePair.stateB.outcome
        };

        player.activeExperiment = expState;
        player.totalExperimentsConducted++;

        playerStore.set(playerId, player);

        return new Response(JSON.stringify({
          player: sanitizePlayerForClient(player),
          activeExperiment: sanitizePlayerForClient(player).activeExperiment
        }), { headers });
      }

      // 5. Ghost Hamster Active Ability: Quantum Sight
      if (pathname === '/api/experiment/ghost-sight' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const target = (body.target === 'B' ? 'B' : 'A') as 'A' | 'B';

        const exp: any = player.activeExperiment;
        if (!exp) {
          return new Response(JSON.stringify({ error: 'No active experiment in chamber' }), { status: 400, headers });
        }

        if (player.activeAssistant !== 'ghost') {
          return new Response(JSON.stringify({ error: 'Ghost Hamster must be assigned as active assistant to use Quantum Sight' }), { status: 400, headers });
        }

        if (exp.ghostSightUsed) {
          return new Response(JSON.stringify({ error: 'Quantum Sight can only be used once per experiment' }), { status: 400, headers });
        }

        const targetOutcome = target === 'B' ? exp._outcomeB : exp._outcomeA;
        if (!targetOutcome) {
          return new Response(JSON.stringify({ error: 'Target state outcome not found' }), { status: 400, headers });
        }

        const clue = generateGhostSightClue(target, targetOutcome);

        exp.ghostSightUsed = true;
        exp.ghostSightTarget = target;
        if (target === 'A') {
          exp.stateA.revealedClue = clue;
        } else {
          exp.stateB.revealedClue = clue;
        }


        playerStore.set(playerId, player);

        return new Response(JSON.stringify({
          activeExperiment: sanitizePlayerForClient(player).activeExperiment,
          clue
        }), { headers });
      }

      // 6. Reveal / Observe Chosen Quantum State
      if (pathname === '/api/experiment/reveal' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const chosenState = (body.chosenState === 'B' ? 'B' : 'A') as 'A' | 'B';

        const exp: any = player.activeExperiment;
        if (!exp) {
          return new Response(JSON.stringify({ error: 'No active experiment to observe' }), { status: 400, headers });
        }

        if (Date.now() < exp.finishesAt) {
          return new Response(JSON.stringify({ error: 'Wavefunction has not yet stabilized' }), { status: 400, headers });
        }

        applyPassiveRegeneration(player, now);

        // Resolve outcome corresponding to player's choice
        const outcome = (chosenState === 'B' ? exp._outcomeB : exp._outcomeA) || exp.outcome;

        if (!outcome) {
          return new Response(JSON.stringify({ error: 'Failed to resolve quantum outcome' }), { status: 500, headers });
        }

        // Apply rewards
        player.researchInsight += outcome.insightAwarded;
        if (outcome.batteryAwarded) {
          player.batteryEnergy = Math.min(player.batteryCapacity, player.batteryEnergy + outcome.batteryAwarded);
        }

        // If a companion hamster was generated:
        if (outcome.hamster) {
          const companion = outcome.hamster;
          companion.observationState = chosenState;

          // Safe storage check: new species always added; duplicates added up to 30 capacity
          const canAdd = player.hamsters.length < MAX_COLLECTION_CAPACITY || outcome.isNewSpecies;
          if (canAdd) {
            player.hamsters.push(companion);
          }

          const prev = player.discoveredHamsters[companion.speciesId];
          if (prev) {
            prev.count++;
          } else {
            player.discoveredHamsters[companion.speciesId] = {
              discoveredAt: Date.now(),
              count: 1
            };
          }
        }

        if (exp.type === 'grand') {
          player.completedGrandParadox = true;
        }

        // Clear active experiment
        player.activeExperiment = null;

        playerStore.set(playerId, player);

        return new Response(JSON.stringify({
          player: sanitizePlayerForClient(player),
          outcome,
          chosenState
        }), { headers });
      }

      // 7. Rename Individual Hamster
      if (pathname === '/api/hamsters/rename' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hamsterId = body.hamsterId as string;
        const rawNickname = (body.nickname || '').trim();

        if (!rawNickname || rawNickname.length > 20) {
          return new Response(JSON.stringify({ error: 'Nickname must be between 1 and 20 characters' }), { status: 400, headers });
        }

        // Sanitize string (remove control/HTML characters)
        const cleanNickname = rawNickname.replace(/[<>&"']/g, '').trim();
        const hamster = player.hamsters.find(h => h.id === hamsterId);

        if (!hamster) {
          return new Response(JSON.stringify({ error: 'Hamster not found in your collection' }), { status: 404, headers });
        }

        hamster.nickname = cleanNickname || hamster.speciesId;

        playerStore.set(playerId, player);

        return new Response(JSON.stringify({
          player: sanitizePlayerForClient(player),
          hamster
        }), { headers });
      }

      // 8. Toggle Favorite Status on Hamster
      if (pathname === '/api/hamsters/favorite' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hamsterId = body.hamsterId as string;

        const hamster = player.hamsters.find(h => h.id === hamsterId);
        if (!hamster) {
          return new Response(JSON.stringify({ error: 'Hamster not found in your collection' }), { status: 404, headers });
        }

        hamster.isFavorite = !hamster.isFavorite;

        playerStore.set(playerId, player);

        return new Response(JSON.stringify({
          player: sanitizePlayerForClient(player),
          hamster
        }), { headers });
      }

      // 9. Assign Individual Hamster as Active Assistant
      if (pathname === '/api/hamsters/assign-assistant' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hamsterId = body.hamsterId as string;

        const hamster = player.hamsters.find(h => h.id === hamsterId);
        if (!hamster) {
          return new Response(JSON.stringify({ error: 'Hamster not found in your collection' }), { status: 404, headers });
        }

        // Unassign all others
        player.hamsters.forEach(h => {
          h.isAssistant = (h.id === hamsterId);
        });

        player.activeAssistant = hamster.speciesId;
        player.activeAssistantHamsterId = hamster.id;

        playerStore.set(playerId, player);

        return new Response(JSON.stringify({
          player: sanitizePlayerForClient(player),
          hamster
        }), { headers });
      }

      // Legacy assistant assign alias
      if (pathname === '/api/assistant/assign' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const speciesId = body.speciesId as string;

        const hamster = player.hamsters.find(h => h.speciesId === speciesId) || player.hamsters[0];
        if (!hamster) {
          return new Response(JSON.stringify({ error: 'Species not yet discovered' }), { status: 400, headers });
        }

        player.hamsters.forEach(h => {
          h.isAssistant = (h.id === hamster.id);
        });

        player.activeAssistant = speciesId;
        player.activeAssistantHamsterId = hamster.id;

        playerStore.set(playerId, player);

        return new Response(JSON.stringify({ player: sanitizePlayerForClient(player) }), { headers });
      }

      // 10. Unlock Research Upgrade
      if (pathname === '/api/research/unlock' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const upgradeId = body.upgradeId as string;

        applyPassiveRegeneration(player, now);

        const upgrade = RESEARCH_UPGRADES.find(u => u.id === upgradeId);
        if (!upgrade) {
          return new Response(JSON.stringify({ error: 'Upgrade not found' }), { status: 400, headers });
        }

        if (player.unlockedResearch.includes(upgradeId)) {
          return new Response(JSON.stringify({ error: 'Upgrade already unlocked' }), { status: 400, headers });
        }

        if (upgrade.prerequisiteId && !player.unlockedResearch.includes(upgrade.prerequisiteId)) {
          return new Response(JSON.stringify({ error: 'Prerequisite upgrade required' }), { status: 400, headers });
        }

        if (player.researchInsight < upgrade.cost) {
          return new Response(JSON.stringify({ error: `Need ${upgrade.cost} Insight (have ${player.researchInsight})` }), { status: 400, headers });
        }

        player.researchInsight -= upgrade.cost;
        player.unlockedResearch.push(upgradeId);

        // Apply immediate perks
        if (upgrade.effectType === 'battery_capacity') {
          player.batteryCapacity = Math.max(player.batteryCapacity, upgrade.effectValue);
        }
        if (upgrade.effectType === 'lab_level') {
          player.labLevel = Math.max(player.labLevel, upgrade.effectValue as any) as any;
        }


        playerStore.set(playerId, player);

        return new Response(JSON.stringify({ player: sanitizePlayerForClient(player), upgrade }), { headers });
      }

      // 11. Start Quantum Incubation (Breeding)
      if (pathname === '/api/incubator/start' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const parent1Species = body.parent1Species as string;
        const parent2Species = body.parent2Species as string;

        applyPassiveRegeneration(player, now);
        const telemetry = await fetchSqueekchainTelemetry();

        try {
          const res = startIncubation(player, parent1Species, parent2Species, telemetry, now);

        playerStore.set(playerId, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            activeIncubation: sanitizePlayerForClient(player).activeIncubation
          }), { headers });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Could not start incubation' }), { status: 400, headers });
        }
      }

      // 12. Ghost Hamster Quantum Sight for Incubation
      if (pathname === '/api/incubator/ghost-sight' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const target = (body.target === 'B' ? 'B' : 'A') as 'A' | 'B';

        try {
          const res = useIncubationGhostSight(player, target);

        playerStore.set(playerId, player);
          return new Response(JSON.stringify({
            activeIncubation: sanitizePlayerForClient(player).activeIncubation,
            clue: res.clue
          }), { headers });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Could not use Quantum Sight' }), { status: 400, headers });
        }
      }

      // 13. Reveal / Observe Chosen Incubation State
      if (pathname === '/api/incubator/reveal' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const chosenState = (body.chosenState === 'B' ? 'B' : 'A') as 'A' | 'B';

        applyPassiveRegeneration(player, now);

        try {
          const res = revealIncubation(player, chosenState, now);

        playerStore.set(playerId, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            hybrid: res.hybrid,
            chosenState: res.chosenState
          }), { headers });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Could not reveal incubation' }), { status: 400, headers });
        }
      }

      // 14. Rename Hybrid
      if (pathname === '/api/hybrids/rename' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hybridId = body.hybridId as string;
        const nickname = body.nickname as string;

        try {
          const res = renameHybrid(player, hybridId, nickname);

        playerStore.set(playerId, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            hybrid: res.hybrid
          }), { headers });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Could not rename hybrid' }), { status: 400, headers });
        }
      }

      // 15. Toggle Favorite Hybrid
      if (pathname === '/api/hybrids/favorite' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hybridId = body.hybridId as string;

        try {
          const res = toggleFavoriteHybrid(player, hybridId);

        playerStore.set(playerId, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            hybrid: res.hybrid
          }), { headers });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Could not toggle favorite' }), { status: 400, headers });
        }
      }

      // 16. Release Hybrid to Quantum Field (Battery Energy Refund)
      if (pathname === '/api/hybrids/release' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hybridId = body.hybridId as string;

        try {
          const res = releaseHybrid(player, hybridId);

        playerStore.set(playerId, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            releasedHybrid: res.releasedHybrid,
            energyRefunded: res.energyRefunded
          }), { headers });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Could not release hybrid' }), { status: 400, headers });
        }
      }

      // 17. Set Lab Display Companion Hybrid
      if (pathname === '/api/hybrids/set-lab-display' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hybridId = body.hybridId !== undefined ? body.hybridId : null;

        try {
          const res = setLabDisplayHybrid(player, hybridId);

        playerStore.set(playerId, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            activeLabHybridId: player.activeLabHybridId
          }), { headers });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Could not set lab display' }), { status: 400, headers });
        }
      }

      // 18. Quantum Fate: Force Test Trigger (deterministic testing)
      if (pathname === '/api/fate/trigger-test' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const incidents = processQuantumFate(player, now, {
          type: body.type,
          hybridId: body.hybridId
        });

        playerStore.set(playerId, player);
        return new Response(JSON.stringify({
          player: sanitizePlayerForClient(player),
          incidents
        }), { headers });
      }

      // 19. Quantum Fate: Dismiss / Clear Recent Incidents
      if (pathname === '/api/fate/dismiss' && request.method === 'POST') {
        player.recentFateIncidents = [];

        playerStore.set(playerId, player);
        return new Response(JSON.stringify({ success: true, player: sanitizePlayerForClient(player) }), { headers });
      }

      // 20. Reset Profile (for development testing)
      if (pathname === '/api/player/reset' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const telemetry = await fetchSqueekchainTelemetry();
        player = createInitialPlayerState(playerId, telemetry.settledCumulativeWork);

        if (typeof body.insight === 'number') {
          player.researchInsight = body.insight;
        }
        if (typeof body.labLevel === 'number') {
          player.labLevel = body.labLevel as any;
        }
        if (Array.isArray(body.unlockedResearch)) {
          player.unlockedResearch = [...body.unlockedResearch];
        }

        if (body.grantSpecies && Array.isArray(body.grantSpecies)) {
          for (const s of body.grantSpecies) {
            player.discoveredHamsters[s] = { discoveredAt: Date.now(), count: 1 };
            // Also ensure individual companion is in hamsters list
            if (!player.hamsters.some(h => h.speciesId === s)) {
              player.hamsters.push({
                id: `ham_${playerId}_${s}_${Date.now()}`,
                playerId,
                speciesId: s,
                nickname: HAMSTER_SPECIES[s]?.name || s,
                personality: 'Curious',
                discoveredAt: Date.now(),
                experimentTier: 'basic',
                isFavorite: false,
                isAssistant: false
              });
            }
          }
        }

        playerStore.set(playerId, player);
        return new Response(JSON.stringify({ player: sanitizePlayerForClient(player), message: 'Lab reset complete' }), { headers });
      }

      return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404, headers });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
    }
  }
};
