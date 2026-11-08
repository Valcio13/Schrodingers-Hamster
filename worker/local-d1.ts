import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration?: number;
    changes?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export class LocalD1PreparedStatement {
  constructor(
    private db: DatabaseSync,
    private query: string,
    private values: any[] = []
  ) {}

  bind(...values: any[]): LocalD1PreparedStatement {
    return new LocalD1PreparedStatement(this.db, this.query, values);
  }

  private sanitizeParam(v: any): any {
    if (v === undefined || v === null) return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const sanitized = this.values.map(v => this.sanitizeParam(v));
      const stmt = this.db.prepare(this.query);
      const row = stmt.get(...sanitized) as any;
      if (!row) return null;
      if (colName) return (row[colName] !== undefined ? row[colName] : null) as T;
      return row as T;
    } catch (err) {
      console.error(`LocalD1 first error on query [${this.query}]:`, err);
      throw err;
    }
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    try {
      const sanitized = this.values.map(v => this.sanitizeParam(v));
      const stmt = this.db.prepare(this.query);
      const rows = stmt.all(...sanitized) as T[];
      return {
        results: rows,
        success: true,
        meta: {
          rows_read: rows.length
        }
      };
    } catch (err) {
      console.error(`LocalD1 all error on query [${this.query}]:`, err);
      throw err;
    }
  }

  async run(): Promise<D1Result> {
    try {
      const sanitized = this.values.map(v => this.sanitizeParam(v));
      const stmt = this.db.prepare(this.query);
      const info = stmt.run(...sanitized);
      return {
        results: [],
        success: true,
        meta: {
          changes: Number(info.changes),
          last_row_id: Number(info.lastInsertRowid)
        }
      };
    } catch (err) {
      console.error(`LocalD1 run error on query [${this.query}]:`, err);
      throw err;
    }
  }

  async raw(): Promise<any[]> {
    const res = await this.all();
    return res.results.map(r => Object.values(r as any));
  }
}

export class LocalD1Database {
  private db: DatabaseSync;

  constructor(sqlitePath?: string) {
    const resolvedPath = sqlitePath || LocalD1Database.findOrCreateWranglerD1Path();
    this.db = new DatabaseSync(resolvedPath);
    this.ensureSchema();
  }

  static findOrCreateWranglerD1Path(): string {
    const d1Dir = path.resolve(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
    if (fs.existsSync(d1Dir)) {
      const files = fs.readdirSync(d1Dir);
      const sqliteFile = files.find(f => f.endsWith('.sqlite') && !f.includes('metadata'));
      if (sqliteFile) {
        return path.join(d1Dir, sqliteFile);
      }
    }
    // Fallback: create persistent local dev d1 directory
    fs.mkdirSync(d1Dir, { recursive: true });
    return path.join(d1Dir, 'local-d1-placeholder.sqlite');
  }

  private ensureSchema() {
    try {
      // Check if players table exists
      const stmt = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='players'");
      const exists = stmt.get();
      if (!exists) {
        // Run migrations
        const migrationsDir = path.resolve(process.cwd(), 'worker/migrations');
        if (fs.existsSync(migrationsDir)) {
          const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
          for (const file of files) {
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
            this.db.exec(sql);
          }
        }
      } else {
        // Run forward-only column migrations idempotently
        try { this.db.exec('ALTER TABLE players ADD COLUMN save_revision INTEGER NOT NULL DEFAULT 1;'); } catch {}
        try { this.db.exec('ALTER TABLE players ADD COLUMN save_lineage_id TEXT;'); } catch {}
        try { this.db.exec('ALTER TABLE players ADD COLUMN last_restored_backup_id TEXT;'); } catch {}
        try { this.db.exec('ALTER TABLE pending_mint_requests ADD COLUMN active_round_at_request INTEGER NOT NULL DEFAULT 0;'); } catch {}
        try { this.db.exec('ALTER TABLE pending_mint_requests ADD COLUMN prior_round_settled_height INTEGER;'); } catch {}
        try {
          this.db.exec(`
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
          `);
        } catch {}
      }
    } catch (err) {
      console.warn('LocalD1 ensureSchema warning:', err);
    }
  }

  prepare(query: string): LocalD1PreparedStatement {
    return new LocalD1PreparedStatement(this.db, query);
  }

  async batch(statements: LocalD1PreparedStatement[]): Promise<D1Result[]> {
    this.db.exec('BEGIN TRANSACTION');
    try {
      const results: D1Result[] = [];
      for (const stmt of statements) {
        results.push(await stmt.run());
      }
      this.db.exec('COMMIT');
      return results;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  async exec(query: string): Promise<D1ExecResult> {
    const start = Date.now();
    this.db.exec(query);
    return {
      count: 1,
      duration: Date.now() - start
    };
  }
}

export function createLocalD1Database(): LocalD1Database {
  return new LocalD1Database();
}
