# Final Testing Instructions

Complete these tests before submitting to Chrome Web Store.

## 🧪 Pre-Testing Setup

1. **Build the extension**

   ```bash
   npm run build:package
   ```

2. **Load extension in Chrome**

   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist/` folder

3. **Get Monday.com API Key**

   - Go to https://monday.com/monday-api
   - Generate an API token
   - Copy the token

4. **Configure extension**
   - Click the extension icon
   - Enter your API key
   - Click "Save & Test"
   - Verify connection status shows "Connected"

## ✅ Test Scenarios

### 1. Basic Functionality

**Test**: Hover over a task row

- [ ] Tooltip appears after 500ms hover
- [ ] Tooltip shows task name in header
- [ ] Tooltip shows notes (if available)
- [ ] Tooltip positions correctly (not off-screen)
- [ ] Tooltip stays visible when moving cursor from task to tooltip

**Expected**: Tooltip appears smoothly with fade-in animation

---

### 2. Empty State

**Test**: Hover over a task with no notes

- [ ] Tooltip does NOT appear (as designed)
- [ ] No errors in console

**Expected**: No tooltip shown for tasks without notes

---

### 3. Search Functionality

**Test**: Hover over task with notes, then search

- [ ] Search input is visible and focused
- [ ] Type in search box - results filter in real-time
- [ ] Matching text is highlighted
- [ ] "Clear" button appears when typing
- [ ] Clear button clears search and shows all notes
- [ ] Search works across content, author, and timestamps

**Expected**: Smooth search with 150ms debounce, highlighting works

---

### 4. Many Notes

**Test**: Hover over task with 10+ notes

- [ ] All notes are displayed
- [ ] Tooltip content is scrollable
- [ ] Scrollbar appears when needed
- [ ] Scrolling is smooth

**Expected**: Scrollable tooltip with all notes visible

---

### 5. Tooltip Positioning

**Test**: Hover over tasks in different positions

- [ ] Top of page - tooltip appears below
- [ ] Bottom of page - tooltip appears above
- [ ] Right edge - tooltip appears to the left
- [ ] Left edge - tooltip appears to the right
- [ ] Middle of page - tooltip appears near cursor

**Expected**: Tooltip always stays in viewport

---

### 6. Multiple Hovers

**Test**: Quickly hover over multiple tasks

- [ ] Previous tooltip hides when hovering new task
- [ ] New tooltip appears for new task
- [ ] No duplicate tooltips
- [ ] No memory leaks (check Chrome Task Manager)

**Expected**: Only one tooltip at a time, smooth transitions

---

### 7. Error Handling

**Test**: Invalid API key

- [ ] Enter invalid API key in settings
- [ ] Error message appears
- [ ] Error message is user-friendly
- [ ] "Retry" or "Open Settings" button works

**Test**: Network error (disconnect internet)

- [ ] Hover over task
- [ ] Error message appears in tooltip
- [ ] Error message suggests checking connection
- [ ] Retry button works when connection restored

**Expected**: Graceful error handling with actionable messages

---

### 8. Extension Reload

**Test**: Reload extension while tooltip is showing

- [ ] Reload extension in chrome://extensions/
- [ ] Tooltip handles gracefully (shows mock data or error)
- [ ] No console errors
- [ ] Extension continues working after reload

**Expected**: Extension handles reloads without crashing

---

### 9. Page Navigation

**Test**: Navigate between Monday.com pages

- [ ] Go to different board
- [ ] Extension still works
- [ ] Hover listeners attach to new rows
- [ ] No errors in console

**Expected**: Extension works across all Monday.com pages

---

### 10. Settings Page

**Test**: Settings functionality

- [ ] Open settings (click extension icon)
- [ ] Enter API key
- [ ] Click "Save & Test"
- [ ] Connection status updates
- [ ] API key is saved (reload extension, verify it's still there)
- [ ] Toggle password visibility works
- [ ] Help link opens Monday.com API page

**Expected**: Settings page works correctly, API key persists

---

### 11. Performance

**Test**: Performance checks

- [ ] Open Chrome DevTools > Performance
- [ ] Record while hovering over multiple tasks
- [ ] Check for memory leaks
- [ ] Check for excessive CPU usage
- [ ] Verify cache is working (check Network tab - should see cached responses)

**Expected**: Low memory usage, efficient caching

---

### 12. Different Board Views

**Test**: Test on different Monday.com views

- [ ] Table view
- [ ] Kanban view
- [ ] Timeline view
- [ ] Calendar view (if applicable)

**Expected**: Extension works on all views

---

### 13. Browser Compatibility

**Test**: Test on different Chrome versions (if possible)

- [ ] Latest Chrome version
- [ ] Chrome 100+ (Manifest V3 support)
- [ ] Check for console errors

**Expected**: Works on all supported Chrome versions

---

### 14. Edge Cases

**Test**: Special characters in notes

- [ ] Notes with emojis
- [ ] Notes with special characters (@, #, $, etc.)
- [ ] Notes with HTML-like content
- [ ] Very long notes (1000+ characters)

**Expected**: All content displays correctly, no XSS issues

---

### 15. Cache Behavior

**Test**: Cache functionality

- [ ] Hover over same task twice
- [ ] Second hover should be faster (cached)
- [ ] Wait 5+ minutes, hover again
- [ ] Should fetch fresh data (cache expired)

**Expected**: Cache works correctly, expires after 5 minutes

---

## 🐛 Common Issues to Check

1. **Tooltip not appearing**

   - Check console for errors
   - Verify API key is set
   - Check if task has notes
   - Verify selectors match Monday.com structure

2. **Tooltip positioning issues**

   - Check viewport size
   - Verify tooltip offset calculation
   - Test on different screen sizes

3. **Search not working**

   - Check if search input is focused
   - Verify debounce is working
   - Check for JavaScript errors

4. **API errors**
   - Verify API key is valid
   - Check network connection
   - Verify Monday.com API is accessible
   - Check rate limiting

## 📊 Performance Benchmarks

Target metrics:

- **Tooltip appearance**: < 600ms (including API call)
- **Search response**: < 200ms (with debounce)
- **Memory usage**: < 50MB
- **Cache hit rate**: > 60% (after initial load)

## ✅ Final Checklist

Before submitting:

- [ ] All test scenarios pass
- [ ] No console errors in normal operation
- [ ] Performance metrics are acceptable
- [ ] Extension works after Chrome restart
- [ ] Extension works after page reload
- [ ] All edge cases handled
- [ ] Error messages are user-friendly
- [ ] UI is polished and matches Monday.com design

## 🚀 Ready for Submission

If all tests pass, you're ready to:

1. Run `npm run build:package`
2. Review `PRE_SUBMISSION_CHECKLIST.md`
3. Upload `monday-quick-peek.zip` to Chrome Web Store

---

**Good luck with your submission! 🎉**
