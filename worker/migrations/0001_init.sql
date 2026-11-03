-- Cloudflare D1 Migration for Schrödinger's Hamster
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  battery_energy REAL NOT NULL DEFAULT 50.0,
  battery_capacity INTEGER NOT NULL DEFAULT 150,
  research_insight INTEGER NOT NULL DEFAULT 0,
  lab_level INTEGER NOT NULL DEFAULT 1,
  active_assistant TEXT,
  last_credited_work INTEGER NOT NULL DEFAULT 0,
  fractional_work_remainder REAL NOT NULL DEFAULT 0.0,
  completed_grand_paradox INTEGER NOT NULL DEFAULT 0
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
