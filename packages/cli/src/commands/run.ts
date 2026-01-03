// rms run <taskId> - Launch Claude CLI with task context
import { Command } from 'commander';
import { execSync, spawn } from 'child_process';
import { getAllTasks } from '../server/spec-parser.js';

export function createRunCommand(): Command {
  return new Command('run')
    .description('Run a spec task with Claude CLI')
    .argument('<taskId>', 'Task ID (e.g., T1.1)')
    .option('-p, --project <path>', 'Project directory', process.cwd())
    .action(async (taskId: string, options: { project: string }) => {
      // 1. Check if Claude CLI is installed
      try {
        execSync('claude --version', { stdio: 'ignore' });
      } catch {
        console.error('Error: Claude CLI not installed. Run: npm install -g @anthropic-ai/claude-code');
        process.exit(1);
      }

      // 2. Find the task
      const tasks = await getAllTasks(options.project);
      const task = tasks.find(t => t.id === taskId);

      if (!task) {
        console.error(`Task ${taskId} not found. Available tasks:`);
        tasks.slice(0, 10).forEach(t => console.log(`  ${t.id}: ${t.title}`));
        process.exit(1);
      }

      // 3. Generate prompt with task context
      const prompt = `Execute spec task ${task.id}: ${task.title}

Phase: ${task.phase}
Agent: ${task.agent}
Priority: ${task.priority}
Progress: ${task.progress}%

Subtasks:
${task.subtasks.map(s => `- [${s.done ? 'x' : ' '}] ${s.text}`).join('\n')}

Instructions:
1. Complete all unchecked subtasks
2. Update task status when done
3. Commit changes with message: feat(${task.id}): ${task.title}`;

      console.log(`\n🚀 Launching Claude CLI for task ${taskId}...\n`);
      console.log(`Task: ${task.title}`);
      console.log(`Phase: ${task.phase}`);
      console.log(`Progress: ${task.progress}%\n`);

      // 4. Launch Claude CLI with prompt
      const claude = spawn('claude', ['--print', prompt], {
        stdio: 'inherit',
        cwd: options.project,
      });

      claude.on('close', (code) => {
        process.exit(code || 0);
      });
    });
}
