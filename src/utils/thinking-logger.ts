import chalk from 'chalk';

export interface ThinkingCallbacks {
  onThinking?: (thought: string) => void;
  onDecision?: (decision: string, reasoning: string) => void;
  onProgress?: (progress: string) => void;
  onResult?: (result: string) => void;
}

export class ThinkingLogger {
  private callbacks: ThinkingCallbacks;
  private startTime: number | null = null;

  constructor(callbacks?: ThinkingCallbacks) {
    this.callbacks = callbacks || {};
  }

  startPhase(phase: string): void {
    this.startTime = Date.now();
    this.logThought(phase);
  }

  logThought(thought: string): void {
    console.log(chalk.blue('🧠'), thought);
    this.callbacks.onThinking?.(thought);
  }

  logDecision(decision: string, reasoning: string): void {
    console.log(chalk.blue('🧠'), `Decision: ${decision}`);
    console.log(chalk.gray('   →'), `Reasoning: ${reasoning}`);
    this.callbacks.onDecision?.(decision, reasoning);
  }

  logProgress(progress: string): void {
    console.log(chalk.gray('   →'), progress);
    this.callbacks.onProgress?.(progress);
  }

  logResult(result: string): void {
    console.log(chalk.green('   ✓'), result);
    this.callbacks.onResult?.(result);
  }

  logParallelStart(tasks: string[]): void {
    console.log(chalk.blue('🧠'), 'Analyzing in parallel:');
    tasks.forEach((task, index) => {
      const prefix = index === tasks.length - 1 ? '   └─' : '   ├─';
      console.log(prefix, task);
    });
  }

  logParallelResult(task: string, result: string): void {
    console.log(chalk.green('   ✓'), `${task} → ${result}`);
  }

  logParallelComplete(count: number, timeMs?: number): void {
    const time = timeMs ? ` (${this.formatTime(timeMs)})` : '';
    console.log(chalk.green('✅'), `Analyzed ${count} items in parallel${time}`);
  }

  logSequentialStart(task: string): void {
    console.log(chalk.blue('🧠'), `Sequential analysis: ${task}`);
  }

  logSequentialProgress(item: string, current: number, total: number): void {
    const percent = Math.round((current / total) * 100);
    console.log(chalk.gray('   →'), `[${current}/${total}] ${item} (${percent}%)`);
  }

  logFeatureDetected(name: string, priority: string, confidence: number): void {
    const priorityColor = {
      high: chalk.red,
      medium: chalk.yellow,
      low: chalk.gray
    };
    const color = priorityColor[priority as keyof typeof priorityColor] || chalk.white;
    console.log(
      chalk.gray('   →'),
      `${name} → ${color(priority.toUpperCase())} (${Math.round(confidence * 100)}%)`
    );
  }

  logRankingTable(features: Array<{name: string; priority: string; routes: string[]; confidence: number}>): void {
    console.log('\n' + chalk.bold('📊 Feature Ranking:\n'));
    
    const tableData = features.map(f => ({
      'Feature': f.name,
      'Priority': f.priority.toUpperCase(),
      'Routes': f.routes.length > 0 ? f.routes.slice(0, 2).join(', ') + (f.routes.length > 2 ? '...' : '') : '-',
      'Confidence': `${Math.round(f.confidence * 100)}%`
    }));

    console.table(tableData);
  }

  logTime(strategy: 'sequential' | 'parallel' | 'parallel-sampling'): void {
    if (this.startTime) {
      const elapsed = Date.now() - this.startTime;
      const strategyDisplay = strategy === 'parallel-sampling' ? 'parallel multitasking + sampling' : strategy;
      console.log(
        chalk.gray('⏱️'),
        `Analysis completed in ${this.formatTime(elapsed)} (${strategyDisplay})`
      );
    }
  }

  private formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    return `${seconds}s`;
  }
}
