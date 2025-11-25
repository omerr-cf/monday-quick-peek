/**
 * DOM Utility Functions
 * Pure functions for DOM manipulation and queries
 */

/**
 * Create an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} props - Element properties (id, className, etc.)
 * @param {string|HTMLElement|Array} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, props = {}, children = null) {
  const element = document.createElement(tag);

  // Set attributes
  Object.entries(props).forEach(([key, value]) => {
    if (key === "className") {
      element.className = value;
    } else if (key === "textContent") {
      element.textContent = value;
    } else if (key === "innerHTML") {
      element.innerHTML = value;
    } else if (key.startsWith("data-")) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });

  // Append children
  if (children) {
    if (Array.isArray(children)) {
      children.forEach((child) => {
        if (typeof child === "string") {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
          element.appendChild(child);
        }
      });
    } else if (typeof children === "string") {
      element.appendChild(document.createTextNode(children));
    } else if (children instanceof HTMLElement) {
      element.appendChild(children);
    }
  }

  return element;
}

/**
 * Query selector with fallback
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Context element (default: document)
 * @returns {HTMLElement|null} Found element or null
 */
export function querySelector(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Query selector all with fallback
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Context element (default: document)
 * @returns {NodeList} Found elements
 */
export function querySelectorAll(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * Get element position relative to viewport
 * @param {HTMLElement} element - Element to get position for
 * @returns {Object} Position object with x, y, width, height
 */
export function getElementPosition(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
