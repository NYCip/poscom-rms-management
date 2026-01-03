import { Command } from 'commander';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export const initCommand = new Command('init')
  .description('Initialize RMS in the current directory')
  .option('-d, --directory <path>', 'Target directory', process.cwd())
  .action(async (options) => {
    const targetDir = options.directory;
    const rmsDir = join(targetDir, '.rms');

    await mkdir(join(rmsDir, 'issues'), { recursive: true });
    await mkdir(join(rmsDir, 'workflow'), { recursive: true });

    const workflow = {
      states: [
        { id: 'draft', name: 'Draft' },
        { id: 'ready', name: 'Ready' },
        { id: 'in_progress', name: 'In Progress' },
        { id: 'review', name: 'Review' },
        { id: 'done', name: 'Done' },
      ],
      transitions: [
        { from: 'draft', to: 'ready' },
        { from: 'ready', to: 'in_progress' },
        { from: 'in_progress', to: 'review' },
        { from: 'review', to: 'done' },
      ],
      initialState: 'draft'
    };

    await writeFile(join(rmsDir, 'workflow', 'workflow.json'), JSON.stringify(workflow, null, 2));
    await writeFile(join(rmsDir, 'config.json'), JSON.stringify({ version: '0.1.0' }, null, 2));

    console.log('RMS initialized successfully!');
  });
