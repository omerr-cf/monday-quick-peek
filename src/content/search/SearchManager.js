/**
 * Search Manager Module
 *
 * Handles search functionality within tooltip
 */

(function () {
  "use strict";

  // Dependencies
  const getState = () => window.QuickPeekState || {};
  const getStateManager = () => window.StateManager;
  const getTooltipManager = () => window.TooltipManager;
  const getTooltipRenderer = () => window.TooltipRenderer;

  const SearchManager = {
    /**
     * Attach search listeners to tooltip
     * @param {HTMLElement} tooltip - Tooltip element
     */
    attachListeners(tooltip) {
      if (!tooltip) return;

      const state = getState();
      const stateManager = getStateManager();
      const tooltipManager = getTooltipManager();
      const tooltipRenderer = getTooltipRenderer();

      const searchInput = tooltip.querySelector(".search-input");
      const clearButton = tooltip.querySelector(".search-clear");

      if (searchInput) {
        // Remove existing listeners by cloning
        const wrapper = searchInput.parentElement;
        if (wrapper && wrapper.classList.contains("search-input-wrapper")) {
          const newInput = searchInput.cloneNode(true);
          searchInput.replaceWith(newInput);

          // Debounced search
          newInput.addEventListener("input", (e) => {
            const term = e.target.value;
            if (stateManager) {
              stateManager.set("currentSearchTerm", term);
            }

            // Show/hide clear button
            this.updateClearButton(tooltip, term);

            // Clear existing debounce timer
            const state = getState();
            if (state.searchDebounceTimer) {
              clearTimeout(state.searchDebounceTimer);
            }

            // Debounce search (150ms)
            const debounceTimer = setTimeout(() => {
              this.updateContent(tooltip, term);
            }, 150);

            if (stateManager) {
              stateManager.set("searchDebounceTimer", debounceTimer);
            }
          });

          // Handle Enter key (prevent form submission)
          newInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          });

          // Handle Escape key to clear search
          newInput.addEventListener("keydown", (e) => {
            const currentTerm = stateManager
              ? stateManager.get("currentSearchTerm")
              : "";
            if (e.key === "Escape" && currentTerm) {
              if (stateManager) {
                stateManager.set("currentSearchTerm", "");
              }
              newInput.value = "";
              this.updateContent(tooltip, "");
              this.updateClearButton(tooltip, "");
              e.preventDefault();
            }
          });

          // Focus search input when tooltip opens (only if no search term)
          const currentTerm = stateManager
            ? stateManager.get("currentSearchTerm")
            : "";
          if (!currentTerm) {
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
          if (stateManager) {
            stateManager.set("currentSearchTerm", "");
          }
          this.updateContent(tooltip, "");
          const input = tooltip.querySelector(".search-input");
          if (input) {
            input.value = "";
            input.focus();
          }
          this.updateClearButton(tooltip, "");
        });
      }
    },

    /**
     * Update tooltip content with search results
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {string} searchTerm - Search term
     */
    updateContent(tooltip, searchTerm = "") {
      if (!tooltip) return;

      const state = getState();
      const tooltipRenderer = getTooltipRenderer();

      // Preserve input element and cursor position
      const searchInput = tooltip.querySelector(".search-input");
      const cursorPosition = searchInput ? searchInput.selectionStart : null;
      const wasFocused = searchInput === document.activeElement;

      const taskName =
        tooltip.querySelector(".tooltip-task-name")?.textContent || "Task";
      const notesData = { notes: state.currentNotes || [] };

      if (!tooltipRenderer) {
        console.warn("SearchManager: TooltipRenderer not available");
        return;
      }

      // Get current scroll position BEFORE any DOM changes
      const contentArea = tooltip.querySelector(".tooltip-content");
      const scrollTop = contentArea ? contentArea.scrollTop : 0;

      // Update ONLY the content area, preserve search input and header
      // This prevents focus loss when typing - we don't replace the entire tooltip
      const notesContainer = contentArea?.querySelector(".tooltip-notes");
      const emptyState = contentArea?.querySelector(".search-empty-state");
      const resultsCount = contentArea?.querySelector(".search-results-count");

      // Remove old content parts
      if (notesContainer) notesContainer.remove();
      if (emptyState) emptyState.remove();
      if (resultsCount) resultsCount.remove();

      // Get new formatted content
      const newContent = tooltipRenderer.formatContent(
        taskName,
        notesData,
        searchTerm
      );

      // Parse new content to extract just the content area parts
      const temp = document.createElement("div");
      temp.innerHTML = newContent;
      const newContentWrapper = temp.querySelector(".tooltip-content");

      if (newContentWrapper && contentArea) {
        // Insert new content parts
        const newResultsCount = newContentWrapper.querySelector(
          ".search-results-count"
        );
        const newNotesSection =
          newContentWrapper.querySelector(".tooltip-notes");
        const newEmptyState = newContentWrapper.querySelector(
          ".search-empty-state"
        );

        if (newResultsCount) {
          contentArea.insertBefore(newResultsCount, contentArea.firstChild);
        }
        if (newNotesSection) {
          contentArea.appendChild(newNotesSection);
        } else if (newEmptyState) {
          contentArea.appendChild(newEmptyState);
        }

        // Restore scroll position
        contentArea.scrollTop = scrollTop;
      } else {
        // Fallback: update entire tooltip if structure is different
        tooltip.innerHTML = newContent;
        const newContentArea = tooltip.querySelector(".tooltip-content");
        if (newContentArea) {
          newContentArea.scrollTop = scrollTop;
        }
        // Re-attach listeners after full replacement
        this.attachListeners(tooltip);
        const newInput = tooltip.querySelector(".search-input");
        if (newInput && wasFocused) {
          requestAnimationFrame(() => {
            newInput.focus();
            if (
              cursorPosition !== null &&
              cursorPosition <= newInput.value.length
            ) {
              newInput.setSelectionRange(cursorPosition, cursorPosition);
            }
          });
        }
      }

      // Input should still exist and be focused - no need to restore focus
      // The input was never removed, so focus is maintained
    },

    /**
     * Update clear button visibility
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {string} searchTerm - Current search term
     */
    updateClearButton(tooltip, searchTerm) {
      if (!tooltip) return;

      const clearButton = tooltip.querySelector(".search-clear");
      const searchWrapper = tooltip.querySelector(".search-input-wrapper");
      const stateManager = getStateManager();

      if (searchTerm && searchTerm.trim()) {
        if (!clearButton && searchWrapper) {
          const btn = document.createElement("button");
          btn.className = "search-clear";
          btn.setAttribute("aria-label", "Clear search");
          btn.textContent = "×";
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (stateManager) {
              stateManager.set("currentSearchTerm", "");
            }
            this.updateContent(tooltip, "");
            const input = tooltip.querySelector(".search-input");
            if (input) {
              input.value = "";
              input.focus();
            }
            this.updateClearButton(tooltip, "");
          });
          searchWrapper.appendChild(btn);
        }
      } else {
        if (clearButton) {
          clearButton.remove();
        }
      }
    },
  };

  // Export globally
  if (typeof window !== "undefined") {
    window.SearchManager = SearchManager;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = SearchManager;
  }
})();
