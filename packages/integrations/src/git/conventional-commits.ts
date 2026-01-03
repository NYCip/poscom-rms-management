export type CommitType = 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'chore';

export interface ConventionalCommitOptions {
  type: CommitType;
  scope?: string;
  description: string;
  body?: string;
  breaking?: boolean;
  issueIds?: string[];
}

export class ConventionalCommits {
  generate(opts: ConventionalCommitOptions): string {
    let header = opts.type;
    if (opts.scope) header += `(${opts.scope})`;
    if (opts.breaking) header += '!';
    header += `: ${opts.description}`;

    const parts = [header];
    if (opts.body) parts.push('', opts.body);
    if (opts.issueIds?.length) parts.push('', `Refs: ${opts.issueIds.join(', ')}`);

    return parts.join('\n');
  }

  validate(message: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const pattern = /^(feat|fix|docs|style|refactor|perf|test|chore)(\([a-z0-9-]+\))?!?: .+$/;
    const header = message.split('\n')[0] ?? '';
    if (!pattern.test(header)) {
      errors.push('Header must follow format: type(scope)?: description');
    }
    return { valid: errors.length === 0, errors };
  }
}
