/**
 * Worker pool for parallel test execution
 */

import { chromium, Browser } from 'playwright';
import { PlaywrightConfig } from '../config/config-schema';
import { Logger } from '../utils/logger';

export interface Worker {
  id: number;
  status: 'idle' | 'busy' | 'error';
  browser?: Browser;
  currentTest?: string;
  PID?: number;
}

export interface WorkerPoolConfig {
  maxWorkers: number;
  playwrightConfig: PlaywrightConfig;
  strategy: 'aggressive' | 'balanced' | 'conservative';
}

export class WorkerPool {
  private workers: Worker[];
  private config: WorkerPoolConfig;
  private logger: Logger;
  private initialized: boolean = false;

  constructor(config: WorkerPoolConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger();
    this.workers = [];
  }

  /**
   * Initialize worker pool with browsers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warning('Worker pool already initialized');
      return;
    }

    this.logger.info(`Initializing worker pool with ${this.config.maxWorkers} workers...`);

    for (let i = 0; i < this.config.maxWorkers; i++) {
      try {
        const browser = await this.createBrowser();
        this.workers.push({
          id: i,
          status: 'idle',
          browser
        });
        this.logger.debug(`Worker ${i} initialized`);
      } catch (error) {
        this.logger.error(`Failed to initialize worker ${i}: ${error}`);
        this.workers.push({
          id: i,
          status: 'error'
        });
      }
    }

    this.initialized = true;
    this.logger.success(`Worker pool initialized with ${this.getAvailableWorkerCount()} available workers`);
  }

  /**
   * Get an available worker
   */
  async assignWork(): Promise<Worker | null> {
    const idleWorker = this.workers.find(w => w.status === 'idle');

    if (!idleWorker) {
      this.logger.debug('No available workers');
      return null;
    }

    idleWorker.status = 'busy';
    this.logger.debug(`Worker ${idleWorker.id} assigned work`);
    return idleWorker;
  }

  /**
   * Release a worker back to the pool
   */
  releaseWorker(workerId: number): void {
    const worker = this.workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = 'idle';
      worker.currentTest = undefined;
      this.logger.debug(`Worker ${workerId} released`);
    }
  }

  /**
   * Get count of available workers
   */
  getAvailableWorkerCount(): number {
    return this.workers.filter(w => w.status === 'idle').length;
  }

  /**
   * Get count of busy workers
   */
  getBusyWorkerCount(): number {
    return this.workers.filter(w => w.status === 'busy').length;
  }

  /**
   * Wait for an available worker
   */
  async waitForWorker(timeout: number = 30000): Promise<Worker | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const worker = await this.assignWork();
      if (worker) {
        return worker;
      }

      // Wait a bit before trying again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.logger.error(`Timeout waiting for available worker (${timeout}ms)`);
    return null;
  }

  /**
   * Shutdown all workers
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down worker pool...');

    for (const worker of this.workers) {
      if (worker.browser) {
        try {
          await worker.browser.close();
          this.logger.debug(`Worker ${worker.id} browser closed`);
        } catch (error) {
          this.logger.warning(`Failed to close browser for worker ${worker.id}: ${error}`);
        }
      }
    }

    this.workers = [];
    this.initialized = false;
    this.logger.success('Worker pool shut down');
  }

  /**
   * Create a browser instance
   */
  private async createBrowser(): Promise<Browser> {
    const launchOptions: any = {
      headless: this.config.playwrightConfig.headless
    };

    switch (this.config.playwrightConfig.browser) {
      case 'chromium':
        return await chromium.launch(launchOptions);
      case 'firefox':
        return await chromium.launch({ ...launchOptions, channel: 'firefox' });
      case 'webkit':
        return await chromium.launch({ ...launchOptions, channel: 'webkit' });
      default:
        throw new Error(`Unsupported browser: ${this.config.playwrightConfig.browser}`);
    }
  }

  /**
   * Get worker statistics
   */
  getStats(): { total: number; available: number; busy: number; errors: number } {
    return {
      total: this.workers.length,
      available: this.getAvailableWorkerCount(),
      busy: this.getBusyWorkerCount(),
      errors: this.workers.filter(w => w.status === 'error').length
    };
  }
}
