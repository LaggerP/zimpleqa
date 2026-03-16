/**
 * GLM API client
 */

import axios, { AxiosInstance } from 'axios';
import { GLMRequest, GLMResponse } from './glm-types';
import { TestModel } from '../parser/test-model';
import { GLMConfig } from '../config/config-schema';
import { Logger } from '../utils/logger';

export class GLMClient {
  private axios: AxiosInstance;
  private config: GLMConfig;
  private logger: Logger;

  constructor(config: GLMConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger();
    
    this.axios = axios.create({
      baseURL: config.baseUrl,
      timeout: 60000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generateCode(test: TestModel, model?: string): Promise<string> {
    try {
      const selectedModel = model || this.config.model;
      this.logger.debug(`Generating code for test: ${test.title} using model: ${selectedModel}`);

      const { systemPrompt, userPrompt } = this.generatePrompts(test);
      
      const request: GLMRequest = {
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      };

      const response = await this.axios.post<GLMResponse>('/chat/completions', request);
      
      const generatedCode = response.data.choices[0].message.content;
      this.logger.debug('Code generated successfully');
      
      if (response.data.usage) {
        this.logger.debug(`Tokens used: ${response.data.usage.total_tokens}`);
      }

      return this.cleanGeneratedCode(generatedCode);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`GLM API error: ${message}`);
      }
      throw new Error(`Failed to generate code: ${error}`);
    }
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

  private cleanGeneratedCode(code: string): string {
    let cleaned = code;

    cleaned = cleaned.replace(/```typescript/gi, '');
    cleaned = cleaned.replace(/```ts/gi, '');
    cleaned = cleaned.replace(/```/g, '');
    cleaned = cleaned.trim();

    return cleaned;
  }
}
