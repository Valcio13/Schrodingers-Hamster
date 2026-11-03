# Testing & Verification Guide 🧪✅

This guide documents the automated test suites, regression test scripts, headless browser verification procedures, and quality benchmarks for **Schrödinger's Hamster**.

---

## 1. Automated Test Suites

All game mechanics and mathematical formulas are backed by comprehensive automated test suites located in `scratch/`:

```
scratch/
├── test_battery_v2.cjs          # Battery 2.0 dual charging & cap enforcement
├── test_quantum_collection.cjs   # Base species discovery, migration & perks
├── test_quantum_genetics.cjs     # 20 genetic incubator, PRNG & rarity tests
└── test_quantum_fate.cjs         # 20 Quantum Fate lifecycle & protection tests
```

### Running Test Suites

```bash
# 1. Typecheck TypeScript
npx tsc --noEmit

# 2. Production Build Verification
npm run build

# 3. Battery System 2.0 Tests
node scratch/test_battery_v2.cjs

# 4. Quantum Collection & Assistant Tests
npx tsx scratch/test_quantum_collection.cjs

# 5. Quantum Genetics & Incubation Suite (20 Tests)
npx tsx scratch/test_quantum_genetics.cjs

# 6. Quantum Fate & Memorial Archive Suite (20 Tests)
npx tsx scratch/test_quantum_fate.cjs
```

---

## 2. Test Suite Details

### 2.1 Battery System 2.0 (`test_battery_v2.cjs`)
Verifies:
- Baseline starting battery initialization (100 E energy / 150 E capacity).
- Passive regeneration rate (+1 E per minute) offline & online.
- Squeekchain settled work conversion (100 units = 1 E).
- Capacity cap clamping (no overflow past max capacity).
- Experiment battery deductions & rebalanced costs.

### 2.2 Quantum Collection (`test_quantum_collection.cjs`)
Verifies:
- Starter companion creation (`Squeeky`, Curious Normal Hamster).
- Legacy player migration backfill.
- Outcome generation & observation state binding.
- Ghost Sight clue generation for undiscovered wavefunctions.
- 30-specimen collection capacity and duplicate transmutation.
- Grand Paradox finale companion creation (`Schrödinger`).

### 2.3 Quantum Genetics (`test_quantum_genetics.cjs`)
Verifies:
- Base Hamsters cannot be released (permanent companions).
- Base-only breeding constraints.
- Parent ownership validation.
- Superposition generation: State A and State B persist without reroll upon refresh.
- Deterministic PRNG reproduction (same seed yields 100% identical traits).
- Rarity distribution verification over 20,000 rolls (50% Common, 25% Uncommon, 15% Rare, 7% Epic, 2.5% Legendary, 0.5% Mythic).
- Stored breeding charge accumulation (2,000 units = 1 charge, max 3).
- Live sprinting free breeding (0 charges consumed when RPM $\ge 40$).
- 30-minute live breeding cooldown.
- Release refunds (15–50 E) and duplicate release prevention.

### 2.4 Quantum Fate (`test_quantum_fate.cjs`)
Verifies:
- Base Hamsters are 100% immune to all Quantum Fate incidents.
- Only procedural hybrids can receive fate rolls.
- Legendary and Mythic hybrids never permanently die.
- Favorite protection (⭐) guarantees 100% immunity against permanent death.
- Newborn protection (<7 days) guarantees immunity against permanent death.
- 24h player roll cooldown and 3-day per-hybrid cooldowns.
- Offline laziness: single-batch catch-up prevents incident storms.
- Missing status persistence and absence time windows.
- Missing hamsters cannot be released or assigned to lab display.
- Guaranteed return timing and "Returned Changed" cosmetic mutations.
- Deceased hamsters permanently archived in Memorial without consuming active capacity.
- "Impossible Return" miracle revival mechanics.

---

## 3. Visual & Viewport Verification (Headless Chrome/Edge)

Visual presentation is strictly validated using Chrome DevTools Protocol (CDP) scripts against Microsoft Edge / Chromium across standard screen resolutions:

| Viewport | Resolution | Category | Target Layout | Success Criteria |
| :--- | :---: | :--- | :--- | :--- |
| **Large Desktop** | **1920 × 1080** | 1080p | Right-Side HUD | `scrollY == 0` (No Scroll) |
| **Standard Desktop**| **1600 × 900** | 900p | Right-Side HUD | `scrollY == 0` (No Scroll) |
| **Laptop / Compact**| **1366 × 768** | 768p | Right-Side HUD | `scrollY == 0` (No Scroll) |
| **Compact Desktop** | **1280 × 720** | 720p | Right-Side HUD | `scrollY == 0` (No Scroll) |
| **Mobile Phone** | **390 × 844** | iPhone 12/13/14 | 2-Column Bottom Dock | Clean vertical flow, 0 horizontal overflow |

### Headless CDP Script Example
```javascript
const { spawn } = require('child_process');
const edge = spawn('msedge.exe', ['--headless', '--remote-debugging-port=9222']);
// Navigate to http://localhost:3000 and capture full page screenshots
```
Verification scripts are located in `scratch/verify_viewports_hud.cjs` and `scratch/capture_dex_after.cjs`.
