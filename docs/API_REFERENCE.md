# Cloudflare Worker REST API Reference 🔌🐹

All endpoints are hosted at `/api/*` and accept/return JSON. Client identity is passed via `X-Player-ID` header or `?playerId=` query parameter.

---

## 1. System & Telemetry Endpoints

### `GET /api/telemetry`
Returns the latest live hardware telemetry from Squeekchain.
- **Request**: No parameters required.
- **Response**:
```json
{
  "rpm": 42.5,
  "currentBatchId": 1042,
  "settledCumulativeWork": 182400,
  "lastUpdated": 1730628000000,
  "freshness": "online",
  "activityPattern": "trotting"
}
```

---

## 2. Player State & Energy Endpoints

### `GET /api/state`
Retrieves the sanitized player profile, evaluates passive regeneration, and processes any pending Quantum Fate events.
- **Response**: Full `PlayerState` object with masked secret outcomes.

### `POST /api/claim-work`
Claims verified settled work units from Squeektoshi and credits battery energy + breeding charge progress.
- **Body**: `{ simulateUnits?: number }` (optional simulation units).
- **Response**:
```json
{
  "player": { ... },
  "passiveEnergyEarned": 2,
  "squeekEnergyEarned": 15,
  "deltaWorkUnits": 1500,
  "currentSettledWork": 182400,
  "telemetry": { ... }
}
```

---

## 3. Quantum Experiment Endpoints

### `POST /api/experiment/start`
Charges the battery and begins a superposition experiment.
- **Body**:
```json
{
  "experimentType": "basic" | "unstable" | "paradox" | "grand_paradox",
  "approach": "stable" | "chaotic"
}
```
- **Response**: `{ player, activeExperiment }`

### `POST /api/experiment/ghost-sight`
Activates the Ghost Hamster assistant's active ability to peek at one unrevealed eigenstate.
- **Body**: `{ target: "A" | "B" }`
- **Response**: `{ clue: string, peekOutcome: object, player }`

### `POST /api/experiment/reveal`
Collapses the superposition into physical reality based on player choice.
- **Body**: `{ chosenState: "A" | "B" }`
- **Response**: `{ player, outcome: { type, title, message, notesAwarded, hamster? } }`

---

## 4. Quantum Incubator & Genetics Endpoints

### `POST /api/incubator/start`
Initiates genetic hybridization between two discovered Base Species parents.
- **Body**:
```json
{
  "parent1Species": "electric",
  "parent2Species": "ghost"
}
```
- **Response**: `{ player, activeIncubation }`

### `POST /api/incubator/ghost-sight`
Peeks at one of the hybrid offspring candidates during incubation.
- **Body**: `{ target: "A" | "B" }`
- **Response**: `{ candidateClue: string, player }`

### `POST /api/incubator/reveal`
Observes the stabilized incubator wavefunction and hatches the chosen hybrid.
- **Body**: `{ chosenCandidate: "A" | "B" }`
- **Response**: `{ player, hybrid: QuantumHybrid }`

---

## 5. Hamster & Hybrid Management Endpoints

### `POST /api/hamsters/rename`
Renames an individual Base Hamster companion.
- **Body**: `{ hamsterId: string, nickname: string }`

### `POST /api/hamsters/favorite`
Toggles favorite protection status on a Base Hamster companion.
- **Body**: `{ hamsterId: string }`

### `POST /api/hamsters/assign-assistant`
Sets the active laboratory assistant hamster.
- **Body**: `{ hamsterId: string }`

### `POST /api/hybrids/rename`
Renames a procedural Quantum Hybrid.
- **Body**: `{ hybridId: string, nickname: string }`

### `POST /api/hybrids/favorite`
Toggles favorite status (granting 100% death immunity) on a Quantum Hybrid.
- **Body**: `{ hybridId: string }`

### `POST /api/hybrids/release`
Releases an active hybrid to the quantum field for a battery refund (15–50 E).
- **Body**: `{ hybridId: string }`

### `POST /api/hybrids/set-lab-display`
Selects an active hybrid to roam freely inside the pixel-art laboratory stage.
- **Body**: `{ hybridId: string | null }`

---

## 6. Research & Development Endpoints

### `POST /api/research/unlock`
Spends Research Notes to unlock a laboratory facility upgrade.
- **Body**: `{ upgradeId: string }`

### `POST /api/fate/trigger-test`
Development endpoint to test deterministic Quantum Fate incidents.
- **Body**: `{ type?: string, hybridId?: string }`

### `POST /api/fate/dismiss`
Clears recent incident notification popups.
- **Body**: `{}`

### `POST /api/player/reset`
Resets the player profile to clean state with optional development grant fixtures.
- **Body**:
```json
{
  "grantSpecies": ["normal", "electric", "ghost", "glitch"],
  "labLevel": 2,
  "insight": 100,
  "unlockedResearch": ["quantum_genetics"]
}
```
