/**
 * Base provider interface for AI code generation
 * All AI providers (GLM, Claude, GPT) must implement this interface
 */

import { TestModel } from '../../parser/test-model';

export interface ProviderConfig {
  apiKey: string;
  model: string;
  [key: string]: any;
}

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

export interface GenerationResult {
  code: string;
  model: string;
  tokensUsed?: number;
  latencyMs: number;
}

export abstract class BaseAIProvider {
  protected config: ProviderConfig;
  protected logger: any;

  constructor(config: ProviderConfig, logger?: any) {
    this.config = config;
    this.logger = logger || this.createLogger();
  }

  abstract generateCode(test: TestModel, options?: GenerationOptions): Promise<GenerationResult>;

  abstract generateCodeBatch(tests: TestModel[], options?: GenerationOptions): Promise<GenerationResult[]>;

  abstract validateConfig(): boolean;

  abstract getDefaultModel(): string;

  abstract getAvailableModels(): string[];

  protected createLogger() {
    const { Logger } = require('../../utils/logger');
    return new Logger();
  }

  protected async measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
    const start = Date.now();
    const result = await fn();
    return { result, latencyMs: Date.now() - start };
  }

  protected cleanGeneratedCode(code: string): string {
    let cleaned = code;
    cleaned = cleaned.replace(/```typescript/gi, '');
    cleaned = cleaned.replace(/```ts/gi, '');
    cleaned = cleaned.replace(/```javascript/gi, '');
    cleaned = cleaned.replace(/```js/gi, '');
    cleaned = cleaned.replace(/```/g, '');
    cleaned = cleaned.trim();
    return cleaned;
  }
}
