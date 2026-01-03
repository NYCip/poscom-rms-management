import { BaseAgent } from './base.agent.js';
import { MessageBus } from '../message-bus.js';
import type { AgentEvent } from '../message-bus.js';

interface Notification { id: string; type: string; title: string; message: string; timestamp: Date; }

export class UIAssistantAgent extends BaseAgent {
  private notifications: Notification[] = [];

  constructor(bus: MessageBus) {
    super('UIAssistant', bus);
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    this.subscribe('workflow:sla_warning', this.handleSLAWarning.bind(this));
    this.subscribe('workflow:sla_breach', this.handleSLABreach.bind(this));
    this.subscribe('issue:created', this.handleIssueCreated.bind(this));
  }

  private createNotification(type: string, title: string, message: string): void {
    const notif = { id: `notif-${Date.now()}`, type, title, message, timestamp: new Date() };
    this.notifications.unshift(notif);
    if (this.notifications.length > 100) this.notifications.pop();
    this.publish('agent:result', { agent: this.name, action: 'notification', notification: notif });
  }

  private async handleSLAWarning(event: AgentEvent): Promise<void> {
    const p = event.payload as any;
    this.createNotification('warning', 'SLA Warning', `Issue ${p.issueId} approaching limit`);
  }

  private async handleSLABreach(event: AgentEvent): Promise<void> {
    const p = event.payload as any;
    this.createNotification('error', 'SLA Breach', `Issue ${p.issueId} breached SLA`);
  }

  private async handleIssueCreated(event: AgentEvent): Promise<void> {
    const p = event.payload as any;
    this.createNotification('info', 'New Issue', `Issue ${p.id}: ${p.title}`);
  }

  getNotifications(limit = 50): Notification[] {
    return this.notifications.slice(0, limit);
  }
}
