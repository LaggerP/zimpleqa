# Skill: Analyze Frontend Project with AI

## Purpose

Analyze an entire frontend project codebase using AI and generate comprehensive manual test cases in markdown v0.2.0 format.

## How It Works

1. **Full Codebase Scan**: Scans ALL files in the project (excluding only `node_modules`, `.git`, `dist`, etc.)
2. **Context Building**: Builds a rich context including:
   - Package.json dependencies
   - All route definitions
   - Source code from all relevant files (prioritized by importance)
   - Component structures
3. **AI Analysis**: Sends the entire context to the configured AI provider for intelligent analysis
4. **Feature Detection**: AI identifies features based on actual code, not just patterns
5. **Test Generation**: Creates detailed, context-aware test cases with realistic steps

## Supported Frameworks

- Next.js (App Router & Pages Router)
- React with React Router
- Vue with Vue Router
- Svelte/SvelteKit
- Any JavaScript/TypeScript project

## AI Analysis Output

The AI returns a structured analysis including:

```json
{
  "framework": "Detected framework and version",
  "features": [
    {
      "name": "Feature name",
      "type": "Feature category",
      "priority": "high|medium|low",
      "routes": ["/related/routes"],
      "components": ["RelatedComponents"],
      "confidence": 0.0-1.0,
      "description": "What this feature does",
      "suggestedTests": ["Specific test step 1", "Test step 2"]
    }
  ],
  "summary": "Application overview",
  "recommendations": ["Testing strategy recommendations"]
}
```

## Generated Tests

Tests are generated in markdown v0.2.0 format with:

- **AI-generated test steps** based on actual code analysis
- **Context-aware descriptions** that reflect real functionality
- **Related components and routes** identified from the codebase
- **Priority classification** based on feature criticality
- **Confidence scores** indicating detection reliability

## Usage

```bash
zqa analyze                      # Interactive analysis
zqa analyze --output custom/     # Custom output directory
zqa analyze --force              # Skip confirmation
zqa analyze --min-priority high  # Only high priority features
zqa analyze --verbose            # Show detailed file list
```

## Files Scanned

**Included:**
- `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`
- `.vue`, `.svelte`, `.astro`
- `.json`, `.md`
- `.css`, `.scss`, `.sass`, `.less`
- `.html`, `.graphql`, `.yaml`, `.prisma`

**Excluded:**
- `node_modules/`
- `.git/`, `.next/`, `.nuxt/`
- `dist/`, `build/`, `out/`
- `.cache/`, `coverage/`
- Lock files (package-lock.json, yarn.lock, etc.)

## Implementation

The skill uses:
- `CodebaseAIAnalyzer` - Main analyzer class
- `ProjectDetector` - Scans filesystem
- `TestBatchGenerator` - Generates markdown tests
- Configured AI provider (GLM, Claude, or GPT)

## Example Output

```
🔍 AI-Powered Codebase Analysis

📂 Reading entire codebase...
ℹ Found 156 files in codebase
ℹ Sending codebase to AI for analysis...

📊 Analysis Results:
   Framework: Next.js 14 (App Router)
   Files scanned: 156
   Features detected: 8

📝 Summary:
   E-commerce application with user authentication, product catalog, 
   shopping cart, and Stripe payment integration.

🤖 Features detected by AI:
✓ Authentication (HIGH) - JWT-based authentication with OAuth support...
✓ Shopping Cart (HIGH) - Persistent cart with local storage sync...
✓ Payment Processing (HIGH) - Stripe integration for credit card...
✓ Product Search (MEDIUM) - Full-text search with filters...

📊 Feature Ranking:
┌─────────────────────┬──────────┬────────────┬────────────┐
│ Feature             │ Priority │ Routes     │ Confidence │
├─────────────────────┼──────────┼────────────┼────────────┤
│ Authentication      │ HIGH     │ /login     │ 95%        │
│ Shopping Cart       │ HIGH     │ /cart      │ 92%        │
│ Payment Processing  │ HIGH     │ /checkout  │ 98%        │
│ Product Search      │ MEDIUM   │ /search    │ 88%        │
└─────────────────────┴──────────┴────────────┴────────────┘

🤖 Generating test cases...
✓ Generated: authentication-test.md
✓ Generated: shopping-cart-test.md
✓ Generated: payment-processing-test.md
✓ Generated: product-search-test.md

✅ Done! Generated 4 test cases
```
