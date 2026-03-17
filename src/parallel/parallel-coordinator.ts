/**
 * Parallel execution coordinator
 */

import { TestModel } from '../parser/test-model';
import { TestResult } from '../runner/execution-result';
import { PlaywrightRunner } from '../runner/playwright-runner';
import { CodeGenerator } from '../ai/code-generator';
import { WorkerPool, WorkerPoolConfig } from './worker-pool';
import { TestQueue, QueuedTest } from './test-queue';
import { Logger } from '../utils/logger';
import { Page } from 'playwright';

export interface ParallelExecutionOptions {
  maxWorkers: number;
  strategy: 'aggressive' | 'balanced' | 'conservative';
  maxRetries?: number;
}

export class ParallelCoordinator {
  private workerPool: WorkerPool;
  private runner: PlaywrightRunner;
  private generator: CodeGenerator;
  private logger: Logger;
  private queue: TestQueue;
  private options: ParallelExecutionOptions;

  constructor(
    workerPoolConfig: WorkerPoolConfig,
    runner: PlaywrightRunner,
    generator: CodeGenerator,
    logger?: Logger
  ) {
    this.options = {
      maxWorkers: workerPoolConfig.maxWorkers,
      strategy: workerPoolConfig.strategy,
      maxRetries: 2
    };

    this.workerPool = new WorkerPool(workerPoolConfig, logger);
    this.runner = runner;
    this.generator = generator;
    this.logger = logger || new Logger();
    this.queue = new TestQueue(this.options.maxRetries);
  }

  /**
   * Execute tests in parallel
   */
  async executeParallel(tests: TestModel[]): Promise<TestResult[]> {
    await this.workerPool.initialize();

    const results: TestResult[] = [];

    // Generate all codes first
    this.logger.info('Generating code for all tests...');
    const generationResults = await this.generator.generateBatch(tests);

    const codes: string[] = [];
    const cacheStatuses: Array<'hit' | 'miss'> = [];

    for (const result of generationResults) {
      codes.push(result.code);
      cacheStatuses.push(result.cacheStatus);
    }

    // Enqueue all tests
    this.queue.enqueue(tests, codes, cacheStatuses);

    this.logger.info(`Executing ${tests.length} tests with ${this.options.maxWorkers} workers...`);

    // Execute tests in parallel
    const executionPromises: Promise<void>[] = [];
    const activeWorkers = new Set<number>();

    // Start workers
    for (let i = 0; i < this.options.maxWorkers; i++) {
      executionPromises.push(this.workerLoop(i, activeWorkers, results));
    }

    // Wait for all workers to finish
    await Promise.all(executionPromises);

    await this.workerPool.shutdown();

    this.logger.success(`Parallel execution completed: ${results.length} results`);
    return results;
  }

  /**
   * Worker loop for processing tests from the queue
   */
  private async workerLoop(
    workerId: number,
    activeWorkers: Set<number>,
    results: TestResult[]
  ): Promise<void> {
    activeWorkers.add(workerId);

    while (!this.queue.isEmpty()) {
      const queuedTest = this.queue.dequeue();

      if (!queuedTest) {
        break;
      }

      const worker = await this.workerPool.waitForWorker();
      if (!worker) {
        this.logger.error(`Worker ${workerId} failed to get available worker`);
        break;
      }

      try {
        const result = await this.executeWithWorker(worker, queuedTest);
        results.push(result);

        if (result.success) {
          this.queue.markCompleted(queuedTest.test.filePath);
        } else {
          this.queue.markFailed(queuedTest.test.filePath);

          // Retry if retries available
          if (queuedTest.retries < this.options.maxRetries!) {
            this.logger.info(`Retrying test: ${queuedTest.test.title} (attempt ${queuedTest.retries + 1}/${this.options.maxRetries})`);
            queuedTest.retries++;
            this.queue.enqueueOne(
              queuedTest.test,
              queuedTest.code,
              queuedTest.cacheStatus
            );
          }
        }
      } catch (error) {
        this.logger.error(`Worker ${workerId} failed to execute test: ${error}`);
        this.queue.markFailed(queuedTest.test.filePath);

        // Retry on error
        if (queuedTest.retries < this.options.maxRetries!) {
          this.logger.info(`Retrying test after error: ${queuedTest.test.title}`);
          queuedTest.retries++;
          this.queue.enqueueOne(
            queuedTest.test,
            queuedTest.code,
            queuedTest.cacheStatus
          );
        }
      } finally {
        this.workerPool.releaseWorker(worker.id);
      }
    }

    activeWorkers.delete(workerId);
  }

  /**
   * Execute a single test with a worker
   */
  private async executeWithWorker(
    worker: any,
    queuedTest: QueuedTest
  ): Promise<TestResult> {
    const { test, code, cacheStatus } = queuedTest;

    this.logger.info(`[Worker ${worker.id}] Executing: ${test.title}`);

    const startTime = Date.now();

    try {
      // Create new page context for this test
      const context = await worker.browser!.newContext();
      const page = await context.newPage();

      // Execute the test
      const result = await this.executeTestWithContext(page, test, code!, cacheStatus);

      await context.close();

      const duration = Date.now() - startTime;
      this.logger.success(`[Worker ${worker.id}] Completed: ${test.title} (${duration}ms)`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`[Worker ${worker.id}] Failed: ${test.title} - ${errorMessage}`);

      return {
        test: {
          title: test.title,
          filePath: test.filePath
        },
        success: false,
        steps: [],
        duration,
        error: errorMessage,
        timestamp: new Date(),
        cacheStatus
      };
    }
  }

  /**
   * Execute test with a specific page context
   */
  private async executeTestWithContext(
    page: Page,
    test: TestModel,
    code: string,
    cacheStatus?: 'hit' | 'miss'
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Execute the generated code
      const { CodeExecutor } = await import('../runner/code-executor');
      const executor = new CodeExecutor(this.logger);
      const result = await executor.execute(code, page);

      const duration = Date.now() - startTime;

      // Capture screenshot if enabled
      const { ScreenshotCapture } = await import('../screenshots/screenshot-capture');
      const screenshotConfig = this.runner['screenshotCapture']['config'];
      const screenshotCapture = new ScreenshotCapture(screenshotConfig, this.logger);

      const screenshotPath = await screenshotCapture.capture(
        page,
        test.title,
        result.success ? 'passed' : 'failed'
      );

      return {
        test: {
          title: test.title,
          filePath: test.filePath
        },
        success: result.success,
        steps: result.steps.map(step => ({
          ...step,
          duration: 0
        })),
        duration,
        error: result.error,
        timestamp: new Date(),
        screenshotPaths: screenshotPath ? [screenshotPath] : [],
        cacheStatus
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        test: {
          title: test.title,
          filePath: test.filePath
        },
        success: false,
        steps: [],
        duration,
        error: errorMessage,
        timestamp: new Date(),
        cacheStatus
      };
    }
  }

  /**
   * Get execution statistics
   */
  getStats(): {
    workerPool: any;
    queue: any;
  } {
    return {
      workerPool: this.workerPool.getStats(),
      queue: this.queue.getStats()
    };
  }
}
