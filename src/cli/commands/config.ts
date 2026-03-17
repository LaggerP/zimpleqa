/**
 * config command - Manage configuration
 */

import { Logger } from '../../utils/logger';
import { ConfigManager } from '../../config/config-manager';

export async function configCommand(): Promise<void> {
  const logger = new Logger();
  const configManager = new ConfigManager();

  await configManager.load();

  const args = process.argv.slice(3);
  const action = args[0];

  if (!action) {
    logger.section('⚙️ Current configuration');
    const config = configManager.getConfig();
    console.log(`AI Provider: ${config.ai.provider}`);
    
    if (config.ai.glm) {
      console.log('\nGLM Configuration:');
      console.log(`  Model: ${config.ai.glm.model}`);
      console.log(`  API Key: ${config.ai.glm.apiKey ? '***' + config.ai.glm.apiKey.slice(-4) : '(not set)'}`);
      console.log(`  Base URL: ${config.ai.glm.baseUrl}`);
    }
    
    if (config.ai.claude) {
      console.log('\nClaude Configuration:');
      console.log(`  Model: ${config.ai.claude.model}`);
      console.log(`  API Key: ${config.ai.claude.apiKey ? '***' + config.ai.claude.apiKey.slice(-4) : '(not set)'}`);
    }
    
    if (config.ai.gpt) {
      console.log('\nGPT Configuration:');
      console.log(`  Model: ${config.ai.gpt.model}`);
      console.log(`  API Key: ${config.ai.gpt.apiKey ? '***' + config.ai.gpt.apiKey.slice(-4) : '(not set)'}`);
      if (config.ai.gpt.baseUrl) {
        console.log(`  Base URL: ${config.ai.gpt.baseUrl}`);
      }
    }
    
    console.log(`\nPlaywright: ${config.playwright.browser} (headless: ${config.playwright.headless})`);
    return;
  }

  if (action === 'migrate') {
    const { ConfigMigrator } = await import('../../config/config-migrator');
    const result = await ConfigMigrator.migrateIfNeeded(configManager.getConfigPath());
    
    if (result.migrated) {
      logger.success(result.message);
    } else {
      logger.info(result.message);
    }
    return;
  }

  if (action === 'get') {
    const key = args[1];
    if (!key) {
      logger.error('Usage: zqa config get <key>');
      process.exit(1);
    }

    try {
      const value = await getConfigValue(configManager, key);
      console.log(value);
    } catch (error) {
      logger.error(`Failed to get config value: ${error}`);
      process.exit(1);
    }
    return;
  }

  if (action === 'set') {
    const key = args[1];
    const value = args[2];

    if (!key || !value) {
      logger.error('Usage: zqa config set <key> <value>');
      process.exit(1);
    }

    try {
      await setConfigValue(configManager, key, value);
    } catch (error) {
      logger.error(`Failed to set config value: ${error}`);
      process.exit(1);
    }
    return;
  }

  if (action === 'provider') {
    const provider = args[1];
    if (!provider) {
      logger.error('Usage: zqa config provider <glm|claude|gpt>');
      process.exit(1);
    }

    if (!['glm', 'claude', 'gpt'].includes(provider)) {
      logger.error(`Invalid provider: ${provider}. Available providers: glm, claude, gpt`);
      process.exit(1);
    }

    try {
      await configManager.setProvider(provider as 'glm' | 'claude' | 'gpt');
      logger.success(`Provider set to: ${provider}`);
      logger.info(`Configure your ${provider} API key:`);
      logger.info(`  zqa config set ${provider}.apiKey YOUR_KEY`);
    } catch (error) {
      logger.error(`Failed to set provider: ${error}`);
      process.exit(1);
    }
    return;
  }

  logger.error(`Unknown action: ${action}. Available actions: get, set, provider, migrate`);
  process.exit(1);
}

async function getConfigValue(configManager: ConfigManager, key: string): Promise<string> {
  const config = await configManager.load();

  if (key === 'ai.provider') {
    return config.ai.provider;
  } else if (key === 'glm.apiKey') {
    return config.ai.glm?.apiKey || '(not set)';
  } else if (key === 'glm.model') {
    return config.ai.glm?.model || 'glm-4.7';
  } else if (key === 'glm.baseUrl') {
    return config.ai.glm?.baseUrl || 'https://open.bigmodel.cn/api/paas/v4/';
  } else if (key === 'claude.apiKey') {
    return config.ai.claude?.apiKey || '(not set)';
  } else if (key === 'claude.model') {
    return config.ai.claude?.model || 'claude-3-5-sonnet-20241022';
  } else if (key === 'gpt.apiKey') {
    return config.ai.gpt?.apiKey || '(not set)';
  } else if (key === 'gpt.model') {
    return config.ai.gpt?.model || 'gpt-4-turbo-preview';
  } else if (key === 'playwright.browser') {
    return config.playwright.browser;
  } else if (key === 'playwright.headless') {
    return String(config.playwright.headless);
  } else if (key === 'playwright.timeout') {
    return String(config.playwright.timeout);
  } else {
    throw new Error(`Unknown config key: ${key}`);
  }
}

async function setConfigValue(configManager: ConfigManager, key: string, value: string): Promise<void> {
  await configManager.load();

  if (key === 'ai.provider') {
    await configManager.set('ai', { ...configManager.get('ai'), provider: value as 'glm' | 'claude' | 'gpt' });
  } else if (key === 'glm.apiKey') {
    const glm = configManager.get('ai').glm || { apiKey: '', model: 'glm-4.7', baseUrl: 'https://open.bigmodel.cn/api/paas/v4/' };
    await configManager.set('ai', { ...configManager.get('ai'), glm: { ...glm, apiKey: value } });
  } else if (key === 'glm.model') {
    if (!['glm-4.7', 'glm-5'].includes(value)) {
      throw new Error('Invalid model. Valid values: glm-4.7, glm-5');
    }
    const glm = configManager.get('ai').glm || { apiKey: '', model: 'glm-4.7', baseUrl: 'https://open.bigmodel.cn/api/paas/v4/' };
    await configManager.set('ai', { ...configManager.get('ai'), glm: { ...glm, model: value as 'glm-4.7' | 'glm-5' } });
  } else if (key === 'glm.baseUrl') {
    const glm = configManager.get('ai').glm || { apiKey: '', model: 'glm-4.7', baseUrl: 'https://open.bigmodel.cn/api/paas/v4/' };
    await configManager.set('ai', { ...configManager.get('ai'), glm: { ...glm, baseUrl: value } });
  } else if (key === 'claude.apiKey') {
    const claude = configManager.get('ai').claude || { apiKey: '', model: 'claude-3-5-sonnet-20241022' };
    await configManager.set('ai', { ...configManager.get('ai'), claude: { ...claude, apiKey: value } });
  } else if (key === 'claude.model') {
    const claude = configManager.get('ai').claude || { apiKey: '', model: 'claude-3-5-sonnet-20241022' };
    await configManager.set('ai', { ...configManager.get('ai'), claude: { ...claude, model: value } });
  } else if (key === 'gpt.apiKey') {
    const gpt = configManager.get('ai').gpt || { apiKey: '', model: 'gpt-4-turbo-preview', baseUrl: 'https://api.openai.com/v1/' };
    await configManager.set('ai', { ...configManager.get('ai'), gpt: { ...gpt, apiKey: value } });
  } else if (key === 'gpt.model') {
    const gpt = configManager.get('ai').gpt || { apiKey: '', model: 'gpt-4-turbo-preview', baseUrl: 'https://api.openai.com/v1/' };
    await configManager.set('ai', { ...configManager.get('ai'), gpt: { ...gpt, model: value } });
  } else if (key === 'gpt.baseUrl') {
    const gpt = configManager.get('ai').gpt || { apiKey: '', model: 'gpt-4-turbo-preview', baseUrl: 'https://api.openai.com/v1/' };
    await configManager.set('ai', { ...configManager.get('ai'), gpt: { ...gpt, baseUrl: value } });
  } else if (key === 'playwright.browser') {
    if (!['chromium', 'firefox', 'webkit'].includes(value)) {
      throw new Error('Invalid browser. Valid values: chromium, firefox, webkit');
    }
    await configManager.set('playwright', { ...configManager.get('playwright'), browser: value as 'chromium' | 'firefox' | 'webkit' });
  } else if (key === 'playwright.headless') {
    await configManager.set('playwright', { ...configManager.get('playwright'), headless: value === 'true' });
  } else if (key === 'playwright.timeout') {
    await configManager.set('playwright', { ...configManager.get('playwright'), timeout: parseInt(value, 10) });
  } else {
    throw new Error(`Unknown config key: ${key}`);
  }

  const logger = new Logger();
  logger.success(`Config updated: ${key} = ${value}`);
}
