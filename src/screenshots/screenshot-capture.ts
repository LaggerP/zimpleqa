/**
 * Screenshot capture service
 */

import { Page } from 'playwright';
import { FileHelpers } from '../utils/file-helpers';
import path from 'path';
import { Logger } from '../utils/logger';

export interface ScreenshotConfig {
  enabled: boolean;
  directory: string;
  format: 'png' | 'jpeg';
  quality: number;
  fullPage: boolean;
  onFailureOnly: boolean;
  organizeByDate: boolean;
}

export interface ScreenshotMetadata {
  path: string;
  title: string;
  status: 'passed' | 'failed';
  timestamp: number;
  size: number;
}

export class ScreenshotCapture {
  private screenshotsDir: string;
  private organizeByDate: boolean;
  private config: ScreenshotConfig;
  private logger: Logger;

  constructor(config: ScreenshotConfig, logger?: Logger) {
    this.config = config;
    // Resolve relative paths against current working directory
    this.screenshotsDir = path.isAbsolute(config.directory)
      ? config.directory
      : path.resolve(process.cwd(), config.directory);
    this.organizeByDate = config.organizeByDate;
    this.logger = logger || new Logger();
  }

  /**
   * Capture screenshot of the current page state
   */
  async capture(page: Page, testTitle: string, status: 'passed' | 'failed'): Promise<string> {
    if (!this.config.enabled) {
      return '';
    }

    // Skip if onFailureOnly is true and status is passed
    if (this.config.onFailureOnly && status === 'passed') {
      this.logger.debug('Screenshot skipped (onFailureOnly enabled and test passed)');
      return '';
    }

    try {
      const date = new Date();
      const timestamp = date.getTime();
      const sanitizedTitle = testTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();

      let filename = `${sanitizedTitle}_${timestamp}_${status}.${this.config.format}`;

      if (this.organizeByDate) {
        const dateDir = date.toISOString().split('T')[0];
        const fullPath = path.join(this.screenshotsDir, dateDir);
        await FileHelpers.ensureDirectory(fullPath);
        filename = path.join(fullPath, filename);
      } else {
        await FileHelpers.ensureDirectory(this.screenshotsDir);
        filename = path.join(this.screenshotsDir, filename);
      }

      const screenshotOptions: any = {
        path: filename,
        type: this.config.format
      };

      if (this.config.format === 'jpeg') {
        screenshotOptions.quality = this.config.quality;
      }

      if (this.config.fullPage) {
        screenshotOptions.fullPage = true;
      }

      await page.screenshot(screenshotOptions);

      this.logger.success(`Screenshot captured: ${path.basename(filename)}`);
      return filename;
    } catch (error) {
      this.logger.warning(`Failed to capture screenshot: ${error}`);
      return '';
    }
  }

  /**
   * Capture multiple screenshots (e.g., before/after)
   */
  async captureMultiple(page: Page, testTitle: string, states: Array<{ name: string; status: 'passed' | 'failed' }>): Promise<string[]> {
    const paths: string[] = [];

    for (const state of states) {
      const path = await this.capture(page, `${testTitle}-${state.name}`, state.status);
      if (path) {
        paths.push(path);
      }
    }

    return paths;
  }

  /**
   * Get screenshot metadata from path
   */
  async getMetadata(screenshotPath: string): Promise<ScreenshotMetadata | null> {
    try {
      const stats = await FileHelpers.fileExists(screenshotPath);
      if (!stats) {
        return null;
      }

      const fs = await import('fs/promises');
      const fileStats = await fs.stat(screenshotPath);
      const basename = path.basename(screenshotPath);
      const parts = basename.split('_');

      return {
        path: screenshotPath,
        title: parts[0] || '',
        status: (parts[parts.length - 1]?.split('.')[0] || 'unknown') as 'passed' | 'failed',
        timestamp: parseInt(parts[1]) || Date.now(),
        size: fileStats.size
      };
    } catch (error) {
      this.logger.warning(`Failed to get screenshot metadata: ${error}`);
      return null;
    }
  }

  /**
   * Clean up old screenshots based on age
   */
  async cleanup(maxAge: number): Promise<number> {
    // maxAge is in days
    try {
      const exists = await FileHelpers.fileExists(this.screenshotsDir);
      if (!exists) {
        return 0;
      }

      const fs = await import('fs/promises');
      const cutoffDate = Date.now() - (maxAge * 24 * 60 * 60 * 1000);
      let removedCount = 0;

      const walkDir = async (dir: string): Promise<void> => {
        const files = await fs.readdir(dir, { withFileTypes: true });

        for (const file of files) {
          const fullPath = path.join(dir, file.name);

          if (file.isDirectory()) {
            await walkDir(fullPath);
          } else if (file.name.endsWith('.png') || file.name.endsWith('.jpeg') || file.name.endsWith('.jpg')) {
            const stats = await fs.stat(fullPath);
            if (stats.mtimeMs < cutoffDate) {
              await fs.unlink(fullPath);
              removedCount++;
              this.logger.debug(`Removed old screenshot: ${fullPath}`);
            }
          }
        }
      };

      await walkDir(this.screenshotsDir);

      if (removedCount > 0) {
        this.logger.success(`Cleaned up ${removedCount} old screenshot(s)`);
      }

      return removedCount;
    } catch (error) {
      this.logger.warning(`Failed to cleanup screenshots: ${error}`);
      return 0;
    }
  }

  /**
   * Get total size of all screenshots
   */
  async getTotalSize(): Promise<number> {
    // Returns size in MB
    try {
      const exists = await FileHelpers.fileExists(this.screenshotsDir);
      if (!exists) {
        return 0;
      }

      const fs = await import('fs/promises');
      let totalSize = 0;

      const walkDir = async (dir: string): Promise<void> => {
        const files = await fs.readdir(dir, { withFileTypes: true });

        for (const file of files) {
          const fullPath = path.join(dir, file.name);

          if (file.isDirectory()) {
            await walkDir(fullPath);
          } else if (file.name.endsWith('.png') || file.name.endsWith('.jpeg') || file.name.endsWith('.jpg')) {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        }
      };

      await walkDir(this.screenshotsDir);

      return Math.round(totalSize / 1024 / 1024 * 100) / 100; // MB
    } catch (error) {
      this.logger.warning(`Failed to calculate screenshots size: ${error}`);
      return 0;
    }
  }
}
