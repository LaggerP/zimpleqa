#!/usr/bin/env node

/**
 * zimpleQA CLI - Entry point
 */

import { Command } from 'commander';
import { Logger } from '../utils/logger';
import { initCommand } from './commands/init';
import { runCommand } from './commands/run';
import { configCommand } from './commands/config';
import { validateCommand } from './commands/validate';
import { migrateCommand } from './commands/migrate';
import { generateCommand } from './commands/generate';
import { analyzeCommand } from './commands/analyze';

const logger = new Logger();

const program = new Command();

program
  .name('zqa')
  .description('AI-powered QA testing tool using Playwright and multiple AI providers')
  .version('0.2.0');

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
  .command('validate <target>')
  .description('Validate test template(s)')
  .action(async (target) => {
    try {
      await validateCommand(target);
    } catch (error) {
      logger.error(`Failed to validate: ${error}`);
      process.exit(1);
    }
  });

program
  .command('migrate <target>')
  .description('Migrate test template(s) from v0.1.0 to v0.2.0')
  .option('-d, --dry-run', 'Show changes without applying them')
  .option('--no-backup', 'Skip creating backup files')
  .action(async (target, options) => {
    try {
      await migrateCommand(target, options);
    } catch (error) {
      logger.error(`Failed to migrate: ${error}`);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate a new test template using AI')
  .option('-o, --output <filename>', 'Output filename (default: auto-generated from title)')
  .option('-p, --provider <provider>', 'AI provider (glm, claude, gpt)')
  .option('-m, --model <model>', 'Model name (provider-specific)')
  .option('-V, --verbose', 'Verbose logging')
  .action(async (options) => {
    try {
      await generateCommand(options);
    } catch (error) {
      logger.error(`Failed to generate test: ${error}`);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze frontend project and generate manual test cases')
  .option('-o, --output <dir>', 'Output directory', '.zqa/tests/cases')
  .option('-f, --force', 'Skip confirmation')
  .option('-p, --min-priority <level>', 'Minimum priority level (high, medium, low)')
  .option('-V, --verbose', 'Verbose logging')
  .action(async (options) => {
    try {
      await analyzeCommand(options);
    } catch (error) {
      logger.error(`Analysis failed: ${error}`);
      process.exit(1);
    }
  });

program
  .command('run <target>')
  .description('Run test(s)')
  .option('-p, --provider <provider>', 'AI provider (glm, claude, gpt)')
  .option('-m, --model <model>', 'Model name (provider-specific)')
  .option('-t, --timeout <seconds>', 'Timeout in seconds', '30')
  .option('-v, --validate', 'Validate generated code before execution')
  .option('-V, --verbose', 'Verbose logging')
  .option('-P, --parallel', 'Enable parallel execution')
  .option('-w, --max-workers <number>', 'Maximum number of parallel workers', '4')
  .action(async (target, options) => {
    try {
      await runCommand(target, options);
    } catch (error) {
      logger.error(`Failed to run tests: ${error}`);
      process.exit(1);
    }
  });

program.parse();
