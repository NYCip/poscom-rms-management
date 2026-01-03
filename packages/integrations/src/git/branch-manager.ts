import simpleGit from 'simple-git';
import type { SimpleGit } from 'simple-git';

export interface BranchNameOptions {
  type: 'feature' | 'bugfix' | 'hotfix';
  issueId: string;
  description: string;
}

export class BranchManager {
  private git: SimpleGit;

  constructor(workDir: string) {
    this.git = simpleGit(workDir);
  }

  generateBranchName(opts: BranchNameOptions): string {
    const sanitized = opts.description.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    return `${opts.type}/${opts.issueId}-${sanitized}`;
  }

  async createBranch(branchName: string, baseBranch = 'main'): Promise<void> {
    await this.git.checkoutBranch(branchName, baseBranch);
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || '';
  }

  extractIssueIdFromBranch(branchName: string): string | null {
    const match = branchName.match(/(?:feature|bugfix|hotfix)\/([A-Z]+-\d+)/);
    return match?.[1] ?? null;
  }
}
