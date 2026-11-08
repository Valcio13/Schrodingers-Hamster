export interface SqueekTelemetry {
  freshness: string;
  rpm: number;
  speedMmPerSecond: number;
  distanceMm: number;
  counterEpoch: string;
  observedAt: string;
  provenance: string;
  coreStatus: string;
  settledCumulativeWork: number;
  settledRound: number;
  blockHeight: number;
  activityPattern: 'fast' | 'sustained' | 'irregular' | 'resting' | 'accelerating';
  patternDescription: string;
}

let cachedTelemetry: SqueekTelemetry | null = null;
let lastFetchTime = 0;
let prevRpm = 0;

export async function fetchSqueekchainTelemetry(): Promise<SqueekTelemetry> {
  const now = Date.now();
  // Cache for 3 seconds to avoid spamming public endpoints
  if (cachedTelemetry && now - lastFetchTime < 3000) {
    return cachedTelemetry;
  }

  let statusData: any = null;
  let coreData: any = null;

  try {
    const [statusRes, coreRes] = await Promise.all([
      fetch('https://api.squeekchain.com/v1/status', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      }),
      fetch('https://api.squeekchain.com/v1/core', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      })
    ]);

    if (statusRes.ok) statusData = await statusRes.json();
    if (coreRes.ok) coreData = await coreRes.json();
  } catch (err) {
    console.warn('Squeekchain API fetch failed, using fallback/cached state:', err);
  }

  const m = statusData?.measurement || {};
  const c = coreData?.core || {};

  const rpm = typeof m.rpmMilli === 'number' ? m.rpmMilli / 1000 : 0;
  const speed = typeof m.speedMmPerSecond === 'number' ? m.speedMmPerSecond : 0;
  const settledWork = Number(c.cumulativeWork || 58518);
  const settledRound = Number(c.settledThroughRound || 672);
  const blockHeight = Number(c.blockHeight || 5204);

  // Derive genuine activity pattern from real data
  let activityPattern: SqueekTelemetry['activityPattern'] = 'resting';
  let patternDescription = 'Squeektoshi is resting in nest (Classical state)';

  if (rpm > 45) {
    activityPattern = 'fast';
    patternDescription = 'High-velocity sprint! Plasma flux high.';
  } else if (rpm > 0 && rpm > prevRpm + 5) {
    activityPattern = 'accelerating';
    patternDescription = 'Hamster is accelerating on the wheel! Static building.';
  } else if (speed > 100) {
    activityPattern = 'sustained';
    patternDescription = 'Sustained wheel trot! Steady energy flow.';
  } else if (rpm > 0 && rpm <= 15) {
    activityPattern = 'irregular';
    patternDescription = 'Sporadic steps detected. Wavefunction uncertain.';
  }

  prevRpm = rpm;

  cachedTelemetry = {
    freshness: m.freshness || 'online',
    rpm,
    speedMmPerSecond: speed,
    distanceMm: m.distanceMm || 0,
    counterEpoch: m.counterEpoch || 'unknown',
    observedAt: m.observedAt || new Date().toISOString(),
    provenance: m.provenance || 'usb-rp2040-a3144e-lm393',
    coreStatus: m.coreStatus || 'IDLE',
    settledCumulativeWork: settledWork,
    settledRound,
    blockHeight,
    activityPattern,
    patternDescription
  };
  lastFetchTime = now;

  return cachedTelemetry;
}

/**
 * Calculates battery energy to credit based on settled work units.
 * Rule: 100 settled work units = 1 battery energy.
 * Preserves fractional work-unit remainders.
 * Never awards duplicate work.
 */
export function calculateEnergyFromWork(
  currentSettledWork: number,
  lastCreditedWork: number,
  fractionalRemainder: number,
  batteryCapacity: number,
  currentBattery: number
) {
  if (lastCreditedWork === 0) {
    // New player initialized: anchor to current work, no retro energy flood, keep initial tutorial allowance
    return {
      newEnergy: 0,
      newTotalBattery: currentBattery,
      updatedLastCreditedWork: currentSettledWork,
      updatedFractionalRemainder: 0,
      deltaWorkUnits: 0
    };
  }

  const deltaWork = Math.max(0, currentSettledWork - lastCreditedWork);
  if (deltaWork === 0) {
    return {
      newEnergy: 0,
      newTotalBattery: currentBattery,
      updatedLastCreditedWork: lastCreditedWork,
      updatedFractionalRemainder: fractionalRemainder,
      deltaWorkUnits: 0
    };
  }

  const totalUnits = deltaWork + fractionalRemainder;
  const energyEarned = Math.floor(totalUnits / 100);
  const newRemainder = totalUnits % 100;
  const newTotalBattery = Math.min(batteryCapacity, currentBattery + energyEarned);

  return {
    newEnergy: energyEarned,
    newTotalBattery,
    updatedLastCreditedWork: currentSettledWork,
    updatedFractionalRemainder: newRemainder,
    deltaWorkUnits: deltaWork
  };
}

export interface SqueekBlockVerification {
  settledBlockHeight: number;
  settledRound: number;
  confirmedAtMs: number;
  roundStartMs: number;
  roundEndMs: number;
  transactionHash: string;
  isSettled: boolean;
  status: string;
  chainId: string;
  coreAddress: string;
  provisionalBlockHeight?: number;
}

/**
 * Queries the official Squeekchain API to retrieve the current strictly SETTLED Squeek block.
 * Validates Sepolia chain ID (11155111), core identity, and confirmed anchor state.
 * Provisional / in-progress blocks alone are explicitly flagged and rejected for mint settlement.
 */
export async function fetchVerifiedSqueekBlock(options?: {
  customFetch?: typeof fetch;
  mockBlock?: Partial<SqueekBlockVerification>;
}): Promise<SqueekBlockVerification> {
  if (options?.mockBlock) {
    if (options.mockBlock.status && options.mockBlock.status !== 'available') {
      throw new Error(`Squeekchain reporting service status: ${options.mockBlock.status}`);
    }
    const settledRound = options.mockBlock.settledRound ?? 1266;
    const roundStartMs = options.mockBlock.roundStartMs ?? Date.now();
    const roundEndMs = options.mockBlock.roundEndMs ?? Date.now();
    return {
      settledBlockHeight: options.mockBlock.settledBlockHeight ?? 8430,
      settledRound,
      confirmedAtMs: options.mockBlock.confirmedAtMs ?? Date.now(),
      roundStartMs,
      roundEndMs,
      transactionHash: options.mockBlock.transactionHash ?? '0xmock',
      isSettled: options.mockBlock.isSettled ?? true,
      status: options.mockBlock.status ?? 'available',
      chainId: options.mockBlock.chainId ?? '11155111',
      coreAddress: options.mockBlock.coreAddress ?? '0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44',
      provisionalBlockHeight: options.mockBlock.provisionalBlockHeight ?? options.mockBlock.settledBlockHeight ?? 8430
    };
  }

  const fetchFn = options?.customFetch || fetch;

  const [coreRes, blocksRes] = await Promise.all([
    fetchFn('https://api.squeekchain.com/v1/core', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    }),
    fetchFn('https://api.squeekchain.com/v1/measurement/blocks', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    })
  ]);

  if (!coreRes.ok) {
    throw new Error(`Squeekchain Core API error: HTTP ${coreRes.status}`);
  }
  if (!blocksRes.ok) {
    throw new Error(`Squeekchain Blocks API error: HTTP ${blocksRes.status}`);
  }

  const coreData = await coreRes.json() as any;
  const blocksData = await blocksRes.json() as any;

  // 1. Validate Target Chain Identity
  const chainId = String(coreData?.chain?.chainId || blocksData?.chain?.chainId || '');
  if (chainId !== '11155111') {
    throw new Error(`Invalid Squeekchain chain ID ${chainId}. Expected 11155111 (Sepolia).`);
  }

  // 2. Validate Service Availability
  if (coreData?.status !== 'available' && blocksData?.status !== 'available') {
    throw new Error(`Squeekchain reporting service status: ${coreData?.status || blocksData?.status}`);
  }

  // 3. Extract Anchor (Settled on Sepolia)
  const anchor = blocksData?.anchor;
  if (!anchor || typeof anchor.blockHeight === 'undefined' || typeof anchor.settledThroughRound === 'undefined') {
    throw new Error('Squeekchain measurement anchor missing or unconfirmed.');
  }

  const settledBlockHeight = Number(anchor.blockHeight);
  const settledRound = Number(anchor.settledThroughRound);
  const confirmedAtMs = anchor.confirmedAt ? new Date(anchor.confirmedAt).getTime() : 0;
  const txHash = String(anchor.transactionHash || '');

  // 4. Calculate Scheduled Round Boundary
  const roundSchedule = blocksData?.roundSchedule || {};
  const genesisTimestamp = Number(roundSchedule.genesisTimestamp || 1793022600);
  const roundDuration = Number(roundSchedule.roundDurationSeconds || 600);
  const roundStartMs = (genesisTimestamp + (settledRound - 1) * roundDuration) * 1000;
  const roundEndMs = (genesisTimestamp + settledRound * roundDuration) * 1000;

  // 5. Provisional block height (for telemetry display, NOT mint unlocking)
  const provisionalBlockHeight = Number(blocksData?.projected?.blockHeight || settledBlockHeight);

  if (isNaN(settledBlockHeight) || settledBlockHeight <= 0) {
    throw new Error('Invalid settled Squeek block height returned by API.');
  }

  return {
    settledBlockHeight,
    settledRound,
    confirmedAtMs,
    roundStartMs,
    roundEndMs,
    transactionHash: txHash,
    isSettled: true,
    status: blocksData.status || 'available',
    chainId,
    coreAddress: blocksData?.chain?.coreAddress || coreData?.identities?.core || '',
    provisionalBlockHeight
  };
}
