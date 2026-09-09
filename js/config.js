/**
 * OM Technology - Central Configuration
 *
 * All site-wide settings live here.
 * Edit this file to update pricing, contact details, social links, or feature flags.
 *
 * Future: When a backend is ready, this object can be bootstrapped from
 * GET /api/v1/config  and cached in localStorage with a short TTL.
 */

const CONFIG = {

  /* ── Company ─────────────────────────────────────────────── */
  COMPANY_NAME : "OM Technology",
  TAGLINE      : "Web • Apps • Software • Digital Solutions",

  /* ── Contact ─────────────────────────────────────────────── */
  WHATSAPP_NUMBER  : "919340039411",          // E.164, no +
  WHATSAPP_DISPLAY : "+91 93400 39411",       // Human-readable
  EMAIL            : "omtechnology.pvt.ltd@gmail.com",
  WEBSITE          : "https://omtechnology.online",
  LOCATION         : "Saraipali, Chhattisgarh",
  SERVICE_AREAS    : ["Saraipali", "Basna", "Bhawarnpur", "Pithora"],

  /* ── Payment ─────────────────────────────────────────────── */
  // Leave empty until a payment gateway is configured.
  // NEVER put secret keys here — only public/client-side keys.
  PAYMENT_LINK       : "",
  PAYMENT_PUBLIC_KEY : "",   // e.g. Razorpay key_id (safe to expose)

  /* ── Pricing (INR) ───────────────────────────────────────── */
  PRICING : {
    basic : {
      id      : "basic",
      label   : "Basic Website",
      amount  : 5000,
      suffix  : null,
      display : "₹5,000",
      note    : "Domain & hosting charged separately",
      popular : false,
      features : [
        "Up to 5 pages",
        "Mobile responsive design",
        "WhatsApp integration",
        "Contact form",
        "Google Maps",
        "Social media links",
        "Basic SEO",
        "SSL certificate",
        "Website deployment",
        "Basic customization"
      ],
      cta : "Get Basic Website",
      whatsappMessage :
        "Hello OM Technology,\n\nI am interested in the Basic Website package (₹5,000).\n\nPlease share more details.\n\nThank you."
    },

    business : {
      id      : "business",
      label   : "Business Website",
      amount  : 10000,
      suffix  : null,
      display : "₹10,000",
      note    : "Domain & hosting charged separately",
      popular : true,
      features : [
        "Up to 8–10 pages",
        "Professional UI design",
        "Mobile responsive design",
        "WhatsApp integration",
        "Contact form",
        "Google Maps",
        "Social media integration",
        "Basic SEO",
        "Photo gallery",
        "Business sections",
        "Website deployment"
      ],
      cta : "Get Business Website",
      whatsappMessage :
        "Hello OM Technology,\n\nI am interested in the Business Website package (₹10,000).\n\nPlease share more details.\n\nThank you."
    },

    professional : {
      id      : "professional",
      label   : "Professional Website",
      amount  : 15000,
      suffix  : null,
      display : "₹15,000",
      note    : "Domain & hosting charged separately",
      popular : false,
      features : [
        "Up to 15 pages",
        "Premium UI design",
        "Advanced sections",
        "WhatsApp integration",
        "Multiple contact forms",
        "Photo gallery",
        "SEO optimization",
        "Google Maps",
        "Social integrations",
        "Google Analytics",
        "Performance optimization",
        "Website deployment"
      ],
      cta : "Get Professional Website",
      whatsappMessage :
        "Hello OM Technology,\n\nI am interested in the Professional Website package (₹15,000).\n\nPlease share more details.\n\nThank you."
    },

    ecommerce : {
      id      : "ecommerce",
      label   : "E-Commerce",
      amount  : 25000,
      suffix  : "+",
      display : "₹25,000+",
      note    : "Price depends on requirements",
      popular : false,
      features : [
        "Product catalog",
        "Product detail pages",
        "Shopping cart",
        "Checkout process",
        "Payment integration",
        "Order management",
        "Customer accounts",
        "Responsive design",
        "Admin functionality",
        "Inventory management"
      ],
      cta : "Request E-Commerce",
      whatsappMessage :
        "Hello OM Technology,\n\nI am interested in an E-Commerce website (starting ₹25,000+).\n\nPlease share more details about your e-commerce packages.\n\nThank you."
    },

    custom : {
      id      : "custom",
      label   : "Custom Application",
      amount  : null,
      suffix  : null,
      display : "Let’s Discuss",
      note    : "Price based on requirements",
      popular : false,
      features : [
        "CRM systems",
        "ERP solutions",
        "Booking systems",
        "Hospital management",
        "School management",
        "Inventory systems",
        "Billing software",
        "Business dashboards",
        "Custom SaaS applications",
        "API integrations"
      ],
      cta : "Request Consultation",
      whatsappMessage :
        "Hello OM Technology,\n\nI am interested in a Custom Application / Software development.\n\nPlease share more details and arrange a consultation.\n\nThank you."
    }
  },

  /* ── Add-ons (INR) ───────────────────────────────────────── */
  ADDONS : [
    {
      id          : "additional_page",
      label       : "Additional Page",
      display     : "₹500 / page",
      description : "Add extra pages beyond your base package"
    },
    {
      id          : "logo_design",
      label       : "Logo Design",
      display     : "₹1,000+",
      description : "Professional logo for your brand"
    },
    {
      id          : "content_writing",
      label       : "Content Writing",
      display     : "₹1,000+",
      description : "Professional website copy and content"
    },
    {
      id          : "maintenance",
      label       : "Annual Maintenance",
      display     : "₹2,000+ / year",
      description : "Updates, maintenance and ongoing support"
    },
    {
      id          : "ecommerce_upgrade",
      label       : "E-Commerce Upgrade",
      display     : "₹25,000+",
      description : "Add a full online store to your website"
    },
    {
      id          : "custom_functionality",
      label       : "Custom Functionality",
      display     : "Get Quote",
      description : "Bespoke features and third-party integrations"
    }
  ],

  /* ── Social (update with real URLs) ─────────────────────── */
  SOCIAL : {
    instagram : "#",   // https://instagram.com/omtechnology
    facebook  : "#",   // https://facebook.com/omtechnology
    linkedin  : "#",   // https://linkedin.com/company/omtechnology
    twitter   : "#"    // https://twitter.com/omtechnology
  },

  /* ── SEO / Meta ─────────────────────────────────────────── */
  META : {
    title       : "OM Technology | Website, Web Apps & Software Development",
    description : "OM Technology builds professional websites, e-commerce stores, web applications and custom software solutions for businesses. Websites starting from ₹5,000.",
    canonical   : "https://omtechnology.online",
    ogImage     : "https://omtechnology.online/assets/images/og-image.jpg"
  },

  /* ── Feature Flags ───────────────────────────────────────── */
  // Flip these to true as each system is built and deployed.
  FEATURES : {
    payments_enabled   : false,   // Razorpay / PhonePe / PayU
    customer_portal    : false,   // /customer/dashboard
    admin_dashboard    : false,   // /admin
    live_chat          : false,
    blog               : false,
    testimonials_live  : false    // Show testimonials section when real ones exist
  }

};

Object.freeze(CONFIG);
Object.freeze(CONFIG.PRICING);
Object.freeze(CONFIG.SOCIAL);
Object.freeze(CONFIG.META);
Object.freeze(CONFIG.FEATURES);
