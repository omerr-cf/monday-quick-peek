# Local Testing Guide - Monday Quick Peek

Complete guide for testing and debugging the Monday Quick Peek extension.

---

## Table of Contents

1. [Loading Extension in Chrome](#loading-extension-in-chrome)
2. [Setting Up Monday.com Account](#setting-up-mondaycom-account)
3. [Testing the Extension](#testing-the-extension)
4. [Debugging Tooltip Issues](#debugging-tooltip-issues)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Hot Reload During Development](#hot-reload-during-development)
7. [Testing Checklist](#testing-checklist)

---

## Loading Extension in Chrome

### Step-by-Step Instructions

1. **Open Chrome Extensions Page**

   - Navigate to `chrome://extensions`
   - Or: Menu (⋮) → Extensions → Manage extensions

2. **Enable Developer Mode**

   - Toggle "Developer mode" switch (top-right)
   - This enables loading unpacked extensions

3. **Load the Extension**

   - Click "Load unpacked"
   - Select the `monday-quick-peek` folder (the one with `manifest.json`)
   - Extension should appear in the list

4. **Verify Extension Loaded**
   - Check for extension icon in Chrome toolbar
   - Status should show "Enabled"
   - No red error messages

---

## Setting Up Monday.com Account

### 1. Create Free Monday.com Account

1. Go to [monday.com](https://monday.com)
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Complete onboarding

### 2. Get API Key

1. **Navigate to Developer Settings**

   - Click profile picture (top-right) → "Admin"
   - Go to "Developers" section
   - Or visit: https://auth.monday.com/users/sign_in_new

2. **Generate API Token**

   - Click "Generate new token" or "API Token"
   - Name it (e.g., "Quick Peek Extension")
   - **Copy the token immediately** (you won't see it again)
   - Save it securely

3. **API Key Format**
   - Monday.com API keys are JWT tokens
   - Format: `eyJhbGci...` (long string with dots)
   - Should be 100+ characters long

### 3. Create Test Board

1. **Create New Board**

   - Click "+" → "Board"
   - Name it "Test Board"
   - Choose a template

2. **Add Sample Tasks**

   - Add 3-5 tasks with descriptive names
   - Examples: "Implement authentication", "Design dashboard"

3. **Add Notes to Tasks**
   - Click on a task to open it
   - Scroll to "Updates" section
   - Add multiple notes/updates
   - Add notes from different users if possible

---

## Testing the Extension

### 1. Configure API Key

1. **Open Extension Settings**

   - Click extension icon in Chrome toolbar
   - Or: Right-click icon → "Options"

2. **Enter API Key**

   - Paste your Monday.com API key (JWT token)
   - Click "Save & Test"
   - Wait for validation

3. **Verify Connection**
   - Status should show "Connected" (green)
   - If error, check API key format

### 2. Test Hover Functionality

1. **Navigate to Monday.com Board**

   - Go to your test board
   - Make sure you're on a board view (Table/Kanban)

2. **Hover Over Task Rows**

   - Move mouse over a task row
   - Wait 500ms (hover delay)
   - Tooltip should appear

3. **Verify Tooltip**
   - Task name in header (purple gradient)
   - Notes displayed below
   - Author names and photos
   - Relative timestamps

---

## Debugging Tooltip Issues

### If Tooltip Doesn't Appear

Follow these debugging steps:

#### Step 1: Check Console for Errors

1. **Open Developer Tools**

   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Or: Right-click → "Inspect"

2. **Check Console Tab**

   - Look for "Monday Quick Peek" messages
   - Check for red error messages
   - Look for these key messages:
     ```
     Monday Quick Peek: Content script loaded
     Monday Quick Peek: Extension initialized successfully
     Monday Quick Peek: Found X task rows using selector: ...
     Monday Quick Peek: Attached hover listeners to X task rows
     ```

3. **Common Console Messages to Look For:**
   - ✅ `Content script loaded` - Script is running
   - ✅ `Found X task rows` - Rows detected
   - ✅ `Attached hover listeners` - Listeners attached
   - ❌ `No task rows found` - Selectors not matching
   - ❌ `Error: ...` - Something is broken

#### Step 2: Check if Task Rows Are Detected

1. **Open Console**
2. **Run this command:**

   ```javascript
   // Check what selectors find
   document.querySelectorAll(".board-row").length;
   document.querySelectorAll('[data-testid*="board-row"]').length;
   document.querySelectorAll('[class*="boardRow"]').length;
   ```

3. **Expected Results:**
   - Should return number > 0
   - If all return 0, Monday.com structure changed

#### Step 3: Check Monday.com DOM Structure

1. **Inspect a Task Row**

   - Right-click on a task row
   - Select "Inspect"
   - Look at the HTML structure

2. **Find the Row Element**

   - Look for classes like: `board-row`, `BoardRow`, `item-row`
   - Check for data attributes: `data-testid`, `data-item-id`

3. **Update Selectors if Needed**
   - If structure is different, update `CONFIG.selectors` in `content.js`
   - Add new selectors that match Monday.com's current structure

#### Step 4: Check Extension Initialization

1. **In Console, Check:**

   ```javascript
   // Check if tooltip element exists
   document.getElementById("quick-peek-tooltip");

   // Check if extension is initialized
   // (This won't work directly, but check console logs)
   ```

2. **Look for Initialization Messages:**
   - Should see: "Extension initialized successfully"
   - Should see: "MutationObserver set up"

#### Step 5: Test Hover Manually

1. **In Console, Try:**

   ```javascript
   // Find a row
   const row = document.querySelector(".board-row");

   // Trigger hover event manually
   row.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

   // Check if tooltip appears
   setTimeout(() => {
     const tooltip = document.getElementById("quick-peek-tooltip");
     console.log("Tooltip:", tooltip);
     console.log("Display:", tooltip?.style.display);
   }, 600);
   ```

#### Step 6: Check for CSS Conflicts

1. **Inspect Tooltip Element**

   - If tooltip exists but not visible:
   - Check `display` style (should be "block")
   - Check `z-index` (should be 999999)
   - Check for CSS conflicts

2. **In Console:**
   ```javascript
   const tooltip = document.getElementById("quick-peek-tooltip");
   if (tooltip) {
     console.log("Display:", window.getComputedStyle(tooltip).display);
     console.log("Z-index:", window.getComputedStyle(tooltip).zIndex);
     console.log("Visibility:", window.getComputedStyle(tooltip).visibility);
   }
   ```

#### Step 7: Check API Calls

1. **Open Network Tab**

   - In DevTools, go to "Network" tab
   - Filter by "Fetch/XHR"

2. **Hover Over Task**

   - Hover over a task row
   - Look for API calls to `api.monday.com`

3. **Check API Response**
   - Click on the request
   - Check "Response" tab
   - Verify data structure

#### Step 8: Check Task ID Extraction

The extension needs to extract the task ID from the row. Check if this works:

```javascript
// In console, on a task row
const row = document.querySelector(".board-row");
// Check for ID in various places
console.log("Dataset:", row.dataset);
console.log("ID attribute:", row.id);
console.log("Data-item-id:", row.getAttribute("data-item-id"));
```

---

## Common Issues & Solutions

### Issue: Tooltip Not Appearing

**Possible Causes:**

1. Selectors don't match Monday.com structure
2. Extension not initialized
3. JavaScript errors preventing execution
4. CSS conflicts hiding tooltip
5. Task ID not being extracted

**Solutions:**

1. Check console for errors
2. Verify selectors match current Monday.com DOM
3. Check if rows are being found
4. Verify extension is enabled
5. Try reloading extension and page

### Issue: "No task rows found"

**Cause:** Selectors don't match Monday.com's current structure

**Solution:**

1. Inspect a task row in DevTools
2. Find the actual class/attribute names
3. Update `CONFIG.selectors.boardRow` in `content.js`
4. Add new selectors that match

**Example:**

```javascript
selectors: {
  boardRow: '.board-row, .new-class-name, [data-new-attribute]',
  // Add more selectors as needed
}
```

### Issue: Tooltip Appears But Is Empty

**Possible Causes:**

1. API key not configured
2. API calls failing
3. Task has no notes
4. Data formatting issue

**Solutions:**

1. Check API key in settings
2. Check Network tab for API errors
3. Verify task has notes/updates
4. Check console for API response

### Issue: Extension Not Loading

**Solutions:**

1. Check `manifest.json` syntax
2. Verify all file paths exist
3. Check for missing icon files
4. Look for errors in `chrome://extensions`

### Issue: API Calls Failing

**Solutions:**

1. Verify API key is correct (JWT token format)
2. Check API key has proper permissions
3. Test API key in Monday.com API playground
4. Check Network tab for error responses

---

## Hot Reload During Development

### Quick Reload Process

1. **Make Code Changes**

   - Edit files in your editor
   - Save changes

2. **Reload Extension**

   - Go to `chrome://extensions`
   - Find "Monday Quick Peek"
   - Click reload icon (🔄)

3. **Reload Monday.com Page**

   - Refresh the page (F5 or Cmd+R)
   - Or: Hard refresh (Cmd+Shift+R)

4. **Test Changes**
   - Hover over task rows
   - Check console for new logs

---

## Testing Checklist

### Basic Functionality

- [ ] Extension loads without errors
- [ ] Extension icon appears in toolbar
- [ ] Settings popup opens
- [ ] API key can be saved
- [ ] API key validation works

### Hover Detection

- [ ] Console shows "Content script loaded"
- [ ] Console shows "Found X task rows"
- [ ] Console shows "Attached hover listeners"
- [ ] Hover triggers tooltip (after 500ms)
- [ ] Tooltip appears near cursor
- [ ] Tooltip disappears on mouse leave

### Tooltip Display

- [ ] Task name appears in header
- [ ] Notes are displayed
- [ ] Author names show
- [ ] Timestamps show
- [ ] Empty state works (no notes)

### Search Functionality

- [ ] Search input appears
- [ ] Typing filters notes
- [ ] Highlights work
- [ ] Clear button works

### Error Handling

- [ ] Invalid API key shows error
- [ ] Network errors show error
- [ ] Error messages are clear

---

## Quick Debugging Commands

### In Browser Console (on Monday.com page)

```javascript
// Check if extension script loaded
// Look for console messages starting with "Monday Quick Peek"

// Check if rows are found
document.querySelectorAll(".board-row").length;

// Check if tooltip element exists
document.getElementById("quick-peek-tooltip");

// Manually trigger hover
const row = document.querySelector(".board-row");
row.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

// Check extension state
// (Check console logs for initialization messages)
```

### Check Extension Files

```bash
# Verify all files exist
ls -la scripts/content.js
ls -la scripts/background.js
ls -la styles/content.css
ls -la icons/icon*.png

# Check manifest syntax
cat manifest.json | python -m json.tool
```

---

## Getting Help

If tooltips still don't appear:

1. **Check Console Logs**

   - Copy all "Monday Quick Peek" messages
   - Copy any error messages

2. **Check Network Tab**

   - Look for API calls
   - Check response status codes

3. **Inspect Monday.com Structure**

   - Right-click task row → Inspect
   - Note the actual class names
   - Share the HTML structure

4. **Verify Extension State**
   - Check if extension is enabled
   - Check for errors in `chrome://extensions`
   - Try disabling/re-enabling extension

---

**Happy Testing! 🚀**
