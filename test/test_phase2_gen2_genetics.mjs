import assert from 'assert';
import worker from '../worker/index.ts';
import { createLocalD1Database } from '../worker/local-d1.ts';
import {
  generateQuantumHybrid,
  generateMultiGenHybrid,
  createParentDescriptor
} from '../src/utils/hybridGenerator.ts';
import { buildCanonicalNftMetadata } from '../src/utils/nftMetadata.ts';
import { HAMSTER_SPECIES } from '../src/types/game.ts';

async function runPhase2GeneticsTestSuite() {
  console.log('================================================================');
  console.log('--- PHASE 2: GENERATION 2 QUANTUM GENETICS & BREEDING TESTS ---');
  console.log('================================================================\n');

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

  const playerId = `test_player_gen2_${Date.now()}`;

  // Helper: setup player with level 2 lab and quantum genetics unlocked
  async function setupPlayer() {
    await callWorker('/api/state', 'GET', null, { 'X-Player-ID': playerId });
    await callWorker('/api/player/reset', 'POST', {
      labLevel: 2,
      insight: 5000,
      unlockedResearch: ['quantum_genetics'],
      grantSpecies: ['normal', 'electric', 'ghost', 'glitch', 'plasma', 'paradox']
    }, { 'X-Player-ID': playerId });
    // Add breeding charges
    await callWorker('/api/claim-work', 'POST', { addBreedingCharges: 3 }, { 'X-Player-ID': playerId });
  }

  async function fastForwardIncubation(pid = playerId) {
    const row = await localDb.prepare('SELECT state_json, save_revision FROM players WHERE id = ?').bind(pid).first();
    const p = JSON.parse(row.state_json);
    if (p.activeIncubation) {
      p.activeIncubation.finishesAt = Date.now() - 1000;
      p.saveRevision = (row.save_revision || 0) + 1;
      await localDb.prepare('UPDATE players SET state_json = ?, save_revision = ? WHERE id = ?')
        .bind(JSON.stringify(p), p.saveRevision, pid).run();
    }
  }

  await setupPlayer();

  // ---------------------------------------------------------------------------
  // Test 1: Base × Base → Gen 1 Hybrid
  // ---------------------------------------------------------------------------
  console.log('--- Test 1: Base × Base → Generation 1 Hybrid ---');
  const baseBreedRes = await callWorker('/api/incubator/start', 'POST', {
    parent1Species: 'normal',
    parent2Species: 'electric'
  }, { 'X-Player-ID': playerId });

  assert.strictEqual(baseBreedRes.status, 200, 'Base × Base incubation must start');
  assert.strictEqual(baseBreedRes.data.activeIncubation.childGeneration, 1, 'Base × Base must produce Gen 1');

  // Fast-forward & reveal State A
  await fastForwardIncubation();
  const reveal1Res = await callWorker('/api/incubator/reveal', 'POST', { chosenState: 'A' }, { 'X-Player-ID': playerId });
  assert.strictEqual(reveal1Res.status, 200);
  const gen1Hybrid = reveal1Res.data.hybrid;
  assert.strictEqual(gen1Hybrid.generation, 1, 'Hatched hybrid must be Generation 1');
  assert.ok(gen1Hybrid.ancestryLineage.includes('Gen 1'), 'Lineage must record Gen 1');
  console.log(`✓ Hatched Gen 1: "${gen1Hybrid.nickname}" (${gen1Hybrid.ancestryLineage})`);

  // ---------------------------------------------------------------------------
  // Test 2: Base × Gen 1 → Gen 2 Hybrid
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 2: Base × Gen 1 → Generation 2 Hybrid ---');
  // Add another breeding charge
  await callWorker('/api/claim-work', 'POST', { addBreedingCharges: 2 }, { 'X-Player-ID': playerId });

  const baseGen1Res = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: 'ghost',
    parent2Id: gen1Hybrid.id
  }, { 'X-Player-ID': playerId });

  if (baseGen1Res.status !== 200) {
    console.error('Base x Gen 1 error data:', baseGen1Res.data);
  }
  assert.strictEqual(baseGen1Res.status, 200, 'Base × Gen 1 breeding must start');
  assert.strictEqual(baseGen1Res.data.activeIncubation.childGeneration, 2, 'Base × Gen 1 must yield Gen 2');

  await fastForwardIncubation();
  const reveal2Res = await callWorker('/api/incubator/reveal', 'POST', { chosenState: 'A' }, { 'X-Player-ID': playerId });
  assert.strictEqual(reveal2Res.status, 200);
  const gen2HybridA = reveal2Res.data.hybrid;
  assert.strictEqual(gen2HybridA.generation, 2, 'Child must be Generation 2');
  assert.ok(gen2HybridA.ancestryLineage.includes('Gen 2'), 'Lineage must record Gen 2');
  assert.strictEqual(gen2HybridA.parent2Id, gen1Hybrid.id, 'Parent 2 ID must match Gen 1 specimen ID');
  console.log(`✓ Hatched Gen 2 (Base × Gen 1): "${gen2HybridA.nickname}" (${gen2HybridA.ancestryLineage})`);

  // ---------------------------------------------------------------------------
  // Test 3: Gen 1 × Gen 1 → Gen 2 Hybrid
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 3: Gen 1 × Gen 1 → Generation 2 Hybrid ---');
  // First, hatch a second distinct Gen 1 hybrid
  await callWorker('/api/claim-work', 'POST', { addBreedingCharges: 2 }, { 'X-Player-ID': playerId });
  const breedGen1B = await callWorker('/api/incubator/start', 'POST', {
    parent1Species: 'glitch',
    parent2Species: 'ghost'
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(breedGen1B.status, 200);
  await fastForwardIncubation();
  const revealGen1B = await callWorker('/api/incubator/reveal', 'POST', { chosenState: 'B' }, { 'X-Player-ID': playerId });
  const gen1HybridB = revealGen1B.data.hybrid;
  assert.strictEqual(gen1HybridB.generation, 1);

  // Now breed Gen 1 × Gen 1
  await callWorker('/api/claim-work', 'POST', { addBreedingCharges: 2 }, { 'X-Player-ID': playerId });
  const gen1xGen1Res = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: gen1Hybrid.id,
    parent2Id: gen1HybridB.id
  }, { 'X-Player-ID': playerId });

  assert.strictEqual(gen1xGen1Res.status, 200, 'Gen 1 × Gen 1 breeding must start');
  assert.strictEqual(gen1xGen1Res.data.activeIncubation.childGeneration, 2, 'Gen 1 × Gen 1 must yield Gen 2');

  await fastForwardIncubation();
  const revealGen2B = await callWorker('/api/incubator/reveal', 'POST', { chosenState: 'A' }, { 'X-Player-ID': playerId });
  const gen2HybridB = revealGen2B.data.hybrid;
  assert.strictEqual(gen2HybridB.generation, 2, 'Child must be Generation 2');
  console.log(`✓ Hatched Gen 2 (Gen 1 × Gen 1): "${gen2HybridB.nickname}" (${gen2HybridB.ancestryLineage})`);

  // ---------------------------------------------------------------------------
  // Test 4: Generation 2 Cannot Breed (Lockout Enforcement)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 4: Generation 2 Cannot Breed Lockout ---');
  await callWorker('/api/claim-work', 'POST', { addBreedingCharges: 2 }, { 'X-Player-ID': playerId });

  // Try Gen 2 × Base
  const gen2xBase = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: gen2HybridA.id,
    parent2Id: 'normal'
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(gen2xBase.status, 400, 'Gen 2 × Base must be rejected');
  assert.ok(gen2xBase.data.message.includes('Generation 2'), 'Must cite Gen 2 breeding prohibition');

  // Try Gen 2 × Gen 1
  const gen2xGen1 = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: gen2HybridA.id,
    parent2Id: gen1Hybrid.id
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(gen2xGen1.status, 400, 'Gen 2 × Gen 1 must be rejected');

  // Try Gen 2 × Gen 2
  const gen2xGen2 = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: gen2HybridA.id,
    parent2Id: gen2HybridB.id
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(gen2xGen2.status, 400, 'Gen 2 × Gen 2 must be rejected');
  console.log('✓ Generation 2 breeding strictly prohibited in all pairings');

  // ---------------------------------------------------------------------------
  // Test 5: Same Specimen Lockout
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 5: Same Specimen Twice Lockout ---');
  const sameBase = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: 'normal',
    parent2Id: 'normal'
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(sameBase.status, 400);
  assert.ok(sameBase.data.message.includes('twice'), 'Must reject selecting same base species twice');

  const sameHybrid = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: gen1Hybrid.id,
    parent2Id: gen1Hybrid.id
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(sameHybrid.status, 400);
  assert.ok(sameHybrid.data.message.includes('twice'), 'Must reject selecting same hybrid specimen twice');
  console.log('✓ Same specimen lockout verified for both base and hybrid parents');

  // ---------------------------------------------------------------------------
  // Test 6: Deceased or Missing Parent Lockout
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 6: Deceased or Missing Parent Lockout ---');
  // Temporarily mark a hybrid as deceased
  const stateRes = await callWorker('/api/state', 'GET', null, { 'X-Player-ID': playerId });
  const playerState = stateRes.data;
  const targetH = playerState.hybrids.find(h => h.id === gen1HybridB.id);
  targetH.existenceStatus = 'deceased';

  // Save modified state into DB
  await localDb.prepare('UPDATE players SET state_json = ? WHERE id = ?')
    .bind(JSON.stringify(playerState), playerId)
    .run();

  const deceasedBreedRes = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: gen1Hybrid.id,
    parent2Id: gen1HybridB.id
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(deceasedBreedRes.status, 400);
  assert.ok(deceasedBreedRes.data.message.includes('deceased'), 'Must reject breeding with deceased specimen');
  console.log('✓ Deceased parent breeding prevented');

  // Restore status
  targetH.existenceStatus = 'alive';
  await localDb.prepare('UPDATE players SET state_json = ? WHERE id = ?')
    .bind(JSON.stringify(playerState), playerId)
    .run();

  // ---------------------------------------------------------------------------
  // Test 7: Maximum 4 Active Mutations Hard Cap
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 7: Maximum 4 Active Mutations Hard Cap ---');
  const p1Desc = {
    id: 'p1_mutated',
    name: 'Multi-Mutant Alpha',
    isBase: false,
    generation: 1,
    traits: {
      palette: { body: '#ffffff', dark: '#000000', light: '#cccccc', accent: '#ff0000', glow: '#00ff00' },
      furPattern: 'void_nebula',
      bodyShape: 'round',
      earShape: 'antenna',
      eyeColor: '#ff00ff',
      quantumEffect: 'cosmic_singularity',
      cosmeticMutation: 'energy_wings',
      eyeMutation: 'five_eyed',
      headMutation: 'crystal_horns',
      limbMutation: 'missing_hind_legs',
      bodyMutation: 'ghost_body',
      tailMutation: 'bat_wings',
      auraEffect: 'cosmic',
      activeMutations: ['FIVE EYES', 'CRYSTAL HORNS', 'FLOATING BODY', 'GHOST BODY', 'BAT WINGS', 'COSMIC AURA']
    }
  };

  const p2Desc = {
    id: 'p2_mutated',
    name: 'Multi-Mutant Beta',
    isBase: false,
    generation: 1,
    traits: { ...p1Desc.traits }
  };

  for (let s = 1000; s < 1050; s++) {
    const child = generateMultiGenHybrid('test_cap', p1Desc, p2Desc, s);
    assert.ok(child.traits.activeMutations.length <= 4, `Active mutations (${child.traits.activeMutations.length}) exceeded 4 at seed ${s}!`);
  }
  console.log('✓ Tested 50 multi-mutant generations: 100% strictly adhered to <= 4 active mutations hard cap');

  // ---------------------------------------------------------------------------
  // Test 8: Palette Blending & Lineage Immutability
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 8: Cosmetic Palette Blending ---');
  const pBase = { id: 'electric', name: 'Electric', isBase: true, speciesId: 'electric' };
  const pHybrid = {
    id: 'hyb_dark',
    name: 'Shadow',
    isBase: false,
    generation: 1,
    traits: {
      palette: { body: '#101010', dark: '#050505', light: '#202020', accent: '#303030', glow: '#404040' },
      furPattern: 'striped',
      bodyShape: 'sleek',
      earShape: 'tufted',
      eyeColor: '#00f0ff',
      quantumEffect: 'none',
      cosmeticMutation: 'none',
      eyeMutation: 'normal',
      headMutation: 'none',
      limbMutation: 'normal',
      bodyMutation: 'normal',
      tailMutation: 'none',
      auraEffect: 'none',
      activeMutations: []
    }
  };

  const blendedChild = generateMultiGenHybrid('palette_test', pBase, pHybrid, 5555);
  assert.ok(blendedChild.traits.palette.body !== '#101010' && blendedChild.traits.palette.body !== '#ffdc33', 'Child body color must be an interpolated blend');
  console.log(`✓ Parent colors blended: Electric (#ffdc33) × Shadow (#101010) → Child (${blendedChild.traits.palette.body})`);

  // ---------------------------------------------------------------------------
  // Test 9: NFT Parent Onchain Ownership Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 9: NFT Parent Onchain Ownership Verification ---');
  const testWallet = '0xF4ed194582bc6416d8A9FA9e0465A02A012A9760';
  const otherWallet = '0x1111111111111111111111111111111111111111';
  const testTokenId = 7701;

  // Give a hybrid an NFT token ID
  const nftHybrid = gen1Hybrid;
  nftHybrid.nftTokenId = testTokenId;
  nftHybrid.nftContractAddress = '0xd77e88ccdb7b535133796d428e95322217ce99a4';

  const freshState = (await callWorker('/api/state', 'GET', null, { 'X-Player-ID': playerId })).data;
  const targetNftHybrid = freshState.hybrids.find(h => h.id === nftHybrid.id);
  targetNftHybrid.nftTokenId = testTokenId;
  targetNftHybrid.nftContractAddress = '0xd77e88ccdb7b535133796d428e95322217ce99a4';

  await localDb.prepare('UPDATE players SET state_json = ? WHERE id = ?')
    .bind(JSON.stringify(freshState), playerId)
    .run();

  // Test 9a: Attempt breeding without wallet session
  await callWorker('/api/claim-work', 'POST', { addBreedingCharges: 2 }, { 'X-Player-ID': playerId });
  const noWalletRes = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: nftHybrid.id,
    parent2Id: 'normal'
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(noWalletRes.status, 403, 'Must require authenticated wallet when using NFT parent');

  // Test 9b: Attempt breeding with simulated RPC ownership mismatch
  // Insert into minted_nfts under otherWallet
  await localDb.prepare(`
    INSERT INTO minted_nfts (token_id, specimen_id, wallet_address, contract_address, chain_id, token_uri, metadata_hash, tx_hash, minted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(token_id) DO UPDATE SET wallet_address = excluded.wallet_address
  `).bind(testTokenId, nftHybrid.id, otherWallet, '0xd77e88ccdb7b535133796d428e95322217ce99a4', 11155111, 'ipfs://QmTest', '0x123', '0xabc', Date.now()).run();

  // Insert valid session for testWallet
  const validToken = `test_session_${Date.now()}`;
  await localDb.prepare(`
    INSERT INTO auth_sessions (token, wallet_address, player_id, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(validToken, testWallet, playerId, Date.now(), Date.now() + 3600000).run();

  // Mock RPC failure scenario
  const rpcFailEnv = {
    ...env,
    SEPOLIA_RPC_URL: 'http://127.0.0.1:9999' // unreachable port
  };

  const rpcFailRes = await callWorker('/api/incubator/start', 'POST', {
    parent1Id: nftHybrid.id,
    parent2Id: 'normal'
  }, {
    'X-Player-ID': playerId,
    'Authorization': `Bearer ${validToken}`
  }, rpcFailEnv);

  assert.strictEqual(rpcFailRes.status, 503, 'RPC communication timeout must return HTTP 503');
  assert.strictEqual(rpcFailRes.data.error, 'RPC_OWNERSHIP_CHECK_FAILED');
  console.log('✓ RPC failure correctly returned retryable HTTP 503 RPC_OWNERSHIP_CHECK_FAILED');

  // ---------------------------------------------------------------------------
  // Test 10: Canonical ERC-721 Metadata for Gen 2 Hybrids
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 10: Canonical ERC-721 Metadata for Gen 2 ---');
  const metadata = buildCanonicalNftMetadata(gen2HybridA, 888, 'QmTestCidArtwork123');
  assert.strictEqual(metadata.external_url, 'https://schrohams.my.id/dex?token=888', 'Must point to schrohams.my.id custom domain');
  const genTrait = metadata.attributes.find(a => a.trait_type === 'Generation');
  assert.ok(genTrait, 'Must have Generation attribute');
  assert.strictEqual(genTrait.value, 2, 'Must have Generation = 2');
  console.log('✓ Canonical ERC-721 metadata accurately formats Gen 2 attributes and custom domain external_url');

  // ---------------------------------------------------------------------------
  // Test 11: Restored Incubations: Sealed Payload vs. Legacy Chamber Reset
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 11: Sealed Chamber Backup vs. Legacy Chamber Reset ---');
  // 11a: Start an active incubation
  await callWorker('/api/claim-work', 'POST', { addBreedingCharges: 2 }, { 'X-Player-ID': playerId });
  const startIncRes = await callWorker('/api/incubator/start', 'POST', {
    parent1Species: 'electric',
    parent2Species: 'plasma'
  }, { 'X-Player-ID': playerId });
  assert.strictEqual(startIncRes.status, 200);

  // Export backup with in-flight incubation
  const exportWithIncRes = await callWorker('/api/backup/export', 'GET', null, { 'X-Player-ID': playerId });
  assert.strictEqual(exportWithIncRes.status, 200);
  const sealedBackup = exportWithIncRes.data;
  assert.ok(sealedBackup.sealedIncubation, 'Active incubation must be sealed in backup');

  // Clear local DB to simulate disaster restore
  await localDb.prepare('DELETE FROM players WHERE id = ?').bind(playerId).run();

  // Restore from sealed backup
  const restoreSealedRes = await callWorker('/api/backup/import', 'POST', { backup: sealedBackup }, { 'X-Player-ID': playerId });
  assert.strictEqual(restoreSealedRes.status, 200);
  assert.ok(restoreSealedRes.data.player.activeIncubation, 'Active incubation must be preserved');

  // Hatch the restored chamber
  await fastForwardIncubation();
  const hatchRestored = await callWorker('/api/incubator/reveal', 'POST', { chosenState: 'A' }, { 'X-Player-ID': playerId });
  assert.strictEqual(hatchRestored.status, 200);
  console.log(`✓ Sealed incubation restored and hatched: "${hatchRestored.data.hybrid.nickname}"`);

  // 11b: Legacy backup simulation (activeIncubation present but sealedIncubation stripped and live isolate wiped)
  // Delete consumed_backups record so the backup snapshot can be restored again in disaster recovery simulation
  await localDb.prepare('DELETE FROM consumed_backups WHERE backup_id = ?').bind(sealedBackup.backupId).run();
  const legacyBackup = JSON.parse(JSON.stringify(sealedBackup));
  delete legacyBackup.sealedIncubation; // simulate legacy export without sealed data

  // Clear live isolate
  await localDb.prepare('DELETE FROM players WHERE id = ?').bind(playerId).run();

  // Import legacy backup where exact candidates cannot be guaranteed
  const legacyImportRes = await callWorker('/api/backup/import', 'POST', { backup: legacyBackup }, { 'X-Player-ID': playerId });
  assert.strictEqual(legacyImportRes.status, 200);
  // Verify honest handling: chamber is safely reset to null and 1 breeding charge is refunded
  assert.strictEqual(legacyImportRes.data.player.activeIncubation, null, 'Legacy uncommitted incubation must be reset');
  assert.ok(legacyImportRes.data.notices.some(n => n.includes('refunded')), 'Must inform user with charge refund notice');
  console.log('✓ Legacy save handled explicitly: uncommitted chamber safely reset and 1 breeding charge refunded without pretending outcomes are identical');

  // 11c: Legacy backup with FREE live breeding must NOT grant unearned stored breeding charges
  // Clear consumed record to simulate fresh restore
  await localDb.prepare('DELETE FROM consumed_backups WHERE backup_id = ?').bind(sealedBackup.backupId).run();
  const liveBreedingLegacyBackup = JSON.parse(JSON.stringify(sealedBackup));
  delete liveBreedingLegacyBackup.sealedIncubation;
  // Mark playerState activeIncubation as live breeding
  liveBreedingLegacyBackup.playerState.activeIncubation.isLiveBreeding = true;
  // Re-sign using authoritative backup secret
  const canon11c = {
    app: liveBreedingLegacyBackup.app,
    version: 2,
    backupId: liveBreedingLegacyBackup.backupId,
    lineageId: liveBreedingLegacyBackup.lineageId,
    saveRevision: liveBreedingLegacyBackup.saveRevision,
    exportedAt: liveBreedingLegacyBackup.exportedAt,
    playerId: liveBreedingLegacyBackup.playerId,
    playerState: liveBreedingLegacyBackup.playerState
  };
  const enc = new TextEncoder();
  const secretKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
  const key11c = await crypto.subtle.importKey('raw', enc.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig11c = await crypto.subtle.sign('HMAC', key11c, enc.encode(JSON.stringify(canon11c)));
  liveBreedingLegacyBackup.signature = Array.from(new Uint8Array(sig11c)).map(b => b.toString(16).padStart(2, '0')).join('');

  const initialCharges = liveBreedingLegacyBackup.playerState.breedingCharges || 0;

  // Clear live isolate
  await localDb.prepare('DELETE FROM players WHERE id = ?').bind(playerId).run();

  const liveFreeImportRes = await callWorker('/api/backup/import', 'POST', { backup: liveBreedingLegacyBackup }, { 'X-Player-ID': playerId });
  if (liveFreeImportRes.status !== 200) {
    console.error('11c error data:', liveFreeImportRes.data);
  }
  assert.strictEqual(liveFreeImportRes.status, 200);
  assert.strictEqual(liveFreeImportRes.data.player.activeIncubation, null, 'Chamber safely reset');
  assert.strictEqual(liveFreeImportRes.data.player.breedingCharges, initialCharges, 'Free live breeding must NOT be refunded as stored charges');
  console.log('✓ Free live breeding legacy reset verified: no unearned stored charges granted');

  console.log('\n================================================================');
  console.log('ALL PHASE 2 GENERATION 2 GENETICS REGRESSION TESTS PASSED 100%!');
  console.log('================================================================');
}

runPhase2GeneticsTestSuite().catch(err => {
  console.error('\n❌ Phase 2 Genetics Test Failure:', err);
  process.exit(1);
});
