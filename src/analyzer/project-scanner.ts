import path from 'path';
import fs from 'fs/promises';
import { Logger } from '../utils/logger';
import { FileHelpers } from '../utils/file-helpers';
import {
  ProjectType,
  RouterType,
  ProjectInfo,
  DetectedFeature,
  FeatureType,
  CRITICALITY_MAP,
  FEATURE_PATTERNS,
  COMPONENT_PATTERNS
} from './project-detector';

export interface ScanProgressCallbacks {
  onDirectoryScanned?: (dir: string, fileCount: number) => void;
  onFileScanned?: (file: string) => void;
  onFrameworkDetected?: (framework: string, router: string) => void;
  onRouteFound?: (route: string) => void;
  onComponentFound?: (component: string) => void;
}

export interface CodebaseFile {
  path: string;
  relativePath: string;
  content: string;
  extension: string;
}

export interface CodebaseAnalysis {
  projectInfo: ProjectInfo;
  files: CodebaseFile[];
  features: DetectedFeature[];
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  '.cache',
  'coverage',
  '.zqa'
]);

const IGNORED_FILES = new Set([
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb'
]);

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.vue', '.svelte', '.astro',
  '.json', '.md',
  '.css', '.scss', '.sass', '.less',
  '.html', '.htm',
  '.graphql', '.gql',
  '.yaml', '.yml',
  '.prisma'
]);

export class ProjectDetector {
  private rootPath: string;
  private allFiles: CodebaseFile[] = [];
  private callbacks: ScanProgressCallbacks;
  private fileCount: number = 0;

  constructor(rootPath: string, _logger?: Logger, callbacks?: ScanProgressCallbacks) {
    this.rootPath = rootPath;
    this.callbacks = callbacks || {};
  }

  async detect(): Promise<ProjectInfo> {
    this.allFiles = await this.scanEntireCodebase();

    const packageJson = await this.readPackageJson();
    const type = await this.detectProjectType(packageJson);
    const routerType = await this.detectRouterType(type);
    
    this.callbacks.onFrameworkDetected?.(type, routerType);
    
    const routes = await this.scanRoutes(type, routerType);
    routes.forEach(route => this.callbacks.onRouteFound?.(route));
    
    const components = await this.scanComponents();
    components.forEach(comp => this.callbacks.onComponentFound?.(comp));

    return {
      type,
      routerType,
      rootPath: this.rootPath,
      packageJson,
      routes,
      components
    };
  }

  async scanEntireCodebase(): Promise<CodebaseFile[]> {
    const files: CodebaseFile[] = [];
    this.fileCount = 0;
    
    const scanDir = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const dirName = path.relative(this.rootPath, dirPath) || '.';
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name)) {
              await scanDir(fullPath);
            }
          } else if (entry.isFile()) {
            if (IGNORED_FILES.has(entry.name)) continue;
            
            const ext = path.extname(entry.name).toLowerCase();
            if (CODE_EXTENSIONS.has(ext)) {
              try {
                const content = await FileHelpers.readFile(fullPath);
                const relativePath = path.relative(this.rootPath, fullPath);
                files.push({
                  path: fullPath,
                  relativePath,
                  content,
                  extension: ext
                });
                this.fileCount++;
                this.callbacks.onFileScanned?.(relativePath);
              } catch {
                // Skip files that can't be read
              }
            }
          }
        }
        
        this.callbacks.onDirectoryScanned?.(dirName, this.fileCount);
      } catch {
        // Directory doesn't exist or can't be read
      }
    };

    await scanDir(this.rootPath);
    return files;
  }

  getAllFiles(): CodebaseFile[] {
    return this.allFiles;
  }

  private async readPackageJson(): Promise<ProjectInfo['packageJson']> {
    const pkgFile = this.allFiles.find(f => f.relativePath === 'package.json');
    if (pkgFile) {
      try {
        const pkg = JSON.parse(pkgFile.content);
        return {
          name: pkg.name,
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {},
          scripts: pkg.scripts || {}
        };
      } catch {
        return null;
      }
    }

    try {
      const pkgPath = path.join(this.rootPath, 'package.json');
      const content = await FileHelpers.readFile(pkgPath);
      const pkg = JSON.parse(content);
      return {
        name: pkg.name,
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
        scripts: pkg.scripts || {}
      };
    } catch {
      return null;
    }
  }

  private async detectProjectType(pkgJson: ProjectInfo['packageJson']): Promise<ProjectType> {
    const hasConfig = this.allFiles.some(f => 
      f.relativePath.match(/^next\.config\.(js|mjs|ts)$/)
    );
    if (hasConfig) return 'nextjs';

    const hasAppPage = this.allFiles.some(f => 
      f.relativePath.match(/^app\/page\.(tsx|jsx)$/)
    );
    const hasPagesIndex = this.allFiles.some(f => 
      f.relativePath.match(/^pages\/index\.(tsx|jsx|ts|js)$/)
    );
    if (hasAppPage || hasPagesIndex) return 'nextjs';

    if (pkgJson?.dependencies?.['react-router-dom'] || 
        pkgJson?.dependencies?.['react-router']) {
      return 'react';
    }

    if (pkgJson?.dependencies?.['vue-router'] || 
        pkgJson?.dependencies?.['vue']) {
      return 'vue';
    }

    const hasVueFiles = this.allFiles.some(f => f.extension === '.vue');
    if (hasVueFiles) return 'vue';

    const hasReactFiles = this.allFiles.some(f => 
      f.extension === '.tsx' || f.extension === '.jsx'
    );
    if (hasReactFiles) return 'react';

    return 'unknown';
  }

  private async detectRouterType(projectType: ProjectType): Promise<RouterType> {
    if (projectType === 'nextjs') {
      const hasAppDir = this.allFiles.some(f => f.relativePath.startsWith('app/'));
      if (hasAppDir) return 'app';
      
      const hasPagesDir = this.allFiles.some(f => f.relativePath.startsWith('pages/'));
      if (hasPagesDir) return 'pages';
    }

    if (projectType === 'react') return 'react-router';
    if (projectType === 'vue') return 'vue-router';

    return 'unknown';
  }

  async scanRoutes(projectType: ProjectType, routerType: RouterType): Promise<string[]> {
    const routes: string[] = [];

    if (projectType === 'nextjs' && routerType === 'app') {
      for (const file of this.allFiles) {
        if (file.relativePath.match(/\/page\.(tsx|jsx)$/)) {
          const route = this.extractAppRouterRoute(file.relativePath);
          if (route) routes.push(route);
        }
      }
    }

    if (projectType === 'nextjs' && routerType === 'pages') {
      for (const file of this.allFiles) {
        if (file.relativePath.match(/^pages\/.+\.(tsx|jsx|ts|js)$/)) {
          if (!file.relativePath.includes('/api/') && !file.relativePath.includes('_')) {
            const route = this.extractPagesRouterRoute(file.relativePath);
            if (route) routes.push(route);
          }
        }
      }
    }

    if (projectType === 'react') {
      for (const file of this.allFiles) {
        if (file.extension === '.tsx' || file.extension === '.jsx') {
          const routeMatches = file.content.match(/path\s*[=:]\s*["']([^"']+)["']/g);
          if (routeMatches) {
            for (const match of routeMatches) {
              const routeMatch = match.match(/["']([^"']+)["']/);
              if (routeMatch && routeMatch[1]) {
                routes.push(routeMatch[1]);
              }
            }
          }
        }
      }
    }

    if (projectType === 'vue') {
      const routerFile = this.allFiles.find(f => 
        f.relativePath === 'src/router/index.ts' ||
        f.relativePath === 'src/router/index.js'
      );
      if (routerFile) {
        const routeMatches = routerFile.content.match(/path\s*:\s*["']([^"']+)["']/g);
        if (routeMatches) {
          for (const match of routeMatches) {
            const routeMatch = match.match(/["']([^"']+)["']/);
            if (routeMatch && routeMatch[1]) {
              routes.push(routeMatch[1]);
            }
          }
        }
      }
    }

    return [...new Set(routes)].sort();
  }

  private extractAppRouterRoute(relativePath: string): string | null {
    try {
      const dir = path.dirname(relativePath);
      const route = '/' + dir
        .replace(/^app\//, '')
        .replace(/\\/g, '/')
        .replace(/\([^)]+\)/g, '')
        .replace(/\/+/g, '/');
      return route === '/' || route === '' ? '/' : route.replace(/\/$/, '');
    } catch {
      return null;
    }
  }

  private extractPagesRouterRoute(relativePath: string): string | null {
    try {
      let route = '/' + relativePath
        .replace(/^pages\//, '')
        .replace(/\\/g, '/')
        .replace(/\.(tsx|jsx|ts|js)$/, '')
        .replace(/\/index$/, '')
        .replace(/^index$/, '/');
      
      if (route === '') route = '/';
      return route;
    } catch {
      return null;
    }
  }

  async scanComponents(): Promise<string[]> {
    const components: string[] = [];

    for (const file of this.allFiles) {
      if (['.tsx', '.jsx', '.vue'].includes(file.extension)) {
        const name = path.basename(file.path, file.extension);
        components.push(name);
      }
    }

    return [...new Set(components)];
  }

  async detectFeatures(projectInfo: ProjectInfo): Promise<DetectedFeature[]> {
    const features: DetectedFeature[] = [];
    const detectedTypes = new Set<FeatureType>();

    for (const route of projectInfo.routes) {
      for (const [type, patterns] of Object.entries(FEATURE_PATTERNS)) {
        if (detectedTypes.has(type as FeatureType)) continue;
        
        for (const pattern of patterns) {
          if (pattern.test(route)) {
            detectedTypes.add(type as FeatureType);
            features.push({
              name: this.formatFeatureName(type as FeatureType),
              type: type as FeatureType,
              priority: CRITICALITY_MAP[type as FeatureType],
              routes: [route],
              components: [],
              confidence: 0.9,
              description: `Detected from route: ${route}`
            });
            break;
          }
        }
      }
    }

    for (const component of projectInfo.components) {
      for (const [type, patterns] of Object.entries(COMPONENT_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(component)) {
            const existingFeature = features.find(f => f.type === type);
            if (existingFeature) {
              if (!existingFeature.components.includes(component)) {
                existingFeature.components.push(component);
              }
            } else {
              detectedTypes.add(type as FeatureType);
              features.push({
                name: this.formatFeatureName(type as FeatureType),
                type: type as FeatureType,
                priority: CRITICALITY_MAP[type as FeatureType],
                routes: [],
                components: [component],
                confidence: 0.7,
                description: `Detected from component: ${component}`
              });
            }
            break;
          }
        }
      }
    }

    for (const file of this.allFiles) {
      for (const [type, patterns] of Object.entries(FEATURE_PATTERNS)) {
        if (detectedTypes.has(type as FeatureType)) continue;
        
        for (const pattern of patterns) {
          if (pattern.test(file.content)) {
            detectedTypes.add(type as FeatureType);
            features.push({
              name: this.formatFeatureName(type as FeatureType),
              type: type as FeatureType,
              priority: CRITICALITY_MAP[type as FeatureType],
              routes: [],
              components: [],
              confidence: 0.6,
              description: `Detected from file: ${file.relativePath}`
            });
            break;
          }
        }
      }
    }

    if (projectInfo.packageJson) {
      const deps = { ...projectInfo.packageJson.dependencies, ...projectInfo.packageJson.devDependencies };
      
      if (deps['next-auth'] || deps['@auth/core'] || deps['auth0'] || deps['firebase']) {
        if (!features.find(f => f.type === 'auth')) {
          features.push({
            name: 'Authentication',
            type: 'auth',
            priority: 'high',
            routes: [],
            components: [],
            confidence: 0.95,
            description: 'Detected from dependencies: auth library found'
          });
        }
      }

      if (deps['@stripe/stripe-js'] || deps['stripe'] || deps['@paypal/react-paypal-js']) {
        if (!features.find(f => f.type === 'payment')) {
          features.push({
            name: 'Payment',
            type: 'payment',
            priority: 'high',
            routes: [],
            components: [],
            confidence: 0.95,
            description: 'Detected from dependencies: payment library found'
          });
        }
      }

      if (deps['react-hook-form'] || deps['formik'] || deps['@tanstack/react-query']) {
        if (!features.find(f => f.type === 'form')) {
          features.push({
            name: 'Form Handling',
            type: 'form',
            priority: 'medium',
            routes: [],
            components: [],
            confidence: 0.9,
            description: 'Detected from dependencies: form library found'
          });
        }
      }
    }

    return features.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  async analyzeCodebase(): Promise<CodebaseAnalysis> {
    const projectInfo = await this.detect();
    const features = await this.detectFeatures(projectInfo);

    return {
      projectInfo,
      files: this.allFiles,
      features
    };
  }

  private formatFeatureName(type: FeatureType): string {
    const names: Record<FeatureType, string> = {
      'auth': 'Authentication',
      'payment': 'Payment',
      'checkout': 'Checkout',
      'form': 'Form Handling',
      'search': 'Search',
      'profile': 'User Profile',
      'dashboard': 'Dashboard',
      'api': 'API Integration',
      'static': 'Static Pages',
      'navigation': 'Navigation',
      'crud': 'CRUD Operations',
      'upload': 'File Upload',
      'notification': 'Notifications',
      'settings': 'Settings',
      'unknown': 'Unknown Feature'
    };
    return names[type];
  }
}
