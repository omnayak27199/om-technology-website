/**
 * OM Technology - Pricing Module
 *
 * Populates pricing UI from CONFIG.PRICING so prices are never hard-coded in HTML.
 *
 * Future: replace CONFIG.PRICING with a fetch() call:
 *   GET /api/v1/packages  →  same shape as CONFIG.PRICING
 */
(function () {
  "use strict";

  function formatPrice(amount, suffix) {
    if (!amount) return "Let’s Discuss";
    return "₹" + Number(amount).toLocaleString("en-IN") + (suffix || "");
  }

  function initPricing() {
    /* Inject prices wherever data-price-key attribute is found */
    document.querySelectorAll("[data-price-key]").forEach(function (el) {
      var key = el.getAttribute("data-price-key");
      var pkg = CONFIG.PRICING[key];
      if (pkg) el.textContent = formatPrice(pkg.amount, pkg.suffix);
    });

    /* Wire up package CTA buttons */
    document.querySelectorAll("[data-package]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openWhatsAppPackage(btn.getAttribute("data-package"));
      });
    });

    /* Badge "Most Popular" on the popular card */
    var popularCard = document.querySelector(".pricing-card--popular");
    if (popularCard && !popularCard.querySelector(".popular-badge")) {
      var badge = document.createElement("div");
      badge.className = "popular-badge";
      badge.textContent = "Most Popular";
      popularCard.insertBefore(badge, popularCard.firstChild);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPricing);
  } else {
    initPricing();
  }
})();
