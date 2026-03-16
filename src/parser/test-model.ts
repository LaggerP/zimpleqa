/**
 * Test model interfaces
 */

export interface TestModel {
  title: string;
  description: string;
  url: string;
  steps: TestStep[];
  expectedResults: string[];
  variables: Record<string, string>;
  filePath: string;
}

export interface TestStep {
  number: number;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
