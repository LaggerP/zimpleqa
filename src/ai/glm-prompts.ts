/**
 * GLM prompt templates
 */

import { TestModel } from '../parser/test-model';

export class GLMPrompts {
  static getSystemPrompt(): string {
    return `Eres un experto en automatización de pruebas E2E con Playwright.

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
  }

  static getUserPrompt(test: TestModel): string {
    return `TEST: ${test.title}
DESCRIPCIÓN: ${test.description}
URL: ${test.url}

PASOS:
${test.steps.map(s => `${s.number}. ${s.description}`).join('\n')}

RESULTADOS ESPERADOS:
${test.expectedResults.join('\n')}`;
  }
}
