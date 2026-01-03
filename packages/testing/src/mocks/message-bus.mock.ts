export interface AgentMessage {
  type: string;
  payload: any;
  from: string;
  timestamp: Date;
}

type Handler = (msg: AgentMessage) => void | Promise<void>;

export class MockMessageBus {
  private handlers = new Map<string, Set<Handler>>();
  private messages: AgentMessage[] = [];
  private published: Array<{ topic: string; message: AgentMessage }> = [];

  async subscribe(topic: string, handler: Handler): Promise<void> {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set());
    this.handlers.get(topic)!.add(handler);
  }

  async unsubscribe(topic: string, handler: Handler): Promise<void> {
    this.handlers.get(topic)?.delete(handler);
  }

  async publish(topic: string, message: AgentMessage): Promise<void> {
    this.published.push({ topic, message });
    this.messages.push(message);

    for (const h of this.handlers.get(topic) || []) await h(message);
    for (const h of this.handlers.get('*') || []) await h(message);
  }

  getMessages(): AgentMessage[] { return [...this.messages]; }
  getPublished() { return [...this.published]; }

  async waitForMessage(predicate: (m: AgentMessage) => boolean, timeout = 5000): Promise<AgentMessage> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const msg = this.messages.find(predicate);
      if (msg) return msg;
      await new Promise(r => setTimeout(r, 10));
    }
    throw new Error('Timeout waiting for message');
  }

  reset(): void {
    this.handlers.clear();
    this.messages = [];
    this.published = [];
  }
}

export const createMockMessageBus = () => new MockMessageBus();
