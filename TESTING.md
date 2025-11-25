# Local Testing Guide - Monday Quick Peek

This guide will help you test the Monday Quick Peek extension locally in Chrome.

---

## Table of Contents

1. [Loading Extension in Chrome](#loading-extension-in-chrome)
2. [Setting Up Monday.com Account](#setting-up-mondaycom-account)
3. [Testing the Extension](#testing-the-extension)
4. [Debugging Tips](#debugging-tips)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Hot Reload During Development](#hot-reload-during-development)
7. [Testing Checklist](#testing-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Loading Extension in Chrome

### Step-by-Step Instructions

1. **Open Chrome Extensions Page**

   - Open Google Chrome
   - Navigate to `chrome://extensions`
   - Or: Menu (⋮) → Extensions → Manage extensions

2. **Enable Developer Mode**

   - Toggle "Developer mode" switch in the top-right corner
   - This enables loading unpacked extensions

3. **Load the Extension**

   - Click "Load unpacked" button
   - Navigate to the `monday-quick-peek` folder
   - Select the folder and click "Select Folder" (or "Open" on Windows)

4. **Verify Extension Loaded**

   - The extension should appear in the extensions list
   - Check for the extension icon in the Chrome toolbar
   - Status should show "Enabled"

5. **Check for Errors**
   - Look for any red error messages
   - Click "Errors" button if present to see details
   - Fix any issues before proceeding

### Visual Guide

```
Chrome Extensions Page:
┌─────────────────────────────────────────┐
│  Extensions  [Developer mode: ON]      │
├─────────────────────────────────────────┤
│  [Load unpacked]                        │
│                                         │
│  Monday Quick Peek                      │
│  Version 1.0.0                         │
│  [Details] [Remove] [Reload]           │
│  ✓ Enabled                             │
└─────────────────────────────────────────┘
```

---

## Setting Up Monday.com Account

### 1. Create Free Monday.com Account

1. Go to [monday.com](https://monday.com)
2. Click "Get Started" or "Sign Up"
3. Create a free account (no credit card required)
4. Complete the onboarding process

### 2. Get API Key

1. **Navigate to Developer Settings**

   - Click your profile picture (top-right)
   - Select "Admin" or "Account"
   - Go to "Developers" section
   - Or directly visit: https://auth.monday.com/users/sign_in_new

2. **Generate API Token**

   - Click "Generate new token" or "API Token"
   - Give it a name (e.g., "Quick Peek Extension")
   - Copy the token immediately (you won't see it again)
   - Save it securely

3. **Verify Token Format**
   - API tokens are typically long alphanumeric strings
   - Should be at least 20+ characters
   - Example format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Create Test Board

1. **Create New Board**

   - Click "+" button or "Add" → "Board"
   - Name it "Test Board" or "Quick Peek Testing"
   - Choose a board template (e.g., "Project Management")

2. **Add Sample Tasks**

   - Add at least 3-5 tasks with different names
   - Use descriptive names like:
     - "Implement user authentication"
     - "Design new dashboard"
     - "Write documentation"

3. **Add Notes to Tasks**

   - Click on a task to open it
   - Scroll to "Updates" section
   - Add multiple notes/updates:
     - "Started working on this task"
     - "Completed first phase"
     - "Need to review with team"
   - Add notes from different users if possible

4. **Test Data Scenarios**
   - Create a task with no notes (empty state test)
   - Create a task with many notes (10+ notes)
   - Create a task with long note content
   - Create a task with special characters in notes

---

## Testing the Extension

### 1. Configure API Key

1. **Open Extension Settings**

   - Click the extension icon in Chrome toolbar
   - Or: Right-click icon → "Options"

2. **Enter API Key**

   - Paste your Monday.com API key
   - Click "Save & Test"
   - Wait for validation (should show "Connected")

3. **Verify Connection**
   - Status indicator should turn green
   - Should show "Connected" message
   - If error, check API key format

### 2. Test Hover Functionality

1. **Navigate to Monday.com Board**

   - Go to your test board
   - Make sure you're on a board view (not item detail)

2. **Hover Over Task Rows**

   - Move mouse over a task row
   - Wait 500ms (hover delay)
   - Tooltip should appear

3. **Verify Tooltip Content**

   - Task name appears in header (purple gradient)
   - Notes are displayed below
   - Each note shows:
     - Author name and photo
     - Relative timestamp ("2 hours ago")
     - Note content

4. **Test Tooltip Positioning**
   - Hover near screen edges
   - Tooltip should reposition to stay visible
   - Tooltip should follow cursor movement

### 3. Test Search Functionality

1. **Open Tooltip**

   - Hover over task with multiple notes
   - Tooltip should appear

2. **Use Search Input**

   - Type in search box (should auto-focus)
   - Search for text that appears in notes
   - Verify notes filter in real-time

3. **Test Search Features**

   - Search highlights matching text (yellow)
   - Results count shows "X of Y notes"
   - Clear button (×) appears when typing
   - Empty state shows when no matches

4. **Test Edge Cases**
   - Search for non-existent text
   - Search with special characters
   - Clear search and verify all notes return

### 4. Test Error Handling

1. **Invalid API Key**

   - Enter invalid API key in settings
   - Hover over task
   - Should show error message with "Open Settings" button

2. **Network Error**

   - Disconnect internet
   - Hover over task
   - Should show network error with retry option

3. **Task Not Found**
   - Hover over deleted/non-existent task
   - Should show "Task not found" error

---

## Debugging Tips

### 1. Open Developer Tools

**Keyboard Shortcut:**

- `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)

**Or:**

- Right-click on page → "Inspect"
- Menu → More Tools → Developer Tools

### 2. Check Console for Errors

1. **Open Console Tab**

   - Look for red error messages
   - Check for extension-related errors
   - Look for "Monday Quick Peek" log messages

2. **Common Console Messages**

   ```
   Monday Quick Peek: Content script loaded
   Monday Quick Peek: Extension initialized successfully
   Monday Quick Peek: Tooltip displayed
   ```

3. **Error Patterns to Look For**
   - `Failed to fetch` - Network/API issues
   - `Invalid API key` - Authentication problems
   - `Cannot read property` - JavaScript errors
   - `Uncaught TypeError` - Code issues

### 3. Check Network Tab

1. **Open Network Tab in DevTools**

   - Filter by "Fetch/XHR"
   - Look for requests to `api.monday.com`

2. **Verify API Calls**

   - Should see POST requests to `https://api.monday.com/v2`
   - Check request headers (Authorization, API-Version)
   - Check response status (200 = success, 401 = auth error, 429 = rate limit)

3. **Inspect API Responses**
   - Click on request → "Response" tab
   - Verify data structure matches expected format
   - Check for GraphQL errors

### 4. Inspect Tooltip Element

1. **Inspect Tooltip**

   - Right-click on tooltip → "Inspect"
   - Or: Use element picker (Ctrl+Shift+C)

2. **Check Element Structure**

   - Should have ID: `quick-peek-tooltip`
   - Should have class: `monday-quick-peek-tooltip`
   - Check for error classes: `error-state`

3. **Check Styles**
   - Verify CSS is loaded
   - Check computed styles
   - Look for missing styles or conflicts

### 5. Use Console.log() for Debugging

Add temporary logging in code:

```javascript
// In content.js
console.log("Monday Quick Peek: Hover detected", row);
console.log("Monday Quick Peek: API response", response);
console.log("Monday Quick Peek: Tooltip content", content);
```

**View Logs:**

- Open Console tab
- Filter by "Monday Quick Peek"
- See step-by-step execution

### 6. Check Extension Background Script

1. **Open Extension Service Worker**

   - Go to `chrome://extensions`
   - Find "Monday Quick Peek"
   - Click "service worker" link (if available)
   - Or: Right-click extension → "Inspect popup" → "Background page"

2. **Check Background Logs**
   - Look for API call logs
   - Check for storage operations
   - Verify message passing

---

## Common Issues & Solutions

| Issue                          | Symptoms                          | Solution                                                                                |
| ------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------- |
| **Extension not loading**      | Red error in extensions page      | Check `manifest.json` syntax, verify all file paths exist                               |
| **Tooltip not appearing**      | No tooltip on hover               | Check console for errors, verify hover detection selectors, check z-index               |
| **API calls failing**          | Network errors, 401/403 responses | Verify API key is correct, check API key permissions, test API key in Postman           |
| **Styling broken**             | Tooltip looks wrong, no colors    | Check CSS file path in manifest, verify CSS is loaded, check for conflicts              |
| **Search not working**         | Search input doesn't filter       | Check JavaScript console, verify event listeners attached, check debounce timing        |
| **Tooltip positioning wrong**  | Tooltip off-screen or overlapping | Check positioning logic, verify viewport calculations, test at different screen sizes   |
| **Settings not saving**        | API key doesn't persist           | Check Chrome storage permissions, verify storage.js is working, check quota             |
| **Extension crashes**          | Extension stops working           | Check console for errors, verify all dependencies loaded, check for infinite loops      |
| **Icons not showing**          | Extension icon missing            | Verify icon files exist in `icons/` folder, check manifest.json paths, regenerate icons |
| **Content script not running** | No console logs from extension    | Check manifest matches, verify content script is injected, reload extension             |

### Detailed Solutions

#### Extension Not Loading

**Check:**

1. `manifest.json` syntax is valid JSON
2. All file paths in manifest exist
3. No typos in file names
4. File permissions are correct

**Fix:**

```bash
# Validate JSON
cat manifest.json | python -m json.tool

# Check file paths
ls -la scripts/background.js
ls -la scripts/content.js
ls -la styles/content.css
```

#### Tooltip Not Appearing

**Check:**

1. Console for JavaScript errors
2. Hover detection selectors match Monday.com DOM
3. Tooltip element is created
4. Z-index is high enough (999999)

**Debug:**

```javascript
// In console on Monday.com page
document.querySelectorAll(".board-row").length; // Should be > 0
document.getElementById("quick-peek-tooltip"); // Should exist
```

#### API Calls Failing

**Check:**

1. API key is valid and active
2. API key has correct permissions
3. Network connectivity
4. Monday.com API status

**Test API Key:**

```bash
# Using curl
curl -X POST https://api.monday.com/v2 \
  -H "Authorization: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ me { id name } }"}'
```

---

## Hot Reload During Development

### Quick Reload Process

1. **Make Code Changes**

   - Edit files in your editor
   - Save changes

2. **Reload Extension**

   - Go to `chrome://extensions`
   - Find "Monday Quick Peek"
   - Click reload icon (circular arrow) 🔄

3. **Reload Monday.com Page**

   - Refresh the Monday.com page (F5 or Cmd+R)
   - Or: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

4. **Test Changes**
   - Hover over task rows
   - Check console for new logs
   - Verify changes work

### Auto-Reload Extension (Advanced)

Install a Chrome extension like "Extensions Reloader" to automatically reload your extension on file changes.

### Development Workflow

```
1. Edit code → Save
2. Reload extension (chrome://extensions)
3. Reload Monday.com page
4. Test changes
5. Check console for errors
6. Repeat
```

### Tips for Faster Development

- Keep DevTools open while developing
- Use console.log() liberally
- Test one feature at a time
- Use breakpoints for complex debugging
- Keep Monday.com page open in one tab
- Keep chrome://extensions open in another tab

---

## Testing Checklist

Use this checklist to ensure all features work correctly:

### Basic Functionality

- [ ] Extension loads without errors in `chrome://extensions`
- [ ] Extension icon appears in Chrome toolbar
- [ ] Settings popup opens when clicking icon
- [ ] API key can be entered and saved
- [ ] API key validation works (shows "Connected" or error)

### Hover Detection

- [ ] Hover over task row triggers tooltip (after 500ms delay)
- [ ] Tooltip appears near cursor/row
- [ ] Tooltip disappears when mouse leaves (after 100ms delay)
- [ ] No flickering when moving between rows
- [ ] Works on different board views (Table, Kanban, etc.)

### Tooltip Display

- [ ] Task name appears in header with purple gradient
- [ ] Notes are displayed correctly
- [ ] Author names and photos show
- [ ] Relative timestamps display ("2 hours ago")
- [ ] Note content is properly formatted
- [ ] Empty state shows when task has no notes
- [ ] Tooltip has proper styling (colors, shadows, borders)

### Tooltip Positioning

- [ ] Tooltip repositions when near right edge
- [ ] Tooltip repositions when near bottom edge
- [ ] Tooltip repositions when near left edge
- [ ] Tooltip repositions when near top edge
- [ ] Tooltip never goes off-screen
- [ ] Tooltip maintains proper spacing

### Search Functionality

- [ ] Search input appears in tooltip
- [ ] Search input auto-focuses when tooltip opens
- [ ] Typing filters notes in real-time (with debounce)
- [ ] Search highlights matching text (yellow)
- [ ] Results count displays ("3 of 12 notes")
- [ ] Clear button (×) appears when typing
- [ ] Clear button removes search and shows all notes
- [ ] Empty search state shows "No notes found"
- [ ] Search is case-insensitive
- [ ] Search works in content, author, and timestamps

### Error Handling

- [ ] Invalid API key shows error message
- [ ] Network error shows error with retry option
- [ ] Rate limit error shows appropriate message
- [ ] Task not found shows error message
- [ ] Error messages auto-dismiss after 5 seconds
- [ ] Error UI has red color scheme
- [ ] Error actions work (Open Settings, Retry, Dismiss)

### Performance

- [ ] Tooltip appears quickly (< 1 second)
- [ ] No lag when hovering rapidly
- [ ] Smooth scrolling with many notes
- [ ] No memory leaks (check task manager)
- [ ] Works with 20+ notes without issues

### Edge Cases

- [ ] Works with tasks that have no notes
- [ ] Works with tasks that have many notes (20+)
- [ ] Works with very long note content
- [ ] Works with special characters in notes
- [ ] Works with missing author data
- [ ] Works with missing author photos
- [ ] Works with very long task names

### Settings & Persistence

- [ ] API key persists after browser restart
- [ ] Settings save correctly
- [ ] Settings load correctly on popup open
- [ ] Connection status updates correctly

### Browser Compatibility

- [ ] Works in Chrome (latest)
- [ ] Works in Chrome Beta
- [ ] Works in Edge (Chromium)
- [ ] No console errors in any browser

### Accessibility

- [ ] Tooltip is keyboard accessible (if applicable)
- [ ] Search input is keyboard accessible
- [ ] Buttons are keyboard accessible
- [ ] Error messages are readable
- [ ] Colors have sufficient contrast

---

## Troubleshooting

### Issue: Extension Icon Not Appearing

**Symptoms:**

- Extension loads but no icon in toolbar

**Solutions:**

1. Check `manifest.json` has correct icon paths
2. Verify icon files exist: `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`
3. Regenerate icons using scripts in `assets/` folder
4. Reload extension after adding icons
5. Check Chrome toolbar is not hidden (right-click toolbar → show extensions)

### Issue: Tooltip Appears But Is Empty

**Symptoms:**

- Tooltip shows but no content

**Solutions:**

1. Check console for API errors
2. Verify API key is valid and has permissions
3. Check Network tab for API calls
4. Verify task has notes/updates
5. Check content.js is formatting data correctly

### Issue: Tooltip Positioning Is Wrong

**Symptoms:**

- Tooltip appears off-screen or in wrong location

**Solutions:**

1. Check `positionTooltip()` function in content.js
2. Verify viewport calculations
3. Test at different screen sizes
4. Check for CSS conflicts
5. Verify tooltip has `position: fixed`

### Issue: Search Not Filtering

**Symptoms:**

- Search input works but notes don't filter

**Solutions:**

1. Check console for JavaScript errors
2. Verify `filterNotes()` function
3. Check event listeners are attached
4. Verify debounce is working (150ms)
5. Check note data structure matches expected format

### Issue: API Key Not Saving

**Symptoms:**

- API key doesn't persist after closing popup

**Solutions:**

1. Check Chrome storage permissions in manifest
2. Verify `storage.js` is working
3. Check storage quota (Chrome sync = 100KB max)
4. Test storage in console:
   ```javascript
   chrome.storage.sync.get("apiKey", (result) => {
     console.log("API Key:", result.apiKey);
   });
   ```

### Issue: Extension Works But Slow

**Symptoms:**

- Tooltip takes long to appear or is laggy

**Solutions:**

1. Check for too many API calls
2. Verify caching is working
3. Check for performance issues in console
4. Reduce hover delay if needed
5. Optimize note rendering

### Getting Help

If you're still experiencing issues:

1. **Check Console Logs**

   - Open DevTools Console
   - Look for error messages
   - Copy error messages for debugging

2. **Check Network Tab**

   - Verify API calls are being made
   - Check response status codes
   - Inspect API responses

3. **Verify Setup**

   - API key is valid
   - Monday.com account is active
   - Test board has notes
   - Extension is enabled

4. **Test in Clean Environment**

   - Disable other extensions
   - Test in incognito mode
   - Clear browser cache

5. **Check Documentation**
   - Review `README.md`
   - Check `TESTING_CHECKLIST.md`
   - Review code comments

---

## Additional Resources

- **Chrome Extension Documentation**: https://developer.chrome.com/docs/extensions/
- **Monday.com API Documentation**: https://developer.monday.com/api-reference/docs
- **Chrome DevTools Guide**: https://developer.chrome.com/docs/devtools/
- **Extension Testing Best Practices**: https://developer.chrome.com/docs/extensions/mv3/testing/

---

## Quick Reference

### Keyboard Shortcuts

- `F12` - Open DevTools
- `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Win/Linux) - Open DevTools
- `Cmd+R` (Mac) / `Ctrl+R` (Win/Linux) - Reload page
- `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Win/Linux) - Hard reload

### Important URLs

- `chrome://extensions` - Extension management
- `chrome://extensions/shortcuts` - Keyboard shortcuts
- `https://auth.monday.com/users/sign_in_new` - Monday.com API tokens
- `https://api.monday.com/v2` - Monday.com API endpoint

### File Locations

- Extension folder: `monday-quick-peek/`
- Manifest: `manifest.json`
- Content script: `scripts/content.js`
- Background script: `scripts/background.js`
- Styles: `styles/content.css`
- Icons: `icons/`

---

**Happy Testing! 🚀**

If you find bugs or have suggestions, please document them and consider contributing improvements.
