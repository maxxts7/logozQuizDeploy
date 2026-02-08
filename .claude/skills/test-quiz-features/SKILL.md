---
name: test-quiz-features
description: Test advanced quiz features including timer, attempt limits, availability window, randomization, participant fields, and delayed answers.
---

# Test Quiz Features

This skill tests advanced quiz creation features using Chrome DevTools MCP.

## Prerequisites

- Dev server running at `http://localhost:3000`
- Chrome DevTools MCP connected
- A logged-in user session (run `/test-e2e` first or login manually)

## Features to Test

### Feature 1: Time Limit
- Set a quiz time limit (e.g., 60 seconds)
- Verify timer appears during quiz
- Verify quiz auto-submits when time expires (optional - requires waiting)

### Feature 2: Attempt Limits per IP
- Set max attempts (e.g., 2 attempts)
- Take quiz once, verify success
- Take quiz again, verify success
- Take quiz third time, verify blocked with error message

### Feature 3: Availability Window
- Set future start time - verify quiz shows "not yet available"
- Set past end time - verify quiz shows "no longer available"
- Set current window - verify quiz is accessible

### Feature 4: Randomize Questions
- Create quiz with 3+ questions
- Enable "Randomize question order"
- Take quiz multiple times, verify order varies

### Feature 5: Randomize Options
- Enable "Randomize answer options"
- Take quiz multiple times, verify option order varies

### Feature 6: Participant Fields
- Add required fields (Name, Email, Phone)
- Verify fields appear before quiz start
- Verify validation (required fields must be filled)
- Verify data appears in submission details

### Feature 7: Delayed Answer Reveal
- Set "Show answers after" to future time
- Submit quiz, verify answers are NOT shown
- (Simulate time passing or set to past) verify answers ARE shown

## Test Execution

### Setup Phase

1. Ensure logged in - navigate to `/dashboard`
2. If not logged in, login or run registration flow first
3. Take snapshot to verify dashboard access

### Test 1: Timer Feature

**Create Quiz with Timer:**

1. Navigate to `/dashboard/quiz/create`
2. Fill quiz details:
   - Title: "Timer Test Quiz"
   - Description: "Testing time limit feature"
3. Check "Set time limit" checkbox
4. Set time limit to 60 seconds (or 120 seconds)
5. Add 1 simple question:
   - Question: "Quick question - what is 1+1?"
   - Options: "1", "2" (correct), "3", "4"
6. Check "Publish immediately"
7. Click "Create Quiz"

**Verify Timer:**

1. Open the quiz share link in new page
2. Start quiz
3. **Verify:** Timer is visible showing countdown
4. Answer and submit before time expires
5. **Verify:** Submission successful

### Test 2: Attempt Limit Feature

**Create Quiz with Attempt Limit:**

1. Navigate to `/dashboard/quiz/create`
2. Fill quiz details:
   - Title: "Attempt Limit Test Quiz"
   - Description: "Testing max attempts per IP"
3. Check "Limit attempts per IP address"
4. Set max attempts to 2
5. Add 1 question
6. Check "Publish immediately"
7. Click "Create Quiz"

**Verify Attempt Limit:**

1. Open quiz share link
2. Take quiz - **Verify:** Success (attempt 1)
3. Take quiz again - **Verify:** Success (attempt 2)
4. Take quiz third time - **Verify:** Error message about max attempts reached

### Test 3: Availability Window Feature

**Create Quiz with Availability Window:**

1. Navigate to `/dashboard/quiz/create`
2. Fill quiz details:
   - Title: "Availability Window Test Quiz"
3. Check "Set availability window"
4. Set "Available From" to 1 hour ago
5. Set "Available Until" to 1 hour from now
6. Add 1 question
7. Check "Publish immediately"
8. Create quiz

**Verify Availability:**

1. Open quiz - **Verify:** Quiz is accessible
2. Edit quiz, set "Available Until" to 1 hour ago
3. Open quiz - **Verify:** Message shows quiz is no longer available
4. Edit quiz, set "Available From" to 1 hour from now
5. Open quiz - **Verify:** Message shows quiz is not yet available

### Test 4: Participant Fields Feature

**Create Quiz with Participant Fields:**

1. Navigate to `/dashboard/quiz/create`
2. Fill quiz details:
   - Title: "Participant Fields Test Quiz"
3. In "Participant Information Fields" section:
   - Click "+ Add Field"
   - Add field: Label "Full Name", Required: Yes
   - Click "+ Add Field"
   - Add field: Label "Email", Required: Yes
   - Click "+ Add Field"
   - Add field: Label "Phone", Required: No
4. Add 1 question
5. Check "Publish immediately"
6. Create quiz

**Verify Participant Fields:**

1. Open quiz share link
2. **Verify:** Form shows Name, Email, Phone fields before Start Quiz
3. Try to start without filling required fields - **Verify:** Validation error
4. Fill Name: "John Doe", Email: "john@test.com"
5. Click Start Quiz - **Verify:** Quiz starts
6. Complete and submit quiz
7. Check analytics - **Verify:** Participant shows "John Doe" not "Anonymous"
8. View submission details - **Verify:** Participant data is recorded

### Test 5: Randomization Features

**Create Quiz with Randomization:**

1. Navigate to `/dashboard/quiz/create`
2. Fill quiz details:
   - Title: "Randomization Test Quiz"
3. Check "Randomize question order for each participant"
4. Check "Randomize answer options for each question"
5. Add 3 questions:
   - Q1: "Question Alpha" - Options: "A1", "A2", "A3", "A4"
   - Q2: "Question Beta" - Options: "B1", "B2", "B3", "B4"
   - Q3: "Question Gamma" - Options: "C1", "C2", "C3", "C4"
6. Check "Publish immediately"
7. Create quiz

**Verify Randomization:**

1. Open quiz, start it
2. Note the question order and option order
3. Take snapshot for reference
4. Submit quiz
5. Open quiz again in new tab (or clear session)
6. Start quiz again
7. **Verify:** Question order OR option order is different
8. (Note: Randomization may sometimes produce same order by chance)

### Test 6: Delayed Answer Reveal

**Create Quiz with Delayed Answers:**

1. Navigate to `/dashboard/quiz/create`
2. Fill quiz details:
   - Title: "Delayed Answers Test Quiz"
3. Check "Delay showing correct answers until a specific time"
4. Set reveal time to 1 hour from now
5. Add 1 question
6. Check "Publish immediately"
7. Create quiz

**Verify Delayed Answers:**

1. Open and take the quiz
2. Submit quiz
3. **Verify:** Results page does NOT show correct answers (only score)
4. Edit quiz, set reveal time to 1 hour ago
5. View results again (or re-take)
6. **Verify:** Results page DOES show correct answers

## Reporting Results

After tests complete, report:

### Feature Test Results

| Feature | Test | Result | Notes |
|---------|------|--------|-------|
| Timer | Timer visible | [Pass/Fail] | |
| Timer | Countdown works | [Pass/Fail] | |
| Attempt Limit | First attempt | [Pass/Fail] | |
| Attempt Limit | Second attempt | [Pass/Fail] | |
| Attempt Limit | Third blocked | [Pass/Fail] | |
| Availability | Within window | [Pass/Fail] | |
| Availability | After window | [Pass/Fail] | |
| Availability | Before window | [Pass/Fail] | |
| Participant Fields | Fields displayed | [Pass/Fail] | |
| Participant Fields | Validation works | [Pass/Fail] | |
| Participant Fields | Data recorded | [Pass/Fail] | |
| Randomize Questions | Order varies | [Pass/Fail] | |
| Randomize Options | Order varies | [Pass/Fail] | |
| Delayed Answers | Hidden before time | [Pass/Fail] | |
| Delayed Answers | Shown after time | [Pass/Fail] | |

### Issues Found

List any bugs, UX issues, or unexpected behaviors discovered.

## MCP Tools Reference

| Action | Tool |
|--------|------|
| Navigate | `mcp__chrome-devtools__navigate_page` |
| Snapshot | `mcp__chrome-devtools__take_snapshot` |
| Fill field | `mcp__chrome-devtools__fill` |
| Fill form | `mcp__chrome-devtools__fill_form` |
| Click | `mcp__chrome-devtools__click` |
| Wait for text | `mcp__chrome-devtools__wait_for` |
| New page | `mcp__chrome-devtools__new_page` |
| Switch page | `mcp__chrome-devtools__select_page` |
| Close page | `mcp__chrome-devtools__close_page` |

## Notes

- Some tests may need manual verification (e.g., waiting for timer to expire)
- Randomization tests may occasionally show same order by chance
- IP-based attempt limits use the same IP for all browser tests
- Clean up test data after with `/cleanup-test-data`
