# Validation Checkpoints

The pipeline stops at 4 points for developer input. Never proceed past a checkpoint without confirmation.

## Summary

| Checkpoint | Phase | When |
|-----------|-------|------|
| Environment ready | Phase 0 | After validating the environment |
| Features correct | Phase 1 | After scanning the project |
| High-priority tests valid | Phase 2-3 | After writing tests for each high-priority feature |
| Proceed to code generation | Phase 2-3 end | After all tests are written |

## Checkpoint 0: Environment ready (Phase 0)

After checking the project environment, present the assessment and ask:

```
🔍 Environment assessment:
  ✓ Next.js 14 (App Router)
  ✓ Dev script: npm run dev (port 3000)
  ✓ Prisma detected (PostgreSQL)
  ⚠ Test user creation not confirmed

Before I continue:

  1 → Environment is ready, continue
  2 → Something is wrong, let me fix it
  3 → I need to provide additional details

What would you like?
```

## Checkpoint 1: Features correct (Phase 1)

Present detected features and ask:

```
🔍 Scanned: Next.js 14 (App Router)

Features detected:

  🔴 Authentication — /login, /signup
  🔴 Checkout — /checkout, /cart
  🟡 User Profile — /profile, /settings
  ⚪ Navigation — /

Before I continue:

  1 → Looks good, continue
  2 → Some features are wrong or missing
  3 → Change priorities
  4 → Skip some features
  5 → There are details the code doesn't show

What would you like?
```

Wait for the developer's response. Incorporate corrections before proceeding.

## Checkpoint 2: High-priority tests valid (Phase 2-3)

After writing tests for each **high-priority** feature, present a summary and ask:

```
📋 Authentication — 3 tests:

  ✓ login-success.md
    User: Test User (credentials.json)
    Flow: Enter email → Enter password → Click 'Sign in' → /dashboard

  ✓ login-failure.md
    User: nonexistent@testmail.com
    Flow: Enter email → Wrong password → Click 'Sign in' → Error message

  ✓ login-empty.md
    Flow: Click 'Sign in' without filling fields → Validation errors

Before I continue:

  1 → Tests are correct, continue
  2 → Some tests need changes
  3 → Missing edge cases
  4 → Test data setup is wrong for my project

What would you like?
```

Wait for the developer's response. Fix issues before moving to the next feature.

| Feature Priority | Checkpoint Required? |
|-----------------|---------------------|
| **high** | Always validate with the developer |
| **medium** | Validate only if complex |
| **low** | Generate and move on |

## Checkpoint 3: Proceed to code generation (Phase 2-3 end)

After all test markdown files are written:

```
📦 Tests generated:

  auth/        — 3 tests ✓ validated
  checkout/    — 2 tests ✓ validated
  profile/     — 2 tests
  search/      — 1 test
  Total: 8 files

What would you like to do?

  1 → Generate executable test code
  2 → Review the test files first
  3 → Done for now, I'll generate code later

What would you like?
```

Do not proceed to Phase 4 unless the developer explicitly chooses to generate code.

## Why checkpoint

- A wrong test for a critical flow wastes significant time when executed.
- The developer knows edge cases the code doesn't show.
- Early correction is cheap; fixing after execution is expensive.
- The markdown tests are valuable even without executable code.
