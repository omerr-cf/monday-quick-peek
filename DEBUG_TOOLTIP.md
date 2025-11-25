# Debug Tooltip Not Appearing

## Quick Debugging Steps

### Step 1: Open Console and Check Logs

1. Go to Monday.com board page
2. Press `F12` to open DevTools
3. Go to "Console" tab
4. Look for messages starting with "Monday Quick Peek"

**What to look for:**

- ✅ `Monday Quick Peek: Content script loaded`
- ✅ `Monday Quick Peek: Extension initialized successfully`
- ✅ `Monday Quick Peek: Found X task rows using selector: ...`
- ✅ `Monday Quick Peek: Attached hover listeners to X task rows`

**If you see:**

- ❌ `Monday Quick Peek: No task rows found` → Selectors don't match
- ❌ No messages at all → Extension not running
- ❌ Red errors → JavaScript errors

### Step 2: Check if Rows Are Found

**In Console, run:**

```javascript
// Try different selectors
console.log(".board-row:", document.querySelectorAll(".board-row").length);
console.log(
  '[data-testid*="board-row"]:',
  document.querySelectorAll('[data-testid*="board-row"]').length
);
console.log(
  '[class*="boardRow"]:',
  document.querySelectorAll('[class*="boardRow"]').length
);
console.log(
  '[class*="BoardRow"]:',
  document.querySelectorAll('[class*="BoardRow"]').length
);
```

**Expected:** At least one should return > 0

### Step 3: Find the Correct Selector

1. **Right-click on a task row** → "Inspect"
2. **Look at the HTML structure**
3. **Find the main row element** (usually a `<div>` or `<tr>`)
4. **Note the class names and attributes**

**Common Monday.com selectors:**

- `.board-row`
- `.BoardRow`
- `[data-item-id]`
- `[data-testid*="row"]`
- `.item-row`

### Step 4: Test Hover Manually

**In Console:**

```javascript
// Find a row (try different selectors)
const row =
  document.querySelector(".board-row") ||
  document.querySelector("[data-item-id]") ||
  document.querySelector('[class*="row"]');

if (row) {
  console.log("Found row:", row);

  // Trigger hover
  row.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

  // Check tooltip after delay
  setTimeout(() => {
    const tooltip = document.getElementById("quick-peek-tooltip");
    if (tooltip) {
      console.log("Tooltip found!", tooltip);
      console.log("Display:", tooltip.style.display);
      console.log("Visible:", tooltip.offsetParent !== null);
    } else {
      console.log("Tooltip not found");
    }
  }, 600);
} else {
  console.log("No row found - selectors need updating");
}
```

### Step 5: Check Extension Initialization

**In Console:**

```javascript
// Check if tooltip element exists
const tooltip = document.getElementById("quick-peek-tooltip");
console.log("Tooltip element:", tooltip);

// Check if extension is attached to rows
const rows = document.querySelectorAll(".board-row");
if (rows.length > 0) {
  const firstRow = rows[0];
  console.log("Has listener:", firstRow.dataset.quickPeekListener);
}
```

### Step 6: Update Selectors (If Needed)

If selectors don't match, update `scripts/content.js`:

1. **Open** `scripts/content.js`
2. **Find** the `CONFIG.selectors` section (around line 19)
3. **Update** `boardRow` selector with the correct one

**Example:**

```javascript
selectors: {
  boardRow: '.your-actual-class-name, [data-your-attribute], .another-selector',
  taskName: '.your-task-name-class',
}
```

4. **Save and reload:**
   - Reload extension in `chrome://extensions`
   - Reload Monday.com page
   - Test again

### Step 7: Check for JavaScript Errors

1. **In Console**, look for red error messages
2. **Check** if any errors mention:

   - `content.js`
   - `errorHandler.js`
   - `quick-peek-tooltip`
   - `Cannot read property`

3. **Common errors:**
   - `Cannot read property 'querySelector'` → Element not found
   - `TypeError` → Data structure mismatch
   - `ReferenceError` → Function not defined

### Step 8: Verify Extension Files Are Loaded

**In Console:**

```javascript
// Check if CSS is loaded
const styles = Array.from(document.styleSheets).find(
  (s) => s.href && s.href.includes("content.css")
);
console.log("CSS loaded:", !!styles);

// Check if scripts are loaded (check console logs)
// Should see initialization messages
```

### Step 9: Check API Calls

1. **Open Network tab** in DevTools
2. **Filter by** "Fetch/XHR"
3. **Hover over a task**
4. **Look for** requests to `api.monday.com`

**If no API calls:**

- Tooltip might be using mock data
- Check if API key is configured
- Check console for API errors

### Step 10: Test with Mock Data

The extension should work with mock data even without API. If tooltip doesn't appear with mock data, it's a selector/initialization issue.

---

## Most Common Issue: Selectors Don't Match

Monday.com frequently updates their DOM structure. The selectors in the code might not match the current structure.

### How to Fix:

1. **Inspect a task row** in DevTools
2. **Find the actual selector** (class name, data attribute, etc.)
3. **Update** `scripts/content.js` line 20:

```javascript
selectors: {
  boardRow: '.your-actual-selector-here, .backup-selector',
  taskName: '.your-task-name-selector',
}
```

4. **Add multiple selectors** separated by commas for better compatibility

---

## Still Not Working?

Share these details:

1. **Console logs** (all "Monday Quick Peek" messages)
2. **Console errors** (any red messages)
3. **Selector test results** (from Step 2)
4. **Task row HTML** (right-click → Inspect → copy outer HTML)
5. **Browser and Chrome version**

This will help identify the exact issue!
