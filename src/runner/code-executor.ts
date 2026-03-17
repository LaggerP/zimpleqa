/**
 * Code executor for dynamically executing generated TypeScript code
 */

import { Page } from 'playwright';
import { Logger } from '../utils/logger';

export interface ExecutionResult {
  success: boolean;
  steps: Array<any>;  // Flexible structure to support different step formats
  error?: string;
}

export class CodeExecutor {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  async execute(code: string, page: Page): Promise<ExecutionResult> {
    try {
      this.logger.debug('Executing generated code');

      // PASO 1: Detectar si el código incluye una declaración de función completa
      let codeToExecute = code;

      if (code.includes('function executeTest')) {
        // Extraer solo el cuerpo de la función
        const functionMatch = code.match(/async function executeTest\([^)]*\)\s*\{([\s\S]*)\}/);
        if (functionMatch && functionMatch[1]) {
          codeToExecute = functionMatch[1];
          this.logger.debug('Extracted function body from generated code');
        }
      }

      // PASO 2: Crear el entorno de ejecución con variables estándar
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

      const executeTest = new AsyncFunction('page', `
        const steps = [];
        let success = false;
        let error = null;

        try {
          ${codeToExecute}

          // Si el código no retornó explícitamente, hacerlo ahora
          if (typeof success !== 'undefined') {
            return { success, steps, error };
          }
        } catch (e) {
          return {
            success: false,
            steps: steps,
            error: e.message
          };
        }
      `);

      // PASO 3: Ejecutar el código
      const result = await executeTest(page);

      this.logger.debug('Code executed successfully');

      // PASO 4: Validar resultado
      if (!result) {
        return {
          success: false,
          steps: [],
          error: 'Test function returned undefined or null'
        };
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute code: ${error}`);
      return {
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
