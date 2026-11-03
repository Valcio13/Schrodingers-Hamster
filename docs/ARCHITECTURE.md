# System Architecture — Schrödinger's Hamster 🐹⚡

This document details the software architecture, data flow, cryptographic telemetry pipeline, client-server contract, and database schemas powering **Schrödinger's Hamster**.

---

## 1. High-Level Architecture Overview

Schrödinger's Hamster is an edge-first, zero-wallet Web3-integrated web game running on **Cloudflare Workers** and **React 19** with **Tailwind CSS v4**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHYSICAL TELEMETRY LAYER                        │
│                                                                        │
│   Living Hamster (Squeektoshi)                                         │
│            │ (Runs on exercise wheel)                                  │
│            ▼                                                           │
│   Hardware Sensors (RP2040 Hall Sensor @ 25Hz)                        │
│            │                                                           │
│            ▼                                                           │
│   Hardware Security Module (Infineon Trust-M Cryptographic Signing)    │
│            │                                                           │
│            ▼                                                           │
│   Squeekchain Network (Settled Cumulative Work Batches)               │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS JSON Telemetry Feed
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      EDGE API & WORKER ENGINE                          │
│                                                                        │
│   Cloudflare Worker (worker/index.ts)                                  │
│   ├── Squeekchain Ingestion (worker/squeekchain.ts)                    │
│   ├── Game Logic Engine (worker/gameLogic.ts)                          │
│   │   ├── Battery 2.0 (Dual Passive + Settled Work)                    │
│   │   ├── Quantum Chamber Eigenstate Collapse (A vs B)                 │
│   │   ├── Quantum Genetics PRNG Synthesizer                            │
│   │   └── Quantum Fate & Memorial State Machine                        │
│   └── Cloudflare D1 Relational Storage (worker/schema.sql)             │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST JSON API (/api/*)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND PRESENTATION LAYER                        │
│                                                                        │
│   Single Page Application (React 19 + TypeScript + Vite)               │
│   ├── Viewport Shell (Compact Desktop Right-Side HUD / Mobile Dock)    │
│   ├── Pixel-Art Laboratory Stage (LabEnvironment.tsx)                  │
│   │   ├── Approved Machinery (Dynamo, Kinetic Runner, Chamber)         │
│   │   └── Interactive Hotspots & Audio Synthesizer (audio.ts)         │
│   ├── Modals & Stations                                                │
│   │   ├── ExperimentStation.tsx (Dual Eigenstate Collapse)             │
│   │   ├── QuantumIncubator.tsx (Breeding & Work Progress)              │
│   │   ├── ResearchNotebook.tsx (Laboratory Upgrades)                  │
│   │   ├── QuantumDex.tsx (Collectible Hamster Encyclopedia)           │
│   │   └── HowToPlayModal.tsx (Field Guide Manual)                      │
│   └── Pixel Rendering Components (PixelHamster.tsx, PixelHybrid.tsx)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Telemetry Pipeline: Hardware to Gameplay

### 2.1 Hardware Sensor Specifications
- **Host**: Microcontroller (Raspberry Pi RP2040).
- **Sensor**: Bi-directional Hall-effect magnetic sensor attached to the wheel axle.
- **Sampling Rate**: 25 Hz edge detection.
- **Hardware Cryptography**: Infineon OPTIGA™ Trust M secure element cryptographically signs wheel revolution batches with ECDSA.

### 2.2 Squeekchain Data Contract
The worker polls the official Squeekchain telemetry endpoint:
```typescript
interface SqueekTelemetry {
  rpm: number;                          // Current rotational speed
  currentBatchId: number;               // Monotonic batch index
  settledCumulativeWork: number;        // Total cryptographically settled distance
  lastUpdated: number;                  // Millisecond epoch timestamp
  freshness: 'online' | 'lagging' | 'stale';
  activityPattern: 'resting' | 'trotting' | 'sprinting';
}
```

### 2.3 Gameplay Conversion Mechanics
1. **Battery Energy Credit**:
   $$\Delta \text{Energy} = \left\lfloor \frac{\Delta \text{SettledWork}}{100} \right\rfloor$$
   Fractional work remainders are persisted between claims.
2. **Breeding Charge Accumulation**:
   $$\text{Charge Progress} = \Delta \text{SettledWork} \pmod{2000}$$
   Every $2{,}000$ settled units generates $+1$ Stored Breeding Charge (up to $3$ max charges).
3. **Live Sprinting Breeding**:
   When Squeektoshi runs at $\ge 40\text{ RPM}$, players can perform **Live Co-op Breeding** with zero stored charge consumption (subject to a 30-minute cooldown).

---

## 3. Edge Worker & Game Logic Layer

The worker (`worker/index.ts` and `worker/gameLogic.ts`) executes state transitions deterministically:

### 3.1 Passive Regeneration Algorithm
Players regenerate $+1\text{ Battery Energy}$ per 60 seconds (offline-capable).
```typescript
function applyPassiveRegeneration(player: PlayerState, now: number): number {
  const elapsedMs = Math.max(0, now - player.lastRegenAt) + player.fractionalRegenMs;
  const minutes = Math.floor(elapsedMs / 60000);
  player.fractionalRegenMs = elapsedMs % 60000;
  player.lastRegenAt = now;
  
  if (minutes > 0 && player.batteryEnergy < player.batteryCapacity) {
    const space = player.batteryCapacity - player.batteryEnergy;
    const gained = Math.min(minutes, space);
    player.batteryEnergy += gained;
    return gained;
  }
  return 0;
}
```

### 3.2 Dual-State Observation Protocol
Experiments do not roll results upon claim; they generate two distinct quantum eigenstates at start:
- **State A**: e.g., High-stability baseline outcome.
- **State B**: e.g., High-energy exotic outcome.
The unobserved candidate is permanently discarded upon player collapse. If the player possesses the **Ghost Hamster**, they may use `Quantum Sight` to inspect the hidden outcome of one state before committing.

### 3.3 Quantum Genetics PRNG Engine
Offspring genomes are generated using a deterministic Mulberry32 Pseudo-Random Number Generator keyed by `seed`:
```typescript
function createPrng(seed: number): () => number {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```
This guarantees identical traits across all clients and prevents re-roll manipulation.

---

## 4. Database Schema (Cloudflare D1)

```sql
-- Core Player Profile
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  battery_energy REAL NOT NULL DEFAULT 100.0,
  battery_capacity INTEGER NOT NULL DEFAULT 150,
  research_insight INTEGER NOT NULL DEFAULT 5,
  lab_level INTEGER NOT NULL DEFAULT 1,
  active_assistant TEXT,
  last_credited_work INTEGER NOT NULL DEFAULT 0,
  fractional_work_remainder REAL NOT NULL DEFAULT 0.0,
  completed_grand_paradox INTEGER NOT NULL DEFAULT 0,
  last_regen_at INTEGER NOT NULL DEFAULT 0,
  fractional_regen_ms INTEGER NOT NULL DEFAULT 0,
  breeding_charges INTEGER NOT NULL DEFAULT 0,
  breeding_charge_progress INTEGER NOT NULL DEFAULT 0,
  last_live_breeding_at INTEGER NOT NULL DEFAULT 0,
  active_lab_hybrid_id TEXT,
  last_fate_roll_at INTEGER NOT NULL DEFAULT 0,
  last_serious_incident_at INTEGER NOT NULL DEFAULT 0
);

-- Discovered Base Species
CREATE TABLE discovered_hamsters (
  player_id TEXT NOT NULL,
  species_id TEXT NOT NULL,
  discovered_at INTEGER NOT NULL,
  discovery_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (player_id, species_id)
);

-- Procedural Quantum Hybrids
CREATE TABLE player_hybrids (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  generator_version INTEGER NOT NULL DEFAULT 1,
  seed INTEGER NOT NULL,
  parent1_species TEXT NOT NULL,
  parent2_species TEXT NOT NULL,
  nickname TEXT NOT NULL,
  personality TEXT NOT NULL,
  rarity TEXT NOT NULL,
  discovered_at INTEGER NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  traits TEXT NOT NULL,
  existence_status TEXT NOT NULL DEFAULT 'alive',
  missing_since INTEGER,
  expected_return_at INTEGER,
  last_fate_incident_at INTEGER,
  fate_cosmetic_traits TEXT
);

-- Chronological Quantum Fate Timeline
CREATE TABLE quantum_fate_events (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  hybrid_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata TEXT
);
```

---

## 5. Frontend UI/UX Architecture

- **Viewport Clamping**: Desktop utilizes a **Compact Right-Side HUD** (230–250px) alongside the laboratory stage with strict `calc(100vh - 160px)` bounds to ensure zero vertical page scrolling at 1080p, 900p, 768p, and 720p.
- **Pixel Art Integrity**: All sprites leverage SVG vector grids rendered with `imageRendering: 'pixelated'`, completely avoiding fuzzy bilinear interpolation.
- **Retro Audio Engine**: Web Audio API oscillator synthesizer generating clicks, chimes, quantum hums, and fanfare without external audio asset downloads.
