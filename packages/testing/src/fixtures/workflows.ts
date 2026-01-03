export interface MockWorkflowStep {
  id: string;
  name: string;
  status: string;
  dependencies: string[];
}

export interface MockWorkflow {
  id: string;
  name: string;
  status: string;
  steps: MockWorkflowStep[];
}

export const createMockWorkflow = (overrides?: Partial<MockWorkflow>): MockWorkflow => ({
  id: 'WORKFLOW-001',
  name: 'Test Workflow',
  status: 'pending',
  steps: [{ id: 'step-001', name: 'Step 1', status: 'pending', dependencies: [] }],
  ...overrides,
});

export const mockWorkflows: MockWorkflow[] = [
  createMockWorkflow({ id: 'WORKFLOW-001', name: 'Checkout Optimization', status: 'in-progress' }),
  createMockWorkflow({ id: 'WORKFLOW-002', name: 'Payment Integration', status: 'pending' }),
  createMockWorkflow({ id: 'WORKFLOW-003', name: 'Inventory Sync', status: 'completed' }),
];
