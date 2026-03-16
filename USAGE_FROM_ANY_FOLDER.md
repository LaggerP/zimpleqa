# How to use zimpleQA from any folder

## 🚀 Options to use zimpleQA outside the repository

### Option 1: Run directly with Node (Simplest)

From any folder, execute:

```bash
node /path/to/zimpleqa/dist/cli/index.js <command>
```

**On Windows:**
```bash
node F:/Codebase/AQUI/dist/cli/index.js init
node F:/Codebase/AQUI/dist/cli/index.js config
node F:/Codebase/AQUI/dist/cli/index.js run tests/
```

**On Linux/Mac:**
```bash
node /path/to/zimpleqa/dist/cli/index.js init
node /path/to/zimpleqa/dist/cli/index.js config
node /path/to/zimpleqa/dist/cli/index.js run tests/
```

### Option 2: Create an alias (Recommended for daily use)

#### On Windows (PowerShell):

1. Open PowerShell
2. Run:
```powershell
function zqa {
    node F:/Codebase/AQUI/dist/cli/index.js $args
}
```

3. To make it permanent, add it to your profile:
```powershell
notepad $PROFILE
```
And add the function at the end of the file.

4. Reload your profile:
```powershell
. $PROFILE
```

Now you can use:
```powershell
zqa init
zqa config set glm.apiKey your-api-key
zqa run tests/
```

#### On Linux/Mac:

1. Edit your `~/.bashrc` or `~/.zshrc` file:
```bash
nano ~/.bashrc
```

2. Add at the end:
```bash
alias zqa='node /path/to/zimpleqa/dist/cli/index.js'
```

3. Reload your shell:
```bash
source ~/.bashrc
```

Now you can use:
```bash
zqa init
zqa config set glm.apiKey your-api-key
zqa run tests/
```

### Option 3: Create a wrapper script (Permanent)

#### On Linux/Mac:

1. Create the file `/usr/local/bin/zqa`:
```bash
sudo nano /usr/local/bin/zqa
```

2. Add this content:
```bash
#!/bin/bash
node /path/to/zimpleqa/dist/cli/index.js "$@"
```

3. Make it executable:
```bash
sudo chmod +x /usr/local/bin/zqa
```

Now you can use `zqa` from anywhere.

#### On Windows:

1. Create the file `C:\Windows\System32\zqa.bat`
2. Add this content:
```batch
@echo off
node F:\Codebase\AQUI\dist\cli\index.js %*
```

Now you can use `zqa` from anywhere.

## 📝 Example usage in separate folder

### Step 1: Navigate to your working folder

```bash
cd /path/to/your/project
# or on Windows
cd F:/path/to/your/project
```

### Step 2: Initialize zimpleQA

```bash
node F:/Codebase/AQUI/dist/cli/index.js init
```

This creates:
- `.zqa/` (configuration)
- `tests/` (your tests)
- `tests/test-template.md` (template)

### Step 3: Configure your GLM API key

```bash
node F:/Codebase/AQUI/dist/cli/index.js config set glm.apiKey your-api-key
```

### Step 4: Create a test

Create `tests/my-test.md`:

```markdown
# Test: My first test

## Description
Verify that the page loads correctly

## URL
https://example.com

## Steps
1. Navigate to https://example.com
2. Verify title contains "Example"

## Expected Results
- Page loads successfully
- Title contains "Example"
```

### Step 5: Run the test

```bash
node F:/Codebase/AQUI/dist/cli/index.js run tests/my-test.md
```

### Step 6: Check configuration

```bash
node F:/Codebase/AQUI/dist/cli/index.js config
```

## 🎯 Available commands

```bash
# Initialize project
zqa init

# View configuration
zqa config

# Get specific value
zqa config get glm.model

# Set value
zqa config set glm.apiKey your-key
zqa config set glm.model glm-5

# Run single test
zqa run tests/test.md

# Run all tests
zqa run tests/

# With options
zqa run tests/ --model glm-5 --validate --verbose
```

## ✅ Verification

To verify zimpleQA works from any folder:

```bash
cd /tmp  # or any other folder
node F:/Codebase/AQUI/dist/cli/index.js --version
node F:/Codebase/AQUI/dist/cli/index.js --help
```

## 🐛 Troubleshooting

### Error: "No such file or directory"
Make sure you're using the correct path to `dist/cli/index.js`.

### Error: "Command not found: zqa"
If you created an alias, reload your shell:
```bash
source ~/.bashrc  # Linux/Mac
. $PROFILE  # PowerShell
```

### Error: "Cannot find module"
Make sure the project is compiled:
```bash
cd F:/Codebase/AQUI
bun run build
```

## 📚 Additional documentation

- [README.md](README.md) - Complete usage guide
- [INSTALL.md](INSTALL.md) - Detailed installation guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [COMO_USAR.md](COMO_USAR.md) - Guía en español
