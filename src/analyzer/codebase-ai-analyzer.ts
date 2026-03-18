import axios from 'axios';
import { Logger } from '../utils/logger';
import { Config } from '../config/config-schema';
import { ProjectDetector, CodebaseAnalysis } from '../analyzer';

export interface AnalyzedFeature {
  name: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  routes: string[];
  components: string[];
  confidence: number;
  description: string;
  suggestedTests: string[];
}

export interface AIAnalysisResult {
  framework: string;
  frameworkVersion?: string;
  features: AnalyzedFeature[];
  summary: string;
  recommendations: string[];
}

export class CodebaseAIAnalyzer {
  private logger: Logger;
  private config: Config;

  constructor(config: Config, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger();
  }

  async analyze(cwd: string): Promise<{ analysis: AIAnalysisResult; codebase: CodebaseAnalysis }> {
    this.logger.info('Scanning entire codebase...');
    
    const detector = new ProjectDetector(cwd, this.logger);
    const codebase = await detector.analyzeCodebase();
    
    this.logger.info(`Found ${codebase.files.length} files in codebase`);

    const context = this.buildContext(codebase);
    
    this.logger.info('Sending codebase to AI for analysis...');
    
    const aiResult = await this.callAI(context);

    return {
      analysis: aiResult,
      codebase
    };
  }

  async analyzeFromCodebase(codebase: CodebaseAnalysis): Promise<AIAnalysisResult> {
    const context = this.buildContext(codebase);
    return this.callAI(context);
  }

  private buildContext(codebase: CodebaseAnalysis): string {
    const sections: string[] = [];

    sections.push('=== PROJECT STRUCTURE ===');
    sections.push(`Root: ${codebase.projectInfo.rootPath}`);
    sections.push(`Type: ${codebase.projectInfo.type}`);
    sections.push(`Router: ${codebase.projectInfo.routerType}`);
    
    if (codebase.projectInfo.packageJson) {
      sections.push('\n=== PACKAGE.JSON ===');
      sections.push(`Name: ${codebase.projectInfo.packageJson.name || 'N/A'}`);
      
      const mainDeps = Object.entries(codebase.projectInfo.packageJson.dependencies)
        .filter(([name]) => 
          name.includes('react') || 
          name.includes('next') || 
          name.includes('vue') ||
          name.includes('angular') ||
          name.includes('svelte') ||
          name.includes('auth') ||
          name.includes('form') ||
          name.includes('stripe') ||
          name.includes('payment') ||
          name.includes('ui') ||
          name.includes('query') ||
          name.includes('redux') ||
          name.includes('router')
        )
        .slice(0, 20);
      
      if (mainDeps.length > 0) {
        sections.push('Key Dependencies:');
        mainDeps.forEach(([name, version]) => {
          sections.push(`  - ${name}: ${version}`);
        });
      }
    }

    sections.push('\n=== ROUTES ===');
    if (codebase.projectInfo.routes.length > 0) {
      codebase.projectInfo.routes.forEach(route => {
        sections.push(`  ${route}`);
      });
    } else {
      sections.push('  No routes detected');
    }

    sections.push('\n=== KEY FILES CONTENT ===');
    
    const maxFiles = 50;
    const maxContentPerFile = 2000;
    const maxTotalContent = 100000;
    
    let totalContent = 0;
    let filesIncluded = 0;

    const priorityPatterns = [
      /page\.(tsx|jsx|vue)$/,
      /layout\.(tsx|jsx|vue)$/,
      /route\.(ts|js)$/,
      /router/,
      /store/,
      /context/,
      /hook/,
      /service/,
      /api/,
      /component/i,
      /auth/i,
      /login/i,
      /register/i,
      /checkout/i,
      /payment/i,
      /profile/i,
      /dashboard/i,
      /form/i
    ];

    const sortedFiles = [...codebase.files].sort((a, b) => {
      const aScore = priorityPatterns.some(p => p.test(a.relativePath)) ? 1 : 0;
      const bScore = priorityPatterns.some(p => p.test(b.relativePath)) ? 1 : 0;
      return bScore - aScore;
    });

    for (const file of sortedFiles) {
      if (filesIncluded >= maxFiles || totalContent >= maxTotalContent) break;
      
      const ext = file.extension;
      if (!['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'].includes(ext)) continue;
      
      if (file.relativePath.includes('.test.') || 
          file.relativePath.includes('.spec.') ||
          file.relativePath.includes('__tests__')) continue;

      let content = file.content;
      if (content.length > maxContentPerFile) {
        content = content.substring(0, maxContentPerFile) + '\n... (truncated)';
      }

      sections.push(`\n--- FILE: ${file.relativePath} ---`);
      sections.push(content);
      
      totalContent += content.length;
      filesIncluded++;
    }

    sections.push(`\n=== SUMMARY ===`);
    sections.push(`Total files scanned: ${codebase.files.length}`);
    sections.push(`Files included in analysis: ${filesIncluded}`);
    sections.push(`Routes detected: ${codebase.projectInfo.routes.length}`);
    sections.push(`Components found: ${codebase.projectInfo.components.length}`);

    return sections.join('\n');
  }

  private async callAI(context: string): Promise<AIAnalysisResult> {
    const provider = this.config.ai.provider;
    const providerConfig = this.config.ai[provider];

    if (!providerConfig || !providerConfig.apiKey) {
      throw new Error(`API key not configured for provider: ${provider}. Run: zqa config set ${provider}.apiKey <your-key>`);
    }

    const systemPrompt = `You are an expert QA engineer and software architect. Your task is to analyze a frontend codebase and identify features that need manual testing.

Analyze the provided codebase context and return a JSON response with the following structure:

{
  "framework": "detected framework (e.g., 'Next.js 14', 'React 18', 'Vue 3')",
  "frameworkVersion": "version if detected",
  "features": [
    {
      "name": "Feature name (human readable)",
      "type": "feature category (auth|payment|checkout|form|search|profile|dashboard|api|static|navigation|crud|upload|notification|settings|other)",
      "priority": "high|medium|low",
      "routes": ["/related/routes"],
      "components": ["RelatedComponent1", "RelatedComponent2"],
      "confidence": 0.0-1.0,
      "description": "Brief description of the feature and what it does",
      "suggestedTests": ["Test case 1 description", "Test case 2 description"]
    }
  ],
  "summary": "Brief summary of the application and its main purpose",
  "recommendations": ["Recommendation 1 for testing strategy", "Recommendation 2"]
}

PRIORITY GUIDELINES:
- HIGH: Authentication, payments, checkout, data modification, security features
- MEDIUM: Forms, search, user profile, dashboard, CRUD operations, notifications
- LOW: Static pages, navigation, read-only content, UI polish

IMPORTANT:
1. Only include features that actually exist in the codebase based on the code you see
2. Be specific about routes and components when you can identify them
3. Suggest realistic test cases that a QA engineer would actually perform
4. Return ONLY valid JSON, no markdown formatting, no code blocks`;

    const userPrompt = `Analyze this frontend codebase and identify all features that need manual testing:

${context}

Return your analysis as valid JSON.`;

    try {
      let response;

      if (provider === 'glm') {
        const glmConfig = providerConfig as { baseUrl: string; apiKey: string; model?: string };
        response = await axios.post(
          `${glmConfig.baseUrl}/chat/completions`,
          {
            model: providerConfig.model || 'glm-4.7',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${providerConfig.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 180000
          }
        );
      } else if (provider === 'claude') {
        response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: providerConfig.model || 'claude-3-5-sonnet-20241022',
            max_tokens: 16000,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ]
          },
          {
            headers: {
              'x-api-key': providerConfig.apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            },
            timeout: 180000
          }
        );
      } else if (provider === 'gpt') {
        const gptConfig = providerConfig as { baseUrl?: string; apiKey: string; model?: string };
        response = await axios.post(
          gptConfig.baseUrl || 'https://api.openai.com/v1/chat/completions',
          {
            model: providerConfig.model || 'gpt-4-turbo-preview',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${providerConfig.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 180000
          }
        );
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      let content: string;
      if (provider === 'claude') {
        content = response.data.content[0].text;
      } else {
        content = response.data.choices[0].message.content;
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI response does not contain valid JSON');
      }

      const result: AIAnalysisResult = JSON.parse(jsonMatch[0]);
      
      if (!result.features || !Array.isArray(result.features)) {
        throw new Error('AI response does not contain valid features array');
      }

      return result;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`AI API error: ${message}`);
      }
      throw error;
    }
  }
}
