/**
 * Markdown parser for test files
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

      for (const token of tokens) {
        if (token.type === 'heading') {
          currentSection = token.text.toLowerCase().replace(/\s+/g, '-');
          continue;
        }

        if (token.type === 'list') {
          for (const item of token.items || []) {
            if (currentSection === 'pasos-de-prueba' || currentSection === 'steps') {
              const stepMatch = item.text.match(/^(\d+)\.\s*(.+)$/);
              if (stepMatch) {
                const [, number, description] = stepMatch;
                test.steps.push({
                  number: parseInt(number, 10),
                  description: description.trim()
                });
              }
            } else if (currentSection === 'resultados-esperados' || currentSection === 'expected-results') {
              test.expectedResults.push(item.text.trim().replace(/^-\s*/, ''));
            } else if (currentSection === 'variables') {
              const variables = VariableParser.extractVariables(item.text);
              test.variables = { ...test.variables, ...variables };
            }
          }
        } else if (token.type === 'paragraph' && token.text) {
          const text = token.text.trim();
          
          if (currentSection === 'descripcin' || currentSection === 'description') {
            test.description = text;
          } else if (currentSection.startsWith('url-de-prueba') || currentSection === 'url') {
            const urlMatch = text.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
              test.url = urlMatch[0];
            }
          } else if (currentSection.startsWith('test')) {
            const titleMatch = text.match(/^test:\s*(.+)$/i);
            if (titleMatch) {
              test.title = titleMatch[1].trim();
            }
          }
        }
      }

      const validation = this.validateTest(test);
      if (!validation.valid) {
        throw new Error(`Invalid test format: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      test.url = VariableParser.parse(test.url, test.variables);
      
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
