/**
 * Code generator coordinator
 */

import { GLMClient } from './glm-client';
import { TestModel } from '../parser/test-model';
import { GLMConfig } from '../config/config-schema';
import { Logger } from '../utils/logger';
import { Validators } from '../utils/validators';

export class CodeGenerator {
  private client: GLMClient;
  private logger: Logger;

  constructor(config: GLMConfig, logger?: Logger) {
    this.client = new GLMClient(config, logger);
    this.logger = logger || new Logger();
  }

  async generate(test: TestModel, model: string | undefined): Promise<string> {
    try {
      this.logger.info(`Generating code for: ${test.title}`);
      
      const code = await this.client.generateCode(test, model);
      
      const validation = Validators.validateGeneratedCode(code);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      this.logger.success('Code generated successfully');
      return code;
    } catch (error) {
      this.logger.error(`Failed to generate code: ${error}`);
      throw error;
    }
  }

  async generateBatch(tests: TestModel[], model?: string): Promise<string[]> {
    const codes: string[] = [];

    for (const test of tests) {
      try {
        const code = await this.generate(test, model);
        codes.push(code);
      } catch (error) {
        this.logger.error(`Failed to generate code for ${test.title}: ${error}`);
        codes.push('');
      }
    }

    return codes;
  }
}
