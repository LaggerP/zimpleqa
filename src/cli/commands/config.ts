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
    logger.section('⚙️ Configuración actual');
    const config = configManager.getGLMConfig();
    console.log(`GLM Model: ${config.model}`);
    console.log(`API Key: ${config.apiKey ? '***' + config.apiKey.slice(-4) : '(not set)'}`);
    console.log(`Base URL: ${config.baseUrl}`);
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

  logger.error(`Unknown action: ${action}. Available actions: get, set`);
  process.exit(1);
}

async function getConfigValue(configManager: ConfigManager, key: string): Promise<string> {
  const config = await configManager.load();

  if (key === 'glm.apiKey') {
    return config.glm.apiKey || '(not set)';
  } else if (key === 'glm.model') {
    return config.glm.model;
  } else if (key === 'glm.baseUrl') {
    return config.glm.baseUrl;
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

  if (key === 'glm.apiKey') {
    await configManager.set('glm', { ...configManager.get('glm'), apiKey: value });
  } else if (key === 'glm.model') {
    if (!['glm-4.7', 'glm-5'].includes(value)) {
      throw new Error('Invalid model. Valid values: glm-4.7, glm-5');
    }
    await configManager.set('glm', { ...configManager.get('glm'), model: value as 'glm-4.7' | 'glm-5' });
  } else if (key === 'glm.baseUrl') {
    await configManager.set('glm', { ...configManager.get('glm'), baseUrl: value });
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
