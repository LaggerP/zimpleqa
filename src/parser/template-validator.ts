/**
 * Template Validator v0.2.0
 * Strict validation for test templates with business rules
 */

import { 
  TemplateValidationResult
} from './template-schema';

export class TemplateValidator {
  private static readonly VALID_PRIORITIES = ['high', 'medium', 'low', 'optional'];
  private static readonly VARIABLE_REGEX = /\$\{[A-Z_][A-Z0-9_]*\}/g;
  private static readonly URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

  static validate(parsedTemplate: any): TemplateValidationResult {
    const result: TemplateValidationResult = {
      valid: true,
      version: '0.2.0',
      errors: [],
      warnings: []
    };

    result.version = this.detectVersion(parsedTemplate);

    if (result.version === '0.1.0') {
      this.validateV0_1_0Format(parsedTemplate, result);
    } else if (result.version === '0.2.0') {
      this.validateV0_2_0Format(parsedTemplate, result);
    } else {
      this.validateUnknownFormat(parsedTemplate, result);
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  private static detectVersion(template: any): '0.1.0' | '0.2.0' | 'unknown' {
    if (template.metadata?.version === '0.2.0') {
      return '0.2.0';
    }
    if (template.test || template.description || template.url || template.steps) {
      return '0.1.0';
    }
    return 'unknown';
  }

  private static validateV0_1_0Format(template: any, result: TemplateValidationResult): void {
    result.warnings.push({
      field: 'version',
      message: 'Template uses v0.1.0 format. Consider migrating to v0.2.0.',
      suggestion: 'Run "zqa migrate template <file>" to upgrade'
    });

    if (!template.title) {
      result.errors.push({
        field: 'title',
        message: 'Title is required',
        severity: 'required'
      });
    }

    if (!template.description) {
      result.errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'required'
      });
    }

    if (!template.url) {
      result.errors.push({
        field: 'url',
        message: 'URL is required',
        severity: 'required'
      });
    }

    if (!template.steps || template.steps.length === 0) {
      result.errors.push({
        field: 'steps',
        message: 'At least one step is required',
        severity: 'required'
      });
    } else {
      template.steps.forEach((step: any, index: number) => {
        if (!step.description || step.description.trim().length === 0) {
          result.errors.push({
            field: `steps[${index}]`,
            message: `Step ${step.number || index + 1} description is required`,
            severity: 'required'
          });
        }
      });
    }

    if (!template.expectedResults || template.expectedResults.length === 0) {
      result.errors.push({
        field: 'expectedResults',
        message: 'At least one expected result is required',
        severity: 'required'
      });
    }
  }

  private static validateV0_2_0Format(template: any, result: TemplateValidationResult): void {
    if (!template.test || !template.test.title) {
      result.errors.push({
        field: 'test.title',
        message: 'Test title is required',
        severity: 'required'
      });
    }

    if (!template.description || !template.description.text) {
      result.errors.push({
        field: 'description.text',
        message: 'Description is required',
        severity: 'required'
      });
    }

    if (!template.url || !template.url.url) {
      result.errors.push({
        field: 'url.url',
        message: 'URL is required',
        severity: 'required'
      });
    } else {
      this.validateURL(template.url.url, result);
    }

    if (!template.steps || !template.steps.steps || template.steps.steps.length === 0) {
      result.errors.push({
        field: 'steps.steps',
        message: 'At least one step is required',
        severity: 'required'
      });
    } else {
      this.validateSteps(template.steps.steps, result);
    }

    if (!template.expectedResults || !template.expectedResults.results || template.expectedResults.results.length === 0) {
      result.errors.push({
        field: 'expectedResults.results',
        message: 'At least one expected result is required',
        severity: 'required'
      });
    }

    if (template.metadata) {
      this.validateMetadata(template.metadata, result);
    }

    if (template.variables && Array.isArray(template.variables.variables)) {
      this.validateVariables(template.variables.variables, result);
    }
  }

  private static validateUnknownFormat(_template: any, result: TemplateValidationResult): void {
    result.errors.push({
      field: 'format',
      message: 'Unknown template format. Could not detect version',
      severity: 'format'
    });
  }

  private static validateURL(url: string, result: TemplateValidationResult): void {
    const hasVariables = this.VARIABLE_REGEX.test(url);
    
    if (!hasVariables) {
      if (!this.URL_REGEX.test(url)) {
        result.errors.push({
          field: 'url.url',
          message: 'Invalid URL format',
          severity: 'format'
        });
      }
    }
  }

  private static validateSteps(steps: any[], result: TemplateValidationResult): void {
    let previousNumber = 0;

    steps.forEach((step: any, index: number) => {
      if (!step.number) {
        result.errors.push({
          field: `steps[${index}].number`,
          message: 'Step number is required',
          severity: 'required'
        });
      } else if (step.number <= previousNumber) {
        result.errors.push({
          field: `steps[${index}].number`,
          message: `Step number must be greater than previous step (${previousNumber})`,
          severity: 'validation'
        });
      } else {
        previousNumber = step.number;
      }

      if (!step.description || step.description.trim().length === 0) {
        result.errors.push({
          field: `steps[${index}].description`,
          message: 'Step description is required',
          severity: 'required'
        });
      }
    });
  }

  private static validateMetadata(metadata: any, result: TemplateValidationResult): void {
    if (metadata.version && metadata.version !== '0.2.0') {
      result.errors.push({
        field: 'metadata.version',
        message: `Invalid metadata version: ${metadata.version}. Expected: 0.2.0`,
        severity: 'validation'
      });
    }

    if (metadata.priority && !this.VALID_PRIORITIES.includes(metadata.priority)) {
      result.errors.push({
        field: 'metadata.priority',
        message: `Invalid priority: ${metadata.priority}. Valid values: ${this.VALID_PRIORITIES.join(', ')}`,
        severity: 'validation'
      });
    }

    if (metadata.tags) {
      if (!Array.isArray(metadata.tags)) {
        result.errors.push({
          field: 'metadata.tags',
          message: 'Tags must be an array',
          severity: 'format'
        });
      }
    }
  }

  private static validateVariables(variables: any[], result: TemplateValidationResult): void {
    const variableNames = new Set<string>();

    variables.forEach((variable: any, index: number) => {
      if (!variable.name || variable.name.trim().length === 0) {
        result.errors.push({
          field: `variables[${index}].name`,
          message: 'Variable name is required',
          severity: 'required'
        });
      } else {
        if (variableNames.has(variable.name)) {
          result.errors.push({
            field: `variables[${index}].name`,
            message: `Duplicate variable name: ${variable.name}`,
            severity: 'validation'
          });
        } else {
          variableNames.add(variable.name);
        }

        if (!/^[A-Z_][A-Z0-9_]*$/.test(variable.name)) {
          result.warnings.push({
            field: `variables[${index}].name`,
            message: `Variable name "${variable.name}" does not follow naming convention`,
            suggestion: 'Use UPPERCASE with underscores (e.g., BASE_URL)'
          });
        }
      }

      if (!variable.value || variable.value.trim().length === 0) {
        result.errors.push({
          field: `variables[${index}].value`,
          message: 'Variable value is required',
          severity: 'required'
        });
      }
    });
  }

  static isV0_2_0Template(_template: any): boolean {
    return this.detectVersion(_template) === '0.2.0';
  }

  static getValidationSummary(result: TemplateValidationResult): string {
    const lines: string[] = [];

    if (result.valid) {
      lines.push('✅ Template is valid');
    } else {
      lines.push('❌ Template validation failed');
    }

    if (result.warnings.length > 0) {
      lines.push(`⚠️  ${result.warnings.length} warning(s)`);
    }

    return lines.join('\n');
  }
}
