/**
 * CLI command for template validation
 */

import { Logger } from '../../utils/logger';
import { MarkdownParser } from '../../parser/markdown-parser';
import { TemplateValidator } from '../../parser/template-validator';
import { FileHelpers } from '../../utils/file-helpers';
import path from 'path';

export async function validateCommand(target: string): Promise<void> {
  const logger = new Logger();
  const parser = new MarkdownParser(logger);

  const targetPath = path.resolve(target);

  try {
    const stats = await FileHelpers.fileExists(targetPath) ? 
      await require('fs/promises').stat(targetPath) : null;
    
    if (!stats) {
      logger.error(`File not found: ${targetPath}`);
      process.exit(1);
    }

    if (stats.isFile()) {
      if (!targetPath.endsWith('.md')) {
        logger.error('Test file must be a .md file');
        process.exit(1);
      }
      await validateSingleFile(targetPath, parser, logger);
    } else if (stats.isDirectory()) {
      await validateDirectory(targetPath, parser, logger);
    } else {
      logger.error('Target must be a file or directory');
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Failed to validate: ${error}`);
    process.exit(1);
  }
}

async function validateSingleFile(filePath: string, parser: MarkdownParser, logger: Logger): Promise<void> {
  logger.section(`📋 Validating: ${path.basename(filePath)}`);
  
  try {
    const test = await parser.parseFile(filePath);
    const validation = TemplateValidator.validate(test);
    
    if (validation.valid) {
      logger.success('✅ Template is valid');
      
      if (validation.warnings.length > 0) {
        logger.warning(`⚠️  ${validation.warnings.length} warning(s):`);
        validation.warnings.forEach(warning => {
          logger.info(`  - ${warning.field}: ${warning.message}`);
          if (warning.suggestion) {
            logger.info(`    Suggestion: ${warning.suggestion}`);
          }
        });
      }
      
      logger.info(`Version: ${validation.version}`);
      logger.info(`Steps: ${test.steps.length}`);
      logger.info(`Expected Results: ${test.expectedResults.length}`);
    } else {
      logger.error('❌ Template validation failed:');
      
      validation.errors.forEach(error => {
        logger.error(`  [${error.severity.toUpperCase()}] ${error.field}: ${error.message}`);
      });
      
      if (validation.warnings.length > 0) {
        logger.warning(`\n⚠️  ${validation.warnings.length} warning(s):`);
        validation.warnings.forEach(warning => {
          logger.info(`  - ${warning.field}: ${warning.message}`);
        });
      }
      
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Failed to parse template: ${error}`);
    process.exit(1);
  }
}

async function validateDirectory(dirPath: string, parser: MarkdownParser, logger: Logger): Promise<void> {
  logger.section(`📋 Validating directory: ${dirPath}`);
  
  try {
    const files = await FileHelpers.listFiles(dirPath, '.md');
    
    if (files.length === 0) {
      logger.warning('No test files found in directory');
      return;
    }
    
    logger.info(`Found ${files.length} test file(s)`);
    
    let validCount = 0;
    let invalidCount = 0;
    let warningCount = 0;
    
    for (const file of files) {
      try {
        const test = await parser.parseFile(file);
        const validation = TemplateValidator.validate(test);
        
        if (validation.valid) {
          validCount++;
          logger.success(`✅ ${path.basename(file)}`);
          if (validation.warnings.length > 0) {
            warningCount += validation.warnings.length;
            logger.info(`   ⚠️  ${validation.warnings.length} warning(s)`);
          }
        } else {
          invalidCount++;
          logger.error(`❌ ${path.basename(file)} - ${validation.errors.length} error(s)`);
        }
      } catch (error) {
        invalidCount++;
        logger.error(`❌ ${path.basename(file)} - Parse error`);
      }
    }
    
    logger.section('Summary');
    logger.info(`Total: ${files.length} file(s)`);
    logger.success(`Valid: ${validCount}`);
    if (invalidCount > 0) {
      logger.error(`Invalid: ${invalidCount}`);
    }
    if (warningCount > 0) {
      logger.warning(`Warnings: ${warningCount}`);
    }
    
    if (invalidCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Failed to validate directory: ${error}`);
    process.exit(1);
  }
}
