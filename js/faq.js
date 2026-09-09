/**
 * OM Technology - FAQ Accordion
 *
 * Accessible accordion with ARIA expand/collapse.
 * Reads .faq-item > .faq-question + .faq-answer pairs.
 */
(function () {
  "use strict";

  function initFAQ() {
    var items = document.querySelectorAll(".faq-item");
    if (!items.length) return;

    items.forEach(function (item, idx) {
      var btn    = item.querySelector(".faq-question");
      var answer = item.querySelector(".faq-answer");
      if (!btn || !answer) return;

      var btnId    = "faq-btn-"    + idx;
      var answerId = "faq-answer-" + idx;

      btn.setAttribute("id",            btnId);
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", answerId);

      answer.setAttribute("id",               answerId);
      answer.setAttribute("role",             "region");
      answer.setAttribute("aria-labelledby",  btnId);
      answer.style.maxHeight = "0";
      answer.style.overflow  = "hidden";

      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";

        /* Close every other item */
        items.forEach(function (other) {
          var ob = other.querySelector(".faq-question");
          var oa = other.querySelector(".faq-answer");
          if (ob && oa && other !== item) {
            ob.setAttribute("aria-expanded", "false");
            other.classList.remove("faq-item--open");
            oa.style.maxHeight = "0";
          }
        });

        /* Toggle this item */
        if (open) {
          btn.setAttribute("aria-expanded", "false");
          item.classList.remove("faq-item--open");
          answer.style.maxHeight = "0";
        } else {
          btn.setAttribute("aria-expanded", "true");
          item.classList.add("faq-item--open");
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });

      btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          btn.click();
        }
        /* Arrow navigation between FAQ buttons */
        if (e.key === "ArrowDown") {
          e.preventDefault();
          var next = items[idx + 1];
          if (next) next.querySelector(".faq-question").focus();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          var prev = items[idx - 1];
          if (prev) prev.querySelector(".faq-question").focus();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFAQ);
  } else {
    initFAQ();
  }
})();
