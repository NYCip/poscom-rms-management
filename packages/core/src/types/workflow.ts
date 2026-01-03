/**
 * Workflow types for POS.com RMS
 */

export type EnforcementLevel = 'none' | 'soft' | 'hard';

export interface WorkflowStage {
  id: string;
  name: string;
  description?: string;
  requiredFields?: string[];
  optionalFields?: string[];
  allowedTransitions?: string[];
  enforcement?: EnforcementLevel;
  slaTier?: string;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  conditions?: TransitionCondition[];
  actions?: TransitionAction[];
}

export interface TransitionCondition {
  type: 'field_required' | 'field_value' | 'custom';
  field?: string;
  value?: unknown;
  message?: string;
}

export interface TransitionAction {
  type: 'set_field' | 'notify' | 'webhook' | 'custom';
  field?: string;
  value?: unknown;
  config?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  defaultStage: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
}

export interface WorkflowValidationError {
  field: string;
  message: string;
  code: string;
}

export interface WorkflowValidationWarning {
  field: string;
  message: string;
  code: string;
}
