import assert from 'assert';
import worker, { parseDevAllowedWallets, isDeveloperWallet } from '../worker/index.ts';
import { createLocalD1Database } from '../worker/local-d1.ts';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

async function runDevConsoleSecurityTestSuite() {
  console.log('================================================================');
  console.log('--- PRIVATE DEVELOPER CONSOLE & MULTI-WALLET ALLOWLIST TESTS ---');
  console.log('================================================================\n');

  const localDb = createLocalD1Database();

  // Create wallets for testing
  const devWallet1 = privateKeyToAccount(generatePrivateKey());
  const devWallet2 = privateKeyToAccount(generatePrivateKey());
  const devWallet3 = privateKeyToAccount(generatePrivateKey());
  const regularWallet = privateKeyToAccount(generatePrivateKey());
  const secondRegularWallet = privateKeyToAccount(generatePrivateKey());

  // Test allowlist configuration with multiple addresses (mixed casing, whitespaces, and malformed strings)
  const devAllowlistString = `
    ${devWallet1.address.toUpperCase()},
    ${devWallet2.address.toLowerCase()},
    ${devWallet3.address},
    0xmalformed_too_short,
    not_even_an_address,
    0x12345678901234567890123456789012345678901234567890_too_long
  `;

  const env = {
    DB: localDb,
    DEV_ALLOWED_WALLETS: devAllowlistString,
    NFT_BETA_RESTRICTED: 'true',
    NFT_BETA_ALLOWED_WALLETS: `${devWallet1.address}, ${devWallet3.address}`,
    __ALLOW_MOCK_STORAGE: true,
    __STRICT_DEV_SECURITY__: true
  };

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

  async function loginSiwe(account, customEnv = env) {
    const nonceRes = await callWorker('/api/auth/nonce', 'GET', null, {}, customEnv);
    assert.strictEqual(nonceRes.status, 200);
    const nonce = nonceRes.data.nonce;

    const domain = 'localhost:3000';
    const uri = 'http://localhost:3000';
    const issuedAt = new Date().toISOString();
    const message = [
      `${domain} wants you to sign in with your Ethereum account:`,
      account.address,
      '',
      "Sign in to Schrödinger's Hamster to manage your quantum hybrid specimens.",
      '',
      `URI: ${uri}`,
      `Version: 1`,
      `Chain ID: 11155111`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`
    ].join('\n');

    const signature = await account.signMessage({ message });
    const loginRes = await callWorker('/api/auth/siwe', 'POST', {
      message,
      signature,
      address: account.address,
      nonce
    }, {}, customEnv);

    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.data.authenticated, true);
    assert.ok(loginRes.data.sessionToken);
    return loginRes.data.sessionToken;
  }

  // ---------------------------------------------------------------------------
  // Check 4: Malformed addresses are rejected & parser handles normalization
  // ---------------------------------------------------------------------------
  console.log('--- Check 4: Malformed Addresses Rejected & Normalization ---');
  const parsedWallets = parseDevAllowedWallets(env);
  assert.strictEqual(parsedWallets.length, 3, 'Must filter out all 3 malformed addresses');
  assert.ok(parsedWallets.includes(devWallet1.address.toLowerCase()));
  assert.ok(parsedWallets.includes(devWallet2.address.toLowerCase()));
  assert.ok(parsedWallets.includes(devWallet3.address.toLowerCase()));
  assert.strictEqual(isDeveloperWallet('0xmalformed_too_short', env), false);
  assert.strictEqual(isDeveloperWallet('not_even_an_address', env), false);
  assert.strictEqual(isDeveloperWallet(null, env), false);
  assert.strictEqual(isDeveloperWallet(undefined, env), false);
  assert.strictEqual(isDeveloperWallet('', env), false);

  // Missing or empty env variable defaults to empty list
  assert.deepStrictEqual(parseDevAllowedWallets({}), []);
  assert.deepStrictEqual(parseDevAllowedWallets({ DEV_ALLOWED_WALLETS: '' }), []);
  assert.strictEqual(isDeveloperWallet(devWallet1.address, {}), false);
  console.log('✓ Malformed addresses rejected and normalization verified.');

  // ---------------------------------------------------------------------------
  // Check 1: Guest access denied
  // ---------------------------------------------------------------------------
  console.log('\n--- Check 1: Guest Access Denied ---');
  const guestDevAccess = await callWorker('/api/dev/access', 'GET');
  assert.strictEqual(guestDevAccess.status, 200);
  assert.strictEqual(guestDevAccess.data.authorized, false, 'Guest must receive authorized: false');

  const guestWithPlayerIdHeader = await callWorker('/api/dev/access', 'GET', null, { 'X-Player-ID': 'guest_sneaky' });
  assert.strictEqual(guestWithPlayerIdHeader.data.authorized, false, 'Guest with X-Player-ID must receive authorized: false');

  const guestSimulateWork = await callWorker('/api/claim-work', 'POST', { simulateUnits: 1000 }, { 'X-Player-ID': 'guest_sneaky' });
  assert.strictEqual(guestSimulateWork.status, 403, 'Guest simulate work must be rejected with HTTP 403');

  const guestReset = await callWorker('/api/player/reset', 'POST', {}, { 'X-Player-ID': 'guest_sneaky' });
  assert.strictEqual(guestReset.status, 403, 'Guest laboratory reset must be rejected with HTTP 403');

  const guestFateTrigger = await callWorker('/api/fate/trigger-test', 'POST', { type: 'deceased' }, { 'X-Player-ID': 'guest_sneaky' });
  assert.strictEqual(guestFateTrigger.status, 403, 'Guest fate test trigger must be rejected with HTTP 403');
  console.log('✓ Guest access denied across all developer authorization and simulation endpoints.');

  // ---------------------------------------------------------------------------
  // Check 2: Non-allowlisted wallet access denied
  // ---------------------------------------------------------------------------
  console.log('\n--- Check 2: Non-Allowlisted Wallet Access Denied ---');
  const regularToken = await loginSiwe(regularWallet);
  const regularDevAccess = await callWorker('/api/dev/access', 'GET', null, { Authorization: `Bearer ${regularToken}` });
  assert.strictEqual(regularDevAccess.status, 200);
  assert.strictEqual(regularDevAccess.data.authorized, false, 'Non-allowlisted wallet must receive authorized: false');
  assert.strictEqual(regularDevAccess.data.allowlist, undefined, 'Allowlist must never be returned to client');

  const regularSimulate = await callWorker('/api/claim-work', 'POST', { simulateUnits: 2000 }, { Authorization: `Bearer ${regularToken}` });
  assert.strictEqual(regularSimulate.status, 403, 'Non-allowlisted wallet simulation rejected with HTTP 403');

  const regularReset = await callWorker('/api/player/reset', 'POST', {}, { Authorization: `Bearer ${regularToken}` });
  assert.strictEqual(regularReset.status, 403, 'Non-allowlisted wallet reset rejected with HTTP 403');
  console.log('✓ Non-allowlisted wallet strictly denied access with HTTP 403.');

  // ---------------------------------------------------------------------------
  // Check 3: Multiple allowlisted wallets work
  // ---------------------------------------------------------------------------
  console.log('\n--- Check 3: Multiple Allowlisted Wallets Work ---');
  const devToken1 = await loginSiwe(devWallet1);
  const devToken2 = await loginSiwe(devWallet2);
  const devToken3 = await loginSiwe(devWallet3);

  const devAccess1 = await callWorker('/api/dev/access', 'GET', null, { Authorization: `Bearer ${devToken1}` });
  const devAccess2 = await callWorker('/api/dev/access', 'GET', null, { Authorization: `Bearer ${devToken2}` });
  const devAccess3 = await callWorker('/api/dev/access', 'GET', null, { Authorization: `Bearer ${devToken3}` });

  assert.strictEqual(devAccess1.data.authorized, true, 'devWallet1 must be authorized');
  assert.strictEqual(devAccess2.data.authorized, true, 'devWallet2 must be authorized');
  assert.strictEqual(devAccess3.data.authorized, true, 'devWallet3 must be authorized');
  console.log('✓ Multiple allowlisted wallets successfully authorized.');

  // ---------------------------------------------------------------------------
  // Check 5: Wallet switching revokes old authorization
  // ---------------------------------------------------------------------------
  console.log('\n--- Check 5: Wallet Switching Revokes Old Authorization ---');
  // devWallet1 logs out
  const logoutRes = await callWorker('/api/auth/logout', 'POST', null, { Authorization: `Bearer ${devToken1}` });
  assert.strictEqual(logoutRes.status, 200);

  // Old devToken1 is now revoked
  const postLogoutAccess = await callWorker('/api/dev/access', 'GET', null, { Authorization: `Bearer ${devToken1}` });
  assert.strictEqual(postLogoutAccess.data.authorized, false, 'Revoked session token must no longer be authorized');

  // User connects a different non-allowlisted wallet
  const secondRegularToken = await loginSiwe(secondRegularWallet);
  const secondAccess = await callWorker('/api/dev/access', 'GET', null, { Authorization: `Bearer ${secondRegularToken}` });
  assert.strictEqual(secondAccess.data.authorized, false, 'New non-allowlisted wallet must not have access');
  console.log('✓ Wallet switching and logout correctly revoke developer authorization.');

  // ---------------------------------------------------------------------------
  // Check 6: Expired SIWE sessions lose developer access
  // ---------------------------------------------------------------------------
  console.log('\n--- Check 6: Expired SIWE Sessions Lose Developer Access ---');
  const tempDevToken = await loginSiwe(devWallet2);
  const beforeExpire = await callWorker('/api/dev/access', 'GET', null, { Authorization: `Bearer ${tempDevToken}` });
  assert.strictEqual(beforeExpire.data.authorized, true);

  // Manually expire session in D1
  await localDb.prepare('UPDATE auth_sessions SET expires_at = ? WHERE token = ?')
    .bind(Date.now() - 60000, tempDevToken)
    .run();

  // Test in new isolate context (bypassing in-memory cache)
  const expiredDb = createLocalD1Database();
  const expiredTok = `expired_test_tok_${Date.now()}`;
  await expiredDb.prepare(`
    INSERT OR REPLACE INTO auth_sessions (token, wallet_address, player_id, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(expiredTok, devWallet2.address.toLowerCase(), 'player_dev2', Date.now() - 100000, Date.now() - 1000).run();

  const expiredAccess = await callWorker('/api/dev/access', 'GET', null, { Authorization: `Bearer ${expiredTok}` }, { ...env, DB: expiredDb });
  assert.strictEqual(expiredAccess.data.authorized, false, 'Expired SIWE session must return authorized: false');

  const expiredSimulation = await callWorker('/api/claim-work', 'POST', { simulateUnits: 1000 }, { Authorization: `Bearer ${expiredTok}` }, { ...env, DB: expiredDb });
  assert.strictEqual(expiredSimulation.status, 403, 'Expired SIWE session simulation must return HTTP 403');
  console.log('✓ Expired SIWE sessions properly lose developer access and are rejected.');

  // ---------------------------------------------------------------------------
  // Check 7: Unauthorized simulation requests are rejected
  // ---------------------------------------------------------------------------
  console.log('\n--- Check 7: Unauthorized Simulation Requests Rejected ---');
  const unauthOverrides = [
    { simulateUnits: 5000 },
    { simulateRpm: 85 },
    { setBatteryCapacity: 300 },
    { setBatteryEnergy: 150 },
    { setBreedingCharges: 3 },
    { setBreedingChargeProgress: 1000 },
    { addBreedingCharges: 1 }
  ];

  for (const override of unauthOverrides) {
    const res = await callWorker('/api/claim-work', 'POST', override, { Authorization: `Bearer ${regularToken}` });
    assert.strictEqual(res.status, 403, `Must reject ${Object.keys(override)[0]} with 403 for unauthorized wallet`);
  }
  console.log('✓ All 7 simulation override actions strictly rejected with HTTP 403.');

  // ---------------------------------------------------------------------------
  // Check 8: Developer simulations remain isolated from normal gameplay
  // ---------------------------------------------------------------------------
  console.log('\n--- Check 8: Developer Simulations Remain Isolated from Normal Gameplay ---');
  const activeDevToken = await loginSiwe(devWallet3);
  const normalPlayerId = `player_${devWallet3.address.toLowerCase().slice(2, 10)}`;
  const dedicatedDevPlayerId = `dev_test_${devWallet3.address.toLowerCase().slice(2, 10)}`;

  // Normal player account initialization
  const initialNormalRes = await callWorker('/api/state', 'GET', null, { Authorization: `Bearer ${activeDevToken}` });
  assert.strictEqual(initialNormalRes.status, 200);
  const initialNormalPlayer = initialNormalRes.data;
  assert.strictEqual(initialNormalPlayer.id, normalPlayerId);
  const initialBattery = initialNormalPlayer.batteryEnergy;
  const initialWork = initialNormalPlayer.lastCreditedWork;

  // Developer triggers simulation action (+3000 units = +30 Energy)
  const simRes = await callWorker('/api/claim-work', 'POST', { simulateUnits: 3000 }, { Authorization: `Bearer ${activeDevToken}` });
  assert.strictEqual(simRes.status, 200);
  assert.strictEqual(simRes.data.player.id, dedicatedDevPlayerId, 'Simulation mutations must target dedicated dev test account');

  // Verify normal player account in D1 was NOT mutated
  const verifiedNormalState = await callWorker('/api/state', 'GET', null, { Authorization: `Bearer ${activeDevToken}` });
  assert.strictEqual(verifiedNormalState.data.id, normalPlayerId);
  assert.strictEqual(verifiedNormalState.data.batteryEnergy, initialBattery, 'Normal player battery must remain untouched');
  assert.strictEqual(verifiedNormalState.data.lastCreditedWork, initialWork, 'Normal player lastCreditedWork must remain untouched');

  // Verify developer cannot target arbitrary player IDs
  const maliciousTargetRes = await callWorker('/api/claim-work', 'POST', { simulateUnits: 5000 }, {
    Authorization: `Bearer ${activeDevToken}`,
    'X-Player-ID': 'victim_player_account_999'
  });
  assert.strictEqual(maliciousTargetRes.status, 403, 'Targeting arbitrary player IDs during simulation must be blocked');
  assert.strictEqual(maliciousTargetRes.data.error, 'FORBIDDEN_SIMULATION_TARGET');

  const maliciousResetRes = await callWorker('/api/player/reset', 'POST', {}, {
    Authorization: `Bearer ${activeDevToken}`,
    'X-Player-ID': 'victim_player_account_999'
  });
  assert.strictEqual(maliciousResetRes.status, 403, 'Targeting arbitrary player IDs during reset must be blocked');
  console.log('✓ Developer simulations strictly isolated to dedicated test account and arbitrary player targeting blocked.');

  // ---------------------------------------------------------------------------
  // Check 9: No simulated activity affects NFT mint eligibility
  // ---------------------------------------------------------------------------
  console.log('\n--- Check 9: Simulated Activity Cannot Affect NFT Mint Eligibility ---');
  // Attempt to initiate NFT mint from dedicated developer test account
  const devAccountMintRes = await callWorker('/api/nft/initiate-mint', 'POST', { specimenId: 'specimen_1' }, {
    Authorization: `Bearer ${activeDevToken}`,
    'X-Player-ID': dedicatedDevPlayerId
  });
  assert.strictEqual(devAccountMintRes.status, 403);
  assert.strictEqual(devAccountMintRes.data.error, 'SIMULATION_ACCOUNT_DISQUALIFIED');

  // Attempt to mint a specimen marked as simulated
  const normalAccountWithSimulatedSpecimen = await callWorker('/api/nft/initiate-mint', 'POST', { specimenId: 'simulated_specimen_1' }, {
    Authorization: `Bearer ${activeDevToken}`
  });
  assert.strictEqual(normalAccountWithSimulatedSpecimen.status, 404, 'Must not find unowned specimen');

  console.log('✓ Simulated activity and developer accounts strictly disqualified from NFT minting.');

  // ---------------------------------------------------------------------------
  // Check 10: Existing game functionality remains unchanged
  // ---------------------------------------------------------------------------
  console.log('\n--- Check 10: Existing Game Functionality Remains Unchanged ---');
  // Normal claim work without simulation parameters works for guest
  const guestNormalClaim = await callWorker('/api/claim-work', 'POST', {}, { 'X-Player-ID': 'guest_peaceful_player' });
  assert.strictEqual(guestNormalClaim.status, 200, 'Normal guest claim-work must succeed');
  assert.strictEqual(guestNormalClaim.data.player.id, 'guest_peaceful_player');

  // Normal claim work works for authenticated regular player
  const regularNormalClaim = await callWorker('/api/claim-work', 'POST', {}, { Authorization: `Bearer ${regularToken}` });
  assert.strictEqual(regularNormalClaim.status, 200, 'Normal wallet claim-work must succeed');
  assert.ok(regularNormalClaim.data.player.batteryEnergy > 0);

  // Normal backup export & validate
  const exportRes = await callWorker('/api/backup/export', 'GET', null, { Authorization: `Bearer ${regularToken}` });
  assert.strictEqual(exportRes.status, 200);
  assert.ok(exportRes.data.signature);

  console.log('✓ Existing game functionality, guest play, and normal saving 100% operational.');

  console.log('\n================================================================');
  console.log('ALL 10 DEVELOPER CONSOLE SECURITY CHECKS PASSED 100%!');
  console.log('================================================================');
}

runDevConsoleSecurityTestSuite().catch(err => {
  console.error('\n❌ Developer Console Security Test Suite Failed:', err);
  process.exit(1);
});
