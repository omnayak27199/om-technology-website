# OM Technology — Website V1

**Web • Apps • Software • Digital Solutions**

Production-quality static website for OM Technology — a web development company providing websites, e-commerce, web applications, mobile apps and custom software solutions for businesses across India.

---

## Overview

| Item | Detail |
|------|--------|
| Version | V1 — Static |
| Stack | HTML5, CSS3, Vanilla JavaScript |
| Deploy | GitHub Pages / Cloudflare Pages |
| Backend | None (V1) — form submits via WhatsApp |
| Pricing entry point | ₹5,000 (Basic Website) |

---

## Local Development

No build tools, compilers or package managers needed. Open the site directly in a browser:

```bash
# Clone the repository
git clone https://github.com/your-username/om-technology-website.git
cd om-technology-website

# Option 1: Open directly
open index.html

# Option 2: Use a local server (recommended, avoids CORS issues)
# Python
python3 -m http.server 3000
# or Node.js (npx)
npx serve .
# then open http://localhost:3000
```

---

## File Structure

```
om-technology-website/
├── index.html              # Main website (all sections)
├── robots.txt              # Search engine directives
├── sitemap.xml             # XML sitemap for SEO
├── favicon.ico             # Browser tab icon
│
├── assets/
│   ├── images/             # Website images & OG image
│   ├── icons/              # Custom SVG icons
│   └── logos/              # OM Technology logo files
│
├── css/
│   ├── style.css           # Main stylesheet (design system + components)
│   └── responsive.css      # Media queries (mobile-first)
│
├── js/
│   ├── config.js           # ⭐ Central configuration (edit here first)
│   ├── whatsapp.js         # WhatsApp click-to-chat functions
│   ├── faq.js              # FAQ accordion component
│   ├── pricing.js          # Pricing card interactions
│   └── main.js             # Navigation, form, animations
│
├── demos/
│   ├── hotel/              # Hotel demo website
│   ├── restaurant/         # Restaurant demo website
│   ├── gym/                # Gym demo website
│   └── jewellery/          # Jewellery demo website
│
├── legal/
│   ├── privacy-policy.html
│   ├── terms.html
│   └── refund-policy.html
│
└── templates/              # Future: reusable client website templates
```

---

## How to Change Company Information

Edit `js/config.js`:

```javascript
const CONFIG = {
  COMPANY_NAME : "OM Technology",
  TAGLINE      : "Web • Apps • Software • Digital Solutions",
  EMAIL        : "omtechnology.pvt.ltd@gmail.com",   // ← update this
  WEBSITE      : "https://omtechnology.online", // ← update this
  LOCATION     : "India",
  ...
};
```

Also update the following in `index.html` manually:
- The `<title>` tag
- `<meta name="description">`
- `<link rel="canonical">`
- Open Graph `og:url` and `og:image`
- JSON-LD `@id` and `url` fields
- Footer copyright year

---

## How to Change Pricing

Edit `js/config.js` — the `PRICING` object:

```javascript
PRICING : {
  basic : {
    amount  : 5000,        // ← change price here
    display : "₹5,000",   // ← update display string too
    ...
  },
  business : {
    amount  : 10000,
    ...
  }
}
```

Prices are consumed by the `[data-price-key]` attributes in `index.html` and the pricing module in `js/pricing.js`.  
**Never hard-code prices directly in HTML.**

---

## How to Change WhatsApp Number

Edit `js/config.js`:

```javascript
WHATSAPP_NUMBER  : "919340039411",   // E.164 format — country code + number, no +
WHATSAPP_DISPLAY : "+91 93400 39411", // Human-readable display
```

The WhatsApp number is also hard-coded in one place in `index.html` (the footer `<a href>` link). Search for `919340039411` and update accordingly.

---

## How to Change the Payment URL

When a payment gateway (Razorpay, PhonePe, PayU) is configured, edit `js/config.js`:

```javascript
PAYMENT_LINK       : "https://rzp.io/l/your-payment-link", // paste link here
PAYMENT_PUBLIC_KEY : "rzp_live_xxxxxxxxxx",                 // public key only
```

**Never put secret/private payment keys in any frontend file.**

The `handlePayment()` function in `js/whatsapp.js` will automatically open the payment link when `PAYMENT_LINK` is set.

---

## How to Add Portfolio Projects

Edit the portfolio section in `index.html`. Each project follows this structure:

```html
<article class="portfolio-card">
  <div class="portfolio-thumb">
    <!-- Thumbnail: use an <img> tag with actual screenshot -->
    <img src="assets/images/portfolio/client-name.jpg"
         alt="Client Name website screenshot"
         loading="lazy"
         width="480" height="200">
    <!-- Remove the DEMO badge for real projects -->
    <!-- <span class="demo-badge">DEMO</span> -->
  </div>
  <div class="portfolio-body">
    <div class="portfolio-meta">
      <span class="portfolio-industry">Hotel</span>
    </div>
    <h3 class="portfolio-title">Grand Palace Hotel</h3>
    <p class="portfolio-desc">Professional hotel website with room showcase and booking enquiry.</p>
    <button class="btn btn-ghost btn-sm" data-demo="https://clientwebsite.com">
      View Website
    </button>
  </div>
</article>
```

**Important:**
- Demo projects use `<span class="demo-badge">DEMO</span>` — always include this for mockups.
- Real customer projects must use the customer's actual live URL in `data-demo`.
- Never claim demo projects are real customer work.

---

## How to Deploy — GitHub Pages

1. Push the project to a GitHub repository.
2. Go to **Settings → Pages**.
3. Under **Source**, select the `main` branch and `/ (root)` folder.
4. Click **Save**.
5. GitHub will publish the site at `https://your-username.github.io/om-technology-website/`.

For a custom domain, add a `CNAME` file to the repo root:
```
omtechnology.online
```
Then configure your domain's DNS A records to point to GitHub Pages IPs.

---

## How to Deploy — Cloudflare Pages (Recommended)

1. Push the project to GitHub.
2. Log in to [Cloudflare Pages](https://pages.cloudflare.com).
3. Click **Create a project → Connect to Git**.
4. Select your repository.
5. Build settings:
   - **Build command:** *(leave empty — static site)*
   - **Build output directory:** `/` or `./`
6. Click **Save and Deploy**.

Cloudflare Pages gives you:
- Free global CDN
- Automatic HTTPS
- Deploy previews on every pull request
- Easy custom domain connection

---

## How to Connect a Custom Domain

### Cloudflare Pages
1. In Cloudflare Pages → your project → **Custom domains**.
2. Add `omtechnology.online` and `www.omtechnology.online`.
3. Cloudflare automatically provisions an SSL certificate.

### GitHub Pages
1. Add a `CNAME` file to the repo root with your domain.
2. In your domain registrar, add:
   - A records pointing to GitHub Pages IPs.
   - CNAME for `www` pointing to `your-username.github.io`.
3. In GitHub Settings → Pages → enter your custom domain.

---

## Future Architecture Notes

The codebase is structured for easy backend integration:

| Future System | Integration Point |
|---|---|
| Backend API | Replace form `POST` in `main.js` `initEnquiryForm()` |
| Lead CRM | `submitLead(formData)` in `whatsapp.js` (commented hook) |
| Payment gateway | `PAYMENT_LINK` / `PAYMENT_PUBLIC_KEY` in `config.js` |
| Admin dashboard | `/admin/` (reserved in `robots.txt`) |
| Customer portal | `/customer/` (reserved in `robots.txt`) |
| Real testimonials | Flip `FEATURES.testimonials_live` in `config.js` to `true` |
| Blog | Flip `FEATURES.blog` in `config.js` to `true` |

Future database entities to design: `users`, `customers`, `leads`, `projects`, `packages`, `payments`, `domains`, `hosting`, `websites`, `support_tickets`, `invoices`, `notifications`.

---

## SEO Checklist

- [x] `<title>` tag set
- [x] `<meta name="description">` set
- [x] Canonical URL — update `https://omtechnology.online` to live domain
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] JSON-LD structured data (Organization, Service, FAQPage)
- [x] `robots.txt`
- [x] `sitemap.xml` — update `lastmod` dates after major changes
- [ ] Add real `og:image` (1200×630px) at `assets/images/og-image.jpg`
- [ ] Submit sitemap to Google Search Console after deployment
- [ ] Update canonical URLs from `https://omtechnology.online` to actual live domain

---

## Security Notes

- No secret keys, API credentials or payment private keys are stored in this repository.
- `PAYMENT_LINK` and `PAYMENT_PUBLIC_KEY` in `config.js` are safe to commit — only public-facing values.
- WhatsApp integration uses only the public WhatsApp click-to-chat URL (`wa.me/`).
- All external links use `rel="noopener noreferrer"` to prevent tab-napping.
- Form validation is client-side only (expected for V1 static site).

---

## Contacts

| Channel | Detail |
|---|---|
| WhatsApp | +91 93400 39411 |
| Email | omtechnology.pvt.ltd@gmail.com |
| Website | https://omtechnology.online |

---

*OM Technology — Web • Apps • Software • Digital Solutions*
