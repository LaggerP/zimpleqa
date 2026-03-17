/**
 * Progress utilities for visual feedback during long-running operations
 */

export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private interval?: NodeJS.Timeout;
  private startTime: number;
  private isRunning = false;

  constructor(private message: string) {
    this.startTime = Date.now();
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.interval = setInterval(() => {
      const frame = this.frames[this.currentFrame];
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      process.stdout.write(`\r${frame} ${this.message} [${elapsed}s]`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 100);
  }

  stop(finalMessage?: string): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
    }

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

    if (finalMessage) {
      process.stdout.write(`\r${' '.repeat(process.stdout.columns || 80)}`);
      process.stdout.write(`\r✓ ${finalMessage} (${elapsed}s)\n`);
    } else {
      process.stdout.write(`\r${' '.repeat(process.stdout.columns || 80)}\n`);
    }
  }

  updateMessage(newMessage: string): void {
    this.message = newMessage;
  }
}

export class ProgressBar {
  private interval?: NodeJS.Timeout;
  private startTime: number;
  private isRunning = false;

  constructor(
    private total: number,
    private prefix: string = 'Progress',
    private width: number = 30
  ) {
    this.startTime = Date.now();
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.render(0);

    this.interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      process.stdout.write(` [${elapsed}s]`);
    }, 1000);
  }

  update(current: number): void {
    if (!this.isRunning) {
      return;
    }

    this.render(current);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
    }

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    process.stdout.write(` (${elapsed}s)\n`);
  }

  private render(current: number): void {
    const percent = Math.min(current / this.total, 1);
    const filled = Math.floor(this.width * percent);
    const empty = this.width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r${this.prefix}: [${bar}] ${Math.floor(percent * 100)}%`);
  }
}

export class ProgressTracker {
  private spinners: Map<string, Spinner> = new Map();

  createSpinner(id: string, message: string): Spinner {
    const spinner = new Spinner(message);
    this.spinners.set(id, spinner);
    return spinner;
  }

  getSpinner(id: string): Spinner | undefined {
    return this.spinners.get(id);
  }

  removeSpinner(id: string): void {
    this.spinners.delete(id);
  }

  clearAll(): void {
    this.spinners.forEach((spinner) => {
      if ((spinner as any).isRunning) {
        spinner.stop();
      }
    });
    this.spinners.clear();
  }
}
