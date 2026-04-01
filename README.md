# zimpleqa

zimpleqa turns your AI coding agent into a QA expert that scans your project, writes test cases, generates executable code, and tells you what's broken — all from a single prompt.

E2E testing shouldn't be the thing that keeps getting pushed to "next sprint." zimpleqa makes it part of your regular workflow.

Tests are written in plain markdown. Anyone on your team can read, review, and understand them.

## Install

```bash
npx skills add LaggerP/zimpleqa
```

Then tell your agent: *"generate E2E tests for this project"*

Or for a single flow: *"test the login"*

## How it works

zimpleqa guides the agent through a structured QA process:

1. **Validates the environment** — checks that your app can actually be tested
2. **Scans the codebase** — detects framework, routes, features, and backend architecture
3. **Plans and writes tests** — generates self-contained markdown files with steps, expected results, and test data
4. **Generates executable code** — translates markdown into Playwright, Cypress, or whatever your project uses (on demand)
5. **Analyzes results** — tells you if a failure is a bug in your app or a problem in the test
6. **Generates a report** — a single HTML file you can open and share

The agent stops at key points to validate with you. It won't assume your login uses passwords if it actually uses magic links.

## What a test looks like

```markdown
# Test: Successful Login

## URL
http://localhost:3000/login

## Steps
1. Enter email in the 'Email' field
2. Enter password in the 'Password' field
3. Click the 'Sign in' button
4. Wait for navigation to /dashboard

## Expected Results
- URL changes to /dashboard
- Welcome message displays the user's name

## Test Data

### User: Maria Garcia
- **Role**: user
- **Email**: maria.garcia@testmail.com
- **Password**: TestPass2024!
- **Setup**: POST /api/auth/register { email, password, name }
- **Teardown**: DELETE /api/users/:id
```

Every test includes what data it needs, how to create it, and how to clean it up. No mystery state, no shared fixtures, no "it works on my machine."

## Output

```
.zqa/
├── tests/              # Markdown test definitions
│   ├── auth/
│   │   ├── login-success.md
│   │   └── login-failure-invalid-credentials.md
│   └── checkout/
│       └── checkout-success.md
├── generated/          # Executable code (1 file per test)
├── screenshots/        # Captured on failure
└── report.html         # Visual test report
```

## Pre-existing test credentials (optional)

If your project uses accounts that can't be created programmatically (external auth, staging accounts, etc.), you can provide them in `.zqa/credentials.json`:

```json
{
  "users": [
    {
      "name": "Test User",
      "role": "user",
      "email": "test@empresa.com",
      "password": "Pass123!",
      "notes": "Standard user, already seeded"
    }
  ]
}
```

This file is optional. If it exists, zimpleqa uses these credentials instead of trying to create users. If it doesn't exist, the agent figures out how to create test data or asks you.

The file should be in `.gitignore` — it contains real credentials.

## Library agnostic

Tests are written in markdown, not in code. The agent translates them to whatever testing library your project uses — or helps you pick one if you don't have one yet.

## Works with

Claude Code, Cursor, Cline, GitHub Copilot, OpenCode, and any agent that supports skills.

## Scope

zimpleqa focuses on UI and E2E testing — what users see and interact with in a browser or app. It complements your existing unit tests, API tests, and backend tests by covering the frontend layer.

## License

MIT
