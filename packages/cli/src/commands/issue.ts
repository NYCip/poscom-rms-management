import { Command } from 'commander';
import { readdir, readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

const getRmsDir = () => join(process.cwd(), '.rms');

export const issueCommand = new Command('issue').description('Manage issues');

issueCommand
  .command('create')
  .requiredOption('-t, --title <title>', 'Issue title')
  .option('--type <type>', 'Issue type', 'feature')
  .option('--priority <priority>', 'Priority', 'medium')
  .action(async (options) => {
    const id = `ISSUE-${Date.now()}`;
    const content = `---
id: ${id}
type: ${options.type}
priority: ${options.priority}
status: draft
created: ${new Date().toISOString()}
---

# ${options.title}

## Description

Add description here.
`;
    await writeFile(join(getRmsDir(), 'issues', `${id}.md`), content);
    console.log(`Created issue ${id}`);
  });

issueCommand
  .command('list')
  .option('-s, --status <status>', 'Filter by status')
  .action(async (options) => {
    const files = await readdir(join(getRmsDir(), 'issues'));
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const content = await readFile(join(getRmsDir(), 'issues', file), 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const statusMatch = content.match(/^status:\s+(.+)$/m);
      if (!options.status || statusMatch?.[1] === options.status) {
        console.log(`${file.replace('.md', '')}: ${titleMatch?.[1] || 'Untitled'}`);
      }
    }
  });

issueCommand
  .command('show <id>')
  .action(async (id) => {
    const content = await readFile(join(getRmsDir(), 'issues', `${id}.md`), 'utf-8');
    console.log(content);
  });

issueCommand
  .command('delete <id>')
  .action(async (id) => {
    await unlink(join(getRmsDir(), 'issues', `${id}.md`));
    console.log(`Deleted issue ${id}`);
  });
