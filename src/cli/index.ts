#!/usr/bin/env node

/**
 * zimpleQA CLI - Entry point
 */

import { Command } from 'commander';
import { Logger } from '../utils/logger';
import { initCommand } from './commands/init';
import { runCommand } from './commands/run';
import { configCommand } from './commands/config';

const logger = new Logger();

const program = new Command();

program
  .name('zqa')
  .description('AI-powered QA testing tool using Playwright and GLM')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize zimpleQA in current directory')
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      logger.error(`Failed to initialize: ${error}`);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Manage configuration')
  .action(async () => {
    try {
      await configCommand();
    } catch (error) {
      logger.error(`Failed to manage config: ${error}`);
      process.exit(1);
    }
  });

program
  .command('run <target>')
  .description('Run test(s)')
  .option('-m, --model <model>', 'GLM model (glm-4.7, glm-5)')
  .option('-t, --timeout <seconds>', 'Timeout in seconds', '30')
  .option('-v, --validate', 'Validate generated code before execution')
  .option('-V, --verbose', 'Verbose logging')
  .action(async (target, options) => {
    try {
      await runCommand(target, options);
    } catch (error) {
      logger.error(`Failed to run tests: ${error}`);
      process.exit(1);
    }
  });

program.parse();
