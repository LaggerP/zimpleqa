/**
 * Test model interfaces
 * Supports both v0.1.0 and v0.2.0 template formats
 */

export interface TestModel {
  title: string;
  description: string;
  url: string;
  steps: TestStep[];
  expectedResults: string[];
  variables: Record<string, string>;
  filePath: string;
  // v0.2.0 optional fields
  metadata?: TestMetadata;
  precondition?: string;
  postcondition?: string;
  notes?: string[];
}

export interface TestStep {
  number: number;
  description: string;
}

export interface TestMetadata {
  version: '0.2.0';
  author?: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low' | 'optional';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
