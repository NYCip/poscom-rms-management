import { Command } from 'commander';
import { startServer } from '../server/index.js';

export const dashboardCommand = new Command('dashboard')
  .description('Start the RMS dashboard server')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    console.log(`Starting RMS dashboard on ${options.host}:${port}...`);
    await startServer({ port, host: options.host });
  });
