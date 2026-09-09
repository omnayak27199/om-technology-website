/**
 * OM Technology - WhatsApp Integration
 *
 * Single source-of-truth for all WhatsApp click-to-chat links.
 * The number is read from CONFIG.WHATSAPP_NUMBER (set in config.js).
 *
 * Future: before opening WhatsApp, POST lead data to /api/v1/leads
 * so every enquiry is captured in the CRM automatically.
 *
 *   submitLead(formData)
 *     .then(() => openWhatsApp(message))
 *     .catch(() => openWhatsApp(message)); // still open even if API fails
 */

/**
 * Open WhatsApp with a pre-filled message.
 * @param {string} [message] - Message text (will be URL-encoded)
 */
function openWhatsApp(message) {
  const number  = CONFIG.WHATSAPP_NUMBER;
  const text    = (message && message.trim()) ? message : getDefaultMessage();
  const encoded = encodeURIComponent(text);
  window.open(
    "https://wa.me/" + number + "?text=" + encoded,
    "_blank",
    "noopener,noreferrer"
  );
}

/**
 * Open WhatsApp with the pre-defined message for a pricing package.
 * @param {string} packageId - Key from CONFIG.PRICING (e.g. "basic")
 */
function openWhatsAppPackage(packageId) {
  var pkg = CONFIG.PRICING[packageId];
  if (!pkg) {
    openWhatsApp(getDefaultMessage());
    return;
  }
  openWhatsApp(pkg.whatsappMessage);
}

/**
 * Build and return a WhatsApp message from enquiry form data.
 * @param {Object} d - Form data fields
 * @returns {string}
 */
function getEnquiryMessage(d) {
  return (
    "Hello OM Technology,\n\n" +
    "I am interested in getting a website.\n\n" +
    "Name: "          + (d.name         || "") + "\n" +
    "Business: "      + (d.business     || "") + "\n" +
    "Business Type: " + (d.businessType || "") + "\n" +
    "Package: "       + (d.packageType  || "") + "\n" +
    "Phone: "         + (d.phone        || "") + "\n" +
    "Budget: "        + (d.budget       || "Not specified") + "\n\n" +
    "Requirement:\n"  + (d.requirement  || "Please contact me to discuss further.") + "\n\n" +
    "Thank you."
  );
}

/**
 * Fallback message for general-purpose WhatsApp buttons.
 * @returns {string}
 */
function getDefaultMessage() {
  return (
    "Hello OM Technology,\n\n" +
    "I am interested in your web development services.\n\n" +
    "Please share more details about your packages and pricing.\n\n" +
    "Thank you."
  );
}

/**
 * WhatsApp Chat Popup Widget
 * Wires up the floating chat bubble with open/close toggle and send button.
 */
function initWhatsAppWidget() {
  var floatBtn  = document.getElementById("wa-float-btn");
  var popup     = document.getElementById("wa-popup");
  var closeBtn  = document.getElementById("wa-popup-close");
  var input     = document.getElementById("wa-input");
  var sendBtn   = document.getElementById("wa-send-btn");

  if (!floatBtn || !popup) return;

  function openPopup() {
    popup.classList.add("wa-popup--open");
    popup.setAttribute("aria-hidden", "false");
    floatBtn.setAttribute("aria-expanded", "true");
    if (input) setTimeout(function() { input.focus(); }, 250);
  }

  function closePopup() {
    popup.classList.remove("wa-popup--open");
    popup.setAttribute("aria-hidden", "true");
    floatBtn.setAttribute("aria-expanded", "false");
    floatBtn.focus();
  }

  function sendMessage() {
    var text = input ? input.value.trim() : "";
    var msg  = text || getDefaultMessage();
    openWhatsApp(msg);
    closePopup();
    if (input) input.value = "";
  }

  floatBtn.addEventListener("click", function() {
    var isOpen = floatBtn.getAttribute("aria-expanded") === "true";
    isOpen ? closePopup() : openPopup();
  });

  if (closeBtn) closeBtn.addEventListener("click", closePopup);

  if (sendBtn)  sendBtn.addEventListener("click", sendMessage);

  if (input) {
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") sendMessage();
    });
  }

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && floatBtn.getAttribute("aria-expanded") === "true") {
      closePopup();
    }
  });

  setTimeout(openPopup, 4000);
}

document.addEventListener("DOMContentLoaded", initWhatsAppWidget);

/**
 * Payment CTA handler.
 * Opens the configured PAYMENT_LINK, or falls back to WhatsApp if none is set.
 * @param {string} [packageId] - Optional package key for the message
 */
function handlePayment(packageId) {
  if (CONFIG.PAYMENT_LINK) {
    window.open(CONFIG.PAYMENT_LINK, "_blank", "noopener,noreferrer");
    return;
  }
  var label = (packageId && CONFIG.PRICING[packageId])
    ? CONFIG.PRICING[packageId].label
    : "website";
  openWhatsApp(
    "Hello OM Technology,\n\n" +
    "I would like to book / pay for my " + label + " project.\n\n" +
    "Please share the payment link.\n\n" +
    "Thank you."
  );
}
