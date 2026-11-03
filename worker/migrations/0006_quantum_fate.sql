-- Cloudflare D1 Migration: Quantum Fate
ALTER TABLE player_hybrids ADD COLUMN existence_status TEXT NOT NULL DEFAULT 'alive';
ALTER TABLE player_hybrids ADD COLUMN missing_since INTEGER;
ALTER TABLE player_hybrids ADD COLUMN expected_return_at INTEGER;
ALTER TABLE player_hybrids ADD COLUMN last_fate_incident_at INTEGER;
ALTER TABLE player_hybrids ADD COLUMN fate_cosmetic_traits TEXT;

ALTER TABLE players ADD COLUMN last_fate_roll_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN last_serious_incident_at INTEGER NOT NULL DEFAULT 0;

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
