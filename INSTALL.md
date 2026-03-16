# Installation Guide

## Quick Installation (Bun)

### Method 1: Run from Source (Recommended for Development)

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

4. Run from any directory:
```bash
node /path/to/zimpleqa/dist/cli/index.js <command>
```

### Method 2: Create an Alias (Recommended for Daily Use)

#### On Linux/macOS:
Add this to your `~/.bashrc` or `~/.zshrc`:
```bash
alias zqa='node /path/to/zimpleqa/dist/cli/index.js'
```

Then reload your shell:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

Now you can use:
```bash
zqa init
zqa run tests/
```

#### On Windows (PowerShell):
Add this to your PowerShell profile (`$PROFILE`):
```powershell
function zqa {
    node C:\path\to\zimpleqa\dist\cli\index.js $args
}
```

Then reload your PowerShell profile:
```powershell
. $PROFILE
```

Now you can use:
```powershell
zqa init
zqa run tests/
```

### Method 3: Create a Wrapper Script

#### On Linux/macOS:
Create `/usr/local/bin/zqa`:
```bash
#!/bin/bash
node /path/to/zimpleqa/dist/cli/index.js "$@"
```

Make it executable:
```bash
chmod +x /usr/local/bin/zqa
```

#### On Windows:
Create `C:\Windows\System32\zqa.bat`:
```batch
@echo off
node C:\path\to\zimpleqa\dist\cli\index.js %*
```

Now you can use `zqa` from anywhere!

### Method 4: Using bunx (Temporary)

From any directory:
```bash
bunx <path-to-zimpleqa>/src/cli/index.js <command>
```

Example:
```bash
bunx /path/to/zimpleqa/src/cli/index.js init
```

## Global Installation (Not Recommended - Future Feature)

Future versions will support:
```bash
bun install -g zimpleqa
```

## Docker Installation (Future)

Future versions will support Docker:
```bash
docker pull zimpleqa/latest
docker run --rm -v $(pwd):/tests zimpleqa run tests/
```

## Verification

To verify your installation:

```bash
zqa --version
# or
zqa --help
```

## Example Usage

```bash
# Navigate to your test directory
cd /path/to/your/project

# Initialize zimpleQA
zqa init

# Configure API key
zqa config set glm.apiKey your-api-key

# Create a test
cat > tests/simple-test.md <<EOF
# Test: Simple Test

## Description
Test example.com page

## URL
https://example.com

## Steps
1. Navigate to https://example.com
2. Verify page title contains "Example"

## Expected Results
- Page loads successfully
- Title contains "Example"
EOF

# Run the test
zqa run tests/simple-test.md
```

## Troubleshooting

### "command not found: zqa"
Make sure you've:
1. Created the alias/wrapper script
2. Made it executable (chmod +x)
3. Reload your shell profile
4. Used the correct path to zimpleqa

### "Cannot find module"
Make sure you've:
1. Built the project: `bun run build`
2. The dist/ directory exists
3. You're using the correct path

### Permissions issues (Linux/macOS)
```bash
chmod +x /path/to/zimpleqa/dist/cli/index.js
```

### Windows PowerShell execution policy
If you get script execution errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Development Installation

For contributing to zimpleQA:

```bash
# Clone repository
git clone https://github.com/your-org/zimpleqa.git
cd zimpleqa

# Install dependencies
bun install

# Install Playwright browsers
bun run install:browsers

# Build project
bun run build

# Run in development mode
bun run dev

# Run tests
bun test
```

## Uninstallation

### Remove alias:
Edit your shell profile and remove the alias line.

### Remove wrapper script:
```bash
rm /usr/local/bin/zqa  # Linux/macOS
# or
del C:\Windows\System32\zqa.bat  # Windows
```

### Remove global link (if installed):
```bash
bun unlink zimpleqa
```

## Next Steps

After installation:
1. Read the [README.md](README.md) for usage guide
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for design details
3. See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
