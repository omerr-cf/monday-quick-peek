/**
 * Mock Data for Monday Quick Peek Extension Testing
 *
 * Provides realistic Monday.com API responses and task data
 * for testing various scenarios including edge cases.
 */

/**
 * Generate a date string relative to now
 * @param {number} hoursAgo - Hours ago from now
 * @returns {string} ISO date string
 */
function getDateString(hoursAgo = 0) {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
}

/**
 * Mock tasks with various structures and edge cases
 */
export const mockTasks = {
  /**
   * Normal task with multiple notes
   * Tests: Basic functionality, multiple authors, timestamps
   */
  normalTask: {
    id: "123456789",
    name: "Implement user authentication",
    updates: [
      {
        id: "1",
        body: "Started working on OAuth integration. We'll be using Google OAuth 2.0 for authentication.",
        created_at: getDateString(48), // 2 days ago
        creator: {
          name: "Sarah Kim",
          photo_thumb: "https://via.placeholder.com/32",
        },
      },
      {
        id: "2",
        body: "Completed JWT token setup. Tokens are now being generated and validated correctly.",
        created_at: getDateString(24), // 1 day ago
        creator: {
          name: "Mike Chen",
          photo_thumb: "https://via.placeholder.com/32",
        },
      },
      {
        id: "3",
        body: "Added refresh token functionality. Users can now refresh their tokens without re-authenticating.",
        created_at: getDateString(12), // 12 hours ago
        creator: {
          name: "Emma Wilson",
          photo_thumb: "https://via.placeholder.com/32",
        },
      },
    ],
  },

  /**
   * Task with no notes
   * Tests: Empty state handling, "No notes available" message
   */
  emptyTask: {
    id: "987654321",
    name: "Task with no notes",
    updates: [],
  },

  /**
   * Task with very long notes
   * Tests: Text truncation, scrolling, performance with large content
   */
  longNotesTask: {
    id: "555555555",
    name: "Task with very long notes",
    updates: [
      {
        id: "4",
        body:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
            50
          ) +
          "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(
            30
          ) +
          "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        created_at: getDateString(6),
        creator: {
          name: "Alex Rodriguez",
          photo_thumb: "https://via.placeholder.com/32",
        },
      },
    ],
  },

  /**
   * Task with special characters in notes
   * Tests: HTML escaping, XSS prevention, special character handling
   */
  specialCharsTask: {
    id: "111222333",
    name: "Task with special characters & symbols",
    updates: [
      {
        id: "5",
        body:
          "Note with special chars: <script>alert('xss')</script> & symbols: @#$%^&*() " +
          "Also includes: <b>HTML</b> tags and 'quotes' & \"double quotes\"",
        created_at: getDateString(3),
        creator: {
          name: "David Park",
          photo_thumb: "https://via.placeholder.com/32",
        },
      },
    ],
  },

  /**
   * Task with many notes (stress test)
   * Tests: Performance with many items, scrolling, search performance
   */
  manyNotesTask: {
    id: "999888777",
    name: "Task with many notes",
    updates: Array.from({ length: 25 }, (_, i) => ({
      id: `note-${i + 1}`,
      body: `This is note number ${
        i + 1
      }. It contains some content for testing purposes.`,
      created_at: getDateString(24 - i), // Spread over 24 hours
      creator: {
        name: i % 2 === 0 ? "Sarah Kim" : "Mike Chen",
        photo_thumb: "https://via.placeholder.com/32",
      },
    })),
  },

  /**
   * Task with mentions (@username)
   * Tests: Mention highlighting, mention parsing
   */
  mentionsTask: {
    id: "444555666",
    name: "Task with @mentions",
    updates: [
      {
        id: "6",
        body: "Hey @Sarah Kim, can you review this? Also @Mike Chen, your input would be helpful.",
        created_at: getDateString(1),
        creator: {
          name: "Emma Wilson",
          photo_thumb: "https://via.placeholder.com/32",
        },
      },
    ],
  },

  /**
   * Task with markdown-like content
   * Tests: Markdown rendering, formatting preservation
   */
  markdownTask: {
    id: "777888999",
    name: "Task with formatted content",
    updates: [
      {
        id: "7",
        body:
          "**Bold text** and *italic text*\n\n" +
          "Code: `const x = 5;`\n\n" +
          "Link: [Monday.com](https://monday.com)\n\n" +
          "List:\n- Item 1\n- Item 2\n- Item 3",
        created_at: getDateString(5),
        creator: {
          name: "Alex Rodriguez",
          photo_thumb: "https://via.placeholder.com/32",
        },
      },
    ],
  },

  /**
   * Task with recent notes (just now, minutes ago)
   * Tests: Relative time formatting, "just now" display
   */
  recentNotesTask: {
    id: "333444555",
    name: "Task with recent activity",
    updates: [
      {
        id: "8",
        body: "Just updated this task",
        created_at: getDateString(0.1), // 6 minutes ago
        creator: {
          name: "Sarah Kim",
          photo_thumb: "https://via.placeholder.com/32",
        },
      },
      {
        id: "9",
        body: "Another recent update",
        created_at: getDateString(0.05), // 3 minutes ago
        creator: {
          name: "Mike Chen",
          photo_thumb: "https://via.placeholder.com/32",
        },
      },
    ],
  },

  /**
   * Task with missing creator info
   * Tests: Fallback handling, missing data scenarios
   */
  missingDataTask: {
    id: "666777888",
    name: "Task with missing data",
    updates: [
      {
        id: "10",
        body: "Note from deleted user",
        created_at: getDateString(10),
        creator: null, // Missing creator
      },
      {
        id: "11",
        body: "Note with missing photo",
        created_at: getDateString(8),
        creator: {
          name: "Unknown User",
          photo_thumb: null, // Missing photo
        },
      },
    ],
  },
};

/**
 * Mock API responses for various scenarios
 */
export const mockAPIResponses = {
  /**
   * Successful API response
   * Tests: Normal API flow, data parsing
   */
  success: {
    data: {
      items: [mockTasks.normalTask],
    },
    errors: null,
  },

  /**
   * Successful response with multiple items
   */
  successMultiple: {
    data: {
      items: [mockTasks.normalTask, mockTasks.emptyTask],
    },
    errors: null,
  },

  /**
   * Invalid API key response
   * Tests: Error handling, authentication errors
   */
  invalidApiKey: {
    errors: [
      {
        message: "Invalid authentication token",
        extensions: {
          code: "InvalidTokenException",
        },
      },
    ],
    data: null,
  },

  /**
   * Rate limited response
   * Tests: Rate limiting handling, retry logic
   */
  rateLimited: {
    errors: [
      {
        message: "Rate limit exceeded. Please try again later.",
        extensions: {
          code: "ComplexityException",
        },
      },
    ],
    data: null,
  },

  /**
   * Task not found response
   * Tests: 404 handling, not found errors
   */
  taskNotFound: {
    errors: [
      {
        message: "Item not found",
        extensions: {
          code: "NotFound",
        },
      },
    ],
    data: {
      items: [],
    },
  },

  /**
   * Network error simulation
   * Tests: Network error handling, offline scenarios
   */
  networkError: {
    error: "Failed to fetch",
    type: "network",
  },

  /**
   * Server error (500)
   * Tests: Server error handling, Monday.com downtime
   */
  serverError: {
    errors: [
      {
        message: "Internal server error",
        extensions: {
          code: "InternalServerError",
        },
      },
    ],
    data: null,
  },

  /**
   * Empty response
   * Tests: Empty data handling
   */
  emptyResponse: {
    data: {
      items: [],
    },
    errors: null,
  },

  /**
   * Malformed response
   * Tests: Invalid JSON handling, parsing errors
   */
  malformedResponse: {
    invalid: "json",
    // Missing expected structure
  },
};

/**
 * Formatted mock data (as returned by background.js)
 * This matches the format that content.js expects
 */
export const formattedMockData = {
  normalTask: {
    taskId: mockTasks.normalTask.id,
    taskName: mockTasks.normalTask.name,
    notes: mockTasks.normalTask.updates.map((update) => ({
      id: update.id,
      content: update.body,
      author: update.creator?.name || "Unknown",
      authorPhoto: update.creator?.photo_thumb || null,
      createdAt: update.created_at,
      createdAtRelative: formatRelativeTime(update.created_at),
    })),
  },
  emptyTask: {
    taskId: mockTasks.emptyTask.id,
    taskName: mockTasks.emptyTask.name,
    notes: [],
  },
};

/**
 * Helper function to format relative time (matches background.js)
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
  const date = new Date(timestamp);
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
 * Get a random mock task
 * @returns {Object} Random mock task
 */
export function getRandomMockTask() {
  const tasks = Object.values(mockTasks);
  return tasks[Math.floor(Math.random() * tasks.length)];
}

/**
 * Get mock task by scenario name
 * @param {string} scenario - Scenario name (e.g., 'normalTask', 'emptyTask')
 * @returns {Object} Mock task or null
 */
export function getMockTaskByScenario(scenario) {
  return mockTasks[scenario] || null;
}

/**
 * Create a custom mock task
 * @param {Object} config - Task configuration
 * @returns {Object} Custom mock task
 */
export function createCustomMockTask(config) {
  return {
    id: config.id || String(Math.floor(Math.random() * 1000000000)),
    name: config.name || "Custom Task",
    updates: config.updates || [],
  };
}
