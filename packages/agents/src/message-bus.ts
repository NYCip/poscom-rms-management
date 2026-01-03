import EventEmitter from 'eventemitter3';

export type AgentEventType =
  | 'issue:created' | 'issue:updated' | 'issue:deleted'
  | 'workflow:transition' | 'workflow:sla_warning' | 'workflow:sla_breach'
  | 'agent:task' | 'agent:result' | 'agent:error';

export interface AgentEvent<T = unknown> {
  type: AgentEventType;
  payload: T;
  source: string;
  timestamp: Date;
  correlationId?: string;
}

export class MessageBus {
  private emitter = new EventEmitter();

  publish<T>(type: AgentEventType, payload: T, source: string, correlationId?: string): void {
    const event: AgentEvent<T> = { type, payload, source, timestamp: new Date() };
    if (correlationId) event.correlationId = correlationId;
    this.emitter.emit(type, event);
    this.emitter.emit('*', event);
  }

  subscribe<T>(type: AgentEventType | '*', handler: (event: AgentEvent<T>) => void | Promise<void>): () => void {
    this.emitter.on(type, handler);
    return () => this.emitter.off(type, handler);
  }
}

export const messageBus = new MessageBus();
