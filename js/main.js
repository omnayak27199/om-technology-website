/**
 * OM Technology - Main JavaScript
 *
 * Handles: sticky header, mobile nav, smooth scroll,
 *          enquiry form → WhatsApp, scroll animations.
 *
 * Future integration hooks are documented inline.
 * API_BASE = '/api/v1'  (add when backend ships)
 */
(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════
   * Navigation
   * ═══════════════════════════════════════════════════════════ */
  function initNavigation() {
    var header    = document.getElementById("header");
    var hamburger = document.getElementById("hamburger");
    var navLinks  = document.getElementById("nav-links");
    var overlay   = document.getElementById("nav-overlay");

    if (!header || !hamburger || !navLinks) return;

    function openMenu() {
      navLinks.classList.add("nav-links--open");
      hamburger.classList.add("hamburger--open");
      hamburger.setAttribute("aria-expanded", "true");
      if (overlay) overlay.classList.add("nav-overlay--visible");
      document.body.style.overflow = "hidden";
    }

    function closeMenu() {
      navLinks.classList.remove("nav-links--open");
      hamburger.classList.remove("hamburger--open");
      hamburger.setAttribute("aria-expanded", "false");
      if (overlay) overlay.classList.remove("nav-overlay--visible");
      document.body.style.overflow = "";
      hamburger.focus();
    }

    hamburger.addEventListener("click", function () {
      navLinks.classList.contains("nav-links--open") ? closeMenu() : openMenu();
    });

    if (overlay) overlay.addEventListener("click", closeMenu);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navLinks.classList.contains("nav-links--open")) closeMenu();
    });

    navLinks.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth < 1024) closeMenu();
      });
    });

    /* Sticky shadow */
    window.addEventListener("scroll", function () {
      header.classList.toggle("header--scrolled", window.scrollY > 20);
    }, { passive: true });

    /* Active link highlight */
    var sections = document.querySelectorAll("section[id]");
    var navItems = document.querySelectorAll(".nav-link[href^='#']");

    window.addEventListener("scroll", function () {
      var scrollPos = window.scrollY + 120;
      var current   = "";
      sections.forEach(function (s) {
        if (s.offsetTop <= scrollPos) current = s.id;
      });
      navItems.forEach(function (item) {
        item.classList.toggle(
          "nav-link--active",
          item.getAttribute("href") === "#" + current
        );
      });
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════
   * Smooth Scroll
   * ═══════════════════════════════════════════════════════════ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        var id     = anchor.getAttribute("href").slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        scrollToSection(id);
      });
    });
  }

  function scrollToSection(id) {
    var target = document.getElementById(id);
    if (!target) return;
    var hh  = (document.getElementById("header") || {}).offsetHeight || 80;
    var top = target.getBoundingClientRect().top + window.scrollY - hh - 8;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  window.scrollToSection = scrollToSection;

  /* ═══════════════════════════════════════════════════════════
   * Enquiry Form → WhatsApp
   * ═══════════════════════════════════════════════════════════ */
  function initEnquiryForm() {
    var form = document.getElementById("enquiry-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;

      var get = function (name) {
        var el = form.querySelector("[name='" + name + "']");
        return el ? el.value.trim() : "";
      };

      var data = {
        name         : get("name"),
        business     : get("business"),
        phone        : get("phone"),
        email        : get("email"),
        businessType : get("business_type"),
        packageType  : get("package_type"),
        budget       : get("budget"),
        requirement  : get("requirement")
      };

      /* Future: POST to /api/v1/leads before opening WhatsApp
       *
       * fetch('/api/v1/leads', { method: 'POST', body: JSON.stringify(data) })
       *   .finally(function() { openWhatsApp(getEnquiryMessage(data)); });
       * return;
       */

      openWhatsApp(getEnquiryMessage(data));
    });
  }

  function validateForm(form) {
    /* Clear previous errors */
    form.querySelectorAll(".field-error").forEach(function (el) {
      el.textContent = "";
    });
    form.querySelectorAll(".form-field--error").forEach(function (el) {
      el.classList.remove("form-field--error");
    });

    var MESSAGES = {
      name          : "Please enter your name",
      business      : "Please enter your business name",
      phone         : "Please enter your phone number",
      business_type : "Please select your business type",
      package_type  : "Please select a package"
    };

    var valid = true;

    form.querySelectorAll("[required]").forEach(function (field) {
      if (!field.value.trim()) {
        valid = false;
        var wrap = field.closest(".form-field");
        if (wrap) {
          wrap.classList.add("form-field--error");
          var err = wrap.querySelector(".field-error");
          if (err) err.textContent = MESSAGES[field.name] || "This field is required";
        }
      }
    });

    if (!valid) {
      var first = form.querySelector(".form-field--error input, .form-field--error select, .form-field--error textarea");
      if (first) first.focus();
    }

    return valid;
  }

  /* ═══════════════════════════════════════════════════════════
   * Scroll-triggered Animations (IntersectionObserver)
   * ═══════════════════════════════════════════════════════════ */
  function initAnimations() {
    if (!window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -48px 0px" });

    document.querySelectorAll("[data-animate]").forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ═══════════════════════════════════════════════════════════
   * Industry Cards → WhatsApp
   * ═══════════════════════════════════════════════════════════ */
  function initIndustryCards() {
    document.querySelectorAll("[data-industry]").forEach(function (card) {
      var cta = card.querySelector(".industry-cta");
      if (!cta) return;
      cta.addEventListener("click", function () {
        var industry = card.getAttribute("data-industry");
        openWhatsApp(
          "Hello OM Technology,\n\nI am looking for a website for my " +
          industry + " business.\n\nPlease share your packages for " +
          industry + " businesses.\n\nThank you."
        );
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
   * Portfolio Demo Buttons
   * ═══════════════════════════════════════════════════════════ */
  function initPortfolio() {
    document.querySelectorAll("[data-demo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var link = btn.getAttribute("data-demo");
        if (link && link !== "#") {
          window.open(link, "_blank", "noopener,noreferrer");
        } else {
          openWhatsApp(
            "Hello OM Technology,\n\nI would like to view a demo website.\n\nPlease share the demo link.\n\nThank you."
          );
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
   * Back-to-Top (via footer link)
   * ═══════════════════════════════════════════════════════════ */
  function initBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", function () {
      btn.classList.toggle("btt--visible", window.scrollY > 400);
    }, { passive: true });
  }

  /* ── Page Loader ─────────────────────────────────────────── */
  function initLoader() {
    var loader = document.getElementById("page-loader");
    if (!loader) return;
    function hide() {
      loader.classList.add("hidden");
    }
    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide);
      // Safety fallback — never block UX beyond 3 s
      setTimeout(hide, 3000);
    }
  }

/* ── Sticky CTA Bar (hide when scrolled to top) ──────────── */
  function initStickyCTA() {
    var bar = document.getElementById("sticky-cta-bar");
    if (!bar) return;
    window.addEventListener("scroll", function() {
      bar.classList.toggle("hidden-bar", window.scrollY < 80);
    }, { passive: true });
    bar.classList.add("hidden-bar");
  }

  /* ═══════════════════════════════════════════════════════════
   * Boot
   * ═══════════════════════════════════════════════════════════ */
  function boot() {
    initLoader();
    initNavigation();
    initSmoothScroll();
    initEnquiryForm();
    initAnimations();
    initIndustryCards();
    initPortfolio();
    initBackToTop();
    initStickyCTA();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
