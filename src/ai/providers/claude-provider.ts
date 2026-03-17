/**
 * Claude AI Provider implementation
 */

import axios, { AxiosInstance } from 'axios';
import { BaseAIProvider, ProviderConfig, GenerationOptions, GenerationResult } from './base-provider';
import { TestModel } from '../../parser/test-model';
import { Logger } from '../../utils/logger';

interface ClaudeRequest {
  model: string;
  messages: Array<{role: 'user' | 'assistant'; content: string}>;
  max_tokens?: number;
  temperature?: number;
}

interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeProvider extends BaseAIProvider {
  private axios: AxiosInstance;

  constructor(config: ProviderConfig, logger?: Logger) {
    super(config, logger);
    
    this.axios = axios.create({
      baseURL: 'https://api.anthropic.com/v1/',
      timeout: 60000,
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });

    this.logger.debug('Claude Provider initialized');
  }

  async generateCode(test: TestModel, options?: GenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    const selectedModel = options?.model || this.config.model || this.getDefaultModel();

    try {
      this.logger.debug(`Generating code for test: ${test.title} using model: ${selectedModel}`);

      const { systemPrompt, userPrompt } = this.generatePrompts(test);
      
      const request: ClaudeRequest = {
        model: selectedModel,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 2000
      };

      const response = await this.axios.post<ClaudeResponse>('/messages', {
        ...request,
        system: systemPrompt
      });
      
      const rawCode = response.data.content[0].text;
      const code = this.cleanGeneratedCode(rawCode);
      const latencyMs = Date.now() - startTime;

      this.logger.debug('Code generated successfully');
      
      if (response.data.usage) {
        this.logger.debug(`Tokens used: ${response.data.usage.input_tokens + response.data.usage.output_tokens}`);
      }

      return {
        code,
        model: selectedModel,
        tokensUsed: response.data.usage ? response.data.usage.input_tokens + response.data.usage.output_tokens : undefined,
        latencyMs
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Claude API error: ${message}`);
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
    return 'claude-3-5-sonnet-20241022';
  }

  getAvailableModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  private generatePrompts(test: TestModel): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `Eres un experto en automatización de pruebas E2E con Playwright.

Genera código TypeScript que automatice el test descuido.

REQUISITOS:
1. Usa Playwright con TypeScript
2. Importa: import { Page } from '@playwright/test';
3. Exporta función async: export async function executeTest(page: Page)
4. Usa selectores robustos (data-testid, role, text)
5. Espera elementos antes de interactuar (await waitForSelector)
6. Agrega assertions: expect().toBeVisible(), etc.
7. Maneja errores con try-catch
8. TIMEOUT: 30 segundos por acción
9. Retorna: { success: boolean, steps: Array, error?: string }

IMPORTANTE:
- Devuelve SOLO el código TypeScript
- Sin comentarios ni explicaciones
- Sin markdown formatting
- Sin bloques de código (\`\`\`)`;

    const userPrompt = `TEST: ${test.title}
DESCRIPCIÓN: ${test.description}
URL: ${test.url}

PASOS:
${test.steps.map(s => `${s.number}. ${s.description}`).join('\n')}

RESULTADOS ESPERADOS:
${test.expectedResults.join('\n')}`;

    return { systemPrompt, userPrompt };
  }
}
