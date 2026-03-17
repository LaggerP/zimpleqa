/**
 * Code generator coordinator
 * Updated to use multi-provider architecture and caching
 */

import { BaseAIProvider, GenerationOptions } from './providers/base-provider';
import { ProviderFactory, initializeProviderFactory, ProviderFactoryConfig } from './providers/provider-factory';
import { TestModel } from '../parser/test-model';
import { Config } from '../config/config-schema';
import { Logger } from '../utils/logger';
import { Validators } from '../utils/validators';
import { CacheManager } from '../cache/cache-manager';
import { HashGenerator } from '../utils/crypto-utils';
import { FileHelpers } from '../utils/file-helpers';

export interface GenerationResult {
  code: string;
  cacheStatus: 'hit' | 'miss';
}

function configToProviderFactoryConfig(config: Config): ProviderFactoryConfig {
  return {
    glm: config.ai.glm,
    claude: config.ai.claude,
    gpt: config.ai.gpt
  };
}

export class CodeGenerator {
  private provider: BaseAIProvider;
  private logger: Logger;
  private cacheManager: CacheManager;
  private config: Config;
  private providerType: 'glm' | 'claude' | 'gpt';

  constructor(config: Config, logger?: Logger) {
    this.logger = logger || new Logger();
    this.config = config;
    this.providerType = config.ai.provider;

    const providerConfig = configToProviderFactoryConfig(config);
    initializeProviderFactory(providerConfig);
    this.provider = ProviderFactory.createDefaultProvider();

    this.cacheManager = new CacheManager(config.cache, logger);
  }

  async generate(test: TestModel, model?: string): Promise<GenerationResult> {
    try {
      this.logger.info(`Generating code for: ${test.title}`);

      const modelToUse = model || 'default';

      // Generate cache key (includes file content hash to detect changes)
      const testContent = await FileHelpers.readFile(test.filePath);
      const testHash = HashGenerator.generateHash(testContent);
      const cacheKey = HashGenerator.generateMultiHash(test.filePath, this.providerType, modelToUse, testHash);

      // Check cache
      const cachedCode = await this.cacheManager.checkCache(cacheKey);
      if (cachedCode) {
        this.logger.success('Using cached code');
        return { code: cachedCode, cacheStatus: 'hit' };
      }

      // Generate code
      const options: GenerationOptions = model ? { model } : {};
      const result = await this.provider.generateCode(test, options);
      const code = result.code;

      const validation = Validators.validateGeneratedCode(code);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Save to cache
      await this.cacheManager.saveCache(cacheKey, code, {
        testPath: test.filePath,
        provider: this.providerType,
        model: modelToUse,
        timestamp: Date.now(),
        ttl: this.config.cache.ttl
      });

      this.logger.success('Code generated successfully');
      return { code, cacheStatus: 'miss' };
    } catch (error) {
      this.logger.error(`Failed to generate code: ${error}`);
      throw error;
    }
  }

  async generateBatch(tests: TestModel[], model?: string): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];

    for (const test of tests) {
      try {
        const result = await this.generate(test, model);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to generate code for ${test.title}: ${error}`);
        results.push({ code: '', cacheStatus: 'miss' });
      }
    }

    return results;
  }

  setProvider(providerType: 'glm' | 'claude' | 'gpt'): void {
    this.providerType = providerType;
    this.provider = ProviderFactory.createProvider(providerType);
  }

  getCurrentProvider(): BaseAIProvider {
    return this.provider;
  }

  getCacheManager(): CacheManager {
    return this.cacheManager;
  }
}
