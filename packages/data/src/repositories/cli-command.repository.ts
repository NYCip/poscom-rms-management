import type { RMSDatabase } from '../database';
import { generateId, type Result, ok, err } from '@pos.com/core';

export type CLICommandStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface CLICommand {
  id: string;
  command: string;
  args: string[];
  status: CLICommandStatus;
  output: string | null;
  errorOutput: string | null;
  exitCode: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  createdBy: string;
}

export interface CreateCLICommandInput {
  command: string;
  args?: string[];
  createdBy?: string;
}

export class CLICommandRepository {
  private db: RMSDatabase;

  constructor(db: RMSDatabase) {
    this.db = db;
  }

  /**
   * Create a new CLI command
   */
  create(input: CreateCLICommandInput): Result<CLICommand, Error> {
    try {
      const now = new Date();
      const id = generateId('cmd');

      const command: CLICommand = {
        id,
        command: input.command,
        args: input.args ?? [],
        status: 'pending',
        output: null,
        errorOutput: null,
        exitCode: null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        createdBy: input.createdBy ?? 'dashboard',
      };

      this.db.run(
        `INSERT INTO cli_commands (
          id, command, args_json, status, output, error_output,
          exit_code, started_at, completed_at, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          command.id,
          command.command,
          JSON.stringify(command.args),
          command.status,
          command.output,
          command.errorOutput,
          command.exitCode,
          null,
          null,
          now.toISOString(),
          command.createdBy,
        ]
      );

      return ok(command);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Mark command as started
   */
  markStarted(id: string): Result<void, Error> {
    try {
      const now = new Date();
      this.db.run(
        `UPDATE cli_commands SET status = 'running', started_at = ? WHERE id = ?`,
        [now.toISOString(), id]
      );
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Append output to command
   */
  appendOutput(id: string, data: string, stream: 'stdout' | 'stderr' = 'stdout'): Result<void, Error> {
    try {
      const column = stream === 'stderr' ? 'error_output' : 'output';
      this.db.run(
        `UPDATE cli_commands SET ${column} = COALESCE(${column}, '') || ? WHERE id = ?`,
        [data, id]
      );
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Mark command as completed
   */
  markCompleted(id: string, exitCode: number): Result<void, Error> {
    try {
      const now = new Date();
      const status: CLICommandStatus = exitCode === 0 ? 'completed' : 'failed';

      this.db.run(
        `UPDATE cli_commands SET status = ?, exit_code = ?, completed_at = ? WHERE id = ?`,
        [status, exitCode, now.toISOString(), id]
      );
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Mark command as cancelled
   */
  markCancelled(id: string): Result<void, Error> {
    try {
      const now = new Date();
      this.db.run(
        `UPDATE cli_commands SET status = 'cancelled', completed_at = ? WHERE id = ?`,
        [now.toISOString(), id]
      );
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Find command by ID
   */
  findById(id: string): CLICommand | undefined {
    const row = this.db.get<Record<string, unknown>>(
      'SELECT * FROM cli_commands WHERE id = ?',
      [id]
    );
    return row ? this.rowToEntity(row) : undefined;
  }

  /**
   * Get recent commands
   */
  getRecent(limit = 20): CLICommand[] {
    const rows = this.db.all<Record<string, unknown>>(
      'SELECT * FROM cli_commands ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Get running commands
   */
  getRunning(): CLICommand[] {
    const rows = this.db.all<Record<string, unknown>>(
      `SELECT * FROM cli_commands WHERE status = 'running' ORDER BY started_at ASC`
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Get pending commands
   */
  getPending(): CLICommand[] {
    const rows = this.db.all<Record<string, unknown>>(
      `SELECT * FROM cli_commands WHERE status = 'pending' ORDER BY created_at ASC`
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Cleanup old completed commands
   */
  cleanupOld(olderThanDays = 7): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = this.db.run(
      `DELETE FROM cli_commands WHERE status IN ('completed', 'failed', 'cancelled') AND created_at < ?`,
      [cutoff.toISOString()]
    );
    return result.changes;
  }

  private rowToEntity(row: Record<string, unknown>): CLICommand {
    return {
      id: row['id'] as string,
      command: row['command'] as string,
      args: JSON.parse((row['args_json'] as string) ?? '[]') as string[],
      status: row['status'] as CLICommandStatus,
      output: (row['output'] as string) ?? null,
      errorOutput: (row['error_output'] as string) ?? null,
      exitCode: (row['exit_code'] as number) ?? null,
      startedAt: row['started_at'] ? new Date(row['started_at'] as string) : null,
      completedAt: row['completed_at'] ? new Date(row['completed_at'] as string) : null,
      createdAt: new Date(row['created_at'] as string),
      createdBy: row['created_by'] as string,
    };
  }
}
