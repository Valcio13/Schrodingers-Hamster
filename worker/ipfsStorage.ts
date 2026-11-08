import { keccak256, toHex, Hex } from 'viem';
import { QuantumHybrid } from '../src/types/game';
import {
  generateDeterministicHybridSvg,
  computeDeterministicIpfsCid,
  buildCanonicalNftMetadata,
  computeSpecimenHash
} from '../src/utils/nftMetadata';

export interface IpfsPublicationResult {
  cid: string;
  uri: string;
  hash: Hex;
  sizeBytes: number;
  retrievalVerified: boolean;
  gatewayUrl: string;
  codecInfo: string;
}

export interface FrozenNftSnapshot {
  specimenId: string;
  tokenId: number;
  playerId: string;
  walletAddress: string;
  name: string;
  rarity: string;
  personality: string;
  parent1Species: string;
  parent2Species: string;
  seed: number;
  traitsJson: string;
  artworkCid: string;
  artworkHash: Hex;
  metadataCid: string;
  metadataHash: Hex;
  tokenUri: string;
  specimenHash: Hex;
  storageProvider: string;
  verifiedAt: number;
  frozenAt: number;
}

export interface IpfsStorageConfig {
  pinataJwt?: string;
  pinataGateway?: string;
  publicGateway?: string;
  mockStorageStore?: Map<string, string>;
  forceMockFailure?: boolean;
  allowMockSandbox?: boolean;
}

// Pinata V3 Files upload endpoint
const PINATA_V3_UPLOAD_URL = 'https://uploads.pinata.cloud/v3/files';

/**
 * Identifies the IPFS CID codec and representation format.
 */
export function identifyCidCodec(cid: string): string {
  if (cid.startsWith('Qm')) return 'CIDv0 (dag-pb / UnixFS, base58btc)';
  if (cid.startsWith('bafy')) return 'CIDv1 (dag-pb / UnixFS, base32)';
  if (cid.startsWith('bafk')) return 'CIDv1 (raw block, base32)';
  if (cid.startsWith('bafz')) return 'CIDv1 (dag-cbor, base32)';
  return 'CIDv1 (unrecognized prefix)';
}

/**
 * Extracts a valid IPFS CID from Pinata's response.
 */
function extractValidCid(data: any): string | null {
  if (!data) return null;
  const candidates = [
    data?.data?.cid,
    data?.cid,
    data?.IpfsHash,
    data?.data?.IpfsHash
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && (c.startsWith('baf') || c.startsWith('Qm'))) {
      return c;
    }
  }
  return null;
}

/**
 * Calculates SHA-256 hash formatted as 0x hex string for cryptographic integrity validation.
 */
export async function computeContentHash(content: string): Promise<Hex> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hex}`;
}

/**
 * Queries Pinata V3 API to discover the account's dedicated gateway domain.
 */
async function discoverPinataGatewayDomain(pinataJwt?: string): Promise<string | null> {
  if (!pinataJwt) return null;
  try {
    const res = await fetch('https://api.pinata.cloud/v3/gateways', {
      headers: { Authorization: `Bearer ${pinataJwt}` },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const json = await res.json() as any;
      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      if (list.length > 0 && list[0]?.domain) {
        return list[0].domain.trim();
      }
    }
  } catch {
    // Graceful fallback to standard gateway candidate list
  }
  return null;
}

/**
 * Validates published IPFS content across multiple gateways with safe diagnostic logging.
 */
async function verifyContentAcrossGateways(
  cid: string,
  expectedHash: Hex,
  config: IpfsStorageConfig,
  isJson = false
): Promise<{ verified: boolean; gatewayUrl: string; retrievedHash?: Hex }> {
  // Build ordered list of gateway candidates
  const candidates: { url: string; authHeader?: string }[] = [];

  // 1. Explicit user-configured Pinata Gateway
  if (config.pinataGateway) {
    let base = config.pinataGateway.trim().replace(/\/+$/, '');
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }
    candidates.push({
      url: `${base}/ipfs/${cid}`,
      authHeader: config.pinataJwt ? `Bearer ${config.pinataJwt}` : undefined
    });
  }

  // 2. Auto-discovered dedicated Pinata gateway domain
  if (config.pinataJwt && !config.pinataGateway) {
    const autoDomain = await discoverPinataGatewayDomain(config.pinataJwt);
    if (autoDomain) {
      candidates.push({
        url: `https://${autoDomain}/ipfs/${cid}`,
        authHeader: `Bearer ${config.pinataJwt}`
      });
    }
  }

  // 3. Pinata gateway with JWT authorization header
  if (config.pinataJwt) {
    candidates.push({
      url: `https://gateway.pinata.cloud/ipfs/${cid}`,
      authHeader: `Bearer ${config.pinataJwt}`
    });
  }

  // 4. Independent public IPFS gateways
  candidates.push({ url: `https://ipfs.io/ipfs/${cid}` });
  candidates.push({ url: `https://dweb.link/ipfs/${cid}` });
  candidates.push({ url: `https://cloudflare-ipfs.com/ipfs/${cid}` });

  console.log(`\n[IPFS Gateway Verification: ${cid}]`);
  console.log(`  Expected SHA-256: ${expectedHash}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const target of candidates) {
      try {
        const headers: Record<string, string> = {
          Accept: isJson ? 'application/json' : '*/*'
        };
        if (target.authHeader) {
          headers['Authorization'] = target.authHeader;
        }

        const res = await fetch(target.url, {
          headers,
          signal: AbortSignal.timeout(6000)
        });

        console.log(`  -> Gateway: ${target.url} | Status: HTTP ${res.status} ${res.statusText}`);

        if (res.ok) {
          const text = await res.text();
          const retrievedHash = await computeContentHash(text);
          console.log(`  -> Retrieved SHA-256: ${retrievedHash}`);

          if (retrievedHash === expectedHash) {
            console.log(`  ✓ Cryptographic hash match confirmed on ${target.url}`);
            return { verified: true, gatewayUrl: target.url, retrievedHash };
          } else {
            console.warn(`  ⚠️ Hash mismatch on ${target.url}: Expected ${expectedHash}, got ${retrievedHash}`);
          }
        }
      } catch (err: any) {
        console.log(`  -> Gateway: ${target.url} | Error: ${err.message || 'fetch timeout'}`);
      }
    }

    if (attempt < 3) {
      console.log(`  ...Propagation wait before retry (attempt ${attempt + 1}/3)...`);
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }

  return { verified: false, gatewayUrl: candidates[0]?.url || '' };
}

/**
 * Publishes artwork SVG to public IPFS using Pinata V3 Files API and verifies independent retrieval.
 */
export async function publishArtworkToIpfs(
  svgString: string,
  specimenId: string,
  config: IpfsStorageConfig = {}
): Promise<IpfsPublicationResult> {
  const expectedHash = await computeContentHash(svgString);
  const sizeBytes = new TextEncoder().encode(svgString).length;
  const localCid = computeDeterministicIpfsCid(svgString);

  if (config.forceMockFailure) {
    throw new Error('IPFS upload failed: simulated storage provider failure');
  }

  // 1. Real Pinata V3 Files API publication if JWT is configured
  if (config.pinataJwt) {
    const formData = new FormData();
    const fileName = `hamster_${specimenId}.svg`;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    formData.append('file', blob, fileName);
    formData.append('name', fileName);
    formData.append('network', 'public'); // Pinata V3 public IPFS network

    const pinRes = await fetch(PINATA_V3_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.pinataJwt}`
      },
      body: formData
    });

    if (!pinRes.ok) {
      const errText = await pinRes.text();
      throw new Error(`Pinata V3 artwork publication failed: HTTP ${pinRes.status} ${errText}`);
    }

    const pinData = await pinRes.json() as any;
    const cid = extractValidCid(pinData);
    if (!cid) {
      throw new Error(`Pinata V3 did not return a valid IPFS CID. Response: ${JSON.stringify(pinData)}`);
    }

    const codecInfo = identifyCidCodec(cid);
    console.log('\n[Pinata V3 Upload: Artwork]');
    console.log(`  Locally Calculated CID: ${localCid} (${identifyCidCodec(localCid)})`);
    console.log(`  Pinata Returned CID:    ${cid} (${codecInfo})`);
    console.log(`  Original Content SHA-256: ${expectedHash}`);

    // Verify content retrieval using independent gateways
    const { verified, gatewayUrl } = await verifyContentAcrossGateways(cid, expectedHash, config, false);

    if (!verified) {
      throw new Error(`Integrity verification failed for published artwork CID: ${cid}. Retrieved bytes did not match expected SHA-256 hash.`);
    }

    return {
      cid,
      uri: `ipfs://${cid}`,
      hash: expectedHash,
      sizeBytes,
      retrievalVerified: true,
      gatewayUrl,
      codecInfo
    };
  }

  // 2. Missing credentials check: Block mint authorization in production unless explicitly sandbox
  if (!config.allowMockSandbox) {
    throw new Error('NFT Storage Blocker: PINATA_JWT is not configured in Worker environment. Real public IPFS publication is required for minting.');
  }

  // 3. Deterministic Mock / Development Sandbox (explicit test harness only)
  const cid = localCid;
  if (config.mockStorageStore) {
    config.mockStorageStore.set(cid, svgString);
  }

  const retrieved = config.mockStorageStore ? config.mockStorageStore.get(cid) : svgString;
  const retrievedHash = await computeContentHash(retrieved || '');
  if (retrievedHash !== expectedHash) {
    throw new Error('Integrity hash mismatch during storage verification');
  }

  return {
    cid,
    uri: `ipfs://${cid}`,
    hash: expectedHash,
    sizeBytes,
    retrievalVerified: true,
    gatewayUrl: `http://localhost:3000/api/nft/artwork/${cid}.svg`,
    codecInfo: identifyCidCodec(cid)
  };
}

/**
 * Publishes canonical metadata JSON to public IPFS using Pinata V3 Files API and verifies independent retrieval.
 */
export async function publishMetadataToIpfs(
  metadata: any,
  tokenId: number,
  config: IpfsStorageConfig = {}
): Promise<IpfsPublicationResult> {
  const metadataString = JSON.stringify(metadata, null, 2);
  const expectedHash = await computeContentHash(metadataString);
  const sizeBytes = new TextEncoder().encode(metadataString).length;
  const localCid = computeDeterministicIpfsCid(metadataString);

  if (config.forceMockFailure) {
    throw new Error('IPFS upload failed: simulated storage provider failure');
  }

  // 1. Real Pinata V3 Files API publication
  if (config.pinataJwt) {
    const formData = new FormData();
    const fileName = `hamster_metadata_${tokenId}.json`;
    const blob = new Blob([metadataString], { type: 'application/json' });
    formData.append('file', blob, fileName);
    formData.append('name', fileName);
    formData.append('network', 'public');

    const pinRes = await fetch(PINATA_V3_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.pinataJwt}`
      },
      body: formData
    });

    if (!pinRes.ok) {
      const errText = await pinRes.text();
      throw new Error(`Pinata V3 metadata publication failed: HTTP ${pinRes.status} ${errText}`);
    }

    const pinData = await pinRes.json() as any;
    const cid = extractValidCid(pinData);
    if (!cid) {
      throw new Error(`Pinata V3 did not return a valid IPFS CID for metadata. Response: ${JSON.stringify(pinData)}`);
    }

    const codecInfo = identifyCidCodec(cid);
    console.log('\n[Pinata V3 Upload: Metadata]');
    console.log(`  Locally Calculated CID: ${localCid} (${identifyCidCodec(localCid)})`);
    console.log(`  Pinata Returned CID:    ${cid} (${codecInfo})`);
    console.log(`  Original Metadata SHA-256: ${expectedHash}`);

    const { verified, gatewayUrl } = await verifyContentAcrossGateways(cid, expectedHash, config, true);

    if (!verified) {
      throw new Error(`Integrity verification failed for published metadata CID: ${cid}. Retrieved bytes did not match expected SHA-256 hash.`);
    }

    return {
      cid,
      uri: `ipfs://${cid}`,
      hash: expectedHash,
      sizeBytes,
      retrievalVerified: true,
      gatewayUrl,
      codecInfo
    };
  }

  // 2. Missing credentials check
  if (!config.allowMockSandbox) {
    throw new Error('NFT Storage Blocker: PINATA_JWT is not configured in Worker environment. Real public IPFS publication is required for minting.');
  }

  // 3. Deterministic Mock / Development Sandbox
  const cid = localCid;
  if (config.mockStorageStore) {
    config.mockStorageStore.set(cid, metadataString);
  }

  const retrieved = config.mockStorageStore ? config.mockStorageStore.get(cid) : metadataString;
  const retrievedHash = await computeContentHash(retrieved || '');
  if (retrievedHash !== expectedHash) {
    throw new Error('Integrity hash mismatch during metadata verification');
  }

  return {
    cid,
    uri: `ipfs://${cid}`,
    hash: expectedHash,
    sizeBytes,
    retrievalVerified: true,
    gatewayUrl: `http://localhost:3000/api/nft/metadata/${cid}`,
    codecInfo: identifyCidCodec(cid)
  };
}

/**
 * Creates or retrieves a permanent frozen collectible snapshot for a specimen.
 */
export async function freezeCollectibleSnapshot(
  hybrid: QuantumHybrid,
  tokenId: number,
  playerId: string,
  walletAddress: string,
  storageConfig: IpfsStorageConfig = {}
): Promise<{ snapshot: FrozenNftSnapshot; artworkResult: IpfsPublicationResult; metadataResult: IpfsPublicationResult }> {
  // 1. Generate final deterministic SVG artwork
  const artworkSvg = generateDeterministicHybridSvg(hybrid);

  // 2. Publish artwork bytes to IPFS & verify
  const artworkResult = await publishArtworkToIpfs(artworkSvg, hybrid.id, storageConfig);

  // 3. Generate canonical ERC-721 metadata referencing the verified artwork CID
  const canonicalMetadata = buildCanonicalNftMetadata(hybrid, tokenId, artworkResult.cid);

  // 4. Publish metadata JSON to IPFS & verify
  const metadataResult = await publishMetadataToIpfs(canonicalMetadata, tokenId, storageConfig);

  const specimenHash = computeSpecimenHash(hybrid);
  const metadataString = JSON.stringify(canonicalMetadata, null, 2);
  const onchainMetadataHash = keccak256(toHex(metadataString));

  const snapshot: FrozenNftSnapshot = {
    specimenId: hybrid.id,
    tokenId,
    playerId,
    walletAddress,
    name: hybrid.generatedName || hybrid.nickname || `Hamster #${tokenId}`,
    rarity: hybrid.rarity,
    personality: hybrid.personality,
    parent1Species: hybrid.parent1Species,
    parent2Species: hybrid.parent2Species,
    seed: hybrid.seed,
    traitsJson: JSON.stringify(hybrid.traits),
    artworkCid: artworkResult.cid,
    artworkHash: artworkResult.hash,
    metadataCid: metadataResult.cid,
    metadataHash: onchainMetadataHash,
    tokenUri: `ipfs://${metadataResult.cid}`,
    specimenHash,
    storageProvider: storageConfig.pinataJwt ? 'pinata_v3' : 'mock_ipfs',
    verifiedAt: Date.now(),
    frozenAt: Date.now()
  };

  return { snapshot, artworkResult, metadataResult };
}
