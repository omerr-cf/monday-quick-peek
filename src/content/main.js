/**
 * Content Script Main Orchestrator for Monday Quick Peek Extension
 *
 * This script orchestrates all content script modules:
 * - StateManager: Shared state management
 * - HoverDetector: Hover event detection
 * - TooltipManager: Tooltip lifecycle
 * - TooltipRenderer: Content formatting
 * - SearchManager: Search functionality
 * - UpgradeUI: Upgrade prompts/banners
 * - ContentAPI: API communication
 * - MutationObserverManager: Dynamic content detection
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    ...(window.CONFIG || {}),
    hoverDelay: 500,
    hideDelay: 400,
    tooltipId: "quick-peek-tooltip",
    tooltipOffset: 20,
    zIndex: 999999,
  };

  // Merge CONFIG into window.CONFIG for modules
  window.CONFIG = { ...window.CONFIG, ...CONFIG };

  // Dependencies (loaded via manifest.json)
  const StateManager = window.StateManager;
  const HoverDetector = window.HoverDetector;
  const TooltipManager = window.TooltipManager;
  const TooltipRenderer = window.TooltipRenderer;
  const SearchManager = window.SearchManager;
  const UpgradeUI = window.UpgradeUI;
  const ContentAPI = window.ContentAPI;
  const MutationObserverManager = window.MutationObserverManager;
  const DOMHelpers = window.DOMHelpers;
  const TooltipPositioner = window.TooltipPositioner;

  // State
  let isInitialized = false;

  /**
   * Initialize the content script
   */
  function init() {
    if (isInitialized) {
      return;
    }

    // Wait for page to be fully loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        initializeExtension();
      });
    } else {
      setTimeout(() => {
        initializeExtension();
      }, 2000);
    }
  }

  /**
   * Initialize extension after page is ready
   */
  function initializeExtension() {
    // Create tooltip element
    TooltipManager.create();

    // Attach hover listeners with retry
    attachHoverListenersWithRetry();

    // Set up MutationObserver for dynamically loaded content
    if (MutationObserverManager) {
      MutationObserverManager.setup(() => {
        attachHoverListeners();
      });
    }

    isInitialized = true;
  }

  /**
   * Attach hover listeners with retry logic
   */
  function attachHoverListenersWithRetry(maxRetries = 5, delay = 1000) {
    if (!HoverDetector) {
      return;
    }

    HoverDetector.attachHoverListenersWithRetry(
      {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onMouseMove: handleMouseMove,
      },
      maxRetries,
      delay
    );
  }

  /**
   * Attach hover listeners (called by MutationObserver)
   */
  function attachHoverListeners() {
    if (!HoverDetector) return;

    HoverDetector.attachHoverListeners({
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onMouseMove: handleMouseMove,
    });
  }

  /**
   * Handle mouse enter event on task row
   */
  function handleMouseEnter(event) {
    const row = event.currentTarget;
    const state = window.QuickPeekState;

    // Clear any existing timeout
    if (StateManager) {
      StateManager.clearHoverTimeouts();
    }

    // Don't show tooltip if already showing for this row
    if (state.currentTarget === row && state.currentTooltip) {
      return;
    }

    state.currentTarget = row;

    // Show tooltip after delay
    const hoverTimeout = setTimeout(() => {
      showTooltip(row, event);
    }, CONFIG.hoverDelay);

    if (StateManager) {
      StateManager.set("hoverTimeout", hoverTimeout);
    }
  }

  /**
   * Handle mouse leave event on task row
   */
  function handleMouseLeave(event) {
    const row = event.currentTarget;
    const state = window.QuickPeekState;

    // Clear hover timeout
    if (StateManager) {
      StateManager.clearHoverTimeouts();
    }

    // Hide tooltip after delay, but only if mouse is not over tooltip
    const hideTimeout = setTimeout(() => {
      if (state.currentTarget === row && !state.isMouseOverTooltip) {
        if (TooltipManager) {
          TooltipManager.hide();
        }
      }
    }, CONFIG.hideDelay);

    if (StateManager) {
      StateManager.set("hideTimeout", hideTimeout);
    }
  }

  /**
   * Handle mouse move event for tooltip positioning
   */
  function handleMouseMove(event) {
    const state = window.QuickPeekState;
    if (state.currentTooltip && state.currentTarget === event.currentTarget) {
      if (TooltipPositioner) {
        TooltipPositioner.position(
          state.currentTooltip,
          event.currentTarget,
          event
        );
      }
    }
  }

  /**
   * Show tooltip with preview content
   */
  async function showTooltip(row, event) {
    const state = window.QuickPeekState;

    // Prevent multiple tooltips
    if (state.currentTooltip) {
      TooltipManager.hide();
    }

    // Get tooltip element
    const tooltip = TooltipManager.getOrCreate();

    // Check if user can view tooltip (usage limits)
    // Wrap in try-catch to prevent errors from blocking tooltip display
    let usageCheck = {
      allowed: true,
      isPro: false,
      remaining: 5,
      showBanner: false,
    };

    if (window.UsageTracker) {
      try {
        usageCheck = await window.UsageTracker.canShowTooltip();
      } catch (error) {
        // Default to allowing tooltip if there's an error
        usageCheck = {
          allowed: true,
          isPro: false,
          remaining: 5,
          showBanner: false,
        };
      }

      // Pro users never see upgrade prompts or banners
      if (usageCheck.isPro) {
        // Store usage info (Pro users don't need watermark)
        tooltip.dataset.isPro = "true";
        // Continue to show tooltip normally
      } else {
        // Free user logic
        // If limit reached and should show banner (after 3 prompts), show banner only
        if (usageCheck.showBanner) {
          // Hide any existing tooltip first
          if (TooltipManager) {
            TooltipManager.hide();
          }
          // Show banner (only once, check if already exists)
          if (UpgradeUI) {
            UpgradeUI.showBanner();
          }
          return; // Don't show tooltip, only banner
        }

        // If limit reached, check upgrade prompt count
        if (!usageCheck.allowed) {
          try {
            // Get current count to determine if we should show prompt or banner
            const currentCount =
              await window.UsageTracker.getUpgradePromptCount();

            // Only show prompt if count is less than 3
            if (currentCount < window.UsageTracker.MAX_UPGRADE_PROMPTS) {
              // Increment count and show prompt
              await window.UsageTracker.incrementUpgradePromptCount();
              if (UpgradeUI) {
                UpgradeUI.showPrompt(tooltip, row, event, usageCheck.message);
              }
              return; // Don't show tooltip, only upgrade prompt
            } else {
              // Count is 3 or more, show banner instead (don't show prompt anymore)
              // Hide any existing tooltip first
              if (TooltipManager) {
                TooltipManager.hide();
              }
              // Show banner (only once, check if already exists)
              if (UpgradeUI) {
                UpgradeUI.showBanner();
              }
              return; // Don't show tooltip, only banner
            }
          } catch (error) {
            // If there's an error, just show the tooltip normally
          }
        }

        // Store usage info for watermark
        tooltip.dataset.usageRemaining = usageCheck.remaining || 10;
        tooltip.dataset.isPro = "false";
      }
    }

    // Get task name
    const taskName = DOMHelpers ? DOMHelpers.getTaskName(row) : "Task";

    // Reset search state
    if (StateManager) {
      StateManager.set("currentSearchTerm", "");
    }

    // Show loading state
    const loadingContent =
      '<div class="tooltip-content"><div style="text-align: center; padding: 40px; color: #676879;">Loading...</div></div>';
    TooltipManager.show(row, event, loadingContent);

    try {
      // Try to fetch real data from API
      const itemId = DOMHelpers ? DOMHelpers.getTaskId(row) : null;
      let notesData = null;

      if (itemId && ContentAPI) {
        // Cancel any previous request
        if (StateManager) {
          StateManager.cancelCurrentRequest();
        }

        // Create new abort controller
        const abortController = new AbortController();
        if (StateManager) {
          StateManager.set("requestAbortController", abortController);
        }

        const response = await ContentAPI.fetchContent(
          itemId,
          "note",
          abortController.signal
        );

        // Check if request was cancelled
        if (abortController.signal.aborted) {
          return;
        }

        if (response && response.success && response.data) {
          notesData = response.data;
        } else if (response && !response.success) {
          throw new Error(response.error || "Failed to fetch content");
        } else {
          // No valid response - hide tooltip silently
          TooltipManager.hide();
          return;
        }
      } else {
        // No itemId or ContentAPI - can't fetch data, hide tooltip
        TooltipManager.hide();
        return;
      }

      // Check if there are any notes
      const notes = notesData?.notes || [];
      if (notes.length === 0) {
        TooltipManager.hide();
        return;
      }

      // Store notes in state for search
      if (StateManager) {
        StateManager.set("currentNotes", notes);
      }

      // Format and display content
      const content = TooltipRenderer
        ? TooltipRenderer.formatContent(taskName, notesData, "")
        : "";

      TooltipManager.updateContent(content);

      // Only add watermark and track usage for FREE users
      const isPro = tooltip.dataset.isPro === "true";

      if (!isPro && window.UsageTracker) {
        const remaining = parseInt(tooltip.dataset.usageRemaining) || 0;

        // Add watermark
        if (UpgradeUI) {
          UpgradeUI.addWatermark(tooltip, remaining);
        }

        // Increment usage counter
        await window.UsageTracker.incrementUsage();
        const newRemaining = remaining - 1;
        if (newRemaining >= 0 && UpgradeUI) {
          UpgradeUI.updateWatermark(tooltip, newRemaining);
        }
      }

      // Track total hovers for review prompt (for all users, including Pro)
      if (window.UsageTracker) {
        const newTotal = await window.UsageTracker.incrementTotalHoverCount();
        // Check if should show review prompt (exactly at threshold)
        if (newTotal === window.UsageTracker.REVIEW_PROMPT_THRESHOLD) {
          const hasRated = await window.UsageTracker.hasUserRated();
          if (!hasRated && UpgradeUI) {
            // Small delay so tooltip is fully visible first
            setTimeout(() => {
              UpgradeUI.showReviewPrompt();
            }, 1500);
          }
        }
      }

      // Position tooltip again after content is loaded
      if (TooltipPositioner) {
        TooltipPositioner.position(tooltip, row, event);
      }

      // Attach search listeners and theme toggle
      setTimeout(() => {
        if (SearchManager) {
          SearchManager.attachListeners(tooltip);
        }

        // Attach theme toggle listener
        const themeToggle = tooltip.querySelector(".theme-toggle");
        if (themeToggle) {
          themeToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            if (tooltip.classList.contains("force-dark")) {
              tooltip.classList.remove("force-dark");
              tooltip.classList.add("force-light");
              themeToggle.textContent = "☀️";
            } else if (tooltip.classList.contains("force-light")) {
              tooltip.classList.remove("force-light");
              themeToggle.textContent = "🌓";
            } else {
              tooltip.classList.add("force-dark");
              themeToggle.textContent = "🌙";
            }
          });
        }
      }, 50);
    } catch (error) {
      // Use error handler to show error UI (no console logging for cleaner output)
      if (window.ErrorHandler) {
        window.ErrorHandler.handle(error, "showTooltip", {
          showUI: true,
          logError: false,
          retry: true,
          retryCallback: () => showTooltip(row, event),
        });
      } else {
        // Fallback error display
        const errorContent = `
          <div class="error-container">
            <div class="error-header">
              <span class="error-icon">⚠️</span>
              <span class="error-title">Error</span>
            </div>
            <div class="error-message">${
              TooltipRenderer
                ? TooltipRenderer.escapeHtml(
                    error.message || "Failed to load content"
                  )
                : error.message || "Failed to load content"
            }</div>
          </div>
        `;
        TooltipManager.updateContent(errorContent);
        tooltip.classList.add("error-state");
      }
    }
  }

  // Initialize when script loads
  init();

  // Re-initialize if page navigates (for SPAs like Monday.com)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      isInitialized = false;
      if (StateManager) {
        StateManager.reset();
      }
      setTimeout(() => {
        init();
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  // Listen for messages from popup (e.g., when license is activated/deactivated)
  if (chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener(
      async (message, sender, sendResponse) => {
        // When Pro license is activated, hide the banner
        if (message.action === "proLicenseActivated") {
          if (UpgradeUI) {
            UpgradeUI.hideBanner();
          }
          // Hide any existing tooltip
          if (TooltipManager) {
            TooltipManager.hide();
          }
          sendResponse({ success: true });
        }

        // When license is deactivated, clear banner dismissal
        if (message.action === "clearBannerDismissal") {
          if (UpgradeUI) {
            UpgradeUI.clearBannerDismissal();

            // Hide any existing tooltip
            if (TooltipManager) {
              TooltipManager.hide();
            }

            // Check if user should see banner (limit reached)
            if (window.UsageTracker) {
              const usageCheck = await window.UsageTracker.canShowTooltip();
              if (usageCheck.showBanner && !usageCheck.isPro) {
                // Show banner immediately after deactivation
                UpgradeUI.showBanner();
              }
            }
          }
          sendResponse({ success: true });
        }
        return true; // Keep channel open for async response
      }
    );
  }
})();
