# zimpleqa

A QA expert skill that generates complete E2E test suites in markdown for any frontend project.

## Install

```bash
npx skills add LaggerP/zimpleqa
```

## What it does

Acts as a QA expert that guides an AI agent through a 6-phase pipeline:

0. **Validate** — Checks if the project is ready to test (dev server, database, auth)
1. **Scan** — Analyzes the codebase (framework, routes, features)
2. **Plan** — Defines test scenarios and data requirements per feature
3. **Write** — Generates self-contained `.md` test files in `.zqa/tests/`
4. **Execute** — Translates markdown tests to code in the project's testing library (on demand)
5. **Analyze** — Classifies results, suggests fixes, flags potential bugs and security issues
6. **Report** — Generates `.zqa/report.html` with visual results, coverage, and suggestions

The pipeline stops at checkpoints for developer input. High-priority flows are validated before proceeding.

## Output

```
.zqa/
└── tests/
    ├── auth/
    │   ├── login-success.md
    │   ├── login-failure-invalid-credentials.md
    │   └── login-failure-empty-fields.md
    └── ...
```

Each test file is self-contained: steps, expected results, test data with setup/teardown, and references to source files.

## Supported testing libraries

Playwright, Cypress, Selenium, Testing Library (Jest/Vitest), Puppeteer, agent-device (mobile/native).

## Works with

Any AI coding agent: Claude Code, Cursor, Cline, GitHub Copilot, OpenCode, and others.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Entry point — pipeline overview |
| `rules/validate-environment.md` | Phase 0: Environment readiness check |
| `rules/scan-project.md` | Phase 1: Codebase analysis |
| `rules/plan-scenarios.md` | Phase 2: Test scenario planning |
| `rules/write-tests.md` | Phase 3: Test format and writing rules |
| `rules/execute-tests.md` | Phase 4: Test code generation and execution |
| `rules/analyze-results.md` | Phase 5: Result analysis and recommendations |
| `rules/generate-report.md` | Phase 6: HTML report generation |
| `rules/checkpoints.md` | Developer validation rules |
| `rules/libraries-reference.md` | Testing library syntax cheatsheets |
| `templates/` | Example test files |

## License

MIT
