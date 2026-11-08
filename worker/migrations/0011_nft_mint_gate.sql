-- Cloudflare D1 Migration: Squeekchain Next-Block Mint Gate
-- Records pending mint requests and locks eligibility until verified against settled Squeekchain blocks.

CREATE TABLE IF NOT EXISTS pending_mint_requests (
  request_id TEXT PRIMARY KEY,
  specimen_id TEXT NOT NULL UNIQUE,
  player_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  baseline_block_height INTEGER NOT NULL,
  baseline_round INTEGER NOT NULL,
  active_round_at_request INTEGER NOT NULL DEFAULT 0,
  prior_round_settled_height INTEGER,
  request_timestamp INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_block',
  qualifying_block_height INTEGER,
  qualifying_round INTEGER,
  qualifying_confirmed_at INTEGER,
  unlocked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_mint_specimen ON pending_mint_requests(specimen_id);
CREATE INDEX IF NOT EXISTS idx_pending_mint_player ON pending_mint_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_pending_mint_wallet ON pending_mint_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_pending_mint_status ON pending_mint_requests(status);
