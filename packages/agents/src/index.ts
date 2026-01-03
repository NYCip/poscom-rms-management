export { MessageBus, messageBus } from './message-bus.js';
export type { AgentEvent, AgentEventType } from './message-bus.js';
export * from './agents/index.js';

import { MessageBus, messageBus } from './message-bus.js';
import { EpicRMSAgent, IssueManagerAgent, WorkflowEnforcerAgent, UIAssistantAgent, RMSLearnerAgent } from './agents/index.js';

export async function initializeAgents(bus: MessageBus = messageBus) {
  const agents = {
    epicRMS: new EpicRMSAgent(bus),
    issueManager: new IssueManagerAgent(bus),
    workflowEnforcer: new WorkflowEnforcerAgent(bus),
    uiAssistant: new UIAssistantAgent(bus),
    rmsLearner: new RMSLearnerAgent(bus),
  };
  await Promise.all(Object.values(agents).map(a => a.initialize()));
  return agents;
}
