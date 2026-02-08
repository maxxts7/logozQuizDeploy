---
name: test-max-attempts
description: Run Playwright test for max attempts reached scenario - verifies previous answers and results are shown when user revisits a quiz after reaching attempt limit.
---

# Test Max Attempts Reached

This skill runs the Playwright E2E test that verifies when a user reaches the maximum attempt limit on a quiz, revisiting the quiz link shows their previous answers and results instead of allowing a new attempt.

## What This Test Covers

1. **Previous results shown** - When max attempts reached, the page shows previous score/results
2. **Previous answers visible** - The user can see what they answered previously
3. **No start button** - The start/retake button is hidden when limit is reached
4. **Limit message displayed** - User sees a message about reaching the attempt limit
5. **Quiz cover image** - Page displays properly without errors

## Prerequisites

- Dev server running at `http://localhost:3000` (auto-started by Playwright)
- Node.js and npm installed
- Playwright browsers installed (`npx playwright install chromium`)

## Running the Test

Execute the following command:

```bash
npx playwright test tests/e2e/max-attempts-reached.spec.ts --headed
```

### Options

- **Headless mode** (faster, no browser window):
  ```bash
  npx playwright test tests/e2e/max-attempts-reached.spec.ts
  ```

- **Debug mode** (step through test):
  ```bash
  npx playwright test tests/e2e/max-attempts-reached.spec.ts --debug
  ```

- **Run specific test**:
  ```bash
  npx playwright test tests/e2e/max-attempts-reached.spec.ts -g "should show previous results"
  ```

## Test Scenarios

### Scenario 1: Show Previous Results When Max Attempts Reached
1. Creates a quiz with max 1 attempt
2. Takes the quiz and submits correct answer
3. Navigates to quiz link again
4. Verifies: No start button, shows attempt limit message, displays previous score

### Scenario 2: Display Previously Selected Answer
1. Creates a quiz with max 1 attempt
2. Takes the quiz and submits incorrect answer ("3" instead of "4")
3. Navigates to quiz link again
4. Verifies: Shows that incorrect answer was selected or 0% score

### Scenario 3: Quiz Page Loads Without Errors
1. Takes the quiz once
2. Navigates to quiz link again
3. Verifies: Page loads correctly without 404 or error pages

## Expected Test Output

```
Running 3 tests using 1 worker

  ✓ Max Attempts Reached - Show Previous Results › should show previous results when max attempts reached
  ✓ Max Attempts Reached - Show Previous Results › should display the correct answer that was previously selected
  ✓ Max Attempts Reached - Show Previous Results › should show quiz cover image on max attempts page

  3 passed
```

## Troubleshooting

- **Test fails on "start button not visible"**: The quiz may not have loaded properly. Check network/server logs.
- **Test fails on "attempt limit message"**: Verify the UI shows appropriate message when limit is reached.
- **Timeout errors**: Increase timeout in playwright.config.ts or check if dev server is responding.

## Cleanup

Test data is automatically created with unique timestamps. To clean up old test data:

```bash
/cleanup-test-data
```

## Related Tests

- `attempt-limit.spec.ts` - Tests basic attempt limiting (allows attempts within limit)
- `quiz-taking.spec.ts` - Tests basic quiz submission flow
