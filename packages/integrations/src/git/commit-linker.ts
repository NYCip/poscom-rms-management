import simpleGit from 'simple-git';
import type { SimpleGit } from 'simple-git';

export class CommitLinker {
  private git: SimpleGit;

  constructor(workDir: string) {
    this.git = simpleGit(workDir);
  }

  extractIssueIds(message: string): string[] {
    const ids = new Set<string>();
    const patterns = [/RMS-(\d+)/gi, /#(\d+)/g, /ISSUE-(\d+)/gi];
    for (const pattern of patterns) {
      for (const match of message.matchAll(pattern)) {
        ids.add(`RMS-${match[1]}`);
      }
    }
    return Array.from(ids);
  }

  async getCommitsForIssue(issueId: string): Promise<Array<{ hash: string; message: string; date: Date }>> {
    const log = await this.git.log(['--all', '--grep', issueId]);
    return log.all.map(c => ({ hash: c.hash, message: c.message, date: new Date(c.date) }));
  }
}
