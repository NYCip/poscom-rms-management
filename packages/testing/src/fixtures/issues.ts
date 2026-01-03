export interface MockIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
}

export const createMockIssue = (overrides?: Partial<MockIssue>): MockIssue => ({
  id: 'ISSUE-001',
  title: 'Test Issue',
  description: 'Test description',
  status: 'open',
  priority: 'medium',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockIssues: MockIssue[] = [
  createMockIssue({ id: 'ISSUE-001', title: 'Payment timeout', priority: 'critical', status: 'open' }),
  createMockIssue({ id: 'ISSUE-002', title: 'Inventory sync', priority: 'high', status: 'in-progress' }),
  createMockIssue({ id: 'ISSUE-003', title: 'Add dark mode', priority: 'low', status: 'open' }),
  createMockIssue({ id: 'ISSUE-004', title: 'Export reports', priority: 'medium', status: 'closed' }),
];

export const openIssues = mockIssues.filter(i => i.status === 'open');
export const closedIssues = mockIssues.filter(i => i.status === 'closed');
