# zimpleQA v0.1.0

AI-powered QA testing tool using Playwright and GLM.

## 🎯 Features

- ✨ Write tests in natural language (Markdown)
- 🤖 Generate TypeScript code automatically via GLM
- 🎭 Execute tests with Playwright
- 🔧 Support for variables ($\{VAR\})
- 💻 Easy CLI interface
- 🧪 Clean architecture following best practices
- ⚡ Built with Bun for optimal performance

## 📦 Installation

### Quick Installation (Run from Source)

1. Clone the repository:
```bash
git clone https://github.com/your-org/zimpleqa.git
cd zimpleqa
```

2. Install dependencies:
```bash
bun install
```

3. Build the project:
```bash
bun run build
```

### Using from Any Directory

#### Option 1: Run directly with Node
```bash
node /path/to/zimpleqa/dist/cli/index.js <command>
```

Example:
```bash
node F:/Codebase/AQUI/dist/cli/index.js init
node F:/Codebase/AQUI/dist/cli/index.js run tests/
```

#### Option 2: Create an alias (Recommended)

**Windows PowerShell:**
```powershell
function zqa {
    node F:/Codebase/AQUI/dist/cli/index.js $args
}
# Add to $PROFILE for permanent usage
```

**Linux/Mac:**
```bash
alias zqa='node /path/to/zimpleqa/dist/cli/index.js'
# Add to ~/.bashrc or ~/.zshrc for permanent usage
```

#### Option 3: Create a wrapper script

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

### Development mode
```bash
git clone <repository>
cd zimpleqa
bun install
bun run install:browsers
bun run build
bun run dev
```

For detailed installation instructions, see [INSTALL.md](INSTALL.md).

## 🚀 Quick Start

### 1. Initialize project
```bash
zqa init
```

This creates:
- `.zqa/` - Configuration directory
- `.zqa/config.json` - Configuration file
- `.zqa/generated/` - Generated code cache
- `tests/` - Test files directory
- `tests/test-template.md` - Test template

### 2. Configure GLM API key
```bash
zqa config set glm.api_key <your-api-key>
```

Get your API key from [Zhipu AI](https://open.bigmodel.cn/).

### 3. Write your test
Create a new test file in `tests/` directory:

```markdown
# Test: Form validation

## Description
Test form validation

## URL
${BASE_URL}/contact

## Steps
1. Navigate to contact page
2. Leave name field empty
3. Fill email with test@example.com
4. Click submit button
5. Verify error message appears

## Expected Results
- Error message visible
- Form not submitted

## Variables
BASE_URL=https://example.com
```

### 4. Run your test
```bash
# Run single test
zqa run tests/form-validation.md

# Run all tests in directory
zqa run tests/

# With options
zqa run tests/ --model glm-5 --validate --verbose
```

## 📚 CLI Commands

### `zqa init`
Initialize zimpleQA in current directory.

```bash
zqa init
```

### `zqa config`
Manage configuration.

```bash
# Show current configuration
zqa config

# Get specific value
zqa config get glm.model

# Set configuration value
zqa config set glm.apiKey <your-key>
zqa config set glm.model glm-4.7
zqa config set glm.model glm-5
zqa config set playwright.browser chromium
zqa config set playwright.headless true
zqa config set playwright.timeout 30000
```

### `zqa run <target>`
Execute tests.

```bash
# Run single test file
zqa run tests/test.md

# Run all tests in directory
zqa run tests/

# Options
--model, -m <model>      GLM model (glm-4.7, glm-5) [default: glm-4.7]
--timeout, -t <seconds>  Timeout in seconds [default: 30]
--validate, -v           Validate generated code before execution
--verbose, -V             Verbose logging
```

## 📝 Test Format

### Required sections:
- `# Test: <Title>` - Test title
- `## Description` - Brief description
- `## URL` - URL to test (supports variables)
- `## Steps` - Test steps (numbered list)
- `## Expected Results` - Expected outcomes

### Optional sections:
- `## Variables` - Variable declarations

### Example:
```markdown
# Test: Login validation

## Description
Verify login form validates required fields

## URL
${BASE_URL}/login

## Steps
1. Navigate to login page
2. Leave username empty
3. Leave password empty
4. Click login button
5. Verify error message appears

## Expected Results
- Error message visible: "Username and password are required"
- Login attempt fails

## Variables
BASE_URL=https://example.com
```

## ⚙️ Configuration

Configuration is stored in `.zqa/config.json`:

```json
{
  "glm": {
    "apiKey": "your-api-key",
    "model": "glm-4.7",
    "baseUrl": "https://open.bigmodel.cn/api/paas/v4/"
  },
  "playwright": {
    "browser": "chromium",
    "headless": true,
    "timeout": 30000
  },
  "runner": {
    "timeout": 30000
  },
  "test": {
    "defaultTimeout": 30000
  }
}
```

### Configuration options:
- `glm.apiKey` - GLM API key (required)
- `glm.model` - GLM model: glm-4.7 or glm-5
- `glm.baseUrl` - GLM API base URL
- `playwright.browser` - Browser: chromium, firefox, webkit
- `playwright.headless` - Run browser headless: true/false
- `playwright.timeout` - Timeout in milliseconds
- `runner.timeout` - Runner timeout in milliseconds

## 🏗️ Architecture

```
zimpleQA/
├── src/
│   ├── cli/           # CLI commands
│   ├── ai/            # GLM integration
│   ├── parser/        # Markdown parser
│   ├── runner/        # Playwright runner
│   ├── config/        # Configuration management
│   ├── reporter/      # Terminal reporter
│   └── utils/         # Utilities
├── tests/             # Test files
└── .zqa/              # Runtime directory
```

## 🎯 Workflow

1. **Write test** in Markdown
2. **zimpleQA parses** Markdown
3. **GLM generates** TypeScript code
4. **Playwright executes** code
5. **Results displayed** in terminal

## 🔧 Development

```bash
# Install dependencies
bun install

# Install Playwright browsers
bun run install:browsers

# Build TypeScript
bun run build

# Run in development mode
bun run dev

# Clean build and runtime files
bun run clean
```

## 🐛 Troubleshooting

### GLM API errors
- Verify API key is set: `zqa config get glm.apiKey`
- Check API key is valid: [Zhipu AI Console](https://open.bigmodel.cn/)
- Ensure you have tokens available

### Playwright errors
- Install browsers: `bun run install:browsers`
- Check browser is installed: `playwright install --help`
- Try different browser: `zqa config set playwright.browser firefox`

### Test execution failures
- Use `--verbose` flag for detailed logs
- Check test format matches requirements
- Verify URL is accessible

## 📝 Examples

### Basic form test
```bash
zqa run tests/form-validation.md
```

### All tests with validation
```bash
zqa run tests/ --validate --verbose
```

### Using different GLM model
```bash
zqa run tests/ --model glm-5
```

## 🚧 Roadmap

### v0.1.0 (Current - MVP)
- ✅ CLI with init, config, run
- ✅ Markdown parser with variables
- ✅ GLM integration (glm-4.7, glm-5)
- ✅ Playwright runner (sequential)
- ✅ Terminal reporter
- ✅ Configuration management
- ✅ Bun runtime support

### v0.2.0 (Planned)
- Code caching
- Parallel execution
- Screenshots

### v1.0.0 (Future)
- HTML reporter
- Historical tracking
- Binary packaging
- Mobile testing integration (agent-device)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting PRs.

## 📞 Support

For issues and questions:
- GitHub Issues: [Create issue](https://github.com/your-org/zimpleqa/issues)
- Documentation: [Full docs](https://docs.zimpleqa.dev)
- How to use from any folder: [COMO_USAR.md](COMO_USAR.md) (Español) | [USAGE_FROM_ANY_FOLDER.md](USAGE_FROM_ANY_FOLDER.md) (English)

## 💡 Quick Start - Using from Any Folder

To use zimpleQA from any folder without installation:

```bash
# Navigate to your project folder
cd /path/to/your/project

# Initialize zimpleQA
node /path/to/zimpleqa/dist/cli/index.js init

# Configure API key
node /path/to/zimpleqa/dist/cli/index.js config set glm.apiKey your-api-key

# Run tests
node /path/to/zimpleqa/dist/cli/index.js run tests/
```

For creating aliases and more convenient usage, see [COMO_USAR.md](COMO_USAR.md).

## 🙏 Acknowledgments

- Playwright team for excellent testing framework
- Zhipu AI (GLM) for AI capabilities
- Bun team for blazing fast JavaScript runtime
- agent-device team for mobile testing inspiration
