/**
 * Date Utility Functions
 * Pure functions for date formatting and manipulation
 */

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export function formatRelativeTime(dateString) {
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
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;

  return date.toLocaleDateString();
}

/**
 * Format date to locale string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString();
}

/**
 * Check if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date
 */
export function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
