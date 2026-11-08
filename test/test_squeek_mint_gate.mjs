// test/test_squeek_mint_gate.mjs
// Comprehensive Test Suite for Squeekchain Next-Block Mint Gate & Verification

import assert from 'assert';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import worker from '../worker/index';
import { createLocalD1Database } from '../worker/local-d1';
import { generateQuantumHybrid } from '../src/utils/hybridGenerator';

async function runSqueekMintGateTests() {
  console.log('===============================================================');
  console.log('--- SQUEEKCHAIN NEXT-BLOCK MINT GATE & VERIFICATION TESTS ---');
  console.log('===============================================================\n');

  const localDb = createLocalD1Database();
  const playerWallet = privateKeyToAccount(generatePrivateKey());
  const otherWallet = privateKeyToAccount(generatePrivateKey());
  const playerId = 'player_gate_test_' + Date.now();

  let sessionToken = '';

  async function callWorker(path, method = 'GET', body = null, headers = {}, customEnv = {}) {
    const defaultEnv = {
      DB: localDb,
      __ALLOW_MOCK_STORAGE: true,
      ENABLE_NFT_MINTING: true,
      NFT_BETA_RESTRICTED: true,
      NFT_BETA_ALLOWED_WALLETS: `${playerWallet.address}, ${otherWallet.address}`
    };
    const reqHeaders = new Headers({
      'Content-Type': 'application/json',
      ...headers
    });
    if (sessionToken && !headers['Authorization']) {
      reqHeaders.set('Authorization', `Bearer ${sessionToken}`);
    }
    const req = new Request(`http://localhost:3000${path}`, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined
    });
    const res = await worker.fetch(req, { ...defaultEnv, ...customEnv });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  // --- Auth Setup ---
  console.log('--- Setup: Player Authentication & Hybrid Seeding ---');
  const nonceRes = await callWorker('/api/auth/nonce');
  const nonce = nonceRes.data.nonce;
  const domain = 'localhost';
  const issuedAt = new Date().toISOString();
  const message = [
    `${domain} wants you to sign in with your Ethereum account:`,
    playerWallet.address,
    '',
    "Sign in to Schrödinger's Hamster to manage your quantum hybrid specimens and authorize immutable NFT minting.",
    '',
    `URI: http://${domain}`,
    `Version: 1`,
    `Chain ID: 11155111`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`
  ].join('\n');
  const signature = await playerWallet.signMessage({ message });
  const siweRes = await callWorker('/api/auth/siwe', 'POST', {
    message,
    signature,
    address: playerWallet.address,
    nonce,
    playerId
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(siweRes.status, 200);
  sessionToken = siweRes.data.sessionToken;

  const hybrid1 = generateQuantumHybrid(playerId, 'normal', 'electric', 1234);
  const hybrid2 = generateQuantumHybrid(playerId, 'normal', 'ghost', 5678);
  await callWorker('/api/player/reset', 'POST', {
    labLevel: 2,
    hybrids: [hybrid1, hybrid2]
  });
  console.log('✓ Player authenticated and seeded with hybrid:', hybrid1.id);

  // --- Test 1: No mint without a qualifying new Squeek block ---
  console.log('\n--- Test 1: No Mint Without Qualifying Squeek Block ---');
  // Attempting to authorize mint directly without initiating gate must fail with 403
  const directAuth = await callWorker('/api/nft/authorize-mint', 'POST', { specimenId: hybrid1.id });
  assert.strictEqual(directAuth.status, 403, 'Must reject unauthorized mint before gate is unlocked');
  assert.strictEqual(directAuth.data.error, 'MINT_GATE_LOCKED');
  console.log('✓ Direct mint attempt strictly blocked with 403 MINT_GATE_LOCKED');

  // Initiate mint gate with baseline block = 8430 and current active round
  const genesisTimestamp = 1793022600;
  const currentRound = Math.floor((Date.now() / 1000 - genesisTimestamp) / 600) + 1;
  const baselineHeight = 8430;
  const baselineRound = currentRound;
  const qualifyingRound = currentRound + 1;

  const gateInit = await callWorker('/api/nft/initiate-mint', 'POST', { specimenId: hybrid1.id }, {}, {
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: baselineHeight,
      settledRound: baselineRound,
      roundStartMs: Date.now() - 60000,
      roundEndMs: Date.now() + 60000,
      confirmedAtMs: Date.now() - 10000
    }
  });
  assert.strictEqual(gateInit.status, 200);
  assert.strictEqual(gateInit.data.status, 'awaiting_block');
  assert.strictEqual(gateInit.data.baselineBlockHeight, baselineHeight);
  console.log(`✓ Mint gate locked at baseline block height #${baselineHeight}`);

  // Still awaiting block: authorize-mint must remain locked
  const stillLockedAuth = await callWorker('/api/nft/authorize-mint', 'POST', { specimenId: hybrid1.id });
  assert.strictEqual(stillLockedAuth.status, 403);
  assert.strictEqual(stillLockedAuth.data.error, 'MINT_GATE_LOCKED');
  console.log('✓ Authorize-mint strictly locked while awaiting next Squeek block');

  // --- Test 2: Provisional blocks cannot unlock minting ---
  console.log('\n--- Test 2: Provisional Blocks Cannot Unlock Minting ---');
  // API returns provisional block = 8431, but settled anchor is still 8430
  const provCheck = await callWorker('/api/nft/mint-status?specimenId=' + hybrid1.id, 'GET', null, {}, {
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: baselineHeight, // Still settled at 8430!
      provisionalBlockHeight: baselineHeight + 1, // Provisional is 8431
      settledRound: baselineRound,
      confirmedAtMs: Date.now() - 30000,
      roundEndMs: Date.now() - 30000
    }
  });
  assert.strictEqual(provCheck.status, 200);
  assert.strictEqual(provCheck.data.status, 'awaiting_block');
  console.log('✓ Provisional block rejected: status remains awaiting_block until onchain settlement');

  // --- Test 3: An older block cannot unlock a newer request ---
  console.log('\n--- Test 3: Older Block Cannot Unlock Newer Request ---');
  // API returns block height <= baselineHeight
  const oldCheck = await callWorker('/api/nft/mint-status?specimenId=' + hybrid1.id, 'GET', null, {}, {
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: baselineHeight - 1,
      settledRound: baselineRound - 1,
      confirmedAtMs: Date.now() - 100000,
      roundEndMs: Date.now() - 100000
    }
  });
  assert.strictEqual(oldCheck.status, 200);
  assert.strictEqual(oldCheck.data.status, 'awaiting_block');
  console.log('✓ Older block rejected: cannot unlock mint gate');

  // --- Test 4: Regression: Request submitted midway through a round ---
  console.log('\n--- Test 4: Request Submitted Midway Through a Round ---');
  // Suppose requestTimestamp is 10000. Round was already active (roundStartMs = 5000, roundEndMs = 15000)
  // Even if this active round completes and increments height, its work started BEFORE request, so it MUST NOT qualify.
  const midwayCheck = await callWorker('/api/nft/mint-status?specimenId=' + hybrid1.id, 'GET', null, {}, {
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: baselineHeight + 1,
      settledRound: baselineRound,
      roundStartMs: gateInit.data.requestTimestamp - 60000, // Started before request!
      roundEndMs: gateInit.data.requestTimestamp + 60000,
      confirmedAtMs: Date.now() + 5000
    }
  });
  assert.strictEqual(midwayCheck.status, 200);
  assert.strictEqual(midwayCheck.data.status, 'awaiting_block');
  console.log('✓ Midway request protected: work from an already-active round strictly cannot unlock minting');

  // --- Test 4b: Regression: Delayed settlement of earlier work ---
  console.log('\n--- Test 4b: Delayed Settlement of Earlier Work Rejected ---');
  // Work occurred in an earlier round, but the settlement transaction was delayed onchain
  const delayedSettlementCheck = await callWorker('/api/nft/mint-status?specimenId=' + hybrid1.id, 'GET', null, {}, {
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: baselineHeight + 1,
      settledRound: baselineRound,
      roundStartMs: gateInit.data.requestTimestamp - 120000, // Round ran earlier
      roundEndMs: gateInit.data.requestTimestamp - 10000,    // Round ended earlier
      confirmedAtMs: Date.now() + 5000                       // But settled belatedly onchain now
    }
  });
  assert.strictEqual(delayedSettlementCheck.status, 200);
  assert.strictEqual(delayedSettlementCheck.data.status, 'awaiting_block');
  console.log('✓ Delayed settlement rejected: cannot unlock on past work that merely settled later');

  // --- Test 4c: Regression: Subsequent round with zero blocks completed ---
  console.log('\n--- Test 4c: Subsequent Round with Zero New Blocks Rejected ---');
  // A subsequent round started and settled, but hamster was idle (block height didn't increase)
  const zeroBlocksCheck = await callWorker('/api/nft/mint-status?specimenId=' + hybrid1.id, 'GET', null, {}, {
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: baselineHeight, // Height unchanged!
      settledRound: baselineRound + 1,
      roundStartMs: gateInit.data.requestTimestamp + 1000,
      roundEndMs: gateInit.data.requestTimestamp + 60000,
      confirmedAtMs: Date.now() + 5000
    }
  });
  assert.strictEqual(zeroBlocksCheck.status, 200);
  assert.strictEqual(zeroBlocksCheck.data.status, 'awaiting_block');
  console.log('✓ Idle subsequent round rejected: height must actually increase from post-request work');

  // --- Test 4d: Regression: Multiple blocks completed in one settlement round ---
  console.log('\n--- Test 4d: Multiple Blocks Completed in One Settlement Round ---');
  // In hybrid2's gate, multiple blocks completed in a qualifying subsequent round (e.g. +3 blocks)
  const gateInit2 = await callWorker('/api/nft/initiate-mint', 'POST', { specimenId: hybrid2.id }, {}, {
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: baselineHeight,
      settledRound: baselineRound,
      roundStartMs: Date.now() - 30000,
      roundEndMs: Date.now() + 30000,
      confirmedAtMs: Date.now() - 10000
    }
  });
  assert.strictEqual(gateInit2.status, 200);
  // Subsequent round completes +3 blocks
  const multiBlockCheck = await callWorker('/api/nft/mint-status?specimenId=' + hybrid2.id, 'GET', null, {}, {
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: baselineHeight + 3, // +3 blocks in one batch settlement!
      settledRound: baselineRound + 1,
      roundStartMs: gateInit2.data.requestTimestamp + 5000, // Fully subsequent round!
      roundEndMs: gateInit2.data.requestTimestamp + 65000,
      confirmedAtMs: Date.now() + 5000
    }
  });
  assert.strictEqual(multiBlockCheck.status, 200);
  assert.strictEqual(multiBlockCheck.data.status, 'unlocked');
  assert.strictEqual(multiBlockCheck.data.qualifyingBlockHeight, baselineHeight + 3);
  console.log('✓ Multiple blocks in one settlement successfully unlock gate for #hybrid2 (+3 blocks)');

  // --- Test 5: API outages do not create false unlocks (Fail-Closed) ---
  console.log('\n--- Test 5: API Outages Fail Closed Without False Unlocks ---');
  const outageCheck = await callWorker('/api/nft/mint-status?specimenId=' + hybrid1.id, 'GET', null, {}, {
    __MOCK_SQUEEK_BLOCK: {
      status: 'error_500_down'
    }
  });
  assert.strictEqual(outageCheck.status, 200);
  assert.strictEqual(outageCheck.data.status, 'awaiting_block');
  assert.ok(outageCheck.data.apiError);
  console.log('✓ API outage safely caught: gate remains locked and reports error notice');

  // --- Test 6: Genuine Fully Subsequent Measurement Round Unlocks Permanently ---
  console.log('\n--- Test 6: Genuine Fully Subsequent Squeek Block Permanently Unlocks ---');
  const qualifyingHeight = baselineHeight + 1;
  const validUnlockCheck = await callWorker('/api/nft/mint-status?specimenId=' + hybrid1.id, 'GET', null, {}, {
    __MOCK_SQUEEK_BLOCK: {
      settledBlockHeight: qualifyingHeight,
      settledRound: qualifyingRound,
      roundStartMs: gateInit.data.requestTimestamp + 5000, // Round started STRICTLY AFTER request!
      roundEndMs: gateInit.data.requestTimestamp + 65000,
      confirmedAtMs: Date.now() + 10000
    }
  });
  assert.strictEqual(validUnlockCheck.status, 200);
  assert.strictEqual(validUnlockCheck.data.status, 'unlocked');
  assert.strictEqual(validUnlockCheck.data.qualifyingBlockHeight, qualifyingHeight);
  console.log(`✓ Gate permanently unlocked by post-request Squeek block #${qualifyingHeight}!`);

  // --- Test 7: Player disconnects & reconnects (Persistence across sessions) ---
  console.log('\n--- Test 7: Player Disconnect & Reconnect Persistence ---');
  // Re-checking without any mock block params loads persistent state from D1
  const reconnectCheck = await callWorker('/api/nft/mint-status?specimenId=' + hybrid1.id);
  assert.strictEqual(reconnectCheck.status, 200);
  assert.strictEqual(reconnectCheck.data.status, 'unlocked');
  assert.strictEqual(reconnectCheck.data.qualifyingBlockHeight, qualifyingHeight);
  console.log('✓ Eligibility persisted in D1: remains unlocked after disconnect/reconnect');

  // --- Test 8: Mint Authorization & Expired Regeneration ---
  console.log('\n--- Test 8: Mint Authorization & Re-Issuance ---');
  const authRes1 = await callWorker('/api/nft/authorize-mint', 'POST', { specimenId: hybrid1.id });
  assert.strictEqual(authRes1.status, 200);
  assert.ok(authRes1.data.signature.startsWith('0x'));
  assert.strictEqual(authRes1.data.recipient.toLowerCase(), playerWallet.address.toLowerCase());
  console.log('✓ EIP-712 mint authorization successfully signed by authorizer');

  // Re-issuing authorization for same unlocked specimen (e.g. if deadline expired)
  const authRes2 = await callWorker('/api/nft/authorize-mint', 'POST', { specimenId: hybrid1.id });
  assert.strictEqual(authRes2.status, 200);
  assert.strictEqual(authRes2.data.tokenId, authRes1.data.tokenId);
  console.log('✓ Re-issuance permitted without needing to re-wait for a new block');

  // --- Test 9: Wrong Wallet Rejected ---
  console.log('\n--- Test 9: Unauthorized Wallet Blocked ---');
  // Create another SIWE session for otherWallet
  const nonce2Res = await callWorker('/api/auth/nonce');
  const msg2 = [
    `${domain} wants you to sign in with your Ethereum account:`,
    otherWallet.address,
    '',
    "Sign in to Schrödinger's Hamster to manage your quantum hybrid specimens and authorize immutable NFT minting.",
    '',
    `URI: http://${domain}`,
    `Version: 1`,
    `Chain ID: 11155111`,
    `Nonce: ${nonce2Res.data.nonce}`,
    `Issued At: ${issuedAt}`
  ].join('\n');
  const sig2 = await otherWallet.signMessage({ message: msg2 });
  const otherSiwe = await callWorker('/api/auth/siwe', 'POST', {
    message: msg2,
    signature: sig2,
    address: otherWallet.address,
    nonce: nonce2Res.data.nonce,
    playerId: 'attacker_player_id'
  });
  const wrongWalletAuth = await callWorker('/api/nft/authorize-mint', 'POST', {
    specimenId: hybrid1.id
  }, { Authorization: `Bearer ${otherSiwe.data.sessionToken}` });
  assert.strictEqual(wrongWalletAuth.status, 404, 'Other player cannot access first player specimen');
  console.log('✓ Cross-wallet access strictly rejected');

  // --- Test 10: Confirmation & Duplicate Mint Prevention ---
  console.log('\n--- Test 10: Mint Confirmation & Duplicate Mint Prevention ---');
  const confirmRes = await callWorker('/api/nft/confirm-mint', 'POST', {
    tokenId: authRes1.data.tokenId,
    txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  });
  assert.strictEqual(confirmRes.status, 200);
  assert.strictEqual(confirmRes.data.hybrid.nftTokenId, authRes1.data.tokenId);

  // Mint status should now be 'minted'
  const mintedStatus = await callWorker('/api/nft/mint-status?specimenId=' + hybrid1.id);
  assert.strictEqual(mintedStatus.data.status, 'minted');

  // Attempt to mint again must be rejected
  const dupAuth = await callWorker('/api/nft/authorize-mint', 'POST', { specimenId: hybrid1.id });
  assert.strictEqual(dupAuth.status, 400);
  console.log('✓ Duplicate mint attempt rejected with 400 Specimen has already been minted');

  // --- Test 11: Ownership Sync & Transfer Enforcement ---
  console.log('\n--- Test 11: Ownership Synchronization Endpoint ---');
  const syncRes = await callWorker('/api/nft/sync-owner', 'POST', {
    specimenId: hybrid1.id,
    tokenId: authRes1.data.tokenId
  });
  assert.strictEqual(syncRes.status, 200);
  assert.strictEqual(syncRes.data.isCurrentOwner, true);
  console.log('✓ Ownership successfully verified for player wallet');

  // --- Test 12: Normal Gameplay Remains Functional ---
  console.log('\n--- Test 12: Existing Gameplay Preservation ---');
  const expRes = await callWorker('/api/experiment/start', 'POST', {
    type: 'basic',
    approach: 'stable'
  });
  assert.strictEqual(expRes.status, 200);
  assert.ok(expRes.data.activeExperiment);
  console.log('✓ Standard laboratory gameplay remains 100% active and unblocked');

  // --- Test 13: Stage 1 Restricted Sepolia Beta Wallet Allowlist ---
  console.log('\n--- Test 13: Stage 1 Restricted Sepolia Beta Allowlist Gate ---');
  const unauthAccount = privateKeyToAccount('0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6');
  const unauthNonceRes = await callWorker('/api/auth/nonce');
  const unauthNonce = unauthNonceRes.data.nonce;
  const unauthMsg = `localhost wants you to sign in with your Ethereum account:\n${unauthAccount.address}\n\nSign in to Schrödinger's Hamster\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 11155111\nNonce: ${unauthNonce}\nIssued At: ${new Date().toISOString()}`;
  const unauthSig = await unauthAccount.signMessage({ message: unauthMsg });
  const unauthAuth = await callWorker('/api/auth/siwe', 'POST', {
    message: unauthMsg,
    signature: unauthSig,
    address: unauthAccount.address,
    nonce: unauthNonce,
    playerId: 'unauth_test_player'
  });
  assert.strictEqual(unauthAuth.status, 200, 'SIWE auth must succeed for test account');
  const unauthSessionToken = unauthAuth.data.sessionToken;

  // Non-allowlisted wallet attempts to initiate mint -> rejected with 403
  const blockedInit = await callWorker('/api/nft/initiate-mint', 'POST', {
    specimenId: 'hybrid_any'
  }, { Authorization: `Bearer ${unauthSessionToken}` });
  assert.strictEqual(blockedInit.status, 403);
  assert.strictEqual(blockedInit.data.error, 'RESTRICTED_BETA_WALLET_NOT_ALLOWLISTED');
  console.log('✓ Non-allowlisted wallet mint request strictly blocked with 403 RESTRICTED_BETA_WALLET_NOT_ALLOWLISTED');

  // Non-allowlisted wallet attempts to authorize mint -> rejected with 403
  const blockedAuth = await callWorker('/api/nft/authorize-mint', 'POST', {
    specimenId: 'hybrid_any'
  }, { Authorization: `Bearer ${unauthSessionToken}` });
  assert.strictEqual(blockedAuth.status, 403);
  assert.strictEqual(blockedAuth.data.error, 'RESTRICTED_BETA_WALLET_NOT_ALLOWLISTED');
  console.log('✓ Non-allowlisted wallet mint authorization strictly blocked with 403 RESTRICTED_BETA_WALLET_NOT_ALLOWLISTED');

  // Non-allowlisted wallet can still play game normally (guest or wallet)
  const unauthPlay = await callWorker('/api/state', 'GET', null, { Authorization: `Bearer ${unauthSessionToken}` });
  assert.strictEqual(unauthPlay.status, 200);
  assert.ok(unauthPlay.data.id);
  console.log('✓ Non-allowlisted wallet can still access laboratory gameplay and progress normally');

  // When Stage 2 (Public Beta) is enabled, non-allowlisted wallet is permitted
  const stage2Init = await callWorker('/api/nft/initiate-mint', 'POST', {
    specimenId: 'non_existent_specimen'
  }, { Authorization: `Bearer ${unauthSessionToken}` }, { NFT_BETA_RESTRICTED: false });
  // Should bypass beta check and reach specimen validation (404)
  assert.strictEqual(stage2Init.status, 404);
  console.log('✓ Stage 2 Public Beta allows any wallet when NFT_BETA_RESTRICTED=false');

  console.log('\n===============================================================');
  console.log('ALL 13 SQUEEKCHAIN NEXT-BLOCK & RESTRICTED BETA TESTS PASSED 100%!');
  console.log('===============================================================\n');
}

runSqueekMintGateTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
