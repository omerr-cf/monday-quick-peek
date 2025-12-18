/**
 * Tooltip Renderer Module
 *
 * Handles formatting and rendering tooltip content
 */

(function () {
  "use strict";

  // Dependencies
  const getSearchFilter = () => window.SearchFilter;
  const getSearchHighlighter = () => window.SearchHighlighter;

  // Utility: Escape HTML
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility: Escape regex special characters
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Utility: Highlight matches in text
  function highlightMatches(text, searchTerm) {
    if (!searchTerm || !text) return escapeHtml(text || "");

    const term = searchTerm.trim();
    if (!term) return escapeHtml(text);

    const escapedText = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
    return escapedText.replace(
      regex,
      '<mark class="search-highlight">$1</mark>'
    );
  }

  // Utility: Format relative time
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

  const TooltipRenderer = {
    /**
     * Format content for display with search functionality
     * @param {string} taskName - Name of the task
     * @param {Object} notesData - Notes data object
     * @param {string} searchTerm - Optional search term
     * @returns {string} Formatted HTML
     */
    formatContent(taskName, notesData, searchTerm = "") {
      const notes = notesData?.notes || [];
      const filterFn = getSearchFilter()?.filterNotes;

      // Filter notes if search term exists
      let notesToDisplay = notes;
      if (searchTerm && filterFn) {
        notesToDisplay = filterFn(searchTerm, notes);
      } else if (searchTerm) {
        // Fallback filtering
        const term = searchTerm.trim().toLowerCase();
        if (term) {
          notesToDisplay = notes.filter((note) => {
            const searchIn = [
              note.content || "",
              note.author || "",
              note.createdAt
                ? new Date(note.createdAt).toLocaleDateString()
                : "",
            ]
              .join(" ")
              .toLowerCase();
            return searchIn.includes(term);
          });
        }
      }

      const totalNotes = notes.length;
      const filteredCount = notesToDisplay.length;

      let html = `<div class="tooltip-header">
        <strong class="tooltip-task-name">${escapeHtml(taskName)}</strong>
        <button class="theme-toggle" aria-label="Toggle theme" title="Toggle dark/light mode">🌓</button>
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

          // Highlight matches
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
    },

    /**
     * Format relative time
     * @param {string} dateString - ISO date string
     * @returns {string} Relative time string
     */
    formatRelativeTime,

    /**
     * Escape HTML
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml,

    /**
     * Highlight matches in text
     * @param {string} text - Text to highlight
     * @param {string} searchTerm - Search term
     * @returns {string} Highlighted text
     */
    highlightMatches,
  };

  // Export globally
  if (typeof window !== "undefined") {
    window.TooltipRenderer = TooltipRenderer;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = TooltipRenderer;
  }
})();
