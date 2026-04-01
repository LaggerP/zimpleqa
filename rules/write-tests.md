# Phase 2-3: Plan Scenarios and Write Tests

Plan test scenarios per feature, then write all test `.md` files.

**Additional references (read as needed):**
- [test-patterns.md](test-patterns.md) — Example tests for common feature types
- [test-data.md](test-data.md) — Setup/teardown patterns by backend architecture

## Contents
- Scenario planning
- Test file format
- Step writing rules
- Form analysis checklist
- File organization
- Checkpoint rules
- Done

## Scenario planning

For each feature detected in Phase 1, define scenarios based on priority:

| Feature Priority | Minimum Scenarios |
|-----------------|-------------------|
| **high** | success + failure + edge-case (3+ tests) |
| **medium** | success + failure (2+ tests) |
| **low** | success (1+ test) |

For every feature, think about:
- **Success**: The user completes the flow correctly — what's the expected outcome?
- **Failure**: The user provides wrong input, misses a step, or lacks permissions — what should happen?
- **Edge case**: Empty states, boundary values, timeouts, interrupted flows, concurrent actions

Don't limit scenarios to a predefined list. Every feature has its own set of things that can go right and go wrong. Discover them by reading the source code.

## Before writing ANY test

For each feature:
1. Read the source files identified during the scan
2. Extract actual UI text: labels, placeholders, button text, error messages
3. Understand the fields, types, validations, and error handling
4. Only then write the steps using the real UI text

## Test file format

Every test file MUST follow this structure:

```markdown
# Test: [Descriptive Title]

## Description
[What this test verifies and why]

## URL
[Full URL to the page]

## Steps
1. [Specific action using real UI labels]
2. [One action per step]
3. [Include waits after navigation]

## Expected Results
- [Verifiable outcome 1]
- [Verifiable outcome 2]

## Test Data
[All entities needed: users, items, state. Setup and teardown per entity.]

## Variables
KEY: concrete value

## Metadata
Version: 1.0.0
Priority: high|medium|low
Tags: feature-name, scenario-type

## Precondition
[What must be true before the test]

## Postcondition
[What should be true after the test]

## Related Files
- path/to/component.tsx
```

**Required:** `# Test:`, `## URL`, `## Steps`, `## Expected Results`
**Recommended:** `## Description`, `## Test Data`, `## Variables`, `## Metadata`, `## Related Files`

## Step writing rules

1. **Use exact UI text.** Read the source code. If the button says "Save changes", write that — not "Click submit".
2. **One action per step.** "Fill form and submit" is wrong. Break into individual steps.
3. **Include waits.** After navigation, API calls, animations, or any async operation.
4. **Be specific in verifications.** Not "Check the page" but "Verify the text 'Cambios guardados' is visible".
5. **Describe what, not how.** Steps describe user actions, not implementation details.

## Form analysis checklist

When a feature contains a form:
1. Read the form component source file
2. List every field (input, select, checkbox, radio, textarea, custom components)
3. Note required fields and their validation rules
4. Note error messages shown for each validation
5. Generate a step per field in success tests
6. Generate failure tests for each validation rule

## File organization

```
.zqa/tests/
├── [feature-name]/
│   ├── [flow]-success.md
│   ├── [flow]-failure-[reason].md
│   └── [flow]-edge-case-[description].md
└── ...
```

Naming: `[action]-[scenario].md`. Use descriptive names that explain what the test does.

## Checkpoint

After writing tests for each **high priority** feature, **STOP** and present a summary. See [checkpoints.md](checkpoints.md).

**Medium priority:** validate only if complex. **Low priority:** generate and move on.

## Rules

1. **Never put credentials in test files.** Reference the role/type needed, not actual emails or passwords. See [test-data.md](test-data.md).
2. Never invent UI elements. If you didn't read it in the source code, don't reference it.
3. Every test must have Related Files listing the source files you read.
4. Failure tests verify failure. Expected results confirm errors, not success.
5. Match preconditions to scenario. Failure tests need failure preconditions.
6. One test file per scenario. Don't combine success and failure in one file.
7. Every test must be cleanable. See [test-data.md](test-data.md) for teardown rules.
8. Don't assume which features exist. Discover them from the code.

## Done

Present a summary:

```
Test suite generated:
  .zqa/tests/[feature]/ — N tests ✓ validated
  .zqa/tests/[feature]/ — N tests
  Total: N test files

Do you want to proceed with generating executable test code?
```

**STOP HERE.** Do not proceed to Phase 4 unless the developer explicitly asks.
