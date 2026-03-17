/**
 * Execution result interfaces
 */

export interface TestResult {
  test: {
    title: string;
    filePath: string;
  };
  success: boolean;
  steps: StepResult[];
  duration: number;
  error?: string;
  timestamp: Date;
  screenshotPaths?: string[];
  cacheStatus?: 'hit' | 'miss';
}

export interface StepResult {
  step: number;
  status: 'passed' | 'failed';
  message: string;
  duration: number;
}
