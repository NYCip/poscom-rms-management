import { BaseAgent } from './base.agent.js';
import { MessageBus } from '../message-bus.js';
import type { AgentEvent } from '../message-bus.js';

interface IssueState { id: string; state: string; stateEnteredAt: Date; priority: string; }

const SLA_CONFIGS = [
  { state: 'new', maxDuration: 24 * 60 * 60 * 1000, warningThreshold: 0.75 },
  { state: 'in-progress', maxDuration: 7 * 24 * 60 * 60 * 1000, warningThreshold: 0.8 },
];

export class WorkflowEnforcerAgent extends BaseAgent {
  private issueStates = new Map<string, IssueState>();
  private slaInterval?: NodeJS.Timeout;

  constructor(bus: MessageBus) {
    super('WorkflowEnforcer', bus);
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    this.subscribe('workflow:transition', this.handleTransition.bind(this));
    this.subscribe('issue:created', this.handleIssueCreated.bind(this));
    this.slaInterval = setInterval(() => this.checkAllSLAs(), 5 * 60 * 1000);
  }

  private async handleIssueCreated(event: AgentEvent<IssueState>): Promise<void> {
    this.issueStates.set(event.payload.id, { ...event.payload, state: 'new', stateEnteredAt: new Date() });
  }

  private async handleTransition(event: AgentEvent<{ issueId: string; toState: string }>): Promise<void> {
    const { issueId, toState } = event.payload;
    const state = this.issueStates.get(issueId);
    if (state) {
      state.state = toState;
      state.stateEnteredAt = new Date();
    }
  }

  private checkAllSLAs(): void {
    for (const [id, issue] of this.issueStates) {
      const config = SLA_CONFIGS.find(c => c.state === issue.state);
      if (!config) continue;

      const elapsed = Date.now() - issue.stateEnteredAt.getTime();
      const percent = elapsed / config.maxDuration;

      if (percent >= 1.0) {
        this.publish('workflow:sla_breach', { issueId: id, state: issue.state, elapsed });
      } else if (percent >= config.warningThreshold) {
        this.publish('workflow:sla_warning', { issueId: id, state: issue.state, percent });
      }
    }
  }

  override destroy(): void {
    if (this.slaInterval) clearInterval(this.slaInterval);
    super.destroy();
  }
}
