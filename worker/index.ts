import {
  fetchSqueekchainTelemetry,
  calculateEnergyFromWork,
  SqueekTelemetry,
  fetchVerifiedSqueekBlock,
  SqueekBlockVerification
} from './squeekchain';
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
  HAMSTER_SPECIES,
  MAX_BREEDING_CHARGES,
  WORK_PER_BREEDING_CHARGE,
  NOTE_COST_BATTERY_RECHARGE,
  NOTE_ENERGY_RECHARGE_AMOUNT,
  NOTE_COST_BREEDING_CHARGE,
  NOTE_COST_HABITAT_EXPANSION
} from '../src/types/game';
import { verifyMessage, keccak256, toHex, Address, Hex, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  generateDeterministicHybridSvg,
  computeDeterministicIpfsCid,
  buildCanonicalNftMetadata,
  computeSpecimenHash
} from '../src/utils/nftMetadata';
import {
  freezeCollectibleSnapshot,
  FrozenNftSnapshot,
  IpfsStorageConfig
} from './ipfsStorage';

// In-memory persistent store for development & fallback
const playerStore = new Map<string, PlayerState>();

/**
 * Stage 1 Restricted Sepolia Beta Wallet Allowlist Check.
 * If NFT_BETA_RESTRICTED is active (default 'true'), only allowlisted wallets may initiate or authorize mints.
 * If NFT_BETA_RESTRICTED is explicitly set to 'false' (Stage 2 Public Beta), all authenticated wallets may mint.
 */
function isWalletAllowlistedForBeta(env: any, walletAddress: string): { allowed: boolean; isRestrictedBeta: boolean } {
  const isRestrictedBeta = (env as any)?.NFT_BETA_RESTRICTED !== 'false' && (env as any)?.NFT_BETA_RESTRICTED !== false;
  
  if (!isRestrictedBeta) {
    return { allowed: true, isRestrictedBeta: false };
  }

  const rawList = ((env as any)?.NFT_BETA_ALLOWED_WALLETS || (env as any)?.NFT_BETA_ALLOWLIST || '') as string;
  const allowlist = rawList
    .toLowerCase()
    .split(/[,\s]+/)
    .map(addr => addr.trim())
    .filter(addr => addr.startsWith('0x'));

  const isAllowed = allowlist.includes(walletAddress.toLowerCase());
  return { allowed: isAllowed, isRestrictedBeta: true };
}

/**
 * Developer Allowlist Parser & Validator.
 * Reads DEV_ALLOWED_WALLETS environment variable, normalizes addresses to lowercase,
 * strictly filters out malformed addresses (must match 0x followed by 40 hex chars),
 * and defaults to empty array (no access) if missing or empty.
 */
export function parseDevAllowedWallets(env: any): string[] {
  const rawList = ((env as any)?.DEV_ALLOWED_WALLETS || '') as string;
  if (!rawList || typeof rawList !== 'string') {
    return [];
  }
  return rawList
    .split(',')
    .map(addr => addr.trim().toLowerCase())
    .filter(addr => /^0x[a-f0-9]{40}$/.test(addr));
}

/**
 * Checks if a given wallet address is authorized as a developer.
 * Normalizes the candidate address, rejects malformed values,
 * and checks membership against DEV_ALLOWED_WALLETS.
 * Never returns the allowlist or sensitive configuration.
 */
export function isDeveloperWallet(walletAddress: string | null | undefined, env: any): boolean {
  if (!walletAddress || typeof walletAddress !== 'string') {
    return false;
  }
  const normalized = walletAddress.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(normalized)) {
    return false;
  }
  const allowed = parseDevAllowedWallets(env);
  return allowed.includes(normalized);
}

// Web3 Authentication & NFT state stores
const authNonceStore = new Map<string, { nonce: string; createdAt: number; expiresAt: number; consumed: boolean }>();
const siweSessionStore = new Map<string, { sessionToken: string; walletAddress: string; playerId: string; expiresAt: number }>();
const walletPlayerMap = new Map<string, string>();
const mintedNftStore = new Map<number, { tokenId: number; specimenId: string; walletAddress: string; txHash: string; tokenUri: string; metadataHash: string; mintedAt: number }>();
const specimenMintMap = new Map<string, number>();
const frozenSnapshotStore = new Map<string, FrozenNftSnapshot>();
const mockIpfsStore = new Map<string, string>();

export interface PendingMintRequest {
  requestId: string;
  specimenId: string;
  playerId: string;
  walletAddress: string;
  baselineBlockHeight: number;
  baselineRound: number;
  activeRoundAtRequest: number;
  priorRoundSettledHeight: number | null;
  requestTimestamp: number;
  status: 'awaiting_block' | 'verifying' | 'unlocked' | 'minted' | 'rejected';
  qualifyingBlockHeight: number | null;
  qualifyingRound: number | null;
  qualifyingConfirmedAt: number | null;
  unlockedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

const pendingMintRequestStore = new Map<string, PendingMintRequest>();

async function loadPendingMintRequest(db: any, specimenId: string): Promise<PendingMintRequest | null> {
  if (db) {
    try {
      const row = await db.prepare(
        'SELECT * FROM pending_mint_requests WHERE specimen_id = ?'
      ).bind(specimenId).first();
      if (row) {
        return {
          requestId: row.request_id,
          specimenId: row.specimen_id,
          playerId: row.player_id,
          walletAddress: row.wallet_address,
          baselineBlockHeight: Number(row.baseline_block_height),
          baselineRound: Number(row.baseline_round),
          activeRoundAtRequest: Number(row.active_round_at_request || 0),
          priorRoundSettledHeight: row.prior_round_settled_height !== null ? Number(row.prior_round_settled_height) : null,
          requestTimestamp: Number(row.request_timestamp),
          status: row.status,
          qualifyingBlockHeight: row.qualifying_block_height !== null ? Number(row.qualifying_block_height) : null,
          qualifyingRound: row.qualifying_round !== null ? Number(row.qualifying_round) : null,
          qualifyingConfirmedAt: row.qualifying_confirmed_at !== null ? Number(row.qualifying_confirmed_at) : null,
          unlockedAt: row.unlocked_at !== null ? Number(row.unlocked_at) : null,
          createdAt: Number(row.created_at),
          updatedAt: Number(row.updated_at)
        };
      }
    } catch (err) {
      console.warn('loadPendingMintRequest DB warning:', err);
    }
  }
  return pendingMintRequestStore.get(specimenId) || null;
}

async function savePendingMintRequest(db: any, req: PendingMintRequest): Promise<void> {
  pendingMintRequestStore.set(req.specimenId, req);
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO pending_mint_requests (
          request_id, specimen_id, player_id, wallet_address,
          baseline_block_height, baseline_round, active_round_at_request, prior_round_settled_height,
          request_timestamp, status, qualifying_block_height, qualifying_round, qualifying_confirmed_at,
          unlocked_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(specimen_id) DO UPDATE SET
          wallet_address = excluded.wallet_address,
          prior_round_settled_height = excluded.prior_round_settled_height,
          status = excluded.status,
          qualifying_block_height = excluded.qualifying_block_height,
          qualifying_round = excluded.qualifying_round,
          qualifying_confirmed_at = excluded.qualifying_confirmed_at,
          unlocked_at = excluded.unlocked_at,
          updated_at = excluded.updated_at
      `).bind(
        req.requestId, req.specimenId, req.playerId, req.walletAddress,
        req.baselineBlockHeight, req.baselineRound, req.activeRoundAtRequest, req.priorRoundSettledHeight,
        req.requestTimestamp, req.status, req.qualifyingBlockHeight, req.qualifyingRound, req.qualifyingConfirmedAt,
        req.unlockedAt, req.createdAt, req.updatedAt
      ).run();
    } catch (err) {
      console.warn('savePendingMintRequest DB warning:', err);
    }
  }
}

const DEFAULT_AUTHORIZER_PRIVATE_KEY = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
const DEFAULT_NFT_CONTRACT_ADDRESS = '0xd77e88ccdb7b535133796d428e95322217ce99a4';
const TARGET_SEPOLIA_CHAIN_ID = 11155111;

const HAMSTER_NFT_ABI = parseAbi([
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function totalMinted() external view returns (uint256)',
  'function specimenMinted(bytes32 specimenHash) external view returns (bool)'
]);

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

async function loadPlayerState(db: any, playerId: string): Promise<PlayerState | null> {
  const cached = playerStore.get(playerId);
  if (!db) {
    return cached || null;
  }

  const row = await db.prepare(
    'SELECT * FROM players WHERE id = ?'
  ).bind(playerId).first();

  if (!row) {
    return null;
  }

  let player: PlayerState;
  if (row.state_json) {
    try {
      player = JSON.parse(row.state_json);
      player.id = playerId;
    } catch (parseErr) {
      console.error('Corrupted state_json in DB for player:', playerId, parseErr);
      throw new Error(`Corrupted state_json in database for player ${playerId}`);
    }
  } else {
    // Reconstruct from relational columns if state_json is absent
    player = {
      id: playerId,
      batteryEnergy: Number(row.battery_energy ?? 50),
      batteryCapacity: Number(row.battery_capacity ?? 150),
      researchInsight: Number(row.research_insight ?? 0),
      labLevel: (row.lab_level ?? 1) as 1 | 2 | 3,
      activeAssistant: row.active_assistant ?? null,
      activeAssistantHamsterId: row.active_assistant_hamster_id ?? null,
      discoveredHamsters: {},
      hamsters: [],
      hybrids: [],
      activeIncubation: null,
      breedingCharges: Number(row.breeding_charges ?? 0),
      breedingChargeProgress: Number(row.breeding_charge_progress ?? 0),
      lastLiveBreedingAt: Number(row.last_live_breeding_at ?? 0),
      activeLabHybridId: row.active_lab_hybrid_id ?? null,
      lastFateRollAt: Number(row.last_fate_roll_at ?? 0),
      lastSeriousIncidentAt: Number(row.last_serious_incident_at ?? 0),
      recentFateIncidents: [],
      unlockedResearch: [],
      activeExperiment: null,
      lastCreditedWork: Number(row.last_credited_work ?? 0),
      fractionalWorkRemainder: Number(row.fractional_work_remainder ?? 0),
      completedGrandParadox: Boolean(row.completed_grand_paradox),
      totalExperimentsConducted: Number(row.total_experiments_conducted ?? 0),
      lastRegenAt: Number(row.last_regen_at ?? 0),
      fractionalRegenMs: Number(row.fractional_regen_ms ?? 0),
      hybridCapacityBonus: Number(row.hybrid_capacity_bonus ?? 0),
      researchMasteryLevel: Number(row.research_mastery_level ?? 0),
      saveRevision: Number(row.save_revision ?? 1),
      saveLineageId: row.save_lineage_id ?? `lin_${playerId}`,
      lastRestoredBackupId: row.last_restored_backup_id ?? null
    };
  }

  // Ensure persistent revision and lineage synchronization
  if (row.save_revision !== undefined && row.save_revision !== null) {
    player.saveRevision = Number(row.save_revision);
  } else if (!player.saveRevision) {
    player.saveRevision = 1;
  }
  if (row.save_lineage_id) {
    player.saveLineageId = row.save_lineage_id;
  } else if (!player.saveLineageId) {
    player.saveLineageId = `lin_${playerId}`;
  }
  if (row.last_restored_backup_id) {
    player.lastRestoredBackupId = row.last_restored_backup_id;
  }

  // Record loaded revision for optimistic concurrency verification
  (player as any)._initialSaveRevision = player.saveRevision;
  (player as any)._isNewPlayer = false;

  playerStore.set(playerId, player);
  return player;
}

export class SaveConflictError extends Error {
  public code = 'CONCURRENT_SAVE_CONFLICT';
  public currentRevision: number;
  constructor(message: string, currentRevision: number) {
    super(message);
    this.name = 'SaveConflictError';
    this.currentRevision = currentRevision;
  }
}

async function savePlayerState(
  db: any,
  player: PlayerState,
  options?: { forceRevision?: number; expectedRevision?: number; isNewPlayer?: boolean }
): Promise<void> {
  const isNew = options?.isNewPlayer ?? (player as any)._isNewPlayer ?? false;
  const expectedRev = options?.expectedRevision ?? (player as any)._initialSaveRevision ?? player.saveRevision ?? 1;

  // Advance revision
  if (options?.forceRevision !== undefined) {
    player.saveRevision = options.forceRevision;
  } else {
    player.saveRevision = expectedRev + 1;
  }
  if (!player.saveLineageId) {
    player.saveLineageId = `lin_${player.id}`;
  }

  // Update in-memory fallback
  if (!db) {
    const existing = playerStore.get(player.id);
    if (!isNew && existing && options?.expectedRevision !== undefined && existing.saveRevision !== options.expectedRevision) {
      throw new SaveConflictError(
        `CONCURRENT_SAVE_CONFLICT: Player state was modified by a concurrent request (expected rev ${options.expectedRevision}, found ${existing.saveRevision}).`,
        existing.saveRevision || 1
      );
    }
    playerStore.set(player.id, player);
    return;
  }

  const now = Date.now();
  const stateJson = JSON.stringify(player);

  if (isNew) {
    try {
      await db.prepare(`
        INSERT INTO players (
          id, created_at, last_active_at, battery_energy, battery_capacity,
          research_insight, lab_level, active_assistant, active_assistant_hamster_id,
          last_credited_work, fractional_work_remainder, completed_grand_paradox,
          last_regen_at, fractional_regen_ms, breeding_charges, breeding_charge_progress,
          last_live_breeding_at, active_lab_hybrid_id, last_fate_roll_at,
          last_serious_incident_at, total_experiments_conducted, hybrid_capacity_bonus,
          research_mastery_level, save_revision, save_lineage_id, last_restored_backup_id, state_json
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?
        )
      `).bind(
        player.id,
        player.createdAt || now,
        now,
        player.batteryEnergy,
        player.batteryCapacity,
        player.researchInsight,
        player.labLevel,
        player.activeAssistant,
        player.activeAssistantHamsterId || null,
        player.lastCreditedWork,
        player.fractionalWorkRemainder,
        player.completedGrandParadox ? 1 : 0,
        player.lastRegenAt,
        player.fractionalRegenMs,
        player.breedingCharges || 0,
        player.breedingChargeProgress || 0,
        player.lastLiveBreedingAt || 0,
        player.activeLabHybridId || null,
        player.lastFateRollAt || 0,
        player.lastSeriousIncidentAt || 0,
        player.totalExperimentsConducted || 0,
        player.hybridCapacityBonus || 0,
        player.researchMasteryLevel || 0,
        player.saveRevision,
        player.saveLineageId,
        player.lastRestoredBackupId || null,
        stateJson
      ).run();

      (player as any)._isNewPlayer = false;
      (player as any)._initialSaveRevision = player.saveRevision;
      playerStore.set(player.id, player);
      return;
    } catch (insertErr: any) {
      const existingRow = await db.prepare('SELECT save_revision FROM players WHERE id = ?').bind(player.id).first();
      if (existingRow) {
        playerStore.delete(player.id);
        throw new SaveConflictError(
          'CONCURRENT_SAVE_CONFLICT: Player account already initialized by another concurrent session.',
          Number(existingRow.save_revision)
        );
      }
      throw insertErr;
    }
  }

  // Existing player: Optimistic Concurrency Update
  const updateRes = await db.prepare(`
    UPDATE players SET
      last_active_at = ?,
      battery_energy = ?,
      battery_capacity = ?,
      research_insight = ?,
      lab_level = ?,
      active_assistant = ?,
      active_assistant_hamster_id = ?,
      last_credited_work = ?,
      fractional_work_remainder = ?,
      completed_grand_paradox = ?,
      last_regen_at = ?,
      fractional_regen_ms = ?,
      breeding_charges = ?,
      breeding_charge_progress = ?,
      last_live_breeding_at = ?,
      active_lab_hybrid_id = ?,
      last_fate_roll_at = ?,
      last_serious_incident_at = ?,
      total_experiments_conducted = ?,
      hybrid_capacity_bonus = ?,
      research_mastery_level = ?,
      save_revision = ?,
      save_lineage_id = ?,
      last_restored_backup_id = ?,
      state_json = ?
    WHERE id = ? AND save_revision = ?
  `).bind(
    now,
    player.batteryEnergy,
    player.batteryCapacity,
    player.researchInsight,
    player.labLevel,
    player.activeAssistant,
    player.activeAssistantHamsterId || null,
    player.lastCreditedWork,
    player.fractionalWorkRemainder,
    player.completedGrandParadox ? 1 : 0,
    player.lastRegenAt,
    player.fractionalRegenMs,
    player.breedingCharges || 0,
    player.breedingChargeProgress || 0,
    player.lastLiveBreedingAt || 0,
    player.activeLabHybridId || null,
    player.lastFateRollAt || 0,
    player.lastSeriousIncidentAt || 0,
    player.totalExperimentsConducted || 0,
    player.hybridCapacityBonus || 0,
    player.researchMasteryLevel || 0,
    player.saveRevision,
    player.saveLineageId,
    player.lastRestoredBackupId || null,
    stateJson,
    player.id,
    expectedRev
  ).run();

  const changes = updateRes?.meta?.changes ?? (updateRes as any)?.changes ?? 0;
  if (changes === 0) {
    const latestRow = await db.prepare('SELECT save_revision FROM players WHERE id = ?').bind(player.id).first();
    if (latestRow) {
      playerStore.delete(player.id);
      const currentRev = Number(latestRow.save_revision);
      throw new SaveConflictError(
        `CONCURRENT_SAVE_CONFLICT: Stale write rejected. Expected revision ${expectedRev}, but current committed database revision is ${currentRev}.`,
        currentRev
      );
    } else {
      // Row doesn't exist yet in D1: execute initial insert
      try {
        await db.prepare(`
          INSERT INTO players (
            id, created_at, last_active_at, battery_energy, battery_capacity,
            research_insight, lab_level, active_assistant, active_assistant_hamster_id,
            last_credited_work, fractional_work_remainder, completed_grand_paradox,
            last_regen_at, fractional_regen_ms, breeding_charges, breeding_charge_progress,
            last_live_breeding_at, active_lab_hybrid_id, last_fate_roll_at,
            last_serious_incident_at, total_experiments_conducted, hybrid_capacity_bonus,
            research_mastery_level, save_revision, save_lineage_id, last_restored_backup_id, state_json
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?
          )
        `).bind(
          player.id,
          player.createdAt || now,
          now,
          player.batteryEnergy,
          player.batteryCapacity,
          player.researchInsight,
          player.labLevel,
          player.activeAssistant,
          player.activeAssistantHamsterId || null,
          player.lastCreditedWork,
          player.fractionalWorkRemainder,
          player.completedGrandParadox ? 1 : 0,
          player.lastRegenAt,
          player.fractionalRegenMs,
          player.breedingCharges || 0,
          player.breedingChargeProgress || 0,
          player.lastLiveBreedingAt || 0,
          player.activeLabHybridId || null,
          player.lastFateRollAt || 0,
          player.lastSeriousIncidentAt || 0,
          player.totalExperimentsConducted || 0,
          player.hybridCapacityBonus || 0,
          player.researchMasteryLevel || 0,
          player.saveRevision,
          player.saveLineageId,
          player.lastRestoredBackupId || null,
          stateJson
        ).run();
      } catch (insertErr) {
        playerStore.delete(player.id);
        const secondCheck = await db.prepare('SELECT save_revision FROM players WHERE id = ?').bind(player.id).first();
        if (secondCheck) {
          throw new SaveConflictError(
            'CONCURRENT_SAVE_CONFLICT: Player account already initialized by another concurrent session.',
            Number(secondCheck.save_revision)
          );
        }
        throw insertErr;
      }
    }
  }

  (player as any)._initialSaveRevision = player.saveRevision;
  playerStore.set(player.id, player);
}

async function getSessionFromDb(db: any, token: string): Promise<{ sessionToken: string; walletAddress: string; playerId: string; expiresAt: number } | null> {
  const cached = siweSessionStore.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return cached;
  }
  if (!db) return null;

  try {
    const row = await db.prepare(
      'SELECT token, wallet_address, player_id, expires_at FROM auth_sessions WHERE token = ?'
    ).bind(token).first();

    if (row && Number(row.expires_at) > Date.now()) {
      const session = {
        sessionToken: row.token || token,
        walletAddress: row.wallet_address,
        playerId: row.player_id,
        expiresAt: Number(row.expires_at)
      };
      siweSessionStore.set(token, session);
      return session;
    }
  } catch (err) {
    console.warn('Error reading auth session from D1:', err);
  }
  return null;
}

async function saveSessionToDb(db: any, token: string, walletAddress: string, playerId: string, expiresAt: number): Promise<void> {
  siweSessionStore.set(token, { sessionToken: token, walletAddress, playerId, expiresAt });
  if (!db) return;

  try {
    await db.prepare(`
      INSERT INTO auth_sessions (token, wallet_address, player_id, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(token) DO UPDATE SET
        expires_at = excluded.expires_at
    `).bind(token, walletAddress, playerId, Date.now(), expiresAt).run();
  } catch (err) {
    console.warn('Error saving auth session to D1:', err);
  }
}

async function deleteSessionFromDb(db: any, token: string): Promise<void> {
  siweSessionStore.delete(token);
  if (!db) return;
  try {
    await db.prepare('DELETE FROM auth_sessions WHERE token = ?').bind(token).run();
  } catch (err) {
    console.warn('Error deleting auth session from D1:', err);
  }
}

async function signBackupPayload(payload: any, secretKey: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = enc.encode(typeof payload === 'string' ? payload : JSON.stringify(payload));
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyBackupSignature(payload: any, signatureHex: string, secretKey: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const data = enc.encode(typeof payload === 'string' ? payload : JSON.stringify(payload));
    const sigBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    return await crypto.subtle.verify('HMAC', key, sigBytes, data);
  } catch {
    return false;
  }
}

async function sealChamberPayload(data: any, secretKey: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(secretKey));
  const key = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

async function unsealChamberPayload(sealedBase64: string, secretKey: string): Promise<any | null> {
  try {
    const binary = atob(sealedBase64);
    const raw = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      raw[i] = binary.charCodeAt(i);
    }
    const iv = raw.slice(0, 12);
    const data = raw.slice(12);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(secretKey));
    const key = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
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
          'Access-Control-Allow-Headers': 'Content-Type, X-Player-ID, Authorization'
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

      // =========================================================================
      // WEB3 AUTHENTICATION: SIWE (EIP-4361) & SESSION MANAGEMENT
      // =========================================================================

      // A. Generate Single-Use SIWE Nonce
      if (pathname === '/api/auth/nonce' && request.method === 'GET') {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let nonce = '';
        for (let i = 0; i < 16; i++) {
          nonce += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute validity
        authNonceStore.set(nonce, {
          nonce,
          createdAt: Date.now(),
          expiresAt,
          consumed: false
        });
        return new Response(JSON.stringify({ nonce }), { headers });
      }

      // B. Verify EIP-4361 Sign-In With Ethereum (SIWE)
      if (pathname === '/api/auth/siwe' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const { message, signature, address, nonce } = body;

        if (!message || !signature || !address || !nonce) {
          return new Response(JSON.stringify({ error: 'Missing SIWE parameters' }), { status: 400, headers });
        }

        // 1. Validate Nonce & Atomic Consumption
        const storedNonce = authNonceStore.get(nonce);
        if (!storedNonce) {
          return new Response(JSON.stringify({ error: 'Invalid or missing nonce' }), { status: 400, headers });
        }
        if (storedNonce.consumed) {
          return new Response(JSON.stringify({ error: 'Nonce has already been consumed (replay prevention)' }), { status: 400, headers });
        }
        if (Date.now() > storedNonce.expiresAt) {
          return new Response(JSON.stringify({ error: 'Nonce has expired' }), { status: 400, headers });
        }
        // Mark consumed immediately
        storedNonce.consumed = true;

        // 2. Validate Message Fields (EIP-4361)
        const normalizedAddress = address.toLowerCase();
        if (!message.toLowerCase().includes(normalizedAddress)) {
          return new Response(JSON.stringify({ error: 'Message address mismatch' }), { status: 400, headers });
        }
        if (!message.includes(`Nonce: ${nonce}`)) {
          return new Response(JSON.stringify({ error: 'Message nonce mismatch' }), { status: 400, headers });
        }

        // 3. Cryptographic Signature Verification
        const isValid = await verifyMessage({
          address: address as Address,
          message,
          signature: signature as Hex
        });

        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid signature for supplied wallet address' }), { status: 401, headers });
        }

        // 4. Resolve or Link Player Identity
        const incomingPlayerId = request.headers.get('X-Player-ID') || url.searchParams.get('playerId') || body.playerId;
        let linkedPlayerId: string | null = null;

        if (env.DB) {
          const existing = await env.DB.prepare(
            'SELECT player_id FROM player_wallets WHERE wallet_address = ?'
          ).bind(normalizedAddress).first('player_id');
          if (existing) {
            linkedPlayerId = existing as string;
          }
        } else {
          linkedPlayerId = walletPlayerMap.get(normalizedAddress) || null;
        }

        if (!linkedPlayerId) {
          // If not yet linked, check if incoming guest player ID is valid and not claimed by another wallet
          let canClaimGuest = false;
          if (incomingPlayerId && !incomingPlayerId.startsWith('player_')) {
            if (env.DB) {
              const claimedBy = await env.DB.prepare(
                'SELECT wallet_address FROM player_wallets WHERE player_id = ?'
              ).bind(incomingPlayerId).first('wallet_address');
              if (!claimedBy || (claimedBy as string).toLowerCase() === normalizedAddress) {
                canClaimGuest = true;
              }
            } else {
              canClaimGuest = true;
            }
          }

          let targetPlayerId: string;
          if (canClaimGuest && incomingPlayerId) {
            targetPlayerId = incomingPlayerId;
          } else {
            targetPlayerId = `player_${normalizedAddress.slice(2, 10)}`;
          }
          linkedPlayerId = targetPlayerId;

          // Persist the link in player_wallets
          if (env.DB) {
            await env.DB.prepare(`
              INSERT INTO player_wallets (wallet_address, player_id, linked_at, last_login_at)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(wallet_address) DO UPDATE SET
                last_login_at = excluded.last_login_at
            `).bind(normalizedAddress, targetPlayerId, Date.now(), Date.now()).run();
          }
          walletPlayerMap.set(normalizedAddress, targetPlayerId);
        } else {
          // Existing link found: update last_login_at
          if (env.DB) {
            await env.DB.prepare(
              'UPDATE player_wallets SET last_login_at = ? WHERE wallet_address = ?'
            ).bind(Date.now(), normalizedAddress).run();
          }
        }

        const resolvedPlayerId = linkedPlayerId || `player_${normalizedAddress.slice(2, 10)}`;

        // 5. Create Authenticated Session Token
        const sessionToken = `siwe_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hour session
        await saveSessionToDb(env.DB, sessionToken, normalizedAddress, resolvedPlayerId, expiresAt);

        return new Response(JSON.stringify({
          authenticated: true,
          address: normalizedAddress,
          playerId: resolvedPlayerId,
          sessionToken
        }), { headers });
      }

      // C. Get Active SIWE Session
      if (pathname === '/api/auth/session' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7);
          const session = await getSessionFromDb(env.DB, token);
          if (session && Date.now() < session.expiresAt) {
            return new Response(JSON.stringify({
              authenticated: true,
              address: session.walletAddress,
              playerId: session.playerId
            }), { headers });
          }
        }
        return new Response(JSON.stringify({ authenticated: false, address: null, playerId: null }), { headers });
      }

      // D. Logout Session
      if (pathname === '/api/auth/logout' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7);
          await deleteSessionFromDb(env.DB, token);
        }
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // Resolve Session or Guest Player Identity
      const authHeader = request.headers.get('Authorization');
      let sessionPlayerId: string | null = null;
      let sessionWallet: string | null = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const session = await getSessionFromDb(env.DB, token);
        if (session && Date.now() < session.expiresAt) {
          sessionPlayerId = session.playerId;
          sessionWallet = session.walletAddress;
        }
      }

      // Developer Authorization Status Check (Minimal, unexposed, fresh authorization)
      if (pathname === '/api/dev/access' && request.method === 'GET') {
        const isAuthorized = !!(sessionWallet && isDeveloperWallet(sessionWallet, env));
        return new Response(JSON.stringify({
          authorized: isAuthorized
        }), {
          headers: {
            ...headers,
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        });
      }

      // Player identity from session or client header (guest support preserved)
      const playerId = sessionPlayerId || request.headers.get('X-Player-ID') || url.searchParams.get('playerId') || 'local-researcher';
      const now = Date.now();

      // Load or initialize player (fail-closed against transient DB errors)
      let player: PlayerState | null = null;
      try {
        player = await loadPlayerState(env.DB, playerId);
      } catch (dbErr: any) {
        console.error('Database load failure for player:', playerId, dbErr);
        return new Response(JSON.stringify({
          error: 'SAVE_LOAD_FAILURE',
          message: 'Failed to safely retrieve laboratory progression from database. Please retry.'
        }), { status: 503, headers });
      }

      if (!player) {
        // Positively verified that no player save exists in D1 for this playerId
        const telemetry = await fetchSqueekchainTelemetry();
        player = createInitialPlayerState(playerId, telemetry.settledCumulativeWork);
        await savePlayerState(env.DB, player);
      } else {
        ensurePlayerMigration(player, now);
      }

      // 2. Get State (applies passive regeneration & quantum fate check)
      if (pathname === '/api/state' && request.method === 'GET') {
        applyPassiveRegeneration(player, now);
        processQuantumFate(player, now);

        await savePlayerState(env.DB, player);
        return new Response(JSON.stringify(sanitizePlayerForClient(player)), { headers });
      }

      // =========================================================================
      // PLAYER SAVE BACKUP & CRYPTOGRAPHIC RECOVERY ENDPOINTS
      // =========================================================================

      // A. Backup Export Endpoint (Authoritative D1 Snapshot + Server-Side HMAC)
      if (pathname === '/api/backup/export' && request.method === 'GET') {
        const incomingPlayerId = request.headers.get('X-Player-ID') || url.searchParams.get('playerId');
        let targetPlayerId: string;

        if (sessionPlayerId) {
          // Authenticated wallet user: strictly lock to session player ID
          targetPlayerId = sessionPlayerId;
        } else {
          if (!incomingPlayerId) {
            return new Response(JSON.stringify({ error: 'Player ID required for export' }), { status: 400, headers });
          }
          // Security Check: If this account is claimed by a wallet in D1, block unauthenticated guest export!
          if (env.DB) {
            const ownerWallet = await env.DB.prepare(
              'SELECT wallet_address FROM player_wallets WHERE player_id = ?'
            ).bind(incomingPlayerId).first('wallet_address');
            if (ownerWallet) {
              return new Response(JSON.stringify({
                error: 'WALLET_AUTHENTICATION_REQUIRED',
                message: 'This account is permanently linked to an Ethereum wallet. Please sign in with your wallet to export backup.'
              }), { status: 403, headers });
            }
          }
          targetPlayerId = incomingPlayerId;
        }

        // Authoritative load directly from D1
        let authoritativePlayer: PlayerState | null = null;
        try {
          authoritativePlayer = await loadPlayerState(env.DB, targetPlayerId);
        } catch (dbErr: any) {
          return new Response(JSON.stringify({
            error: 'SAVE_LOAD_FAILURE',
            message: 'Database query failed during backup export'
          }), { status: 503, headers });
        }

        if (!authoritativePlayer) {
          return new Response(JSON.stringify({ error: 'Player record not found in database' }), { status: 404, headers });
        }

        const cleanPlayerState = sanitizePlayerForClient(authoritativePlayer);
        const exportedAt = Date.now();
        const backupId = `bkp_${authoritativePlayer.id}_${exportedAt}_${Math.random().toString(36).substring(2, 9)}`;
        const saveRevision = authoritativePlayer.saveRevision || 1;
        const lineageId = authoritativePlayer.saveLineageId || `lin_${authoritativePlayer.id}`;

        const canonicalPayload = {
          app: 'schrodingers-hamster',
          version: 2,
          backupId,
          lineageId,
          saveRevision,
          exportedAt,
          playerId: targetPlayerId,
          playerState: cleanPlayerState
        };

        const backupSecret = (env as any)?.BACKUP_SECRET_KEY || (env as any)?.DEFAULT_AUTHORIZER_PRIVATE_KEY || DEFAULT_AUTHORIZER_PRIVATE_KEY;
        const signature = await signBackupPayload(canonicalPayload, backupSecret);

        let sealedIncubation: string | null = null;
        if (authoritativePlayer.activeIncubation?._candidateA && authoritativePlayer.activeIncubation?._candidateB) {
          sealedIncubation = await sealChamberPayload({
            incubationId: authoritativePlayer.activeIncubation.id,
            candidateA: authoritativePlayer.activeIncubation._candidateA,
            candidateB: authoritativePlayer.activeIncubation._candidateB
          }, backupSecret);
        }

        let sealedExperiment: string | null = null;
        if (authoritativePlayer.activeExperiment?._outcomeA && authoritativePlayer.activeExperiment?._outcomeB) {
          sealedExperiment = await sealChamberPayload({
            experimentId: authoritativePlayer.activeExperiment.id,
            outcomeA: authoritativePlayer.activeExperiment._outcomeA,
            outcomeB: authoritativePlayer.activeExperiment._outcomeB
          }, backupSecret);
        }

        const backupFile = {
          app: 'schrodingers-hamster',
          version: 2,
          backupId,
          lineageId,
          saveRevision,
          exportedAt,
          exportedDate: new Date(exportedAt).toISOString(),
          playerId: targetPlayerId,
          walletAddress: sessionWallet || null,
          summary: {
            saveRevision,
            labLevel: authoritativePlayer.labLevel,
            totalHamsters: (authoritativePlayer.hamsters || []).length,
            totalHybrids: (authoritativePlayer.hybrids || []).length,
            researchInsight: authoritativePlayer.researchInsight,
            batteryCapacity: authoritativePlayer.batteryCapacity,
            breedingCharges: authoritativePlayer.breedingCharges || 0,
            totalExperiments: authoritativePlayer.totalExperimentsConducted || 0
          },
          playerState: cleanPlayerState,
          sealedIncubation,
          sealedExperiment,
          signature
        };

        const dateStr = new Date(exportedAt).toISOString().split('T')[0];
        return new Response(JSON.stringify(backupFile, null, 2), {
          headers: {
            ...headers,
            'Content-Disposition': `attachment; filename="schrodingers-hamster-backup-${dateStr}.json"`
          }
        });
      }

      // B. Backup Validation Endpoint (Pre-flight inspection before restoration)
      if (pathname === '/api/backup/validate' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const backup = body.backup || body;

        if (!backup || typeof backup !== 'object') {
          return new Response(JSON.stringify({ valid: false, canRestore: false, error: 'INVALID_JSON', message: 'Malformed backup data' }), { status: 400, headers });
        }
        if (backup.app !== 'schrodingers-hamster' || (backup.version !== 1 && backup.version !== 2) || !backup.playerId || !backup.playerState || !backup.signature) {
          return new Response(JSON.stringify({ valid: false, canRestore: false, error: 'INVALID_SCHEMA', message: 'Incompatible or malformed backup schema' }), { status: 400, headers });
        }

        const backupVersion = backup.version;
        let backupId: string;
        let canonicalPayload: any;

        if (backupVersion === 2) {
          if (!backup.backupId || !backup.lineageId || typeof backup.saveRevision !== 'number') {
            return new Response(JSON.stringify({ valid: false, canRestore: false, error: 'INVALID_SCHEMA', message: 'Version 2 backup must include backupId, lineageId, and saveRevision' }), { status: 400, headers });
          }
          backupId = backup.backupId;
          canonicalPayload = {
            app: backup.app,
            version: 2,
            backupId: backup.backupId,
            lineageId: backup.lineageId,
            saveRevision: backup.saveRevision,
            exportedAt: backup.exportedAt,
            playerId: backup.playerId,
            playerState: backup.playerState
          };
        } else {
          // Version 1 fallback: synthesize deterministic snapshot ID
          backupId = `bkp_v1_${backup.playerId}_${backup.exportedAt}`;
          canonicalPayload = {
            app: backup.app,
            version: 1,
            exportedAt: backup.exportedAt,
            playerId: backup.playerId,
            playerState: backup.playerState
          };
        }

        // Verify cryptographic HMAC signature
        const backupSecret = (env as any)?.BACKUP_SECRET_KEY || (env as any)?.DEFAULT_AUTHORIZER_PRIVATE_KEY || DEFAULT_AUTHORIZER_PRIVATE_KEY;
        const isSigValid = await verifyBackupSignature(canonicalPayload, backup.signature, backupSecret);
        if (!isSigValid) {
          return new Response(JSON.stringify({
            valid: false,
            canRestore: false,
            error: 'TAMPERED_BACKUP',
            message: 'Backup integrity verification failed. File contents or signature have been modified.'
          }), { status: 400, headers });
        }

        // Check account ownership
        const currentActiveId = sessionPlayerId || request.headers.get('X-Player-ID') || url.searchParams.get('playerId') || 'guest';
        if (currentActiveId !== 'guest' && backup.playerId !== currentActiveId) {
          return new Response(JSON.stringify({
            valid: true,
            canRestore: false,
            error: 'ACCOUNT_MISMATCH',
            message: `Backup belongs to account "${backup.playerId}", but you are connected as "${currentActiveId}". Cross-account imports are prohibited.`
          }), { status: 403, headers });
        }

        // Check Single-Use Consumption in D1
        if (env.DB) {
          const alreadyConsumed = await env.DB.prepare(
            'SELECT backup_id, consumed_at, restored_to_player_id FROM consumed_backups WHERE backup_id = ?'
          ).bind(backupId).first();
          if (alreadyConsumed) {
            return new Response(JSON.stringify({
              valid: true,
              canRestore: false,
              error: 'BACKUP_ALREADY_CONSUMED',
              message: `BACKUP_ALREADY_CONSUMED: This backup snapshot (${backupId}) has already been restored and cannot be replayed.`
            }), { status: 409, headers });
          }
        }

        // Security Check: If account is claimed by a wallet in D1, wallet login is strictly required
        if (env.DB) {
          const ownerWallet = await env.DB.prepare(
            'SELECT wallet_address FROM player_wallets WHERE player_id = ?'
          ).bind(backup.playerId).first('wallet_address');
          if (ownerWallet) {
            if (!sessionWallet || (sessionWallet.toLowerCase() !== (ownerWallet as string).toLowerCase())) {
              return new Response(JSON.stringify({
                valid: true,
                canRestore: false,
                error: 'WALLET_AUTHENTICATION_REQUIRED',
                message: `This account is bound to wallet ${(ownerWallet as string).slice(0, 6)}...${(ownerWallet as string).slice(-4)}. You must sign in with this wallet to restore.`
              }), { status: 403, headers });
            }
          }
        }

        // Query current live D1 state for target player
        let currentLive: PlayerState | null = null;
        try {
          currentLive = await loadPlayerState(env.DB, backup.playerId);
        } catch {}

        let canRestore = true;
        let blockReason: string | null = null;

        const backupRevision = backup.saveRevision !== undefined ? Number(backup.saveRevision) : 1;

        if (currentLive) {
          const isLiveStarter = (currentLive.totalExperimentsConducted || 0) === 0 &&
                                currentLive.labLevel === 1 &&
                                (currentLive.hamsters || []).length <= 1 &&
                                (currentLive.hybrids || []).length === 0 &&
                                (currentLive.unlockedResearch || []).length === 0 &&
                                (currentLive.breedingCharges || 0) === 0;

          const liveRevision = currentLive.saveRevision || 1;

          // Anti-Rollback Check: Cannot restore an older revision over active progression!
          if (backupRevision < liveRevision || (!isLiveStarter && backupRevision <= liveRevision)) {
            canRestore = false;
            blockReason = `ANTI_ROLLBACK_VIOLATION: Cannot restore save revision ${backupRevision} over active save revision ${liveRevision}. Restoring older saves would roll back spent charges or progress.`;
          }

          // Check highest consumed revision for this account
          if (env.DB) {
            const highestRow = await env.DB.prepare(
              'SELECT MAX(save_revision) as max_rev FROM consumed_backups WHERE player_id = ?'
            ).bind(backup.playerId).first();
            const maxConsumed = highestRow && (highestRow as any).max_rev !== null ? Number((highestRow as any).max_rev) : null;
            if (maxConsumed !== null && backupRevision <= maxConsumed) {
              canRestore = false;
              blockReason = `ANTI_ROLLBACK_VIOLATION: Backup save revision ${backupRevision} is older than or equal to previously restored revision ${maxConsumed}. Rollback replay is blocked.`;
            }
          }
        }

        // Check NFT integrity: specimens must not conflict with onchain ownership
        if (backup.playerState.hybrids && Array.isArray(backup.playerState.hybrids) && env.DB) {
          for (const h of backup.playerState.hybrids) {
            if (h.nftTokenId) {
              const nftRow = await env.DB.prepare('SELECT wallet_address FROM minted_nfts WHERE token_id = ?').bind(h.nftTokenId).first();
              if (!nftRow) {
                canRestore = false;
                blockReason = `INVALID_NFT_REFERENCE: Hybrid specimen references token #${h.nftTokenId} which is not recorded in the official minted registry.`;
                break;
              }
              if (sessionWallet && (nftRow.wallet_address as string).toLowerCase() !== sessionWallet.toLowerCase()) {
                canRestore = false;
                blockReason = `NFT_OWNERSHIP_MISMATCH: Specimen NFT #${h.nftTokenId} is recorded onchain to ${nftRow.wallet_address}. It cannot be restored into another account.`;
                break;
              }
            }
          }
        }

        return new Response(JSON.stringify({
          valid: true,
          canRestore,
          backupId,
          saveRevision: backupRevision,
          error: blockReason ? 'RESTORE_BLOCKED' : null,
          message: blockReason || 'Backup file is valid, signed, and ready for recovery.',
          summary: backup.summary || {
            saveRevision: backupRevision,
            labLevel: backup.playerState.labLevel,
            totalHamsters: backup.playerState.hamsters?.length || 0,
            totalHybrids: backup.playerState.hybrids?.length || 0,
            researchInsight: backup.playerState.researchInsight
          },
          exportedDate: backup.exportedDate
        }), { headers });
      }

      // C. Backup Import Endpoint (Performs verified atomic restoration with anti-duplication protection)
      if (pathname === '/api/backup/import' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const backup = body.backup || body;

        if (!backup || typeof backup !== 'object') {
          return new Response(JSON.stringify({ error: 'INVALID_JSON', message: 'Malformed backup data' }), { status: 400, headers });
        }
        if (backup.app !== 'schrodingers-hamster' || (backup.version !== 1 && backup.version !== 2) || !backup.playerId || !backup.playerState || !backup.signature) {
          return new Response(JSON.stringify({ error: 'INVALID_SCHEMA', message: 'Incompatible or malformed backup schema' }), { status: 400, headers });
        }

        const backupVersion = backup.version;
        let backupId: string;
        let canonicalPayload: any;

        if (backupVersion === 2) {
          if (!backup.backupId || !backup.lineageId || typeof backup.saveRevision !== 'number') {
            return new Response(JSON.stringify({ error: 'INVALID_SCHEMA', message: 'Version 2 backup must include backupId, lineageId, and saveRevision' }), { status: 400, headers });
          }
          backupId = backup.backupId;
          canonicalPayload = {
            app: backup.app,
            version: 2,
            backupId: backup.backupId,
            lineageId: backup.lineageId,
            saveRevision: backup.saveRevision,
            exportedAt: backup.exportedAt,
            playerId: backup.playerId,
            playerState: backup.playerState
          };
        } else {
          backupId = `bkp_v1_${backup.playerId}_${backup.exportedAt}`;
          canonicalPayload = {
            app: backup.app,
            version: 1,
            exportedAt: backup.exportedAt,
            playerId: backup.playerId,
            playerState: backup.playerState
          };
        }

        // Verify cryptographic HMAC signature
        const backupSecret = (env as any)?.BACKUP_SECRET_KEY || (env as any)?.DEFAULT_AUTHORIZER_PRIVATE_KEY || DEFAULT_AUTHORIZER_PRIVATE_KEY;
        const isSigValid = await verifyBackupSignature(canonicalPayload, backup.signature, backupSecret);
        if (!isSigValid) {
          return new Response(JSON.stringify({
            error: 'TAMPERED_BACKUP',
            message: 'Backup integrity verification failed. File contents or signature have been modified.'
          }), { status: 400, headers });
        }

        // Check account ownership
        const currentActiveId = sessionPlayerId || request.headers.get('X-Player-ID') || url.searchParams.get('playerId') || 'guest';
        if (currentActiveId !== 'guest' && backup.playerId !== currentActiveId) {
          return new Response(JSON.stringify({
            error: 'ACCOUNT_MISMATCH',
            message: `Backup belongs to account "${backup.playerId}", but you are connected as "${currentActiveId}". Cross-account imports are prohibited.`
          }), { status: 403, headers });
        }

        // Check Single-Use Consumption in D1
        if (env.DB) {
          const alreadyConsumed = await env.DB.prepare(
            'SELECT backup_id, consumed_at, restored_to_player_id FROM consumed_backups WHERE backup_id = ?'
          ).bind(backupId).first();
          if (alreadyConsumed) {
            return new Response(JSON.stringify({
              error: 'BACKUP_ALREADY_CONSUMED',
              message: `BACKUP_ALREADY_CONSUMED: This backup snapshot (${backupId}) has already been restored and cannot be replayed.`
            }), { status: 409, headers });
          }
        }

        // Security Check: If account is claimed by a wallet in D1, wallet login is strictly required
        if (env.DB) {
          const ownerWallet = await env.DB.prepare(
            'SELECT wallet_address FROM player_wallets WHERE player_id = ?'
          ).bind(backup.playerId).first('wallet_address');
          if (ownerWallet) {
            if (!sessionWallet || (sessionWallet.toLowerCase() !== (ownerWallet as string).toLowerCase())) {
              return new Response(JSON.stringify({
                error: 'WALLET_AUTHENTICATION_REQUIRED',
                message: `This account is bound to wallet ${(ownerWallet as string).slice(0, 6)}...${(ownerWallet as string).slice(-4)}. You must sign in with this wallet to restore.`
              }), { status: 403, headers });
            }
          }
        }

        // Query current live D1 state for target player
        let currentLive: PlayerState | null = null;
        try {
          currentLive = await loadPlayerState(env.DB, backup.playerId);
        } catch {}

        const backupRevision = backup.saveRevision !== undefined ? Number(backup.saveRevision) : 1;

        if (currentLive) {
          const isLiveStarter = (currentLive.totalExperimentsConducted || 0) === 0 &&
                                currentLive.labLevel === 1 &&
                                (currentLive.hamsters || []).length <= 1 &&
                                (currentLive.hybrids || []).length === 0 &&
                                (currentLive.unlockedResearch || []).length === 0 &&
                                (currentLive.breedingCharges || 0) === 0;

          const liveRevision = currentLive.saveRevision || 1;

          // Anti-Rollback Check: Cannot restore an older revision over active progression!
          if (backupRevision < liveRevision || (!isLiveStarter && backupRevision <= liveRevision)) {
            return new Response(JSON.stringify({
              error: 'ANTI_ROLLBACK_VIOLATION',
              message: `ANTI_ROLLBACK_VIOLATION: Cannot restore save revision ${backupRevision} over active save revision ${liveRevision}. Restoring older saves would roll back spent charges or progress.`
            }), { status: 409, headers });
          }

          // Check highest consumed revision for this account
          if (env.DB) {
            const highestRow = await env.DB.prepare(
              'SELECT MAX(save_revision) as max_rev FROM consumed_backups WHERE player_id = ?'
            ).bind(backup.playerId).first();
            const maxConsumed = highestRow && (highestRow as any).max_rev !== null ? Number((highestRow as any).max_rev) : null;
            if (maxConsumed !== null && backupRevision <= maxConsumed) {
              return new Response(JSON.stringify({
                error: 'ANTI_ROLLBACK_VIOLATION',
                message: `ANTI_ROLLBACK_VIOLATION: Backup save revision ${backupRevision} is older than or equal to previously restored revision ${maxConsumed}. Rollback replay is blocked.`
              }), { status: 409, headers });
            }
          }
        }

        // Check NFT integrity: specimens must not conflict with onchain ownership
        if (backup.playerState.hybrids && Array.isArray(backup.playerState.hybrids) && env.DB) {
          for (const h of backup.playerState.hybrids) {
            if (h.nftTokenId) {
              const nftRow = await env.DB.prepare('SELECT wallet_address FROM minted_nfts WHERE token_id = ?').bind(h.nftTokenId).first();
              if (!nftRow) {
                return new Response(JSON.stringify({
                  error: 'INVALID_NFT_REFERENCE',
                  message: `Hybrid specimen references token #${h.nftTokenId} which is not recorded in the official minted registry.`
                }), { status: 400, headers });
              }
              if (sessionWallet && (nftRow.wallet_address as string).toLowerCase() !== sessionWallet.toLowerCase()) {
                return new Response(JSON.stringify({
                  error: 'NFT_OWNERSHIP_MISMATCH',
                  message: `Specimen NFT #${h.nftTokenId} is recorded onchain to ${nftRow.wallet_address}. It cannot be restored into another account.`
                }), { status: 403, headers });
              }
            }
          }
        }

        // Execute atomic restoration
        const targetPlayerId = backup.playerId;
        const restoredPlayer: PlayerState = backup.playerState;
        restoredPlayer.id = targetPlayerId;
        const targetRevision = Math.max(currentLive?.saveRevision || 0, backupRevision) + 1;
        restoredPlayer.saveRevision = targetRevision;
        restoredPlayer.saveLineageId = backup.lineageId || currentLive?.saveLineageId || `lin_${targetPlayerId}`;
        restoredPlayer.lastRestoredBackupId = backupId;
        restoredPlayer.lastActiveAt = Date.now();

        const legacyNotices: string[] = [];

        // Restore active incubation outcomes
        if (restoredPlayer.activeIncubation) {
          let incubationRestored = false;
          if (backup.sealedIncubation) {
            const unsealed = await unsealChamberPayload(backup.sealedIncubation, backupSecret);
            if (unsealed && unsealed.incubationId === restoredPlayer.activeIncubation.id && unsealed.candidateA && unsealed.candidateB) {
              restoredPlayer.activeIncubation._candidateA = unsealed.candidateA;
              restoredPlayer.activeIncubation._candidateB = unsealed.candidateB;
              incubationRestored = true;
            }
          }
          if (!incubationRestored && currentLive?.activeIncubation?.id === restoredPlayer.activeIncubation.id && currentLive.activeIncubation._candidateA) {
            restoredPlayer.activeIncubation._candidateA = currentLive.activeIncubation._candidateA;
            restoredPlayer.activeIncubation._candidateB = currentLive.activeIncubation._candidateB;
            incubationRestored = true;
          }
          if (!incubationRestored) {
            // Legacy backup without candidate data: handle explicitly
            const wasLiveBreeding = Boolean(restoredPlayer.activeIncubation.isLiveBreeding);
            restoredPlayer.activeIncubation = null;
            if (!wasLiveBreeding) {
              restoredPlayer.breedingCharges = Math.min(MAX_BREEDING_CHARGES, (restoredPlayer.breedingCharges || 0) + 1);
            }
            legacyNotices.push(
              wasLiveBreeding
                ? 'Legacy active incubation (free live breeding) could not be verified for exact candidate preservation; chamber was safely reset.'
                : 'Legacy active incubation could not be verified for exact candidate preservation; chamber was safely reset and 1 breeding charge was refunded.'
            );
          }
        }

        // Restore active experiment outcomes
        if (restoredPlayer.activeExperiment) {
          let experimentRestored = false;
          if (backup.sealedExperiment) {
            const unsealed = await unsealChamberPayload(backup.sealedExperiment, backupSecret);
            if (unsealed && unsealed.experimentId === restoredPlayer.activeExperiment.id && unsealed.outcomeA && unsealed.outcomeB) {
              restoredPlayer.activeExperiment._outcomeA = unsealed.outcomeA;
              restoredPlayer.activeExperiment._outcomeB = unsealed.outcomeB;
              experimentRestored = true;
            }
          }
          if (!experimentRestored && currentLive?.activeExperiment?.id === restoredPlayer.activeExperiment.id && currentLive.activeExperiment._outcomeA) {
            restoredPlayer.activeExperiment._outcomeA = currentLive.activeExperiment._outcomeA;
            restoredPlayer.activeExperiment._outcomeB = currentLive.activeExperiment._outcomeB;
            experimentRestored = true;
          }
          if (!experimentRestored) {
            const spent = (restoredPlayer.activeExperiment as any).energySpent || 15;
            restoredPlayer.activeExperiment = null;
            restoredPlayer.batteryEnergy = Math.min(restoredPlayer.batteryCapacity, restoredPlayer.batteryEnergy + spent);
            legacyNotices.push(`Legacy active experiment could not be verified for exact outcome preservation; experiment was safely reset and ${spent} battery energy was refunded.`);
          }
        }

        ensurePlayerMigration(restoredPlayer, Date.now());

        const stateJson = JSON.stringify(restoredPlayer);
        const now = Date.now();

        if (env.DB) {
          const insertConsumedStmt = env.DB.prepare(`
            INSERT INTO consumed_backups (
              backup_id, player_id, lineage_id, save_revision, consumed_at, restored_to_player_id
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            backupId,
            targetPlayerId,
            restoredPlayer.saveLineageId,
            backupRevision,
            now,
            targetPlayerId
          );

          const upsertPlayerStmt = env.DB.prepare(`
            INSERT INTO players (
              id, created_at, last_active_at, battery_energy, battery_capacity,
              research_insight, lab_level, active_assistant, active_assistant_hamster_id,
              last_credited_work, fractional_work_remainder, completed_grand_paradox,
              last_regen_at, fractional_regen_ms, breeding_charges, breeding_charge_progress,
              last_live_breeding_at, active_lab_hybrid_id, last_fate_roll_at,
              last_serious_incident_at, total_experiments_conducted, hybrid_capacity_bonus,
              research_mastery_level, save_revision, save_lineage_id, last_restored_backup_id, state_json
            ) VALUES (
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?,
              ?, ?, ?,
              ?, ?, ?, ?, ?
            )
            ON CONFLICT(id) DO UPDATE SET
              last_active_at = excluded.last_active_at,
              battery_energy = excluded.battery_energy,
              battery_capacity = excluded.battery_capacity,
              research_insight = excluded.research_insight,
              lab_level = excluded.lab_level,
              active_assistant = excluded.active_assistant,
              active_assistant_hamster_id = excluded.active_assistant_hamster_id,
              last_credited_work = excluded.last_credited_work,
              fractional_work_remainder = excluded.fractional_work_remainder,
              completed_grand_paradox = excluded.completed_grand_paradox,
              last_regen_at = excluded.last_regen_at,
              fractional_regen_ms = excluded.fractional_regen_ms,
              breeding_charges = excluded.breeding_charges,
              breeding_charge_progress = excluded.breeding_charge_progress,
              last_live_breeding_at = excluded.last_live_breeding_at,
              active_lab_hybrid_id = excluded.active_lab_hybrid_id,
              last_fate_roll_at = excluded.last_fate_roll_at,
              last_serious_incident_at = excluded.last_serious_incident_at,
              total_experiments_conducted = excluded.total_experiments_conducted,
              hybrid_capacity_bonus = excluded.hybrid_capacity_bonus,
              research_mastery_level = excluded.research_mastery_level,
              save_revision = excluded.save_revision,
              save_lineage_id = excluded.save_lineage_id,
              last_restored_backup_id = excluded.last_restored_backup_id,
              state_json = excluded.state_json
          `).bind(
            restoredPlayer.id,
            restoredPlayer.createdAt || now,
            now,
            restoredPlayer.batteryEnergy,
            restoredPlayer.batteryCapacity,
            restoredPlayer.researchInsight,
            restoredPlayer.labLevel,
            restoredPlayer.activeAssistant,
            restoredPlayer.activeAssistantHamsterId || null,
            restoredPlayer.lastCreditedWork,
            restoredPlayer.fractionalWorkRemainder,
            restoredPlayer.completedGrandParadox ? 1 : 0,
            restoredPlayer.lastRegenAt,
            restoredPlayer.fractionalRegenMs,
            restoredPlayer.breedingCharges || 0,
            restoredPlayer.breedingChargeProgress || 0,
            restoredPlayer.lastLiveBreedingAt || 0,
            restoredPlayer.activeLabHybridId || null,
            restoredPlayer.lastFateRollAt || 0,
            restoredPlayer.lastSeriousIncidentAt || 0,
            restoredPlayer.totalExperimentsConducted || 0,
            restoredPlayer.hybridCapacityBonus || 0,
            restoredPlayer.researchMasteryLevel || 0,
            restoredPlayer.saveRevision,
            restoredPlayer.saveLineageId,
            restoredPlayer.lastRestoredBackupId,
            stateJson
          );

          await env.DB.batch([insertConsumedStmt, upsertPlayerStmt]);
        }

        (restoredPlayer as any)._initialSaveRevision = restoredPlayer.saveRevision;
        (restoredPlayer as any)._isNewPlayer = false;
        playerStore.set(targetPlayerId, restoredPlayer);

        return new Response(JSON.stringify({
          success: true,
          message: 'Laboratory progression successfully restored from verified backup.',
          notices: legacyNotices.length > 0 ? legacyNotices : undefined,
          player: sanitizePlayerForClient(restoredPlayer)
        }), { headers });
      }

      // 3. Claim Settled Work / Sync Battery
      if (pathname === '/api/claim-work' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const telemetry = await fetchSqueekchainTelemetry();

        const isSimulation = (
          typeof body.simulateUnits === 'number' ||
          typeof body.simulateRpm === 'number' ||
          typeof body.setBatteryCapacity === 'number' ||
          typeof body.setBatteryEnergy === 'number' ||
          typeof body.setBreedingCharges === 'number' ||
          typeof body.setBreedingChargeProgress === 'number' ||
          typeof body.addBreedingCharges === 'number'
        );

        const isMockBypass = Boolean((env as any)?.__ALLOW_MOCK_STORAGE && !(env as any)?.__STRICT_DEV_SECURITY__ && !(env as any)?.DEV_ALLOWED_WALLETS);

        if (isSimulation) {
          if (!isMockBypass) {
            if (!sessionWallet) {
              return new Response(JSON.stringify({
                error: 'UNAUTHORIZED_SIMULATION',
                message: 'Authentication required. A valid SIWE session is required for simulation actions.'
              }), { status: 403, headers });
            }

            if (!isDeveloperWallet(sessionWallet, env)) {
              return new Response(JSON.stringify({
                error: 'FORBIDDEN_SIMULATION',
                message: 'Connected wallet address is not authorized in DEV_ALLOWED_WALLETS.'
              }), { status: 403, headers });
            }

            // Dedicated developer test account isolation
            const dedicatedDevPlayerId = `dev_test_${sessionWallet.toLowerCase().slice(2, 10)}`;
            const requestedPlayerId = request.headers.get('X-Player-ID') || url.searchParams.get('playerId');
            if (requestedPlayerId && requestedPlayerId !== dedicatedDevPlayerId && requestedPlayerId !== sessionPlayerId) {
              return new Response(JSON.stringify({
                error: 'FORBIDDEN_SIMULATION_TARGET',
                message: 'Simulation actions cannot target arbitrary player accounts.'
              }), { status: 403, headers });
            }

            // Isolate mutations to dedicated developer test account
            player = await loadPlayerState(env.DB, dedicatedDevPlayerId);
            if (!player) {
              player = createInitialPlayerState(dedicatedDevPlayerId, telemetry.settledCumulativeWork);
            }
            (player as any).isDevAccount = true;
          }
        }

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

        // Dev test overrides for breeding charges and progress
        if (typeof body.setBreedingCharges === 'number') {
          player.breedingCharges = Math.max(0, Math.min(MAX_BREEDING_CHARGES, Math.floor(body.setBreedingCharges)));
        }
        if (typeof body.setBreedingChargeProgress === 'number') {
          player.breedingChargeProgress = Math.max(0, Math.min(WORK_PER_BREEDING_CHARGE, Math.floor(body.setBreedingChargeProgress)));
        }
        if (typeof body.addBreedingCharges === 'number') {
          player.breedingCharges = Math.max(0, Math.min(MAX_BREEDING_CHARGES, (player.breedingCharges || 0) + Math.floor(body.addBreedingCharges)));
        }

        if (isSimulation && !isMockBypass) {
          (player as any).isDevAccount = true;
          (player as any).hasSimulatedWork = true;
        }

        await savePlayerState(env.DB, player);

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

        await savePlayerState(env.DB, player);

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


        await savePlayerState(env.DB, player);

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

        await savePlayerState(env.DB, player);

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

        await savePlayerState(env.DB, player);

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

        await savePlayerState(env.DB, player);

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

        await savePlayerState(env.DB, player);

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

        await savePlayerState(env.DB, player);

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


        await savePlayerState(env.DB, player);

        return new Response(JSON.stringify({ player: sanitizePlayerForClient(player), upgrade }), { headers });
      }

      // 10b. Post-Doctoral Quantum Synthesis & Lab Mastery
      if (pathname === '/api/research/synthesize' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const action = body.action as 'battery' | 'breeding_charge' | 'habitat_expansion';

        applyPassiveRegeneration(player, now);

        if (action === 'battery') {
          if (player.researchInsight < NOTE_COST_BATTERY_RECHARGE) {
            return new Response(JSON.stringify({ error: `Need ${NOTE_COST_BATTERY_RECHARGE} Research Notes (have ${player.researchInsight})` }), { status: 400, headers });
          }
          if (player.batteryEnergy >= player.batteryCapacity) {
            return new Response(JSON.stringify({ error: 'Battery is already fully charged' }), { status: 400, headers });
          }
          player.researchInsight -= NOTE_COST_BATTERY_RECHARGE;
          player.batteryEnergy = Math.min(player.batteryCapacity, player.batteryEnergy + NOTE_ENERGY_RECHARGE_AMOUNT);
        } else if (action === 'breeding_charge') {
          if (player.researchInsight < NOTE_COST_BREEDING_CHARGE) {
            return new Response(JSON.stringify({ error: `Need ${NOTE_COST_BREEDING_CHARGE} Research Notes (have ${player.researchInsight})` }), { status: 400, headers });
          }
          if ((player.breedingCharges || 0) >= MAX_BREEDING_CHARGES) {
            return new Response(JSON.stringify({ error: 'Breeding charges are already at maximum (3/3)' }), { status: 400, headers });
          }
          player.researchInsight -= NOTE_COST_BREEDING_CHARGE;
          player.breedingCharges = Math.min(MAX_BREEDING_CHARGES, (player.breedingCharges || 0) + 1);
        } else if (action === 'habitat_expansion') {
          if (player.researchInsight < NOTE_COST_HABITAT_EXPANSION) {
            return new Response(JSON.stringify({ error: `Need ${NOTE_COST_HABITAT_EXPANSION} Research Notes (have ${player.researchInsight})` }), { status: 400, headers });
          }
          player.researchInsight -= NOTE_COST_HABITAT_EXPANSION;
          player.hybridCapacityBonus = (player.hybridCapacityBonus || 0) + 1;
          player.researchMasteryLevel = (player.researchMasteryLevel || 0) + 1;
        } else {
          return new Response(JSON.stringify({ error: 'Invalid synthesis action' }), { status: 400, headers });
        }

        await savePlayerState(env.DB, player);

        return new Response(JSON.stringify({
          success: true,
          action,
          player: sanitizePlayerForClient(player)
        }), { headers });
      }

      // 11. Start Quantum Incubation (Breeding)
      if (pathname === '/api/incubator/start' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const parent1Id = (body.parent1Id || body.parent1Species) as string;
        const parent2Id = (body.parent2Id || body.parent2Species) as string;

        if (!player) {
          return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers });
        }

        applyPassiveRegeneration(player, now);
        const telemetry = await fetchSqueekchainTelemetry();

        const currentHybrids = player.hybrids || [];
        try {
          // If parent is an NFT hybrid, verify current onchain ownership via Sepolia RPC
          const verifyNftParent = async (parentId: string) => {
            const hybrid = currentHybrids.find((h: any) => h.id === parentId);
            if (hybrid && hybrid.nftTokenId) {
              if (!sessionWallet) {
                const err: any = new Error('NFT_WALLET_REQUIRED: An authenticated Web3 wallet is required to breed using an NFT parent specimen.');
                err.status = 403;
                err.code = 'NFT_WALLET_REQUIRED';
                throw err;
              }
              const rpcUrl = (env as any)?.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
              const contractAddress = (env as any)?.HAMSTER_NFT_CONTRACT_ADDRESS || '0xd77e88ccdb7b535133796d428e95322217ce99a4';
              let onchainOwner: string | null = null;
              try {
                const publicClient = createPublicClient({
                  chain: {
                    id: 11155111,
                    name: 'Sepolia',
                    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
                    rpcUrls: { default: { http: [rpcUrl] } }
                  } as any,
                  transport: http(rpcUrl)
                });
                onchainOwner = await publicClient.readContract({
                  address: contractAddress as Address,
                  abi: HAMSTER_NFT_ABI,
                  functionName: 'ownerOf',
                  args: [BigInt(hybrid.nftTokenId)]
                }) as string;
              } catch (rpcErr: any) {
                const err: any = new Error(`RPC_OWNERSHIP_CHECK_FAILED: Unable to verify onchain ownership for NFT #${hybrid.nftTokenId} due to RPC communication timeout. Please retry.`);
                err.status = 503;
                err.code = 'RPC_OWNERSHIP_CHECK_FAILED';
                throw err;
              }
              if (!onchainOwner || onchainOwner.toLowerCase() !== sessionWallet.toLowerCase()) {
                const err: any = new Error(`NFT_OWNERSHIP_MISMATCH: Parent NFT #${hybrid.nftTokenId} is owned onchain by ${onchainOwner}, not connected wallet ${sessionWallet}.`);
                err.status = 403;
                err.code = 'NFT_OWNERSHIP_MISMATCH';
                throw err;
              }
            }
          };

          await verifyNftParent(parent1Id);
          await verifyNftParent(parent2Id);

          const res = startIncubation(player, parent1Id, parent2Id, telemetry, now);

          await savePlayerState(env.DB, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            activeIncubation: sanitizePlayerForClient(player).activeIncubation
          }), { headers });
        } catch (err: any) {
          if (err?.code === 'CONCURRENT_SAVE_CONFLICT' || err?.name === 'SaveConflictError') throw err;
          const status = err?.status || 400;
          return new Response(JSON.stringify({
            error: err?.code || (status === 503 ? 'RPC_OWNERSHIP_CHECK_FAILED' : 'BREEDING_ERROR'),
            message: err.message || 'Could not start incubation'
          }), { status, headers });
        }
      }

      // 12. Ghost Hamster Quantum Sight for Incubation
      if (pathname === '/api/incubator/ghost-sight' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const target = (body.target === 'B' ? 'B' : 'A') as 'A' | 'B';

        try {
          const res = useIncubationGhostSight(player, target);

        await savePlayerState(env.DB, player);
          return new Response(JSON.stringify({
            activeIncubation: sanitizePlayerForClient(player).activeIncubation,
            clue: res.clue
          }), { headers });
        } catch (err: any) {
          if (err?.code === 'CONCURRENT_SAVE_CONFLICT' || err?.name === 'SaveConflictError') throw err;
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

        await savePlayerState(env.DB, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            hybrid: res.hybrid,
            chosenState: res.chosenState
          }), { headers });
        } catch (err: any) {
          if (err?.code === 'CONCURRENT_SAVE_CONFLICT' || err?.name === 'SaveConflictError') throw err;
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

        await savePlayerState(env.DB, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            hybrid: res.hybrid
          }), { headers });
        } catch (err: any) {
          if (err?.code === 'CONCURRENT_SAVE_CONFLICT' || err?.name === 'SaveConflictError') throw err;
          return new Response(JSON.stringify({ error: err.message || 'Could not rename hybrid' }), { status: 400, headers });
        }
      }

      // 15. Toggle Favorite Hybrid
      if (pathname === '/api/hybrids/favorite' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hybridId = body.hybridId as string;

        try {
          const res = toggleFavoriteHybrid(player, hybridId);

        await savePlayerState(env.DB, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            hybrid: res.hybrid
          }), { headers });
        } catch (err: any) {
          if (err?.code === 'CONCURRENT_SAVE_CONFLICT' || err?.name === 'SaveConflictError') throw err;
          return new Response(JSON.stringify({ error: err.message || 'Could not toggle favorite' }), { status: 400, headers });
        }
      }

      // 16. Release Hybrid to Quantum Field (Battery Energy Refund)
      if (pathname === '/api/hybrids/release' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hybridId = body.hybridId as string;

        try {
          const res = releaseHybrid(player, hybridId);

        await savePlayerState(env.DB, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            releasedHybrid: res.releasedHybrid,
            energyRefunded: res.energyRefunded
          }), { headers });
        } catch (err: any) {
          if (err?.code === 'CONCURRENT_SAVE_CONFLICT' || err?.name === 'SaveConflictError') throw err;
          return new Response(JSON.stringify({ error: err.message || 'Could not release hybrid' }), { status: 400, headers });
        }
      }

      // 17. Set Lab Display Companion Hybrid
      if (pathname === '/api/hybrids/set-lab-display' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const hybridId = body.hybridId !== undefined ? body.hybridId : null;

        try {
          const res = setLabDisplayHybrid(player, hybridId);

        await savePlayerState(env.DB, player);
          return new Response(JSON.stringify({
            player: sanitizePlayerForClient(player),
            activeLabHybridId: player.activeLabHybridId
          }), { headers });
        } catch (err: any) {
          if (err?.code === 'CONCURRENT_SAVE_CONFLICT' || err?.name === 'SaveConflictError') throw err;
          return new Response(JSON.stringify({ error: err.message || 'Could not set lab display' }), { status: 400, headers });
        }
      }

      // 18. Quantum Fate: Force Test Trigger (deterministic testing)
      if (pathname === '/api/fate/trigger-test' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const isMockBypass = (env as any)?.__ALLOW_MOCK_STORAGE && !(env as any)?.__STRICT_DEV_SECURITY__ && !(env as any)?.DEV_ALLOWED_WALLETS;
        if (!isMockBypass) {
          if (!sessionWallet) {
            return new Response(JSON.stringify({
              error: 'UNAUTHORIZED_SIMULATION',
              message: 'Authentication required. A valid SIWE session is required for test triggers.'
            }), { status: 403, headers });
          }

          if (!isDeveloperWallet(sessionWallet, env)) {
            return new Response(JSON.stringify({
              error: 'FORBIDDEN_SIMULATION',
              message: 'Connected wallet address is not authorized in DEV_ALLOWED_WALLETS.'
            }), { status: 403, headers });
          }

          const dedicatedDevPlayerId = `dev_test_${sessionWallet.toLowerCase().slice(2, 10)}`;
          const requestedPlayerId = request.headers.get('X-Player-ID') || url.searchParams.get('playerId');
          if (requestedPlayerId && requestedPlayerId !== dedicatedDevPlayerId && requestedPlayerId !== sessionPlayerId) {
            return new Response(JSON.stringify({
              error: 'FORBIDDEN_SIMULATION_TARGET',
              message: 'Simulation actions cannot target arbitrary player accounts.'
            }), { status: 403, headers });
          }

          player = await loadPlayerState(env.DB, dedicatedDevPlayerId);
          if (!player) {
            const telemetry = await fetchSqueekchainTelemetry();
            player = createInitialPlayerState(dedicatedDevPlayerId, telemetry.settledCumulativeWork);
          }
          (player as any).isDevAccount = true;
        }

        const incidents = processQuantumFate(player, now, {
          type: body.type,
          hybridId: body.hybridId
        });

        await savePlayerState(env.DB, player);
        return new Response(JSON.stringify({
          player: sanitizePlayerForClient(player),
          incidents
        }), { headers });
      }

      // 19. Quantum Fate: Dismiss / Clear Recent Incidents
      if (pathname === '/api/fate/dismiss' && request.method === 'POST') {
        player.recentFateIncidents = [];

        await savePlayerState(env.DB, player);
        return new Response(JSON.stringify({ success: true, player: sanitizePlayerForClient(player) }), { headers });
      }

      // 20. Reset Profile (for development testing)
      if (pathname === '/api/player/reset' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        let targetPlayerId = playerId;
        const isMockBypass = (env as any)?.__ALLOW_MOCK_STORAGE && !(env as any)?.__STRICT_DEV_SECURITY__ && !(env as any)?.DEV_ALLOWED_WALLETS;
        if (!isMockBypass) {
          if (!sessionWallet) {
            return new Response(JSON.stringify({
              error: 'UNAUTHORIZED_SIMULATION',
              message: 'Authentication required. A valid SIWE session is required for laboratory reset.'
            }), { status: 403, headers });
          }

          if (!isDeveloperWallet(sessionWallet, env)) {
            return new Response(JSON.stringify({
              error: 'FORBIDDEN_SIMULATION',
              message: 'Connected wallet address is not authorized in DEV_ALLOWED_WALLETS.'
            }), { status: 403, headers });
          }

          const dedicatedDevPlayerId = `dev_test_${sessionWallet.toLowerCase().slice(2, 10)}`;
          const requestedPlayerId = request.headers.get('X-Player-ID') || url.searchParams.get('playerId');
          if (requestedPlayerId && requestedPlayerId !== dedicatedDevPlayerId && requestedPlayerId !== sessionPlayerId) {
            return new Response(JSON.stringify({
              error: 'FORBIDDEN_SIMULATION_TARGET',
              message: 'Simulation actions cannot target arbitrary player accounts.'
            }), { status: 403, headers });
          }

          targetPlayerId = dedicatedDevPlayerId;
        }

        const telemetry = await fetchSqueekchainTelemetry();
        const prevRevision = player?.saveRevision || 1;
        const resetPlayer = createInitialPlayerState(targetPlayerId, telemetry.settledCumulativeWork);
        (resetPlayer as any)._initialSaveRevision = prevRevision;
        if (targetPlayerId.startsWith('dev_')) {
          (resetPlayer as any).isDevAccount = true;
        }

        if (typeof body.insight === 'number') {
          resetPlayer.researchInsight = body.insight;
        }
        if (typeof body.labLevel === 'number') {
          resetPlayer.labLevel = body.labLevel as any;
        }
        if (Array.isArray(body.unlockedResearch)) {
          resetPlayer.unlockedResearch = [...body.unlockedResearch];
        }

        if (Array.isArray(body.hybrids)) {
          resetPlayer.hybrids = [...body.hybrids];
        }

        if (body.grantSpecies && Array.isArray(body.grantSpecies)) {
          for (const s of body.grantSpecies) {
            resetPlayer.discoveredHamsters[s] = { discoveredAt: Date.now(), count: 1 };
            // Also ensure individual companion is in hamsters list
            if (!resetPlayer.hamsters.some(h => h.speciesId === s)) {
              resetPlayer.hamsters.push({
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

        await savePlayerState(env.DB, resetPlayer, { expectedRevision: prevRevision });
        player = resetPlayer;
        return new Response(JSON.stringify({ player: sanitizePlayerForClient(resetPlayer), message: 'Lab reset complete' }), { headers });
      }

      // =========================================================================
      // WEB3 v1: IMMUTABLE ERC-721 NFT MINT GATE & AUTHORIZATION
      // =========================================================================

      // 21a. Squeekchain Next-Block Mint Gate: Initiate Mint Request
      if (pathname === '/api/nft/initiate-mint' && request.method === 'POST') {
        const isMintingDisabled = (env as any)?.ENABLE_NFT_MINTING === 'false' || (env as any)?.ENABLE_NFT_MINTING === false;
        if (isMintingDisabled) {
          return new Response(JSON.stringify({
            error: 'MINTING_NOT_ACTIVE',
            message: 'NFT Minting is safely paused pending public Sepolia contract verification. Gameplay progression is fully active!'
          }), { status: 503, headers });
        }

        const body = await request.json().catch(() => ({})) as any;
        const { specimenId } = body;

        if (!sessionWallet) {
          return new Response(JSON.stringify({ error: 'Authentication required. Please sign in with your Ethereum wallet.' }), { status: 401, headers });
        }

        // Stage 1 Restricted Sepolia Beta Allowlist Check
        const betaCheck = isWalletAllowlistedForBeta(env, sessionWallet);
        if (!betaCheck.allowed) {
          return new Response(JSON.stringify({
            error: 'RESTRICTED_BETA_WALLET_NOT_ALLOWLISTED',
            message: 'NFT Minting is currently in Stage 1 Restricted Sepolia Beta for authorized test wallets. Normal gameplay, breeding, and research are fully active for all players!'
          }), { status: 403, headers });
        }

        if (!specimenId) {
          return new Response(JSON.stringify({ error: 'Missing specimenId parameter' }), { status: 400, headers });
        }

        // Developer Test Account & Simulated Work Mint Gate Disqualification
        const targetMintPlayerId = (request.headers.get('X-Player-ID')?.startsWith('dev_') ? request.headers.get('X-Player-ID') : null) || player.id;
        if (targetMintPlayerId.startsWith('dev_') || (player as any).isDevAccount || (player as any).hasSimulatedWork) {
          return new Response(JSON.stringify({
            error: 'SIMULATION_ACCOUNT_DISQUALIFIED',
            message: 'Developer test accounts and simulated progression are not eligible for NFT minting.'
          }), { status: 403, headers });
        }

        const hybrid = (player.hybrids || []).find(h => h.id === specimenId);
        if (!hybrid) {
          return new Response(JSON.stringify({ error: 'Specimen not found in player collection' }), { status: 404, headers });
        }

        if ((hybrid as any).isSimulated) {
          return new Response(JSON.stringify({
            error: 'SIMULATION_SPECIMEN_DISQUALIFIED',
            message: 'Simulated specimens are not eligible for NFT minting.'
          }), { status: 403, headers });
        }

        if (hybrid.existenceStatus === 'deceased' || hybrid.existenceStatus === 'missing') {
          return new Response(JSON.stringify({ error: 'Specimen is not available in active laboratory storage.' }), { status: 400, headers });
        }

        if (hybrid.nftTokenId || specimenMintMap.has(specimenId)) {
          return new Response(JSON.stringify({ error: 'Specimen has already been minted.' }), { status: 400, headers });
        }

        // Check if an unlocked or pending request already exists for this specimen
        const existingReq = await loadPendingMintRequest(env.DB, specimenId);
        if (existingReq) {
          if (existingReq.status === 'minted') {
            return new Response(JSON.stringify({ error: 'Specimen has already been minted.' }), { status: 400, headers });
          }
          if (existingReq.status === 'unlocked') {
            // Already unlocked: preserve eligibility
            return new Response(JSON.stringify({
              status: 'unlocked',
              requestId: existingReq.requestId,
              specimenId: existingReq.specimenId,
              baselineBlockHeight: existingReq.baselineBlockHeight,
              qualifyingBlockHeight: existingReq.qualifyingBlockHeight,
              qualifyingConfirmedAt: existingReq.qualifyingConfirmedAt,
              unlockedAt: existingReq.unlockedAt
            }), { headers });
          }
        }

        // Fetch current verified settled Squeek block from official API
        let verifiedBlock: SqueekBlockVerification;
        try {
          verifiedBlock = await fetchVerifiedSqueekBlock({
            mockBlock: (env as any)?.__MOCK_SQUEEK_BLOCK
          });
        } catch (apiErr: any) {
          return new Response(JSON.stringify({
            error: 'SQUEEKCHAIN_API_UNAVAILABLE',
            message: `Failed to query verified Squeekchain block status: ${apiErr.message}. Please retry in a few moments.`
          }), { status: 503, headers });
        }

        const baselineBlockHeight = verifiedBlock.settledBlockHeight;
        const baselineRound = verifiedBlock.settledRound;
        const requestTimestamp = Date.now();
        const genesisTimestamp = 1793022600;
        const roundDuration = 600;
        const activeRoundAtRequest = Math.floor((requestTimestamp / 1000 - genesisTimestamp) / roundDuration) + 1;

        const pendingReq: PendingMintRequest = {
          requestId: `mint_req_${specimenId}_${requestTimestamp}`,
          specimenId,
          playerId: player.id,
          walletAddress: sessionWallet,
          baselineBlockHeight,
          baselineRound,
          activeRoundAtRequest,
          priorRoundSettledHeight: baselineRound >= activeRoundAtRequest ? baselineBlockHeight : null,
          requestTimestamp,
          status: 'awaiting_block',
          qualifyingBlockHeight: null,
          qualifyingRound: null,
          qualifyingConfirmedAt: null,
          unlockedAt: null,
          createdAt: requestTimestamp,
          updatedAt: requestTimestamp
        };

        await savePendingMintRequest(env.DB, pendingReq);

        return new Response(JSON.stringify({
          status: 'awaiting_block',
          requestId: pendingReq.requestId,
          specimenId: pendingReq.specimenId,
          baselineBlockHeight,
          baselineRound,
          requestTimestamp,
          liveBlockHeight: verifiedBlock.provisionalBlockHeight || baselineBlockHeight
        }), { headers });
      }

      // 21b. Squeekchain Next-Block Mint Gate: Check Status & Verify Settlement
      if (pathname === '/api/nft/mint-status' && request.method === 'GET') {
        const specimenId = url.searchParams.get('specimenId');
        if (!specimenId) {
          return new Response(JSON.stringify({ error: 'Missing specimenId parameter' }), { status: 400, headers });
        }

        const pendingReq = await loadPendingMintRequest(env.DB, specimenId);
        if (!pendingReq) {
          return new Response(JSON.stringify({ status: 'not_requested' }), { headers });
        }

        // Return authoritative status if already unlocked or minted
        if (pendingReq.status === 'unlocked' || pendingReq.status === 'minted') {
          return new Response(JSON.stringify({
            status: pendingReq.status,
            requestId: pendingReq.requestId,
            specimenId: pendingReq.specimenId,
            baselineBlockHeight: pendingReq.baselineBlockHeight,
            qualifyingBlockHeight: pendingReq.qualifyingBlockHeight,
            qualifyingRound: pendingReq.qualifyingRound,
            qualifyingConfirmedAt: pendingReq.qualifyingConfirmedAt,
            unlockedAt: pendingReq.unlockedAt
          }), { headers });
        }

        // Currently awaiting block: check if next settled Squeek block has completed
        let currentBlock: SqueekBlockVerification;
        try {
          currentBlock = await fetchVerifiedSqueekBlock({
            mockBlock: (env as any)?.__MOCK_SQUEEK_BLOCK
          });
        } catch (apiErr: any) {
          // Fail-closed against API outages: do not alter state or falsely unlock
          return new Response(JSON.stringify({
            status: 'awaiting_block',
            requestId: pendingReq.requestId,
            specimenId: pendingReq.specimenId,
            baselineBlockHeight: pendingReq.baselineBlockHeight,
            apiError: `Squeekchain verification endpoint temporary notice: ${apiErr.message}`
          }), { headers });
        }

        // Attribution & Boundary Tracking:
        // If the active round at request time had not yet settled, record its settled height once settled.
        if (pendingReq.priorRoundSettledHeight === null) {
          if (currentBlock.settledRound === pendingReq.activeRoundAtRequest) {
            pendingReq.priorRoundSettledHeight = currentBlock.settledBlockHeight;
            pendingReq.updatedAt = Date.now();
            await savePendingMintRequest(env.DB, pendingReq);
          }
        }

        // Strict Attribution Criteria:
        // 1. The qualifying round must have started STRICTLY AFTER the player's mint request.
        const roundStartedAfterRequest = currentBlock.roundStartMs > pendingReq.requestTimestamp;
        // 2. The settled round must be strictly greater than the active round during which request occurred.
        const isSubsequentRound = currentBlock.settledRound > pendingReq.activeRoundAtRequest;
        // 3. Effective baseline height: must exceed the boundary height when prior rounds concluded.
        const effectiveBaseline = pendingReq.priorRoundSettledHeight !== null
          ? pendingReq.priorRoundSettledHeight
          : pendingReq.baselineBlockHeight;
        // 4. Block height must have strictly increased due to work in the qualifying subsequent round.
        const isNewerHeight = currentBlock.settledBlockHeight > effectiveBaseline;
        // 5. Must be confirmed onchain after request.
        const confirmedAfterRequest = currentBlock.confirmedAtMs > pendingReq.requestTimestamp;

        if (isNewerHeight && isSubsequentRound && roundStartedAfterRequest && confirmedAfterRequest) {
          // Permanently unlock mint eligibility
          pendingReq.status = 'unlocked';
          pendingReq.qualifyingBlockHeight = currentBlock.settledBlockHeight;
          pendingReq.qualifyingRound = currentBlock.settledRound;
          pendingReq.qualifyingConfirmedAt = currentBlock.confirmedAtMs;
          pendingReq.unlockedAt = Date.now();
          pendingReq.updatedAt = Date.now();

          await savePendingMintRequest(env.DB, pendingReq);

          return new Response(JSON.stringify({
            status: 'unlocked',
            requestId: pendingReq.requestId,
            specimenId: pendingReq.specimenId,
            baselineBlockHeight: pendingReq.baselineBlockHeight,
            qualifyingBlockHeight: pendingReq.qualifyingBlockHeight,
            qualifyingRound: pendingReq.qualifyingRound,
            qualifyingConfirmedAt: pendingReq.qualifyingConfirmedAt,
            unlockedAt: pendingReq.unlockedAt
          }), { headers });
        }

        return new Response(JSON.stringify({
          status: 'awaiting_block',
          requestId: pendingReq.requestId,
          specimenId: pendingReq.specimenId,
          baselineBlockHeight: pendingReq.baselineBlockHeight,
          baselineRound: pendingReq.baselineRound,
          requestTimestamp: pendingReq.requestTimestamp,
          liveBlockHeight: currentBlock.settledBlockHeight,
          liveProvisionalHeight: currentBlock.provisionalBlockHeight
        }), { headers });
      }

      // 21. Request EIP-712 Mint Authorization for an eligible hybrid specimen
      if (pathname === '/api/nft/authorize-mint' && request.method === 'POST') {
        const isMintingDisabled = (env as any)?.ENABLE_NFT_MINTING === 'false' || (env as any)?.ENABLE_NFT_MINTING === false;
        if (isMintingDisabled) {
          return new Response(JSON.stringify({
            error: 'MINTING_NOT_ACTIVE',
            message: 'NFT Minting is safely paused pending public Sepolia contract verification. Gameplay progression is fully active!'
          }), { status: 503, headers });
        }

        const body = await request.json().catch(() => ({})) as any;
        const { specimenId } = body;

        if (!sessionWallet) {
          return new Response(JSON.stringify({ error: 'Authentication required. Please sign in with your Ethereum wallet.' }), { status: 401, headers });
        }

        // Stage 1 Restricted Sepolia Beta Allowlist Check
        const betaCheck = isWalletAllowlistedForBeta(env, sessionWallet);
        if (!betaCheck.allowed) {
          return new Response(JSON.stringify({
            error: 'RESTRICTED_BETA_WALLET_NOT_ALLOWLISTED',
            message: 'NFT Minting is currently in Stage 1 Restricted Sepolia Beta for authorized test wallets. Normal gameplay, breeding, and research are fully active for all players!'
          }), { status: 403, headers });
        }

        if (!specimenId) {
          return new Response(JSON.stringify({ error: 'Missing specimenId parameter' }), { status: 400, headers });
        }

        // Find specimen in player collection
        const hybrid = (player.hybrids || []).find(h => h.id === specimenId);
        if (!hybrid) {
          return new Response(JSON.stringify({ error: 'Specimen not found in player collection' }), { status: 404, headers });
        }

        // Check existence status (deceased or missing cannot be minted)
        if (hybrid.existenceStatus === 'deceased') {
          return new Response(JSON.stringify({ error: 'Deceased specimens in the Memorial Archive cannot be minted.' }), { status: 400, headers });
        }
        if (hybrid.existenceStatus === 'missing') {
          return new Response(JSON.stringify({ error: 'Specimen is currently in quantum superposition elsewhere and cannot be minted.' }), { status: 400, headers });
        }

        // Check if already minted or authorized
        if (hybrid.nftTokenId || specimenMintMap.has(specimenId)) {
          const existingToken = hybrid.nftTokenId || specimenMintMap.get(specimenId);
          return new Response(JSON.stringify({ error: `Specimen has already been minted as onchain NFT #${existingToken}.` }), { status: 400, headers });
        }

        // Check Next-Squeek-Block Mint Gate: must be unlocked by a verified post-request Squeek block
        const mintReq = await loadPendingMintRequest(env.DB, specimenId);
        if (!mintReq || mintReq.status !== 'unlocked') {
          return new Response(JSON.stringify({
            error: 'MINT_GATE_LOCKED',
            message: 'Minting is locked until a verified Squeekchain block completes after your request.'
          }), { status: 403, headers });
        }

        // Ensure wallet address matches the wallet that initiated the mint gate
        if (mintReq.walletAddress.toLowerCase() !== sessionWallet.toLowerCase()) {
          return new Response(JSON.stringify({
            error: 'WALLET_MISMATCH',
            message: 'Mint authorization must be requested by the wallet that initiated the mint gate.'
          }), { status: 403, headers });
        }

        // Allocate next sequential token ID
        const tokenId = mintedNftStore.size + 1;

        // Retrieve existing frozen snapshot or freeze new immutable collectible snapshot
        let snapshot = frozenSnapshotStore.get(specimenId);
        let artworkCid = snapshot?.artworkCid || '';
        let metadataCid = snapshot?.metadataCid || '';

        if (!snapshot) {
          const storageConfig: IpfsStorageConfig = {
            pinataJwt: (env as any)?.PINATA_JWT,
            pinataGateway: (env as any)?.PINATA_GATEWAY,
            mockStorageStore: mockIpfsStore,
            forceMockFailure: (env as any)?.__FORCE_IPFS_FAILURE,
            allowMockSandbox: (env as any)?.ALLOW_MOCK_STORAGE === 'true' || (env as any)?.__ALLOW_MOCK_STORAGE === true
          };

          try {
            const freezeResult = await freezeCollectibleSnapshot(hybrid, tokenId, playerId, sessionWallet, storageConfig);
            snapshot = freezeResult.snapshot;
            artworkCid = freezeResult.artworkResult.cid;
            metadataCid = freezeResult.metadataResult.cid;
            frozenSnapshotStore.set(specimenId, snapshot);

            if (env.DB) {
              await env.DB.prepare(`
                INSERT OR REPLACE INTO nft_frozen_snapshots
                (specimen_id, token_id, player_id, wallet_address, name, rarity, personality, parent1_species, parent2_species, seed, traits_json, artwork_cid, artwork_hash, metadata_cid, metadata_hash, token_uri, specimen_hash, storage_provider, verified_at, frozen_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                snapshot.specimenId, snapshot.tokenId, snapshot.playerId, snapshot.walletAddress,
                snapshot.name, snapshot.rarity, snapshot.personality, snapshot.parent1Species, snapshot.parent2Species,
                snapshot.seed, snapshot.traitsJson, snapshot.artworkCid, snapshot.artworkHash,
                snapshot.metadataCid, snapshot.metadataHash, snapshot.tokenUri, snapshot.specimenHash,
                snapshot.storageProvider, snapshot.verifiedAt, snapshot.frozenAt
              ).run().catch((dbErr: any) => console.warn('D1 snapshot persist warning:', dbErr));
            }
          } catch (storageErr: any) {
            return new Response(JSON.stringify({
              error: `NFT Storage Blocker: Failed to publish and verify IPFS content (${storageErr.message}). Mint authorization blocked to prevent broken onchain NFTs.`
            }), { status: 502, headers });
          }
        }

        const tokenURI = snapshot.tokenUri;
        const metadataHash = snapshot.metadataHash;
        const specimenHash = snapshot.specimenHash;

        const nonce = (BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 900) + 100)).toString();
        const deadline = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes validity

        const authorizerKey = (env as any)?.MINT_AUTHORIZER_PRIVATE_KEY || ((env as any)?.__ALLOW_MOCK_STORAGE ? DEFAULT_AUTHORIZER_PRIVATE_KEY : null);
        if (!authorizerKey) {
          console.error('CRITICAL CONFIGURATION ERROR: MINT_AUTHORIZER_PRIVATE_KEY secret is not configured.');
          return new Response(JSON.stringify({
            error: 'AUTHORIZER_KEY_NOT_CONFIGURED',
            message: 'Server authorization key is not configured. Minting paused for security.'
          }), { status: 500, headers });
        }

        // Reject known development keys in production
        const KNOWN_DEV_KEYS = [
          '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
          '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
        ];
        if (!(env as any)?.__ALLOW_MOCK_STORAGE && KNOWN_DEV_KEYS.includes(authorizerKey.toLowerCase())) {
          console.error('SECURITY ERROR: MINT_AUTHORIZER_PRIVATE_KEY is a sample development key.');
          return new Response(JSON.stringify({
            error: 'INSECURE_AUTHORIZER_KEY',
            message: 'Insecure development authorizer key detected. Minting rejected.'
          }), { status: 500, headers });
        }

        const authorizerAccount = privateKeyToAccount(authorizerKey as Hex);
        const contractAddress = (env as any)?.NFT_CONTRACT_ADDRESS || DEFAULT_NFT_CONTRACT_ADDRESS;

        // Security assertion: authorizer key must match the expected authorizer address
        const expectedAuthorizerAddress = (env as any)?.MINT_AUTHORIZER_ADDRESS;
        if (expectedAuthorizerAddress && authorizerAccount.address.toLowerCase() !== expectedAuthorizerAddress.toLowerCase()) {
          console.error(`MINT AUTHORIZER MISMATCH: Authorizer signing key produces ${authorizerAccount.address}, but contract authorizer is ${expectedAuthorizerAddress}`);
          return new Response(JSON.stringify({
            error: 'AUTHORIZER_KEY_MISMATCH',
            message: 'Server authorization configuration mismatch. Mint authorization safely paused.'
          }), { status: 500, headers });
        }

        // EIP-712 Domain and Typed Data
        const domain = {
          name: 'Schrodingers Hamster',
          version: '1.0.0',
          chainId: TARGET_SEPOLIA_CHAIN_ID,
          verifyingContract: contractAddress as Address
        };

        const types = {
          MintAuthorization: [
            { name: 'recipient', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'tokenURI', type: 'string' },
            { name: 'metadataHash', type: 'bytes32' },
            { name: 'specimenHash', type: 'bytes32' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        };

        const signature = await authorizerAccount.signTypedData({
          domain,
          types,
          primaryType: 'MintAuthorization',
          message: {
            recipient: sessionWallet as Address,
            tokenId: BigInt(snapshot.tokenId),
            tokenURI,
            metadataHash,
            specimenHash,
            nonce: BigInt(nonce),
            deadline: BigInt(deadline)
          }
        });

        hybrid.nftMetadataUri = tokenURI;

        return new Response(JSON.stringify({
          recipient: sessionWallet,
          tokenId: snapshot.tokenId,
          tokenURI,
          metadataHash,
          specimenHash,
          nonce,
          deadline,
          signature,
          contractAddress,
          chainId: TARGET_SEPOLIA_CHAIN_ID,
          artworkCid: snapshot.artworkCid,
          metadataCid: snapshot.metadataCid
        }), { headers });
      }

      // 22. Confirm Confirmed Mint Transaction & Bind Onchain Identity
      if (pathname === '/api/nft/confirm-mint' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const { tokenId, txHash } = body;

        if (!tokenId || !txHash) {
          return new Response(JSON.stringify({ error: 'Missing tokenId or txHash' }), { status: 400, headers });
        }

        const targetHybrid = (player.hybrids || []).find(h => h.nftTokenId === tokenId || h.nftMetadataUri) ||
                             (player.hybrids || []).find(h => !h.nftTokenId);

        if (targetHybrid) {
          targetHybrid.nftTokenId = tokenId;
          targetHybrid.nftTxHash = txHash;
          targetHybrid.nftContractAddress = (env as any)?.NFT_CONTRACT_ADDRESS || DEFAULT_NFT_CONTRACT_ADDRESS;
          targetHybrid.nftMintedAt = Date.now();
          targetHybrid.nftOwnerAddress = sessionWallet || player.id;

          specimenMintMap.set(targetHybrid.id, tokenId);
          mintedNftStore.set(tokenId, {
            tokenId,
            specimenId: targetHybrid.id,
            walletAddress: sessionWallet || 'anonymous',
            txHash,
            tokenUri: targetHybrid.nftMetadataUri || '',
            metadataHash: '',
            mintedAt: Date.now()
          });

          // Mark pending mint request as permanently minted
          const mintReq = await loadPendingMintRequest(env.DB, targetHybrid.id);
          if (mintReq) {
            mintReq.status = 'minted';
            mintReq.updatedAt = Date.now();
            await savePendingMintRequest(env.DB, mintReq);
          }

          await savePlayerState(env.DB, player);
          return new Response(JSON.stringify({
            success: true,
            hybrid: targetHybrid,
            player: sanitizePlayerForClient(player)
          }), { headers });
        }

        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // 22b. Verify and Synchronize ERC-721 Onchain Owner
      if (pathname === '/api/nft/sync-owner' && request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const { specimenId, tokenId } = body;

        if (!specimenId && !tokenId) {
          return new Response(JSON.stringify({ error: 'Missing specimenId or tokenId' }), { status: 400, headers });
        }

        const hybrid = (player.hybrids || []).find(h => h.id === specimenId || (tokenId && h.nftTokenId === tokenId));
        if (!hybrid || !hybrid.nftTokenId) {
          return new Response(JSON.stringify({ error: 'Specimen is not minted onchain' }), { status: 404, headers });
        }

        let onchainOwner: string | null = null;
        try {
          const contractAddress = (env as any)?.NFT_CONTRACT_ADDRESS || DEFAULT_NFT_CONTRACT_ADDRESS;
          const rpcUrl = (env as any)?.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
          const localMint = mintedNftStore.get(hybrid.nftTokenId);
          if (localMint && (env as any)?.__ALLOW_MOCK_STORAGE) {
            onchainOwner = localMint.walletAddress;
          } else {
            const publicClient = createPublicClient({
              chain: {
                id: 11155111,
                name: 'Sepolia',
                nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
                rpcUrls: { default: { http: [rpcUrl] } }
              } as any,
              transport: http(rpcUrl)
            });
            const owner = await publicClient.readContract({
              address: contractAddress as Address,
              abi: HAMSTER_NFT_ABI,
              functionName: 'ownerOf',
              args: [BigInt(hybrid.nftTokenId)]
            });
            onchainOwner = owner as string;
          }
        } catch (e: any) {
          console.warn('Sync owner readContract notice:', e.message);
        }

        if (onchainOwner) {
          hybrid.nftOwnerAddress = onchainOwner;
          await savePlayerState(env.DB, player);
        }

        const isCurrentOwner = sessionWallet && onchainOwner
          ? onchainOwner.toLowerCase() === sessionWallet.toLowerCase()
          : false;

        return new Response(JSON.stringify({
          specimenId: hybrid.id,
          tokenId: hybrid.nftTokenId,
          owner: onchainOwner || hybrid.nftOwnerAddress,
          isCurrentOwner
        }), { headers });
      }

      // 23. Local Fallback Mirror: Canonical NFT Metadata
      if (pathname.startsWith('/api/nft/metadata/') && request.method === 'GET') {
        const target = pathname.replace('/api/nft/metadata/', '');
        if (mockIpfsStore.has(target)) {
          return new Response(mockIpfsStore.get(target), {
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }
        const snapshot = Array.from(frozenSnapshotStore.values()).find(s => s.metadataCid === target || String(s.tokenId) === target);
        if (snapshot) {
          const hybrid = (player.hybrids || []).find(h => h.id === snapshot.specimenId);
          if (hybrid) {
            const canonical = buildCanonicalNftMetadata(hybrid, snapshot.tokenId, snapshot.artworkCid);
            return new Response(JSON.stringify(canonical, null, 2), {
              headers: { ...headers, 'Content-Type': 'application/json' }
            });
          }
        }
        return new Response(JSON.stringify({ error: 'Metadata not found' }), { status: 404, headers });
      }

      // 24. Local Fallback Mirror: Standalone Pixel Artwork SVG
      if (pathname.startsWith('/api/nft/artwork/') && request.method === 'GET') {
        let target = pathname.replace('/api/nft/artwork/', '');
        if (target.endsWith('.svg')) target = target.slice(0, -4);

        if (mockIpfsStore.has(target)) {
          return new Response(mockIpfsStore.get(target), {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=31536000, immutable'
            }
          });
        }
        const snapshot = Array.from(frozenSnapshotStore.values()).find(s => s.artworkCid === target || String(s.tokenId) === target);
        if (snapshot) {
          const hybrid = (player.hybrids || []).find(h => h.id === snapshot.specimenId);
          if (hybrid) {
            const svg = generateDeterministicHybridSvg(hybrid);
            return new Response(svg, {
              headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=31536000, immutable'
              }
            });
          }
        }
        return new Response('SVG artwork not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
      }

      return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404, headers });
    } catch (err: any) {
      if (err?.code === 'CONCURRENT_SAVE_CONFLICT' || err?.name === 'SaveConflictError') {
        return new Response(JSON.stringify({
          error: 'CONCURRENT_SAVE_CONFLICT',
          message: err.message,
          currentRevision: err.currentRevision
        }), { status: 409, headers });
      }
      return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
    }
  }
};
