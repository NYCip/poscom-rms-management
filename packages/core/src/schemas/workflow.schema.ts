import { z } from 'zod';

export const EnforcementLevelSchema = z.enum(['none', 'soft', 'hard']);

export const WorkflowStageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  requiredFields: z.array(z.string()).optional(),
  optionalFields: z.array(z.string()).optional(),
  allowedTransitions: z.array(z.string()).optional(),
  enforcement: EnforcementLevelSchema.optional(),
  slaTier: z.string().optional(),
});

export const TransitionConditionSchema = z.object({
  type: z.enum(['field_required', 'field_value', 'custom']),
  field: z.string().optional(),
  value: z.unknown().optional(),
  message: z.string().optional(),
});

export const TransitionActionSchema = z.object({
  type: z.enum(['set_field', 'notify', 'webhook', 'custom']),
  field: z.string().optional(),
  value: z.unknown().optional(),
  config: z.record(z.unknown()).optional(),
});

export const WorkflowTransitionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  conditions: z.array(TransitionConditionSchema).optional(),
  actions: z.array(TransitionActionSchema).optional(),
});

export const WorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  stages: z.array(WorkflowStageSchema).min(1),
  transitions: z.array(WorkflowTransitionSchema),
  defaultStage: z.string().min(1),
  isDefault: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const WorkflowValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

export const WorkflowValidationWarningSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

export const WorkflowValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(WorkflowValidationErrorSchema),
  warnings: z.array(WorkflowValidationWarningSchema),
});

// YAML workflow config schema (for parsing workflow.yaml)
export const WorkflowYAMLSchema = z.object({
  workflow: z.object({
    name: z.string(),
    description: z.string().optional(),
    stages: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        required_fields: z.array(z.string()).optional(),
        optional_fields: z.array(z.string()).optional(),
        allowed_transitions: z.array(z.string()).optional(),
        enforcement: EnforcementLevelSchema.optional(),
        sla_tier: z.string().optional(),
      })
    ),
    transitions: z
      .array(
        z.object({
          from: z.string(),
          to: z.string(),
          conditions: z
            .array(
              z.object({
                type: z.string(),
                field: z.string().optional(),
                value: z.unknown().optional(),
                message: z.string().optional(),
              })
            )
            .optional(),
        })
      )
      .optional(),
    default_stage: z.string().optional(),
  }),
});

export type WorkflowSchemaType = z.infer<typeof WorkflowSchema>;
export type WorkflowYAMLSchemaType = z.infer<typeof WorkflowYAMLSchema>;
