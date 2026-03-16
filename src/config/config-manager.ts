/**
 * Configuration manager
 */

import path from 'path';
import { Config, GLMConfig, PlaywrightConfig, RunnerConfig, TestConfig } from './config-schema';
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

  getGLMConfig(): GLMConfig {
    return this.config.glm;
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

  async validate(): Promise<{ valid: boolean; error?: string }> {
    return Validators.validateConfig(this.config);
  }

  private mergeConfigs(defaultConfig: Config, userConfig: any): Config {
    return {
      glm: { ...defaultConfig.glm, ...userConfig.glm },
      playwright: { ...defaultConfig.playwright, ...userConfig.playwright },
      runner: { ...defaultConfig.runner, ...userConfig.runner },
      test: { ...defaultConfig.test, ...userConfig.test }
    };
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
