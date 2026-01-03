import { MessageBus } from '../message-bus.js';
import type { AgentEvent, AgentEventType } from '../message-bus.js';

export abstract class BaseAgent {
  protected subscriptions: (() => void)[] = [];

  constructor(
    protected readonly name: string,
    protected readonly bus: MessageBus
  ) {}

  abstract initialize(): Promise<void>;

  protected subscribe<T>(type: AgentEventType | '*', handler: (event: AgentEvent<T>) => void | Promise<void>): void {
    this.subscriptions.push(this.bus.subscribe(type, handler));
  }

  protected publish<T>(type: AgentEventType, payload: T, correlationId?: string): void {
    this.bus.publish(type, payload, this.name, correlationId);
  }

  destroy(): void {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }
}
