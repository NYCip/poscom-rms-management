/**
 * Issue types for POS.com RMS
 */

export type IssueType = 'bug' | 'feature' | 'improvement' | 'task' | 'epic' | 'story';

export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';

export type IssueStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'testing'
  | 'done'
  | 'cancelled';

export type SLATier = 'critical' | 'high' | 'medium' | 'low';

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: IssueType;
  category: string | null;
  aiConfidence: number | null;
  status: IssueStatus;
  priority: IssuePriority;
  slaTier: SLATier | null;
  slaDeadline: Date | null;
  assignee: string | null;
  reporter: string;
  sprintId: string | null;
  parentId: string | null;
  branchName: string | null;
  prUrl: string | null;
  resolution: string | null;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  type?: IssueType;
  priority?: IssuePriority;
  assignee?: string;
  reporter?: string;
  labels?: string[];
  parentId?: string;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  type?: IssueType;
  category?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  slaTier?: SLATier;
  slaDeadline?: Date;
  assignee?: string;
  sprintId?: string;
  parentId?: string;
  branchName?: string;
  prUrl?: string;
  resolution?: string;
  labels?: string[];
}

export interface IssueRelationship {
  id: string;
  fromIssueId: string;
  toIssueId: string;
  type: 'blocks' | 'blocked_by' | 'duplicates' | 'duplicated_by' | 'relates_to';
  createdAt: Date;
}
