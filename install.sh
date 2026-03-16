#!/bin/bash

# zimpleQA Installation Script
# This script installs zimpleQA globally using Bun

set -e

echo "🚀 Installing zimpleQA..."

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✓ Bun is installed: $(bun --version)"

# Build the project
echo "📦 Building zimpleQA..."
bun run build

# Create a global link
echo "🔗 Creating global link..."
bun link

echo ""
echo "✅ zimpleQA installed successfully!"
echo ""
echo "Usage:"
echo "  zqa init                    # Initialize project"
echo "  zqa config set glm.apiKey   # Set API key"
echo "  zqa run tests/              # Run tests"
echo ""
echo "For more information, run:"
echo "  zqa --help"
