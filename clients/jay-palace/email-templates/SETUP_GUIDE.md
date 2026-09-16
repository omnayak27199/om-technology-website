# EmailJS Template Setup Guide — Hotel Jay Palace

## Step 1: Create EmailJS Account

1. Go to https://www.emailjs.com and sign up (free — 200 emails/month)
2. Dashboard → **Email Services** → Add New Service → choose **Gmail**
3. Connect `thehoteljaypalace@gmail.com`
4. Note your **Service ID** (e.g. `service_abc123`)

---

## Step 2: Create the 4 Templates

Go to **Email Templates** → Create New Template for each one below.

---

### Template 1: `template_confirmation`
**Subject:** `Booking Request Received — {{booking_id}} | Hotel Jay Palace`
**Content:** Paste the HTML from `template_confirmation.html`

---

### Template 2: `template_receipt`
**Subject:** `Payment Confirmed ✓ — Booking {{booking_id}} | Hotel Jay Palace`
**Content:** Paste the HTML from `template_receipt.html`

---

### Template 3: `template_checkin`
**Subject:** `Welcome! You're Checked In — {{room_name}} | Hotel Jay Palace`
**Content:** Paste the HTML from `template_checkin.html`

---

### Template 4: `template_checkout`
**Subject:** `Thank You for Your Stay — Invoice {{booking_id}} | Hotel Jay Palace`
**Content:** Paste the HTML from `template_checkout.html`

---

## Step 3: Fill in config.js

Open `clients/jay-palace/js/config.js` and fill in:

```js
window.EMAILJS = {
  publicKey:            'YOUR_PUBLIC_KEY',       // Account → API Keys
  serviceId:            'service_XXXXXXX',       // from Step 1
  confirmationTemplate: 'template_confirmation',
  receiptTemplate:      'template_receipt',
  checkinTemplate:      'template_checkin',
  checkoutTemplate:     'template_checkout',
}
```

---

## Variables Used (EmailJS auto-fills these from the JS code)

| Variable          | Description                          |
|-------------------|--------------------------------------|
| `{{to_name}}`     | Guest full name                      |
| `{{to_email}}`    | Guest email address (To field)       |
| `{{booking_id}}`  | Booking code (e.g. JP-A1B2C3)       |
| `{{room_name}}`   | Room type booked                     |
| `{{check_in}}`    | Check-in date + time                 |
| `{{check_out}}`   | Check-out date + time                |
| `{{nights}}`      | Number of nights                     |
| `{{guests}}`      | Number of guests                     |
| `{{total_amount}}`| Total amount (e.g. Rs.2,500)        |
| `{{payment_method}}`| Payment method used               |
| `{{payment_status}}`| Current status label              |
| `{{special_req}}` | Special requests (confirmation only) |
| `{{hotel_phone}}` | +91 75877 80043                      |
| `{{hotel_email}}` | thehoteljaypalace@gmail.com          |
| `{{hotel_address}}`| Full hotel address                  |

---

## Important: Set "To Email" in EmailJS

In each template's settings, set the **To Email** field to: `{{to_email}}`
Leave **From Name** as: `Hotel Jay Palace`
Leave **Reply To** as: `thehoteljaypalace@gmail.com`
