/**
 * Prioritized test queue for parallel execution
 */

import { TestModel } from '../parser/test-model';

export interface QueuedTest {
  test: TestModel;
  priority: number;
  retries: number;
  code?: string;
  cacheStatus?: 'hit' | 'miss';
}

export interface QueueStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
}

export class TestQueue {
  private queue: QueuedTest[];
  private completed: Set<string>;
  private failed: Set<string>;
  private maxRetries: number;

  constructor(maxRetries: number = 2) {
    this.queue = [];
    this.completed = new Set();
    this.failed = new Set();
    this.maxRetries = maxRetries;
  }

  /**
   * Add tests to the queue
   */
  enqueue(tests: TestModel[], codes?: string[], cacheStatuses?: Array<'hit' | 'miss'>): void {
    for (let i = 0; i < tests.length; i++) {
      this.queue.push({
        test: tests[i],
        priority: 0, // Can be enhanced with custom priority logic
        retries: 0,
        code: codes?.[i],
        cacheStatus: cacheStatuses?.[i]
      });
    }
  }

  /**
   * Add a single test to the queue
   */
  enqueueOne(test: TestModel, code?: string, cacheStatus?: 'hit' | 'miss'): void {
    this.queue.push({
      test,
      priority: 0,
      retries: 0,
      code,
      cacheStatus
    });
  }

  /**
   * Get next test from queue
   */
  dequeue(): QueuedTest | null {
    if (this.queue.length === 0) {
      return null;
    }

    // Sort by priority (lower number = higher priority)
    this.queue.sort((a, b) => a.priority - b.priority);
    return this.queue.shift() || null;
  }

  /**
   * Mark test as completed
   */
  markCompleted(testPath: string): void {
    this.completed.add(testPath);
  }

  /**
   * Mark test as failed
   */
  markFailed(testPath: string): void {
    this.failed.add(testPath);
  }

  /**
   * Retry a failed test
   */
  retry(test: TestModel, code?: string, cacheStatus?: 'hit' | 'miss'): void {
    const queuedTest = this.queue.find(qt => qt.test.filePath === test.filePath);

    if (queuedTest) {
      queuedTest.retries++;
      if (queuedTest.retries <= this.maxRetries) {
        this.enqueueOne(test, code, cacheStatus);
      }
    }
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get queue length
   */
  getLength(): number {
    return this.queue.length;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return {
      total: this.queue.length + this.completed.size + this.failed.size,
      pending: this.queue.length,
      completed: this.completed.size,
      failed: this.failed.size
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.completed.clear();
    this.failed.clear();
  }

  /**
   * Get all pending tests
   */
  getPendingTests(): TestModel[] {
    return this.queue.map(qt => qt.test);
  }

  /**
   * Check if a test is in the queue
   */
  hasTest(testPath: string): boolean {
    return this.queue.some(qt => qt.test.filePath === testPath);
  }

  /**
   * Remove a test from the queue
   */
  removeTest(testPath: string): boolean {
    const index = this.queue.findIndex(qt => qt.test.filePath === testPath);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Set priority for a test
   */
  setPriority(testPath: string, priority: number): void {
    const queuedTest = this.queue.find(qt => qt.test.filePath === testPath);
    if (queuedTest) {
      queuedTest.priority = priority;
    }
  }

  /**
   * Update code for a test in the queue
   */
  updateCode(testPath: string, code: string, cacheStatus?: 'hit' | 'miss'): void {
    const queuedTest = this.queue.find(qt => qt.test.filePath === testPath);
    if (queuedTest) {
      queuedTest.code = code;
      if (cacheStatus) {
        queuedTest.cacheStatus = cacheStatus;
      }
    }
  }
}
