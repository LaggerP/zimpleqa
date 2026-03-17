/**
 * GLM AI Provider implementation
 * Refactored from GLMClient to use BaseAIProvider interface
 */

import axios, { AxiosInstance } from 'axios';
import { BaseAIProvider, ProviderConfig, GenerationOptions, GenerationResult } from './base-provider';
import { TestModel } from '../../parser/test-model';
import { Logger } from '../../utils/logger';
import { Spinner } from '../../utils/progress';

interface GLMRequest {
  model: string;
  messages: Array<{role: 'system' | 'user'; content: string}>;
  temperature?: number;
  max_tokens?: number;
}

interface GLMResponse {
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

export class GLMProvider extends BaseAIProvider {
  private axios: AxiosInstance;

  constructor(config: ProviderConfig, logger?: Logger) {
    super(config, logger);
    
    this.axios = axios.create({
      baseURL: config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4/',
      timeout: 120000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.logger.debug('GLM Provider initialized');
  }

  async generateCode(test: TestModel, options?: GenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    const selectedModel = options?.model || this.config.model || this.getDefaultModel();

    const spinner = new Spinner(`Generating code for: ${test.title}`);

    try {
      this.logger.debug(`Generating code for test: ${test.title} using model: ${selectedModel}`);
      spinner.start();

      const { systemPrompt, userPrompt } = this.generatePrompts(test);

      const request: GLMRequest = {
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 32000
      };

      const response = await this.axios.post<GLMResponse>('/chat/completions', request);

      const rawCode = response.data.choices[0].message.content;
      const code = this.cleanGeneratedCode(rawCode);
      const latencyMs = Date.now() - startTime;

      spinner.stop('Code generated successfully');

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
      spinner.stop('Code generation failed');
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`GLM API error: ${message}`);
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
    return 'glm-4.7';
  }

  getAvailableModels(): string[] {
    return ['glm-4.7', 'glm-5'];
  }

  private generatePrompts(test: TestModel): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are an expert in E2E test automation with Playwright.

Generate JavaScript code to automate the test described.

REQUIREMENTS:
1. Use Playwright with JavaScript (NOT TypeScript)
2. DO NOT use import statements
3. Define function: async function executeTest(page) { }
4. Use robust selectors (data-testid, role, text content)
5. Wait for elements: page.waitForSelector(selector, { timeout: 30000 })
6. Add simple and direct assertions
7. Handle errors with try-catch blocks
8. TIMEOUT: 30000ms (30 seconds) per action
9. Log steps: steps.push({ step: number, message: 'description', status: 'passed' })
10. Return: { success: boolean, steps: Array, error?: string }

MANDATORY STRUCTURE:
async function executeTest(page) {
  const steps = [];
  let success = false;
  let error = null;
  let stepNumber = 1;

  try {
    // Your code here
    // Example of how to add a step:
    // steps.push({ step: stepNumber++, message: 'Action description', status: 'passed' });
    success = true;
  } catch (e) {
    success = false;
    error = e.message;
  }

  return { success, steps, error };
}

STRICT RULES:
- PURE JAVASCRIPT CODE (no TypeScript)
- NO import statements
- NO explanatory comments
- NO markdown blocks (\`\`\`)
- ONLY the function code
- Each action must have its step in the array with format: { step: number, message: 'description', status: 'passed' }
- All selectors must be specific`;

    const userPrompt = `TEST: ${test.title}
DESCRIPTION: ${test.description}
URL: ${test.url}

STEPS TO IMPLEMENT:
${test.steps.map(s => `${s.number}. ${s.description}`).join('\n')}

EXPECTED RESULTS:
${test.expectedResults.map(r => `- ${r}`).join('\n')}

ADDITIONAL CONTEXT:
- Target URL: ${test.url}
- Number of steps: ${test.steps.length}
- Recommended timeout: 30000ms per step`;

    return { systemPrompt, userPrompt };
  }
}
