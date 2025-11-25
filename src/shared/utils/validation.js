/**
 * Validation Utility Functions
 * Pure functions for input validation
 */

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if format is valid
 */
export function isValidApiKeyFormat(apiKey) {
  if (!apiKey || typeof apiKey !== "string") return false;

  // Basic validation: at least 20 characters, alphanumeric and some special chars
  // JWT tokens can contain dots, hyphens, underscores
  const minLength = 20;
  const formatRegex = /^[a-zA-Z0-9_.-]+$/;

  return apiKey.trim().length >= minLength && formatRegex.test(apiKey);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email format is valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== "string") return "";
  return input.trim();
}
