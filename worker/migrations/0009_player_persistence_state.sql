-- Cloudflare D1 Migration: Player State Full Persistence & Auth Sessions

ALTER TABLE players ADD COLUMN state_json TEXT;
ALTER TABLE players ADD COLUMN total_experiments_conducted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN active_assistant_hamster_id TEXT;
ALTER TABLE players ADD COLUMN hybrid_capacity_bonus INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN research_mastery_level INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS auth_sessions (
  token TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  player_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_player ON auth_sessions(player_id);
