/**
 * Content Script for Monday Quick Peek Extension
 *
 * This script runs on Monday.com pages and handles:
 * - Detecting hover events on task rows
 * - Showing/hiding tooltips with preview content
 * - Managing tooltip positioning and lifecycle
 * - Watching for dynamically loaded content
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    hoverDelay: 500, // Delay before showing tooltip (ms) - prevents accidental triggers
    hideDelay: 100, // Delay before hiding tooltip (ms)
    tooltipId: "quick-peek-tooltip",
    selectors: {
      boardRow: '.board-row, [data-testid*="board-row"], [class*="boardRow"]',
      taskName: '.board-row-name, [data-testid*="name"]',
    },
    tooltipOffset: 15, // Distance from cursor/element
    zIndex: 10000, // High z-index to appear above Monday.com UI
  };

  // State management
  let hoverTimeout = null;
  let currentTooltip = null;
  let currentTarget = null;
  let mutationObserver = null;
  let isInitialized = false;

  // Mock data for testing (until API is connected)
  const mockNotes = {
    taskName: "Example Task",
    notes: [
      {
        id: "1",
        author: "Sarah Kim",
        authorPhoto: "https://via.placeholder.com/32",
        content: "This is a test note about the task. It contains important information that the user wants to preview quickly.",
        createdAt: "2024-11-20T10:30:00Z",
      },
      {
        id: "2",
        author: "Mike Chen",
        authorPhoto: "https://via.placeholder.com/32",
        content: "Another update on progress. We've made significant improvements to the feature.",
        createdAt: "2024-11-21T14:20:00Z",
      },
    ],
  };

  /**
   * Initialize the content script
   */
  function init() {
    if (isInitialized) {
      console.log("Monday Quick Peek: Already initialized");
      return;
    }

    console.log("Monday Quick Peek: Content script loaded");

    // Wait for page to be fully loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        console.log("Monday Quick Peek: DOM loaded");
        initializeExtension();
      });
    } else {
      // Page already loaded, but wait a bit for Monday.com to initialize
      setTimeout(() => {
        initializeExtension();
      }, 1000);
    }
  }

  /**
   * Initialize extension after page is ready
   */
  function initializeExtension() {
    console.log("Monday Quick Peek: Initializing extension");

    // Create tooltip element (initially hidden)
    createTooltipElement();

    // Attach hover listeners to existing rows
    attachHoverListeners();

    // Set up MutationObserver for dynamically loaded content
    setupMutationObserver();

    isInitialized = true;
    console.log("Monday Quick Peek: Extension initialized successfully");
  }

  /**
   * Create tooltip element and append to body (initially hidden)
   */
  function createTooltipElement() {
    // Remove existing tooltip if present
    const existing = document.getElementById(CONFIG.tooltipId);
    if (existing) {
      existing.remove();
    }

    const tooltip = document.createElement("div");
    tooltip.id = CONFIG.tooltipId;
    tooltip.className = "monday-quick-peek-tooltip";
    tooltip.style.display = "none";
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = CONFIG.zIndex;

    document.body.appendChild(tooltip);
    console.log("Monday Quick Peek: Tooltip element created");
  }

  /**
   * Set up MutationObserver to watch for dynamically loaded task rows
   */
  function setupMutationObserver() {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }

    mutationObserver = new MutationObserver((mutations) => {
      let shouldReattach = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if added node is a board row or contains board rows
            if (
              node.matches?.(CONFIG.selectors.boardRow) ||
              node.querySelector?.(CONFIG.selectors.boardRow)
            ) {
              shouldReattach = true;
              console.log("Monday Quick Peek: New task rows detected");
            }
          }
        });
      });

      if (shouldReattach) {
        attachHoverListeners();
      }
    });

    // Start observing
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("Monday Quick Peek: MutationObserver set up");
  }

  /**
   * Find all task rows and attach hover listeners
   */
  function attachHoverListeners() {
    // Find all board rows (try multiple selectors for compatibility)
    const selectors = [
      ".board-row",
      '[data-testid*="board-row"]',
      '[class*="boardRow"]',
      '[class*="BoardRow"]',
    ];

    let rows = [];
    selectors.forEach((selector) => {
      try {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          rows = Array.from(found);
          console.log(
            `Monday Quick Peek: Found ${rows.length} task rows using selector: ${selector}`
          );
        }
      } catch (e) {
        console.warn(`Monday Quick Peek: Selector failed: ${selector}`, e);
      }
    });

    // Remove duplicates
    rows = [...new Set(rows)];

    if (rows.length === 0) {
      console.warn("Monday Quick Peek: No task rows found");
      return;
    }

    // Attach listeners to each row
    rows.forEach((row, index) => {
      // Skip if already has listener (check for data attribute)
      if (row.dataset.quickPeekListener === "true") {
        return;
      }

      // Mark as having listener
      row.dataset.quickPeekListener = "true";

      // Add hover listeners
      row.addEventListener("mouseenter", handleMouseEnter);
      row.addEventListener("mouseleave", handleMouseLeave);
      row.addEventListener("mousemove", handleMouseMove);

      if (index < 3) {
        // Log first few for debugging
        console.log("Monday Quick Peek: Attached listener to row", row);
      }
    });

    console.log(
      `Monday Quick Peek: Attached hover listeners to ${rows.length} task rows`
    );
  }

  /**
   * Handle mouse enter event on task row
   * @param {Event} event - Mouse event
   */
  function handleMouseEnter(event) {
    const row = event.currentTarget;

    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Don't show tooltip if already showing for this row
    if (currentTarget === row && currentTooltip) {
      return;
    }

    currentTarget = row;

    console.log("Monday Quick Peek: Mouse entered task row", row);

    // Show tooltip after delay
    hoverTimeout = setTimeout(() => {
      showTooltip(row, event);
    }, CONFIG.hoverDelay);
  }

  /**
   * Handle mouse leave event on task row
   * @param {Event} event - Mouse event
   */
  function handleMouseLeave(event) {
    const row = event.currentTarget;

    // Clear hover timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Hide tooltip after delay
    setTimeout(() => {
      // Only hide if we're leaving the current target
      if (currentTarget === row) {
        console.log("Monday Quick Peek: Mouse left task row, hiding tooltip");
        hideTooltip();
      }
    }, CONFIG.hideDelay);
  }

  /**
   * Handle mouse move event for tooltip positioning
   * @param {Event} event - Mouse event
   */
  function handleMouseMove(event) {
    // Update tooltip position if it's showing
    if (currentTooltip && currentTarget === event.currentTarget) {
      positionTooltip(currentTooltip, event.currentTarget, event);
    }
  }

  /**
   * Show tooltip with preview content
   * @param {HTMLElement} row - The task row being hovered
   * @param {Event} event - Mouse event for positioning
   */
  function showTooltip(row, event) {
    // Prevent multiple tooltips
    if (currentTooltip) {
      hideTooltip();
    }

    console.log("Monday Quick Peek: Showing tooltip for row", row);

    // Get tooltip element
    let tooltip = document.getElementById(CONFIG.tooltipId);
    if (!tooltip) {
      createTooltipElement();
      tooltip = document.getElementById(CONFIG.tooltipId);
    }

    // Get task name
    const taskName = getTaskName(row);

    // For now, use mock data (will be replaced with API call)
    const content = formatMockContent(taskName, mockNotes);

    tooltip.innerHTML = content;
    tooltip.style.display = "block";

    // Position tooltip
    positionTooltip(tooltip, row, event);

    currentTooltip = tooltip;
    console.log("Monday Quick Peek: Tooltip displayed");
  }

  /**
   * Hide the current tooltip
   */
  function hideTooltip() {
    if (currentTooltip) {
      currentTooltip.style.display = "none";
      currentTooltip.innerHTML = "";
      currentTooltip = null;
      console.log("Monday Quick Peek: Tooltip hidden");
    }
    currentTarget = null;
  }

  /**
   * Get task name from row element
   * @param {HTMLElement} row - Task row element
   * @returns {string} Task name
   */
  function getTaskName(row) {
    // Try multiple selectors to find task name
    const nameSelectors = [
      ".board-row-name",
      '[data-testid*="name"]',
      ".item-name",
      "h3",
      "h4",
    ];

    for (const selector of nameSelectors) {
      const element = row.querySelector(selector);
      if (element) {
        return element.textContent?.trim() || "Untitled Task";
      }
    }

    // Fallback: use first text node or row text
    return row.textContent?.trim().split("\n")[0] || "Untitled Task";
  }

  /**
   * Format mock content for display
   * @param {string} taskName - Name of the task
   * @param {Object} mockData - Mock notes data
   * @returns {string} Formatted HTML
   */
  function formatMockContent(taskName, mockData) {
    let html = `<div class="tooltip-header">
      <strong class="tooltip-task-name">${escapeHtml(taskName)}</strong>
    </div>`;

    if (mockData.notes && mockData.notes.length > 0) {
      html += '<div class="tooltip-notes">';
      mockData.notes.forEach((note) => {
        const date = new Date(note.createdAt).toLocaleDateString();
        html += `
          <div class="tooltip-note">
            <div class="tooltip-note-header">
              <span class="tooltip-author">${escapeHtml(note.author)}</span>
              <span class="tooltip-timestamp">${date}</span>
            </div>
            <div class="tooltip-body">${escapeHtml(note.content)}</div>
          </div>
        `;
      });
      html += "</div>";
    } else {
      html += '<div class="tooltip-body">No notes available</div>';
    }

    return html;
  }

  /**
   * Position tooltip intelligently near cursor/element
   * @param {HTMLElement} tooltip - Tooltip element
   * @param {HTMLElement} row - Source row element
   * @param {Event} event - Mouse event
   */
  function positionTooltip(tooltip, row, event) {
    const rect = row.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default: position below and to the right of the row
    let top = rect.bottom + CONFIG.tooltipOffset + window.scrollY;
    let left = rect.left + window.scrollX;

    // If mouse event is available, position near cursor
    if (event && event.clientX && event.clientY) {
      left = event.clientX + CONFIG.tooltipOffset + window.scrollX;
      top = event.clientY + CONFIG.tooltipOffset + window.scrollY;
    }

    // Check right edge
    if (left + tooltipRect.width > viewportWidth + window.scrollX) {
      // Position to the left of cursor/row
      if (event && event.clientX) {
        left = event.clientX - tooltipRect.width - CONFIG.tooltipOffset + window.scrollX;
      } else {
        left = rect.right - tooltipRect.width + window.scrollX;
      }
    }

    // Check bottom edge
    if (top + tooltipRect.height > viewportHeight + window.scrollY) {
      // Position above cursor/row
      if (event && event.clientY) {
        top = event.clientY - tooltipRect.height - CONFIG.tooltipOffset + window.scrollY;
      } else {
        top = rect.top - tooltipRect.height - CONFIG.tooltipOffset + window.scrollY;
      }
    }

    // Ensure tooltip doesn't go off left edge
    if (left < window.scrollX) {
      left = window.scrollX + CONFIG.tooltipOffset;
    }

    // Ensure tooltip doesn't go off top edge
    if (top < window.scrollY) {
      top = window.scrollY + CONFIG.tooltipOffset;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    console.log(
      `Monday Quick Peek: Tooltip positioned at (${left}, ${top})`
    );
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Request content from background script (for future API integration)
   * @param {string} itemId - Monday.com item ID
   * @param {string} type - Content type (note/comment)
   * @returns {Promise<string>} Content promise
   */
  async function fetchContentFromAPI(itemId, type) {
    console.log(
      `Monday Quick Peek: Fetching content for item ${itemId}, type ${type}`
    );

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "fetchContent",
          itemId: itemId,
          type: type,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Monday Quick Peek: API error",
              chrome.runtime.lastError
            );
            reject(chrome.runtime.lastError);
          } else {
            console.log("Monday Quick Peek: API response received", response);
            resolve(response?.content || "");
          }
        }
      );
    });
  }

  // Initialize when script loads
  init();

  // Re-initialize if page navigates (for SPAs like Monday.com)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log("Monday Quick Peek: Page navigation detected, re-initializing");
      isInitialized = false;
      setTimeout(() => {
        init();
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
