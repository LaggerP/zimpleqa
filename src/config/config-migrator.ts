/**
 * Migration script for v0.1.0 to v0.2.0 config format
 * Converts old flat config to new multi-provider structure
 */

import { FileHelpers } from '../utils/file-helpers';
import path from 'path';

interface OldConfig {
  glm: {
    apiKey: string;
    model: string;
    baseUrl: string;
  };
  playwright: {
    browser: string;
    headless: boolean;
    timeout: number;
  };
  runner: {
    timeout: number;
  };
  test: {
    defaultTimeout: number;
  };
}

interface NewConfig {
  ai: {
    provider: 'glm' | 'claude' | 'gpt';
    glm?: {
      apiKey: string;
      model: string;
      baseUrl: string;
    };
    claude?: {
      apiKey: string;
      model: string;
    };
    gpt?: {
      apiKey: string;
      model: string;
      baseUrl?: string;
    };
  };
  playwright: {
    browser: string;
    headless: boolean;
    timeout: number;
  };
  runner: {
    timeout: number;
  };
  test: {
    defaultTimeout: number;
  };
}

export class ConfigMigrator {
  static async migrate(configPath: string): Promise<{ success: boolean; message: string; backupPath?: string }> {
    try {
      if (!(await FileHelpers.fileExists(configPath))) {
        return {
          success: false,
          message: `Config file not found: ${configPath}`
        };
      }

      const oldConfig = await FileHelpers.readJSON(configPath) as OldConfig;

      const newConfig: NewConfig = {
        ai: {
          provider: 'glm',
          glm: {
            apiKey: oldConfig.glm.apiKey,
            model: oldConfig.glm.model,
            baseUrl: oldConfig.glm.baseUrl
          }
        },
        playwright: oldConfig.playwright,
        runner: oldConfig.runner,
        test: oldConfig.test
      };

      const backupPath = configPath + '.backup';
      await FileHelpers.writeJSON(backupPath, oldConfig);

      await FileHelpers.writeJSON(configPath, newConfig);

      return {
        success: true,
        message: 'Config migrated successfully to v0.2.0 format',
        backupPath
      };
    } catch (error) {
      return {
        success: false,
        message: `Migration failed: ${error}`
      };
    }
  }

  static async detectNeedsMigration(configPath: string): Promise<boolean> {
    try {
      if (!(await FileHelpers.fileExists(configPath))) {
        return false;
      }

      const config = await FileHelpers.readJSON(configPath);

      return !config.ai || !config.ai.provider;
    } catch (error) {
      return false;
    }
  }

  static async migrateIfNeeded(configPath: string): Promise<{ migrated: boolean; message: string }> {
    const needsMigration = await this.detectNeedsMigration(configPath);

    if (!needsMigration) {
      return {
        migrated: false,
        message: 'Config is already in v0.2.0 format or does not exist'
      };
    }

    const result = await this.migrate(configPath);

    if (result.success) {
      return {
        migrated: true,
        message: result.message
      };
    } else {
      return {
        migrated: false,
        message: result.message
      };
    }
  }
}

export async function migrateConfig(configPath?: string): Promise<void> {
  const targetPath = configPath || path.join(process.cwd(), '.zqa', 'config.json');
  
  console.log(`Checking config: ${targetPath}`);
  
  const result = await ConfigMigrator.migrateIfNeeded(targetPath);
  
  if (result.migrated) {
    console.log(`✅ ${result.message}`);
  } else {
    console.log(`ℹ️ ${result.message}`);
  }
}

if (require.main === module) {
  migrateConfig().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
