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
    const legacyId = localStorage.getItem('hamster_guest_player_id');
    if (legacyId) {
      id = legacyId;
      localStorage.setItem('squeek_player_id', id);
      localStorage.removeItem('hamster_guest_player_id');
    } else {
      id = 'hamster_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('squeek_player_id', id);
    }
  }
  return id;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Player-ID': getPlayerId()
  };
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('squeek_session_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const WORKER_PROD_API = 'https://schrodingers-hamster.valcio222.workers.dev/api';
export const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || ((import.meta as any).env?.PROD ? WORKER_PROD_API : '/api');

export async function handleApiResponse<T = any>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data.error;
    err.currentRevision = data.currentRevision;
    throw err;
  }
  return await res.json();
}

export async function fetchPlayerState(): Promise<PlayerState> {
  const res = await fetch(`${BASE_URL}/state?playerId=${getPlayerId()}`, {
    headers: getAuthHeaders()
  });
  return await handleApiResponse<PlayerState>(res);
}

export async function checkDevAccess(): Promise<{ authorized: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/dev/access`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return { authorized: !!data.authorized };
    }
  } catch (e) {
    console.warn('Developer access check failed:', e);
  }
  return { authorized: false };
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
      ...getAuthHeaders()
    },
    body: JSON.stringify({ simulateUnits })
  });
  return await handleApiResponse(res);
}

export async function setDevActivityRpm(rpm: number): Promise<{
  player: PlayerState;
  telemetry: SqueekTelemetry;
}> {
  const res = await fetch(`${BASE_URL}/claim-work`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ simulateRpm: rpm })
  });
  return await handleApiResponse(res);
}

export async function setDevBatteryState(options: { energy?: number; capacity?: number }): Promise<{
  player: PlayerState;
  telemetry: SqueekTelemetry;
}> {
  const res = await fetch(`${BASE_URL}/claim-work`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      setBatteryEnergy: options.energy,
      setBatteryCapacity: options.capacity
    })
  });
  return await handleApiResponse(res);
}

export async function setDevBreedingCharges(charges: number, progress?: number): Promise<{
  player: PlayerState;
  telemetry: SqueekTelemetry;
}> {
  const res = await fetch(`${BASE_URL}/claim-work`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      setBreedingCharges: charges,
      setBreedingChargeProgress: progress
    })
  });
  return await handleApiResponse(res);
}

export async function addDevBreedingCharges(amount: number = 1): Promise<{
  player: PlayerState;
  telemetry: SqueekTelemetry;
}> {
  const res = await fetch(`${BASE_URL}/claim-work`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      addBreedingCharges: amount
    })
  });
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
}

export async function synthesizeResearchNotes(
  action: 'battery' | 'breeding_charge' | 'habitat_expansion'
): Promise<{ player: PlayerState; success: boolean; action: string }> {
  const res = await fetch(`${BASE_URL}/research/synthesize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-ID': getPlayerId()
    },
    body: JSON.stringify({ action })
  });
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
}

export async function fetchTelemetry(): Promise<SqueekTelemetry> {
  const res = await fetch(`${BASE_URL}/telemetry`);
  return await handleApiResponse(res);
}

export async function resetLab(): Promise<{ player: PlayerState }> {
  const res = await fetch(`${BASE_URL}/player/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  });
  return await handleApiResponse(res);
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
    body: JSON.stringify({
      parent1Species,
      parent2Species,
      parent1Id: parent1Species,
      parent2Id: parent2Species
    })
  });
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
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
  return await handleApiResponse(res);
}

export async function exportPlayerBackup(): Promise<any> {
  const res = await fetch(`${BASE_URL}/backup/export`, {
    headers: getAuthHeaders()
  });
  return await handleApiResponse(res);
}

export async function validatePlayerBackup(backup: any): Promise<{
  valid: boolean;
  canRestore: boolean;
  error?: string | null;
  message: string;
  summary?: any;
  exportedDate?: string;
  backupId?: string;
  saveRevision?: number;
}> {
  const customHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  };
  // If guest, propagate backup.playerId for account identity matching
  if (!sessionStorage.getItem('squeek_session_token') && backup?.playerId) {
    customHeaders['X-Player-ID'] = backup.playerId;
  }

  const res = await fetch(`${BASE_URL}/backup/validate`, {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify({ backup })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 400 && res.status !== 403 && res.status !== 409) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function importPlayerBackup(backup: any): Promise<{
  success: boolean;
  message: string;
  player: PlayerState;
}> {
  const customHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  };
  if (!sessionStorage.getItem('squeek_session_token') && backup?.playerId) {
    customHeaders['X-Player-ID'] = backup.playerId;
  }

  const res = await fetch(`${BASE_URL}/backup/import`, {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify({ backup })
  });
  return await handleApiResponse(res);
}
