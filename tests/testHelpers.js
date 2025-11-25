/**
 * Test Helpers for Monday Quick Peek Extension
 *
 * Provides utilities for DOM manipulation, event simulation,
 * and assertion helpers for testing.
 */

/**
 * DOM Manipulation Helpers
 */
export const DOMHelpers = {
  /**
   * Create a mock task row element
   * @param {Object} config - Row configuration
   * @param {string} config.taskId - Task ID
   * @param {string} config.taskName - Task name
   * @param {string} config.className - CSS class name
   * @returns {HTMLElement} Mock row element
   */
  createMockRow(config = {}) {
    const row = document.createElement("div");
    row.className = config.className || "board-row";
    row.dataset.itemId = config.taskId || "123456789";
    row.dataset.id = config.taskId || "123456789";

    const nameElement = document.createElement("div");
    nameElement.className = "board-row-name";
    nameElement.textContent = config.taskName || "Test Task";
    row.appendChild(nameElement);

    return row;
  },

  /**
   * Create a mock tooltip element
   * @param {string} id - Tooltip ID
   * @returns {HTMLElement} Mock tooltip element
   */
  createMockTooltip(id = "quick-peek-tooltip") {
    const tooltip = document.createElement("div");
    tooltip.id = id;
    tooltip.className = "monday-quick-peek-tooltip";
    tooltip.style.display = "none";
    tooltip.style.position = "fixed";
    document.body.appendChild(tooltip);
    return tooltip;
  },

  /**
   * Remove all tooltips from DOM
   */
  cleanupTooltips() {
    const tooltips = document.querySelectorAll(
      "#quick-peek-tooltip, .monday-quick-peek-tooltip"
    );
    tooltips.forEach((tooltip) => tooltip.remove());
  },

  /**
   * Wait for element to appear in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<HTMLElement>} Element promise
   */
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },

  /**
   * Get all notes from tooltip
   * @param {HTMLElement} tooltip - Tooltip element
   * @returns {Array<HTMLElement>} Array of note elements
   */
  getTooltipNotes(tooltip) {
    return Array.from(tooltip.querySelectorAll(".tooltip-note, .note-item"));
  },

  /**
   * Get search input from tooltip
   * @param {HTMLElement} tooltip - Tooltip element
   * @returns {HTMLElement|null} Search input element
   */
  getSearchInput(tooltip) {
    return tooltip.querySelector(".search-input, input[type='text']");
  },

  /**
   * Check if tooltip is visible
   * @param {HTMLElement} tooltip - Tooltip element
   * @returns {boolean} True if visible
   */
  isTooltipVisible(tooltip) {
    return (
      tooltip &&
      tooltip.style.display !== "none" &&
      tooltip.offsetParent !== null
    );
  },
};

/**
 * Event Simulation Helpers
 */
export const EventHelpers = {
  /**
   * Simulate mouse enter event
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Event options
   * @returns {Event} Mouse event
   */
  simulateMouseEnter(element, options = {}) {
    const event = new MouseEvent("mouseenter", {
      bubbles: true,
      cancelable: true,
      clientX: options.clientX || 100,
      clientY: options.clientY || 100,
      ...options,
    });
    element.dispatchEvent(event);
    return event;
  },

  /**
   * Simulate mouse leave event
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Event options
   * @returns {Event} Mouse event
   */
  simulateMouseLeave(element, options = {}) {
    const event = new MouseEvent("mouseleave", {
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
    return event;
  },

  /**
   * Simulate mouse move event
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Event options
   * @returns {Event} Mouse event
   */
  simulateMouseMove(element, options = {}) {
    const event = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: options.clientX || 100,
      clientY: options.clientY || 100,
      ...options,
    });
    element.dispatchEvent(event);
    return event;
  },

  /**
   * Simulate click event
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Event options
   * @returns {Event} Click event
   */
  simulateClick(element, options = {}) {
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
    return event;
  },

  /**
   * Simulate input event (for search)
   * @param {HTMLElement} input - Input element
   * @param {string} value - Input value
   * @returns {Event} Input event
   */
  simulateInput(input, value) {
    input.value = value;
    const event = new Event("input", {
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);
    return event;
  },

  /**
   * Simulate keypress event
   * @param {HTMLElement} element - Target element
   * @param {string} key - Key to press
   * @param {Object} options - Event options
   * @returns {Event} Keyboard event
   */
  simulateKeyPress(element, key, options = {}) {
    const event = new KeyboardEvent("keypress", {
      bubbles: true,
      cancelable: true,
      key: key,
      code: key,
      ...options,
    });
    element.dispatchEvent(event);
    return event;
  },

  /**
   * Wait for event to be fired
   * @param {HTMLElement} element - Target element
   * @param {string} eventName - Event name
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Event>} Event promise
   */
  waitForEvent(element, eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const handler = (event) => {
        element.removeEventListener(eventName, handler);
        resolve(event);
      };
      element.addEventListener(eventName, handler);

      setTimeout(() => {
        element.removeEventListener(eventName, handler);
        reject(new Error(`Event ${eventName} not fired within ${timeout}ms`));
      }, timeout);
    });
  },
};

/**
 * Assertion Helpers
 */
export const AssertHelpers = {
  /**
   * Assert that element exists
   * @param {HTMLElement|null} element - Element to check
   * @param {string} message - Error message
   * @throws {Error} If element doesn't exist
   */
  assertElementExists(element, message = "Element should exist") {
    if (!element) {
      throw new Error(message);
    }
  },

  /**
   * Assert that element is visible
   * @param {HTMLElement} element - Element to check
   * @param {string} message - Error message
   * @throws {Error} If element is not visible
   */
  assertElementVisible(element, message = "Element should be visible") {
    if (
      !element ||
      element.style.display === "none" ||
      element.offsetParent === null
    ) {
      throw new Error(message);
    }
  },

  /**
   * Assert that element contains text
   * @param {HTMLElement} element - Element to check
   * @param {string} text - Text to find
   * @param {string} message - Error message
   * @throws {Error} If text not found
   */
  assertElementContainsText(element, text, message = null) {
    if (!element || !element.textContent.includes(text)) {
      throw new Error(message || `Element should contain text "${text}"`);
    }
  },

  /**
   * Assert that element has class
   * @param {HTMLElement} element - Element to check
   * @param {string} className - Class name
   * @param {string} message - Error message
   * @throws {Error} If class not found
   */
  assertElementHasClass(element, className, message = null) {
    if (!element || !element.classList.contains(className)) {
      throw new Error(message || `Element should have class "${className}"`);
    }
  },

  /**
   * Assert that arrays are equal
   * @param {Array} actual - Actual array
   * @param {Array} expected - Expected array
   * @param {string} message - Error message
   * @throws {Error} If arrays don't match
   */
  assertArraysEqual(actual, expected, message = null) {
    if (
      !Array.isArray(actual) ||
      !Array.isArray(expected) ||
      actual.length !== expected.length
    ) {
      throw new Error(
        message ||
          `Arrays should be equal. Expected length ${expected.length}, got ${actual.length}`
      );
    }

    for (let i = 0; i < expected.length; i++) {
      if (actual[i] !== expected[i]) {
        throw new Error(
          message ||
            `Arrays differ at index ${i}. Expected "${expected[i]}", got "${actual[i]}"`
        );
      }
    }
  },

  /**
   * Assert that value equals expected
   * @param {*} actual - Actual value
   * @param {*} expected - Expected value
   * @param {string} message - Error message
   * @throws {Error} If values don't match
   */
  assertEqual(actual, expected, message = null) {
    if (actual !== expected) {
      throw new Error(message || `Expected "${expected}", got "${actual}"`);
    }
  },

  /**
   * Assert that condition is true
   * @param {boolean} condition - Condition to check
   * @param {string} message - Error message
   * @throws {Error} If condition is false
   */
  assertTrue(condition, message = "Condition should be true") {
    if (!condition) {
      throw new Error(message);
    }
  },
};

/**
 * Chrome API Mock Helpers
 */
export const ChromeAPIMock = {
  /**
   * Mock chrome.storage.sync
   */
  mockStorageSync: {
    storage: {},
    get: function (keys, callback) {
      const result = {};
      const keysArray = Array.isArray(keys)
        ? keys
        : keys
        ? [keys]
        : Object.keys(this.storage);
      keysArray.forEach((key) => {
        if (this.storage[key] !== undefined) {
          result[key] = this.storage[key];
        }
      });
      if (callback) {
        callback(result);
      }
      return Promise.resolve(result);
    },
    set: function (items, callback) {
      Object.assign(this.storage, items);
      if (callback) {
        callback();
      }
      return Promise.resolve();
    },
    remove: function (keys, callback) {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach((key) => delete this.storage[key]);
      if (callback) {
        callback();
      }
      return Promise.resolve();
    },
    clear: function (callback) {
      this.storage = {};
      if (callback) {
        callback();
      }
      return Promise.resolve();
    },
  },

  /**
   * Mock chrome.runtime.sendMessage
   */
  mockSendMessage: function (message, callback) {
    // Default mock response
    const mockResponse = {
      success: true,
      data: {
        taskId: "123456789",
        taskName: "Test Task",
        notes: [],
      },
    };

    if (callback) {
      setTimeout(() => callback(mockResponse), 100);
    }
    return Promise.resolve(mockResponse);
  },

  /**
   * Setup Chrome API mocks
   */
  setup() {
    if (typeof chrome !== "undefined") {
      chrome.storage = chrome.storage || {};
      chrome.storage.sync = this.mockStorageSync;
      chrome.runtime = chrome.runtime || {};
      chrome.runtime.sendMessage = this.mockSendMessage;
    }
  },

  /**
   * Cleanup Chrome API mocks
   */
  cleanup() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      this.mockStorageSync.storage = {};
    }
  },
};

/**
 * Test Utilities
 */
export const TestUtils = {
  /**
   * Wait for a specified time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>} Promise that resolves after delay
   */
  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Run test with timeout
   * @param {Function} testFn - Test function
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>} Test promise
   */
  async runWithTimeout(testFn, timeout = 10000) {
    return Promise.race([
      testFn(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Test timed out after ${timeout}ms`)),
          timeout
        )
      ),
    ]);
  },

  /**
   * Create a test environment
   * @returns {Object} Test environment object
   */
  createTestEnvironment() {
    // Cleanup existing tooltips
    DOMHelpers.cleanupTooltips();

    // Setup Chrome API mocks
    ChromeAPIMock.setup();

    // Create test container
    const container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);

    return {
      container,
      cleanup: () => {
        DOMHelpers.cleanupTooltips();
        container.remove();
        ChromeAPIMock.cleanup();
      },
    };
  },
};

// Export all helpers
export default {
  DOMHelpers,
  EventHelpers,
  AssertHelpers,
  ChromeAPIMock,
  TestUtils,
};
