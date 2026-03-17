/**
 * Playwright test runner
 */

import { chromium, Browser, Page } from 'playwright';
import { TestModel } from '../parser/test-model';
import { PlaywrightConfig } from '../config/config-schema';
import { TestResult } from './execution-result';
import { Logger } from '../utils/logger';
import { CodeExecutor } from './code-executor';
import { Spinner } from '../utils/progress';
import { ScreenshotCapture, ScreenshotConfig } from '../screenshots/screenshot-capture';

export class PlaywrightRunner {
  private config: PlaywrightConfig;
  private logger: Logger;
  private executor: CodeExecutor;
  private screenshotCapture: ScreenshotCapture;

  constructor(config: PlaywrightConfig, screenshotConfig: ScreenshotConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger();
    this.executor = new CodeExecutor(logger);
    this.screenshotCapture = new ScreenshotCapture(screenshotConfig, logger);
  }

  async runTest(test: TestModel, code: string, cacheStatus?: 'hit' | 'miss'): Promise<TestResult> {
    const startTime = Date.now();
    let browser: Browser | null = null;
    let page: Page | null = null;

    const spinner = new Spinner(`Running test: ${test.title}`);

    try {
      this.logger.info(`Running test: ${test.title}`);
      spinner.start();

      browser = await this.setupBrowser();
      const context = await browser.newContext();
      page = await context.newPage();

      page.setDefaultTimeout(this.config.timeout);

      const result = await this.executor.execute(code, page);

      // Capture screenshot
      const screenshotPath = await this.screenshotCapture.capture(
        page,
        test.title,
        result.success ? 'passed' : 'failed'
      );

      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        test: {
          title: test.title,
          filePath: test.filePath
        },
        success: result.success,
        steps: result.steps.map(step => ({
          ...step,
          duration: 0
        })),
        duration,
        error: result.error,
        timestamp: new Date(),
        screenshotPaths: screenshotPath ? [screenshotPath] : [],
        cacheStatus
      };

      if (result.success) {
        spinner.stop(`Test passed: ${test.title}`);
        this.logger.success(`Test passed: ${test.title} (${duration}ms)`);
      } else {
        spinner.stop(`Test failed: ${test.title}`);
        this.logger.error(`Test failed: ${test.title} - ${result.error}`);
      }

      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      spinner.stop(`Test failed: ${test.title}`);
      this.logger.error(`Test failed with error: ${errorMessage}`);

      // Capture screenshot on error
      const screenshotPath = page ? await this.screenshotCapture.capture(
        page,
        test.title,
        'failed'
      ) : '';

      return {
        test: {
          title: test.title,
          filePath: test.filePath
        },
        success: false,
        steps: [],
        duration,
        error: errorMessage,
        timestamp: new Date(),
        screenshotPaths: screenshotPath ? [screenshotPath] : []
      };
    } finally {
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
    }
  }

  async runTests(tests: TestModel[], codes: string[], cacheStatuses?: Array<'hit' | 'miss'>): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (let i = 0; i < tests.length; i++) {
      const cacheStatus = cacheStatuses?.[i];
      const result = await this.runTest(tests[i], codes[i], cacheStatus);
      results.push(result);
    }

    return results;
  }

  private async setupBrowser(): Promise<Browser> {
    this.logger.debug(`Starting ${this.config.browser} browser`);

    const launchOptions: any = {
      headless: this.config.headless
    };

    switch (this.config.browser) {
      case 'chromium':
        return await chromium.launch(launchOptions);
      case 'firefox':
        return await chromium.launch({ ...launchOptions, channel: 'firefox' });
      case 'webkit':
        return await chromium.launch({ ...launchOptions, channel: 'webkit' });
      default:
        throw new Error(`Unsupported browser: ${this.config.browser}`);
    }
  }
}
