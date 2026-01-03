import {
  BaseRepository,
  OptimisticLockError,
  type QueryOptions,
} from './base.repository';
import type { RMSDatabase } from '../database';
import {
  type Issue,
  type CreateIssueInput,
  type UpdateIssueInput,
  type IssueStatus,
  type IssuePriority,
  type Result,
  ok,
  err,
} from '@pos.com/core';

export interface IssueQueryOptions extends QueryOptions {
  status?: IssueStatus | IssueStatus[];
  priority?: IssuePriority | IssuePriority[];
  assignee?: string;
  sprintId?: string;
  parentId?: string;
  search?: string;
}

export class IssueRepository extends BaseRepository<Issue, CreateIssueInput, UpdateIssueInput> {
  constructor(db: RMSDatabase) {
    super(db, 'issues', 'iss');
  }

  /**
   * Create a new issue
   */
  create(input: CreateIssueInput): Result<Issue, Error> {
    try {
      const now = new Date();
      const id = this.generateId();

      const issue: Issue = {
        id,
        title: input.title,
        description: input.description ?? '',
        type: input.type ?? 'task',
        category: null,
        aiConfidence: null,
        status: 'backlog',
        priority: input.priority ?? 'medium',
        slaTier: null,
        slaDeadline: null,
        assignee: input.assignee ?? null,
        reporter: input.reporter ?? 'system',
        sprintId: null,
        parentId: input.parentId ?? null,
        branchName: null,
        prUrl: null,
        resolution: null,
        labels: input.labels ?? [],
        createdAt: now,
        updatedAt: now,
      };

      this.db.run(
        `INSERT INTO issues (
          id, title, description, type, category, ai_confidence,
          status, priority, sla_tier, sla_deadline, assignee, reporter,
          sprint_id, parent_id, branch_name, pr_url, resolution, labels_json,
          version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          issue.id,
          issue.title,
          issue.description,
          issue.type,
          issue.category,
          issue.aiConfidence,
          issue.status,
          issue.priority,
          issue.slaTier,
          issue.slaDeadline ? issue.slaDeadline.getTime() : null,
          issue.assignee,
          issue.reporter,
          issue.sprintId,
          issue.parentId,
          issue.branchName,
          issue.prUrl,
          issue.resolution,
          JSON.stringify(issue.labels),
          this.formatDate(issue.createdAt),
          this.formatDate(issue.updatedAt),
        ]
      );

      return ok(issue);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Update an issue with optimistic locking
   */
  update(id: string, input: UpdateIssueInput, expectedVersion?: number): Result<Issue, Error> {
    try {
      return this.db.transaction(() => {
        // Get current version
        const current = this.findById(id);
        if (!current) {
          return err(new Error(`Issue not found: ${id}`));
        }

        // Check version if optimistic locking is used
        const currentRow = this.db.get<{ version: number }>(
          'SELECT version FROM issues WHERE id = ?',
          [id]
        );
        const currentVersion = currentRow?.version ?? 1;

        if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
          return err(new OptimisticLockError(id, expectedVersion, currentVersion));
        }

        const now = new Date();
        const updates: string[] = [];
        const values: unknown[] = [];

        // Build dynamic update
        if (input.title !== undefined) {
          updates.push('title = ?');
          values.push(input.title);
        }
        if (input.description !== undefined) {
          updates.push('description = ?');
          values.push(input.description);
        }
        if (input.type !== undefined) {
          updates.push('type = ?');
          values.push(input.type);
        }
        if (input.category !== undefined) {
          updates.push('category = ?');
          values.push(input.category);
        }
        if (input.status !== undefined) {
          updates.push('status = ?');
          values.push(input.status);
        }
        if (input.priority !== undefined) {
          updates.push('priority = ?');
          values.push(input.priority);
        }
        if (input.slaTier !== undefined) {
          updates.push('sla_tier = ?');
          values.push(input.slaTier);
        }
        if (input.slaDeadline !== undefined) {
          updates.push('sla_deadline = ?');
          values.push(input.slaDeadline ? input.slaDeadline.getTime() : null);
        }
        if (input.assignee !== undefined) {
          updates.push('assignee = ?');
          values.push(input.assignee);
        }
        if (input.sprintId !== undefined) {
          updates.push('sprint_id = ?');
          values.push(input.sprintId);
        }
        if (input.parentId !== undefined) {
          updates.push('parent_id = ?');
          values.push(input.parentId);
        }
        if (input.branchName !== undefined) {
          updates.push('branch_name = ?');
          values.push(input.branchName);
        }
        if (input.prUrl !== undefined) {
          updates.push('pr_url = ?');
          values.push(input.prUrl);
        }
        if (input.resolution !== undefined) {
          updates.push('resolution = ?');
          values.push(input.resolution);
        }
        if (input.labels !== undefined) {
          updates.push('labels_json = ?');
          values.push(JSON.stringify(input.labels));
        }

        // Always update version and timestamp
        updates.push('version = version + 1');
        updates.push('updated_at = ?');
        values.push(this.formatDate(now));

        // Add WHERE clause values
        values.push(id);
        if (expectedVersion !== undefined) {
          values.push(expectedVersion);
        }

        const whereClause = expectedVersion !== undefined ? 'WHERE id = ? AND version = ?' : 'WHERE id = ?';

        const result = this.db.run(
          `UPDATE issues SET ${updates.join(', ')} ${whereClause}`,
          values
        );

        if (result.changes === 0 && expectedVersion !== undefined) {
          // Version mismatch - concurrent modification
          const newRow = this.db.get<{ version: number }>(
            'SELECT version FROM issues WHERE id = ?',
            [id]
          );
          return err(
            new OptimisticLockError(id, expectedVersion, newRow?.version ?? 0)
          );
        }

        const updated = this.findById(id);
        if (!updated) {
          return err(new Error('Failed to retrieve updated issue'));
        }

        return ok(updated);
      });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Query issues with filters
   */
  query(options: IssueQueryOptions = {}): Issue[] {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      conditions.push(`status IN (${statuses.map(() => '?').join(', ')})`);
      values.push(...statuses);
    }

    if (options.priority) {
      const priorities = Array.isArray(options.priority) ? options.priority : [options.priority];
      conditions.push(`priority IN (${priorities.map(() => '?').join(', ')})`);
      values.push(...priorities);
    }

    if (options.assignee) {
      conditions.push('assignee = ?');
      values.push(options.assignee);
    }

    if (options.sprintId) {
      conditions.push('sprint_id = ?');
      values.push(options.sprintId);
    }

    if (options.parentId) {
      conditions.push('parent_id = ?');
      values.push(options.parentId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = options.orderBy ?? 'created_at';
    const orderDir = options.orderDir ?? 'DESC';
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    values.push(limit, offset);

    const rows = this.db.all<Record<string, unknown>>(
      `SELECT * FROM issues ${whereClause} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`,
      values
    );

    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Full-text search issues
   */
  search(query: string, limit = 20): Issue[] {
    const rows = this.db.all<Record<string, unknown>>(
      `SELECT issues.* FROM issues
       JOIN issues_fts ON issues.rowid = issues_fts.rowid
       WHERE issues_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
      [query, limit]
    );

    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Get issues by SLA urgency (approaching deadline)
   */
  getUrgentBySLA(limit = 20): Issue[] {
    const now = Date.now();
    const rows = this.db.all<Record<string, unknown>>(
      `SELECT * FROM issues
       WHERE sla_deadline IS NOT NULL
       AND sla_deadline > ?
       AND status NOT IN ('done', 'cancelled')
       ORDER BY sla_deadline ASC
       LIMIT ?`,
      [now, limit]
    );

    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Get overdue issues
   */
  getOverdue(): Issue[] {
    const now = Date.now();
    const rows = this.db.all<Record<string, unknown>>(
      `SELECT * FROM issues
       WHERE sla_deadline IS NOT NULL
       AND sla_deadline <= ?
       AND status NOT IN ('done', 'cancelled')
       ORDER BY sla_deadline ASC`,
      [now]
    );

    return rows.map((row) => this.rowToEntity(row));
  }

  protected rowToEntity(row: Record<string, unknown>): Issue {
    return {
      id: row['id'] as string,
      title: row['title'] as string,
      description: (row['description'] as string) ?? '',
      type: row['type'] as Issue['type'],
      category: (row['category'] as string) ?? null,
      aiConfidence: (row['ai_confidence'] as number) ?? null,
      status: row['status'] as Issue['status'],
      priority: row['priority'] as Issue['priority'],
      slaTier: (row['sla_tier'] as Issue['slaTier']) ?? null,
      slaDeadline: row['sla_deadline'] ? new Date(row['sla_deadline'] as number) : null,
      assignee: (row['assignee'] as string) ?? null,
      reporter: row['reporter'] as string,
      sprintId: (row['sprint_id'] as string) ?? null,
      parentId: (row['parent_id'] as string) ?? null,
      branchName: (row['branch_name'] as string) ?? null,
      prUrl: (row['pr_url'] as string) ?? null,
      resolution: (row['resolution'] as string) ?? null,
      labels: this.parseJson(row['labels_json'], []),
      createdAt: this.parseDate(row['created_at']),
      updatedAt: this.parseDate(row['updated_at']),
    };
  }

  protected entityToRow(entity: Partial<Issue>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.id !== undefined) row['id'] = entity.id;
    if (entity.title !== undefined) row['title'] = entity.title;
    if (entity.description !== undefined) row['description'] = entity.description;
    if (entity.type !== undefined) row['type'] = entity.type;
    if (entity.category !== undefined) row['category'] = entity.category;
    if (entity.aiConfidence !== undefined) row['ai_confidence'] = entity.aiConfidence;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.priority !== undefined) row['priority'] = entity.priority;
    if (entity.slaTier !== undefined) row['sla_tier'] = entity.slaTier;
    if (entity.slaDeadline !== undefined) {
      row['sla_deadline'] = entity.slaDeadline ? entity.slaDeadline.getTime() : null;
    }
    if (entity.assignee !== undefined) row['assignee'] = entity.assignee;
    if (entity.reporter !== undefined) row['reporter'] = entity.reporter;
    if (entity.sprintId !== undefined) row['sprint_id'] = entity.sprintId;
    if (entity.parentId !== undefined) row['parent_id'] = entity.parentId;
    if (entity.branchName !== undefined) row['branch_name'] = entity.branchName;
    if (entity.prUrl !== undefined) row['pr_url'] = entity.prUrl;
    if (entity.resolution !== undefined) row['resolution'] = entity.resolution;
    if (entity.labels !== undefined) row['labels_json'] = JSON.stringify(entity.labels);
    if (entity.createdAt !== undefined) row['created_at'] = this.formatDate(entity.createdAt);
    if (entity.updatedAt !== undefined) row['updated_at'] = this.formatDate(entity.updatedAt);

    return row;
  }
}
