import { BaseAgent } from './base.agent.js';
import { MessageBus } from '../message-bus.js';
import type { AgentEvent } from '../message-bus.js';

interface IssuePayload { id: string; title: string; description: string; }

const KEYWORD_RULES = [
  { keywords: ['crash', 'error', 'bug', 'broken'], category: 'bug', priority: 'high' },
  { keywords: ['feature', 'enhance', 'add', 'support'], category: 'feature', priority: 'medium' },
  { keywords: ['slow', 'performance', 'timeout'], category: 'performance', priority: 'high' },
  { keywords: ['security', 'vulnerability', 'auth'], category: 'security', priority: 'critical' },
];

export class IssueManagerAgent extends BaseAgent {
  constructor(bus: MessageBus) {
    super('IssueManager', bus);
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    this.subscribe('issue:created', this.handleIssueCreated.bind(this));
  }

  private async handleIssueCreated(event: AgentEvent<IssuePayload>): Promise<void> {
    const { id, title, description } = event.payload;
    const text = `${title} ${description}`.toLowerCase();

    for (const rule of KEYWORD_RULES) {
      if (rule.keywords.some(kw => text.includes(kw))) {
        console.log(`[${this.name}] Categorized ${id}: ${rule.category}`);
        this.publish('issue:updated', { id, category: rule.category, priority: rule.priority }, event.correlationId);
        return;
      }
    }
  }
}
