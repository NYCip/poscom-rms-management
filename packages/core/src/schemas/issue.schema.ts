import { z } from 'zod';

export const IssueTypeSchema = z.enum(['bug', 'feature', 'improvement', 'task', 'epic', 'story']);

export const IssuePrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const IssueStatusSchema = z.enum([
  'backlog',
  'todo',
  'in_progress',
  'review',
  'testing',
  'done',
  'cancelled',
]);

export const SLATierSchema = z.enum(['critical', 'high', 'medium', 'low']);

export const IssueSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().default(''),
  type: IssueTypeSchema.default('task'),
  category: z.string().nullable().default(null),
  aiConfidence: z.number().min(0).max(1).nullable().default(null),
  status: IssueStatusSchema.default('backlog'),
  priority: IssuePrioritySchema.default('medium'),
  slaTier: SLATierSchema.nullable().default(null),
  slaDeadline: z.coerce.date().nullable().default(null),
  assignee: z.string().nullable().default(null),
  reporter: z.string().default('system'),
  sprintId: z.string().nullable().default(null),
  parentId: z.string().nullable().default(null),
  branchName: z.string().nullable().default(null),
  prUrl: z.string().url().nullable().default(null),
  resolution: z.string().nullable().default(null),
  labels: z.array(z.string()).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateIssueInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: IssueTypeSchema.optional(),
  priority: IssuePrioritySchema.optional(),
  assignee: z.string().optional(),
  reporter: z.string().optional(),
  labels: z.array(z.string()).optional(),
  parentId: z.string().optional(),
});

export const UpdateIssueInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: IssueTypeSchema.optional(),
  category: z.string().optional(),
  status: IssueStatusSchema.optional(),
  priority: IssuePrioritySchema.optional(),
  slaTier: SLATierSchema.optional(),
  slaDeadline: z.coerce.date().optional(),
  assignee: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  branchName: z.string().nullable().optional(),
  prUrl: z.string().url().nullable().optional(),
  resolution: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
});

export const IssueRelationshipTypeSchema = z.enum([
  'blocks',
  'blocked_by',
  'duplicates',
  'duplicated_by',
  'relates_to',
]);

export const IssueRelationshipSchema = z.object({
  id: z.string().min(1),
  fromIssueId: z.string().min(1),
  toIssueId: z.string().min(1),
  type: IssueRelationshipTypeSchema,
  createdAt: z.coerce.date(),
});

export type IssueSchemaType = z.infer<typeof IssueSchema>;
export type CreateIssueInputSchemaType = z.infer<typeof CreateIssueInputSchema>;
export type UpdateIssueInputSchemaType = z.infer<typeof UpdateIssueInputSchema>;
