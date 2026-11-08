import fs from 'fs';
import path from 'path';
import { generateQuantumHybrid } from '../src/utils/hybridGenerator';
import { generateDeterministicHybridSvg, computeDeterministicIpfsCid } from '../src/utils/nftMetadata';
import { QuantumHybrid } from '../src/types/game';

const ARTIFACT_DIR = 'C:/Users/valci/.gemini/antigravity/brain/cc9c3e91-b8bf-4a5d-b89f-60b840d4387d';

async function verifyArtworkConsistency() {
  console.log('--- GENERATING SIDE-BY-SIDE NFT ARTWORK CONSISTENCY VERIFICATION ---');

  // Create the 5 Archetypes
  const archetypes: { label: string; file: string; hybrid: QuantumHybrid }[] = [
    {
      label: '1. Cyclops (One Central Anime Eye)',
      file: 'nft_archetype_1_cyclops.svg',
      hybrid: (() => {
        const h = generateQuantumHybrid('test_player', 'normal', 'robot', 42);
        h.traits.eyeMutation = 'cyclops';
        h.traits.headMutation = 'single_horn';
        h.traits.bodyMutation = 'normal';
        h.traits.limbMutation = 'normal';
        h.traits.auraEffect = 'none';
        h.traits.tailMutation = 'none';
        h.generatedName = 'Monopeep';
        return h;
      })()
    },
    {
      label: '2. Five-Eyed (Arc of 5 Cute Eyes)',
      file: 'nft_archetype_2_five_eyed.svg',
      hybrid: (() => {
        const h = generateQuantumHybrid('test_player', 'ghost', 'alien', 101);
        h.traits.eyeMutation = 'five_eyed';
        h.traits.headMutation = 'extra_ears';
        h.traits.bodyMutation = 'extra_fluffy';
        h.traits.limbMutation = 'tiny_forepaws';
        h.traits.auraEffect = 'none';
        h.traits.tailMutation = 'forked_tail';
        h.generatedName = 'Hexwhisk';
        return h;
      })()
    },
    {
      label: '3. Horned (Crystal Horns & Crown)',
      file: 'nft_archetype_3_horned.svg',
      hybrid: (() => {
        const h = generateQuantumHybrid('test_player', 'electric', 'normal', 777);
        h.traits.eyeMutation = 'heterochromia';
        h.traits.headMutation = 'crystal_horns';
        h.traits.bodyMutation = 'crystal_patches';
        h.traits.limbMutation = 'oversized_paws';
        h.traits.auraEffect = 'crystal';
        h.traits.tailMutation = 'crystal_tail';
        h.generatedName = 'Glimhorn';
        return h;
      })()
    },
    {
      label: '4. Floating (Missing Hind Legs & Spectral Cloud)',
      file: 'nft_archetype_4_floating.svg',
      hybrid: (() => {
        const h = generateQuantumHybrid('test_player', 'ghost', 'cosmic', 999);
        h.traits.eyeMutation = 'tri_eye';
        h.traits.headMutation = 'quantum_antennae';
        h.traits.bodyMutation = 'ghost_body';
        h.traits.limbMutation = 'missing_hind_legs';
        h.traits.auraEffect = 'ghost';
        h.traits.tailMutation = 'spectral_tail';
        h.generatedName = 'Driftpuff';
        return h;
      })()
    },
    {
      label: '5. Aura (Cosmic Singularity & Paradox Rings)',
      file: 'nft_archetype_5_aura.svg',
      hybrid: (() => {
        const h = generateQuantumHybrid('test_player', 'cosmic', 'electric', 1337);
        h.traits.eyeMutation = 'glowing_eyes';
        h.traits.headMutation = 'two_horns';
        h.traits.bodyMutation = 'glitch_fur';
        h.traits.limbMutation = 'normal';
        h.traits.auraEffect = 'cosmic';
        h.traits.tailMutation = 'bat_wings';
        h.generatedName = 'Sparkmallow';
        return h;
      })()
    }
  ];

  for (const arch of archetypes) {
    const svg = generateDeterministicHybridSvg(arch.hybrid);
    const cid = computeDeterministicIpfsCid(svg);
    const outPath = path.join(ARTIFACT_DIR, arch.file);
    fs.writeFileSync(outPath, svg, 'utf-8');
    console.log(`✓ Saved ${arch.label} -> ${arch.file} (CID: ${cid}, Size: ${svg.length} bytes)`);
  }

  // Generate an HTML side-by-side composite review page
  const htmlRows = archetypes.map((arch) => {
    const svg = generateDeterministicHybridSvg(arch.hybrid);
    const traits = arch.hybrid.traits;
    return `
      <div style="background:#111827;border:1px solid #374151;border-radius:12px;padding:16px;margin-bottom:16px;display:flex;align-items:center;gap:24px;">
        <div style="width:160px;height:160px;flex-shrink:0;background:#0b0f19;border-radius:8px;padding:8px;border:1px solid #4b5563;">
          ${svg}
        </div>
        <div style="flex:1;color:#f3f4f6;font-family:monospace;">
          <h3 style="margin:0 0 8px 0;color:#38bdf8;">${arch.label}</h3>
          <p style="margin:4px 0;color:#a855f7;">Name: <strong>${arch.hybrid.generatedName}</strong> (${arch.hybrid.rarity.toUpperCase()})</p>
          <ul style="margin:8px 0;padding-left:20px;font-size:12px;color:#9ca3af;">
            <li>Eye Mutation: <strong>${traits.eyeMutation || 'normal'}</strong></li>
            <li>Head Mutation: <strong>${traits.headMutation || 'none'}</strong></li>
            <li>Body Mutation: <strong>${traits.bodyMutation || 'normal'}</strong></li>
            <li>Limb Mutation: <strong>${traits.limbMutation || 'normal'}</strong></li>
            <li>Tail / Wings: <strong>${traits.tailMutation || 'none'}</strong></li>
            <li>Aura Effect: <strong>${traits.auraEffect || 'none'}</strong></li>
            <li>Palette Glow: <span style="color:${traits.palette.glow}">${traits.palette.glow}</span></li>
          </ul>
        </div>
      </div>
    `;
  }).join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Schrödinger's Hamster — NFT Artwork Quality Gate</title>
        <style>body { background: #030712; color: #f9fafb; font-family: sans-serif; padding: 24px; max-width: 900px; margin: 0 auto; }</style>
      </head>
      <body>
        <h1 style="color:#facc15;">🐹 Quantum Hybrid NFT Artwork Quality Gate</h1>
        <p style="color:#9ca3af;">Side-by-side verification: in-game procedural genetics vs deterministic standalone 32x32 SVG exporter.</p>
        ${htmlRows}
      </body>
    </html>
  `;

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'nft_artwork_quality_gate.html'), fullHtml, 'utf-8');
  console.log('✓ Generated nft_artwork_quality_gate.html in artifacts directory');
}

verifyArtworkConsistency().catch(err => {
  console.error('Consistency error:', err);
  process.exit(1);
});
