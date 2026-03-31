# Phase 4: Execute Tests

Translate test `.md` files into executable code using whatever testing library the project uses.

**Only run this phase when the developer explicitly asks to execute/run tests.**

**Reference:** [libraries-reference.md](libraries-reference.md) for selector equivalences and library selection.

## Contents
- Detect testing library
- Read the test file
- Read Related Files for selectors
- Generate test code
- Step-by-step logging
- Ask execution mode
- Execute
- File generation rule (1 markdown = 1 code file)

## Detect the testing library

Check `package.json` for installed testing libraries. See [libraries-reference.md](libraries-reference.md) for the full list.

If no E2E library is installed, present the options and let the developer choose.

## Read the test file

Parse the `.md` file and extract:

| Section | Maps to |
|---------|---------|
| `## Steps` | Test actions |
| `## Expected Results` | Assertions |
| `## Test Data` | Setup before test, teardown after |
| `## Variables` | Constants in test code |
| `## Related Files` | Read these for real selectors |
| `## URL` | Starting navigation point |

## Read Related Files for selectors

Read the source files listed in `## Related Files` to find actual selectors. See [libraries-reference.md](libraries-reference.md) for selector priority and equivalences across libraries.

## Generate test code

Map each markdown section to code:

**Steps → Actions:** Each numbered step becomes a test action (navigate, fill, click, select, wait, etc.)

**Expected Results → Assertions:** Each bullet becomes an assertion (visible, contains text, URL changed, count, etc.)

**Test Data → Setup/Teardown:** Execute setup instructions before the test, teardown after. Use before/after hooks if the library supports them.

**Variables → Constants:** Declare at the top of the test file.

### Step-by-step logging (required)

Every generated test **must log each step as it executes**:

```
Running: [feature]/[test-name].md
  ✓ Step 1: [description] (0.8s)
  ✓ Step 2: [description] (0.3s)
  ✗ Step 3: [description] — [error message]
  ❌ FAILED at step 3 (1.2s)
```

Wrap each action in a function that logs the step number, description, duration, and pass/fail status.

### Screenshot on failure (required)

When a step fails, capture a screenshot:
```
📸 Screenshot saved: .zqa/screenshots/[test-name]-step[N]-failed.png
```

## Ask execution mode

Before running, **always ask**:

```
▶ Ready to execute N tests.

How do you want to run them?

  1 → Live mode — opens the browser, watch in real time
  2 → Headless mode — runs in background, faster
  3 → Slow motion — live with delay between actions

What would you like?
```

If multiple tests and live/slow motion mode:
```
Multiple tests detected.

  1 → One at a time — watch each test finish before the next
  2 → All at once — parallel execution

What would you like?
```

For live/slow motion, default to one at a time. For headless, run in parallel.

## Execute

Run with the appropriate command for the detected library. See [libraries-reference.md](libraries-reference.md) for install and run commands.

## File generation rule

**One markdown = one code file.**

```
.zqa/
├── tests/                          # Markdown definitions
│   └── [feature]/
│       └── [test-name].md
└── generated/                      # Executable code (1:1 with tests/)
    └── [feature]/
        └── [test-name].spec.js
```

Same directory structure, same file name, library-appropriate extension. Each file is independently runnable — no shared imports, no base classes.

## Configuration

If the project doesn't have a test runner config, create a minimal one pointing `testDir` to `.zqa/generated/`.
