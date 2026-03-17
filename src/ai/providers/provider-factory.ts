/**
 * Provider Factory
 * Creates AI provider instances based on configuration
 */

import { BaseAIProvider, ProviderConfig } from './base-provider';
import { GLMProvider } from './glm-provider';
import { ClaudeProvider } from './claude-provider';
import { GPTProvider } from './gpt-provider';

export type ProviderType = 'glm' | 'claude' | 'gpt';

export interface ProviderFactoryConfig {
  glm?: ProviderConfig;
  claude?: ProviderConfig;
  gpt?: ProviderConfig;
  defaultProvider?: ProviderType;
}

export class ProviderFactory {
  private static providers = new Map<ProviderType, typeof BaseAIProvider>();
  private static configs = new Map<ProviderType, ProviderConfig>();

  static registerProvider(type: ProviderType, providerClass: typeof BaseAIProvider): void {
    this.providers.set(type, providerClass);
  }

  static registerConfig(type: ProviderType, config: ProviderConfig): void {
    this.configs.set(type, config);
  }

  static createProvider(type: ProviderType, config?: ProviderConfig): BaseAIProvider {
    const finalConfig = config || this.configs.get(type);
    
    if (!finalConfig) {
      throw new Error(`No configuration found for provider ${type}`);
    }

    let provider: BaseAIProvider;
    
    switch (type) {
      case 'glm':
        provider = new GLMProvider(finalConfig);
        break;
      case 'claude':
        provider = new ClaudeProvider(finalConfig);
        break;
      case 'gpt':
        provider = new GPTProvider(finalConfig);
        break;
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
    
    if (!provider.validateConfig()) {
      throw new Error(`Invalid configuration for provider ${type}`);
    }

    return provider;
  }

  static createDefaultProvider(): BaseAIProvider {
    const defaultType = this.getDefaultProviderType();
    return this.createProvider(defaultType);
  }

  static getDefaultProviderType(): ProviderType {
    return 'glm';
  }

  static setDefaultProvider(type: ProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Provider ${type} is not registered`);
    }
  }

  static getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  static isProviderAvailable(type: ProviderType): boolean {
    return this.providers.has(type) && this.configs.has(type);
  }
}

export function initializeProviderFactory(config: ProviderFactoryConfig): void {
  if (config.glm) {
    ProviderFactory.registerProvider('glm', GLMProvider);
    ProviderFactory.registerConfig('glm', config.glm);
  }

  if (config.claude) {
    ProviderFactory.registerConfig('claude', config.claude);
  }

  if (config.gpt) {
    ProviderFactory.registerConfig('gpt', config.gpt);
  }
}
