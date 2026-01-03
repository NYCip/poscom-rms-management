import type { RMSDatabase } from '../database';
import { generateId, type Result, ok, err } from '@pos.com/core';

export class OptimisticLockError extends Error {
  constructor(
    public readonly entityId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number
  ) {
    super(
      `Optimistic lock failed for ${entityId}: expected version ${expectedVersion}, found ${actualVersion}`
    );
    this.name = 'OptimisticLockError';
  }
}

export interface BaseEntity {
  id: string;
  version?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

export abstract class BaseRepository<T extends BaseEntity, CreateInput, UpdateInput> {
  protected db: RMSDatabase;
  protected tableName: string;
  protected idPrefix: string;

  constructor(db: RMSDatabase, tableName: string, idPrefix: string) {
    this.db = db;
    this.tableName = tableName;
    this.idPrefix = idPrefix;
  }

  /**
   * Generate a new ID for this entity type
   */
  protected generateId(): string {
    return generateId(this.idPrefix);
  }

  /**
   * Find entity by ID
   */
  findById(id: string): T | undefined {
    const row = this.db.get<Record<string, unknown>>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return row ? this.rowToEntity(row) : undefined;
  }

  /**
   * Find all entities with optional filtering
   */
  findAll(options: QueryOptions = {}): T[] {
    const { limit = 100, offset = 0, orderBy = 'created_at', orderDir = 'DESC' } = options;

    const rows = this.db.all<Record<string, unknown>>(
      `SELECT * FROM ${this.tableName} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Count total entities
   */
  count(): number {
    const result = this.db.get<{ count: number }>(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    return result?.count ?? 0;
  }

  /**
   * Create a new entity
   */
  abstract create(input: CreateInput): Result<T, Error>;

  /**
   * Update an entity with optimistic locking
   */
  abstract update(id: string, input: UpdateInput, expectedVersion?: number): Result<T, Error>;

  /**
   * Delete an entity by ID
   */
  delete(id: string): Result<boolean, Error> {
    try {
      const result = this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
      return ok(result.changes > 0);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if entity exists
   */
  exists(id: string): boolean {
    const result = this.db.get<{ exists: number }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = ?) as exists`,
      [id]
    );
    return result?.exists === 1;
  }

  /**
   * Convert database row to entity
   */
  protected abstract rowToEntity(row: Record<string, unknown>): T;

  /**
   * Convert entity to database row
   */
  protected abstract entityToRow(entity: Partial<T>): Record<string, unknown>;

  /**
   * Parse date from database
   */
  protected parseDate(value: unknown): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'number') return new Date(value);
    return new Date();
  }

  /**
   * Format date for database
   */
  protected formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Parse JSON field safely
   */
  protected parseJson<R>(value: unknown, defaultValue: R): R {
    if (typeof value !== 'string') return defaultValue;
    try {
      return JSON.parse(value) as R;
    } catch {
      return defaultValue;
    }
  }
}
