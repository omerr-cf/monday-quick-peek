/**
 * String Utility Functions
 * Pure functions for string manipulation and formatting
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Escape special regex characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for regex
 */
export function escapeRegex(str) {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlight matching text in a string with <mark> tags
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Search term to highlight
 * @returns {string} Text with highlighted matches
 */
export function highlightText(text, searchTerm) {
  if (!searchTerm || !text) return escapeHtml(text || "");

  const term = searchTerm.trim();
  if (!term) return escapeHtml(text);

  // Escape HTML first, then highlight
  const escapedText = escapeHtml(text);
  const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
  return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
}
