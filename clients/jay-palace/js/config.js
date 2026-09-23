// ============================================================
//  JAY PALACE — Central Configuration
//  TODO: Fill in all values marked with TODO before going live
// ============================================================

// Assigned to window so ES modules (booking.js, admin.js) can read them as globals
window.HOTEL = {
  name:        'Hotel Jay Palace',
  tagline:     "Saraipali's Finest Hotel",
  phone:       '+91 75877 80043',
  whatsapp:    '917587780043',
  email:       'thehoteljaypalace@gmail.com',
  address:     'Main Road, Saraipali, Chhattisgarh 493558',
  mapLink:     'https://maps.app.goo.gl/wbtZpwUweqdRTicHA',
  checkIn:     '12:00 PM',
  checkOut:    '11:00 AM',
  gst:         0,                       // Keep 0 — prices are GST-inclusive (back-calculated in invoice)
  gstRate:     5,                       // GST % included in the displayed price (5% for hotel tariff)
  gstIncluded: true,                    // true = displayed price already includes GST
  gstin:       '22BBHPP6396R1ZQ',       // Hotel GST Identification Number
  upiId:       'HOTELJAYPALACE309@iob',
}

window.ROOMS = [
  {
    id:        'standard',
    name:      'Standard Room',
    price:     1500,                    // TODO: update price (₹ per night)
    emoji:     '🛏️',
    gradient:  'linear-gradient(135deg, #1a3a5c, #0c1b33)',
    desc:      'Comfortable AC room with attached bath, LED TV and free WiFi. Perfect for solo travellers and couples.',
    amenities: ['Air Conditioning', 'LED TV', 'Free WiFi', 'Hot Water', 'Room Service'],
    maxGuests: 2,
    beds:      '1 Double Bed',
  },
  {
    id:        'deluxe',
    name:      'Deluxe Room',
    price:     2500,                    // TODO: update price
    emoji:     '🏨',
    gradient:  'linear-gradient(135deg, #1a1040, #2e1870)',
    desc:      'Spacious deluxe room with king-size bed, premium furnishings, and city view. Ideal for business travellers.',
    amenities: ['Air Conditioning', 'King-Size Bed', 'LCD TV', 'Free WiFi', 'Mini Bar', 'Room Service', 'Balcony'],
    maxGuests: 2,
    beds:      '1 King Bed',
  },
  {
    id:        'family',
    name:      'Family Room',
    price:     3500,                    // TODO: update price
    emoji:     '👨‍👩‍👧‍👦',
    gradient:  'linear-gradient(135deg, #1a2a3a, #2a4a6a)',
    desc:      'Spacious family room with two double beds, extra seating and child-friendly amenities.',
    amenities: ['Air Conditioning', '2 Double Beds', 'LCD TV', 'Free WiFi', 'Mini Fridge', 'Room Service'],
    maxGuests: 4,
    beds:      '2 Double Beds',
  },
  {
    id:        'suite',
    name:      'Executive Suite',
    price:     5000,                    // TODO: update price
    emoji:     '👑',
    gradient:  'linear-gradient(135deg, #2a1800, #5a3a00)',
    desc:      'Luxurious suite with separate living area, premium amenities and panoramic views. The ultimate stay.',
    amenities: ['Air Conditioning', 'King-Size Bed', 'Smart TV', 'Free WiFi', 'Mini Bar', '24/7 Room Service', 'Living Room', 'Premium Bath'],
    maxGuests: 2,
    beds:      '1 King Bed + Sofa',
  },
]

window.AMENITIES = [
  { icon: '🍽️', name: 'Restaurant',      desc: 'Multi-cuisine family dining' },
  { icon: '🎉', name: 'Party Hall',       desc: 'Weddings & celebrations' },
  { icon: '❄️', name: 'AC & Non-AC',     desc: 'Choose your comfort' },
  { icon: '🕐', name: 'Hotel 24×7',      desc: 'Round-the-clock service' },
  { icon: '📶', name: 'Free WiFi',        desc: 'High-speed internet' },
  { icon: '🅿️', name: 'Free Parking',    desc: 'Safe parking on premises' },
  { icon: '🚿', name: 'Hot Water',        desc: '24-hour hot water supply' },
  { icon: '📺', name: 'Cable TV',         desc: 'All rooms with TV' },
]

// ─── Firebase Config ─────────────────────────────────────────
// TODO: Replace with your Firebase project config
// Get from: Firebase Console → Project Settings → Your Apps
window.FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDT1ZotHF6-f3gNsjztIWnFjI1ZULqpG5M',
  authDomain:        'hotel-jay-palace.firebaseapp.com',
  projectId:         'hotel-jay-palace',
  storageBucket:     'hotel-jay-palace.firebasestorage.app',
  messagingSenderId: '705010216944',
  appId:             '1:705010216944:web:287f183f65abd1b183f735',
  measurementId:     'G-1HXYFHW60R',
}

// ─── Razorpay Config ─────────────────────────────────────────
// TODO: Replace with your Razorpay Key ID
// Get from: Razorpay Dashboard → Settings → API Keys
window.RAZORPAY_KEY  = 'rzp_test_XXXXXXXXXXXXXXXX'  // use rzp_live_xxx for production

// ─── Admin Config ────────────────────────────────────────────
// TODO: Create this email/password in Firebase Console → Authentication
window.ADMIN_EMAIL = 'omnayak27199@gmail.com'

// ─── EmailJS Config ──────────────────────────────────────────
// Sends guest emails (confirmation, receipt, check-in, checkout) from the admin panel.
// Free plan: 200 emails/month — no Google verification needed.
//
// Setup steps (one-time, ~10 minutes):
//   1. Sign up at https://www.emailjs.com (free)
//   2. Email Services → Add New Service → Gmail → connect thehoteljaypalace@gmail.com
//      Copy the Service ID (looks like "service_abc1234")
//   3. Email Templates → Create 4 templates (see EMAILJS_SETUP.md for content)
//      Copy each Template ID (looks like "template_abc1234")
//   4. Account → API Keys → copy your Public Key
//   5. Paste all values below and run: firebase deploy --only hosting
//
// TODO: Fill in all values below after completing setup
window.EMAILJS = {
  publicKey:  'YqOr5ZG5kqiKobusi',
  serviceId:  'service_bq58pgv',
  templates: {
    confirmation: 'template_zhfd4j8',
    checkout:     'template_54l0vg7', // TODO: create a separate checkout template in EmailJS and paste its ID here
  },
  reviewUrl: 'https://www.google.com/search?q=hoteljaypalace+saraipali',
  // TODO: Replace reviewUrl with the direct Google Maps review link for better UX:
  // Go to Google Maps → search "Hotel Jay Palace Saraipali" → Share → Copy link
  // Or: https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID
}

// ─── WhatsApp Business Cloud API Config ──────────────────────
// Optional: enables fully automatic (zero-click) WhatsApp messages from admin panel.
// Without this, messages open as wa.me links (admin still needs to tap Send).
// Setup: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
// TODO: Fill after registering a WhatsApp Business account + Meta API token
window.WHATSAPP_API = {
  token:   'YOUR_WHATSAPP_TOKEN',   // Meta → System User Access Token (never expires)
  phoneId: 'YOUR_PHONE_NUMBER_ID',  // WhatsApp → API Setup → Phone Number ID
}
