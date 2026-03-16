/**
 * Configuration schema for zimpleQA
 */

export interface Config {
  glm: GLMConfig;
  playwright: PlaywrightConfig;
  runner: RunnerConfig;
  test: TestConfig;
}

export interface GLMConfig {
  apiKey: string;
  model: 'glm-4.7' | 'glm-5';
  baseUrl: string;
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

export const DEFAULT_CONFIG: Config = {
  glm: {
    apiKey: '',
    model: 'glm-4.7',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/'
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
  }
};
