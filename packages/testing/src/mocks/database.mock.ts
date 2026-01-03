import { mockIssues, type MockIssue } from '../fixtures/issues.js';
import { mockWorkflows, type MockWorkflow } from '../fixtures/workflows.js';

export class MockDatabase {
  private issues: Map<string, MockIssue>;
  private workflows: Map<string, MockWorkflow>;
  private queryLog: Array<{ type: string; params: any }> = [];

  constructor() {
    this.issues = new Map(mockIssues.map(i => [i.id, i]));
    this.workflows = new Map(mockWorkflows.map(w => [w.id, w]));
  }

  async getIssue(id: string): Promise<MockIssue | null> {
    this.queryLog.push({ type: 'getIssue', params: { id } });
    return this.issues.get(id) || null;
  }

  async getIssues(filter?: { status?: string }): Promise<MockIssue[]> {
    this.queryLog.push({ type: 'getIssues', params: { filter } });
    let results = Array.from(this.issues.values());
    if (filter?.status) results = results.filter(i => i.status === filter.status);
    return results;
  }

  async createIssue(issue: MockIssue): Promise<MockIssue> {
    this.queryLog.push({ type: 'createIssue', params: { issue } });
    this.issues.set(issue.id, issue);
    return issue;
  }

  async getWorkflow(id: string): Promise<MockWorkflow | null> {
    this.queryLog.push({ type: 'getWorkflow', params: { id } });
    return this.workflows.get(id) || null;
  }

  reset(): void {
    this.issues = new Map(mockIssues.map(i => [i.id, i]));
    this.workflows = new Map(mockWorkflows.map(w => [w.id, w]));
    this.queryLog = [];
  }

  getQueryLog() { return [...this.queryLog]; }
}

export const createMockDatabase = () => new MockDatabase();
