/**
 * Agent types for POS.com RMS
 */

export type AgentType =
  | 'epic-rms'
  | 'issue-manager'
  | 'workflow-enforcer'
  | 'ui-assistant'
  | 'rms-learner';

export type AgentStatus = 'idle' | 'busy' | 'error' | 'stopped';

export interface AgentMessage<T = unknown> {
  id: string;
  type: string;
  source: AgentType;
  target?: AgentType | 'broadcast';
  payload: T;
  timestamp: Date;
  correlationId?: string;
}

export interface AgentHealth {
  agent: AgentType;
  status: AgentStatus;
  lastHeartbeat: Date;
  uptime: number;
  messagesProcessed: number;
  errorsCount: number;
}

export interface AgentMetrics {
  id: string;
  agent: AgentType;
  metricName: string;
  metricValue: number;
  timestamp: Date;
}

// Event types for message bus
export interface AgentEvents {
  // Issue events
  'issue:create': { data: import('./issue').CreateIssueInput };
  'issue:created': { issue: import('./issue').Issue };
  'issue:updated': { issue: import('./issue').Issue; changes: string[] };
  'issue:deleted': { issueId: string };
  'issue:categorized': { issueId: string; category: string; confidence: number };

  // Workflow events
  'workflow:transition': {
    issueId: string;
    from: string;
    to: string;
    validation: import('./workflow').WorkflowValidationResult;
  };
  'workflow:blocked': { issueId: string; reason: string };

  // SLA events
  'sla:set': { issueId: string; tier: string; deadline: Date };
  'sla:warning': { issueId: string; percentRemaining: number };
  'sla:breach': { issueId: string };

  // Screenshot events
  'screenshot:added': { screenshot: import('./screenshot').Screenshot };
  'screenshot:annotated': { screenshotId: string };

  // CLI events
  'cli:execute': { command: string; args: string[] };
  'cli:output': { commandId: string; data: string; stream: 'stdout' | 'stderr' };
  'cli:complete': { commandId: string; exitCode: number };
  'cli:error': { commandId: string; error: string };

  // Notification events
  'notify:teams': { message: string; card?: unknown };
  'notify:dashboard': { type: string; data: unknown };

  // Learning events
  'learn:override': { issueId: string; field: string; oldValue: unknown; newValue: unknown };
  'learn:pattern': { pattern: string; confidence: number };
}
