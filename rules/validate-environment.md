# Phase 0: Validate Environment

Before generating any tests, verify the project is in a testable state.

## Step 1: Detect project type

Determine if this is a **web** or **mobile/native** project:

| Signal | Type |
|---|---|
| `next`, `react-dom`, `vue`, `@angular/core` in dependencies | Web |
| `react-native`, `expo` in dependencies | Mobile (React Native) |
| `pubspec.yaml` exists | Mobile (Flutter) |
| `.xcodeproj` or `.xcworkspace` exists | Mobile (iOS native) |
| `build.gradle` with Android SDK | Mobile (Android native) |

This affects how the app is launched and tested:
- **Web** → needs a dev server running, tests run in a browser
- **Mobile** → needs a simulator/emulator running, tests run via device automation

## Step 2: Check app can run

**For web projects:**
- Look for `dev`, `start`, or `serve` scripts in package.json
- Check for Docker (`docker-compose.yml`, `Dockerfile`)
- Look for port configuration in `.env`, config files, or scripts
- Report the base URL and ask the developer to confirm

**For mobile projects:**
- Check if the app can build (`npx expo start`, `npx react-native run-ios`, `flutter run`)
- Verify simulator/emulator availability:

```
📱 Mobile project detected (React Native).

To run tests, I need a simulator or emulator:

  For iOS: Xcode simulator (requires macOS + Xcode)
  For Android: Android emulator (requires Android SDK)

  1 → iOS simulator is available
  2 → Android emulator is available
  3 → Both are available
  4 → Neither — I'll set one up first

What would you like?
```

## Step 3: Check database and data requirements

Look for signs of a database (Prisma, Drizzle, Mongoose, TypeORM, Supabase, Firebase, etc.).

If found, check:
- Is there a seed script?
- Are there migrations?
- Ask the developer if the database is running and initialized

## Step 4: Check for existing tests

Look for existing test infrastructure and previous zimpleqa tests in `.zqa/tests/`.

If tests exist, ask:

```
Found existing tests in this project.

  1 → Generate new tests alongside existing ones
  2 → Update existing zimpleqa tests
  3 → Start fresh, replace .zqa/tests/

What would you like?
```

## Step 5: Check how test data is created

First, check if `.zqa/credentials.json` exists. If it does, read it.

If it doesn't exist, determine how users and other entities can be created.

**For web projects:** self-registration, API endpoints, database seeds, external services.

**For mobile projects**, also consider:
- Does the app have a test/staging backend with pre-created accounts?
- Does login use OAuth/social login? (harder to automate — may need bypass tokens or test accounts from the provider)
- Does login use biometrics? (simulators can simulate FaceID/fingerprint, but the account must exist)
- Does login use OTP/magic link? (staging may accept a fixed code — check with the developer)

If credentials can't be created automatically:

```
I can't create test users automatically for this project.

How would you like to handle test credentials?

  1 → Provide them now (I'll use them in the tests)
  2 → I'll create a .zqa/credentials.json file
  3 → Skip tests that need authentication for now
  4 → Let me explain how it works in this project

What would you like?
```

Note: the decision of whether to use existing credentials or create new data is made **per test**, not globally. See [test-data.md](test-data.md) for the decision tree.

## Step 6: Detect backend architecture

Determine how the frontend relates to the backend:

| Architecture | How to detect |
|---|---|
| **Monolith** | API routes in the same project |
| **Monorepo / workspace** | `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json`, `apps/`, `packages/` |
| **Backend in same workspace** | Sibling directory with server code |
| **Backend separate** | No backend found in the workspace |
| **External services only** | Third-party services in dependencies, no local backend |

If monorepo or sibling backend detected, read the backend code to understand endpoints, data models, and seed scripts.

Present findings and ask how test data should be created.

## Step 7: Summary

Present a complete environment assessment and wait for the developer to confirm before proceeding.

## Done

After the developer confirms the environment, proceed to Phase 1: [scan-project.md](scan-project.md).
