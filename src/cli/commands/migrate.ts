/**
 * CLI command for template migration
 */

import { Logger } from '../../utils/logger';
import { MarkdownParser } from '../../parser/markdown-parser';
import { TemplateMigrator } from '../../parser/template-migrator';
import { FileHelpers } from '../../utils/file-helpers';
import path from 'path';
import fs from 'fs/promises';

export async function migrateCommand(target: string, options: { dryRun?: boolean; backup?: boolean }): Promise<void> {
  const logger = new Logger();
  const parser = new MarkdownParser(logger);

  const targetPath = path.resolve(target);

  try {
    const stats = await FileHelpers.fileExists(targetPath) ? 
      await fs.stat(targetPath) : null;
    
    if (!stats) {
      logger.error(`File not found: ${targetPath}`);
      process.exit(1);
    }

    if (stats.isFile()) {
      if (!targetPath.endsWith('.md')) {
        logger.error('Test file must be a .md file');
        process.exit(1);
      }
      await migrateSingleFile(targetPath, parser, logger, options);
    } else if (stats.isDirectory()) {
      await migrateDirectory(targetPath, parser, logger, options);
    } else {
      logger.error('Target must be a file or directory');
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Failed to migrate: ${error}`);
    process.exit(1);
  }
}

async function migrateSingleFile(filePath: string, parser: MarkdownParser, logger: Logger, options: { dryRun?: boolean; backup?: boolean }): Promise<void> {
  logger.section(`🔄 Migrating: ${path.basename(filePath)}`);
  
  try {
    const test = await parser.parseFile(filePath);
    
    logger.info(`Current format: v0.1.0`);
    logger.info(`Target format: v0.2.0`);
    logger.info(`Test: ${test.title}`);
    
    const newContent = TemplateMigrator.migrateToV0_2_0(test);
    const report = TemplateMigrator.generateMigrationReport(test);
    
    if (options.dryRun) {
      logger.section('Dry Run Mode - No changes will be made');
      console.log('\n--- New Content ---\n');
      console.log(newContent);
      console.log('\n--- Migration Report ---\n');
      console.log(report);
      logger.info('Run without --dry-run to apply changes');
      return;
    }
    
    if (options.backup !== false) {
      const backupPath = filePath + '.v0.1.0.backup';
      const originalContent = await FileHelpers.readFile(filePath);
      await FileHelpers.writeFile(backupPath, originalContent);
      logger.success(`Backup created: ${path.basename(backupPath)}`);
    }
    
    await FileHelpers.writeFile(filePath, newContent);
    logger.success('✅ Migration completed successfully');
    
    console.log('\n--- Migration Report ---\n');
    console.log(report);
  } catch (error) {
    logger.error(`Failed to migrate template: ${error}`);
    process.exit(1);
  }
}

async function migrateDirectory(dirPath: string, parser: MarkdownParser, logger: Logger, options: { dryRun?: boolean; backup?: boolean }): Promise<void> {
  logger.section(`🔄 Migrating directory: ${dirPath}`);
  
  try {
    const files = await FileHelpers.listFiles(dirPath, '.md');
    
    if (files.length === 0) {
      logger.warning('No test files found in directory');
      return;
    }
    
    logger.info(`Found ${files.length} test file(s)`);
    
    if (options.dryRun) {
      logger.warning('Dry run mode - only showing first 3 files');
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    const limit = options.dryRun ? 3 : files.length;
    
    for (let i = 0; i < limit; i++) {
      const file = files[i];
      try {
        const test = await parser.parseFile(file);
        
        if (options.dryRun) {
          logger.info(`\n${i + 1}/${limit}: ${path.basename(file)}`);
          logger.info(`   Test: ${test.title}`);
          logger.info(`   Steps: ${test.steps.length}`);
          logger.info(`   Would migrate: ✅`);
          migratedCount++;
        } else {
          logger.info(`Migrating: ${path.basename(file)}`);
          
          if (options.backup !== false) {
            const backupPath = file + '.v0.1.0.backup';
            const originalContent = await FileHelpers.readFile(file);
            await FileHelpers.writeFile(backupPath, originalContent);
          }
          
          const newContent = TemplateMigrator.migrateToV0_2_0(test);
          await FileHelpers.writeFile(file, newContent);
          
          logger.success(`✅ Migrated: ${path.basename(file)}`);
          migratedCount++;
        }
      } catch (error) {
        failedCount++;
        logger.error(`❌ Failed to migrate ${path.basename(file)}: ${error}`);
      }
    }
    
    if (options.dryRun && files.length > 3) {
      logger.info(`\n... and ${files.length - 3} more files`);
      logger.info(`Run without --dry-run to migrate all files`);
    } else if (!options.dryRun) {
      skippedCount = files.length - migratedCount - failedCount;
    }
    
    logger.section('Summary');
    logger.info(`Total: ${files.length} file(s)`);
    logger.success(`Migrated: ${migratedCount}`);
    if (skippedCount > 0) {
      logger.warning(`Skipped: ${skippedCount}`);
    }
    if (failedCount > 0) {
      logger.error(`Failed: ${failedCount}`);
    }
    
    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Failed to migrate directory: ${error}`);
    process.exit(1);
  }
}
