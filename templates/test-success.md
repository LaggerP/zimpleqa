# Test: Successful Login

## Description
Verify that a user can log in with valid credentials and is redirected to the dashboard.

## URL
http://localhost:3000/login

## Precondition
User is authenticated with role: user

## Steps
1. Log in as a user with role "user"
2. Wait for navigation to /dashboard

## Expected Results
- URL changes to /dashboard
- Welcome message displays the user's name
- Navigation shows authenticated state (user avatar visible)

## Test Data

### User: role "user" from credentials
- **Source**: .zqa/credentials.json (role: user)
- **Setup**: None — pre-existing account
- **Teardown**: None — do not delete

## Variables
BASE_URL: http://localhost:3000

## Metadata
Version: 1.0.0
Priority: high
Tags: auth, login, smoke

## Postcondition
User is authenticated and redirected to dashboard.

## Related Files
- src/app/login/page.tsx
- src/components/LoginForm.tsx
