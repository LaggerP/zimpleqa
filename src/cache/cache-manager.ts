/**
 * Cache manager for storing and retrieving generated code
 */

import path from 'path';
import fs from 'fs/promises';
import { FileHelpers } from '../utils/file-helpers';
import { HashGenerator } from '../utils/crypto-utils';
import { CacheEntry, CacheEntryMetadata } from './cache-entry';
import { Logger } from '../utils/logger';

export interface CacheConfig {
  enabled: boolean;
  directory: string;
  maxSize: number; // MB
  ttl: number; // seconds
}

export class CacheManager {
  private cacheDir: string;
  private logger: Logger;
  private config: CacheConfig;

  constructor(config: CacheConfig, logger?: Logger) {
    this.config = config;
    // Resolve relative paths against current working directory
    this.cacheDir = path.isAbsolute(config.directory)
      ? config.directory
      : path.resolve(process.cwd(), config.directory);
    this.logger = logger || new Logger();
  }

  /**
   * Check if code exists in cache
   */
  async checkCache(key: string): Promise<string | null> {
    if (!this.config.enabled) {
      return null;
    }

    const cachePath = path.join(this.cacheDir, `${key}.json`);

    try {
      const exists = await FileHelpers.fileExists(cachePath);
      if (!exists) {
        this.logger.debug(`Cache MISS: ${key}`);
        return null;
      }

      const entry: CacheEntry = await FileHelpers.readJSON(cachePath);

      // Validate TTL
      if (Date.now() > entry.metadata.timestamp + entry.metadata.ttl * 1000) {
        this.logger.debug(`Cache EXPIRED: ${key}`);
        await this.invalidate(key);
        return null;
      }

      // Update stats
      entry.stats.hits++;
      entry.stats.lastUsed = Date.now();
      await FileHelpers.writeJSON(cachePath, entry);

      this.logger.success(`Cache HIT: ${key} (${entry.stats.hits} hits total)`);
      return entry.code;
    } catch (error) {
      this.logger.warning(`Failed to read cache for ${key}: ${error}`);
      return null;
    }
  }

  /**
   * Save code to cache
   */
  async saveCache(key: string, code: string, metadata: CacheEntryMetadata): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Ensure cache directory exists
      await FileHelpers.ensureDirectory(this.cacheDir);

      // Check cache size before saving
      await this.ensureCacheSize();

      const entry: CacheEntry = {
        key,
        hash: HashGenerator.generateHash(code),
        code,
        metadata,
        stats: {
          hits: 0,
          lastUsed: Date.now()
        }
      };

      const cachePath = path.join(this.cacheDir, `${key}.json`);
      await FileHelpers.writeJSON(cachePath, entry);

      this.logger.success(`Cache SAVED: ${key}`);
    } catch (error) {
      this.logger.warning(`Failed to save cache for ${key}: ${error}`);
    }
  }

  /**
   * Invalidate a cache entry
   */
  async invalidate(key: string): Promise<void> {
    const cachePath = path.join(this.cacheDir, `${key}.json`);

    try {
      await fs.unlink(cachePath);
      this.logger.debug(`Cache INVALIDATED: ${key}`);
    } catch (error) {
      // File might not exist, ignore
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const exists = await FileHelpers.fileExists(this.cacheDir);
      if (!exists) {
        return;
      }

      const files = await FileHelpers.listFiles(this.cacheDir, '.json');

      for (const file of files) {
        await fs.unlink(file);
      }

      this.logger.success(`Cache CLEARED: ${files.length} entries removed`);
    } catch (error) {
      this.logger.warning(`Failed to clear cache: ${error}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ entries: number; totalSize: number; hits: number }> {
    try {
      const exists = await FileHelpers.fileExists(this.cacheDir);
      if (!exists) {
        return { entries: 0, totalSize: 0, hits: 0 };
      }

      const files = await FileHelpers.listFiles(this.cacheDir, '.json');
      let totalSize = 0;
      let totalHits = 0;

      for (const file of files) {
        const stats = await fs.stat(file);
        totalSize += stats.size;

        try {
          const entry: CacheEntry = await FileHelpers.readJSON(file);
          totalHits += entry.stats.hits;
        } catch {
          // Invalid entry, skip
        }
      }

      return {
        entries: files.length,
        totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
        hits: totalHits
      };
    } catch (error) {
      this.logger.warning(`Failed to get cache stats: ${error}`);
      return { entries: 0, totalSize: 0, hits: 0 };
    }
  }

  /**
   * Ensure cache doesn't exceed max size
   */
  private async ensureCacheSize(): Promise<void> {
    try {
      const exists = await FileHelpers.fileExists(this.cacheDir);
      if (!exists) {
        return;
      }

      const files = await FileHelpers.listFiles(this.cacheDir, '.json');
      let totalSize = 0;

      // Calculate total size
      const fileSizes: Array<{ file: string; size: number; lastUsed: number }> = [];

      for (const file of files) {
        const stats = await fs.stat(file);
        totalSize += stats.size;

        try {
          const entry: CacheEntry = await FileHelpers.readJSON(file);
          fileSizes.push({
            file,
            size: stats.size,
            lastUsed: entry.stats.lastUsed
          });
        } catch {
          // Invalid entry, count it anyway
          fileSizes.push({
            file,
            size: stats.size,
            lastUsed: 0
          });
        }
      }

      const totalSizeMB = totalSize / 1024 / 1024;

      // If over limit, remove oldest entries
      if (totalSizeMB > this.config.maxSize) {
        this.logger.info(`Cache size (${totalSizeMB.toFixed(2)}MB) exceeds limit (${this.config.maxSize}MB), cleaning up...`);

        // Sort by last used (oldest first)
        fileSizes.sort((a, b) => a.lastUsed - b.lastUsed);

        // Remove oldest entries until under limit
        let currentSize = totalSize;
        for (const fileInfo of fileSizes) {
          if (currentSize / 1024 / 1024 <= this.config.maxSize) {
            break;
          }

          await fs.unlink(fileInfo.file);
          currentSize -= fileInfo.size;
          this.logger.debug(`Removed old cache entry: ${path.basename(fileInfo.file)}`);
        }

        this.logger.success(`Cache cleanup completed`);
      }
    } catch (error) {
      this.logger.warning(`Failed to ensure cache size: ${error}`);
    }
  }
}
