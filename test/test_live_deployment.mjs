// test/test_live_deployment.mjs
// Live End-to-End Smoke Tests for Schrödinger's Hamster Cloudflare Beta

const PAGES_URL = 'https://schrodingers-hamster.pages.dev';
const WORKER_URL = 'https://schrodingers-hamster.valcio222.workers.dev';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Running Live Smoke Tests on Cloudflare Beta');
  console.log(`Pages URL:  ${PAGES_URL}`);
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond, name, details = '') {
    if (cond) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details}`);
      failed++;
    }
  }

  // 1. Pages Frontend Accessibility
  console.log('--- 1. Cloudflare Pages Frontend Tests ---');
  try {
    const res = await fetch(PAGES_URL);
    assert(res.status === 200, 'Frontend HTML returns HTTP 200');
    const html = await res.text();
    assert(html.includes('<div id="root"></div>'), 'HTML contains #root mounting node');
    assert(html.includes('assets/index-'), 'HTML references bundled Vite asset script');

    // Extract JS asset and fetch it
    const jsMatch = html.match(/\/assets\/index-[^"]+\.js/);
    if (jsMatch) {
      const assetRes = await fetch(`${PAGES_URL}${jsMatch[0]}`);
      assert(assetRes.status === 200, `JS bundle accessible (${jsMatch[0]})`);
    } else {
      assert(false, 'JS bundle link found in HTML');
    }

    // SPA routing check (Public redirects / SPA fallback)
    const spaRes = await fetch(`${PAGES_URL}/settings`);
    assert(spaRes.status === 200, 'SPA fallback route returns HTTP 200');
  } catch (e) {
    assert(false, 'Frontend accessibility', e.message);
  }

  // 2. Cloudflare Pages Functions Proxy
  console.log('\n--- 2. Cloudflare Pages Functions Edge Proxy Tests ---');
  try {
    const proxyRes = await fetch(`${PAGES_URL}/api/telemetry`);
    assert(proxyRes.status === 200, 'Pages Function proxies /api/telemetry with HTTP 200');
    const telemetry = await proxyRes.json();
    assert(typeof telemetry.settledCumulativeWork === 'number', 'Pages Function proxy returns valid hardware telemetry payload');
    assert(typeof telemetry.counterEpoch === 'string', 'Telemetry includes counterEpoch');
  } catch (e) {
    assert(false, 'Pages Function edge proxy', e.message);
  }

  // 3. Cloudflare Worker Direct API & CORS
  console.log('\n--- 3. Cloudflare Worker Direct API & CORS Tests ---');
  try {
    const corsRes = await fetch(`${WORKER_URL}/api/telemetry`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://schrodingers-hamster.pages.dev',
        'Access-Control-Request-Method': 'POST'
      }
    });
    assert(corsRes.status === 200 || corsRes.status === 204, `CORS preflight OPTIONS returns HTTP ${corsRes.status}`);
    assert(corsRes.headers.get('access-control-allow-origin') === '*', 'CORS Allow-Origin is permissive for beta');

    const nonceRes = await fetch(`${WORKER_URL}/api/auth/nonce`);
    assert(nonceRes.status === 200, 'Worker /api/auth/nonce returns HTTP 200');
    const nonceData = await nonceRes.json();
    assert(typeof nonceData.nonce === 'string' && nonceData.nonce.length >= 8, 'Nonce format is valid');
  } catch (e) {
    assert(false, 'Worker direct API & CORS', e.message);
  }

  // 4. Remote D1 Player State Persistence Lifecycle
  console.log('\n--- 4. Live D1 Player Progression & Persistence Tests ---');
  const testPlayerId = `live_tester_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  try {
    // Initial fetch creates player in remote D1
    const initRes = await fetch(`${WORKER_URL}/api/state?playerId=${testPlayerId}`, {
      headers: { 'X-Player-ID': testPlayerId }
    });
    assert(initRes.status === 200, 'Initial player state fetch returns HTTP 200');
    const initState = await initRes.json();
    assert(initState.id === testPlayerId, 'Player ID matches created state');
    assert(initState.saveRevision === 3, 'Initial saveRevision starts at 3');
    const initialInsight = initState.researchInsight;

    // Start experiment (type: basic)
    const expStartRes = await fetch(`${WORKER_URL}/api/experiment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Player-ID': testPlayerId
      },
      body: JSON.stringify({ type: 'basic', approach: 'stable' })
    });
    assert(expStartRes.status === 200, 'Start experiment returns HTTP 200');
    const startData = await expStartRes.json();
    assert(startData.activeExperiment !== null, 'Active experiment initiated');

    // Wait 5.2s for basic experiment duration (5s) to complete
    console.log('    ⏳ Waiting 5.2s for quantum wavefunction stabilization...');
    await new Promise(r => setTimeout(r, 5200));

    // Reveal / observe experiment outcome
    const obsRes = await fetch(`${WORKER_URL}/api/experiment/reveal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Player-ID': testPlayerId
      },
      body: JSON.stringify({ chosenState: 'A' })
    });
    assert(obsRes.status === 200, 'Reveal / observe experiment returns HTTP 200');
    const obsData = await obsRes.json();
    assert(obsData.player.saveRevision > 3, `saveRevision monotonically increased to ${obsData.player.saveRevision}`);
    assert(obsData.player.researchInsight >= initialInsight, `Research Insight awarded (${initialInsight} -> ${obsData.player.researchInsight})`);

    // Re-fetch player state to verify persistence in remote D1 across fresh request
    const refetchRes = await fetch(`${WORKER_URL}/api/state?playerId=${testPlayerId}`, {
      headers: { 'X-Player-ID': testPlayerId }
    });
    const refetchedState = await refetchRes.json();
    assert(refetchedState.researchInsight === obsData.player.researchInsight, 'Persistent state accurately retrieved on fresh connection');
    assert(refetchedState.saveRevision >= obsData.player.saveRevision, `Save revision monotonic in D1 database (${obsData.player.saveRevision} -> ${refetchedState.saveRevision})`);
  } catch (e) {
    assert(false, 'Live D1 player lifecycle', e.message);
  }

  // 5. Player Backup Export & HMAC Integrity
  console.log('\n--- 5. Player Backup Export & HMAC Integrity Tests ---');
  try {
    const backupRes = await fetch(`${WORKER_URL}/api/backup/export`, {
      headers: { 'X-Player-ID': testPlayerId }
    });
    assert(backupRes.status === 200, 'Backup export returns HTTP 200');
    const backupData = await backupRes.json();
    assert(backupData.signature && backupData.signature.length === 64, 'Backup has valid 64-char HMAC-SHA256 signature');
    assert(backupData.playerId === testPlayerId, 'Backup contains correct player identity');
    assert(backupData.playerState.researchInsight > 0, 'Backup contains authoritative D1 state');
    assert(backupData.summary.saveRevision >= 4, 'Backup metadata matches save revision');
  } catch (e) {
    assert(false, 'Player backup export', e.message);
  }

  // 6. Security & Policy Enforcement
  console.log('\n--- 6. Security & Disabled NFT Minting Policy Tests ---');
  try {
    const mintRes = await fetch(`${WORKER_URL}/api/nft/authorize-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake_token'
      },
      body: JSON.stringify({ specimenId: 'spec_123' })
    });
    // With ENABLE_NFT_MINTING = false, worker returns 503 Service Unavailable
    assert(mintRes.status === 503, 'NFT minting authorization endpoint returns HTTP 503 (disabled for beta)');
    const mintErr = await mintRes.json();
    assert(mintErr.error === 'MINTING_NOT_ACTIVE', 'Error code is MINTING_NOT_ACTIVE');
  } catch (e) {
    assert(false, 'NFT minting policy check', e.message);
  }

  console.log('\n====================================================');
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Smoke test suite failed:', err);
  process.exit(1);
});
