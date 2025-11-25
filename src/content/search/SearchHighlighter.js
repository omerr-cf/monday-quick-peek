/**
 * Search Highlighter Module
 * Pure function for highlighting search terms in text
 */

import {
  escapeHtml,
  escapeRegex,
  highlightText,
} from "../../shared/utils/string.js";

/**
 * Highlight matching text in a string with <mark> tags
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Search term to highlight
 * @returns {string} Text with highlighted matches
 */
export function highlightMatches(text, searchTerm) {
  return highlightText(text, searchTerm);
}
