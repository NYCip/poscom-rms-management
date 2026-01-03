import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const workflowCommand = new Command('workflow').description('Manage workflow');

workflowCommand
  .command('show')
  .action(async () => {
    const content = await readFile(join(process.cwd(), '.rms', 'workflow', 'workflow.json'), 'utf-8');
    const workflow = JSON.parse(content);

    console.log('\nWorkflow States:');
    workflow.states.forEach((s: any) => console.log(`  - ${s.name} (${s.id})`));

    console.log('\nTransitions:');
    workflow.transitions.forEach((t: any) => console.log(`  ${t.from} -> ${t.to}`));
  });

workflowCommand
  .command('validate')
  .action(async () => {
    const content = await readFile(join(process.cwd(), '.rms', 'workflow', 'workflow.json'), 'utf-8');
    const workflow = JSON.parse(content);
    const stateIds = new Set(workflow.states.map((s: any) => s.id));

    let valid = true;
    for (const t of workflow.transitions) {
      if (!stateIds.has(t.from) || !stateIds.has(t.to)) {
        console.error(`Invalid transition: ${t.from} -> ${t.to}`);
        valid = false;
      }
    }

    console.log(valid ? 'Workflow is valid' : 'Workflow has errors');
  });
