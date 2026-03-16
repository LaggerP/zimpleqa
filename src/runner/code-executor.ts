/**
 * Code executor for dynamically executing generated TypeScript code
 */

import { Page } from 'playwright';
import { Logger } from '../utils/logger';

export interface ExecutionResult {
  success: boolean;
  steps: Array<{
    step: number;
    status: 'passed' | 'failed';
    message: string;
  }>;
  error?: string;
}

export class CodeExecutor {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  async execute(code: string, page: Page): Promise<ExecutionResult> {
    try {
      this.logger.debug('Executing generated code');

      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const executeTest = new AsyncFunction('page', code) as (page: Page) => Promise<ExecutionResult>;

      const result = await executeTest(page);
      
      this.logger.debug('Code executed successfully');
      return result;
    } catch (error) {
      this.logger.error(`Failed to execute code: ${error}`);
      return {
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
