// rms exec <command> - Passthrough to Claude CLI
import { Command } from 'commander';
import { spawn } from 'child_process';

export function createExecCommand(): Command {
  return new Command('exec')
    .description('Execute Claude CLI command')
    .argument('<command...>', 'Command to pass to Claude CLI')
    .allowUnknownOption()
    .action(async (args: string[]) => {
      const claude = spawn('claude', args, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      claude.on('close', (code) => {
        process.exit(code || 0);
      });
    });
}
