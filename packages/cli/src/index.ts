#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { issueCommand } from './commands/issue.js';
import { workflowCommand } from './commands/workflow.js';
import { dashboardCommand } from './commands/dashboard.js';

const program = new Command();

program
  .name('rms')
  .description('POS.com Requirements Management System CLI')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(issueCommand);
program.addCommand(workflowCommand);
program.addCommand(dashboardCommand);

program.parse();
