/**
 * Variable parser utility
 */

export class VariableParser {
  /**
   * Parse variables in a string with format ${VAR_NAME}
   */
  static parse(input: string, variables: Record<string, string>): string {
    if (!input) return input;

    return input.replace(/\$\{(\w+)\}/g, (match, varName) => {
      return variables[varName] || match;
    });
  }

  /**
   * Extract variable declarations from a markdown-like format
   */
  static extractVariables(content: string): Record<string, string> {
    const variables: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        variables[key] = value.trim();
      }
    }

    return variables;
  }

  /**
   * Replace environment variables in the input string
   */
  static parseEnv(input: string): string {
    if (!input) return input;

    return input.replace(/\$\{(\w+)\}/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }

  /**
   * Merge test variables with environment variables
   */
  static mergeVariables(
    testVariables: Record<string, string>,
    envVars?: Record<string, string>
  ): Record<string, string> {
    return { ...envVars, ...testVariables };
  }
}
