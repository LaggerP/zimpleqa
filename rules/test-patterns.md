# Test Patterns by Feature Type

Example tests for common feature types. Read this when writing tests for a specific feature to follow the right pattern.

## Auth — Login Success

```markdown
# Test: Successful Login

## Description
Verify login with valid credentials redirects to the authenticated area.

## URL
http://localhost:3000/login

## Steps
1. Navigate to the login page
2. Enter email in the '[actual label]' field
3. Enter password in the '[actual label]' field
4. Click the '[actual button text]' button
5. Wait for navigation to [dashboard/home URL]

## Expected Results
- URL changes to [authenticated page]
- User name or avatar is visible in the [header/nav]
- Login form is no longer displayed

## Test Data

### User: Maria Garcia
- **Role**: user
- **Email**: maria.garcia@testmail.com
- **Password**: TestPass2024!
- **Setup**: Create via POST /api/auth/register or insert in users table
- **Teardown**: Delete user after test

## Variables
USER_EMAIL: maria.garcia@testmail.com
USER_PASSWORD: TestPass2024!

## Metadata
Priority: high
Tags: auth, login, smoke

## Precondition
Maria Garcia user exists in the system (see Test Data for setup).

## Postcondition
User is authenticated with an active session.
```

## Auth — Login Failure

```markdown
# Test: Login with Invalid Credentials

## Description
Verify that invalid credentials show an error and do not authenticate.

## URL
http://localhost:3000/login

## Steps
1. Navigate to the login page
2. Enter email in the '[actual label]' field
3. Enter an incorrect password in the '[actual label]' field
4. Click the '[actual button text]' button
5. Wait for error message to appear

## Expected Results
- Error message is displayed (e.g., "[actual error text from code]")
- URL remains on /login
- User is NOT redirected

## Test Data

### User: Non-existent account
- **Email**: nonexistent@testmail.com
- **Password**: WrongPassword123!
- **Setup**: None — this user must NOT exist in the system
- **Teardown**: None

## Variables
USER_EMAIL: nonexistent@testmail.com
WRONG_PASSWORD: WrongPassword123!

## Metadata
Priority: high
Tags: auth, login, negative

## Precondition
User nonexistent@testmail.com does NOT exist in the system.

## Postcondition
No authentication occurred. Error message is visible.
```

## Form — Validation Failure

```markdown
# Test: Form Validation Errors

## Description
Verify that submitting a form with invalid data shows field-level validation errors.

## Steps
1. Navigate to the form page
2. Leave the '[required field label]' field empty
3. Enter invalid email "not-an-email" in the '[email label]' field
4. Click the '[submit button text]' button
5. Wait for validation messages to appear

## Expected Results
- '[required field label]' shows error: "[actual error message]"
- '[email label]' shows error: "[actual error message]"
- Form is NOT submitted
- Page does not navigate away

## Metadata
Priority: medium
Tags: form, validation, negative
```

## CRUD — Create

```markdown
# Test: Create New Item

## Steps
1. Navigate to the [items list] page
2. Click the '[create/add button text]' button
3. Fill '[title field label]' with the item title
4. Fill '[description field label]' with the item description
5. Click the '[save/create button text]' button
6. Wait for success feedback

## Expected Results
- Success message or notification is displayed
- New item appears in the list
- Item data matches what was entered

## Test Data

### Item: New test item
- **Title**: "Test Item QA"
- **Description**: "Created during E2E testing"
- **Setup**: None — this test creates the item as part of the flow
- **Teardown**: DELETE /api/items/:id or delete from items table

## Variables
ITEM_TITLE: Test Item QA
ITEM_DESCRIPTION: Created during E2E testing
```
