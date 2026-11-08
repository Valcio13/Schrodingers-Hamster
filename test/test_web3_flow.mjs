import assert from 'assert';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { verifyMessage, keccak256, toHex, verifyTypedData } from 'viem';
import worker from '../worker/index';
import { generateQuantumHybrid } from '../src/utils/hybridGenerator';
import {
  generateDeterministicHybridSvg,
  computeDeterministicIpfsCid,
  buildCanonicalNftMetadata,
  computeSpecimenHash
} from '../src/utils/nftMetadata';

async function runWeb3FlowTests() {
  console.log('--- RUNNING WEB3 v1 INTEGRATION & API TEST SUITE ---');

  const playerWalletPriv = generatePrivateKey();
  const playerWallet = privateKeyToAccount(playerWalletPriv);
  const attackerWallet = privateKeyToAccount(generatePrivateKey());

  console.log('Player Wallet Address:', playerWallet.address);

  // Helper to make mock requests to worker
  async function callWorker(path, method = 'GET', body = null, headers = {}, mockEnv = { __ALLOW_MOCK_STORAGE: true, ENABLE_NFT_MINTING: true, NFT_BETA_ALLOWED_WALLETS: playerWallet.address }) {
    const reqHeaders = new Headers({
      'Content-Type': 'application/json',
      ...headers
    });
    const reqInit = {
      method,
      headers: reqHeaders
    };
    if (body) {
      reqInit.body = JSON.stringify(body);
    }
    const req = new Request(`http://localhost:3000${path}`, reqInit);
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  // 1. SIWE Nonce Generation
  console.log('\n--- Test 1: SIWE Nonce Generation ---');
  const nonceRes = await callWorker('/api/auth/nonce');
  assert.strictEqual(nonceRes.status, 200);
  assert.ok(nonceRes.data.nonce && nonceRes.data.nonce.length >= 16);
  const nonce = nonceRes.data.nonce;
  console.log('✓ Generated single-use nonce:', nonce);

  // 2. SIWE Message Preparation & Signature Verification
  console.log('\n--- Test 2: SIWE Authentication & Replay Prevention ---');
  const domain = 'localhost:3000';
  const uri = 'http://localhost:3000';
  const issuedAt = new Date().toISOString();
  const chainId = 11155111;

  const validSiweMessage = [
    `${domain} wants you to sign in with your Ethereum account:`,
    playerWallet.address,
    '',
    "Sign in to Schrödinger's Hamster to manage your quantum hybrid specimens and authorize immutable NFT minting.",
    '',
    `URI: ${uri}`,
    `Version: 1`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`
  ].join('\n');

  const signature = await playerWallet.signMessage({ message: validSiweMessage });

  // Guest player ID to test guest-to-wallet migration/linking
  const guestPlayerId = 'guest_researcher_test_99';

  const loginRes = await callWorker('/api/auth/siwe', 'POST', {
    message: validSiweMessage,
    signature,
    address: playerWallet.address,
    nonce
  }, { 'X-Player-ID': guestPlayerId });

  assert.strictEqual(loginRes.status, 200, 'SIWE login must succeed');
  assert.strictEqual(loginRes.data.authenticated, true);
  assert.strictEqual(loginRes.data.address.toLowerCase(), playerWallet.address.toLowerCase());
  assert.strictEqual(loginRes.data.playerId, guestPlayerId, 'Guest progress must be safely linked');
  assert.ok(loginRes.data.sessionToken, 'Must issue authenticated session token');
  const sessionToken = loginRes.data.sessionToken;
  console.log('✓ SIWE authentication succeeded, linked guest ID:', guestPlayerId);

  // Test 2b: Replay Attack (Reusing the consumed nonce must fail)
  const replayRes = await callWorker('/api/auth/siwe', 'POST', {
    message: validSiweMessage,
    signature,
    address: playerWallet.address,
    nonce
  });
  assert.strictEqual(replayRes.status, 400, 'Replayed nonce must be rejected');
  assert.ok(replayRes.data.error.includes('consumed') || replayRes.data.error.includes('replay'));
  console.log('✓ Nonce replay attack properly rejected with 400');

  // Test 2c: Attacker forging signature
  const fakeNonceRes = await callWorker('/api/auth/nonce');
  const fakeNonce = fakeNonceRes.data.nonce;
  const attackerMessage = validSiweMessage.replace(nonce, fakeNonce);
  const attackerSignature = await attackerWallet.signMessage({ message: attackerMessage });
  const spoofRes = await callWorker('/api/auth/siwe', 'POST', {
    message: attackerMessage,
    signature: attackerSignature,
    address: playerWallet.address, // Claiming to be playerWallet!
    nonce: fakeNonce
  });
  assert.strictEqual(spoofRes.status, 401, 'Forged signature must be rejected');
  console.log('✓ Spoofed wallet signature properly rejected with 401');

  // 3. Verify Active Session
  console.log('\n--- Test 3: Session State Verification ---');
  const sessionCheck = await callWorker('/api/auth/session', 'GET', null, {
    Authorization: `Bearer ${sessionToken}`
  });
  assert.strictEqual(sessionCheck.status, 200);
  assert.strictEqual(sessionCheck.data.authenticated, true);
  assert.strictEqual(sessionCheck.data.address.toLowerCase(), playerWallet.address.toLowerCase());
  console.log('✓ Active session verified for wallet:', sessionCheck.data.address);

  // 4. Deterministic Artwork & Metadata Generation
  console.log('\n--- Test 4: Deterministic Artwork SVG & Metadata CIDs ---');
  const sampleHybrid = generateQuantumHybrid(guestPlayerId, 'normal', 'electric', 424242);
  const svg1 = generateDeterministicHybridSvg(sampleHybrid);
  const svg2 = generateDeterministicHybridSvg(sampleHybrid);
  assert.strictEqual(svg1, svg2, 'Artwork SVG must be 100% deterministic');

  const cidArtwork1 = computeDeterministicIpfsCid(svg1);
  const cidArtwork2 = computeDeterministicIpfsCid(svg2);
  assert.strictEqual(cidArtwork1, cidArtwork2, 'Artwork CID must match exactly');
  assert.ok(cidArtwork1.startsWith('bafkrei'), 'Must use IPFS CID format');

  const metadata1 = buildCanonicalNftMetadata(sampleHybrid, 1, cidArtwork1);
  const metadata2 = buildCanonicalNftMetadata(sampleHybrid, 1, cidArtwork1);
  assert.deepStrictEqual(metadata1, metadata2, 'Canonical metadata must be identical');
  assert.ok(metadata1.attributes.length >= 10, 'Must contain complete modular attributes');
  console.log('✓ Verified deterministic SVG (length:', svg1.length, 'bytes)');
  console.log('✓ Verified canonical metadata CID:', computeDeterministicIpfsCid(JSON.stringify(metadata1)));

  // 5. Seed hybrid into player collection and test Mint Authorization
  console.log('\n--- Test 5: EIP-712 Mint Authorization Endpoint ---');
  // First, get player state to initialize player in worker
  const stateRes = await callWorker('/api/state', 'GET', null, {
    Authorization: `Bearer ${sessionToken}`
  });
  // Inject specimen into player's hybrids
  const updateRes = await callWorker('/api/player/reset', 'POST', {
    insight: 100
  }, { Authorization: `Bearer ${sessionToken}` });

  // Add the test hybrid to playerStore directly or via endpoint
  // We can call start-incubation & reveal or push to state
  const player = stateRes.data;
  sampleHybrid.playerId = guestPlayerId;
  sampleHybrid.existenceStatus = 'alive';

  // Make an unauthenticated request to authorize-mint
  const unauthMint = await callWorker('/api/nft/authorize-mint', 'POST', {
    specimenId: sampleHybrid.id
  });
  assert.strictEqual(unauthMint.status, 401, 'Unauthenticated mint authorization must be rejected');
  console.log('✓ Unauthenticated mint authorization properly rejected');

  // Now inject hybrid into player store to test authorization
  const authMintRes = await callWorker('/api/nft/authorize-mint', 'POST', {
    specimenId: sampleHybrid.id
  }, { Authorization: `Bearer ${sessionToken}` });

  // Specimen not yet in player collection -> 404
  assert.strictEqual(authMintRes.status, 404, 'Non-existent specimen rejected with 404');
  console.log('✓ Non-existent specimen rejected with 404');

  // --- Test 5b: Missing PINATA_JWT Blocks Mint Authorization (No Silent Fallback) ---
  console.log('\n--- Test 5b: Missing PINATA_JWT Blocks Mint Authorization (No Silent Fallback) ---');
  const tempHybrid = generateQuantumHybrid(guestPlayerId, 'normal', 'electric', 9999);
  await callWorker('/api/player/reset', 'POST', {
    labLevel: 2,
    hybrids: [tempHybrid]
  }, { Authorization: `Bearer ${sessionToken}` });

  // Initiate mint gate and unlock with qualifying block
  await callWorker('/api/nft/initiate-mint', 'POST', { specimenId: tempHybrid.id }, { Authorization: `Bearer ${sessionToken}` });
  await callWorker('/api/nft/mint-status?specimenId=' + tempHybrid.id, 'GET', null, { Authorization: `Bearer ${sessionToken}` }, {
    __ALLOW_MOCK_STORAGE: true,
    ENABLE_NFT_MINTING: true,
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: 9000,
      settledRound: 2000,
      roundStartMs: Date.now() + 5000,
      confirmedAtMs: Date.now() + 5000,
      roundEndMs: Date.now() + 10000
    }
  });

  const unauthStorageReq = new Request('http://localhost:3000/api/nft/authorize-mint', {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`
    }),
    body: JSON.stringify({ specimenId: tempHybrid.id })
  });
  // Call worker with env having no PINATA_JWT and no ALLOW_MOCK_STORAGE
  const unauthStorageRes = await worker.fetch(unauthStorageReq, {
    ENABLE_NFT_MINTING: true,
    NFT_BETA_ALLOWED_WALLETS: playerWallet.address
  });
  assert.strictEqual(unauthStorageRes.status, 502, 'Missing PINATA_JWT must block minting with 502');
  const unauthStorageData = await unauthStorageRes.json();
  assert.ok(unauthStorageData.error.includes('PINATA_JWT is not configured'), 'Error message must specify missing PINATA_JWT');
  console.log('✓ Verified: Missing credentials strictly block real mint authorization (no silent fallback)');

  // Now seed a real hybrid into the player via incubation
  console.log('\n--- Test 6: End-to-End Incubation -> Authorization Flow ---');
  // Unlock Level 2 & Quantum Genetics with 3 base species, plus inject sampleHybrid
  sampleHybrid.playerId = guestPlayerId;
  sampleHybrid.existenceStatus = 'alive';
  await callWorker('/api/player/reset', 'POST', {
    labLevel: 2,
    insight: 100,
    unlockedResearch: ['quantum_genetics', 'wavefunction_collapse'],
    grantSpecies: ['normal', 'electric', 'ghost'],
    hybrids: [sampleHybrid]
  }, { Authorization: `Bearer ${sessionToken}` });

  // Claim work to get breeding charges and battery
  await callWorker('/api/claim-work', 'POST', { simulateUnits: 5000 }, { Authorization: `Bearer ${sessionToken}` });

  // Initiate Next-Squeek-Block Mint Gate
  const gateInit = await callWorker('/api/nft/initiate-mint', 'POST', {
    specimenId: sampleHybrid.id
  }, { Authorization: `Bearer ${sessionToken}` });
  assert.strictEqual(gateInit.status, 200);
  assert.strictEqual(gateInit.data.status, 'awaiting_block');

  // Attempting to authorize before qualifying block must be locked with 403
  const prematureAuth = await callWorker('/api/nft/authorize-mint', 'POST', {
    specimenId: sampleHybrid.id
  }, { Authorization: `Bearer ${sessionToken}` });
  assert.strictEqual(prematureAuth.status, 403, 'Must be locked with 403 before qualifying block');
  assert.strictEqual(prematureAuth.data.error, 'MINT_GATE_LOCKED');

  // Verify next settled block unlocks gate
  const currentRound = Math.floor((Date.now() / 1000 - 1793022600) / 600) + 1;
  const qualifyingRound = currentRound + 1;
  const qualifyingStartMs = (1793022600 + (qualifyingRound - 1) * 600) * 1000;
  const gateCheck = await callWorker('/api/nft/mint-status?specimenId=' + sampleHybrid.id, 'GET', null, {
    Authorization: `Bearer ${sessionToken}`
  }, {
    __ALLOW_MOCK_STORAGE: true,
    ENABLE_NFT_MINTING: true,
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: gateInit.data.baselineBlockHeight + 1,
      settledRound: qualifyingRound,
      roundStartMs: qualifyingStartMs,
      confirmedAtMs: qualifyingStartMs + 300000,
      roundEndMs: qualifyingStartMs + 600000
    }
  });
  assert.strictEqual(gateCheck.status, 200);
  assert.strictEqual(gateCheck.data.status, 'unlocked');

  // Authorize mint for the created hybrid
  const authorizedMint = await callWorker('/api/nft/authorize-mint', 'POST', {
    specimenId: sampleHybrid.id
  }, { Authorization: `Bearer ${sessionToken}` });

  assert.strictEqual(authorizedMint.status, 200, 'Mint authorization must succeed');
  const authPayload = authorizedMint.data;
  assert.strictEqual(authPayload.recipient.toLowerCase(), playerWallet.address.toLowerCase());
  assert.ok(authPayload.tokenId >= 1);
  assert.ok(authPayload.tokenURI.startsWith('ipfs://'));
  assert.ok(authPayload.signature && authPayload.signature.startsWith('0x'));
  assert.strictEqual(authPayload.chainId, 11155111);
  console.log('✓ Successfully received server-signed EIP-712 authorization:');
  console.log('  Token ID:', authPayload.tokenId);
  console.log('  Recipient:', authPayload.recipient);
  console.log('  Token URI:', authPayload.tokenURI);
  console.log('  Metadata Hash:', authPayload.metadataHash);
  console.log('  Specimen Hash:', authPayload.specimenHash);

  // Test 6b: Duplicate Mint Attempt
  const dupMint = await callWorker('/api/nft/authorize-mint', 'POST', {
    specimenId: sampleHybrid.id
  }, { Authorization: `Bearer ${sessionToken}` });
  // Once confirmed or authorized, duplicate request must be prevented
  // Let's confirm mint:
  const confirmRes = await callWorker('/api/nft/confirm-mint', 'POST', {
    tokenId: authPayload.tokenId,
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  }, { Authorization: `Bearer ${sessionToken}` });
  assert.strictEqual(confirmRes.status, 200);
  assert.strictEqual(confirmRes.data.hybrid.nftTokenId, authPayload.tokenId);
  console.log('✓ Successfully confirmed mint onchain binding');

  // Verify duplicate mint request is now rejected
  const dupMintAfter = await callWorker('/api/nft/authorize-mint', 'POST', {
    specimenId: sampleHybrid.id
  }, { Authorization: `Bearer ${sessionToken}` });
  assert.strictEqual(dupMintAfter.status, 400, 'Duplicate specimen mint authorization must be rejected');
  console.log('✓ Duplicate specimen mint properly rejected with 400');

  // --- Test 7: Local Fallback Metadata & Artwork Endpoints ---
  console.log('\n--- Test 7: Local Fallback Metadata & Artwork Endpoints ---');
  const metadataFallback = await callWorker(`/api/nft/metadata/${authPayload.metadataCid}`);
  assert.strictEqual(metadataFallback.status, 200, 'Metadata fallback mirror must resolve 200');
  assert.strictEqual(metadataFallback.data.image, `ipfs://${authPayload.artworkCid}`);
  console.log('✓ Verified local metadata fallback endpoint resolves canonical JSON');

  const artworkFallback = await callWorker(`/api/nft/artwork/${authPayload.artworkCid}.svg`);
  assert.strictEqual(artworkFallback.status, 200, 'Artwork fallback mirror must resolve 200');
  console.log('✓ Verified local artwork SVG fallback endpoint resolves 200');

  // --- Test 8: Frozen Snapshot Immutability Under Offchain Renaming ---
  console.log('\n--- Test 8: Frozen Snapshot Immutability Under Offchain State Changes ---');
  // Offchain nickname edit
  await callWorker('/api/hamsters/rename', 'POST', {
    hybridId: sampleHybrid.id,
    nickname: 'HackedOffchainName'
  }, { Authorization: `Bearer ${sessionToken}` });

  // Query metadata fallback again - must remain original frozen name!
  const metaAfterRename = await callWorker(`/api/nft/metadata/${authPayload.metadataCid}`);
  assert.strictEqual(metaAfterRename.status, 200);
  assert.strictEqual(metaAfterRename.data.name, sampleHybrid.generatedName, 'NFT metadata name must remain frozen');
  assert.notStrictEqual(metaAfterRename.data.name, 'HackedOffchainName', 'Offchain rename must not leak into frozen metadata');
  console.log('✓ Verified: Offchain name changes do NOT mutate frozen NFT metadata!');

  // --- Test 9: Storage Failure Mint Blocker ---
  console.log('\n--- Test 9: Storage Failure Mint Blocker (Safe Rejection) ---');
  const specimen2 = generateQuantumHybrid('test_player', 'normal', 'robot', 5555);
  specimen2.id = 'specimen_test_fail_blocker';
  await callWorker('/api/player/reset', 'POST', {
    labLevel: 2,
    hybrids: [sampleHybrid, specimen2]
  }, { Authorization: `Bearer ${sessionToken}` });

  // Initiate mint gate and unlock for specimen2
  await callWorker('/api/nft/initiate-mint', 'POST', { specimenId: specimen2.id }, { Authorization: `Bearer ${sessionToken}` });
  await callWorker('/api/nft/mint-status?specimenId=' + specimen2.id, 'GET', null, { Authorization: `Bearer ${sessionToken}` }, {
    __ALLOW_MOCK_STORAGE: true,
    ENABLE_NFT_MINTING: true,
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: 9005,
      settledRound: 2005,
      roundStartMs: Date.now() + 5000,
      confirmedAtMs: Date.now() + 5000,
      roundEndMs: Date.now() + 10000
    }
  });

  // Call with force failure flag
  const failReq = new Request('http://localhost:3000/api/nft/authorize-mint', {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`
    }),
    body: JSON.stringify({ specimenId: specimen2.id })
  });
  // Pass __FORCE_IPFS_FAILURE in mock env
  const failRes = await worker.fetch(failReq, {
    __FORCE_IPFS_FAILURE: true,
    ENABLE_NFT_MINTING: true,
    NFT_BETA_ALLOWED_WALLETS: playerWallet.address
  });
  const failData = await failRes.json();
  assert.strictEqual(failRes.status, 502, 'Failed IPFS publication must return 502');
  assert.ok(failData.error.includes('NFT Storage Blocker'), 'Error message must specify storage blocker');
  console.log('✓ Verified: IPFS publication failure blocks mint authorization with 502!');

  // --- Test 10: Safe Retry After Failure ---
  console.log('\n--- Test 10: Safe Retry After Storage Recovery ---');
  const retryReq = new Request('http://localhost:3000/api/nft/authorize-mint', {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`
    }),
    body: JSON.stringify({ specimenId: specimen2.id })
  });
  const retryRes = await worker.fetch(retryReq, {
    __ALLOW_MOCK_STORAGE: true,
    ENABLE_NFT_MINTING: true,
    NFT_BETA_ALLOWED_WALLETS: playerWallet.address
  });
  assert.strictEqual(retryRes.status, 200, 'Retry must succeed once storage is healthy');
  console.log('✓ Verified: Safe retry succeeds without corrupted or duplicate state!');

  console.log('\n======================================================');
  console.log('ALL 10 WEB3 v1 INTEGRATION & IPFS STORAGE TESTS PASSED 100%!');
  console.log('======================================================\n');
}

runWeb3FlowTests().catch(err => {
  console.error(err);
  process.exit(1);
});
