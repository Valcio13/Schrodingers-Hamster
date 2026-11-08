import assert from 'assert';
import worker from '../worker/index.ts';
import { createLocalD1Database } from '../worker/local-d1.ts';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

async function runSavePersistenceTestSuite() {
  console.log('========================================================');
  console.log('--- CRITICAL SAVE PERSISTENCE & D1 INTEGRATION TESTS ---');
  console.log('========================================================\n');

  const localDb = createLocalD1Database();
  const env = { DB: localDb, __ALLOW_MOCK_STORAGE: true };

  async function callWorker(path, method = 'GET', body = null, headers = {}, customEnv = env) {
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
    const res = await worker.fetch(req, customEnv);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  const testPlayerId = `hamster_persist_test_${Date.now()}`;

  // -------------------------------------------------------------------------
  // Test 1: Initial Account Creation in D1
  // -------------------------------------------------------------------------
  console.log('--- Test 1: Initial Account Creation in D1 ---');
  const initRes = await callWorker('/api/state', 'GET', null, { 'X-Player-ID': testPlayerId });
  assert.strictEqual(initRes.status, 200);
  assert.strictEqual(initRes.data.id, testPlayerId);
  assert.strictEqual(initRes.data.labLevel, 1);
  console.log('✓ Account initialized in D1 with ID:', testPlayerId);

  // -------------------------------------------------------------------------
  // Test 2: Progress Mutation (Energy, Research, Hamsters)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Gameplay Actions Mutate & Persist State ---');
  // Claim work to earn energy
  const claimRes = await callWorker('/api/claim-work', 'POST', { simulateUnits: 5000 }, { 'X-Player-ID': testPlayerId });
  assert.strictEqual(claimRes.status, 200);
  assert.ok(claimRes.data.player.batteryEnergy > 0);

  // Set research notes for testing upgrades
  // Conduct basic experiment
  const expStart = await callWorker('/api/experiment/start', 'POST', { type: 'basic', approach: 'stable' }, { 'X-Player-ID': testPlayerId });
  assert.strictEqual(expStart.status, 200);
  console.log('✓ Experiment started. Waiting 5.2s for wavefunction to stabilize...');
  await new Promise(r => setTimeout(r, 5200));

  // Reveal experiment outcome
  const expReveal = await callWorker('/api/experiment/reveal', 'POST', { chosenState: 'A' }, { 'X-Player-ID': testPlayerId });
  assert.strictEqual(expReveal.status, 200);
  const totalHamsters = expReveal.data.player.hamsters.length;
  const initialInsight = expReveal.data.player.researchInsight;
  console.log(`✓ Experiment complete. Hamsters: ${totalHamsters}, Research Notes: ${initialInsight}`);

  // -------------------------------------------------------------------------
  // Test 3: In-Memory Wipe Simulation (Restart Worker Isolate)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Volatile Memory Wipe / Server Restart Simulation ---');
  // Re-instantiate a fresh LocalD1Database instance simulating a separate process/isolate
  const freshDb = createLocalD1Database();
  const freshEnv = { DB: freshDb, __ALLOW_MOCK_STORAGE: true };

  // Query D1 directly from SQLite to prove data was physically saved to disk
  const sqliteRow = await freshDb.prepare('SELECT state_json, battery_energy FROM players WHERE id = ?').bind(testPlayerId).first();
  assert.ok(sqliteRow, 'Player row must exist in D1 SQLite database');
  assert.ok(sqliteRow.state_json, 'Canonical state_json must be populated in SQLite');

  // Request state from worker with the fresh DB instance
  const reloadedState = await callWorker('/api/state', 'GET', null, { 'X-Player-ID': testPlayerId }, freshEnv);
  assert.strictEqual(reloadedState.status, 200);
  assert.strictEqual(reloadedState.data.id, testPlayerId);
  assert.strictEqual(reloadedState.data.hamsters.length, totalHamsters, 'Hamster collection must survive memory wipe');
  assert.strictEqual(reloadedState.data.researchInsight, initialInsight, 'Research Notes must survive memory wipe');
  console.log('✓ Player progression perfectly restored from D1 after memory wipe!');

  // -------------------------------------------------------------------------
  // Test 4: Multiple Players Remain Isolated
  // -------------------------------------------------------------------------
  console.log('\n--- Test 4: Multiple Player Isolation ---');
  const player2Id = `hamster_persist_other_${Date.now()}`;
  const p2Init = await callWorker('/api/state', 'GET', null, { 'X-Player-ID': player2Id });
  assert.strictEqual(p2Init.status, 200);
  assert.strictEqual(p2Init.data.id, player2Id);
  assert.strictEqual(p2Init.data.hamsters.length, 1, 'New player starts with 1 starter hamster');

  // Verify Player 1 still has their collection
  const p1Check = await callWorker('/api/state', 'GET', null, { 'X-Player-ID': testPlayerId });
  assert.strictEqual(p1Check.data.hamsters.length, totalHamsters);
  assert.strictEqual(p1Check.data.researchInsight, initialInsight);
  assert.ok(totalHamsters >= 1, 'Player 1 has at least starter hamster');
  console.log('✓ Player 1 and Player 2 are completely isolated in D1');

  // -------------------------------------------------------------------------
  // Test 5: Fail-Closed Error Handling on Database Failure
  // -------------------------------------------------------------------------
  console.log('\n--- Test 5: Fail-Closed Behavior on Database Failure ---');
  const failingDb = {
    prepare() {
      return {
        bind() {
          return {
            first() {
              return Promise.reject(new Error('Connection timeout to D1 cluster'));
            }
          };
        }
      };
    }
  };
  const failRes = await callWorker('/api/state', 'GET', null, { 'X-Player-ID': testPlayerId }, { DB: failingDb });
  assert.strictEqual(failRes.status, 503, 'Database failure must return HTTP 503');
  assert.strictEqual(failRes.data.error, 'SAVE_LOAD_FAILURE');
  console.log('✓ Database failure safely blocked with HTTP 503 SAVE_LOAD_FAILURE (No silent reset)');

  // -------------------------------------------------------------------------
  // Test 6: SIWE Wallet Login Preserves Guest Progression
  // -------------------------------------------------------------------------
  console.log('\n--- Test 6: SIWE Wallet Login Preserves Guest Progression ---');
  const walletPriv = generatePrivateKey();
  const walletAccount = privateKeyToAccount(walletPriv);
  const nonceRes = await callWorker('/api/auth/nonce');
  const nonce = nonceRes.data.nonce;

  const siweMsg = [
    `localhost:3000 wants you to sign in with your Ethereum account:`,
    walletAccount.address,
    '',
    "Sign in to Schrödinger's Hamster to manage your quantum hybrid specimens and authorize immutable NFT minting.",
    '',
    `URI: http://localhost:3000`,
    `Version: 1`,
    `Chain ID: 11155111`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`
  ].join('\n');

  const sig = await walletAccount.signMessage({ message: siweMsg });

  // Login sending guest ID header
  const siweLogin = await callWorker('/api/auth/siwe', 'POST', {
    message: siweMsg,
    signature: sig,
    address: walletAccount.address,
    nonce,
    playerId: testPlayerId
  }, { 'X-Player-ID': testPlayerId });

  assert.strictEqual(siweLogin.status, 200);
  assert.strictEqual(siweLogin.data.playerId, testPlayerId, 'Wallet must link to existing guest player ID');
  const sessionToken = siweLogin.data.sessionToken;

  // Verify fetching state with Bearer session token returns the guest's progress
  const walletState = await callWorker('/api/state', 'GET', null, {
    Authorization: `Bearer ${sessionToken}`
  });
  assert.strictEqual(walletState.status, 200);
  assert.strictEqual(walletState.data.id, testPlayerId);
  assert.strictEqual(walletState.data.hamsters.length, totalHamsters, 'Guest hamsters preserved after wallet login');
  console.log('✓ SIWE login successfully preserved guest progression!');

  // -------------------------------------------------------------------------
  // Test 7: Account Takeover Prevention
  // -------------------------------------------------------------------------
  console.log('\n--- Test 7: Prevent Account Takeover by Another Wallet ---');
  const attackerPriv = generatePrivateKey();
  const attackerAccount = privateKeyToAccount(attackerPriv);
  const attackerNonceRes = await callWorker('/api/auth/nonce');
  const attackerNonce = attackerNonceRes.data.nonce;

  const attackerSiweMsg = [
    `localhost:3000 wants you to sign in with your Ethereum account:`,
    attackerAccount.address,
    '',
    "Sign in to Schrödinger's Hamster to manage your quantum hybrid specimens and authorize immutable NFT minting.",
    '',
    `URI: http://localhost:3000`,
    `Version: 1`,
    `Chain ID: 11155111`,
    `Nonce: ${attackerNonce}`,
    `Issued At: ${new Date().toISOString()}`
  ].join('\n');

  const attackerSig = await attackerAccount.signMessage({ message: attackerSiweMsg });

  // Attacker tries to supply victim's testPlayerId
  const attackerLogin = await callWorker('/api/auth/siwe', 'POST', {
    message: attackerSiweMsg,
    signature: attackerSig,
    address: attackerAccount.address,
    nonce: attackerNonce,
    playerId: testPlayerId
  }, { 'X-Player-ID': testPlayerId });

  assert.strictEqual(attackerLogin.status, 200);
  assert.notStrictEqual(attackerLogin.data.playerId, testPlayerId, 'Attacker CANNOT claim already-linked player ID');
  assert.ok(attackerLogin.data.playerId.startsWith('player_'), 'Attacker receives their own separate account');
  console.log('✓ Account takeover rejected: attacker allocated separate account:', attackerLogin.data.playerId);

  // -------------------------------------------------------------------------
  // Test 8: Quantum Genetics & Breeding Charges Persistence
  // -------------------------------------------------------------------------
  console.log('\n--- Test 8: Quantum Genetics & Breeding Charges Persistence ---');
  // Give test player 3 breeding charges via dev sync
  const breedingSet = await callWorker('/api/claim-work', 'POST', {
    setBreedingCharges: 3,
    setBreedingChargeProgress: 1200
  }, { 'X-Player-ID': testPlayerId });
  assert.strictEqual(breedingSet.status, 200);
  assert.strictEqual(breedingSet.data.player.breedingCharges, 3);
  assert.strictEqual(breedingSet.data.player.breedingChargeProgress, 1200);

  // Reload from fresh DB instance to verify breeding charges persisted
  const chargesReload = await callWorker('/api/state', 'GET', null, { 'X-Player-ID': testPlayerId }, freshEnv);
  assert.strictEqual(chargesReload.data.breedingCharges, 3, 'Breeding charges must persist in D1');
  assert.strictEqual(chargesReload.data.breedingChargeProgress, 1200, 'Breeding charge progress must persist in D1');
  console.log('✓ Breeding charges and genetics progress verified persistent in D1');

  // -------------------------------------------------------------------------
  // Test 9: Quantum Fate Records Persistence
  // -------------------------------------------------------------------------
  console.log('\n--- Test 9: Quantum Fate & Incident Persistence ---');
  // Trigger deterministic test incident
  const fateTest = await callWorker('/api/fate/trigger-test', 'POST', {
    type: 'vanished'
  }, { 'X-Player-ID': testPlayerId });
  assert.strictEqual(fateTest.status, 200);

  const fateReload = await callWorker('/api/state', 'GET', null, { 'X-Player-ID': testPlayerId }, freshEnv);
  assert.ok(fateReload.data.lastFateRollAt > 0, 'Quantum Fate roll timestamp must persist in D1');
  console.log('✓ Quantum Fate state verified persistent in D1');

  console.log('\n========================================================');
  console.log('ALL 9 CRITICAL SAVE PERSISTENCE & D1 TESTS PASSED 100%!');
  console.log('========================================================\n');
}

runSavePersistenceTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
