-- Cloudflare D1 Migration: Web3 v1 (SIWE & Immutable Hamster NFTs)

CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS player_wallets (
  wallet_address TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  linked_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_wallets_player ON player_wallets(player_id);

CREATE TABLE IF NOT EXISTS nft_mint_authorizations (
  authorization_id TEXT PRIMARY KEY,
  specimen_id TEXT NOT NULL UNIQUE,
  player_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  token_id INTEGER NOT NULL UNIQUE,
  token_uri TEXT NOT NULL,
  metadata_hash TEXT NOT NULL,
  specimen_hash TEXT NOT NULL,
  nonce TEXT NOT NULL,
  deadline INTEGER NOT NULL,
  signature TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'authorized'
);

CREATE TABLE IF NOT EXISTS minted_nfts (
  token_id INTEGER PRIMARY KEY,
  specimen_id TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 11155111,
  contract_address TEXT NOT NULL,
  token_uri TEXT NOT NULL,
  metadata_hash TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  minted_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_minted_nfts_wallet ON minted_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_minted_nfts_specimen ON minted_nfts(specimen_id);
