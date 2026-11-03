# Quantum Genetics & Quantum Fate Specification 🧬⚛️

This technical specification details the procedural generation algorithms, phenotypic inheritance rules, rarity distribution math, and Quantum Fate lifecycle states powering **Schrödinger's Hamster**.

---

## 1. Procedural Hybrid Genetics Engine

When two discovered Base Species hamsters are placed into the Quantum Incubator, their genetic profiles combine via deterministic pseudo-random inheritance.

### 1.1 Genetic Trait Space

| Trait Category | Variants | Inheritance Source |
| :--- | :--- | :--- |
| **Body Shape** | `standard`, `chubby`, `sleek`, `round` | Inherited with mutation chance |
| **Ear Shape** | `round`, `tufted`, `pointed`, `droopy` | 50% Parent 1 / 50% Parent 2 |
| **Fur Pattern** | `solid`, `spotted`, `striped`, `piebald`, `gradient`, `constellation` | Blended dominance table |
| **Palette Colors** | Body, Dark, Light, Accent, Glow | Interpolated RGB vector blend of parents |
| **Eye Color** | Hex color value | Inherited with quantum hue shift |
| **Quantum Effect** | `none`, `spark_halo`, `ghost_shimmer`, `glitch_flicker`, `plasma_glow`, `paradox_rings`, `cosmic_singularity` | Tied to species energy resonance |
| **Cosmetic Mutation**| `none`, `antenna`, `tiny_horns`, `energy_wings`, `floating_orbs`, `halo` | Rare mutation roll (5–15%) |

### 1.2 Deterministic Mulberry32 PRNG
To prevent client-side save manipulation, offspring traits are deterministically generated from an integer seed derived from player ID, parent species IDs, and timestamp:

```typescript
function rollHybridTraits(
  parent1Species: string,
  parent2Species: string,
  seed: number,
  forcedRarity?: HybridRarity
): { traits: HybridCosmeticTraits; rarity: HybridRarity } {
  const prng = createPrng(seed);
  const rarity = forcedRarity || rollHybridRarity(prng);
  // Deterministic trait selection ...
}
```

### 1.3 Rarity Tier Probabilities
Every incubation rolls hybrid rarity according to the following probability distribution:

| Rarity Tier | Probability | Visual Identity |
| :--- | :---: | :--- |
| **Common** | **50.0%** | Slate frame, clean baseline traits |
| **Uncommon** | **25.0%** | Emerald aura, subtle pattern mutations |
| **Rare** | **15.0%** | Cyan glow (`rgba(6,182,212,0.25)`), quantum effect |
| **Epic** | **7.0%** | Purple pulse (`rgba(168,85,247,0.35)`), animated particle effect |
| **Legendary** | **2.5%** | Amber gleam animation (`anim-legendary-gleam`), cosmetic mutation |
| **Mythic** | **0.5%** | Cosmic starlight animation (`anim-mythic-cosmic`), dual mutations |

Verified distribution over 20,000 automated rolls:
- Common: ~50.2%
- Uncommon: ~25.1%
- Rare: ~15.0%
- Epic: ~6.8%
- Legendary: ~2.4%
- Mythic: ~0.5%

---

## 2. Quantum Fate State Machine ⏳

Procedural hybrids are uncollapsed physical wavefunctions subject to intermittent reality fluctuations.

```
                    ┌──────────────┐
                    │    ALIVE     │◄─────────────────┐
                    └──────┬───────┘                  │
                           │                          │
              Absence Event│(5% per check)            │
                           ▼                          │
                    ┌──────────────┐                  │
                    │   MISSING    │                  │
                    │ (Unobserved) │                  │
                    └──────┬───────┘                  │
                           │                          │
        ┌──────────────────┼──────────────────┐       │
        │                  │                  │       │
        ▼                  ▼                  ▼       │
   [Standard Return] [Returned Changed]  [Decoherence]│
        │                  │                  │       │
        │                  │ (+New Mutation)  │       │
        └──────────────────┼──────────────────┘       │
                           │                          │
                           │ 90% (or protected)       │
                           └──────────────────────────┘
                           │
                           │ 10% (only if unprotected)
                           ▼
                    ┌──────────────┐
                    │   DECEASED   │
                    │  (Memorial)  │
                    └──────────────┘
```

### 2.1 State Definitions
1. **ALIVE / COHERENT**: The hybrid is happily residing in your sanctuary, available for petting, lab display, or rename.
2. **MISSING / UNOBSERVED**: The hybrid has temporarily slipped through the floorboards of physical spacetime into the quantum void.
   - Visual: Semi-transparent grayscale glitch pulse.
   - Rules: Cannot be set to lab display; cannot be released.
3. **RETURNED / CHANGED**: The hybrid returns safely after 1–24 hours. There is a **35% chance** it returns permanently transformed with a new cosmetic mutation (e.g. tiny horns, energy wings).
4. **DECEASED (MEMORIAL ARCHIVE)**: The hybrid has permanently decohered into quantum vacuum fluctuations.
   - Deceased hamsters are **never deleted**.
   - They do not occupy active sanctuary capacity (30 max).
   - Preserved forever in the **Memorial Archive** tab with their full chronological incident history.

### 2.2 Immunity & Protection Guarantees
To prevent frustrating player loss, strict safeguards are enforced:
- **Base Hamsters are 100% IMMUNE**: The 6 Base Species hamsters can NEVER go missing or die.
- **Favorite Protection**: Any hybrid favorited (marked with a Star ⭐) is **100% IMMUNE** to permanent death.
- **Newborn Protection**: Hybrids discovered within the last **7 days** cannot die.
- **Tier Immunity**: **Legendary** and **Mythic** hybrids can NEVER permanently die (maximum 24h absence before guaranteed return).
- **Incident Cooldowns**: Maximum 1 incident check per 24 hours per player, and 3-day minimum cooldown per hybrid.

---

## 3. Incident History Timeline

Every notable event in a hybrid's lifecycle is appended to its `fateHistory` array:
```typescript
interface QuantumFateIncident {
  id: string;
  hybridId: string;
  type: 'hatched' | 'disappeared' | 'returned' | 'returned_changed' | 'deceased' | 'impossible_return';
  timestamp: number;
  title: string;
  description: string;
  metadata?: {
    traitAdded?: string;
    absenceDurationMs?: number;
  };
}
```
Players can inspect this complete chronological log anytime via the **Specimen Spotlight Modal** or the **Memorial Archive**.
