# Monday Quick Peek - Testing Checklist

This document provides a comprehensive manual testing checklist for the Monday Quick Peek extension.

## Pre-Testing Setup

- [ ] Load the extension in Chrome (Developer mode)
- [ ] Open Monday.com in a new tab
- [ ] Navigate to a board with multiple tasks
- [ ] Ensure you have API key configured (or test without it)

---

## 1. Hover Detection & Tooltip Display

### Test Case 1.1: Basic Hover Detection

**Objective:** Verify tooltip appears when hovering over task rows

**Steps:**

1. Hover over a task row on Monday.com board
2. Wait 500ms (hover delay)
3. Observe tooltip appearance

**Expected Results:**

- [ ] Tooltip appears after hover delay
- [ ] Tooltip is positioned near the cursor/row
- [ ] Tooltip contains task name in header
- [ ] Tooltip has purple gradient header
- [ ] Tooltip has search input box

**Notes:**

- Tooltip should not appear immediately (respects hover delay)
- Tooltip should follow cursor movement

---

### Test Case 1.2: Tooltip Positioning

**Objective:** Verify tooltip positions correctly near screen edges

**Steps:**

1. Hover over task row near right edge of screen
2. Hover over task row near bottom edge of screen
3. Hover over task row near left edge of screen
4. Hover over task row near top edge of screen

**Expected Results:**

- [ ] Tooltip repositions to stay within viewport
- [ ] Tooltip doesn't go off-screen
- [ ] Tooltip maintains proper spacing from edges

---

### Test Case 1.3: Tooltip Hide on Mouse Leave

**Objective:** Verify tooltip disappears when mouse leaves

**Steps:**

1. Hover over task row to show tooltip
2. Move mouse away from task row
3. Observe tooltip behavior

**Expected Results:**

- [ ] Tooltip disappears after short delay (100ms)
- [ ] Tooltip doesn't flicker when moving between rows
- [ ] Tooltip clears content when hidden

---

## 2. API Key & Settings

### Test Case 2.1: Settings Page Load

**Objective:** Verify settings page displays correctly

**Steps:**

1. Click extension icon in Chrome toolbar
2. Observe settings popup

**Expected Results:**

- [ ] Popup opens with correct width (400px)
- [ ] Header displays "🧠 Monday Quick Peek"
- [ ] Status indicator shows current connection status
- [ ] API key input field is visible
- [ ] Save & Test button is visible
- [ ] Help text and link are displayed

---

### Test Case 2.2: API Key Validation

**Objective:** Verify API key validation works

**Steps:**

1. Open settings popup
2. Enter invalid API key (too short)
3. Click "Save & Test"
4. Enter valid API key format
5. Click "Save & Test"

**Expected Results:**

- [ ] Invalid key shows error message
- [ ] Valid key format triggers API test
- [ ] Loading spinner appears during test
- [ ] Success message shows on valid key
- [ ] Error message shows on invalid key
- [ ] Status indicator updates accordingly

---

### Test Case 2.3: API Key Save & Load

**Objective:** Verify API key persists across sessions

**Steps:**

1. Enter valid API key in settings
2. Click "Save & Test"
3. Close popup
4. Reopen popup

**Expected Results:**

- [ ] API key is saved to Chrome storage
- [ ] API key loads when popup reopens
- [ ] Status indicator shows "Connected" if valid
- [ ] API key persists after browser restart

---

## 3. Tooltip Content Display

### Test Case 3.1: Normal Task with Notes

**Objective:** Verify tooltip displays notes correctly

**Steps:**

1. Hover over task with multiple notes
2. Observe tooltip content

**Expected Results:**

- [ ] Task name appears in header
- [ ] All notes are displayed
- [ ] Each note shows author name and photo
- [ ] Each note shows relative timestamp
- [ ] Note content is properly formatted
- [ ] Notes are scrollable if many

---

### Test Case 3.2: Task with No Notes

**Objective:** Verify empty state handling

**Steps:**

1. Hover over task with no notes
2. Observe tooltip content

**Expected Results:**

- [ ] Task name appears in header
- [ ] Empty state message displays: "No notes available"
- [ ] Empty state icon is visible
- [ ] Search input is still available

---

### Test Case 3.3: Task with Many Notes

**Objective:** Verify performance with many notes

**Steps:**

1. Hover over task with 20+ notes
2. Scroll through notes in tooltip
3. Observe performance

**Expected Results:**

- [ ] All notes load without lag
- [ ] Scrolling is smooth
- [ ] Tooltip doesn't exceed max height (500px)
- [ ] Scrollbar appears when needed
- [ ] No performance issues

---

### Test Case 3.4: Special Characters & HTML

**Objective:** Verify XSS prevention and special character handling

**Steps:**

1. Hover over task with notes containing:
   - HTML tags: `<script>`, `<b>`, etc.
   - Special characters: `&`, `<`, `>`, quotes
   - Emojis and unicode

**Expected Results:**

- [ ] HTML tags are escaped (not executed)
- [ ] Special characters display correctly
- [ ] No XSS vulnerabilities
- [ ] Emojis render properly

---

## 4. Search Functionality

### Test Case 4.1: Basic Search

**Objective:** Verify search filters notes correctly

**Steps:**

1. Hover over task with multiple notes
2. Type search term in search input
3. Observe filtered results

**Expected Results:**

- [ ] Search input is focused automatically
- [ ] Notes filter as you type (with debounce)
- [ ] Matching notes are highlighted
- [ ] Results count displays: "X of Y notes"
- [ ] Search is case-insensitive

---

### Test Case 4.2: Search Highlighting

**Objective:** Verify search matches are highlighted

**Steps:**

1. Search for text that appears in multiple notes
2. Observe highlighting

**Expected Results:**

- [ ] Matching text is wrapped in `<mark>` tags
- [ ] Highlights are yellow/visible
- [ ] Multiple matches per note are highlighted
- [ ] Highlights appear in content, author, and timestamp

---

### Test Case 4.3: Search Empty State

**Objective:** Verify empty search results

**Steps:**

1. Search for text that doesn't exist in notes
2. Observe empty state

**Expected Results:**

- [ ] "No notes found" message displays
- [ ] Empty state icon is visible
- [ ] Helpful message: "Try a different search term"
- [ ] Clear button is available

---

### Test Case 4.4: Search Clear Button

**Objective:** Verify clear button functionality

**Steps:**

1. Enter search term
2. Click clear button (×)
3. Observe behavior

**Expected Results:**

- [ ] Clear button appears when text is entered
- [ ] Clear button removes search term
- [ ] All notes are displayed after clearing
- [ ] Search input is focused after clearing

---

### Test Case 4.5: Search Debouncing

**Objective:** Verify search debouncing works

**Steps:**

1. Type quickly in search input
2. Observe API calls/renders

**Expected Results:**

- [ ] Search debounces (150ms delay)
- [ ] Not too many re-renders
- [ ] Smooth typing experience
- [ ] Results update after typing stops

---

## 5. Error Handling

### Test Case 5.1: Invalid API Key Error

**Objective:** Verify error handling for invalid API key

**Steps:**

1. Set invalid API key in settings
2. Hover over task row
3. Observe error display

**Expected Results:**

- [ ] Error message displays in tooltip
- [ ] Error has red color scheme
- [ ] Warning icon is visible
- [ ] "Open Settings" button is available
- [ ] Error auto-dismisses after 5 seconds

---

### Test Case 5.2: Network Error

**Objective:** Verify network error handling

**Steps:**

1. Disconnect internet
2. Hover over task row
3. Observe error display

**Expected Results:**

- [ ] Network error message displays
- [ ] Retry button is available
- [ ] Error is retryable
- [ ] Retry uses exponential backoff

---

### Test Case 5.3: Rate Limiting Error

**Objective:** Verify rate limiting handling

**Steps:**

1. Make many rapid hover requests
2. Observe rate limit error

**Expected Results:**

- [ ] Rate limit error message displays
- [ ] Error indicates wait time
- [ ] Retry logic activates
- [ ] Backoff delay is applied

---

### Test Case 5.4: Task Not Found Error

**Objective:** Verify 404 error handling

**Steps:**

1. Hover over deleted/non-existent task
2. Observe error display

**Expected Results:**

- [ ] "Task not found" message displays
- [ ] Error is clear and actionable
- [ ] Dismiss button is available

---

## 6. Performance & Edge Cases

### Test Case 6.1: Rapid Hovering

**Objective:** Verify performance with rapid hover actions

**Steps:**

1. Quickly hover over multiple task rows
2. Observe tooltip behavior

**Expected Results:**

- [ ] No flickering
- [ ] Tooltip updates smoothly
- [ ] No memory leaks
- [ ] Previous tooltips are cleaned up

---

### Test Case 6.2: Long Task Names

**Objective:** Verify handling of very long task names

**Steps:**

1. Hover over task with very long name (100+ characters)
2. Observe tooltip header

**Expected Results:**

- [ ] Long name is truncated or wrapped
- [ ] Tooltip doesn't break layout
- [ ] Full name is accessible (tooltip or scroll)

---

### Test Case 6.3: Missing Author Data

**Objective:** Verify handling of missing creator info

**Steps:**

1. Hover over task with notes from deleted users
2. Observe note display

**Expected Results:**

- [ ] Fallback to "Unknown" author
- [ ] Missing photos don't break layout
- [ ] Notes still display correctly

---

### Test Case 6.4: Very Long Notes

**Objective:** Verify handling of extremely long note content

**Steps:**

1. Hover over task with very long note (1000+ words)
2. Observe tooltip

**Expected Results:**

- [ ] Note content is scrollable
- [ ] Tooltip doesn't exceed max height
- [ ] Performance remains good
- [ ] Text is readable

---

## 7. Responsive Design

### Test Case 7.1: Small Screen

**Objective:** Verify tooltip on small screens

**Steps:**

1. Resize browser to mobile size (375px width)
2. Hover over task row
3. Observe tooltip

**Expected Results:**

- [ ] Tooltip scales down appropriately
- [ ] Tooltip fits within viewport
- [ ] Text remains readable
- [ ] Buttons are clickable

---

### Test Case 7.2: Different Zoom Levels

**Objective:** Verify tooltip at various zoom levels

**Steps:**

1. Set browser zoom to 50%, 75%, 125%, 150%
2. Hover over task row
3. Observe tooltip

**Expected Results:**

- [ ] Tooltip scales with zoom
- [ ] Layout doesn't break
- [ ] Text remains readable

---

## 8. Integration Testing

### Test Case 8.1: Multiple Tabs

**Objective:** Verify extension works across multiple tabs

**Steps:**

1. Open multiple Monday.com tabs
2. Hover over tasks in different tabs
3. Observe behavior

**Expected Results:**

- [ ] Each tab has independent tooltips
- [ ] No conflicts between tabs
- [ ] Settings sync across tabs

---

### Test Case 8.2: Page Navigation

**Objective:** Verify extension works after page navigation

**Steps:**

1. Navigate to different board
2. Hover over task rows
3. Observe behavior

**Expected Results:**

- [ ] Extension re-initializes after navigation
- [ ] Tooltips work on new page
- [ ] No errors in console

---

## 9. Accessibility

### Test Case 9.1: Keyboard Navigation

**Objective:** Verify keyboard accessibility

**Steps:**

1. Use Tab to navigate to task rows
2. Use Enter/Space to trigger tooltip
3. Navigate tooltip with keyboard

**Expected Results:**

- [ ] Tooltip can be triggered with keyboard
- [ ] Search input is keyboard accessible
- [ ] Buttons are keyboard accessible
- [ ] Focus indicators are visible

---

### Test Case 9.2: Screen Reader

**Objective:** Verify screen reader compatibility

**Steps:**

1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate tooltip
3. Listen to announcements

**Expected Results:**

- [ ] Tooltip content is announced
- [ ] Buttons have proper labels
- [ ] Search input has proper label
- [ ] Error messages are announced

---

## 10. Browser Compatibility

### Test Case 10.1: Chrome

**Objective:** Verify Chrome compatibility

**Steps:**

1. Test in latest Chrome
2. Test in Chrome Beta
3. Test in Chrome Dev

**Expected Results:**

- [ ] Works in all Chrome versions
- [ ] No console errors
- [ ] All features functional

---

### Test Case 10.2: Edge (Chromium)

**Objective:** Verify Edge compatibility

**Steps:**

1. Load extension in Edge
2. Test all features

**Expected Results:**

- [ ] Extension loads correctly
- [ ] All features work
- [ ] No compatibility issues

---

## Test Results Summary

After completing all test cases, document:

- **Total Test Cases:** \_\_\_
- **Passed:** \_\_\_
- **Failed:** \_\_\_
- **Blocked:** \_\_\_
- **Notes:** \_\_\_

---

## Known Issues

Document any issues found during testing:

1. **Issue:** [Description]
   - **Severity:** [Critical/High/Medium/Low]
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]

---

## Test Environment

- **Browser:** Chrome Version \_\_\_
- **Extension Version:** 1.0.0
- **Monday.com URL:** \_\_\_
- **Date:** \_\_\_
- **Tester:** \_\_\_

---

## Notes

Add any additional notes or observations during testing:

- ***
- ***
- ***
