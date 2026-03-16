/**
 * init command - Initialize zimpleQA in current directory
 */

import path from 'path';
import fs from 'fs/promises';
import { Logger } from '../../utils/logger';
import { FileHelpers } from '../../utils/file-helpers';
import { DEFAULT_CONFIG } from '../../config/default-config';

export async function initCommand(): Promise<void> {
  const logger = new Logger();

  logger.section('🚀 Inicializando zimpleQA');

  const rootPath = process.cwd();
  const zqaPath = path.join(rootPath, '.zqa');
  const generatedPath = path.join(zqaPath, 'generated');
  const logsPath = path.join(zqaPath, 'logs');
  const testsPath = path.join(rootPath, 'tests');

  logger.info(`Creating directory structure...`);

  try {
    await FileHelpers.ensureDirectory(zqaPath);
    await FileHelpers.ensureDirectory(generatedPath);
    await FileHelpers.ensureDirectory(logsPath);
    await FileHelpers.ensureDirectory(testsPath);

    logger.success('Directory structure created');
  } catch (error) {
    throw new Error(`Failed to create directories: ${error}`);
  }

  const configPath = path.join(zqaPath, 'config.json');

  if (await FileHelpers.fileExists(configPath)) {
    logger.warning('Config file already exists. Skipping...');
  } else {
    logger.info('Creating config file...');
    try {
      await FileHelpers.writeJSON(configPath, DEFAULT_CONFIG);
      logger.success('Config file created');
    } catch (error) {
      throw new Error(`Failed to create config: ${error}`);
    }
  }

  const testTemplatePath = path.join(testsPath, 'test-template.md');

  if (await FileHelpers.fileExists(testTemplatePath)) {
    logger.warning('Test template already exists. Skipping...');
  } else {
    logger.info('Creating test template...');
    try {
      const templateContent = await fs.readFile(
        path.join(__dirname, '../../../templates/test-template.md'),
        'utf-8'
      );
      await FileHelpers.writeFile(testTemplatePath, templateContent);
      logger.success('Test template created');
    } catch (error) {
      throw new Error(`Failed to create test template: ${error}`);
    }
  }

  logger.section('✅ Inicialización completada');
  logger.info('Siguientes pasos:');
  logger.info('  1. Configura tu API key de GLM: zqa config set glm.api_key <tu-api-key>');
  logger.info('  2. Escribe tus tests en el directorio tests/');
  logger.info('  3. Ejecuta tus tests: zqa run tests/');
  logger.info('  4. Para más información: zqa --help');
}
