/**
 * GraphQL Query Builders for Monday.com API
 */

(function () {
  "use strict";

  const GraphQLQueries = {
    /**
     * Build GraphQL query to fetch task notes and updates
     * @param {string} taskId - Task/Item ID
     * @returns {string} GraphQL query
     */
    buildFetchNotesQuery(taskId) {
      return `
        query {
          items(ids: [${taskId}]) {
            id
            name
            updates {
              id
              body
              created_at
              creator {
                name
                photo_thumb
              }
            }
            column_values {
              id
              text
              type
            }
          }
        }
      `;
    },

    /**
     * Build GraphQL query for Monday.com API
     * @param {string} itemId - Item ID
     * @param {string} type - Content type
     * @param {string} updateId - Update ID
     * @returns {string} GraphQL query
     */
    buildGraphQLQuery(itemId, type, updateId) {
      if (type === "note") {
        return `
          query {
            items(ids: [${itemId}]) {
              id
              name
              updates {
                id
                body
                created_at
                creator {
                  name
                  photo_thumb
                }
              }
              column_values {
                id
                text
                type
              }
            }
          }
        `;
      } else if (type === "comment" || type === "update") {
        return `
          query {
            items(ids: [${itemId}]) {
              updates(limit: 1, ids: [${updateId}]) {
                id
                body
                text_body
                created_at
                creator {
                  name
                  photo_thumb
                }
              }
            }
          }
        `;
      }

      return "";
    },

    /**
     * Build simple "me" query for API key validation
     * @returns {string} GraphQL query
     */
    buildMeQuery() {
      return "{ me { id name email } }";
    },
  };

  // Export globally (service worker context)
  if (typeof self !== "undefined") {
    self.GraphQLQueries = GraphQLQueries;
  } else if (typeof window !== "undefined") {
    window.GraphQLQueries = GraphQLQueries;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = GraphQLQueries;
  }
})();
