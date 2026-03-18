# Plan: zqa analyze - Herramienta de Testing Manual con Skill Autónoma

## Contexto

zimpleQA es actualmente una herramienta de testing automatizado que ejecuta tests escritos en markdown usando Playwright + AI. El usuario quiere transformarla también en una herramienta de **testing manual** que analice automáticamente un proyecto frontend (React, Next.js, Vue) y genere casos de prueba manuales en formato markdown v0.2.0.

**Problema actual:** Para crear tests manuales, el usuario debe escribir cada test desde cero o usar `zqa generate` que solo crea UN test de forma interactiva.

**Solución:** Un comando `zqa analyze` que invoque una **skill autónoma** que analice el codebase como considere mejor, detecte funcionalidades, las priorice por criticidad, y genere múltiples test cases en markdown.

**Características clave:**
- **Skill autónoma**: La skill decide cómo leer y analizar el codebase (sequential vs parallel según tamaño)
- **Thinking visible**: La skill muestra su razonamiento en tiempo real
- **CLI minimalista**: Solo invoca al agente con la skill

## Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────────┐
│ Usuario ejecuta: zqa analyze                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Comando CLI: src/cli/commands/analyze.ts                     │
│ - Wrapper minimalista (solo invoca)                          │
│ - Prepara contexto básico                                    │
│ - Muestra thinking del agente                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ AGENTE + SKILL: analyze-frontend-project                     │
│ - Decide cómo leer el codebase (sequential, parallel, etc)   │
│ - Muestra su thinking en tiempo real                         │
│ - Detecta features y genera ranking                          │
│ - Genera tests en v0.2.0                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Output: .zqa/tests/cases/*.md                                │
└─────────────────────────────────────────────────────────────┘
```

## Filosofía: Autonomía del Agente

**El agente decide, no el usuario:**

```typescript
// ❌ NO: El usuario decide cómo analizar
zqa analyze --parallel
zqa analyze --sequential
zqa analyze --deep

// ✅ SÍ: El comando simple, el agente decide
zqa analyze
// La skill analiza como considere mejor:
// - Proyecto pequeño → análisis sequential
// - Proyecto grande → análisis en paralelo
// - Proyecto complejo → análisis profundo
```

## Componentes del Plan

### 1. COMANDO CLI `analyze` (Minimalista)

**Archivo a crear:** `/Users/pablolagger/Personal/PAMI/zimpleQA/src/cli/commands/analyze.ts`

**Responsabilidades mínimas:**
- Cargar configuración
- Preparar contexto básico (directorio del proyecto)
- Invocar skill autónoma
- Mostrar output del agente (thinking visible)
- Guardar tests generados

**Código minimalista:**
```typescript
export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  const logger = new Logger();
  const configManager = new ConfigManager();

  logger.section('🔍 Analyzing project...');

  // Cargar configuración
  await configManager.load();

  // Preparar contexto básico
  const context = {
    projectPath: process.cwd(),
    outputDir: options.output || '.zqa/tests/cases'
  };

  // Invocar skill (el agente decide cómo analizar)
  const result = await invokeAnalysisSkill(context, configManager, {
    onThinking: (thought) => logger.info(`🧠 ${thought}`),
    onProgress: (progress) => logger.info(progress)
  });

  // Guardar resultados
  await saveTests(result.tests, context.outputDir);

  logger.success(`Generated ${result.tests.length} test cases in ${context.outputDir}`);
}
```

**Opciones mínimas:**
```bash
zqa analyze                    # Análisis autónomo
zqa analyze --output custom/   # Directorio personalizado
zqa analyze --force            # Sin confirmación
```

### 2. SKILL AUTÓNOMA `analyze-frontend-project`

**Archivo a crear:** `/Users/pablolagger/Personal/PAMI/zimpleQA/skills/analyze-frontend-project.md`

**Propósito:** Analizar un proyecto frontend y generar casos de prueba manuales.

**Características clave:**
- **Autónoma**: Decide cómo analizar según el tamaño del proyecto
- **Thinking visible**: Muestra su razonamiento en tiempo real
- **Adaptativa**: Usa sequential/parallel según corresponda

## Tu Autonomía

Decides cómo analizar el codebase:
- **Proyecto pequeño** (< 20 archivos): Análisis sequential
- **Proyecto mediano** (20-100 archivos): Parallel multitasking
- **Proyecto grande** (> 100 archivos): Parallel multitasking + sampling

## IMPORTANTE: Muestra Tu Thinking

Muestra tu proceso de razonamiento en tiempo real:

```
🧠 Initial Assessment
→ Scanning project structure...
→ Found: 50 files in app/
→ Decision: Large project, using parallel multitasking

🧠 Parallel Analysis Phase
→ Analyzing in parallel:
   ├─ Config files (package.json, next.config.js)
   ├─ Route files (app/**/page.tsx)
   └─ Component files (components/**/*.tsx)

[Resultados del análisis paralelo]
✅ Configs: Next.js 14, Stripe, TypeScript 5
✅ Routes: 5 main routes detected
✅ Components: 8 key features identified

🧠 Feature Detection & Classification
→ Authentication → HIGH (business critical, 95% confidence)
→ Payment → HIGH (revenue critical, 88% confidence)
→ User Profile → MEDIUM (user data, 85% confidence)
→ About → LOW (informational, 95% confidence)

🧠 Test Generation
→ Creating 4 manual test cases in markdown v0.2.0 format...
✅ Tests generated
```

## Input (desde CLI):
- Path del proyecto
- Directorio de output

## Output (hacia CLI):
```json
{
  "framework": "nextjs" | "react" | "vue",
  "features": [
    {
      "name": "Authentication",
      "type": "auth",
      "priority": "high",
      "routes": ["/login", "/register"],
      "components": ["LoginForm", "RegisterForm"],
      "confidence": 0.95,
      "reasoning": "Detected useAuth hook, LoginForm component, /login route"
    }
  ],
  "tests": ["# Test: Authentication\n..."],
  "stats": {
    "totalFiles": 50,
    "routes": 5,
    "features": 8,
    "analysisTime": "8s",
    "strategy": "parallel"
  }
}
```

## Pasos de la skill:

1. **Assess project size** → Decide estrategia (sequential/parallel)
2. **Detect framework** → Next.js, React Router, Vue
3. **Scan structure** → Routes, components, configs
4. **Identify features** → Auth, payment, forms, etc.
5. **Rank by criticality** → HIGH/MEDIUM/LOW
6. **Generate tests** → Markdown v0.2.0 format

### 3. GENERADOR DE TESTS (Utilidad)

**Archivo a crear:** `/Users/pablolagger/Personal/PAMI/zimpleQA/src/generator/test-batch-generator.ts`

**Responsabilidades:**
- Generar markdown v0.2.0 por cada feature
- Guardar tests en el directorio especificado
- Validar formato antes de guardar

**Estructura de test generado:**
```markdown
# Test: [Feature Name]

## Metadata
Version: 0.2.0
Author: [Generated by zimpleQA]
Priority: high|medium|low
Tags: [feature-type], auto-generated, manual

## Description
Test the [feature name] functionality including [key aspects].

## URL
[file://path/to/feature] or [URL if applicable]

## Preconditions
- User is [condition]
- [Other preconditions]

## Steps
1. Navigate to [route]
2. [Specific action]
3. [Verification]
...

## Expected Results
- [Expected outcome 1]
- [Expected outcome 2]

## Postconditions
- [State after test]

## Notes
**Analysis Details:**
- Detected in: [files]
- Evidence: [patterns found]
- Confidence: [percentage]
- Related routes: [routes]
- Dependencies: [from package.json]

**Edge cases to test:**
- [Case 1]
- [Case 2]
```

**Directorio de salida:**
```
.zqa/tests/cases/
├── authentication-login-test.md         # HIGH
├── authentication-register-test.md      # HIGH
├── checkout-payment-test.md             # HIGH
├── user-profile-test.md                 # MEDIUM
├── search-functionality-test.md         # MEDIUM
└── about-page-test.md                   # LOW
```

### 4. DETECTOR DE PROYECTO (Utilidad)

**Archivo a crear:** `/Users/pablolagger/Personal/PAMI/zimpleQA/src/analyzer/project-detector.ts`

**Responsabilidades:**
- Detectar tipo de framework
- Identificar estructura de archivos
- Retornar metadata básica del proyecto

**Nota:** Este componente es una utilidad que la skill puede usar, pero la skill decide cómo y cuándo usarlo.

**Lógica de detección:**
```typescript
async function detectProjectType(cwd: string): Promise<ProjectType> {
  // Check Next.js
  if (await fileExists('app/page.tsx') || await fileExists('pages/index.tsx')) {
    return 'nextjs';
  }

  // Check React Router
  const pkgJson = await readJSON('package.json');
  if (pkgJson.dependencies['react-router-dom']) {
    return 'react';
  }

  // Check Vue
  if (pkgJson.dependencies['vue-router']) {
    return 'vue';
  }

  throw new Error('Unsupported framework');
}
```

### 5. UTILIDADES DE THINKING VISIBLE

**Archivo a crear:** `/Users/pablolagger/Personal/PAMI/zimpleQA/src/utils/thinking-logger.ts`

**Responsabilidades:**
- Mostrar el thinking del agente de forma formateada
- Soportar diferentes tipos de mensajes (decisiones, progreso, resultados)

**Interfaz:**
```typescript
export class ThinkingLogger {
  logThought(thought: string) {
    console.log(`🧠 ${thought}`);
  }

  logDecision(decision: string, reasoning: string) {
    console.log(`🧠 Decision: ${decision}`);
    console.log(`   → Reasoning: ${reasoning}`);
  }

  logParallelStart(tasks: string[]) {
    console.log(`🧠 Analyzing in parallel:`);
    tasks.forEach(task => console.log(`   ├─ ${task}`));
  }

  logParallelResult(task: string, result: string) {
    console.log(`   ├─ ${task} → ${result}`);
  }

  logParallelComplete(count: number, time: string) {
    console.log(`✅ Analyzed ${count} items in parallel (${time})`);
  }
}
```

### 5. INTEGRACIÓN CLI

**Archivo a modificar:** `/Users/pablolagger/Personal/PAMI/zimpleQA/src/cli/index.ts`

**Cambios:**
```typescript
import { analyzeCommand } from './commands/analyze';

program
  .command('analyze')
  .description('Analyze frontend project and generate manual test cases')
  .option('-o, --output <dir>', 'Output directory', '.zqa/tests/cases')
  .option('-f, --force', 'Skip confirmation')
  .action(async (options) => {
    try {
      await analyzeCommand(options);
    } catch (error) {
      logger.error(`Analysis failed: ${error}`);
      process.exit(1);
    }
  });
```

## Flujo de Usuario Completo

### Escenario 1: Proyecto Pequeño (< 20 archivos)

```bash
$ cd my-small-react-app
$ zqa analyze

🧠 Initial Assessment
→ Scanning project structure...
→ Found: 8 files total
→ Decision: Small project, using sequential analysis

🧠 Framework Detection
→ Reading package.json...
   Found: react@18.2.0, react-router-dom@6.0.0
→ Decision: React with React Router
✅ Framework: React

🧠 Route Scanning
→ Scanning for route definitions...
   Found: /, /login, /about
✅ Routes: 3 found

🧠 Feature Analysis
→ Analyzing /login route...
   Imports: useAuth hook
   Component: LoginForm
   → Feature: Authentication (95% confidence)
→ Analyzing /about route...
   Static content only
   → Feature: Informational (95% confidence)
✅ Features: 2 detected

🧠 Priority Ranking
→ Authentication → HIGH (business critical)
→ About → LOW (informational)

✨ Final Ranking:
┌─────────────────────────┬──────────┬────────────┬─────────┐
│ Feature                 │ Priority │ Routes     │ Conf.   │
├─────────────────────────┼──────────┼────────────┼─────────┤
│ Authentication          │ HIGH     │ /login     │ 95%     │
│ About Page              │ LOW      │ /about     │ 95%     │
└─────────────────────────┴──────────┴────────────┴─────────┘

❓ Generate 2 test cases? (y/n): y

🤖 Generating test cases...
✅ Tests saved to .zqa/tests/cases/

⏱️ Analysis completed in 8s (sequential)
```

### Escenario 2: Proyecto Grande (> 100 archivos)

```bash
$ cd my-large-nextjs-app
$ zqa analyze

🧠 Initial Assessment
→ Scanning project structure...
→ Found: 150 files in app/, 80 files in components/
→ Decision: Large project, using parallel multitasking

🧠 Parallel Analysis Phase 1: Config & Framework
→ Analyzing in parallel:
   ├─ package.json → Next.js 14.0.0, React 18.2.0, Stripe
   ├─ tsconfig.json → TypeScript 5.0
   ├─ next.config.js → Image optimization, i18n
   ├─ tailwind.config.js → Tailwind CSS
   └─ .env.example → Environment variables
✅ Configs analyzed (3s)

🧠 Parallel Analysis Phase 2: Routes
→ Analyzing in parallel: app/**/page.tsx
   ├─ app/page.tsx → Home route
   ├─ app/login/page.tsx → Login route
   ├─ app/register/page.tsx → Register route
   ├─ app/checkout/page.tsx → Checkout route
   ├─ app/payment/page.tsx → Payment route
   ├─ app/profile/page.tsx → Profile route
   ├─ app/settings/page.tsx → Settings route
   ├─ app/search/page.tsx → Search route
   └─ app/about/page.tsx → About route
✅ 9 routes detected (5s)

🧠 Parallel Analysis Phase 3: Components & Features
→ Analyzing in parallel:
   ├─ components/auth/LoginForm.tsx → Authentication
   ├─ components/payment/CheckoutForm.tsx → Payment
   ├─ components/payment/StripeWrapper.tsx → Payment
   ├─ components/user/ProfileForm.tsx → User management
   ├─ components/user/SettingsForm.tsx → User management
   ├─ components/search/SearchBar.tsx → Search
   └─ components/layout/Navigation.tsx → Navigation
✅ 7 features identified (6s)

🧠 Consolidation & Cross-Reference
→ Merging findings:
   ✓ Routes (Phase 2) + Features (Phase 3) = Complete mapping
   ✓ Stripe (Phase 1) confirms payment features (Phase 3)
   ✓ Multiple auth routes (Phase 2) = Auth system
✅ Consolidated: 9 unique features

🧠 Priority Ranking
→ Authentication → HIGH (business critical, 95%)
→ Payment → HIGH (revenue critical, 88%)
→ Checkout → HIGH (revenue critical, 90%)
→ User Profile → MEDIUM (user data, 85%)
→ Settings → MEDIUM (user preferences, 80%)
→ Search → MEDIUM (feature discovery, 75%)
→ Navigation → MEDIUM (UX, 70%)
→ Home → LOW (landing, 95%)
→ About → LOW (informational, 95%)

✨ Final Ranking:
┌─────────────────────────┬──────────┬────────────┬─────────┐
│ Feature                 │ Priority │ Routes     │ Conf.   │
├─────────────────────────┼──────────┼────────────┼─────────┤
│ Authentication          │ HIGH     │ /login     │ 95%     │
│ Checkout Process        │ HIGH     │ /checkout  │ 90%     │
│ Payment Gateway         │ HIGH     │ /payment   │ 88%     │
│ User Profile            │ MEDIUM   │ /profile   │ 85%     │
│ Settings                │ MEDIUM   │ /settings  │ 80%     │
│ Search Functionality    │ MEDIUM   │ /search    │ 75%     │
│ About Page              │ LOW      │ /about     │ 95%     │
└─────────────────────────┴──────────┴────────────┴─────────┘

❓ Generate 7 test cases? (y/n): y

🤖 Generating test cases...
✅ Tests saved to .zqa/tests/cases/

⏱️ Analysis completed in 14s (parallel multitasking)
```

## Archivos Críticos

### Nuevos Archivos:

1. `/Users/pablolagger/Personal/PAMI/zimpleQA/src/cli/commands/analyze.ts`
   - Comando CLI minimalista (solo invoca skill)

2. `/Users/pablolagger/Personal/PAMI/zimpleQA/skills/analyze-frontend-project.md`
   - Skill autónoma (decide cómo analizar)
   - Thinking visible
   - Adapta estrategia al tamaño del proyecto

3. `/Users/pablolagger/Personal/PAMI/zimpleQA/src/generator/test-batch-generator.ts`
   - Generador de múltiples tests en markdown v0.2.0

4. `/Users/pablolagger/Personal/PAMI/zimpleQA/src/analyzer/project-detector.ts`
   - Detector de tipo de proyecto (utilidad)

5. `/Users/pablolagger/Personal/PAMI/zimpleQA/src/analyzer/index.ts`
   - Barrel export del módulo analyzer

6. `/Users/pablolagger/Personal/PAMI/zimpleQA/src/utils/thinking-logger.ts`
   - Utilidades para mostrar thinking del agente

### Archivos a Modificar:

1. `/Users/pablolagger/Personal/PAMI/zimpleQA/src/cli/index.ts`
   - Registrar comando `analyze`

### Archivos Reutilizables:

1. `/Users/pablolagger/Personal/PAMI/zimpleQA/tests/template.md`
   - Template v0.2.0 para formato de tests

2. `/Users/pablolagger/Personal/PAMI/zimpleQA/src/ai/code-generator.ts`
   - CodeGenerator para generación con AI

3. `/Users/pablolagger/Personal/PAMI/zimpleQA/src/config/config-manager.ts`
   - ConfigManager para carga de config

4. `/Users/pablolagger/Personal/PAMI/zimpleQA/src/utils/file-helpers.ts`
   - FileHelpers para operaciones de archivo

## Estrategia de Implementación

### Fase 1: Estructura Básica
1. Crear comando `analyze` minimalista
2. Crear utilidad `ThinkingLogger`
3. Implementar detector de proyecto básico
4. Crear estructura de directorios `.zqa/tests/cases/`

### Fase 2: Skill Autónoma
1. Crear skill `analyze-frontend-project` con thinking visible
2. Implementar lógica de decisión (sequential vs parallel)
3. Implementar detección de framework
4. Implementar escaneo de rutas y features

### Fase 3: Generación de Tests
1. Crear generador de tests en batch
2. Implementar generación de markdown v0.2.0
3. Incluir detalles de análisis en los tests

### Fase 4: Integración CLI
1. Conectar comando con skill
2. Implementar display de thinking visible
3. Implementar guardado de tests

### Fase 5: Testing y Validación
1. Test con proyecto pequeño (sequential)
2. Test con proyecto grande (parallel)
3. Validar formato de tests
4. Validar integración con `zqa run`

## Criterios de Éxito

1. **Detección correcta:** Identifica framework y estructura
2. **Features detectadas:** Encuentra funcionalidades principales
3. **Ranking adecuado:** Prioridades por criticidad
4. **Tests válidos:** Formato v0.2.0 correcto
5. **Integración:** Tests compatibles con `zqa run`
6. **UX clara:** Flujo intuitivo con thinking visible
7. **Autonomía:** Agente decide estrategia según tamaño
8. **Performance:** Parallel multitasking para proyectos grandes

## Casos de Prueba

### Test 1: Proyecto Pequeño (Sequential)
```bash
cd small-react-app
zqa analyze
# Expected: Sequential analysis
# Expected: Thinking visible muestra decisión
# Expected: Tests generados correctamente
```

### Test 2: Proyecto Grande (Parallel)
```bash
cd large-nextjs-app
zqa analyze
# Expected: Parallel multitasking
# Expected: Thinking visible muestra fases paralelas
# Expected: Más rápido que sequential
# Expected: Tests generados correctamente
```

### Test 3: Validación de Tests
```bash
cat .zqa/tests/cases/*.md
# Expected: Formato v0.2.0 válido
# Expected: Metadata completa
# Expected: Steps accionables
# Expected: Notes con detalles del análisis
```

## Notas de Implementación

1. **Autonomía del Agente:** La skill decide cómo analizar, no el usuario
2. **Thinking Visible:** Mostrar razonamiento en tiempo real
3. **AI Integration:** Reutilizar `CodeGenerator` para generar pasos específicos
4. **Parallel Multitasking:** Usar para proyectos grandes (mejor performance)
5. **Error Handling:** Fallback a templates predefinidos si AI falla
6. **Scalability:** Limitar escaneo a archivos relevantes
7. **Configuración:** Permitir customizar reglas de detección vía config

## Cómo el Agente Decide

**Decisión autónoma del agente:**

```markdown
## Initial Assessment (en la skill)

Debes evaluar el proyecto y decidir tu estrategia de análisis:

1. **Escanea estructura del proyecto**
   → Cuenta total de archivos
   → Identifica directorios (app/, pages/, components/, etc.)

2. **Elige estrategia:**
   - **< 20 archivos**: Análisis sequential (leer uno por uno)
   - **20-100 archivos**: Parallel multitasking (analizar grupos simultáneamente)
   - **> 100 archivos**: Parallel multitasking + sampling (analizar archivos representativos)

3. **Ejecuta análisis** usando la estrategia elegida

4. **Reporta tu decisión** en thinking:
   ```
   🧠 Found 150 files
   → Decision: Large project, using parallel multitasking
   ```
```

**Ejemplos de decisiones autónomas:**

```
Proyecto pequeño (8 files):
→ Decision: Sequential analysis
→ Tiempo: ~10s

Proyecto mediano (50 files):
→ Decision: Parallel multitasking
→ Tiempo: ~8s

Proyecto grande (200 files):
→ Decision: Parallel multitasking + sampling
→ Tiempo: ~12s
```

## Roadmap

### v1.0 (MVP - Este Plan)
- ✅ Comando `zqa analyze` (minimalista)
- ✅ Skill autónoma (decide estrategia)
- ✅ Thinking visible (transparencia del proceso)
- ✅ Soporte: Next.js, React Router, Vue
- ✅ Generación de tests en v0.2.0
- ✅ Ranking por criticidad
- ✅ Parallel multitasking para proyectos grandes

### v1.1 (Mejoras)
- Learning de proyectos (recuerda análisis previos)
- Análisis incremental (solo cambios)
- Detección automática de cambios
- Soporte: Angular, Svelte
- Tests negativos
- Reportes de cobertura

### v2.0 (Avanzado)
- Integración completa con `zqa run`
- Dashboard web de resultados
- Export a JIRA/Xray
- Colaboración en equipo
- Análisis de API endpoints
- Detección avanzada de edge cases

## Resumen

Este plan transforma zimpleQA en una herramienta completa de testing:

**Actual:** Tests automatizados con Playwright + AI
**Futuro:** Tests automatizados + Tests manuales generados por AI

**Características clave:**
- **Simplicidad:** Un solo comando `zqa analyze`, el agente decide cómo analizar
- **Autonomía:** La skill evalúa el proyecto y adapta su estrategia
- **Transparencia:** Thinking visible muestra el razonamiento en tiempo real
- **Performance:** Parallel multitasking para proyectos grandes
- **Calidad:** Tests en formato v0.2.0 con detalles del análisis

El comando `zqa analyze` permite a cualquier equipo de QA generar casos de prueba manuales automáticamente basados en el análisis de su codebase, ahorrando horas de trabajo manual y asegurando cobertura de las funcionalidades críticas.
