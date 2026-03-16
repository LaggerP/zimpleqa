/**
 * GLM API request/response interfaces
 */

export interface GLMRequest {
  model: string;
  messages: Array<{role: 'system' | 'user'; content: string}>;
  temperature?: number;
  max_tokens?: number;
}

export interface GLMResponse {
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
