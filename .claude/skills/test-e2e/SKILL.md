---
name: test-e2e
description: Run end-to-end tests for Quizzory app using Chrome DevTools MCP. Tests registration, login, quiz creation, taking a quiz, and analytics verification.
---

# E2E Test Suite for Quizzory

This skill runs a comprehensive end-to-end test of the Quizzory quiz application using Chrome DevTools MCP tools.

## Prerequisites

- Dev server must be running (use `/start-debug` first, or this skill will start it)
- Chrome DevTools MCP must be connected

## Test Flow

### Phase 1: Setup
1. Check if dev server is running, if not start it with `npm run dev` in background
2. Verify Chrome DevTools MCP connection with `mcp__chrome-devtools__list_pages`
3. Navigate to `http://localhost:3000`

### Phase 2: User Registration
**URL:** `/register`

1. Navigate to `http://localhost:3000/register`
2. Take a snapshot to find form elements
3. Fill registration form using `mcp__chrome-devtools__fill_form`:
   - Name: "E2E Test User"
   - Email: Generate unique email with timestamp like `e2etest{timestamp}@example.com`
   - Password: "TestPass123"
   - Confirm Password: "TestPass123"
4. Click "Sign up" button
5. Wait for redirect to login page (look for "Login" or "Sign in to your account")
6. **Verify:** No error messages, successful redirect

### Phase 3: User Login
**URL:** `/login`

1. Take snapshot of login page
2. Fill login form with registered credentials:
   - Email: (same as registered)
   - Password: "TestPass123"
3. Click "Log in" button
4. Wait for redirect to `/dashboard`
5. **Verify:** Dashboard loads with "My Quizzes" heading

### Phase 4: Quiz Creation
**URL:** `/dashboard/quiz/create`

1. Click "Create Quiz" link/button from dashboard
2. Wait for quiz creation form to load
3. Fill quiz details:
   - Title: "E2E Test Quiz"
   - Description: "Automated E2E test quiz"
4. Check "Publish immediately" checkbox
5. Fill Question 1:
   - Question: "What is 2 + 2?"
   - Option 1: "3"
   - Option 2: "4" (select as correct)
   - Option 3: "5"
   - Option 4: "6"
6. Click "+ Add Question" button
7. Fill Question 2:
   - Question: "What color is the sky?"
   - Option 1: "Blue" (select as correct - default)
   - Option 2: "Green"
   - Option 3: "Red"
   - Option 4: "Yellow"
8. Click "Create Quiz" button
9. Wait for redirect to dashboard
10. **Verify:** Quiz appears in list with 2 questions, 0 submissions

### Phase 5: Take Quiz
**URL:** `/take/[shareId]`

1. From dashboard, find the share link textbox for the created quiz
2. Open the share link in a new page using `mcp__chrome-devtools__new_page`
3. Take snapshot of quiz start page
4. Click "Start Quiz" button
5. Answer questions (select correct answers):
   - Question 1: Select "4"
   - Question 2: Select "Blue"
6. Click "Submit Quiz" button
7. **Verify:** Results show 100% score, 2/2 correct

### Phase 6: Verify Analytics
**URL:** `/dashboard/quiz/[quizId]/analytics`

1. Switch back to dashboard page using `mcp__chrome-devtools__select_page`
2. Reload the page
3. **Verify:** Quiz now shows 1 submission
4. Click "Analytics" link for the quiz
5. **Verify Analytics page shows:**
   - Total Submissions: 1
   - Average Score: 100%
   - Participant in leaderboard

### Phase 7: View Submission Details

1. Click "View Answers" link for the submission
2. **Verify submission details:**
   - Score: 100%
   - Marks: 2/2
   - Both questions marked as "Correct"

## Reporting Results

After all phases complete, report:

### Test Summary Table
| Phase | Test | Result |
|-------|------|--------|
| 1 | Setup | [Pass/Fail] |
| 2 | User Registration | [Pass/Fail] |
| 3 | User Login | [Pass/Fail] |
| 4 | Quiz Creation | [Pass/Fail] |
| 5 | Take Quiz | [Pass/Fail] |
| 6 | Analytics Verification | [Pass/Fail] |
| 7 | View Submission Details | [Pass/Fail] |

### Anomalies Found
List any unexpected behaviors or issues discovered during testing.

### Test Data Created
- User email used
- Quiz name created
- Number of submissions

## MCP Tools Reference

| Action | Tool |
|--------|------|
| Navigate | `mcp__chrome-devtools__navigate_page` |
| Take snapshot | `mcp__chrome-devtools__take_snapshot` |
| Fill single field | `mcp__chrome-devtools__fill` |
| Fill multiple fields | `mcp__chrome-devtools__fill_form` |
| Click element | `mcp__chrome-devtools__click` |
| Wait for text | `mcp__chrome-devtools__wait_for` |
| New page/tab | `mcp__chrome-devtools__new_page` |
| Switch pages | `mcp__chrome-devtools__select_page` |
| List pages | `mcp__chrome-devtools__list_pages` |
| Screenshot | `mcp__chrome-devtools__take_screenshot` |

## Error Handling

If any step fails:
1. Take a screenshot for debugging
2. Take a snapshot to see current page state
3. Report the failure with details
4. Continue to next phase if possible, or abort if critical

## Notes

- Each test run creates new data (user, quiz, submission)
- Use unique timestamps in email to avoid conflicts
- The participant will be "Anonymous" since no participant fields are configured
- Clean up is not performed automatically - test data remains in database
