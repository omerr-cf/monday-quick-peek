/**
 * Upgrade UI Module
 *
 * Handles upgrade prompts, banners, and watermarks
 */

(function () {
  "use strict";

  // Dependencies
  const getConfig = () => window.CONFIG || {};
  const getTooltipRenderer = () => window.TooltipRenderer;

  const UpgradeUI = {
    /**
     * Show upgrade prompt when daily limit is reached
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {HTMLElement} row - Task row element
     * @param {Event} event - Mouse event
     * @param {string} message - Message to display
     */
    showPrompt(tooltip, row, event, message) {
      const config = getConfig();
      const tooltipRenderer = getTooltipRenderer();
      const productUrl =
        config.gumroad?.productUrl ||
        "https://busymind.gumroad.com/l/monday-quick-peek-pro";

      tooltip.innerHTML = `
        <div class="upgrade-prompt">
          <div class="upgrade-icon">🚀</div>
          <h3>Upgrade to Pro</h3>
          <p>${tooltipRenderer?.escapeHtml(message) || message}</p>
          <button class="upgrade-btn" onclick="window.open('${productUrl}', '_blank')">
            Upgrade Now - $5/month
          </button>
          <div class="upgrade-features">
            <div class="feature">✅ Unlimited tooltip views</div>
            <div class="feature">✅ Advanced search</div>
            <div class="feature">✅ No watermark</div>
            <div class="feature">✅ Priority support</div>
          </div>
        </div>
      `;
      tooltip.style.display = "block";
      tooltip.classList.add("upgrade-mode");

      // Position tooltip (use TooltipPositioner if available)
      if (window.TooltipPositioner) {
        window.TooltipPositioner.position(tooltip, row, event);
      }

      // Attach click handler for upgrade button
      const upgradeBtn = tooltip.querySelector(".upgrade-btn");
      if (upgradeBtn) {
        upgradeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(productUrl, "_blank");
        });
      }
    },

    /**
     * Add free tier watermark to tooltip
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {number} remaining - Remaining free views
     */
    addWatermark(tooltip, remaining) {
      const config = getConfig();
      const productUrl =
        config.gumroad?.productUrl ||
        "https://busymind.gumroad.com/l/monday-quick-peek-pro";

      // Remove existing watermark if any
      const existingWatermark = tooltip.querySelector(".free-watermark");
      if (existingWatermark) {
        existingWatermark.remove();
      }

      const watermark = document.createElement("div");
      watermark.className = "free-watermark";
      watermark.innerHTML = `
        <div class="watermark-content">
          <span class="watermark-text">⚡ ${remaining} free views left today</span>
          <a href="#" class="watermark-upgrade" data-action="upgrade">Upgrade to Pro</a>
        </div>
      `;

      tooltip.appendChild(watermark);

      // Attach click handler for upgrade link
      const upgradeLink = watermark.querySelector(".watermark-upgrade");
      if (upgradeLink) {
        upgradeLink.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(productUrl, "_blank");
        });
      }
    },

    /**
     * Update free tier watermark with new remaining count
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {number} remaining - Remaining free views
     */
    updateWatermark(tooltip, remaining) {
      const watermark = tooltip.querySelector(".free-watermark");
      if (watermark) {
        const watermarkText = watermark.querySelector(".watermark-text");
        if (watermarkText) {
          watermarkText.textContent = `⚡ ${remaining} free views left today`;
        }
      }
    },

    /**
     * Show upgrade banner at top of page
     * Banner shows for 3 seconds or until user clicks X
     * Will show again on next hover if limit still reached
     * @returns {Promise<void>}
     */
    async showBanner() {
      // Hide any existing tooltip (especially upgrade prompt tooltip)
      // We need to aggressively hide and clean up the upgrade prompt tooltip
      const tooltip = document.getElementById("quick-peek-tooltip");
      if (tooltip) {
        tooltip.style.display = "none";
        tooltip.classList.remove("upgrade-mode");
        tooltip.innerHTML = "";
      }

      if (window.TooltipManager) {
        window.TooltipManager.hide();
      }

      // Don't show banner if user is Pro
      if (window.UsageTracker) {
        const isPro = await window.UsageTracker.isProUser();
        if (isPro) {
          // Hide banner if it exists (user just activated Pro)
          this.hideBanner();
          return;
        }
      }

      // Check if banner already exists - if so, don't recreate it
      const existingBanner = document.getElementById(
        "monday-quick-peek-banner"
      );
      if (existingBanner) {
        return; // Banner already showing, don't recreate
      }

      const config = getConfig();
      const productUrl =
        config.gumroad?.productUrl ||
        "https://busymind.gumroad.com/l/monday-quick-peek-pro";

      // Create banner
      const banner = document.createElement("div");
      banner.id = "monday-quick-peek-banner";
      banner.className = "monday-quick-peek-banner";
      banner.innerHTML = `
        <div class="banner-content">
          <span class="banner-icon">⚡</span>
          <span class="banner-text">Daily limit reached. <a href="#" class="banner-link" data-action="upgrade">Upgrade to Pro</a> for unlimited tooltip views.</span>
          <button class="banner-close" aria-label="Dismiss banner">×</button>
        </div>
      `;

      // Insert at top of body
      document.body.insertBefore(banner, document.body.firstChild);

      // Attach event listeners
      const upgradeLink = banner.querySelector(".banner-link");
      if (upgradeLink) {
        upgradeLink.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(productUrl, "_blank");
        });
      }

      const closeBtn = banner.querySelector(".banner-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.hideBanner();
        });
      }

      // Banner stays visible until user clicks X button (no auto-hide)
    },

    /**
     * Hide upgrade banner
     */
    hideBanner() {
      const banner = document.getElementById("monday-quick-peek-banner");
      if (banner) {
        banner.classList.add("banner-hiding");
        setTimeout(() => {
          if (banner.parentNode) {
            banner.parentNode.removeChild(banner);
          }
        }, 300);
      }
    },

    /**
     * Clear banner dismissal (called when deactivated)
     */
    clearBannerDismissal() {
      if (window.UsageTracker) {
        const today = window.UsageTracker.getToday();
        sessionStorage.removeItem(`bannerDismissed_${today}`);
        // Clear all banner dismissals
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("bannerDismissed_")) {
            sessionStorage.removeItem(key);
          }
        });
      }
    },

    /**
     * Show review prompt modal (after 10 successful hovers)
     */
    showReviewPrompt() {
      // Don't show if already showing
      if (document.getElementById("quick-peek-review-modal")) {
        return;
      }

      const modal = document.createElement("div");
      modal.id = "quick-peek-review-modal";
      modal.className = "review-modal-overlay";
      modal.innerHTML = `
        <div class="review-modal">
          <div class="review-modal-header">
            <span class="review-emoji">⭐</span>
            <h3>Enjoying Quick Peek?</h3>
          </div>
          <p class="review-modal-text">Help others discover it - leave a quick review!</p>
          <div class="review-modal-buttons">
            <button class="review-btn review-btn-primary" data-action="rate">
              ⭐ Rate Now
            </button>
            <button class="review-btn review-btn-secondary" data-action="later">
              Maybe Later
            </button>
            <button class="review-btn review-btn-tertiary" data-action="never">
              Don't Ask Again
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Add animation class after insert
      requestAnimationFrame(() => {
        modal.classList.add("show");
      });

      // Event listeners
      modal
        .querySelector('[data-action="rate"]')
        .addEventListener("click", () => {
          // Open Chrome Web Store review page
          // Get extension ID from chrome.runtime
          const extensionId = chrome.runtime?.id || "your-extension-id";
          window.open(
            `https://chromewebstore.google.com/detail/monday-quick-peek/${extensionId}/reviews`,
            "_blank"
          );
          this.closeReviewPrompt();
          // Mark as rated
          if (window.UsageTracker) {
            window.UsageTracker.setHasRated(true);
          }
        });

      modal
        .querySelector('[data-action="later"]')
        .addEventListener("click", () => {
          this.closeReviewPrompt();
          // Reset hover count so prompt shows again after another 10 hovers
          if (chrome?.storage?.local) {
            chrome.storage.local.set({ totalHoverCount: 0 });
          }
        });

      modal
        .querySelector('[data-action="never"]')
        .addEventListener("click", () => {
          this.closeReviewPrompt();
          // Mark as rated (won't show again)
          if (window.UsageTracker) {
            window.UsageTracker.setHasRated(true);
          }
        });

      // Close on overlay click
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeReviewPrompt();
        }
      });
    },

    /**
     * Close review prompt modal
     */
    closeReviewPrompt() {
      const modal = document.getElementById("quick-peek-review-modal");
      if (modal) {
        modal.classList.remove("show");
        setTimeout(() => {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        }, 300);
      }
    },
  };

  // Export globally
  if (typeof window !== "undefined") {
    window.UpgradeUI = UpgradeUI;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = UpgradeUI;
  }
})();
