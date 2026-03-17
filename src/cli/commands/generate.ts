/**
 * generate command - Generate test template using AI
 */

import readline from 'readline';
import path from 'path';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../../config/config-manager';
import { CodeGenerator } from '../../ai/code-generator';
import { FileHelpers } from '../../utils/file-helpers';

interface GenerateOptions {
  output?: string;
  provider?: string;
  model?: string;
  verbose?: boolean;
}

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

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

export async function generateCommand(options: GenerateOptions): Promise<void> {
  const logger = new Logger(options.verbose);

  logger.section('🤖 Test Generator');

  const configManager = new ConfigManager(undefined, logger);
  await configManager.load();

  const validation = await configManager.validate();
  if (!validation.valid) {
    logger.error(validation.error || 'Unknown validation error');
    logger.warning('Please configure your API key first:');
    logger.warning('  zqa config set glm.apiKey <your-api-key>');
    process.exit(1);
  }

  const generator = new CodeGenerator(configManager.getConfig(), logger);

  if (options.provider) {
    if (!['glm', 'claude', 'gpt'].includes(options.provider)) {
      logger.error(`Invalid provider: ${options.provider}. Valid providers: glm, claude, gpt`);
      process.exit(1);
    }
    generator.setProvider(options.provider as 'glm' | 'claude' | 'gpt');
    logger.info(`Using provider: ${options.provider}`);
  }

  try {
    // Preguntar información básica del test
    logger.info('\n📋 Let me ask you some basic information about your test:\n');

    const testTitle = await question('📝 Test title (e.g., "Login flow", "Checkout process"): ');
    if (!testTitle) {
      logger.error('Test title is required');
      process.exit(1);
    }

    const testDescription = await question('📖 Test description (what flow do you want to test?): ');
    if (!testDescription) {
      logger.error('Test description is required');
      process.exit(1);
    }

    const testUrl = await question('🌐 Base URL (e.g., http://localhost:3000 or https://example.com): ');
    if (!testUrl) {
      logger.error('Base URL is required');
      process.exit(1);
    }

    const preconditions = await question('⚠️  Preconditions (optional, press Enter to skip): ');

    logger.info('\n🤖 Analyzing your description and generating test steps...\n');

    const stepsPrompt = `Based on the following test description, generate a detailed step-by-step test case.

Test Title: ${testTitle}
Description: ${testDescription}
Base URL: ${testUrl}
${preconditions ? `Preconditions: ${preconditions}` : ''}

Generate a list of detailed test steps (typically 4-10 steps) that a QA engineer would follow to test this flow.

IMPORTANT:
- Each step should be actionable and specific
- Start with navigation to the URL
- Include user interactions (clicks, inputs, waiting)
- Include verifications
- Be realistic and specific
- Reply ONLY with a JSON array of steps, like this:
  [
    "Navigate to the login page",
    "Wait for page to load",
    "Enter email in the email field",
    ...
  ]`;

    let generatedSteps: string[] = [];

    try {
      // Hacer una llamada directa al API para generar steps
      const axios = (await import('axios')).default;
      const config = configManager.getConfig();
      const providerConfig = config.ai.glm;

      if (config.ai.provider === 'glm' && providerConfig) {
        const apiUrl = `${providerConfig.baseUrl}/chat/completions`;

        const response = await axios.post(apiUrl, {
          model: providerConfig.model || 'glm-4.7',
          messages: [
            {
              role: 'system',
              content: 'You are a QA expert that generates detailed test steps. Always respond with valid JSON arrays of strings.'
            },
            {
              role: 'user',
              content: stepsPrompt
            }
          ]
        }, {
          headers: {
            'Authorization': `Bearer ${providerConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        });

        const content = response.data.choices[0].message.content;

        // Extraer JSON de la respuesta
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedSteps = JSON.parse(jsonMatch[0]);
        }
      }

      if (generatedSteps.length === 0) {
        throw new Error('Failed to generate steps');
      }

    } catch (error) {
      logger.warning(`Failed to generate steps automatically: ${error}`);
      logger.info('Falling back to manual step entry...\n');

      // Fallback a entrada manual
      generatedSteps = [];
      let stepCount = 1;
      logger.info('📋 Enter test steps manually (one per line, empty line to finish):');
      while (true) {
        const step = await question(`   Step ${stepCount}> `);
        if (!step) break;
        generatedSteps.push(step);
        stepCount++;
      }

      if (generatedSteps.length === 0) {
        logger.error('At least one step is required');
        process.exit(1);
      }
    }

    // Mostrar los steps generados
    logger.section('\n📝 Generated Test Steps:');
    generatedSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });

    // Permitir editar los steps
    const wantsToEdit = await confirm('\n❓ Do you want to edit these steps?');

    if (wantsToEdit) {
      logger.info('\n✏️  Editing steps. Commands:');
      logger.info('   - Enter step number to view/edit');
      logger.info('   - Type "add" to add a new step');
      logger.info('   - Type "delete <number>" to remove a step');
      logger.info('   - Type "done" to finish editing\n');

      let editing = true;
      while (editing) {
        const action = await question('Enter command: ');
        const trimmedAction = action.trim().toLowerCase();

        if (trimmedAction === 'done') {
          editing = false;
        } else if (trimmedAction === 'add') {
          const newStep = await question('New step description: ');
          if (newStep) {
            generatedSteps.push(newStep);
            logger.success(`Step ${generatedSteps.length} added`);
          }
        } else if (trimmedAction.startsWith('delete ')) {
          const stepNum = parseInt(trimmedAction.split(' ')[1]);
          if (stepNum > 0 && stepNum <= generatedSteps.length) {
            const removed = generatedSteps.splice(stepNum - 1, 1)[0];
            logger.success(`Deleted step ${stepNum}: "${removed}"`);

            // Mostrar steps actualizados
          } else {
            logger.error(`Invalid step number: ${stepNum}`);
          }
        } else if (!isNaN(parseInt(trimmedAction))) {
          const stepNum = parseInt(trimmedAction);
          if (stepNum > 0 && stepNum <= generatedSteps.length) {
            logger.info(`Current step ${stepNum}: ${generatedSteps[stepNum - 1]}`);
            const editAction = await question('Edit (press Enter to keep, or type new description): ');
            if (editAction.trim()) {
              generatedSteps[stepNum - 1] = editAction.trim();
              logger.success(`Step ${stepNum} updated`);
            }
          } else {
            logger.error(`Invalid step number: ${stepNum}`);
          }
        } else {
          logger.error('Invalid command. Use: add, delete <number>, step number, or done');
        }

        // Mostrar estado actual si no terminó
        if (editing) {
          logger.info('\nCurrent steps:');
          generatedSteps.forEach((step, index) => {
            console.log(`  ${index + 1}. ${step}`);
          });
          console.log('');
        }
      }
    }

    // Mostrar final de los steps
    logger.section('\n✅ Final Test Steps:');
    generatedSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });

    // Expected results
    logger.info('\n✅ Expected results (one per line, empty line to finish):');
    logger.info('   Example: "User is redirected to dashboard"');

    const expectedResults: string[] = [];
    while (true) {
      const result = await question('   Expected result> ');
      if (!result) break;
      expectedResults.push(result);
    }

    // Si no hay expected results, generar uno automático
    if (expectedResults.length === 0) {
      logger.info('Generating expected result from last step...');
      expectedResults.push(`Test completes successfully: ${generatedSteps[generatedSteps.length - 1]}`);
    }

    const postconditions = await question('\n⏭️  Postconditions (optional, press Enter to skip): ');

    // Generar el markdown
    const markdown = generateTestMarkdown({
      title: testTitle,
      description: testDescription,
      url: testUrl,
      preconditions: preconditions || undefined,
      postconditions: postconditions || undefined,
      steps: generatedSteps,
      expectedResults
    });

    // Determinar el nombre del archivo
    const sanitizedTitle = testTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const defaultFileName = `${sanitizedTitle}-test.md`;
    const fileName = options.output || defaultFileName;
    const filePath = path.join(process.cwd(), 'tests', fileName);

    // Asegurar que el directorio tests existe
    await FileHelpers.ensureDirectory(path.join(process.cwd(), 'tests'));

    // Guardar el archivo
    await FileHelpers.writeFile(filePath, markdown);

    logger.section('\n✅ Test template generated successfully!');
    logger.info(`📁 Saved to: ${filePath}`);
    logger.info('\nNext steps:');
    logger.info('  1. Review and edit the test if needed');
    logger.info(`  2. Run the test: zqa run tests/${fileName}`);
    logger.info('  3. Or run all tests: zqa run tests/');

  } catch (error) {
    if (error instanceof Error && error.message === 'User cancelled') {
      logger.info('\nOperation cancelled by user');
      process.exit(0);
    }
    logger.error(`Failed to generate test: ${error}`);
    process.exit(1);
  }
}

interface TestMetadata {
  title: string;
  description: string;
  url: string;
  preconditions?: string;
  postconditions?: string;
  steps: string[];
  expectedResults: string[];
}

function generateTestMarkdown(metadata: TestMetadata): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Test: ${metadata.title}`);
  lines.push('');

  // Metadata
  lines.push('## Metadata');
  lines.push('Version: 0.2.0');
  lines.push('Author: [Generated by zimpleQA]');
  lines.push('Priority: medium');
  lines.push('Tags: auto-generated, e2e');
  lines.push('');

  // Description
  lines.push('## Description');
  lines.push(metadata.description);
  lines.push('');

  // URL
  lines.push('## URL');

  // Detectar si necesita variables
  const needsBaseUrl = metadata.url.includes('localhost') ||
                       metadata.url === 'http://localhost:3000' ||
                       metadata.url === 'https://localhost:3000';

  if (needsBaseUrl) {
    lines.push('${BASE_URL}');
  } else {
    lines.push(metadata.url);
  }
  lines.push('');

  // Precondition
  if (metadata.preconditions) {
    lines.push('## Precondition');
    lines.push(metadata.preconditions);
    lines.push('');
  }

  // Steps
  lines.push('## Steps');
  metadata.steps.forEach((step, index) => {
    // Reemplazar URLs con variables
    let processedStep = step;
    if (needsBaseUrl) {
      processedStep = processedStep.replace(metadata.url, '${BASE_URL}');
      processedStep = processedStep.replace('http://localhost:3000', '${BASE_URL}');
      processedStep = processedStep.replace('https://localhost:3000', '${BASE_URL}');
    }
    lines.push(`${index + 1}. ${processedStep}`);
  });
  lines.push('');

  // Expected Results
  lines.push('## Expected Results');
  if (metadata.expectedResults.length > 0) {
    metadata.expectedResults.forEach(result => {
      let processedResult = result;
      if (needsBaseUrl) {
        processedResult = processedResult.replace(metadata.url, '${BASE_URL}');
        processedResult = processedResult.replace('http://localhost:3000', '${BASE_URL}');
        processedResult = processedResult.replace('https://localhost:3000', '${BASE_URL}');
      }
      lines.push(`- ${processedResult}`);
    });
  } else {
    lines.push('- Test completes successfully');
  }
  lines.push('');

  // Postcondition
  if (metadata.postconditions) {
    lines.push('## Postcondition');
    lines.push(metadata.postconditions);
    lines.push('');
  }

  // Variables
  if (needsBaseUrl) {
    lines.push('## Variables');
    lines.push(`BASE_URL=${metadata.url}`);
  }

  return lines.join('\n');
}
