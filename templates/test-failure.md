# Test: Login with Invalid Credentials

## Description
Verify that invalid credentials display an error message and do not grant access.

## URL
http://localhost:3000/login

## Steps
1. Navigate to the login page
2. Enter a non-existent email in the 'Email' field
3. Enter a password in the 'Password' field
4. Click the 'Sign in' button
5. Wait for error message to appear

## Expected Results
- Error message is displayed: "Invalid credentials"
- URL remains on /login
- User is NOT redirected to dashboard
- Login form is still visible

## Test Data

### User: non-existent account
- **Email**: nonexistent+1711900000@testmail.com
- **Setup**: None — this user must NOT exist in the system
- **Teardown**: None

## Variables
BASE_URL: http://localhost:3000

## Metadata
Version: 1.0.0
Priority: high
Tags: auth, login, negative

## Precondition
User does NOT exist in the system.

## Postcondition
No authentication occurred. Error message is visible.

## Related Files
- src/app/login/page.tsx
- src/components/LoginForm.tsx
