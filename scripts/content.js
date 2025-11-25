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

  // Search state
  let searchDebounceTimer = null;
  let currentNotes = null; // Cache current notes for search
  let currentSearchTerm = "";

  // Mock data for testing (until API is connected)
  const mockNotes = {
    taskName: "Example Task",
    notes: [
      {
        id: "1",
        author: "Sarah Kim",
        authorPhoto: "https://via.placeholder.com/32",
        content:
          "This is a test note about the task. It contains important information that the user wants to preview quickly.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        id: "2",
        author: "Mike Chen",
        authorPhoto: "https://via.placeholder.com/32",
        content:
          "Another update on progress. We've made significant improvements to the feature. The search functionality is working great!",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      },
      {
        id: "3",
        author: "Emma Wilson",
        authorPhoto: "https://via.placeholder.com/32",
        content:
          "Don't forget to test the highlighting feature. It should highlight matching text in yellow.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        id: "4",
        author: "David Park",
        authorPhoto: "https://via.placeholder.com/32",
        content:
          "The debounce is set to 150ms for smooth real-time filtering. This prevents too many re-renders.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        id: "5",
        author: "Sarah Kim",
        authorPhoto: "https://via.placeholder.com/32",
        content:
          "Search works across note content, author names, and timestamps. Try searching for 'Sarah' or 'test'.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
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
  async function showTooltip(row, event) {
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

    // Reset search state for new tooltip
    currentSearchTerm = "";

    // Show loading state
    tooltip.innerHTML =
      '<div class="tooltip-content"><div style="text-align: center; padding: 40px; color: #676879;">Loading...</div></div>';
    tooltip.style.display = "block";
    positionTooltip(tooltip, row, event);
    currentTooltip = tooltip;

    try {
      // Try to fetch real data from API
      const itemId = getTaskId(row);
      if (itemId) {
        const response = await fetchContentFromAPI(itemId, "note");
        if (response && response.success && response.data) {
          const content = formatMockContent(taskName, response.data, "");
          tooltip.innerHTML = content;
        } else if (response && !response.success) {
          // Handle API error
          throw new Error(response.error || "Failed to fetch content");
        } else {
          // Fallback to mock data
          const content = formatMockContent(taskName, mockNotes, "");
          tooltip.innerHTML = content;
        }
      } else {
        // No item ID, use mock data
        const content = formatMockContent(taskName, mockNotes, "");
        tooltip.innerHTML = content;
      }

      // Position tooltip again after content is loaded
      positionTooltip(tooltip, row, event);

      // Attach search listeners after content is set
      setTimeout(() => {
        attachSearchListeners();
      }, 50);

      console.log("Monday Quick Peek: Tooltip displayed");
    } catch (error) {
      console.error("Monday Quick Peek: Error showing tooltip", error);

      // Use error handler to show error UI
      if (window.ErrorHandler) {
        window.ErrorHandler.handle(error, "showTooltip", {
          showUI: true,
          retry: true,
          retryCallback: () => showTooltip(row, event),
        });
      } else {
        // Fallback error display
        tooltip.innerHTML = `
          <div class="error-container">
            <div class="error-header">
              <span class="error-icon">⚠️</span>
              <span class="error-title">Error</span>
            </div>
            <div class="error-message">${escapeHtml(
              error.message || "Failed to load content"
            )}</div>
          </div>
        `;
        tooltip.classList.add("error-state");
      }
    }
  }

  /**
   * Get task ID from row element
   * @param {HTMLElement} row - Task row element
   * @returns {string|null} Task ID or null
   */
  function getTaskId(row) {
    // Try to extract task ID from various attributes
    const idSelectors = [
      "[data-item-id]",
      "[data-id]",
      "[id*='item']",
      "[id*='task']",
    ];

    for (const selector of idSelectors) {
      const element = row.querySelector(selector) || row.closest(selector);
      if (element) {
        const id =
          element.dataset.itemId ||
          element.dataset.id ||
          element.id?.match(/\d+/)?.[0];
        if (id) return id;
      }
    }

    // Try to get from row itself
    const rowId =
      row.dataset.itemId || row.dataset.id || row.id?.match(/\d+/)?.[0];
    if (rowId) return rowId;

    return null;
  }

  /**
   * Hide the current tooltip
   */
  function hideTooltip() {
    // Clear search debounce timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }

    if (currentTooltip) {
      currentTooltip.style.display = "none";
      currentTooltip.innerHTML = "";
      currentTooltip = null;
      console.log("Monday Quick Peek: Tooltip hidden");
    }

    // Reset search state
    currentSearchTerm = "";
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
   * Filter notes based on search term
   * @param {string} searchTerm - Search term
   * @param {Array} notes - Array of notes to filter
   * @returns {Array} Filtered notes
   */
  function filterNotes(searchTerm, notes) {
    if (!searchTerm || !notes) return notes;

    const term = searchTerm.trim().toLowerCase();
    if (!term) return notes;

    return notes.filter((note) => {
      const searchIn = [
        note.content || "",
        note.author || "",
        note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "",
        note.createdAt ? new Date(note.createdAt).toLocaleTimeString() : "",
      ]
        .join(" ")
        .toLowerCase();

      return searchIn.includes(term);
    });
  }

  /**
   * Highlight matching text in a string
   * @param {string} text - Text to highlight
   * @param {string} searchTerm - Search term to highlight
   * @returns {string} Text with highlighted matches
   */
  function highlightMatches(text, searchTerm) {
    if (!searchTerm || !text) return escapeHtml(text || "");

    const term = searchTerm.trim();
    if (!term) return escapeHtml(text);

    // Escape HTML first, then highlight
    const escapedText = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
    return escapedText.replace(
      regex,
      '<mark class="search-highlight">$1</mark>'
    );
  }

  /**
   * Escape special regex characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Format relative time (e.g., "2 hours ago", "3 days ago")
   * @param {string} dateString - ISO date string
   * @returns {string} Relative time string
   */
  function formatRelativeTime(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60)
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 7)
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;

    return date.toLocaleDateString();
  }

  /**
   * Format mock content for display with search functionality
   * @param {string} taskName - Name of the task
   * @param {Object} mockData - Mock notes data
   * @param {string} searchTerm - Optional search term
   * @returns {string} Formatted HTML
   */
  function formatMockContent(taskName, mockData, searchTerm = "") {
    // Cache notes
    if (mockData.notes) {
      currentNotes = mockData.notes;
    }

    // Filter notes if search term exists
    let notesToDisplay = currentNotes || [];
    if (searchTerm) {
      notesToDisplay = filterNotes(searchTerm, currentNotes || []);
    }

    const totalNotes = (currentNotes || []).length;
    const filteredCount = notesToDisplay.length;

    let html = `<div class="tooltip-header">
      <strong class="tooltip-task-name">${escapeHtml(taskName)}</strong>
    </div>`;

    // Add search input
    html += `<div class="tooltip-search">
      <div class="search-input-wrapper">
        <input 
          type="text" 
          class="search-input" 
          placeholder="Search notes..." 
          value="${escapeHtml(searchTerm)}"
          autocomplete="off"
        />
        ${
          searchTerm
            ? '<button class="search-clear" aria-label="Clear search">×</button>'
            : ""
        }
      </div>
    </div>`;

    // Add content area
    html += '<div class="tooltip-content">';

    if (notesToDisplay.length > 0) {
      // Show count if searching
      if (searchTerm && totalNotes > 0) {
        html += `<div class="search-results-count">${filteredCount} of ${totalNotes} note${
          totalNotes !== 1 ? "s" : ""
        }</div>`;
      }

      html += '<div class="tooltip-notes">';
      notesToDisplay.forEach((note) => {
        const relativeTime = formatRelativeTime(note.createdAt);
        const date = new Date(note.createdAt).toLocaleDateString();
        const timestamp = relativeTime || date;

        // Highlight matches in content, author, and timestamp
        const highlightedContent = highlightMatches(note.content, searchTerm);
        const highlightedAuthor = highlightMatches(note.author, searchTerm);
        const highlightedTimestamp = highlightMatches(timestamp, searchTerm);

        html += `
          <div class="tooltip-note note-item">
            <div class="tooltip-note-header">
              <span class="tooltip-author note-author">
                ${
                  note.authorPhoto
                    ? `<img src="${escapeHtml(
                        note.authorPhoto
                      )}" alt="${escapeHtml(note.author)}" />`
                    : ""
                }
                <span class="author-name">${highlightedAuthor}</span>
              </span>
              <span class="tooltip-timestamp note-time">${highlightedTimestamp}</span>
            </div>
            <div class="tooltip-body note-body">${highlightedContent}</div>
          </div>
        `;
      });
      html += "</div>";
    } else {
      // Empty state
      if (searchTerm) {
        html += `<div class="search-empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No notes found</div>
          <div class="empty-state-message">Try a different search term</div>
        </div>`;
      } else if (totalNotes === 0) {
        html += `<div class="search-empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No notes available</div>
          <div class="empty-state-message">This task has no notes yet</div>
        </div>`;
      }
    }

    html += "</div>"; // Close tooltip-content

    return html;
  }

  /**
   * Update tooltip content with search results
   * @param {string} searchTerm - Search term
   */
  function updateTooltipContent(searchTerm = "") {
    if (!currentTooltip) return;

    const taskName =
      currentTooltip.querySelector(".tooltip-task-name")?.textContent || "Task";
    const mockData = { notes: currentNotes || [] };
    const newContent = formatMockContent(taskName, mockData, searchTerm);

    // Get current scroll position
    const contentArea = currentTooltip.querySelector(".tooltip-content");
    const scrollTop = contentArea ? contentArea.scrollTop : 0;

    // Update content
    currentTooltip.innerHTML = newContent;

    // Restore scroll position
    const newContentArea = currentTooltip.querySelector(".tooltip-content");
    if (newContentArea) {
      newContentArea.scrollTop = scrollTop;
    }

    // Re-attach search event listeners
    attachSearchListeners();
  }

  /**
   * Attach event listeners to search input
   */
  function attachSearchListeners() {
    if (!currentTooltip) return;

    const searchInput = currentTooltip.querySelector(".search-input");
    const clearButton = currentTooltip.querySelector(".search-clear");

    if (searchInput) {
      // Remove existing listeners by cloning (prevents duplicate listeners)
      const wrapper = searchInput.parentElement;
      if (wrapper && wrapper.classList.contains("search-input-wrapper")) {
        const newInput = searchInput.cloneNode(true);
        searchInput.replaceWith(newInput);

        // Debounced search
        newInput.addEventListener("input", (e) => {
          const term = e.target.value;
          currentSearchTerm = term;

          // Show/hide clear button
          updateClearButton(term);

          // Clear existing debounce timer
          if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
          }

          // Debounce search (150ms)
          searchDebounceTimer = setTimeout(() => {
            updateTooltipContent(term);
          }, 150);
        });

        // Handle Enter key (prevent form submission)
        newInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        });

        // Handle Escape key to clear search
        newInput.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && currentSearchTerm) {
            currentSearchTerm = "";
            newInput.value = "";
            updateTooltipContent("");
            updateClearButton("");
            e.preventDefault();
          }
        });

        // Focus search input when tooltip opens (only if no search term)
        if (!currentSearchTerm) {
          setTimeout(() => {
            newInput.focus();
          }, 100);
        }
      }
    }

    if (clearButton) {
      clearButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentSearchTerm = "";
        updateTooltipContent("");
        const input = currentTooltip.querySelector(".search-input");
        if (input) {
          input.value = "";
          input.focus();
        }
        updateClearButton("");
      });
    }
  }

  /**
   * Update clear button visibility
   * @param {string} searchTerm - Current search term
   */
  function updateClearButton(searchTerm) {
    if (!currentTooltip) return;

    const clearButton = currentTooltip.querySelector(".search-clear");
    const searchWrapper = currentTooltip.querySelector(".search-input-wrapper");

    if (searchTerm && searchTerm.trim()) {
      if (!clearButton && searchWrapper) {
        const btn = document.createElement("button");
        btn.className = "search-clear";
        btn.setAttribute("aria-label", "Clear search");
        btn.textContent = "×";
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentSearchTerm = "";
          updateTooltipContent("");
          const input = currentTooltip.querySelector(".search-input");
          if (input) {
            input.value = "";
            input.focus();
          }
          updateClearButton("");
        });
        searchWrapper.appendChild(btn);
      }
    } else {
      if (clearButton) {
        clearButton.remove();
      }
    }
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
        left =
          event.clientX -
          tooltipRect.width -
          CONFIG.tooltipOffset +
          window.scrollX;
      } else {
        left = rect.right - tooltipRect.width + window.scrollX;
      }
    }

    // Check bottom edge
    if (top + tooltipRect.height > viewportHeight + window.scrollY) {
      // Position above cursor/row
      if (event && event.clientY) {
        top =
          event.clientY -
          tooltipRect.height -
          CONFIG.tooltipOffset +
          window.scrollY;
      } else {
        top =
          rect.top - tooltipRect.height - CONFIG.tooltipOffset + window.scrollY;
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

    console.log(`Monday Quick Peek: Tooltip positioned at (${left}, ${top})`);
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
   * @returns {Promise<Object>} Response object with success and data
   */
  async function fetchContentFromAPI(itemId, type) {
    console.log(
      `Monday Quick Peek: Fetching content for item ${itemId}, type ${type}`
    );

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "fetchNotes",
          taskId: itemId,
          type: type,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            const error = new Error(chrome.runtime.lastError.message);
            error.code = "NETWORK_ERROR";

            // Use error handler if available
            if (window.ErrorHandler) {
              window.ErrorHandler.handle(error, "fetchContentFromAPI", {
                showUI: false, // Don't show UI here, let showTooltip handle it
              });
            }

            reject(error);
            return;
          }

          if (!response) {
            const error = new Error("No response from background script");
            error.code = "UNKNOWN_ERROR";
            reject(error);
            return;
          }

          if (response.success) {
            console.log("Monday Quick Peek: API response received", response);
            resolve({
              success: true,
              data: response.data,
              cached: response.cached || false,
            });
          } else {
            // Handle API errors
            const error = new Error(
              response.error || "Failed to fetch content"
            );

            // Classify error based on response
            if (response.error?.includes("API key")) {
              error.code =
                window.ErrorHandler?.ERROR_CODES?.API_KEY_MISSING ||
                "API_KEY_MISSING";
            } else if (response.error?.includes("not found")) {
              error.code =
                window.ErrorHandler?.ERROR_CODES?.TASK_NOT_FOUND ||
                "TASK_NOT_FOUND";
            } else if (response.error?.includes("rate limit")) {
              error.code =
                window.ErrorHandler?.ERROR_CODES?.RATE_LIMITED ||
                "RATE_LIMITED";
            } else {
              error.code =
                window.ErrorHandler?.ERROR_CODES?.UNKNOWN_ERROR ||
                "UNKNOWN_ERROR";
            }

            reject(error);
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
      console.log(
        "Monday Quick Peek: Page navigation detected, re-initializing"
      );
      isInitialized = false;
      setTimeout(() => {
        init();
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
