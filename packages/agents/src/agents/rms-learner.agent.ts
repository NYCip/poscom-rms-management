import { BaseAgent } from './base.agent.js';
import { MessageBus } from '../message-bus.js';
import type { AgentEvent } from '../message-bus.js';

interface Pattern { id: string; type: string; description: string; confidence: number; occurrences: number; }

export class RMSLearnerAgent extends BaseAgent {
  private patterns = new Map<string, Pattern>();
  private eventHistory: AgentEvent[] = [];

  constructor(bus: MessageBus) {
    super('RMSLearner', bus);
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    this.subscribe('*', this.recordEvent.bind(this));
  }

  private async recordEvent(event: AgentEvent): Promise<void> {
    if (event.source === this.name) return;
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > 1000) this.eventHistory.pop();
    this.detectPatterns();
  }

  private detectPatterns(): void {
    const typeCounts = new Map<string, number>();
    for (const e of this.eventHistory.slice(0, 100)) {
      typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1);
    }

    for (const [type, count] of typeCounts) {
      if (count >= 10) {
        const id = `pattern-${type}`;
        const existing = this.patterns.get(id);
        if (existing) {
          existing.occurrences = count;
          existing.confidence = Math.min(0.95, existing.confidence + 0.05);
        } else {
          this.patterns.set(id, { id, type: 'frequency', description: `High frequency: ${type}`, confidence: 0.6, occurrences: count });
        }
      }
    }
  }

  getPatterns(minConfidence = 0): Pattern[] {
    return Array.from(this.patterns.values()).filter(p => p.confidence >= minConfidence);
  }
}
