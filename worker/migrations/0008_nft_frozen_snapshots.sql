-- Cloudflare D1 Migration: Web3 v1 Frozen Collectible Snapshots & IPFS Verification
-- Ensures once an NFT is prepared/minted, its attributes, traits, artwork, and metadata are 100% immutable.

CREATE TABLE IF NOT EXISTS nft_frozen_snapshots (
  specimen_id TEXT PRIMARY KEY,
  token_id INTEGER NOT NULL UNIQUE,
  player_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  personality TEXT NOT NULL,
  parent1_species TEXT NOT NULL,
  parent2_species TEXT NOT NULL,
  seed INTEGER NOT NULL,
  traits_json TEXT NOT NULL,
  artwork_cid TEXT NOT NULL,
  artwork_hash TEXT NOT NULL,
  metadata_cid TEXT NOT NULL,
  metadata_hash TEXT NOT NULL,
  token_uri TEXT NOT NULL,
  specimen_hash TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'pinata',
  verified_at INTEGER NOT NULL,
  frozen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_frozen_snapshots_token ON nft_frozen_snapshots(token_id);
CREATE INDEX IF NOT EXISTS idx_frozen_snapshots_wallet ON nft_frozen_snapshots(wallet_address);
