/**
 * Validation utilities
 */

import { TestModel, ValidationResult, ValidationError } from '../parser/test-model';

export class Validators {
  static validateTestModel(test: TestModel): ValidationResult {
    const errors: ValidationError[] = [];

    if (!test.title || test.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    }

    if (!test.url || test.url.trim().length === 0) {
      errors.push({ field: 'url', message: 'URL is required' });
    }

    if (!test.steps || test.steps.length === 0) {
      errors.push({ field: 'steps', message: 'At least one step is required' });
    }

    test.steps.forEach((step, index) => {
      if (!step.description || step.description.trim().length === 0) {
        errors.push({ 
          field: `steps[${index}]`, 
          message: `Step ${step.number} description is required` 
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateGeneratedCode(code: string): { valid: boolean; error?: string } {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: 'Generated code is empty' };
    }

    if (!code.includes('export async function executeTest')) {
      return { 
        valid: false, 
        error: 'Generated code must export an async function named executeTest' 
      };
    }

    return { valid: true };
  }

  static validateConfig(config: any): { valid: boolean; error?: string } {
    if (!config) {
      return { valid: false, error: 'Config is required' };
    }

    if (!config.glm || !config.glm.apiKey) {
      return { valid: false, error: 'GLM API key is required' };
    }

    return { valid: true };
  }
}
