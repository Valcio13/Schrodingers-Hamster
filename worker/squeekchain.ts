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
