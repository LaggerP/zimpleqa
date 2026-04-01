# Phase 5-6: Analyze Results and Generate Report

After executing tests, analyze results, clean up data, and generate an HTML report.

**Report template:** See [templates/report.html](../templates/report.html)

## Contents
- Classify results
- Present summary
- Recommend actions
- Coverage assessment
- QA expert guidance
- Data cleanup
- Generate HTML report

## Classify each result

For every test that ran, classify it:

| Result | Classification | Action |
|--------|---------------|--------|
| Passed | Working | No action |
| Failed — element not found | Test issue: selector wrong or UI changed | Re-read source, fix selector |
| Failed — timeout | Test or app issue | Check app is running |
| Failed — assertion failed | Possible app bug | Report to developer |
| Failed — navigation error | Test or app issue | Verify route and flow |
| Failed — data setup failed | Environment issue | Review Test Data setup |
| Error — code exception | Test code issue | Regenerate code |

## Present results

Show each test result with:
- Pass/fail status and duration
- For failures: which step failed, the error, likely cause, and recommendation

## Recommend actions

**Test issues:** Offer to fix by re-reading source and updating the test.
**Potential bugs:** Present expected vs actual behavior. Ask if it's a bug or if the test needs updating.
**Environment issues:** Ask the developer to verify the setup.

After presenting, ask:

```
What would you like to do?

  1 → Re-run failed tests
  2 → Re-run all tests
  3 → Fix the failing tests and re-run
  4 → Review flagged bugs
  5 → Done for now

What would you like?
```

## Coverage assessment

Show a coverage table per feature. Suggest additional tests for uncovered areas or missing scenarios.

## QA expert guidance

Proactively flag:
- Potential bugs found while analyzing code or results
- Security concerns (unsanitized input, exposed data, missing rate limiting)
- Missing edge cases (session expiry, concurrent actions, error recovery, mobile viewports)
- Flows that are undertested relative to their complexity

Don't limit suggestions to a predefined list. Base them on what you observed in this specific codebase.

## Data cleanup

After presenting results, **always ask**:

```
🧹 Test data created during this run:
  - maria.garcia+1711900000@testmail.com
  - "Test Item QA +1711900000"

  1 → Clean up all test data
  2 → Keep the data
  3 → Clean up some, keep others

What would you like?
```

If cleanup is requested, execute teardown in reverse order. Report any failures.

## Generate HTML report

Generate `.zqa/report.html` using the template at [templates/report.html](../templates/report.html).

Single self-contained HTML file with: header (pass rate), summary cards, feature coverage table, test results (failed first), suggestions, and footer.

Rules: all CSS inline, no external dependencies, replace placeholders with actual data, viewable by opening directly in a browser.

## Done

After analysis, cleanup, and report, the developer can fix tests, file bugs, generate additional tests, or iterate.
