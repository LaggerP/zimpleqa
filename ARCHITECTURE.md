# Architecture & Design

## Overview

zimpleQA is an AI-powered QA testing tool that uses natural language test descriptions to generate and execute Playwright tests. Built with **Bun** for optimal performance.

## System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   CLI       │────▶│  Parser      │────▶│    GLM      │
│ (Commands)  │     │ (Markdown)   │     │  (AI API)   │
└─────────────┘     └──────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Reporter   │◀────│   Runner     │◀────│  Generated  │
│ (Terminal)  │     │ (Playwright) │     │   Code      │
└─────────────┘     └──────────────┘     └─────────────┘
                                              ▲
                                              │
                                    ┌─────────────┐
                                    │   Config    │
                                    │  Manager   │
                                    └─────────────┘
```

## Runtime: Bun

### Why Bun?

**Bun** is a modern JavaScript runtime that provides:
- ⚡ **Faster than Node.js**: 3-5x faster startup and execution
- 📦 **All-in-one**: Bundler, test runner, package manager
- 🎯 **TypeScript Native**: No compilation needed in dev mode
- 🔧 **Compatible**: Node.js API compatibility
- 💾 **Efficient**: Built-in SQLite, file system, HTTP server

### Bun Integration

```bash
# Install dependencies
bun install

# Run TypeScript directly (no build step)
bun run src/cli/index.ts

# Build for production
bun run build

# Run tests
bun test
```

### Performance Benefits

1. **Startup Time**: 3-5x faster than Node.js
2. **I/O Operations**: Built-in fast file system
3. **HTTP Requests**: Optimized HTTP client
4. **Module Loading**: Native ESM support
5. **Memory Usage**: Lower memory footprint

## Module Architecture

### CLI Module (`src/cli/`)
**Responsibility**: Command-line interface and user interaction

**Components**:
- `index.ts`: Entry point, command routing
- `commands/init.ts`: Project initialization
- `commands/config.ts`: Configuration management
- `commands/run.ts`: Test execution orchestration

**Design Patterns**:
- Command Pattern: Each command is a separate handler
- Dependency Injection: Logger and ConfigManager injected

**Key Features**:
- Commander.js for CLI parsing
- Async command execution
- Error handling and exit codes

### Parser Module (`src/parser/`)
**Responsibility**: Parse Markdown test files into structured data

**Components**:
- `markdown-parser.ts`: Markdown lexer and parser
- `test-model.ts`: TypeScript interfaces for test data

**Design Patterns**:
- Builder Pattern: Build TestModel step by step
- Validation Pattern: Validate parsed data before use

**Key Features**:
- Uses `marked` library for Markdown parsing
- Supports multi-language (Spanish/English) headings
- Variable substitution ($\{VAR\})
- Validation of required fields

### AI Module (`src/ai/`)
**Responsibility**: Generate TypeScript code via GLM API

**Components**:
- `glm-client.ts`: HTTP client for GLM API
- `glm-prompts.ts`: Prompt templates
- `code-generator.ts`: Code generation coordinator

**Design Patterns**:
- Strategy Pattern: Different prompt strategies
- Factory Pattern: Create GLM client instances
- Template Method: Base prompt structure

**Key Features**:
- Axios-based HTTP client
- Support for GLM-4.7 and GLM-5
- Automatic code cleaning (remove markdown formatting)
- Retry logic and error handling

### Runner Module (`src/runner/`)
**Responsibility**: Execute generated code with Playwright

**Components**:
- `playwright-runner.ts`: Test orchestration
- `code-executor.ts`: Dynamic code execution
- `execution-result.ts`: Result models

**Design Patterns**:
- Facade Pattern: Simplify Playwright API
- Template Method: Standard test execution flow
- Resource Management: Browser lifecycle management

**Key Features**:
- AsyncFunction constructor for dynamic execution
- Browser lifecycle management
- Timeout handling
- Error capture and reporting

### Config Module (`src/config/`)
**Responsibility**: Configuration management

**Components**:
- `config-manager.ts`: Configuration operations
- `config-schema.ts`: TypeScript interfaces
- `default-config.ts`: Default values

**Design Patterns**:
- Singleton Pattern: Single config instance
- Observer Pattern: Config change notifications (future)
- Strategy Pattern: Different config sources

**Key Features**:
- JSON file storage
- Environment variable support (future)
- Config validation
- Type-safe configuration

### Reporter Module (`src/reporter/`)
**Responsibility**: Display test results

**Components**:
- `terminal-reporter.ts`: Terminal output formatting

**Design Patterns**:
- Strategy Pattern: Different output formats
- Builder Pattern: Build complex output
- Template Method: Standard report structure

**Key Features**:
- Chalk for colored output
- Progress indicators
- Summary statistics
- Error highlighting

### Utils Module (`src/utils/`)
**Responsibility**: Shared utilities

**Components**:
- `logger.ts`: Logging utility
- `validators.ts`: Validation functions
- `file-helpers.ts`: File operations
- `variable-parser.ts`: Variable substitution

**Design Patterns**:
- Utility Pattern: Pure functions
- Singleton Pattern: Logger instance

**Key Features**:
- Colored logging
- File existence checks
- Directory creation
- Variable substitution

## Design Patterns Used

### 1. Dependency Injection
```typescript
constructor(config: GLMConfig, logger?: Logger) {
  this.logger = logger || new Logger();
}
```

### 2. Strategy Pattern
```typescript
// Different models for GLM
const model = options.model || 'glm-4.7';
```

### 3. Builder Pattern
```typescript
// Build TestModel step by step
test.steps.push({ number: 1, description: '...' });
```

### 4. Facade Pattern
```typescript
// Simplify complex Playwright API
await runner.runTest(test, code);
```

### 5. Template Method Pattern
```typescript
// Standard execution flow
async runTest(test, code) {
  const browser = await this.setupBrowser();
  const result = await this.executeTest(browser, code);
  await this.teardownBrowser(browser);
  return result;
}
```

## Data Flow

### Test Execution Flow

```
1. User runs: zqa run tests/test.md
   ↓
2. CLI parses arguments
   ↓
3. ConfigManager loads configuration
   ↓
4. MarkdownParser parses test.md
   ↓
5. CodeGenerator requests GLM
   ↓
6. GLM generates TypeScript code
   ↓
7. PlaywrightRunner executes code
   ↓
8. TerminalReporter displays results
```

### Configuration Flow

```
1. User runs: zqa config set key value
   ↓
2. CLI parses command
   ↓
3. ConfigManager loads existing config
   ↓
4. ConfigManager updates value
   ↓
5. ConfigManager saves to .zqa/config.json
   ↓
6. Success message displayed
```

## Code Quality Standards

### TypeScript Best Practices
- Strict mode enabled
- No implicit any
- No unused variables
- No unreachable code
- Consistent casing

### Clean Code Principles
- Single Responsibility: Each module has one clear purpose
- DRY: Don't Repeat Yourself - utilities for shared logic
- KISS: Keep It Simple, Stupid - simple solutions
- YAGNI: You Aren't Gonna Need It - avoid over-engineering

### Error Handling
- Try-catch blocks for async operations
- Specific error messages
- Graceful degradation
- User-friendly error reporting

### Logging
- Debug level: Detailed diagnostic information
- Info level: General progress information
- Success level: Successful operations
- Warning level: Non-critical issues
- Error level: Failures and exceptions

## Performance Considerations

### Bun-Specific Optimizations
- Bun's fast I/O for file operations
- Bun's native HTTP for API calls
- Bun's efficient module loading
- Bun's low memory footprint

### Async Operations
- All I/O operations are async
- Non-blocking API calls
- Parallel execution (future)

### Memory Management
- Browser cleanup after each test
- No memory leaks in code execution
- Efficient string handling

### Code Generation
- Prompt optimization for GLM
- Token usage tracking
- Caching strategy (future)

## Security Considerations

### API Keys
- Never log full API keys
- Mask sensitive information in output
- Store in secure location (.zqa/)

### Code Execution
- Sandboxed execution in browser context
- Timeout protection
- Error isolation

### File Operations
- Validate file paths
- Restrict to working directory
- Sanitize user input

## Testing Strategy (Future)

### Unit Tests
- Each module independently
- Mock external dependencies
- Test edge cases

### Integration Tests
- Module interactions
- End-to-end flows
- Real Playwright execution

### E2E Tests
- Complete user workflows
- Real GLM API calls (staged)
- Test execution verification

## Scalability Considerations

### Current (v0.1.0)
- Sequential execution
- Single worker
- No caching

### Future (v0.2.0+)
- Parallel execution
- Worker pools
- Code caching
- Result streaming

## Maintainability

### Documentation
- Inline code comments
- README for users
- ARCHITECTURE.md for developers
- API documentation (future)

### Code Organization
- Clear module boundaries
- Consistent naming conventions
- Logical file structure
- Separate concerns

### Version Control
- Semantic versioning
- Clear commit messages
- Feature branches
- Code review process

## Future Enhancements

### Short-term
- Code caching
- Parallel execution
- Screenshots

### Medium-term
- HTML reporter
- Historical tracking
- Test templates
- Retry logic

### Long-term
- Mobile testing (agent-device)
- CI/CD integration
- Cloud execution
- Team collaboration

## Bun vs Node.js

| Feature | Bun | Node.js |
|---------|-----|---------|
| Startup Speed | 3-5x faster | Baseline |
| I/O Performance | Optimized | Standard |
| Memory Usage | Lower | Higher |
| TypeScript Support | Native | Requires compilation |
| Bundler | Built-in | External (webpack, etc.) |
| Test Runner | Built-in | External (jest, etc.) |
| Package Manager | Built-in | npm/yarn |
| Compatibility | High | Native |
| Ecosystem | Growing | Mature |

**Why Bun for zimpleQA?**
1. Faster startup time = quicker test execution
2. Native TypeScript = faster development cycle
3. All-in-one = simpler tooling
4. Lower memory = better for CI/CD
5. Modern = future-proof
