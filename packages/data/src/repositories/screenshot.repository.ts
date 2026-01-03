import { BaseRepository } from './base.repository';
import type { RMSDatabase } from '../database';
import {
  type Screenshot,
  type CreateScreenshotInput,
  type UpdateScreenshotInput,
  type ScreenshotAnnotation,
  type ScreenshotContext,
  type Result,
  ok,
  err,
} from '@pos.com/core';

export class ScreenshotRepository extends BaseRepository<
  Screenshot,
  CreateScreenshotInput,
  UpdateScreenshotInput
> {
  constructor(db: RMSDatabase) {
    super(db, 'screenshots', 'scr');
  }

  /**
   * Create a new screenshot
   */
  create(input: CreateScreenshotInput): Result<Screenshot, Error> {
    try {
      const now = new Date();
      const id = this.generateId();

      const screenshot: Screenshot = {
        id,
        issueId: input.issueId,
        originalPath: input.originalPath,
        annotatedPath: null,
        annotations: [],
        context: input.context ?? null,
        ocrText: null,
        createdAt: now,
      };

      this.db.run(
        `INSERT INTO screenshots (
          id, issue_id, original_path, annotated_path,
          annotations_json, context_json, ocr_text, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          screenshot.id,
          screenshot.issueId,
          screenshot.originalPath,
          screenshot.annotatedPath,
          JSON.stringify(screenshot.annotations),
          screenshot.context ? JSON.stringify(screenshot.context) : null,
          screenshot.ocrText,
          this.formatDate(screenshot.createdAt),
        ]
      );

      return ok(screenshot);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Update a screenshot
   */
  update(id: string, input: UpdateScreenshotInput): Result<Screenshot, Error> {
    try {
      const current = this.findById(id);
      if (!current) {
        return err(new Error(`Screenshot not found: ${id}`));
      }

      const updates: string[] = [];
      const values: unknown[] = [];

      if (input.annotatedPath !== undefined) {
        updates.push('annotated_path = ?');
        values.push(input.annotatedPath);
      }
      if (input.annotations !== undefined) {
        updates.push('annotations_json = ?');
        values.push(JSON.stringify(input.annotations));
      }
      if (input.ocrText !== undefined) {
        updates.push('ocr_text = ?');
        values.push(input.ocrText);
      }

      if (updates.length === 0) {
        return ok(current);
      }

      values.push(id);

      this.db.run(
        `UPDATE screenshots SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const updated = this.findById(id);
      if (!updated) {
        return err(new Error('Failed to retrieve updated screenshot'));
      }

      return ok(updated);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get all screenshots for an issue
   */
  findByIssueId(issueId: string): Screenshot[] {
    const rows = this.db.all<Record<string, unknown>>(
      'SELECT * FROM screenshots WHERE issue_id = ? ORDER BY created_at ASC',
      [issueId]
    );

    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Get primary screenshot for an issue (first one)
   */
  getPrimary(issueId: string): Screenshot | undefined {
    const row = this.db.get<Record<string, unknown>>(
      'SELECT * FROM screenshots WHERE issue_id = ? ORDER BY created_at ASC LIMIT 1',
      [issueId]
    );

    return row ? this.rowToEntity(row) : undefined;
  }

  /**
   * Count screenshots for an issue
   */
  countByIssueId(issueId: string): number {
    const result = this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM screenshots WHERE issue_id = ?',
      [issueId]
    );
    return result?.count ?? 0;
  }

  /**
   * Delete all screenshots for an issue
   */
  deleteByIssueId(issueId: string): number {
    const result = this.db.run('DELETE FROM screenshots WHERE issue_id = ?', [issueId]);
    return result.changes;
  }

  protected rowToEntity(row: Record<string, unknown>): Screenshot {
    return {
      id: row['id'] as string,
      issueId: row['issue_id'] as string,
      originalPath: row['original_path'] as string,
      annotatedPath: (row['annotated_path'] as string) ?? null,
      annotations: this.parseJson<ScreenshotAnnotation[]>(row['annotations_json'], []),
      context: this.parseJson<ScreenshotContext | null>(row['context_json'], null),
      ocrText: (row['ocr_text'] as string) ?? null,
      createdAt: this.parseDate(row['created_at']),
    };
  }

  protected entityToRow(entity: Partial<Screenshot>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.id !== undefined) row['id'] = entity.id;
    if (entity.issueId !== undefined) row['issue_id'] = entity.issueId;
    if (entity.originalPath !== undefined) row['original_path'] = entity.originalPath;
    if (entity.annotatedPath !== undefined) row['annotated_path'] = entity.annotatedPath;
    if (entity.annotations !== undefined) {
      row['annotations_json'] = JSON.stringify(entity.annotations);
    }
    if (entity.context !== undefined) {
      row['context_json'] = entity.context ? JSON.stringify(entity.context) : null;
    }
    if (entity.ocrText !== undefined) row['ocr_text'] = entity.ocrText;
    if (entity.createdAt !== undefined) row['created_at'] = this.formatDate(entity.createdAt);

    return row;
  }
}
