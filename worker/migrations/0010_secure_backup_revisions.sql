-- Cloudflare D1 Migration: Secure Monotonic Save Revisions & Anti-Duplication Lineage

ALTER TABLE players ADD COLUMN save_revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE players ADD COLUMN save_lineage_id TEXT;
ALTER TABLE players ADD COLUMN last_restored_backup_id TEXT;

CREATE TABLE IF NOT EXISTS consumed_backups (
  backup_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  lineage_id TEXT NOT NULL,
  save_revision INTEGER NOT NULL,
  consumed_at INTEGER NOT NULL,
  restored_to_player_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consumed_backups_player ON consumed_backups(player_id);
CREATE INDEX IF NOT EXISTS idx_consumed_backups_lineage ON consumed_backups(lineage_id);
