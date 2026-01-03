import { BaseAgent } from './base.agent.js';
import { MessageBus } from '../message-bus.js';
import type { AgentEvent } from '../message-bus.js';

export class EpicRMSAgent extends BaseAgent {
  constructor(bus: MessageBus) {
    super('EpicRMS', bus);
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing orchestrator...`);
    this.subscribe('*', this.handleEvent.bind(this));
    this.subscribe('workflow:sla_breach', this.handleSLABreach.bind(this));
  }

  private async handleEvent(event: AgentEvent): Promise<void> {
    console.log(`[${this.name}] Event: ${event.type} from ${event.source}`);
  }

  private async handleSLABreach(event: AgentEvent): Promise<void> {
    console.log(`[${this.name}] SLA BREACH:`, event.payload);
    this.publish('agent:task', { priority: 'critical', action: 'escalate', issue: event.payload }, event.correlationId);
  }

  async coordinateTask(task: { type: string; payload: unknown }): Promise<void> {
    const correlationId = `task-${Date.now()}`;
    this.publish('agent:task', { ...task, coordinator: this.name }, correlationId);
  }
}
