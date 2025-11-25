/**
 * Quick Debug Script for Monday Quick Peek
 *
 * Copy and paste this into the browser console on a Monday.com board page
 * to diagnose why tooltips aren't appearing
 */

(function () {
  console.log("=== Monday Quick Peek Debug ===\n");

  // 1. Check if extension script loaded
  console.log("1. Checking extension initialization...");
  // Look for console messages - can't directly check, but we'll test selectors

  // 2. Test selectors
  console.log("\n2. Testing selectors...");
  const selectors = [
    ".board-row",
    '[data-testid*="board-row"]',
    '[class*="boardRow"]',
    '[class*="BoardRow"]',
    "[data-item-id]",
    ".item-row",
    '[class*="ItemRow"]',
  ];

  selectors.forEach((selector) => {
    try {
      const count = document.querySelectorAll(selector).length;
      if (count > 0) {
        console.log(`  ✅ ${selector}: Found ${count} elements`);
      } else {
        console.log(`  ❌ ${selector}: Found 0 elements`);
      }
    } catch (e) {
      console.log(`  ❌ ${selector}: Error - ${e.message}`);
    }
  });

  // 3. Check if tooltip element exists
  console.log("\n3. Checking tooltip element...");
  const tooltip = document.getElementById("quick-peek-tooltip");
  if (tooltip) {
    console.log("  ✅ Tooltip element exists");
    console.log("  Display:", tooltip.style.display);
    console.log("  Z-index:", window.getComputedStyle(tooltip).zIndex);
  } else {
    console.log("  ❌ Tooltip element not found");
  }

  // 4. Check if rows have listeners
  console.log("\n4. Checking row listeners...");
  const testRows = document.querySelectorAll(
    '.board-row, [data-item-id], [class*="row"]'
  );
  if (testRows.length > 0) {
    const firstRow = testRows[0];
    console.log("  Found test row:", firstRow);
    console.log("  Has quickPeekListener:", firstRow.dataset.quickPeekListener);
    console.log("  Row classes:", firstRow.className);
    console.log("  Row dataset:", firstRow.dataset);
  } else {
    console.log("  ❌ No rows found to test");
  }

  // 5. Try to manually trigger hover
  console.log("\n5. Testing manual hover trigger...");
  const testRow = document.querySelector(
    '.board-row, [data-item-id], [class*="row"]'
  );
  if (testRow) {
    console.log("  Attempting to trigger hover on:", testRow);
    testRow.dispatchEvent(
      new MouseEvent("mouseenter", {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      })
    );

    setTimeout(() => {
      const tooltipAfter = document.getElementById("quick-peek-tooltip");
      if (tooltipAfter) {
        const display = window.getComputedStyle(tooltipAfter).display;
        console.log("  Tooltip after hover:", tooltipAfter);
        console.log("  Tooltip display:", display);
        if (display === "none") {
          console.log('  ⚠️  Tooltip exists but display is "none"');
        }
      } else {
        console.log("  ❌ Tooltip still not found after hover");
      }
    }, 600);
  } else {
    console.log("  ❌ No row found to test hover");
  }

  // 6. Check for errors
  console.log("\n6. Summary:");
  console.log('  - Check console above for "Monday Quick Peek" messages');
  console.log("  - Look for any red error messages");
  console.log("  - If no rows found, selectors need updating");
  console.log("  - If tooltip exists but hidden, check CSS/z-index");

  console.log("\n=== End Debug ===");
})();
