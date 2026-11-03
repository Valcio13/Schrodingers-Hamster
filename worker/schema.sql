-- Cloudflare D1 Migration for Schrödinger's Hamster
CREATE TABLE IF NOT EXISTS players (
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

CREATE TABLE IF NOT EXISTS discovered_hamsters (
  player_id TEXT NOT NULL,
  species_id TEXT NOT NULL,
  discovered_at INTEGER NOT NULL,
  discovery_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (player_id, species_id)
);

CREATE TABLE IF NOT EXISTS player_research (
  player_id TEXT NOT NULL,
  upgrade_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, upgrade_id)
);

CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  experiment_type TEXT NOT NULL,
  approach TEXT NOT NULL DEFAULT 'stable',
  status TEXT NOT NULL, -- 'running', 'completed', 'revealed'
  started_at INTEGER NOT NULL,
  finishes_at INTEGER NOT NULL,
  energy_cost INTEGER NOT NULL,
  result_outcome TEXT, -- JSON string determined at start to prevent reroll
  revealed_at INTEGER
);

CREATE TABLE IF NOT EXISTS work_claims (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  claimed_at INTEGER NOT NULL,
  from_work INTEGER NOT NULL,
  to_work INTEGER NOT NULL,
  energy_credited REAL NOT NULL,
  is_simulation INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS player_hybrids (
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

CREATE TABLE IF NOT EXISTS quantum_fate_events (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  hybrid_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_quantum_fate_player ON quantum_fate_events(player_id);
CREATE INDEX IF NOT EXISTS idx_quantum_fate_hybrid ON quantum_fate_events(hybrid_id);

CREATE TABLE IF NOT EXISTS player_incubations (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  parent1_species TEXT NOT NULL,
  parent2_species TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finishes_at INTEGER NOT NULL,
  is_live_breeding INTEGER NOT NULL DEFAULT 0,
  state_a TEXT NOT NULL,
  state_b TEXT NOT NULL,
  candidate_a TEXT NOT NULL,
  candidate_b TEXT NOT NULL,
  ghost_sight_used INTEGER NOT NULL DEFAULT 0,
  ghost_sight_target TEXT,
  chosen_state TEXT,
  resolved_hybrid_id TEXT
);
