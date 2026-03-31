# Testing Libraries Reference

Quick reference for selecting and using testing libraries with zimpleQA.

## When to use which library

| Project type | Recommended |
|---|---|
| Web frontend (any) | Playwright |
| Already using Cypress | Cypress |
| Component-level tests (React/Vue) | Testing Library + Jest/Vitest |
| Legacy projects | Selenium |
| React Native / Expo | agent-device |
| Flutter | agent-device |
| Native iOS / Android | agent-device |
| Web + mobile (cross-platform) | Playwright (web) + agent-device (mobile) |

If no library is installed, present the options:

```
No E2E testing library detected.

Which one would you like to use?

  1 → Playwright — fast, cross-browser, built-in auto-wait
  2 → Cypress — great DX, real-time preview, large ecosystem
  3 → Selenium — industry standard, widest browser support
  4 → Testing Library — component-level, tests from user perspective
  5 → agent-device — for mobile/native apps

What would you like?
```

## Selector equivalences

How to translate zimpleQA step descriptions to selectors in each library:

| zimpleQA step | Playwright | Cypress | Selenium | agent-device |
|---|---|---|---|---|
| "in the '[Label]' field" | `page.getByLabel('Label')` | `cy.contains('label', 'Label').find('input')` | `By.xpath("//label[text()='Label']/following::input")` | `fill @ref` |
| "Click '[Text]' button" | `page.getByRole('button', { name: 'Text' })` | `cy.contains('button', 'Text')` | `By.xpath("//button[contains(text(),'Text')]")` | `press @ref` |
| "in the email field" | `page.locator('input[name="email"]')` | `cy.get('input[name="email"]')` | `By.name('email')` | `fill @ref` |
| "the success message" | `page.getByTestId('success')` | `cy.get('[data-testid="success"]')` | `By.css('[data-testid="success"]')` | `snapshot -i` |

## Selector priority (most stable first)

1. `data-testid="..."` — test-specific, most stable
2. `aria-label="..."` — accessible, stable
3. `id="..."` — stable if meaningful
4. `name="..."` — good for form fields
5. `role` + text — for buttons, links
6. CSS class — last resort, fragile

## Install commands

| Library | Install | Run |
|---|---|---|
| Playwright | `npm install -D @playwright/test && npx playwright install chromium` | `npx playwright test [file]` |
| Cypress | `npm install -D cypress` | `npx cypress run --spec [file]` |
| Selenium | `npm install -D selenium-webdriver` | `node [file]` |
| Testing Library | `npm install -D @testing-library/react @testing-library/user-event` | `npx jest [file]` |
| agent-device | `npm install -g agent-device` | `agent-device replay [script.ad]` |
