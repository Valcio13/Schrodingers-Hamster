-- Cloudflare D1 Migration: Quantum Genetics & Procedural Hybrids
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
  traits TEXT NOT NULL
);

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

ALTER TABLE players ADD COLUMN breeding_charges INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN breeding_charge_progress INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN last_live_breeding_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN active_lab_hybrid_id TEXT;
