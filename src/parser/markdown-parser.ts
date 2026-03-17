/**
 * Markdown parser for test files
 * Supports v0.1.0 and v0.2.0 template formats with backward compatibility
 */

import { marked } from 'marked';
import { TestModel, ValidationResult, ValidationError } from './test-model';
import { FileHelpers } from '../utils/file-helpers';
import { VariableParser } from '../utils/variable-parser';
import { Logger } from '../utils/logger';

export class MarkdownParser {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  async parseFile(filePath: string): Promise<TestModel> {
    try {
      const content = await FileHelpers.readFile(filePath);
      const tokens = marked.lexer(content);

      const test: TestModel = {
        title: '',
        description: '',
        url: '',
        steps: [],
        expectedResults: [],
        variables: {},
        filePath
      };

      let currentSection: string = '';
      let isV0_2_0 = false;
      let metadata: any = {};

      for (const token of tokens) {
        if (token.type === 'heading') {
          // Extract title from main heading (# Test: Title)
          if (token.depth === 1 && token.text.toLowerCase().startsWith('test:')) {
            test.title = token.text.substring(5).trim();
          }

          currentSection = token.text.toLowerCase().replace(/\s+/g, '-');

          if (token.text.toLowerCase() === 'metadata') {
            isV0_2_0 = true;
          }
          continue;
        }

        if (token.type === 'list') {
          for (const item of token.items || []) {
            if (currentSection === 'steps') {
              // Try to match numbered list format first
              const stepMatch = item.text.match(/^(\d+)\.\s*(.+)$/);
              if (stepMatch) {
                const [, number, description] = stepMatch;
                test.steps.push({
                  number: parseInt(number, 10),
                  description: description.trim()
                });
              } else {
                // If no number, auto-increment from existing steps
                const stepNumber = test.steps.length + 1;
                test.steps.push({
                  number: stepNumber,
                  description: item.text.trim()
                });
              }
            } else if (currentSection === 'expected-results') {
              test.expectedResults.push(item.text.trim().replace(/^-\s*/, ''));
            } else if (currentSection === 'variables') {
              const variables = VariableParser.extractVariables(item.text);
              test.variables = { ...test.variables, ...variables };
            }
          }
        } else if (token.type === 'paragraph' && token.text) {
          const text = token.text.trim();

          // Handle variables in paragraph format (not list)
          if (currentSection === 'variables') {
            const variables = VariableParser.extractVariables(text);
            test.variables = { ...test.variables, ...variables };
          } else if (currentSection === 'description') {
            test.description = text;
          } else if (currentSection === 'url') {
            // Capture the URL text first (may contain variables)
            test.url = text;
          } else if (currentSection.startsWith('test')) {
            const titleMatch = text.match(/^test:\s*(.+)$/i);
            if (titleMatch) {
              test.title = titleMatch[1].trim();
            }
          } else if (currentSection === 'metadata') {
            if (text.startsWith('Version:')) {
              metadata.version = text.replace('Version:', '').trim();
            } else if (text.startsWith('Priority:')) {
              metadata.priority = text.replace('Priority:', '').trim();
            } else if (text.startsWith('Tags:')) {
              metadata.tags = text.replace('Tags:', '').trim().split(',').map((t: string) => t.trim());
            }
          } else if (currentSection === 'precondition') {
            test.precondition = text;
          } else if (currentSection === 'postcondition') {
            test.postcondition = text;
          }
        } else if (token.type === 'code' && token.text) {
          // Handle code blocks if needed
        } else if (token.type === 'liststart') {
          // Skip list start tokens
        } else if (token.type === 'listend') {
          // Skip list end tokens
        } else if (token.type === 'blockquote') {
          // Handle blockquotes if needed
        }
      }

      if (isV0_2_0) {
        test.metadata = metadata;
      }

      // Parse variables in URL and other fields
      test.url = VariableParser.parse(test.url, test.variables);
      test.description = VariableParser.parse(test.description, test.variables);
      test.steps.forEach(step => {
        step.description = VariableParser.parse(step.description, test.variables);
      });
      test.expectedResults = test.expectedResults.map(result =>
        VariableParser.parse(result, test.variables)
      );

      const validation = this.validateTest(test);
      if (!validation.valid) {
        throw new Error(`Invalid test format: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      this.logger.debug(`Parsed test: ${test.title}`);
      return test;
    } catch (error) {
      throw new Error(`Failed to parse test file ${filePath}: ${error}`);
    }
  }

  async parseDirectory(dirPath: string): Promise<TestModel[]> {
    try {
      const files = await FileHelpers.listFiles(dirPath, '.md');
      const tests: TestModel[] = [];

      for (const file of files) {
        try {
          const test = await this.parseFile(file);
          tests.push(test);
        } catch (error) {
          this.logger.warning(`Skipping invalid test file ${file}: ${error}`);
        }
      }

      return tests;
    } catch (error) {
      throw new Error(`Failed to parse directory ${dirPath}: ${error}`);
    }
  }

  private validateTest(test: TestModel): ValidationResult {
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
}
