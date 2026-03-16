# Changelog

All notable changes to zimpleQA will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Code caching
- Parallel execution
- Screenshots support

## [0.1.0] - 2024-03-16

### Added
- Initial CLI with `init`, `config`, and `run` commands
- Markdown parser for test files
- GLM integration (glm-4.7 and glm-5 models)
- Playwright runner for test execution
- Terminal reporter with colored output
- Configuration management system
- Variable support in tests ($\{VAR\})
- TypeScript code generation via AI
- Clean architecture following best practices
- **Bun runtime support** - 3-5x faster than Node.js
- Comprehensive documentation

### Changed
- Migrated from npm to **Bun** package manager
- Updated build scripts for Bun
- Optimized for Bun's performance benefits

### Features
- `zqa init` - Initialize project structure
- `zqa config get/set` - Manage configuration
- `zqa run <target>` - Execute tests
- `zqa config` - Display current configuration
- Support for GLM-4.7 and GLM-5 models
- Configurable browser (chromium, firefox, webkit)
- Timeout configuration
- Verbose logging mode
- Code validation option

### Technical Details
- **Bun runtime** - 3-5x faster startup and execution
- TypeScript with strict mode
- Playwright for browser automation
- Commander.js for CLI
- Axios for HTTP requests
- Chalk for colored output
- Marked for Markdown parsing
- Clean architecture with separated concerns
- Dependency injection pattern
- Comprehensive error handling

### Documentation
- README with quick start guide
- Test format specification
- Configuration reference
- Troubleshooting guide
- Architecture documentation
- Example test templates
- Bun-specific optimization notes

## [0.0.2] - 2024-03-16

### Added
- Bun runtime support
- Migrated from npm to Bun
- Optimized build scripts for Bun
- Updated documentation for Bun

## [0.0.1] - 2024-03-16

### Added
- Project initialization
- Package structure
- TypeScript configuration
- Build scripts

## Future Roadmap

### [0.2.0] - Planned
- Code caching system
- Parallel test execution
- Screenshots capture
- Improved error messages

### [0.3.0] - Planned
- HTML reporter
- Historical test tracking
- Performance metrics
- Test comparison
- Detailed trace viewer

### [0.4.0] - Planned
- Binary packaging with Bun
- Multi-platform installers
- Auto-update mechanism
- Installation scripts (curl)

### [0.5.0] - Planned
- Retry logic
- Test suite organization
- Tags and filters
- Test dependencies
- Setup and teardown hooks

### [0.6.0] - Planned
- Test templates
- Code snippets
- Test wizard
- Interactive mode
- Test debugging tools

### [0.7.0] - Planned
- CI/CD integration
- GitHub Actions
- GitLab CI
- Jenkins integration
- Report export formats (JUnit, JSON)

### [0.8.0] - Planned
- Team collaboration features
- Test sharing
- Review workflow
- Comment system
- Version history

### [0.9.0] - Planned
- Performance optimization
- Reduced API calls
- Better caching
- Streaming responses
- Incremental code generation
- Bun-specific optimizations

### [1.0.0] - Planned
- Mobile testing integration (agent-device)
- Cross-platform support
- Production-ready
- Enterprise features
- Comprehensive test coverage
