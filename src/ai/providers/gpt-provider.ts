/**
 * GPT AI Provider implementation (OpenAI)
 */

import axios, { AxiosInstance } from 'axios';
import { BaseAIProvider, ProviderConfig, GenerationOptions, GenerationResult } from './base-provider';
import { TestModel } from '../../parser/test-model';
import { Logger } from '../../utils/logger';

interface GPTRequest {
  model: string;
  messages: Array<{role: 'system' | 'user' | 'assistant'; content: string}>;
  temperature?: number;
  max_tokens?: number;
}

interface GPTResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GPTProvider extends BaseAIProvider {
  private axios: AxiosInstance;

  constructor(config: ProviderConfig, logger?: Logger) {
    super(config, logger);
    
    this.axios = axios.create({
      baseURL: config.baseUrl || 'https://api.openai.com/v1/',
      timeout: 60000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.logger.debug('GPT Provider initialized');
  }

  async generateCode(test: TestModel, options?: GenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    const selectedModel = options?.model || this.config.model || this.getDefaultModel();

    try {
      this.logger.debug(`Generating code for test: ${test.title} using model: ${selectedModel}`);

      const { systemPrompt, userPrompt } = this.generatePrompts(test);
      
      const request: GPTRequest = {
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 2000
      };

      const response = await this.axios.post<GPTResponse>('/chat/completions', request);
      
      const rawCode = response.data.choices[0].message.content;
      const code = this.cleanGeneratedCode(rawCode);
      const latencyMs = Date.now() - startTime;

      this.logger.debug('Code generated successfully');
      
      if (response.data.usage) {
        this.logger.debug(`Tokens used: ${response.data.usage.total_tokens}`);
      }

      return {
        code,
        model: selectedModel,
        tokensUsed: response.data.usage?.total_tokens,
        latencyMs
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`GPT API error: ${message}`);
      }
      throw new Error(`Failed to generate code: ${error}`);
    }
  }

  async generateCodeBatch(tests: TestModel[], options?: GenerationOptions): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];

    for (const test of tests) {
      try {
        const result = await this.generateCode(test, options);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to generate code for ${test.title}: ${error}`);
        throw error;
      }
    }

    return results;
  }

  validateConfig(): boolean {
    return !!this.config.apiKey;
  }

  getDefaultModel(): string {
    return 'gpt-4-turbo-preview';
  }

  getAvailableModels(): string[] {
    return [
      'gpt-4-turbo-preview',
      'gpt-4-0125-preview',
      'gpt-4-1106-preview',
      'gpt-4',
      'gpt-3.5-turbo-0125',
      'gpt-3.5-turbo-1106'
    ];
  }

  private generatePrompts(test: TestModel): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are an expert in E2E test automation with Playwright.

Generate TypeScript code to automate the described test.

REQUIREMENTS:
1. Use Playwright with TypeScript
2. Import: import { Page } from '@playwright/test';
3. Export async function: export async function executeTest(page: Page)
4. Use robust selectors (data-testid, role, text)
5. Wait for elements before interacting (await waitForSelector)
6. Add assertions: expect().toBeVisible(), etc.
7. Handle errors with try-catch
8. TIMEOUT: 30 seconds per action
9. Return: { success: boolean, steps: Array, error?: string }

IMPORTANT:
- Return ONLY the TypeScript code
- No comments or explanations
- No markdown formatting
- No code blocks (\`\`\`)`;

    const userPrompt = `TEST: ${test.title}
DESCRIPTION: ${test.description}
URL: ${test.url}

STEPS:
${test.steps.map(s => `${s.number}. ${s.description}`).join('\n')}

EXPECTED RESULTS:
${test.expectedResults.join('\n')}`;

    return { systemPrompt, userPrompt };
  }
}
