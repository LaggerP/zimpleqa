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
}

export interface StepResult {
  step: number;
  status: 'passed' | 'failed';
  message: string;
  duration: number;
}
