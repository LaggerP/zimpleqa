# Test Data Rules

How to write the `## Test Data` section in test files.

## Critical rule: never put credentials in test files

Test `.md` files describe **what type of data is needed**, not the actual credentials. The agent resolves actual values from `.zqa/credentials.json` or creates them at execution time.

```markdown
# WRONG — credentials exposed in the test file
## Test Data
### User: Admin
- **Email**: admin@empresa.com
- **Password**: Admin456!

# CORRECT — references the type of user needed
## Test Data
### User: role "admin" from credentials
- **Source**: .zqa/credentials.json (role: admin)
- **Setup**: None — pre-existing account
- **Teardown**: None — do not delete
```

## Decision tree (evaluate per test)

For each test, decide how to handle data:

**1. Does this test need an existing user?** (e.g., login, create post, edit profile)
  → Reference the role needed. The agent resolves it from `credentials.json` at execution time.

**2. Does this test need an entity that must NOT exist?** (e.g., register new user)
  → Describe a unique entity (timestamp suffix). Teardown deletes it.

**3. Does this test create data as part of the flow?** (e.g., create a post, add to cart)
  → No setup needed. Teardown must delete what the test created.

**4. Does this test need pre-loaded data to interact with?** (e.g., search results, product catalog)
  → Create via API/seed, or verify it exists. Teardown deletes only what was created.

**If none of the above resolves it** → Ask the developer.

## Credentials file

If the project has pre-existing test accounts, the developer provides them in `.zqa/credentials.json`:

```json
{
  "users": [
    {
      "name": "Test User",
      "role": "user",
      "email": "test@empresa.com",
      "password": "Pass123!",
      "notes": "Standard user, already seeded"
    },
    {
      "name": "Admin",
      "role": "admin",
      "email": "admin@empresa.com",
      "password": "Admin456!",
      "notes": "Has access to /admin"
    }
  ],
  "apiKeys": [
    {
      "service": "Stripe",
      "key": "sk_test_abc123",
      "notes": "Test mode only"
    }
  ],
  "other": [
    {
      "name": "OTP Code",
      "value": "123456",
      "notes": "Staging always accepts this code"
    }
  ]
}
```

**Rules for credentials.json:**
- If it exists → use these credentials, do not attempt to create users
- If it doesn't exist → determine how to create data based on the backend architecture
- This file goes in `.gitignore` — it contains real credentials
- **Never delete or modify entities from this file.**

## Examples in test files

### Test that needs an authenticated user

```markdown
## Test Data

### User: role "user" from credentials
- **Source**: .zqa/credentials.json (role: user)
- **Setup**: None — pre-existing account
- **Teardown**: None — do not delete
```

### Test that needs an admin

```markdown
## Test Data

### User: role "admin" from credentials
- **Source**: .zqa/credentials.json (role: admin)
- **Setup**: None — pre-existing account
- **Teardown**: None — do not delete
```

### Test that creates data during the flow

```markdown
## Test Data

### User: role "user" from credentials
- **Source**: .zqa/credentials.json (role: user)
- **Setup**: None — pre-existing account
- **Teardown**: None — do not delete

### Post: Created during test
- **Title**: "Test Post QA +1711900000"
- **Setup**: None — created as part of the flow
- **Teardown**: DELETE /api/posts/:id
```

### Test that needs a user that does NOT exist

```markdown
## Test Data

### User: non-existent account
- **Email**: nonexistent+1711900000@testmail.com
- **Setup**: None — this user must NOT exist
- **Teardown**: None
```

## Core rules

1. **Never put actual credentials in test .md files.** Reference the role/type needed.
2. **Evaluate data needs per test, not globally.**
3. **Data from credentials.json is never deleted.**
4. **Created data must be unique per run.** Append timestamp or suffix.
5. **Every created entity must have a teardown.**
6. **Teardown must be specific.** Not "clean up" but `DELETE /api/posts/:id`.
7. **If teardown is not possible**, document it explicitly.

## Setup/teardown patterns by backend architecture

Use the architecture detected in Phase 0:

**Monolith:** `POST /api/endpoint { data }` / `DELETE /api/endpoint/:id`

**Monorepo:** `POST http://localhost:PORT/api/endpoint { data }` (note backend URL and port)

**Backend separate:** `POST https://api.domain.com/endpoint { data }` (note auth requirements)

**External services:** Document the service-specific API or note "create manually in dashboard"

**Pre-existing only:** Reference credentials.json, no setup/teardown
