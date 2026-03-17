/**
 * Configuration manager - Multi-provider support
 */

import path from 'path';
import { Config, PlaywrightConfig, RunnerConfig, TestConfig, AIConfig, CacheConfig, ScreenshotConfig, ParallelConfig } from './config-schema';
import { FileHelpers } from '../utils/file-helpers';
import { Validators } from '../utils/validators';
import { Logger } from '../utils/logger';

export class ConfigManager {
  private configPath: string;
  private config: Config;
  private logger: Logger;

  constructor(configPath?: string, logger?: Logger) {
    this.configPath = configPath || path.join(process.cwd(), '.zqa', 'config.json');
    this.config = this.loadDefaultConfig();
    this.logger = logger || new Logger();
  }

  private loadDefaultConfig(): Config {
    const { DEFAULT_CONFIG } = require('./default-config');
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as Config;
  }

  async load(): Promise<Config> {
    try {
      if (await FileHelpers.fileExists(this.configPath)) {
        const savedConfig = await FileHelpers.readJSON(this.configPath);
        this.config = this.mergeConfigs(this.config, savedConfig);
        this.logger.debug('Configuration loaded from file');
      } else {
        this.logger.debug('No config file found, using defaults');
      }
    } catch (error) {
      this.logger.warning(`Failed to load config: ${error}. Using defaults.`);
    }

    return this.config;
  }

  async save(): Promise<void> {
    try {
      await FileHelpers.writeJSON(this.configPath, this.config);
      this.logger.success('Configuration saved');
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  async set<K extends keyof Config>(key: K, value: Config[K]): Promise<void> {
    this.config[key] = value;
    await this.save();
  }

  getConfig(): Config {
    return this.config;
  }

  // ===== AI Configuration Methods =====

  getAIConfig(): AIConfig {
    return this.config.ai;
  }

  getProviderType(): 'glm' | 'claude' | 'gpt' {
    return this.config.ai.provider;
  }

  async setProvider(provider: 'glm' | 'claude' | 'gpt'): Promise<void> {
    this.config.ai.provider = provider;
    await this.save();
    this.logger.success(`Provider set to: ${provider}`);
  }

  getProviderConfig(provider: 'glm' | 'claude' | 'gpt') {
    return this.config.ai[provider];
  }

  async setProviderConfig(provider: 'glm' | 'claude' | 'gpt', config: any): Promise<void> {
    this.config.ai[provider] = {
      ...(this.config.ai[provider] || {}),
      ...config
    };
    await this.save();
  }

  // ===== Backward Compatibility =====

  getGLMConfig() {
    return this.config.ai.glm;
  }

  getPlaywrightConfig(): PlaywrightConfig {
    return this.config.playwright;
  }

  getRunnerConfig(): RunnerConfig {
    return this.config.runner;
  }

  getTestConfig(): TestConfig {
    return this.config.test;
  }

  getCacheConfig(): CacheConfig {
    return this.config.cache;
  }

  getScreenshotConfig(): ScreenshotConfig {
    return this.config.screenshots;
  }

  getParallelConfig(): ParallelConfig {
    return this.config.parallel;
  }

  async validate(): Promise<{ valid: boolean; error?: string }> {
    return Validators.validateConfig(this.config);
  }

  private mergeConfigs(defaultConfig: Config, userConfig: any): Config {
    return {
      ai: {
        ...defaultConfig.ai,
        ...userConfig.ai,
        glm: { ...defaultConfig.ai.glm, ...userConfig.ai?.glm },
        claude: { ...defaultConfig.ai.claude, ...userConfig.ai?.claude },
        gpt: { ...defaultConfig.ai.gpt, ...userConfig.ai?.gpt }
      },
      playwright: { ...defaultConfig.playwright, ...userConfig.playwright },
      runner: { ...defaultConfig.runner, ...userConfig.runner },
      test: { ...defaultConfig.test, ...userConfig.test },
      cache: { ...defaultConfig.cache, ...userConfig.cache },
      screenshots: { ...defaultConfig.screenshots, ...userConfig.screenshots },
      parallel: { ...defaultConfig.parallel, ...userConfig.parallel }
    };
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
