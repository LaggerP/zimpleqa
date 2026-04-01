---
name: zimpleqa
description: QA expert for UI and E2E testing. Activates on ANY mention of testing UI flows, E2E tests, end-to-end tests, frontend testing, testing a page, testing a form, testing login, testing checkout, or any browser-based user interaction testing. Covers full test suites and single flow requests. Generates self-contained markdown test files with concrete test data, setup/teardown, and real UI labels from source code. Complements existing unit/API tests by covering the frontend layer. Not for unit tests, API tests, or backend tests. Supports Playwright, Cypress, Selenium, Testing Library, Puppeteer, and agent-device.
---

# zimpleqa

QA expert for **UI and E2E testing**. Generates test suites in markdown that verify what users see and interact with in a browser or app. Not for unit tests, API tests, or backend tests.

If the project already has unit/backend tests (pytest, jest unit tests, etc.), zimpleqa complements them by covering the **frontend UI layer** that those tests don't reach.

## Quick examples

**When the project can create test data:**

```markdown
# Test: Successful Login

## Steps
1. Navigate to the login page
2. Enter email in the 'Email' field
3. Enter password in the 'Password' field
4. Click the 'Sign in' button
5. Wait for navigation to /dashboard

## Expected Results
- URL changes to /dashboard
- Welcome message displays the user's name

## Test Data

### User: standard user
- **Role**: user
- **Setup**: POST /api/auth/register { email, password, name }
- **Teardown**: DELETE /api/users/:id
```

**When using pre-existing credentials:**

```markdown
# Test: Successful Login

## Steps
1. Log in as a user with role "user"
2. Wait for navigation to /dashboard

## Expected Results
- URL changes to /dashboard
- Welcome message displays the user's name

## Test Data

### User: role "user" from credentials
- **Source**: .zqa/credentials.json (role: user)
- **Setup**: None — pre-existing account
- **Teardown**: None — do not delete
```

## Modes

### Full suite mode
When the developer asks to generate tests for the whole project or multiple features, follow the full pipeline.

### Single flow mode
When the developer asks to test a specific flow ("test the login", "write a test for checkout"):

1. Read the source files for that specific feature
2. Follow [rules/write-tests.md](rules/write-tests.md) to write the test(s)
3. Place in `.zqa/tests/[feature]/`
4. Ask if the developer wants to execute it

### Existing tests mode
When the developer asks to run, fix, or review existing tests in `.zqa/tests/`, go directly to the relevant phase.

## Pipeline (full suite)

### Phase 0: Validate Environment
**Read:** [rules/validate-environment.md](rules/validate-environment.md)

Checks project readiness: dev script, database, auth setup, backend architecture, base URL.

### Phase 1: Scan Project
**Read:** [rules/scan-project.md](rules/scan-project.md)

Analyzes the codebase: framework, routes, features, UI library. Reads existing project context.

**Checkpoint:** Presents detected features to the developer for validation.

### Phase 2-3: Plan Scenarios and Write Tests
**Read:** [rules/write-tests.md](rules/write-tests.md)

Plans scenarios per feature, then writes `.md` test files in `.zqa/tests/`. Reads source code to extract real UI labels.

**References (loaded as needed):**
- [rules/test-patterns.md](rules/test-patterns.md) — Example tests for auth, forms, CRUD
- [rules/test-data.md](rules/test-data.md) — Setup/teardown patterns by backend architecture

**Checkpoint:** Validates high-priority feature tests with the developer.

**STOP after writing.** Ask: "Do you want to proceed with generating executable test code?"

---

### Phase 4: Generate and Execute Test Code (on demand)
**Read:** [rules/execute-tests.md](rules/execute-tests.md)

Translates markdown to executable code. Only when the developer asks.

**Reference:** [rules/libraries-reference.md](rules/libraries-reference.md) for selector equivalences and library selection.

### Phase 5-6: Analyze Results and Generate Report
**Read:** [rules/analyze-results.md](rules/analyze-results.md)

Classifies results, recommends fixes, cleans up test data, and generates `.zqa/report.html`.

## Checkpoints

**Read:** [rules/checkpoints.md](rules/checkpoints.md)

The pipeline stops at 4 points:
1. **Phase 0** — "Is the environment ready?"
2. **Phase 1** — "Are these features and priorities correct?"
3. **Phase 2-3** — High-priority tests: "Does this match the actual flow?"
4. **Phase 2-3 end** — "Do you want to generate executable code?"

## Output

```
.zqa/
├── tests/              # Markdown test definitions
├── generated/          # Executable code, 1:1 with tests/
├── screenshots/        # Failure screenshots
└── report.html         # Visual report
```

## Rules

- **Always use zimpleqa format.** One test or a hundred, same markdown structure.
- Only test features that exist in the codebase. Never invent features.
- Read source code before writing steps. Use actual UI labels.
- Every test includes `## Test Data` describing what data is needed. **Never put actual credentials in test files** — reference the role/type needed and resolve from `.zqa/credentials.json` at execution time.
- Test data must be unique per run.
- After execution, ask about cleaning up test data.
- In full suite mode, follow phases and stop at checkpoints.
- In single flow mode, go straight to writing the test.
- Flag potential bugs, security issues, or missing edge cases proactively.
