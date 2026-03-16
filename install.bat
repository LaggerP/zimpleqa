@echo off
REM zimpleQA Installation Script for Windows
REM This script installs zimpleQA globally using Bun

echo 🚀 Installing zimpleQA...

REM Check if Bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Bun is not installed. Please install Bun first:
    echo    powershell -c "irm bun.sh/install.ps1|iex"
    exit /b 1
)

echo ✓ Bun is installed:
bun --version

REM Build the project
echo 📦 Building zimpleQA...
bun run build

REM Create a global link
echo 🔗 Creating global link...
bun link

echo.
echo ✅ zimpleQA installed successfully!
echo.
echo Usage:
echo   zqa init                    # Initialize project
echo   zqa config set glm.apiKey   # Set API key
echo   zqa run tests/              # Run tests
echo.
echo For more information, run:
echo   zqa --help
