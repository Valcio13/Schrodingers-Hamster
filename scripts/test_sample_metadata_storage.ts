import assert from 'assert';
import { generateQuantumHybrid } from '../src/utils/hybridGenerator';
import {
  generateDeterministicHybridSvg,
  buildCanonicalNftMetadata,
  computeDeterministicIpfsCid
} from '../src/utils/nftMetadata';
import {
  publishArtworkToIpfs,
  publishMetadataToIpfs,
  computeContentHash,
  freezeCollectibleSnapshot,
  IpfsStorageConfig
} from '../worker/ipfsStorage';

async function runMetadataAvailabilityTest() {
  console.log('===========================================================');
  console.log('  SCHRÖDINGER\'S HAMSTER — IPFS METADATA AVAILABILITY TEST  ');
  console.log('===========================================================');

  const pinataJwt = process.env.PINATA_JWT;

  if (!pinataJwt) {
    console.log('\n[Verification Phase: Missing Credential Enforcement]');
    console.log('⚠️ PINATA_JWT is not present in the current terminal environment.');
    console.log('Checking that missing credentials strictly block real mint authorization...');

    let blocked = false;
    try {
      const dummyHybrid = generateQuantumHybrid('test', 'normal', 'electric', 1234);
      await publishArtworkToIpfs('<svg></svg>', 'test_id', { allowMockSandbox: false });
    } catch (err: any) {
      if (err.message.includes('PINATA_JWT is not configured')) {
        blocked = true;
      }
    }
    assert.strictEqual(blocked, true, 'Real minting must be strictly blocked when PINATA_JWT is missing');
    console.log('✓ VERIFIED: Real mint authorization is strictly blocked (no silent fallback).');

    console.log('\n[Sandbox Verification]');
    console.log('Running storage verification with content-addressed test harness...');
  } else {
    console.log('\n✓ Found PINATA_JWT in environment: running LIVE Pinata V3 upload to public IPFS network!');
  }

  const mockStore = new Map<string, string>();
  const config: IpfsStorageConfig = {
    pinataJwt,
    pinataGateway: process.env.PINATA_GATEWAY,
    mockStorageStore: mockStore,
    allowMockSandbox: !pinataJwt
  };

  // 1. Synthesize development-only sample hybrid
  console.log('\n[Phase 1] Preparing Sample Procedural Specimen...');
  const sampleHybrid = generateQuantumHybrid('dev_tester', 'electric', 'ghost', 88888);
  sampleHybrid.id = 'sample_specimen_dev_test_01';
  sampleHybrid.generatedName = 'Voltphantom';
  console.log(`✓ Sample Specimen Created: ${sampleHybrid.generatedName} (${sampleHybrid.rarity.toUpperCase()})`);

  // 2. Generate and Publish Artwork
  console.log('\n[Phase 2] Publishing Sample Artwork SVG to IPFS...');
  const svg = generateDeterministicHybridSvg(sampleHybrid);
  const expectedArtworkHash = await computeContentHash(svg);
  const artworkResult = await publishArtworkToIpfs(svg, sampleHybrid.id, config);
  console.log(`✓ Artwork Published!`);
  console.log(`  CID: ${artworkResult.cid}`);
  console.log(`  URI: ${artworkResult.uri}`);
  console.log(`  Hash: ${artworkResult.hash}`);
  console.log(`  Size: ${artworkResult.sizeBytes} bytes`);

  assert.strictEqual(artworkResult.hash, expectedArtworkHash, 'Artwork content hash must match');

  // 3. Generate and Publish Metadata
  console.log('\n[Phase 3] Publishing Sample Canonical Metadata JSON to IPFS...');
  const metadata = buildCanonicalNftMetadata(sampleHybrid, 1, artworkResult.cid);
  const metadataString = JSON.stringify(metadata, null, 2);
  const expectedMetadataHash = await computeContentHash(metadataString);
  const metadataResult = await publishMetadataToIpfs(metadata, 1, config);
  console.log(`✓ Metadata Published!`);
  console.log(`  CID: ${metadataResult.cid}`);
  console.log(`  URI: ${metadataResult.uri}`);
  console.log(`  Hash: ${metadataResult.hash}`);
  console.log(`  Size: ${metadataResult.sizeBytes} bytes`);

  assert.strictEqual(metadataResult.hash, expectedMetadataHash, 'Metadata content hash must match');

  // 4. Validate Metadata Image Reference
  console.log('\n[Phase 4] Verifying Metadata Image Reference...');
  assert.strictEqual(metadata.image, `ipfs://${artworkResult.cid}`, 'Metadata image reference must point to published artwork CID');
  console.log(`✓ Verified metadata.image -> ${metadata.image}`);

  // 5. Independent Retrieval & Hash Verification
  console.log('\n[Phase 5] Independently Retrieving Content & Verifying Cryptographic Integrity...');
  let retrievedArtwork: string;
  let retrievedMetadataString: string;

  if (pinataJwt) {
    const artHeaders: Record<string, string> = artworkResult.gatewayUrl.includes('pinata.cloud') ? { Authorization: `Bearer ${pinataJwt}` } : {};
    const artRes = await fetch(artworkResult.gatewayUrl, { headers: artHeaders });
    assert.strictEqual(artRes.status, 200, `Gateway must return 200 for artwork (${artworkResult.gatewayUrl})`);
    retrievedArtwork = await artRes.text();

    const metaHeaders: Record<string, string> = metadataResult.gatewayUrl.includes('pinata.cloud') ? { Authorization: `Bearer ${pinataJwt}` } : {};
    const metaRes = await fetch(metadataResult.gatewayUrl, { headers: metaHeaders });
    assert.strictEqual(metaRes.status, 200, `Gateway must return 200 for metadata (${metadataResult.gatewayUrl})`);
    retrievedMetadataString = await metaRes.text();
  } else {
    retrievedArtwork = mockStore.get(artworkResult.cid) || '';
    retrievedMetadataString = mockStore.get(metadataResult.cid) || '';
  }

  const retrievedArtworkHash = await computeContentHash(retrievedArtwork);
  const retrievedMetadataHash = await computeContentHash(retrievedMetadataString);

  assert.strictEqual(retrievedArtworkHash, expectedArtworkHash, 'Retrieved artwork bytes must match expected hash');
  assert.strictEqual(retrievedMetadataHash, expectedMetadataHash, 'Retrieved metadata bytes must match expected hash');
  console.log('✓ Cryptographic byte-by-byte integrity verified for both files!');

  // 6. Test Frozen Snapshot & Immutability Under Mutation
  console.log('\n[Phase 6] Testing Frozen Snapshot & Immutability Under Mutation...');
  const { snapshot } = await freezeCollectibleSnapshot(sampleHybrid, 1, 'dev_tester', '0x1234567890123456789012345678901234567890', config);
  assert.strictEqual(snapshot.artworkCid, artworkResult.cid);
  assert.strictEqual(snapshot.metadataCid, metadataResult.cid);

  const originalRarity = sampleHybrid.rarity;
  sampleHybrid.generatedName = 'MutatedNameHacked';
  sampleHybrid.rarity = 'mythic';
  sampleHybrid.traits.eyeMutation = 'cyclops';

  assert.strictEqual(snapshot.name, 'Voltphantom', 'Snapshot name must remain frozen');
  assert.strictEqual(snapshot.rarity, originalRarity, 'Snapshot rarity must remain frozen');
  console.log('✓ Verified: Offchain mutations do NOT alter the frozen collectible snapshot!');

  // 7. Test Failure Recovery & Mint Blocker
  console.log('\n[Phase 7] Testing Storage Failure Handling (Mint Blocker)...');
  const failureConfig: IpfsStorageConfig = { forceMockFailure: true, allowMockSandbox: true };
  let caughtError: Error | null = null;
  try {
    await freezeCollectibleSnapshot(sampleHybrid, 2, 'dev_tester', '0x1234567890123456789012345678901234567890', failureConfig);
  } catch (err: any) {
    caughtError = err;
  }
  assert.ok(caughtError !== null, 'Storage failure must throw error');
  assert.ok(caughtError.message.includes('IPFS upload failed'), 'Error message must reflect storage blocker');
  console.log('✓ Verified: Storage failure halts mint preparation and blocks unverified minting!');

  console.log('\n===========================================================');
  console.log('  >>> ALL METADATA AVAILABILITY & STORAGE CHECKS PASSED <<<  ');
  console.log('===========================================================');
}

runMetadataAvailabilityTest().catch(err => {
  console.error('Storage test failed:', err);
  process.exit(1);
});
