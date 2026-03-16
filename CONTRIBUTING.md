# Contributing to zimpleQA

Thank you for considering contributing to zimpleQA! We welcome contributions from community.

## Getting Started

### Prerequisites
- Bun 1.0 or higher
- Git
- TypeScript knowledge
- Playwright knowledge (optional but helpful)

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/zimpleqa.git
   cd zimpleqa
   ```

3. Install dependencies:
   ```bash
   bun install
   ```

4. Install Playwright browsers:
   ```bash
   bun run install:browsers
   ```

5. Build the project:
   ```bash
   bun run build
   ```

6. Run in development mode:
   ```bash
   bun run dev
   ```

## Project Structure

```
zimpleQA/
├── src/
│   ├── cli/              # CLI commands
│   │   ├── index.ts      # Entry point
│   │   └── commands/     # Command implementations
│   ├── ai/               # AI/LLM integration
│   ├── parser/           # Markdown parsing
│   ├── runner/           # Test execution
│   ├── config/           # Configuration
│   ├── reporter/         # Result reporting
│   └── utils/            # Utilities
├── tests/                # Test files
├── .zqa/                 # Runtime directory (gitignored)
└── dist/                 # Build output (gitignored)
```

## Coding Standards

### TypeScript
- Use TypeScript strict mode
- No implicit any types
- Define all interfaces and types
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style
- Follow clean code principles
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Use meaningful names
- Keep functions small and focused
- Use async/await for asynchronous code

### Example:
```typescript
/**
 * Generates TypeScript code for a test
 * @param test - Test model to generate code for
 * @param model - GLM model to use
 * @returns Generated TypeScript code
 */
async generate(test: TestModel, model: string): Promise<string> {
  // Implementation
}
```

## Testing

### Running Tests
```bash
bun test
```

### Writing Tests
- Test files should be in `__tests__` directory
- Use Bun test or Jest
- Write unit tests for individual modules
- Write integration tests for module interactions

### Test Coverage
- Aim for >80% code coverage
- Cover edge cases and error conditions
- Test async operations properly

## Pull Request Process

1. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

2. **Make your changes** following coding standards

3. **Write tests** for your changes

4. **Update documentation** if needed:
   - README.md
   - ARCHITECTURE.md
   - Inline code comments

5. **Commit your changes** with clear messages:
   ```bash
   git commit -m "feat: add support for GLM-5 model"
   # or
   git commit -m "fix: resolve markdown parsing issue with empty lines"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a pull request**:
   - Describe your changes clearly
   - Link to related issues
   - Add screenshots if applicable
   - Request reviews from maintainers

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Development Guidelines

### When to Create a New Module
- When you have distinct functionality
- When code can be reused
- When you want to separate concerns

### When to Add to Existing Module
- When functionality is closely related
- When it's a small change
- When it doesn't break SRP

### Error Handling
- Always handle async errors
- Provide meaningful error messages
- Use try-catch for I/O operations
- Log errors appropriately

### Logging
- Use Logger utility
- Choose appropriate log level
- Include context in log messages
- Don't log sensitive information

## Areas for Contribution

### High Priority
- Bug fixes
- Performance improvements
- Documentation improvements
- Test coverage

### Medium Priority
- New features (discuss first)
- UI/UX improvements
- Code refactoring
- Additional test templates

### Low Priority
- Minor code style changes
- Comment improvements
- Example additions

## Bun-Specific Guidelines

### Use Bun Features
- `bun install` for dependencies
- `bun run` for scripts
- `bun build` for bundling
- `bun test` for testing

### Performance
- Leverage Bun's fast I/O
- Use Bun's native APIs when available
- Take advantage of Bun's bundling
- Optimize for Bun's runtime

## Questions or Issues?

- Open an issue on GitHub
- Join our Discord/Slack community
- Email: maintainers@zimpleqa.dev

## Code of Conduct

Be respectful, inclusive, and collaborative. We're all here to build something great together.

## License

By contributing, you agree that your contributions will be licensed under MIT License.

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website

Thank you for contributing to zimpleQA! 🎉
