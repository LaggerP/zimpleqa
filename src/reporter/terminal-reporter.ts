/**
 * Terminal reporter for displaying test results
 */

import { TestResult } from '../runner/execution-result';
import chalk from 'chalk';
import { Logger } from '../utils/logger';

export class TerminalReporter {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  printResult(result: TestResult): void {
    const status = result.success ? chalk.green('✓') : chalk.red('✗');
    const title = result.test.title;
    const duration = `${result.duration}ms`;

    console.log(`${status} ${title} (${duration})`);

    if (!result.success && result.error) {
      console.log(chalk.red(`  Error: ${result.error}`));
    }

    for (const step of result.steps) {
      const stepStatus = step.status === 'passed' 
        ? chalk.green('  ✓') 
        : chalk.red('  ✗');
      console.log(`${stepStatus} Paso ${step.step}: ${step.message}`);
    }
  }

  printSummary(results: TestResult[]): void {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    this.logger.section('\n📊 Resumen');

    console.log(`Total: ${total} tests`);
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(`Duration: ${totalDuration}ms`);

    if (failed > 0) {
      console.log('\n' + chalk.bold('❌ Tests fallados:'));
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(chalk.red(`  ✗ ${r.test.title}`));
          if (r.error) {
            console.log(chalk.red(`    ${r.error}`));
          }
        });
    }
  }

  printProgress(current: number, total: number, testTitle: string): void {
    const percentage = Math.round((current / total) * 100);
    const progress = `[${current}/${total}] ${percentage}%`;
    process.stdout.write(`\r${chalk.blue(progress)} ${testTitle}`);
  }

  printProgressComplete(): void {
    process.stdout.write('\n');
  }
}
