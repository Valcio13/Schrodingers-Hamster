import {
  PlayerState,
  ExperimentOutcome,
  ResearchUpgrade,
  ExperimentApproach,
  CollectibleHamster,
  QuantumHybrid
} from '../types/game';
import { SqueekTelemetry } from '../../worker/squeekchain';

function getPlayerId(): string {
  let id = localStorage.getItem('squeek_player_id');
  if (!id) {
    id = 'hamster_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('squeek_player_id', id);
  }
  return id;
}

const BASE_URL = '/api';

export async function fetchPlayerState(): Promise<PlayerState> {
  const res = await fetch(`${BASE_URL}/state?playerId=${getPlayerId()}`, {
    headers: { 'X-Player-ID': getPlayerId() }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function claimWork(simulateUnits?: number): Promise<{
  player: PlayerState;
  passiveEnergyEarned: number;
  squeekEnergyEarned: number;
  deltaWorkUnits: number;
  currentSettledWork: number;
  telemetry: SqueekTelemetry;
}> {
  const res = await fetch(`${BASE_URL}/claim-work`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ simulateUnits })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function setDevActivityRpm(rpm: number): Promise<{
  player: PlayerState;
  telemetry: SqueekTelemetry;
}> {
  const res = await fetch(`${BASE_URL}/claim-work`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ simulateRpm: rpm })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function setDevBatteryState(options: { energy?: number; capacity?: number }): Promise<{
  player: PlayerState;
  telemetry: SqueekTelemetry;
}> {
  const res = await fetch(`${BASE_URL}/claim-work`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({
      setBatteryEnergy: options.energy,
      setBatteryCapacity: options.capacity
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function startExperiment(
  type: 'basic' | 'unstable' | 'paradox' | 'grand',
  approach: ExperimentApproach = 'stable'
): Promise<{
  player: PlayerState;
  activeExperiment: any;
}> {
  const res = await fetch(`${BASE_URL}/experiment/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ type, approach })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function useGhostSight(target: 'A' | 'B'): Promise<{
  activeExperiment: any;
  clue: string;
}> {
  const res = await fetch(`${BASE_URL}/experiment/ghost-sight`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ target })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function revealExperiment(chosenState: 'A' | 'B' = 'A'): Promise<{
  player: PlayerState;
  outcome: ExperimentOutcome;
  chosenState: 'A' | 'B';
}> {
  const res = await fetch(`${BASE_URL}/experiment/reveal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ chosenState })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function unlockResearch(upgradeId: string): Promise<{
  player: PlayerState;
  upgrade: ResearchUpgrade;
}> {
  const res = await fetch(`${BASE_URL}/research/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ upgradeId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function assignAssistant(speciesId: string): Promise<{ player: PlayerState }> {
  const res = await fetch(`${BASE_URL}/assistant/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ speciesId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function renameHamster(hamsterId: string, nickname: string): Promise<{
  player: PlayerState;
  hamster: CollectibleHamster;
}> {
  const res = await fetch(`${BASE_URL}/hamsters/rename`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ hamsterId, nickname })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function toggleFavoriteHamster(hamsterId: string): Promise<{
  player: PlayerState;
  hamster: CollectibleHamster;
}> {
  const res = await fetch(`${BASE_URL}/hamsters/favorite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ hamsterId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function assignAssistantHamster(hamsterId: string): Promise<{
  player: PlayerState;
  hamster: CollectibleHamster;
}> {
  const res = await fetch(`${BASE_URL}/hamsters/assign-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ hamsterId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function fetchTelemetry(): Promise<SqueekTelemetry> {
  const res = await fetch(`${BASE_URL}/telemetry`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function resetLab(): Promise<{ player: PlayerState }> {
  const res = await fetch(`${BASE_URL}/player/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// Quantum Genetics & Incubation
export async function startIncubationApi(
  parent1Species: string,
  parent2Species: string
): Promise<{
  player: PlayerState;
  activeIncubation: any;
}> {
  const res = await fetch(`${BASE_URL}/incubator/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ parent1Species, parent2Species })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function useIncubationGhostSightApi(target: 'A' | 'B'): Promise<{
  activeIncubation: any;
  clue: string;
}> {
  const res = await fetch(`${BASE_URL}/incubator/ghost-sight`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ target })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function revealIncubationApi(chosenState: 'A' | 'B'): Promise<{
  player: PlayerState;
  hybrid: QuantumHybrid;
  chosenState: 'A' | 'B';
}> {
  const res = await fetch(`${BASE_URL}/incubator/reveal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ chosenState })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function renameHybridApi(
  hybridId: string,
  nickname: string
): Promise<{
  player: PlayerState;
  hybrid: QuantumHybrid;
}> {
  const res = await fetch(`${BASE_URL}/hybrids/rename`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ hybridId, nickname })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function toggleFavoriteHybridApi(hybridId: string): Promise<{
  player: PlayerState;
  hybrid: QuantumHybrid;
}> {
  const res = await fetch(`${BASE_URL}/hybrids/favorite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ hybridId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function releaseHybridApi(hybridId: string): Promise<{
  player: PlayerState;
  releasedHybrid: QuantumHybrid;
  energyRefunded: number;
}> {
  const res = await fetch(`${BASE_URL}/hybrids/release`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ hybridId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function setLabDisplayHybridApi(hybridId: string | null): Promise<{
  player: PlayerState;
  activeLabHybridId: string | null;
}> {
  const res = await fetch(`${BASE_URL}/hybrids/set-lab-display`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ hybridId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function triggerFateTestApi(
  type: string,
  hybridId?: string
): Promise<{
  player: PlayerState;
  incidents: any[];
}> {
  const res = await fetch(`${BASE_URL}/fate/trigger-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ type, hybridId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function dismissFateIncidentsApi(): Promise<{
  success: boolean;
  player: PlayerState;
}> {
  const res = await fetch(`${BASE_URL}/fate/dismiss`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
