-- Cloudflare D1 Migration: Quantum States Prototype
ALTER TABLE experiments ADD COLUMN state_a TEXT;
ALTER TABLE experiments ADD COLUMN state_b TEXT;
ALTER TABLE experiments ADD COLUMN ghost_sight_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE experiments ADD COLUMN ghost_sight_target TEXT;
ALTER TABLE experiments ADD COLUMN chosen_state TEXT;
