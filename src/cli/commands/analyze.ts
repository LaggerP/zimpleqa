import readline from 'readline';
import path from 'path';
import chalk from 'chalk';
import { Logger } from '../../utils/logger';
import { ThinkingLogger } from '../../utils/thinking-logger';
import { ConfigManager } from '../../config/config-manager';
import { CodebaseAIAnalyzer, AIAnalysisResult, AnalyzedFeature } from '../../analyzer/codebase-ai-analyzer';
import { ProjectDetector, ScanProgressCallbacks } from '../../analyzer';
import { TestBatchGenerator, TestGenerationCallbacks } from '../../generator/test-batch-generator';

interface AnalyzeOptions {
  output?: string;
  force?: boolean;
  minPriority?: string;
  verbose?: boolean;
}

const SMALL_PROJECT_THRESHOLD = 20;
const LARGE_PROJECT_THRESHOLD = 100;

function confirm(query: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`${query} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  const logger = new Logger(options.verbose);
  const thinking = new ThinkingLogger();
  const cwd = process.cwd();

  thinking.startPhase('Initial Assessment');
  thinking.logProgress('Scanning project structure...');

  const configManager = new ConfigManager(undefined, logger);
  const config = await configManager.load();

  const validation = await configManager.validate();
  if (!validation.valid) {
    logger.error(validation.error || 'Unknown validation error');
    logger.warning('Please configure your API key first:');
    logger.warning('  zqa config set glm.apiKey <your-api-key>');
    process.exit(1);
  }

  let fileCount = 0;
  let lastDir = '';
  
  const scanCallbacks: ScanProgressCallbacks = {
    onFileScanned: (_file: string) => {
      fileCount++;
      if (options.verbose && fileCount % 10 === 0) {
        process.stdout.write(`\r${chalk.gray('   →')} Scanned ${fileCount} files...`);
      }
    },
    onDirectoryScanned: (dir: string, _count: number) => {
      if (dir !== lastDir && dir !== '.') {
        lastDir = dir;
      }
    },
    onFrameworkDetected: (framework: string, router: string) => {
      thinking.logThought('Framework Detection');
      thinking.logProgress(`Detected: ${framework} with ${router} router`);
      thinking.logResult(`Framework: ${framework}`);
    },
    onRouteFound: (_route: string) => {
      // Silently count routes
    },
    onComponentFound: (_component: string) => {
      // Silently count components
    }
  };

  const detector = new ProjectDetector(cwd, undefined, scanCallbacks);
  const codebase = await detector.analyzeCodebase();
  
  if (options.verbose) {
    process.stdout.write('\n');
  }
  
  thinking.logProgress(`Found: ${codebase.files.length} files total`);

  const strategy = determineStrategy(codebase.files.length);
  thinking.logDecision(
    strategy === 'sequential' ? 'Sequential analysis' : 
    strategy === 'parallel' ? 'Parallel multitasking' : 'Parallel multitasking + sampling',
    `Project has ${codebase.files.length} files`
  );

  if (codebase.projectInfo.routes.length > 0) {
    thinking.logThought('Route Scanning');
    thinking.logProgress(`Found ${codebase.projectInfo.routes.length} routes: ${codebase.projectInfo.routes.slice(0, 5).join(', ')}${codebase.projectInfo.routes.length > 5 ? '...' : ''}`);
    thinking.logResult(`${codebase.projectInfo.routes.length} routes found`);
  }

  thinking.logThought('Sending codebase to AI for analysis...');
  thinking.logProgress('Building context from scanned files...');
  
  const analyzer = new CodebaseAIAnalyzer(config, logger);
  
  let analysis: AIAnalysisResult;
  
  try {
    analysis = await analyzer.analyzeFromCodebase(codebase);
  } catch (error) {
    logger.error(`Failed to analyze codebase: ${error}`);
    process.exit(1);
  }

  console.log(chalk.blue('\n📊'), 'Analysis Results:');
  console.log(`   ${chalk.gray('Framework:')} ${analysis.framework}`);
  console.log(`   ${chalk.gray('Files scanned:')} ${codebase.files.length}`);
  console.log(`   ${chalk.gray('Features detected:')} ${analysis.features.length}`);

  if (analysis.summary) {
    console.log(chalk.blue('\n📝'), 'Summary:');
    console.log(chalk.gray(`   ${analysis.summary}`));
  }

  if (options.verbose && analysis.recommendations?.length > 0) {
    console.log(chalk.blue('\n💡'), 'Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(chalk.gray(`   - ${rec}`));
    });
  }

  let features = analysis.features;

  if (features.length === 0) {
    logger.warning('No features detected by AI analysis.');
    process.exit(0);
  }

  thinking.logThought('Feature Detection & Classification');
  features.forEach(feature => {
    thinking.logFeatureDetected(feature.name, feature.priority, feature.confidence);
  });

  if (options.minPriority) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const minLevel = priorityOrder[options.minPriority as keyof typeof priorityOrder];
    if (minLevel !== undefined) {
      features = features.filter(f => priorityOrder[f.priority] <= minLevel);
    }
  }

  thinking.logRankingTable(features.map(f => ({
    name: f.name,
    priority: f.priority,
    routes: f.routes,
    confidence: f.confidence
  })));

  const outputDir = options.output || path.join(cwd, '.zqa', 'tests', 'cases');
  
  if (!options.force) {
    const shouldGenerate = await confirm(`\n❓ Generate ${features.length} test cases in ${outputDir}?`);
    if (!shouldGenerate) {
      logger.info('Operation cancelled');
      process.exit(0);
    }
  }

  thinking.logThought('Test Generation');
  thinking.logProgress(`Creating ${features.length} manual test cases in markdown v0.2.0 format...`);

  const generatorCallbacks: TestGenerationCallbacks = {
    onTestGenerated: (fileName: string, index: number, total: number) => {
      process.stdout.write(`\r${chalk.green('   ✓')} [${index}/${total}] Generated ${fileName}`);
    }
  };

  const generator = new TestBatchGenerator(logger, generatorCallbacks);
  
  try {
    const convertedFeatures: AnalyzedFeature[] = features.map(f => ({
      ...f,
      suggestedTests: f.suggestedTests || []
    }));

    const generatedTests = await generator.generateTestsFromAI(convertedFeatures, {
      outputDir,
      baseUrl: undefined,
      author: 'Generated by zimpleQA'
    });

    process.stdout.write('\n');
    thinking.logResult('Tests generated');

    console.log('\n' + chalk.green('✅ Done!'));
    logger.success(`Generated ${generatedTests.length} test cases`);
    console.log(`📁 Location: ${outputDir}`);
    console.log('\n📝 Next steps:');
    console.log(`   1. Review the tests: cat ${outputDir}/*.md`);
    console.log(`   2. Run tests: zqa run ${outputDir}/`);
    console.log(`   3. Or run specific test: zqa run ${outputDir}/${generatedTests[0]?.fileName || 'test.md'}`);

    thinking.logTime(strategy);

  } catch (error) {
    logger.error(`Failed to generate tests: ${error}`);
    process.exit(1);
  }
}

function determineStrategy(fileCount: number): 'sequential' | 'parallel' | 'parallel-sampling' {
  if (fileCount < SMALL_PROJECT_THRESHOLD) {
    return 'sequential';
  } else if (fileCount < LARGE_PROJECT_THRESHOLD) {
    return 'parallel';
  } else {
    return 'parallel-sampling';
  }
}
