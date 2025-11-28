/**
 * Mutation Observer Manager for Content Script
 *
 * Watches for dynamically loaded task rows on Monday.com
 */

(function () {
  "use strict";

  // Dependencies
  const getState = () => window.QuickPeekState || {};
  const getConfig = () => window.CONFIG || {};

  const MutationObserverManager = {
    /**
     * Set up MutationObserver to watch for dynamically loaded task rows
     * @param {Function} onNewRows - Callback when new rows are detected
     */
    setup(onNewRows) {
      const state = getState();
      const config = getConfig();

      // Disconnect existing observer
      if (state.mutationObserver) {
        state.mutationObserver.disconnect();
      }

      state.mutationObserver = new MutationObserver((mutations) => {
        let shouldReattach = false;

        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if added node is a board row or contains board rows
              const selectors =
                config.selectors?.boardRow || ".pulse-component";
              if (
                node.matches?.(selectors) ||
                node.querySelector?.(selectors)
              ) {
                shouldReattach = true;
              }
            }
          });
        });

        if (shouldReattach && onNewRows) {
          onNewRows();
        }
      });

      // Start observing
      state.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    },

    /**
     * Disconnect the mutation observer
     */
    disconnect() {
      const state = getState();
      if (state.mutationObserver) {
        state.mutationObserver.disconnect();
        state.mutationObserver = null;
      }
    },
  };

  // Export globally
  if (typeof window !== "undefined") {
    window.MutationObserverManager = MutationObserverManager;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = MutationObserverManager;
  }
})();
