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
        max_tokens: 32000
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

Genera código JavaScript que automatice el test descrito.

REQUISITOS:
1. Usa Playwright con JavaScript (NO TypeScript)
2. NO uses import statements
3. Define función: async function executeTest(page) { }
4. Usa selectores robustos (data-testid, role, text content)
5. Espera elementos: page.waitForSelector(selector, { timeout: 30000 })
6. Agrega assertions simples y directos
7. Maneja errores con try-catch blocks
8. TIMEOUT: 30000ms (30 segundos) por acción
9. Log pasos: steps.push({ step: 'descripción', status: 'passed' })
10. Retorna: { success: boolean, steps: Array, error?: string }

ESTRUCTURA OBLIGATORIA:
async function executeTest(page) {
  const steps = [];
  let success = false;
  let error = null;

  try {
    // Tu código aquí
    success = true;
  } catch (e) {
    success = false;
    error = e.message;
  }

  return { success, steps, error };
}

REGLAS ESTRICTAS:
- CÓDIGO JAVASCRIPT PURO (sin TypeScript)
- SIN import statements
- SIN comentarios explicativos
- SIN bloques de markdown (\`\`\`)
- SOLO el código de la función
- Cada acción debe tener su step en el array
- Todos los selectores deben ser específicos`;

    const userPrompt = `TEST: ${test.title}
DESCRIPCIÓN: ${test.description}
URL: ${test.url}

PASOS A IMPLEMENTAR:
${test.steps.map(s => `${s.number}. ${s.description}`).join('\n')}

RESULTADOS ESPERADOS:
${test.expectedResults.map(r => `- ${r}`).join('\n')}

CONTEXTADORES ADICIONALES:
- URL target: ${test.url}
- Cantidad de pasos: ${test.steps.length}
- Timeout recomendado: 30000ms por paso`;

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
