# Schrödinger's Hamster 🐹⚛️⚡

squeekchain-project: 9b0a28e7-11f6-48d5-8e92-58cf8954b8e8

> **A charming, quantum laboratory idle-interactive game powered by real-world physical hamster athletics on Squeekchain.**  
> *Cozy Pixel Art × Mad Scientist Cyber-Laboratory × Cute Cosmic Horror*

[![Version](https://img.shields.io/badge/Version-1.0%20Joy%20of%20Discovery-purple.svg)](docs/GAMEPLAY_GUIDE.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20D1-f38020.svg)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

**Schrödinger's Hamster** bridges real-world physical biology and digital quantum simulation. A cyber-pixel laboratory is energized by **Squeektoshi**, a real living hamster running on an exercise wheel monitored by hardware Hall sensors (Raspberry Pi RP2040) and cryptographically signed via Infineon OPTIGA™ Trust M secure elements.

Players harness verified physical kinetic energy to power quantum chambers, synthesize cross-species procedural hybrids, research cosmic upgrades, and navigate the mysterious unpredictability of **Schrödinger's Paradox**.

---

## 🎮 Key Gameplay Systems

### 1. ⚡ Battery System 2.0
- **Passive Laboratory Regeneration**: The facility regenerates **+1 Battery Energy per minute** continuously, including **offline** when the browser is closed. Starting capacity: **150 E** (expandable to 600 E).
- **Squeekchain Work Bonus**: Every **100 verified settled work units** from Squeektoshi converts to **+1 instant Battery Energy** claimed directly from the dynamo.

### 2. 🔬 Quantum Observation & Dual-State Collapse
- Experiments generate wavefunctions in **superposition** with two distinct eigenstates: **STATE A** and **STATE B**.
- Examine stability indices, energy spectra, and mutation probabilities before manually collapsing your chosen state. The unobserved candidate vanishes forever.
- **Ghost Hamster Ability ("Quantum Sight")**: When Ghost Hamster is assigned as your active laboratory assistant, activate **Quantum Sight** to peek at hidden outcome data before choosing!

### 3. 🐹 6 Base Hamster Species
Discover and collect all 6 permanent Base Species, each offering distinct passive laboratory perks:
- **Normal Hamster** (*Common*): *Steady Paws* — 10% chance to recover 5 Research Notes on any experiment.
- **Electric Hamster** (*Uncommon*): *Voltage Booster* — Cuts all experiment battery costs by 15%.
- **Ghost Hamster** (*Rare*): *Quantum Sight* — Active ability to peek at unobserved wavefunctions.
- **Glitch Hamster** (*Rare*): *Anomaly Magnet* — +20% chance for rare species or exotic outcomes.
- **Plasma Hamster** (*Epic*): *Thermal Velocity* — Decreases experiment wait times by 40%.
- **Paradox Hamster** (*Legendary*): *Quantum Mastery* — +20% Research Notes & 10% lower experiment costs.

### 4. 🧬 Quantum Genetics & Incubator
Cross-breed discovered Base Hamsters in the **Quantum Incubator** (unlocked at Lab Level 2) to produce procedurally generated **Quantum Hybrids**:
- **Deterministic PRNG**: Every offspring genome is synthesized via Mulberry32 pseudo-random generation.
- **Phenotypic Variation**: Dynamic inheritance of body shapes (`chubby`, `sleek`, `round`), ear morphology (`tufted`, `pointed`, `droopy`), fur patterns (`striped`, `piebald`, `constellation`), interpolated RGB palettes, and quantum effects (`spark_halo`, `plasma_glow`, `paradox_rings`).
- **Cosmetic Mutations**: Chance to roll rare mutations such as `antenna`, `tiny_horns`, `energy_wings`, or `floating_orbs`.
- **Rarity Spectrum**: Common (50%), Uncommon (25%), Rare (15%), Epic (7%), Legendary (2.5%), and Mythic (0.5%).

### 5. ⏳ Quantum Fate & Memorial Archive
Procedural hybrids are delicate wavefunctions subject to intermittent reality shifts:
- **Unobserved Disappearance**: Hybrids may temporarily slip into the quantum void (1–24 hour absence).
- **Returned Changed**: When returning from the void, hybrids have a 35% chance to emerge permanently altered with exotic cosmetic mutations.
- **Favorite Protection (⭐)**: Marking any hybrid as a Favorite grants **100% immunity** against permanent decoherence.
- **Protection Guarantees**: Base Hamsters, Legendary/Mythic tiers, and Newborns (<7 days) are strictly immune to permanent death.
- **Memorial Archive**: Deceased specimens are permanently commemorated in the Memorial Archive with their full chronological incident history.

### 6. 🌟 The Grand Paradox Finale
Reach Lab Level 3, charge 150 Energy into the harmonic chamber, and collapse the master wavefunction to rescue **Schrödinger**, the legendary Paradox Hamster!

### 7. 🖥️ Compact Game HUD (Zero-Scroll Desktop)
- Reorganizes desktop screens into a **Main Stage** and **Compact Right-Side HUD** (230–250px).
- Tested and verified for **100% no-scroll gameplay** across 1080p, 900p, 768p, and 720p desktop displays.
- Seamlessly collapses into a touch-friendly 2-column dock on mobile devices.

### 8. ✨ Polished QuantumDex Encyclopedia
- Hamsters are the stars of the collection! Features **50% larger portraits** (`size="lg"`, 84px) in dedicated framed stages with crisp nearest-neighbor pixel art (`imageRendering: 'pixelated'`).
- Species-specific ambient glowing auras (Normal amber, Electric yellow, Ghost cyan, Glitch pink, Plasma violet, Paradox cosmic lime).
- Authentic **mystery silhouettes** and reticle lock indicators for undiscovered wavefunctions.
- **Specimen Spotlight Modal** showcasing a **130px Hero-sized hybrid** on a glowing holographic pedestal.

---

## 📚 Technical Documentation Index

Detailed technical specifications and architectural guides are available in the [`docs/`](docs/) directory:

- [**System Architecture (`docs/ARCHITECTURE.md`)**](docs/ARCHITECTURE.md)  
  *Hardware sensors (RP2040 + Infineon Trust-M), telemetry pipeline, edge worker design, and Cloudflare D1 database schemas.*
- [**Gameplay & Field Guide (`docs/GAMEPLAY_GUIDE.md`)**](docs/GAMEPLAY_GUIDE.md)  
  *Comprehensive player manual covering battery mechanics, experiment tiers, chamber approaches, base perks, and the Grand Paradox.*
- [**Quantum Genetics & Fate Specification (`docs/QUANTUM_GENETICS_AND_FATE.md`)**](docs/QUANTUM_GENETICS_AND_FATE.md)  
  *Complete specification of Mulberry32 PRNG, genetic trait inheritance, rarity probability distribution, and Quantum Fate state machine.*
- [**Worker REST API Reference (`docs/API_REFERENCE.md`)**](docs/API_REFERENCE.md)  
  *Endpoint schemas, request/response payloads, and authentication headers for all `/api/*` endpoints.*
- [**Testing & Verification Guide (`docs/TESTING_AND_VERIFICATION.md`)**](docs/TESTING_AND_VERIFICATION.md)  
  *Automated test suites, CDP headless viewport verification scripts, and regression benchmarks.*

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

```bash
# 1. Clone repository
git clone https://github.com/your-username/schrodingers-hamster.git
cd schrodingers-hamster

# 2. Install dependencies
npm install

# 3. Start local development server (Frontend + Worker API)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The embedded Cloudflare Worker middleware automatically simulates `/api/*` routes and telemetry in-memory for local offline development.

---

## 🧪 Testing & Verification

Run the full automated test suite to verify math, game mechanics, and genetics:

```bash
# 1. TypeScript static analysis
npx tsc --noEmit

# 2. Production asset build
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

## ☁️ Cloudflare Deployment (Workers + D1)

```bash
# 1. Authenticate with Cloudflare Wrangler
npx wrangler login

# 2. Create D1 database
npx wrangler d1 create schrodingers-hamster-db

# 3. Apply SQL migrations
npx wrangler d1 migrations apply schrodingers-hamster-db --remote

# 4. Build and deploy edge worker
npm run deploy
```

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Vite](https://vitejs.dev/)
- **Icons & Graphics**: [Lucide React](https://lucide.dev/), Handcrafted nearest-neighbor SVG pixel art grids
- **Audio Engine**: Native Web Audio API 8-bit oscillator synthesizer
- **Backend / Edge**: [Cloudflare Workers](https://workers.cloudflare.com/), [Cloudflare D1 SQL](https://developers.cloudflare.com/d1/)
- **Hardware Integration**: Raspberry Pi RP2040 Hall-Effect Sensors, Infineon OPTIGA™ Trust M secure element, Squeekchain verified telemetry feed

---

## 📄 License

MIT © Schrödinger's Hamster Contributors & Squeekchain Ecosystem.
