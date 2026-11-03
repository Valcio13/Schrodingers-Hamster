-- Cloudflare D1 Migration: Battery System 2.0
ALTER TABLE players ADD COLUMN last_regen_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN fractional_regen_ms INTEGER NOT NULL DEFAULT 0;
