/**
 * Configuration schema for zimpleQA
 * Updated to support multi-provider architecture
 */

export interface Config {
  ai: AIConfig;
  playwright: PlaywrightConfig;
  runner: RunnerConfig;
  test: TestConfig;
  cache: CacheConfig;
  screenshots: ScreenshotConfig;
  parallel: ParallelConfig;
}

export interface AIConfig {
  provider: 'glm' | 'claude' | 'gpt';
  glm?: GLMConfig;
  claude?: ClaudeConfig;
  gpt?: GPTConfig;
}

export interface GLMConfig {
  apiKey: string;
  model: 'glm-4.7' | 'glm-5';
  baseUrl: string;
}

export interface ClaudeConfig {
  apiKey: string;
  model: string;
}

export interface GPTConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface PlaywrightConfig {
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  timeout: number;
}

export interface RunnerConfig {
  timeout: number;
}

export interface TestConfig {
  defaultTimeout: number;
}

export interface CacheConfig {
  enabled: boolean;
  directory: string;
  maxSize: number; // MB
  ttl: number; // seconds
}

export interface ScreenshotConfig {
  enabled: boolean;
  directory: string;
  format: 'png' | 'jpeg';
  quality: number;
  fullPage: boolean;
  onFailureOnly: boolean;
  organizeByDate: boolean;
}

export interface ParallelConfig {
  enabled: boolean;
  maxWorkers: number;
  strategy: 'aggressive' | 'balanced' | 'conservative';
}

export const DEFAULT_CONFIG: Config = {
  ai: {
    provider: 'glm',
    glm: {
      apiKey: '',
      model: 'glm-4.7',
      baseUrl: 'https://api.z.ai/api/coding/paas/v4'
    },
    claude: {
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022'
    },
    gpt: {
      apiKey: '',
      model: 'gpt-4-turbo-preview',
      baseUrl: 'https://api.openai.com/v1/chat/completions'
    }
  },
  playwright: {
    browser: 'chromium',
    headless: true,
    timeout: 30000
  },
  runner: {
    timeout: 30000
  },
  test: {
    defaultTimeout: 30000
  },
  cache: {
    enabled: true,
    directory: '.zqa/cache',
    maxSize: 100,
    ttl: 604800 // 7 days
  },
  screenshots: {
    enabled: true,
    directory: '.zqa/screenshots',
    format: 'png',
    quality: 80,
    fullPage: false,
    onFailureOnly: false,
    organizeByDate: true
  },
  parallel: {
    enabled: false, // Opt-in for backward compatibility
    maxWorkers: 4,
    strategy: 'balanced'
  }
};
