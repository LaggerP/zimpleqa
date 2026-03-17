# Plan de Implementación zimpleQA v0.2.0

## Contexto

zimpleQA v0.1.0 funciona correctamente pero tiene limitaciones de performance y debugging:

1. **Sin caché**: Regenera código en cada ejecución, incluso si los tests no cambiaron
2. **Ejecución secuencial**: 100 tests toman ~50 minutos
3. **Sin evidencia visual**: Difícil debuggear fallas sin screenshots

Este plan implementa **Code Caching**, **Screenshots** y **Parallel Execution** para transformar zimpleQA en una herramienta production-ready.

**Impacto esperado**: 100 tests pasarán de ~50 min a ~5-15 min (10x más rápido).

## Objetivos

### 1. Code Caching
Evitar regenerar código cuando los tests no cambian.

### 2. Screenshots
Capturar evidencia visual de cada test execution.

### 3. Parallel Execution
Ejecutar múltiples tests simultáneamente con workers.

## Arquitectura

### Nuevos Componentes

```
src/
├── cache/
│   ├── cache-manager.ts          # Gestor centralizado de caché
│   ├── hash-generator.ts         # Generación de hash SHA-256
│   └── cache-entry.ts            # Esquema de entrada de caché
├── screenshots/
│   ├── screenshot-capture.ts     # Servicio de captura
│   └── screenshot-types.ts       # Tipos y metadatos
├── parallel/
│   ├── worker-pool.ts            # Pool de workers
│   ├── test-queue.ts             # Cola priorizada
│   └── parallel-coordinator.ts   # Coordinador de ejecución
└── utils/
    └── crypto-utils.ts           # Utilidades criptográficas
```

### Archivos a Modificar

```
src/
├── config/
│   ├── config-schema.ts          # + CacheConfig, ScreenshotConfig, ParallelConfig
│   └── default-config.ts         # + Defaults para nuevas configs
├── runner/
│   ├── playwright-runner.ts      # Integrar screenshots + workers
│   └── execution-result.ts       # + screenshotPaths, cacheStatus
├── ai/
│   └── code-generator.ts         # Integrar CacheManager
├── cli/
│   └── commands/
│       └── run.ts                # Orquestar todas las features
└── utils/
    └── validators.ts             # + Validaciones nuevas configs
```

## Implementación

### FASE 1: Code Caching (Días 1-4)

#### 1.1 Crear HashGenerator
**Archivo**: `src/utils/crypto-utils.ts`

```typescript
import { createHash } from 'crypto';

export class HashGenerator {
  static generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  static generateCacheKey(testPath: string, provider: string, model: string): string {
    const combined = `${testPath}-${provider}-${model}`;
    return this.generateHash(combined);
  }
}
```

#### 1.2 Crear CacheEntry Schema
**Archivo**: `src/cache/cache-entry.ts`

```typescript
export interface CacheEntry {
  key: string;
  hash: string;
  code: string;
  metadata: {
    testPath: string;
    provider: string;
    model: string;
    timestamp: number;
    ttl: number;
  };
  stats: {
    hits: number;
    lastUsed: number;
  };
}
```

#### 1.3 Crear CacheManager
**Archivo**: `src/cache/cache-manager.ts`

```typescript
import { FileHelpers } from '../utils/file-helpers';
import { HashGenerator } from '../utils/crypto-utils';
import { CacheEntry } from './cache-entry';
import { Logger } from '../utils/logger';

export class CacheManager {
  private cacheDir: string;
  private logger: Logger;

  constructor(cacheDir: string, logger?: Logger) {
    this.cacheDir = cacheDir;
    this.logger = logger || new Logger();
  }

  async checkCache(key: string): Promise<string | null> {
    const cachePath = path.join(this.cacheDir, `${key}.json`);
    if (!(await FileHelpers.fileExists(cachePath))) {
      return null;
    }

    const entry: CacheEntry = await FileHelpers.readJSON(cachePath);

    // Validar TTL
    if (Date.now() > entry.metadata.timestamp + entry.metadata.ttl) {
      await this.invalidate(key);
      return null;
    }

    entry.stats.hits++;
    entry.stats.lastUsed = Date.now();
    await FileHelpers.writeJSON(cachePath, entry);

    this.logger.info(`Cache HIT: ${key}`);
    return entry.code;
  }

  async saveCache(key: string, code: string, metadata: any): Promise<void> {
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
  }

  async invalidate(key: string): Promise<void> {
    const cachePath = path.join(this.cacheDir, `${key}.json`);
    await fs.unlink(cachePath);
  }
}
```

#### 1.4 Integrar en CodeGenerator
**Modificar**: `src/ai/code-generator.ts`

```typescript
import { CacheManager } from '../cache/cache-manager';
import { HashGenerator } from '../utils/crypto-utils';

export class CodeGenerator {
  private cacheManager: CacheManager;

  constructor(config: Config, logger?: Logger) {
    // ... código existente ...
    this.cacheManager = new CacheManager(config.cache.directory, logger);
  }

  async generate(test: TestModel, model?: string): Promise<string> {
    // Generar cache key
    const testContent = await FileHelpers.readFile(test.filePath);
    const testHash = HashGenerator.generateHash(testContent);
    const cacheKey = HashGenerator.generateCacheKey(test.filePath, this.getCurrentProvider().getType(), model || 'default');

    // Check cache
    const cachedCode = await this.cacheManager.checkCache(cacheKey);
    if (cachedCode) {
      this.logger.success('Using cached code');
      return cachedCode;
    }

    // Generar código (flow existente)
    const result = await this.provider.generateCode(test, options);
    const code = result.code;

    // Guardar en caché
    await this.cacheManager.saveCache(cacheKey, code, {
      testPath: test.filePath,
      provider: this.getCurrentProvider().getType(),
      model: model || 'default',
      timestamp: Date.now(),
      ttl: 604800 // 7 días
    });

    return code;
  }
}
```

#### 1.5 Extender Config Schema
**Modificar**: `src/config/config-schema.ts`

```typescript
export interface Config {
  ai: AIConfig;
  playwright: PlaywrightConfig;
  runner: RunnerConfig;
  test: TestConfig;
  cache: CacheConfig;  // NUEVO
}

export interface CacheConfig {
  enabled: boolean;
  directory: string;
  maxSize: number;  // MB
  ttl: number;  // segundos
}

// En DEFAULT_CONFIG:
cache: {
  enabled: true,
  directory: '.zqa/cache',
  maxSize: 100,
  ttl: 604800  // 7 días
}
```

### FASE 2: Screenshots (Días 5-7)

#### 2.1 Crear ScreenshotCapture
**Archivo**: `src/screenshots/screenshot-capture.ts`

```typescript
import { Page } from 'playwright';
import { FileHelpers } from '../utils/file-helpers';
import path from 'path';

export class ScreenshotCapture {
  private screenshotsDir: string;
  private organizeByDate: boolean;

  constructor(config: ScreenshotConfig) {
    this.screenshotsDir = config.directory;
    this.organizeByDate = config.organizeByDate;
  }

  async capture(page: Page, testTitle: string, status: 'passed' | 'failed'): Promise<string> {
    const date = new Date();
    const timestamp = date.getTime();
    const sanitizedTitle = testTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    let filename = `${sanitizedTitle}_${timestamp}_${status}.png`;

    if (this.organizeByDate) {
      const dateDir = date.toISOString().split('T')[0];
      const fullPath = path.join(this.screenshotsDir, dateDir);
      await FileHelpers.ensureDirectory(fullPath);
      filename = path.join(fullPath, filename);
    } else {
      await FileHelpers.ensureDirectory(this.screenshotsDir);
      filename = path.join(this.screenshotsDir, filename);
    }

    await page.screenshot({ path: filename });
    return filename;
  }
}
```

#### 2.2 Extender ExecutionResult
**Modificar**: `src/runner/execution-result.ts`

```typescript
export interface TestResult {
  test: {
    title: string;
    filePath: string;
  };
  success: boolean;
  steps: StepResult[];
  duration: number;
  error?: string;
  timestamp: Date;
  screenshotPaths?: string[];  // NUEVO
  cacheStatus?: 'hit' | 'miss';  // NUEVO
}
```

#### 2.3 Integrar en PlaywrightRunner
**Modificar**: `src/runner/playwright-runner.ts`

```typescript
import { ScreenshotCapture } from '../screenshots/screenshot-capture';

export class PlaywrightRunner {
  private screenshotCapture: ScreenshotCapture;

  constructor(config: PlaywrightConfig, screenshotConfig: ScreenshotConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger();
    this.screenshotCapture = new ScreenshotCapture(screenshotConfig);
    this.executor = new CodeExecutor(logger);
  }

  async runTest(test: TestModel, code: string): Promise<TestResult> {
    // ... código existente ...
    const result = await this.executor.execute(code, page);

    // Capture screenshot
    const screenshotPath = await this.screenshotCapture.capture(
      page,
      test.title,
      result.success ? 'passed' : 'failed'
    );

    const testResult: TestResult = {
      // ... campos existentes ...
      screenshotPaths: [screenshotPath]
    };

    return testResult;
  }
}
```

#### 2.4 Extender Config Schema
**Modificar**: `src/config/config-schema.ts`

```typescript
export interface Config {
  // ... otros ...
  screenshots: ScreenshotConfig;  // NUEVO
}

export interface ScreenshotConfig {
  enabled: boolean;
  directory: string;
  format: 'png' | 'jpeg';
  quality: number;
  fullPage: boolean;
  onFailureOnly: boolean;
  organizeByDate: boolean;
}

// En DEFAULT_CONFIG:
screenshots: {
  enabled: true,
  directory: '.zqa/screenshots',
  format: 'png',
  quality: 80,
  fullPage: false,
  onFailureOnly: false,
  organizeByDate: true
}
```

### FASE 3: Parallel Execution (Días 8-12)

#### 3.1 Crear WorkerPool
**Archivo**: `src/parallel/worker-pool.ts`

```typescript
import { Browser } from 'playwright';
import { TestModel, TestResult } from '../runner/execution-result';

export interface Worker {
  id: number;
  status: 'idle' | 'busy' | 'error';
  browser?: Browser;
  currentTest?: string;
}

export class WorkerPool {
  private workers: Worker[];
  private maxWorkers: number;

  constructor(maxWorkers: number) {
    this.maxWorkers = maxWorkers;
    this.workers = [];
  }

  async initialize(): Promise<void> {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.workers.push({
        id: i,
        status: 'idle'
      });
    }
  }

  async assignWork(): Promise<Worker | null> {
    const idleWorker = this.workers.find(w => w.status === 'idle');
    if (idleWorker) {
      idleWorker.status = 'busy';
      return idleWorker;
    }
    return null;
  }

  releaseWorker(workerId: number): void {
    const worker = this.workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = 'idle';
      worker.currentTest = undefined;
    }
  }
}
```

#### 3.2 Crear ParallelCoordinator
**Archivo**: `src/parallel/parallel-coordinator.ts`

```typescript
import { WorkerPool } from './worker-pool';
import { TestModel, TestResult } from '../runner/execution-result';
import { PlaywrightRunner } from '../runner/playwright-runner';
import { CodeGenerator } from '../ai/code-generator';

export class ParallelCoordinator {
  private workerPool: WorkerPool;
  private runner: PlaywrightRunner;
  private generator: CodeGenerator;

  constructor(maxWorkers: number, runner: PlaywrightRunner, generator: CodeGenerator) {
    this.workerPool = new WorkerPool(maxWorkers);
    this.runner = runner;
    this.generator = generator;
  }

  async executeParallel(tests: TestModel[]): Promise<TestResult[]> {
    await this.workerPool.initialize();
    const results: TestResult[] = [];

    const executionPromises = tests.map(async (test) => {
      const worker = await this.workerPool.assignWork();
      if (!worker) {
        // Esperar por worker disponible
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.executeTest(test);
      }

      try {
        const code = await this.generator.generate(test);
        const result = await this.runner.runTest(test, code);
        results.push(result);
        return result;
      } finally {
        this.workerPool.releaseWorker(worker.id);
      }
    });

    await Promise.all(executionPromises);
    return results;
  }
}
```

#### 3.3 Integrar en RunCommand
**Modificar**: `src/cli/commands/run.ts`

```typescript
import { ParallelCoordinator } from '../parallel/parallel-coordinator';

export async function runCommand(target: string, options: RunOptions): Promise<void> {
  // ... código existente hasta cargar tests ...

  const runner = new PlaywrightRunner(
    configManager.getPlaywrightConfig(),
    configManager.getScreenshotConfig(),
    logger
  );

  const generator = new CodeGenerator(configManager.getConfig(), logger);

  // Elegir estrategia de ejecución
  if (configManager.getConfig().parallel.enabled) {
    const coordinator = new ParallelCoordinator(
      configManager.getConfig().parallel.maxWorkers,
      runner,
      generator
    );
    results = await coordinator.executeParallel(tests);
  } else {
    // Ejecución secuencial existente
    results = await runner.runTests(tests, generatedCodes);
  }

  reporter.printSummary(results);
}
```

#### 3.4 Extender Config Schema
**Modificar**: `src/config/config-schema.ts`

```typescript
export interface Config {
  // ... otros ...
  parallel: ParallelConfig;  // NUEVO
}

export interface ParallelConfig {
  enabled: boolean;
  maxWorkers: number;
  strategy: 'aggressive' | 'balanced' | 'conservative';
}

// En DEFAULT_CONFIG:
parallel: {
  enabled: false,  // Opt-in para no romper backward compatibility
  maxWorkers: 4,
  strategy: 'balanced'
}
```

## Testing

### Code Caching
```bash
# Primera ejecución (generate)
time zqa run tests/wiki-search.md

# Segunda ejecución (debe ser más rápido)
time zqa run tests/wiki-search.md

# Modificar test → regenerar
echo "# Modified" >> tests/wiki-search.md
time zqa run tests/wiki-search.md
```

### Screenshots
```bash
# Ejecutar con screenshots
zqa run tests/ --screenshots

# Verificar archivos
ls -la .zqa/screenshots/$(date +%Y-%m-%d)/
```

### Parallel Execution
```bash
# Ejecutar en paralelo
zqa run tests/ --parallel --max-workers 4

# Verificar speedup
time zqa run tests/ --parallel
time zqa run tests/  # secuencial para comparar
```

## Verificación End-to-End

```bash
# 1. Inicializar proyecto
zqa init
zqa config set glm.apiKey <your-key>

# 2. Crear tests de ejemplo
cat > tests/test1.md << EOF
# Test: Example 1
## Description
Test 1
## URL
https://example.com
## Steps
1. Navigate to page
## Expected Results
- Page loads
EOF

# 3. Ejecutar primera vez (generate + cache)
zqa run tests/

# 4. Ejecutar segunda vez (usa caché, debe ser más rápido)
zqa run tests/

# 5. Verificar screenshots
ls .zqa/screenshots/

# 6. Ejecutar en paralelo
zqa run tests/ --parallel --max-workers 2

# 7. Verificar mejor performance
time zqa run tests/ --parallel
```

## Archivos Críticos

### Nuevos
- `src/utils/crypto-utils.ts` - Hash generation
- `src/cache/cache-manager.ts` - Cache system
- `src/cache/cache-entry.ts` - Cache schema
- `src/screenshots/screenshot-capture.ts` - Screenshots
- `src/parallel/worker-pool.ts` - Worker pool
- `src/parallel/parallel-coordinator.ts` - Parallel execution

### Modificar
- `src/config/config-schema.ts` - Extend with new configs
- `src/runner/playwright-runner.ts` - Integrate screenshots
- `src/runner/execution-result.ts` - Add screenshotPaths, cacheStatus
- `src/ai/code-generator.ts` - Integrate cache
- `src/cli/commands/run.ts` - Orchestrate all features
- `src/utils/validators.ts` - Validate new configs

## Patrones a Reutilizar

- **FileHelpers** (`src/utils/file-helpers.ts`) - Todas las operaciones de archivo
- **Logger** (`src/utils/logger.ts`) - Output con colores
- **ConfigManager** (`src/config/config-manager.ts`) - Gestión de configuración
- **Validators** (`src/utils/validators.ts`) - Validaciones

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Cache corruption | Validar schema antes de usar, regenerar on error |
| Memory exhaustion (parallel) | Límite de workers configurable, monitor de recursos |
| Disk space (screenshots) | Configurable, limpieza automática por fecha |
| Race conditions (parallel) | Cada worker con browser propio, coordinador central |
| Backward compatibility | Features opt-in, defaults conservadores |

## Métricas de Éxito

- **Cache hit rate**: > 70% en ejecuciones repetidas
- **Speedup**: 5-10x en ejecución paralela vs secuencial
- **Screenshot coverage**: 100% de tests con evidencia visual
- **Disk usage**: < 500MB para 100 tests (con cleanup)
