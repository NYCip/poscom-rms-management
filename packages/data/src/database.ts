import Database from 'better-sqlite3';
import { readFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import type { DatabaseConfig } from '@pos.com/core';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class RMSDatabase {
  private db: Database.Database;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;

    // Ensure database directory exists
    const dbDir = dirname(config.path);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    // Open database with WAL mode for better concurrency
    this.db = new Database(config.path);

    if (config.walMode) {
      this.db.pragma('journal_mode = WAL');
    }

    // Performance optimizations
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('temp_store = MEMORY');
  }

  /**
   * Get the underlying database instance
   */
  get instance(): Database.Database {
    return this.db;
  }

  /**
   * Run a query that modifies data
   */
  run(sql: string, params: unknown[] = []): Database.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  /**
   * Get a single row
   */
  get<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  /**
   * Get all matching rows
   */
  all<T>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  /**
   * Execute raw SQL (for migrations)
   */
  exec(sql: string): void {
    this.db.exec(sql);
  }

  /**
   * Run operations in a transaction
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  /**
   * Run migrations
   */
  migrate(): void {
    // Create migrations tracking table
    this.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Get applied migrations
    const applied = new Set(
      this.all<{ name: string }>('SELECT name FROM _migrations').map((m) => m.name)
    );

    // Get migration files
    const migrationsDir = join(__dirname, 'migrations');
    if (!existsSync(migrationsDir)) {
      return;
    }

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    // Apply pending migrations
    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), 'utf-8');

      this.transaction(() => {
        this.exec(sql);
        this.run('INSERT INTO _migrations (name) VALUES (?)', [file]);
      });

      console.log(`Applied migration: ${file}`);
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Check if database is healthy
   */
  healthCheck(): boolean {
    try {
      this.get('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance for the application
let dbInstance: RMSDatabase | null = null;

export function getDatabase(config?: DatabaseConfig): RMSDatabase {
  if (!dbInstance) {
    if (!config) {
      throw new Error('Database config required for first initialization');
    }
    dbInstance = new RMSDatabase(config);
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
