/**
 * run command - Run test(s)
 */

import path from 'path';
import fs from 'fs/promises';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../../config/config-manager';
import { MarkdownParser } from '../../parser/markdown-parser';
import { CodeGenerator } from '../../ai/code-generator';
import { PlaywrightRunner } from '../../runner/playwright-runner';
import { TerminalReporter } from '../../reporter/terminal-reporter';
import { Validators } from '../../utils/validators';

interface RunOptions {
  model?: string;
  timeout?: string;
  validate?: boolean;
  verbose?: boolean;
}

export async function runCommand(target: string, options: RunOptions): Promise<void> {
  const logger = new Logger(options.verbose);
  const reporter = new TerminalReporter(logger);
  
  logger.section('🚀 Ejecutando tests');

  const configManager = new ConfigManager(undefined, logger);
  await configManager.load();

  const validation = await configManager.validate();
  if (!validation.valid) {
    logger.error(validation.error || 'Unknown validation error');
    process.exit(1);
  }

  const parser = new MarkdownParser(logger);
  const generator = new CodeGenerator(configManager.getGLMConfig(), logger);
  const runner = new PlaywrightRunner(configManager.getPlaywrightConfig(), logger);

  let tests;
  const targetPath = path.resolve(target);

  try {
    const stats = await fs.stat(targetPath);
    
    if (stats.isFile()) {
      if (!targetPath.endsWith('.md')) {
        logger.error('Test file must be a .md file');
        process.exit(1);
      }
      const test = await parser.parseFile(targetPath);
      tests = [test];
    } else if (stats.isDirectory()) {
      tests = await parser.parseDirectory(targetPath);
      
      if (tests.length === 0) {
        logger.error('No test files found in directory');
        process.exit(1);
      }
    } else {
      logger.error('Target must be a file or directory');
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Failed to load tests: ${error}`);
    process.exit(1);
  }

  logger.info(`Loaded ${tests.length} test(s)`);

  const generatedCodes: string[] = [];
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    reporter.printProgress(i + 1, tests.length, test.title);
    
    try {
      const code = await generator.generate(test, options.model);
      
      if (options.validate) {
        const validation = Validators.validateGeneratedCode(code);
        if (!validation.valid) {
          logger.error(`Generated code validation failed: ${validation.error}`);
          process.exit(1);
        }
      }
      
      generatedCodes.push(code);
    } catch (error) {
      logger.error(`\nFailed to generate code for ${test.title}: ${error}`);
      process.exit(1);
    }
  }
  
  reporter.printProgressComplete();
  logger.success('Code generation completed');

  const results = [];
  
  for (let i = 0; i < tests.length; i++) {
    const result = await runner.runTest(tests[i], generatedCodes[i]);
    results.push(result);
    reporter.printResult(result);
  }

  reporter.printSummary(results);

  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}
